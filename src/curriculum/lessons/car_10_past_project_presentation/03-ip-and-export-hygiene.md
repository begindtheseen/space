---
id: l03-ip-and-export-hygiene
title: "What is yours to present, and what is not"
minutes: 18
covers:
  - "intellectual property and export-control hygiene about a previous employer’s work"
---

Before a list of five topics is submitted, one more check has to run over it, and it is not a check on quality. Every entry has to be yours to describe, in full, to a room of five to ten engineers you have never met, who work for a different company. A topic can be excellent work, entirely defensible, and the best thing you have ever built, and still fail this check — in which case it does not go on the list, and the repair is to present the public-ground equivalent instead.

This lesson is about that check. It is narrower than the portfolio module's treatment of licensing and prior-employer intellectual property, which covers what you can publish; the question here is what you can *say*, out loud, under questioning, to a panel whose composition you do not control. That turns out to be a harder case than a repository, for reasons worth understanding rather than memorising.

Nothing here is legal advice, and nothing in it substitutes for reading your own employment agreement or, where the stakes are real, asking a lawyer. What it gives you is the shape of the problem clearly enough to recognise when you are inside one.

## Two obligations, from two different bodies of law

They get conflated constantly, and they behave differently, so keep them apart.

**Confidentiality and invention assignment.** Most engineering employment agreements assign work product created within the scope of employment to the employer and impose a continuing confidentiality obligation on proprietary information. This is contract law between you and a company. It does not expire when you leave, it does not depend on whether the work was exciting, and it does not care that you personally wrote every line.

**Export control.** The export-control module of this track develops this in full: under ITAR, technical data concerning the design, development, testing or modification of a controlled article — Category IV launch vehicles and missiles, Category XV spacecraft — is controlled regardless of the medium it lives in. A derivation on a whiteboard, a source file, a plot, a spoken explanation: all of it is technical data if it is about the right subject. This is federal law, and it applies whether or not any company has told you anything about it.

The two are independent. Work can be proprietary but uncontrolled, in which case only the first obligation bites. It can be controlled and not especially secret, in which case the second does. And a great deal of interesting GNC work done at an aerospace employer is both.

::: key
Never present proprietary or controlled work from a previous employer. Choose topics you are free to describe in full to a room of outside engineers — which is one more reason to build portfolio projects on public data and open problems.
:::

## Why a talk is a harder case than a repository

A repository is read by one reviewer at a time, and everything in it was written deliberately, in advance, with time to think. A presentation is neither.

First, the audience. Five to ten engineers, employed by a different company, whose names and backgrounds you do not know in advance. If any part of what you present is controlled technical data, a release to a foreign person — even one standing in a conference room in California — is treated as an export to that person's country under the deemed-export rule the export-control module covers. You cannot assess the composition of a panel you have not met, and you should not have to.

Second, the format. Your slides can be reviewed line by line before the day. The questioning cannot. And the natural instinct under a good technical question is to become *more* specific — to reach for the actual number, the actual failure, the actual part designation — which is exactly the direction you do not want to move if the subject is restricted. A talk you scrubbed carefully can be undone by one honest, generous answer twenty minutes later.

Third, and this is the part candidates underweight: the panel does not want it. An interviewer handed a former employer's proprietary data has been given something they have no authorisation to receive and no use for. Whether or not anyone in the room is thinking about it in these terms, the inference is available to them, because how you handle somebody else's confidential information is the only direct evidence they have about how you would handle theirs.

## The rule that resolves almost every case

Present only what you would publish. If you would not put the entire deck, including the backup slides, on a public website under your own name, it does not belong in the round.

That rule sounds restrictive and is actually liberating, because the repair is well understood and does not involve finding a clever way to present restricted work. Rebuild the skill on public ground: a fresh implementation, against public specifications or openly available data, of the same technique, with your own verification evidence behind it. The specific artefact does not transfer. The skill does, and — as the portfolio module argues — the rebuilt version is often the stronger interview artefact anyway, because everything in it is unambiguously yours, which removes the contribution question entirely.

This is also the sharpest available answer to a question candidates ask about their own careers: whether the most interesting work they have done being unpresentable means it was wasted. It does not mean that, but it does mean the work cannot be a submission topic. In behavioural or experience rounds you can generally discuss the *shape* of a hard problem — the kind of difficulty, the kind of tradeoff, what you learned — without disclosing specifics. This round needs something different: an artefact a panel can interrogate in technical depth for half an hour. Shape without substance does not survive that, which is precisely why the public-ground equivalent has to be built ahead of time rather than improvised.

::: example The check, run over a five-entry list
For each entry, four questions: who owns the code, who owns the data, is the subject matter the design or testing of a controlled article, and would you put the whole deck on a public site under your own name.

| Entry | Code | Data | Controlled subject? | Verdict |
| --- | --- | --- | --- | --- |
| 6-DOF ascent simulation, layered atmosphere, dispersion campaign | Hers | Standard-atmosphere model, representative vehicle parameters she chose | Generic vehicle, public physics | Present |
| Powered-descent guidance with landing-accuracy Monte Carlo | Hers | Self-generated from a published formulation | Open problem, published method | Present |
| Quaternion EKF with NEES and NIS | Hers | Simulated from published sensor specifications | No | Present |
| Batch orbit determination | Hers | Public TLE-derived positions | No | Present |
| Guidance loop rework at a previous defence employer | Employer's | Employer's | Yes, on both counts | Cut |

The fifth entry fails twice over, and either failure alone is sufficient. The repair is not a sanitised version of it with the numbers changed — a sanitised description of a controlled system's design is still a description of that system. The repair is that the first four entries already demonstrate the same competencies on public ground, and if the cut leaves a slot genuinely empty, the previous lesson's routes fill it without touching restricted material.
:::

## Declining mid-answer, without sounding evasive

The scripted part is easy. The unscripted part needs a sentence you have said out loud before, because inventing one under questioning is how people over-share.

::: example A question that pulls toward restricted ground
The candidate is presenting her quaternion EKF. A panel member, having heard that she worked in flight software at a defence contractor, asks: "You mentioned you saw something like this in industry. What were the actual gyro bias stability numbers on the unit you flew?"

**Weak answer one — over-share.** She gives the number, with a caveat that it is "probably fine to say." It is not fine, it cannot be unsaid, and she has just demonstrated the exact behaviour a future employer would least want directed at their own data.

**Weak answer two — the wall.** "I can't talk about that." True, correct, and it ends the thread dead. The panel learns nothing technical, the moment is awkward, and the natural reading is that the whole area is off limits, including the parts that are not.

**Strong answer.** "That unit's numbers are my former employer's, so I am going to leave them out. The mechanism is public and I can go straight at it: turn-on bias repeatability enters my filter as an initial condition on the bias state, not as a noise density, so it sets how long the star tracker takes to pull the bias in rather than the steady-state error. In my own project I sized that directly — with a star-tracker noise of $5\times10^{-5}\,\mathrm{rad}$ per axis, a constant bias is visible in the attitude residual once it has integrated up to that level, so over a $100\,\mathrm{s}$ window anything above about $5\times10^{-7}\,\mathrm{rad/s}$, roughly $0.10\,^\circ/\mathrm{hr}$, shows up. Those numbers are mine and I am happy to go deeper on them."

**What separates them.** The strong answer declines a single datum and keeps the technical content, then immediately supplies an equivalent question it can answer in full — with numbers that belong to her. It takes about fifteen seconds longer than the wall and leaves the panel with more, not less. Rehearse the first clause until it is automatic: name whose it is, say you are leaving it out, and move directly to the version you own.
:::

::: warning
If a panel presses after a clear decline — and a competent one will not — holding the line is the correct answer, and it is not a cost. The alternative is worse than an awkward five seconds: a candidate who can be talked past a confidentiality obligation by mild social pressure in an interview has shown exactly how that obligation will hold up later.
:::

## Where to go for the actual answer

This lesson tells you when you are in the problem, not how it resolves for your specific facts. Your employment agreement is the document that governs the first obligation, and it is worth re-reading before you draft the list rather than after. For the second, the Directorate of Defense Trade Controls publishes the regulations and guidance, and the export-control module of this track covers the mechanics of what counts as technical data, who counts as a foreign person, and why a release inside the United States can still be an export. Where the stakes are real — a genuinely ambiguous case on work you would very much like to present — ask a lawyer before, not after.

## Check yourself

::: check
Name the two separate obligations that can make prior work unpresentable, and give one example of work that would be blocked by one but not the other.
:::

::: answer
The first is contractual: confidentiality and invention assignment under an employment agreement, which assigns work product to the employer and restricts disclosure of proprietary information. The second is statutory: export control, under which technical data concerning the design, development, testing or modification of a controlled article is restricted regardless of medium. Work blocked by only the first would be a proprietary but entirely uncontrolled internal tool — a company's commercial data-processing pipeline, say — which you may not disclose but which no export regulation touches. Work blocked by only the second would be analysis of a controlled system that you own outright but still cannot freely release to a foreign person.
:::

::: check
Why is a presentation a harder case for this check than a public repository, even when the technical content is identical?
:::

::: answer
Three reasons. The audience is five to ten engineers whose composition you do not know in advance, and a release of controlled technical data to a foreign person is treated as an export even inside the United States. The format includes unscripted questioning, which cannot be reviewed in advance, and the natural instinct under a good technical question is to become more specific rather than less. And the material reaches people who have no authorisation to receive another company's proprietary data and no use for it, so offering it is a judgement signal as well as a legal problem.
:::

::: check
A candidate proposes to present a previous employer's guidance work "with the numbers changed and the vehicle anonymised." Explain why this does not resolve the problem.
:::

::: answer
The control and the confidentiality obligation attach to the technical content — the design, the method, the testing approach — not to the identifying labels attached to it. A description of how a controlled article's guidance was designed remains a description of that article's design after the vehicle's name is removed, and the underlying architecture is often more revealing than the numbers anyway. Anonymising also does nothing about the questioning, where a panel's follow-up will push exactly toward the specifics that were removed. The resolution is a rebuilt public-ground equivalent, not a redacted original.
:::

::: check
Give the three-part structure of a strong mid-answer decline, and explain why the bare refusal is a weaker answer despite being equally correct.
:::

::: answer
Name whose information it is, state plainly that you are leaving it out, and then immediately move to the equivalent question you can answer in full, with numbers that are yours — answering it properly rather than gesturing at it. The bare refusal is legally identical and informationally empty: it ends the thread, teaches the panel nothing technical, and implies the entire surrounding area is unavailable when usually only one datum is. The three-part version costs about fifteen seconds more and leaves the panel with a real answer, while demonstrating the same discipline.
:::

::: check
This round requires an artefact that can be questioned in technical depth. What does that imply about work you can only describe in shape — the kind of problem, the kind of tradeoff — without specifics?
:::

::: answer
It implies that such work cannot be a submission topic, however substantial it was. Shape-level description is generally fine in behavioural or experience rounds, where the question is what you learned and how you work; it cannot survive thirty minutes of technical questioning, because every follow-up asks for the specific thing that has been removed. That is the concrete reason to build the public-ground equivalent in advance rather than assuming the experience itself will carry the round.
:::

## Summary

| Item | Statement |
| --- | --- |
| Obligation one | Confidentiality and invention assignment — contract, does not expire on leaving |
| Obligation two | Export control — technical data on a controlled article's design, development, testing or modification, in any medium |
| Why a talk is harder | Unknown audience, deemed exports, unscripted questioning, and a panel that does not want the data |
| The rule | Present only what you would publish under your own name, backup slides included |
| The repair | Rebuild the skill on public ground; the artefact does not transfer, the skill does |
| Mid-answer decline | Name whose it is, say you are leaving it out, move to the equivalent question you own — and answer that one properly |
| Not covered here | Your specific facts; read your agreement, consult DDTC guidance, ask a lawyer where it matters |

With the list audited for defensibility and cleared for disclosure, the next lesson builds the talk itself: seven parts, and what each one gets of a fifteen-minute clock.
