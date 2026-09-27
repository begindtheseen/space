---
id: l08-behavioural-and-culture
title: "Stage 5: behavioral and culture"
minutes: 19
covers:
  - "stage 5 — behavioural and culture, using STAR"
---

Think about picking a partner for a long school project. You already know who is smart. What you really want to know is different. When things go wrong, do they own up or blame someone? When you disagree, can you sort it out? When they say "my part is done," is it actually done? You answer those questions by remembering what the person *did* last time — not by what they promise.

The fifth stage of the pipeline works the same way. It is the one stage with no equations in it. You will be asked about things that already happened to you — a failure, a disagreement, a decision made without enough information — and you will be expected to answer in a particular shape.

Candidates who are strong technically often treat this round as a formality on the way back to the "real" interviews. That is a misreading, and it has a real cost. The technical rounds find out whether you can do the work. This round finds out what you are like to do the work *with*, for years, on a team that has to trust your account of your own results. The second question is not softer than the first. It is judged from different evidence.

This lesson covers the shape the round expects, the themes it draws from, and the one question in it that deserves an honest answer rather than a rehearsed one. The thirteenth module of this track builds your story bank and drills the delivery. This lesson is the map.

## Where it sits

The module numbers this stage fifth, after the onsite. But whether it reaches you as a separate conversation or as one of the onsite day's rounds varies. It is worth asking the coordinator when you ask about the rest of the day.

Nothing about how you prepare changes either way. Knowing where it falls still matters, for a reason the tenth lesson of this module develops: a **behavioral** round — one about how you behaved in real past situations — that lands late in a long day asks you to tell clear stories at exactly the hour it is hardest to do so.

## STAR, and the failure that defines it

Answers are expected in **[[STAR|star-origin]]** structure. STAR stands for **Situation, Task, Action, Result**:

- **Situation** — the background, cut down to what the listener needs.
- **Task** — what *you* were responsible for.
- **Action** — what you did: the decisions, the trade-offs, the steps.
- **Result** — what happened, stated in a way someone could check.

The common failure is so common that it works as the definition of doing this badly: **most of the answer goes on the Situation.**

This is not carelessness. It happens naturally. The situation is the part you remember most vividly. It needs no judging of yourself to tell. And it feels like it has to be explained before anything else can make sense. So a candidate spends sixty seconds setting up a project, twenty seconds on what she did, and trails off without a result.

### The arithmetic of ninety seconds

Look at how the time in a ninety-second story should be spent. About fifteen seconds of Situation and ten of Task is enough setup for almost any story an interviewer will ask for. That is twenty-five seconds of setup. It leaves about forty-five seconds for the Action — the part the question was really about — and twenty for a clean Result:

$$
15 + 10 + 45 + 20 = 90\,\mathrm{s}
$$

Flip that split around and you have answered a question nobody asked, using the time that was meant for the answer. A **[[stopwatch picture|star-split]]** of the split helps.

::: key
STAR is Situation, Task, Action, Result. The defining failure is spending most of the answer on Situation. In a ninety-second story, setup is roughly the first twenty-five seconds; the Action is the bulk of it, and the Result closes it in a form that can be checked.
:::

## A bank of stories, not an improvisation

Prepare **ten to twelve stories, each about ninety seconds long.** That is a specific number, and it is worth taking literally. This set of prepared stories is your **story bank**.

Why prepare a bank instead of making up an answer to each question as it comes? Two reasons.

1. **The themes are mostly known in advance.** Improvising means solving, at speed and under pressure, a problem you could have solved calmly at a desk.
2. **Tiredness.** This round may well fall late in a long day. Remembering a story you have rehearsed holds up much better when you are tired than building a new one on the spot.

The themes these rounds actually probe include:

- a failure, and what changed afterward;
- conflict with a colleague;
- a decision made with incomplete information;
- a missed deadline;
- a time you were wrong;
- **ownership** beyond your formal scope — taking charge of something that was not officially your job;
- teaching or bringing along someone else;
- working extended hours.

Ten to twelve stories against eight themes is not an accident. One good story usually serves more than one theme. Say a project where you picked the wrong approach, admitted it late, and missed a deadline because of it. That can be told as a failure story, a being-wrong story or a deadline story, depending on which part you put in front. So build the bank from real episodes first, and then **[[map the themes onto them|story-map]]**. Do not try to manufacture one episode per theme.

### Quantify the Result

A story that ends "and it went well" cannot be checked, so it is not evidence. A story that ends "the landing **[[dispersion|dispersion]]** came down from one and a half kilometers to under four hundred meters, and we shipped a week late instead of three" gives the listener something with edges.

This is the same habit the resume module of this track applied to bullet points, for the same reason. A measured result invites a follow-up question — "what was it before?", "how did you measure it?" — and the follow-up is where a good story does its work.

::: warning Do not build a story bank out of stories that did not happen
A made-up episode fails under the follow-up, and in this round the follow-up is guaranteed, not merely likely. The interviewer will ask what the other person said, what you would do differently, what the number was before. Real episodes have that detail ready without effort, because you were there. Invented ones run out within two questions — and what the interviewer learns at that point is not about the story.
:::

::: example One story, told twice
A candidate is asked to describe a time she was wrong about something technical.

**First version — two minutes and ten seconds.** She spends the first seventy seconds describing a simulation project: what the vehicle model was, how the aerodynamic tables were built, which integrator she used, who else worked on it and what each of them did. Then twenty seconds on having chosen a fixed time step that was too coarse. Then she says she fixed it, that it was a good lesson, and stops.

The interviewer has heard a lot about a simulation and almost nothing about her. There is no result. There is no account of how she found the error. There is no evidence of what changed in how she works.

**Second version — ninety-five seconds, same episode.**

- *Situation, 15 seconds:* she was building a **[[6-DOF|six-dof]]** ascent simulation and checking it before a dispersion campaign.
- *Task, 10 seconds:* she owned the integration scheme — the math that steps the simulation forward in time — and the verification of it.
- *Action, 50 seconds:* she had chosen a fixed step because the results looked smooth, which she now recognizes is no evidence at all. The error showed up when a **[[conservation check|conservation-check]]** on a torque-free case drifted more than it should have. She ran a **[[step-halving study|step-halving]]**, found the error was not shrinking at the rate it should, and traced it to a step too coarse for the fastest spinning motion in the vehicle's dynamics. Then she re-ran the whole verification suite, starting from the cases with known exact answers.
- *Result, 20 seconds:* the dispersion campaign was delayed four days. The convergence study is now a standing test in the code **repository** (the shared store of the team's code), not something she runs only when suspicious. She has not shipped a fixed-step choice without one since.

**Check the timing:** $15 + 10 + 50 + 20 = 95$ seconds, with more than half of it on the Action. Same episode. The second version is shorter, and it answers the question that was asked.
:::

## The extended-hours question, answered honestly

Postings in this family state an expectation directly: working extended hours and weekends when needed to meet critical deadlines. Because it is written in the posting, it can fairly come up in this round. Think about it before it does.

This course will not tell you what to say, and the reason is worth spelling out. What a week really looks like on a specific team, at a specific point in a program, is not something a course can know. It depends on the team, on where a vehicle is in its build-and-fly cycle, on whether a **[[launch campaign|launch-campaign]]** is running, and on the manager. Anyone who gives you one general number is guessing. The expectation in the posting is stated. The lived reality on any particular team is not stated anywhere reliable. That gap is real.

Two things follow.

**First, the honest answer is the one you could still live with in your second year.** An eager "yes" given to get past a round becomes a commitment you made **[[on the record|on-the-record]]**, to people who will remember it, about a pace you may not want.

**Second, this round is a good place to gather evidence for your own decision.** The topic is already open. You are talking to people who actually live the schedule. So asking what a heavy week looks like on this team, and how often those weeks come, is a fair question inside a conversation about extended hours.

Intensity and pace are a real trade-off to weigh **before** you accept a role, not after. Seeing it that way turns an awkward question into a piece of **[[due diligence|due-diligence]]** you had to do anyway.

::: example The extended-hours question, three ways
Three candidates are asked, in a behavioral round, how they feel about the expectation of extended hours and weekends when needed to meet critical deadlines.

**The first says yes instantly.** Hours are not a concern, she will do whatever it takes, she has always worked that way. She has not thought about it. She has also made a statement on the record to people who will remember it. If the reality turns out to be one she does not want, the conversation in eighteen months starts from what she said today.

**The second treats it as a trap and hedges.** She talks about work-life balance in general and the importance of sustainability, without ever addressing the expectation in the posting. She has not answered the question and has not learned anything. The interviewer is left unsure what she meant.

**The third answers, and then uses the question.** She says she has worked stretches like that before and names one: a two-week period before a test deadline. She can do it when a deadline is real. What she cares about is whether the intensity is tied to something that matters, rather than being the normal state of things. That is an honest answer with evidence attached, and not a promise she will regret.

Then she asks: what does a heavy week actually look like on this team, and how often do they come? The answer is specific, and it is about *this* team rather than the company in general. It is one of the most useful things she learns all day — because she is deciding too.

**Sanity check:** only the third candidate both answered the question and came away with new information. That is the test for a good answer here.
:::

## Check yourself

::: check
Name the four parts of STAR and the failure that most often ruins an answer. Why does that failure happen so reliably?
:::

::: answer
Situation, Task, Action, Result. The failure is spending most of the answer on Situation.

It happens reliably because the situation is the part you remember most vividly, it needs no judging of yourself to tell, and it feels like necessary setup. So a candidate drifts into it and reaches the Action with little time left. The question was about the Action, so the time went on the part nobody asked about.
:::

::: check
Why prepare a bank of ten to twelve ninety-second stories instead of answering each question as it comes?
:::

::: answer
Two reasons.

- The themes are mostly known in advance — failure, conflict, deciding with incomplete information, a missed deadline, being wrong, ownership beyond scope, teaching someone, extended hours. Improvising means solving at speed a problem you could have solved at a desk.
- This round may fall late in a long day, and recalling a rehearsed story holds up much better when you are tired than building a new one.

Ten to twelve stories can cover eight themes because one good story serves several themes, depending on which part you put in front.
:::

::: check
Why does quantifying the Result matter, and what does a quantified result invite?
:::

::: answer
An unquantified result cannot be checked, so it is not evidence — "it went well" could describe anything. A number gives the claim edges.

It also invites the follow-up question, which is where the story does its real work. An interviewer who asks what the figure was before, or how it was measured, is engaging with the substance instead of listening politely. It is the same habit the resume module applied to bullet points, for the same reason.
:::

::: check
Why does this lesson refuse to tell you what the working hours are really like, and what does it tell you to do instead?
:::

::: answer
Because the lived reality depends on the team, the program phase, whether a campaign is running and the manager, so no general figure would be honest. The expectation in the posting is stated. What a given team's week looks like is not reliably stated anywhere.

Instead, the lesson says to give an answer you could still live with in your second year, not one designed to clear a round. And it says to use the round to gather your own evidence: ask the people who live the schedule what a heavy week looks like and how often those weeks come.
:::

::: check
A candidate has no story for "conflict with a colleague" and is tempted to adapt one that did not really happen. What will go wrong, and what should she do instead?
:::

::: answer
It will fail under the follow-up, which in this round is effectively guaranteed. She will be asked what the other person actually said, what she would do differently, what the outcome was. Real episodes carry that detail without effort. Invented ones run out within a question or two, and at that point the interviewer is learning about her account of herself, not about the conflict.

Instead, she should go back through real episodes and find one that contains a disagreement — most projects with more than one person have one — and put that part in front. That is exactly how a bank of ten to twelve real stories covers eight themes.
:::

## Summary

| Element | What it is |
| --- | --- |
| Structure | Situation, Task, Action, Result |
| Defining failure | Most of the answer spent on Situation |
| Split in 90 seconds | About 25 seconds of setup, the bulk on Action, a clean quantified Result |
| The bank | Ten to twelve stories, roughly 90 seconds each, from real episodes |
| Themes | Failure, conflict, deciding with incomplete information, a missed deadline, being wrong, ownership beyond scope, teaching, extended hours |
| Result | Quantified, so it can be checked and invites a follow-up |
| Extended hours | The expectation is stated in the posting; the lived reality varies and is not knowable in general |
| The right answer | One you could still live with in year two — and a question back |

The next lesson steps back from the single rounds to one number that gets quoted about this process constantly, and is misread in both directions: a Glassdoor difficulty rating of 2.8 out of 5.

::: context star-origin Where STAR comes from
**Behavioral interviewing** rests on one simple idea: the best guide to what someone will do is what they have actually done before. So instead of "what *would* you do if…", the interviewer asks "tell me about a time when…".

STAR is a memory aid that grew up around that style of interview, and it is now taught by university career offices and used by interviewers at many large companies. Some people add an extra letter — STARL, with L for "Learning" — which is close to what the "what changed afterward" part of a good Result already covers.
:::

::: context star-split Where ninety seconds should go
Here is the recommended split drawn to scale, next to the common failure: sixty seconds of setup, twenty of action, and no result at all.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="10" y="22" font-size="12" fill="#1f2a44">Good: 90 s</text>
  <rect x="10" y="30" width="50" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="60" y="30" width="33.3" height="30" fill="#8fb8f0" fill-opacity="0.5" stroke="#1f2a44"/>
  <rect x="93.3" y="30" width="150" height="30" fill="#1d6fd1" stroke="#1f2a44"/>
  <rect x="243.3" y="30" width="66.7" height="30" fill="#f2b880" stroke="#1f2a44"/>
  <g font-size="11" text-anchor="middle">
    <text x="35" y="50" fill="#1f2a44">S 15</text>
    <text x="76.7" y="50" fill="#1f2a44">T 10</text>
    <text x="168.3" y="50" fill="#ffffff">Action 45</text>
    <text x="276.7" y="50" fill="#1f2a44">Result 20</text>
  </g>
  <text x="10" y="92" font-size="12" fill="#b4232c">Failure: 80 s</text>
  <rect x="10" y="100" width="200" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="210" y="100" width="66.7" height="30" fill="#1d6fd1" stroke="#1f2a44"/>
  <g font-size="11" text-anchor="middle">
    <text x="110" y="120" fill="#1f2a44">Situation 60</text>
    <text x="243.3" y="120" fill="#ffffff">Act 20</text>
    <text x="318" y="120" fill="#b4232c">no result</text>
  </g>
</svg>
```

Both bars use the same scale: 10 seconds is about 33 units wide.
:::

::: context story-map One story, several themes
Suppose you chose the wrong design approach on a project, admitted it late, and missed a deadline because of it. That one real episode can answer three different questions. Which one it answers depends on the part you put in front.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="50" width="130" height="50" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="75" y="72" font-size="12" text-anchor="middle" fill="#1f2a44">wrong approach,</text>
  <text x="75" y="88" font-size="12" text-anchor="middle" fill="#1f2a44">admitted late</text>
  <rect x="220" y="15" width="130" height="30" rx="6" fill="#ffffff" stroke="#1d6fd1" stroke-width="1.5"/>
  <rect x="220" y="60" width="130" height="30" rx="6" fill="#ffffff" stroke="#1d6fd1" stroke-width="1.5"/>
  <rect x="220" y="105" width="130" height="30" rx="6" fill="#ffffff" stroke="#1d6fd1" stroke-width="1.5"/>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="140" y1="65" x2="220" y2="30"/>
    <line x1="140" y1="75" x2="220" y2="75"/>
    <line x1="140" y1="85" x2="220" y2="120"/>
  </g>
  <g font-size="12" text-anchor="middle" fill="#1f2a44">
    <text x="285" y="35">a failure</text>
    <text x="285" y="80">a time you were wrong</text>
    <text x="285" y="125">a missed deadline</text>
  </g>
</svg>
```

That is why ten to twelve real stories are enough for eight themes.
:::

::: context dispersion How far from the target
When a vehicle flies the same mission many times — for real or in simulation — it never lands in exactly the same spot. Wind, engine differences and sensor errors push each landing a little differently. **Dispersion** is how widely those landing points spread out. Shrinking a landing dispersion from $1.5\,\mathrm{km}$ to under $400\,\mathrm{m}$ means the vehicle comes down almost four times closer to where it was aimed. A **dispersion campaign** runs thousands of simulated flights, each with slightly different conditions, to measure that spread.
:::

::: context six-dof Six ways to move
**6-DOF**, said "six-dee-oh-eff", means **six degrees of freedom**. A rigid object in space can move in six independent ways.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <text x="90" y="20" font-size="12" text-anchor="middle" fill="#1d6fd1">slide along (3)</text>
  <text x="270" y="20" font-size="12" text-anchor="middle" fill="#b4232c">turn about (3)</text>
  <g font-size="12" text-anchor="middle" fill="#1f2a44">
    <rect x="20" y="30" width="140" height="24" rx="4" fill="#ffffff" stroke="#1d6fd1"/><text x="90" y="46">forward–back</text>
    <rect x="20" y="58" width="140" height="24" rx="4" fill="#ffffff" stroke="#1d6fd1"/><text x="90" y="74">left–right</text>
    <rect x="20" y="86" width="140" height="24" rx="4" fill="#ffffff" stroke="#1d6fd1"/><text x="90" y="102">up–down</text>
    <rect x="200" y="30" width="140" height="24" rx="4" fill="#ffffff" stroke="#b4232c"/><text x="270" y="46">roll</text>
    <rect x="200" y="58" width="140" height="24" rx="4" fill="#ffffff" stroke="#b4232c"/><text x="270" y="74">pitch</text>
    <rect x="200" y="86" width="140" height="24" rx="4" fill="#ffffff" stroke="#b4232c"/><text x="270" y="102">yaw</text>
  </g>
</svg>
```

A 6-DOF simulation tracks all six at once — position and orientation — which is what you need to model a rocket that steers by tilting.
:::

::: context conservation-check A test with a known answer
With no outside twisting force (no **torque**), a spinning object's **angular momentum** — roughly, how much spin it carries and about which axis — stays exactly constant. That is a law of physics. So a simulation of a torque-free body gives you a free test: compute the angular momentum at every step. If the number drifts, the drift is error made by the simulation itself, not physics. Engineers lean on checks like this because they need no outside data: the right answer is known before the code runs.
:::

::: context step-halving Halve the step, watch the error
A simulation moves forward in small time steps of size $h$. Each numerical method has an **order** $p$: its error shrinks like $h^p$. So halving the step should divide the error by $2^p$. For a fourth-order method such as classic Runge–Kutta, that is $2^4 = 16$.

A **step-halving study** runs the same case at $h$, $h/2$, $h/4$ and compares. If the error falls by about 16 each time, the step is small enough for the method to work as designed. If it falls by much less, the step is too coarse for something in the problem — often the fastest motion — and the results cannot be trusted yet.
:::

::: context launch-campaign The crunch before a launch
A **launch campaign** is the stretch of weeks before a launch when the vehicle is at the launch site being integrated, tested and prepared. Schedules are tight, problems have to be solved fast, and a slip costs money and sometimes a launch window. It is the classic example of a time when extended hours are real rather than routine — which is why the lesson names it as one of the things that changes what a week looks like.
:::

::: context on-the-record Interviewers write things down
After each round, the interviewer usually writes up what they saw — often on a standard form — and those notes are read at the **debrief**, where the interviewers compare what they found. So a sentence you say in a behavioral round does not vanish when the round ends. It becomes part of the written record the hiring team decides from, and people may remember it after you join. Lesson twelve of this module covers the debrief and how a hiring committee weighs mixed signals.
:::

::: context due-diligence Checking before you commit
**Due diligence** is a business phrase for the careful checking you do *before* a big commitment — the way a buyer inspects a house before signing, not after moving in. An interview runs both ways: the company is checking you, and you are checking the job. Asking what a heavy week looks like is your inspection.
:::
