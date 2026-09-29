---
id: l01-the-process-and-the-itar-gate
title: The process end to end, and the ITAR gate
minutes: 19
covers:
  - 'The reported process: recruiter screen, a two to four hour take-home or timed challenge, technical rounds, a day-long onsite of four to six rounds, behavioural throughout'
  - US person status under ITAR as a hard gate for essentially all roles
---

Think about trying out for a school sports team. First a coach checks that you are old enough and signed up. Then there is a skills drill you do on your own. Then a practice with the team, where the older players watch how you play. Finally there is a long tryout day with several drills in a row, and the whole time the coaches are also watching something else: whether you listen, whether you own your mistakes, whether you are someone they want on the bus.

A SpaceX-style engineering interview has the same shape. It is a series of **stages** — separate steps you pass one at a time — and each stage checks something different. Knowing the stages ahead of time turns a scary unknown into a checklist. It also tells you where your preparation hours should go, which is the whole point of this module.

This lesson walks through the process from the first phone call to the last round, puts it on a calendar with real arithmetic, and says what each stage is testing. Then it covers the one check that comes before all the others and cannot be prepared for: the **ITAR gate**, a legal rule about who may see the work at all.

## The process, stage by stage

Everything in this section is **[[reported|what-reported-means]]** — meaning it comes from many candidates' own accounts of their interviews, not from an official company rulebook. Different teams run it differently, and it changes over time. Treat it as a map drawn by people who walked the ground, not as a contract.

Here are the stages, in order.

1. **The recruiter screen.** A short call with a **[[recruiter|recruiter-role]]** — the person whose job is to find candidates and move them through the process. They check that your background fits the role, and they confirm that you are eligible to work on the program (more on that below).
2. **The take-home or timed challenge.** A **[[practical problem|take-home-vs-timed]]** you solve on your own, reported at roughly two to four hours. It is either something you do at home and send back, or a timed session on a coding website.
3. **Technical rounds with the hiring team.** Calls with engineers from the **[[hiring team|hiring-team]]** — the team that would hire you. These go deeper: algorithms (last module's material), systems C++, and questions about things you have built.
4. **The onsite.** A day-long block of four to six rounds in a row, including a presentation you give to the team.

Two more facts wrap around all four stages. First, behavioral questions — questions about how you work, how you handle failure, and why you want this job — are not one stage. They run through every stage. Second, the process can stop at any stage. There is no guarantee that passing one step gets you the next.

::: key The process end to end
Recruiter screen, a roughly two to four hour take-home or timed challenge, technical rounds with the hiring team, then a day-long onsite of four to six rounds including a presentation to the team. Commonly five to eight touchpoints over four to six weeks, and it can stop at any stage.
:::

A **[[touchpoint|touchpoint]]** is any one contact in the process: a call, a challenge, a round. The recruiter screen is one touchpoint. The take-home is another. Each technical round is another. That is how four stages become five to eight touchpoints.

::: warning "It went well" is not a stage
People often stop preparing after a round that felt good, because they assume the next step is a formality. It is not. The process can stop at any stage, and the later stages test different things from the earlier ones. The onsite is the hardest part, so it deserves the most preparation, not the least.
:::

## What each stage is checking

It helps to know what each stage is *for*, because then you know what to show. The list below is the general purpose of each kind of step in an engineering hiring process, not a secret scoring sheet.

- **Recruiter screen: can this go ahead at all?** Is the background a plausible fit, is the timing right, and is the person legally able to do the work? This is the call where the ITAR question is asked. It is short, and it is not a technical test, but it can end the process on the spot.
- **Take-home or timed challenge: can you produce working code on your own?** Two to four hours is long enough to see whether your code runs, handles messy input, and is readable, without anyone helping. The algorithms module prepared you for this one.
- **Technical rounds: how deep does your knowledge go?** Now an engineer asks follow-up questions. Why this data structure? What happens to memory here? What would break first? These rounds reward understanding over memorized answers.
- **The onsite: would we want to work next to this person every day?** Four to six rounds give the team a full picture. The rest of this module is built around them:
  - a **systems C++** round (lesson 2) on memory, ownership and threads;
  - **live debugging** (lesson 3), where you are handed broken code and asked to find the fault;
  - **system design** (lessons 4 and 5), such as a simulation or telemetry system;
  - **domain rounds** for guidance, navigation and control roles (lesson 6);
  - the **technical presentation** (lesson 7), where the questions run longer than the talk;
  - and the **behavioral** thread (lessons 8 and 9), reported to fill a large share of onsite time.

::: note Why the same thing gets checked more than once
You might wonder why behavioral questions keep coming back instead of getting one round of their own. A single conversation is a small, noisy sample. Asking about ownership and honesty in several rounds, with several interviewers, gives a much more reliable picture, the same way a thermometer reading is more trustworthy when three sensors agree. The practical lesson for you: every round is partly behavioral, so every answer should show how you work, not only what you know.
:::

## Putting it on a calendar

A process of five to eight touchpoints over four to six weeks sounds relaxed. Put numbers on it and it is not.

::: example How much time between touchpoints?
Take the two extremes of the reported range.

**Slowest spacing:** five touchpoints spread over six weeks. Six weeks is $6 \times 7 = 42$ days. Five touchpoints have four gaps between them (the first touchpoint starts the clock). So the average gap is

$$
\frac{42}{4} = 10.5 \text{ days}.
$$

**Fastest spacing:** eight touchpoints over four weeks. Four weeks is $4 \times 7 = 28$ days. Eight touchpoints have seven gaps:

$$
\frac{28}{7} = 4 \text{ days}.
$$

So between one round and the next you may have as little as about four days, and at most about a week and a half.

Sanity check: in both cases the average falls between a few days and two weeks, which matches what "five to eight touchpoints in four to six weeks" feels like. Ten and a half days is under two weeks, and four days is more than zero — neither extreme is strange.
:::

That gap is the key number. Four days is enough to rehearse a presentation you have already built. It is not enough to learn C++ memory management from scratch.

::: example Can you prepare during the process?
This module is budgeted at $40$ hours. The algorithms module before it was also $40$ hours. Suppose you start both only when the recruiter calls, and the process runs its full length.

Over **six weeks**, the weekly load for this module alone is

$$
\frac{40 \text{ h}}{6 \text{ weeks}} \approx 6.7 \text{ h per week}.
$$

Over **four weeks** it is

$$
\frac{40 \text{ h}}{4 \text{ weeks}} = 10 \text{ h per week}.
$$

Add the algorithms module and the fast case doubles:

$$
\frac{40 + 40}{4} = 20 \text{ h per week},
$$

plus the take-home itself, which can take up to $4$ hours in one of those weeks. Twenty hours a week is half of a full-time job, stacked on top of whatever you already do.

Sanity check: $20 \times 4 = 80$, which is the two modules' total, so the division is right.
:::

The conclusion is plain. Do the preparation *before* you apply. Use the weeks of the process to rehearse, not to learn.

::: warning Do not count the take-home as "only two hours"
The reported range is two to four hours, and that is the time on the clock. Reading the task, setting up, testing, and writing a short explanation all come on top if it is a take-home. Plan for the high end.
:::

## The ITAR gate

Now the check that comes first and outranks everything else.

Rockets and spacecraft are treated by US law much like weapons technology. The rules that control them are called **ITAR**, the International Traffic in Arms Regulations: a set of US government rules about who may receive certain military and space technology. Because the work is **[[export-controlled|export-control]]** — sharing it with the wrong person counts as an export, even inside a US office — the company can only give the work to people with the right legal status.

That status is called being a **US person**. In the short form a recruiter will use, it means a US citizen or a **[[lawful permanent resident|green-card]]** (a green card holder). The [[full legal definition|us-person-full]] adds two small groups, which the ITAR module covers.

::: key The ITAR gate
Essentially all SpaceX roles require US person status, meaning a citizen, lawful permanent resident or protected individual (refugee or asylee), because the work is export-controlled. It is confirmed in the recruiter screen and it is not negotiable.
:::

Three words in that key block matter.

- **Essentially all roles.** Not only the people who touch hardware. Software, simulation and analysis roles see the same controlled technical data, so the rule reaches them too.
- **Confirmed in the recruiter screen.** It is the first stage's job, before anyone spends hours on your take-home.
- **Not negotiable.** It is a legal requirement, not a preference. A strong interview cannot change it, and the hiring team cannot waive it.

That is why this is called a **[[hard gate|hard-gate]]**: a pass-or-fail check that no amount of skill elsewhere can make up for. Every other stage is graded on a scale. This one is yes or no.

::: warning Do not find out in week four
The worst version of this is a candidate who is not a US person, gets through the recruiter call without the question being clear, and spends weeks preparing. If you are not sure whether your status counts — for example, you are on a work visa or have a pending application — settle it before you apply. The ITAR module works through each status case by case.
:::

This lesson only needs the gate itself. The earlier career module, *The ITAR Gate: Eligibility Before Everything Else*, covers it in depth: why space hardware is controlled, exactly who counts as a US person, what a "deemed export" is, how the question comes up in the recruiter screen, and what the options are if you do not pass it. If any of that is new, go back to it before going further here.

## Check yourself

::: check
List the four reported stages in order, and say what the fourth one includes that the others do not.
:::

::: answer
Recruiter screen, then a take-home or timed challenge of roughly two to four hours, then technical rounds with the hiring team, then a day-long onsite of four to six rounds. The onsite includes a presentation to the team. Behavioural questions are not a separate stage: they run through all four.
:::

::: check
A friend says, "I have three rounds lined up and the process lasts five weeks, so that is only three touchpoints." What have they left out?
:::

::: answer
A touchpoint is every contact, not only the rounds they are thinking of. The recruiter screen and the take-home each count, and the onsite is a day of four to six rounds. That is how the reported total reaches five to eight touchpoints. Three is below the range, so they are probably forgetting the screen, the challenge, or both.
:::

::: check
Six touchpoints are spread evenly over five weeks. What is the average gap between them, in days?
:::

::: answer
Five weeks is $5 \times 7 = 35$ days. Six touchpoints have $6 - 1 = 5$ gaps. So the gap is $35 / 5 = 7$ days, one week. That sits inside the four to ten and a half day range from the worked example, as it should.
:::

::: check
Which stage confirms ITAR eligibility, and why does it make sense to put it there rather than at the onsite?
:::

::: answer
The recruiter screen. The status is a legal yes-or-no requirement that no performance can change, so checking it first saves the candidate and the team from spending weeks on a process that cannot end in a hire. Putting it last would waste everyone's time.
:::

::: check
A candidate is a brilliant simulation engineer on a temporary work visa. The team loves their take-home. Explain whether the team can make an exception.
:::

::: answer
No. The requirement is US person status (citizen or lawful permanent resident, in the short form), because the work is export-controlled. It applies to essentially all roles, including software and simulation, and it is not negotiable: it comes from the law, not from the team's opinion of the candidate. A temporary work visa is not US person status. The ITAR module covers the full list of what does and does not count.
:::

## Summary

| Idea | In one line |
| --- | --- |
| Reported | from candidates' accounts, not an official rulebook |
| The stages | recruiter screen, two to four hour take-home or timed challenge, technical rounds, day-long onsite of four to six rounds |
| Behavioural | runs through every stage, not a single round |
| Touchpoints | commonly five to eight over four to six weeks; it can stop at any stage |
| Gap between touchpoints | about 4 to 10.5 days on average |
| Weekly prep load | 40 h over 4 to 6 weeks is 10 to 6.7 h per week, so prepare before applying |
| ITAR gate | US person status (citizen or lawful permanent resident), export-controlled work, confirmed at the recruiter screen, not negotiable |

Next lesson starts the onsite itself: the systems C++ round, and the ten things about memory, ownership and threads to have ready before you walk in.

::: context what-reported-means Why "reported" keeps appearing
Companies rarely publish how their interviews work. What exists are many candidates' write-ups on forums and review sites, which agree on the broad shape. "Reported" is this course's honest label for that kind of fact. It tells you two things: the pattern is common enough to prepare for, and your own process may differ in the details. If a recruiter tells you something different for your team, believe the recruiter.
:::

::: context recruiter-role The recruiter is on your side of the table
A recruiter's job is to fill the role, so they want strong candidates to get through. That makes them a good person to ask practical questions: how many rounds, what the take-home looks like, whether the presentation topic is your choice. Asking is normal and expected. It also means that when a recruiter asks about your US person status, they are not being rude. They are doing the first check their job requires.
:::

::: context take-home-vs-timed Two versions of the same stage
A **take-home** is a problem you do on your own schedule and send back, often a small program that has to handle real-looking data. A **timed challenge** runs on a coding website with a clock, and usually has automatic tests. Both check the same thing: working code with nobody helping. The take-home also shows how you organize and explain a small project, so a short note on your design choices is worth writing.
:::

::: context hiring-team Who is on the other side
The **hiring team** is the group of engineers you would actually join. In the technical rounds and at the onsite, your interviewers are often your future coworkers and manager. That is why they ask about things you built and how you think, not only textbook questions: they are picturing you in their next design review.
:::

::: context touchpoint Counting contacts on a calendar
Here is one possible spread of eight touchpoints over four weeks. The onsite is drawn as a single day, even though it holds several rounds.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="60" x2="340" y2="60" stroke="#1f2a44" stroke-width="2"/>
  <g stroke="#6c7a93" stroke-width="1">
    <line x1="20" y1="52" x2="20" y2="68"/><line x1="100" y1="52" x2="100" y2="68"/>
    <line x1="180" y1="52" x2="180" y2="68"/><line x1="260" y1="52" x2="260" y2="68"/>
    <line x1="340" y1="52" x2="340" y2="68"/>
  </g>
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="20" y="82">day 0</text><text x="100" y="82">wk 1</text><text x="180" y="82">wk 2</text>
    <text x="260" y="82">wk 3</text><text x="340" y="82">wk 4</text>
  </g>
  <g fill="#1d6fd1">
    <circle cx="20" cy="60" r="6"/><circle cx="66" cy="60" r="6"/><circle cx="111" cy="60" r="6"/>
    <circle cx="157" cy="60" r="6"/><circle cx="203" cy="60" r="6"/><circle cx="249" cy="60" r="6"/>
    <circle cx="294" cy="60" r="6"/>
  </g>
  <circle cx="340" cy="60" r="8" fill="#b4232c"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="20" y="40">screen</text><text x="66" y="28">take-home</text><text x="180" y="40">technical rounds</text>
    <text x="330" y="40">onsite</text>
  </g>
  <text x="180" y="112" font-size="12" fill="#1f2a44" text-anchor="middle">8 touchpoints, 7 gaps of 4 days = 28 days</text>
</svg>
```
:::

::: context export-control What an export is here
In everyday speech, exporting means shipping goods to another country. Under these rules it also means *sharing controlled technical information* with a person who is not allowed to receive it — by email, on a whiteboard, or in a code review — even if everyone is sitting in the same US building. That is why the question is about the person's legal status, not where the office is. The career module on the ITAR gate has a whole lesson on this idea, called a deemed export.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="14" width="340" height="104" rx="8" fill="#fff" stroke="#6c7a93" stroke-width="2" stroke-dasharray="6 4"/>
  <text x="180" y="32" font-size="11" fill="#6c7a93" text-anchor="middle">one office building in the US</text>
  <rect x="30" y="50" width="100" height="44" rx="6" fill="#8fb8f0" fill-opacity="0.35" stroke="#1d6fd1" stroke-width="2"/>
  <text x="80" y="70" font-size="12" fill="#1f2a44" text-anchor="middle">controlled</text>
  <text x="80" y="85" font-size="12" fill="#1f2a44" text-anchor="middle">design data</text>
  <line x1="130" y1="72" x2="222" y2="72" stroke="#b4232c" stroke-width="2"/>
  <polygon points="230,72 219,66 219,78" fill="#b4232c"/>
  <text x="178" y="64" font-size="11" fill="#b4232c" text-anchor="middle">shown on screen</text>
  <circle cx="270" cy="62" r="10" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <line x1="270" y1="72" x2="270" y2="94" stroke="#1f2a44" stroke-width="2"/>
  <text x="270" y="110" font-size="11" fill="#1f2a44" text-anchor="middle">not a US person</text>
  <text x="178" y="90" font-size="12" font-weight="700" fill="#b4232c" text-anchor="middle">= an export</text>
</svg>
```
:::

::: context green-card Lawful permanent resident
A **lawful permanent resident** is someone the US has allowed to live and work in the country permanently. The card that proves it is called a green card. It is different from a work visa, which allows work only for a limited time and usually for one employer. For the ITAR gate, the green card must actually have been granted: an application that is still waiting does not count.
:::

::: context us-person-full The two extra groups in the full definition
The recruiter's short version, "citizen or lawful permanent resident", covers almost everyone who passes the gate. The regulation's full definition of a US person also includes people who have been granted **refugee** or **asylee** status by the US government. Lesson 2 of the ITAR career module lays out all four eligible statuses, the law behind each, and a table of the statuses that do not count, such as work visas and pending applications.
:::

::: context hard-gate A gate versus a score
Most of the interview is scored on a scale: a weak answer in one round can be balanced by a strong one in another. A hard gate is different. It sits in front of everything, and it has only two outcomes.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <rect x="14" y="50" width="70" height="40" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="49" y="74" font-size="12" fill="#1f2a44" text-anchor="middle">candidate</text>
  <line x1="84" y1="70" x2="118" y2="70" stroke="#1f2a44" stroke-width="2"/>
  <rect x="120" y="40" width="16" height="60" fill="#b4232c"/>
  <text x="128" y="116" font-size="11" fill="#b4232c" text-anchor="middle">ITAR gate</text>
  <line x1="136" y1="70" x2="180" y2="70" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="186,70 176,65 176,75" fill="#1d6fd1"/>
  <text x="160" y="62" font-size="11" fill="#1d6fd1" text-anchor="middle">yes</text>
  <rect x="190" y="30" width="156" height="80" rx="6" fill="#8fb8f0" fill-opacity="0.35" stroke="#1d6fd1" stroke-width="2"/>
  <text x="268" y="56" font-size="12" fill="#1f2a44" text-anchor="middle">scored stages</text>
  <text x="268" y="74" font-size="11" fill="#1f2a44" text-anchor="middle">take-home, technical,</text>
  <text x="268" y="90" font-size="11" fill="#1f2a44" text-anchor="middle">onsite rounds</text>
  <line x1="128" y1="40" x2="128" y2="14" stroke="#6c7a93" stroke-width="2"/>
  <text x="140" y="18" font-size="11" fill="#6c7a93">no: process ends</text>
</svg>
```
:::
