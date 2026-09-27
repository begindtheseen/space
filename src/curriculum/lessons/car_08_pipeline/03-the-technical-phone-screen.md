---
id: l03-the-technical-phone-screen
title: "Stage 2: the technical phone screen"
minutes: 19
covers:
  - "stage 2 — technical phone screen, 30 minutes and sometimes 60 to 90, with a team engineer or the hiring manager"
---

Try this. Ask a friend to explain long division to you over the phone — no paper, no drawing, nothing to point at. Even a friend who is great at math will slow down. They have to keep every number in their head, say out loud which step they are on, and hope you are following. Knowing the math and *explaining it with only your voice* turn out to be two different skills.

The second stage of the hiring process tests exactly that second skill. It is the **technical phone screen**: the first stage where an engineer is on the other end of the call. It usually runs **thirty minutes**, with some reports of **sixty to ninety**. It is run by an engineer on the team you would join, or by the **[[hiring manager|hiring-manager]]** — the person who would be your boss. There is no whiteboard, and no shared document you can count on. You talk, and what you say is the whole piece of work being judged.

That is why a candidate who truly knows the material can still do badly here. A **[[whiteboard|whiteboard]]** normally does three jobs for you. It holds the symbols so you do not have to. It shows your listener the structure of your answer without you saying it. And it gives you a place to park half an idea while you work on the other half. On the phone, your sentences must do all three jobs, in real time, while someone waits. It is a different skill from knowing control theory — and it can be trained.

This lesson is the map of the stage: how long it is, who runs it, its two halves, and the reported GNC subjects you can prepare for by name. (GNC, said "G-N-C", is guidance, navigation and control.) The next module, on the screens, builds the skill itself: talking through a derivation without a whiteboard, asking clarifying questions before you answer, and the difference between "I don't know" and "I don't know, and here is how I would find out".

## Length, and who runs it

Thirty minutes is the typical length. Sixty to ninety minutes has been reported too. Treat both as normal. Neither one is a signal about you. A longer screen might mean a deeper conversation — or it might mean the interviewer had an hour free.

Now think about who is asking. Unlike the recruiter in the last stage, this person *does the work you are applying to do*. That has two consequences.

First, fuzziness shows. Suppose you give a hand-wavy answer about frequency-domain behavior. It sounds very different to someone who spends their week reading **[[Bode plots|bode-plot]]** — the standard graphs of how a control loop responds to different frequencies — than it does to a generalist.

Second, the conversation can go deep the moment you give it somewhere to go. That is an opportunity, not a danger, as long as the thing you led with is something you truly own.

::: key
The technical phone screen is 30 minutes typically, with some reports of 60 to 90, conducted by an engineer on the team or the hiring manager. It combines resume highlights with fundamental engineering questions tied to the role. Reported GNC topics include PD control, orbit determination and frequency-domain analysis.
:::

## The two halves

### Resume depth

Expect to be asked to go deeper on what you wrote. Not on all of it — there is not time. The interviewer picks. They usually pick whatever looks most relevant to the opening, which is usually the thing you most want to be asked about.

The standard to hold yourself to is easy to state: **every line on your resume is a line you can be taken [[three levels down|three-levels]]**. Suppose a bullet says you checked a **6-DOF** simulation (six degrees of freedom: three ways to slide, three ways to turn) against **analytic cases** — simple situations where the exact answer can be worked out with pencil and paper. Be ready for:

1. what those analytic cases were;
2. why you chose those and not others;
3. how close the simulation had to match them — the **tolerance**;
4. what you did when one of them did not match.

The portfolio module of this track built projects to survive exactly this kind of questioning. The resume module wrote bullets that invite it. This stage is where that work pays off.

::: warning A line you cannot defend is worse than no line
A bullet you cannot back up does not fail quietly. It fails in the middle of a thirty-minute conversation with an engineer who was, until that moment, interested. And it changes the question in their head from "what can this candidate do?" to "what else on this page is overstated?" Every line on the page is an invitation. Do not write an invitation you do not want accepted.
:::

### Fundamental engineering questions

The second half is fundamentals tied to the role. The reported GNC topics are specific enough to prepare for by name: **PD control**, **orbit determination**, and **frequency-domain analysis**.

None of the three is exotic, and that is the point. Here is what each one means in plain words.

- **[[PD control|pd-control]]** is proportional-derivative feedback. The *proportional* part pushes back harder the further you are from where you want to be. The *derivative* part pushes back against how fast the error is changing, like a brake. Expect questions on what each term does, what raising each one does to the response, and why the derivative term needs care when the sensor signal is noisy or sampled in steps.
- **[[Orbit determination|orbit-determination]]** is working out a spacecraft's orbit from measurements. Expect questions on what is being estimated, which measurements feed it, and what makes a solution well or poorly pinned down.
- **Frequency-domain analysis** is the picture of a control loop as a response to different frequencies: Bode and Nyquist plots (two standard ways of drawing that response), **gain margin** and **phase margin** (how much extra amplification or delay the loop can take before it goes unstable), and what a margin means physically, not only as a number read off a plot.

The technical track of this curriculum teaches all three properly. This module is not going to re-teach them in miniature. What it can tell you is that these three names are where preparation should point for this stage.

It can also tell you this: the eleventh module of this career track, on the domain round, drills the same material to a much higher standard than a thirty-minute call will ask for. Preparing for that round over-prepares you for this one. If your preparation is going to miss, that is the right direction for it to miss.

## Why thirty minutes changes the answer you should give

Take the length seriously for a moment and do the arithmetic. Suppose a thirty-minute call spends roughly half its time on resume depth. Then the technical part is about $30 \div 2 = 15$ minutes. A question that takes you five minutes to get oriented has used up $5/15 = 1/3$ of that before you have said anything useful.

The conclusion is *not* "answer fast". It is that your answers have to be **structured rather than exploratory**.

**Exploratory** thinking means working your way toward an answer out loud, trying things as you go. It is a real and often better way to crack a hard problem, and a whiteboard round is partly designed to let you do it. But it does not fit into a fifteen-minute window over a phone line. A candidate who treats a fundamentals question as an invitation to reason from scratch for eight minutes will run out of call before running out of derivation.

**Structured** means giving the answer its shape first. What fits is four steps, in this order:

1. **Restate** the question in your own words.
2. **Name the assumptions** you are making.
3. **Give the shape** of the answer in one sentence.
4. **Fill it in.**

This order has a big advantage. Even if you are cut off halfway, the interviewer has already heard the outline and knows you had an answer. The next module turns this into a drilled routine rather than a good intention.

::: key
Over the phone, answer in a fixed order: restate the question, name your assumptions, give the shape of the answer in one sentence, then fill it in. Structured beats exploratory when the technical portion is about fifteen minutes.
:::

## What this lesson does not know

Some things this course cannot tell you:

- whether you get one technical phone screen or two;
- whether yours is run by the hiring manager or by another engineer;
- which of the three reported topics comes up;
- whether there is a written scoring guide behind it;
- what standard separates a pass from a fail.

The topics above are *reported* subject matter, gathered from candidates' accounts. They are not a syllabus with a guaranteed table of contents.

The useful response to that uncertainty is not to prepare for everything equally. Notice instead that three things all point at the same body of material: the three reported topics, the domain round's content, and the technical track's modules on control, estimation and orbital mechanics (astrodynamics). Preparation aimed there is not wasted, whichever one shows up.

::: example A resume line that could not hold weight
A candidate's resume says: "Implemented an extended Kalman filter for attitude estimation fusing IMU and star tracker measurements." Unpacked, that means she wrote a program that works out which way a spacecraft is pointing (its **attitude**) by combining two sensors: an **IMU** (inertial measurement unit, a box of gyroscopes and accelerometers) and a **star tracker** (a camera that recognizes star patterns). An **extended Kalman filter** is the standard recipe for blending measurements like these.

The line is true. She wrote the filter, it ran, and it produced believable answers.

Here is how the call goes:

1. The interviewer, an engineer on an attitude-determination team, goes straight to that line, because it is the most relevant one on the page.
2. He asks how she checked that the filter was **[[consistent|filter-consistency]]**. He does not mean "did it settle down". He means: was the filter's own estimate of its error telling the truth about its actual error?
3. She has no answer, because she never ran that check.

The conversation does not end. Interviewers are not hunting for a reason to stop. But its character changes. The next several questions are about checking her work rather than about the work itself. The honest summary: the most relevant line on her resume turned out to be thinner than it read.

The fix is not to delete the line. It is to have run the check *before* the line existed. The portfolio module of this track builds consistency testing into the project itself, so that the most attractive line on the resume is also the most defensible one. A project whose write-up states how you know the result is right produces bullets that survive this stage by design.
:::

::: example Fifteen minutes, spent two ways
Two candidates get the same fundamentals question about twenty minutes into a thirty-minute screen. That leaves $30 - 20 = 10$ minutes. The question: how would you tune a PD controller for a **pointing loop** (the loop that keeps a spacecraft aimed at a target), and how would you know the result was any good?

**The first candidate** starts deriving the **closed-loop transfer function** out loud — the equation for how the whole controlled system responds. Her math is correct, and it is slow. Every symbol has to be named. Terms have to be held in memory on both ends of the phone line. By the time she reaches the **characteristic polynomial** (the equation whose roots decide how the system behaves), four minutes have passed — $4/10 = 0.4$ of the time left. She still has not stated one property of her design. The interviewer, watching the clock, steers her elsewhere. She has shown real ability and has not yet answered the question.

**The second candidate** spends fifteen seconds first, asking three things:

1. What is the **plant** — the thing being controlled?
2. Is there a meaningful delay in the sensor?
3. What is the pointing requirement — how accurate must it be?

Then she states the shape of her answer before filling it in:

- set the derivative gain for the **damping** she wants (how quickly wobbles die out);
- set the proportional gain for the **bandwidth** she can afford (how fast the loop reacts);
- check that the bandwidth stays well below the **[[first structural mode|structural-mode]]** — the lowest frequency at which the spacecraft's body naturally flexes;
- then look at gain and phase margin to see whether the design has any room to spare.

Only then does she go into detail, starting with the margin check, because that is what the second half of the question asked about.

**Sanity check.** She has used about ninety seconds to put a complete answer on the table. That is $1.5/10 = 0.15$ of the remaining time, leaving about $8.5$ minutes for the interviewer's follow-ups — which is the conversation this stage exists to have.

The difference between the two candidates was not knowledge. The second one gave her answer a **[[shape before content|time-split]]**.
:::

## Check yourself

::: check
State the length, the participants and the two halves of the technical phone screen.
:::

::: answer
It lasts thirty minutes typically, with some reports of sixty to ninety. It is run by an engineer on the team or by the hiring manager.

The two halves are:

- **resume depth** — going deeper on what you wrote;
- **fundamental engineering questions** tied to the role, with PD control, orbit determination and frequency-domain analysis reported as the GNC subjects.
:::

::: check
Why does having no whiteboard make this stage harder than its length suggests, even for a candidate who knows the material well?
:::

::: answer
A whiteboard does three jobs. It holds the variables so you do not have to keep them all in your head. It shows your structure to a listener without you narrating it. And it gives you a place to park a half-finished idea.

Over the phone, all three jobs fall to your sentences, in real time. So explaining a derivation out loud is a separate skill from knowing the subject. A candidate can be strong at the second and weak at the first.
:::

::: check
Using only the stage's stated length, argue why answers here should be structured rather than exploratory.
:::

::: answer
If thirty minutes splits roughly in half between resume depth and fundamentals, the technical portion is about fifteen minutes. A question that needs five minutes of orientation before anything useful is said has used $5/15 = 1/3$ of it.

Structure — restate, name assumptions, give the shape in one sentence, then fill it in — means the interviewer hears a complete answer early. Any interruption then lands after the substance, not before it.

Exploratory thinking is a real and often better method for a hard problem. It does not fit this window.
:::

::: check
A candidate's resume says she implemented a batch least-squares orbit determination fit. What should she assume about how that line will be treated on this call?
:::

::: answer
She should assume it is the line most likely to be picked, because it matches one of the reported topics directly. And she should expect to be taken several levels down:

- what was being estimated;
- which measurements were used;
- how well-conditioned the **normal equations** were — the equations the least-squares fit solves, which can be touchy if the measurements barely pin the orbit down;
- how she knew the fit was good;
- what she did in the cases where it was not.

Every resume line is an invitation to be questioned in depth, and the most relevant line is the one most likely to have its invitation accepted.
:::

::: check
Why does this lesson refuse to say what separates a pass from a fail at this stage?
:::

::: answer
Because no criterion is stated anywhere this course can rely on, and a made-up bar would be acted on.

What can be said honestly is where preparation should point. The three reported topics, the domain round's material, and the curriculum's control, estimation and astrodynamics modules are all the same body of knowledge. Effort aimed there is not wasted, whichever question arrives.
:::

## Summary

| Element | What it is |
| --- | --- |
| Length | 30 minutes typically; 60 to 90 reported |
| Who | An engineer on the team, or the hiring manager |
| First half | Resume depth — any line you wrote, taken several levels down |
| Second half | Fundamentals tied to the role |
| Reported GNC topics | PD control, orbit determination, frequency-domain analysis |
| Defining constraint | No whiteboard; your sentences are the whole piece of work |
| The answering habit | Restate, name assumptions, give the shape, then fill it in |
| Not knowable here | How many screens, who runs yours, which topic, what the bar is |

The next lesson covers the one stage that depends on the role rather than on you: the take-home exercise, which appears for some software and firmware roles, not for all of them.

::: context hiring-manager The person who would be your boss
The **hiring manager** is the manager of the team that has the opening. They asked for the job to be created, they usually have the biggest say in who gets it, and if you are hired you report to them. When the hiring manager runs your phone screen, you are talking to the person whose team problem you would be solving. That makes specific questions about the team's current work especially worth asking at the end.
:::

::: context whiteboard Why your head needs a board
Your working memory — the part of your mind that holds things while you use them — can only juggle a handful of items at once. A derivation can easily have more symbols and half-results than that. A whiteboard is extra memory you can see: once $K_p$ is written down, you stop spending effort holding it. On the phone that extra memory is gone, so good phone answers use fewer symbols, name them once, and say plainly which step comes next.
:::

::: context bode-plot Reading a Bode plot
A Bode plot (said "BOH-dee", after the engineer Hendrik Bode) shows a control loop's response at each frequency. The top panel is gain in decibels; the bottom is phase. Where the gain crosses 0 dB, read the phase: its distance above $-180^\circ$ is the **phase margin**. This one is drawn to scale for the open loop of the PD example in the note on P and D below: gain crosses 0 dB at about $1.54\,\mathrm{rad/s}$, with a phase margin of about $65^\circ$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <line x1="60" y1="20" x2="60" y2="120" stroke="#6c7a93" stroke-width="1"/>
  <line x1="60" y1="70" x2="340" y2="70" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="54" y="74" font-size="11" text-anchor="end" fill="#1f2a44">0 dB</text>
  <text x="54" y="24" font-size="11" text-anchor="end" fill="#1f2a44">+40</text>
  <text x="54" y="122" font-size="11" text-anchor="end" fill="#1f2a44">−40</text>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="60,19.9 74,24.8 88,29.7 102,34.6 116,39.4 130,44 144,48.5 158,52.8 172,56.9 186,60.6 200,64.1 214,67.3 228,70.3 242,73.2 256,75.9 270,78.6 284,81.2 298,83.7 312,86.3 326,88.8 340,91.3"/>
  <line x1="60" y1="140" x2="60" y2="200" stroke="#6c7a93" stroke-width="1"/>
  <line x1="60" y1="200" x2="340" y2="200" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="54" y="144" font-size="11" text-anchor="end" fill="#1f2a44">−90°</text>
  <text x="54" y="204" font-size="11" text-anchor="end" fill="#1f2a44">−180°</text>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="60,194.7 74,193.3 88,191.7 102,189.6 116,187.1 130,184.1 144,180.6 158,176.6 172,172.4 186,168 200,163.7 214,159.7 228,156.2 242,153.1 256,150.6 270,148.5 284,146.8 298,145.4 312,144.3 326,143.4 340,142.7"/>
  <line x1="226.4" y1="70" x2="226.4" y2="200" stroke="#1f2a44" stroke-width="1" stroke-dasharray="2 2"/>
  <line x1="226.4" y1="198" x2="226.4" y2="158" stroke="#b4232c" stroke-width="2.5"/>
  <text x="232" y="186" font-size="11" fill="#b4232c">phase margin ≈ 65°</text>
  <text x="232" y="64" font-size="11" fill="#1f2a44">crossover</text>
  <text x="60" y="216" font-size="11" fill="#1f2a44">0.1</text>
  <text x="200" y="216" font-size="11" text-anchor="middle" fill="#1f2a44">1</text>
  <text x="340" y="216" font-size="11" text-anchor="end" fill="#1f2a44">10 rad/s</text>
  <text x="200" y="14" font-size="11" text-anchor="middle" fill="#6c7a93">gain (top) and phase (bottom), log frequency</text>
</svg>
```
:::

::: context three-levels What "three levels down" looks like
Each question goes one layer deeper than the last. A line survives if you have real answers all the way down.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5" font-size="11">
    <rect x="10" y="10" width="340" height="30" rx="4" fill="#8fb8f0"/>
    <rect x="40" y="50" width="310" height="30" rx="4" fill="#fff"/>
    <rect x="70" y="90" width="280" height="30" rx="4" fill="#fff"/>
    <rect x="100" y="130" width="250" height="30" rx="4" fill="#f2b880"/>
  </g>
  <g font-size="11" fill="#1f2a44">
    <text x="20" y="29">Line: "validated 6-DOF sim vs analytic cases"</text>
    <text x="50" y="69">Level 1: which analytic cases?</text>
    <text x="80" y="109">Level 2: why those, and to what tolerance?</text>
    <text x="110" y="149">Level 3: what did you do when one failed?</text>
  </g>
</svg>
```
:::

::: context pd-control Why P sets speed and D sets damping
Picture a door on a spring with a hydraulic closer. The spring pulls harder the further the door is open — that is the P term. The closer resists fast motion — that is the D term. Too much spring and too little closer, and the door slams and bounces.

For a spacecraft with moment of inertia $J$ (its resistance to turning), a PD law $u = -K_p\theta - K_d\dot{\theta}$ gives

$$
\omega_n = \sqrt{\frac{K_p}{J}}, \qquad \zeta = \frac{K_d}{2\sqrt{K_p J}}
$$

so $K_p$ sets the natural frequency $\omega_n$ and $K_d$ sets the damping ratio $\zeta$. With $J = 100\,\mathrm{kg\,m^2}$, choosing $\omega_n = 1\,\mathrm{rad/s}$ needs $K_p = J\omega_n^2 = 100\,\mathrm{N\,m/rad}$, and $\zeta = 0.7$ needs $K_d = 2\zeta\omega_n J = 140\,\mathrm{N\,m\,s/rad}$.
:::

::: context orbit-determination Finding the orbit from clues
Ground stations measure a spacecraft's distance and how fast that distance is changing; cameras and GPS receivers add more clues. No single measurement gives the orbit, and every one has a little error. **Orbit determination** finds the orbit that fits all the measurements best. A **batch least-squares** fit gathers a whole batch of measurements and picks the orbit that makes the total squared mismatch as small as possible. You will build one in the technical track's estimation modules.
:::

::: context filter-consistency Is the filter honest about itself?
A Kalman filter reports two things: its best guess, and a **covariance** — its own estimate of how wrong that guess might be. A filter is **consistent** when that self-estimate matches its real errors. In a simulation you know the true answer, so you can check: over many runs, are the actual errors about as big as the filter claims? A filter can settle down smoothly and still be badly overconfident — which in flight means trusting a wrong answer.
:::

::: context structural-mode Keep the loop below the wobble
Every real structure has frequencies at which it naturally flexes, like a diving board after someone jumps off. The lowest is the **first structural mode**. A spacecraft with long solar panels may flex at a fraction of a hertz. If the control loop reacts fast enough to push at that frequency, it can pump energy into the wobble instead of calming it. So engineers keep the loop's bandwidth well below the first mode — a gap often talked about as a factor of several.
:::

::: context time-split Where the thirty minutes go
If half the call is resume depth, the technical half is fifteen minutes. Drawn to scale, a five-minute warm-up eats a third of it; a ninety-second outline leaves nearly all of it for follow-ups.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="30" y="20" width="150" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="180" y="20" width="150" height="30" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="105" y="40" font-size="11" text-anchor="middle" fill="#1f2a44">resume depth 15 min</text>
  <text x="255" y="40" font-size="11" text-anchor="middle" fill="#1f2a44">technical 15 min</text>
  <rect x="180" y="70" width="50" height="22" fill="#b4232c"/>
  <text x="236" y="86" font-size="11" fill="#1f2a44">5 min warm-up = 1/3</text>
  <rect x="180" y="104" width="15" height="22" fill="#1d6fd1"/>
  <text x="201" y="120" font-size="11" fill="#1f2a44">90 s outline = 1/10</text>
  <text x="30" y="144" font-size="11" fill="#6c7a93">0</text>
  <text x="180" y="144" font-size="11" text-anchor="middle" fill="#6c7a93">15</text>
  <text x="330" y="144" font-size="11" text-anchor="end" fill="#6c7a93">30 min</text>
</svg>
```
:::
