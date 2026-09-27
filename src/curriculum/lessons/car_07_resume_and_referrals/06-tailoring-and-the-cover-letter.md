---
id: l06-tailoring-and-the-cover-letter
title: "Tailoring to one role family, and the cover letter question"
minutes: 21
covers:
  - tailoring to one role family rather than submitting one generic resume everywhere
  - the cover letter question and when it is worth the time
---

Say you are telling two people about the same summer. To your grandmother, you lead with the family trip. To your soccer coach, you lead with the training camp. Same summer, same true facts — you did both. You only change which part comes first, because each listener cares about different things. If you told the coach a *new* summer with a camp that never happened, that would be a lie. Choosing what to say first is not.

Until now this module has treated your resume as one fixed document. That was the right simplification for learning the page's shape, content and format. It stops being accurate the moment you apply to more than one kind of role. A posting for a landing-guidance job and a posting for a navigation job are both GNC roles. Both check your resume against a list of basic qualifications. But each is looking for a different emphasis inside the same body of work you already have.

This lesson is about **tailoring** — arranging the same true evidence so it answers what one specific reader is checking for. It is different from inventing new facts for each application, and different from one resume that tries to lead with everything at once. The same question — what does *this* reader need? — comes back a second time in the lesson, with the **cover letter**: a short letter sent alongside the resume. Sometimes it is worth the time. Sometimes it wastes the reader's attention. The difference is whether it says something the resume could not.

## Why a posting's wording matters

A posting is written by the team that would interview you, in the words that team uses every day. Two postings can both be called "GNC Engineer" and still stress different things, because the two teams do different daily work.

- A team working on **[[entry, descent and landing|edl]]** tends to stress vehicle dynamics, atmospheric flight, trajectory optimization and **[[dispersion analysis|dispersion]]** — the language of getting one vehicle through one environment in one piece.
- A team working on navigation and **[[orbit determination|orbit-determination]]** tends to stress filtering, **sensor fusion** (combining several sensors into one best estimate) and estimation accuracy — the language of knowing where something is, and how far to trust that knowledge.

Both are central parts of GNC. A strong candidate from this course could fit either one. What differs is which piece of her existing evidence a given reader needs to see first, in the words that reader recognizes fastest.

A caution about this picture. Real GNC work is not split into a few tidy boxes. Real postings blend emphases all the time, and this module's two examples are a teaching simplification, not a claim that only two kinds exist. The skill is reading a posting's actual wording as information about what *that* reader is checking for — and answering it, instead of treating every posting as the same.

## One role family: not one per posting, not one for everything

A **[[role family|role-family]]** is a group of postings that look for the same kind of evidence first — for example, all the landing-guidance postings, or all the navigation postings. There are two ways to get tailoring wrong, one on each side of the right answer.

**Mistake one: rewriting from scratch for every posting.** This does not scale. It also hides a quieter cost. Every fresh rewrite is another chance for an inconsistency to creep in — a number that quietly changes between versions, a claim stretched a little in the rush to sound tailored.

**Mistake two: one generic resume for everything.** This fails the other way. A resume that leads with everything at once leads with nothing in particular. To a fast first-pass reader, stressing everything equally is the same as stressing nothing.

**The workable middle** is a small number of versions — commonly two or three — one per real role family. The evidence underneath is identical in every version. Only the order, the emphasis and the framing change, to match what each family checks for first.

That is a sustainable amount of upkeep. When you finish a new anchor project or improve an old one, you update it once per version, instead of rebuilding a whole document from memory. And each version stays consistent, because they all grow from the same **[[master document|master-document]]** instead of being written separately each time.

::: key
Tailoring: one resume per role family, not one per application and not one for everything. The Starship version leads with 6-DOF and entry work; the navigation version leads with estimation and orbit determination. The underlying evidence is the same; the ordering is not.
:::

::: key
Maintain a small number of resume versions — typically two or three — built around real role families, not one generic resume that leads with nothing in particular and not a new document rewritten from scratch for every posting.
:::

## Tailoring without lying

Tailoring has a clear boundary. It is worth stating exactly, instead of leaving it to gut feeling.

**You may:**

- reorder your Projects section so the most relevant entry leads;
- choose which of several true bullets under a project to include, or to put first;
- trim a bullet that is accurate but less relevant to this reader;
- adjust word choice to match the posting's own vocabulary — as long as the new words still describe accurately what you did.

**You may not:**

- invent a result you did not get;
- claim a tool or technique you did not use;
- recast a self-directed project as having an employer, a team or a sponsor it never had.

The test is short. **Every version of your resume must stay true if someone read all of them side by side.** Only emphasis, order and framing may differ — never the facts underneath.

::: warning Tailoring changes emphasis, never facts
If a change would make one version of your resume say something another version contradicts, it has crossed from tailoring into misrepresentation. One project can honestly stress different true parts of itself for different readers. It cannot honestly claim different things happened.
:::

::: example The same project, tailored honestly for two role families
**The project underneath.** A fixed-step 6-DOF launch-vehicle simulation in C++. It is verified against a closed-form (exact, pencil-and-paper) case to 1e-9 — that is, $10^{-9}$, one part in a billion. It has a tabulated atmosphere model, a reproducible one-command build, and a continuous-integration pipeline that reruns the verification suite on every change.

**Version A — for an entry, descent and landing posting.** Lead with the vehicle-dynamics result:

"Built a fixed-step 6-DOF launch-vehicle simulation in C++ with a tabulated atmosphere model, verified against the closed-form torque-free solution to 1e-9, and ran a 10,000-case Monte Carlo dispersion campaign reporting **[[3-sigma|three-sigma]]** impact-point spread."

**Version B — for a modeling-and-simulation infrastructure posting.** The same project, with the engineering-process result leading:

"Built a fixed-step 6-DOF simulation in C++ with a reproducible one-command build and a continuous-integration pipeline that runs a full analytic-verification suite on every change, catching a **[[regression|regression]]** in the atmosphere-model interpolation before it reached a dispersion run."

**Sanity check: the side-by-side test.** Does anything in A contradict B? No. Both describe the same real project truthfully. The same 1e-9 check sits behind both. What changed is which true fact leads — matched to what each reader is most likely checking for first.
:::

::: example Tailoring the identity line and the project order together
A candidate has three anchor projects: a 6-DOF simulation, a consistency-checked attitude estimator, and a powered-descent guidance study. She keeps two versions.

**Landing-and-descent version.**

- Identity line: "Self-taught GNC engineer; built and verified a 6-DOF launch-vehicle simulation and a Monte Carlo-validated powered-descent guidance solution."
- Projects order: descent guidance, then the 6-DOF simulation, then the estimator.

**Navigation version.**

- Identity line: "Self-taught GNC engineer; built a consistency-checked quaternion attitude estimator and a verified 6-DOF simulation."
- Projects order: estimator, then the 6-DOF simulation, then descent guidance.

**What stayed the same.** Every fact matches its twin in the other version — the same tolerances, the same Monte Carlo case counts, the same verification methods.

**What changed.** Only which facts are named first: in the one-line identity statement, and in the order of the section.

**Sanity check.** Count the projects in each version: three and three, the same three. Nothing added, nothing dropped, nothing reworded into a different claim. This is the key above in action.
:::

## The cover letter question

Is a cover letter worth writing? There is no single rule for every application. Practice varies by employer. It also depends on whether the application form even has a place for one — some do, some do not. This module cannot state a fixed fact about any one employer's process. What it can give you is a decision rule that works whichever system you face.

**Write a short cover letter when both of these are true:**

1. The application system gives you a place for one.
2. You have something specific to say that bullet points cannot say well — for example:
   - why this particular role family fits *you*;
   - a short, clear explanation that connects an unusual or winding path, if you have one;
   - a piece of time-sensitive context that would look odd as a bullet.

**Skip it** when either condition fails — or when what you would write is the resume again, in paragraph form. The resume already says those things more efficiently. A letter that repeats it costs the reader time and gives her nothing new. A reader who notices that pattern will reasonably guess that little thought went into this particular application.

**A letter that helps** is short — well under a page. It names the specific team or posting, instead of reading as if it could go anywhere. It gives two or three sentences of concrete fit tied to a named project. Then it stops.

**A letter that wastes time** could be sent to any company with the name swapped. It restates the resume instead of adding to it. And it runs long, because it has more enthusiasm to express than information to give.

::: key
Write a cover letter only when the system offers a place for one and you have something specific to say that bullets cannot say well. A helpful letter is short, names the specific role, and adds concrete fit; a letter that merely restates the resume in paragraph form wastes the reader's time.
:::

::: example One paragraph, wasteful and helpful, from the same candidate
**Wasteful:**

"I am very passionate about aerospace and have been fascinated by rockets since childhood. I believe my skills in programming and mathematics make me a strong candidate for this position, and I am a fast learner who works well independently and in teams. I would welcome the opportunity to bring my enthusiasm to your organization."

Test it. Is anything false? No. Is anything specific? Also no. It could go to any engineering employer in any industry without changing a word, and it contains no fact a reader could check.

**Helpful:**

"I'm applying for the GNC Engineer role on the descent-guidance team. My powered-descent guidance project implements the **[[lossless-convexification|lossless-convexification]]** approach from the published powered-descent literature, and I ran a 5,000-case Monte Carlo to validate landing accuracy under dispersed initial conditions — the project is linked in my resume. I'd welcome the chance to talk through the trade-offs I ran into extending it to a soft-constraint formulation."

Test it the same way.

- It names the specific team.
- It ties to one real, checkable project already on the resume.
- It hands the reader a specific thread to pull on in an interview.

Those three sentences could not have been said as well as a bullet. And they could not be sent, unchanged, to a different posting. **Sanity check:** three sentences, well under a page — short, as the rule asks.
:::

::: note Why "published literature" and not "your team's work"
It is tempting to write "the approach your team uses". Only say that if you have actually confirmed it — from a paper the team's engineers wrote, or from the posting itself. A reader on that team knows exactly what they use. A guess that turns out wrong costs you more than the sentence could ever gain.
:::

## Check yourself

::: check
State the boundary between tailoring and misrepresentation as a rule a candidate could apply to any single edit she is considering.
:::

::: answer
The rule: every version of the resume must stay true if a reader compared all the versions side by side. Reordering sections, choosing which true bullet leads, trimming a less relevant true detail, and matching a posting's vocabulary while keeping the words accurate are all tailoring. Any edit that would make one version say something another version contradicts — inventing a result, claiming a tool she never used — has crossed into misrepresentation.
:::

::: check
Why does one generic resume that describes everything equally fail to serve any specific reader well, even though it holds all the same true content as a tailored version?
:::

::: answer
A fast first-pass reader is looking for evidence that matches her posting's emphasis. A resume that leads with nothing in particular gives her no signal about what to weigh first. To a reader trying to confirm relevance quickly, stressing every true fact equally is the same as stressing none — she has to do the sorting herself, which is exactly the work a well-ordered, tailored version would have done for her.
:::

::: check
Why is rewriting a brand-new resume for every posting a worse strategy than keeping two or three role-family versions, even though a fresh rewrite could in principle fit each posting perfectly?
:::

::: answer
A rewrite per posting does not scale as the number of applications grows, and each separate rewrite is a fresh chance for inconsistency to creep in — a number quietly changed, a claim stretched to sound tailored. A few role-family versions, all grown from the same source material, stay consistent and need updating only once per version when new evidence arrives. That is sustainable across a whole job search, not only for the first few applications.
:::

::: check
An application form has an optional text box for a cover letter. What should decide whether a candidate fills it in?
:::

::: answer
Whether she has something specific to say that her resume's bullets cannot say as well — a concrete reason this role family fits her, a short explanation of an unusual path, or genuinely time-sensitive context. If all she would write is the resume again in paragraph form, leaving the box empty (or very brief) serves the reader better than filling it with repeated content.
:::

::: check
A cover letter says, truthfully, that the candidate is passionate about aerospace, a fast learner and a strong communicator. Every sentence is true. Why can it still be a poor use of the reader's time?
:::

::: answer
The problem is not honesty but information. Nearly any applicant for nearly any engineering role could write every sentence unchanged, so the reader learns nothing about this candidate or this posting. A helpful letter adds concrete, checkable information the resume does not already give as efficiently — the specific team, a specific project, something new to ask about — rather than restating general enthusiasm, however truthfully.
:::

::: check
For one posting, a candidate describes her 6-DOF simulation's engineering rigor — its reproducible build and continuous-integration pipeline. For another posting, she describes the same project's atmospheric dispersion results. Is this dishonest? Explain.
:::

::: answer
It is tailoring, not dishonesty. Both descriptions are true at the same time, and neither version denies or contradicts the other: the project really has both a rigorous process and real dispersion results. Each version only leads with the true fact most relevant to that reader. It would become dishonest only if one version claimed something the project does not have, or if the two versions could not both be true of the same project at once.
:::

## Summary

| Situation | This lesson's guidance |
| --- | --- |
| Applying to more than one role family | Keep two or three versions, one per role family — not one generic version, not a rewrite per posting |
| What differs between versions | Order, emphasis and framing: e.g. Starship version leads with 6-DOF and entry work; navigation version with estimation and orbit determination |
| Reordering sections or choosing which true bullet leads | Tailoring — allowed and expected |
| Inventing a result, tool or employer that was not real | Misrepresentation — never allowed, in any version |
| The side-by-side test | Every version must stay true when read next to all the others |
| No cover-letter field, or nothing specific to add | Skip the cover letter |
| Concrete fit that bullets cannot say well | Write a short letter: name the role, add real content, stop |

The next lesson moves from the document to the act of sending it: finding the right posting at spacex.com/careers, applying with the right version of your resume, and what realistically happens after you click submit.

::: context edl Getting down in one piece
**EDL**, said "E-D-L", is **entry, descent and landing**. Entry is hitting the atmosphere at high speed; descent is shedding that speed; landing is touching down on target. A returning Falcon 9 booster does it every flight, and Starship is designed to do it both at Earth and at Mars. That is why the key names "the Starship version": a Starship-family posting leads with 6-DOF vehicle dynamics and entry work, because surviving the atmosphere and steering through it is the heart of that job.
:::

::: context dispersion Monte Carlo and dispersion
A **dispersion analysis** asks: if everything varies a little — the wind, the engine thrust, the mass, the sensors — how spread out are the outcomes? Engineers answer it with a **Monte Carlo** run: simulate the flight thousands of times, each with slightly different random inputs, and look at the spread of results. The name comes from the famous casino in Monaco, because the method runs on random numbers the way a roulette wheel does.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <circle cx="180" cy="75" r="60" fill="none" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="5 3"/>
  <circle cx="180" cy="75" r="4" fill="#1f2a44"/>
  <g fill="#1d6fd1">
    <circle cx="172" cy="68" r="2.5"/><circle cx="190" cy="80" r="2.5"/><circle cx="165" cy="90" r="2.5"/><circle cx="200" cy="62" r="2.5"/>
    <circle cx="185" cy="55" r="2.5"/><circle cx="150" cy="72" r="2.5"/><circle cx="210" cy="88" r="2.5"/><circle cx="178" cy="100" r="2.5"/>
    <circle cx="195" cy="95" r="2.5"/><circle cx="160" cy="58" r="2.5"/><circle cx="220" cy="70" r="2.5"/><circle cx="140" cy="95" r="2.5"/>
    <circle cx="176" cy="84" r="2.5"/><circle cx="188" cy="70" r="2.5"/><circle cx="168" cy="78" r="2.5"/><circle cx="205" cy="110" r="2.5"/>
  </g>
  <text x="180" y="146" font-size="11" text-anchor="middle" fill="#1f2a44">each dot: one simulated landing</text>
  <text x="252" y="30" font-size="11" fill="#b4232c">spread boundary</text>
  <text x="70" y="79" font-size="11" text-anchor="middle" fill="#1f2a44">target</text>
  <line x1="92" y1="75" x2="174" y2="75" stroke="#1f2a44" stroke-width="1"/>
</svg>
```
:::

::: context orbit-determination Knowing where the spacecraft is
**Orbit determination** is working out a spacecraft's exact path from imperfect measurements — radar ranges, radio signals, GPS fixes, star and horizon sightings. No single measurement is exact, so the answer comes from fitting a path through many of them and saying how far to trust it. The same estimation tools — least squares and Kalman filters — do both jobs, which is why navigation postings lump "estimation and orbit determination" together. You meet both properly in the estimation part of this course.
:::

::: context role-family Families, not job titles
Job titles are loose — "GNC Engineer" can mean very different daily work. A **role family** groups postings by what evidence they check for first.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="120" y="10" width="120" height="30" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="30" font-size="12" font-weight="700" text-anchor="middle" fill="#1f2a44">GNC postings</text>
  <g stroke="#1f2a44" stroke-width="1.5"><line x1="180" y1="40" x2="62" y2="70"/><line x1="180" y1="40" x2="180" y2="70"/><line x1="180" y1="40" x2="298" y2="70"/></g>
  <rect x="8" y="70" width="108" height="36" rx="6" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="126" y="70" width="108" height="36" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="244" y="70" width="108" height="36" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="12" text-anchor="middle" fill="#1f2a44">
    <text x="62" y="92">Entry, landing</text><text x="180" y="92">Navigation</text><text x="298" y="92">Infrastructure</text>
  </g>
  <g font-size="11" text-anchor="middle" fill="#6c7a93">
    <text x="62" y="124">6-DOF, dispersions</text><text x="180" y="124">estimation, orbits</text><text x="298" y="124">builds, CI, tests</text>
  </g>
</svg>
```

Three families, as this module draws them. Real companies blur the lines, but two or three versions usually cover a real search.
:::

::: context master-document One source, several versions
Engineers hate keeping two copies of the same fact, because sooner or later one copy changes and the other does not. The fix is a **single source of truth**: one master document holding every true bullet you have ever written, with its numbers. Each role-family resume is a selection and ordering from it. When a project improves, you change the master first, then copy the change into each version — so no version can quietly drift.
:::

::: context three-sigma What "3-sigma" means
**Sigma** ($\sigma$, the Greek letter s) is the **standard deviation**: a measure of how spread out results are around their average. For results that follow the familiar bell curve, about 99.7 percent land within 3 sigma of the average. So "3-sigma impact-point spread" means the region where nearly all simulated impacts fell — the number a range-safety or landing engineer actually plans around.
:::

::: context regression When a fix breaks something old
In software, a **regression** is something that used to work and stopped, usually because a new change broke it by accident. It has nothing to do with the statistics word. Catching one "before it reached a dispersion run" means the automatic tests flagged the broken atmosphere lookup before thousands of simulated flights were run on bad numbers — which is exactly what a CI pipeline is for.
:::

::: context lossless-convexification A guidance idea from the landing literature
Finding the best fuel-saving path down to a landing pad is a hard optimization problem. **Convex** problems are the easy kind: they have one best answer, and a computer can find it quickly and reliably. **Lossless convexification** is a technique, published by Behçet Açıkmeşe and colleagues from the late 2000s onward, that rewrites the powered-descent problem into a convex one without losing the true best answer. It is exactly the kind of named, published method that makes a cover-letter sentence specific.
:::
