---
id: l04-the-projects-section
title: "The projects section: the primary evidence, placed and labeled honestly"
minutes: 20
covers:
  - the projects section as the primary section for candidates without industry GNC experience
---

Every lesson so far has been building toward one section of the page. The top-third rule from lesson one said your strongest section has to lead; the keyword and skills work from lesson two said the basic qualifications need real evidence behind them; the bullet formula from lesson three gave you the sentence-level tool to write that evidence convincingly. For a candidate with no industry GNC role yet, all three of those threads point at the same section: Projects. This lesson is about building that section as what it actually is for this reader — not a supplement to a resume, but its primary argument.

That framing has real consequences for where the section sits, what it is called, and — the part candidates in your position most often get wrong in one direction or the other — how the work inside it is described. Undersell it, and your strongest evidence reads like an afterthought. Oversell it, and a careful reader loses trust in the whole page the moment a claim does not hold up. This lesson works through both failure modes and the honest description that sits between them.

## Where it goes, and why that is not concealment

Lesson one established that your strongest section belongs in the top third, immediately after the header and the one-line identity statement. For this reader, that section is Projects, paired with a brief one-line Education entry if you have relevant coursework or a degree in progress. It goes there even if you also have an Experience section listing real, paid jobs — because those jobs, if they are not GNC roles, carry less of the specific evidence a GNC reader is checking for than a verified simulation or a consistency-checked filter does.

It is worth addressing a worry directly, because it is a reasonable one: does leading with projects instead of employment history look like an attempt to hide a thin resume? It does not, for a simple reason — ordering a resume by the strength of the evidence is how every strong resume is built, for every candidate, at every level. A senior engineer leads with her most recent and most relevant role for the same reason you lead with your strongest project: because that is where the evidence a reader is checking for actually lives. A reader who reaches a strong, verified Projects section in the top third does not need you to explain or apologize for what comes later in the page. The ordering has already told her where to look, and she reads the rest with that context already established rather than as a series of surprises.

::: key
Projects leads the page for this reader not as a way of hiding a short employment history, but because it is where the strongest, most specific GNC evidence actually is. Ordering by evidentiary strength is standard practice, not concealment.
:::

## What to call it, and how to label an entry

The section heading itself should be plain: "Projects." Not "My Journey," not "What I've Built," not a heading engineered to sound distinctive — a reader scanning for a familiar shape benefits from a familiar name, and a plain heading costs you nothing, since the content underneath is what actually distinguishes the section, not its title.

Each entry needs its own short header: a project title that names the artifact plainly — "6-DOF Launch-Vehicle Simulation," not "My First Rocket Sim!" — followed by a compact metadata line: the primary language or tools, a rough duration or date range, and, if the work is public, a link to the repository. This metadata line does real work before a reader has read a single bullet: it tells her, at a glance, what kind of artifact this is and whether she can go look at it herself.

## Self-directed work: the honest label

Here is the specific problem this lesson exists to solve: how do you describe work that had no employer, no assigned team, and no external deadline, without either inflating it into something it was not or shrinking it into something apologetic. The honest answer sits in one place, and it is worth being precise about both edges.

Do not borrow employment framing that was not there. Do not give yourself a job title like "Simulation Engineer" for a project you built alone with no employer; do not imply a team, a client, or an organizational sponsor that did not exist. A reader who later asks a direct question in an interview — who else worked on this, who was it for — and gets an answer that contradicts the resume's framing loses trust in everything else on the page, not just that one line.

Do state plainly what the work actually was, and let real, checkable signals of rigor do the work that an inflated title would otherwise be trying to do. "Independent project" or "self-directed project" is accurate and carries no penalty by itself — what actually persuades a reader is not the label but the content underneath it: a public repository, a stated verification method, a CI pipeline that runs on every change, a reproducible one-command setup. Every one of these is a fact a reader can check for herself, which is a stronger form of credibility than any title you could give the entry.

Do not undersell it either. Apologetic language — "just a small simulation I built for fun," "a simple project for practice" — actively works against your strongest section by signaling, before the reader has read a single bullet, that you do not consider the work significant. If a project used a real method, was verified against a real reference, and produced a real measured result, describe it with the same direct, factual confidence the bullet formula from the previous lesson already gives you. The problem-method-result structure itself is what establishes seriousness; it needs no adjectives added on top, and it needs no apology underneath.

::: key
Label self-directed work plainly — "independent project" or "self-directed project" — without borrowed employment framing and without apologetic hedging. The credibility comes from checkable content underneath the label: a public repository, a stated verification method, a reproducible setup, and results a reader can weigh, not from the label itself.
:::

::: warning A single unverified line under a generic heading buries your strongest evidence
Listing your best project as one bare line — "Built a spacecraft simulator" — under a heading like "Other" or "Additional Work" near the bottom of the page wastes the strongest evidence you have. If it is your strongest evidence, it belongs in the top third, with the full problem-method-result treatment, not compressed into a line that looks like an afterthought.
:::

::: example A complete entry, built end to end
6-DOF ADCS Momentum-Management Simulation · Python, NumPy · self-directed, 6 weeks · [public repository link]

- Built a spacecraft attitude-control simulation combining three reaction wheels and three magnetorquers, modeling wheel friction and a saturating actuator response.
- Implemented a B-dot detumble law for initial rate reduction and a continuous wheel-desaturation law using the magnetorquers, switching between the two based on angular rate.
- Simulated a 30-day mission timeline and reported steady-state pointing error held below 0.3 degrees with wheel momentum bounded within actuator limits throughout, with no unplanned saturation event.

Notice that the entry does three separate jobs at once. The title and metadata line let a reader place the project in under two seconds — what it is, what it was built with, how long it took, and that a repository exists to check it against. The bullets then apply the exact structure from the previous lesson to each phase of the work: a modeling problem, a control-law problem, and a full-mission validation, each with its own method and its own measured result. Nowhere does the entry claim an employer, a team, or a title that was not there — and nowhere does it apologize for being a project rather than a job.
:::

::: example Ordering three anchor projects for a specific reader
A candidate has three strong anchor projects: a 6-DOF launch-vehicle simulation, a consistency-checked attitude estimator, and a powered-descent guidance study. Applying to a posting emphasizing entry, descent, and landing work, she leads the Projects section with the descent-guidance study, follows with the 6-DOF simulation, and places the estimator third. Applying to a posting emphasizing navigation and state estimation, she reorders the same three entries so the estimator leads, followed by the 6-DOF simulation, with descent guidance third.

Nothing about any individual entry changes between the two versions — every bullet, every number, every verification claim stays exactly as written, because all of it is true regardless of which posting she is applying to. Only the order changes, so that whichever evidence matters most to a specific reader is the first thing that reader sees. This is the same top-third logic from lesson one, applied inside the section rather than to the page as a whole, and it is the seed of a larger idea — tailoring a resume to a role family — that the module returns to in full later.
:::

## Check yourself

::: check
A candidate has a part-time retail job with two years of tenure and one strong, verified 6-DOF simulation project. Explain why the project belongs above the retail job in the top third, rather than the job leading simply because it is "real" paid employment.
:::

::: answer
Section order should follow the strength of the evidence for the role being applied to, not the mere fact that one entry involved a paycheck. For a GNC posting, a verified simulation with a stated method and a measured result is far stronger evidence of the relevant capability than an unrelated retail role, regardless of which one paid wages. Placing the project first puts the most relevant evidence where a first-pass reader looks first; the retail job still belongs on the page, lower, where its lesser relevance to this specific posting is reflected in its position.
:::

::: check
A friend tells a candidate that leading her resume with a Projects section, above her (unrelated) work history, will make it look like she is hiding something. How should she respond to this concern?
:::

::: answer
Ordering a resume by the strength of the evidence is standard practice at every career stage, not a concealment tactic — a senior engineer leading with her most recent relevant role is doing the same thing for the same reason. A reader who reaches strong, verified project evidence in the top third does not need an excuse for what appears later; the ordering has told her where the real evidence is, and she reads the rest of the page with that established rather than as something being hidden from her.
:::

::: check
A candidate titles her project entry "Simulation Engineer, Independent" as though it were a job title. What is wrong with this, and what should replace it?
:::

::: answer
This borrows the framing of paid employment — a job title and an implied employer — for work that had neither, and it risks contradicting the candidate's own answer if an interviewer later asks a direct question about who she worked with or for. It should be replaced with an accurate project title naming the artifact itself, such as "6-DOF ADCS Momentum-Management Simulation," labeled plainly as a self-directed or independent project rather than framed as a job.
:::

::: check
A project entry opens with "Just a small simulation I put together for fun, nothing too serious." Identify what is wrong with this framing and explain why it counts as underselling rather than an honest description.
:::

::: answer
This is underselling because it signals, before the reader has read a single bullet, that the candidate herself does not consider the work significant — regardless of whether the underlying project actually used a real method, real verification, and produced a real result. An honest description states plainly what the project is and lets the problem-method-result content establish its seriousness; hedging language undercuts evidence that may otherwise be entirely strong, and gives a reader a reason to skim past a section that deserved her full attention.
:::

::: check
A candidate has three anchor projects and is deciding how to order her Projects section for a posting that emphasizes navigation and state estimation over vehicle dynamics. What should guide her decision, and what should stay exactly the same across different versions of her resume?
:::

::: answer
The decision should be guided by which project's evidence most directly matches what this specific posting is checking for — here, the estimation project should lead, since it most directly answers the reader's first-pass question for a navigation-focused role. What should stay identical across versions is the content of every entry itself: every bullet, number, and verification claim remains exactly as written, because it is true regardless of the posting. Only the order of the entries changes to match which evidence a given reader most needs to see first.
:::

## Summary

| Decision | This module's guidance | Reasoning |
| --- | --- | --- |
| Section placement | Projects sits in the top third, above unrelated Experience | It carries the strongest evidence for this reader, and ordering by evidentiary strength is standard practice |
| Section heading | Plain: "Projects" | A familiar name scans fast; the content, not the title, should carry the distinction |
| Entry header | Project title, tools, duration, a link if public | Lets a reader place the project and verify it herself in seconds |
| Self-directed label | "Independent project" or "self-directed project," stated plainly | Accurate, carries no penalty, and shifts the real persuading work to checkable content underneath |
| Entry order | By relevance to the specific posting | Same underlying facts, reordered so the strongest match leads — the seed of tailoring, covered in full later |

The next lesson steps back from content entirely and covers a purely mechanical question that determines whether any of this even gets read: how to format the file itself so that an applicant tracking system parses it correctly.
