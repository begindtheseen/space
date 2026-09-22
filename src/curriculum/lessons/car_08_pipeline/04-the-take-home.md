---
id: l04-the-take-home
title: "Stage 3: the take-home exercise"
minutes: 16
covers:
  - PLACEHOLDER
---

The third stage is the only one in the pipeline that is conditional on the role rather than on you. A take-home exercise is used for **some software and firmware roles**, rather than universally, and whether it appears in your process is a property of the requisition you are running against. A candidate who never sees one has not skipped anything and is not on a lesser track.

It is worth understanding even if you do not get one, for two reasons. The first is that you will not know in advance which kind of requisition you are on unless you ask, and asking is the stage-one habit this module has already recommended. The second is that the standard a take-home is judged against — code that a stranger can read, run, and trust — is the same standard the portfolio module of this track asked you to hold your projects to. If your portfolio already meets it, a take-home is a smaller event than it sounds. If it does not, the take-home is where you find out.

## What the stage is evaluating

An interview, whatever its form, watches you work under observation and under time pressure. That is a real signal and it is not the only one that matters. A take-home evaluates something no interview can reach: what your work looks like when nobody is watching you produce it, when you had time to go back and clean it up, and when the only thing the reader receives is the artefact itself.

That framing tells you almost everything about how to approach it. The reader is not sitting next to you. Nothing you would have said out loud gets said. Every judgment they form comes from what is in the submission, which means the submission has to carry its own explanation.

::: key
The take-home is used for some software and firmware roles rather than universally. Treat it as production work: tests, a README, clear structure, and a note on what you would do with more time.
:::

## The four parts of "production work"

### Tests

Tests are not a formality bolted on to demonstrate diligence. In a GNC context they are the answer to the only question that matters about a numerical result, which is how you know it is right.

The portfolio module named the moves that work: an analytic case whose answer you can write down independently, a conservation check that should hold to some tolerance, a convergence study showing the result stops moving as you refine, a cross-comparison against an independent implementation. A test suite built from those is doing engineering, not box-ticking, and a reader can tell the difference immediately. A suite that only checks that the code runs without raising is checking the least interesting property the code has.

### A README

Write the README as though the reader has your submission, no context, and fifteen minutes. It should say what the problem was, what you assumed, how to run the thing, what the result was, how you know the result is right, and where the limits are. That is the same write-up skeleton the portfolio module used, and it works here for the same reason: it answers the questions a technical reader forms in the order they form them.

The single most valuable line in a README is usually the one that states how you verified the output. It moves the submission from "here is some code" to "here is a result, and here is my basis for believing it."

### Clear structure

A stranger should be able to find the thing they are looking for without asking you. Files named for what they contain, a build or run command that works from a clean checkout, dependencies pinned, no dead code, no commented-out experiments left in the file. None of this is stylistic preference; all of it is the difference between a reader forming an impression of your work and a reader forming an impression of your habits.

### A note on what you would do with more time

This is the part candidates leave out, and it is the cheapest of the four.

A take-home is bounded. Something will be missing from it — a coarse model where a better one exists, a test you did not write, an error case you handled crudely. If the reader finds that gap and you have not mentioned it, the gap reads as something you did not notice. If you have named it, in one or two sentences, the same gap reads as a scope decision you made deliberately and could defend.

Naming your own limitations does not weaken a submission. It is the clearest available evidence that you know what a finished version would look like, which is exactly the judgment a hiring reader is trying to make.

::: warning Do not over-scope the brief
Building far past what was asked is not a display of enthusiasm; it is a display of not reading requirements. It also produces a larger surface for a reader to find something wrong in, costs you the time you would have spent making the core clean, and, if a time box was stated, quietly ignores it. If you genuinely want to show more, a scoped core plus a "what I would do next" paragraph shows the same ambition without any of those costs.
:::

## The questions this lesson cannot answer for you

**How long to spend.** If the brief states a time box, that number is a requirement, not a suggestion, and treating it as one is itself part of what is being observed. If no time box is stated, ask the recruiter what is expected. This curriculum has no basis for telling you that a typical take-home takes any particular number of hours, and a figure invented here would be a figure you planned against.

**What language to write in.** Read the brief first: if it specifies, that settles it. Where it does not, the curriculum's tooling module established the underlying fact — production GNC and flight software is primarily C++, and Python is where analysis, tooling and test infrastructure live. For an avionics or embedded role, C++ is the safer assumption; for an analysis-focused role, Python is often fine. If you are unsure and the brief is silent, that is another question for the recruiter.

**Whether you will get one at all, who reads it, and what the bar is.** The module's own statement is that take-homes are used for some software and firmware roles rather than universally. Beyond that, whether a given requisition includes one, whether the reader is an engineer you will later meet, and what separates an acceptable submission from a strong one are not things this curriculum can state. Ask about the stage sequence at the recruiter screen and you will at least know whether the stage is in your process.

One thing is safe to assume without asking: **do not submit anything that is not yours to submit.** Code, data or documents from a previous employer do not belong in a take-home, whatever their technical merit, and export-controlled material belongs in one even less. Write the submission fresh.

::: example The same core, submitted two ways
Two candidates receive the same firmware-adjacent exercise: implement a fixed-step integrator for a simple attitude model, with a small interface for stepping it forward. Both write working code, and the numerical core of the two submissions is close to equivalent.

The first submits a single source file and a build command in the email body. It compiles. It runs. There are no tests, and no statement anywhere of what the output should be. A reader who wants to know whether the integrator is correct has to determine that themselves, from the code, by reasoning about it — which they may or may not have time to do.

The second submits a small tree: the integrator, a test file, a README of about a page, and a pinned build. The tests check three things: that a torque-free symmetric case conserves angular momentum to a stated tolerance, that the step size halving reduces the error at the expected order, and that one initial condition with a closed-form solution matches it. The README states the assumptions, the run command, those three checks and what tolerance each held to, and closes with two sentences: with more time, she would add a variable-step option and test the behaviour near the singularity of the attitude parameterisation she chose, which the current tests do not exercise.

Both candidates wrote a correct integrator. Only one of them submitted evidence that it was correct, and only one of them told the reader what was missing before the reader had to find it.
:::

::: example Over-scoping, and what it costs
A candidate is asked for a small tool that parses a telemetry file and reports a few summary statistics. The brief suggests a few hours.

He decides to make it impressive. He writes a plugin architecture so new statistics can be registered at runtime, adds a configuration file format, builds a command-line interface with subcommands, and includes a plotting mode. It takes him most of a weekend. The parser at the centre of it works, but he ran out of energy before writing tests for the edge cases in the file format — a truncated final record, a duplicated timestamp — and the README is a list of the command-line options rather than an account of the problem.

The reader now has several hundred lines of framework wrapped around an untested parser. The framework is not what was asked for, so it earns little; its existence is why the parser is untested, so it costs something real; and the one thing the brief actually specified — reading the file and reporting the numbers — is the part with the least evidence behind it. A candidate who had written the parser, tested the two malformed-input cases, and spent the last twenty minutes on a README with a "what I would add next" paragraph listing the plugin idea would have submitted something both smaller and stronger.
:::

## Check yourself

::: check
Why does this stage exist at all, given that the process already contains a technical phone screen and a full day of interviews?
:::

::: answer
Interviews observe you working under observation and under time pressure. A take-home reaches something they cannot: what your work looks like unobserved, with time to revise, when the only thing the reader receives is the artefact. That is a different signal about the same candidate, and it is the signal closest to what daily work actually produces.
:::

::: check
Name the four components of treating a take-home as production work, and say what the fourth one buys you specifically.
:::

::: answer
Tests, a README, clear structure, and a note on what you would do with more time. The fourth converts an omission into a decision: a gap the reader finds unaided reads as something you did not notice, while the same gap named in your own words reads as a scope choice you understood and could defend. It is the cheapest of the four to produce and the one candidates most often skip.
:::

::: check
A brief says "this should take about four hours" and a candidate spends fourteen, producing something considerably more elaborate. What has he actually demonstrated?
:::

::: answer
That he did not treat a stated requirement as a requirement. A time box in a brief is part of the specification, and overrunning it by a factor of several is visible in the size of what arrives. He has also traded away the time that would have made the core clean and well tested, and he has enlarged the surface on which a reader can find a defect. Enthusiasm shown this way costs more than it returns.
:::

::: check
Why is a test suite that merely checks the code runs without error a weak suite for a GNC exercise?
:::

::: answer
Because it verifies the least interesting property the code has. The question a technical reader asks about a numerical result is whether it is right, and running without raising an exception is no evidence either way. The checks that carry evidence are the ones the portfolio module named: an analytic case with an independently known answer, a conservation quantity that should hold to a tolerance, a convergence study showing the result stabilises under refinement, and cross-comparison against an independent implementation.
:::

::: check
A candidate does not know whether her requisition includes a take-home, how long it is meant to take, or which language is expected. What does this lesson tell her to do, and what does it decline to tell her?
:::

::: answer
It tells her to ask the recruiter — the stage sequence is a normal recruiter-screen question, and so are the expected effort and the language where a brief is silent. It declines to invent a typical duration, to state whether her specific requisition includes the stage, to say who reads the submission, or to state what separates an acceptable submission from a strong one. What it does give her without asking: read the brief first, and never submit material that belongs to a previous employer.
:::

## Summary

| Element | What it is |
| --- | --- |
| Applies to | Some software and firmware roles, not universally |
| What it uniquely measures | Your work unobserved, with time to revise |
| Tests | Analytic cases, conservation, convergence, cross-comparison |
| README | Problem, assumptions, how to run, result, how you know it is right, limits |
| Structure | A stranger can find and run everything without asking you |
| The closing note | What you would do with more time, in one or two sentences |
| Time box | A requirement if stated; ask if not |
| Language | Read the brief; C++ for avionics and embedded, Python for analysis work |
| Never | Material belonging to a previous employer |

The next lesson moves to the largest stage in the process, and the one that most rewards knowing its shape in advance: the full-day onsite.
