---
id: l08-the-room-of-eight
title: "A room of eight: address the asker, return to the room"
minutes: 18
covers:
  - "presenting to a panel of 5 to 10: address the asker, then return to the room"
---

A panel of five to ten engineers is not an audience. An audience has one collective reaction; a panel has five to ten independent ones, each formed separately, and each of those people feeds the debrief afterwards. That difference changes how an answer should be delivered, and it is the reason this round has a mechanical rule attached to it that sounds almost too small to matter.

::: key
Panel dynamics: answer to the person who asked, then return your attention to the whole room. Do not let one questioner monopolise the session, and do not ignore the quiet people — one of them is usually the most senior person present.
:::

The rule is small; the mechanism behind it is not. An answer delivered entirely to the face of the person who asked turns the session into a two-person conversation, and the other six or seven people stop participating in it. That is a direct loss to you, because their questions were your remaining opportunities to demonstrate depth, and a question never asked cannot be answered well. It also ignores the fact that at least two other people in the room had the same question and are evaluating your answer just as carefully as the person who voiced it.

So the delivery has a shape: take the question looking at the asker, begin the answer to them, widen to the room by the second sentence, and return to the asker at the end to close it — "does that get at what you were asking?" That last clause does real work. It confirms you answered the question that was asked rather than the one you wanted, and it hands the thread back cleanly instead of trailing off.

## The monopoliser

One person asking most of the questions is common, and it is not usually hostility. It is more often the panel member whose own work is closest to your project — which makes them both the most engaged person in the room and, frequently, your strongest potential advocate. Treating them as an adversary is a mistake.

It is still a problem, and the arithmetic shows why. Suppose the questioning runs thirty minutes with eight engineers present and one of them takes twelve of those minutes. The remaining eighteen minutes spread across seven people give about $18/7 = 2.6$ minutes each — one question apiece, if that. Six people will leave the room having formed a view of you from a talk and a single exchange.

You cannot fix this by managing the person, and attempting to would be worse than the problem. What you can do is make the gaps available.

- **Close each answer cleanly.** A precise ending — "so the margin is about $11.8$ times the worst-case accumulation" — creates a natural break. An answer that trails into further elaboration does not, and the same questioner continues by default because nobody else has an opening.
- **Return your eyes to the room after each answer.** The mechanical rule above is also a floor-yielding signal; a panel member with a question will generally take the opening when one exists.
- **Park a deep thread explicitly.** "That one goes deeper than I can do justice to in a minute — backup slide nine has the derivation, and I am happy to come back to it if there is time." This is not a dodge if you mean it, and it respects the questioner rather than deflecting them.
- **Answer with a bound where a full exploration would take five minutes.** Giving the order of magnitude and the method, and offering the detail, is a complete answer at one-fifth the cost.

::: example A monopolised session, handled badly and well
The setting: anchor project D, batch orbit determination. A flight-dynamics engineer in the room has clearly done a great deal of orbit determination and is enjoying himself. He is on his fifth consecutive question, now about the details of the residual-editing threshold.

**Weak handling.** The candidate answers each question fully and at length, facing him throughout, matching his enthusiasm. Twelve minutes in, the two of them have had an excellent technical conversation about outlier rejection. Nobody else has spoken. The candidate finishes the round feeling it went well, and six people in the debrief have one data point each.

**Strong handling.** She answers the fifth question in two sentences with a clean ending — "I used a fixed multiple of the post-fit residual standard deviation, which is crude; a robust weighting would be the better tool and I did not implement one." Then she looks up and across the room, not back at him. Someone on the other side takes the opening and asks about the condition number instead. Ten minutes later, when the room has gone quiet, she comes back to him herself: "You were asking about the editing threshold — backup slide eleven has what it actually removed from the real-data pass, if that is still interesting."

**What separates them.** Not politeness, and not assertiveness. The second candidate ends answers in a way that creates openings, moves her attention deliberately, and returns to the parked thread on her own initiative — which also demonstrates to the whole room that she was tracking the session rather than surviving it.
:::

## The quiet one

The person who says nothing for twenty-five minutes and then asks one question is the other characteristic feature of a panel this size. Two things are worth knowing about them.

Silence is not disengagement, and it is a mistake to calibrate against it. The people writing rather than speaking are often the ones evaluating most carefully, and the card above notes what candidates most often get wrong here: the quiet person is frequently the most senior engineer in the room.

Their one question is therefore worth as much preparation as the tenth question from the most talkative person, and it deserves the same treatment: face them, answer to the room, come back to them to close. If a question comes from someone who has not spoken before, resist the instinct to answer it quickly and get back to the conversation you were already having. That conversation is not the round.

## When two panel members disagree with each other

This happens, and it disorients candidates more than a hostile question does, because the obvious moves — agreeing with one, or splitting the difference — are both bad. You are being asked to take a side in somebody else's technical disagreement, in a room where you are the only person without standing.

The move that works is to refuse the adjudication and supply the criterion instead: name what would distinguish the two positions, and say what evidence would settle it.

::: example Two panel members, disagreeing about your result
During anchor project B's questioning, one engineer says the $4.0\%$ infeasible rate is a formulation defect that should have been fixed before presenting. Another says fixed final time is an entirely reasonable first implementation and the rate is beside the point.

**Weak — agree with the last speaker.** "Yes, I think for a first implementation it is acceptable." This reads as deferring to whoever spoke most recently and tells the room nothing about what the candidate thinks.

**Weak — defend against one of them.** "I disagree that it is a defect, because the theorem still applies." Now the candidate is in an argument with one panel member, in front of that person's colleagues, on a point that was not actually about her work.

**Strong.** "I think you are disagreeing about a requirement rather than about the result, so let me give the criterion I would use. The number itself is not the issue — it is what happens downstream when a solve returns infeasible. In a closed-loop implementation the guidance re-solves every cycle, so one infeasible solve is a fault to be handled: hold the previous command, retarget, or relax a constraint. That makes the operationally important quantity not the frequency but the persistence — how many consecutive cycles fail — and my campaign measured the frequency and not the persistence, because it solves once per case rather than in a closed loop. If persistence were short, fixed final time is defensible. If an infeasible solve tends to persist, it is a defect and the two-stage architecture is the fix. That is the measurement I would run next."

**What separates them.** She has not sided with anybody. She has named the quantity that distinguishes the two views, admitted precisely which of the two her own evidence cannot settle, and specified the experiment that would. That is what a colleague does in a design review, which is the behaviour this round is trying to observe.
:::

## Interruptions during the talk

A panel of engineers may interrupt the talk itself, often in the first two minutes, and usually to clarify something. This is not an attack on your structure and it is not a signal to abandon it.

Two responses, chosen by cost. If the answer takes ten seconds, give it and continue. If the answer is a section you are about to reach, park it explicitly and then actually deliver on it: "That is exactly slide five — can I take it there?" followed, two minutes later, by "this is the question you asked." Naming the return is what makes the park honest rather than evasive, and it also demonstrates that you are tracking the room while speaking, which is harder than it looks and visible when it happens.

What must not happen is losing the thread of the talk. Have the transition sentence for each slide rehearsed well enough that an interruption does not cost you the next one.

::: warning
Do not read the room as a verdict and recalibrate mid-talk. Engineers taking notes look unimpressed; people who are concentrating look sceptical; someone typing may be looking up a reference to your method because they are interested. Candidates who conclude halfway through that the room is going badly tend to speed up, compress the verification section, and cause the outcome they thought they were observing. Deliver the talk you rehearsed, at the pace you rehearsed it.
:::

## What varies, and what to ask

Whether the panel sits in one room with you, joins on video, or is split between the two changes the mechanics substantially — in a hybrid room you may not be able to see who is about to speak, and the natural gaps that yield the floor do not exist on a call. This varies by company, by team and by day, and the coordinator who schedules you is the person to ask. It is also entirely reasonable to open by asking the panel how they would like questions handled: interrupt freely, or hold to the end. Asking costs ten seconds and removes a genuine unknown.

## Check yourself

::: check
Give the full mechanical rule for delivering an answer to a panel, and the specific cost of delivering it entirely to the person who asked.
:::

::: answer
Take the question facing the asker, begin the answer to them, widen to the whole room by the second sentence, and return to the asker at the end to check that you answered what they meant. Delivering it entirely to one person converts the session into a two-person conversation and the rest of the panel stops participating — which costs you their questions, and their questions were your remaining chances to demonstrate depth. It also ignores that several others in the room had the same question and are evaluating the answer as closely as the person who voiced it.
:::

::: check
Why does this lesson describe the monopolising questioner as a potential advocate rather than an adversary, and what should you actually do about the situation?
:::

::: answer
The person asking most of the questions is usually the one whose own work is closest to the project, which makes them the most engaged person in the room and often the one best placed to argue for you afterwards. The problem is not them; it is that the other panel members are getting no time — with eight people and a thirty-minute session, twelve minutes spent on one exchange leaves about $2.6$ minutes each for the rest. The remedy is to create openings rather than to manage the person: end each answer cleanly and precisely, move your attention back to the room afterwards, park genuinely deep threads to a backup slide with an honest offer to return, and answer with a bound where a full exploration would consume five minutes.
:::

::: check
Two panel members disagree with each other about whether a limitation of your work matters. Explain why both agreeing with one of them and defending against one of them are weak, and state the move that works.
:::

::: answer
Agreeing reads as deferring to whoever spoke last and reveals nothing about your own judgement; defending puts you in an argument with one panel member in front of their colleagues over a question that was not really about your work. The move that works is to decline the adjudication and supply the criterion: name the quantity that actually distinguishes the two positions, say explicitly which part of it your own evidence can and cannot settle, and specify the measurement that would settle it. That is the behaviour of a colleague in a design review rather than of a candidate trying to please the room.
:::

::: check
A panel member interrupts ninety seconds into your talk with a question you answer properly on slide five. What do you do, and what makes the choice honest rather than evasive?
:::

::: answer
Park it explicitly and name the return: say that it is exactly what slide five covers and ask whether you can take it there — then, when you reach slide five, say so out loud and address the question directly. The naming is what makes it honest: an unnamed deferral is indistinguishable from avoidance, while an explicit park with a delivered return also demonstrates that you were tracking the room while presenting. If the answer would take ten seconds, give it immediately instead; the choice is made on cost, not on principle.
:::

::: check
Why is recalibrating your delivery mid-talk based on the panel's expressions a self-defeating move?
:::

::: answer
Because the observation is unreliable and the response is harmful. Engineers concentrating, taking notes, or looking up a reference all present as unimpressed, so the inference that the room is going badly is usually unfounded. The reaction it produces — speeding up, compressing sections, skipping the verification material — degrades the talk in exactly the places that carry the most weight, which means the candidate causes the outcome they believed they were detecting. The correct behaviour is to deliver the rehearsed talk at the rehearsed pace.
:::

## Summary

| Situation | What to do |
| --- | --- |
| Any answer | Face the asker, widen to the room by the second sentence, return to the asker to close |
| The monopoliser | End answers cleanly, move your eyes to the room, park deep threads to a backup slide, return to them yourself later |
| The quiet one | Treat their single question as the most important one in the session; silence is not disengagement |
| Two panel members disagreeing | Supply the criterion and the experiment that would settle it; do not adjudicate |
| Interruption during the talk | Ten-second answer, or an explicit park with a named return you then deliver |
| Reading faces | Do not; deliver the talk you rehearsed at the pace you rehearsed |
| Format unknowns | Room, video or hybrid changes the mechanics — ask the coordinator, and ask the panel how they want questions handled |

The next two lessons take the two questions that decide this round more often than any others: why did you not do X, and what was your actual contribution.
