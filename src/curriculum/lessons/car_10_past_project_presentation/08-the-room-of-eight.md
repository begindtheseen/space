---
id: l08-the-room-of-eight
title: "A room of eight: address the asker, return to the room"
minutes: 20
covers:
  - "presenting to a panel of 5 to 10: address the asker, then return to the room"
---

Think of a good teacher answering a question in class. A student at the back asks it. The teacher looks at that student and starts to answer. Then, a sentence in, she lifts her eyes to the whole class — because half of them were wondering the same thing. At the end she looks back at the student: "Does that help?" Nobody taught you that move, but you have seen it a hundred times, and you can tell when a teacher does it well.

A panel of five to ten engineers works the same way, and it is not an audience. An audience has one shared reaction, like a crowd laughing at a joke. A panel has five to ten separate reactions. Each person forms a view on their own, and each one feeds the **[[debrief|debrief]]** afterward — the meeting where the panel compares notes and reaches a decision. That difference changes how you should deliver every answer. It is why this round comes with a rule so small it sounds as if it could not matter.

::: key
Panel dynamics: answer to the person who asked, then return your attention to the whole room. Do not let one questioner monopolize the session, and do not ignore the quiet people — one of them is usually the most senior person present.
:::

The rule is small. The reason behind it is not.

Suppose you give an answer entirely to the face of the person who asked. The session turns into a two-person conversation, and the other six or seven people stop taking part. That is a direct loss to you. Their questions were your remaining chances to show depth, and a question never asked cannot be answered well. It also forgets that at least two others in the room probably had the same question. They are judging your answer as closely as the person who said it out loud.

## The shape of one answer

So a single answer has a **[[shape|answer-shape]]**, in four steps:

1. **Take the question** looking at the person who asked it.
2. **Begin the answer** to them.
3. **Widen to the room** by the second sentence, moving your eyes across the other panel members.
4. **Return to the asker** at the end to close it: "Does that get at what you were asking?"

That last step does real work. It confirms that you answered the question they asked, not the one you wished they had asked. And it hands the thread back cleanly instead of letting it trail off.

## The monopolizer

A **[[monopolizer|monopolizer-word]]** is one person who asks most of the questions. It is common, and it is usually not hostility. More often, it is the panel member whose own work is closest to your project. That makes them the most interested person in the room — and often your strongest possible **advocate**, the person who argues for you in the debrief. Treating them as an enemy is a mistake.

It is still a problem, and a little arithmetic shows why.

::: example How much time is left for everyone else
Suppose the questioning runs $30$ minutes, with $8$ engineers present, and one of them takes $12$ of those minutes.

**Step 1 — what is left.** $30 - 12 = 18$ minutes for everyone else.

**Step 2 — how many people share it.** Everyone except the monopolizer: $8 - 1 = 7$ people.

**Step 3 — divide.** $18 \div 7 \approx 2.6$ minutes each. That is one question apiece, if that.

**Sanity check.** $7 \times 2.6 = 18.2$, close to the $18$ we started with, so the division is right. Compare it with an even split: $30 \div 8 = 3.75$ minutes each. The monopolizer has about $12 \div 2.6 \approx 4.7$ times as much time as anyone else.

**What it means.** Seven people will leave the room having formed their view of you from a talk and, at most, a single exchange each.
:::

You cannot fix this by managing the person. Trying would be worse than the problem. What you can do is **make the gaps available** — leave openings that someone else can step into.

- **End each answer cleanly.** A precise ending — "so the margin is about $11.8$ times the worst-case buildup" — creates a natural pause. An answer that drifts into more and more detail does not. Then the same questioner carries on by default, because nobody else has an opening.
- **Move your eyes back to the room after each answer.** The four-step shape above is also a signal that you are giving up the floor. A panel member with a question will usually take the opening when there is one.
- **[[Park|parking-lot]] a deep thread out loud.** "That one goes deeper than I can do justice to in a minute. Backup slide nine has the derivation, and I am happy to come back to it if there is time." This is not a dodge if you mean it. It respects the questioner instead of brushing them off.
- **Answer with a bound** when a full exploration would take five minutes. A **bound** is a limit you can promise — "it is at most this big". Giving the rough size (the **order of magnitude**, meaning the nearest power of ten) and the method, and offering the detail, is a complete answer at one-fifth of the time.

::: example A monopolized session, handled badly and well
The setting is anchor project D, which fits a satellite's orbit to tracking data all at once (a **batch** fit). A flight-dynamics engineer in the room has plainly done a lot of orbit determination and is enjoying himself. He is on his fifth question in a row, now about the details of the **[[residual-editing threshold|residual-editing]]** — the cutoff for throwing out tracking measurements that look wrong.

**Weak handling.** The candidate answers each question fully and at length, facing him the whole time, matching his enthusiasm. Twelve minutes in, the two of them have had an excellent technical conversation about throwing out bad data. Nobody else has spoken. The candidate leaves feeling it went well. In the debrief, the other seven people have only the talk to go on.

**Strong handling.** She answers the fifth question in two sentences, with a clean ending: "I used a fixed multiple of the spread of the leftover errors after the fit, which is crude. A robust weighting would be the better tool, and I did not implement one." Then she looks up and across the room — not back at him. Someone on the other side takes the opening and asks about the **condition number** (how well the tracking geometry pins down the orbit) instead.

Ten minutes later, when the room has gone quiet, she comes back to him on her own: "You were asking about the editing threshold. Backup slide eleven has what it actually removed from the real-data run, if that is still interesting."

**What separates them.** Not politeness, and not pushiness. The second candidate ends answers in a way that creates openings. She moves her attention on purpose. And she returns to the parked thread without being asked — which also shows the whole room that she was steering the session, not merely surviving it.
:::

## The quiet one

The other thing you will almost always meet on a panel this size is the person who says nothing for twenty-five minutes and then asks one question. Two things are worth knowing about them.

First, silence is not boredom, so do not adjust yourself to it. The people writing instead of talking are often the ones judging most carefully. And, as the key above says, the quiet person is often the most senior engineer in the room.

Second, their one question deserves as much care as the tenth question from the most talkative person. Give it the same treatment: face them, answer to the room, come back to them to close. When someone who has not spoken asks something, fight the urge to answer quickly and get back to the conversation you were already having. That conversation is not the round.

## When two panel members disagree with each other

This happens, and it throws candidates off more than a hostile question does. The obvious moves — agree with one of them, or split the difference — are both bad. You are being pulled into taking a side in someone else's technical argument, in a room where you are the only person without any standing.

The move that works is to **decline to be the judge** and supply the **criterion** instead — the test that would decide it. Name what would tell the two positions apart, and say what evidence would settle it.

::: example Two panel members, disagreeing about your result
During anchor project B's questioning — the landing-burn guidance — one engineer says the $4.0\%$ infeasible rate (the share of test cases with no possible landing plan) is a flaw that should have been fixed before presenting. Another says a fixed landing time is a perfectly reasonable first version, and the rate is beside the point.

**Weak — agree with the last speaker.** "Yes, I think for a first version it is acceptable." This sounds like going along with whoever spoke most recently. It tells the room nothing about what the candidate thinks.

**Weak — defend against one of them.** "I disagree that it is a flaw, because the theorem still applies." Now the candidate is in an argument with one panel member, in front of that person's colleagues, about a point that was not really about her work.

**Strong.** "I think you are disagreeing about a requirement, not about the result. So let me give the test I would use. The number itself is not the issue. What matters is what happens next when a solve comes back infeasible. In a **[[closed-loop|frequency-persistence]]** version, the guidance re-solves every cycle, so one infeasible solve is a fault to handle — hold the previous command, retarget, or relax a constraint. That makes the important quantity not the *frequency* but the *persistence*: how many cycles in a row fail. My campaign measured frequency and not persistence, because it solves once per case, not in a closed loop. If persistence is short, a fixed final time is defensible. If an infeasible solve tends to persist, it is a flaw, and the two-stage design — first find a landing point that can be reached, then plan the best path to it — is the fix. That is the measurement I would run next."

**What separates them.** She has not sided with anybody. She has named the quantity that tells the two views apart. She has admitted exactly which part her own evidence cannot settle. And she has named the experiment that would. That is what a colleague does in a **[[design review|design-review]]**, and it is the behavior this round is trying to see.
:::

## Interruptions during the talk

A panel of engineers may interrupt the talk itself, often in the first two minutes, and usually to ask what something means. This is not an attack on your structure, and it is not a signal to abandon it.

Pick one of two responses, by how long the answer takes:

- **Ten seconds or less?** Give it, and carry on.
- **Is the answer a section you are about to reach?** Park it out loud, and then really deliver on it: "That is exactly slide five — can I take it there?" Two minutes later, on slide five: "This is the question you asked."

Naming the return is what makes the park honest instead of evasive. It also shows you are keeping track of the room while you speak. That is harder than it looks, and the panel notices when it happens.

What must not happen is losing the thread of the talk. Rehearse the linking sentence into each slide well enough that an interruption does not cost you the next one.

::: warning
Do not read the room as a verdict and change your talk halfway through. Engineers taking notes look unimpressed. People who are concentrating look skeptical. Someone typing may be looking up your method because they are interested. Candidates who decide halfway that the room is going badly tend to speed up and squeeze the verification section — and so they cause the very outcome they thought they were seeing. Give the talk you rehearsed, at the pace you rehearsed it.
:::

## What varies, and what to ask

The panel may sit in the room with you, join by video, or be split between the two. That changes the mechanics a lot. In a mixed ("hybrid") room you may not see who is about to speak, and on a call the natural pauses that hand over the floor barely exist. This varies by company, by team and by day. The coordinator who schedules you is the person to ask.

It is also perfectly reasonable to open by asking the panel how they want questions handled: interrupt freely, or hold them to the end. Asking costs ten seconds and removes a real unknown.

## Check yourself

::: check
Give the full four-step shape for delivering an answer to a panel, and the specific cost of giving it entirely to the person who asked.
:::

::: answer
Take the question facing the asker. Begin the answer to them. Widen to the whole room by the second sentence. Return to the asker at the end to check that you answered what they meant.

Giving it all to one person turns the session into a two-person conversation, and the rest of the panel stops taking part. That costs you their questions — which were your remaining chances to show depth. It also ignores that several others probably had the same question and are judging the answer as closely as the person who asked it.
:::

::: check
Why does this lesson call the monopolizing questioner a possible advocate rather than an enemy? And what should you actually do about the situation?
:::

::: answer
The person asking most of the questions is usually the one whose own work is closest to your project. That makes them the most engaged person in the room, and often the one best placed to argue for you afterward.

The problem is not them. It is that the other panel members get no time: with eight people and a thirty-minute session, twelve minutes on one exchange leaves about $18 \div 7 \approx 2.6$ minutes each for the rest.

The fix is to create openings, not to manage the person. End each answer cleanly and precisely. Move your attention back to the room afterward. Park deep threads to a backup slide, with an honest offer to return. And answer with a bound when a full exploration would take five minutes.
:::

::: check
Two panel members disagree with each other about whether a limitation of your work matters. Explain why agreeing with one of them is weak, why defending against one of them is weak, and what works.
:::

::: answer
Agreeing looks like going along with whoever spoke last, and shows nothing of your own judgment. Defending puts you in an argument with one panel member, in front of their colleagues, over a question that was not really about your work.

What works is to decline to be the judge and supply the criterion. Name the quantity that actually tells the two positions apart. Say plainly which part your own evidence can and cannot settle. Name the measurement that would settle it. That is how a colleague behaves in a design review, not how a candidate trying to please the room behaves.
:::

::: check
A panel member interrupts ninety seconds into your talk with a question that slide five answers properly. What do you do, and what makes it honest rather than evasive?
:::

::: answer
Park it out loud and name the return: say it is exactly what slide five covers and ask whether you can take it there. Then, when you reach slide five, say so and answer the question directly.

The naming is what makes it honest. A put-off with no named return looks the same as avoiding the question. A named park that you then deliver also shows you were tracking the room while presenting. If the answer would take ten seconds, give it on the spot instead — the choice is made by cost, not by principle.
:::

::: check
Why is changing your delivery halfway through the talk, based on the panel's faces, a self-defeating move?
:::

::: answer
Because the reading is unreliable and the reaction is harmful. Engineers who are concentrating, taking notes or looking up a reference all look unimpressed, so "the room is going badly" is usually wrong.

The reaction it causes — speeding up, squeezing sections, skipping the verification material — damages the talk in exactly the places that carry the most weight. So the candidate creates the outcome they thought they were seeing. The right behavior is to deliver the rehearsed talk at the rehearsed pace.
:::

## Summary

| Situation | What to do |
| --- | --- |
| Any answer | Face the asker, widen to the room by the second sentence, return to the asker to close |
| The monopolizer | End answers cleanly, move your eyes to the room, park deep threads to a backup slide, return to them yourself later |
| The quiet one | Treat their single question as one of the most important in the session; silence is not boredom |
| Two panel members disagreeing | Supply the criterion and the experiment that would settle it; do not act as judge |
| Interruption during the talk | A ten-second answer, or a park out loud with a named return that you then deliver |
| Reading faces | Do not; deliver the talk you rehearsed at the pace you rehearsed |
| Format unknowns | Room, video or hybrid changes the mechanics — ask the coordinator, and ask the panel how they want questions handled |

The next lesson takes the two questions that decide this round more often than any others: why did you not do X, and what was your actual contribution.

::: context debrief What happens after you leave
A **debrief** is the meeting after the interview where the interviewers compare what they saw. The word comes from the military: a *briefing* comes before a mission, a *debriefing* after it. At many companies each panel member writes down their view first, on their own, so the loudest voice does not sway the rest. That is why every person in the room matters: each arrives at the debrief with their own notes on you, and a person who barely heard you speak has very little to write.
:::

::: context answer-shape Where your eyes go during one answer
Picture the panel around a table. Your attention starts on the person who asked, sweeps the room while you explain, and comes back to them to close.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="100" y="60" width="160" height="70" rx="10" fill="#fff" stroke="#6c7a93" stroke-width="1.5"/>
  <g fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.2">
    <circle cx="115" cy="40" r="11"/><circle cx="155" cy="40" r="11"/><circle cx="205" cy="40" r="11"/><circle cx="245" cy="40" r="11"/>
    <circle cx="80" cy="95" r="11"/><circle cx="280" cy="95" r="11"/>
    <circle cx="120" cy="150" r="11"/><circle cx="240" cy="150" r="11"/>
  </g>
  <circle cx="80" cy="95" r="11" fill="#f2b880" stroke="#1f2a44" stroke-width="1.2"/>
  <circle cx="180" cy="180" r="11" fill="#1d6fd1" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="200" y="184" font-size="11" fill="#1f2a44">you</text>
  <text x="58" y="120" font-size="11" fill="#1f2a44" text-anchor="middle">asker</text>
  <path d="M100,92 C150,70 220,70 262,92" fill="none" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="5 4"/>
  <polygon points="266,95 254,93 259,84" fill="#1d6fd1"/>
  <path d="M262,104 C220,122 150,122 100,104" fill="none" stroke="#b4232c" stroke-width="2"/>
  <polygon points="96,101 108,100 104,110" fill="#b4232c"/>
  <text x="180" y="86" font-size="11" fill="#1d6fd1" text-anchor="middle">2–3: widen to the room</text>
  <text x="180" y="116" font-size="11" fill="#b4232c" text-anchor="middle">4: back to the asker</text>
</svg>
```

Eight panel members — seven blue, one orange asker. Step 1 is taking the question from the orange seat.
:::

::: context monopolizer-word Where the word comes from
**Monopoly** comes from Greek *monos*, "alone", and *pōlein*, "to sell": one seller who controls the whole market. The board game borrowed the name because the goal is to own everything. A monopolizer in a meeting "owns" the talking time. In a panel that is rarely deliberate — it is usually the most interested person — which is why the fix is to open gaps, not to push back.
:::

::: context parking-lot The "parking lot" in engineering meetings
Many engineering teams keep a **parking lot** in meetings: a list, often on a whiteboard, of good topics that would derail the meeting right now. Writing a topic there promises it will come back later. "Parking" a question in your talk borrows the same idea. It only works if you really do come back to it — a parking lot nobody ever returns to is a polite way of ignoring people, and panels notice.
:::

::: context residual-editing Throwing out the bad measurements
After a fit, each measurement has a **residual**: the leftover gap between what was measured and what the fitted orbit predicts. Most residuals are small and random. A few may be huge because a tracking station glitched. **Residual editing** throws those out, usually any whose gap is more than some multiple — say three times — of the typical spread. It is crude: a threshold cannot tell a glitch from a real surprise. **Robust weighting** is gentler: instead of cutting points out, it counts suspicious ones less.
:::

::: context frequency-persistence How often versus how long in a row
**Closed-loop** guidance re-plans over and over during the landing, each time from where the vehicle really is. Two landings can have the same number of failed re-plans and be very different. Below, each row is twenty re-plans, and each has four failures (red).

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <text x="10" y="18" font-size="12" fill="#1f2a44">scattered: 4 of 20 fail, never twice in a row</text>
  <g stroke="#1f2a44" stroke-width="1">
    <rect x="10" y="26" width="15" height="18" fill="#8fb8f0"/><rect x="27" y="26" width="15" height="18" fill="#8fb8f0"/>
    <rect x="44" y="26" width="15" height="18" fill="#b4232c"/><rect x="61" y="26" width="15" height="18" fill="#8fb8f0"/>
    <rect x="78" y="26" width="15" height="18" fill="#8fb8f0"/><rect x="95" y="26" width="15" height="18" fill="#8fb8f0"/>
    <rect x="112" y="26" width="15" height="18" fill="#8fb8f0"/><rect x="129" y="26" width="15" height="18" fill="#b4232c"/>
    <rect x="146" y="26" width="15" height="18" fill="#8fb8f0"/><rect x="163" y="26" width="15" height="18" fill="#8fb8f0"/>
    <rect x="180" y="26" width="15" height="18" fill="#8fb8f0"/><rect x="197" y="26" width="15" height="18" fill="#8fb8f0"/>
    <rect x="214" y="26" width="15" height="18" fill="#b4232c"/><rect x="231" y="26" width="15" height="18" fill="#8fb8f0"/>
    <rect x="248" y="26" width="15" height="18" fill="#8fb8f0"/><rect x="265" y="26" width="15" height="18" fill="#8fb8f0"/>
    <rect x="282" y="26" width="15" height="18" fill="#8fb8f0"/><rect x="299" y="26" width="15" height="18" fill="#b4232c"/>
    <rect x="316" y="26" width="15" height="18" fill="#8fb8f0"/><rect x="333" y="26" width="15" height="18" fill="#8fb8f0"/>
  </g>
  <text x="10" y="74" font-size="12" fill="#1f2a44">persistent: 4 of 20 fail, all in a row</text>
  <g stroke="#1f2a44" stroke-width="1">
    <rect x="10" y="82" width="15" height="18" fill="#8fb8f0"/><rect x="27" y="82" width="15" height="18" fill="#8fb8f0"/>
    <rect x="44" y="82" width="15" height="18" fill="#8fb8f0"/><rect x="61" y="82" width="15" height="18" fill="#8fb8f0"/>
    <rect x="78" y="82" width="15" height="18" fill="#8fb8f0"/><rect x="95" y="82" width="15" height="18" fill="#8fb8f0"/>
    <rect x="112" y="82" width="15" height="18" fill="#8fb8f0"/><rect x="129" y="82" width="15" height="18" fill="#8fb8f0"/>
    <rect x="146" y="82" width="15" height="18" fill="#8fb8f0"/><rect x="163" y="82" width="15" height="18" fill="#8fb8f0"/>
    <rect x="180" y="82" width="15" height="18" fill="#8fb8f0"/><rect x="197" y="82" width="15" height="18" fill="#8fb8f0"/>
    <rect x="214" y="82" width="15" height="18" fill="#8fb8f0"/><rect x="231" y="82" width="15" height="18" fill="#8fb8f0"/>
    <rect x="248" y="82" width="15" height="18" fill="#b4232c"/><rect x="265" y="82" width="15" height="18" fill="#b4232c"/>
    <rect x="282" y="82" width="15" height="18" fill="#b4232c"/><rect x="299" y="82" width="15" height="18" fill="#b4232c"/>
    <rect x="316" y="82" width="15" height="18" fill="#8fb8f0"/><rect x="333" y="82" width="15" height="18" fill="#8fb8f0"/>
  </g>
</svg>
```

Same frequency, $4 \div 20 = 20\%$. In the top row the vehicle holds its last command for one cycle and recovers. In the bottom row it flies blind for four cycles in a row, right near the end. That is why persistence is the number that matters.
:::

::: context design-review How engineers argue for a living
A **design review** is a formal meeting where a team presents a design and other engineers try to find what is wrong with it. NASA projects pass through a series of them, such as the Preliminary Design Review (PDR) and the Critical Design Review (CDR), before hardware is built. Disagreement is the point. The habit that makes reviews work is the one in the example: turn "I think" versus "I think" into "here is the test that would decide it". Panels watch for that habit because it is the daily work.
:::
