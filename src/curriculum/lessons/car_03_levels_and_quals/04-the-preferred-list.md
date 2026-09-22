---
id: l04-the-preferred-list
title: "The GNC Engineer preferred list, item by item"
minutes: 19
covers:
  - the full preferred list for GNC Engineer and what each item signals
---

The previous lesson took the Level I to II posting's basic qualifications apart and left its preferred qualifications untouched. This lesson picks those up, and treats them differently than the last three lessons treated any preferred list so far: not as a quick aside about what a signal does versus a filter, but as the thing itself, read line by line, because this particular list is unusually specific, and specificity is exactly what makes a preferred list worth studying rather than skimming.

The stated preferred qualifications are:

> Flexible body control, filtering, trajectory optimization, aerodynamics, rendezvous and proximity operations, atmospheric entry, propulsive landing, fault management, software development, and inertial, optical, ranging and GPS sensor systems; demonstrated project or professional experience in launch vehicle and/or spacecraft systems.

Ten named technical areas, followed by a closing clause about how experience in them can be shown. None of this is required, in the sense the previous lessons already established — a candidate need not have professional depth in all ten to be a strong applicant. But a list this specific was not written by someone reaching for generic engineering virtues. It was written by people close to the actual work, and it names that work directly. That is what makes it worth the rest of this lesson: not as a bar, but as the closest thing to a syllabus a posting can hand you before you have even had a first conversation with anyone on the team.

## Why this list rewards being read closely

A vaguer preferred list — "strong technical background, excellent problem-solving skills" — gives you almost nothing to prepare against, because it names no actual subject matter. This list is the opposite: every item is a real technical area with a real body of theory and practice behind it, and several of them map directly onto specific vehicle programs this curriculum's earlier module on role families already introduced. Reading the list this closely is not universal practice — plenty of postings across the industry are written with far less specificity, and treating every preferred list as this information-dense would be a mistake. This one, though, rewards it, and once you know how to read one like it, you can recognize a similarly specific list on a different posting and treat it the same way.

## Dynamics and control theory: flexible body control, filtering

**Flexible body control** names the problem of controlling a vehicle whose structure is not perfectly rigid — where bending and sloshing modes in the airframe interact with the control loop itself, rather than being safely ignorable. This matters most on large, structurally flexible vehicles and on spacecraft with large deployed appendages such as solar arrays, where a control law designed as though the body were rigid can excite a structural mode it never accounted for. **Filtering** names state estimation broadly — using noisy, incomplete sensor measurements to produce a best estimate of where a vehicle actually is and how it is actually moving, the family of techniques built around the Kalman filter and its many variants. The deep mathematics behind both of these lives elsewhere in this curriculum's more technical tracks; what matters here is narrower: an interviewer who sees genuine coursework or project depth in either is looking for evidence you can reason about a system whose true state is never directly observable, only inferred.

## Trajectory and mission phase: optimization, aerodynamics, rendezvous and proximity operations, atmospheric entry, propulsive landing

These five items map almost one-to-one onto specific mission phases and specific programs already named in this curriculum's role-families module. **Trajectory optimization** is the general problem of finding the best path through a constrained space of possible trajectories — a thread that runs through ascent, entry, and landing alike. **Aerodynamics** matters wherever a vehicle flies through a meaningful atmosphere rather than pure vacuum — ascent through the lower atmosphere, and any entry phase. **Rendezvous and proximity operations** — closing the distance to another vehicle and maneuvering safely near it — is the signature problem of a crewed or cargo capsule meeting a space station, the kind of work this curriculum's role-families module attached specifically to the Dragon program. **Atmospheric entry** and **propulsive landing** are, together, the return half of a reusable vehicle's flight: surviving reentry heating and deceleration, then flying a powered landing to a precise point, work the same earlier module attached to booster recovery and to Starship specifically.

Showing depth in all five is not expected of one candidate — these are, in a real sense, different jobs done by different teams on different vehicles, even within a single company's GNC organization. Showing genuine depth in even one or two, tied to a specific project you can describe in detail, is a stronger signal than shallow familiarity with all five.

## Systems and reliability: fault management

**Fault management** is the discipline of detecting that a sensor or actuator has failed or is behaving badly, deciding what to do about it, and keeping the vehicle in a safe or recoverable state despite the failure — redundancy management, failure detection and isolation, graceful degradation of control authority rather than an unhandled fault propagating into loss of the vehicle. Unlike the mission-phase items above, this one is not tied to a single program: every flight vehicle, on every program, needs some version of this, which makes it one of the more broadly transferable items on the list.

## Software: software development

Listing "software development" as its own preferred item, alongside a set of deeply domain-specific technical areas, is a deliberate signal in its own right. It tells you that strong software engineering practice — not only the ability to derive a control law or a filter equation on a whiteboard, but the ability to write software that is correct, tested, and maintainable — is treated as its own axis of strength, not an assumed byproduct of technical depth elsewhere. This is consistent with the two languages, C++ and Python, already appearing explicitly in this posting family's basic qualifications: the work is understood, throughout this role family, to be as much a software engineering job as a domain-theory job.

## Sensors: inertial, optical, ranging and GPS sensor systems

The closing technical item names four sensor families a navigation or GNC system draws on. **Inertial** sensors — accelerometers and gyroscopes, typically packaged as an inertial measurement unit — measure a vehicle's own acceleration and rotation directly, with no external reference, at the cost of error that accumulates over time. **Optical** sensors, such as star trackers or cameras, provide an external reference by observing known targets — stars for attitude, a target vehicle or a landing site for relative navigation. **Ranging** sensors measure distance directly, by radar, lidar, or similar means, and matter especially in proximity operations and precision landing, where knowing distance and closing rate is the whole problem. **GPS**, more generally satellite navigation, provides an absolute position and velocity fix from signals broadcast by a satellite constellation, where visibility to that constellation exists. A GNC engineer rarely needs deep expertise in all four; knowing what each one is actually good for, and where each one alone falls short, is the more realistic and more valuable form of the same knowledge.

## The closing clause: where a project is explicitly allowed to count

The preferred list ends with a clause worth reading as carefully as any of the ten technical items: "demonstrated project or professional experience in launch vehicle and/or spacecraft systems." This is the clearest place, anywhere in this module, where a posting states outright that a strong project — not only paid, employer-based work — counts as real evidence. It is worth being precise about exactly what that does and does not mean. This clause sits under preferred qualifications, not basic ones, so it is not overriding the "2+ years of professional experience" floor the previous lesson worked through in detail; it does not turn a personal project into a substitute for that basic-qualification line. What it does do is confirm, in the company's own words, that a serious project — a university rocketry team's guidance software, a substantial personal simulation, a competition entry — is legitimate evidence of exactly the kind this list is asking for, and can meaningfully strengthen an application even for a candidate whose professional experience is thinner than the ideal.

::: key
GNC Engineer preferred qualifications: flexible body control, filtering, trajectory optimization, aerodynamics, rendezvous and proximity operations, atmospheric entry, propulsive landing, fault management, software development, and inertial, optical, ranging and GPS sensor systems; demonstrated project or professional experience in launch vehicle and/or spacecraft systems.
:::

::: key
The closing clause explicitly accepts a demonstrated project as evidence — but under preferred qualifications, strengthening an application's ranking, not under the basic qualification's "2+ years of professional experience" line, which it does not substitute for.
:::

## Turning the list into a study plan

The most useful thing to do with a list like this is mechanical, and worth doing on paper rather than only in your head: for each item, write down the one question an interviewer could plausibly ask to probe it, then rate your own ability to answer that question well, honestly, from one to five. An item that draws a five needs no more preparation before an interview; an item that draws a one or two is not a reason to panic, since nobody is expected to show strength across all ten, but it tells you precisely where your account of your own experience is currently thin, which is far more actionable than a vague sense of "I should know more GNC."

::: warning Ten items on a list does not mean ten years of hands-on experience is expected
No individual candidate arrives with deep professional experience in flexible body control, rendezvous, atmospheric entry, and propulsive landing all at once — these are, in practice, different specializations that different engineers on different programs spend their careers on. Reading the list as a checklist to fully complete before applying is a self-defeating standard nobody meeting it would actually need to apply against.
:::

::: warning A strong project still gets probed in depth
The closing clause's explicit welcome of project experience is not a shortcut around actually understanding the material. A project raised in an interview will be questioned the same way professional experience would be — what choices were made, what alternatives existed, what would you do differently — so treat a project as real evidence to be examined, not as a credential that ends the conversation once mentioned.
:::

::: example Partial coverage, read honestly
A candidate has two years of professional experience heavy on fault management and software development — building failure-detection logic and the test infrastructure around it — with no professional exposure to rendezvous, atmospheric entry, or propulsive landing at all. Read against the full list, this is genuinely partial coverage: two of ten items strong, the rest largely absent.

Read correctly, this is not a weak application. A candidate applying to a posting tied to a program where fault management and software rigor matter most — rather than one built around entry or landing specifically — is bringing exactly the strength that program's own work would draw on, and the honest way to present this candidacy is to lead with the fault-management and software depth explicitly, rather than apologizing for the mission-phase items that do not apply, since the list was never asking for all ten from one person.
:::

::: example Turning one item into a prepared answer
Take "filtering." A plausible interview question behind it: "Walk me through a time you had to estimate a system's state from noisy or incomplete sensor data — what filter or method did you use, and why that one instead of an alternative?" A candidate who implemented an extended Kalman filter for a university project fusing accelerometer and camera data can rate themselves a four on this item: they have a concrete, specific answer, including a real design choice — the extended Kalman filter over a more complex unscented or particle filter — that they can defend on the grounds of the problem's mild nonlinearity and the computational budget available. A candidate who has only read about Kalman filtering in a textbook, with no implementation to describe, might honestly rate themselves a two: real conceptual familiarity, but nothing yet to walk an interviewer through step by step. The gap between those two ratings is exactly the gap a small, concrete project would close before the actual interview.
:::

## Check yourself

::: check
Recite the GNC Engineer preferred qualifications list in full.
:::

::: answer
Flexible body control, filtering, trajectory optimization, aerodynamics, rendezvous and proximity operations, atmospheric entry, propulsive landing, fault management, software development, and inertial, optical, ranging and GPS sensor systems; demonstrated project or professional experience in launch vehicle and/or spacecraft systems.
:::

::: check
Why does this particular preferred list function as more than a ranking device, given everything the first lesson of this module established about what preferred qualifications formally do?
:::

::: answer
Its formal function is still ranking, not gating — nothing here changes that. What makes it more useful than a vaguer list is its specificity: because it names real technical subject matter and real mission phases rather than generic virtues, it doubles as an honest, detailed description of what the team's work actually involves, which makes it usable as preparation material well beyond its formal role in ranking candidates.
:::

::: check
Explain the difference between what the closing clause ("demonstrated project or professional experience...") permits and what the basic qualification's "2+ years of professional experience" line, from the previous lesson, requires.
:::

::: answer
The closing clause sits under preferred qualifications and explicitly allows a demonstrated project to count as evidence, strengthening how a candidate ranks among others who already passed the basic filter. The basic qualification's years line is a hard filter requiring professional, employer-based experience specifically, and nothing in the preferred list's closing clause changes or substitutes for that separate requirement.
:::

::: check
A candidate has professional experience touching exactly two of the ten named preferred items. Should they expect to be screened out on that basis? Explain why or why not.
:::

::: answer
No. Preferred qualifications are a ranking signal among candidates who already meet the basic qualifications, not a second filter, and no individual is expected to show strength across all ten items — they describe different specializations across different programs. Two items with genuine depth is a normal, honestly partial showing, and the right response is to present that strength clearly rather than treat the other eight as a deficiency.
:::

::: check
Choose the "fault management" item and explain, in your own words, what kind of work it most likely signals and why it is described as more broadly transferable than a mission-phase item like atmospheric entry.
:::

::: answer
Fault management signals work detecting sensor or actuator failures, deciding how to respond, and keeping a vehicle in a safe or recoverable state despite the failure — redundancy management and graceful degradation rather than an unhandled fault causing loss of the vehicle. It is more broadly transferable than an item like atmospheric entry because every flight vehicle on every program needs some version of it, whereas atmospheric entry is a specific mission phase relevant only to vehicles that actually fly through an atmosphere during reentry.
:::

## Summary

| Cluster | Items | What it signals |
| --- | --- | --- |
| Dynamics and control theory | Flexible body control, filtering | Reasoning about a system whose true state must be inferred, not directly observed |
| Trajectory and mission phase | Trajectory optimization, aerodynamics, rendezvous and proximity operations, atmospheric entry, propulsive landing | Depth tied to a specific vehicle program and flight phase, not all five at once |
| Systems and reliability | Fault management | Broadly transferable across every program |
| Software | Software development | Software engineering treated as its own axis of strength, not assumed |
| Sensors | Inertial, optical, ranging and GPS sensor systems | Knowing what each sensor type is good for and where each falls short |
| Evidence clause | Demonstrated project or professional experience | A project explicitly counts here — but under preferred, not as a substitute for the basic years requirement |

The next lesson leaves the Level I to II posting behind and moves up the ladder to Sr. GNC Engineer, where the basic qualification itself opens into three separate branches — including the first of two places in this module where professional experience is stated as a formal substitute for a degree.
