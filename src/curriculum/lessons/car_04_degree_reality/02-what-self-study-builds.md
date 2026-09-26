---
id: l02-what-self-study-builds
title: "What self-study builds, and what it cannot buy"
minutes: 17
covers:
  - "what this platform can do and what it cannot: it builds capability, not a credential"
---

Think about learning to drive. You could take the best driving course in the world — hundreds of hours behind the wheel, a patient teacher, perfect parallel parking. At the end you would be a genuinely good driver. You still would not have a driver's license. Only the licensing office can give you that, and it does not care how many hours you practiced. It cares whether *it* checked you.

The previous lesson showed that the degree line is real and enforced early. This lesson turns to this curriculum itself: what thousands of hours inside it will actually give you, and what they will not. A study platform has an obvious temptation to hint that it can replace anything. This one will not. It will tell you exactly what it builds, so you can spend your hours on a plan that uses that correctly — not one that quietly assumes it does something it cannot.

Two different things get called "qualified for the job," and mixing them up is the second most expensive mistake this module exists to prevent. The first is **capability** — whether you can actually do the work: derive a **[[Kalman filter|kalman]]**'s covariance update, write a fixed-step 6-DOF integrator that does not drift, design a guidance law that still works when the conditions are off from the plan. The second is a **[[credential|credential-word]]** — a documented record, checked by a third party, that a stranger who has never seen your work can trust without checking it themselves: a transcript, a diploma, an accreditation record. Used seriously, this curriculum builds the first in real quantity. It does not, cannot, and was never going to produce the second. That is not a gap more lessons would close. It is a different *kind* of thing.

## What a credential verifies that a portfolio cannot

A degree from an **accredited** program — one checked and approved by an outside body — tells an employer something specific. An institution the employer trusts, but did not have to inspect personally, has already checked that you met a defined standard, across a defined set of courses, over a defined span of time. The checking was done by people whose job was to check.

So the employer does not need to read your differential-equations homework to trust that you can do calculus. An accreditor such as **[[ABET|abet]]** (said "A-bet"), or the university's own accreditor, already did that work once for the whole program. Every employer who trusts that accreditor inherits the result without repeating the check. It is a **[[chain of trust|trust-chain]]**.

That is exactly the problem a recruiter needs solved. Picture hundreds of resumes for one posting and a few minutes for each. Nobody could personally judge the technical depth of every applicant's independent work at that pace. A credential that someone else already verified turns an open question into a solved one. This is precisely why the degree line works as a hard filter at the recruiter stage, as the previous lesson explained: it swaps an expensive check the screener has no time to do for a cheap one that leans on a trusted third party's earlier work.

## What a portfolio proves that a credential cannot

Now flip it around. A credential says almost nothing about the question that decides whether you will do the job *well*. Can you take a messy, open problem — an entry guidance law that must survive an atmosphere thicker than expected, an attitude estimator that must reject a bad sensor with no human stepping in — and produce a working, tested, documented answer?

A transcript lists course titles and grades. It does not show a hiring manager your code, your derivation, or your judgment when a test campaign turned up a failure you had not predicted.

A **[[portfolio|portfolio]]** — a collection of your own finished, inspectable work — does exactly that. A working 6-DOF simulator with a checked integrator. An **extended Kalman filter** written from scratch and tested against a known trajectory. An ascent-guidance law written up with its assumptions stated. These are not *claims* about your ability. They *are* the ability, made visible to anyone who takes the time to look.

That is why demonstrated work carries real weight once someone with engineering judgment is actually looking: in a technical interview, in a hiring manager's read of a resume that already cleared the basic qualifications, in an internal-transfer conversation. And it is why it carries essentially no weight at the recruiter-stage filter itself. That filter is built so it needs nobody's judgment at all.

::: key
A credential verifies, cheaply and at scale, that a trusted third party already checked you against a standard — solving the recruiter's problem of evaluating a stranger fast. A portfolio proves the underlying capability directly, to anyone willing to spend the time to look — solving the hiring manager's problem of telling two credentialed candidates apart. Neither substitutes for the other, because each solves a different person's problem at a different stage.
:::

## What this curriculum honestly is

This curriculum was built to produce the second thing: real, demonstrated, inspectable capability. Every module's exercises ask you to build something that runs, derive something with the steps shown, or analyze something with a stated method — a fixed-step integrator with **[[unit tests|unit-tests]]**, a Monte Carlo dispersion campaign, a Kalman filter tuned against real data. Done seriously, over the hours the modules actually take, the result is not a *pretend* version of GNC engineering. It *is* GNC engineering, at a scale a working engineer would recognize as real.

What it cannot do is issue you a transcript. No number of finished modules, answered flashcards or submitted exercises will make a university, an accreditor or a state **[[licensing board|licensing]]** record that you hold a degree. This platform is not one of those institutions and has no authority to act as one.

That is not a shortage of content. It is a category the content was never going to reach — the driving course and the license again. A separate, authorized body has to do that one specific thing.

Seeing this plainly now is what makes the three paths in the rest of this module make sense. Each one pairs what this curriculum actually produces — capability — with a specific, real way of settling the credential question, instead of hoping one can stand in for the other.

::: warning Hours of self-study are not the same claim as a credential
It is tempting to reason that enough hours of serious, documented self-study should count for as much as a degree — especially once you watch the hours add up to a big number. The reasoning is right that the hours are valuable; the next example shows they are a serious investment. But it answers the wrong question. To a screener, a credential's value is not mainly "how many hours did this person spend learning?" It is "did a trusted third party already check this person against a standard, so I don't have to?" No quantity of hours, on its own, does that checking.
:::

::: key
This curriculum builds capability: real, demonstrated, inspectable work, at the scale its modules' hours actually represent. It does not and cannot build a credential — that requires an accredited institution's own verification, which is a different kind of thing, not a longer version of the same thing.
:::

::: key
The two failure modes this module names later both come from collapsing capability and credential into one idea: assuming capability alone clears a filter built to check credential, or assuming credential alone is the whole competition once the filter is cleared.
:::

::: example Counting the hours honestly
A reader studies this curriculum's technical modules for twelve hours a week, every week, for four years. That is a serious but realistic pace for someone working full time.

**Step 1 — the self-study total.** Multiply hours per week by weeks per year by years:

$$
12 \times 52 \times 4 = 2496 \text{ hours}
$$

**Step 2 — hours behind one credit.** The common US **[[credit-hour|credit-hour]]** rule of thumb treats one credit as about one hour in class plus two hours of work outside class, each week, for about fifteen weeks. That is 3 hours a week for 15 weeks:

$$
3 \times 15 = 45 \text{ hours per credit}
$$

**Step 3 — hours behind a degree.** A typical bachelor's needs on the order of 120 credits:

$$
120 \times 45 = 5400 \text{ hours}
$$

**Step 4 — compare.** The gap is $5400 - 2496 = 2904$ hours, and $2496 / 5400 \approx 0.46$. So the self-study reader has put in a bit under half the conventional effort behind a bachelor's degree.

**Sanity check.** Twelve hours a week is well under a full-time student's roughly $15 \times 3 = 45$ hours a week, so landing below half the degree's total is what we should expect.

The honest conclusion is not "the hours don't matter" — 2,496 hours is a serious, real number. It is that even a reader who put in the full 5,400 hours through self-study alone would *still* not hold a credential. The gap was never mainly about the hour count. It is about who verified the work, and self-study, however much of it, has no verifying third party behind it.
:::

::: example The same portfolio, read at two different moments
A candidate has three substantial independent projects — a 6-DOF simulator, a state estimator, and a written-up guidance-law derivation — and no degree. They apply to a GNC Engineer Level I to II posting whose basic qualifications list a bachelor's degree with no in-lieu clause.

**Moment one: the recruiter-stage filter.** The portfolio is never read. The resume fails the printed line before any technical reviewer sees it, exactly as the previous lesson described.

**Moment two, years later.** The same candidate finishes an accredited degree part-time — the subject of the next lesson — and applies to a similar posting. This time the resume clears the basic qualifications and reaches a technical interviewer. The same three projects are now read in full. They become the specific thing that sets this candidate apart from other applicants who also cleared the degree line but have only coursework to show.

The projects did not change. Their value went from zero — built into the structure of the first stage — to decisive, built into the structure of the second. The only difference was which stage of the pipeline was looking at them.
:::

## Check yourself

::: check
A reader asks: "if I finish every module in this curriculum, will I be qualified for a GNC Engineer role?" Answer precisely, distinguishing the two different things "qualified" could mean.
:::

::: answer
If "qualified" means *able to do the technical work* — deriving the filters, writing the simulation code, reasoning about guidance and control — then yes: finishing the technical modules seriously builds real capability toward that. If "qualified" means *meeting a posting's basic qualifications*, which for most GNC Engineer roles include a specific bachelor's degree, then no. This curriculum has no authority to grant a degree, and finishing it does not change what a recruiter-stage filter checks a resume against. The two meanings need different things, and this curriculum supplies only one of them.
:::

::: check
Explain why a recruiter trusts a university's accreditation rather than personally evaluating each applicant's technical work.
:::

::: answer
A recruiter screening at volume has neither the time nor, usually, the specific technical expertise to judge the depth of every applicant's coursework or projects. Accreditation solves this: a trusted third party checks, once, that a program meets a defined standard across a defined curriculum, and every employer who trusts that accreditor inherits the result without repeating the check. That is what lets a degree work as a fast, cheap, reliable signal at exactly the stage where a detailed personal evaluation is not possible.
:::

::: check
A candidate has documented, working GNC-relevant projects representing roughly 2,000 hours of effort, and no degree. Is it accurate to say this candidate has "done the equivalent of a degree"? Explain what is right and wrong about that statement.
:::

::: answer
What is right: 2,000 hours is a serious, real amount of effort — about $2000 / 5400 \approx 0.37$, or a meaningful fraction, of the effort a degree conventionally represents. What is wrong: a degree is not defined by its hour count. It is defined by third-party verification against a standard, granted by an accredited institution. No number of self-directed hours performs that verification on its own. So the candidate has built real capability without building the credential, and the two are not interchangeable however large the hour count grows.
:::

::: check
Why does a demonstrated project carry close to no weight at a recruiter-stage basic-qualifications filter, but potentially decisive weight at a technical interview?
:::

::: answer
For a role with no in-lieu clause, the recruiter-stage filter is built specifically to avoid needing anyone's engineering judgment. It checks a resume against a printed line, and a project's quality is not something that check reads. A technical interview exists precisely to apply engineering judgment to candidates who already cleared the filter, and there a demonstrated project is exactly the kind of direct, inspectable evidence an interviewer can weigh. The same work is invisible to one stage's method and central to the other's.
:::

::: check
State, in one sentence, the honest boundary of what this curriculum can and cannot do, and explain why that boundary is a difference in kind rather than a difference in amount.
:::

::: answer
This curriculum builds real, demonstrated capability but cannot grant a credential. The boundary is one of kind because granting a credential needs the authority of an accredited institution checking you against a standard — a different act from teaching you the material, not a longer or more thorough version of teaching that eventually turns into verification. More lessons add capability; at no quantity do they create the third-party verification a credential stands for.
:::

## Summary

| Concept | What it is | Who it solves a problem for |
| --- | --- | --- |
| Credential | Third-party-verified record (degree, accreditation) | The recruiter, screening strangers at volume |
| Capability | The actual ability to do the work | The hiring manager or interviewer, once looking closely |
| This curriculum | Builds capability through demonstrated exercises | Cannot confer a credential — a different kind of act |
| Conventional bachelor's effort | On the order of 5,400 hours (120 credits × 45 hours) | A scale worth knowing honestly, not to be matched by hours alone |

The next three lessons take the three real paths in turn, starting with the one that pairs an accredited credential with everything this curriculum builds: the degree, taken in parallel rather than instead.

::: context kalman A filter that blends guesses
A **Kalman filter** is a recipe for estimating something you cannot measure perfectly — a spacecraft's position, say — by blending a prediction ("where physics says I should be") with a noisy measurement ("where the sensor says I am"). Its **covariance** is its running estimate of how unsure it is. The **extended** version handles curved, nonlinear physics. It flew on Apollo and is in nearly every navigation system today. This curriculum builds one from scratch in the estimation modules.
:::

::: context credential-word Where "credential" comes from
The word comes from the Latin *credere*, "to believe" — the same root as "credit" and "incredible." A credential is literally a thing that makes a stranger *believe* you. That is its whole job. It does not make you more skilled; it lets someone who has never met you trust a claim about you without checking it themselves.
:::

::: context abet Who ABET is
**ABET** is a US nonprofit that accredits college programs in engineering, engineering technology, computing, and applied and natural science. It began in 1932 under a different name. It accredits *programs*, not whole universities: a school's mechanical engineering degree might be ABET-accredited while its philosophy degree is not, because ABET does not cover philosophy. Many science and computer science programs are instead covered by their university's institution-wide accreditor, which is the normal route for those fields. The next lesson shows how to check.
:::

::: context trust-chain How trust passes along
Accreditation works like a relay. The employer never inspects your coursework; it trusts the accreditor, which already inspected the program, which already graded you.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <rect x="6" y="30" width="78" height="40" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="98" y="30" width="78" height="40" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="190" y="30" width="78" height="40" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="282" y="30" width="72" height="40" rx="6" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="45" y="54" font-size="12" text-anchor="middle" fill="#1f2a44">accreditor</text>
  <text x="137" y="54" font-size="12" text-anchor="middle" fill="#1f2a44">program</text>
  <text x="229" y="54" font-size="12" text-anchor="middle" fill="#1f2a44">your degree</text>
  <text x="318" y="54" font-size="12" text-anchor="middle" fill="#1f2a44">employer</text>
  <g stroke="#1f2a44" stroke-width="1.5"><line x1="84" y1="50" x2="96" y2="50"/><line x1="176" y1="50" x2="188" y2="50"/><line x1="268" y1="50" x2="280" y2="50"/></g>
  <text x="137" y="92" font-size="11" text-anchor="middle" fill="#6c7a93">checked once</text>
  <text x="318" y="92" font-size="11" text-anchor="middle" fill="#6c7a93">trusts, no re-check</text>
</svg>
```

A self-study portfolio has no links on the left of this chain, which is why the employer has to check it by hand.
:::

::: context portfolio What goes in a portfolio
For a software or GNC engineer, a **portfolio** is usually a set of public code repositories — often on GitHub — each with a short write-up: what the project does, how you tested it, what went wrong and how you fixed it, and a few plots of results. A good one lets a busy engineer understand a project in five minutes and check it in thirty. Later modules in this curriculum produce exactly these pieces.
:::

::: context unit-tests Small checks that run themselves
A **unit test** is a tiny program that checks one piece of your code against an answer you already know — for example, "an integrator given zero force should leave the velocity unchanged." You run hundreds of them every time you change anything. If one fails, you broke something. Professional GNC teams will not accept code without them, which is why a portfolio with tests reads as real engineering.
:::

::: context licensing Another credential you may hear about
Some US engineers also hold a **Professional Engineer (PE) license**, granted by a state licensing board after a degree, exams and supervised experience. It is required for engineers who sign off on things like public bridges and buildings. Aerospace companies designing their own vehicles generally do not require it for GNC work. It is mentioned here only as another example of a credential that only an authorized body can grant.
:::

::: context credit-hour The hours behind the degree
The "one hour in class plus two outside, per credit, per week" rule comes from US federal and accreditor definitions of a credit hour. Laid side by side, the example's two totals look like this.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="40" y="20" width="300" height="26" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="40" y="66" width="139" height="26" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="190" y="38" font-size="12" text-anchor="middle" fill="#1f2a44">degree: 120 × 45 = 5,400 h</text>
  <text x="186" y="84" font-size="12" fill="#1f2a44">self-study: 2,496 h (46%)</text>
  <line x1="40" y1="12" x2="40" y2="104" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="40" y="116" font-size="11" text-anchor="middle" fill="#6c7a93">0</text>
</svg>
```

The bars are drawn to scale. Even a bar stretched all the way to the top one would still carry no accreditor's check.
:::
