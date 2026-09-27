---
id: l09-star-stories-and-your-questions
title: STAR stories and the questions you ask
minutes: 19
covers:
  - Building six to eight STAR stories from the capstones, each with a number in it
  - Questions to ask that show you understand the work
---

Think about telling a friend about a great game you played. You do not list every pass. You say where things stood ("we were down by one with two minutes left"), what you had to do ("I had to get the ball past their best defender"), what you did ("I faked left, cut right, and passed to Sam"), and how it ended ("Sam scored, and we won 3 to 2"). Your friend can picture it, and it takes under a minute.

That shape is exactly what an interviewer wants when they say "tell me about a time when…". It has a name, **STAR**, and it is the tool that turns last lesson's behavioural themes into answers you can give on the day.

This lesson has three parts. First, how to build a STAR story that lands, with a before-and-after rewrite. Second, how to build a bank of six to eight of them from your capstones, map them to the themes, and time them to under two minutes. Third, the other half of the conversation: the questions *you* ask at the end, which are a test too.

## The STAR shape

**STAR** stands for four parts, told in order.

- **Situation** — where things stood. One or two sentences of background: the project, the problem.
- **Task** — what was yours to do. The goal or the responsibility that landed on you.
- **Action** — what you did. The longest part, told with "I", step by step, including the decision you made.
- **Result** — how it ended, with a number, and what you learned or would change.

The Action is the heart of the story. Interviewers are not hiring the situation; they are hiring whoever did the action. If your Action is shorter than your Situation, the story is mostly scenery.

The Result needs a number because a number is something the listener can check and remember. "It got faster" could mean anything. "It went from 40 seconds to 1.2 seconds" is a picture.

## What makes a story land

::: key What makes a STAR story land
A number, a clear boundary between your work and the team work, a decision you made under uncertainty, and what you would do differently. Stories with no number and no personal ownership read as narration.
:::

**[[Narration|narration]]** here means describing what happened, the way a nature documentary describes animals, without showing what *you* chose. It is the most common way a story fails. Here are the four ingredients from the key block as a checklist.

1. **A number.** A count, a time, a size, a percentage. Something measured.
2. **A boundary.** Which parts you did and which parts the team or a library did — the six verbs from last lesson.
3. **A decision under uncertainty.** A moment where you did not know the answer, had options, and picked one for a reason.
4. **What you would do differently.** Proof that you learned something, even from a success.

::: example Rewriting a Monte Carlo story
**Before:** "Our team built a Monte Carlo simulator for rocket ascents, and I helped make it more stable. It worked well in the end."

Check it against the four. Number: none. Boundary: "our team" and "helped" — nobody can tell what you did. Decision: none. Different next time: none. It is narration.

**After:**

- *Situation:* "My Monte Carlo ascent simulator ran 2,000 dispersed cases, and 14 of them blew up near [[maximum dynamic pressure|max-q]]."
- *Task:* "I owned the simulator, so I had to explain those 14 before anyone could trust the other 1,986."
- *Action:* "I reran one failing case at half the time step and it was fine, so I suspected my fixed 20 ms step. I had two options. Halving the step everywhere would double the runtime. An [[adaptive-step integrator|adaptive-step]] might fix it for less. I didn't know which would win, so I tried both on 200 cases. Adaptive stepping removed every failure and ran about 1.3 times as long as the original, against 2 times for halving. I chose adaptive. The integrator itself is SciPy's; I wrote the wrapper and the tests."
- *Result:* "Zero of 2,000 diverged. I added the worst former case to the test suite so it runs on every commit. Next time I'd run a step-size convergence check before the first big batch, not after."

Now count the ingredients. Numbers: 2,000, 14, 20 ms, 200, 1.3, 2, zero. Boundary: "SciPy's; I wrote the wrapper and the tests." Decision under uncertainty: halving versus adaptive, tested because the answer was unknown. Different next time: the convergence check.

Sanity check on the numbers: 14 of 2,000 is $14/2000 = 0.007$, or 0.7 percent — small enough that it is easy to ignore, which is why owning it is a good story.
:::

::: warning The accidental "we"
Even people who know the rule slip into "we" in the Action part, because it feels polite. Listen for it when you rehearse. Every "we" in the Action should be either changed to "I" (if it was you) or turned into a boundary ("my teammate wrote the parser; I wrote the tests for it").
:::

## Building the story bank

A **[[story bank|story-bank]]** is a small set of prepared stories, each tagged with the themes it can answer. With six to eight good stories you can answer almost any behavioural question, because most questions are one of the four themes in different words.

Where do the stories come from? Your **capstones** — the larger projects that finish the modules of this track. You have built simulators, C++ applications, test suites, telemetry queries and CI pipelines. Each of those had a moment where something went wrong, a decision had to be made, or a number moved.

Here is an example bank. Your own will have different projects and numbers; the point is the shape.

| Story | From | The number | Themes it answers |
| --- | --- | --- | --- |
| Diverging Monte Carlo runs | ascent simulator | 14 of 2,000 runs, fixed to 0 | ownership, ambiguity |
| Flaky nightly regression | CI pipeline | 3 of 20 nights failed with no code change | ownership, ambiguity |
| Slow dashboard query | telemetry SQL | 40 s down to 1.2 s | ownership |
| Degrees read as radians | ascent simulator | spread 57 times too wide | failure |
| Data race in the control loop | C++ GNC application | 1 bad reading in about 50,000 | failure, ownership |
| Wind data that did not exist | ascent simulator | 500 reruns, margin moved under 1 percent | ambiguity |
| Why I built the simulator | ascent simulator | propellant margin question | mission |
| Generated versus hand code | Simulink code generation | outputs matched to $10^{-12}$ | mission, ownership |

Read down the last column. Every theme appears at least once, ownership and ambiguity several times, and failure twice. That matters, because the exercise for this module asks for at least two failure stories — one about a defect you caused, one about a defect you missed — and because an interviewer who asks for "another example" should get one.

A few habits make a bank strong.

- **One story, several themes.** The [[flaky-regression story|flaky]] shows ownership (you took it on) and ambiguity (you did not know the cause). Tag it for both.
- **Spread the projects.** If every story comes from one simulator, the panel learns about one project. Use three or four capstones.
- **Keep the numbers true.** Write the number down from your logs or your commit history while you still remember it. An interviewer may ask how you measured it.

::: note Why six to eight
Four themes, each asked perhaps twice across the day, is about eight questions. Stories can cover more than one theme, so six to eight stories cover them all with room for "another example, please". Fewer than six and you start retelling the same one; more than eight and you will not rehearse them all well.
:::

## Rehearsal timing: under two minutes

A spoken answer longer than two minutes starts to lose the listener. Aim well under it, because you will add a sentence or two on the day.

The arithmetic is words per minute. Most people speak at about **130 to 150 words per minute** in a conversation like this. At 140 words per minute, two minutes is

$$
140 \times 2 = 280\ \text{words}.
$$

That is the ceiling. A safer target is about 100 seconds, which leaves 20 seconds of room:

$$
140 \times \frac{100}{60} \approx 233\ \text{words}.
$$

So a written story of about 200 to 230 words is the right size.

::: example Budgeting one story
Your first draft of the Monte Carlo story is 380 words. How long does it take to say, and how should you cut it?

Step 1: time the draft. At 140 words per minute, $380 / 140 \approx 2.71$ minutes, which is $2.71 \times 60 \approx 163$ seconds — about 2 minutes 43 seconds. Too long.

Step 2: set a target of 220 words and split it across the four parts. Give the Action half, because it is the part being judged.

- Situation, 15 percent: $0.15 \times 220 = 33$ words.
- Task, 10 percent: $0.10 \times 220 = 22$ words.
- Action, 50 percent: $0.50 \times 220 = 110$ words.
- Result, 25 percent: $0.25 \times 220 = 55$ words.

Check: $33 + 22 + 110 + 55 = 220$. Good.

Step 3: time the new version. $220 / 140 \approx 1.57$ minutes, about 94 seconds. That is under two minutes with room to spare.

Sanity check: the Situation now gets about 14 seconds of speech. That is two short sentences — exactly as much scenery as the story needs.
:::

Rehearse out loud, with a timer, and three times each. For eight stories at up to two minutes, one full pass is at most $8 \times 2 = 16$ minutes, so three passes is at most 48 minutes. That is less than an hour to be ready for a third to a half of the onsite. Few hours of preparation pay back as well.

::: warning Memorising word for word
Do not memorise a script. A recited story sounds recited, and if you lose one word you lose the thread. Memorise the four parts and the numbers. Then tell it a little differently each time, the way you would retell the game to a different friend.
:::

## The questions you ask

Near the end of most rounds, the interviewer asks, "Do you have any questions for me?" This is not a courtesy. It is one more chance to show you understand the work — or to show you do not.

::: key What to ask them
Specific ones that show you read the work: how the sim team handles regression tolerances, where the boundary sits between generated and hand-written flight code, how dispersions are chosen and reported, how a HIL failure gets triaged. Generic culture questions waste the slot.
:::

**Triaged** means sorted by urgency and cause, the way an emergency room decides who is seen first. **HIL** is hardware-in-the-loop testing from lesson 5, where the real flight computer runs against a simulated vehicle.

A good question has three properties.

1. **It is specific.** It names a real part of their work.
2. **It shows experience.** It is the kind of question only someone who has done similar work would think to ask.
3. **It opens a conversation.** The answer is not yes or no; it leads to a follow-up.

Here are three questions rewritten.

- **Before:** "What's the culture like?" **After:** "When a simulation result changes after a code change, who decides whether it's a real regression or acceptable noise, and how is that decision written down?"
- **Before:** "Do you use C++?" **After:** "For the flight software, which parts are generated from models and which are written by hand, and what decides where that line falls?"
- **Before:** "What does a typical day look like?" **After:** "When you run a Monte Carlo campaign, how do you pick the dispersion ranges, and how are the results shown to the people making the decision?"

Every "after" version comes straight from something you did in this track: regression tolerances in the CI module, generated code in the Simulink code-generation module, dispersions in your Monte Carlo capstone. That is the point. **[[Your questions come from your own work|questions-from-work]]**, so they are specific without any extra effort.

Match the question to the round. Ask the simulation interviewer about sim tolerances, the C++ interviewer about the flight-code boundary, and the person who ran your presentation about how they review analysis. And have more than you need: if an interviewer's earlier answer already covered your first question, you need a second.

::: warning Questions you can answer yourself
Do not ask anything the company's own job posting or public talks already answer, and save questions about pay and time off for the recruiter. In a technical round those questions use up the slot without showing anything.
:::

## The end of the road — and the start

This is the last lesson of the module, and the end of the coding track's interview preparation.

Look back at what you built to get here. A Monte Carlo ascent simulator that you can defend number by number. A C++ GNC application you can explain down to where each allocation happens. Tests, CI, telemetry queries, generated code. Every one of those is now three things at once: the skill itself, a twelve-slide talk, and two or three stories with numbers in them.

So the best preparation from here is not another list of questions. Go back to your **[[capstones|capstones-again]]**. Reopen the code. Find the commit where you fixed the worst bug, and write down the number. Rerun the Monte Carlo and check you still get the same answer. The interview is a conversation about work you have done — and you have done a lot of it.

## Check yourself

::: check
Name the four parts of STAR, and say which one should be the longest and why.
:::

::: answer
Situation, Task, Action, Result. The Action should be the longest — about half the story — because it is what you did, and you are the one being hired. A story whose Situation is longer than its Action is mostly background.
:::

::: check
"The team improved the telemetry dashboard and everyone was happy with it." Which of the four ingredients is it missing, and how could you add each one?
:::

::: answer
All four. Add a number ("the main query went from 40 s to 1.2 s"), a boundary ("I found the slow query and added the index; a teammate built the dashboard"), a decision under uncertainty ("I wasn't sure whether an index or a summary table would help more, so I tried the index first because it was quicker to undo"), and what you would do differently ("I'd check query plans before the dashboard went live").
:::

::: check
A story draft is 300 words. At 140 words per minute, how long does it take to say? How many words should you cut to reach a 100-second target?
:::

::: answer
$300 / 140 \approx 2.14$ minutes, about 129 seconds — over two minutes. At 140 words per minute, 100 seconds is $140 \times 100/60 \approx 233$ words, so cut about $300 - 233 = 67$ words, most of them from the Situation.
:::

::: check
Your story bank has seven stories: three tagged ownership, three tagged ambiguity, one tagged mission, none tagged failure. What is wrong, and what should you do?
:::

::: answer
No story covers honesty about failure, which is one of the four themes being probed, and the exercise asks for at least two failure stories. Find a real defect you caused and one you missed from your capstones, and write each with what it cost, how it was found and what you changed. Adding them brings the bank to nine, so you might drop the weakest ownership story to keep it at eight.
:::

::: check
Turn "Do you do testing?" into a question that shows you understand the work, for an interviewer on a flight-software team.
:::

::: answer
One good version: "When a hardware-in-the-loop run fails, how do you tell a real software fault from a bench or harness problem, and who owns that first look?" It is specific (HIL failures), it shows you know benches fail for their own reasons, and it opens a conversation about their triage process. Any question with those three properties is a good answer.
:::

## Summary

| Idea | In one line |
| --- | --- |
| STAR | Situation, Task, Action, Result; the Action is about half |
| A story that lands | a number, a boundary, a decision under uncertainty, what you would change |
| Narration | no number and no ownership; the most common failure |
| Story bank | six to eight stories from the capstones, tagged by theme, at least two about failure |
| Timing | 130 to 150 words per minute; aim at about 220 words, near 100 seconds |
| Rehearsal | out loud, with a timer; eight stories is at most 16 minutes a pass |
| Your questions | specific, drawn from your own work, open a conversation; not generic culture questions |

There is no next lesson in this module: this is where the coding track's interview preparation ends. The next step is back in your capstones, turning each one into a talk and a handful of stories you can tell with the numbers in them.

::: context narration Telling versus showing
Writing teachers say "show, don't tell": instead of "she was scared", describe her hands shaking. Interview stories work the same way in reverse. Narration tells the listener what happened to a project; a good story shows what you did inside it. A quick test: cross out every sentence that would be equally true if you had not been there. Whatever remains is your story.
:::

::: context max-q The hardest part of the climb
Dynamic pressure is how hard the air pushes on a moving vehicle. It grows with air density and with the square of speed. Early in the climb the rocket is slow; later the air is thin. In between, about a minute after liftoff for many launch vehicles, the push peaks. Engineers call that moment max-q. Loads and aerodynamic forces are largest there, so it is where a simulation is most likely to misbehave.
:::

::: context adaptive-step Letting the integrator choose its step
A fixed-step integrator takes the same size of time step everywhere, so it must be small enough for the hardest moment of the whole flight. An adaptive-step integrator estimates its own error as it goes, takes small steps where things change fast (like max-q) and large steps where they do not. SciPy's solve_ivp does this by default. You set an error tolerance; the solver picks the steps to meet it.
:::

::: context story-bank A bank you can draw on
Think of it like a set of tools on a pegboard, each hanging in its place. When a question comes, you do not build a new story on the spot; you reach for the one that fits. Tagging each story by theme means you can find it fast under pressure.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <g font-size="11" fill="#1f2a44">
    <text x="10" y="22">stories</text>
    <text x="250" y="22">themes</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1.2" fill="#fff">
    <rect x="10" y="32" width="120" height="22"/>
    <rect x="10" y="62" width="120" height="22"/>
    <rect x="10" y="92" width="120" height="22"/>
    <rect x="10" y="122" width="120" height="22"/>
    <rect x="10" y="152" width="120" height="22"/>
  </g>
  <g font-size="11" fill="#1f2a44">
    <text x="16" y="47">diverging runs</text>
    <text x="16" y="77">flaky regression</text>
    <text x="16" y="107">degrees/radians</text>
    <text x="16" y="137">missing wind data</text>
    <text x="16" y="167">why I built it</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1.2" fill="#8fb8f0">
    <rect x="250" y="40" width="100" height="24"/>
    <rect x="250" y="76" width="100" height="24"/>
    <rect x="250" y="112" width="100" height="24"/>
    <rect x="250" y="148" width="100" height="24"/>
  </g>
  <g font-size="11" fill="#1f2a44">
    <text x="256" y="56">ownership</text>
    <text x="256" y="92">ambiguity</text>
    <text x="256" y="128">failure</text>
    <text x="256" y="164">mission</text>
  </g>
  <g stroke="#1d6fd1" stroke-width="1.5">
    <line x1="130" y1="43" x2="250" y2="52"/>
    <line x1="130" y1="43" x2="250" y2="88"/>
    <line x1="130" y1="73" x2="250" y2="52"/>
    <line x1="130" y1="73" x2="250" y2="88"/>
    <line x1="130" y1="103" x2="250" y2="124"/>
    <line x1="130" y1="133" x2="250" y2="88"/>
    <line x1="130" y1="163" x2="250" y2="160"/>
  </g>
</svg>
```

Most stories connect to more than one theme, which is why six to eight are enough.
:::

::: context flaky When a test fails for no reason
A flaky test passes and fails on the same code, with no change in between. Common causes are timing, random numbers without a fixed seed, and tolerances tighter than the run-to-run noise. Flaky tests are dangerous because people learn to ignore failures, and then a real failure gets ignored too. Fixing one — finding the cause, then setting a justified tolerance or a seed — is a classic ownership story.
:::

::: context questions-from-work The cheapest good question
You do not need inside knowledge to ask a good question. Every capstone left you with a real puzzle you had to solve somehow: how tight to set a test tolerance, how to pick a dispersion range, what to do when one run in a thousand fails. Ask how *they* solve that same puzzle. It is specific because it is real, and the interviewer instantly knows you have done the work, because nobody else would think to ask it.
:::

::: context capstones-again Where the answers live
Everything in this module points back to the capstones. The presentation in lesson 7 is a capstone told in twelve slides. The stories here are capstones told in two minutes. The questions you ask come from puzzles the capstones made you solve. If the interview is ever weeks away and you are unsure what to study, the answer is to open the capstones again, find the numbers, and practise saying what you did.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="130" y="55" width="100" height="40" rx="6" fill="#1d6fd1" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="80" font-size="12" fill="#fff" text-anchor="middle">capstones</text>
  <g stroke="#1f2a44" stroke-width="1.5" fill="#fff">
    <rect x="10" y="10" width="100" height="30" rx="4"/>
    <rect x="250" y="10" width="100" height="30" rx="4"/>
    <rect x="130" y="112" width="100" height="30" rx="4"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="60" y="29">12-slide talk</text>
    <text x="300" y="29">STAR stories</text>
    <text x="180" y="131">your questions</text>
  </g>
  <g stroke="#6c7a93" stroke-width="1.5">
    <line x1="140" y1="55" x2="100" y2="40"/>
    <line x1="220" y1="55" x2="260" y2="40"/>
    <line x1="180" y1="95" x2="180" y2="112"/>
  </g>
</svg>
```
:::
