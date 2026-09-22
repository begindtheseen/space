---
id: l09-reading-the-difficulty-rating
title: "What a 2.8 out of 5 difficulty rating indicates"
minutes: 17
covers:
  - "Glassdoor difficulty rating of 2.8 out of 5 for GNC Engineer, and what that really indicates"
---

One number gets quoted about this process more than any other: a Glassdoor interview difficulty rating of **2.8 out of 5** for GNC Engineer. It is quoted by candidates talking themselves into applying and by candidates talking themselves out of preparing, which is a good sign that it is being misread in both directions.

The reading that matters is neither. It is that 2.8 out of 5 is entirely consistent with everything the last four lessons described — a process running five to eight weeks, ending in five to seven back-to-back interviews over more than eight hours — and that understanding why those two facts sit together tells you something specific and useful about where your preparation should go.

This lesson does two things. It resolves the apparent contradiction, which is the part that changes how you prepare. Then it treats the number as data, which is the part that changes how much weight you put on it and on anything else drawn from the same source.

## The apparent contradiction

On a five-point scale, the midpoint is 3. A rating of 2.8 therefore sits slightly *below* the middle of the scale — in the same neighbourhood as a great many ordinary engineering interviews.

Set that beside the process this module has been describing. Up to nine touchpoints. A technical screen with an engineer on the team. A full day of five to seven consecutive interviews, containing a presentation to a panel of five to ten people with extensive questioning, two to three coding rounds, systems and architecture rounds, domain rounds, and estimation problems. That does not sound like a below-midpoint experience, and candidates reading both facts at once usually conclude that one of them must be wrong.

Neither is wrong. They measure different things, and the distinction between them is the whole content of this lesson.

## Question difficulty is not process difficulty

A difficulty rating is a judgment about the **questions**: how hard the individual problems felt to the person answering them. It is not a judgment about the **process**: how demanding the whole experience was to get through.

Those can differ arbitrarily. A single question so hard that almost nobody solves it produces a high difficulty rating in a process that lasts forty-five minutes. A day of thirty fundamental questions, each of which you could answer well on a quiet afternoon, produces a moderate difficulty rating in a process that is genuinely gruelling — because no individual question was exotic, and difficulty is being rated question by question.

The second of those is the shape this process appears to have. Which gives the number its real meaning:

::: key
A 2.8 out of 5 difficulty rating indicates that the filter is breadth and fluency rather than exotic difficulty. The questions are fundamental; the challenge is answering many of them cleanly, quickly and across several subjects in one day.
:::

### What that implies for preparation

Three consequences follow, and they are more useful than the number itself.

**Fundamentals, not frontier material.** Preparation aimed at unusual or advanced topics is aimed at a difficulty the rating suggests is not there. The reported phone-screen topics were PD control, orbit determination and frequency-domain analysis — the core of the subject, not its edges. The right target is being genuinely fluent in the standard material rather than passingly familiar with a wider range of it.

**Breadth, because depth in one area does not compensate for a gap in another.** A day containing a presentation, coding, systems, domain and estimation rounds is a day in which a single weak subject is a weak round, and a weak round is its own report at the debrief. The candidate who is outstanding at estimation and cannot write clean C++ under observation does not get to average those two together into a pass. This is the single most actionable consequence of the rating and it is the one most often missed.

**Speed and cleanliness, because "answering many of them" is the binding constraint.** A question you can answer in four minutes but not in two is, in a thirty-minute screen or a forty-five-minute round with several questions in it, a question you cannot answer. Fluency here means the routine runs without you having to assemble it: state assumptions, give the structure, then the content.

## Treating the number as data

The second half of this lesson is about how much weight the figure can bear, and the honest answer is: less than the confidence with which it gets quoted.

**It is a voluntary-response sample.** Candidates choose whether to file an interview report. Nothing in the average corrects for who chose to. That is not a criticism of the site; it is a structural property of every voluntary-response dataset, and it means the sample is not a random draw from the people who interviewed. Which direction that pushes the average is not something anyone can say from outside — you would need to know who did not respond and what they would have said, which is precisely the information a voluntary sample does not contain. The honest conclusion is that the bias exists and its sign is unknown, not that the number is inflated or deflated.

**The GNC sample specifically is small.** This module's own reading of the source says so directly. A small sample makes a mean unstable in a way that is easy to underestimate, and a hypothetical makes it concrete. Suppose — and this is a supposition, since the count is not something this lesson knows — the 2.8 rests on twenty reports. One additional report rating the interview 5 moves the mean to about 2.90. If the same 2.8 rested on two hundred reports, the same new report would move it to about 2.81. The figure's third significant digit is not meaningful at the smaller sample size, and quoting it as "2.8" rather than "somewhere near 3" gives it a precision it does not have.

**It is useful for structure and not for money.** What interview reports are genuinely good for is the shape of a process: how many rounds, what kinds, what order, what got asked about. That is descriptive information many people can report consistently. Compensation figures from the same source are a different matter — self-reported, differently structured across levels and equity arrangements, and stale at unknown rates — and this module's reading is that they are unreliable. Use the source for the map, not for the numbers.

::: warning Do not quote this rating in an interview
There is no version of "I see the interview is rated 2.8 out of 5" that lands well. At best it is irrelevant to the question you were asked; at worst it reads as having prepared for a reputation rather than for the work. The rating is an input to how you allocate your preparation hours. It is not a conversational asset.
:::

## What no number here can tell you

It is worth being explicit about the figures this lesson does not have, because their absence is not an oversight.

This curriculum does not know what fraction of candidates clear the phone screen, what fraction of onsites end in offers, how many applications a requisition receives, or how any of those vary by role family. No such figure appears anywhere it can rely on, and a plausible-sounding one invented here would be repeated by a reader who trusted it — possibly out loud, in an interview. The difficulty rating is the one quantitative claim about this process that the module actually carries, which is part of why it deserves a whole lesson of careful reading rather than a footnote.

::: example Two candidates read the same number
Two candidates find the 2.8 rating three weeks before their onsites.

The first reads it as reassurance. Below the midpoint of the scale, she reasons, means the interview is not especially hard, and her control theory is strong — she has spent two years on it and can derive most of it from scratch. She spends the three weeks going deeper into control, which is the subject she already owns and the one it is most pleasant to study.

On the day, the domain round goes extremely well. The two coding rounds do not: she has not written C++ under time pressure in a year, she spends the first round rediscovering how she wants to structure the solution rather than stating an approach and writing it, and in the second she produces correct code four minutes after time. The systems round is adequate. The estimation question in the afternoon she answers without a cross-check, because she has never practised producing one.

Her day contains one outstanding report, one adequate one and three weak ones. Nothing about it contradicts the rating — none of the questions she was asked was hard in the sense the rating measures. The day beat her on breadth, which is exactly what a moderate difficulty rating attached to a long multi-round process predicts.

The second candidate reads the same number as a statement about *where the filter is*. She keeps her control preparation on maintenance — an hour a week, enough not to lose fluency — and spends the rest of the three weeks on the subjects she is weakest in: C++ under a timer, three systems-design discussions talked through out loud with a friend, and a dozen Fermi problems done properly with cross-checks. Her domain round is good rather than exceptional. Every other round is solid. Her day contains no weak report at all.
:::

::: example Reading the reports without trusting the average
A candidate decides to use the interview reports for what they are good for and not for what they are not.

She reads through them and ignores every rating. What she extracts instead is structure: whether reports mention a presentation and how long it ran, how many coding rounds appear, whether reports describe a tour, what subjects the technical screen covered, and how many separate conversations people describe before the onsite. Those are facts a reporting candidate can state accurately and that do not depend on the reporter's judgment or mood.

She notices that reports vary, and treats the variation as information rather than as noise: if some describe a take-home and others do not, that is consistent with a take-home appearing for some roles and not universally, which is what this module says. She does not average anything.

She also notices two compensation figures, several years apart, that differ substantially, and declines to draw any conclusion from either. Both are self-reported, neither states a level, and she has no way to tell what equity arrangement is included. She takes the structural picture, leaves the numbers, and writes down two questions for the recruiter about the parts the reports disagreed on — which is the only reliable way to resolve them.
:::

## Check yourself

::: check
Explain how a difficulty rating below the midpoint of a five-point scale is consistent with a process of five to seven back-to-back interviews over eight or more hours.
:::

::: answer
The rating measures how hard the individual questions felt, not how demanding the overall process was. A day of many fundamental questions, none of them exotic, produces a moderate question-difficulty rating while still being a gruelling day — because difficulty is being assessed question by question and the burden comes from volume, breadth and endurance. The two facts measure different things and do not conflict.
:::

::: check
State the three preparation consequences that follow from reading the rating correctly.
:::

::: answer
Aim at fundamentals rather than frontier material, since the rating indicates the questions are standard — the reported screen topics were PD control, orbit determination and frequency-domain analysis. Prioritise breadth, because depth in one subject does not compensate for a gap in another when each round produces its own report. And train for speed and cleanliness, because the binding constraint is answering many questions well in a limited time, which requires a routine that runs without being assembled under pressure.
:::

::: check
Why can nobody say whether a voluntary-response interview rating is biased upward or downward?
:::

::: answer
Because determining the direction of the bias requires knowing who chose not to respond and what they would have said, and that is exactly the information a voluntary-response sample does not contain. The structural point — that the respondents are not a random draw from the people who interviewed — is certain. The sign of the resulting error is not recoverable from the data, so the honest statement is that the bias exists and its direction is unknown.
:::

::: check
A candidate quotes the rating to three significant figures. Using a hypothetical sample size, show why that precision is not warranted.
:::

::: answer
Suppose the 2.8 rested on twenty reports. One further report rating the interview 5 would move the mean to about 2.90 — a change in the first decimal place from a single observation. The same report added to a two-hundred-report sample would move the mean to about 2.81. Since the GNC sample is described as small, the figure cannot support a claim to that precision, and "somewhere near 3" is the honest reading of it.
:::

::: check
What is this class of source good for, what is it unreliable for, and why does this lesson decline to give a pass rate for any stage?
:::

::: answer
It is useful for structure — the number of rounds, their kinds, their order, the subjects asked about — because those are facts a reporting candidate can state consistently. It is unreliable for compensation, which is self-reported, inconsistently structured across levels and equity arrangements, and stale at unknown rates. It declines to give a pass rate because no such figure exists in anything this curriculum can rely on, and an invented one would be trusted, planned around, and possibly repeated out loud in an interview by a reader who had no reason to doubt it.
:::

## Summary

| Claim | Status |
| --- | --- |
| Difficulty rating 2.8 out of 5 for GNC Engineer | The module's stated figure |
| What it measures | How hard the questions felt, not how hard the process was |
| What it indicates | Breadth and fluency are the filter, not exotic difficulty |
| Preparation consequence | Fundamentals, breadth over depth, speed and cleanliness |
| Sample type | Voluntary response; not a random draw; bias direction unknown |
| GNC sample size | Small, so the mean is unstable and the precision is overstated |
| Good for | Process structure — rounds, order, subjects |
| Not good for | Compensation |
| Pass rates, conversion rates, applicant counts | Not known here, and not invented here |

The next lesson takes the practical consequence of everything since lesson five seriously: how to get through eight hours of continuous evaluation with the last round as good as the first.
