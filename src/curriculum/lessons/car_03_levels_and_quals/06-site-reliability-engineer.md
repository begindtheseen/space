---
id: l06-site-reliability-engineer
title: "Site Reliability Engineer, GNC: the other in-lieu door"
minutes: 17
covers:
  - "Site Reliability Engineer, GNC: the verbatim 4+ years in lieu of a degree line"
---

A race team has drivers, and it also has the crew who keep the garage running: the tools calibrated, the computers that model the car working, the spare parts where they should be. Both jobs are on the same team. Both matter. But nobody would call the garage crew "drivers with a lower bar."

The previous lesson named two places in this role family where a stated number of years of professional experience formally replaces a degree, and covered the first: Sr. GNC Engineer. This lesson covers the second — **Site Reliability Engineer, GNC**. Before you compare its number with anything, understand what the job is. It is not a variant of the GNC Engineer job this module has spent five lessons on. It is a different job that happens to sit inside the same organization.

The earlier role-families module placed it precisely. A Site Reliability Engineer, GNC works on the **[[high-performance computing|hpc]]** infrastructure behind **[[Monte Carlo|monte-carlo]]** simulation campaigns, and on the **[[continuous-integration|ci]]** systems that keep rocket and simulation software building and testing reliably. That is infrastructure and software-reliability engineering in service of the GNC organization's tools. It is not trajectory design, control-law derivation or state estimation. Keep that difference in view and the rest of this lesson makes sense.

## The verbatim basic qualification

Here is the line, word for word:

> Bachelor's degree in computer science, information systems/IT, engineering, math, or scientific discipline and 2+ years of software development experience OR 4+ years of professional experience building software with site reliability or DevOps in lieu of a degree; 1+ years of experience with Linux operating systems; 1+ years of experience with Python and Python based development frameworks.

This sentence tucks an "or" inside a larger "and" that is never written out. It is genuinely easy to misread which parts are optional. Think of a restaurant deal: "soup or salad; a main course; a drink." You choose between soup and salad. You do not get to choose between salad and the drink.

Read carefully, the sentence holds **[[three separate conditions|logic-shape]]**, and only the first one splits in two:

1. **Either** a qualifying bachelor's degree plus 2+ years of software development experience, **or** 4+ years of professional experience building software with site reliability or **[[DevOps|devops]]** work, in lieu of a degree.
2. 1+ years of experience with **[[Linux|linux]]** operating systems.
3. 1+ years of experience with Python and Python-based development **[[frameworks|frameworks]]**.

Conditions two and three are *outside* the "or." They apply no matter which branch of condition one you use. The **semicolons** are the clue: each one closes off a separate requirement.

So a candidate who clears the degree-plus-two-years branch easily, but has never used Linux, does not meet this posting's basic qualifications. The Linux clause is not one of the choices the "or" offers. It sits on top of them.

The degree list in the first branch — computer science, information systems/IT (said "I-T," information technology), engineering, math, or a scientific discipline — is the broadest degree clause anywhere in this module. That breadth fits the job. The role is defined by infrastructure and software reliability, not by domain physics, so a math or general science background is as plausible a starting point as an engineering one.

::: key
Site Reliability Engineer, GNC — basic qualifications: bachelor's degree in computer science, information systems/IT, engineering, math, or scientific discipline and 2+ years of software development experience OR 4+ years of professional experience building software with site reliability or DevOps in lieu of a degree; 1+ years of experience with Linux operating systems; 1+ years of experience with Python and Python based development frameworks.
:::

::: warning The Linux and Python clauses apply whichever branch you use
It is easy to read the sentence's single "or" as covering the whole qualification — as if a candidate strong on the degree-and-years side could be excused from the Linux or Python lines. The semicolons mark those two clauses as separate conditions stacked on top of whichever branch of the first condition applies. They are not alternatives folded into the same choice.
:::

## Comparing the two in-lieu thresholds honestly

This posting's in-lieu branch is 4+ years of professional experience building software with site reliability or DevOps work, in place of the bachelor's degree.

Set it beside Sr. GNC Engineer's in-lieu branch from the previous lesson: 7+ years. Four is less than seven. So this is the lower of the two thresholds — and the lower of the only two stated degree-optional doors in this role family's postings.

Be precise about what that comparison supports.

**What it supports:** four is a smaller number than seven. That is a plain fact about the two postings' text.

**What it does not support:** that one threshold is a discount version of the other, or that the two sit on one shared scale you could slide along. They are two different roles, written by two different hiring teams, for two different kinds of work. The module's source material gives no reason linking the two numbers at all. Treat them as two thresholds set independently for two different jobs — not as two points on one line.

### Why a degree-optional door might fit this kind of role

Here is a general observation, kept separate from that comparison. Site reliability and DevOps is a corner of the software world where strong practitioners who learned largely on their own or on the job, without a traditional computer science degree, are relatively common. That is a pattern visible across the technology industry broadly, not a claim about this employer.

It *may* be part of why a degree-optional door attaches more naturally to this kind of role than to, say, an orbital-mechanics-heavy GNC Engineer posting, where the physics is harder to learn entirely outside formal coursework. Offer that as plausible general reasoning — not as a stated fact about why this posting was written this way. The source material does not say.

::: key
The two stated in-lieu-of-degree doors in this role family: Sr. GNC Engineer, 7+ years of professional experience in lieu of a degree; Site Reliability Engineer, GNC, 4+ years of professional experience building software with site reliability or DevOps in lieu of a degree. These are the only two widely seen degree-optional routes into the organization this module covers.
:::

## A stepping stone? What can honestly be said

The role sits inside the same organization as the GNC Engineer roles, and it works closely with the simulation and CI infrastructure those roles depend on. So it is tempting to read it as a side door: take the lower bar now, **[[transfer|internal-transfer]]** into the "real" GNC job later. That idea deserves a straight answer — neither encouragement nor dismissal.

**What is reasonable to say in general.** Many employers support some form of movement between neighboring teams, through their own internal processes. Someone working inside an organization plausibly sees its people and open needs in a way an outside applicant does not.

**What this module cannot tell you.** How often such moves happen here, what process governs them, how they are judged, or how long they take. None of that is in the source material this module is built from. Stating a figure or a process would mean inventing one.

**What can be said plainly.** Site Reliability Engineer, GNC is a real, distinct job in infrastructure and software reliability. Its basic qualifications are built around Linux, Python and DevOps-style software experience. None of the domain content from earlier lessons — control theory, orbital mechanics, state estimation — appears in them. Applying to it as a deliberately easier route into GNC engineering, rather than because you want the infrastructure work itself, is a bet on an internal path this module has no basis to promise.

::: warning This is not a lighter version of the GNC Engineer basic qualification
Reading Site Reliability Engineer, GNC as an easier way to "become a GNC engineer" misreads the job. Its basic qualifications ask for Linux systems experience, Python-based development, and site-reliability or DevOps software experience. That is a genuinely different skill set from the control-systems, orbital-mechanics and sensors-and-actuators cluster the Level I to II posting names. Being strong in one does not make you strong in the other, and the posting was not written as a discount entry point into the second.
:::

::: example A self-taught practitioner, checked clause by clause
A candidate has no bachelor's degree. They have five years of professional experience running Linux servers and building internal DevOps tools at a mid-sized software company. They have used Python daily, heavily, across all five years, including a Python-based automation framework.

**Condition 1, degree branch.** No degree, so the degree-plus-2+-years branch does not apply.

**Condition 1, in-lieu branch.** Five years of professional DevOps-style software work against a 4+ year line: $5 \ge 4$. Met, with a year to spare.

**Condition 2, Linux.** Five years of hands-on Linux administration against a 1+ year floor: $5 \ge 1$. Met comfortably.

**Condition 3, Python.** Daily Python and a Python-based framework for five years against a 1+ year floor. Met.

**Result:** all three conditions are met. This candidate meets the basic qualifications in full on the strength of the in-lieu branch alone, without ever needing the degree branch.

**Sanity check:** every condition was checked on its own, and the "or" was used only inside condition 1 — exactly the structure the sentence has.
:::

::: example A qualifying degree with a Linux gap
A candidate holds a mechanical engineering degree, which is inside the first branch's named fields ("engineering"). They have two and a half years of general software development experience.

**Condition 1, degree branch.** Engineering degree, and $2.5 \ge 2$ years of software development. Met.

**Condition 2, Linux.** Their operating-system experience is a few weeks of casual personal Linux use; their professional work was almost all on a different operating system. A few weeks is well under the 1+ year floor. Not met.

**Condition 3, Python.** The profile does not settle it — but it no longer matters.

**Result:** this candidate does *not* meet the basic qualifications, even though they plainly satisfy the more eye-catching degree-and-years branch. The Linux clause is a separate condition that applies whichever branch you use.

**Sanity check:** this is the exact misreading the warning above flagged — treating the single "or" as though it swept in every clause, instead of only the one it governs.
:::

## Check yourself

::: check
State the Site Reliability Engineer, GNC basic qualification exactly, including the in-lieu-of-degree branch.
:::

::: answer
Bachelor's degree in computer science, information systems/IT, engineering, math, or scientific discipline and 2+ years of software development experience OR 4+ years of professional experience building software with site reliability or DevOps in lieu of a degree; 1+ years of experience with Linux operating systems; 1+ years of experience with Python and Python based development frameworks.
:::

::: check
Parse the sentence's logic: which clauses are joined by "or," and which apply no matter which branch of that "or" a candidate satisfies?
:::

::: answer
The "or" joins only the two branches of the first condition: a bachelor's degree plus 2+ years of software development experience, versus 4+ years of professional site-reliability or DevOps software experience in lieu of a degree. The Linux clause (1+ years) and the Python clause (1+ years) are separate conditions, set off by semicolons. They apply whichever branch of the first condition a candidate used.
:::

::: check
Compare the Site Reliability Engineer, GNC in-lieu threshold (4+ years) with the Sr. GNC Engineer in-lieu threshold (7+ years). Is one a discounted version of the other? How should you treat the difference?
:::

::: answer
No. Nothing in the source material links the two thresholds or puts them on one shared scale. They are two numbers set independently for two different roles, by two different hiring teams, for two different kinds of work. The only safe conclusion is the plain numerical fact that four is less than seven. Treating one as a discount on the other would invent a relationship the postings never state.
:::

::: check
Why is it a misreading to treat Site Reliability Engineer, GNC as an easier way into doing GNC engineering work?
:::

::: answer
Its basic qualifications describe a genuinely different job — Linux systems experience, Python-based development, and site-reliability or DevOps software experience — with none of the control-systems, orbital-mechanics or sensors-and-actuators content that defines the GNC Engineer postings. It is a real, distinct role built around infrastructure and software reliability, not a lower-bar entry point into domain GNC work.
:::

::: check
What can this module honestly say about whether Site Reliability Engineer, GNC experience helps someone move into a GNC Engineer role later, and why is that answer limited?
:::

::: answer
It can say that working inside the organization plausibly gives someone more visibility into its teams and openings than an outside applicant has, and that many employers support some form of internal movement in general. It cannot say how often that happens here, what process governs it, or how long it takes, because none of that appears in the source material this module is built from. Giving a specific figure or process would mean inventing it rather than reporting it.
:::

## Summary

| Condition | Requirement | Independent of the others? |
| --- | --- | --- |
| Degree and years, OR in lieu of a degree | Bachelor's (CS, information systems/IT, engineering, math, or scientific discipline) + 2+ years software development, OR 4+ years professional software experience with site reliability or DevOps | The two branches are alternatives to each other |
| Linux | 1+ years of experience with Linux operating systems | Yes — applies whichever branch above is used |
| Python | 1+ years of experience with Python and Python-based frameworks | Yes — applies whichever branch above is used |
| The two in-lieu doors | Sr. GNC Engineer 7+ years; SRE, GNC 4+ years | Set independently for different jobs |

Both in-lieu-of-degree doors are now named in full: Sr. GNC Engineer's 7+ years and this posting's 4+ years. The next lesson turns to a phrase that appears, in some form, across several postings in this module — "capable of solving complex problems with little to no supervision" — and works out exactly what it asks an interviewer to find out about you.

::: context hpc A room full of computers working as one
**High-performance computing**, or HPC (said "H-P-C"), means tying together thousands of processors so they work on a job at the same time. The machine is called a **cluster**: rows of server racks joined by a fast network, with software that queues jobs and hands out processors fairly.

An SRE's job is to keep that cluster up, fast and fairly shared — so that when a hundred engineers all need results before a launch review, the machine does not fall over.
:::

::: context monte-carlo Why it is named after a casino
A **Monte Carlo** simulation runs the same flight many times, each time with small random changes: a slightly heavier payload, a gust of wind, a sensor a little off. Then engineers look at where all the runs ended up. The name comes from the casino in Monaco, because the method depends on chance, like a roulette wheel.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <ellipse cx="180" cy="85" rx="120" ry="55" fill="#fff" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="5 4"/>
  <g fill="#1d6fd1">
    <circle cx="180" cy="85" r="3"/><circle cx="160" cy="78" r="3"/><circle cx="200" cy="92" r="3"/><circle cx="170" cy="100" r="3"/>
    <circle cx="195" cy="70" r="3"/><circle cx="140" cy="90" r="3"/><circle cx="222" cy="80" r="3"/><circle cx="185" cy="108" r="3"/>
    <circle cx="150" cy="68" r="3"/><circle cx="210" cy="104" r="3"/><circle cx="120" cy="84" r="3"/><circle cx="240" cy="88" r="3"/>
    <circle cx="175" cy="60" r="3"/><circle cx="130" cy="104" r="3"/><circle cx="232" cy="66" r="3"/><circle cx="260" cy="96" r="3"/>
    <circle cx="100" cy="76" r="3"/><circle cx="205" cy="118" r="3"/><circle cx="158" cy="116" r="3"/><circle cx="190" cy="52" r="3"/>
  </g>
  <circle cx="180" cy="85" r="7" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <text x="180" y="160" font-size="11" text-anchor="middle" fill="#1f2a44">20 simulated landings around the target</text>
  <text x="310" y="40" font-size="11" text-anchor="end" fill="#b4232c">allowed zone</text>
</svg>
```

Real campaigns run thousands of cases, not twenty — which is exactly why they need a big computing cluster.
:::

::: context ci Continuous integration
**Continuous integration**, or CI (said "C-I"), means every change an engineer makes is automatically built and tested, many times a day, before it joins the shared code.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 100" font-family="Inter, Arial, sans-serif">
  <g font-size="11" text-anchor="middle" fill="#1f2a44">
    <rect x="10" y="30" width="70" height="34" rx="4" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/><text x="45" y="51">change</text>
    <rect x="100" y="30" width="70" height="34" rx="4" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/><text x="135" y="51">build</text>
    <rect x="190" y="30" width="70" height="34" rx="4" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/><text x="225" y="51">test</text>
    <rect x="280" y="30" width="70" height="34" rx="4" fill="#fff" stroke="#1d6fd1" stroke-width="2"/><text x="315" y="51">merge</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5"><line x1="80" y1="47" x2="100" y2="47"/><line x1="170" y1="47" x2="190" y2="47"/><line x1="260" y1="47" x2="280" y2="47"/></g>
  <text x="225" y="84" font-size="11" text-anchor="middle" fill="#b4232c">fails? change is sent back</text>
</svg>
```

For rocket software, the tests can include full flight simulations, so a broken change is caught on the ground in minutes instead of discovered later. Keeping that machinery fast and trustworthy is SRE work.
:::

::: context logic-shape The sentence drawn as a circuit
Picture the requirement as switches in a line. Current flows only if every switch in the line is closed. The first switch has two parallel paths: either one will do.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="10" y1="75" x2="30" y2="75" stroke="#1f2a44" stroke-width="2"/>
  <line x1="30" y1="35" x2="30" y2="115" stroke="#1f2a44" stroke-width="2"/>
  <line x1="150" y1="35" x2="150" y2="115" stroke="#1f2a44" stroke-width="2"/>
  <rect x="40" y="20" width="100" height="30" rx="4" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="90" y="39" font-size="11" text-anchor="middle" fill="#1f2a44">degree + 2+ yrs</text>
  <rect x="40" y="100" width="100" height="30" rx="4" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="90" y="119" font-size="11" text-anchor="middle" fill="#1f2a44">4+ yrs, no degree</text>
  <line x1="30" y1="35" x2="40" y2="35" stroke="#1f2a44" stroke-width="2"/><line x1="140" y1="35" x2="150" y2="35" stroke="#1f2a44" stroke-width="2"/>
  <line x1="30" y1="115" x2="40" y2="115" stroke="#1f2a44" stroke-width="2"/><line x1="140" y1="115" x2="150" y2="115" stroke="#1f2a44" stroke-width="2"/>
  <text x="90" y="80" font-size="12" text-anchor="middle" fill="#1d6fd1">OR</text>
  <line x1="150" y1="75" x2="170" y2="75" stroke="#1f2a44" stroke-width="2"/>
  <rect x="170" y="60" width="70" height="30" rx="4" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="205" y="79" font-size="11" text-anchor="middle" fill="#1f2a44">Linux 1+</text>
  <line x1="240" y1="75" x2="260" y2="75" stroke="#1f2a44" stroke-width="2"/>
  <rect x="260" y="60" width="70" height="30" rx="4" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="295" y="79" font-size="11" text-anchor="middle" fill="#1f2a44">Python 1+</text>
  <line x1="330" y1="75" x2="350" y2="75" stroke="#1f2a44" stroke-width="2"/>
  <text x="250" y="110" font-size="11" text-anchor="middle" fill="#b4232c">AND — both always required</text>
</svg>
```

In symbols: (degree branch OR in-lieu branch) AND Linux AND Python. The semicolons in the posting are where the ANDs go.
:::

::: context devops Where "DevOps" comes from
**DevOps** (said "dev-ops") joins two words: **development**, writing software, and **operations**, running it for real users. For a long time these were separate teams that handed work over a wall. DevOps is the practice of having the same people build, ship and run software, with heavy automation — tests, deployments, monitoring — so changes go out often and safely. The name took hold in the software industry around 2009.
:::

::: context linux Why Linux, specifically
**Linux** is a free, open-source operating system started by Linus Torvalds in 1991. It runs most of the world's servers, and since late 2017 every machine on the TOP500 list of the world's fastest supercomputers has run it. So a computing cluster for simulations is almost certainly a Linux cluster, and the people keeping it running must know Linux well: its command line, its file systems, its processes and its permissions.
:::

::: context frameworks What a framework is
A **framework** is a large, ready-made set of code that gives you the skeleton of a program, so you fill in only your part. Think of a coloring book: the lines are drawn, you add the color. In Python, well-known examples include Django and Flask for web services and pytest for testing. "Python based development frameworks" asks for experience building on tools like these, not only writing short scripts.
:::

::: context internal-transfer What an internal transfer is
An **internal transfer** is moving from one job to another inside the same company, instead of leaving and applying from outside. Companies usually have their own rules: how long you must be in a role first, whether your current manager is told, whether you interview again.

Those rules differ from company to company and are rarely published. That is why this lesson does not describe any specific process — it would have to invent one.
:::
