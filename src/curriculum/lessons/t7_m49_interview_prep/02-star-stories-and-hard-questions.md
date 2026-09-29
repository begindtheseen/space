---
id: l02-star-stories-and-hard-questions
title: "Behavioral rounds: STAR stories, and the two questions that sting"
minutes: 21
covers:
  - Behavioral and STAR stories emphasizing ownership, speed, and recovery from failure
  - Answering "what would you do differently" and "what was the hardest bug" without either arrogance or apology
---

Imagine a parent interviewing you to babysit. They could ask, "Are you responsible?" Everyone says yes, so that question tells them nothing. A smart parent asks something else: "Tell me about a time something went wrong while you were in charge." Now they learn a lot. What happened? What did you do, step by step? And what do you do differently now?

That is a **[[behavioral round|behavioral-round]]**: an interview session that asks about things you actually did, because how you acted before is the best guide to how you will act again. People dismiss it as the soft part of the loop, the part you coast through on personality. That is a costly mistake for a technically strong candidate. The round tests two real things: whether you can be trusted with a fuzzy problem and no supervision, and whether you actually learn from getting something wrong or only move past it. On a GNC team, those are close to the job description.

For a self-taught candidate this is unusual ground. You probably have no manager to describe, no teammate you disagreed with, no team meeting to draw on — the usual raw material. That tempts candidates into two bad moves: inventing team drama that never happened, or apologizing for having no team. Handled well, it is not a weakness at all. A project run start to finish by one person, with every decision made and owned by that person, is a *better* source of ownership stories than most junior jobs produce — because there was no one else to hide behind.

This lesson gives you a structure for mining that material, and working answers to the two questions that come up most often and land worst when handled badly.

## What STAR actually checks

**STAR** stands for **Situation, Task, Action, Result**. It is not a format you must announce. It is a checklist the interviewer runs against your answer whether you say the letters or not. Knowing what each letter is really checking tells you what to put in — and, equally important, what to cut.

**[[Situation|star-shape]]** sets the scope and the stakes in two or three sentences. It is not a diary. Its job is to let the listener judge how hard the problem was *before* you say what you did. Without it, "I fixed a bug" carries no information: a bug fixed in ten minutes and one that took two weeks sound the same.

**Task** states what was specifically *yours to decide*. Self-taught candidates are vaguest here, because on a solo project *everything* was theirs. That is exactly why you should say it out loud instead of hoping the listener works it out. "I had to decide whether to ship the filter as it was, or delay to fix a consistency problem I'd found" names a real decision that you owned. "The project needed the filter to work" does not.

**Action** is the reasoning and the steps you actually took, in enough technical detail that the listener can tell it really happened and was not rebuilt for the interview. Vague action — "I worked hard and eventually solved it" — is the biggest single sign of a made-up or over-polished story. Specific action cannot be faked on the spot by someone who did not do the work: "I ran a chi-square consistency test across the Monte Carlo set. It showed the covariance was too small by roughly a factor of three, and I traced that to an unmodeled correlated bias."

**Result** has a number in it, and it includes what changed afterward — not only the outcome, but what you now do differently because of it. A result with no lasting change sounds like luck, not learning.

::: key
STAR is not narrative structure for its own sake. Situation calibrates difficulty, Task names what was actually yours to decide, Action supplies verifiable technical detail, Result quantifies the outcome and states what changed afterward. Missing any one weakens the signal the other three provide.
:::

## Building a story bank without a team

A **story bank** is a small set of true stories you have prepared ahead of time, each ready to tell in two minutes. Three kinds of story cover **ownership**, **speed** and **recovery** from a personal-project history, without inventing anything.

### Ownership: a real decision you could have gotten wrong

An **ownership story** comes from a real decision made under real uncertainty — where you could have been wrong, and no one checked you before you committed. For example:

"I chose to build my own **[[6-DOF|six-dof]]** simulation core instead of using an existing framework. I judged that understanding every line of the integration and the coordinate transforms mattered more for what I was trying to learn than the build time I'd save. I was accountable for that being the right call, since a wrong one would have cost weeks I didn't have."

The mistake to avoid is a "decision" with no uncertainty in it. "I decided to use Python", when there was never a serious alternative, is not a decision; it is a default. An interviewer can tell the difference.

### Speed: a fast loop, measured in time

A **speed story** is about how quickly you go around the loop of find, fix and check — not about hours logged. "Long hours" shows effort, not speed, and effort is not what this checks. A real speed story has a number: time from spotting a requirement to a first working version, or from finding a defect to a verified fix.

"I went from noticing the filter was inconsistent to a diagnosed and fixed root cause in about two days, by testing the most likely source first instead of instrumenting everything at once." That shows a fast, disciplined loop. It is a stronger signal than "I spent every evening for a month on it."

### Recovery: a failure that changed how you work

A **recovery story** comes from a real failure with a real **[[after-action|after-action]]** — a look back at what went wrong and a change so it cannot happen again. The key feature is a *permanent* change to your process, not a one-time patch: an assertion added, a test written, a review step introduced, so the same failure cannot quietly come back. A bug fixed and forgotten is not a recovery story. A bug fixed with a lasting change to how you work is.

::: warning
Do not invent a team dynamic that was not there. Claiming you "convinced a teammate" or "pushed back on a manager" on a solo project can be checked with five seconds of follow-up, and it costs you far more than admitting the project was solo ever would. Solo ownership, framed well, is not a weaker story than a team one. It removes all doubt about whose decision it was.
:::

## "What would you do differently?" — a working script

Two bad answers dominate this question. Most panels have heard each a hundred times.

- **False humility**: "Honestly, everything — I knew so little back then." It sounds self-aware, but it names nothing, so there is nothing to judge.
- **Defensiveness**: "Nothing. It was the right call given what I knew." It shuts the question down. Worse, it suggests you never looked back at all, which is a bigger warning sign than admitting a real mistake.

The working answer has three parts:

1. Name **one specific, technical change**.
2. Tie it to a concrete **trigger** — what you know now that you did not then, or which check you would run earlier.
3. Say briefly **why you did not do it at the time**, as a reasonable choice of priorities rather than an oversight.

Here is one built that way:

"I'd add the filter consistency check *before* the accuracy check, not after. I found the inconsistency almost by accident late in the project. If I'd run it first, it would have caught the modeling gap two weeks earlier, before I'd built other analysis on top of the biased estimate. At the time I ordered it the other way, because accuracy felt like the more important number to pin down first. In hindsight, consistency is the cheaper check, and it should come first precisely because a filter that fails it invalidates everything built on top of it."

That answer is specific and technical, and it shows exactly the looking-back judgment the question is searching for.

::: example "What would you do differently" — worked answer
"On the Monte Carlo verification campaign, I'd restructure the case-generation step.

I generated all ten thousand dispersed cases up front from a single fixed set of **[[random seeds|seed]]**. So when I found a bug in the dispersion model partway through the analysis, I had to regenerate and rerun the entire campaign — not only the affected cases.

If I did it again, I'd version the seed generation separately from running the cases. Then a fix to one dispersion parameter wouldn't invalidate cases that never touched it.

I didn't set it up that way originally because I underestimated how many rounds the dispersion model itself would need before it was right. I assumed the model was the settled part and the analysis was where the iterating would happen. It was the other way around."

**Check it against the script.** One specific change: version the seeds separately. Trigger: a dispersion-model bug forced a full rerun. Why not at the time: a reasonable but wrong guess about which part would change. All three parts are there, and nothing is apologized for.
:::

## "What was the hardest bug?" — a working script

The bad answer here is the **war story**: a dramatic tale of confusion and frustration that ends in relief, with no reasoning in the middle that a listener could follow. It is memorable, and it tells the panel nothing about how you actually debug.

The working answer walks through four steps:

1. the **symptom**, stated precisely;
2. the likely causes you **ruled out**, and *how* you ruled each one out;
3. the actual **root cause**;
4. what **changed afterward**, so the same kind of bug cannot quietly come back.

For a GNC project, a subtle numerical or modeling bug makes stronger material than a generic software bug. Think of a sign error in a **[[Jacobian|jacobian]]**, a mix-up between two coordinate frames, or a hidden correlation nobody modeled. These show the understanding of the physics and mathematics that the round exists to test, not only general debugging skill.

::: example "Hardest bug" — worked answer
**Symptom.** "The navigation filter's reported uncertainty looked fine on any single run. But checked across a Monte Carlo set, its actual error was routinely three times bigger than its covariance said it should be."

**Ruled out, first.** "I checked for a plain implementation bug by comparing the update equations line by line against the derivation. They matched."

**Ruled out, second.** "Next I suspected the **[[process-noise|process-noise]]** tuning, the usual first suspect for an overconfident filter. I spent a day sweeping it with no real improvement. That told me the problem wasn't a tuning number but something structural."

**Root cause.** "A sensor bias I had modeled as zero-mean white noise was actually drifting slowly, and it was **[[correlated|correlated]]** between one measurement and the next. The filter's white-noise assumption can't account for that, so the filter treated far more information as independent than it really was."

**Fix and lasting change.** "I added the bias as an estimated state. Afterward, I made the consistency test a standing part of my verification: it runs on every filter change, before anything else. This bug would have been caught in an afternoon if I'd been running that test from the start instead of finding it by chance."

**Check it against the script.** Symptom with a number (a factor of three). Two causes ruled out, each with the method. A root cause specific enough to be checked. A permanent process change, not only a fix. The story also quietly shows a speed loop and a recovery at once.
:::

::: warning
A hardest-bug answer that ends at "and then I found it and fixed it" stops one step too early. The stronger ending says what changed in your process afterward. That is the part that shows recovery rather than persistence alone — and persistence by itself is not what this question is looking for.
:::

## Ownership, speed and recovery, named plainly

Keep these three separate in your head as you build your story bank. One strong story often shows only one of them well, and a panel will usually ask for all three somewhere across the loop.

- **Ownership** means being accountable for a call nobody else was going to check for you. The test is not how big the decision was. It is whether *you* owned the consequence of it being wrong.
- **Speed** is how fast you go around the loop, measured in time — not effort measured in hours. A fast loop from problem to diagnosis to fix is the signal. Have the actual number ready.
- **Recovery** is a permanent change in how you work because of a failure — not merely fixing that one instance. The after-action is what makes it a recovery story rather than a bug-fix story.

## Check yourself

::: check
What does the "Task" letter of STAR specifically check for, and why is it the letter self-taught candidates most often leave too vague?
:::

::: answer
Task checks what was specifically yours to decide. Not what the project needed in general, but the actual decision point where you — and nobody else — were responsible for the call.

Self-taught candidates leave it vague because on a solo project everything is technically theirs. Oddly, that makes it easy to state nothing precisely: "the project needed X" describes a requirement, not a decision.

The fix is to name the specific choice point out loud — "I had to decide whether to ship as-is or delay." You do not need to explain who else could have made the call. The ownership is already established by there being no one else.
:::

::: check
Why is "honestly, I'd do everything differently, I knew so little back then" a weak answer to "what would you do differently," even though it sounds appropriately humble?
:::

::: answer
It names nothing specific, so it carries no information the panel can judge. Someone with real, precise hindsight could say it truthfully. So could someone who has never thought about the question. The panel cannot tell which.

The working version names one concrete technical change, states the trigger that would make you do it now, and explains briefly why the original choice was a reasonable priority at the time rather than an oversight. Being specific is what turns a mood into evidence that you really looked back.
:::

::: check
A candidate says: "I rewrote my simulation's integrator from scratch." Turn that into a proper ownership story — what is missing, and what needs to be added?
:::

::: answer
As it stands it has no Situation (why did the integrator need rewriting, what was wrong, and what did that cost?), no real Task (was there a decision, or only an obvious necessity?) and no Result with a number.

A working version supplies all three:

"My original fixed-step RK4 integrator was losing energy visibly over long runs. I noticed a low-Earth orbit's **[[semi-major axis|semi-major-axis]]** drifting by several kilometers over a week of simulated time, with no physical cause. That meant every analysis using long propagations was suspect. I decided to replace it with a **[[symplectic integrator|symplectic]]** rather than only shrinking the step size. I judged a structural fix was worth more than a workaround that would make the problem smaller without addressing its cause. After the change, the drift over the same week dropped by roughly two orders of magnitude."

That version has stakes, a real decision with a rejected alternative, and a number. ("Two orders of magnitude" means about a hundred times smaller.)
:::

::: check
Why does a "hardest bug" story about a subtle numerical or modeling error tend to land better in a GNC interview than one about a generic software bug like a null pointer?
:::

::: answer
Both can show debugging skill. But only the domain-specific one also shows what a GNC round is really trying to assess: whether you understand the physics and mathematics well enough to reason about *why* a wrong answer is wrong, not only that the program crashed.

A sign error in a Jacobian, or a correlated bias caught by a consistency test, shows you know what "correct" should look like mathematically. That is a stronger and more relevant signal than fixing a segmentation fault — even though a segmentation fault can be a perfectly real and difficult bug.
:::

::: check
The interviewer responds to your ownership story with: "that doesn't sound like it was really your call — who signed off on it?" How do you answer, given the project was solo?
:::

::: answer
Say plainly that it was a personal project with no approval chain. Then answer the question underneath the words: what standard did you use to decide the call was right before committing to it?

"There was no one to sign off on it — I was the only person on the project. What made me confident enough to commit was [the specific evidence: a closed-form test case that matched, an independent cross-check, a deadline trade I was openly willing to accept]."

This turns an organizational question you cannot answer into a judgment question you can. A good answer shows you hold yourself to a real bar even with no one checking.
:::

::: check
What is a weak way to demonstrate "speed" in a behavioral answer, and what does a strong version look like instead?
:::

::: answer
The weak version cites effort — hours worked, evenings spent, how hard you pushed. That measures commitment, not speed, and it is not what the question is probing.

The strong version cites a measured pace: time from spotting a problem to a diagnosed cause, or from a diagnosed cause to a verified fix, stated as an actual number. "About two days from noticing the inconsistency to a fixed and re-verified filter" is evidence of a fast, disciplined loop. "I worked on it every night for a month" is evidence only of persistence, which is a different and weaker signal.
:::

## Summary

| Idea | Statement |
| --- | --- |
| STAR, precisely | Situation calibrates difficulty; Task names what was yours to decide; Action gives verifiable technical detail; Result is quantified and states what changed after |
| Story sources, solo | Ownership from a real decision under uncertainty; speed from how fast you loop, with a number; recovery from a permanent process change after a failure |
| "What would you do differently?" | One specific technical change, its trigger, and why the original choice was a reasonable priority, not an oversight |
| "Hardest bug" | Symptom, causes ruled out and how, actual root cause, and the permanent change made afterward — not only the fix |
| Two traps | False humility or defensiveness on the first question; a war story with no method on the second |

The next lesson turns to the technical core of the module, starting with order-of-magnitude estimation — done at the same pace, and under the same pressure, that this lesson has been preparing you for.

::: context behavioral-round Why interviewers ask about the past
The whole method rests on one idea: what you actually did last time predicts what you will do next time far better than what you say you would do. "What would you do if a test failed the night before launch?" invites a perfect, imaginary answer. "Tell me about a time a test failed at the last minute" can be probed — the interviewer asks for the numbers, the order of events, what you tried first. Real memories hold up under that kind of questioning; invented ones fall apart within a couple of follow-ups. That is also why the warning about inventing a team is so serious.
:::

::: context star-shape How long each letter should take
In a two-minute answer the letters are not equal. Situation and Task are short setup. Action is the heart, because it holds the detail that proves the story is real. Result is short but must carry a number and a lasting change.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="30" width="48" height="36" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="68" y="30" width="32" height="36" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="100" y="30" width="176" height="36" fill="#1d6fd1" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="276" y="30" width="64" height="36" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="14" font-weight="700" text-anchor="middle">
    <text x="44" y="53" fill="#1f2a44">S</text><text x="84" y="53" fill="#1f2a44">T</text>
    <text x="188" y="53" fill="#fff">A</text><text x="308" y="53" fill="#1f2a44">R</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="44" y="84">~18 s</text><text x="84" y="84">~12 s</text>
    <text x="188" y="84">~66 s: the proof it happened</text><text x="308" y="84">~24 s</text>
  </g>
  <text x="180" y="20" font-size="12" fill="#6c7a93" text-anchor="middle">a two-minute answer, drawn to scale</text>
</svg>
```

These times are a rule of thumb, not a law: roughly 15, 10, 55 and 20 percent of the answer.
:::

::: context six-dof Six ways to move
**DOF** means **degree of freedom**: one independent way something can move. A rigid body in space has six. It can slide along three directions (forward and back, left and right, up and down) and turn about three axes (roll, pitch and yaw). A **6-DOF simulation** tracks all six at once, which means handling both the vehicle's motion and its attitude, and the coordinate transforms that connect them.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="2">
    <line x1="180" y1="95" x2="300" y2="95"/>
    <line x1="180" y1="95" x2="180" y2="20"/>
    <line x1="180" y1="95" x2="110" y2="150"/>
  </g>
  <polygon points="306,95 294,89 294,101" fill="#1f2a44"/>
  <polygon points="180,14 174,26 186,26" fill="#1f2a44"/>
  <polygon points="105,154 112,142 118,151" fill="#1f2a44"/>
  <g fill="none" stroke="#b4232c" stroke-width="2">
    <path d="M262,80 A10,16 0 1,1 262,110"/>
    <path d="M165,40 A16,8 0 1,0 195,40"/>
    <path d="M128,125 A14,10 0 1,1 150,138"/>
  </g>
  <g font-size="12" fill="#1f2a44">
    <text x="310" y="116">x</text><text x="190" y="18">z</text><text x="92" y="165">y</text>
  </g>
  <text x="20" y="30" font-size="12" fill="#1f2a44">3 slides (black)</text>
  <text x="20" y="48" font-size="12" fill="#b4232c">+ 3 turns (red)</text>
  <text x="20" y="66" font-size="12" fill="#1f2a44">= 6 degrees of freedom</text>
</svg>
```
:::

::: context after-action Looking back on purpose
An **after-action review** asks four plain questions once something is over: What did we plan? What actually happened? Why was there a difference? What will we change? The U.S. Army made it a formal habit in the 1970s, and engineering teams, hospitals and fire services borrowed it. In spaceflight the same idea appears as the failure investigation or "lessons learned" report after an anomaly. The important word is *change*: a review that ends without a new test, checklist item or rule has not finished its job.
:::

::: context seed What a random seed is
A computer's random numbers are not truly random. They come from a formula that turns one starting number, the **seed**, into a long stream of numbers that look random. Start from the same seed and you get exactly the same stream every time. That is a feature: a Monte Carlo case built from seed 4172 can be rebuilt perfectly later, which is how you replay one strange case out of ten thousand. Keeping track of which seeds fed which parts of the setup — "versioning" them — is what lets you rerun only the cases a fix actually touched.
:::

::: context jacobian A table of slopes
A **Jacobian** is a grid of numbers saying how much each output changes when you nudge each input a little. A navigation filter uses one to turn "the measurement disagreed by this much" into "so move the estimate this way". If one entry has the wrong sign, the filter pushes the estimate *away* from the truth whenever that entry matters — often a small, confusing error rather than an obvious crash. That is why sign errors in Jacobians are a classic hardest-bug story: finding one needs you to know what the right answer should look like.
:::

::: context process-noise The filter's allowance for being wrong
A Kalman filter predicts forward using a model of how the vehicle moves. **Process noise** is the amount of uncertainty the filter adds at each prediction step to admit the model is imperfect. Too little, and the filter grows sure of itself too quickly and stops listening to measurements — it becomes overconfident. Raising it is the usual first fix. It did not work in this story because the problem was not the size of an allowance but a wrong assumption about the sensor's error pattern.
:::

::: context correlated Asking the same friend twice
Suppose you want to know if a movie is good, and you ask ten different friends. Ten opinions. Now suppose you ask the same friend ten times. You still have one opinion, repeated. Measurements work the same way. White-noise errors are like different friends: each is fresh, so averaging many shrinks the error. A slowly drifting bias makes consecutive errors nearly the same, like asking one friend again and again. A filter that treats those repeats as independent believes it has far more information than it does — so its covariance shrinks too far, and it becomes overconfident.
:::

::: context semi-major-axis Half the long width of an orbit
An orbit is an ellipse, a stretched circle. Its **semi-major axis**, written $a$, is half its longest width. For a circular orbit it is the radius. It matters here because an orbit's energy depends on $a$ alone: the specific energy is $-\mu/(2a)$, where $\mu$ ("mew") is Earth's gravity constant, $3.986 \times 10^{14}\,\mathrm{m^3/s^2}$. So with no drag or thrust, $a$ must stay constant. If a simulation shows $a$ creeping, the integrator is creating or destroying energy that physics says cannot change — a clean, checkable sign of numerical error.
:::

::: context symplectic Integrators that keep an orbit closed
An **integrator** steps a simulation forward in time. **RK4** (fourth-order Runge–Kutta) is accurate over each step, but its tiny errors in energy can pile up in one direction over thousands of orbits, so the orbit slowly spirals. A **symplectic** integrator is built to respect the structure of the physics, so its energy error wobbles up and down but does not grow. Over long runs the orbit stays closed.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <circle cx="90" cy="70" r="6" fill="#1f2a44"/>
  <path d="M90,22 A48,48 0 1,1 42,70 A44,44 0 0,1 90,26 A40,40 0 1,1 50,70 A36,36 0 0,1 90,34" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="90" y="140" font-size="12" text-anchor="middle" fill="#b4232c">energy drifts: orbit spirals</text>
  <circle cx="265" cy="70" r="6" fill="#1f2a44"/>
  <circle cx="265" cy="70" r="46" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="265" cy="70" r="44" fill="none" stroke="#8fb8f0" stroke-width="1.5"/>
  <text x="265" y="140" font-size="12" text-anchor="middle" fill="#1d6fd1">energy wobbles: orbit stays closed</text>
</svg>
```

The drift is exaggerated here so you can see it.
:::
