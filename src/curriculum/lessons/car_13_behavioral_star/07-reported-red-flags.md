---
id: l07-reported-red-flags
title: "The four reported red flags"
minutes: 22
covers:
  - "reported red flags: blaming others, vagueness, inflated contribution, inability to name a real failure"
---

Picture a lamp lying broken on the living-room floor, and four kids who each give a different answer to "what happened?" The first says, "The lamp got knocked over." The second says, "Stuff happened, it was kind of a mess." The third says, "I fixed it all by myself" — when really their mom did most of the gluing. The fourth says, "I never break anything."

Four very different answers, with one thing in common: afterward, you still cannot say who is responsible for what. That shared effect is the idea of this lesson.

This module names four **red flags** — warning signs in a behavioral answer: blaming others, vagueness, inflated contribution, and the inability to name a real failure. It calls them *reported*, and the word matters. They are not quoted from a published **[[rubric|rubric]]**, and this module does not say how any of them is recorded, weighted or discussed after you leave. It does say how they are read: all four, together, as an unwillingness to be **[[accountable|accountable]]** — willing to own what you did and what happened because of it.

## One effect, four ways to cause it

Why do four different behaviors share one heading? The interviewer is trying to leave with a description of what you are responsible for, and each flag wrecks that description in its own way.

- **Blaming** moves the cause of an outcome outside you.
- **Vagueness** removes the detail that would let anyone attach responsibility to anyone.
- **Inflation** attaches responsibility to you that the record does not support.
- **No failure** denies that there is anything you are answerable for at all.

::: key
The reported behavioral red flags are blaming others for a failure; vague answers with no specifics; inflating your contribution on a team project; and being unable to name a genuine failure. All four are read as an unwillingness to be accountable.
:::

Below, we take them one at a time, then build an audit — a checklist you run on recordings of yourself.

## Blaming others, even when you do not mean to

Almost nobody blames on purpose. It sneaks in through grammar and placement.

**The passive voice.** The **[[passive voice|passive-voice]]** is a way of building a sentence that leaves out who did the thing. "The interface was changed without notice." "Mistakes were made." "The schedule slipped." In a story about something that went wrong, a missing doer sounds like one being hidden on purpose.

**The in-fairness clause.** This is a true piece of background, attached to your fault to soften it: "I missed it — though in fairness the documentation was out of date." The background may be accurate. But its job in the sentence is to share the fault out, and the listener hears the job, not the accuracy.

**The last position.** Whatever ends a story is its conclusion. One factual mention of an outside cause in the middle is ordinary; the same sentence at the end becomes the moral. If your failure story's final clause is about someone else, it is a blaming story, whatever came before.

The check is mechanical. Write the story out and, for each sentence, ask whether the **subject** — the person or thing doing the verb — is you. If most sentences in a story about *your own* failure have some other subject, you have told the listener where you put the cause.

## Vagueness, in three kinds

**The abstraction.** "I optimized the data pipeline." "I worked on verification." These name a *category* of work, not the work. They feel safe, because nobody can prove them wrong, and they tell the listener almost nothing.

**The missing number.** Lesson 3 covered this in full. Without a quantity, a baseline to compare against, and a standard, a Result is only an impression.

**The unnamed decision.** A story can be full of technical detail and still have no moment where you chose between two things — concrete steps, no visible judgment. The teller cannot see this one, because it *feels* detailed.

The fix for all three is one ladder, climbed in order: **name the object, name the decision, name the measurement.** "I optimized the pipeline" becomes: "The dispersion campaign was the bottleneck, so I had to decide between running the existing Python code in parallel and rewriting the inner loop in C++. I profiled first — measured where the time went — and found most of it was in the integrator — the part that steps the simulation forward in time — not the setup. So I rewrote that alone."

There is one honest reason to be vague: **[[confidentiality|confidentiality]]**. Work for a previous employer sometimes cannot be named. Then keep the *structure* — the decision, the alternatives, the rule you chose by, the shape of the outcome — hide only the object, and say plainly that you are doing so. This track's past-project module covers where that line sits.

## Inflated contribution

This is a risk for people who took lesson 2 too far. The Action must be told with *I*, not *we*. The honest way is to narrow each claim until it is exactly true. Rewriting the team's work as your own is the other way, and it breaks in a predictable place.

An inflated claim does not fail when you make it. It fails two questions later. A claim you truly own has endless detail behind it: why that approach, what you rejected, what surprised you, what you would change. A borrowed claim runs out almost at once — usually at the question about alternatives. The interviewer notices the gap between your fluency on the rest of the story and your thinness on that one claim.

The trade is lopsided. A modest, precisely credited contribution costs you little. Being caught overstating one costs the believability of everything else.

## Being unable to name a real failure

Lesson 5 covered what a usable failure story contains. Here, the point is how a missing one is read: grouped with blaming and inflation, under accountability — not as a small dodge.

Two cases are worth separating. In the first, the candidate *has* a failure and is protecting it — the **[[disguised strength|disguised-strength]]**, or the failure with a trivial consequence. In the second, she is early enough in her work that nothing has visibly gone wrong yet. That feels honest, but it is usually a failure of searching, not of history.

Small failures count: a skipped check, a result reported with more confidence than it deserved, a week lost because you did not ask a question. The one answer with no defensible version is *I cannot think of one*.

::: warning Two of these flags only show up in a recording
Blaming and vagueness live in grammar, and grammar is the part of a story that changes between the page and your mouth. A clean written answer can come out, under mild pressure, with three outside subjects and a category word where a decision should be. Rereading notes will not catch that. Record yourself answering, play it back, and audit the **[[transcript|transcript]]**.
:::

## The audit

Run this on a transcript of yourself speaking, not on the draft you wrote. Six counts, five minutes.

1. **Plural pronouns in the Action** (*we*, *us*, *our*). Target: near zero, any left deliberate.
2. **Sentences whose subject is not you**, in a story about your own responsibility. A couple is normal. A majority is the blaming flag.
3. **Numbers.** At least one, with a baseline and a standard attached.
4. **Named decisions.** At least one place where you chose between two options and said why.
5. **[[Erasing verbs|erasing-verbs]]** — verbs that hide what you did: *helped*, *involved in*, *worked on*, *supported*, *part of*. Target: zero.
6. **Evaluations with no measurement behind them**: *well*, *a lot better*, *successfully*, *great*. Upgrade each to a measurement, or cut it.

::: example One answer, three flags, diagnosed line by line
The question: *Tell me about a project that did not go smoothly.*

**The answer, as recorded — seven sentences, 128 words:**

"So this was the avionics integration on the club satellite. We were quite far behind by that point, mostly because the hardware arrived late and the previous software lead had left without documenting the interface. I was brought in to help with the estimator side. We got the sensor fusion working reasonably well in the end, and I was involved in most of the debugging. There were some issues with the [[magnetometer|magnetometer]] that took a while to resolve — the calibration data we were given turned out to be wrong. Overall we managed to get it integrated before the deadline and the system performed a lot better than it had been. It was a good learning experience and I think the team did a great job under the circumstances."

**The audit, count by count.**

- Pronouns: four *we*, three *I*. Two of the *I*s are *was brought in to help* and *was involved in* — erasing verbs — and the third is *I think*. No sentence has her doing anything.
- Outside subjects: two sentences carry three outside causes — late hardware, an undocumented interface, wrong calibration data.
- Numbers: zero.
- Named decisions: zero.
- Evaluations with nothing behind them: four — *reasonably well*, *a lot better*, *a good learning experience*, *a great job*.

**Three flags.** Blaming: the outside causes are never balanced by anything she got wrong. Vagueness: *the estimator side*, *most of the debugging*, *some issues* — no decision, no measurement. No failure: asked what did not go smoothly, she describes a project that went fine, considering.

**The repair, same events:**

"The magnetometer calibration on our club satellite was wrong, and I lost about three weeks before I worked out why. I owned the attitude estimator; another member owned the hardware bring-up.

My estimate had a slow yaw drift I could not get rid of. I assumed the problem was my filter, because that was the part I had written — I spent two weeks re-deriving the measurement model and tightening the process noise, and I got nowhere. What I should have done in the first week is the thing I eventually did: take the sensor outside, rotate it through a full circle by hand, and plot the raw magnetometer vector. It traced an ellipse offset from the origin, which is [[hard-iron and soft-iron distortion|hard-soft-iron]], and the calibration numbers we had been handed did not correct for it.

I recalibrated from that data and the drift went away — the yaw error settled from about eight degrees at the end of a run to under one. What I changed permanently is that I now check the raw measurement before I debug the estimator that consumes it, because two weeks of that was me trusting an input I had never looked at."

**What the repair does.** The fault is in the first sentence. The outside cause — the calibration really was wrong — is one factual clause, not the conclusion. A decision and the wrong assumption behind it are named. It closes on a measured outcome (eight degrees down to under one, the big drop a fixed calibration should give) and a change in how she works. The other person appears once, neutrally, by role.
:::

::: example An inflated claim meeting its second follow-up
**Candidate:** "I designed the [[momentum management|momentum-management]] scheme for our cubesat — the wheel desaturation logic using the magnetorquers."

**Interviewer:** "Nice. What set your desaturation threshold?"

**Candidate:** "It was based on the wheel capacity, with some margin for the worst-case disturbance torque."

**Interviewer:** "Which disturbance dominated at your altitude?"

**Candidate:** "I would have to check — [[gravity gradient|gravity-gradient]], I think, or possibly aerodynamic. It was a while ago."

**What just happened.** Nothing dramatic — and the damage is done. The first answer gave a structure, not a specific. The second gave a phrase, not a number. The third hesitated on a question the person who sized the scheme would answer instantly, because finding the dominant torque is what sizing is *about*. The interviewer has not learned that the candidate is ignorant of attitude control — only that this claim is bigger than the work behind it.

**The version that costs nothing:** "I did not design the desaturation scheme — a teammate did. What I did was the momentum budget it was sized against: I computed the worst-case gravity-gradient torque two independent ways, a numerical scan over attitudes and the closed-form bound, and they matched to four figures, which is how we knew the number we were sizing to was not an artifact of one assumed attitude. What surprised me was the ratio between the worst case and a representative case, which is itself sizing information — and it is why I would push for the scan rather than a single assumed attitude next time."

**Why this beats the inflated claim, even unchallenged:** it is precise, defensible to any depth, credits the teammate in passing, and holds a technical judgment only the person who did the work would produce. A narrower true claim, told well, beats a broader one told thinly — and it never has to be defended.
:::

## What is not a red flag

A small result, a modest scope, or saying *I do not know* is not a red flag — this track spends two lessons on doing the last one well, in the screens and past-project modules, because it is a normal, respectable move. A career change, a gap, a self-taught background: none of these is on the list, and the next lesson handles all three.

The list is about accountability, not the size of your history. It asks only that your account of your work be one a listener could check.

## Check yourself

::: check
Why does this module group four different behaviors under one reading — an unwillingness to be accountable — when vagueness and inflation look like opposites?
:::

::: answer
Because they have the same effect. The round is trying to establish what you are responsible for, and each behavior destroys that differently: blaming moves the cause outside you, vagueness removes the detail that would let responsibility be attached to anyone, inflation attaches responsibility to you that the record does not support, and refusing a failure denies there is anything to answer for. Vagueness and inflation are opposite errors about the *size* of a claim, but both leave the account unreliable as a description of your work — the thing the round depends on.
:::

::: check
A candidate's failure story contains exactly one sentence about an outside cause, and it is the last sentence. Why does the position matter?
:::

::: answer
Because the final clause of a story is its conclusion. A factual mention of an outside cause in the middle is ordinary, often needed for the story to make sense. At the end, it tells the listener the failure was mostly circumstances. The fix is not to delete the fact but to move it: state it once where it belongs in time order, and end on your own share and the change you made.
:::

::: check
You are describing work for a previous employer and cannot name the system, the numbers or the application. How do you avoid the vagueness flag?
:::

::: answer
Keep the structure and hide only the object. The decision you faced, the alternatives, the rule you used to choose, the shape of the outcome and what you changed afterward can usually all be said without disclosing anything. For example: "I had to choose between two estimator designs under a fixed computing budget, and the deciding factor was that one of them degraded gracefully when a sensor dropped out." That describes a judgment without describing a product. Say out loud that you are abstracting, and why. An interviewer under the same rules reads that as professional; what they cannot read kindly is vagueness with no reason given.
:::

::: check
Why is an inflated contribution described here as failing two questions later, not at the moment it is made?
:::

::: answer
Because a claim cannot be checked on its face — what separates a true one is the depth of detail behind it. Real ownership comes with an endless supply: the alternatives you rejected, what surprised you, what you would change. A borrowed claim runs out quickly, and it usually runs out at the question about alternatives, because weighing alternatives is something only the person who made the decision did. The signal is the mismatch between her fluency elsewhere and her thinness on one claim — and by then the cost is the believability of the rest of the answer.
:::

::: check
Run the audit on this sentence and say what you would need to repair it: "I worked on the verification side and we managed to get everything checked out successfully before the deadline."
:::

::: answer
Count by count: (1) a plural *we* in what should be Action — fail. (2) Outside subjects — does not really apply; this is not a failure story. (3) No number — fail. (4) No named decision — fail. (5) An erasing verb, *worked on* — fail. (6) Two unsupported evaluations, *everything checked out* and *successfully* — fail. Five of the six counts fail.

To repair it you need: which checks were yours, what each had to show, the pass rule, and what the checks returned. Here is the same event, audited clean: "I wrote the three verification cases the propagator had to pass: an analytic [[two-body orbit|two-body-orbit]] reproduced to one part in ten thousand over ten periods, an energy-conservation check, and a step-size convergence study — the convergence study is the one that found my default step was too coarse above forty kilometers."
:::

::: check
A candidate truly cannot think of a failure with a real consequence, because her work so far is coursework and personal projects. What should she do, and what should she not do?
:::

::: answer
Search harder before deciding her history is empty: a check she skipped, a result she reported with more confidence than it deserved, a week spent on the wrong thing because she did not ask a question, a piece of work someone else had to redo. Small failures with honest consequences are usable, stated at their real size. "The consequence was that I lost the last two weeks of the project and shipped without the validation I had planned" is a real cost. What she should *not* do is answer *I cannot think of one*, which this module groups with blaming and inflation. Nor should she invent a big failure; it collapses under the same follow-ups that catch an inflated success.
:::

## Summary

| Flag | How it shows up | What removes it |
| --- | --- | --- |
| Blaming others | Passive voice; in-fairness clauses; an outside cause in the last sentence | One factual mention, placed in time order; the ending belongs to your share |
| Vagueness | Category words; no number; no decision | Name the object, the decision, the measurement |
| Inflated contribution | A claim that thins out two questions later | Narrow each claim until it is exactly true, and credit the rest |
| No real failure | Disguised strength; trivial consequence; "I cannot think of one" | A small honest failure, stated at its real size |
| All four | Read as an unwillingness to be accountable | An account a listener could check |

Two flags show up only in a recording, because they live in grammar; the six-count audit catches them. The next lesson takes the things that are *not* on this list but feel as though they should be: the theme you have no story for, a gap in your history, a career change, and a self-taught background.

::: context rubric A scoring sheet, written down in advance
A rubric is a scoring guide: a list of what an answer should contain, often with points for each part. Teachers use them to grade essays so that two graders give similar marks. Many companies use something similar for interviews, so that different interviewers judge candidates on the same things. This module does not know what any company's actual rubric says. That is why it calls the red flags *reported* — they come from people describing what interviewers notice, not from a published scoring sheet. The word comes from the Latin for "red": scribes copying medieval books wrote their headings and instructions in red ink.
:::

::: context accountable Where "accountable" comes from
The word is built from *account*, which goes back through old French to a word meaning "to count" or "to reckon up." To be accountable was first to be the person who must give an account — to list, item by item, what you did with the money or goods in your care. The interview meaning is surprisingly close to the old one. An accountable answer is an itemized one: this part was mine, this is what I did, this is what happened because of it. Every red flag in this lesson is a way of handing over an account that cannot be added up.
:::

::: context passive-voice The sentence with the doer missing
In an **active** sentence, the subject does the verb: "I changed the interface." Turn it **passive** and the thing that was acted on moves to the front: "The interface was changed." Now the doer can quietly vanish. You *could* add "by me" at the end, but people almost never do.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="10" y="20" font-size="12" font-weight="700" fill="#1f2a44">Active</text>
  <rect x="10" y="28" width="50" height="30" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="35" y="48" font-size="13" text-anchor="middle" fill="#1f2a44">I</text>
  <rect x="66" y="28" width="80" height="30" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="106" y="48" font-size="13" text-anchor="middle" fill="#1f2a44">changed</text>
  <rect x="152" y="28" width="120" height="30" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="212" y="48" font-size="13" text-anchor="middle" fill="#1f2a44">the interface</text>
  <text x="10" y="84" font-size="12" font-weight="700" fill="#1f2a44">Passive</text>
  <rect x="10" y="92" width="120" height="30" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="70" y="112" font-size="13" text-anchor="middle" fill="#1f2a44">the interface</text>
  <rect x="136" y="92" width="110" height="30" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="191" y="112" font-size="13" text-anchor="middle" fill="#1f2a44">was changed</text>
  <rect x="252" y="92" width="60" height="30" fill="#fff" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="282" y="112" font-size="12" text-anchor="middle" fill="#b4232c">by ?</text>
</svg>
```

The passive voice is not wrong. Scientists use it all the time ("the sample was heated"). It becomes a problem only in a story about blame, where the missing doer is the whole point.
:::

::: context confidentiality Why some work cannot be described
When you join a company you usually sign an agreement not to share its private information. It is often called an **NDA**, said "en-dee-ay," short for non-disclosure agreement. In aerospace there is a second layer: some technical data is export-controlled by law, which in the United States means rules such as ITAR (said "eye-tar"). So a candidate may truly be forbidden to name a system, a number or a customer. Interviewers at these companies live under the same rules. They expect you to protect a former employer's information, and they respect a candidate who does it openly — it tells them you would protect theirs too.
:::

::: context disguised-strength The failure that is secretly a brag
"My biggest weakness is that I care too much." "I failed because I worked too hard." These are **disguised strengths**: a compliment to yourself, dressed up as a confession. Interviewers hear them constantly, and they read them as a refusal to answer the question. The test is simple: does the story contain something you actually got wrong, which a colleague could have watched you get wrong? If the only fault in it is that you were too dedicated, it is not a failure story. It is the fourth red flag, wearing a costume.
:::

::: context transcript Turning your voice into text
A transcript is a written copy of what was said, word for word. Making one is easy now: record yourself on a phone answering a practice question, then run the recording through any speech-to-text tool, or type it out by hand. Typing it yourself is slower but useful, because you hear every *um*, every *we* and every "so basically" as you go. Engineers do the same thing with test data: you do not trust your memory of how a run went, you look at the log. A transcript is the log of your answer.
:::

::: context erasing-verbs Verbs that make you disappear
Compare "I helped with the filter" with "I wrote the filter's measurement update." The first tells the listener only that you were near the filter. You might have written all of it, or fetched coffee for the person who did. *Helped*, *supported*, *was involved in*, *worked on* and *was part of* all do this: they place you in the room without saying what your hands did. That is why the audit calls them erasing verbs. The fix is to replace each one with the verb for the actual job — wrote, derived, tested, measured, chose, fixed.
:::

::: context magnetometer A compass that reports numbers
A magnetometer measures the direction and strength of the magnetic field around it — a compass that outputs numbers instead of pointing a needle. Small satellites use one to sense which way they are facing relative to Earth's magnetic field. Earth's field is weak: at the surface it is roughly 25 to 65 microtesla, and in low orbit it is weaker still. That weakness is why a nearby battery, motor or steel screw can easily spoil the reading, and why calibration matters so much.
:::

::: context hard-soft-iron The circle that should have been there
Spin a perfect magnetometer slowly through a full circle, flat, and the sideways part of its reading traces a circle centered on zero. Real hardware bends that picture in two ways. **Hard iron** — a magnet or magnetized part riding along — adds a fixed field, which slides the whole circle off-center. **Soft iron** — metal that bends the field passing through it — squashes the circle into an ellipse.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="100" x2="320" y2="100" stroke="#6c7a93" stroke-width="1"/>
  <line x1="140" y1="10" x2="140" y2="190" stroke="#6c7a93" stroke-width="1"/>
  <circle cx="140" cy="100" r="60" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <ellipse cx="200" cy="80" rx="85" ry="50" fill="none" stroke="#b4232c" stroke-width="2" stroke-dasharray="6 4"/>
  <circle cx="140" cy="100" r="3" fill="#1f2a44"/>
  <circle cx="200" cy="80" r="3" fill="#b4232c"/>
  <line x1="140" y1="100" x2="197" y2="81" stroke="#b4232c" stroke-width="1.5"/>
  <text x="148" y="118" font-size="11" fill="#1f2a44">zero</text>
  <text x="46" y="170" font-size="12" fill="#1d6fd1">perfect sensor: circle</text>
  <text x="236" y="160" font-size="12" fill="#b4232c">real sensor:</text>
  <text x="236" y="175" font-size="12" fill="#b4232c">shifted ellipse</text>
  <text x="206" y="76" font-size="11" fill="#b4232c">offset</text>
</svg>
```

Calibration measures the offset and the squash, then undoes both so the circle comes back.
:::

::: context momentum-management Emptying a spinning wheel
Many satellites point themselves with **reaction wheels**: heavy wheels inside that spin up one way so the satellite turns the other way. Small outside torques keep pushing the satellite, and the wheels fight back by spinning faster and faster. Eventually a wheel nears its top speed — it is **saturated**, like a sponge that cannot soak up more. **Desaturation**, also called momentum dumping, bleeds that speed off. On a cubesat this is often done with **magnetorquers**: coils of wire that act as electromagnets and push against Earth's magnetic field. Momentum management is the plan for when and how hard to do that.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="130" x2="340" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="130" x2="40" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="30" x2="340" y2="30" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="5 4"/>
  <text x="336" y="24" font-size="11" text-anchor="end" fill="#b4232c">wheel speed limit</text>
  <polyline points="40,120 130,50 150,110 240,50 260,110 330,60" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="50" y="52" font-size="11" fill="#1d6fd1">spins up</text>
  <text x="142" y="124" font-size="11" fill="#1f2a44">dump</text>
  <text x="252" y="124" font-size="11" fill="#1f2a44">dump</text>
  <text x="190" y="148" font-size="12" text-anchor="middle" fill="#1f2a44">time</text>
  <text x="32" y="80" font-size="12" text-anchor="middle" fill="#1f2a44" transform="rotate(-90 32 80)">wheel speed</text>
</svg>
```

The threshold is the height where each dump starts: low enough to leave margin below the limit.
:::

::: context gravity-gradient Why gravity twists a long satellite
Gravity gets weaker with distance. So the end of a satellite nearer Earth is pulled slightly harder than the far end. If the satellite is tilted, that small difference makes a twist — a **torque** — that tries to line its long axis up with the direction to Earth's center.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <path d="M 20 180 Q 180 150 340 180" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <text x="90" y="176" font-size="12" text-anchor="middle" fill="#1d6fd1">Earth</text>
  <line x1="180" y1="20" x2="180" y2="150" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="140" y1="45" x2="220" y2="125" stroke="#1f2a44" stroke-width="6"/>
  <circle cx="140" cy="45" r="10" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="220" cy="125" r="10" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="140" y1="57" x2="140" y2="77" stroke="#b4232c" stroke-width="2"/>
  <polygon points="140,83 135,74 145,74" fill="#b4232c"/>
  <line x1="220" y1="137" x2="220" y2="165" stroke="#b4232c" stroke-width="2"/>
  <polygon points="220,171 215,162 225,162" fill="#b4232c"/>
  <text x="30" y="70" font-size="12" fill="#b4232c">far end: weaker pull</text>
  <text x="236" y="150" font-size="12" fill="#b4232c">near end:</text>
  <text x="236" y="164" font-size="12" fill="#b4232c">stronger pull</text>
  <text x="188" y="30" font-size="11" fill="#6c7a93">toward Earth's center</text>
</svg>
```

For a 3U cubesat (about $4\,\mathrm{kg}$, $10 \times 10 \times 34\,\mathrm{cm}$) at $400\,\mathrm{km}$, the worst case, $\tfrac{3\mu}{2r^3}\,|I_z - I_y|$, is about $7 \times 10^{-8}\,\mathrm{N\,m}$ — tiny, but it never stops.
:::

::: context two-body-orbit The orbit with an exact answer
A **two-body orbit** pretends the universe holds only Earth and the spacecraft, with Earth a perfect sphere. That problem has an exact, pencil-and-paper solution: the spacecraft traces the same ellipse forever. Real orbits are nudged by Earth's bulge, the Moon, the Sun and the air, so no simple formula fits them. That is exactly why the two-body case is the first test for any orbit **propagator** — the program that steps a spacecraft forward in time. If your code cannot reproduce the one answer known exactly, nothing it says about harder cases can be trusted. The GNC modules later in this course lean on exactly this kind of check.
:::
