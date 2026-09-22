---
id: l06-tailoring-and-the-cover-letter
title: "Tailoring to one role family, and the cover letter question"
minutes: 21
covers:
  - tailoring to one role family rather than submitting one generic resume everywhere
  - the cover letter question and when it is worth the time
---

Every lesson before this one has treated your resume as a single fixed document. That was the right simplification for learning the page's shape, its content, and its formatting — but it stops being accurate the moment you start applying to more than one kind of role. A posting for a landing-guidance role and a posting for a navigation-and-estimation role are both GNC roles, both checking your resume against a basic-qualifications list, and both looking for genuinely different emphasis within the same underlying body of work you have. This lesson is about adjusting the same true evidence to answer what a specific reader is actually checking for — which is a different activity from writing a new set of facts for each application, and a different activity from writing one resume that tries to lead with everything at once.

The same question of adjusting to a specific reader shows up a second time in this lesson, in the cover letter: a piece of writing that is sometimes worth the time it takes to produce and sometimes actively wastes the reader's attention, depending on what it actually says and whether it says something the resume could not.

## Why a posting's wording matters

A posting is written by the team that would interview you, in the vocabulary that team actually uses day to day. Two postings can both sit comfortably under "GNC Engineer" and still emphasize noticeably different things, because the day-to-day work of the two teams is genuinely different. A team working on entry, descent, and landing tends to emphasize vehicle dynamics, atmospheric flight, trajectory optimization, and dispersion analysis — the language of getting a specific vehicle through a specific environment intact. A team working on navigation and orbit determination tends to emphasize filtering, sensor fusion, and estimation accuracy — the language of knowing where something is and trusting that knowledge. Both are legitimate, central parts of GNC, and a strong candidate for this curriculum's material could plausibly be a strong fit for either. What differs is which piece of her existing evidence a given reader most needs to see first, in the vocabulary that reader recognizes fastest.

This is not a claim that GNC roles are cleanly divided into a small number of non-overlapping boxes — real postings blend emphases constantly, and this module's two examples are a simplification for teaching the underlying skill, not a claim that only these two families exist. The skill being taught is reading a posting's actual wording as information about what that specific reader is checking for, and responding to it, rather than treating every posting as identical.

## One role family, not one resume per posting and not one resume for everything

Two failure modes sit on either side of the right answer, and it is worth naming both. Rewriting your resume from scratch for every single posting does not scale, and it introduces a subtler cost: more from-scratch rewrites mean more chances for an inconsistency to creep in — a number that quietly changes between versions, a claim that gets slightly overstated in the rush to sound tailored. A single generic resume that tries to lead with everything at once fails differently: it leads with nothing in particular, because emphasizing everything equally is, for a fast first-pass reader, the same as emphasizing nothing.

The workable middle is a small number of resume versions — commonly two or three — built around genuine role families, where the underlying evidence is identical across versions and only the ordering, emphasis, and framing change to match what each family's postings actually check for first. This is a sustainable amount of maintenance: when you complete a new anchor project or improve an existing one, you update it once per version rather than reconstructing an entire document from memory, and each version stays internally consistent because it descends from the same source material rather than being written independently each time.

::: key
Maintain a small number of resume versions — typically two or three — built around real role families, not one generic resume that leads with nothing in particular and not a new document rewritten from scratch for every posting.
:::

## Tailoring without lying

Tailoring has a clear boundary, and it is worth stating precisely rather than leaving it to intuition. You may reorder your Projects section so the most relevant entry leads. You may choose which of several true bullets under a project to include or to lead with, and you may trim a bullet that is accurate but less relevant to this specific reader. You may adjust word choice to match a posting's own vocabulary, provided the adjusted words remain an accurate description of what you actually did. What you may not do is invent a result you did not obtain, claim a tool or technique you did not use, or reframe a self-directed project as something with an employer, a team, or a sponsor it never had. The test is simple to state: every version of your resume must remain true if read by someone who saw all the others side by side. Only emphasis, order, and framing may differ — never the underlying facts.

::: warning Tailoring changes emphasis, never facts
If a change you are considering would make one version of your resume say something a different version contradicts, it has crossed from tailoring into misrepresentation. A single project can honestly emphasize different true aspects of itself for different readers; it cannot honestly claim different things happened.
:::

::: example The same project, tailored honestly for two role families
The underlying project: a fixed-step 6-DOF launch-vehicle simulation in C++, verified against a closed-form analytic case to 1e-9, with a tabulated atmosphere model, a reproducible one-command build, and a continuous-integration pipeline that runs the verification suite on every change.

For a posting emphasizing entry, descent, and landing work, the bullet leads with the vehicle-dynamics result: "Built a fixed-step 6-DOF launch-vehicle simulation in C++ with a tabulated atmosphere model, verified against the closed-form torque-free solution to 1e-9, and ran a 10,000-case Monte Carlo dispersion campaign reporting 3-sigma impact-point spread."

For a posting emphasizing modeling-and-simulation infrastructure, the same underlying project is described with the engineering-process result leading instead: "Built a fixed-step 6-DOF simulation in C++ with a reproducible one-command build and a continuous-integration pipeline that runs a full analytic-verification suite on every change, catching a regression in the atmosphere-model interpolation before it reached a dispersion run."

Nothing in either version contradicts the other — both describe the same real project truthfully. What changes is which true fact leads, matched to what each specific reader is most likely checking for first.
:::

::: example Tailoring the identity line and project order together
A candidate with three anchor projects — a 6-DOF simulation, a consistency-checked attitude estimator, and a powered-descent guidance study — maintains two resume versions. In the landing-and-descent version, her identity line reads "Self-taught GNC engineer; built and verified a 6-DOF launch-vehicle simulation and a Monte Carlo-validated powered-descent guidance solution," and her Projects section leads with the descent-guidance study, followed by the 6-DOF simulation, with the estimator third. In the navigation version, the identity line instead reads "Self-taught GNC engineer; built a consistency-checked quaternion attitude estimator and a verified 6-DOF simulation," and the estimator leads the Projects section, followed by the simulation, with descent guidance third.

Every fact in both versions is identical to the corresponding fact in the other — the same tolerances, the same Monte Carlo case counts, the same verification methods. Only which facts are named first, in the identity line and in section order, changes between the two, matched to what each reader's posting actually emphasizes.
:::

## The cover letter question

Whether a cover letter is worth writing is not a single rule that holds for every application. Practice varies by employer, and it varies by whether the application system even offers a field for one — some do, some do not, and this module cannot state a fixed fact about any specific employer's process here. What it can give you is a decision rule that applies regardless of which system you are facing.

Write a short cover letter when two conditions both hold: the application system provides a place for one, and you have something specific to say that your resume's bullet-point format genuinely cannot say well — why this particular role family fits you specifically, a brief, coherent explanation connecting an unusual or nonlinear path if you have one, or a piece of context that is time-sensitive and would look out of place as a bullet. When neither condition holds, or when what you would write is a paragraph-form restatement of content your resume already states more efficiently as bullets, skip it. A cover letter that repeats the resume in sentence form costs the reader time without giving her new information, and a reader who notices that pattern reasonably infers that little specific thought went into this particular application.

A letter that helps is short — well under a page — names the specific team or posting rather than reading as though it could be sent anywhere, gives two or three sentences of concrete fit tied to a named project, and stops. A letter that wastes the reader's time is generic enough to be sent to any company with the name changed, restates the resume's content in paragraph form rather than adding to it, and runs long because it has more enthusiasm to express than information to convey.

::: key
Write a cover letter only when the system offers a place for one and you have something specific to say that bullets cannot say well. A helpful letter is short, names the specific role, and adds concrete fit; a letter that merely restates the resume in paragraph form wastes the reader's time.
:::

::: example A cover-letter paragraph, wasteful and helpful, for the same candidate
Wasteful: "I am very passionate about aerospace and have been fascinated by rockets since childhood. I believe my skills in programming and mathematics make me a strong candidate for this position, and I am a fast learner who works well independently and in teams. I would welcome the opportunity to bring my enthusiasm to your organization." Nothing here is false, and nothing here is specific — this paragraph could be sent to any engineering employer in any industry without changing a word, and it restates no fact a reader could check.

Helpful: "I'm applying for the GNC Engineer role on the descent-guidance team. My powered-descent guidance project implements the same lossless-convexification approach your team's published work uses, and I ran a 5,000-case Monte Carlo to validate landing accuracy under dispersed initial conditions — the project is linked in my resume. I'd welcome the chance to talk through the trade-offs I ran into extending it to a soft-constraint formulation." This version names the specific team, ties directly to one real, verifiable project already documented on the resume, and gives the reader a specific, plausible thread to pull on in an interview — three sentences that could not have been said as effectively as a resume bullet, and could not be sent, unchanged, to a different posting.
:::

## Check yourself

::: check
State the boundary between tailoring and misrepresentation as a rule a candidate could apply to any specific edit she is considering.
:::

::: answer
The rule: every version of the resume must remain true if a reader compared all versions side by side. Reordering sections, choosing which true bullet to lead with, trimming a less-relevant true detail, and adjusting wording to match a posting's vocabulary — provided the wording stays accurate — are all tailoring. Any edit that would make one version state something a different version contradicts, such as inventing a result or claiming a tool never used, has crossed into misrepresentation.
:::

::: check
Why does a single generic resume that tries to describe everything equally fail to serve any specific reader well, even though it technically contains all the same true content as a tailored version?
:::

::: answer
A fast first-pass reader is checking for evidence that matches her specific posting's emphasis, and a resume that leads with nothing in particular gives her no signal about which of its contents to weigh most heavily first. Emphasizing every true fact equally is, from the perspective of a reader trying to quickly confirm relevance, indistinguishable from emphasizing nothing — she has to do the prioritizing herself, which is exactly the work a well-ordered, tailored version would have done for her.
:::

::: check
Why is rewriting an entirely new resume from scratch for every individual posting a worse strategy than maintaining two or three role-family versions, even though a from-scratch rewrite would in principle be maximally specific to each posting?
:::

::: answer
A from-scratch rewrite for every posting does not scale as application volume grows, and each independent rewrite is a fresh opportunity for an inconsistency to creep in between versions — a number quietly changed, a claim slightly overstated in the rush to sound tailored to that one posting. A small number of role-family versions, each descended from the same underlying source material, stays internally consistent and only needs updating once per version as new evidence becomes available, which is sustainable across an entire search rather than only for the first few applications.
:::

::: check
A posting's application system includes an optional text field for a cover letter. What should determine whether a candidate uses it?
:::

::: answer
Whether she has something specific to say that her resume's bullet-point format cannot say as well — a concrete reason this particular role family fits her, a brief explanation of an unusual path, or genuinely time-sensitive context. If what she would write is only a paragraph-form restatement of content the resume already states more efficiently as bullets, leaving the field blank or brief serves the reader better than filling it with restated content.
:::

::: check
A cover letter states, accurately, that the candidate is passionate about aerospace, a fast learner, and a strong communicator. Every sentence is true. Explain why this letter can still be a poor use of the reader's time.
:::

::: answer
The letter's problem is not honesty but information content: every sentence in it could be written, unchanged, by nearly any applicant for nearly any engineering role, so a reader gains nothing specific to this candidate or this posting by reading it. A helpful letter needs to add concrete, checkable information the resume does not already convey as efficiently — naming the specific team, tying to a specific project, giving the reader something new to ask about — not merely restate general enthusiasm truthfully.
:::

::: check
A candidate describes her 6-DOF simulation project's software-engineering rigor — its reproducible build and continuous-integration pipeline — for one posting, and its atmospheric dispersion results for another posting, about the same project. Is this dishonest? Explain your reasoning.
:::

::: answer
This is tailoring, not dishonesty, because both descriptions are true simultaneously and neither version denies or contradicts what the other states — the project genuinely has both a rigorous engineering process and real dispersion results, and each version only leads with whichever true fact is most relevant to that specific reader's posting. It would only become dishonest if one version claimed something the underlying project does not actually have, or if the two versions could not both be true about the same project at once.
:::

## Summary

| Situation | This lesson's guidance |
| --- | --- |
| Multiple role families you're applying to | Maintain two or three resume versions, not one generic version and not a from-scratch rewrite per posting |
| Reordering sections or choosing which true bullet leads | Tailoring — allowed, and expected |
| Inventing a result, tool, or employer framing that wasn't real | Misrepresentation — never allowed, regardless of which version |
| Application system has no cover-letter field, or you have nothing specific to add | Skip the cover letter |
| You have concrete, specific fit to state that bullets cannot say well | Write a short letter: name the role, add real content, stop |

The next lesson moves from the document itself to the act of submitting it: finding the right posting at spacex.com/careers, applying with the correctly tailored version, and what a realistic understanding of what happens next actually looks like.
