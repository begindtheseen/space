---
id: l06-rounds-on-what-you-have-built
title: "The onsite rounds on what you have already built"
minutes: 19
covers:
  - PLACEHOLDER
---

The onsite's five to seven rounds are not five to seven versions of the same interview. They divide into two kinds, and the division is useful because the two kinds reward completely different preparation.

The first kind examines work you have already done or code you can already write: a presentation on a past project, two to three coding rounds, and one to two rounds on systems and architecture. Preparation for these is accumulation — the projects exist or they do not, the C++ is fluent or it is not, and the weeks before the onsite are for consolidating and rehearsing rather than for learning something new. The second kind, covered in the next lesson, examines how you think in front of a problem you have never seen, where preparation is method rather than material.

This lesson takes the first kind. It is a map of what each round is and what it is looking at, not a training programme for any of them — the tenth, eleventh and twelfth modules of this track are the training programmes, and each goes considerably deeper than this. What you should leave with is a clear enough picture of each round to allocate your preparation hours sensibly and to walk into each one knowing what it is for.

## The full composition

Here is the whole day's technical content in one statement, because it is worth holding as a single picture before it gets broken apart.

::: key
The onsite comprises a past-project presentation to a panel; 2 to 3 coding rounds at medium to hard difficulty, C++ for avionics and embedded; 1 to 2 systems and architecture rounds covering real-time and embedded constraints; 1 or more domain-knowledge rounds; plus abstract problem solving, physics puzzles and Fermi estimation.
:::

Notice the balance. Coding is at most three of the rounds; the presentation is one; systems is one or two; domain is one or more; and the thinking-on-your-feet material is distributed across the rest. A candidate who spends every preparation hour on coding problems has prepared thoroughly for less than half the day.

## The past-project presentation

You submit a set of candidate topics — roughly five — and **the panel chooses which one you present**. The talk itself runs ten to twenty minutes to a panel of five to ten engineers, and it is followed by extensive questioning.

The choice sitting with the panel rather than with you is the structural fact that determines how to prepare, and it is worth stating its consequence plainly: **every one of the five topics has to be one you can defend in depth**, because the one you are least comfortable with is a topic the panel can select. There is no version of this where you put four strong projects and one padding entry on the list and hope. Five topics you can genuinely defend is a smaller, better list than seven that include two you are hoping nobody picks.

The four things being evaluated are technical depth, communication clarity, simplicity of the design approach, and your ability to defend engineering decisions under direct questioning. That last axis is why the questioning is extensive: the panel is not confirming that the project happened. They are finding out whether the decisions inside it were reasoned or arbitrary, which is exactly the question about you that predicts what you would be like to work with on a design review.

A word about the ten-to-twenty-minute length. That is short for a real engineering project, and the instinct to cover everything will destroy the talk. The material you leave out is not lost — it is what the extensive Q and A is for, and a talk that ends cleanly at fifteen minutes with a panel full of questions has done its job better than one that runs twenty-five and gets cut off in the results section. The presentation module of this track covers slide design, structure and rehearsal properly; the portfolio module built projects intended to survive this round from the beginning.

::: warning Do not list a project you cannot defend in depth
The selection is not yours. A topic included to round out the list, or because it sounds impressive, or because it is the only one from a professional job rather than from personal work, is a topic that can be chosen — and the round where you find out you cannot defend it is a round in front of five to ten engineers with extensive questioning ahead of you. Cut the list to what you can defend.
:::

## The coding rounds

Two to three rounds, at medium to hard difficulty. For avionics and embedded roles, expect **C++**.

That language expectation is not a stylistic preference of the interviewers. This curriculum's tooling module established the underlying fact: production GNC and flight software is primarily C++, GNC engineers write flight code themselves rather than handing prototypes to a separate software team, and Python lives in analysis, tooling, pipelines and test infrastructure. A coding round in C++ for an embedded role is testing the language you would actually write in. For an analysis-focused role, Python may be acceptable — but if you are unsure which kind of role you are interviewing for, C++ is the safer assumption, because a candidate fluent in C++ can work in a Python round and the reverse is not reliably true.

"Medium to hard" is a useful calibration precisely because it is not "hard". These are not research problems. They are the kind of problem that has a clean solution you are expected to find, implement correctly, and reason about — which means the failure modes are rarely that the problem was impossible and usually that something in the process went wrong: a misunderstood requirement, an off-by-one that was never tested, a solution written before the approach was stated.

The discipline that addresses those failure modes is a fixed routine, and it is the same one in every round: clarify the problem before writing anything; state your approach and its complexity out loud; then write it; then test the edges deliberately rather than hoping. The first-principles module of this track drills that routine and the problems it applies to. What matters at map level is that it is a routine — something you execute the same way every time — rather than a set of tips to remember under pressure.

## The systems and architecture rounds

One to two rounds covering real-time considerations, embedded constraints, redundancy, fault management and sensor fusion architecture.

This is the round where the tooling module of this track becomes an interview subject rather than background. The material is: why a flight control loop needs determinism and bounded execution time rather than merely good average performance; why fixed-step integration is the norm in that loop; why dynamic allocation, unbounded loops and exceptions are avoided in the control path; how redundancy and voting are arranged and what they do and do not protect against; what fault management has to decide and on what timescale; and how a sensor fusion architecture is laid out when the sensors disagree.

A systems round is different in character from a coding round, and candidates who are strong at the second sometimes struggle with the first for a specific reason: there is usually no single correct answer, and the evaluation is of your reasoning about trade-offs rather than of your arrival at a destination. The move that works is to make the trade-off explicit — to say what you are buying and what you are paying for it — rather than to assert a design and defend it. "I would use a fixed-step integrator here because I need a bounded worst-case execution time, and I am accepting a smaller step than accuracy alone would require in order to get it" is an answer with engineering in it. "I would use a fixed-step integrator" is a preference.

## What this lesson cannot tell you

Which of these rounds appear in your day, in what order, and how many of each — beyond the stated ranges — is a property of your requisition and your panel, not something a general account can fix. Whether coding happens on a laptop, a shared editor or a whiteboard varies, and it is a reasonable thing to ask the coordinator in advance, because it changes how you should practise. Whether a written rubric sits behind any of these rounds, and what it contains, is internal and not something this curriculum can describe.

What is safe: preparing against the ranges as stated. Three coding rounds' worth of practice serves a day with two; a presentation defensible from any of five topics serves a panel that chooses any of them. Preparing against the upper end of each range is the version of this that is robust to not knowing.

::: example The topic that got chosen
A candidate submits five presentation topics. Four are personal projects she has built and verified over two years: a 6-DOF launch vehicle simulation with a dispersion campaign, a powered-descent guidance study with a landing-accuracy Monte Carlo, an attitude filter with consistency checks, and a least-squares orbit fit against real data. The fifth is a piece of work from her current job at a test-equipment company — a data acquisition rework she contributed to but did not lead, included because she felt the list needed something professional on it.

The panel chooses the fifth.

It is a reasonable choice from where they sit: it is the only item with an industrial context, and it is the one they cannot read about on her portfolio site. She presents it competently. Then the questions start, and the questions are the round. Why was the sampling architecture chosen that way? What was the alternative and why was it rejected? What was her specific contribution to that decision? How was the reworked system validated against the one it replaced?

She does not know several of these, because she was not in those conversations. Each honest "that decision was made before I joined the project" is individually fine and collectively fatal to the round, because the axis being evaluated is her ability to defend engineering decisions under direct questioning, and she has spent twenty minutes on a project whose decisions were not hers.

The cost was incurred at submission, not on the day. Four topics she owned completely would have been a stronger list than five of which one was borrowed.
:::

::: example Two coding rounds, same problem, different process
Two candidates get the same medium-difficulty problem in a C++ round: given a stream of timestamped sensor samples that may arrive slightly out of order, produce a rolling statistic over a fixed time window.

The first candidate starts typing within thirty seconds. She writes a clean windowed accumulator over a deque. It is good code. Twenty-five minutes in, the interviewer asks what happens when a sample arrives with a timestamp earlier than one already in the window — which the problem statement had mentioned and which her design does not handle. Reworking it at that point means changing the data structure, and she finishes the round with a half-converted implementation and no tests run.

The second candidate spends the first two minutes asking: how far out of order can samples be, is there a bound on that; are duplicate timestamps possible; is the window defined by time or by count; what should the statistic report when the window is empty. The bounded out-of-order guarantee is the answer that matters, and having it, she says her approach out loud before writing: a small reorder buffer in front of a windowed accumulator, with the buffer sized by the stated bound, giving amortised constant work per sample. Then she writes it. With five minutes left she deliberately walks three cases — an empty window, two samples with identical timestamps, and one arriving at exactly the out-of-order bound — and fixes a comparison that was strict where it should not have been.

Neither candidate is a better programmer than the other. The second one asked the question that determined the data structure before choosing the data structure, said what she was going to do before doing it, and tested edges on purpose. That is the whole difference, and it is a routine rather than an insight.
:::

## Check yourself

::: check
State the onsite's technical composition in full, with the counts.
:::

::: answer
A past-project presentation to a panel; two to three coding rounds at medium to hard difficulty, in C++ for avionics and embedded roles; one to two systems and architecture rounds covering real-time and embedded constraints; one or more domain-knowledge rounds; plus abstract problem solving, physics puzzles and Fermi estimation.
:::

::: check
Why does the panel choosing the presentation topic change how you build the list of five?
:::

::: answer
Because the topic you are least able to defend is a topic that can be selected. That removes any strategy based on including weaker entries to fill the list, and it means the list's quality is set by its weakest member rather than its strongest. A shorter list of topics you own completely is stronger than a longer one containing something borrowed or thin, since the round's evaluation includes defending engineering decisions under direct questioning — and decisions you did not make cannot be defended.
:::

::: check
A candidate is unsure whether her target role is analysis-focused or embedded, and has to choose one language to practise in. Which, and why is the choice asymmetric?
:::

::: answer
C++. Production GNC and flight software is primarily C++, and coding rounds for avionics and embedded roles are reported in C++ at medium to hard difficulty, while Python is where analysis, tooling and test infrastructure live. The asymmetry is that a candidate fluent in C++ can handle a round that permits Python, whereas a candidate who has practised only in Python is stuck if C++ is expected. The cost of preparing in the wrong direction is much higher one way than the other.
:::

::: check
Why do strong coders sometimes do worse in a systems and architecture round than in a coding round?
:::

::: answer
Because the round has no single correct answer to arrive at. It evaluates reasoning about trade-offs — determinism against flexibility, redundancy against complexity, fusion architecture against sensor disagreement — rather than the production of a correct artefact. A candidate trained to converge on the right answer may assert a design and defend it, when what earns credit is making the trade-off explicit: naming what the choice buys and what it costs. The material itself is real-time and embedded constraints, redundancy, fault management and sensor fusion architecture.
:::

::: check
"Medium to hard" is a lower difficulty description than many candidates expect for this process. What does that description imply about where coding rounds are actually lost?
:::

::: answer
It implies the problems have clean solutions the candidate is expected to find, so failures are rarely about the problem being beyond reach. They come from process: a requirement misunderstood because no clarifying question was asked, an approach never stated before implementation began, an edge case never tested, a data structure chosen before the constraint that determines it was known. That is why the remedy is a fixed routine — clarify, state approach and complexity, write, test the edges — rather than harder practice problems.
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

The next lesson takes the other kind of round: domain knowledge, abstract problem solving, physics puzzles and Fermi estimation — where the question is not what you have built but how you think in front of something unfamiliar.
