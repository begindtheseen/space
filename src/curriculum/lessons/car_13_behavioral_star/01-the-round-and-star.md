---
id: l01-the-round-and-star
title: "What the behavioural round is asking for"
minutes: 23
covers:
  - "STAR structure: Situation, Task, Action, Result, and the common failure of spending most of the answer on Situation"
---

By the time you reach a behavioural round you have spent weeks on the technical ones. You have a ninety-second narrative, a résumé you can be interrogated three questions deep on, a past-project talk with an appendix of backup material, and a way of saying *I do not know* that does not collapse the conversation. Then someone asks you to tell them about a time you disagreed with a colleague, and all of that preparation is suddenly irrelevant, because this is a different question.

It is a different question, and it is still a question. That is the thing worth getting straight before anything else in this module. A behavioural round is not the friendly part between the real interviews, and it is not a personality test you either pass by being likeable or fail by being quiet. It asks for specific past behaviour — what you actually did, in a real situation, that the interviewer can follow and check — and answers to that vary enormously in quality for reasons that have very little to do with charm. Two engineers with the same history can give the same story, and one of them lands and the other does not, because one answer is structured to carry evidence and the other is a recollection delivered out loud.

This lesson gives you the structure everyone in this space calls STAR, the time budget that makes it work, and the specific way the structure fails when it is left to improvisation. The rest of the module builds on it: the stories themselves, the numbers that make them checkable, the themes to prepare against, and the questions about hours and pace that are not stories at all.

## What this round is, and what this curriculum does not know about it

Be careful about what you believe you know here. This module tells you what the themes are, what the reported red flags are, that job postings state an extended-hours expectation in plain language, and what makes an answer strong or weak. It does not tell you — and neither does this lesson — how long the behavioural round runs, who conducts it, whether it stands alone or is threaded through the technical conversations, how many questions you get, whether anything is written down, or how the round is weighted against the others. Those things vary, and the person who can tell you how they work for your process is your recruiter. The recruiter screen, covered earlier in this track, is the natural place to ask.

What follows is therefore about the *content and shape of your answers*, which is entirely within your control, and not about a process you would be guessing at. That is the right division. An answer built to the standard below works in a thirty-minute round with one interviewer or a ten-minute stretch inside a technical conversation, because what makes it strong does not depend on the container.

## The four parts

STAR is Situation, Task, Action, Result. Four parts, in that order, and each one has a job that the others cannot do.

**Situation** is the minimum context the listener needs to follow what comes next: the system, the constraint, the stakes. Not the organisation chart, not the timeline, not the history of how the project came to exist.

**Task** is what was on *you* specifically. It is the sentence that separates your responsibility from everyone else's, and it is the part most often collapsed into the Situation and lost. "The campaign had to run before the design review" is a situation. "I owned the dispersion set and the pass criterion" is a task.

**Action** is what you did and, critically, *why you decided to do that rather than something else*. This is the longest part and the part being assessed. An Action section that lists steps in sequence is weaker than one that names two or three decisions and the reasoning behind each, because steps are what anyone on the project could recite and decisions are yours.

**Result** is what happened, stated in a way the listener can check, plus what you took from it. It is short, it is last, and it is the part candidates run out of time for.

::: key
STAR is Situation, Task, Action, Result. The common failure is spending most of the answer setting the scene. Aim for roughly 20 percent Situation and Task, 60 percent Action in the first person singular, and 20 percent a quantified Result.
:::

## Where the ninety seconds go

The stories in this module are built to run about ninety seconds each, which the next lessons will make concrete. Ninety seconds of ordinary speech is roughly two hundred words — measure your own rate rather than trusting a number, using the method from this track's ninety-second-narrative lesson, because a rate you measured is a budget you can edit against and a rate you assumed is not.

Split that budget in the proportions above and you get something usefully unforgiving: about forty words for Situation and Task together, which is two sentences; about a hundred and twenty words for the Action, which is four to six sentences; and about forty words for the Result, which is one sentence with a number in it and one sentence saying what it meant.

Two sentences of scene-setting feels far too little while you are writing it. That feeling is the whole problem, and it is worth understanding rather than overriding by willpower.

## Why the scene runs long

The module names the failure — most of the answer spent on Situation — and it is worth reasoning about the mechanism rather than repeating the observation, because knowing *why* it happens tells you where to cut.

Setting the scene is the only part of a STAR answer that makes no claim about you. Describing a system is comfortable, unfalsifiable and familiar: it is the same act as explaining your project to a colleague, which you have done hundreds of times. The moment you reach the Action you have to say *I decided*, and every sentence after that is a claim someone might disagree with. So the scene expands to fill the space in front of the uncomfortable part. Add to that the fact that ninety seconds feels generous for the first twenty of them and you have an answer that arrives at the Action with thirty seconds left and reaches the Result never.

The consequence is not that the answer sounds bad. It is that the answer contains no evidence. Everything the listener could use — what you decided, what you rejected, what it cost, what happened — lives in the two parts that got cut.

::: warning Task and Action are not the same sentence
"I was responsible for the Monte Carlo campaign" is a Task. "I re-ran the campaign with the wind model dispersed and found the case that broke the gain schedule" is an Action. Candidates who conflate them tend to state the responsibility and then move to the Result, skipping the decisions entirely — which reads as a description of a job rather than of work. If your Action section can be reordered without becoming false, it is a list of duties, not a sequence of decisions.
:::

## Why the Result is the part that shows judgement

The Result is short, so it is easy to treat as a formality: the place where you say it worked and stop. It is not a formality. It is the only part of the answer where you evaluate your own work.

Consider what the other three parts can and cannot establish. Situation and Task establish that a problem existed and was yours. Action establishes what you did. None of that says whether what you did was any good — an engineer can make a long sequence of confident decisions and produce something that does not work, and the Action section alone reads identically in both cases. The Result is where you say how it came out, against what standard, and whether that met the bar you set beforehand. That is judgement, and it is what distinguishes an engineer who measures outcomes from one who assumes them.

This is also why a Result has to be more than *and it worked*. Worked against what criterion, measured how, compared with what baseline? The next lesson but one is entirely about that question. For now, treat the last twenty seconds of every story as non-negotiable, and protect them by cutting the scene.

::: example The same story, told twice
The question: *Tell me about a time you had to make a technical judgement call with limited information.*

**Weak version — about a hundred and ninety words, and the Result never arrives:**

"So this was a six-degree-of-freedom launch vehicle simulation I built. It started as a smaller project, originally just a three-degree-of-freedom trajectory tool, and over a few months it grew into a full 6-DOF with rotational dynamics, an atmosphere model, propulsion, all of that. The structure of it is a Python outer layer with the integration inner loop in C++ for speed, and I had a configuration system so you could swap vehicle definitions. Around the middle of it I got to the point where I needed to decide about the atmosphere model, because I had been using an exponential atmosphere up to then, which is the standard quick model, and there was a question about whether that was good enough or whether I needed something layered, and there is quite a lot of literature on this. It is a real question because the whole dynamic pressure profile depends on it. So I looked into it, and in the end I went with a layered model, and it worked out well — the simulation gave sensible results after that."

**Strong version — about two hundred words, same project, same facts:**

"I was building a 6-DOF launch vehicle simulation, and I had to decide whether an exponential atmosphere was good enough or whether I needed a layered hydrostatic model. Nobody had specified a requirement — it was my project, so the requirement was mine to set.

I started from what the model was for. The simulation's main output was a dispersion campaign around max dynamic pressure, so the question was not whether the atmosphere was accurate in general but whether it was accurate where the loads are. I coded both and compared them against the same altitude grid. Through the max-Q region the two agreed to within about five percent on dynamic pressure, which I could have lived with — but the exponential fit was roughly thirty percent high by twenty kilometres and close to a factor of two by thirty, and my vehicle was still under thrust up there. So the error was not in the region I had been worried about; it was above it, in the region I had not checked.

I went with the layered model and wrote the comparison into the assumptions section. The result is that the dynamic-pressure profile above twenty kilometres is now trustworthy to the same standard as the profile below it, and the limitation I would have shipped without checking is documented rather than hidden."

**What is different:** the facts are identical. The weak version spends a hundred and thirty of its hundred and ninety words on how the project grew and how it is built, arrives at the decision with two sentences left, and resolves it with *it worked out well*, which is not a result — nobody can check it and nothing follows from it. The strong version gives the scene two sentences, spends the middle on the reasoning that was actually the candidate's own (what is the model for, what would make it inadequate, how did I test that), and closes on a specific outcome plus what it changed. Notice too that the strong version admits the check found something the candidate was not looking for. That costs nothing and reads as a person who ran the test honestly.
:::

::: example An answer that stops at "and then it shipped"
**Candidate's Result, as given:** "...so I fixed the propagation and re-ran it, and after that everything was fine and we used it for the rest of the project."

**Why this leaves the answer unfinished:** the listener now knows a problem existed and was addressed. They do not know how bad it was, how the candidate established it was fixed rather than hidden, or what the fix cost. Nothing in the sentence could be false, and nothing in it is evidence.

**The repair, same story, three sentences longer:** "...so I fixed the propagation and re-ran it. The filter had been reporting a covariance about a factor of three tighter than its actual error, which is the kind of overconfidence that quietly poisons anything downstream that trusts it — so I did not take *looks better* as the test. I ran a hundred-run Monte Carlo and checked the normalised estimation error squared against its chi-square band, and after the fix the average sat inside the band where before it had been well above the upper limit. The habit I took from it is that I now write the consistency test before the filter, not after, because I would not have caught this by looking at the error plot."

**What the repair adds:** a measured statement of how wrong it was, a named standard for *fixed*, the evidence that the standard was met, and a change in practice. It is the same event. The difference is that the second version can be checked and the first cannot, and the candidate in the second version is visibly the one who chose the standard.
:::

## Delivery: prepared, not memorised

A story you have written and timed will sound prepared, and that is fine — the alternative is not spontaneity, it is rambling. What you want to avoid is recitation: the flat, slightly fast delivery of someone retrieving a memorised paragraph, which is audible and tends to fall apart the moment a follow-up question knocks it off the rails.

The practical form is to memorise the *skeleton* and not the words: the two-sentence scene, the two or three decisions in order, the number at the end. Say it aloud five times and it will come out differently each time and be the same story each time. That is what you want, because the follow-up questions are the real conversation, and an answer you can be interrupted in is worth more than one you can only deliver intact.

## Check yourself

::: check
A candidate's answer to *tell me about a time you had to work with an unclear requirement* runs a hundred and ten seconds, of which about eighty describe the project and the team, twenty describe what she did, and ten say the outcome was good. She is told to make the answer shorter. What is the wrong fix, and what is the right one?
:::

::: answer
The wrong fix is to compress everything proportionally — a shorter version of the same answer, with the scene still taking three-quarters of it. That preserves exactly the flaw. The right fix is to cut the scene to two sentences, which frees roughly forty-five seconds, and spend every recovered second on the Action and Result: what she decided, what the alternatives were, what happened, measured how. The answer gets shorter and simultaneously carries more evidence, because the parts that were cut were the parts carrying none.
:::

::: check
Why does this lesson claim the Result shows judgement, when the Action is the part where the candidate makes decisions?
:::

::: answer
Because the Action section reads the same whether the decisions were good or bad. A confident, well-narrated sequence of choices that produced a system which did not meet its requirement sounds, in the Action alone, exactly like one that did. The Result is where you state the outcome against a standard — what the criterion was, what was measured, whether it met the bar you had fixed in advance. Naming that standard, and reporting the number even when it is not flattering, is the part that shows you evaluate your own work rather than assuming it turned out well. An answer with no Result asks the listener to take the quality of your judgement on trust.
:::

::: check
Convert this into a Task sentence: "The project was a batch least-squares orbit determination fit to two-line-element-derived positions, and there were four of us on the club team."
:::

::: answer
It is not a Task at all — it is Situation, and thin Situation at that, since the number of people on the team does not help the listener follow anything that comes next. A Task sentence names what was on you: for instance, "I owned the estimator itself — the Gauss-Newton iteration, the convergence criteria and the covariance we reported." The test is whether the sentence draws a line between your responsibility and everyone else's. If someone else on the team could say the same sentence about themselves, it is not a Task.
:::

::: check
You have a story whose honest Result is that the thing did not work. Does STAR still apply, and what goes in the last twenty seconds?
:::

::: answer
It applies unchanged. The Result is the outcome measured against the standard, and *it did not meet the criterion* is an outcome. What goes in the last twenty seconds is the measured shortfall, how you established it, and the specific consequence or change that followed — that you stopped the approach and why, or what you would need to have done differently for it to have worked. What does not go there is a rescue: a sudden reframing of a failure as a success, or a general lesson about perseverance. The failure story is important enough that a later lesson in this module is devoted to it.
:::

::: check
An interviewer interrupts you forty seconds into a story to ask what the pass criterion was. Have you lost control of the answer?
:::

::: answer
No — the interruption is the conversation working. Answer the question at the depth asked, then return to where you were, which you can do because you memorised the skeleton and not a paragraph. Two things are worth noticing. First, a question at forty seconds usually means the scene was long enough and the listener wants the substance, so take it as a signal about your budget. Second, the question asked for exactly the kind of detail the Result section was going to carry — which is a sign the story is pointed at something the interviewer finds worth probing. Trying to finish your prepared sentence before answering is the only way this goes wrong.
:::

::: check
Why does this lesson tell you to memorise the skeleton rather than the sentences, given that a rehearsed paragraph would be more polished?
:::

::: answer
Because polish is not what is being assessed and fragility is a real cost. A memorised paragraph has two failure modes: it sounds recited, and it does not survive being interrupted — which it will be, since follow-up questions are the normal shape of this round. A skeleton of two-sentence scene, two or three decisions, one measured outcome gives you the same content every time in slightly different words, lets you take an interruption and come back, and lets you stretch or compress the story to fit the time you are given. The one thing worth fixing word for word is the number in the Result, because that is the part you do not want to approximate on the spot.
:::

## Summary

| Part | Share of ninety seconds | Its job | How it fails |
| --- | --- | --- | --- |
| Situation | Two sentences, with Task | System, constraint, stakes — nothing else | Expands to fill the answer |
| Task | Part of those two sentences | Separates your responsibility from the team's | Collapsed into Situation and lost |
| Action | About sixty percent | The decisions you made and why | Becomes a list of steps or duties |
| Result | About twenty percent | Outcome against a standard, with a number | Never arrives, or is "it worked" |

The mechanism behind the common failure is that the scene is the only part that makes no claim about you, so it grows in front of the part that does. The next lesson takes the Action section on its own and deals with the other structural failure in it: describing work you did in the first person plural, which makes your contribution unassessable no matter how good the rest of the answer is.
