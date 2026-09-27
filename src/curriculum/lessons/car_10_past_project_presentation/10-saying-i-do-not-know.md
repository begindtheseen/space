---
id: l10-saying-i-do-not-know
title: "I do not know — and here is how I would find out"
minutes: 22
covers:
  - "saying I do not know, here is how I would find out"
---

A stranger stops you on the street and asks the way to the train station. You are not sure. You could point confidently down some road and hope. Or you could say: "I don't know exactly — but it is north of here, past the library, and the map on that bus stop will show you." The first answer feels more helpful — until the stranger is lost and never trusts your directions again.

A panel question you cannot answer is the same moment, and it is routine, not a failure. Five to ten engineers each poke at your project from their own expertise; the only surprise would be nobody finding an edge — a spot where your knowledge stops. What gets scored is the fifteen seconds after someone finds it.

There is a reliable answer for those fifteen seconds, and it is the opposite of the instinct. The instinct is to produce *something*: a plausible-sounding guess, a jump to nearby material you do know, a general statement that sounds like an answer. All three are forms of **[[bluffing|bluff-word]]** — acting as if you know when you do not — and all three are worse than the gap they are hiding.

::: key
Saying "I do not know" in a panel: say it, then add how you would find out, and give a bound if one exists. "I have not measured that, but it is bounded above by the sensor bandwidth, and I would characterize it with a step response." This reads as confidence, not weakness.
:::

Two words in that example answer need a meaning. A **bound** is a limit you are sure of even when you do not know the exact value — "it is less than this" or "it is more than that." A **step response** is what a system does when its input jumps suddenly from one level to another; watching it is a standard way to measure how fast something reacts.

## Why a guess is so expensive

A room of experts spots guessing quickly. A guess has no carefully chosen units, no method behind it, and no sense of how uncertain it is. What makes it expensive is that the damage spreads.

Once the panel catches one bluff, they can no longer separate what you *measured* from what you merely said *confidently*. Everything you said earlier — the numbers, the test results, the reasons behind your decisions — gets moved into a new pile. It stops being "reported by a careful person" and becomes "reported by somebody who says things confidently." The damage works **[[retroactively|trust-all-at-once]]**: it reaches backward in time and lowers the value of things you said before the guess.

You cannot repair this in the time left, because the repair would itself be more confident statements. One fifteen-second gap, covered badly, can cost the whole session.

"I have not measured that" costs close to nothing. Nobody expects you to have measured everything, and several of them have given exactly that answer in a **[[design review|design-review]]** this month.

## The three parts, in order

A good "I do not know" has three parts, and the order matters.

**1. The admission — short, and first.** "I have not measured that." Four or five words, before any background. Buried at the end of a warm-up, an honest answer sounds dragged out of you.

**2. The bound, if one exists.** Almost always one does (the next section says where to find it). A bound turns "I do not know" into "I know it is smaller than this" — a far more useful statement.

**3. The method.** What you would actually do to find out: the specific measurement or test, not "I would investigate further." This part shows you have a working relationship with the question, rather than a hole where one should be.

Why this order? Admission, bound, method sounds like a person who knows the exact shape of what they do not know. The same three pieces backward sound like a person working up to a confession. That is **[[the three-part answer|three-part-pipeline]]**, and it works for nearly every question you cannot answer.

## Where bounds come from

A bound is almost always available from something you already know. Finding one live is the same skill as estimating anything. Here are four sources.

**A physical limit.** Some things are impossible, and that caps the answer. You cannot observe a disturbance that changes faster than your **sensor's [[bandwidth|bandwidth]]** — roughly, the fastest change the sensor can follow. Another example: a **[[magnetorquer|magnetorquer]]** — a coil that pushes against Earth's magnetic field to turn a spacecraft — cannot remove the part of the spacecraft's stored spin, its **momentum** $\mathbf h$, that points along the field direction at that instant. The torque it can make is $-k\,\mathbf h_\perp$. Read $\mathbf h_\perp$ as "h perp": the part of the momentum perpendicular to the field. The parallel part is out of its reach.

**A budget you already computed.** Suppose you worked out that the worst-case disturbance piles up to $2.40\times10^{-3}\,\mathrm{N\,m\,s}$ of momentum over one orbit (newton-meter-seconds, the unit of spin momentum). Then anything driven by that disturbance is bounded by it — whether or not you measured the particular quantity being asked about.

**A detectability argument.** "Detectable" means big enough to be seen. Take a star tracker — a camera that works out orientation from star patterns — whose noise is $5\times10^{-5}\,\mathrm{rad}$ per axis (rad is short for radian, the natural unit of angle). A gyro with a constant **bias** $b$ (read "b") — a small false turning rate it always reports — builds up an angle error that grows steadily with time. The tracker can see that error once it climbs above the tracker's own noise. Over a $100\,\mathrm{s}$ window, that happens when

$$
b \times 100\,\mathrm{s} = 5\times10^{-5}\,\mathrm{rad}
\quad\Longrightarrow\quad
b = \frac{5\times10^{-5}\,\mathrm{rad}}{100\,\mathrm{s}} = 5\times10^{-7}\,\mathrm{rad/s}.
$$

In words: divide the smallest visible angle by the time available. A bias above about $5\times10^{-7}\,\mathrm{rad/s}$ — roughly $0.10\,^\circ/\mathrm{hr}$, a bit more than a tenth of a **[[degree per hour|deg-per-hour]]** — is observable in that window, and anything far below it is not. That bound can be said out loud in one sentence, built from two numbers you already know.

**An order-of-magnitude argument from the mechanism.** An **order of magnitude** is a factor of ten: an order-of-magnitude estimate gets the answer's size roughly right — tens, not thousands — without claiming the exact value. When you use one, say so: "this is an order-of-magnitude estimate, not a measurement." That label keeps the answer honest and costs nothing.

::: note Why the magnetorquer cannot reach the parallel part
A magnetorquer makes a magnetic dipole $\mathbf m$, and the torque on it is $\boldsymbol\tau = \mathbf m \times \mathbf B$, where $\mathbf B$ is Earth's field. A cross product is perpendicular to both of its inputs, so the torque is always perpendicular to $\mathbf B$ and can only change the part of $\mathbf h$ perpendicular to $\mathbf B$. The standard choice $\mathbf m = k\,(\mathbf h \times \mathbf B)/|\mathbf B|^2$ gives

$$
\boldsymbol\tau = \frac{k}{|\mathbf B|^2}(\mathbf h \times \mathbf B)\times \mathbf B = -k\,\mathbf h_\perp ,
$$

which pushes the perpendicular part toward zero. Over an orbit the field direction swings around, so the out-of-reach part changes; at any single instant, though, the parallel part is untouchable.
:::

## The three kinds of not knowing

There are three kinds of "I do not know", and they need different answers.

**You did not measure it.** You could have; you did not. Give the bound and the measurement you would make.

**It was out of scope.** "Scope" is the fence around what a project set out to do. Name the boundary and the reason; if your write-up's assumptions section is done properly, the answer is already there.

**You do not know the concept.** The question uses a term or a method you have never met. Candidates fear this one most, and it is actually the cheapest of the three, because the honest response is also the most useful one:

> "I do not know that formulation — I have not worked with it. What does it buy you over the [[multiplicative error state|mekf]]?"
>
> …and then, once they tell you, reason about it out loud against your own problem.

Asking is not giving up. It turns a dead end into a technical conversation, where the panel watches you take in a new idea and test it against a system you know well — a close preview of working with you.

::: example "What is the worst-case solve time on a flight processor?" — anchor project B
Anchor project B is guidance software for a rocket landing. It sets up the landing as an optimization problem — a problem of finding the best choice among many — and a program called a **solver** finds the best thrust plan. The panel asks how long that takes on the kind of computer that actually flies, a **[[flight processor|flight-processor]]**.

**Weak, the guess.** "Probably a few milliseconds. It is a small problem and convex solvers are fast."

That is two invented claims with nothing behind them, offered to a room that likely contains someone who has timed a solver on real flight hardware.

**Weak, the bare refusal.** "I do not know. I never ran it on flight hardware."

True — and it stops there. The panel learns that a gap exists and nothing about how the candidate thinks about it.

**Strong.** "I have not measured it — I ran on a desktop and never timed it carefully. Here is what I can say. It is a second-order cone program with forty nodes, and an interior-point method's cost per iteration is dominated by one factorization of a matrix whose size is set by that problem size. Its iteration counts are empirically stable across instances of the same formulation, rather than data-dependent the way an active-set method's can be. That stability is a large part of why convex formulations are attractive onboard in the first place — but empirically stable is not a bound, and I would not put a number on a flight processor without measuring. What I would do: cross-compile for the target, run the whole dispersion set on it, and report the maximum over cases rather than the mean, because a control loop's time budget is a worst case. I would also check whether the solver [[allocates memory dynamically|no-malloc]], because in a flight control path that is usually a rule that has to be settled before timing even matters."

Decoded: a **second-order cone program** is a kind of convex problem, one whose best answer a computer finds reliably. **Forty nodes** means the flight is chopped into forty time points. An **interior-point method** creeps toward the answer from inside the allowed region; an **active-set method** is another solver family whose work depends more on the data. **Cross-compile** means build on your desktop for a different chip. The **dispersion set** is the project's randomly varied Monte Carlo test cases.

**What separates them.** The strong answer says what it does not know, gives a structural reason for how the quantity behaves, refuses to turn that reasoning into an unmeasured number, and names a measurement specific enough to schedule. Its last sentence also shows the candidate knows what disqualifies code from a flight control path — unasked, and more telling than the timing number.
:::

::: example "How did you handle propellant slosh?" — anchor project A
Anchor project A is a computer simulation of a rocket climbing to orbit. **[[Slosh|slosh-pendulum]]** is the propellant swinging around inside the tanks, the way water sloshes in a bucket you carry too fast.

**Weak.** "The mass properties are time-varying, so the changing propellant mass is captured in the inertia model."

This answers a different question: propellant getting lighter is not propellant *moving around*, and everyone in the room knows it. Jumping to nearby material you do know is the most common form of bluffing, and it is more visible than a plain guess, because the asker sees the mismatch.

**Strong.** "I did not model it. The vehicle is a rigid body with time-varying mass and inertia, and nothing in my model represents propellant moving relative to the tank. Here is what I know about why it matters. Slosh is a lightly damped mode, usually represented by an equivalent pendulum or mass-spring per tank, and the risk is that it couples into the attitude control loop when its frequency is close to the control bandwidth. Whether it would change my conclusions depends on the separation between those two frequencies, which I have not computed. So the first thing I would do is estimate the slosh frequency for my tank shape and fill levels across the burn, and compare it against my loop bandwidth. If they are within a factor of a few, my control-authority result is not trustworthy as it stands, and the model needs a slosh mode. That is the honest limit of what I can say."

Decoded: a **rigid body** is treated as perfectly solid inside. A **mode** is a natural wobble with its own frequency; **lightly damped** means it dies out slowly. The **attitude control loop** keeps the rocket pointed, and its **bandwidth** is roughly the fastest wobble it can fight. **Control authority** is the steering force held in reserve.

**What separates them.** The strong answer names the gap at once, shows it knows what the missing physics does and how it is usually modeled, identifies the one comparison that decides whether the gap matters, and says its result depends on it. That beats a candidate who *had* modeled slosh but never asked whether it mattered.
:::

## What must not follow "I do not know"

**A recovery monologue.** Two minutes on a nearby topic you do know sounds like dodging, and spends time others are waiting to use.

**An apology.** "Sorry, I should know that." It was not a mistake until you called it one.

**"I will look it up and get back to you" as the whole answer.** You will not, they know you will not, and it is a way of not answering now.

::: warning
The mirror-image failure is hedging on things you *do* know. To **hedge** is to soften a statement so you cannot be pinned to it. "I think the [[mean NEES|nees-recap]] was around six" — when it was $6.067$ and you could state the band it sat inside — is the habit the rehearsal exercise tells you to hunt for on your recording. Hedging is a signal. If you spend it on facts you are certain of, it carries no meaning when you really are unsure. Worse, a panel that hears "I think" attached to measured results starts wondering which of your numbers you actually checked. Be calibrated in both directions: flat and specific about what you measured, explicit and bounded about what you did not.
:::

## Rehearsing the one thing you cannot rehearse

You cannot rehearse the question that will catch you, but you can rehearse the *response*.

**First, put questions you cannot answer into your thirty-question list on purpose.** The list is doing its job when some have no answer. Practice the three-part response on those, out loud, until the opening words arrive without hesitation.

**Second, choose your opening words in advance and use the same ones every time.** "I have not measured that." "I did not model that." "I do not know that formulation." A fixed opener removes the half-second of panic in which a guess is born.

## Check yourself

::: check
Explain why one detected guess costs more than the gap it was covering, in terms of what the panel can conclude afterward.
:::

::: answer
Because the damage does not stay in one place. Once the panel has caught one confident statement that had nothing behind it, they cannot tell your measured claims apart from your merely confident ones. So every number and test result you reported earlier gets re-judged as possibly the same kind of statement. You cannot repair this within the session, because the repair would be made of more confident statements. The gap itself would have cost about fifteen seconds, and nobody expects a candidate to have measured everything.
:::

::: check
State the three parts of the answer and explain why the order matters.
:::

::: answer
First the admission, short and at the front; then the bound, if one exists; then the method by which you would find out. The order matters because of how it lands. Admission first sounds like someone who knows the shape of their own ignorance and gets straight to it. The same three pieces in reverse — method, bound, then finally the admission — sound like working up to a confession: the warm-up makes the eventual admission sound reluctant instead of matter-of-fact.
:::

::: check
A panel member asks about a formulation you have never met. Give the response this lesson recommends, and explain why it is not giving up.
:::

::: answer
Say plainly that you do not know it and have not worked with it. Then ask what it buys over the approach you used, and, once told, reason out loud about whether it would help on your own problem. It is not giving up because it turns a dead end into a technical exchange in which the panel watches you absorb an unfamiliar idea and test it against a system you know well. That is a closer preview of working with you than most rehearsed questions, and it tells the panel things about you that a smooth dodge would hide.
:::

::: check
A candidate is asked for a quantity they never measured and have no number for. Give three different sources a usable bound can come from, with an example of each.
:::

::: answer
A physical limit: a magnetorquer cannot remove stored momentum along the magnetic field direction at a given instant, because the torque it can make is $-k\,\mathbf h_\perp$, which touches only the perpendicular part. A budget already computed: if the worst-case disturbance piles up to $2.40\times10^{-3}\,\mathrm{N\,m\,s}$ over an orbit, anything driven by that disturbance is bounded by it. A detectability argument from two numbers you already have: with $5\times10^{-5}\,\mathrm{rad}$ star-tracker noise and a $100\,\mathrm{s}$ window, a gyro bias above about $5\times10^{-5} \div 100 = 5\times10^{-7}\,\mathrm{rad/s}$, roughly $0.10\,^\circ/\mathrm{hr}$, is observable and anything far below it is not. A labeled order-of-magnitude estimate from the mechanism is a fourth source, as long as you say it is an estimate and not a measurement.
:::

::: check
Why does this lesson call hedging on a number you actually measured more damaging than it looks?
:::

::: answer
Because hedging is a signal, and a signal only means something if you save it for when it is true. Saying "I think it was around six" about a result you measured as $6.067$, with a known acceptance band, spends that signal on something certain. Then, when you hedge about something really uncertain, the panel cannot tell the difference. Worse, a panel that hears unsure language on measured results starts asking which of your numbers were actually checked — turning a verified result into an open question. The goal is calibration both ways: flat and specific about what you measured, explicit and bounded about what you did not.
:::

## Summary

| Item | Statement |
| --- | --- |
| The response | Say it; give a bound if one exists; name the method that would settle it |
| Order | Admission first and short — warm-up turns an honest answer into a confession |
| Why bluffing is expensive | One detected guess lowers the value of every measured claim you made, backward in time |
| Kind one | Not measured — give the bound and the measurement |
| Kind two | Out of scope — name the boundary; it should already be in your assumptions section |
| Kind three | Unfamiliar concept — say so, ask what it buys, then reason about it live |
| Bound sources | A physical limit, a budget already computed, a detectability argument, a labeled order-of-magnitude estimate |
| Detectability example | $b = 5\times10^{-5}\,\mathrm{rad} \div 100\,\mathrm{s} = 5\times10^{-7}\,\mathrm{rad/s} \approx 0.10\,^\circ/\mathrm{hr}$ |
| Never | A recovery monologue, an apology, or "I will get back to you" as the whole answer |
| Mirror failure | Hedging on measured numbers, which spends the signal you need for real uncertainty |

The next lesson builds a whole talk out of this same honesty: the project whose result was negative, or that never finished.

::: context bluff-word A word from the card table
In poker, to **bluff** is to bet as if you hold a strong hand when you do not, hoping the other players fold before anyone sees your cards. It can win a single hand. But the players at the table remember, and a player caught bluffing has every later bet doubted. An interview panel is a table where the cards always get turned over — the next follow-up question shows what you were holding.
:::

::: context trust-all-at-once One caught guess greys out everything
Before the guess, each claim you made is taken at face value. After one guess is caught, the panel cannot tell which of your claims were measured, so all of them lose value at once — including the ones that were true.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="10" y="20" font-size="12" fill="#1f2a44">before: six measured claims</text>
  <g stroke="#1f2a44" stroke-width="1.2">
    <rect x="10" y="30" width="48" height="30" rx="4" fill="#8fb8f0"/>
    <rect x="68" y="30" width="48" height="30" rx="4" fill="#8fb8f0"/>
    <rect x="126" y="30" width="48" height="30" rx="4" fill="#8fb8f0"/>
    <rect x="184" y="30" width="48" height="30" rx="4" fill="#8fb8f0"/>
    <rect x="242" y="30" width="48" height="30" rx="4" fill="#8fb8f0"/>
    <rect x="300" y="30" width="48" height="30" rx="4" fill="#8fb8f0"/>
  </g>
  <text x="10" y="92" font-size="12" fill="#1f2a44">after one caught guess (red)</text>
  <g stroke="#1f2a44" stroke-width="1.2">
    <rect x="10" y="102" width="48" height="30" rx="4" fill="#fff" stroke="#6c7a93"/>
    <rect x="68" y="102" width="48" height="30" rx="4" fill="#fff" stroke="#6c7a93"/>
    <rect x="126" y="102" width="48" height="30" rx="4" fill="#fff" stroke="#6c7a93"/>
    <rect x="184" y="102" width="48" height="30" rx="4" fill="#fff" stroke="#6c7a93"/>
    <rect x="242" y="102" width="48" height="30" rx="4" fill="#fff" stroke="#6c7a93"/>
    <rect x="300" y="102" width="48" height="30" rx="4" fill="#b4232c"/>
  </g>
  <text x="170" y="146" font-size="11" fill="#6c7a93" text-anchor="middle">same claims, far less belief</text>
</svg>
```
:::

::: context design-review Where engineers practice saying it
Real engineering projects pass through formal **design reviews**, where a board of experienced engineers questions a design before it is allowed to move to the next stage. NASA names its big ones, such as the Preliminary Design Review (PDR) and the Critical Design Review (CDR). In these rooms "we have not analyzed that yet — here is the plan" is an ordinary sentence, and it usually becomes an **action item**: a named task with an owner and a due date. The panel in front of you has lived through many of these.
:::

::: context three-part-pipeline The answer as three boxes
The response always runs left to right. Leave out the middle box only when there truly is no bound.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="8" y="30" width="100" height="50" rx="8" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="58" y="52" font-size="12" fill="#1f2a44" text-anchor="middle" font-weight="700">1 admission</text>
  <text x="58" y="68" font-size="11" fill="#1f2a44" text-anchor="middle">short, first</text>
  <line x1="108" y1="55" x2="124" y2="55" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="130,55 122,50 122,60" fill="#1f2a44"/>
  <rect x="130" y="30" width="100" height="50" rx="8" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="52" font-size="12" fill="#1f2a44" text-anchor="middle" font-weight="700">2 bound</text>
  <text x="180" y="68" font-size="11" fill="#1f2a44" text-anchor="middle">if one exists</text>
  <line x1="230" y1="55" x2="246" y2="55" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="252,55 244,50 244,60" fill="#1f2a44"/>
  <rect x="252" y="30" width="100" height="50" rx="8" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="302" y="52" font-size="12" fill="#1f2a44" text-anchor="middle" font-weight="700">3 method</text>
  <text x="302" y="68" font-size="11" fill="#1f2a44" text-anchor="middle">a real test</text>
  <text x="180" y="106" font-size="11" fill="#6c7a93" text-anchor="middle">"Not measured — below X — I would test by Y."</text>
</svg>
```
:::

::: context bandwidth How fast a sensor can follow
Think of a slow-motion camera versus a cheap one: the cheap one blurs a fast-flapping wing into a smear. A sensor's **bandwidth**, measured in hertz (cycles per second), is roughly the fastest wiggle it can follow before it starts smoothing the wiggle away. A disturbance that shakes much faster than that does not show up in the data. That is why the bandwidth is a bound: whatever the sensor reports about fast effects, it cannot be reporting anything faster than it can see.
:::

::: context magnetorquer Steering with Earth's magnetic field
A **magnetorquer** is a coil of wire, or a rod wrapped in wire. Run current through it and it becomes a weak magnet that pushes against Earth's magnetic field, twisting the spacecraft. Satellites use them to bleed off spin momentum that builds up in their reaction wheels. The catch: the twist is always sideways to the field.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="30" x2="190" y2="30" stroke="#6c7a93" stroke-width="2"/>
  <polygon points="198,30 188,25 188,35" fill="#6c7a93"/>
  <text x="210" y="34" font-size="12" fill="#6c7a93">field direction B</text>
  <line x1="60" y1="160" x2="250" y2="70" stroke="#1f2a44" stroke-width="2.5"/>
  <polygon points="258,66 245,66 250,76" fill="#1f2a44"/>
  <text x="120" y="100" font-size="12" fill="#1f2a44">momentum h</text>
  <line x1="60" y1="160" x2="258" y2="160" stroke="#b4232c" stroke-width="2.5" stroke-dasharray="6 4"/>
  <text x="150" y="180" font-size="12" fill="#b4232c" text-anchor="middle">h parallel: out of reach</text>
  <line x1="258" y1="160" x2="258" y2="72" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="266" y="112" font-size="12" fill="#1d6fd1">h perp:</text>
  <text x="266" y="127" font-size="12" fill="#1d6fd1">can remove</text>
</svg>
```

As the satellite moves around its orbit the field direction turns, so over time every part of the momentum gets its turn to be reachable.
:::

::: context deg-per-hour Why convert to degrees per hour
Gyro data sheets quote bias in **degrees per hour**, not radians per second, so converting lets you compare your bound with a real sensor. One radian is $180/\pi \approx 57.3$ degrees, and one hour is $3600$ seconds:

$$
5\times10^{-7}\,\frac{\mathrm{rad}}{\mathrm{s}} \times 57.3\,\frac{^\circ}{\mathrm{rad}} \times 3600\,\frac{\mathrm{s}}{\mathrm{hr}} \approx 0.103\,^\circ/\mathrm{hr}.
$$

So a gyro whose bias is steady to a few hundredths of a degree per hour would sit below what this tracker could see in $100\,\mathrm{s}$.
:::

::: context mekf The formulation the candidate did use
A quaternion describes orientation with four numbers that must always keep a length of exactly one. Estimating those four numbers directly in a filter tends to break that rule. The **multiplicative** approach instead estimates a small *correction* rotation, three numbers, and multiplies it onto the current best orientation after each update. The filter built this way is often called a **multiplicative extended Kalman filter**, or MEKF (said "M-E-K-F"). It is the standard choice for spacecraft attitude, and it is what anchor project C uses — which is why the candidate can compare any unfamiliar method against it.
:::

::: context flight-processor Slow computers, on purpose
Computers that fly in space are built to survive radiation, which can flip bits or damage ordinary chips. That toughness costs speed. The RAD750, a radiation-hardened processor flown on the Mars rovers Curiosity and Perseverance, runs at up to about 200 MHz — a small fraction of a modern laptop's clock speed. A solver that finishes in a blink on a desktop can take many times longer on flight hardware. That is why "I ran it on a desktop" is not an answer to a timing question.
:::

::: context no-malloc Why flight code avoids grabbing memory on the fly
Most programs ask the computer for more memory whenever they need it, called **dynamic allocation**. On a flight computer that is risky: the request can take an unpredictable time, and it can fail after hours of flight if memory gets fragmented into unusable scraps. So many flight software standards forbid it once the program has started. NASA JPL's widely quoted "Power of Ten" coding rules, written by Gerard Holzmann, include exactly this rule. A solver that allocates memory during each solve may need rewriting before its timing is even worth measuring.
:::

::: context slosh-pendulum Liquid that behaves like a pendulum
Engineers rarely simulate every drop of sloshing propellant. Instead they replace the moving part of the liquid with a pretend pendulum hanging inside the tank, tuned so it swings at the same frequency as the real slosh.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="110" y="12" width="120" height="176" rx="24" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <rect x="112" y="110" width="116" height="76" rx="20" fill="#8fb8f0"/>
  <circle cx="170" cy="60" r="4" fill="#1f2a44"/>
  <line x1="170" y1="60" x2="200" y2="130" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="200" cy="130" r="11" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="170" y1="60" x2="170" y2="140" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="244" y="64" font-size="12" fill="#1f2a44">pivot</text>
  <text x="244" y="134" font-size="12" fill="#1f2a44">slosh mass</text>
  <text x="100" y="168" font-size="12" fill="#1f2a44" text-anchor="end">propellant</text>
  <text x="170" y="198" font-size="11" fill="#6c7a93" text-anchor="middle">the pendulum stands in for the moving liquid</text>
</svg>
```

In the pendulum model the swing frequency grows with the vehicle's acceleration and shrinks with the pendulum's length, so it changes during a burn as the tank drains and the thrust-to-mass ratio rises.
:::

::: context nees-recap What "mean NEES around six" refers to
In the first lesson of this module, anchor project C's filter was tested over 300 runs. **NEES** (said "nees", normalized estimation error squared) scores how honest the filter's stated uncertainty is. For a six-state filter an honest mean sits near six, and the $95\%$ acceptance band was $[5.614,\,6.398]$. The measured mean was $6.067$ — inside the band. That is a precise, checked result, which is why saying "I think it was around six" throws away something you actually earned.
:::
