---
id: l06-rounds-on-what-you-have-built
title: "The onsite rounds on what you have already built"
minutes: 21
covers:
  - "onsite composition: past-project presentation, 2 to 3 coding rounds, 1 to 2 systems and architecture rounds, 1+ domain-knowledge round, abstract problem solving, physics puzzles and Fermi estimation"
---

Think about a music audition. Usually there are two parts. First you play a piece you chose and practiced for months. Then the judges put a sheet of music you have never seen in front of you and ask you to play it on the spot — that is called **sight-reading**. The first part shows what you have built up. The second shows how you handle something new. You prepare for them in completely different ways: the first by polishing, the second by building habits.

The onsite's five to seven rounds split the same way. They are not five to seven copies of one interview. They fall into two kinds, and the split matters because each kind rewards different preparation.

The **first kind** looks at work you have already done or code you can already write: a presentation on a past project, two to three coding rounds, and one to two rounds on systems and architecture. Preparing for these is *accumulation*. The projects exist or they do not. Your C++ is fluent or it is not. The weeks before the onsite are for consolidating and rehearsing, not for learning something brand new. The **second kind**, covered in the next lesson, looks at how you think in front of a problem you have never seen. There, preparation is method rather than material.

This lesson takes the first kind. It is a map of what each round is and what it is looking at — not a training program for any of them. Modules ten, eleven and twelve of this career track are the training programs, and each goes much deeper. What you should leave with is a clear enough picture of each round to split your preparation hours sensibly, and to walk into each one knowing what it is for.

## The full composition

Here is the whole day's technical content in one statement. It is worth holding as a single picture before we break it apart.

::: key
The onsite comprises a past-project presentation to a panel; 2 to 3 coding rounds at medium to hard difficulty, C++ for avionics and embedded; 1 to 2 systems and architecture rounds covering real-time and embedded constraints; 1 or more domain-knowledge rounds; plus abstract problem solving, physics puzzles and Fermi estimation.
:::

A few words in there need unpacking:

- A **panel** is a group of interviewers sitting together, rather than one person.
- **Avionics** are the electronics that fly the vehicle; **embedded** software is code that runs inside a device rather than on an ordinary computer.
- A **domain-knowledge round** tests the subject itself — for a GNC (guidance, navigation and control) role, things like control, estimation and orbits.
- **Fermi estimation** is making a sensible rough estimate of a number you cannot look up. The next lesson covers it, along with the puzzles.

Now notice the **[[balance|composition-picture]]**. Coding is at most three of the rounds. The presentation is one. Systems is one or two. Domain is one or more. The thinking-on-your-feet material is spread across the rest. So a candidate who spends every preparation hour on coding problems has prepared thoroughly for less than half the day.

## The past-project presentation

Here is how it works. You send in a set of possible topics — roughly five. **The panel chooses which one you present.** The talk runs 10 to 20 minutes, to a panel of 5 to 10 engineers, and then comes extensive questioning.

The fact that the panel chooses, not you, decides how you should prepare. Its consequence is worth saying plainly: **every one of your five topics has to be one you can defend in depth**, because the one you are least comfortable with is one the panel can pick.

Think of it like a chain: it is only as strong as its weakest link. There is no version of this where you list four strong projects plus one filler and hope. Five topics you can truly defend is a better list than seven that include two you are hoping nobody picks.

The panel judges four things:

1. **technical depth** — how far down you really understand the work;
2. **communication clarity** — whether they can follow you;
3. **simplicity of the design approach** — whether you avoided needless complication;
4. **defending engineering decisions under direct questioning.**

That last one is why the questioning goes on so long. The panel is not checking that the project happened. They are finding out whether the decisions inside it were reasoned or random. That tells them what you would be like to work with in a real design review.

A word on the length. Ten to twenty minutes is short for a real engineering project, and the urge to cover everything will wreck the talk. What you leave out is not lost — that is what the long **Q and A** (question-and-answer session) is for. A talk that ends cleanly at fifteen minutes, with a panel full of questions, has done its job better than one that runs to twenty-five and gets cut off in the results. The presentation module (module ten) covers slides, structure and rehearsal properly. The portfolio module built projects meant to survive this round from the start.

::: warning Do not list a project you cannot defend in depth
The choice is not yours. A topic added to fill out the list, or because it sounds impressive, or because it is your only one from a paid job rather than personal work, is a topic that can be chosen. And you find out you cannot defend it in a room with five to ten engineers and a long stretch of questions ahead of you. Cut the list down to what you can defend.
:::

## The coding rounds

Two to three rounds, at medium to hard difficulty. For avionics and embedded roles, expect **[[C++|cpp-in-flight]]** (said "C plus plus").

That is not the interviewers' personal taste. The tooling module set out the underlying fact: production GNC and flight software is mostly C++. GNC engineers write flight code themselves rather than handing a rough version to a separate software team. Python lives in analysis, tooling, data pipelines and test infrastructure. So a C++ round for an embedded role tests the language you would actually write in.

For an analysis-focused role, Python may be allowed. But if you are unsure which kind of role you are interviewing for, C++ is the safer bet, because the risk is lopsided:

- A candidate fluent in C++ can cope in a round that allows Python.
- A candidate who has practiced only in Python is stuck if C++ is expected.

"Medium to hard" is a helpful label precisely because it is not "hard". These are not research problems. Each has a clean solution you are expected to find, write correctly, and reason about. So rounds are rarely lost because the problem was impossible. They are usually lost because something in the *process* went wrong:

- a requirement misunderstood;
- an **[[off-by-one|off-by-one]]** mistake — a loop that runs one time too many or too few — that was never tested;
- code written before the plan was said out loud.

The habit that prevents those is a fixed routine, the same in every round:

1. **Clarify** the problem before writing anything.
2. **State your approach** and its **[[complexity|big-o]]** out loud — how its running time grows as the input grows.
3. **Write it.**
4. **Test the edges** on purpose, rather than hoping.

Module twelve, on first principles at the whiteboard, drills this routine and the problems it applies to. What matters on this map is that it *is* a routine — something you do the same way every time — not a list of tips to remember under pressure.

::: note Two books this module points at for these rounds
McDowell's *Cracking the Coding Interview* is worth reading as much for its chapters on how to conduct yourself in a round as for its problems — the routine above is the thing to take from it. Aziz, Lee and Prakash's *Elements of Programming Interviews in C++* sits at the right difficulty and in the right language for avionics and embedded work, which makes it the better source of practice problems for this particular day.
:::

## The systems and architecture rounds

One to two rounds covering **real-time** considerations (software that must finish its work before a fixed deadline, every time), embedded constraints, redundancy, fault management, and sensor fusion architecture.

This is where the tooling module stops being background and becomes the interview. The material includes:

- why a flight control loop needs **determinism** — doing the same thing in the same time, every time — and a **[[bounded execution time|deadline-picture]]**, not merely good average speed;
- why fixed-step integration (moving the simulation forward in equal time steps) is the norm in that loop;
- why **[[dynamic memory allocation|dynamic-allocation]]**, loops with no fixed limit, and exceptions are kept out of the control path;
- how **[[redundancy and voting|redundancy-voting]]** are arranged, and what they do and do not protect against;
- what **fault management** — the software that notices something has broken and decides what to do — has to decide, and how fast;
- how a **[[sensor fusion|sensor-fusion]]** architecture is laid out when the sensors disagree.

A systems round feels different from a coding round, and some strong coders struggle with it for a specific reason. There is usually no single right answer. You are judged on how you reason about **trade-offs** — what each choice gains and what it costs — not on reaching a destination.

The move that works is to make the trade-off explicit. Compare two answers:

- "I would use a fixed-step integrator here, because I need a bounded worst-case execution time, and I am accepting a smaller step than accuracy alone would need in order to get it." That answer has engineering in it.
- "I would use a fixed-step integrator." That is a preference.

## What this lesson cannot tell you

Some things depend on your particular opening and panel, and a general account cannot fix them:

- which of these rounds appear in your day, in what order, and how many of each, beyond the stated ranges;
- whether coding happens on a laptop, a shared online editor or a whiteboard — worth asking the coordinator in advance, because it changes how you should practice;
- whether a written scoring guide sits behind any round, and what it says — that is internal.

What *is* safe: prepare against the ranges as stated, aiming at the top of each. Three coding rounds' worth of practice covers a day with two. A presentation defensible from any of five topics covers a panel that picks any of them. Preparing for the upper end of every range is the version that holds up when you do not know the details.

::: example The topic that got chosen
A candidate submits five presentation topics. Four are personal projects she built and checked over two years:

1. a **[[6-DOF|six-dof]]** launch vehicle simulation with a dispersion campaign (thousands of runs with small random changes);
2. a powered-descent guidance study (steering a rocket down to a precise landing) with a **[[Monte Carlo|monte-carlo]]** study of landing accuracy;
3. an attitude filter (software that estimates which way a spacecraft points) with consistency checks;
4. a least-squares orbit fit (finding the orbit that best matches real tracking measurements) against real data.

The fifth is work from her current job at a test-equipment company: a rework of a data-collection system that she contributed to but did not lead. She included it because she felt the list needed something professional.

**The panel chooses the fifth.**

From where they sit, it is a reasonable pick. It is the only item from industry, and the only one they cannot read about on her portfolio site. She presents it competently. Then the questions start — and the questions *are* the round:

- Why was the sampling design chosen that way?
- What was the alternative, and why was it rejected?
- What exactly was her part in that decision?
- How was the new system checked against the one it replaced?

She cannot answer several of these, because she was not in those conversations. Each honest "that decision was made before I joined" is fine on its own. Together they sink the round, because one of the four things being judged is defending engineering decisions under questioning — and she has spent twenty minutes on a project whose decisions were not hers.

Sanity check on where it went wrong: not on the day, but when she wrote the list. Four topics she owned completely would have been stronger than five with one borrowed.
:::

::: example Two coding rounds, same problem, different process
Two candidates get the same medium-difficulty C++ problem. A stream of sensor samples arrives, each stamped with its time, but some may arrive slightly out of order. Produce a rolling statistic — say, the average — over a fixed time window.

**The first candidate** starts typing within thirty seconds. She writes a clean windowed running total over a **[[deque|deque-word]]**. It is good code. Twenty-five minutes in, the interviewer asks: what happens when a sample arrives with a timestamp earlier than one already in the window? The problem statement had mentioned it, and her design does not handle it. Fixing it now means changing the data structure. She finishes with a half-converted program and no tests run.

**The second candidate** spends the first two minutes asking questions:

- How far out of order can samples be — is there a limit?
- Can two samples have the same timestamp?
- Is the window set by time or by number of samples?
- What should the statistic report when the window is empty?

The answer that matters is the first: yes, there is a known limit on how late a sample can be. With that, she says her plan out loud before writing: a small reorder buffer in front of the windowed total, sized by that stated limit. Because the buffer never grows past the limit, each new sample costs a bounded amount of work, no matter how long the stream runs. Then she writes it. With five minutes left, she deliberately walks three cases: an empty window, two samples with identical timestamps, and one arriving exactly at the lateness limit. That last case catches a comparison written as "less than" that should have been "less than or equal to", and she fixes it.

Neither candidate is the better programmer. The second asked the question that decided the data structure *before* choosing the data structure, said what she would do before doing it, and tested the edges on purpose. That is the whole difference, and it is a routine, not a flash of insight.
:::

## Check yourself

::: check
State the onsite's technical composition in full, with the counts.
:::

::: answer
A past-project presentation to a panel; two to three coding rounds at medium to hard difficulty, in C++ for avionics and embedded roles; one to two systems and architecture rounds covering real-time and embedded constraints; one or more domain-knowledge rounds; plus abstract problem solving, physics puzzles and Fermi estimation.
:::

::: check
Why does the panel choosing the presentation topic change how you build your list of five?
:::

::: answer
Because the topic you are least able to defend is a topic that can be picked. That rules out any plan that pads the list with weaker entries, and it means the list is only as strong as its weakest member, not its strongest. A shorter list of topics you own completely beats a longer one with something borrowed or thin, because the round judges how you defend engineering decisions under direct questioning — and you cannot defend decisions you did not make.
:::

::: check
A candidate is unsure whether her target role is analysis-focused or embedded, and has to pick one language to practice in. Which one, and why is the choice lopsided?
:::

::: answer
C++. Production GNC and flight software is mostly C++, and coding rounds for avionics and embedded roles are reported in C++ at medium to hard difficulty, while Python is where analysis, tooling and test infrastructure live. The choice is lopsided because a candidate fluent in C++ can handle a round that allows Python, but a candidate who practiced only in Python is stuck if C++ is expected. Guessing wrong costs far more one way than the other.
:::

::: check
Why do strong coders sometimes do worse in a systems and architecture round than in a coding round?
:::

::: answer
Because the round has no single correct answer to reach. It judges reasoning about trade-offs — determinism against flexibility, redundancy against complexity, how the fusion design copes when sensors disagree — rather than producing one correct piece of code. A candidate trained to converge on "the answer" may state a design and defend it, when what earns credit is making the trade-off explicit: saying what the choice buys and what it costs. The material itself is real-time and embedded constraints, redundancy, fault management and sensor fusion architecture.
:::

::: check
"Medium to hard" is a lower difficulty label than many candidates expect for this process. What does it tell you about where coding rounds are actually lost?
:::

::: answer
It says the problems have clean solutions you are expected to find, so rounds are rarely lost because the problem was out of reach. They are lost in the process: a requirement misunderstood because no clarifying question was asked, a plan never stated before coding began, an edge case never tested, a data structure chosen before the constraint that decides it was known. That is why the fix is a fixed routine — clarify, state the approach and complexity, write it, test the edges — rather than ever-harder practice problems.
:::

## Summary

| Round | Count | What it examines |
| --- | --- | --- |
| Past-project presentation | 1 | Technical depth, communication clarity, simplicity of approach, defending decisions under questioning |
| Coding | 2 to 3 | Medium to hard problems; C++ for avionics and embedded |
| Systems and architecture | 1 to 2 | Real-time, embedded constraints, redundancy, fault management, sensor fusion architecture |
| Presentation format | — | Submit roughly five topics, the panel chooses one; 10 to 20 minutes to 5 to 10 engineers; extensive Q and A |
| Coding routine | — | Clarify, state approach and complexity, write, test the edges |
| Systems habit | — | Make the trade-off explicit: what it buys and what it costs |

The next lesson takes the other kind of round — domain knowledge, abstract problem solving, physics puzzles and Fermi estimation — where the question is not what you have built but how you think in front of something unfamiliar.

::: context composition-picture The day's rounds, by count
Each bar shows how many rounds of that kind the stated shape allows: dark blue for the minimum, light blue for the extra the top of the range adds. Domain is "1 or more", drawn here up to 2. Coding is the biggest single block, but even at its top it is only three rounds of a five-to-seven-round day.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g font-size="11" fill="#1f2a44">
    <text x="8" y="40">Presentation</text>
    <text x="8" y="72">Coding</text>
    <text x="8" y="104">Systems</text>
    <text x="8" y="136">Domain</text>
  </g>
  <rect x="100" y="28" width="60" height="18" fill="#1d6fd1"/>
  <rect x="100" y="60" width="120" height="18" fill="#1d6fd1"/>
  <rect x="220" y="60" width="60" height="18" fill="#8fb8f0"/>
  <rect x="100" y="92" width="60" height="18" fill="#1d6fd1"/>
  <rect x="160" y="92" width="60" height="18" fill="#8fb8f0"/>
  <rect x="100" y="124" width="60" height="18" fill="#1d6fd1"/>
  <rect x="160" y="124" width="60" height="18" fill="#8fb8f0" stroke="#1d6fd1" stroke-dasharray="4 3"/>
  <g font-size="11" fill="#1f2a44">
    <text x="168" y="41">1</text>
    <text x="288" y="73">2 to 3</text>
    <text x="228" y="105">1 to 2</text>
    <text x="228" y="137">1 or more</text>
  </g>
  <line x1="100" y1="152" x2="340" y2="152" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="100" y="166">0</text><text x="160" y="166">1</text><text x="220" y="166">2</text><text x="280" y="166">3</text><text x="340" y="166">4</text>
  </g>
</svg>
```
:::

::: context cpp-in-flight Why flight code tends to be C++
C++ lets a programmer control exactly what the computer does — how memory is used and roughly how long each operation takes — while still offering tools for organizing large programs. Flight software needs both: it runs on modest onboard computers and must meet hard deadlines, and it is also large and long-lived. Python is easier to write but runs slower and hides those details, which is why it fits analysis and testing better. The tooling module of this track covered this split in depth.
:::

::: context off-by-one The fencepost problem
A fence 5 meters long with a post every meter needs 6 posts, not 5 — one at each end. Mixing up "sections" and "posts" is the classic **off-by-one** error, and code is full of the same trap: counting from 0 or from 1, stopping at "less than" or "less than or equal to". The bug often hides until an edge case hits it, which is why testing the edges on purpose is part of the routine.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="45" x2="320" y2="45" stroke="#6c7a93" stroke-width="3"/>
  <line x1="40" y1="60" x2="320" y2="60" stroke="#6c7a93" stroke-width="3"/>
  <g fill="#1d6fd1">
    <rect x="36" y="30" width="8" height="45"/><rect x="92" y="30" width="8" height="45"/>
    <rect x="148" y="30" width="8" height="45"/><rect x="204" y="30" width="8" height="45"/>
    <rect x="260" y="30" width="8" height="45"/><rect x="316" y="30" width="8" height="45"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="68" y="22">1 m</text><text x="124" y="22">1 m</text><text x="180" y="22">1 m</text>
    <text x="236" y="22">1 m</text><text x="292" y="22">1 m</text>
  </g>
  <text x="180" y="98" font-size="12" fill="#b4232c" text-anchor="middle">5 sections, 6 posts</text>
</svg>
```
:::

::: context big-o How the work grows
Engineers describe an algorithm's **complexity** with **big-O notation**, read "big oh". $O(n)$, said "order n", means the work grows in step with the input: twice the samples, about twice the time. $O(n^2)$ means twice the input gives about four times the work. $O(1)$ means the work per step stays the same however big things get. Saying "this is $O(n)$ time and $O(k)$ memory" before you code shows the interviewer you know what your plan costs — and lets them flag a problem before you have written it.
:::

::: context deadline-picture Fast on average is not enough
A control loop running at 100 Hz (100 times a second) gets $1 \div 100 = 0.01$ seconds — 10 milliseconds — per cycle. Every cycle, the work must finish inside that slot. A loop that is usually quick but occasionally slow will miss a deadline sooner or later, and a missed deadline in flight means stale commands to the engines or fins. So engineers care about the **worst-case** time, not the average. Below, four cycles fit; the fifth overruns.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="20" y1="30" x2="20" y2="80"/><line x1="84" y1="30" x2="84" y2="80"/>
    <line x1="148" y1="30" x2="148" y2="80"/><line x1="212" y1="30" x2="212" y2="80"/>
    <line x1="276" y1="30" x2="276" y2="80"/><line x1="340" y1="30" x2="340" y2="80"/>
  </g>
  <rect x="22" y="45" width="36" height="20" fill="#1d6fd1"/>
  <rect x="86" y="45" width="30" height="20" fill="#1d6fd1"/>
  <rect x="150" y="45" width="40" height="20" fill="#1d6fd1"/>
  <rect x="214" y="45" width="34" height="20" fill="#1d6fd1"/>
  <rect x="278" y="45" width="62" height="20" fill="#b4232c"/>
  <rect x="340" y="45" width="14" height="20" fill="#b4232c" opacity="0.6"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="52" y="22">10 ms</text><text x="116" y="22">10 ms</text><text x="180" y="22">10 ms</text>
    <text x="244" y="22">10 ms</text><text x="308" y="22">10 ms</text>
  </g>
  <text x="180" y="102" font-size="12" fill="#b4232c" text-anchor="middle">the last cycle misses its deadline</text>
</svg>
```
:::

::: context dynamic-allocation Asking for memory mid-flight
**Dynamic memory allocation** means a program asks the operating system for more memory while it runs, whenever it needs it. That is convenient, but how long the request takes is hard to predict, it can fail if memory runs short, and over time it can leave memory chopped into unusable scraps. None of that is acceptable in a loop with a 10-millisecond deadline. So flight code usually reserves all the memory it will ever need at startup, then reuses it. **Exceptions** — a way for code to jump out when something goes wrong — are avoided in the control path for a similar reason: their timing is hard to bound.
:::

::: context redundancy-voting Three computers, two votes
**Redundancy** means carrying spares: two or three computers or sensors doing the same job. With three, the system can **vote** — if one disagrees with the other two, it is outvoted and ignored. That protects against one unit failing on its own. It does not protect against a **common-mode** failure, where all three fail the same way at once — for example, the same software bug running on all three computers. That limit is exactly the kind of thing a systems round wants you to say out loud.
:::

::: context sensor-fusion Many imperfect sensors, one best guess
No sensor is perfect. A gyroscope measures turning smoothly but slowly drifts. A star tracker gives a very accurate direction but only a few times a second and can be blinded by the Sun. GPS gives position but can drop out. **Sensor fusion** combines them, leaning on each where it is strong, into one estimate better than any alone — usually with a Kalman filter, which you build in the estimation part of this course. The architecture question is how to arrange it, and what to trust when two sensors flatly disagree.
:::

::: context six-dof Six ways to move
**DOF** stands for **degrees of freedom** — independent ways something can move. A rigid body in space has six: three for sliding (forward–back, left–right, up–down) and three for turning (roll, pitch and yaw). A **6-DOF** simulation tracks all six at once, so it can show a vehicle both traveling and rotating, and how each affects the other. That makes it the standard tool for studying a rocket's flight, and a classic portfolio project.
:::

::: context monte-carlo Answers from thousands of dice rolls
A **Monte Carlo** study runs the same simulation thousands of times, each time with the uncertain inputs — wind, engine thrust, sensor errors — nudged randomly within their expected ranges. The spread of results shows how the design behaves across everything it might meet, for example how far from the target 99% of landings end up. The name is a nod to the famous casino in Monaco, because the method runs on randomness, like a roulette wheel.
:::

::: context deque-word A line you can join at either end
A **deque**, said "deck", is short for **double-ended queue**: a list where you can add or remove items at the front or the back quickly. For a rolling window it fits well — new samples join at the back, and samples too old for the window leave from the front. It works perfectly while samples arrive in order. The trouble in the example is that a late sample belongs somewhere in the middle, and a deque is not built for that.
:::
