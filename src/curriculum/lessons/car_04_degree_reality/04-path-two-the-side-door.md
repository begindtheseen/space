---
id: l04-path-two-the-side-door
title: "Path 2: the side door, and the transfer inside"
minutes: 20
covers:
  - "Path 2, side door then transfer: SRE GNC allows 4+ years of professional software or SRE experience in lieu of a degree and sits inside the GNC org; GNC Software Engineer and simulation and tools roles weight software skill heavily; internal transfer at SpaceX is common"
---

Picture a building with a locked front door. The sign on it says "bachelor's degree required." Path 1, the last lesson, was about getting the key to that door. Path 2 does something different. It walks around the side of the building to a second entrance with a different sign — one you can actually meet — and gets inside. Then, once inside, it walks down the hall to the room it wanted all along.

In job terms, Path 2 does not try to satisfy a GNC Engineer posting's degree line at all. It goes around it, through a role that is judged on a genuinely different basis and sits inside, or right next to, the GNC organization. Then it relies on a second, separate step — an **[[internal transfer|transfer-map]]**, meaning a move from one team to another inside the same company — to reach GNC work itself.

Two things have to be true for this to work, and they are separate:

1. The entry role's own basic qualifications have to be things you can actually clear.
2. The internal step has to actually happen. It is not automatic, and time served does not guarantee it.

This lesson takes each in turn.

## Site Reliability Engineer, GNC: the door named in writing

A **Site Reliability Engineer**, or **[[SRE|sre-origin]]** (said letter by letter, "S-R-E"), is a software engineer whose job is keeping large computer systems running reliably. Think of the crew that keeps a theme park's rides running every day: they do not design the roller coaster, but without them nothing moves. A closely related field is **[[DevOps|devops-word]]** (said "dev-ops"), the practice of building the tools and pipelines that carry software from a programmer's laptop into use.

SpaceX posts a role called Site Reliability Engineer, GNC. It is the one posting in this whole module where the degree-optional door is named in the basic qualifications with no ambiguity. The posting offers two branches, and you need to meet one of them:

- **Branch A:** a bachelor's degree in computer science, information systems/IT, engineering, math, or a scientific discipline, **and** 2+ years of software development experience.
- **Branch B:** 4+ years of professional experience building software with site reliability or DevOps, **[[in lieu of|in-lieu-word]]** a degree. "In lieu of" means "in place of."

Then, whichever branch applies, the posting also asks for:

- 1+ years of experience with Linux operating systems (**Linux** is the free operating system that runs most of the world's servers), and
- 1+ years of experience with Python and Python-based development frameworks.

Read that carefully. The years of Linux and Python are not part of Branch B. They sit on top of both branches. Someone with a computer science degree still needs them, and so does someone using the 4-year route.

::: key
Site Reliability Engineer, GNC states an explicit, verbatim in-lieu-of-degree clause: 4+ years of professional experience building software with site reliability or DevOps experience, plus 1+ years each of Linux and Python. It runs the HPC Monte Carlo infrastructure, CI for rocket and simulation software, and GNC analysis tooling — genuine infrastructure work, not control design.
:::

::: warning "In lieu of a degree" is not "in lieu of every other requirement"
The 4-year branch waives the degree and nothing else. It does not waive the 1+ years of Linux, the 1+ years of Python, or the expectation that you can show the preferred skills in an interview. A candidate who reads "in lieu of a degree" as "no bar at all" will be unprepared for a technical screen that tests Linux and Python depth directly — no matter how the years line was satisfied.
:::

## What the job actually is

The posting describes the work in four parts. Here they are, as the posting states them, with a plain-words gloss after each:

- **Monitoring and maintaining an HPC cluster consisting of tens of thousands of CPUs.** **HPC** stands for high-performance computing. A **[[cluster|hpc-cluster]]** is a large number of computers wired together to work as one giant machine. A **CPU** (central processing unit) is a computer's main processor, its "brain."
- **Large-scale Monte Carlo simulations.** A **[[Monte Carlo simulation|monte-carlo]]** runs the same flight thousands of times in a computer, each time with slightly different winds, engine thrust and sensor errors, to see how spread out the results are.
- **Continuous integration systems for rocket and simulation software.** **[[Continuous integration|ci-pipeline]]**, or **CI**, is an automatic system that builds and tests every change to the code the moment someone submits it.
- **GNC analysis infrastructure and vehicle configuration verification tools.** These are the programs that check that each vehicle's settings and software match what was intended before it flies.

::: key
What the SRE GNC role actually involves, verbatim from the posting: monitoring and maintaining an HPC cluster consisting of tens of thousands of CPUs; large-scale Monte Carlo simulations; continuous integration systems for rocket and simulation software; GNC analysis infrastructure and vehicle configuration verification tools.
:::

### The preferred stack

Beyond the basic qualifications, the posting lists **preferred** skills — things that help but are not required. A **stack** is the set of tools a job uses together. This one is broad systems and infrastructure work. Grouped by what each group does:

- **Packaging software so it runs the same everywhere:** Docker, Vagrant and Kubernetes. Docker packs a program into a sealed **[[container|container-word]]**; Kubernetes runs thousands of containers across many machines; Vagrant sets up repeatable practice machines.
- **Setting up many machines from written instructions:** Ansible, Puppet and Terraform. Instead of configuring a thousand computers by hand, you write down how each should look, and the tool makes it so.
- **Build systems:** tools in the Make, Bazel, Pants, Buck or Gradle family, which turn source code into runnable programs and rebuild only what changed.
- **Package management:** installing and tracking the software libraries a program depends on.
- **Virtualization and hypervisors:** running several pretend computers on one real one.
- **Databases and data modeling:** storing results in an organized, searchable way.
- **TCP/IP:** the basic rules computers use to talk over a network.
- **HPC or large-scale data analysis,** and **GPU fleets** (a **GPU**, graphics processing unit, is a chip built to do many small calculations at once).
- For some postings, willingness to obtain a **[[Top Secret clearance|top-secret]]**.

::: key
SRE GNC preferred stack: Docker, Vagrant, Kubernetes; Ansible, Puppet, Terraform; build systems such as Make, Bazel, Pants, Buck, Gradle; package management; virtualization and hypervisors; databases and data modeling; TCP/IP; HPC or large-scale data analysis; GPU fleets; and willingness to obtain a Top Secret clearance.
:::

### What it is, and what it is not

Be honest with yourself about this role. It is genuine, demanding systems and infrastructure engineering. You keep a very large computer fleet running. You keep the pipelines that GNC's own Monte Carlo campaigns depend on working under real load.

It is not control-law design, guidance work or state estimation on day one. A candidate who takes this role expecting to do that work straight away has misread it.

What it gives you, precisely, is **proximity** — being close. You work on the infrastructure that the GNC organization's real technical output runs on. You are in daily contact with its people and its problems. The second half of this lesson depends on exactly that.

## GNC Software Engineer, and simulation and tools roles

A wider family of roles supports the GNC mission through software rather than through control design directly. These people build and maintain the **simulation stack** (the programs that fake a flight so it can be tested on the ground), the analysis tools, and the test infrastructure GNC engineers use every day.

Here the claim has to be careful. Unlike SRE, GNC, this curriculum has not verified an in-lieu-of-degree clause for these roles. Their basic qualifications typically still name a bachelor's degree. Read the specific posting you are considering for its own current wording, and do not assume a substitute exists.

What is accurate is this: these roles **weight demonstrated software ability heavily** when they judge candidates. Where their degree line differs from a GNC Engineer posting at all, it tends to name fields more broadly. And the technical bar leans on real software engineering skill rather than on GNC coursework. That matters to you, because a strong software portfolio — the kind this curriculum builds — carries outsized weight for exactly these roles, even where the degree line still has to be met some other way.

::: key
GNC Software Engineer and simulation/tools roles are not verified to waive the degree the way SRE, GNC does, but they weight demonstrated software skill heavily, which is exactly the kind of evidence a self-taught candidate's portfolio can carry disproportionate weight in providing.
:::

## Why an internal transfer is a different game

Think about a sports team. A stranger who turns up at tryouts gets judged on a few minutes of drills. A player who has trained with the team all season gets judged on everything the coach has already watched. Same team, same spot on the roster, very different evidence.

Hiring works the same way. An external application is read by strangers, working from a **resume** — a one- or two-page summary of your education and work. That is why the earlier lessons spent so much time on the basic-qualifications filter. Strangers need a fast, cheap, reliable check, and the degree line is built to be exactly that.

An internal transfer candidate is not a stranger. The people deciding already have a real track record to look at:

- code they have reviewed over months,
- systems you kept running through real incidents,
- the technical judgment you showed in real meetings.

That is far richer and more direct evidence than any resume can carry. This module's material states that internal transfer is common at SpaceX, and this is the reason: a company that already trusts an employee's demonstrated work has much less need for a credential that exists to vouch for a stranger.

::: key
Why does the side door work? Because the role is inside the GNC organization, working on the infrastructure that GNC analysis depends on. You build relationships, domain exposure and an internal track record, and internal transfer is a far lower bar than an external application.
:::

### What still has to happen

A lower bar is not no bar. This does not mean the degree line vanishes the moment you are inside. This module cannot state internal-transfer policy details with confidence, and you should not assume that time served triggers a move.

The transfer still has to be pursued. Usually that means three things:

1. Building real relationships with the team you want to join.
2. Showing genuine interest in that team's actual problems.
3. Growing technically in the direction that team needs — which, for GNC work, means the same guidance, estimation and control capability this curriculum builds, developed on your own time while the entry role builds the software and infrastructure side.

Path 2 does not answer "am I actually good at GNC?" by itself. It buys you proximity and a track record. You still have to spend that proximity building toward the thing you want. Cal Newport's book *So Good They Can't Ignore You*, in this module's resources, calls this building **[[career capital|career-capital]]**: rare, valuable skills you can later trade for the work you want.

::: key
Internal transfer works differently from an external application because it is evaluated on an actual track record rather than a resume-based filter built for strangers. It is common, but not automatic — it requires deliberately building toward the target team, not merely waiting inside the company.
:::

## Checking candidates against the lines

The habit this section builds: check every line of a posting separately, and do the subtraction for each one. The headline number is not the only number.

::: example Checking one candidate against SRE, GNC's basic qualifications, line by line
A candidate has 3.5 years of professional experience as a backend and DevOps engineer. Of that, 2 years involved daily Linux systems administration, and 1.5 years involved Python as a main language. They hold no bachelor's degree.

**Branch A (degree + 2 years):** does not apply. There is no degree.

**Branch B (4+ years in lieu):** not yet met. The candidate has 3.5 years against 4. The shortfall is

$$
4 - 3.5 = 0.5 \text{ years},
$$

about six months.

**Linux (1+ years):** cleared, at 2 years.

**Python (1+ years):** cleared, at 1.5 years.

**Verdict:** close, not there. The honest reading is about half a year more of qualifying experience before the basic qualifications are met on paper. After that, the preferred stack — containers, configuration management, build systems and the rest — becomes the real subject of a technical screen.

Sanity check: two of the three numeric lines pass, and the one that fails misses by less than a year. "Close, not there" matches the numbers.
:::

::: example How Path 2 years add up toward a later, different threshold
A different candidate spent 1.5 years as a general software engineer at a startup. Then they moved into a role like SRE, GNC and have been there 2 years. They still have no bachelor's degree.

**Step 1 — total the years.** Combined professional software engineering experience:

$$
1.5 + 2 = 3.5 \text{ years}.
$$

**Step 2 — find the right branch.** Sr. GNC Engineer (the senior GNC role) has a branch counting 5+ years of professional experience in GNC or software engineering — but only alongside a qualifying bachelor's degree, which this candidate does not have. Its in-lieu branch counts 7+ years of professional experience in lieu of a degree. That is the one that applies.

**Step 3 — subtract.**

$$
7 - 3.5 = 3.5 \text{ years still to build}.
$$

That is exactly half the threshold still to go — a real, substantial remainder, and better faced now than discovered later.

The software years count toward that total whichever employer they were earned at. What they do not do is shrink the total because some of the time was spent next to a GNC organization rather than inside one.
:::

## Check yourself

::: check
State SRE, GNC's in-lieu-of-degree branch as the posting gives it, including all three numeric thresholds a candidate using it must meet.
:::

::: answer
4+ years of professional experience building software with site reliability or DevOps experience, in lieu of a degree. Alongside it, 1+ years of experience with Linux operating systems and 1+ years of experience with Python and Python-based development frameworks.

The 4-year line belongs to the in-lieu branch only. The Linux and Python lines apply whichever branch of the degree-or-experience line is used — a candidate with a qualifying degree still needs them.
:::

::: check
Explain why this lesson calls SRE, GNC's work "genuine infrastructure engineering" rather than GNC design work, and why that difference matters to someone choosing Path 2.
:::

::: answer
The posting's own duties — monitoring and maintaining a large HPC cluster, running Monte Carlo campaigns, building CI systems and analysis infrastructure — are systems and software tasks. They support GNC's technical output rather than being control-law design, guidance or estimation work.

It matters because a candidate choosing this path should expect proximity and infrastructure work on day one, not GNC design. The move toward GNC design has to be planned as a separate, deliberate step, not assumed to happen on its own.
:::

::: check
Why does an internal transfer candidate face a meaningfully different evaluation from an external applicant, even for the same target role?
:::

::: answer
An external applicant is judged from a resume by people who do not know them. That is why a cheap, reliable filter like the degree line gets used.

An internal candidate is judged by people who already have direct evidence of their real work — code, systems kept running, judgment shown over time. That evidence is richer and more trustworthy than a resume line, so the same formal requirement carries less decisive weight, even where it still nominally applies.
:::

::: check
A candidate has worked 4.5 years as a DevOps engineer, with 3 years of Linux experience and 6 months of Python experience, and no degree. They believe they clear SRE, GNC's basic qualifications. Check the claim against all three thresholds.
:::

::: answer
- 4+ years in lieu of a degree: cleared, at 4.5 years.
- 1+ years of Linux: cleared, at 3 years.
- 1+ years of Python: **not** cleared. 6 months is 0.5 years, short of the 1-year minimum by $1 - 0.5 = 0.5$ years.

So the candidate does not yet meet the full basic qualifications. The Python line is the gap — and it is the kind of gap that is easy to miss if you only check the headline "4+ years" figure.
:::

::: check
Why does this lesson warn that Path 2 does not, by itself, settle whether a candidate can actually do GNC design work?
:::

::: answer
Path 2's entry roles are judged on software and infrastructure skill. An internal transfer changes who judges you and on what evidence. Neither step creates GNC-specific capability.

The candidate still has to build real guidance, estimation and control understanding, usually through self-directed work during the entry role, so that when a transfer opportunity opens there is real capability to show. Proximity and a good track record open the door; they do not walk through it for you.
:::

## Summary

| Element | What it states or does | What it does not do |
| --- | --- | --- |
| SRE, GNC in-lieu branch | 4+ years professional SRE/DevOps software experience, in lieu of a degree | Does not waive the 1+ year Linux or Python lines |
| SRE, GNC role itself | HPC cluster maintenance, Monte Carlo infrastructure, CI, GNC tooling | Not control-law design or estimation work |
| SRE, GNC preferred stack | Containers, configuration management, build systems, databases, TCP/IP, HPC, GPUs, possible clearance | Not required, but tested in interviews |
| GNC Software Engineer / tools roles | Weight demonstrated software skill heavily | Not verified to waive the degree line itself |
| Internal transfer | Evaluated on an actual track record; common at SpaceX | Not automatic, and not triggered by tenure alone |
| Years toward Sr. GNC's 7-year branch | Add up across employers and adjacent roles | Proximity to GNC work does not shrink them |

The next lesson turns to Path 3 — building professional GNC experience directly, at companies whose credential gate is looser than a large established employer's, and what that experience converts into later.

::: context transfer-map Two ways into the same room
The front door and the side door lead to the same building, but only one of them checks for a degree. Path 2 takes the side door, then makes a second move inside.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="150" y="20" width="200" height="140" rx="8" fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <text x="158" y="36" font-size="11" fill="#6c7a93">GNC organization</text>
  <rect x="10" y="80" width="90" height="36" rx="6" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="55" y="102" font-size="11" fill="#1f2a44" text-anchor="middle">You, no degree</text>
  <rect x="240" y="45" width="100" height="35" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="290" y="67" font-size="12" fill="#1f2a44" text-anchor="middle">GNC Engineer</text>
  <rect x="240" y="115" width="100" height="35" rx="6" fill="#ffffff" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="290" y="137" font-size="12" fill="#1f2a44" text-anchor="middle">SRE, GNC</text>
  <line x1="100" y1="92" x2="180" y2="75" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="180,75 172,80.8 170.4,73" fill="#1f2a44"/>
  <line x1="186" y1="60" x2="186" y2="88" stroke="#b4232c" stroke-width="4"/>
  <text x="186" y="54" font-size="11" fill="#b4232c" text-anchor="middle">degree line</text>
  <line x1="100" y1="105" x2="229" y2="130.6" stroke="#1d6fd1" stroke-width="1.5"/>
  <polygon points="238,132 228.4,134.2 230,126.3" fill="#1d6fd1"/>
  <text x="168" y="143" font-size="11" fill="#1d6fd1" text-anchor="middle">4+ yrs in lieu</text>
  <line x1="290" y1="115" x2="290" y2="90" stroke="#1d6fd1" stroke-width="1.5"/>
  <polygon points="290,81 285,91 295,91" fill="#1d6fd1"/>
  <text x="297" y="104" font-size="11" fill="#1d6fd1">transfer</text>
</svg>
```

The blue route is two steps, and each can fail on its own: the entry lines must be met, and the transfer must be earned.
:::

::: context sre-origin Where "site reliability" came from
The job title Site Reliability Engineer comes from Google. In 2003 an engineer there, Ben Treynor Sloss, was asked to run a team keeping the company's websites up, and he built it as a team of software engineers rather than traditional system administrators. The "site" is the website or service; "reliability" is keeping it working. The idea spread across the industry. Today an SRE anywhere writes code to automate away repetitive work, measures how often systems fail, and is on call when they do. At SpaceX, the "site" being kept reliable is GNC's compute cluster and its pipelines.
:::

::: context devops-word Development plus operations
DevOps glues together two words: **development**, the people who write software, and **operations**, the people who run it on real machines. For decades these were separate teams, and code was "thrown over the wall" from one to the other, often breaking on the way. Around 2009 the name DevOps caught on for the practice of having the same engineers build, ship and run their software, with heavy automation in between. A "DevOps engineer" builds that automation: the pipelines, the machine setups and the monitoring.
:::

::: context in-lieu-word A place held by something else
"Lieu" is French for "place," so "in lieu of" means "in place of." The same root hides in **lieutenant** — literally "place-holder," an officer who holds the place of a higher commander. In a job posting, "4+ years of experience in lieu of a degree" means the years take the degree's place in that one line. They do not take the place of anything else on the list.
:::

::: context hpc-cluster What a cluster looks like
A cluster is rows of metal racks, each holding dozens of flat computers called nodes, all linked by fast network cables. Each node has several CPUs, and each CPU several cores. Software called a **scheduler** hands out jobs — "run flight 4,127 of 10,000" — to whichever cores are free. Tens of thousands of CPUs let a Monte Carlo campaign that would take months on one machine finish overnight. The SRE's job is keeping all of it healthy: replacing failed nodes, updating software without stopping work, and noticing problems before users do.
:::

::: context monte-carlo Why a casino gave its name to rocket testing
The method is named after the Monte Carlo casino in Monaco, because it runs on chance. Stanislaw Ulam and John von Neumann developed it at Los Alamos in the 1940s. For a rocket, each run draws random but realistic errors — a gust, a slightly weak engine — and simulates the whole flight. Plot where every run ends up and you see the spread.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <ellipse cx="180" cy="95" rx="68" ry="28" fill="none" stroke="#1d6fd1" stroke-width="1.5" stroke-dasharray="5 4"/>
  <line x1="172" y1="95" x2="188" y2="95" stroke="#b4232c" stroke-width="2"/>
  <line x1="180" y1="87" x2="180" y2="103" stroke="#b4232c" stroke-width="2"/>
  <g fill="#1f2a44"><circle cx="171" cy="102" r="2.6"/><circle cx="172" cy="91" r="2.6"/><circle cx="148" cy="92" r="2.6"/><circle cx="218" cy="101" r="2.6"/><circle cx="215" cy="98" r="2.6"/><circle cx="193" cy="98" r="2.6"/><circle cx="123" cy="107" r="2.6"/><circle cx="197" cy="102" r="2.6"/><circle cx="122" cy="71" r="2.6"/><circle cx="150" cy="88" r="2.6"/><circle cx="190" cy="94" r="2.6"/><circle cx="198" cy="86" r="2.6"/><circle cx="190" cy="101" r="2.6"/><circle cx="158" cy="119" r="2.6"/><circle cx="199" cy="112" r="2.6"/><circle cx="159" cy="85" r="2.6"/><circle cx="168" cy="94" r="2.6"/><circle cx="201" cy="98" r="2.6"/><circle cx="165" cy="82" r="2.6"/><circle cx="162" cy="112" r="2.6"/><circle cx="153" cy="98" r="2.6"/><circle cx="195" cy="74" r="2.6"/><circle cx="182" cy="113" r="2.6"/><circle cx="112" cy="90" r="2.6"/><circle cx="176" cy="84" r="2.6"/><circle cx="197" cy="94" r="2.6"/><circle cx="130" cy="107" r="2.6"/><circle cx="203" cy="108" r="2.6"/><circle cx="229" cy="100" r="2.6"/><circle cx="184" cy="77" r="2.6"/><circle cx="201" cy="86" r="2.6"/><circle cx="165" cy="77" r="2.6"/><circle cx="147" cy="88" r="2.6"/><circle cx="224" cy="67" r="2.6"/><circle cx="130" cy="98" r="2.6"/><circle cx="229" cy="103" r="2.6"/><circle cx="192" cy="85" r="2.6"/><circle cx="142" cy="109" r="2.6"/><circle cx="217" cy="97" r="2.6"/><circle cx="188" cy="101" r="2.6"/></g>
  <text x="180" y="30" font-size="12" fill="#1f2a44" text-anchor="middle">40 simulated landings</text>
  <text x="180" y="160" font-size="11" fill="#b4232c" text-anchor="middle">+ target</text>
  <text x="180" y="176" font-size="11" fill="#1d6fd1" text-anchor="middle">dashed oval: the expected spread</text>
</svg>
```

Real campaigns run thousands of cases, not forty. You will build your own later in this course.
:::

::: context ci-pipeline The robot that checks every change
Continuous integration means every change a programmer submits is built and tested automatically, within minutes, before it can join the main code. If any test fails, the change bounces back.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5" fill="#ffffff">
    <rect x="8" y="20" width="72" height="32" rx="6"/><rect x="100" y="20" width="72" height="32" rx="6"/>
    <rect x="192" y="20" width="72" height="32" rx="6"/><rect x="284" y="20" width="68" height="32" rx="6" fill="#8fb8f0"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="44" y="41">Change</text><text x="136" y="41">Build</text><text x="228" y="41">Test</text><text x="318" y="41">Merge</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5"><line x1="80" y1="36" x2="94" y2="36"/><line x1="172" y1="36" x2="186" y2="36"/><line x1="264" y1="36" x2="278" y2="36"/></g>
  <g fill="#1f2a44"><polygon points="100,36 93,32 93,40"/><polygon points="192,36 185,32 185,40"/><polygon points="284,36 277,32 277,40"/></g>
  <polyline points="228,52 228,80 44,80 44,60" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <polygon points="44,52 40,61 48,61" fill="#b4232c"/>
  <text x="136" y="97" font-size="11" fill="#b4232c" text-anchor="middle">a test fails: fix it and try again</text>
</svg>
```

For flight software this is a safety net: a change that breaks a guidance test never reaches a vehicle. The SRE keeps this machine fast and trustworthy.
:::

::: context container-word Why software comes in containers
Before shipping containers, cargo was loaded crate by crate, and every port handled it differently. The standard steel box changed that: any crane, ship or truck can move it. Docker, launched in 2013, borrowed the idea. It seals a program together with everything it needs — libraries, settings, the right versions — so it runs the same on a laptop, a test server or ten thousand cluster nodes. "It worked on my machine" stops being an excuse.
:::

::: context top-secret What a security clearance is
A security clearance is the US government's permission for a person to see classified information. The main levels, from lowest to highest, are Confidential, Secret and Top Secret. You cannot apply for one on your own. An employer sponsors you because your job needs it, and then the government runs a background investigation, which can take months. Clearances are generally granted only to US citizens. It connects to the ITAR module earlier in this track: both are about who may see sensitive work, though a clearance and ITAR eligibility are different things.
:::

::: context career-capital Skills as currency
In *So Good They Can't Ignore You* (2012), Cal Newport argues that people rarely find great work by following a passion they already have. Instead they build **career capital** — skills that are rare and valuable — and then spend it to get more control over what they do. Path 2 fits that picture well. Years of reliable infrastructure work at the heart of a GNC organization are capital. The transfer is where you spend it, and the GNC skills you build on the side decide how much it buys.
:::
