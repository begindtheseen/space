---
id: l04-deemed-exports
title: "Deemed exports: why being in the room does not cure it"
minutes: 18
covers:
  - deemed exports: why physical location does not cure the problem
---

Two ideas from earlier lessons are about to combine into a rule that closes off every workaround a clever reader might otherwise imagine. The first idea is that technical data — a derivation, a piece of source code, a design memo — is the controlled thing, not the hardware (lesson one). The second is that a foreign person is, precisely, anyone who does not hold one of the four U.S.-person statuses (lesson two). Put them together and ask a direct question: what happens when technical data reaches a foreign person, but nothing physical ever crosses a border — the data stays on a server in California, the meeting happens in a conference room in Hawthorne, the foreign person sits at the next desk? The regulation has a precise answer, and it is not the one people hope for.

## The definition of "export" reaches disclosure, not only shipment

ITAR's definition of "export," at 22 CFR § 120.50, lists several acts that count as exporting — sending a defense article out of the United States, transferring registration or control of a defense article to a foreign person, and, critically, "releasing or otherwise transferring technical data to a foreign person in the United States." The regulation itself gives this act a name in parentheses: **a deemed export**. It is not an informal industry nickname bolted on afterward — the text of the rule uses the term directly, because the release is treated exactly as though the information had been physically shipped to that person's country, even though it never left the building.

The geographic reach of this rule is worth stating precisely: any release of technical data to a foreign person inside the United States is deemed to be an export to every country in which that person holds or has held citizenship or permanent residency. A foreign person's location at the moment of disclosure is irrelevant. What matters is who they are, in the specific sense defined at 22 CFR § 120.63 — a foreign person is anyone who is not a U.S. person, which by now you can define precisely from the previous two lessons: not a citizen or national, not a lawful permanent resident, not a refugee under § 1157, not an asylee under § 1158, and not otherwise authorized.

"Release" is defined broadly enough to include almost any way information moves from one mind, or one system, to another. Visual disclosure — showing a drawing, a screen, a whiteboard sketch. Oral disclosure — explaining an algorithm in a meeting, answering a question in a hallway, presenting at a conference. Electronic transfer — an email, a shared repository, a document placed on a server a foreign person can access. All of these are release. None of them require anything to be mailed, shipped, or carried across a border. The rule was written this way because information does not need a courier.

::: key
22 CFR § 120.50 defines "export" to include releasing or transferring technical data to a foreign person in the United States — a deemed export — treated as an export to every country of that person's citizenship or permanent residency. Release includes oral, visual, and electronic disclosure, not only physical transfer.
:::

## Why physical location genuinely does not solve it

Two intuitions people reach for both fail against this rule, and it is worth seeing exactly why each one fails rather than being told that it does.

The first intuition: "the hardware and the data stay in the United States, so nothing is being exported." This gets the controlled act backwards. The export happens at the moment of release to a foreign person, wherever that release occurs. A foreign national sitting in a Hawthorne office, badge-accessed into the building, fully authorized to be a physical presence on site, is still a foreign person under the regulation. Showing that person a guidance algorithm's derivation in a meeting room is a release — an export — regardless of the fact that the meeting room is in California and the algorithm's printout never leaves it. The article does not need to move for the export to occur; the recipient's status is the trigger, not the item's geography.

The second intuition, and the one the module's own quiz specifically tests: "hire the person to work remotely, outside the United States, and the problem disappears." This is not merely unhelpful — it makes the situation more clearly an export, not less. If a foreign person located outside the United States is given access to controlled technical data by a U.S. company, that is a conventional export under the same regulation, with the added complexity of an actual cross-border transfer layered on top of the deemed-export concept. Remote work relocates the problem; it does not resolve it, because the controlled act was never about which office the data physically sat in. It was always about who receives it.

::: warning "Being careful" is not a compliance strategy
No amount of discretion — limiting what is said in front of a foreign colleague, being vague in a shared document, trusting someone's judgment not to repeat what they hear — satisfies the regulation, because the release itself is the controlled act, not the aftermath. A single unambiguous disclosure of controlled technical data to a foreign person, made in good faith and never repeated further, is still a release. This is why companies handling controlled programs build Technology Control Plans: formal, written, auditable restrictions on which specific employees may access which specific data, enforced through badge access, network permissions, and meeting invitations — not left to individual discretion in the moment.
:::

## What this rule does not reach

The deemed export rule is precise about what it controls, and it is worth being equally precise about what it leaves alone, so the rule does not curdle into an exaggerated fear of talking to anyone who is not American. It reaches technical data as defined in the first lesson of this module — information required for the design, development, production, testing, or modification of a defense article. It does not reach general engineering principles taught in any university course anywhere in the world, information already in the public domain, ordinary business conversation, or a colleague's general career advice. A foreign national engineer can be told that a company builds rockets, can discuss orbital mechanics as taught in any textbook, and can be a valued teammate on work that does not touch controlled technical data at all. What cannot happen is that same person being shown, told, or given access to the specific derivations, code, and analysis tied to a controlled vehicle's design — the thing lesson one defined technical data to be.

This is also why the rule does not depend on trust or intent. A company that fully trusts a specific foreign-person employee, and a foreign-person employee who has no intention of sharing anything with anyone, are both still inside the rule's reach the moment controlled technical data is released to them. The regulation is written around the structural fact of a release occurring, not around anyone's character or intentions, which is exactly why compliance in practice runs on formal access controls rather than on judgment calls made room by room.

::: example Four channels, checked for deemed export
A guidance team is finishing a design review. Four things happen in the same week.

A senior engineer, a U.S. citizen, explains the team's new entry-guidance approach to a colleague who is also a U.S. citizen, in a closed conference room. No foreign person is involved — not a deemed export, regardless of how sensitive the content is, because the recipient is a U.S. person.

The same engineer emails a design memo describing that approach to a teammate on an H-1B visa, copied on the thread because he sits on the same subsystem. The teammate is a foreign person under 22 CFR § 120.63 — an H-1B visa is not one of the four U.S.-person statuses. This is a release of technical data to a foreign person inside the United States: a deemed export, regardless of the fact that the email never left a U.S. mail server.

A different engineer gives a conference talk on general trajectory-optimization theory as taught in any graduate controls course, to an audience that includes several non-U.S. nationals. This is not a deemed export, because the content is a general engineering principle, excluded from the definition of technical data in the first place — the audience's citizenship is irrelevant when the content itself is not controlled.

A fourth engineer grants a foreign-person contractor read access to the full flight-software repository for the program, including the guidance and navigation modules, to help with an unrelated tooling task. This is a release of technical data to a foreign person — a deemed export — even though the access was granted for a narrower purpose and even though nothing was explained verbally; the repository access itself is the release.
:::

::: example Location moves, status does not — and the reverse
Contrast two scenarios that isolate exactly what the rule is tracking. In the first, a U.S. citizen engineer relocates temporarily to a partner facility in another country to support an integration campaign, and continues working with the same controlled technical data there. This is an export in the ordinary sense — technical data has left the United States — but the recipient is still a U.S. person, so no additional authorization beyond what already governs the program is triggered by that fact alone; a U.S. person does not become a foreign person by changing location.

In the second, a foreign-person engineer never leaves a U.S. office and is shown the identical technical data across a desk. Nothing physical crosses any border. The release still counts as a deemed export, because the rule tracks who received the information, not where the information or the person happened to be standing. Location changed everything in the first case and nothing in the second, which is exactly the point: the controlled act is the release to a foreign person, and geography is not the variable that determines whether that has happened.
:::

## Check yourself

::: check
A manager proposes solving a hiring gap by bringing on a highly qualified foreign-person candidate to work entirely from a secure U.S. facility, reasoning that since the data never leaves the building, no export occurs. What is wrong with this reasoning?
:::

::: answer
The reasoning assumes the controlled act is the data physically leaving the country, when the controlled act is actually the release of technical data to a foreign person, wherever that release happens. A foreign person working inside a secure U.S. facility is still a foreign person; showing them controlled technical data there is a deemed export under 22 CFR § 120.50, regardless of the fact that nothing physical crosses a border. Physical containment inside the building does not substitute for the recipient holding one of the four U.S.-person statuses or a specific authorization.
:::

::: check
Why does hiring a foreign person to work remotely from outside the United States fail to avoid the export-control problem — and arguably make it more clearly a problem?
:::

::: answer
The underlying issue was never about which office the data sat in; it is about who receives it. A foreign person outside the United States receiving controlled technical data from a U.S. company is a conventional export — the data has left U.S. jurisdiction into a foreign person's hands abroad — which is at least as clearly regulated as a deemed export, and adds an actual cross-border data transfer on top of it. Remote work changes the location of the problem without touching its cause.
:::

::: check
An engineer gives a public conference talk covering the general mathematics of optimal control, attended by engineers of many nationalities. A different engineer privately explains a specific vehicle's actual guidance-law tuning to one foreign-person colleague. Only one of these is a deemed export. Which, and why?
:::

::: answer
The private explanation of a specific vehicle's actual guidance-law tuning is the deemed export, because it is technical data under 22 CFR § 120.33 — information required for the design of a specific defense article — released to a foreign person. The public conference talk on general optimal-control mathematics is not, because that content falls under the definition's own exclusion for general scientific and engineering principles; the audience's nationalities are irrelevant when the material itself is not technical data in the first place. The distinction is about the content, not about which setting feels more public or more private.
:::

::: check
A company grants a foreign-person contractor repository access to a flight-software codebase for an unrelated, narrow task, without any spoken explanation of the controlled modules inside it. Has a deemed export occurred?
:::

::: answer
Yes, if the repository includes controlled technical data the contractor can now access, regardless of why the access was granted or whether anyone explained the content out loud. Release includes granting electronic access to technical data, not only verbal or written explanation. The narrowness of the intended task does not limit what was actually released; what matters is what the contractor is now able to see.
:::

::: check
Explain why the deemed export rule does not mean a company must avoid ever discussing its work with any non-U.S.-person employee.
:::

::: answer
The rule reaches technical data specifically — information required for the design, development, production, testing, or modification of a defense article — not all conversation involving the company's work in general. General engineering principles, information already in the public domain, and ordinary non-technical discussion fall outside the definition of technical data from the outset, so releasing them to a foreign person is not a deemed export. Companies manage this in practice with Technology Control Plans that scope exactly which data specific employees may access, rather than by excluding foreign-person colleagues from all communication.
:::

## Summary

| Term | Citation | Key point |
| --- | --- | --- |
| Export (deemed export) | 22 CFR § 120.50 | Releasing technical data to a foreign person in the US counts as an export |
| Foreign person | 22 CFR § 120.63 | Anyone who is not a U.S. person under § 120.62 |
| Geographic reach | — | Deemed an export to every country of that person's citizenship or permanent residency |
| Release | — | Oral, visual, or electronic disclosure; no physical transfer required |
| What is not reached | 22 CFR § 120.33 exclusions | General principles taught in schools; information already in the public domain |
| Practical control | — | Technology Control Plans restrict access by specific employee, not by discretion |

The next lesson leaves the legal mechanics behind and turns to the practical question every applicant actually faces first: where, exactly, in a real hiring process this gets confirmed, and how the question is asked.
