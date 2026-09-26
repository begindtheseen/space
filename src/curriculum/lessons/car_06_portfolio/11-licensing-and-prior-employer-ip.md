---
id: l11-licensing-and-prior-employer-ip
title: "Licensing, and what to do about prior-employer IP"
minutes: 22
covers:
  - "open-sourcing, licensing, and what to do about prior-employer intellectual property"
---

Imagine you spent a summer working in a bakery, and you helped perfect their famous cinnamon roll. You know that recipe by heart. Can you print it on a flyer and hand it out? No — the recipe belongs to the bakery, even though your hands made the rolls. Now imagine you invent your *own* roll at home, from scratch. That one is yours. You can share it, and you can decide what other people are allowed to do with it.

A GNC portfolio runs into both halves of that story. Everything in this module so far has assumed the project in front of you is legally yours to show. That is not automatic. And getting it wrong is not a small documentation gap, like a missing verification section. It is a real legal and professional risk — for you, and possibly for whoever hires you next.

This lesson separates two questions that people mix up all the time:

1. **Licensing:** how to attach clear permission to your own project, so a reviewer can legally run and read it.
2. **Prior-employer work:** what to do about work that touches a previous employer's secrets or a controlled technology. Here the honest answer is often "build something else that shows the same skill."

Nothing in this lesson is legal advice. It does not replace reading your own employment agreement or, when the stakes are real, asking a lawyer. What it gives you is the shape of the two problems, sharply enough that you recognize one when you are looking at it.

## Licensing: a permission slip for your code

Start with a surprising rule. When you write code, you own the **[[copyright|copyright-is-automatic]]** in it automatically — the legal right to decide who may copy, change and share it. You do not have to register anything.

That has a consequence people do not expect. A repository with no license file is *not* open for anyone to use. Under copyright law, no license generally means **all rights reserved**: the author keeps every right, and a stranger has no granted permission to do much beyond looking at the code on the page. (The [[hosting site's own terms|github-terms]] add a little, but not much.)

For a portfolio, that is a real problem, not a technicality. A reviewer running your one-command reproduction script — exactly what the last lesson asked for — is *using* your code. An unlicensed repository has not said it is allowed.

The fix is a **[[license|license-spectrum]]**: a short legal text that says what others may do with your work. Licenses come in two broad families.

- A **permissive license** — MIT, BSD, or Apache 2.0 — lets anyone use, copy, change and share the code, asking little more than that they keep your copyright notice. Apache 2.0 adds an explicit grant of any patent rights you hold in the code.
- A **[[copyleft|copyleft]]** license, like the GPL, also lets anyone use and change the code. But if they *distribute* a modified version, they must share it under the same license. It is built to keep improvements to the code open.

Which should a portfolio project use? Think about what the project is for. It exists to be cloned, run, read and judged by one reviewer at a time. It is not a component you expect other companies to build products on.

For that job, a permissive license is the simplest choice. To be precise about the GPL: it does *not* stop a reviewer from running or reading your code — running is always allowed. Its conditions only apply when someone distributes changed versions. But many companies have legal policies that treat copyleft code with extra care, and "which license is this, and what does it require?" is one more question you are asking a busy reviewer to think about. A permissive license removes the question. This is a narrow, practical reason, not a verdict on open-source philosophy.

::: example A repository, unlicensed versus permissively licensed
**Before.** A repository with a README, tests and a clear verification section — but no `LICENSE` file anywhere. A careful reviewer, or the legal team at the reviewer's company checking things before an offer, has no clear permission to run the reproduction script the README describes. It is unlikely anyone raises this for a portfolio review. But "unlikely to come up" is a weak foundation.

**After.** One `LICENSE` file at the top of the repository containing the MIT license text, plus one line in the README: "Licensed under MIT — see `LICENSE`." The change costs a single file. It answers a question a legal-minded reviewer would otherwise have to ask — or, worse, quietly decide not to ask, and skip your repository instead.

Sanity check: did anything about the code change? No. Only the permission around it did — which is the whole point of a license.
:::

::: key
An unlicensed repository defaults to "all rights reserved" under copyright law — a reviewer has no explicitly granted permission to run or reuse it. A permissive license (MIT, BSD, Apache 2.0) is the sensible default for a portfolio project, because the project's whole purpose is being read and run by an evaluator, not built upon under tracked obligations.
:::

::: warning
A license only covers what is yours to license. Putting an MIT file on top of code you copied from an employer, or from another project whose license says otherwise, does not make it yours to give away. The license is a permission slip from the owner — and the next section is about work where you are not the owner.
:::

## Prior-employer work: a different, more serious problem

Licensing solves the case where a project really is yours and only needs clear terms attached. It does nothing for a harder case: work you did at a previous job. There, the code, the exact problem setup, or the results may not be yours to publish at all — whatever license you attach.

The general name for owned ideas and creations is **[[intellectual property|intellectual-property]]**, or **IP** (said "eye-pee"). Two separate rules can make past work unshowable. Keep them apart, because they come from different places and reach different things.

**Rule one: your employment contract.** Most engineering jobs come with an agreement containing an **[[invention assignment|invention-assignment]]** clause and a **confidentiality** clause. Invention assignment means work you create as part of your job belongs to the company. Confidentiality means you must keep the company's private information private. These hold whether or not the work was exciting, whether or not you wrote every line yourself, and after you leave. This is contract law — a private deal between you and a company.

**Rule two: export control.** The export-control module earlier in this track covers this in depth. **ITAR** (said "eye-tar", the International Traffic in Arms Regulations) is a US federal law. It controls **[[technical data|technical-data]]** — information needed to design, develop, test or modify a controlled item. That includes Category IV launch vehicles and Category XV spacecraft. GNC work mostly *produces* technical data: a derivation, a piece of source code, a design memo. Each one is controlled once it concerns a controlled vehicle, whether or not anything physical ever changes hands.

These two rules are independent. A project can trigger either one without the other:

- Proprietary but uncontrolled work — say, an internship project on a company's in-house sensor software — still cannot be published, because of the confidentiality clause.
- Analysis of a controlled vehicle's specifics can raise an export-control question even if no company owns it. ITAR does set aside [[general principles and published information|public-domain]] — but applying them to a specific controlled vehicle is where technical data begins.

::: example Sorting four projects
A candidate lists four things she might put in her portfolio. Sort each one using the two rules.

1. **A quaternion filter she wrote at home**, on public star-catalog data and a simulated gyro, using textbook equations. Her own, with no employer and no specific controlled vehicle. *Showable.* Attach an MIT license.
2. **Her internship code** tuning a filter for her old employer's proprietary sensor, on a product with no export control. Rule one bites: the employer owns it and it is confidential. *Not showable.*
3. **A memo she wrote** at a launch company explaining why a vehicle's navigation filter was retuned after a flight problem. Rule one bites (company property) *and* rule two bites (technical data about a Category IV vehicle). *Not showable, twice over.*
4. **A powered-descent guidance study** reimplementing the published lossless-convexification paper for a made-up lander with round-number masses. Published method, invented vehicle, her own code. *Showable.*

Sanity check: two showable, two not. And the two that are showable are exactly the two built from scratch on public ground — which is where this lesson is heading.
:::

::: warning
"I only used what I learned, not the actual code" is not automatically a safe line. This module does not decide where that line falls for you. It depends on your actual employment agreement, the actual content involved, and sometimes an official export-control classification — none of which a study app can work out for you. When the stakes are real, read your agreement and, if you are truly unsure, ask a lawyer *before* publishing, not after.
:::

::: key
Prior-employer intellectual property: never publish or present controlled or proprietary work from a previous employer. Build portfolio projects on public data and open problems so that everything you show is yours to show — this also matters for the past-project presentation round.
:::

## What to do instead: rebuild the skill on public ground

In almost every case, the practical answer is not to find a clever way to present restricted work. It is to build a portfolio project that shows the *same underlying skill* on public data and an openly stated problem. Then everything in the repository is plainly yours.

This is not a lesser version of your real experience. It makes your project stronger on the fifth item of this module's defensibility checklist: a clear statement of what you did versus what a library did. A project built from scratch on a public problem leaves no doubt about whose decisions are inside it.

Say a previous job had you tuning a Kalman filter for a company's proprietary sensors. The portfolio version is not a cleaned-up copy of that code. It is a **[[fresh implementation|clean-room]]**, against a public or self-generated dataset, that shows the same technique — perhaps the same insight about modeling a slowly drifting sensor bias, stated in general terms rather than copied — with your own verification evidence behind it. The skill transfers. The artifact does not need to.

Some of the most interesting work you ever do at a real job may never become something you can publish. That is a real, permanent limit, not a gap to fix. Two things are still true about it.

- In an interview's **[[behavioral rounds|behavioral-round]]** — the questions that start "tell me about a time when…" — you can generally talk about the *shape* of a hard problem: the kind of difficulty, the kind of tradeoff, what you learned. You do this without revealing controlled or proprietary specifics. That is different from presenting the technical artifact itself.
- The **past-project presentation round**, covered in its own module later, needs an actual artifact that a panel of engineers can question in technical depth. Only work you can show counts there. That is exactly why building the public-data version ahead of time is worth the hours.

::: example A skill kept, an artifact rebuilt
A candidate's previous job included diagnosing a real flight anomaly. She recognized that a navigation filter's process noise had been set wrong relative to a sensor bias nobody had modeled. That is sophisticated work — and completely off-limits to publish in any specific form.

The portfolio version: a fresh quaternion EKF (extended Kalman filter, "E-K-F") project, built from public sensor specifications and simulated or openly available data. It deliberately shows the *same class* of insight: an overconfident filter, caught by a NEES and NIS consistency test rather than by eye, exactly as this module's anchor C lesson develops it. Every line of code, every dataset and every number is hers to show.

Check the result against the two rules: no employer owns it, and it describes no specific controlled vehicle. The specific incident stays confidential. The judgment she showed does not have to.
:::

## Check yourself

::: check
Why does this lesson recommend a permissive license like MIT rather than a copyleft license like the GPL specifically for a portfolio project, instead of treating it as a general preference?
:::

::: answer
The reason comes from what a portfolio project is for: being cloned, run and read by a reviewer judging a candidate, not being built into someone else's software. A copyleft license is designed to keep modified versions open when they are distributed. That is valuable for software meant to be extended by others. It does not stop anyone from running the code, but it brings conditions, legal reading and, at many companies, extra caution — friction for a reviewer whose only aim is to run your reproduction script and read your code. A permissive license removes that friction, which is exactly what a portfolio project needs.
:::

::: check
A repository has no `LICENSE` file. In terms of default copyright rules — not a general feeling that "open source is fine" — what does a reviewer have permission to do with it, and what not?
:::

::: answer
Copyright belongs to the author automatically, and with no license the author has granted nothing beyond what the law (and the hosting site's own terms) already provide. A reviewer can typically view the code as published. They have no explicitly granted permission to run, modify or redistribute it — and for a portfolio project, running includes the one-command reproduction step from the reproducibility lesson. Adding an explicit permissive license file removes this doubt by granting clear, stated permissions.
:::

::: check
Explain the difference between a former employer's confidentiality and invention-assignment obligation and an ITAR export-control restriction, as two separate reasons a piece of past work might be unshowable.
:::

::: answer
Confidentiality and invention assignment come from an employment contract. The contract typically makes work you create as part of the job the employer's property and requires you to keep it private. It is a private agreement, with no government regulation involved.

ITAR comes from federal law. It controls technical data about the design, testing or modification of a controlled launch vehicle or spacecraft — regardless of who owns the work or what any contract says.

They apply independently. Proprietary but uncontrolled work can be unshowable under the confidentiality clause alone. Analysis of a controlled vehicle's specifics can raise an export-control question even when no company owns it.
:::

::: check
A candidate argues that describing a past employer's proprietary project in general terms during a behavioral interview is the same kind of disclosure as publishing a portfolio repository built from that work. What distinction does this lesson draw?
:::

::: answer
Talking about the general shape of a hard problem — the kind of difficulty, the tradeoff, what was learned — without controlled or proprietary specifics is different from publishing an actual technical artifact: code, a specific formulation, specific results that a panel can inspect and question in depth. The past-project presentation round needs a presentable artifact. That is why a rebuilt, public-data version of the same skill is necessary there, even when a general behavioral discussion of the original problem might be acceptable.
:::

::: check
Why does rebuilding a skill on public data, rather than presenting a cleaned-up version of restricted work, actually make a project *more* defensible — not only avoid a legal problem?
:::

::: answer
A project built from scratch on a public or self-generated dataset leaves no doubt about whose decisions produced it. That directly satisfies the defensibility checklist's item on stating what you did versus what came from elsewhere. A cleaned-up version of someone else's proprietary code, even heavily modified, carries exactly the doubt that checklist item exists to remove. So rebuilding is not a compromise forced on you by the law. It produces a stronger, more plainly-yours artifact than the restricted work could ever have been as a portfolio piece.
:::

## Summary

| Item | What to remember |
| --- | --- |
| Copyright | Automatic for code you write; no registration needed |
| Unlicensed repository | Defaults to all rights reserved; a reviewer has no explicitly granted permission to run or reuse it |
| Recommended default | A permissive license (MIT, BSD, Apache 2.0) — least friction for a reviewer; GPL-style copyleft adds conditions on distributing modified versions |
| Confidentiality / invention assignment | A contract from your job, separate from any government regulation |
| Export control (ITAR) | Federal law on technical data about a controlled vehicle, regardless of who owns the work |
| The fix | Rebuild the skill on public data and an openly stated problem — stronger on defensibility, not only legally safer |
| Not publishable, not lost | The general shape of a hard problem can often be discussed in behavioral rounds; the past-project round still needs a real, showable artifact |

The final lesson in this module closes the loop: how the portfolio built across these lessons directly supplies the material for the past-project presentation round.

::: context copyright-is-automatic You own it the moment you write it
In the United States and most other countries, copyright exists as soon as an original work is written down or saved — a drawing, a song, an essay, a Python file. You do not have to file a form or add a © symbol. (Registering can help if you ever go to court, but the right itself already exists.)

That is why "I found it on the internet" never means "it is free to use." Somebody owns it by default, and only their permission — a license — changes that.
:::

::: context github-terms What the hosting site allows
If you put a public repository on GitHub, you agree to GitHub's terms of service. Those terms let other GitHub users view your public code and make a copy of it (a "fork") inside GitHub. That is a narrow permission. It does not plainly cover downloading the code, running it, changing it, or using it anywhere else. So a public repository without a license is visible, but not open. A license file is what fills the gap.
:::

::: context license-spectrum From "do anything" to "ask me first"
The word *license* comes from the Latin *licere*, "to be allowed". A software license is a list of what you are allowed to do. The common choices sit along a line from most open to most closed:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="12" y="34" width="112" height="34" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="124" y="34" width="112" height="34" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="236" y="34" width="112" height="34" fill="#fff" stroke="#b4232c" stroke-width="2"/>
  <g font-size="12" text-anchor="middle" fill="#1f2a44">
    <text x="68" y="24">permissive</text>
    <text x="180" y="24">copyleft</text>
    <text x="292" y="24">no license</text>
  </g>
  <g font-size="11" text-anchor="middle" fill="#1f2a44">
    <text x="68" y="56">MIT, BSD, Apache</text>
    <text x="180" y="56">GPL</text>
    <text x="292" y="56">all rights reserved</text>
    <text x="68" y="88">use freely,</text><text x="68" y="102">keep the notice</text>
    <text x="180" y="88">use freely; share</text><text x="180" y="102">changes if you</text><text x="180" y="116">distribute them</text>
    <text x="292" y="88">look, but no</text><text x="292" y="102">clear permission</text><text x="292" y="116">to use</text>
  </g>
  <text x="12" y="140" font-size="11" fill="#6c7a93">← more open</text>
  <text x="348" y="140" font-size="11" text-anchor="end" fill="#6c7a93">more closed →</text>
</svg>
```
:::

::: context copyleft A pun that became a movement
"Copyleft" is a play on "copyright": it uses copyright law to keep software *open* instead of closed. The best-known copyleft license, the GNU General Public License (GPL), was written by Richard Stallman for the Free Software Foundation; its first version came out in 1989. The Linux kernel uses it.

Permissive licenses are the other tradition. The MIT license is named after the university where it was first used, and it fits on one screen. Apache 2.0 is longer mainly because it also spells out patent rights.
:::

::: context intellectual-property Owning an idea
Intellectual property means creations of the mind that the law lets someone own, the way you can own a bike. There are four main kinds: **copyright** (written and recorded works, including code), **patents** (inventions), **trademarks** (names and logos), and **trade secrets** (valuable private information a company keeps secret — like a recipe, or a filter tuning method). A former employer's GNC work can fall under several of these at once, which is one more reason not to try to untangle it yourself.
:::

::: context invention-assignment The clause you signed on day one
On a new engineer's first day there is usually a stack of forms. One of them is often called something like a "proprietary information and inventions agreement". It says that what you create as part of the job belongs to the company, and that you will keep company secrets.

The details vary by employer and by state — some states, California among them, limit how far these clauses can reach into things you invent entirely on your own time, with your own equipment, unrelated to the company's business. That is exactly why this lesson says to read *your* agreement rather than assume.
:::

::: context technical-data Two rules, four boxes
Because the two rules are independent, any piece of past work lands in one of four boxes. Only one box is safe to show.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <text x="216" y="16" font-size="12" text-anchor="middle" fill="#1f2a44">export-controlled?</text>
  <text x="146" y="34" font-size="12" text-anchor="middle" fill="#1f2a44">no</text>
  <text x="286" y="34" font-size="12" text-anchor="middle" fill="#1f2a44">yes</text>
  <text x="8" y="84" font-size="12" fill="#1f2a44">yours,</text>
  <text x="8" y="98" font-size="12" fill="#1f2a44">public</text>
  <text x="8" y="150" font-size="12" fill="#1f2a44">employer's,</text>
  <text x="8" y="164" font-size="12" fill="#1f2a44">private</text>
  <rect x="76" y="42" width="140" height="70" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="216" y="42" width="140" height="70" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="76" y="112" width="140" height="70" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="216" y="112" width="140" height="70" fill="#fff" stroke="#b4232c" stroke-width="2"/>
  <g font-size="11" text-anchor="middle" fill="#1f2a44">
    <text x="146" y="74">show it</text><text x="146" y="90">(license it)</text>
    <text x="286" y="74">ITAR bites</text><text x="286" y="90">don't show</text>
    <text x="146" y="144">contract bites</text><text x="146" y="160">don't show</text>
    <text x="286" y="144">both bite</text><text x="286" y="160">don't show</text>
  </g>
</svg>
```

The top-left box is where every portfolio project should live.
:::

::: context public-domain Why textbook material is safe ground
ITAR's definition of technical data leaves out two things: general scientific, mathematical and engineering principles commonly taught in schools and universities, and information already in the public domain — published and freely available to anyone. Kalman filters, orbital mechanics and published guidance papers sit here. That is why a project built on them, for an invented or generic vehicle, is safe ground.

One trap: publishing controlled data yourself does not turn it into public domain. The exclusion covers information that is already lawfully public, not information you make public.
:::

::: context clean-room Building it again from nothing
Engineers have a name for rebuilding something without looking at the original: **clean-room** design. In the 1980s, companies that wanted to make IBM-compatible personal computers had one team write a description of *what* IBM's startup software did, and a separate team — who had never seen IBM's code — write new software from that description. The result did the same job, and they could show it was their own.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="30" width="90" height="40" rx="5" fill="#fff" stroke="#6c7a93"/>
  <text x="55" y="54" font-size="12" text-anchor="middle" fill="#1f2a44">original</text>
  <line x1="100" y1="50" x2="122" y2="50" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="128,50 120,46 120,54" fill="#1f2a44"/>
  <rect x="130" y="30" width="90" height="40" rx="5" fill="#f2b880" stroke="#1f2a44"/>
  <text x="175" y="47" font-size="11" text-anchor="middle" fill="#1f2a44">description</text>
  <text x="175" y="61" font-size="11" text-anchor="middle" fill="#1f2a44">of what it does</text>
  <line x1="220" y1="50" x2="252" y2="50" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="258,50 250,46 250,54" fill="#1f2a44"/>
  <rect x="260" y="30" width="90" height="40" rx="5" fill="#8fb8f0" stroke="#1d6fd1"/>
  <text x="305" y="54" font-size="12" text-anchor="middle" fill="#1f2a44">new code</text>
  <line x1="238" y1="14" x2="238" y2="86" stroke="#b4232c" stroke-width="3"/>
  <text x="238" y="102" font-size="11" text-anchor="middle" fill="#b4232c">wall: no original code crosses</text>
</svg>
```

Your portfolio rebuild follows the same spirit: take the skill and the general idea, never the original files, and write it again from public sources.
:::

::: context behavioral-round Talking about work you cannot show
A behavioral round asks about how you work: "Tell me about a time you found a bug nobody else could." Later in this track, a whole module teaches the STAR shape for these answers — situation, task, action, result. A good behavioral answer about restricted work stays at the level of *what kind* of problem it was and *what you did*, never the controlled numbers or the proprietary design. If you notice yourself reaching for a specific figure or part name, that is the moment to step back up a level.
:::
