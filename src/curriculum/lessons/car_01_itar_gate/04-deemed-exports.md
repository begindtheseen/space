---
id: l04-deemed-exports
title: "Deemed exports: why being in the room does not cure it"
minutes: 18
covers:
  - deemed exports: why physical location does not cure the problem
---

Imagine a secret family recipe. Your grandmother has one rule: it never leaves the family. Now suppose a neighbor drops by, and you read the recipe out loud to them at the kitchen table. The paper never left the house. Did the recipe stay in the family? Of course not. The neighbor now knows it, and they can take it home in their head.

That is the whole idea of this lesson, and US export law works the same way. Two ideas from earlier lessons now combine. From lesson one: the thing ITAR (said "eye-tar") controls is not only hardware but **technical data** — a derivation, a piece of source code, a design memo. From lesson two: a **foreign person** is anyone who does not hold one of the four US-person statuses. Put them together and ask: what happens when technical data reaches a foreign person, but nothing physical ever crosses a border? The data stays on a server in California. The meeting happens in a conference room in Hawthorne. The foreign person sits at the next desk.

The regulation has an exact answer, and it is not the one people hope for. It closes every workaround a clever reader might dream up — and that is why, for a GNC engineer, "I'll work on site" or "I'll work remotely" never fixes an eligibility problem.

## "Export" means handing over, not only shipping

In everyday speech, "export" means a crate on a ship. ITAR's definition is wider. It sits at **[[22 CFR § 120.50|reading-a-citation]]** and lists several acts that count as exporting. Among them:

- sending a defense article out of the United States;
- transferring registration or control of a controlled aircraft, vessel or satellite to a foreign person;
- and, the one that matters here, "releasing or otherwise transferring technical data to a foreign person in the United States."

The regulation gives that last act its own name, in parentheses: a **[[deemed export|deemed-word]]** — a release inside the country that the law treats as if the data had been shipped abroad. This is not a nickname the industry invented later. It is in the text of the rule itself.

Where is it "shipped" to? The rule answers that too. A release of technical data to a foreign person inside the United States is treated as an export to **[[every country|many-countries]]** where that person holds or has held citizenship, or holds permanent residency. Where the person is standing at that moment does not matter. Who they are does.

"Who they are" has an exact meaning. Under 22 CFR § 120.63, a **foreign person** is anyone who is not a US person. From the last two lessons you can spell that out: not a citizen or national, not a lawful permanent resident, not a refugee under 8 U.S.C. § 1157 (read "eight U-S-C section eleven fifty-seven"), and not an asylee under § 1158. A license from the State Department can authorize a release *to* a foreign person — that is the residual path from lesson three — but it does not turn that person into a US person. They are still a foreign person who has been authorized for a specific scope of work.

### What counts as a "release"

A **[[release|release-channels]]** is any way information moves from one mind, or one computer system, to another. ITAR covers three broad routes:

- **Visual** — showing a drawing, a screen, a whiteboard sketch, or letting someone inspect hardware in a way that reveals technical data.
- **Oral or written** — explaining an algorithm in a meeting, answering a question in a hallway, presenting at a conference.
- **Electronic** — an email, a shared code repository, a document placed on a server a foreign person can open.

None of these needs anything to be mailed, shipped or carried across a border. The rule was written this way because information does not need a courier. It travels the moment someone understands it.

::: key
22 CFR § 120.50 defines "export" to include releasing or transferring technical data to a foreign person in the United States — a deemed export — treated as an export to every country of that person's citizenship or permanent residency. Release includes oral, visual, and electronic disclosure, not only physical transfer.
:::

## Why location does not fix it

People reach for two workarounds. Both fail, and it helps to see exactly why.

### Workaround one: "Nothing leaves the United States"

This gets the controlled act backwards. The export happens at the moment of release to a foreign person, wherever that release happens.

Picture a foreign national in a Hawthorne office. They badge into the building. They are fully allowed to be there. Under the regulation they are still a foreign person. Show them a guidance algorithm's derivation in a meeting room, and that is a release — an export — even though the room is in California and the printout never leaves it. The item does not need to move. The recipient's status is the trigger, not the item's location.

### Workaround two: "Hire them remotely, abroad"

This is the one the module's quiz tests, and it makes things worse, not better.

If a US company gives a foreign person *outside* the United States access to controlled technical data, that is an ordinary export under the same regulation — data really did cross a border into a foreign person's hands. Now there is an actual cross-border transfer on top of the release. Remote work moves the problem somewhere else. It does not solve it, because the rule was never about which office the data sat in. It was always about who receives it.

::: warning "Being careful" is not a compliance strategy
No amount of discretion satisfies the rule: not limiting what you say in front of a foreign colleague, not being vague in a shared document, not trusting someone never to repeat what they heard. The release itself is the controlled act, not what happens afterward. One clear disclosure of controlled technical data to a foreign person — made in good faith and never repeated — is still a release. That is why companies running controlled programs write **[[Technology Control Plans|tcp]]**: formal, written, checkable rules about which specific employees may reach which specific data, enforced through badge access, network permissions and meeting invitations, not left to anyone's judgment in the moment.
:::

## What the rule does not reach

The rule is exact about what it controls. It is worth being equally exact about what it leaves alone, so it does not turn into a fear of talking to anyone who is not American.

It reaches **technical data** as lesson one defined it (22 CFR § 120.33): information required for the design, development, production, testing or modification of a defense article. It does **not** reach:

- general science, math and engineering principles taught in schools and universities anywhere in the world;
- information already in the **[[public domain|public-domain]]** — freely published and available to anyone;
- ordinary business conversation;
- a colleague's general career advice.

A foreign-national engineer can be told the company builds rockets. They can discuss orbital mechanics as any textbook teaches it. They can be a valued teammate on work that never touches controlled technical data. What cannot happen is that person being shown, told or given access to the specific derivations, code and analysis tied to a controlled vehicle's design.

The rule also does not depend on trust or intent. A company that fully trusts a particular foreign-person employee, and an employee who has no plan to share anything with anyone, are both still inside the rule the moment controlled technical data is released. The regulation is written around the plain fact that a release happened, not around anyone's character. That is exactly why real compliance runs on formal access controls instead of room-by-room judgment calls.

::: example Four channels, checked for deemed export
A guidance team is finishing a design review. Four things happen in the same week. For each one, ask two questions: is the content technical data, and is the recipient a foreign person?

**1. A conversation.** A senior engineer, a US citizen, explains the team's new entry-guidance approach to another US citizen in a closed conference room. The content is technical data, but the recipient is a US person. **Not a deemed export**, however sensitive the content.

**2. An email.** The same engineer emails a design memo on that approach to a teammate on an **[[H-1B visa|h1b]]**, copied because he works on the same subsystem. An H-1B visa is not one of the four US-person statuses, so the teammate is a foreign person under § 120.63. Technical data, foreign person, inside the US: **a deemed export** — even though the email never left a US mail server.

**3. A talk.** A different engineer gives a conference talk on general trajectory-optimization theory, as taught in any graduate controls course. The audience includes several non-US nationals. The content is a general engineering principle, so it was never technical data. **Not a deemed export.** The audience's citizenship does not matter when the content is not controlled.

**4. A permission.** A fourth engineer gives a foreign-person contractor **[[read access|repo-access]]** to the program's full flight-software repository, including the guidance and navigation code, to help with an unrelated tooling task. Nothing was explained out loud. The access itself is the release: **a deemed export**, even though it was granted for a narrow purpose.

Sanity check: the two "not" cases each fail one of the two questions (a US-person recipient; content that is not technical data). The two "yes" cases pass both. That is the whole test.
:::

::: example Location moves, status does not — and the reverse
Two scenarios isolate exactly what the rule tracks.

**Scenario A.** A US-citizen engineer goes temporarily to a partner facility in another country to support an integration campaign, and keeps working with the same controlled technical data there. Technical data has now left the United States, so this *is* an export in the ordinary sense, and it needs its own paperwork — a license, or one of the exemptions ITAR writes for employees who carry data abroad for their own work. But the person holding the data is still a US person. A US person does not become a foreign person by changing location.

**Scenario B.** A foreign-person engineer never leaves a US office and is shown the identical data across a desk. Nothing physical crosses any border. It is still a deemed export, because the rule tracks who received the information, not where anyone was standing.

Compare them. In A, the location changed and the recipient's status did not. In B, nothing moved at all, yet the release to a foreign person happened. Geography is not the variable that decides whether a release to a foreign person occurred. Status is.
:::

## Check yourself

::: check
A manager proposes filling a hiring gap with a highly qualified foreign-person candidate who would work entirely from a secure US facility. The reasoning: the data never leaves the building, so no export occurs. What is wrong with this?
:::

::: answer
The reasoning assumes the controlled act is data physically leaving the country. The controlled act is really the release of technical data to a foreign person, wherever that release happens. A foreign person inside a secure US facility is still a foreign person. Showing them controlled technical data there is a deemed export under 22 CFR § 120.50, even though nothing crosses a border. Keeping the data inside the building does not stand in for the recipient holding one of the four US-person statuses or a specific authorization.
:::

::: check
Why does hiring a foreign person to work remotely from outside the United States fail to avoid the export-control problem — and arguably make it more plainly a problem?
:::

::: answer
The issue was never which office the data sat in; it is who receives it. A foreign person outside the United States receiving controlled technical data from a US company is a conventional export: the data has left US jurisdiction and landed in a foreign person's hands abroad. That is at least as firmly regulated as a deemed export, and it adds an actual cross-border transfer on top. Remote work changes where the problem is without touching its cause.
:::

::: check
An engineer gives a public conference talk on the general mathematics of optimal control, attended by engineers of many nationalities. A different engineer privately explains a specific vehicle's actual guidance-law tuning to one foreign-person colleague. Only one of these is a deemed export. Which, and why?
:::

::: answer
The private explanation is the deemed export. A specific vehicle's guidance-law tuning is technical data under 22 CFR § 120.33 — information required for the design of a specific defense article — and it was released to a foreign person. The public talk is not, because general optimal-control mathematics falls under the definition's own exclusion for general scientific and engineering principles. The audience's nationalities do not matter when the material is not technical data in the first place. The difference is the content, not which setting feels more public or more private.
:::

::: check
A company gives a foreign-person contractor access to a flight-software repository for an unrelated, narrow task, with no spoken explanation of the controlled modules inside it. Has a deemed export occurred?
:::

::: answer
Yes, if the repository contains controlled technical data the contractor can now reach — no matter why access was granted or whether anyone explained anything out loud. Release includes giving electronic access to technical data, not only explaining it. The narrowness of the intended task does not limit what was actually released. What matters is what the contractor is now able to see.
:::

::: check
Explain why the deemed export rule does not mean a company must avoid ever discussing its work with any non-US-person employee.
:::

::: answer
The rule reaches technical data specifically — information required for the design, development, production, testing or modification of a defense article — not every conversation about the company's work. General engineering principles, information already in the public domain, and ordinary non-technical discussion fall outside the definition of technical data from the start, so sharing them with a foreign person is not a deemed export. Companies manage this with Technology Control Plans that set out exactly which data each employee may access, not by shutting foreign-person colleagues out of all communication.
:::

## Summary

| Term | Citation | Key point |
| --- | --- | --- |
| Export (deemed export) | 22 CFR § 120.50 | Releasing technical data to a foreign person in the US counts as an export |
| Foreign person | 22 CFR § 120.63 | Anyone who is not a US person under § 120.62; a license authorizes a release but does not change status |
| Where it is "sent" | 22 CFR § 120.50 | Every country of the person's citizenship (now or before) or current permanent residency |
| Release | — | Oral, visual or electronic disclosure; no physical transfer needed |
| What is not reached | 22 CFR § 120.33 exclusions | General principles taught in schools; information already in the public domain |
| The two-question test | — | Is it technical data? Is the recipient a foreign person? Both yes means a release needing authorization |
| Practical control | — | Technology Control Plans restrict access by named employee, not by discretion |

The same release logic also runs through a [[second US export rulebook|ear-bridge]], so it follows you even to employers outside ITAR. The next lesson leaves the legal machinery behind and turns to the practical question every applicant meets first: where, exactly, in a real hiring process this gets confirmed, and how the question is asked.

::: context reading-a-citation How to read "22 CFR § 120.50" out loud
US regulations are stored in one giant set of books called the **Code of Federal Regulations**, or CFR. It is split into numbered **titles** by subject; title 22 is foreign relations. Inside a title are parts and sections. The symbol § means "section".

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <g font-size="26" font-weight="700" fill="#1f2a44">
    <text x="70" y="48" text-anchor="middle">22</text>
    <text x="135" y="48" text-anchor="middle">CFR</text>
    <text x="190" y="48" text-anchor="middle">§</text>
    <text x="262" y="48" text-anchor="end">120</text>
    <text x="262" y="48" text-anchor="start">.50</text>
  </g>
  <line x1="70" y1="58" x2="70" y2="86" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="135" y1="58" x2="135" y2="104" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="240" y1="58" x2="240" y2="86" stroke="#b4232c" stroke-width="2"/>
  <line x1="286" y1="58" x2="286" y2="104" stroke="#b4232c" stroke-width="2"/>
  <text x="70" y="100" font-size="12" text-anchor="middle" fill="#1d6fd1">title 22</text>
  <text x="135" y="120" font-size="12" text-anchor="middle" fill="#1d6fd1">Code of Federal Regulations</text>
  <text x="240" y="100" font-size="12" text-anchor="middle" fill="#b4232c">part 120</text>
  <text x="300" y="120" font-size="12" text-anchor="middle" fill="#b4232c">section 50</text>
</svg>
```

So you say it "twenty-two C-F-R section one-twenty point fifty". ITAR fills parts 120 to 130 of title 22, and part 120 holds its definitions.
:::

::: context deemed-word "Deemed": a word lawyers use on purpose
To **deem** something is to judge it or treat it as something, even if it is not literally that. The word goes back to Old English, where it meant "to judge". Lawyers use it when they want the law to treat one situation exactly like another. Nobody pretends the data crossed an ocean. The law says: we will *handle* this release as though it had. That is why the word matters — it tells you the consequences are the same as a real export, including the need for a license.
:::

::: context many-countries One release, possibly several countries
A person can be tied to more than one country. Say an engineer was born a citizen of country A, later became a citizen of country B, and is in the US on a work visa. Showing them controlled data counts as exporting it to both A and B — "holds or has held citizenship" includes the old one.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="14" y="52" width="112" height="46" rx="8" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="70" y="72" font-size="12" text-anchor="middle" fill="#1f2a44">release in a</text>
  <text x="70" y="88" font-size="12" text-anchor="middle" fill="#1f2a44">US office</text>
  <line x1="126" y1="68" x2="226" y2="40" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="232,38 220,36 224,46" fill="#1f2a44"/>
  <line x1="126" y1="82" x2="226" y2="110" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="232,112 224,104 220,114" fill="#1f2a44"/>
  <rect x="234" y="20" width="112" height="40" rx="8" fill="#fff" stroke="#b4232c" stroke-width="1.5"/>
  <text x="290" y="36" font-size="12" text-anchor="middle" fill="#b4232c">country A</text>
  <text x="290" y="51" font-size="11" text-anchor="middle" fill="#1f2a44">former citizenship</text>
  <rect x="234" y="92" width="112" height="40" rx="8" fill="#fff" stroke="#b4232c" stroke-width="1.5"/>
  <text x="290" y="108" font-size="12" text-anchor="middle" fill="#b4232c">country B</text>
  <text x="290" y="123" font-size="11" text-anchor="middle" fill="#1f2a44">current citizenship</text>
</svg>
```

This matters because some destinations are far more restricted than others, so a license has to account for all of them.
:::

::: context release-channels Three routes out of your head
Every release is one of three kinds of move from a US person (or a US system) to a foreign person. None of them involves a box or a border.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="12" y="55" width="96" height="40" rx="8" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="60" y="79" font-size="12" text-anchor="middle" fill="#1f2a44">technical data</text>
  <rect x="252" y="55" width="96" height="40" rx="8" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="300" y="79" font-size="12" text-anchor="middle" fill="#1f2a44">foreign person</text>
  <path d="M108,65 Q180,10 252,65" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="108" y1="75" x2="252" y2="75" stroke="#1d6fd1" stroke-width="2"/>
  <path d="M108,85 Q180,140 252,85" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <text x="180" y="30" font-size="12" text-anchor="middle" fill="#1f2a44">visual: a screen, a sketch</text>
  <text x="180" y="69" font-size="12" text-anchor="middle" fill="#1f2a44">oral or written</text>
  <text x="180" y="128" font-size="12" text-anchor="middle" fill="#1f2a44">electronic: email, repo</text>
</svg>
```

The regulation has its own section spelling out what counts as a release, and it is written broadly on purpose.
:::

::: context tcp What a Technology Control Plan looks like
A **Technology Control Plan**, or TCP, is a company's written rulebook for a controlled program. It typically says which data is controlled, which named people may see it, how the computers holding it are locked down, how visitors are escorted, and how staff are trained. On the ground it shows up as locked network folders, access lists on code repositories, badges that open some doors and not others, and meeting invitations checked against a list. A new engineer usually meets it in the first week, as training they have to complete before they get access.
:::

::: context public-domain What "public domain" means here
In ITAR, **public domain** means information that is published and generally available to anyone — for example sold at newsstands and bookstores, held in public libraries, or presented at conferences open to the public. That is why a textbook on orbital mechanics is safe to discuss with anyone. The catch: you cannot make controlled data public by posting it yourself. Putting controlled technical data online without authorization is itself a release to every foreign person who reads it.
:::

::: context h1b What an H-1B visa is
An **H-1B** is a common US work visa for "specialty occupations" — jobs that need a degree, like engineering. It lets a person live and work in the US for a particular employer, usually for up to six years. Lesson two explained why it does not make anyone a US person: a visa is permission to be here and work, not one of the four statuses. So a close teammate on an H-1B, sitting at the next desk for years, is still a foreign person under ITAR.
:::

::: context repo-access "Read access" to a repository
Software teams keep their code in a **repository**, or "repo" — a shared store that remembers every version of every file. Giving someone **read access** means they can open and copy anything in it, even if they cannot change it. That is why granting access is itself a release: from ITAR's point of view, being able to see controlled code is the same as being shown it. Big programs split their code into separate repos with separate access lists for exactly this reason.
:::

::: context ear-bridge A second rulebook with the same idea
ITAR is not the only US export rulebook. The Commerce Department runs the **Export Administration Regulations** (EAR), which cover "dual-use" items — things with both civilian and military uses, including many commercial satellite parts. The EAR has its own deemed-export rule built on the same logic: releasing controlled technology to a foreign national inside the US counts as an export to their country. So the lesson here carries over even at employers outside ITAR. Lesson seven comes back to that line between the two rulebooks.
:::
