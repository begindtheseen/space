---
id: l09-community-and-conferences
title: "Community and conferences: building the presence a referral needs"
minutes: 17
covers:
  - "community and conferences: AIAA and AAS Space Flight Mechanics, SmallSat, university seminars, open-source contribution"
---

The previous lesson ended on a specific, honest problem: the strongest referral request works when the person you are asking already has independent evidence of your work, and that evidence has to exist before the ask, not be assembled in the moment you need it. This lesson is about where that evidence actually gets built. There is no shortcut to a network you were not born or employed into — but there is an honest, concrete path, and it runs through the same venues where GNC engineers are actually present: a handful of technical societies and conferences, university seminars, and open-source projects in the field.

None of these require an existing industry contact to begin. All of them reward sustained, real participation over performance or volume, and none of them are a trick — they are the places where showing up, over time, with real technical substance, produces the kind of visibility a cold message never can.

## AIAA and AAS Space Flight Mechanics

The American Institute of Aeronautics and Astronautics and the AAS Space Flight Mechanics meetings are technical societies and conference series where a meaningful share of published GNC and astrodynamics work is presented. Membership in a society like this is typically a paid commitment, but a large share of what actually matters to you at this stage — technical programs, session listings, and often the abstracts or papers themselves — is commonly free to browse without joining anything. That alone is worth using: reading real, current technical programs shows you what problems the field is actively working on, in the field's own vocabulary, which is useful independent of whether you ever attend a session in person.

Specific membership tiers, pricing, and formats change over time and are best confirmed directly on the society's own site rather than assumed from this lesson. What does not change is the underlying opportunity: if attending a session, in person or remotely, is within reach for you, it puts you in a room with people whose published work you can read beforehand, which makes a specific, prepared question possible in a way a cold message never allows. Some meetings include sessions or competitions aimed specifically at students; whether one exists in a given year, and what its requirements are, is worth checking against that year's actual call rather than assuming a fixed format.

## SmallSat: the Small Satellite Conference

The Small Satellite Conference is a major annual venue where a substantial amount of applied, hands-on smallsat GNC and attitude-control work gets presented — often closer to the scale and constraints of a self-directed portfolio project than a large flagship program would be. Like most established technical conferences, a meaningful body of past papers is generally made available through some form of open or archived access, which means attendance is not the only way to extract value from it.

Reading papers close to your own anchor projects is a genuinely useful activity in its own right, independent of any networking purpose: it shows you how researchers working on problems similar to yours describe their own verification and validation approach, which directly informs the same discipline this curriculum's portfolio work already asks of you. A candidate who has read several real smallsat ADCS papers closely writes a more credible verification section for her own project than one who has not, entirely apart from anything to do with meeting people.

::: key
Browsing a conference's technical program and reading its papers is commonly available even when attending in person is not, and it is worth doing for its own sake — it shows you the field's current problems in its own vocabulary and gives you real examples of how others verify and validate similar work.
:::

## University seminars

Many university department seminar series are open to outside attendees, and a number are livestreamed or recorded, which means attending one does not require being enrolled anywhere. This is a genuinely low-cost, repeatable option: find a research group working on something adjacent to your own interests, watch a talk, and prepare one specific, substantive question tied to something the speaker actually said.

Asking a real question at the end of a talk — not a comment, a question — is a small, low-pressure way to become a specific, remembered person to a specific research group, rather than an anonymous attendee. It requires no pre-existing connection at all, only genuine preparation: having actually understood enough of the talk to ask something that shows you were following the argument, not merely present in the room.

::: example A prepared question, and a generic comment, after the same talk
Generic: "Great talk, really interesting work!" This is a pleasant thing to say and is forgotten within the hour, because it contains nothing specific to what was actually presented.

Prepared: "You mentioned the filter's covariance grew unexpectedly during the eclipse period — was that traced to the star-tracker dropout, or to the propagated process noise during that interval?" This question is only possible to ask if the listener genuinely followed the technical content, references a specific moment in the talk, and gives the speaker something real to respond to. It is also the kind of question a speaker remembers afterward, because it demonstrates real engagement rather than polite attendance.
:::

::: key
A prepared, specific question tied to what a speaker actually said requires no prior connection to ask, and it is a repeatable way to become a remembered person to a specific research group rather than an anonymous attendee.
:::

## Open-source contribution

Of every option in this lesson, contributing real work to an existing open-source astrodynamics, estimation, or controls project carries the highest signal for the least cost — no travel, no membership, no scheduling around a talk. It also connects directly to the reproducibility discipline this curriculum's portfolio work already builds: a project that is seeded, pinned, and tested with continuous integration is also a project positioned to accept and validate an outside contribution cleanly, which is exactly what a maintainer needs to trust a pull request from someone they do not already know.

The distinction that matters here is between a substantive contribution and a low-effort one, and maintainers — along with anyone who later reads the closed pull request — can usually tell the difference immediately. A single-word documentation fix or a whitespace change is real, but it demonstrates almost nothing about technical capability. A pull request that fixes a genuine numerical bug, includes a regression test that would have caught it, and briefly explains how the bug was found is a durable, public, third-party-reviewed record that someone can independently verify without taking your word for anything — which is precisely the kind of evidence lesson eight described as the foundation a strong referral request eventually stands on.

::: warning Low-effort contribution does not build the record you need
A trivial pull request — a typo fix, a formatting change with no substance behind it — costs little effort and buys correspondingly little credibility. It is not equivalent, in what it demonstrates, to a contribution that finds and fixes a real problem with a test attached, even though both technically count as "a merged pull request."
:::

::: example Two pull requests to the same open-source library
The first pull request corrects a single misspelled word in a README file. It is real, it is welcome, and a maintainer merges it within minutes — and it demonstrates essentially nothing about the contributor's technical ability, because there was none required to make it.

The second pull request fixes a numerical bug in a coordinate-transformation function that silently produced incorrect results for a specific edge case, includes a new regression test that fails on the old code and passes on the fix, and a short write-up in the pull request description explaining how the bug was found — by comparing output against an independent reference case during the contributor's own portfolio work. A maintainer reviewing this sees evidence of real debugging skill, an understanding of the underlying mathematics, and the same verification discipline this curriculum teaches elsewhere. Anyone who later reads the closed, merged pull request — including, eventually, someone deciding whether to extend a referral — sees the same evidence, independently of anything the contributor claims about herself.
:::

## What this actually buys, and what it does not

None of this guarantees an interview or an offer, and it would be dishonest to claim otherwise — the previous lesson was explicit that even a strong referral only changes how attentively an application gets read, not whether it meets a stated requirement. What sustained, real participation in these venues actually buys is two things, and both are genuine: real technical growth, from engaging with people and problems more advanced than what you would encounter working alone, and becoming a known, independently checkable quantity to specific people over time. That second outcome is what eventually makes a referral request land somewhere a cold one would not — not because the request itself was cleverly worded, but because the person receiving it already has real evidence, formed before you ever asked, that the request is worth acting on.

## Check yourself

::: check
A candidate cannot afford to attend a technical conference in person. Explain why browsing its technical program is still worth her time.
:::

::: answer
Technical programs and, often, the papers or abstracts themselves are commonly available to browse even when attendance requires payment or travel. Reading them shows what problems the field is actively working on, in the field's own current vocabulary, and — for a conference like SmallSat with applied, project-scale work — gives real examples of how others verify and validate work similar to her own, which is useful independent of ever attending a session in person.
:::

::: check
Why is a university seminar a realistic access point for a self-taught candidate with no institutional affiliation, when many other academic resources assume enrollment?
:::

::: answer
Many department seminar series are open to outside attendees or livestreamed, which means attending does not require being enrolled or affiliated with the university at all. The only real requirement is preparation — understanding the talk well enough to ask a specific, substantive question at the end — which depends on effort rather than on institutional status, making it accessible regardless of a candidate's formal academic standing.
:::

::: check
Contrast a substantive open-source contribution with a low-effort one, and explain why a stranger evaluating a candidate's work later would weigh them differently.
:::

::: answer
A substantive contribution — fixing a genuine bug, adding a regression test, explaining how the problem was found — demonstrates real debugging skill, technical understanding, and the same verification discipline a strong portfolio project requires. A low-effort contribution, such as a typo fix, requires little technical skill and demonstrates correspondingly little, even though both are technically merged pull requests. A stranger reviewing the closed pull request later can see this difference directly in what the change actually involved, independent of anything the contributor says about herself.
:::

::: check
This lesson states plainly that community involvement and conference attendance do not guarantee an interview or an offer. What do they actually provide instead?
:::

::: answer
They provide real technical growth from engaging with people and problems beyond what solitary work alone produces, and they build a track record of being a known, independently checkable quantity to specific people over time. That second outcome is what eventually makes a referral request effective — not because it guarantees any specific hiring outcome, but because it gives someone real, pre-existing evidence to act on when the request is eventually made.
:::

::: check
Explain why open-source contribution is described in this lesson as connecting directly back to the reproducibility work built earlier in this curriculum's portfolio material.
:::

::: answer
A project that is seeded, has pinned dependencies, and runs its verification suite through continuous integration is also a project structured so that an outside contribution can be reviewed and trusted cleanly — a maintainer can see immediately whether a pull request passes the existing tests and preserves the project's verified behavior. The same discipline that makes a portfolio project defensible to a hiring panel is what makes it possible for a stranger's contribution to that project, or to someone else's project built the same way, to be evaluated fairly and taken seriously.
:::

## Summary

| Venue | Realistic access point without existing contacts | What it actually builds |
| --- | --- | --- |
| AIAA / AAS Space Flight Mechanics | Browse technical programs and abstracts freely; attend a session if feasible | Field vocabulary and current problems; a room with people whose work you can question |
| SmallSat | Browse past papers, often openly archived | Applied, project-scale examples close to your own anchor work |
| University seminars | Attend open or livestreamed talks; ask one prepared question | Being a specific, remembered person to a specific research group |
| Open-source contribution | A substantive pull request to an existing project | A durable, third-party-reviewable record of real technical capability |

The next lesson covers the two remaining tools for someone actively searching: reaching out directly on LinkedIn, and knowing what has to genuinely change before reapplying to a company that has already said no once.
