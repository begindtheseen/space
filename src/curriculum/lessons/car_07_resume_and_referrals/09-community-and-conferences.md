---
id: l09-community-and-conferences
title: "Community and conferences: building the presence a referral needs"
minutes: 18
covers:
  - "community and conferences: AIAA and AAS Space Flight Mechanics, SmallSat, university seminars, open-source contribution"
---

Think about how a new kid joins a pickup soccer game at the park. Walking up and asking "Can I be captain?" goes nowhere. Showing up every Saturday, passing well, and chasing down loose balls works. After a few weeks, the regulars know your name and pick you for their team without being asked.

Getting known in an engineering field works the same way. The last lesson ended on an honest problem. A referral request works best when the person you ask *already* has their own evidence of your work. That evidence has to exist before you ask. You cannot build it in the moment you need it.

This lesson is about where that evidence gets built. There is no shortcut into a network you were not born into or hired into. But there is an honest, concrete path. It runs through the places where GNC engineers really spend their time: a few **[[technical societies|technical-society]]** and their conferences, university seminars, and open-source software projects. None of them needs an industry contact to start. All of them reward steady, real participation over showing off or sending lots of messages. None of them is a trick.

## AIAA and AAS Space Flight Mechanics

A **technical society** is a club for people in one profession. It runs conferences, publishes papers, and keeps members in touch. Two matter most for GNC work.

- **AIAA** (say each letter, "A-I-A-A") is the American Institute of Aeronautics and Astronautics — the largest society for aerospace engineers in the United States.
- **AAS** ("A-A-S") is the American Astronautical Society. Together with AIAA it runs the **[[Space Flight Mechanics|space-flight-mechanics]]** meetings, where a large share of published GNC and **astrodynamics** work — the math of how spacecraft move in orbit — gets presented.

Joining a society like this usually costs money. But much of what matters to you right now is often free to browse without joining: the **technical program** (the schedule of talks), the session listings, and often the **[[abstracts|abstract]]** — short summaries of each paper — or even the papers themselves.

That alone is worth using. Reading a real, current program shows you which problems the field is working on right now, in the field's own words. That is useful whether or not you ever sit in a session.

Prices, membership levels, and formats change over time. Check them on the society's own website rather than trusting this lesson. What does not change is the opportunity. If you can attend a session, in person or online, you are in a room with people whose papers you can read beforehand. That makes a specific, prepared question possible — something a cold message never allows. Some meetings also run sessions or contests only for students. Whether one exists in a given year, and what it asks for, is worth checking in that year's actual call for papers rather than assuming.

## SmallSat: the Small Satellite Conference

The **Small Satellite Conference**, usually called **[[SmallSat|smallsat]]**, is a major yearly meeting about small satellites. A lot of hands-on work on small-satellite GNC and **ADCS** (say "A-D-C-S": the attitude determination and control system, which works out which way the satellite points and turns it) is presented there.

That work is often close in size and budget to a project you might build yourself. A giant flagship program is not. And like most established conferences, SmallSat keeps a large archive of past papers that anyone can usually read. So going there is not the only way to get value from it.

Reading papers close to your own **anchor projects** — the three or so portfolio projects that carry your application — is worth doing for its own sake. It shows how people working on problems like yours describe how they **verified** their work (checked it was built right) and **validated** it (checked it was the right thing to build). That is the same discipline your portfolio already asks of you. A candidate who has read several real smallsat ADCS papers closely writes a more believable verification section for her own project. That is true even if she never meets anyone.

::: key
Browsing a conference's technical program and reading its papers is commonly available even when attending in person is not. It is worth doing for its own sake: it shows you the field's current problems in its own vocabulary, and gives you real examples of how others verify and validate similar work.
:::

## University seminars

A **seminar** is a talk, usually about an hour, where a researcher presents recent work to a department. Many university seminar series let outsiders attend. A number of them are **livestreamed** (broadcast live online) or recorded. So you do not need to be enrolled anywhere to attend one.

This is a cheap option you can repeat as often as you like. Here is the recipe:

1. Find a research group working on something close to your interests.
2. Watch one of their talks.
3. Prepare one specific, substantive question tied to something the speaker actually said.

Asking a real question at the end of a talk — a question, not a comment — makes you a specific, remembered person to that research group, instead of an anonymous face in the audience. It takes no prior connection at all. It only takes real preparation: understanding enough of the talk to show you followed the argument, not only that you were in the room.

::: example A prepared question, and a generic comment, after the same talk
**Generic:** "Great talk, really interesting work!"

This is a pleasant thing to say. It is forgotten within the hour, because nothing in it is specific to what was presented.

**Prepared:** "You mentioned the filter's **[[covariance grew unexpectedly during the eclipse period|eclipse-question]]** — was that traced to the star-tracker dropout, or to the propagated process noise during that interval?"

Check what makes this one work, point by point:

- It is only possible to ask if you really followed the technical content.
- It points to a specific moment in the talk.
- It offers two concrete explanations, so the speaker has something real to answer.

That is also why a speaker remembers it afterward. It shows real engagement, not polite attendance.
:::

::: key
A prepared, specific question tied to what a speaker actually said requires no prior connection to ask, and it is a repeatable way to become a remembered person to a specific research group rather than an anonymous attendee.
:::

## Open-source contribution

**Open-source software** is code that anyone may read, use, and improve. Its source is public. A few people called **maintainers** look after each project and decide which changes get in. A proposed change is called a **[[pull request|pull-request]]** (often "PR", said "P-R"): you are asking the maintainers to *pull* your change into their code.

Of every option in this lesson, contributing real work to an existing open-source **[[astrodynamics, estimation, or controls project|real-projects]]** gives the strongest signal for the least cost. No travel, no membership fee, no schedule to fit around a talk.

It also links straight back to your portfolio work. In the portfolio module you made projects **[[reproducible|reproducible-bridge]]**: random seeds fixed, library versions pinned, and tests run automatically on every change by **continuous integration** (CI, said "C-I"). A project built that way can accept an outsider's change cleanly. The maintainer can see at once whether your change passes every existing test. That is exactly what a maintainer needs to trust a pull request from a stranger.

The difference that matters is between a substantive contribution and a low-effort one. Maintainers can usually tell at a glance — and so can anyone who reads the closed pull request later.

- A one-word documentation fix or a whitespace change is real, but it shows almost nothing about your technical ability.
- A pull request that fixes a genuine numerical bug, adds a **[[regression test|regression-test]]** that would have caught it, and explains briefly how the bug was found is different. It is a lasting, public record, reviewed by someone else, that anyone can check without taking your word for anything.

That second kind is exactly the evidence the last lesson said a strong referral request stands on.

::: key
Where do you actually meet GNC engineers? AIAA and AAS Space Flight Mechanics meetings, the Small Satellite Conference, university seminars, and open-source projects in astrodynamics and estimation. Contributing a real fix to a project someone maintains is the highest-signal introduction available.
:::

::: warning Low-effort contribution does not build the record you need
A trivial pull request — a typo fix, a formatting change with nothing behind it — costs little effort and buys about as little credibility. Both it and a real bug fix count as "a merged pull request". They do not show the same thing. Only the one that finds and fixes a real problem, with a test attached, shows technical skill.
:::

::: example Two pull requests to the same open-source library
**The first pull request** corrects one misspelled word in a README file (the front-page instructions of a project). It is real and welcome, and a maintainer merges it within minutes. It shows essentially nothing about the contributor's technical ability, because none was needed to make it.

**The second pull request** does four things:

1. It fixes a numerical bug in a coordinate-transformation function. For one particular edge case, the function silently gave wrong answers.
2. It adds a new regression test. The test fails on the old code and passes on the fixed code.
3. It explains, in the pull request's description, how the bug was found: the contributor compared the function's output against an independent reference case during her own portfolio work.
4. It passes the project's existing tests, so nothing else broke.

Sanity check — what does a maintainer reviewing it see? Real debugging skill, an understanding of the math underneath, and the same verification habit this curriculum teaches. Anyone who reads the merged pull request later sees the same thing. That includes, one day, someone deciding whether to refer her. And none of it depends on anything she says about herself.
:::

## What this actually buys, and what it does not

None of this guarantees an interview or an offer. Saying otherwise would be dishonest. The last lesson was clear that even a strong referral changes only how carefully an application gets read. It does not change whether the application meets a stated requirement.

What steady, real participation in these places buys is two things, and both are real:

- **Technical growth.** You work with people and problems more advanced than anything you would meet working alone.
- **Becoming known and checkable.** Over time, specific people know who you are and can check your work for themselves.

The second is what eventually makes a referral request land where a cold one would not. Not because the request is cleverly worded. Because the person reading it already has real evidence, formed before you ever asked, that it is worth acting on.

## Check yourself

::: check
A candidate cannot afford to attend a technical conference in person. Explain why browsing its technical program is still worth her time.
:::

::: answer
Technical programs — and often the papers or abstracts themselves — are commonly free to browse even when attending costs money or travel. Reading them shows what problems the field is working on right now, in the field's own current vocabulary. For a conference like SmallSat, with applied, project-sized work, the papers also give real examples of how others verify and validate work like her own. All of that is useful even if she never sits in a session.
:::

::: check
Why is a university seminar a realistic access point for a self-taught candidate with no institutional affiliation, when many other academic resources assume enrollment?
:::

::: answer
Many department seminar series are open to outside attendees or are livestreamed, so attending does not require being enrolled at, or connected to, the university. The only real requirement is preparation: understanding the talk well enough to ask a specific, substantive question at the end. That depends on effort, not on status, so it is open to her whatever her formal academic standing.
:::

::: check
Contrast a substantive open-source contribution with a low-effort one, and explain why a stranger evaluating a candidate's work later would weigh them differently.
:::

::: answer
A substantive contribution — fixing a genuine bug, adding a regression test, explaining how the problem was found — shows real debugging skill, technical understanding, and the same verification discipline a strong portfolio project needs. A low-effort contribution, such as a typo fix, needs little technical skill and so shows little, even though both are merged pull requests. A stranger reading the closed pull request later can see the difference directly in what the change involved, without relying on anything the contributor says about herself.
:::

::: check
This lesson states plainly that community involvement and conference attendance do not guarantee an interview or an offer. What do they actually provide instead?
:::

::: answer
Two things. First, real technical growth, from working with people and problems beyond what working alone produces. Second, a track record of being a known, independently checkable person to specific people over time. The second is what eventually makes a referral request work. It guarantees no hiring outcome, but it gives someone real, pre-existing evidence to act on when the request finally comes.
:::

::: check
Explain why open-source contribution is described in this lesson as connecting directly back to the reproducibility work built earlier in this curriculum's portfolio material.
:::

::: answer
A project with fixed random seeds, pinned dependencies, and a verification suite run by continuous integration is also a project built so an outside contribution can be reviewed and trusted cleanly. A maintainer can see at once whether a pull request passes the existing tests and keeps the project's verified behavior. So the same discipline that makes a portfolio project defensible to a hiring panel is what lets a stranger's contribution — to that project, or to someone else's project built the same way — be judged fairly and taken seriously.
:::

## Summary

| Venue | Realistic access point without existing contacts | What it actually builds |
| --- | --- | --- |
| AIAA / AAS Space Flight Mechanics | Browse technical programs and abstracts freely; attend a session if you can | Field vocabulary and current problems; a room with people whose work you can question |
| SmallSat | Browse past papers, often openly archived | Applied, project-sized examples close to your own anchor work |
| University seminars | Attend open or livestreamed talks; ask one prepared question | Being a specific, remembered person to a specific research group |
| Open-source contribution | A substantive pull request to an existing project | A lasting, third-party-reviewed record of real technical ability |

The next lesson covers the last two tools for someone actively searching: reaching out directly on LinkedIn, and knowing what has to really change before you reapply to a company that has already said no once.

::: context technical-society What a technical society is
A technical society is a professional club for one field. Members pay dues. The society runs conferences, publishes journals, and sets up committees where experts in one narrow topic meet regularly.

AIAA was formed in 1963 when two older groups merged: the American Rocket Society and the Institute of the Aerospace Sciences. Its biggest winter event, the SciTech Forum, includes a Guidance, Navigation, and Control conference — so "going to AIAA" is, for many GNC engineers, a yearly routine.

Societies also run **technical committees**. These are small groups for one topic, such as astrodynamics or GNC, and their meeting information is often public.
:::

::: context space-flight-mechanics What "space flight mechanics" means
**Mechanics** is the branch of physics about forces and motion. **Space flight mechanics** applies it to spacecraft: how orbits change, how to plan a trajectory from one orbit to another, how a spacecraft spins and points.

It is the home ground of the "G" and "N" in GNC — guidance (where should we go?) and navigation (where are we?). The orbital mechanics and attitude modules in this course are the same subject. So the talks at these meetings are the grown-up version of what you are studying.
:::

::: context abstract How a conference paper is born
An **abstract** is a summary of a paper, often a few hundred words long, that tells you what was done and what was found. At a conference, it is also the first step of a pipeline.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="60" x2="340" y2="60" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="340,60 330,55 330,65" fill="#1f2a44"/>
  <circle cx="40" cy="60" r="7" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="115" cy="60" r="7" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="190" cy="60" r="7" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="265" cy="60" r="7" fill="#1d6fd1" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="40" y="40" font-size="11" text-anchor="middle" fill="#1f2a44">Call for</text>
  <text x="40" y="88" font-size="11" text-anchor="middle" fill="#1f2a44">papers</text>
  <text x="115" y="40" font-size="11" text-anchor="middle" fill="#1f2a44">Abstract</text>
  <text x="115" y="88" font-size="11" text-anchor="middle" fill="#1f2a44">accepted</text>
  <text x="190" y="40" font-size="11" text-anchor="middle" fill="#1f2a44">Full paper</text>
  <text x="190" y="88" font-size="11" text-anchor="middle" fill="#1f2a44">submitted</text>
  <text x="265" y="40" font-size="11" text-anchor="middle" fill="#1d6fd1">Talk at the</text>
  <text x="265" y="88" font-size="11" text-anchor="middle" fill="#1d6fd1">conference</text>
  <text x="180" y="118" font-size="11" text-anchor="middle" fill="#6c7a93">months pass between the first step and the talk</text>
</svg>
```

Because the program and abstracts are posted before the meeting, you can read a speaker's work weeks ahead — which is what makes a prepared question possible.
:::

::: context smallsat Where SmallSat happens
The Small Satellite Conference is usually held each August at Utah State University in Logan, Utah. Its papers are archived online by the university, going back many years, and most can be read free.

Many of the satellites discussed there are **CubeSats**: satellites built from standard 10 cm cubes, each called one "unit", or 1U. Three stacked make a 3U; six in a block make a 6U.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="40" y="80" width="30" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="55" y="130" font-size="12" text-anchor="middle" fill="#1f2a44">1U</text>
  <rect x="150" y="20" width="30" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="150" y="50" width="30" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="150" y="80" width="30" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="165" y="130" font-size="12" text-anchor="middle" fill="#1f2a44">3U</text>
  <rect x="260" y="20" width="30" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="260" y="50" width="30" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="260" y="80" width="30" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="290" y="20" width="30" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="290" y="50" width="30" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="290" y="80" width="30" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="290" y="130" font-size="12" text-anchor="middle" fill="#1f2a44">6U</text>
  <text x="55" y="70" font-size="11" text-anchor="middle" fill="#6c7a93">10 cm</text>
</svg>
```

A CubeSat often has tiny reaction wheels, magnetic torquers, and low-cost sensors, so pointing it well is a real GNC problem at a scale one person can study.
:::

::: context eclipse-question Unpacking the prepared question
Each piece of that question means something.

- The **covariance** is the filter's own estimate of how unsure it is. When it grows, the filter is less certain.
- An **eclipse** is when the satellite passes into Earth's shadow.
- A **star tracker** is a camera that works out which way the spacecraft points by recognizing star patterns. It can drop out — stop giving answers — for reasons such as the Sun or Earth getting into its view.
- **Process noise** is the filter's allowance for things its model gets wrong, which piles up while no measurement arrives.

So the question asks: did the uncertainty grow because a sensor went quiet, or because of how the filter was tuned? You will meet both ideas properly in the Kalman filter module.
:::

::: context pull-request How a pull request travels
On sites like GitHub, a pull request follows the same path in almost every project.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="6" y="35" width="62" height="40" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="37" y="52" font-size="11" text-anchor="middle" fill="#1f2a44">Copy the</text>
  <text x="37" y="66" font-size="11" text-anchor="middle" fill="#1f2a44">code</text>
  <rect x="78" y="35" width="62" height="40" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="109" y="52" font-size="11" text-anchor="middle" fill="#1f2a44">Fix +</text>
  <text x="109" y="66" font-size="11" text-anchor="middle" fill="#1f2a44">test</text>
  <rect x="150" y="35" width="62" height="40" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="181" y="52" font-size="11" text-anchor="middle" fill="#1f2a44">CI runs</text>
  <text x="181" y="66" font-size="11" text-anchor="middle" fill="#1f2a44">all tests</text>
  <rect x="222" y="35" width="62" height="40" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="253" y="52" font-size="11" text-anchor="middle" fill="#1f2a44">Maintainer</text>
  <text x="253" y="66" font-size="11" text-anchor="middle" fill="#1f2a44">reviews</text>
  <rect x="294" y="35" width="60" height="40" rx="6" fill="#1d6fd1" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="324" y="59" font-size="11" text-anchor="middle" fill="#fff">Merged</text>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="68" y1="55" x2="78" y2="55"/><line x1="140" y1="55" x2="150" y2="55"/>
    <line x1="212" y1="55" x2="222" y2="55"/><line x1="284" y1="55" x2="294" y2="55"/>
  </g>
  <text x="180" y="105" font-size="11" text-anchor="middle" fill="#6c7a93">every step stays public, with names and dates</text>
</svg>
```

That last line is the point. Years later, anyone can open the pull request and read the change, the test, the discussion, and who approved it.
:::

::: context real-projects Real open-source projects in the field
There are real, openly developed tools in this area. **GMAT**, NASA's General Mission Analysis Tool, plans and analyzes spacecraft trajectories. **Orekit** is a widely used space flight dynamics library written in Java. **Basilisk**, from the University of Colorado Boulder, simulates spacecraft attitude and orbit.

Each has public code, public issue lists, and maintainers who review contributions. Pick one close to your anchor projects. Read its open issues — reported bugs and wished-for features — before writing any code.
:::

::: context reproducible-bridge Why your portfolio habits matter here
The portfolio module asked you to fix random seeds, pin library versions, and run tests on every change. There it was about letting a hiring panel rerun your results.

Here the same habits show up from the other side. When you contribute to someone else's project, their test suite is what checks your change. And when you know how to write a good test for your own work, you know how to write one for theirs. Reproducibility is more than tidiness. It is what lets strangers trust each other's code.
:::

::: context regression-test Why it is called a regression test
To **regress** means to go backward. A regression is a bug that comes back, or a feature that used to work and now does not.

A **regression test** pins down one bug forever. You write a test that runs the exact case that went wrong and checks the right answer. On the old code it fails; on the fixed code it passes. From then on, CI runs it on every change. If anyone ever brings the bug back, the test fails at once.

That is why a fix with a regression test is worth so much more than a fix alone: it proves the bug was real, and it keeps it gone.
:::
