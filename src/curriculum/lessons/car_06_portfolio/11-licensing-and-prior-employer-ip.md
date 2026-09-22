---
id: l11-licensing-and-prior-employer-ip
title: "Licensing, and what to do about prior-employer IP"
minutes: 18
covers:
  - "open-sourcing, licensing, and what to do about prior-employer intellectual property"
---

Everything this module has covered so far assumes the project in front of you is legally yours to show. That assumption is not automatic, and getting it wrong is not a documentation gap the way a missing verification section is — it is a real legal and professional exposure, for you and potentially for whoever hires you next. This lesson covers two separate questions that get conflated constantly: how to license a project so a reviewer can legally run and read it, and what to do about work that touches a previous employer's intellectual property or a controlled technology, where the honest answer is often "build something else that demonstrates the same skill."

Nothing in this lesson is legal advice, and nothing in it substitutes for reading your own employment agreement or, where the stakes are real, asking a lawyer. What it gives you is the shape of the two problems clearly enough that you know when you are looking at one.

## Licensing: making "yours to show" legally usable by a reviewer

A repository with no license file is not, by default, open for a reviewer to freely clone, modify, or reuse — under copyright law, the absence of an explicit license generally means the author retains all rights, and a stranger technically has no granted permission to do much beyond looking at the code on the page. For a portfolio project, this is a real, practical problem, not a technicality: a reviewer running your one-command reproduction script, exactly as the previous lesson asked for, is a form of use, and an unlicensed repository has not clearly granted it.

A permissive license — MIT, BSD, or Apache 2.0 — is the sensible default for a portfolio project specifically, for a reason narrower than general open-source philosophy: a portfolio project's entire purpose is being read, run, and evaluated by one reviewer at a time, not integrated into someone else's product under obligations you need to track. A copyleft license like the GPL is built to keep derivative works open, which is a reasonable choice for software meant to be built upon — it adds friction and legal reading for a reviewer whose only intent is to clone your repository, run your tests, and read your code, which is exactly the use case this module has spent ten lessons optimizing for.

::: example A repository, unlicensed versus permissively licensed
**Before.** A repository with a README, tests, and a clear verification section — but no `LICENSE` file anywhere. A careful reviewer, or a reviewer's employer's legal team doing due diligence before an offer, technically has no clear grant to run the reproduction script the README describes, however unlikely anyone is to raise the issue in practice for a portfolio review.

**After.** A single `LICENSE` file at the repository root containing the MIT license text, referenced in one line of the README ("Licensed under MIT — see `LICENSE`."). The change costs one file and answers a question a legal-minded reviewer would otherwise have to ask, or worse, quietly decide not to ask and route around your repository instead.
:::

::: key
An unlicensed repository defaults to "all rights reserved" under copyright law — a reviewer has no clearly granted permission to run or reuse it. A permissive license (MIT, BSD, Apache 2.0) is the sensible default for a portfolio project specifically, because the project's whole purpose is being read and run by an evaluator, not built upon under tracked obligations.
:::

## Prior-employer intellectual property: a different, more serious problem

Licensing solves the case where a project is genuinely yours and only needs clear legal terms attached. It does nothing for a different and more serious case: work you produced at a previous employer, where the code, the specific problem formulation, or the results may not be yours to publish at all, regardless of what license you attach to them.

Two distinct obligations can make previously-produced work unshowable, and they are worth keeping separate because they have different sources and different scopes. The first is ordinary confidentiality and invention-assignment: most engineering employment agreements assign work product created within the scope of employment to the employer and require confidentiality about proprietary information, independent of whether the work is exciting, independent of whether you personally wrote every line, and independent of whether you have since left the company. The second, and the one this curriculum's earlier material on export control covers in depth, is that GNC work touching a controlled launch vehicle or spacecraft produces technical data under ITAR regardless of the medium — a derivation, a piece of source code, or a design memo is controlled the moment it concerns the design, testing, or modification of a Category IV or Category XV article, whether or not anything physical ever changes hands. A former employer's confidentiality obligation and a federal export-control restriction are different bodies of law with different consequences, and a project can trigger either one independently of the other — proprietary but uncontrolled work still cannot be published under a confidentiality obligation, and even publicly available analysis of a controlled system's specifics can raise export-control questions regardless of who owns it.

::: warning
"I only used what I learned, not the actual code" is not automatically a safe line, and this module does not adjudicate where that line falls for your specific situation — that depends on your actual employment agreement, the actual content involved, and in some cases actual export-control classification, none of which a study app can determine for you. Where the stakes are real, read your agreement and, if genuinely uncertain, ask a lawyer before publishing rather than after.
:::

## What to do instead: rebuild the skill on public ground

The practical resolution, in almost every case, is not to find a clever way to present restricted work — it is to build a portfolio project that demonstrates the same underlying skill on public data and an openly stated problem, so that everything in the repository is unambiguously yours to show. This is not a lesser version of the real experience; it directly strengthens the fifth item on this module's own defensibility checklist, the statement of what you did versus what a library did, because a project built entirely from scratch on a public problem leaves no ambiguity about whose decisions are inside it.

If a previous role involved tuning a Kalman filter for a proprietary sensor suite, the portfolio version is not a sanitized copy of that code — it is a fresh implementation, against a public or self-generated dataset, that demonstrates the same specific technique (perhaps the same insight about modeling a correlated bias, generalized rather than copied) with your own verification evidence behind it. The skill transfers; the artifact does not need to.

This also answers the harder version of the question: some of the most interesting work you do at a real job may never become a publishable artifact at all, and that is a genuine, permanent limitation rather than a documentation gap to fix. Two different things can still be true about it. In an interview's behavioral rounds, you can generally discuss the *shape* of a hard problem you worked on — the kind of difficulty, the kind of tradeoff, what you learned — without disclosing controlled or proprietary specifics, and this is different from presenting the technical artifact itself. But for the past-project presentation round this module's later lessons cover, which requires an actual artifact a panel can question in technical depth, only work you can show counts — which is exactly why building the public-data equivalent, ahead of time, is worth the hours it costs.

::: example A skill kept, an artifact rebuilt
A candidate's previous role involved diagnosing a real flight anomaly by recognizing that a navigation filter's process noise had been mistuned relative to an unmodelled sensor bias — genuinely sophisticated work, and entirely off-limits to publish in any specific form. The portfolio version: a fresh quaternion EKF project, built from public sensor specifications and simulated or openly available data, that deliberately demonstrates the identical class of insight — an overconfident filter, diagnosed by a NEES and NIS consistency test rather than by eye, exactly as this module's own anchor-C lesson develops — with every line of code, every dataset, and every number the candidate's own to show. The specific incident stays confidential; the demonstrated judgment does not have to.
:::

## Check yourself

::: check
Why does this lesson recommend a permissive license like MIT rather than a copyleft license like the GPL specifically for a portfolio project, rather than treating it as a general licensing preference?
:::

::: answer
The reasoning is specific to what a portfolio project is for: being cloned, run, and read by one reviewer evaluating a candidate, not being built upon as a component of someone else's software under tracked obligations. A copyleft license is designed to keep derivative works open, which is valuable for software meant to be extended by others but adds legal reading and friction for a reviewer whose only intent is to run your reproduction script and read your code — exactly the use case a portfolio project needs to make as frictionless as possible.
:::

::: check
A repository has no `LICENSE` file. Explain, in terms of default copyright rules rather than a general sense that "open source is fine," what a reviewer technically does and does not have permission to do with it.
:::

::: answer
Under default copyright rules, the absence of an explicit license generally means the author has not granted any rights beyond what the law provides automatically — a reviewer can typically view the code as published, but has no clearly granted permission to run, modify, or redistribute it, which for a portfolio project can include the one-command reproduction step this module's reproducibility lesson asked for. Adding an explicit permissive license file removes this ambiguity by granting clear, stated permissions.
:::

::: check
Explain the difference between a former employer's confidentiality and invention-assignment obligation and an ITAR export-control restriction, as two separate reasons a piece of prior work might be unshowable.
:::

::: answer
A confidentiality and invention-assignment obligation comes from an employment contract and typically assigns work product created within the scope of employment to the employer, independent of any government regulation — it is a private, contractual restriction. An ITAR restriction comes from federal law and applies to technical data concerning a controlled launch vehicle or spacecraft's design, testing, or modification, regardless of who owns the underlying work or what any employment contract says. The two can apply independently: proprietary-but-uncontrolled work can still be unshowable under a confidentiality clause, and even openly-owned analysis of a controlled system's specifics can raise a separate export-control question.
:::

::: check
A candidate argues that describing a prior employer's proprietary project in general terms during a behavioral interview question is the same kind of disclosure as publishing a portfolio repository built from that work. What distinction does this lesson draw between the two?
:::

::: answer
Discussing the general shape of a hard problem — the kind of difficulty, the tradeoff, what was learned — in a behavioral answer, without disclosing controlled or proprietary specifics, is different from publishing an actual technical artifact (code, a specific formulation, specific results) that a panel can inspect and question in technical depth. The past-project presentation round this curriculum's interview-preparation material covers specifically requires a presentable artifact, which is why a rebuilt, public-data version of the same skill is necessary there even when a general behavioral discussion of the original problem might be acceptable.
:::

::: check
Why does rebuilding a skill on public data, rather than presenting a sanitized version of restricted work, actually strengthen a project's defensibility rather than merely avoiding a legal problem?
:::

::: answer
A project built entirely from scratch against a public or self-generated dataset leaves no ambiguity about whose decisions produced it, which directly satisfies the defensibility checklist's requirement to state clearly what the author did versus what came from elsewhere — a sanitized version of someone else's proprietary code, even heavily modified, carries exactly the ambiguity that checklist item exists to remove. Rebuilding is not a compromise forced by the legal constraint; it produces a stronger, more clearly-yours artifact than the original restricted work ever could have been as a portfolio piece.
:::

## Summary

| Item | Statement |
| --- | --- |
| Unlicensed repository | Defaults to all rights reserved; a reviewer has no clearly granted permission to run or reuse it |
| Recommended default | A permissive license (MIT, BSD, Apache 2.0) — minimal friction for a single evaluating reviewer |
| Confidentiality / invention assignment | A contractual obligation from employment, independent of any government regulation |
| Export control (ITAR) | A federal restriction on technical data tied to a controlled vehicle, independent of who owns the work |
| The fix | Rebuild the demonstrated skill on public data and an openly stated problem — strengthens defensibility, does not merely avoid a legal problem |
| Not publishable but not lost | The general shape of a hard problem can often be discussed behaviorally without disclosure; the past-project round still needs a real, showable artifact |

The final lesson in this module closes the loop it opened: how the portfolio built across these ten lessons directly supplies the material for the past-project presentation round this curriculum's interview-preparation material covers next.
