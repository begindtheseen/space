---
id: l04-the-projects-section
title: "The projects section: your main evidence, placed and labeled honestly"
minutes: 19
covers:
  - the projects section as the primary section for candidates without industry GNC experience
---

Imagine you are trying out for a basketball team, and you have never played on a school team. The coach does not care much about your summer job at the ice-cream shop. She wants to see you shoot. So you walk in and shoot first — you do not make her sit through a story about ice cream before she gets to see the one thing she came to judge.

A resume works the same way. The first three lessons of this module each pointed at one section. Lesson one said your strongest section has to sit in the **top third** of the page — the part a reader sees first. Lesson two said each **basic qualification** — each must-have item on the job posting — needs real evidence behind it. Lesson three gave you the bullet formula to write that evidence well. If you have never held a paid GNC job, all three threads end at the same place: the **Projects** section. For you, it is not an extra. It is the main argument of the whole page.

That changes three things: where the section sits, what it is called, and how you describe the work inside it. The last one is where people slip, in both directions. Make the work sound small, and your best evidence looks like an afterthought. Make it sound bigger than it was, and a careful reader stops trusting the whole page the moment one claim does not hold up. This lesson walks through both mistakes and the honest description between them.

## Where it goes, and why that is not hiding anything

Lesson one put your strongest section right after the header and the one-line **identity statement** — the single sentence under your name that says who you are as an engineer, sometimes called the **summary**. For a candidate without industry GNC experience, that strongest section is Projects. It can sit with a short one-line Education entry if you have relevant coursework or a degree in progress.

Projects goes there even if you also have an Experience section with real, paid jobs. A job that is not a GNC job carries less of what a GNC reader is checking for than a verified simulation or a consistency-checked filter does. The reader is the **[[recruiter|recruiter]]** or engineer doing the first pass — the quick first read that decides who goes on to a closer look.

Here is the rule in the module's own words:

::: key
For a candidate with no industry GNC experience, the projects section goes directly below the summary and above employment, with three anchor projects described in two or three bullets each including the verification result. This is the section that carries the application.
:::

An **[[anchor project|anchor-project]]** is one of your few best, finished, verified pieces of work — the ones you built your portfolio around in the previous module. Three is enough to show range. Two or three bullets each is enough to show method and result without spilling onto a second page.

### "Won't it look like I'm hiding something?"

It is a fair worry. If employment comes second, does the page look like it is covering for a thin work history? It does not. Every strong resume, at every level, is ordered by how strong the evidence is. A senior engineer leads with her most recent and most relevant role. She does that for exactly the reason you lead with your best project: that is where the evidence the reader is checking for actually lives.

A reader who meets a strong, verified Projects section in the top third does not need an apology for what comes further down. The order has already told her where to look. She reads the rest of the page knowing that, instead of meeting it as a string of surprises.

::: key
Projects leads the page for this reader not as a way of hiding a short employment history, but because it is where the strongest, most specific GNC evidence actually is. Ordering by evidentiary strength — how strong the evidence is — is standard practice, not concealment.
:::

## What to call it, and how to label each entry

Call the section "Projects." Not "My Journey," not "What I've Built," not a heading designed to sound different. A reader scanning for a familiar shape finds a familiar name fastest. A plain heading costs you nothing, because the content underneath is what makes the section stand out — not its title.

Each entry gets its own short header, in two parts:

1. A **project title** that names the thing you built, plainly: "6-DOF Launch-Vehicle Simulation," not "My First Rocket Sim!" (6-DOF is said "six D-O-F" and means [[six degrees of freedom|six-dof]].)
2. A **metadata line** — a short line of facts about the project: the main language or tools, a rough duration or date range, and, if the work is public, a link to the **[[repository|repository]]** (the online folder that holds the code and its history).

The metadata line does real work before the reader has read a single bullet. At a glance it tells her what kind of thing this is, and whether she can go and look at it herself.

## Self-directed work: the honest label

Here is the specific problem this lesson exists to solve. How do you describe work that had no employer, no assigned team and no outside deadline — without puffing it up, and without shrinking it into an apology? The honest answer sits in one place, and both edges are worth marking precisely.

### Do not borrow a job that was not there

Do not give yourself a job title like "Simulation Engineer" for a project you built alone with no employer. Do not hint at a team, a client or a sponsoring organization that did not exist.

Here is why this matters so much. In an interview, someone may ask a direct question: "Who else worked on this? Who was it for?" If your honest answer contradicts how the resume framed it, the reader stops trusting everything else on the page — not only that one line.

### Say what it was, and let checkable facts do the work

Say plainly what the work actually was. "Independent project" or "self-directed project" is accurate, and it carries no penalty on its own. What persuades a reader is not the label. It is the content underneath it:

- a public repository she can open;
- a stated **verification** method — how you proved the results are right, such as matching a known exact answer;
- a **[[CI pipeline|ci-pipeline]]** that reruns your checks automatically on every change;
- a **[[reproducible one-command setup|reproducible]]** — anyone can build and run it with a single command and get your numbers.

Each of these is a fact the reader can check for herself. That is a stronger kind of believability than any title you could give yourself.

### Do not undersell it either

Apologetic wording — "only a small simulation I built for fun," "a simple project for practice" — works against your strongest section. Before the reader has read one bullet, it tells her that *you* do not think the work matters.

If a project used a real method, was checked against a real reference, and produced a real measured result, describe it with plain, factual confidence. The problem–method–result structure from lesson three is what shows the work is serious. It needs no adjectives on top and no apology underneath.

::: key
Label self-directed work plainly — "independent project" or "self-directed project" — without borrowed employment framing and without apologetic hedging. The credibility comes from checkable content underneath the label: a public repository, a stated verification method, a reproducible setup, and results a reader can weigh, not from the label itself.
:::

::: warning One bare line under a generic heading buries your best evidence
Listing your best project as one line — "Built a spacecraft simulator" — under a heading like "Other" or "Additional Work" near the bottom of the page wastes the strongest evidence you have. If it is your best evidence, it belongs in the top third, with the full problem–method–result treatment. Squeezed into one line, it looks like an afterthought.
:::

## Two worked examples

The first example builds one entry from top to bottom. The second shows how to order three entries for two different readers.

::: example A complete entry, built end to end
Here is a finished entry, exactly as it would appear on the page.

6-DOF ADCS Momentum-Management Simulation · Python, NumPy · self-directed, 6 weeks · [public repository link]

- Built a spacecraft attitude-control simulation combining three **[[reaction wheels|wheels-and-torquers]]** and three magnetorquers, modeling wheel friction and a saturating actuator response.
- Implemented a B-dot detumble law for initial rate reduction and a continuous wheel-desaturation law using the magnetorquers, switching between the two based on angular rate.
- Simulated a 30-day mission timeline and reported steady-state pointing error held below 0.3 degrees with wheel momentum bounded within actuator limits throughout, with no unplanned saturation event.

(ADCS, said "A-D-C-S", is the **attitude determination and control system** — the part of a spacecraft that works out which way it is pointing and turns it.)

Now read what each piece is doing.

**Step 1 — the header.** The title and metadata line let a reader place the project in about two seconds. She learns what it is (an attitude simulation), what it was built with (Python and NumPy), how long it took (six weeks), and that a repository exists to check it against.

**Step 2 — the bullets.** Each bullet applies lesson three's structure to one phase of the work. The first is a modeling problem: what physics went in. The second is a control-law problem: what the spacecraft does about it. The third is a full-mission check: 30 days, with measured results — pointing error under 0.3 degrees, wheel momentum inside its limits.

**Step 3 — the honesty check.** Nowhere does the entry claim an employer, a team or a job title that was not there. And nowhere does it apologize for being a project instead of a job. "Self-directed" sits quietly in the metadata line, and the bullets carry the weight.

**Sanity check against the rule.** Three bullets — inside the "two or three" limit. The last bullet carries the verification result, as the key above asks. It fits.
:::

::: example Ordering three anchor projects for a specific reader
A candidate has three anchor projects:

- a 6-DOF launch-vehicle simulation,
- a consistency-checked attitude estimator,
- a powered-descent guidance study.

**Reader 1:** a posting that emphasizes **[[entry, descent and landing|edl]]** work. She leads with the descent-guidance study, puts the 6-DOF simulation second, and the estimator third.

**Reader 2:** a posting that emphasizes navigation and **state estimation** — working out where a vehicle is and how it is moving from noisy sensor data. She reorders the same three entries: estimator first, 6-DOF simulation second, descent guidance third.

**What changed?** Only the order. Every bullet, every number and every verification claim stays exactly as written, because all of it is true whichever posting she applies to.

**Why it works.** Whichever evidence matters most to this reader is the first thing this reader sees. It is lesson one's top-third logic, applied inside the section instead of to the whole page.

**Sanity check.** Put the two versions side by side. Nothing in one contradicts the other. That is the test of honest reordering. This is also the seed of a bigger idea — **[[tailoring|tailoring-bridge]]** a resume to a role family — which lesson six takes up in full.
:::

## Check yourself

::: check
A candidate has a part-time retail job she has held for two years and one strong, verified 6-DOF simulation project. Explain why the project belongs above the retail job in the top third, instead of the job leading because it is "real" paid work.
:::

::: answer
Section order should follow how strong the evidence is for the role being applied to — not whether an entry came with a paycheck. For a GNC posting, a verified simulation with a stated method and a measured result is far stronger evidence of the needed skills than an unrelated retail job, whichever one paid wages. Putting the project first places the most relevant evidence where a first-pass reader looks first. The retail job still belongs on the page, lower down, where its position reflects its lower relevance to this posting.
:::

::: check
A friend warns a candidate that leading with Projects, above her unrelated work history, will make it look like she is hiding something. How should she answer?
:::

::: answer
Ordering a resume by strength of evidence is standard practice at every career stage, not a trick. A senior engineer who leads with her most recent relevant role is doing the same thing for the same reason. A reader who finds strong, verified project evidence in the top third does not need an excuse for what comes later. The order has told her where the real evidence is, and she reads the rest of the page with that already settled — not as something being hidden from her.
:::

::: check
A candidate heads her project entry "Simulation Engineer, Independent", as if it were a job title. What is wrong with this, and what should replace it?
:::

::: answer
It borrows the framing of paid work — a job title and an implied employer — for work that had neither. It also risks contradicting her own answer if an interviewer asks who she worked with or who it was for. Replace it with an accurate project title that names the thing she built, such as "6-DOF ADCS Momentum-Management Simulation", labeled plainly as a self-directed or independent project rather than dressed up as a job.
:::

::: check
A project entry opens with "Only a small simulation I put together for fun, nothing too serious." What is wrong with this, and why is it underselling rather than honest modesty?
:::

::: answer
It tells the reader, before she has read a single bullet, that the candidate herself does not think the work matters — whether or not the project actually used a real method, real verification and produced a real result. An honest description states plainly what the project is and lets the problem–method–result content show how serious it is. The hedging undercuts evidence that may be entirely strong, and it gives the reader a reason to skim past the section that most deserved her full attention.
:::

::: check
A candidate with three anchor projects is ordering her Projects section for a posting that stresses navigation and state estimation more than vehicle dynamics. What should guide her order, and what should stay exactly the same across her different resume versions?
:::

::: answer
The order should follow which project's evidence most directly matches what this posting is checking for. Here the estimation project should lead, since it answers a navigation reader's first-pass question most directly. What stays identical across versions is the content of every entry: every bullet, number and verification claim remains exactly as written, because it is true whatever the posting. Only the order of the entries changes, to match what each reader most needs to see first.
:::

## Summary

| Decision | This module's guidance | Reasoning |
| --- | --- | --- |
| Section placement | Projects sits in the top third, below the summary and above employment | It carries the strongest evidence for this reader; ordering by evidence strength is standard practice |
| Contents | Three anchor projects, two or three bullets each, including the verification result | Enough range and depth to carry the application on one page |
| Section heading | Plain: "Projects" | A familiar name scans fast; the content, not the title, should stand out |
| Entry header | Project title, tools, duration, a link if public | Lets a reader place the project and check it herself in seconds |
| Self-directed label | "Independent project" or "self-directed project", stated plainly | Accurate, no penalty, and it hands the persuading to checkable content underneath |
| Entry order | By relevance to the specific posting | Same facts, reordered so the strongest match leads — the seed of tailoring |

The next lesson steps away from content to a purely mechanical question that decides whether any of this gets read at all: how to format the file itself so that an applicant tracking system reads it correctly.

::: context recruiter Who reads your resume first
A **recruiter** is a company employee whose job is finding and moving candidates through hiring. At a large engineering company, the first person to open your resume is often a recruiter, not a GNC engineer. She may not know what a Kalman filter is. She holds the posting's list of basic qualifications and checks your page against it, fast — well under a minute. That is why the evidence has to be easy to see: a non-specialist must be able to spot it and tick it off. The engineers, who can judge depth, usually come later — in a closer review and in interviews.
:::

::: context anchor-project Why "anchor"
A ship's anchor holds it in place so it does not drift. An **anchor project** does the same for your application: it is a finished, verified piece of work that everything else — your identity statement, your skills list, your interview stories — is tied to. In the portfolio module you built a small number of these on purpose, each with a verification result you can defend. This lesson is where they earn their keep. A reader should be able to name your three anchors after one look at the page.
:::

::: context six-dof Six ways to move
Anything moving freely in space can move in six independent ways. It can slide three ways — forward and back, left and right, up and down. It can turn three ways — roll, pitch and yaw. Each independent way is a **degree of freedom**, so a simulation that tracks all six is "6-DOF".

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="90" y="18" font-size="12" font-weight="700" text-anchor="middle" fill="#1f2a44">3 slides (translation)</text>
  <text x="270" y="18" font-size="12" font-weight="700" text-anchor="middle" fill="#1f2a44">3 turns (rotation)</text>
  <line x1="180" y1="28" x2="180" y2="160" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <g stroke="#1d6fd1" stroke-width="3" fill="none">
    <line x1="90" y1="95" x2="150" y2="95"/>
    <line x1="90" y1="95" x2="90" y2="40"/>
    <line x1="90" y1="95" x2="55" y2="130"/>
  </g>
  <polygon points="158,95 146,89 146,101" fill="#1d6fd1"/>
  <polygon points="90,32 84,44 96,44" fill="#1d6fd1"/>
  <polygon points="50,135 53,122 62,131" fill="#1d6fd1"/>
  <text x="152" y="115" font-size="11" text-anchor="middle" fill="#1f2a44">forward</text>
  <text x="112" y="44" font-size="11" fill="#1f2a44">up</text>
  <text x="44" y="152" font-size="11" fill="#1f2a44">sideways</text>
  <g fill="none" stroke="#b4232c" stroke-width="2.5">
    <path d="M205,50 A14,14 0 1,1 219,64"/>
    <path d="M205,95 A14,14 0 1,1 219,109"/>
    <path d="M205,140 A14,14 0 1,1 219,154"/>
  </g>
  <g fill="#b4232c">
    <polygon points="213,64 223,58 223,70"/>
    <polygon points="213,109 223,103 223,115"/>
    <polygon points="213,154 223,148 223,160"/>
  </g>
  <g font-size="11" fill="#1f2a44">
    <text x="248" y="50" font-weight="700">roll</text><text x="248" y="64">about forward</text>
    <text x="248" y="95" font-weight="700">pitch</text><text x="248" y="109">about sideways</text>
    <text x="248" y="140" font-weight="700">yaw</text><text x="248" y="154">about up</text>
  </g>
</svg>
```

An attitude simulation that also tracks the orbit — which a magnetorquer model needs, because Earth's magnetic field depends on where the spacecraft is — covers all six.
:::

::: context repository What a repository is
A **repository** ("repo" for short) is a project folder kept under version control, usually with a tool called Git. It stores every file and every saved change, with a date and a note on each. Hosted publicly on a site like GitHub or GitLab, it lets a stranger read your code, see how it grew, and run it. For a self-directed project, a public repo is the closest thing to a reference letter: the reader does not have to take your word for anything.
:::

::: context ci-pipeline A robot that reruns your tests
**CI** stands for **continuous integration**. Every time you save a change to the repository, a server automatically builds the code and runs your test suite. If a test fails, you hear about it within minutes — before a broken change sneaks into a result you report.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="8" y="30" width="72" height="36" rx="6" fill="#fff"/>
    <rect x="98" y="30" width="72" height="36" rx="6" fill="#8fb8f0"/>
    <rect x="188" y="30" width="72" height="36" rx="6" fill="#8fb8f0"/>
    <rect x="278" y="12" width="74" height="30" rx="6" fill="#fff"/>
    <rect x="278" y="56" width="74" height="30" rx="6" fill="#f2b880"/>
  </g>
  <g font-size="12" text-anchor="middle" fill="#1f2a44">
    <text x="44" y="52">push change</text>
    <text x="134" y="52">build</text>
    <text x="224" y="52">run tests</text>
    <text x="315" y="32" fill="#1d6fd1">pass</text>
    <text x="315" y="76" fill="#b4232c">fail: alert</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="80" y1="48" x2="96" y2="48"/><line x1="170" y1="48" x2="186" y2="48"/>
    <line x1="260" y1="44" x2="276" y2="28"/><line x1="260" y1="52" x2="276" y2="70"/>
  </g>
  <text x="180" y="102" font-size="11" text-anchor="middle" fill="#6c7a93">runs automatically on every change</text>
</svg>
```

On a resume, a CI badge tells a reader your verification is not a one-time claim — it runs again every day the project changes.
:::

::: context reproducible Why "one command" matters
A result is **reproducible** when someone else can get the same numbers from your work without asking you how. For software, the gold standard is a single command — something like `make test` — that fetches what it needs, builds everything and prints the results. It matters because a reader deciding whether to trust a number wants to know she *could* check it. Flight software teams live by the same rule: a result nobody can regenerate is not trusted in a design review.
:::

::: context wheels-and-torquers Wheels, torquers and B-dot
A **reaction wheel** is a heavy spinning disk inside the spacecraft. Speed it up one way and the spacecraft turns the other way. Wheels slowly soak up disturbance torques until they hit their top speed — **saturation** — and can no longer help. A **magnetorquer** is an electromagnet that pushes against Earth's magnetic field. It can bleed that stored spin out of the wheels ("desaturation"). **B-dot** (written $\dot{B}$, the rate of change of the measured field) is a simple law that uses magnetorquers to slow a tumbling spacecraft right after it separates from the rocket.
:::

::: context edl Entry, descent and landing
**EDL**, said "E-D-L", covers the last and most violent part of a trip: hitting the atmosphere at high speed (entry), slowing down through it (descent), and touching down on a target (landing). A Mars lander and a returning Falcon 9 booster both do EDL. Postings in this family lean on vehicle dynamics, atmospheric flight, trajectory optimization and dispersion analysis — which is why the descent-guidance project leads for that reader.
:::

::: context tailoring-bridge Where tailoring comes back
Reordering three entries is the smallest version of **tailoring** — adjusting the same true evidence so each reader sees what she is checking for first. Lesson six grows it into a system: a small number of resume versions, one per role family, sharing the same facts but ordered differently. The rule you met here carries straight over: two versions side by side must never contradict each other.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="90" y="18" font-size="12" font-weight="700" text-anchor="middle" fill="#1f2a44">EDL posting</text>
  <text x="270" y="18" font-size="12" font-weight="700" text-anchor="middle" fill="#1f2a44">Navigation posting</text>
  <rect x="20" y="30" width="140" height="28" rx="4" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/><text x="90" y="48" font-size="12" text-anchor="middle" fill="#1f2a44">1. Descent guidance</text>
  <rect x="200" y="30" width="140" height="28" rx="4" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/><text x="270" y="48" font-size="12" text-anchor="middle" fill="#1f2a44">1. Attitude estimator</text>
  <rect x="20" y="66" width="140" height="28" rx="4" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/><text x="90" y="84" font-size="12" text-anchor="middle" fill="#1f2a44">2. 6-DOF simulation</text>
  <rect x="200" y="66" width="140" height="28" rx="4" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/><text x="270" y="84" font-size="12" text-anchor="middle" fill="#1f2a44">2. 6-DOF simulation</text>
  <rect x="20" y="102" width="140" height="28" rx="4" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/><text x="90" y="120" font-size="12" text-anchor="middle" fill="#1f2a44">3. Attitude estimator</text>
  <rect x="200" y="102" width="140" height="28" rx="4" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/><text x="270" y="120" font-size="12" text-anchor="middle" fill="#1f2a44">3. Descent guidance</text>
  <text x="180" y="142" font-size="11" text-anchor="middle" fill="#6c7a93">same three entries, same words, different order</text>
</svg>
```
:::
