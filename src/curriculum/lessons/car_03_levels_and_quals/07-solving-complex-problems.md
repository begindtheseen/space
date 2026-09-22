---
id: l07-solving-complex-problems
title: "What 'little to no supervision' is actually testing"
minutes: 17
covers:
  - what capable of solving complex problems with little to no supervision is testing
---

Across the postings this module has already covered, some version of a phrase like "capable of solving complex problems with little to no supervision" recurs among the preferred qualifications. It is worth pausing on this one specifically, separate from the technical items lesson four worked through, because it is a different kind of claim entirely — not a subject you can point to and say you know, like filtering or fault management, but a claim about how you work, which cannot be verified the way a degree field or a language can. This lesson works out exactly what that phrase is asking, where it actually gets evaluated, and why the same underlying project can demonstrate it or fail to, depending only on how you describe it.

Treat this phrase as typical language of this kind rather than a fixed, universal formula — different postings phrase the same underlying expectation differently, and not every posting states it at all. What follows is how to read it wherever some version of it appears, not a claim that these exact words appear on every posting in this role family.

## Why a phrase like this can't be screened from a résumé

Everything this module has examined so far under basic qualifications — a degree field, a count of years, a named language — is a fact a candidate either has or does not have, checkable from a document with reasonable confidence. "Capable of solving complex problems with little to no supervision" is not that kind of fact. Nothing on a résumé proves it directly; a bullet point claiming it proves nothing more than the claim itself. That is exactly why this phrase lives under preferred qualifications rather than basic ones, and why, as the first lesson of this module established, preferred qualifications generally get evaluated later in the pipeline, through conversation, rather than at the cheap first-pass filter. A claim about how someone works can only really be tested by asking them to describe how they actually worked, in enough detail that the description itself becomes evidence — which takes a real interview, not a résumé scan.

## What it is actually testing

Read precisely, the phrase is asking about three specific things, not one vague quality of "independence." **Scoping an ambiguous problem** — given a situation that has not been fully defined for you, can you work out what the actual problem is before trying to solve it? **Choosing an approach** — among genuinely different ways to tackle that problem, can you pick one and explain what made it the right choice, rather than the only one you knew? **Defending the choice** — under real questioning, including about the alternatives you did not take, can you hold up your reasoning rather than retreat to "that's just what I did"?

Set against that, the phrase explicitly contrasts with "executing a specified task" — being handed a fully defined problem, with the approach already decided by someone else, and carrying out the known steps competently. Executing a specified task well is a real and valuable skill, and nothing about this phrase says otherwise. But it is not what this specific qualification is asking about, and a candidate who only has stories about executing well-specified tasks, however impressively, has not yet shown the thing this phrase is actually probing.

::: key
"Capable of solving complex problems with little to no supervision" asks whether you can scope an ambiguous problem, choose an approach among real alternatives, and defend that choice — not whether you can execute a task someone else has already fully specified.
:::

## Where this actually gets evaluated

The evaluation for this kind of claim generally happens in two related but distinct interview formats. A **past-project deep dive** is a conversation built around something real you did — not a hypothetical, a specific project, walked through in enough detail that an interviewer can ask about decisions, not just outcomes. **Behavioral interviewing** more broadly asks structured questions about past experience — often some version of "tell me about a time when..." — on the premise that how you actually handled a real situation predicts how you will handle a similar one again. Both formats share the same underlying logic: past decisions, described in enough detail to be examined, are better evidence of how someone works than a general self-description ever could be.

This is worth connecting back to a point the previous lesson on Sr. GNC Engineer made explicitly: what counts as "complex" and what counts as "little supervision" is not one fixed, absolute bar applied identically at every level. A Level I to II candidate demonstrating this quality on a bounded, subsystem-level decision — which sensor-fusion approach to use for one component, and why — is showing exactly the thing this phrase asks for, at a scope appropriate to that level. A senior candidate demonstrating the same underlying quality on a mission-level architecture choice, weighing tradeoffs that affect an entire program, is showing the same quality at a scope appropriate to that level instead. Interviewers can reasonably be expected to calibrate what "complex" means to the level of the specific requisition being filled, rather than holding every candidate to one fixed, level-independent standard — though exactly how any one interviewer does that calibration in practice is not something this module has specific information about.

## A practical way to prepare

The standard, well-established technique for this kind of interview is worth stating plainly rather than assuming it is obvious: before the interview, identify two or three concrete stories from your own project or work history — not hypothetical, not borrowed — and for each one, be ready to state clearly what the actual ambiguity was, what real alternatives existed, which one you chose, and why. The "why" matters as much as the "what": a story that only describes what was built demonstrates execution; a story that also describes what was not built, and the reasoning that ruled it out, demonstrates the scoping-and-choosing quality this phrase is actually asking about.

::: warning Narrating assigned steps is not the same as demonstrating this quality
A common trap is describing a project by listing the steps you were told to do, or the steps a tutorial or an existing codebase's established pattern told you to do, even when the underlying technical work was genuinely difficult. A technically accurate account that never mentions a choice you made among real alternatives inadvertently demonstrates the opposite of what this phrase is testing — competent execution of a specified task, not ownership of an ambiguous one. The fix is not to exaggerate the story; it is to notice, honestly, whether a real choice existed in the work you already did, and to be ready to name it.
:::

::: warning This isn't a box you either check or don't
Unlike a degree field or a language, this quality is not something you either "have" or "lack" in the abstract — it is demonstrated entirely through the specific stories you bring to an interview and how clearly you tell them. Two candidates with genuinely similar underlying experience can leave very different impressions, because one arrived with a specific, examined story and the other did not think to prepare one at all.
:::

::: example Two accounts of the same kind of project
Two candidates each describe building a Monte Carlo dispersion analysis tool in Python. Candidate A says: "I was asked to add a dispersion tool to our simulation. I followed the existing pattern already used elsewhere in the codebase and had it working in about two weeks." Candidate B says: "The team needed dispersion analysis, and there were two reasonable ways to get it: extend our existing single-threaded Monte Carlo script, or build out a parallelized framework the team had discussed but never actually built. I chose to extend the existing script first, because building the parallel framework would have cost more time than the analysis deadline allowed, with a plan to revisit that decision if the required sample count outgrew what the single-threaded version could handle in time — which it did about six weeks later, at which point I built the parallel version."

The underlying technical difficulty in the two accounts might be genuinely comparable. What differs is what each account demonstrates. Candidate A's story is a clean, honest description of executing a specified task competently. Candidate B's story shows the same three things this phrase is asking about directly: an ambiguity that had to be scoped (which approach to build first), a choice among real alternatives with a stated reason, and a decision that was later revisited on its own stated terms rather than treated as final. An interviewer hearing both would reasonably read B's account as stronger evidence of this specific quality, independent of which tool was objectively harder to build.
:::

::: example The same quality, shown at two different scopes
A Level I to II candidate describes choosing between two filter-tuning approaches for a single sensor on an already-flying vehicle, after noticing the existing tuning produced noisy estimates under a specific flight condition — a bounded, subsystem-level decision, made largely independently, with a clear account of why the chosen approach was preferred over the alternative. A Sr. GNC Engineer candidate describes choosing the overall state-estimation architecture for a new vehicle program from its earliest design stage, weighing long-term maintainability across multiple future teams against a tighter near-term schedule, in a decision that shaped work for people well beyond themselves.

Both stories demonstrate scoping, choosing, and defending — the same three things this lesson identified as what the phrase is actually testing. What differs is scope, not kind: the Level I to II story is appropriately sized to that level's actual responsibilities, and would not be a weak account simply for being smaller than the senior story. An interviewer evaluating a Level I to II candidate against a mission-architecture story would be applying the wrong bar, not a more rigorous one.
:::

## Check yourself

::: check
State, in your own words, what "capable of solving complex problems with little to no supervision" is actually testing.
:::

::: answer
It is testing three specific things: whether you can scope an ambiguous problem that was not handed to you fully defined, whether you can choose an approach among genuinely different alternatives and explain what made it the right one, and whether you can defend that choice under questioning, including about the alternatives you did not take. It is not testing whether you can competently execute a task someone else already specified.
:::

::: check
Why can't this kind of qualification be evaluated at the cheap, early résumé-screen stage the way a degree field or a years-of-experience line can?
:::

::: answer
A degree field or a years count is a fact that either holds or does not, checkable with reasonable confidence from a document. A claim about how someone works cannot be verified from a bullet point — the bullet point claiming it proves nothing beyond the claim itself. It can only be tested by hearing someone describe a real situation in enough detail that the description becomes evidence, which requires an actual conversation, not a document scan.
:::

::: check
Contrast "executing a specified task" with the three things this phrase is actually probing.
:::

::: answer
Executing a specified task means carrying out a fully defined problem using an approach someone else already decided — a real and valuable skill, but a different one. The phrase is instead probing scoping an ambiguous problem yourself, choosing among real alternatives, and defending that choice under questioning — none of which is demonstrated by describing how well a pre-specified task was carried out, however competently.
:::

::: check
Explain why the same underlying technical project might be described in a way that demonstrates this quality, or in a way that fails to, depending only on how it is narrated.
:::

::: answer
The quality lives in the decisions made during the work, not in the work's technical difficulty by itself. A narration that only describes what was built and how — following an existing pattern, completing the known steps — demonstrates competent execution regardless of how hard the underlying task was. A narration of the same project that also names a real alternative that was considered and explains why it was not chosen demonstrates scoping and choosing directly. The technical substance can be identical; what differs is whether the account surfaces a decision at all.
:::

::: check
How does what counts as "complex" and "little supervision" change between a Level I to II candidate and a Sr. GNC Engineer candidate, and why doesn't that mean the phrase is testing something different at each level?
:::

::: answer
The scope of an appropriate story changes with level — a Level I to II candidate's strongest example is typically a bounded, subsystem-level decision, while a senior candidate's strongest example typically reaches further, to mission- or program-level architecture. What stays constant across both is the underlying quality being tested: scoping an ambiguity, choosing among real alternatives, and defending the choice. The phrase means the same thing at every level; only the appropriate scale of evidence for demonstrating it changes.
:::

## Summary

| Component | What it means | Where it is evaluated |
| --- | --- | --- |
| Scoping | Defining the actual problem when it was not handed to you fully specified | Past-project deep dive |
| Choosing | Picking an approach among genuinely different alternatives, with stated reasons | Behavioral and technical interview rounds |
| Defending | Holding up that reasoning under direct questioning, including about paths not taken | Interview follow-up questions |
| Contrast | Executing a specified task is a different, also valuable, skill this phrase is not asking about | — |

The next lesson pulls everything this module has covered together into the question this module opened with: which level should you actually be targeting, how a recruiter and hiring manager arrive at that judgment, and how to run an honest self-assessment against the specific lines this module has now walked through in full.
