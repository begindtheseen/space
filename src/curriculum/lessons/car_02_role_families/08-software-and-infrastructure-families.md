---
id: l08-software-and-infrastructure-families
title: "Software Engineer, GNC and Site Reliability Engineer, GNC"
minutes: 20
covers:
  - "Software Engineer, GNC (Starship) and GNC Software Engineer, Operations Automation: analysis tools, pipelines, automation"
  - "Site Reliability Engineer, GNC: HPC Monte Carlo infrastructure, CI for rocket and simulation software"
---

A Formula 1 race is won by a driver. But behind the driver is a pit crew, a garage full of tools, and a room of computers crunching data from every lap. Nobody in that room steers the car. Without them, the car does not finish the race.

Lesson one sorted this module's nine families into three groups: vehicle families, constellation families and infrastructure families. Every lesson since has covered one of the first two. This lesson reaches the third — the pit crew. These two families do not own a guidance law, a filter or an actuator loop. They build and run the tools and the computers that every other family depends on.

- **Software Engineer, GNC** and **GNC Software Engineer, Operations Automation** build the analysis tools, pipelines and automation that turn a design idea into a result someone can review.
- **Site Reliability Engineer, GNC** keeps the large computing systems those pipelines run on available, correctly gated (letting through only code changes that pass their tests), and fairly shared.

These two families sit at the software-heaviest end of everything this module covers. With one honest caveat this lesson will not skip, they are among the more open doors into a GNC organization for someone whose strongest evidence is software engineering rather than control theory or orbital mechanics.

## Software Engineer, GNC and Operations Automation: the tools other engineers run

Back in lesson two, a Starship GNC engineer ran a **Monte Carlo** campaign — thousands of simulated flights, each with slightly different random conditions — against a new guidance law, and traced a rare failure to its cause. None of that happens by hand. Somebody has to build:

- the **orchestration** system that sends thousands of cases out across a compute cluster and collects them back;
- the **dashboard** that turns raw simulation output into the plots and success rates a design review looks at;
- the **configuration-management** tooling that keeps each vehicle's parameters and tunings tied to the exact simulation run or flight they belong to;
- the automated checks that catch a **[[regression|regression]]** — something that used to work and now does not — in a nightly build of the six-degree-of-freedom simulation, before a human has to notice it.

That is this family's actual work. It is not deriving the guidance law or the filter. It is building the **[[pipeline|pipeline]]** that runs someone else's design efficiently, reliably and **reproducibly** (so the same inputs always give the same outputs), and turns the output into something a person — or a review board — can use.

### A different kind of product

Every family so far has produced a *design*: a control law, a filter, a trajectory. This family produces a *tool* that makes many other engineers' designs testable and reviewable, faster and more reliably than they could manage alone.

That raises the stakes on correctness. A slow script is an annoyance. A pipeline that silently mishandles part of its input can quietly corrupt the evidence a whole review depends on. The first worked example below shows exactly that shape of failure.

### The Operations Automation variant

Some postings carry the more specific title **GNC Software Engineer, Operations Automation**. Research on 2026 postings found this specialist variant — like the Navigation and State Estimation family two lessons back — more likely to list a Master's or PhD as a basic qualification than the general Software Engineer, GNC ladder.

The likely reason has the same shape as the navigation family's. Automating a judgment call that a human operator makes today — for instance, deciding whether a wiggle in **[[telemetry|telemetry]]** (the stream of measurements a vehicle sends home) really needs someone to step in, or is normal variation — can shade from plain tooling into something closer to applied research. The hiring bar at that end of the family reflects it.

::: key
Software Engineer, GNC (Starship) and GNC Software Engineer, Operations Automation: building the analysis tools, pipelines, and automation the GNC engineers depend on to run and review their own work, rather than deriving that work directly. Weights software engineering skill heavily relative to domain theory, which makes it one of the more accessible entry points.
:::

::: example A dashboard that quietly lies
**The number.** A Monte Carlo dashboard reports that a landing guidance law succeeded in $99.6\%$ of a recent campaign. That is comfortably above what the design review requires. Nothing about the number looks wrong, and the review is set to go ahead on the strength of it.

**The hidden bug.** Suppose the dashboard's **parser** — the code that reads each run's output file — mishandles one rare situation. A run that crashes before writing a complete output file is *skipped*, not counted as a failure, because the parser was written to skip damaged records instead of flagging them.

**Put numbers on it.** Say $5{,}000$ runs were dispatched. Only $4{,}780$ wrote complete files; the other $5{,}000 - 4{,}780 = 220$ crashed. Of the $4{,}780$, $4{,}761$ landed successfully.

- What the dashboard shows: $4{,}761 \div 4{,}780 \approx 0.996$, or $99.6\%$.
- What is true: $4{,}761 \div 5{,}000 \approx 0.952$, or $95.2\%$.

**Sanity check.** The true rate must be lower than the displayed one, because the crashes are failures the dashboard never counted. It is — by more than four percentage points.

**How it gets caught.** The dashboard is not merely imprecise. Its silence about the missing runs *hides* that the number is wrong. Catching this takes an engineer who knows what a campaign's output should look like well enough to notice that $4{,}780$ does not match the $5{,}000$ that were sent out. That is domain literacy applied to a software problem. It does not replace the software skill, but it is not optional either.
:::

## Site Reliability Engineer, GNC: the computers everyone shares

Every Monte Carlo campaign in this module — the Starship rare-failure hunt, the Falcon landing-accuracy analysis, the fleet-wide ADCS checks — runs on shared computers. Postings for this family describe owning that infrastructure directly:

- running the **[[HPC cluster|hpc-cluster]]** (HPC, said "H-P-C", means high-performance computing), sized at tens of thousands of CPUs, that large-scale Monte Carlo work runs on;
- **[[continuous integration|continuous-integration]]**, or **CI**, for rocket and simulation software — every code change built and tested automatically before it is accepted;
- GNC analysis infrastructure more broadly;
- **vehicle configuration verification tools**, which check that a given vehicle configuration is correctly and consistently put together before compute time is spent running it.

The title itself comes from the wider software industry: **[[site reliability engineering|sre-origin]]** is the job of keeping a large computing service running reliably.

### What makes it different from ordinary IT

Two things set this family apart: who shares the infrastructure, and what a failure costs.

Picture one school computer lab and two classes that both have a big project due Friday. A Starship campaign and a Falcon campaign can want the same cluster in the same days before their **flight readiness reviews** (the formal meetings that decide whether a vehicle is ready to fly). Sharing a limited, contested resource fairly across real deadlines is a recurring engineering judgment call. It is not a problem you configure once and forget.

A CI pipeline that gates changes to flight or simulation software is not a convenience either. When it breaks, it can block a whole team until it is fixed — much more serious than a broken build costing one engineer an afternoon.

::: key
Site Reliability Engineer, GNC: running the HPC cluster of tens of thousands of CPUs for large-scale Monte Carlo, plus continuous integration for rocket and simulation software, GNC analysis infrastructure, and vehicle configuration verification tools.
:::

::: warning "Done" here does not mean "shipped once"
A design is finished once it clears its review. This family's work is more like the ADCS family's, several lessons back: no clean finish line. A cluster that was correctly set up last month, and a CI pipeline that passed its own tests once, are not automatically still doing their job today. Capacity, reliability and correctness here are standards you keep meeting, not boxes you tick once.
:::

::: example Two reviews, one cluster, one week
**The squeeze.** Two flight readiness reviews fall in the same week. Each team needs a large Monte Carlo campaign finished before its review. Together they want more computing than the cluster can give both at their preferred speed. Neither can be told to wait for free: a late campaign can delay its review.

**Put numbers on it.** Compute is measured in **[[CPU-hours|cpu-hours]]**. Suppose (round, made-up numbers):

- the cluster has $20{,}000$ CPUs, and background work normally uses $5{,}000$ of them, leaving $15{,}000$;
- campaign A needs $240{,}000$ CPU-hours and must finish within $24$ hours;
- campaign B needs $360{,}000$ CPU-hours and must finish within $36$ hours.

**Option 1: run them one after the other on $15{,}000$ CPUs.** A takes $240{,}000 \div 15{,}000 = 16$ hours. B takes $360{,}000 \div 15{,}000 = 24$ hours. Run A first: A is done at hour $16$ (inside $24$), but B finishes at $16 + 24 = 40$ hours — past its $36$-hour deadline. Run B first: B is done at hour $24$, and A finishes at hour $40$ — far past $24$. Either order misses a deadline. (Running them side by side does not help: the total is still $600{,}000 \div 15{,}000 = 40$ hours of work.)

**Option 2: pause the background work for two days.** Now all $20{,}000$ CPUs are free. A takes $240{,}000 \div 20{,}000 = 12$ hours. B takes $360{,}000 \div 20{,}000 = 18$ hours. Run A first: A is done at hour $12$, B at $12 + 18 = 30$. Both deadlines are met, with $12$ and $6$ hours to spare.

**Other levers.** The engineer could also ask whether either campaign can run a **reduced-fidelity** version — a simpler, faster model that still gives a defensible answer sooner.

**Sanity check.** $40$ hours of work cannot fit in $36$, so on $15{,}000$ CPUs no clever ordering could have saved both deadlines. Something had to give — here, the background work.

**The real point.** The resolution is a judgment call — which review has less slack, what can be paused, what can be simplified — made openly and explained to both teams, not left to whichever job happened to join the queue first. That decision is what separates this family's work from keeping a machine switched on.
:::

## What a week looks like, and curriculum links

A Software Engineer, GNC spends real time writing and maintaining pipeline code — often Python driving compiled simulation programs. She tracks down silent data-handling bugs like the dashboard's, and adds new automated checks to pipelines that other engineers rely on before their own reviews.

A Site Reliability Engineer, GNC spends real time responding to incidents like the capacity squeeze above, expanding CI test coverage for simulation and flight-software code, and planning capacity *before* a known demand spike instead of reacting afterward.

Both families draw heavily on the course's coding track:

- Docker and Reproducible Environments and Continuous Integration for Simulation Code, for the pipelines and CI themselves (see **[[containers and build tools|docker-bazel]]**);
- Testing with pytest and Engineering Hygiene and Debugging and Profiling as a Discipline, for tools that are themselves trustworthy;
- Python Performance for Monte Carlo Work and NumPy and Array Thinking, for campaigns that run efficiently at scale;
- Linux and the Shell, and Git: the Object Model and Daily Use, for the environment this work lives in;
- SQL and Window Functions for Telemetry Analytics, for dashboard and reporting work like the first example.

None of this removes the need for domain knowledge. Probability & Statistics and Verification, Validation & Monte Carlo Analysis matter here too — not to design a campaign's method, but to understand what the campaign must report, so the tool built for it is correct and not merely fast.

### Placing the families in the six kinds of work

Against the six kinds of work from lesson one:

- **Flight software**, heavily — but in the software-engineering sense. Be precise here: this family's code runs almost entirely on **[[ground-side|ground-vs-flight]]** analysis and infrastructure systems, not on the vehicle. It is not the onboard, real-time flight code the vehicle families write.
- **Simulation and V&V**, heavily, since building and running this infrastructure is what makes every other family's verification and validation possible at scale.
- **Hardware-in-the-loop and test** appears through CI, which is itself automated, continuous testing.
- **Analysis** is something these families *enable* rather than perform.
- **Navigation and sensors** and **mission design** are essentially absent.

## An honest note on how open this door actually is

For a candidate whose strongest evidence is software engineering, this is one of the most reachable families in the module. It is worth being direct about that. Someone with real, shown skill in building reliable pipelines, maintaining CI, and writing efficient, well-tested code has a legitimate, direct path in — without first needing years of control or estimation theory.

The caveat: "open" does not mean "no domain literacy required." The dashboard example exists to make that point. A tool built by someone who does not know what a campaign's output should look like is a liability, however clean its code, because it can quietly corrupt the evidence a whole engineering review depends on. The real bar is solid software engineering *plus* enough domain fluency to know what the software is for. Not the depth the vehicle or estimation families need — but not zero.

## Check yourself

::: check
State what Software Engineer, GNC and GNC Software Engineer, Operations Automation actually build, and explain why their artifact is different in kind from a GNC Engineer's artifact in any other family this module has covered.
:::

::: answer
They build analysis tools, pipelines and automation — orchestration systems, dashboards, configuration-management tooling and automated regression checks — rather than deriving a control law, a filter or a trajectory themselves. Their artifact is a tool that makes other engineers' designs testable and reviewable at scale, not a design of their own. "Done," for this family, means the tool works correctly and is trusted by the engineers who use it, not that a specific vehicle behavior has been proven.
:::

::: check
Give the reason this lesson offers for why the Operations Automation specialist variant more often lists an advanced degree than the general Software Engineer, GNC ladder.
:::

::: answer
Automating a judgment call a human operator makes today — such as deciding whether a piece of telemetry really warrants intervention or reflects normal variation — can shade from plain tooling into something closer to applied research. It means modeling and validating a decision process, not only building infrastructure around an existing one. The hiring bar at that end of the family reflects this more research-like work.
:::

::: check
In the dashboard example, the pipeline was not producing a visibly broken output — the success-rate number looked plausible. What does this teach about why domain literacy matters for an engineer in this family, even though the job is primarily software engineering?
:::

::: answer
A bug that produces a plausible but wrong number is more dangerous than one that crashes outright, because nothing about the output prompts anyone to question it. Catching it requires knowing what a campaign's output should look like — for example, that the number of runs counted must match the number dispatched — well enough to notice the mismatch. That is domain literacy serving the software work, not a replacement for the software skill.
:::

::: check
Explain why this lesson describes Site Reliability Engineer, GNC's "done" as continuous rather than a one-time deliverable, and give the two specific responsibilities named in this lesson that illustrate it.
:::

::: answer
The infrastructure is shared and ongoing, and it has to keep meeting its standard rather than meet it once and stay finished. A cluster correctly set up last month is not guaranteed to be adequate today, and a CI pipeline that passed its tests once is not guaranteed to still be gating changes correctly now. The two responsibilities that show this are capacity planning across competing teams' demand (worked through in the two-reviews example) and maintaining continuous integration for rocket and simulation software — both standards to keep meeting, not tasks to finish once.
:::

::: check
A candidate has built and maintained a real continuous-integration pipeline for a personal simulation project — automated testing, containerized builds, a working deployment process — but has never derived a control law or a navigation filter. Which families from this module fit this evidence best, and which do not, and why?
:::

::: answer
It fits Software Engineer, GNC, GNC Software Engineer, Operations Automation, and Site Reliability Engineer, GNC directly: all three weight exactly this software and infrastructure skill most heavily and do not require the candidate to have derived a control law or filter. It fits the vehicle families, ADCS, and Navigation and State Estimation poorly on its own, because those families center on deriving and defending domain-theory designs. A real CI pipeline is strong evidence of engineering discipline, but it says nothing directly about the control or estimation depth those families test.
:::

::: check
In the two-reviews example, suppose the background work could not be paused, but campaign B could switch to a reduced-fidelity model needing only $300{,}000$ CPU-hours. With $15{,}000$ CPUs and A run first, are both deadlines met?
:::

::: answer
A takes $240{,}000 \div 15{,}000 = 16$ hours, finishing at hour $16$ — inside its $24$-hour deadline. Reduced-fidelity B takes $300{,}000 \div 15{,}000 = 20$ hours, finishing at $16 + 20 = 36$ hours — exactly on its $36$-hour deadline, with zero slack. Both are met on paper, but with no margin at all, any hiccup would miss B's review. A careful engineer would say so openly to both teams and look for a little more capacity rather than call the problem solved.
:::

## Summary

| Family | Core artifact | "Done" looks like | Runs where |
| --- | --- | --- | --- |
| Software Engineer, GNC / Operations Automation | Analysis tools, pipelines, automation | The tool is correct, tested, and trusted by the engineers using it | Ground-side analysis infrastructure |
| Site Reliability Engineer, GNC | HPC cluster availability, CI for rocket and simulation software | Infrastructure stays available, correctly gated, and fairly allocated — continuously | Shared compute infrastructure across teams |

| Idea | In one line |
| --- | --- |
| Silent exclusion | a success rate must divide by runs *dispatched*, not runs that happened to finish |
| Compute time | hours needed $=$ CPU-hours $\div$ CPUs available |
| Accessibility | software-heaviest families; open to strong software evidence, but domain literacy is still required |

The next lesson leaves the nine established families behind. It covers the newest names in 2026 postings — Starfall, Starmind and Starshield — and what it means to target a program still young enough that its own job titles have not finished settling.

::: context regression Why "regression"?
To regress means to go backward. In software, a **regression** is a bug that breaks something that used to work — the program has gone backward. Teams guard against it with **regression tests**: a growing pile of checks, each one written after a past bug, run automatically every night or on every change. If yesterday's simulation landed the booster within a meter and tonight's lands it ten meters off with no one intending a change, the nightly run flags it before anyone builds on the broken version.
:::

::: context pipeline A pipeline, stage by stage
A **pipeline** is a chain of automated steps where each step's output is the next step's input, like an assembly line. A Monte Carlo pipeline looks roughly like this:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <g fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5">
    <rect x="4" y="40" width="64" height="40" rx="5"/>
    <rect x="76" y="40" width="64" height="40" rx="5"/>
    <rect x="148" y="40" width="64" height="40" rx="5"/>
    <rect x="220" y="40" width="64" height="40" rx="5"/>
    <rect x="292" y="40" width="64" height="40" rx="5"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="36" y="64">configure</text>
    <text x="108" y="64">dispatch</text>
    <text x="180" y="64">simulate</text>
    <text x="252" y="64">parse</text>
    <text x="324" y="64">report</text>
  </g>
  <g fill="#1f2a44">
    <polygon points="76,60 70,56 70,64"/>
    <polygon points="148,60 142,56 142,64"/>
    <polygon points="220,60 214,56 214,64"/>
    <polygon points="292,60 286,56 286,64"/>
  </g>
  <text x="180" y="28" font-size="11" fill="#6c7a93" text-anchor="middle">thousands of runs in parallel</text>
  <text x="252" y="102" font-size="11" fill="#b4232c" text-anchor="middle">the dashboard bug lived here</text>
</svg>
```

A mistake in any one stage flows into every stage after it, which is why each stage needs its own checks.
:::

::: context telemetry Messages from far away
**Telemetry** comes from Greek words meaning "far" and "measure." It is the stream of numbers a vehicle sends home: temperatures, pressures, voltages, wheel speeds, positions. A single satellite can report thousands of values, many times a minute, and a constellation multiplies that by thousands of satellites. No human can watch it all. Operations automation writes software that watches for the patterns an experienced operator would spot, and decides when to wake a person up.
:::

::: context hpc-cluster What an HPC cluster is
A **cluster** is many ordinary server computers in racks, linked by a fast network and run as one big machine. Each server holds several processor chips, and each chip has many cores, so "tens of thousands of CPUs" means tens of thousands of processors working at once. Users do not log into a particular machine. They hand a job to a **scheduler**, a program that queues work and hands it out as processors come free. A Monte Carlo campaign suits this perfectly: every run is independent, so ten thousand runs can go to ten thousand processors at the same time.
:::

::: context continuous-integration The CI gate
In **continuous integration**, every proposed code change is automatically built and tested before it can join the main version of the code. A change that fails is stopped at the gate.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g fill="#ffffff" stroke="#1f2a44" stroke-width="1.5">
    <rect x="6" y="55" width="70" height="36" rx="5"/>
    <rect x="98" y="55" width="70" height="36" rx="5"/>
    <rect x="190" y="55" width="70" height="36" rx="5"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="41" y="77">change</text><text x="133" y="77">build</text><text x="225" y="77">test</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5" fill="none">
    <line x1="76" y1="73" x2="96" y2="73"/><line x1="168" y1="73" x2="188" y2="73"/>
    <line x1="260" y1="73" x2="280" y2="40"/><line x1="260" y1="73" x2="280" y2="110"/>
  </g>
  <rect x="282" y="24" width="72" height="32" rx="5" fill="#8fb8f0" stroke="#1d6fd1"/>
  <text x="318" y="44" font-size="11" fill="#1f2a44" text-anchor="middle">pass: merge</text>
  <rect x="282" y="94" width="72" height="32" rx="5" fill="#ffffff" stroke="#b4232c"/>
  <text x="318" y="114" font-size="11" fill="#b4232c" text-anchor="middle">fail: blocked</text>
  <text x="180" y="142" font-size="11" fill="#6c7a93" text-anchor="middle">if the gate itself breaks, every change stops</text>
</svg>
```

That last line is why a broken CI system can stall a whole team.
:::

::: context sre-origin Where "site reliability" comes from
The job title **site reliability engineer** was coined at Google around 2003, when Ben Treynor Sloss, a software engineer, was put in charge of the team keeping Google's websites running. His idea was to treat operations as a software problem: automate the repetitive work, measure reliability with numbers, and write code to fix what breaks. The name spread across the industry. SpaceX's GNC version keeps the same spirit, but the "site" is a computing cluster and a set of CI systems serving rocket engineers.
:::

::: context cpu-hours Counting compute in CPU-hours
A **CPU-hour** is one processor working for one hour. It works like "person-hours" on a building site: a job of $100$ person-hours takes one worker $100$ hours, or $100$ workers one hour. So a campaign of $240{,}000$ CPU-hours takes $12$ hours on $20{,}000$ CPUs, or $16$ hours on $15{,}000$. The rule assumes the work splits evenly, which Monte Carlo runs nearly do because each run is independent. Here is the lesson's example drawn as a timeline:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="4" y="46" font-size="11" fill="#1f2a44">15,000</text>
  <text x="4" y="106" font-size="11" fill="#1f2a44">20,000</text>
  <rect x="60" y="30" width="112" height="24" fill="#8fb8f0" stroke="#1d6fd1"/>
  <rect x="172" y="30" width="168" height="24" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="60" y="90" width="84" height="24" fill="#8fb8f0" stroke="#1d6fd1"/>
  <rect x="144" y="90" width="126" height="24" fill="#f2b880" stroke="#1f2a44"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="116" y="46">A 16 h</text><text x="256" y="46">B 24 h</text>
    <text x="102" y="106">A 12 h</text><text x="207" y="106">B 18 h</text>
  </g>
  <line x1="228" y1="18" x2="228" y2="124" stroke="#1d6fd1" stroke-width="1.5" stroke-dasharray="4 3"/>
  <line x1="312" y1="18" x2="312" y2="124" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="228" y="14" font-size="11" fill="#1d6fd1" text-anchor="middle">A due 24 h</text>
  <text x="312" y="14" font-size="11" fill="#b4232c" text-anchor="middle">B due 36 h</text>
  <line x1="60" y1="134" x2="340" y2="134" stroke="#1f2a44"/>
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="60" y="150">0</text><text x="130" y="150">10</text><text x="200" y="150">20</text><text x="270" y="150">30</text><text x="340" y="150">40 h</text>
  </g>
  <text x="200" y="166" font-size="11" fill="#6c7a93" text-anchor="middle">left: CPUs free. B ends at 40 h or 30 h</text>
</svg>
```
:::

::: context docker-bazel Containers and build tools
**Docker** packages a program together with everything it needs to run — libraries, settings, the exact versions — into a **container**, so it behaves the same on a laptop and on a cluster node. **Bazel** (said "BAY-zel"), a build tool Google released as open source, works out which parts of a large code base changed and rebuilds and retests only those, which keeps big builds fast and repeatable. A personal project that uses tools like these, with CI and a Monte Carlo pipeline on a Linux cluster, is direct evidence for the families in this lesson.
:::

::: context ground-vs-flight Ground code and flight code
**Flight code** runs on the vehicle. It has hard deadlines measured in milliseconds, tight memory, and no chance of a restart mid-flight, so it is written with strict rules. **Ground code** runs on computers on Earth: simulations, analysis, dashboards, clusters. It can use Python, large libraries and plenty of memory, and a crash costs time rather than a vehicle. Both matter. Mixing them up on a resume — calling a ground pipeline "flight software" — is a quick way to lose an interviewer's trust.
:::
