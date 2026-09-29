---
id: l05-the-failure-story
title: "The failure story, owned without performance"
minutes: 22
covers:
  - "the themes actually probed: a failure and what changed, conflict with a colleague, a decision with incomplete information, a missed deadline, a time you were wrong, ownership beyond your scope, teaching someone, working extended hours"
---

Imagine a friend asks what went wrong in the soccer game you lost. You could say "the ref was bad", or "honestly, I was terrible, I'm the worst". Or you could say "I kept drifting out of position on corners, they scored twice from corners, so now I practice marking every week." Only the last answer tells your friend anything useful about you.

The failure question in an interview is the same choice, and it goes badly for strong engineers more often than any other theme. Every other theme lets you describe work that went well. This one asks for work that did not, told to someone deciding whether to hire you, with no way to end on a win. Wanting to protect yourself is natural. Here, it is what costs you the answer.

The question is not a trap. A real failure, honestly owned, is one of the strongest answers you can give, because it is the only theme that shows you can look at your own work without defending it. An engineer who cannot say plainly what went wrong and why it was hers will be slow to raise a problem — and that is expensive in a way no technical skill makes up for.

## The three properties of a usable failure story

::: key
A usable failure story has a real consequence, a fault that was genuinely yours, and a specific change in how you work now. If the consequence is trivial or the fault belongs to circumstances, the story reads as evasion.
:::

(**Evasion** means dodging the question while seeming to answer it.) Each part is needed.

**A real consequence.** Something happened: time lost, a wrong result, a decision made on bad information, a deadline moved, someone's work redone. With no consequence there is nothing to learn from. A story whose worst outcome is that you were briefly inconvenienced answers a much easier question than the one asked. The consequence also makes the change believable: a new habit matters only if it was paid for.

**A fault that was genuinely yours.** Not the circumstances, not the requirements that moved, not the late teammate. A failure that belongs to the situation tells the listener nothing about you. Worse, it casts you as the only reasonable person present, which is rarely how failures go.

**A specific change in how you work now.** Specific means someone could check it. "I am more careful now" is not a change. "Every project I have started since has a stored reference case that any change must reproduce, and it runs before I can merge" is. The change makes the story about the present, and it is the only part that predicts how you will work.

## Two ways to get it wrong, pulling in opposite directions

**Minimizing** keeps the failure small enough to feel safe. It has four common shapes:

- **The [[disguised strength|disguised-strength]]** — a "failure" that is really a virtue: working too hard, caring too much, being too thorough. It answers a question nobody asked, and signals you did not want to answer the one that was.
- **The trivial consequence** — the whole cost was a few hours of your own time.
- **The [[passive voice|passive-voice]]** — "the schedule slipped", "mistakes were made". Nobody in the sentence did anything.
- **Creeping context** — one sentence of background, then another, until the listener understands that, in fairness, the requirements changed, the data came late, and the failure was really unavoidable.

Each leaves the same hole: nothing owned, so nothing shown.

**Performing contrition** goes the other way, and is the less obvious mistake. **Contrition** means deep regret. Performing it means loading the answer with how terrible you felt, how much you let people down, how long it bothered you. The feeling may be completely real. The problem is that the answer is now about your feelings instead of the event. It puts the interviewer in the position of comforting you, which an interviewer cannot do. And it crowds out the analysis: the more space the regret takes, the less is left for what went wrong and what changed.

The tone you want is the one you would use in an [[anomaly review or a post-mortem|post-mortem]] with colleagues you respect: factual, calm, specific about causes, uninterested in blame — including blaming yourself — and focused on what the finding changes. You would not open one by apologizing or close it by explaining that the outcome was unavoidable. You would say what happened, what caused it, and what is different now.

::: warning The disguised strength is heard as a refusal
"My biggest failure is that I take on too much" is not a small answer to the question. It signals that the question will not be answered. This module lists being unable to name a real failure among the behavioral red flags, grouped with blaming others and inflating your contribution under one heading: an unwillingness to be accountable. That reading is heavier than the dodge seems to deserve — which is exactly why it is worth knowing in advance.
:::

## The stress test

This module's fourth exercise is a test you run before the interview, and it is the fastest way to find out whether a story will hold. Have someone push on it three times:

1. **What was the actual consequence?** Not what could have happened — what did.
2. **What specifically was your fault, rather than the circumstances?**
3. **What would happen differently today?**

The story passes if it survives all three without you softening it. The warning sign: if, at the second question, you catch yourself adding context that shifts the blame, it is the wrong story. The context may be true, but a story you can only tell with a defense attached will be told that way, and the defense is what the listener remembers.

Run it on paper first, then out loud, where the softening sneaks in.

## Choosing which failure

Three practical limits.

**Recent enough to matter, old enough that the change has been tested.** A failure from last week has no evidence that anything changed. One from seven years ago invites the question of what you have done since.

**A failure of judgment or practice, not of integrity.** The question is about engineering: a decision you got wrong, a check you skipped, a risk you misjudged, something you assumed. If your only real failure raises a question about honesty, or about deliberately skipping a safety or process rule, you are answering a different question, and this module cannot tell you how that is weighed. Choose the engineering failure if you have one.

**One where the change is checkable.** The strongest last sentence points at something that exists: a test that runs, a checklist, a habit visible in your own repository history. That turns your final twenty seconds from a promise into evidence.

## The failure that was not only yours

Most real failures have several causes and people. The rule that keeps the story honest without confessing to things you did not do: **describe your share fully, mention other causes once and factually, and never let another person carry the explanation.**

One factual mention is usually fine, and sometimes needed for the story to make sense — "the tolerance I was given turned out to be for a different version of the part" is a fact. It turns into blame-shifting through repetition, emphasis, or placement at the end, where the conclusion goes. The end belongs to your share.

Before it goes in the bank: if the other person were listening, would they call your account fair? If not, it is not ready, however strong technically.

::: example One failure, three versions
The event: the candidate rewrote the inner loop of her 6-DOF simulation (one tracking all six ways a vehicle moves: three directions, three rotations) in C++ for speed. While doing it she changed the default [[integration step|integration-step]], did not re-run the [[analytic verification case|verification-case]] afterwards, and a teammate spent two weeks on a [[wind-loads study|wind-loads]] using results from the faster, coarser build.

**Minimized:**

"I suppose the main one would be the C++ rewrite of my simulation. It was a big job, and honestly the Python version was never going to be fast enough for the campaign sizes we needed, so it had to happen. There was a bit of a hiccup afterwards where some of the numbers moved slightly, which took a little while to track down — partly because the verification case was quite slow to run at the time and we were under time pressure before the showcase. It all got sorted out in the end and the rewrite was definitely the right call."

Nothing here is false, and nothing is owned: *a bit of a hiccup*, *some numbers moved slightly*, and no stated consequence. Two sentences of context arrive exactly where the fault should be. And the answer ends by confirming the decision was correct — a defense of the work, not an account of the failure.

**Performed:**

"That would be the C++ rewrite. I still think about it, honestly. I broke the integration step and did not check, and a teammate lost two weeks of work because of me — he was so decent about it, which somehow made it worse. I felt sick when I realized. I have never been more embarrassed about anything I have built, and I promised myself I would never be that careless again. It really shook my confidence for a while."

The consequence is stated and the fault is owned, so this already beats the first version. But about two-thirds of the words are about her feelings, and the ending is only a promise. *Never be that careless again* is an intention, not a change; nothing tells the listener what is different about how she works now. It also asks the listener to do something with her distress, which they cannot.

**Owned:**

"The clearest one is from my 6-DOF simulation. I rewrote the integration inner loop in C++ for speed, and while I was in there I changed the default step size — I had been tuning for throughput, and the coarser step was part of how I got the speed-up. I did not re-run the analytic verification case afterwards. It took about forty minutes, and I had convinced myself it was a performance change rather than a numerical one. That was the actual mistake: I decided what kind of change it was instead of testing it.

A teammate used that build for a wind-loads study, and the load numbers were off by enough to matter. He lost about two weeks of work. I found out because his peak loads disagreed with an earlier run of mine and he came to ask me why.

What is different now is concrete. Every project I have has a stored nominal case with its trajectory committed, and any change has to reproduce it to a stated tolerance before I will merge it. It [[runs automatically|regression-test]], so it is not something I have to remember to be careful about. I also stopped trusting my own labeling of a change as performance-only — that is the real lesson. I was not careless with the test; I was confident about which tests the change needed."

**What the third version has that the second lacks:** a consequence with a size (two weeks), the fault in one plain sentence, a diagnosis one level below the surface error — the mistake was the [[labeling, not the skipped test|root-cause]] — and a change that exists as a working tool rather than a resolution.
:::

::: example The stress test, run on a story that does not survive
**The story:** "On my orbit-determination project the Gauss-Newton fit kept diverging, and I spent a whole afternoon hunting for a bug in the Jacobian that was not there. The problem was the tracking geometry — range-only data from a single station on a nearly straight-line pass, so [[one direction of the state was essentially unobservable|unobservable]]. I check the conditioning of the normal matrix before I trust a fit now."

(Plainly: her fitting program, which tries to work out a satellite's orbit from measurements, kept failing. She hunted for a coding bug for hours, but the real problem was that the measurements could not pin down the orbit in one direction at all.)

**Push one — what was the actual consequence?** "I lost an afternoon."

Here it stops being a failure story. An afternoon of your own time, with no effect on anyone else, is not a consequence in the question's sense. It is the ordinary friction of engineering.

**Push two — what specifically was your fault?** "I assumed it was a code problem instead of checking whether the problem was well posed" — that is, whether it could be answered at all from that data.

That is a real diagnosis. But put it next to push one: the fault is real and the consequence is not. What is left reads as an engineer showing off a debugging habit — which is what it is. It is a fine answer to *tell me about a time you were wrong*, and a weak answer to *tell me about a failure*.

**Two ways forward.**

*Move the story to the theme it fits:* a clean "time you were wrong" story, where a small consequence is no defect.

*Or find the version with a consequence.* If the same blind spot later cost something real — a fit she reported as finished that carried enormous uncertainty in a poorly observed direction, which someone else then used — that is the failure story, and the conditioning check becomes its closing change instead of its whole point.

**What not to do:** inflate the afternoon. Adding "and it delayed the project" when it did not is the fastest route to a story that collapses the second time push one is asked — and that collapse costs far more than a modest failure story ever would.
:::

## Check yourself

::: check
A candidate answers the failure question with: "I once spent three weeks optimizing a piece of code that turned out not to be the bottleneck." Test it against the three properties.
:::

::: answer
**Consequence:** three weeks of her own effort, with no stated effect on anyone else or on the project — weak, though not empty if those weeks displaced something that mattered, which the answer does not say. **Fault:** clearly hers and clearly stated; nobody told her to optimize the wrong thing. **Change:** missing entirely. The story can be saved in two moves: say what the three weeks cost the project, and end on what she does now — for example, that she measures where the time goes (profiles the code) before optimizing, and can point to that measurement step in her recent work. Without those, it is a small, honest, unfinished answer.
:::

::: check
Performed contrition at least admits fault. Why does this lesson treat it as a failure mode?
:::

::: answer
Because admitting fault is necessary but not enough. The answer has a job — show what went wrong, why it was yours, and what is different now — and regret crowds out all three. It turns the listener from assessor into comforter, a role an interviewer cannot take. And it ends on an intention rather than a change: "I will never be that careless again" predicts nothing, while "the nominal case runs before I can merge" predicts something checkable. The tone that works is the post-mortem tone: factual, specific, uninterested in blame, including your own.
:::

::: check
Your failure had three causes, and only one was yours. How do you tell it?
:::

::: answer
Describe your share fully, mention the other causes once and factually, and never put one of them at the end. A single sentence like "the tolerance I was working from turned out to belong to a different version" may be needed for the story to make sense. It becomes blame-shifting when you repeat it, lean on it, or put it in the conclusion, where the listener hears it as *the* explanation. The end belongs to what you did and what changed. Before it goes in the bank, run the fairness test: would the other people involved call your account fair? If not, it is not ready.
:::

::: check
Why is "I am much more careful now" a weak ending, even when it is true?
:::

::: answer
Because nobody can check it, so the listener has to take the change on trust — the one thing a failure story cannot ask for, since the change is supposed to be the *evidence* that you learned. A checkable ending names something that exists: a test that runs automatically, a check that comes before a kind of work, a habit visible in your history. A change built into a process is stronger still than one built into your intentions, for the reason the owned version above gives: it does not depend on remembering to be careful.
:::

::: check
An interviewer pushes back: "That does not sound like it was really your fault." What is going on, and what do you do?
:::

::: answer
Two possibilities. First, the push may be a test of whether you will take the exit. Taking it is the wrong move; restate the fault plainly: "the circumstances made it easier to get wrong, but the call was mine and I made it without checking." Second, you may really have chosen a story where your fault is thin, and the interviewer is telling you so. Then the honest response is to say which part was genuinely yours and, if that is not much, offer a different story. What you must not do is gratefully accept the exit and move on — the story then has no fault in it at all, and you have shown the opposite of what the theme is for.
:::

::: check
Why should a failure story be old enough for the change to have been tested? What would you say about a failure from a month ago?
:::

::: answer
Because the ending is a change in how you work, and a change made last month has no track record. Honestly, you can only say you have *adopted* it, not that it has *held*. If the recent failure really is your best one, say so and be exact about the evidence: "this was six weeks ago, so what I can tell you is what I changed and that it has held on the two things I have built since, not that it has been tested for a year." That precision is worth more than a bigger claim.
:::

## Summary

| Element | What it must contain | How it fails |
| --- | --- | --- |
| Consequence | Something that actually happened, with a size | Trivial, or never stated |
| Fault | One sentence, yours, uncushioned | Circumstances, passive voice, creeping context |
| Diagnosis | Why you got it wrong, one level below the surface error | Stops at the visible mistake |
| Change | A tool or practice someone could check | An intention, or "more careful now" |
| Tone | Post-mortem: factual, specific, unsentimental | Minimizing at one end, performed regret at the other |

The stress test is three pushes — what was the consequence, what specifically was your fault, what would happen differently today — and a story that needs a defense attached to survive them is the wrong story. The next lesson takes the theme where the obstacle is a person: describing a disagreement with a colleague or a manager without making them the villain.

::: context disguised-strength The humblebrag answer
Interview guides have warned about this answer for decades, so interviewers hear it constantly: "I'm a perfectionist", "I work too hard", "I care too much". Each is a boast dressed up as a confession — people sometimes call it a **humblebrag**.

The problem is not that it is untrue. It is that the interviewer asked for evidence of how you handle your own mistakes, and got a compliment instead. The honest reading of that swap is "this person will not tell me when something is wrong", which is the opposite of what you want them to conclude.
:::

::: context passive-voice Who did it?
A sentence is in the **active voice** when it says who acted: "I changed the step size." It is in the **passive voice** when the actor disappears: "the step size was changed."

The passive voice is fine in a lab report, where who did it often does not matter. In a failure story it is a hiding place. The phrase "mistakes were made" has been used by so many officials to avoid saying who made them that it is now a textbook example of the dodge. A quick check on your own story: find every sentence about the fault, and make sure "I" is doing the verb.
:::

::: context post-mortem How engineers review what went wrong
After a failure, engineering teams hold a formal review. In spaceflight it is often called an **anomaly review** (an anomaly is anything that behaved unexpectedly); NASA convenes mishap investigation boards for serious ones. Software teams call it a **post-mortem**, borrowing the doctors' word for examining what caused a death, and many run them "blameless" — hunting for the cause, not the culprit.

The structure is nearly always the same:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <rect x="6" y="30" width="74" height="46" rx="6" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
    <text x="43" y="50">What</text><text x="43" y="64">happened</text>
    <rect x="96" y="30" width="74" height="46" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
    <text x="133" y="50">Direct</text><text x="133" y="64">cause</text>
    <rect x="186" y="30" width="74" height="46" rx="6" fill="#1d6fd1" stroke="#1f2a44" stroke-width="1.5"/>
    <text x="223" y="50" fill="#ffffff">Root</text><text x="223" y="64" fill="#ffffff">cause</text>
    <rect x="276" y="30" width="78" height="46" rx="6" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
    <text x="315" y="50">What</text><text x="315" y="64">changes</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5" fill="#1f2a44">
    <line x1="80" y1="53" x2="92" y2="53"/><polygon points="96,53 89,49 89,57"/>
    <line x1="170" y1="53" x2="182" y2="53"/><polygon points="186,53 179,49 179,57"/>
    <line x1="260" y1="53" x2="272" y2="53"/><polygon points="276,53 269,49 269,57"/>
  </g>
  <text x="180" y="98" font-size="11" text-anchor="middle" fill="#6c7a93">no box for "whose fault" and none for "how bad I felt"</text>
</svg>
```

A failure story told in this shape sounds like an engineer, not a defendant.
:::

::: context integration-step Why a bigger step is faster but wrong
A simulation moves time forward in small jumps called **steps**. At each step it uses the current speed and direction to guess where the vehicle will be a moment later. Smaller steps mean more guesses and more computer time; bigger steps are faster but each guess is cruder, and the errors pile up.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <circle cx="150" cy="120" r="60" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="150" cy="120" r="3" fill="#1f2a44"/>
  <polyline points="210,120 210,90 195,60 165,37.5 123.8,30 78.8,43.1" fill="none" stroke="#b4232c" stroke-width="2"/>
  <g fill="#b4232c">
    <circle cx="210" cy="120" r="3"/><circle cx="210" cy="90" r="3"/><circle cx="195" cy="60" r="3"/>
    <circle cx="165" cy="37.5" r="3"/><circle cx="123.8" cy="30" r="3"/><circle cx="78.8" cy="43.1" r="3"/>
  </g>
  <text x="228" y="150" font-size="12" fill="#1d6fd1">true circular path</text>
  <text x="228" y="46" font-size="12" fill="#b4232c">big steps drift</text>
  <text x="228" y="62" font-size="12" fill="#b4232c">outward</text>
  <text x="180" y="194" font-size="11" text-anchor="middle" fill="#6c7a93">each red step follows the direction at its start</text>
</svg>
```

Here a circular path is followed in steps about a twelfth of a lap long (half a radian), each one heading off in the direction the vehicle was moving at the start of the step. After five steps the red path is about 75 percent farther from the center than the true circle. That is the kind of quiet error the candidate's coarser step let in.
:::

::: context verification-case A test with a known answer
An **analytic verification case** is a problem simple enough that you can work out the exact answer with pencil and paper — for example, a ball thrown with no air, or a satellite in a perfect circular orbit. You run your simulation on it and compare. If the simulation disagrees with the known answer, something inside it is wrong, even if its output looks reasonable.

It is the cheapest safety net in simulation work, which is why skipping it after a numerical change is such a common, and such a costly, mistake.
:::

::: context wind-loads What a wind-loads study is
As a rocket climbs through the atmosphere, wind pushes sideways on it. The faster it flies, the harder the push. A **wind-loads study** runs the vehicle through many wind profiles to find the biggest bending forces on its structure, so engineers can check it will not break.

The results feed decisions about how strong the structure must be and which days are safe to launch. That is why wrong load numbers are a real consequence: two weeks of the teammate's work rested on a simulation that could not be trusted.
:::

::: context regression-test A check that runs itself
Programmers **merge** a change when they add it into the main, shared version of the code. Many teams set up a system that automatically runs a set of tests on every change and refuses the merge if any test fails.

A test that re-runs a stored case and compares against the saved answer is called a **regression test** — it catches the code "regressing", or sliding backward. Its power is that it does not rely on anyone remembering. That is why "it runs automatically" is a stronger ending than "I am more careful now": the first is a machine, the second is a hope.
:::

::: context root-cause Asking "why" one more time
The surface error was "I skipped the test". Ask *why* once more and you reach the real cause: "I had decided the change could not affect the numbers." That deeper answer is the **root cause**.

Toyota made this habit famous as the "five whys": keep asking why until you reach something you can actually fix. Fixing only the surface error would give "remember to run the test"; fixing the root cause gives "never trust my own label for a change — let the test decide", which catches a whole family of future mistakes.
:::

::: context unobservable When the measurements cannot tell
Range-only tracking measures only the distance from the ground station to the satellite. On a nearly straight pass, look along the direction of travel: every point on a circle around the station, at the same distance, would produce exactly the same list of ranges.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="140" x2="340" y2="140" stroke="#6c7a93" stroke-width="1.5"/>
  <path d="M 90 140 A 90 90 0 0 1 270 140" fill="none" stroke="#8fb8f0" stroke-width="2" stroke-dasharray="6 4"/>
  <polygon points="180,140 172,154 188,154" fill="#1f2a44"/>
  <line x1="180" y1="140" x2="180" y2="50" stroke="#1d6fd1" stroke-width="1.5"/>
  <circle cx="180" cy="50" r="6" fill="#1d6fd1"/>
  <line x1="180" y1="140" x2="243.6" y2="76.4" stroke="#b4232c" stroke-width="1.5"/>
  <circle cx="243.6" cy="76.4" r="6" fill="#b4232c"/>
  <text x="170" y="42" font-size="12" text-anchor="end" fill="#1d6fd1">true track</text>
  <text x="254" y="72" font-size="12" fill="#b4232c">same ranges</text>
  <text x="180" y="166" font-size="11" text-anchor="middle" fill="#1f2a44">station (view looking along the pass)</text>
</svg>
```

So one direction of the orbit is **unobservable**: no amount of that data can pin it down. The fitting program is not buggy; it is being asked a question the data cannot answer. Checking the **condition number** — a measure of how close the problem is to having no unique answer — reveals this before you trust the fit.
:::
