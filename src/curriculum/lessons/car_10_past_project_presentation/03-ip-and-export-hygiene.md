---
id: l03-ip-and-export-hygiene
title: "What is yours to present, and what is not"
minutes: 20
covers:
  - "intellectual property and export-control hygiene about a previous employer’s work"
---

Suppose a friend lets you read her diary, and later someone at school asks what is in it. The stories are interesting, and you remember them well. You still do not get to share them. Remembering something is not the same as owning it.

Work you did for a past employer can be like that diary. Before your list of five topics is submitted, one more check has to run over it, and it is not a check on quality. Every entry has to be yours to describe, in full, to a room of five to ten engineers you have never met, who work for a different company. A topic can be excellent, fully defensible, and the best thing you ever built — and still fail this check. Then it does not go on the list. The repair is to present the **public-ground equivalent** instead: the same skill, rebuilt on material anyone may see.

This lesson is about that check. It is narrower than the portfolio module's lesson on licensing and a previous employer's **[[intellectual property|ip-word]]** (IP, said "I-P" — ideas and work that belong to someone, the way a house does). That lesson covers what you can *publish*. The question here is what you can *say*, out loud, under questioning, to a panel whose members you do not choose. That turns out to be the harder case, for reasons worth understanding rather than memorizing.

Nothing here is legal advice, and none of it replaces reading your own employment agreement or, when the stakes are real, asking a lawyer. What it gives you is the shape of the problem, clearly enough to notice when you are inside one.

## Two obligations, from two different bodies of law

People mix these two up all the time, and they behave differently. Keep them apart.

**Confidentiality and invention assignment.** Most engineering employment agreements do two things. They **[[assign|invention-assignment]]** the work you create as part of your job to the employer — it becomes theirs. And they bind you to keep the company's non-public information secret, usually for a long time after you leave. This is **contract law**: a deal between you and a company. It does not depend on whether the work was exciting, and it does not care that you personally wrote every line.

**Export control.** The export-control module of this track covers this in full. Under **[[ITAR|itar-said]]** (said "eye-tar", the International Traffic in Arms Regulations), **technical data** about the design, development, testing or modification of a controlled item is itself controlled. That includes **[[Category IV|usml-categories]]** launch vehicles and missiles, and Category XV spacecraft. It does not matter what form the data takes. A derivation on a whiteboard, a source file, a plot, a spoken explanation — all of it is technical data if it is about the right subject. This is **federal law**, and it applies whether or not any company ever told you about it.

The two are **independent**, meaning either one can apply without the other.

- Work can be **proprietary** (the company's secret) but not controlled. Then only the first obligation bites.
- It can be controlled but not especially secret. Then the second one bites.
- And a great deal of interesting GNC work done at an aerospace employer is **[[both|two-by-two]]**.

::: key
Never present proprietary or controlled work from a previous employer. Choose topics you are free to describe in full to a room of outside engineers — which is one more reason to build portfolio projects on public data and open problems.
:::

## Why a talk is a harder case than a repository

A **repository** — a shared online folder of code, often called a repo — is read by one reviewer at a time. Everything in it was written on purpose, in advance, with time to think. A presentation is neither of those things.

**First, the audience.** Five to ten engineers, working for a different company, whose names and backgrounds you do not know in advance. If any part of what you present is controlled technical data, showing or telling it to a **foreign person** — someone who is not a US citizen or national, a lawful permanent resident, a refugee or an asylee — counts as exporting it to that person's country. That is true even in a conference room in California. It is called a **[[deemed export|deemed-export]]**, and the export-control module covers it. You cannot judge the makeup of a panel you have not met, and you should not have to.

**Second, the format.** Your slides can be checked line by line before the day. The questioning cannot. And the natural pull under a good technical question is to get *more* specific — to reach for the actual number, the actual failure, the actual part name. That is exactly the wrong direction if the subject is restricted. A talk you cleaned carefully can be undone by one honest, generous answer twenty minutes later.

**Third — and candidates underweight this — the panel does not want it.** An interviewer handed a former employer's secret data has been given something they have no permission to receive and no use for. Whether or not anyone in the room thinks in these terms, the conclusion is available to them. How you handle someone else's confidential information is the only direct evidence they have of how you would handle theirs.

::: warning
If a panel keeps pressing after a clear decline — and a competent one will not — holding the line is the right answer, and it costs you nothing. The alternative is worse than an awkward five seconds. A candidate who can be talked out of a confidentiality obligation by mild social pressure in an interview has shown exactly how that obligation will hold up later.
:::

## The rule that settles almost every case

**Present only what you would publish.** If you would not put the entire deck, backup slides included, on a public website under your own name, it does not belong in the round.

That rule sounds strict, but it is actually freeing, because the repair is well understood. It is not a clever way to present restricted work. It is to **rebuild the skill on public ground**: a fresh implementation of the same technique, using public specifications or openly available data, with your own verification evidence behind it. The specific piece of work does not transfer. The skill does. And, as the portfolio module argues, the rebuilt version is often the *stronger* interview piece anyway. Everything in it is plainly yours, so the question "what was your actual contribution?" disappears.

This also answers a question candidates ask about their own careers: if my most interesting work cannot be presented, was it wasted? No. But it cannot be a submission topic.

- In **behavioral** or experience rounds — interviews about how you work — you can usually discuss the *shape* of a hard problem: the kind of difficulty, the kind of tradeoff, what you learned. No specifics needed.
- This round needs something different: a piece of work a panel can dig into in technical depth for half an hour. Shape without substance does not survive that. That is exactly why the public-ground version has to be built ahead of time, not made up on the day.

::: example The check, run over a five-entry list
For each entry, ask four questions. Who owns the code? Who owns the data? Is the subject the design or testing of a controlled item? Would you put the whole deck on a public site under your own name?

| Entry | Code | Data | Controlled subject? | Verdict |
| --- | --- | --- | --- | --- |
| 6-DOF ascent simulation, layered atmosphere, dispersion campaign | Hers | Standard-atmosphere model, representative vehicle parameters she chose | Generic vehicle, public physics | Present |
| Powered-descent guidance with landing-accuracy Monte Carlo | Hers | Self-generated from a published formulation | Open problem, published method | Present |
| Quaternion EKF with NEES and NIS | Hers | Simulated from published sensor specifications | No | Present |
| Batch orbit determination | Hers | Public **[[TLE|tle]]**-derived positions | No | Present |
| Guidance loop rework at a previous defense employer | Employer's | Employer's | Yes, on both counts | Cut |

**Step 1 — the first four.** Each passes all four questions: her code, public or self-made data, public physics or published methods.

**Step 2 — the fifth.** It fails twice over: the employer owns the work, and the subject is a controlled item. Either failure alone is enough to cut it.

**Step 3 — the repair.** The repair is *not* a cleaned-up version with the numbers changed. A cleaned-up description of a controlled system's design is still a description of that system. The repair is that the first four entries already show the same competencies on public ground. If the cut really leaves a slot empty, the previous lesson's routes — the failure talk, or splitting a project along a real boundary — fill it without touching restricted material.

**Check it makes sense.** Five entries in, four out, and the list lost no competency it needed.
:::

## Declining mid-answer, without sounding evasive

The scripted part is easy. The unscripted part needs a sentence you have already said out loud, because making one up under pressure is how people overshare.

::: example A question that pulls toward restricted ground
The candidate is presenting her quaternion EKF. A panel member has heard she worked in flight software at a defense contractor, and asks: "You mentioned you saw something like this in industry. What were the actual **[[gyro bias stability|gyro-bias]]** numbers on the unit you flew?"

**Weak answer one — overshare.** She gives the number, adding that it is "probably fine to say." It is not fine. It cannot be unsaid. And she has just shown the exact behavior a future employer would least want aimed at its own data.

**Weak answer two — the wall.** "I can't talk about that." True, correct — and it ends the thread dead. The panel learns nothing technical, the moment is awkward, and the natural reading is that the whole area is off limits, including the parts that are not.

**Strong answer.** "That unit's numbers are my former employer's, so I am going to leave them out. The mechanism is public, and I can go straight at it. Turn-on bias repeatability enters my filter as a starting value for the bias state, not as a noise density. So it sets how long the star tracker takes to pull the bias in, not the steady-state error. In my own project I sized that directly. With a star-tracker noise of $5\times10^{-5}\,\mathrm{rad}$ per axis, a constant bias shows up in the attitude residual once it has built up to that level. So over a $100\,\mathrm{s}$ window, anything above about $5\times10^{-7}\,\mathrm{rad/s}$ — roughly $0.10\,^\circ/\mathrm{hr}$ — shows up. Those numbers are mine, and I am happy to go deeper on them."

**Decoding the jargon.** **Turn-on bias repeatability** is how much a gyro's false turning rate changes each time it is switched on. A **noise density** describes random jitter that never goes away. The **attitude residual** is the leftover gap between the angle the star tracker sees and the angle the filter expected.

**Check her arithmetic.** A constant drift rate $b$ builds an angle error of $b \times t$. Setting $b \times 100\,\mathrm{s} = 5\times10^{-5}\,\mathrm{rad}$ gives

$$
b = \frac{5\times10^{-5}\,\mathrm{rad}}{100\,\mathrm{s}} = 5\times10^{-7}\,\mathrm{rad/s}.
$$

To convert to degrees per hour, multiply by $\frac{180}{\pi}$ degrees per radian and by $3600$ seconds per hour:

$$
5\times10^{-7} \times 57.30 \times 3600 \approx 0.103\,^\circ/\mathrm{hr}.
$$

That rounds to her $0.10\,^\circ/\mathrm{hr}$.

**What separates them.** The strong answer declines one single fact and keeps the technical content. Then it immediately offers an equivalent question it can answer in full, with numbers that belong to her. It takes about fifteen seconds longer than the wall and leaves the panel with more, not less. Rehearse the first clause until it is automatic: say whose it is, say you are leaving it out, and move straight to the version you own.
:::

## Where to go for the real answer

This lesson tells you *when* you are in the problem, not how it turns out for your exact situation.

- For the first obligation, your **employment agreement** is the document that governs it. Re-read it before you draft the list, not after.
- For the second, the **[[Directorate of Defense Trade Controls|ddtc]]** (DDTC, part of the US State Department) publishes the regulations and guidance. The export-control module of this track covers what counts as technical data, who counts as a foreign person, and why a release inside the United States can still be an export.
- Where the stakes are real — a truly unclear case about work you would very much like to present — ask a lawyer before, not after.

## Check yourself

::: check
Name the two separate obligations that can make earlier work unpresentable, and give an example of work blocked by one but not the other.
:::

::: answer
The first is **contractual**: confidentiality and invention assignment under an employment agreement, which hands work product to the employer and limits disclosure of its non-public information. The second is **statutory** (set by law): export control, under which technical data about the design, development, testing or modification of a controlled item is restricted in any medium.

Blocked by only the first: a proprietary but completely uncontrolled internal tool — a company's commercial data-processing pipeline, say. You may not disclose it, but no export rule touches it.

Blocked by only the second: analysis of a controlled system that you own outright but still cannot freely release to a foreign person.
:::

::: check
Why is a presentation a harder case for this check than a public repository, even when the technical content is identical?
:::

::: answer
Three reasons.

- **The audience.** Five to ten engineers whose makeup you do not know in advance, and releasing controlled technical data to a foreign person counts as an export even inside the United States.
- **The format.** It includes unscripted questioning, which cannot be reviewed ahead of time, and the natural pull under a good question is to get more specific, not less.
- **The judgment signal.** The material reaches people who have no permission to receive another company's proprietary data and no use for it. So offering it is a signal about your judgment, as well as a legal problem.
:::

::: check
A candidate plans to present a previous employer's guidance work "with the numbers changed and the vehicle anonymized." Explain why this does not solve the problem.
:::

::: answer
The control and the confidentiality duty attach to the technical content — the design, the method, the testing approach — not to the labels on it. A description of how a controlled item's guidance was designed is still a description of that item's design after its name is removed. The underlying architecture often reveals more than the numbers anyway.

Anonymizing also does nothing about the questioning, where the panel's follow-ups will push straight toward the specifics that were removed. The solution is a rebuilt public-ground equivalent, not a redacted original.
:::

::: check
Give the three-part structure of a strong mid-answer decline, and explain why the bare refusal is weaker even though it is just as correct.
:::

::: answer
Say whose information it is. Say plainly that you are leaving it out. Then move straight to the equivalent question you can answer in full, with numbers that are yours — and answer it properly rather than waving at it.

The bare refusal is legally the same and informationally empty. It ends the thread, teaches the panel nothing technical, and suggests the whole area is off limits when usually only one fact is. The three-part version costs about fifteen seconds more, leaves the panel with a real answer, and shows the same discipline.
:::

::: check
This round needs a piece of work that can be questioned in technical depth. What does that mean for work you can describe only in shape — the kind of problem, the kind of tradeoff — without specifics?
:::

::: answer
It means such work cannot be a submission topic, however substantial it was. Describing the shape is usually fine in behavioral or experience rounds, where the question is what you learned and how you work. It cannot survive thirty minutes of technical questioning, because every follow-up asks for exactly the specific thing that was removed.

That is the concrete reason to build the public-ground equivalent in advance, instead of assuming the experience itself will carry the round.
:::

## Summary

| Item | Statement |
| --- | --- |
| Obligation one | Confidentiality and invention assignment — contract law, usually continuing after you leave |
| Obligation two | Export control — technical data on a controlled item's design, development, testing or modification, in any medium |
| Why a talk is harder | Unknown audience, deemed exports, unscripted questioning, and a panel that does not want the data |
| The rule | Present only what you would publish under your own name, backup slides included |
| The repair | Rebuild the skill on public ground; the piece of work does not transfer, the skill does |
| Mid-answer decline | Say whose it is, say you are leaving it out, move to the equivalent question you own — and answer that one properly |
| Not covered here | Your specific facts; read your agreement, check DDTC guidance, ask a lawyer where it matters |

With the list checked for defensibility and cleared for disclosure, the next lesson builds the talk itself: seven parts, and how much of a fifteen-minute clock each one gets.

::: context ip-word Property you cannot touch
We are used to property being things: a bike, a house. **Intellectual property** is property made of ideas — inventions, designs, software, writing. "Intellectual" means "of the mind." Laws and contracts let people and companies own these the way they own objects: patents for inventions, copyright for writing and code, and **trade secrets** for useful information a company keeps private. A trade secret stays protected only as long as it stays secret, which is why companies care so much about what former employees say.
:::

::: context invention-assignment Signing your work over on day one
On your first day at most engineering jobs you sign a stack of papers. One of them usually says that inventions and work you create as part of the job belong to the company, not you. This is **invention assignment** — "assign" here means to transfer ownership. It is normal and fair: the company paid for your time and tools. The practical result is that code you wrote there is not yours to show, even though every line came from your head and hands.
:::

::: context itar-said A rulebook for weapons, and for rockets
**ITAR** is a set of US regulations about sending military items and information out of the country. Rockets fall under it because the technology that puts a satellite in orbit is close to the technology that guides a missile. The track's first career module, on the ITAR gate, explains in detail who counts as a US person and why it shapes hiring at companies like SpaceX. For this lesson, the key point is that ITAR covers information, not only hardware.
:::

::: context usml-categories What "Category IV" and "Category XV" are
ITAR lists what it controls in the **United States Munitions List**, split into numbered categories, written in Roman numerals. Two matter most to GNC engineers:

- **Category IV** — launch vehicles, guided missiles, ballistic missiles, rockets and related items.
- **Category XV** — spacecraft and related items.

If your old work helped design or test something in one of these categories, the technical data behind it is very likely controlled. Roman numerals read: IV is four, XV is fifteen.
:::

::: context two-by-two Two questions, four boxes
Ask two yes-or-no questions about a piece of past work: is it the company's secret, and is it export-controlled? That gives four boxes. Only one of them is safe to present.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="165" y="18">not controlled</text>
    <text x="290" y="18">controlled</text>
    <text x="52" y="68">not secret</text>
    <text x="52" y="143">company secret</text>
  </g>
  <rect x="105" y="30" width="120" height="70" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="230" y="30" width="120" height="70" fill="#fff" stroke="#b4232c" stroke-width="1.5"/>
  <rect x="105" y="105" width="120" height="70" fill="#fff" stroke="#b4232c" stroke-width="1.5"/>
  <rect x="230" y="105" width="120" height="70" fill="#f2b880" stroke="#b4232c" stroke-width="1.5"/>
  <g font-size="12" text-anchor="middle">
    <text x="165" y="62" fill="#1f2a44">free to present</text>
    <text x="165" y="78" fill="#6c7a93">if it is yours</text>
    <text x="290" y="62" fill="#b4232c">blocked by</text>
    <text x="290" y="78" fill="#b4232c">export law</text>
    <text x="165" y="137" fill="#b4232c">blocked by</text>
    <text x="165" y="153" fill="#b4232c">your contract</text>
    <text x="290" y="137" fill="#b4232c">blocked</text>
    <text x="290" y="153" fill="#b4232c">twice over</text>
  </g>
</svg>
```

The guidance-loop entry in the example sits in the bottom-right box.
:::

::: context deemed-export Exported without leaving the room
The data never crosses a border, yet the law treats it as if it did. Telling controlled technical data to a foreign person counts as an export to every country where that person holds, or has held, citizenship or permanent residency.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="12" y="45" width="130" height="60" rx="8" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="77" y="70" font-size="12" fill="#1f2a44" text-anchor="middle">you explain it in a</text>
  <text x="77" y="86" font-size="12" fill="#1f2a44" text-anchor="middle">California room</text>
  <line x1="142" y1="62" x2="226" y2="36" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="232,34 220,33 224,43" fill="#1f2a44"/>
  <line x1="142" y1="88" x2="226" y2="114" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="232,116 224,107 220,117" fill="#1f2a44"/>
  <rect x="234" y="14" width="114" height="40" rx="8" fill="#fff" stroke="#b4232c" stroke-width="1.5"/>
  <text x="291" y="38" font-size="12" fill="#b4232c" text-anchor="middle">country of birth</text>
  <rect x="234" y="96" width="114" height="40" rx="8" fill="#fff" stroke="#b4232c" stroke-width="1.5"/>
  <text x="291" y="120" font-size="12" fill="#b4232c" text-anchor="middle">later citizenship</text>
</svg>
```

That is why you cannot "fix" the problem by checking where the listener is standing.
:::

::: context tle Orbits anyone can download
A **TLE**, or two-line element set, is a short block of text — two lines of numbers — that describes a satellite's orbit at one moment. The US Space Force tracks thousands of objects and publishes TLEs for most of them; websites such as CelesTrak share them freely. Because they are public, an orbit-determination project built on TLE-derived positions is safe to present anywhere. That makes TLEs a classic example of "public ground".
:::

::: context gyro-bias How a small drift becomes a visible error
A gyro measures turning rate, and every real gyro has a small **bias**: it reports a little turning even when sitting still. **Bias stability** says how steady that false rate is. A constant bias $b$ makes the angle error grow in a straight line, $b\,t$. The star tracker can see the error once it rises above its own noise.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="140" x2="340" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="140" x2="40" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="70" x2="340" y2="70" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <text x="336" y="63" font-size="11" fill="#6c7a93" text-anchor="end">tracker noise 5 × 10⁻⁵ rad</text>
  <line x1="40" y1="140" x2="280" y2="28" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="132" y="112" font-size="11" fill="#1d6fd1">error = b t</text>
  <line x1="190" y1="140" x2="190" y2="70" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="3 3"/>
  <circle cx="190" cy="70" r="4" fill="#b4232c"/>
  <text x="190" y="157" font-size="11" fill="#b4232c" text-anchor="middle">100 s</text>
  <text x="340" y="157" font-size="11" fill="#1f2a44" text-anchor="end">time</text>
  <text x="46" y="24" font-size="11" fill="#1f2a44">angle error</text>
</svg>
```

For $b = 5\times10^{-7}\,\mathrm{rad/s}$ the line crosses the noise at $100\,\mathrm{s}$.
:::

::: context ddtc The office behind the rules
The **Directorate of Defense Trade Controls** is the office inside the US State Department that runs ITAR. It registers companies that make defense items, decides license requests, and publishes the rules and guidance on its website. Individual engineers rarely deal with it directly; a company's export-compliance team usually does. But its published guidance is the place to start when you want to understand the rules rather than guess at them.
:::
