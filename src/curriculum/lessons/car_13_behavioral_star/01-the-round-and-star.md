---
id: l01-the-round-and-star
title: "What the behavioral round is asking for"
minutes: 22
covers:
  - "STAR structure: Situation, Task, Action, Result, and the common failure of spending most of the answer on Situation"
---

Imagine two ways a coach could pick a goalkeeper. She could ask, "Are you good under pressure?" Everyone says yes, so she learns nothing. Or she could ask, "Tell me about the last penalty you saved. What did you watch for, and where did you dive?" Now she hears something she can check against what she knows about goalkeeping. It asks what you *did*, not what you *are*.

That second kind of question is the whole idea behind the **[[behavioral round|behavioral-interview]]** — the part of a job interview where you are asked to describe real things you did in the past. "Tell me about a time you disagreed with a colleague." "Tell me about a time you had to decide without all the facts." 

You have spent weeks preparing for the technical rounds, and none of that answers "tell me about a time…". It is a different question — and still a real one. This round is not the friendly break between the hard interviews, and not a personality test you pass by being likable.

It asks for **specific past behavior** — what you actually did, in a real situation, told so the listener can follow it and check it. Two engineers can tell the same story and only one lands. The difference is rarely charm: one answer is built to carry evidence, and the other is a memory said out loud.

This lesson gives you the structure called STAR, the time budget that makes it work, and the way it fails when you improvise. The rest of the module builds on it.

## What this round is, and what this course does not know about it

This module tells you the themes that come up, the red flags interviewers report, that job postings state an extended-hours expectation in plain words, and what makes an answer strong or weak. It does **not** tell you how long the behavioral round runs, who runs it, whether it is a separate interview or woven into the technical ones, how many questions you get, whether notes are written down, or how much it counts against the other rounds. Those things vary. The person who can tell you how they work in *your* process is your **[[recruiter|recruiter]]** — the company's staff member who guides candidates through hiring. The recruiter screen is the natural time to ask.

So this lesson is about the **content and shape of your answers**, which you fully control. An answer built to the standard below works in a thirty-minute round or a ten-minute stretch inside a technical conversation.

## The four parts

**[[STAR|star-name]]** (said like the word "star") stands for **Situation, Task, Action, Result**. Always in that order. Think of a short film about one problem: where are we, what is the hero's job, what does she do, how does it end. Each part does a job the others cannot.

**Situation** is the least background the listener needs: the system, the limit you were under, what was at stake. Not the org chart or the history of the project.

**Task** is what was on *you* specifically. It is the sentence that separates your responsibility from everyone else's, and it is the part most often swallowed by the Situation. "The campaign had to run before the design review" is a situation. "I owned the [[dispersion set|monte-carlo]] and the pass criterion" is a task.

**Action** is what you did and — this is the important part — *why you chose that instead of something else*. It is the longest part and the part being judged. Name two or three decisions and the reasoning behind each, not a list of steps: anyone on the project could recite the steps, but the decisions are yours.

**Result** is what happened, said in a way the listener can check, plus what you took from it. It is short, comes last, and is the part candidates run out of time for.

::: key
STAR is Situation, Task, Action, Result. The common failure is spending most of the answer setting the scene. Aim for roughly 20 percent Situation and Task, 60 percent Action in the first person singular, and 20 percent a quantified Result.
:::

"First person singular" is grammar talk for *I*, not *we* — the subject of the next lesson. "Quantified" means it has a number in it — the subject of lesson 3.

## Where the ninety seconds go

Each story in this module runs about ninety seconds. How many words is that? It depends on how fast you talk, so measure your own **[[speaking rate|speaking-rate]]** — the words you say per minute — using the method from this track's ninety-second-narrative lesson. A rate you measured is a budget you can edit against. A rate you guessed is not.

A typical calm pace is about 130 words a minute. Ninety seconds is one and a half minutes, so:

$$
130 \times 1.5 = 195 \approx 200 \text{ words}
$$

Now split 200 words in the proportions from the key block:

- Situation and Task: $0.2 \times 200 = 40$ words. That is about **two sentences**.
- Action: $0.6 \times 200 = 120$ words. That is **four to six sentences**.
- Result: $0.2 \times 200 = 40$ words. That is **one sentence with a number in it, and one saying what it meant**.

In time, at the same pace, that is about 18 seconds, 54 seconds and 18 seconds. Sanity check: $18 + 54 + 18 = 90$. Good.

Two sentences of scene will feel like far too little. That feeling is the whole problem, so it is worth understanding.

## Why the scene runs long

Knowing *why* the scene swells tells you where to cut. Setting the scene is the only part of a STAR answer that makes no claim about you. Describing a system is comfortable and familiar, and it cannot be wrong. The moment you reach the Action you have to say *I decided*, and every sentence after that is a claim someone could disagree with. So the scene swells to fill the space in front of the uncomfortable part.

And ninety seconds feels roomy for the first twenty of them. Together these give you an answer that reaches the Action with thirty seconds left and never reaches the Result at all.

The damage is not that it sounds bad. It is that it holds **[[no evidence|scene-swell]]**. Everything the listener could use — what you decided, what you rejected, what it cost, what happened — lives in the two parts that got squeezed out.

::: warning Task and Action are not the same sentence
"I was responsible for the Monte Carlo campaign" is a Task. "I re-ran the campaign with the wind model dispersed and found the case that broke the gain schedule" is an Action. Candidates who mix them up state the responsibility and jump to the Result, skipping the decisions — a job description, not work. A quick test: if your Action sentences could be shuffled into any order and still be true, you have a list of duties, not a chain of decisions.
:::

## Why the Result is the part that shows judgment

The Result is short, so it is easy to treat as a formality. It is not: it is the only part where you **judge your own work**.

Situation and Task show that a problem existed and was yours. Action shows what you did. None of that says whether what you did was any good: a string of confident decisions can end in something that does not work, and the Action sounds the same either way.

The Result says how it came out, against what standard, and whether it met the bar you set beforehand. That is judgment — the mark of an engineer who measures outcomes instead of assuming them. So *and it worked* is not enough: worked against what test, measured how, compared with what? Lesson 3 is about that. For now, treat the last twenty seconds of every story as untouchable, and protect them by cutting the scene.

::: example The same story, told twice
The question: *Tell me about a time you had to make a technical judgment call with limited information.*

**Weak version — about a hundred and ninety words, and the Result never arrives:**

"So this was a six-degree-of-freedom launch vehicle simulation I built. It started as a smaller project, originally just a three-degree-of-freedom trajectory tool, and over a few months it grew into a full 6-DOF with rotational dynamics, an atmosphere model, propulsion, all of that. The structure of it is a Python outer layer with the integration inner loop in C++ for speed, and I had a configuration system so you could swap vehicle definitions. Around the middle of it I got to the point where I needed to decide about the atmosphere model, because I had been using an exponential atmosphere up to then, which is the standard quick model, and there was a question about whether that was good enough or whether I needed something layered, and there is quite a lot of literature on this. It is a real question because the whole dynamic pressure profile depends on it. So I looked into it, and in the end I went with a layered model, and it worked out well — the simulation gave sensible results after that."

**Strong version — about two hundred words, same project, same facts:**

"I was building a [[6-DOF|six-dof]] launch vehicle simulation, and I had to decide whether an [[exponential atmosphere|exponential-vs-layered]] was good enough or whether I needed a layered hydrostatic model. Nobody had specified a requirement — it was my project, so the requirement was mine to set.

I started from what the model was for. The simulation's main output was a dispersion campaign around [[max dynamic pressure|max-q]], so the question was not whether the atmosphere was accurate in general but whether it was accurate where the loads are. I coded both and compared them on the same altitude grid. Through the max-Q region the two agreed to within about ten percent on dynamic pressure, which I could have lived with — but the exponential fit was roughly thirty percent high by twenty kilometers and close to a factor of two by thirty, and my vehicle was still under thrust up there. So the error was not in the region I had been worried about; it was above it, in the region I had not checked.

I went with the layered model and wrote the comparison into the assumptions section. The result is that the dynamic-pressure profile above twenty kilometers is now trustworthy to the same standard as the profile below it, and the limitation I would have shipped without checking is documented rather than hidden."

**What is different.** The facts are identical. The weak version spends about a hundred and thirty of its hundred and ninety words on how the project grew, reaches the decision with two sentences left, and closes with *it worked out well* — which nobody can check.

The strong version gives the scene two sentences, spends the middle on reasoning that was the candidate's own (what is the model for, what would make it not good enough, how did I test that), and closes on a specific outcome. It even admits the check found something she was not looking for, which sounds like a person who ran the test honestly.

**Sanity check.** Against the 1976 US Standard Atmosphere, an exponential model with an 8.5 km scale height is within about 9 percent from 8 to 15 km, 31 percent high at 20 km and 1.95 times high at 30 km. The story's figures hold up.
:::

::: example An answer that stops at "and then it shipped"
**The candidate's Result, as given:** "...so I fixed the propagation and re-ran it, and after that everything was fine and we used it for the rest of the project."

**Why this leaves the answer unfinished.** The listener does not know how bad the problem was, how the candidate showed it was fixed rather than hidden, or what the fix cost. Nothing in it could be false, and nothing in it is evidence.

**The repair — same story, three sentences longer:** "...so I fixed the propagation and re-ran it. The filter had been reporting a covariance about a factor of three tighter than its actual error, which is the kind of overconfidence that quietly poisons anything downstream that trusts it — so I did not take *looks better* as the test. I ran a hundred-run Monte Carlo and checked the [[normalized estimation error squared|nees-check]] against its chi-square band, and after the fix the average sat inside the band where before it had been well above the upper limit. The habit I took from it is that I now write the consistency test before the filter, not after, because I would not have caught this by looking at the error plot."

**What the repair adds.** A measured statement of how wrong it was, a named standard for "fixed", evidence the standard was met, and a change in practice. Same event — but now it can be checked, and the candidate is visibly the one who chose the standard.
:::

## Delivery: prepared, not memorized

A story you have written and timed will sound prepared. That is fine; the alternative is rambling. What you want to avoid is **recitation**: the flat, slightly fast delivery of a memorized paragraph. Listeners can hear it, and it falls apart the moment a follow-up question knocks it off course.

The fix is to memorize the **[[skeleton, not the words|skeleton-not-script]]**: the two-sentence scene, the two or three decisions in order, the number at the end. Say it aloud five times: it will come out a little differently each time and be the same story each time. That is what you want, because the follow-up questions are the real conversation.

## Check yourself

::: check
A candidate's answer to *tell me about a time you had to work with an unclear requirement* runs a hundred and ten seconds. About eighty seconds describe the project and the team, twenty describe what she did, and ten say the outcome was good. She is told to make the answer shorter. What is the wrong fix, and what is the right one?
:::

::: answer
The wrong fix is to shrink everything by the same fraction, so the scene still takes about three quarters. That keeps exactly the flaw.

The right fix is to cut the scene to two sentences and spend the freed time on Action and Result. Work it through for a 90-second target at the 20/60/20 split: the scene drops from 80 seconds to about 18, which frees about 62 seconds. Twenty of those come off the total (110 down to 90). The other 42 or so go back in: the Action grows from 20 to about 54 seconds, and the Result from 10 to about 18. Check: $18 + 54 + 18 = 90$.

The answer gets shorter and carries more evidence, because the part that was cut was the part carrying none.
:::

::: check
Why does this lesson claim the Result shows judgment, when the Action is the part where the candidate makes decisions?
:::

::: answer
Because the Action sounds the same whether the decisions were good or bad: a confident chain of choices that missed its requirement sounds exactly like one that met it. The Result is where you state the outcome against a standard: what the criterion was, what was measured, and whether it met the bar you fixed in advance. Naming that standard, and reporting the number even when it is not flattering, shows that you check your own work instead of assuming it turned out well. An answer with no Result asks the listener to take your judgment on trust.
:::

::: check
Turn this into a Task sentence: "The project was a batch least-squares orbit determination fit to two-line-element-derived positions, and there were four of us on the club team."
:::

::: answer
As written it is not a Task at all. It is thin Situation — the team's head count helps the listener follow nothing. A Task sentence names what was on you, for instance: "I owned the estimator itself — the Gauss-Newton iteration, the convergence criteria and the covariance we reported." The test is whether the sentence draws a line between your responsibility and everyone else's. If a teammate could say the same sentence about themselves, it is not a Task.
:::

::: check
You have a story whose honest Result is that the thing did not work. Does STAR still apply, and what goes in the last twenty seconds?
:::

::: answer
It applies unchanged. The Result is the outcome measured against the standard, and *it did not meet the criterion* is an outcome. The last twenty seconds hold the measured shortfall, how you established it, and the specific consequence or change that followed — that you stopped the approach and why, or what you would have needed to do differently for it to work. What does not go there is a rescue: a sudden recasting of the failure as a success, or a general lesson about perseverance. A later lesson is devoted to the failure story.
:::

::: check
An interviewer interrupts you forty seconds into a story to ask what the pass criterion was. Have you lost control of the answer?
:::

::: answer
No — the interruption is the conversation working. Answer the question at the depth asked, then go back to where you were. You can, because you memorized the skeleton and not a paragraph.

A question at forty seconds usually means the scene was long enough and the listener wants the substance — a signal about your budget. It also asked for exactly the detail your Result was going to carry, so the story is pointed at something worth probing. The only way this goes wrong is if you insist on finishing your prepared sentence first.
:::

::: check
Why does this lesson tell you to memorize the skeleton rather than the sentences, when a rehearsed paragraph would sound more polished?
:::

::: answer
Because polish is not what is being judged, and fragility has a real cost. A memorized paragraph sounds recited and does not survive interruption — and follow-up questions are the normal shape of this round. A skeleton (two-sentence scene, two or three decisions, one measured outcome) gives the same content every time in slightly different words. It lets you take an interruption and come back, and it lets you stretch or shrink the story to fit the time you have. The one thing worth fixing word for word is the number in the Result, because that is the part you do not want to approximate on the spot.
:::

## Summary

| Part | Share of ninety seconds | Its job | How it fails |
| --- | --- | --- | --- |
| Situation | Two sentences, together with Task | System, constraint, stakes — nothing else | Swells to fill the answer |
| Task | Part of those two sentences | Separates your responsibility from the team's | Swallowed by Situation |
| Action | About sixty percent | The decisions you made and why | Becomes a list of steps or duties |
| Result | About twenty percent | Outcome against a standard, with a number | Never arrives, or is "it worked" |
| Word budget | About 200 words at 130 per minute | 40 / 120 / 40 words | Guessing your rate instead of measuring it |

The scene is the only part that makes no claim about you, so it grows in front of the part that does. The next lesson takes the Action on its own and deals with its other structural failure: telling your work as *we*, which makes your contribution impossible to judge no matter how good the rest of the answer is.

::: context behavioral-interview Why ask about the past at all
The idea behind this kind of interview is simple: what you actually did in a real situation tells an employer more than what you say you would do in an imagined one. Anyone can describe an ideal response to a hypothetical conflict. Fewer people can describe a real conflict in detail, with names of systems, numbers, and a decision they now regret or stand by. That is why the questions start with "tell me about a time…" and why vague or hypothetical answers score poorly. You will also hear it called a "behavioral" interview in British spelling — same thing.
:::

::: context recruiter The person who runs your process
A recruiter works for the company, on the hiring side. Their job is to find candidates, set up interviews, explain the steps, and keep things moving. They are not usually the engineer who judges your technical answers, but they know how the company's process runs: how many rounds, how long each is, who you will meet. Asking them is normal and expected. It is not a sign of weakness to ask "what does the behavioral part look like here?" — it is preparation, and recruiters generally prefer candidates who arrive knowing what to expect.
:::

::: context star-name A name built from first letters
STAR is an acronym: a word made from the first letters of other words — Situation, Task, Action, Result. You may meet cousins of it with different letters, such as CAR, where the C stands for Context or Challenge. They all describe the same shape: a little background, what you did, how it came out. The names matter less than the proportions. Whatever you call it, the scene stays short and the action carries the weight.
:::

::: context monte-carlo Rolling the dice a thousand times
A Monte Carlo campaign runs the same simulation hundreds or thousands of times, each time with the uncertain things — wind, engine thrust, mass — nudged by a random amount. Those random nudges are called **dispersions**. Instead of one answer you get a crowd of them, and you can count how many cases pass. The **pass criterion** is the rule, fixed in advance, that decides whether a case passes. The name comes from the Monte Carlo casino in Monaco, because the method runs on chance like a roulette wheel.
:::

::: context speaking-rate Timing your own voice
Your speaking rate is how many words you say per minute. Calm conversation for most people falls somewhere around 120 to 160. Measure yours: read two hundred words of ordinary text aloud at your real interview pace, time it, and divide words by minutes. If 200 words take 92 seconds, your rate is $200 / (92/60) \approx 130$ words a minute. Nerves usually make people faster, not slower, so measure once calmly and once after a brisk walk up the stairs.
:::

::: context scene-swell Where a rambling answer spends its time
Here is the check-yourself answer's 110-second story next to the 90-second target. The gray scene shrinks; the blue Action and orange Result grow. The strong answer is shorter and carries more.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="10" y="22" font-size="12" fill="#1f2a44" font-weight="700">Weak, 110 s</text>
  <rect x="10" y="30" width="218.2" height="30" fill="#6c7a93" stroke="#1f2a44" stroke-width="1"/>
  <rect x="228.2" y="30" width="54.5" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <rect x="282.7" y="30" width="27.3" height="30" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <text x="119" y="50" font-size="11" fill="#fff" text-anchor="middle">scene 80 s</text>
  <text x="255" y="50" font-size="11" fill="#1f2a44" text-anchor="middle">20 s</text>
  <text x="296" y="50" font-size="11" fill="#1f2a44" text-anchor="middle">10</text>
  <text x="10" y="86" font-size="12" fill="#1f2a44" font-weight="700">Strong, 90 s</text>
  <rect x="10" y="94" width="49.1" height="30" fill="#6c7a93" stroke="#1f2a44" stroke-width="1"/>
  <rect x="59.1" y="94" width="147.3" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <rect x="206.4" y="94" width="49.1" height="30" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <text x="34.5" y="114" font-size="11" fill="#fff" text-anchor="middle">18 s</text>
  <text x="132.7" y="114" font-size="11" fill="#1f2a44" text-anchor="middle">Action 54 s</text>
  <text x="231" y="114" font-size="11" fill="#1f2a44" text-anchor="middle">18 s</text>
  <text x="10" y="143" font-size="11" fill="#6c7a93">grey: Situation + Task · blue: Action · orange: Result</text>
</svg>
```

Both bars use the same scale: the whole top bar is 110 seconds, so the bottom bar is shorter by exactly the 20 seconds that were cut.
:::

::: context six-dof Six ways to move
"6-DOF" is read "six dee-oh-eff" and means six degrees of freedom. A degree of freedom is one independent way something can move. A rocket can move in three directions — up and down, left and right, forward and back — and it can turn about three axes: pitch (nose up and down), yaw (nose left and right) and roll (spin about its long axis). Three moves plus three turns makes six. A "3-DOF" simulation tracks only the position, treating the rocket as a moving dot. Adding the three turns is what lets a simulation show whether the control system can keep the vehicle pointed the right way.
:::

::: context exponential-vs-layered Two ways to model thin air
Air gets thinner as you climb. The quick model says density falls by the same fraction for every kilometer — an exponential curve. The real atmosphere is built from layers with different temperatures, so the fall-off changes speed with height. The quick model's one setting is its scale height, the climb over which density falls to about 37 percent; here it is 8.5 km. The bars show how much it misstates density compared with the 1976 US Standard Atmosphere.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="60" y1="140" x2="340" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="60" y1="140" x2="60" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="60" y1="80" x2="340" y2="80" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="54" y="84" font-size="11" fill="#6c7a93" text-anchor="end">1.0</text>
  <text x="54" y="24" font-size="11" fill="#6c7a93" text-anchor="end">2.0</text>
  <text x="54" y="144" font-size="11" fill="#6c7a93" text-anchor="end">0</text>
  <rect x="90" y="85.4" width="50" height="54.6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <rect x="175" y="61.4" width="50" height="78.6" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <rect x="260" y="23" width="50" height="117" fill="#b4232c" stroke="#1f2a44" stroke-width="1"/>
  <text x="115" y="102" font-size="11" fill="#1f2a44" text-anchor="middle">0.91</text>
  <text x="200" y="56" font-size="11" fill="#1f2a44" text-anchor="middle">1.31</text>
  <text x="285" y="18" font-size="11" fill="#1f2a44" text-anchor="middle">1.95</text>
  <text x="115" y="156" font-size="11" fill="#1f2a44" text-anchor="middle">10 km</text>
  <text x="200" y="156" font-size="11" fill="#1f2a44" text-anchor="middle">20 km</text>
  <text x="285" y="156" font-size="11" fill="#1f2a44" text-anchor="middle">30 km</text>
</svg>
```

A ratio of 1.0 (dashed line) would mean perfect agreement. Near max-Q the two are close; higher up the quick model runs badly high.
:::

::: context max-q The hardest squeeze of the climb
Dynamic pressure, written $q$, measures how hard the oncoming air pushes on a moving vehicle: $q = \tfrac{1}{2}\rho v^2$, where $\rho$ (read "rho") is air density and $v$ is speed. Right after liftoff the rocket is slow, so $q$ is small. High up the air is thin, so $q$ is small again. Somewhere in between — typically about a minute into flight, roughly 10 to 15 km up for a large launcher — $q$ peaks. That peak, "max-Q" (said "max cue"), is when aerodynamic loads on the structure are near their worst, which is why a simulation built to study loads must get the air right there.
:::

::: context nees-check Asking a filter to be honest about itself
A navigation filter estimates where a vehicle is and also reports how unsure it is — its covariance, a kind of error bar. The normalized estimation error squared, or NEES (said "knees"), compares the actual error with that reported error bar. If the filter is honest, NEES averages about the number of things it estimates. If the filter claims to be more certain than it is, NEES comes out far too big. For 6 states averaged over 100 runs, 95 percent of honest averages land between about 5.3 and 6.7.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="163.5" y="40" width="34.0" height="30" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1"/>
  <line x1="30" y1="70" x2="330" y2="70" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="340,70 330,65 330,75" fill="#1f2a44"/>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="30" y1="70" x2="30" y2="76"/><line x1="105" y1="70" x2="105" y2="76"/><line x1="180" y1="70" x2="180" y2="76"/><line x1="255" y1="70" x2="255" y2="76"/><line x1="330" y1="70" x2="330" y2="76"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="30" y="90">0</text><text x="105" y="90">3</text><text x="180" y="90">6</text><text x="255" y="90">9</text><text x="330" y="90">12</text>
  </g>
  <text x="180" y="32" font-size="11" fill="#1d6fd1" text-anchor="middle">honest: 5.3 to 6.7</text>
  <circle cx="182.5" cy="55" r="5" fill="#1d6fd1"/>
  <line x1="255" y1="55" x2="320.0" y2="55" stroke="#b4232c" stroke-width="3"/>
  <polygon points="330,55 317.5,49 317.5,61" fill="#b4232c"/>
  <text x="287.5" y="44" font-size="11" fill="#b4232c" text-anchor="middle">overconfident</text>
  <text x="180" y="112" font-size="11" fill="#6c7a93" text-anchor="middle">average NEES, 6 states, 100 runs</text>
</svg>
```

An overconfident filter's average sits far off to the right. You will build this test yourself in the estimation modules.
:::

::: context skeleton-not-script How stand-up comedians remember a set
Comedians and conference speakers rarely memorize every word. They memorize the beats: the order of the ideas and the one line that has to land exactly. Everything between the beats is said fresh each time, which is why the delivery sounds alive and why they can respond to a heckle and carry on. Your STAR skeleton works the same way. Three beats — scene, decisions, number — and one line fixed word for word: the Result's number.
:::
