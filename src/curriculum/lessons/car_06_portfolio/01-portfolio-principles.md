---
id: l01-portfolio-principles
title: "Portfolio principles: few, deep, and defensible"
minutes: 21
covers:
  - "portfolio principles: few, deep, documented, defensible, reproducible"
  - "what not to build: tutorial follow-alongs, notebooks without validation, thirty shallow repositories"
---

Without a degree behind you, the portfolio is not supporting evidence for your candidacy — it is the candidacy. A transcript tells a hiring panel that someone else certified your competence over four years of coursework they trust the shape of. You do not have that. What you have instead is a small number of things you built, and the only question that matters is whether those things hold up once a competent engineer starts asking about them. Most self-taught portfolios do not fail because the work is bad. They fail because the work was built to be shown, and the interview format does not show work — it interrogates it.

That is the whole idea this module is organized around, stated plainly in its title: a portfolio that survives questioning. Not a portfolio that looks impressive in a thirty-second scroll through a GitHub profile, and not one that produces a smooth demo video. One that keeps giving correct, specific answers after the fifth follow-up question from someone who has debugged the exact class of problem you are describing and knows precisely where it usually breaks. This lesson sets the standard the rest of the module measures every project against: five words that describe what a portfolio should be, a five-part test for whether any single project passes, and the specific things not to build because they cannot pass that test no matter how much time goes into them.

The projects that come later in this module — a 6-DOF simulation, a powered-descent guidance solver, an attitude-estimation filter, an orbit-determination fit, a momentum-management study — are chosen because they are technically substantial and because this curriculum already teaches the material behind each of them. But choosing the right project is only half the problem. The other half, and the one most self-taught engineers get wrong first, is building and documenting it so it survives the conversation that follows. That is what this lesson teaches, and every lesson after it either builds one of the five anchor projects to this standard or covers one part of getting it there.

## Few and deep: what the interview format actually rewards

A portfolio review for a GNC role is rarely a quick tour of everything you have built. It is closer to a thesis defence compressed into fifteen or twenty minutes on a single project: you present it, and then a panel spends most of the remaining time asking about the parts you did not choose to present — the alternative you rejected, the case that broke first, the number you cannot immediately produce. That format has a direct consequence for how you should spend your time. A project you can defend for an hour, answering questions from five different angles without running out of real content, is worth more than five projects you can each describe for two minutes, because the two-minute version is exactly what gets tested past its depth in minute three.

This is why "few" and "deep" are the first two words rather than an afterthought. They are not a statement about taste or minimalism; they describe the one property that the interview format actually measures, which is how far your understanding extends past the point where the description stops. A project built with real depth has that property because building it forced you to make decisions — this integrator and not that one, this measurement model and not a simpler one, this stopping criterion and not an arbitrary iteration count — and each decision is a question you have already, in effect, answered once, while building it. A project assembled quickly to fill a portfolio slot was never forced to make those decisions in the first place, so there is nothing underneath the description to ask about.

The practical implication is one of the harder ones to act on honestly: three projects, chosen so that each demonstrates something different, and each built to a standard where you could talk about nothing else for an hour, is a stronger portfolio than ten projects at half that standard — even though the ten-project version covers more topics, uses more tools, and looks more prolific in a repository listing. Depth is not visible in a listing. It becomes visible exactly when someone starts asking the second question, which is precisely the moment a portfolio built for breadth runs out of road.

::: key
Few and deep exist because of the interview format, not as a style preference: a project talk is followed by extended questioning on that one project, so what gets measured is how far your understanding extends past the point where your description stops — and that is exactly what a project built quickly, to fill a slot, does not have.
:::

## Defensible: the five things a project needs

"Defensible" is the word that does the most work in this module, and it is worth being precise about what it means rather than treating it as a synonym for "good." A defensible project is one where five specific things exist, in writing, and can be pointed at when asked about. Their absence, not the quality of the underlying code, is what turns a strong piece of engineering into something that collapses under a second question.

**A stated requirement it was built against.** Every real engineering project starts from a requirement — land within some error budget, estimate attitude to some accuracy, converge within some time bound — and the requirement is what turns a number into an engineering result rather than an arbitrary fact. "My filter's RMS error is 0.3 degrees" means nothing on its own; "my filter needed to hold attitude knowledge to 0.5 degrees 1-sigma for a star-tracker handoff, and achieved 0.3" is a claim a reviewer can actually evaluate, because it has a bar to clear. A project with no stated requirement invites the single most damaging question in the whole defence: good compared to what?

**A model whose assumptions are written down.** Every simulation, filter, or guidance law rests on assumptions — rigid body, point mass, linear measurement model, uncorrelated noise, flat non-rotating ground — and those assumptions are not a weakness to hide. They are the boundary of what the result means. A project that states its assumptions explicitly demonstrates that the author knows exactly what the model does and does not capture; a project that leaves them implicit forces a reviewer to guess, and an experienced reviewer's guess about an unstated assumption is rarely generous.

**Verification evidence that is not "it ran."** This is the single largest gap between a hobbyist project and an engineering one, and later lessons in this module spend real time on it. "The simulation completed without crashing" and "the trajectory looked physically plausible" are both consistent with a serious, invisible defect — a sign error in a cross product, a covariance that is silently wrong by a factor of ten — because a program can be entirely free of crashes and still be computing the wrong answer with complete confidence. A defensible project instead states specifically how correctness was established: an analytic case reproduced to a stated tolerance, a conserved quantity that stayed conserved, a convergence rate that behaved the way the numerical method predicts.

**A known-failure section.** Every real project has a case that broke, a tolerance that had to be loosened, or a regime where the result stops being trustworthy. Naming that case in writing, rather than letting a reviewer discover it by asking, is the single most efficient way to demonstrate judgment, because it proves you know where your own result stops being valid rather than merely hoping nobody asks. A project with no stated limitation has either not been examined closely enough to find one, or found one and left it out — and a reviewer cannot easily tell which, so both readings work against you.

**A clear statement of what you did versus what a library did.** A project that calls `scipy.integrate.solve_ivp` and reports a trajectory has demonstrated that you can call a library function. A project that derives the equations of motion, implements its own fixed-step integrator, and uses `solve_ivp` only as an independent cross-check against that integrator has demonstrated something else entirely — and the difference is invisible from the outside unless you say which one you did. This statement costs one sentence and answers, before it is asked, the question every experienced reviewer eventually asks about any numerical project: which parts of this are yours?

::: key
Defensible means five things exist in writing: a stated requirement, written-down model assumptions, verification evidence beyond "it ran," a named known-failure case, and an explicit statement of what the author built versus what a library provided. A project missing any one of these is not incomplete — it is exactly as strong as its weakest of the five, because that is the one a competent question finds first.
:::

## Documented and reproducible: for the stranger who does not trust you yet

The last two words are shorter to state and get full treatment of their own later in this module, but they belong in the same list because they answer the same underlying problem as "defensible": a reviewer who has never met you starts from zero trust, and everything about the project either builds that trust or spends it.

Documented means the five things above are written somewhere a stranger can find in minutes, not reconstructed from commit messages or explained only when asked in person. A verification result that exists only in your memory is not evidence to anyone but you; the moment it is written down, in a README or a short report, it becomes something a reviewer can check against on their own schedule, which is the entire value of writing it down in the first place. The next lesson in this module is built entirely around getting that structure right.

Reproducible means a stranger can get your result themselves, from your repository, without asking you anything. If a claim cannot be independently reproduced, it is a claim about your machine at a moment in the past, not a fact a reviewer can verify — and the two are worth very different amounts in a technical defence. A later lesson in this module covers exactly what reproducibility requires in practice; the point to hold onto here is that it is not a nicety layered on top of good work. It is one of the five words the whole portfolio is judged by, sitting at the same level as defensibility itself.

## Weak versus strong: the same project, told two ways

The clearest way to see what these words cost in practice is to look at the same underlying project written up two different ways — because the code can be identical, and the difference in how it survives questioning can still be total.

::: example A two-body orbit propagator, weak README versus strong README
**Weak version.** "This project implements a two-body orbital propagator in Python using RK4 integration. It takes an initial position and velocity and propagates the orbit forward in time. Tested on a few sample orbits and it works well."

Read that against the five-part checklist and every part is missing. No stated requirement — propagates an orbit to what accuracy, over what span? No assumptions written down — two-body only, no perturbations, but nothing says so. No verification evidence — "tested on a few sample orbits and it works well" is a claim about the author's impression, not a check anyone else can repeat. No known-failure case. No statement of what was hand-built versus what came from a library. A reviewer reading this has no way to ask a specific question, which sounds like an advantage until the actual first question arrives — "how do you know it's right?" — and there is nothing in the README to answer it with.

**Strong version.** "Propagates a two-body Keplerian orbit given an initial state, accurate enough that specific orbital energy is conserved to better than $10^{-12}$ relative error over at least ten orbital periods, using a fixed-step RK4 integrator implemented from scratch (no `scipy.integrate` in the propagation path; `solve_ivp` is used only in `tests/cross_check.py` as an independent comparison). Assumptions: point-mass two-body dynamics only, no J2 or higher perturbations, no atmospheric drag — valid for propagation spans short enough that these are genuinely negligible, and not validated beyond that. Verification: for a 7000 km, $e=0.01$ orbit propagated for 20 orbital periods at a 1 s step, the specific energy computed from the state matches the closed-form value $\varepsilon = -\mu/2a$ to $3.6\times10^{-15}$ at $t=0$ and drifts to a maximum relative deviation of $3.9\times10^{-14}$ by the final step — see `tests/energy_conservation.py`. Known limitation: step sizes above roughly 30 s begin measurably degrading energy conservation for highly eccentric orbits ($e > 0.9$); RK4's fixed order does not adapt, and an adaptive-step method would be needed there."

The second version answers "how do you know it's right?" before it is asked, states exactly what it does not cover, and tells a reviewer precisely which file to open to check the claim personally. Nothing about the underlying code changed between the two versions — only whether the five things a defensible project needs were written down.
:::

## What not to build

Three shapes of project show up constantly in self-taught portfolios, and all three fail the five-part test structurally, regardless of how much effort went into them — which is exactly why it is worth naming them before you spend the hours.

**Tutorial follow-alongs.** A project built by working through someone else's blog post, course, or textbook example line by line demonstrates that you can follow instructions. It does not demonstrate engineering judgment, because every design decision in it — which filter, which discretization, which library, which tolerance — was already made by the tutorial's author. The tell is almost always in the questions: "why did you choose an EKF over a UKF here" has no real answer beyond "the tutorial used one," and that answer ends the conversation in the worst possible direction. A project is not disqualified for resembling a well-known problem; a 6-DOF simulation or an orbit-determination fit are, by design, problems many people have solved before. What disqualifies it is that the decisions inside it are not yours.

**Notebooks without validation.** A notebook full of plots that look reasonable is evidence that code ran and produced numbers, not evidence that the numbers are correct. This is the anti-pattern verification exists to fix, and it shows up constantly because a plot that looks smooth is genuinely persuasive to the person who made it — smoothness is not the same property as correctness, and a sign error or a wrongly-scaled covariance can produce a perfectly smooth, perfectly wrong plot. A notebook becomes a defensible project the moment it gains the things listed above: a stated requirement, and evidence beyond "it looks right" that the requirement was met.

**Thirty shallow repositories.** A GitHub profile with dozens of small, demo-quality repositories reads, to an experienced reviewer, as evidence of activity rather than evidence of depth — and worse, it actively costs you the benefit of the doubt a smaller, curated profile would get, because a reviewer who opens three at random and finds none of them defensible reasonably stops looking rather than searching for a fourth. Quantity does not average out against depth in this format; a single shallow repository sitting next to your three anchor projects does not add to your evidence, it dilutes the reviewer's attention away from the parts that would actually hold up.

A few more traps are worth naming here even though later lessons give each one its own full treatment: a filter or estimator tuned by eye until its output plot looks smooth, with no statistical consistency test behind that judgment; a controller or guidance law demonstrated only against the exact plant model it was designed and tuned on, never against a perturbed or higher-fidelity one, which proves the tuning closed a loop but proves nothing about robustness; numbers reported with no units and no uncertainty attached; work a reviewer cannot actually run themselves; and a README that describes what a project was intended to do rather than what it was measured to have done. Each of these fails the same five-part test from a different angle, and each gets a dedicated worked treatment later in this module.

::: example Auditing a hypothetical profile against the five-part test
Suppose a candidate's GitHub profile has twelve repositories. Applying the checklist to each in turn: four are tutorial follow-alongs (a "Kalman filter from scratch" repo that mirrors a popular blog post's structure and variable names almost exactly, with no independent design decision visible in the commit history); five are single-notebook explorations with plots and no stated requirement or verification section; two are genuine, substantial projects — a 6-DOF simulation and an attitude estimator — but their READMEs describe what the project "aims to do" in the present tense, with no results, numbers, or limitations stated anywhere; and one is a small, complete utility library with tests, documentation, and a stated scope, but on a topic unrelated to GNC.

Against the five-part checklist, none of the twelve currently passes. But the audit also shows exactly what to do: the two substantial projects are the ones worth the remaining time, because the underlying work already exists — what is missing from both is entirely the documentation half of "defensible," not new engineering. The other nine are candidates for deletion or archiving, not further investment, because no amount of additional documentation turns a tutorial follow-along into a project with the author's own decisions inside it. This is the shape the real audit takes: not judging twelve projects on their code, but sorting them into "worth finishing" and "worth removing," and finding that the two categories rarely overlap with how much time was already spent.
:::

::: warning
A large number of repositories is not neutral — it actively works against you in this format. Every repository a reviewer opens and finds indefensible spends down the benefit of the doubt the next one gets, and a profile with thirty entries gives a skeptical reviewer thirty chances to stop looking before reaching the three that would have held up.
:::

## Check yourself

::: check
State the five words this lesson organizes the module around, and for each one give a one-sentence reason it matters that is specific to the interview format — not a generic statement about quality.
:::

::: answer
Few: a project defended for an hour under questioning is worth more than several defended for two minutes each, because the format tests exactly the depth a shallow project runs out of first. Deep: the interview measures how far understanding extends past the description, which only exists if real design decisions were made while building. Documented: a verification result that exists only in the author's memory is not something a reviewer can check on their own schedule. Defensible: the five-part checklist is what a specific hard question actually probes for, so its absence is what a competent question finds. Reproducible: a claim a stranger cannot regenerate themselves is a claim about the author's machine at some point in the past, not independently verifiable evidence.
:::

::: check
List the five things a defensible project needs, in your own words, and explain briefly why a project missing its known-failure section is weaker than one that has never been asked about failure modes at all.
:::

::: answer
A stated requirement, written-down model assumptions, verification evidence beyond "it ran," a named known-failure case, and an explicit statement of what the author built versus what a library provided. A project with no known-failure section is weaker than one simply never asked about failure, because the absence is not neutral to an experienced reviewer: it reads as either "this was not examined closely enough to find a limitation" or "a limitation was found and left out," and both readings damage credibility more than naming a real, specific limitation would. Stating it first removes the ambiguity and demonstrates the self-awareness the reviewer was going to test for anyway.
:::

::: check
A candidate says their project "used `scipy.optimize` to solve the guidance problem." Using the fifth part of the defensibility checklist, explain what is missing from that sentence and rewrite it so the missing part is supplied.
:::

::: answer
Missing is the statement of what the author did versus what the library did — the sentence as given is consistent with the author having done nothing but call a function with default arguments, and is equally consistent with substantial original work (deriving the problem formulation, choosing and verifying the discretization, setting up the constraints correctly) that happens to end with a library solver call. A working rewrite states the boundary explicitly: "I formulated the powered-descent problem as a linearly-constrained convex program following the lossless-convexification result, discretized it myself, and used `scipy.optimize.linprog` only to solve the resulting linear program — the formulation, discretization, and constraint verification are original; the LP solve itself is not." This tells a reviewer exactly where to direct a "why did you choose this approach" question versus a "how does this specific solver work" question.
:::

::: check
Explain, using the interview format rather than a general claim about effort, why ten repositories built to a shallow standard are worth less than three built to a deep one — even when the ten collectively took more total hours to produce.
:::

::: answer
The interview format spends most of its time on extended questioning about a small number of chosen projects, not on a broad survey of everything a candidate has built — so what gets tested is depth on the few projects actually discussed, and total hours invested across many shallow projects never becomes visible in that format. A candidate presenting one of the ten shallow projects runs out of real content by the second or third follow-up question, regardless of how many other shallow projects exist alongside it; the other nine cannot be called on to rescue that specific conversation. Three projects built deep enough to sustain an hour of questioning each directly match what the format actually measures, while ten shallow ones optimize for a property — breadth of a repository listing — that the format barely samples.
:::

::: check
A reviewer skims a candidate's profile, opens two of thirty repositories at random, and finds neither defensible by the five-part test. What does this lesson say the reviewer is likely to do next, and why does that make the size of the profile itself a liability rather than a neutral fact?
:::

::: answer
The reviewer is likely to stop looking rather than keep sampling for a better one, because each indefensible repository spends down the benefit of the doubt the next one would have received, and thirty repositories give a skeptical reviewer thirty chances to reach that stopping point before ever finding the strong ones. This makes profile size a liability rather than a neutral fact: it is not that a large profile is ignored evenly, it is that the probability of a reviewer's limited sample landing on your best work goes down as the ratio of shallow to deep projects goes up, so adding shallow repositories actively lowers the odds your strongest work gets seen at all.
:::

## Summary

| Term | Statement |
| --- | --- |
| Few | A project defended for an hour beats several defended for two minutes, because extended questioning is the actual format |
| Deep | Depth means real design decisions were made, so understanding extends past the description |
| Documented | The five defensibility items are written down where a stranger can find them, not held only in memory |
| Defensible | Five things in writing: stated requirement, written assumptions, verification beyond "it ran," a known-failure case, author-versus-library statement |
| Reproducible | A stranger can regenerate the result themselves, without asking the author anything |
| Weak vs strong example | Same code, two READMEs — the strong one answers "how do you know it's right" before it is asked |
| What not to build | Tutorial follow-alongs, notebooks without validation, thirty shallow repositories, and their kin |

The next lesson takes "documented" and builds it into a full write-up structure — problem, model, assumptions, verification, validation, results, limitations — the specific shape a defensible project's documentation should take, and what a busy reviewer actually reads in the first ninety seconds.
