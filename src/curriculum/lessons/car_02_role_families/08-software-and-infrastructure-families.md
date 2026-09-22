---
id: l08-software-and-infrastructure-families
title: "Software Engineer, GNC and Site Reliability Engineer, GNC"
minutes: 20
covers:
  - "Software Engineer, GNC (Starship) and GNC Software Engineer, Operations Automation: analysis tools, pipelines, automation"
  - "Site Reliability Engineer, GNC: HPC Monte Carlo infrastructure, CI for rocket and simulation software"
---

Lesson one grouped this module's nine families into vehicle families, constellation families, and infrastructure families, and every lesson since has covered one of the first two groups. This lesson finally reaches the third: two families that do not own a guidance law, a filter, or an actuator loop themselves. They build and run the tools and computing infrastructure that every family covered so far actually depends on to get its own work done. Software Engineer, GNC and GNC Software Engineer, Operations Automation build the analysis tools, pipelines, and automation that turn a design idea into a result someone can review. Site Reliability Engineer, GNC keeps the large-scale computing infrastructure those pipelines run on actually available, correctly gated, and fairly shared.

This is a genuinely different center of gravity from everything else in this module, and it is worth naming plainly rather than treating every GNC family as equally weighted between software and domain theory: these two families sit at the software-heaviest end of the whole spectrum this module covers, and — with one honest caveat this lesson will not skip — they are among the more open doors into a GNC organization for a candidate whose strongest evidence is software engineering rather than control theory or orbital mechanics.

## Software Engineer, GNC and Operations Automation: the tools other engineers run

A Starship GNC engineer, back in lesson two, ran a Monte Carlo dispersion campaign against a candidate guidance law and traced a tail-case failure to its cause. None of that happens by hand. Someone builds the orchestration system that dispatches thousands of dispersion cases across a compute cluster, the dashboard that turns raw simulation output into the plots and success-rate statistics a design review actually looks at, the configuration-management tooling that keeps a vehicle's parameters and tunings correctly tied to the specific simulation run or flight they belong to, and the automated checks that catch a regression in a nightly build of the six-degree-of-freedom simulation before a human ever has to notice it by hand. That is this family's actual work: not deriving the guidance law or the filter, but building the pipeline that runs someone else's design efficiently, reliably, and reproducibly, and turns its output into something a human — or a review board — can actually use.

This family's artifact is different in kind from every family covered so far. A GNC Engineer's artifact is a design: a control law, a filter, a trajectory. This family's artifact is a tool that makes many other engineers' designs testable and reviewable, faster and more reliably than they could manage by hand. A pipeline that silently mishandles a fraction of its input is not a minor inconvenience the way a slow script might be — it can quietly corrupt the evidence an entire review depends on, which is exactly the shape of the failure the first worked example below walks through.

Some postings in this family carry the more specific title GNC Software Engineer, Operations Automation, and research on 2026 postings found this specialist variant, like the Navigation and State Estimation family two lessons back, more likely to list a Master's or PhD as a basic qualification than the general Software Engineer, GNC ladder. The plausible reason is the same shape of reason the navigation family carried: automating a judgment call that a human operator currently makes — deciding, for instance, when a piece of telemetry genuinely warrants intervention versus normal variation — can shade from straightforward tooling work into something closer to applied research, and the hiring bar for that end of the family reflects it.

::: key
Software Engineer, GNC (Starship) and GNC Software Engineer, Operations Automation: building analysis tools, pipelines, and automation — the infrastructure other GNC engineers depend on to run and review their own work, rather than deriving that work directly.
:::

::: example A dashboard that quietly lies
A Monte Carlo dispersion dashboard reports a landing guidance law's success rate as 99.6 percent across a recent campaign, comfortably above the threshold a design review requires. Nothing about the number looks wrong on its face, and the review is scheduled to proceed on the strength of it.

Suppose the dashboard's data-parsing logic has a subtle edge case: a run that crashes before producing a complete output file is silently excluded from the aggregate statistics rather than counted as a failure, because the parser was written to skip malformed records rather than flag them. If a meaningful fraction of the campaign's actual failures crashed outright instead of completing with a bad result, the true success rate is measurably worse than 99.6 percent, and the dashboard's silence about the missing runs is actively hiding the fact that the number is wrong rather than merely imprecise. Catching this requires the engineer who owns the pipeline to know what a dispersion campaign's output is supposed to look like well enough to notice that the total run count does not match what was actually dispatched — domain literacy applied to a software problem, not a substitute for the software skill, but not optional either.
:::

## Site Reliability Engineer, GNC: the computing infrastructure everyone shares

Every dispersion campaign referenced in this module so far — the Starship tail-case investigation, the Falcon landing-accuracy analysis, the fleet-wide ADCS validation — runs on shared compute infrastructure, and postings in this family describe owning that infrastructure directly: running the HPC cluster, sized at tens of thousands of CPUs, that large-scale Monte Carlo work actually executes on, plus continuous integration for rocket and simulation software, GNC analysis infrastructure more broadly, and vehicle configuration verification tools that check a given vehicle configuration is correctly and consistently assembled before compute time is spent running it.

What makes this family's reasoning genuinely different from general-purpose software engineering is what the infrastructure is shared by and what a failure of it actually costs. A Starship dispersion campaign and a Falcon dispersion campaign can both want the same cluster at the same time in the days before their respective flight readiness reviews, and deciding how to allocate a finite, contended resource fairly and effectively across competing teams' real deadlines is a genuine, recurring engineering judgment call, not a solved problem you configure once. A continuous-integration pipeline that gates changes to flight or simulation software is not a convenience either — when it breaks, it can block an entire team's progress until it is fixed, which is a materially higher-stakes failure than a broken build blocking one engineer's afternoon.

::: key
Site Reliability Engineer, GNC: running the HPC cluster of tens of thousands of CPUs for large-scale Monte Carlo, plus continuous integration for rocket and simulation software, GNC analysis infrastructure, and vehicle configuration verification tools.
:::

::: warning "Done" here does not mean "shipped once"
Unlike a design that is finished once it clears a review, this family's work is closer to the continuous, no-clean-finish-line character the ADCS family showed several lessons back. A cluster that was correctly provisioned last month and a CI pipeline that passed its own tests once are not automatically still serving their purpose today. Capacity, reliability, and correctness here are standards to keep meeting, not boxes to check once.
:::

::: example Two reviews, one cluster, one week
Two flight readiness reviews are scheduled for the same week, and the teams behind them each need a large Monte Carlo campaign completed before their review — more combined compute demand than the cluster can serve simultaneously at each team's preferred turnaround time. Neither campaign can be told to wait without real cost: a delayed campaign risks delaying the review it supports.

The engineer who owns this infrastructure has to reason about the situation explicitly rather than let it resolve itself by whichever job happened to queue first: which review's timeline has less slack, whether either campaign can be partially prioritized or run in a reduced-fidelity mode that still produces a defensible result sooner, and whether temporarily reallocating capacity from lower-priority background work can close some of the gap. The resolution is a judgment call, made visible and communicated to both teams rather than hidden inside a scheduler's default behavior, and it is exactly the kind of decision that separates this family's work from keeping a machine turned on.
:::

## What a week looks like, and curriculum links

A Software Engineer, GNC spends real time writing and maintaining pipeline code — often Python orchestrating compiled simulation binaries — tracking down exactly the kind of silent data-handling bug the dashboard example walked through, and adding new automated checks to a pipeline that other engineers rely on before their own review. A Site Reliability Engineer, GNC spends real time responding to infrastructure incidents such as the capacity conflict above, expanding CI test coverage for a simulation or flight-software repository, and planning capacity ahead of a known demand spike rather than reacting to it after the fact.

Both families draw heavily on this curriculum's coding track: Docker and Reproducible Environments and Continuous Integration for Simulation Code for the pipeline and CI infrastructure itself, Testing with pytest and Engineering Hygiene and Debugging and Profiling as a Discipline for building tools that are themselves trustworthy, Python Performance for Monte Carlo Work and NumPy and Array Thinking for making large-scale campaigns run efficiently, and Linux and the Shell together with Git: the Object Model and Daily Use for the operating environment this work actually lives in. SQL and Window Functions for Telemetry Analytics support the kind of dashboard and reporting work the first example in this lesson depended on. None of this replaces domain knowledge entirely — Probability & Statistics and Verification, Validation & Monte Carlo Analysis matter here too, not to derive a dispersion campaign's methodology, but to understand well enough what the campaign needs to report that a tool built for it is actually correct rather than merely fast.

Against the six generic categories, both families sit overwhelmingly in flight software — in the software-engineering sense, worth being precise about rather than conflating with the onboard, real-time flight code the vehicle families write, since this family's code runs almost entirely on ground-side analysis and infrastructure systems rather than flying on a vehicle — and in simulation and V&V, since building and running that infrastructure is what makes every other family's V&V work possible at scale. Hardware-in-the-loop and test shows up specifically through CI, which is itself a form of automated, continuous testing infrastructure. Analysis is present as something this family enables rather than performs directly. Navigation and sensors and mission design are essentially absent from both.

## An honest note on how open this door actually is

This is one of the most reachable families in this entire module for a candidate whose strongest evidence is software engineering rather than control theory or orbital mechanics, and it is worth being direct about that rather than treating every GNC posting as equally gated by domain theory. A candidate with real, demonstrated skill in building reliable pipelines, maintaining CI infrastructure, and writing efficient, well-tested code has a legitimate, direct path into this family without first needing years of control-theory or estimation-theory depth.

The honest caveat is that "open" does not mean "no domain literacy required." The dashboard example in this lesson exists to make that point concretely: a tool built by someone who does not understand what a dispersion campaign's output is supposed to look like is a liability, however well-engineered its code is, because it can quietly corrupt the evidence an entire engineering review depends on without anyone noticing until later. The bar this family actually sets is real software engineering skill plus enough domain fluency to know what the software is for — not domain theory at the depth the vehicle or estimation families need, but not zero either.

## Check yourself

::: check
State what Software Engineer, GNC and GNC Software Engineer, Operations Automation actually build, and explain why their artifact is different in kind from a GNC Engineer's artifact in any other family this module has covered.
:::

::: answer
They build analysis tools, pipelines, and automation — orchestration systems, dashboards, configuration-management tooling, and automated regression checks — rather than deriving a control law, a filter, or a trajectory themselves. Their artifact is a tool that makes other engineers' designs testable and reviewable at scale, rather than a design of their own; "done," for this family, is about the tool working correctly and being trusted by the engineers who use it, not about a specific vehicle behavior being proven.
:::

::: check
Give the reason this lesson offers for why the Operations Automation specialist variant more often lists an advanced degree than the general Software Engineer, GNC ladder.
:::

::: answer
Automating a judgment call that a human operator currently makes — such as deciding whether a piece of telemetry genuinely warrants intervention rather than reflecting normal variation — can shade from straightforward tooling work into something closer to applied research, since it requires modeling and validating a decision process rather than only building infrastructure around an existing one. The hiring bar for that end of the family reflects the more research-adjacent nature of the work.
:::

::: check
In the dashboard example, the pipeline was not producing a visibly broken output — the success-rate number looked plausible. What does this teach about why domain literacy matters for an engineer in this family, even though the job is primarily software engineering?
:::

::: answer
A pipeline bug that produces a plausible-looking but wrong number is more dangerous than one that crashes outright, because nothing about the output prompts anyone to question it. Catching this kind of failure requires the engineer to know enough about what a dispersion campaign's output should actually look like — such as the total run count matching what was dispatched — to notice the discrepancy, which is domain literacy applied in service of the software work, not a replacement for the software skill itself.
:::

::: check
Explain why this lesson describes Site Reliability Engineer, GNC's "done" as continuous rather than a one-time deliverable, and give the two specific responsibilities named in this lesson that illustrate it.
:::

::: answer
The infrastructure this family owns is shared, ongoing, and has to keep meeting its standard rather than meeting it once and staying finished — a cluster correctly provisioned last month is not guaranteed to still be adequate today, and a CI pipeline that passed its own tests once is not guaranteed to still be correctly gating changes now. The two responsibilities this lesson names that illustrate this are capacity planning across competing teams' demand, worked through in the two-reviews example, and maintaining continuous integration for rocket and simulation software, both of which are standards to keep meeting rather than tasks to complete once.
:::

::: check
A candidate has built and maintained a real continuous-integration pipeline for a personal simulation project — automated testing, containerized builds, a working deployment process — but has never derived a control law or a navigation filter. Which families from this module fit this evidence best, and which do not, and why?
:::

::: answer
This evidence fits Software Engineer, GNC, GNC Software Engineer, Operations Automation, and Site Reliability Engineer, GNC directly, since all three weight exactly this kind of software and infrastructure skill most heavily and do not require the candidate to have derived a control law or filter themselves. It fits the vehicle families, ADCS, and Navigation and State Estimation poorly on its own, since those families are centered on deriving and defending domain-theoretic designs — a real CI pipeline is strong evidence of engineering discipline, but it says nothing directly about the control-theory or estimation depth those families test for.
:::

## Summary

| Family | Core artifact | "Done" looks like | Runs where |
| --- | --- | --- | --- |
| Software Engineer, GNC / Operations Automation | Analysis tools, pipelines, automation | The tool is correct, tested, and trusted by the engineers using it | Ground-side analysis infrastructure |
| Site Reliability Engineer, GNC | HPC cluster availability, CI for rocket and simulation software | Infrastructure stays available, correctly gated, and fairly allocated — continuously | Shared compute infrastructure across teams |

The next lesson leaves the nine established families behind and covers the newest names appearing in 2026 postings — Starfall, Starmind, and Starshield — and what it means, structurally, to target a program still young enough that its own job titles have not finished settling.
