---
id: l01-the-whiteboard-standard
title: "The whiteboard round and its standard"
minutes: 22
covers:
  - the standard interviewers describe: state assumptions fast, work through the math without drift, sanity check at the end
  - why candidates who ramble or stall lose this round even when they know the material
  - thinking aloud as an explicitly evaluated skill
---

Think about a driving test. The examiner does not only care whether you reach the end of the street. They watch *how* you get there: do you check your mirrors, signal before you turn, stop fully at the stop sign? A driver who arrives safely without once checking a mirror still fails: nothing shows the arrival was more than luck.

This round of a job interview works the same way. It is usually called the **[[whiteboard round|whiteboard-round]]** — you stand at a whiteboard, marker in hand, and build an answer in front of one or two engineers. The earlier rounds had a floor under them: your own work in the phone screens, and in the domain round hard questions whose answers are written down somewhere. This round removes that floor on purpose. You get a problem you have never seen, and there is a fair chance the interviewer has no exact answer either.

*Estimate the power a Starlink satellite radiates. Why is the sky blue? How much does this room weigh? Derive the equations of motion for a rocket over a flat Earth, starting from Newton.* Answers like these have to be built in front of someone, out of physics you already have, in twenty minutes, standing up.

So what is graded is the building, not the number. This module states the standard interviewers describe: **state assumptions fast, work through the math without drift, sanity check at the end**. It also states the failure that is reported: candidates who ramble or stall lose the round, even when they know the material perfectly well. In most technical tests, knowing the material is enough. Here the delivery *is* the test, because the problem was picked so that nobody can settle it by already knowing it.

## What the round looks like

A room, a whiteboard, one or two engineers, thirty to forty-five minutes. The problem arrives in one sentence, often left vague on purpose. The interviewer hands you a marker and sits down: the board is now yours, and so is the silence.

The problems come in three shapes, and this module works all three:

- **A derivation from first principles.** A **derivation** builds a formula step by step from laws you already trust, instead of recalling it. Here that means variable-mass mechanics, the rocket equation, the powered-flight equations of motion, and the spinning motion of a rocket whose engine swivels. Lessons 2 to 7.
- **An estimate with no data.** A **[[Fermi problem|fermi-name]]** — an estimate built by breaking a big unknown into small pieces you can guess. Power budgets, propellant masses, how many of something are overhead right now. Lessons 8 to 10.
- **A physics puzzle.** A situation you have to turn into a model before you can compute anything. Lesson 11.

Two more rounds sit beside these: a coding round and a systems and architecture round. They are graded on the same thing — visible reasoning — which is why they live in this module. Lessons 12 and 13 cover them.

## The standard, unpacked

Each of the three parts of the standard says more than it seems to.

**State assumptions fast.** An **assumption** is something you decide to treat as true so you can get started — "the room is a box", "ignore air resistance". Everyone states them eventually, usually after four minutes of hedging. The word doing the work is *fast*. The first assumption belongs on the board inside the first minute, and the full list inside the first three.

Speed is not about looking confident. It makes the rest of the round possible. An interviewer who can see your model can correct it. One who cannot see it has to guess your starting points in their head — and if one was wrong, they find out when you do, at the end.

**Work through the math without drift.** **Drift** means starting a calculation, dropping it halfway, switching symbols, restarting somewhere else, and ending up at something that may or may not answer the question. Drift is not slowness, and it is not a mistake. A clean derivation with one sign error reads far better than a wandering one that happens to land on the right number. You can see drift from across the room: scattered fragments, with arrows appearing between them.

**Sanity check at the end.** A **sanity check** is a quick test of whether an answer could possibly be right. A result without one is a claim; a result with one is an engineering answer. The check is a specific thing you can say out loud — the units, a **[[limiting case|limiting-case]]**, or a comparison against something you already know to the right **[[order of magnitude|order-of-magnitude]]** — and it takes about fifteen seconds. Lesson 7 makes the units check a reflex; lesson 10 does the size check.

::: key
The standard interviewers describe for this round: state assumptions fast, work through the math without drift, sanity check at the end. All three are about the visible process. The problem is chosen so that the answer cannot be recalled, which makes the process the only thing there is to grade.
:::

## Why rambling and stalling lose

The two failures look opposite, but they share one root. The interviewer has half an hour, and afterwards must write down a judgment about how you think. They can only write down what they could follow. Anything else — however correct it was inside your head — does not exist for **[[scoring|interview-scorecard]]**.

**Stalling** gives them nothing to follow. Two minutes of thinking with nothing written and nothing said is the most damaging thing you can do in this round. It is common, because the natural reaction to a strange problem is to hunt for the answer inside your head first — right in a library, wrong here.

**Rambling** gives them too much to follow, with no shape. It often follows a stall, as an overcorrection: every thought the problem sparks comes out — a related project, a warning, a second model, a half-remembered paper. The interviewer cannot tell which thought carries the weight, so none of it can be scored.

The cure for both is a structure, not a personality change: **use the same fixed method on every problem in this round, and say out loud which step you are on.** A method turns one big, open problem into a line of small, closed ones, each of which you can do.

It also gives you something true to say during a silence, which kills the stall: *"I am deciding whether to model this as a surface or a volume."*

::: warning Do not treat the first number you say as a commitment
Candidates stall because they are trying not to say anything wrong. In this round a stated assumption is not a promise. It is a move, and moves can be changed out loud. *"Take the array as ten square meters; I will come back and widen that if the answer looks strange"* costs nothing if it turns out to be five. Refusing to name a number until you are sure costs you the round.
:::

## The method, stated once

Every worked problem in this module uses these six steps, in this order, with the step names said out loud.

1. **Restate and bound.** Say back, in one sentence, what you think you are being asked — including which reading you are taking if the question could mean two things. **Bound** here means fence it in: say what is inside the question and what is not. This is where you ask the one or two clarifying questions that would actually change the answer, and no more.
2. **Declare the model and the assumptions.** Which physics you are using, what you are leaving out, and which numbers you will treat as known. Write them as a list in the top-left corner of the board, and never erase them.
3. **Decompose.** Break the thing you want into pieces you can get at one by one. For a derivation, the pieces are the choice of reference frame, the quantities you track, and the equations. For an estimate, they are factors you multiply, each with a range.
4. **Carry it through with units attached.** Every line of algebra and every number, with its units written beside it.
5. **Sanity check.** Units, a limiting case, and a size comparison against something you know from elsewhere.
6. **State the uncertainty.** Which step is weakest, and how far the answer moves if that step is wrong. One sentence.

Steps 1, 2, 5 and 6 make this round different from homework. They are also cheap: together under three minutes, and most of the score lives there.

::: key
Six steps, the same every time: restate and bound; declare the model and assumptions; decompose; carry it through with units; sanity check; state the uncertainty. Announce the step you are on. The method is what prevents both failure modes — it gives you something to say during a silence and a [[structure that stops the narration sprawling|six-step-pipeline]].
:::

## Thinking aloud is an output, not a courtesy

Thinking aloud is not good manners laid on top of the work. In this round it *is* what the interviewer receives. The previous module taught it on a call with nothing to write on; a whiteboard changes the mechanics, not the principle. Three board habits carry most of it.

**[[Divide the board before you write on it|board-layout]].** Assumptions top-left, working in the middle, results and checks bottom-right. Eight seconds of drawing buys two things: the interviewer always knows what kind of statement they are looking at, and you never lose the assumption list under the algebra.

**Talk while you write, not between writing.** Silent writing followed by explanation takes twice as long. The sentence and the symbol should land together: *"…so the momentum flux term, m-dot times exhaust velocity…"* as you write it.

**Label every silence longer than about ten seconds.** Not with an apology — with what the silence is for. *"Ten seconds, I want to get the sign of this term right."* Then take the ten seconds. A labeled silence reads as careful thought. An unlabeled one reads as a stall. The difference is one sentence.

One more habit matters most when something goes wrong: **narrate reasoning, not anxiety.** *"That term should be an acceleration and it is coming out as a velocity, so I have dropped a divide-by-time somewhere — give me a moment to find it"* is a strong minute. *"Hmm, that does not look right, sorry, I always mess this up"* is the same minute, thrown away.

::: example The first ninety seconds, three ways
The problem: *"Estimate the power a [[Starlink|starlink]] satellite radiates."*

**Stalled.** The candidate writes "Starlink" on the board, underlines it, and goes quiet for ninety seconds, trying to remember whether they ever read a figure for the satellite's power. They have not, and the interviewer has ninety seconds of nothing.

**Rambling.** *"OK so Starlink, these are the low-orbit satellites, I think they are at 550 kilometers, and they use Ku-band for the user links — actually the power depends a lot on which generation, and the newer ones are much bigger, so maybe I should — do you want the radio power or the total? Those are very different. I guess I would start from the solar panels, but I do not know how big they are…"* All true, some of it the right instinct — but nothing is decided and nothing is on the board.

**To standard.** *"Two readings, and they differ by about a factor of ten, so let me pick: the radio-frequency power it transmits, or the total power it gives off as electromagnetic energy, including waste heat? I will do both. The second is easier, and I will use it to bound the first.*

*Assumptions, going on the board now: solar array of order ten square meters, cell efficiency about thirty percent, orbit at five hundred and fifty kilometers, and [[steady state|steady-state]] — averaged over an orbit, the satellite gives off everything it collects, because it is not storing energy anywhere.*

*Decomposition: collected power equals the sunlight power per square meter, times area, times efficiency. Total radiated equals collected. Radio power radiated is that, times the fraction of the power given to the radios, times the amplifier efficiency. Three factors, and I will bound each one."*

Ninety seconds, assumptions and a decomposition on the board, and the interviewer knows exactly what comes next. Lesson 9 works the number.
:::

::: example A two-minute answer, end to end
The problem: *"How much does the air in this room weigh?"* It is a warm-up question, and a fair test of whether the method is a habit or a slogan.

**Restate and bound.** *"The air only, not the room. I will treat the room as a box and the air as at sea-level density."*

**Assumptions.** The room is about $6\,\mathrm{m}$ by $8\,\mathrm{m}$ by $3\,\mathrm{m}$ high. Air **density** — mass per cubic meter, written $\rho$ and read "rho" — is about $1.2\,\mathrm{kg/m^3}$ at room temperature and sea level.

**Decompose.** Mass equals volume times density, $m = V\rho$. Two factors.

**Carry it through.** First the volume: $V = 6 \times 8 \times 3 = 144\,\mathrm{m^3}$. Then multiply by the density: $m = 144 \times 1.2 = 172.8$, about $173\,\mathrm{kg}$.

**Sanity check.** Units: cubic meters times kilograms per cubic meter leaves kilograms, which is a mass. Good. Size: a little more than two adults, floating invisibly in the room. Surprising, but it checks out. Water is roughly a thousand times denser than air (about $1000$ against $1.2\,\mathrm{kg/m^3}$). The room holds very roughly a thousand bathtubs of space, so its air should weigh about one bathtub of water — a couple of hundred kilograms. It does.

**Uncertainty.** *"The density is good to a few percent. The room dimensions are eyeballed, so call the volume good to twenty percent. The answer is $173\,\mathrm{kg}$ plus or minus about a fifth — between about 140 and 210 kilograms."*

Under two minutes, six steps, and every one of them heard.
:::

## What this module does not assume about the process

Everything above comes from the standard this module states and the failure it reports. How any particular company runs the round — how many interviewers, how it is scored — this course does not know, and it says so rather than inventing it.

## Check yourself

::: check
The stated standard has three parts. Which one is most often missing entirely from an otherwise competent answer, and what does leaving it out cost?
:::

::: answer
The sanity check. A candidate who knows the material usually states some assumptions and gets through the algebra — then stops the moment a result appears, because in their head the problem is finished.

Leaving it out can cost an uncaught error — the last chance to notice an answer a thousand times too big. More often it costs the demonstration. The check is the clearest evidence that you treat a result as something to test, not only to produce, and that habit is what the round exists to find. It takes fifteen seconds.
:::

::: check
Why is stalling for ninety seconds worse than stating an assumption you later have to change?
:::

::: answer
Because the interviewer scores what they can follow, and silence has nothing in it to follow. A changed assumption gives them two scoreable things: the first choice shows a model being picked, and the change shows it being tested against a result and corrected.

There is an arithmetic point too. A wrong assumption in a Fermi estimate usually costs a factor of two or three in the final number, which the round tolerates, because the number is not what is graded. Ninety seconds out of a thirty-minute round ($90 \div 1800 = 0.05$) is five percent of your time, spent producing nothing.
:::

::: check
You are asked to estimate the total propellant mass a launch vehicle burns in its first stage. Give the first three sentences of your answer, in the order the method prescribes.
:::

::: answer
1. *Restate and bound:* "Propellant burned by the first stage only, from liftoff to staging, for a medium-lift vehicle — call it something that puts ten to twenty tonnes in low Earth orbit."
2. *Declare the model and assumptions:* "I will work it out from the thrust and the burn time rather than from a quoted mass. Assume a liftoff thrust-to-weight ratio of about 1.3, a liftoff mass of around 500 tonnes, a specific impulse near 300 seconds at sea level, and a first-stage burn of about 160 seconds."
3. *Decompose:* "Propellant mass is mass flow times burn time. Mass flow is thrust divided by the effective exhaust velocity, which is specific impulse times $g_0$. So three numbers: thrust, $I_{sp}$, burn time."

(Specific impulse, $I_{sp}$, and $g_0 = 9.80665\,\mathrm{m/s^2}$ are defined properly in the next lesson.) No arithmetic yet, and the interviewer already knows the model, the inputs and the route.
:::

::: check
During a derivation you realize, four lines in, that you measured your flight path angle from the wrong reference, and every sign from line two onward is wrong. What do you do?
:::

::: answer
Say it, name it precisely, and repair the smallest thing that fixes it.

*"My flight path angle is measured from the local horizontal, but in line two I wrote the gravity component as $g\cos\gamma$, which is what it would be if I had measured from the vertical. That makes it $g\sin\gamma$ in the velocity equation and $g\cos\gamma$ in the flight-path-angle equation. Let me fix line two and carry it down."*

Three things are right about that. It is out loud, so the interviewer sees you catch the error. It is specific, so the repair has limits instead of being a restart. And it does not apologize — a definition error is named as what it is. Silently erasing four lines gives the interviewer nothing and costs you time.
:::

::: check
The method's last step is "state the uncertainty". For the room-air estimate above, which factor dominates it, and how far would the answer move if that factor were at the edge of its range?
:::

::: answer
The volume. Air density in an ordinary room is known to a few percent. The dimensions, paced out by eye, are good to perhaps ten percent each, and three of them multiply, so the volume carries roughly twenty to thirty percent.

At the edges: $5 \times 7 \times 2.7 = 94.5\,\mathrm{m^3}$, which times $1.2$ is about $113\,\mathrm{kg}$. And $7 \times 9 \times 3.3 = 207.9\,\mathrm{m^3}$, about $250\,\mathrm{kg}$. The honest statement is "between about 110 and 250 kilograms, most likely around 170", and the sentence that earns the point is *the dimensions dominate, not the density*.
:::

## Summary

| Item | Statement |
| --- | --- |
| The stated standard | State assumptions fast, work through the math without drift, sanity check at the end |
| Reported failure mode | Rambling or stalling — losing the round despite knowing the material |
| Why both fail | The interviewer can only score what they can follow; one gives nothing, the other gives no structure |
| The six-step method | Restate and bound → declare model and assumptions → decompose → carry through with units → sanity check → state uncertainty |
| Board discipline | Assumptions top-left and never erased; talk while writing; label every silence over ten seconds |
| Narration rule | Narrate reasoning, not anxiety; a revised assumption is a move, not a mistake |
| Air in a room | $m = V\rho$: $144\,\mathrm{m^3}$ at $1.2\,\mathrm{kg/m^3}$ is about $173\,\mathrm{kg}$ |

The next six lessons use steps 2 to 5 of this method on the derivation problems: variable-mass mechanics and the thrust equation, the rocket equation, the planar powered-flight equations, the gravity turn, the rotation of a vehicle with a swiveling engine, and dimensional analysis as the check that runs underneath all of them.

::: context whiteboard-round Why a whiteboard, of all things
A whiteboard is a wall-mounted board you write on with erasable markers. Engineering teams use them all day to sketch ideas together, which is why interviews borrow them: the board shows your thinking to everyone in the room at once, in the order it happened. Some interviews now use a shared online document or drawing tool instead. The medium changes; the standard in this lesson does not. Whatever you write on, the interviewer is watching the same three things.
:::

::: context fermi-name Named after a physicist who estimated on the spot
Enrico Fermi was an Italian-American physicist famous for getting good answers from rough reasoning. At the first atomic bomb test in 1945 he dropped small scraps of paper as the blast wave passed, watched how far they drifted, and estimated the bomb's energy on the spot. His figure was within a factor of about two of the careful measurement made later. Questions answered this way — split into pieces, guess each piece sensibly, multiply — now carry his name. Lesson 8 teaches the method in full.
:::

::: context limiting-case Push a knob to its extreme
A limiting case is what you get when you push one quantity to an extreme — zero, or very large — where you already know what must happen. If your formula for a rocket's speed gain says a rocket with no propellant still speeds up, something is wrong. If your formula for the air in a room gives zero when the room has zero volume, good. Limiting cases work because they are easy to predict without doing the problem, so they catch errors cheaply. You will use them in nearly every lesson of this module.
:::

::: context order-of-magnitude Counting by powers of ten
An order of magnitude is a factor of ten. Two numbers are "the same order of magnitude" if one is less than about ten times the other. A size check asks: did my answer land on the right step of the ladder below? Being off by a factor of two is usually fine for a sanity check. Being off by a factor of a thousand means a mistake.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="60" x2="340" y2="60" stroke="#1f2a44" stroke-width="2"/>
  <g stroke="#1f2a44" stroke-width="2">
    <line x1="40" y1="52" x2="40" y2="68"/><line x1="110" y1="52" x2="110" y2="68"/><line x1="180" y1="52" x2="180" y2="68"/><line x1="250" y1="52" x2="250" y2="68"/><line x1="320" y1="52" x2="320" y2="68"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="86">1 kg</text><text x="110" y="86">10 kg</text><text x="180" y="86">100 kg</text><text x="250" y="86">1000 kg</text><text x="320" y="86">10 000 kg</text>
  </g>
  <circle cx="196" cy="60" r="6" fill="#1d6fd1"/>
  <text x="196" y="36" font-size="12" fill="#1d6fd1" text-anchor="middle">room air, 173 kg</text>
  <text x="180" y="110" font-size="11" fill="#6c7a93" text-anchor="middle">each step to the right is ten times bigger</text>
</svg>
```

On this ladder, $173\,\mathrm{kg}$ sits a little past the $100\,\mathrm{kg}$ mark — the same step as two adults.
:::

::: context interview-scorecard What the interviewer writes down
After each round, interviewers at most large companies write feedback about what they saw, often against a list of qualities the team cares about, and then a group compares notes to decide. The exact form varies and this course does not claim to know any one company's. The useful point is general: the interviewer can only write about moments they witnessed. A brilliant idea you never said out loud leaves no trace in those notes.
:::

::: context six-step-pipeline The six steps as a pipeline
The method is a pipeline: each step hands the next something definite. Four of the six steps (blue) are cheap — under three minutes together — and carry most of the score. The middle two (orange) are the calculation itself.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="8" y="20" width="104" height="40" rx="6" fill="#8fb8f0"/>
    <rect x="128" y="20" width="104" height="40" rx="6" fill="#8fb8f0"/>
    <rect x="248" y="20" width="104" height="40" rx="6" fill="#f2b880"/>
    <rect x="248" y="90" width="104" height="40" rx="6" fill="#f2b880"/>
    <rect x="128" y="90" width="104" height="40" rx="6" fill="#8fb8f0"/>
    <rect x="8" y="90" width="104" height="40" rx="6" fill="#8fb8f0"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="60" y="37">1 Restate</text><text x="60" y="51">and bound</text>
    <text x="180" y="37">2 Model and</text><text x="180" y="51">assumptions</text>
    <text x="300" y="44">3 Decompose</text>
    <text x="300" y="107">4 Carry through</text><text x="300" y="121">with units</text>
    <text x="180" y="114">5 Sanity check</text>
    <text x="60" y="107">6 State the</text><text x="60" y="121">uncertainty</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5" fill="#1f2a44">
    <line x1="112" y1="40" x2="122" y2="40"/><polygon points="128,40 121,36 121,44"/>
    <line x1="232" y1="40" x2="242" y2="40"/><polygon points="248,40 241,36 241,44"/>
    <line x1="300" y1="60" x2="300" y2="84"/><polygon points="300,90 296,83 304,83"/>
    <line x1="248" y1="110" x2="238" y2="110"/><polygon points="232,110 239,106 239,114"/>
    <line x1="128" y1="110" x2="118" y2="110"/><polygon points="112,110 119,106 119,114"/>
  </g>
</svg>
```
:::

::: context board-layout A board with three zones
Draw two lines before you write anything. The assumptions box stays put for the whole round, so you and the interviewer can point back to it at any time.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="10" width="340" height="160" rx="4" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <line x1="110" y1="10" x2="110" y2="170" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="110" y1="120" x2="350" y2="120" stroke="#6c7a93" stroke-width="1.5"/>
  <rect x="11" y="11" width="98" height="158" fill="#8fb8f0" opacity="0.5"/>
  <g font-size="12" fill="#1f2a44">
    <text x="18" y="30" font-weight="700">Assumptions</text>
    <text x="18" y="50">never erased</text>
    <text x="180" y="30" font-weight="700">Working</text>
    <text x="180" y="50">algebra, numbers</text>
    <text x="180" y="66">units on every line</text>
    <text x="180" y="140" font-weight="700" fill="#b4232c">Results and checks</text>
    <text x="180" y="158">units, limits, size</text>
  </g>
</svg>
```
:::

::: context starlink What Starlink is
Starlink is SpaceX's network of internet satellites. Thousands of them circle Earth in low orbit, many at around 550 kilometers up, and beam internet service to small dishes on the ground. Each satellite runs on electricity from its solar array. That makes "how much power does one handle?" a fair interview question: you can reason it out from sunlight, panel area and efficiency without knowing any secret figure.
:::

::: context steady-state The bathtub with the drain open
Picture a bathtub with the tap running and the drain open. If the water level stays the same, then water must be leaving as fast as it comes in. That is a steady state: nothing is building up. A satellite in steady state is the same with energy. Sunlight pours in, and over a full orbit the same amount must pour out as radio waves and heat, or the satellite would keep getting hotter. So "power radiated" equals "power collected", and one easy number gives you the other.
:::
