---
id: l05-the-failure-story
title: "The failure story, owned without performance"
minutes: 23
covers:
  - "the themes actually probed: a failure and what changed, conflict with a colleague, a decision with incomplete information, a missed deadline, a time you were wrong, ownership beyond your scope, teaching someone, working extended hours"
---

Of the eight themes, this is the one that most often goes badly for a strong engineer, and the reason is structural rather than personal. Every other theme lets you describe work that went well. This one requires you to describe work that did not, in front of someone deciding whether to hire you, with no way to end on a triumph. The instinct to protect yourself is reasonable. It is also, in this specific setting, the thing that costs you the answer.

Start from the fact that the question is not a trap and does not need to be survived. A real failure, honestly owned, is a strong answer — one of the strongest available, because it is the only theme where you can demonstrate that you are able to look at your own work without defending it. That capacity is not a nicety. An engineer who cannot say plainly what went wrong and why it was hers is an engineer who will be slow to raise a problem, and being slow to raise a problem is expensive in a way that no amount of technical strength compensates for.

This lesson covers what makes a failure story usable, the two opposite ways the answer fails, a stress test that tells you before the round whether your story will hold, and how to talk about a failure that was not entirely yours.

## The three properties of a usable failure story

::: key
A usable failure story has a real consequence, a fault that was genuinely yours, and a specific change in how you work now. If the consequence is trivial or the fault belongs to circumstances, the story reads as evasion.
:::

Each of the three earns its place, and it is worth seeing why rather than taking the list on trust.

**A real consequence.** Something happened: time was lost, a result was wrong, a decision was made on bad information, a deadline moved, someone else's work had to be redone. Without a consequence there is nothing to have learned from, and a story whose worst outcome is that you were briefly inconvenienced answers a different, much easier question than the one asked. The consequence is also what makes the rest credible: a change in practice is only interesting if it was bought with something.

**A fault that was genuinely yours.** Not the circumstances, not the requirements that moved, not the teammate who was late. A story in which the failure belongs to the situation does not tell the listener anything about you, and it has a second problem: it reads as an account of a failure in which the narrator was the only reasonable person present, which is rarely how failures actually go.

**A specific change in how you work now.** Specific means a reader could check it. "I am more careful now" is not a change; "every project I have started since has a stored nominal case that any change has to reproduce, and it runs before I can merge" is. The change is the part that makes the story about the present rather than the past, and it is the only part that predicts anything.

## Two ways to get it wrong, pulling in opposite directions

**Minimising** keeps the failure small enough to be safe. It has recognisable shapes. The disguised strength — the failure that is really a virtue, working too hard, caring too much, being too thorough — which answers a question nobody asked and signals that you did not want to answer the one that was. The trivial consequence, where the whole cost was a few hours of your own time. The passive voice, in which the schedule slipped and mistakes were made and nobody appears to have done anything. And the creeping context: a sentence of background, then another, until the listener understands that in fairness the requirements had changed and the data arrived late and really the failure was inevitable. Each of these leaves the same hole. Nothing has been owned, so nothing has been shown.

**Performing contrition** goes the other way, and it is the less obvious error. This is the answer that supplies the emotional weight the situation seems to call for: how terrible you felt, how much you let people down, how long it bothered you. The problem is not that the feeling is false. It is that the answer has become about managing your feelings rather than analysing the event, and it puts the listener in the position of reassuring you, which is not a position an interviewer can occupy. It also crowds out the analysis: the more space the remorse takes, the less there is for what actually went wrong and what changed.

The register you want is the one you would use in an anomaly review or a post-mortem with colleagues you respect. Factual, unhurried, specific about causes, uninterested in blame including your own, and focused on what the finding changes. You would not open a post-mortem by apologising, and you would not close it by explaining that circumstances made the outcome unavoidable. You would say what happened, what caused it, and what is different now.

::: warning The disguised strength is heard as a refusal
"My biggest failure is that I take on too much" is not a small answer to the question; it is a signal that the question is not going to be answered. This module lists the inability to name a real failure among the behavioural red flags, and groups it with blaming others and inflating your contribution under a single heading: an unwillingness to be accountable. That is a heavier reading than the evasion itself would seem to merit, which is exactly why it is worth knowing about in advance.
:::

## The stress test

This module's fourth exercise is a test you can run before the round, and it is the fastest way to find out whether a story will hold. Have someone push on it three times.

1. **What was the actual consequence?** Not what could have happened — what did.
2. **What specifically was your fault, rather than the circumstances?**
3. **What would happen differently today?**

The pass condition is that the story survives all three without you softening it. The failure signal is specific and easy to notice from the inside: if, under the second question, you find yourself adding context that shifts blame, the story is not the right one. Not because adding context is dishonest — the context may be entirely true — but because a story you can only tell with a defence attached will be told with a defence attached, and a defence is what the listener will remember.

Run the test on paper first and out loud second. The out-loud version is where the softening happens.

## Choosing which failure

Three practical constraints.

**Recent enough to be relevant, old enough that the change has been tested.** A failure from last week has no evidence that anything changed. A failure from seven years ago invites the question of what you have done since.

**A failure of judgement or practice, not of integrity.** The question is about engineering: a decision you got wrong, a check you skipped, a risk you misjudged, a thing you assumed. If the only real failure you can think of is one that raises a question about honesty or about deliberately bypassing a safety or process discipline, understand that you are answering a different question than the one asked, and that this module does not tell you how such an answer is weighed. Choose the engineering failure if you have one.

**One where the change is checkable.** The strongest closing sentence points at something that exists: a test that runs, a checklist, a habit visible in your own repository history. That turns the last twenty seconds from an assurance into evidence.

## The failure that was not only yours

Most real failures have several causes and several people. The rule that keeps the story honest without making it a confession of things you did not do: **describe your share fully, mention other causes once and factually, and never let another person carry the explanation.**

One factual mention is usually fine and sometimes necessary for the story to make sense — "the tolerance I was given turned out to be for a different revision of the part" is a fact. What turns it into blame-shifting is repetition, emphasis, or placing it at the end where the conclusion goes. The end belongs to your share.

A useful test before you commit a story to the bank: if the other person were in the room listening to your account, would they recognise it as fair? If the answer is no, the story is not ready, whatever its technical merits.

::: example One failure, three versions
The event: the candidate rewrote the inner loop of her 6-DOF simulation in C++ for speed. In doing so she changed the default integration step, did not re-run the analytic verification case afterwards, and a teammate spent two weeks on a wind-loads study using results from the faster, coarser build.

**Minimised:**

"I suppose the main one would be the C++ rewrite of my simulation. It was a big job, and honestly the Python version was never going to be fast enough for the campaign sizes we needed, so it had to happen. There was a bit of a hiccup afterwards where some of the numbers moved slightly, which took a little while to track down — partly because the verification case was quite slow to run at the time and we were under time pressure before the showcase. It all got sorted out in the end and the rewrite was definitely the right call."

Nothing here is false and nothing here is owned. *A bit of a hiccup*, *some of the numbers moved slightly*, and a consequence that is never stated. Two sentences of context arrive exactly where the fault should be, and the answer closes by confirming the decision was correct — which is a defence of the work rather than an account of the failure.

**Performed:**

"That would be the C++ rewrite. I still think about it, honestly. I broke the integration step and did not check, and a teammate lost two weeks of work because of me — he was so decent about it, which somehow made it worse. I felt sick when I realised. I have never been more embarrassed about anything I have built, and I promised myself I would never be that careless again. It really shook my confidence for a while."

The consequence is stated and the fault is owned, so this is already better than the first version. But two-thirds of the words are about the candidate's feelings, and there is nothing at the end except a promise. *Never be that careless again* is an intention, not a change, and nothing in the answer tells the listener what is different about how she works now. It also asks the listener to do something with her distress, which is not available to them.

**Owned:**

"The clearest one is from my 6-DOF simulation. I rewrote the integration inner loop in C++ for speed, and while I was in there I changed the default step size — I had been tuning for throughput and the coarser step was part of how I got the speed-up. I did not re-run the analytic verification case afterwards. It took about forty minutes to run and I had convinced myself it was a performance change rather than a numerical one, which was the actual mistake: I had decided what kind of change it was instead of testing it.

A teammate used that build for a wind-loads study, and the load numbers were off by enough to matter. He lost about two weeks of work, and I found out because his peak loads disagreed with an earlier run of mine and he came to ask me why.

What is different now is concrete. Every project I have has a stored nominal case with its trajectory committed, and any change has to reproduce it to a stated tolerance before I will merge it — it runs automatically, so it is not a thing I have to remember to be careful about. I also stopped trusting my own classification of a change as performance-only, which is the part I would say is the real lesson: I was not careless with the test, I was confident about which tests the change needed."

**What the third version has that the second does not:** a consequence with a size, a fault stated in one sentence with no cushioning, a diagnosis one level deeper than the surface error — the mistake was the classification, not the skipped test — and a change that exists as an artefact rather than as a resolution. It is also shorter than it feels, because none of it is spent on management of the listener's impression.
:::

::: example The stress test, run on a story that does not survive
**The story:** "On my orbit-determination project the Gauss-Newton fit kept diverging, and I spent a whole afternoon hunting for a bug in the Jacobian that was not there. The problem turned out to be the tracking geometry — range-only data from a single station on a nearly straight-line pass, so one state direction was essentially unobservable. I check the conditioning of the normal matrix before I trust a fit now."

**Push one — what was the actual consequence?** "I lost an afternoon."

That is where this story stops being a failure story. An afternoon of your own time, on your own project, with no downstream effect, is not a consequence in the sense the question means. It is the ordinary friction of doing engineering.

**Push two — what specifically was your fault?** "I assumed it was a code problem rather than checking whether the problem was well posed."

That part is genuinely good, and it is a real diagnosis. But notice what happens when you try to attach it to push one: the fault is real and the consequence is not, which leaves a story that reads as an engineer demonstrating a debugging habit. Which it is. It is a fine answer to *tell me about a time you were wrong*, and a weak answer to *tell me about a failure*.

**The two ways forward.**

*Move the story to the theme it actually fits.* It is a clean "time you were wrong" story: a held belief, evidence against it, a changed practice. Keep it there, where the absence of a large consequence is not a defect.

*Or find the version with a consequence.* If the same habit later cost something real — a fit she reported as converged that carried enormous uncertainty in a poorly observed direction, and which someone else used — that is the failure story, and the condition-number habit becomes its closing change rather than its whole point.

**What not to do:** inflate the afternoon. Adding "and it delayed the project" when it did not is the fastest route to a story that collapses under push one asked twice, and the collapse costs incomparably more than having a modest failure story would have.
:::

## Check yourself

::: check
A candidate answers the failure question with: "I once spent three weeks optimising a piece of code that turned out not to be the bottleneck." Test it against the three properties.
:::

::: answer
Consequence: three weeks of the candidate's own effort, with no stated effect on anyone else or on the project's outcome — weak, though not empty if those three weeks displaced something that mattered, which the answer does not say. Fault: genuinely hers, and clearly stated, since nobody told her to optimise the wrong thing. Change: entirely absent as given. The story is salvageable in two moves — state what the three weeks cost the project, and end on what she does now, for example that she profiles before optimising and can point to the measurement that now precedes that kind of work. Without those it is a small, honest, unfinished answer.
:::

::: check
Why does this lesson treat performed contrition as a failure mode, when it at least involves admitting fault?
:::

::: answer
Because admitting fault is necessary and not sufficient. The answer has a job — to show what went wrong, why it was yours, and what is different now — and remorse displaces all three. It also changes the listener's role from assessor to reassurer, which is a position they cannot take up in an interview, so the discomfort lands on the conversation rather than on the analysis. And it ends on an intention rather than a change: "I will never be that careless again" predicts nothing, while "the nominal case runs before I can merge" predicts something checkable. The register that works is the post-mortem register: factual, specific, uninterested in blame including your own.
:::

::: check
Your failure had three causes, only one of which was yours. How do you tell it?
:::

::: answer
Describe your share fully, mention the other causes once, factually, and never place one of them at the end. A single sentence of the form "the tolerance I was working from turned out to belong to a different revision" is a fact the story may need to make sense; what converts it into blame-shifting is repeating it, leaning on it, or putting it in the conclusion, where the listener reads it as the explanation. The end belongs to what you did and what changed. Before the story goes in the bank, run the fairness test: if the other people involved heard your account, would they recognise it as fair? If not, it is not ready.
:::

::: check
Why is "I am much more careful now" a weak close, even when it is true?
:::

::: answer
Because it is unfalsifiable and it asks the listener to take the change on trust, which is the one thing a failure story cannot do — the whole point of the change is to be the evidence that the failure was metabolised. A checkable close names something that exists: a test that runs automatically, a check that precedes a class of work, a habit visible in your history. It is also more robust under follow-up, since "how do you know it stuck?" has an answer. A change built into a process rather than into your intentions is stronger still, for the reason the strong version in this lesson gives: it does not depend on remembering to be careful.
:::

::: check
An interviewer pushes back on your failure story with: "That does not sound like it was really your fault." What is going on, and what do you do?
:::

::: answer
Two readings, and you should be able to tell them apart. The first is that the push is a genuine test of whether you will take the exit — in which case taking it is the wrong move, and the right response is to restate the fault plainly: "the circumstances made it easier to get wrong, but the call was mine and I made it without checking." The second is that you actually chose a story where the fault is thin, and the interviewer is telling you so; in that case the honest response is to say which part was genuinely yours and, if the answer is not much, to offer a different story. What you should not do is accept the exit gratefully and move on, because the story then has no fault in it at all and you have demonstrated the opposite of what the theme is for.
:::

::: check
Why does this lesson say a failure story should be old enough for the change to have been tested, and what would you say about a failure that happened a month ago?
:::

::: answer
Because the closing element is a change in how you work, and a change made last month has no track record — the honest statement is that you have adopted it, not that it has held. If the most recent failure is genuinely the best one you have, say exactly that and be precise about the state of the evidence: "this was six weeks ago, so what I can tell you is what I have changed and that it has held on the two things I have built since, not that it has been tested for a year." That is accurate, it distinguishes an adopted practice from a proven one, and the precision itself is worth more than a larger claim would be.
:::

## Summary

| Element | What it must contain | How it fails |
| --- | --- | --- |
| Consequence | Something that actually happened, with a size | Trivial, or never stated |
| Fault | One sentence, yours, uncushioned | Circumstances, passive voice, creeping context |
| Diagnosis | Why you got it wrong, one level below the surface error | Stops at the visible mistake |
| Change | An artefact or practice a reader could check | An intention, or "more careful now" |
| Register | Post-mortem: factual, specific, unsentimental | Minimising at one end, performed remorse at the other |

The stress test is three pushes — what was the consequence, what specifically was your fault, what would happen differently today — and a story that needs a defence attached to survive them is the wrong story. The next lesson takes the other theme where the obstacle is a person: describing a disagreement with a colleague or a manager without making them the villain of it.
