---
id: l12-feeding-the-past-project-defence
title: "How the portfolio feeds the past-project defense"
minutes: 21
covers:
  - "how the portfolio feeds the past-project presentation round"
---

Think of a science fair. You spend weeks on the project: you run the experiment, keep a notebook, make the poster. Then comes judging day. A judge walks up and asks, "How do you know your thermometer was accurate?" You do not need to prepare a separate answer for that. It is already in your notebook — if you kept a good one. The project and the preparation for the judges are the same work.

This module opened with the same claim about a GNC portfolio, and now that you have seen every piece, it is worth coming back to. Building the portfolio is not separate from preparing for the interview that follows it. It is the same work, done once and used twice.

The interview round in question is the **[[past-project presentation|past-project-round]]**. You submit roughly five project topics. The company picks one. You present it for ten to twenty minutes to a **[[panel|the-panel]]** of five to ten engineers, and then they question you — at length, and mostly about the parts that never made it onto a slide. A later module in this track teaches that round in full. This lesson shows how its raw material comes straight out of what this module has asked you to build.

::: key
How the portfolio connects to the interview: it supplies the five topics you submit for the past-project presentation and the concrete evidence behind every behavioral and technical answer. Building it is preparation for that round, not a separate activity.
:::

A portfolio built to this module's standard does not need a new preparation phase before that round. It needs to be read back with a different question in mind. The rest of this lesson makes the connection concrete: which anchor project fills which talk, why the write-up and the talk are nearly the same document read two ways, and what to do right now with the lessons behind this one.

## Five talk slots, filled by five anchors

The five topics you submit should not all show the same thing. A panel that picks one topic still reads all five, and five topics that show the same skill waste four chances to show range. So the list is built around five **slots**, each answering a different question the panel wants closed:

1. a guidance or optimization project;
2. an estimation or filtering project;
3. a simulation or architecture project;
4. a verification or Monte Carlo project;
5. one project that did not work cleanly.

Now read those slots against this module's anchor projects. Four of the five fill almost by themselves.

::: example Mapping anchor projects to talk slots
**Anchor B, powered-descent guidance**, is the guidance-and-optimization talk outright. The lossless-convexification formulation, the check that every trajectory really met its constraints, and the landing-accuracy Monte Carlo from that lesson are close to a finished outline already.

**Anchor C, the quaternion EKF** (extended Kalman filter, "E-K-F"), is the estimation talk. Its NEES and NIS consistency results are the one plot a panel will ask to see.

**Anchor A, the 6-DOF simulation**, is the simulation-and-architecture talk. Its dispersion campaign is also strong material for the verification-and-Monte-Carlo slot, if anchor D is not used there.

**Anchor D, batch orbit determination**, is a second strong choice for the verification slot. Its condition-number diagnosis is a clean, concrete answer to "how do you know this converged to something trustworthy?": one tracking station gave $\mathrm{cond}(\mathbf H^{\mathsf T}\mathbf H)\approx 6\times10^{18}$ and the fit diverged; four stations gave about $4.3\times10^{5}$ and it converged.

That leaves the fifth slot, the failure talk, open. Count: B, C, A and D fill four slots, and one remains — [[the slot map|slot-map]] shows it. And this module has already written most of that fifth talk for you, as you will see below.
:::

## The write-up and the talk are the same document, read two ways

Earlier in this module you learned a seven-part **write-up**: problem, model, assumptions, verification, validation, results, limitations.

The past-project module builds each **talk** from seven parts too: problem; why it was hard; approach; the key decision and the alternatives you rejected; verification; result; what you would do differently.

Line them up and most of the talk is already written:

- **Problem** becomes the talk's problem — the requirement, with a number in it, in the first minute or so.
- **Model** and **assumptions** become the approach, told around the [[one plot or diagram|carrying-plot]] that carries the talk — the same figure the ninety-second-read rule already put near the top of your README.
- **Verification** and **validation** together answer "how do you know it's right?" That is the question this module has come back to more than any other, because it is the question a panel comes back to more than any other.
- **Results** map straight across to the result.
- **Limitations** become "what you would do differently" — the specific, technical edge of your own work.

Two talk parts have no section of their own in the write-up: *why it was hard* and *the key decision and the alternatives you rejected*. They are not new material, though. The problem statement tells you what made it hard. The decisions you recorded while building — this integrator and not that one, fixed final time rather than free — are what the defensibility checklist and each anchor lesson asked you to write down. The [[side-by-side map|writeup-to-talk]] shows every link.

This is not a coincidence arranged for convenience. Both are the same standard: a claim stated precisely enough that someone else can check it. The write-up states it on paper. The talk states it out loud, under interruption. A write-up built to survive a reviewer reading it cold in ninety seconds is already most of the way to a talk that survives a panel interrupting it in the first two minutes.

::: key
The seven-part write-up (problem, model, assumptions, verification, validation, results, limitations) and the seven-part talk (problem, why it was hard, approach, key decision and rejected alternatives, verification, result, what you would do differently) answer the same questions in the same order: what was required, what was built and assumed, how you know it is right, what happened, and where it stops being trustworthy. A project documented to this module's standard is already most of the way to a rehearsed talk.
:::

::: warning
Do not read the talk straight off the write-up. A README is complete; a fifteen-minute talk cannot be. The talk needs the two parts the write-up leaves implicit — why it was hard, and the decision you made against named alternatives — and those are the parts panels remember. A talk that skips them and spends its minutes touring the code has used the write-up's content without its judgment.
:::

## Your question list is already started

Every anchor-project lesson in this module ended with a section called "What the interviewer asks". Those sections are not decoration. They are the start of the **[[thirty hardest questions|thirty-questions]]** list that the past-project module asks you to write and answer, in full, for the project you present.

For example, the 6-DOF lesson named four questions that recur: why a real atmosphere model rather than an exponential one; how you know the rotational dynamics are correct; what exactly is in the dispersion set and why; and what the pass criterion was, fixed before the campaign ran. Reading back through each anchor lesson with a pen, for each project you plan to present, is a much faster start than beginning the list from a blank page.

## Turning a limitations section into a failure talk

The failure talk is the slot candidates leave empty most often. It feels like a confession. But this module has already produced strong material for it, without calling it that. An honest results section, written the way the write-up lesson asked, already records what did not work on the way to what did.

::: example From a verification result to a failure-talk outline
The quaternion-EKF lesson included a filter deliberately tuned with its process noise cut to one hundredth of the truth. Over a 300-run Monte Carlo, its mean NEES came out at $404.9$, against a [[chi-square acceptance band|chi-square-band]] whose ceiling is $6.398$. How far off is that?

$$
\frac{404.9}{6.398} \approx 63.3
$$

More than sixty times the ceiling — not a borderline miss. (The correctly tuned filter scored $6.067$, inside the band of $5.614$ to $6.398$.)

Read as a failure talk instead of a verification example, the same material falls into place:

- **Requirement.** The filter had to report a covariance that matched its real error — not only be accurate on average — because everything downstream trusts that covariance.
- **What happened.** A first tuning looked fine on a single run's plot, then failed decisively once tested with a real consistency check across many runs.
- **Diagnosis and fix.** The specific test that caught it — NEES and NIS against their chi-square bands, not a vague sense something was off — and the specific correction: process noise set to match the truth model.
- **Limitations.** All of this was checked in simulation. Validating the noise model against real hardware, as the hardware-adjacent lesson describes, is a separate step not yet done.

Nothing here needed new work. It needed reading an existing result with a new question. Not "does this prove the filter is consistent?" but "what does this show about how I behave when a result is [[not clean|negative-result]]?"
:::

## What to do with this, now

Choose three to five anchor projects from this module — the exercises ask for exactly this. For each one, pull three things straight from what you already built:

1. **The opening plot or number** — taken from wherever the ninety-second-read rule already put it in the README.
2. **The question list** — the "What the interviewer asks" section from that project's lesson, as the start of your thirty-questions rehearsal.
3. **A moment of failure** — for at least one project, the point where a first attempt failed a check before a later one passed. That is the seed of the failure talk.

This is not a new phase bolted onto portfolio building. It is the portfolio, read once more, for a different purpose.

::: example A one-page prep sheet for anchor D
A candidate fills in the three items for her orbit-determination project.

- **Opening number.** "Four stations at distinct bearings turn a divergent fit into one converging to $45.5\,\mathrm{m}$ RMS against $50\,\mathrm{m}$ measurement noise." Sanity check: the final residual is a little *below* the noise level, which is what a good fit to $50\,\mathrm{m}$ noise should give — much lower would suggest overfitting, much higher a bad model.
- **First three questions**, from the anchor D lesson: what the condition number told you; why stations at different bearings fixed it, when more data from one station would not; and why "it converged" is weaker than "it converged, and the conditioning was checked."
- **Failure moment.** The single-station geometry: condition number near $6\times10^{18}$, and Gauss-Newton diverging by the second iteration. The fix was not a better solver. It was a better geometry.

Three lines, all copied from work she already did. That page is the skeleton of a talk.
:::

## Check yourself

::: check
Explain why this lesson treats building the portfolio and preparing for the past-project defense as the same work rather than two phases done one after the other.
:::

::: answer
Both rest on the same standard: a specific requirement, a stated model and its assumptions, evidence of correctness beyond "it ran", honest results, and named limitations. The write-up states that in writing; the talk states it out loud, under interruption. A project documented to this module's standard already contains what a talk needs: the opening plot, the numbers, the limitations, and the questions a reviewer is likely to ask. Treating the two as separate phases throws away the fact that writing the project up properly the first time already does most of the defense preparation.
:::

::: check
Map anchor project D (batch orbit determination) to one of the five talk slots, and justify it with a specific piece of evidence from that project's lesson.
:::

::: answer
Anchor D fits the verification-or-Monte-Carlo slot, on the strength of its condition-number diagnosis. With a single station, the normal matrix had a condition number near $6\times10^{18}$ and the fit diverged. With four stations the condition number fell to about $4.3\times10^5$ and Gauss-Newton converged cleanly. That is a concrete, quantified answer to "how do you know this result is trustworthy?" — exactly what the verification slot exists to show — rather than a general description of the least-squares method.
:::

::: check
Which write-up sections combine to answer the talk's "how do you know it's right" moment, and why does that moment come up so often in both formats?
:::

::: answer
The verification and validation sections combine to answer it. Verification shows the code was built correctly against its own specification. Validation shows whether that specification itself matches the real system. Together they become the talk's verification part.

It comes up so often because it is the one question that separates a result that was *checked* from one that was merely *produced*. This module has treated that as the real dividing line between a hobby project and an engineering one. A panel keeps returning to it in conversation for the same reason a write-up is built around it on the page.
:::

::: check
A candidate has a strong results section for their 6-DOF simulation but has never written down any hard questions a panel might ask about it. What is the fastest way to start that list, and why?
:::

::: answer
Reread the 6-DOF anchor lesson and pull from its "What the interviewer asks" section. It already names the questions that recur on this kind of project: why a real atmosphere model; how the rotational dynamics were verified; what is in the dispersion set and why; and what the pass criterion was. That is faster than starting from nothing, because the module has already collected the questions experienced engineers actually ask, instead of leaving the candidate to guess what a stranger might probe.
:::

::: check
Using the quaternion-EKF example, explain why a verification result that includes a deliberately induced failure is better raw material for a failure talk than a project that never had a documented failure at all.
:::

::: answer
A failure talk has to show how you behave when a result is not clean: diagnosing the problem, using a real check instead of intuition, and fixing it for a stated reason. A project with no documented failure has no material for that, however strong its final result.

The overconfident-filter example already has the full arc: a first tuning that looked acceptable, a real statistical test that caught it decisively (mean NEES of $404.9$, over sixty times the band's ceiling of $6.398$), and a specific, justified correction. Turning it into the failure talk's shape needs no new work, because an honest results section produces exactly this kind of material along the way.
:::

## Summary

| Talk slot | Anchor project | What carries the talk |
| --- | --- | --- |
| Guidance / optimization | B — powered-descent guidance | Constraint checks and the landing-accuracy Monte Carlo |
| Estimation / filtering | C — quaternion EKF | NEES and NIS results, nominal versus a deliberately induced fault |
| Simulation / architecture | A — 6-DOF simulation | The verified dynamics, the real atmosphere model and the dispersion campaign |
| Verification / Monte Carlo | D — orbit determination (or A's dispersion campaign) | The condition-number diagnosis and the formal-versus-empirical covariance check |
| Failure | Whichever anchor's write-up already records a first attempt that failed a check | Requirement, what happened, the specific diagnostic test, and the fix |

| Write-up part | Becomes in the talk |
| --- | --- |
| Problem | Problem (and much of why it was hard) |
| Model, assumptions | Approach (and the key decision against named alternatives) |
| Verification, validation | Verification |
| Results | Result |
| Limitations | What you would do differently |

This module is complete: five anchor projects; the write-up structure and verification toolkit that make each one defensible; reproducibility and licensing that make them checkable and legally showable; hardware-adjacent work that closes the gap simulation alone cannot; and, in this lesson, the direct line from all of it to the interview round it was built to survive. The past-project presentation module takes that line the rest of the way — how to structure the talk against the clock, build the slides, and handle the questions.

::: context past-project-round The round this module was built for
At SpaceX, and at some other engineering employers, one interview round asks you to present a project you did before. You submit roughly five topics; the company chooses one — so you do not get to pick your favorite on the day. You then present for ten to twenty minutes and take extended questions.

Because the panel picks, every topic on your list has to be one you could defend for an hour. That is exactly the "few, deep, defensible" standard from the first lesson of this module. The two were designed to fit together.
:::

::: context the-panel Who is in the room
A panel is a group of interviewers who all score you. Here it is typically five to ten engineers from different specialties — perhaps a guidance engineer, a navigation engineer, someone from software, someone from test. Each one listens for their own area.

That has a practical consequence: your opening has to make sense to the least specialized person in the room, because their score counts as much as the specialist's. It is one more reason to open with a requirement and a number, the way your README already does.
:::

::: context slot-map Four anchors, five slots
Each slot evidences a different skill. Four fill directly from anchors; the fifth is built from a moment one of them went wrong.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <g font-size="11" fill="#1f2a44">
    <rect x="10" y="10" width="140" height="26" rx="4" fill="#8fb8f0" stroke="#1d6fd1"/>
    <text x="80" y="27" text-anchor="middle">B powered descent</text>
    <rect x="10" y="44" width="140" height="26" rx="4" fill="#8fb8f0" stroke="#1d6fd1"/>
    <text x="80" y="61" text-anchor="middle">C quaternion EKF</text>
    <rect x="10" y="78" width="140" height="26" rx="4" fill="#8fb8f0" stroke="#1d6fd1"/>
    <text x="80" y="95" text-anchor="middle">A 6-DOF simulation</text>
    <rect x="10" y="112" width="140" height="26" rx="4" fill="#8fb8f0" stroke="#1d6fd1"/>
    <text x="80" y="129" text-anchor="middle">D orbit determination</text>
    <rect x="10" y="146" width="140" height="26" rx="4" fill="#fff" stroke="#b4232c"/>
    <text x="80" y="163" text-anchor="middle">a check that failed first</text>
    <rect x="210" y="10" width="140" height="26" rx="4" fill="#fff" stroke="#1f2a44"/>
    <text x="280" y="27" text-anchor="middle">guidance / optimization</text>
    <rect x="210" y="44" width="140" height="26" rx="4" fill="#fff" stroke="#1f2a44"/>
    <text x="280" y="61" text-anchor="middle">estimation / filtering</text>
    <rect x="210" y="78" width="140" height="26" rx="4" fill="#fff" stroke="#1f2a44"/>
    <text x="280" y="95" text-anchor="middle">simulation / architecture</text>
    <rect x="210" y="112" width="140" height="26" rx="4" fill="#fff" stroke="#1f2a44"/>
    <text x="280" y="129" text-anchor="middle">verification / Monte Carlo</text>
    <rect x="210" y="146" width="140" height="26" rx="4" fill="#f2b880" stroke="#1f2a44"/>
    <text x="280" y="163" text-anchor="middle">did not work cleanly</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="150" y1="23" x2="210" y2="23"/><line x1="150" y1="57" x2="210" y2="57"/>
    <line x1="150" y1="91" x2="210" y2="91"/><line x1="150" y1="125" x2="210" y2="125"/>
    <line x1="150" y1="159" x2="210" y2="159"/>
  </g>
  <line x1="150" y1="98" x2="210" y2="120" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
</svg>
```

The dashed line is anchor A's dispersion campaign, the backup choice for the verification slot.
:::

::: context carrying-plot One picture that holds the talk up
A "carrying" plot or diagram is the single figure the whole argument leans on — for anchor D, residual error against iteration number, with the one-station fit diverging and the four-station fit settling near the noise level. The past-project module spends a whole lesson on it, and on slides whose headline is a claim and whose body is the evidence for that claim. If your README already opens with this figure, you have already made the most important slide.
:::

::: context writeup-to-talk Seven parts on paper, seven out loud
Solid lines show where a write-up section becomes a talk part directly. Dashed lines show where it partly supplies one of the two parts the write-up leaves implicit.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 206" font-family="Inter, Arial, sans-serif">
  <text x="70" y="18" font-size="12" text-anchor="middle" fill="#1d6fd1" font-weight="700">write-up</text>
  <text x="290" y="18" font-size="12" text-anchor="middle" fill="#b4232c" font-weight="700">talk</text>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <rect x="10" y="27" width="120" height="18" fill="#8fb8f0"/><text x="70" y="40">problem</text>
    <rect x="10" y="49" width="120" height="18" fill="#8fb8f0"/><text x="70" y="62">model</text>
    <rect x="10" y="71" width="120" height="18" fill="#8fb8f0"/><text x="70" y="84">assumptions</text>
    <rect x="10" y="93" width="120" height="18" fill="#8fb8f0"/><text x="70" y="106">verification</text>
    <rect x="10" y="115" width="120" height="18" fill="#8fb8f0"/><text x="70" y="128">validation</text>
    <rect x="10" y="137" width="120" height="18" fill="#8fb8f0"/><text x="70" y="150">results</text>
    <rect x="10" y="159" width="120" height="18" fill="#8fb8f0"/><text x="70" y="172">limitations</text>
    <rect x="230" y="27" width="120" height="18" fill="#f2b880"/><text x="290" y="40">problem</text>
    <rect x="230" y="49" width="120" height="18" fill="#f2b880"/><text x="290" y="62">why it was hard</text>
    <rect x="230" y="71" width="120" height="18" fill="#f2b880"/><text x="290" y="84">approach</text>
    <rect x="230" y="93" width="120" height="18" fill="#f2b880"/><text x="290" y="106">key decision</text>
    <rect x="230" y="115" width="120" height="18" fill="#f2b880"/><text x="290" y="128">verification</text>
    <rect x="230" y="137" width="120" height="18" fill="#f2b880"/><text x="290" y="150">result</text>
    <rect x="230" y="159" width="120" height="18" fill="#f2b880"/><text x="290" y="172">do differently</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1.3">
    <line x1="130" y1="36" x2="230" y2="36"/>
    <line x1="130" y1="58" x2="230" y2="80"/>
    <line x1="130" y1="80" x2="230" y2="80"/>
    <line x1="130" y1="102" x2="230" y2="124"/>
    <line x1="130" y1="124" x2="230" y2="124"/>
    <line x1="130" y1="146" x2="230" y2="146"/>
    <line x1="130" y1="168" x2="230" y2="168"/>
  </g>
  <g stroke="#6c7a93" stroke-width="1.3" stroke-dasharray="4 3">
    <line x1="130" y1="36" x2="230" y2="58"/>
    <line x1="130" y1="80" x2="230" y2="102"/>
  </g>
  <text x="180" y="198" font-size="11" text-anchor="middle" fill="#6c7a93">solid: becomes · dashed: partly supplies</text>
</svg>
```
:::

::: context thirty-questions The list that should make you uncomfortable
The past-project module has an exercise: write the thirty hardest questions a panel of GNC engineers could ask about the project you will present. At least five must attack whether your approach is valid at all, and at least three must be about what *you* personally did. Write a two-sentence answer to each, and mark which ones need a backup slide. The module's own test for success is that the list makes you uncomfortable. The "What the interviewer asks" sections in this module give you the first handful for free.
:::

::: context chi-square-band What "inside the band" means
If a filter is honest about its own uncertainty, its average NEES over many runs should land close to the number of states it estimates — here $6$. Chance alone moves it around a little, and the chi-square distribution says how much. For $6$ states and $300$ runs, $95\%$ of honest filters land between $5.614$ and $6.398$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <rect x="66.1" y="36" width="132.3" height="24" fill="#8fb8f0"/>
  <line x1="30" y1="60" x2="310" y2="60" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="46.9" y1="60" x2="46.9" y2="66"/><line x1="131.2" y1="60" x2="131.2" y2="66"/>
    <line x1="215.6" y1="60" x2="215.6" y2="66"/><line x1="300" y1="60" x2="300" y2="66"/>
  </g>
  <g font-size="11" text-anchor="middle" fill="#1f2a44">
    <text x="46.9" y="80">5.5</text><text x="131.2" y="80">6.0</text>
    <text x="215.6" y="80">6.5</text><text x="300" y="80">7.0</text>
  </g>
  <text x="132" y="28" font-size="11" text-anchor="middle" fill="#1d6fd1">band 5.614 to 6.398</text>
  <circle cx="142.6" cy="48" r="5" fill="#1f2a44"/>
  <text x="142.6" y="100" font-size="11" text-anchor="middle" fill="#1f2a44">tuned: 6.067</text>
  <line x1="312" y1="48" x2="340" y2="48" stroke="#b4232c" stroke-width="2"/>
  <polygon points="350,48 340,43 340,53" fill="#b4232c"/>
  <text x="318" y="28" font-size="11" text-anchor="middle" fill="#b4232c">404.9, far off</text>
</svg>
```

The tuned filter sits inside; the overconfident one is off the chart.
:::

::: context negative-result Why panels want to hear about failure
Most real engineering projects hit at least one result that is not clean: a method that fails in the regime you needed, a campaign that runs out of time. Engineers who have worked on flight programs know this, so a candidate whose every story is a clean success sounds either lucky or selective. A failure talk shows the thing they most need to see — that when a result is wrong, you find out with a real test, say so plainly, and fix it for a stated reason. The past-project module gives this talk a lesson of its own.
:::
