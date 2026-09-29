---
id: l08-stateflow-states-and-transitions
title: 'Stateflow: states and transitions'
minutes: 23
covers:
  - 'Stateflow: states, hierarchy, transitions, junctions, default transitions'
---

Think about a washing machine. It is always doing exactly one thing: filling, washing, rinsing, spinning, or done. It does not decide each second from scratch what to do. It remembers where it is, and it moves on only when something is true: the drum is full, the timer is up. Press the lid-open button in the middle of any of those and it pauses, whatever it was doing.

That is a **[[state machine|state-machine]]**: a system that is in one of a fixed set of situations, called **states**, and moves between them by rules, called **transitions**. A launch vehicle is a state machine too. It sits on the pad, lifts off, pitches over, flies a gravity turn, cuts off its engines, separates stages, coasts. Each phase runs different guidance, different control gains, different fault checks. The flight software has to know which phase it is in, and it must never be confused about that.

The last lesson finished the structure of a Simulink model: pieces, interfaces and data. Blocks and lines are good at continuous math — filters, dynamics, control laws. They are bad at modes. You can build a mode machine from Switch and Unit Delay blocks, and people have, but nobody can review it. **[[Stateflow|stateflow-origin]]** is the MathWorks tool that draws mode logic as a picture of states and arrows, runs it inside a Simulink model, and generates code from it. This lesson covers the pieces of that picture and exactly how Stateflow steps through it. The next lesson adds the actions states perform.

## A chart inside a model

A Stateflow **chart** is a block in a Simulink model. From the outside it looks like any other block: inputs on the left, outputs on the right. Double-click it and you see a drawing of states and arrows instead of more blocks.

A chart has **data**, each with a **scope**: **Input** data arrives on its input ports, **Output** data leaves on its output ports, and **Local** data lives inside the chart and keeps its value from one step to the next. You declare them in the chart's Symbols pane or the Model Explorer, with a name, a type and a size, like the data objects of the last lesson.

A chart does nothing continuously. It **[[wakes up|wake-up]]** once each time Simulink runs it, which for a flight sequencer means once per sample time, say every 0.02 s at 50 Hz. Each wake-up, it looks at its inputs and its current state, decides whether to move, does what the new situation demands, and goes back to sleep. Everything below is about what happens during one of those wake-ups.

The words inside a chart — conditions and actions — are written in an **action language**. New charts use the **MATLAB action language**, so a condition looks like MATLAB: `alt > 100`, `~engines_ok` (read the `~` as "not"), `launch_cmd && engines_ok` (read `&&` as "and"). Charts can instead use C as the action language, where "not" is `!`. This module uses MATLAB.

## States

A **state** is drawn as a rectangle with rounded corners. Its name sits in the top-left corner. At any moment a state is either **active** (the chart is in it) or **inactive**.

The rule for ordinary states is the washing machine's: of a group of states side by side, exactly one is active. That arrangement is called **exclusive** or **OR** decomposition: the vehicle is in PRELAUNCH *or* ASCENT *or* SAFE, never two at once. Exclusive states have solid borders. (The next lesson meets the other arrangement, where states run side by side.)

Here is the chart this lesson builds, an early piece of an **[[ascent mode chart|ascent-chart]]**:

| State | Meaning | Inside it |
|---|---|---|
| PRELAUNCH | On the pad, waiting for the launch command | — |
| ASCENT | Powered flight | LIFTOFF, PITCHOVER, GRAVITY_TURN |
| SAFE | Engines lost: stop guidance, command a safe configuration | — |

## Hierarchy: states inside states

ASCENT contains three states of its own. A state that contains others is a **superstate**, and the ones inside are its **substates**. This is **hierarchy**: states nested inside states, like folders inside folders.

Two rules make hierarchy work.

- **A substate can only be active if its parent is.** If LIFTOFF is active, ASCENT is active too. Saying "the vehicle is in ASCENT.LIFTOFF" names both, the way a file path names a folder and the file in it.
- **Inside a superstate, the same exclusive rule applies again.** When ASCENT is active, exactly one of LIFTOFF, PITCHOVER and GRAVITY_TURN is active.

Why bother? Because some rules apply to a whole group of states. If the engines fail, the vehicle must go to SAFE whether it was in LIFTOFF, PITCHOVER or GRAVITY_TURN. Without hierarchy, you would draw three arrows to SAFE, one from each phase, and the day someone adds a fourth phase they would have to remember a fourth arrow. With hierarchy, you draw one arrow from the edge of ASCENT to SAFE. It applies to every state inside, including ones added later.

::: key
Hierarchy: a superstate contains substates. A substate can be active only while its parent is active, and a transition drawn from the superstate's border leaves from whichever substate is active.
:::

## Transitions

A **transition** is an arrow from one state to another. Its label says when it may be taken. The most common label is a **condition** in square brackets:

```text
[alt > 100]
```

Read it as "go when the altitude is above 100 meters". A transition whose condition is true is **valid**. When the chart wakes up in the arrow's source state and finds the transition valid, it **takes** it: the source state becomes inactive and the destination state becomes active.

Our chart has these transitions:

| From | To | Label |
|---|---|---|
| PRELAUNCH | ASCENT | `[launch_cmd && engines_ok]` |
| LIFTOFF | PITCHOVER | `[alt > 100]` |
| PITCHOVER | GRAVITY_TURN | `[vel > 60]` |
| ASCENT (its border) | SAFE | `[~engines_ok]` |

A label can hold more than a condition. It can name an **event**, and it can carry actions in `{…}` and after a `/`. Events are the subject of lesson 10, and actions the subject of lesson 9. A transition with no label at all is **unconditional**: always valid.

If a state has several outgoing transitions, Stateflow tests them one at a time in an order you can see as small numbers on the arrows, and takes the first valid one. Lesson 11 is devoted to that order and to making sure it never matters.

## Default transitions

When the chart wakes up for the very first time, no state is active yet. Which one should it start in? And when the chart enters ASCENT, which of its three substates should become active?

A **default transition** answers that. It is an arrow that starts at a small dot rather than at a state, and points at the state to enter first. The chart's top level has a default transition to PRELAUNCH. ASCENT has its own, pointing at LIFTOFF.

Every group of exclusive states needs one: the top level of the chart, and the inside of every exclusive superstate. Otherwise, on entering the group, Stateflow has no way to decide which state to activate, and it reports the problem rather than guess.

The transition from PRELAUNCH ends on the border of ASCENT, not on a particular substate. So on the step it is taken, ASCENT becomes active, and its default transition immediately makes LIFTOFF active too. Both happen in the same wake-up.

::: key
Default transition: an arrow from a dot to the state that becomes active when its group is entered. Every exclusive (OR) group of states needs one: the chart's top level and the inside of every exclusive superstate.
:::

::: warning A transition into a superstate enters its default substate
A transition that ends on a superstate's border does not "remember" anything about the substates. It enters the superstate and follows its default transition. If you meant to land in PITCHOVER, draw the arrow to PITCHOVER itself; it may cross the ASCENT border to get there.
:::

## One wake-up, step by step

Here is what the chart does each time it wakes, for charts like ours where every group is exclusive. Stateflow works from the outside in.

1. **First wake-up only:** follow the default transitions down, activating states, and stop.
2. Otherwise, start at the chart's active top-level state. Test its outgoing transitions in order. If one is valid, take it and stop: this wake-up is done.
3. If none is valid, the state stays active. If it is a superstate, repeat step 2 for its active substate: test *that* state's outgoing transitions.
4. Continue down the hierarchy until a transition is taken or the bottom is reached.

Two consequences matter a great deal.

- **The parent is tested before the child.** A transition from ASCENT's border is tested before any transition from LIFTOFF, PITCHOVER or GRAVITY_TURN. So an **[[abort|parent-first]]** arrow on a superstate beats anything the phase underneath wanted to do.
- **At most one transition per wake-up.** By default, a chart takes one transition through a given part of the hierarchy and waits for the next wake-up before looking again. A chain of states whose conditions are all true is walked one link per step.

::: key
Each wake-up, Stateflow tests transitions from the outermost active state inward and takes at most one: a superstate's outgoing transitions are tested before its active substate's.
:::

::: example Tracing the ascent chart
The chart wakes once per second (a real sequencer runs at 10 to 100 Hz, but the logic is the same and the table stays short). The test inputs are made up and deliberately brisk: the launch command arrives at step 2, after which the vehicle climbs with $\text{vel} = 20\,t$ in m/s and $\text{alt} = 10\,t^2$ in m, where $t$ is the number of seconds since launch. At step 8 the engines fail.

| Step | launch_cmd | engines_ok | alt (m) | vel (m/s) | What the chart does | Active afterward |
|---|---|---|---|---|---|---|
| 0 | false | true | 0 | 0 | First wake-up: default transition | PRELAUNCH |
| 1 | false | true | 0 | 0 | Tests PRELAUNCH to ASCENT: false | PRELAUNCH |
| 2 | true | true | 0 | 0 | Takes PRELAUNCH to ASCENT; ASCENT's default enters LIFTOFF | ASCENT.LIFTOFF |
| 3 | true | true | 10 | 20 | ASCENT to SAFE: false. LIFTOFF to PITCHOVER: false | ASCENT.LIFTOFF |
| 4 | true | true | 40 | 40 | Same two tests, both false | ASCENT.LIFTOFF |
| 5 | true | true | 90 | 60 | Both false (90 is not above 100) | ASCENT.LIFTOFF |
| 6 | true | true | 160 | 80 | ASCENT to SAFE: false. LIFTOFF to PITCHOVER: true, taken | ASCENT.PITCHOVER |
| 7 | true | true | 250 | 100 | ASCENT to SAFE: false. PITCHOVER to GRAVITY_TURN: true, taken | ASCENT.GRAVITY_TURN |
| 8 | true | false | 360 | 120 | ASCENT to SAFE: true, taken | SAFE |

**Step 1: the one-link-per-step rule at step 6.** At step 6 the velocity is 80 m/s, so `vel > 60` is already true. But the chart was in LIFTOFF when it woke. It takes LIFTOFF to PITCHOVER and stops. It tests PITCHOVER's arrow only at step 7.

**Step 2: the parent-first rule at step 8.** The chart wakes in ASCENT.GRAVITY_TURN. It tests ASCENT's own arrow first, finds `~engines_ok` true, and takes it. Leaving ASCENT deactivates GRAVITY_TURN as well. Nothing in GRAVITY_TURN was even looked at.

**Sanity check.** Altitude $10\,t^2$ crosses 100 m between $t = 3$ (90 m, step 5) and $t = 4$ (160 m, step 6), and the table switches at step 6, the first step where the condition is true. The whole ascent took one step per phase, as the rule demands: steps 2, 6 and 7.
:::

## Junctions and flow charts

Sometimes one decision splits several ways. After stage separation, a reusable booster might fly back to the launch site or head for a drone ship, depending on the mission. You could draw two arrows out of STAGE_SEP with conditions that repeat the separation check. Or you can use a **connective junction**: a small circle where one transition splits into several paths.

```text
STAGE_SEP --[sep_confirmed]--> (o) --[rtls]--> BOOSTBACK        (tested 1st)
                                   \-------------> COAST         (tested 2nd, no label)
```

The first segment is tested first. Only if `sep_confirmed` is true does Stateflow go on to the junction, where it tests the junction's outgoing segments in order. `rtls` ("return to launch site") true means BOOSTBACK; otherwise the unlabeled segment, always valid, leads to COAST. A **transition path** made of several segments is taken only if it reaches a state: every segment's condition on the way must be true.

What if a path reaches a junction and none of the ways out is valid? Stateflow **[[backtracks|backtracking]]**: it goes back to the previous junction and tries that junction's next segment, and so on back to the source state. If nothing works, no transition is taken this step. That is legal, and confusing to read, which is why the habit is to give every junction an unconditional last segment, an "else", so that a path started is always finished.

Junctions can also form a whole **flow chart**: a network of junctions and conditions with no states at all, like the if-else logic of a program. It can sit on its own at a chart's top level, starting from a default transition, or inside a **graphical function** that states can call. A flow chart has no memory. Each wake-up it runs from its start to a **terminating junction** (a junction with no way out), in one go, and the next wake-up starts over.

::: key
Connective junction: a point where a transition path splits or merges. A path is taken only if every segment's condition is true and it reaches a state; if it dead-ends, Stateflow backtracks and tries the next segment. A flow chart is made of junctions only and runs start to finish in one wake-up.
:::

::: example A throttle schedule as a flow chart
Around the moment of **[[maximum dynamic pressure|max-q]]**, the push of the air on the rocket, launch vehicles throttle down to limit the load on the structure. Here is a flow chart that sets a throttle command from the dynamic pressure $q$ (read "q", in pascals) each wake-up:

```text
(start) --> (o) --[q > 30000]{throttle = 0.70;}--> (end)
             |
             +--[q > 25000]{throttle = 0.85;}--> (end)
             |
             +--{throttle = 1.00;}-------------> (end)
```

The segments leave the junction in the order drawn. The action in `{…}` runs when that segment's condition is found true; lesson 9 explains this kind of action properly.

**Step 1: compute $q$.** Dynamic pressure is $q = \frac{1}{2}\rho v^2$, with $\rho$ (read "rho") the air density. At 11 km altitude the standard atmosphere gives $\rho \approx 0.3639\,\mathrm{kg/m^3}$. At $v = 400\,\mathrm{m/s}$: $q = 0.5 \times 0.3639 \times 400^2 = 0.5 \times 0.3639 \times 160{,}000 = 29{,}112\,\mathrm{Pa}$.

**Step 2: walk the flow chart.** Is $29{,}112 > 30{,}000$? No, so the first segment is not taken. Is $29{,}112 > 25{,}000$? Yes: `throttle = 0.85`, and the path ends. The third segment is never tested.

**Step 3: two more cases.** At $q = 18{,}000\,\mathrm{Pa}$ both conditions fail and the unconditional segment sets `throttle = 1.00`. At $q = 34{,}500\,\mathrm{Pa}$ the first condition is true and `throttle = 0.70`.

**Sanity check.** Higher dynamic pressure gives lower throttle: 1.00, 0.85, 0.70 as $q$ rises. The order of the tests matters: if $q > 25{,}000$ were tested first, a $q$ of $34{,}500$ would get 0.85, the wrong answer. Testing the biggest threshold first makes the three cases exclusive.
:::

## History junctions

When a chart leaves a superstate and later comes back, it normally enters through the default transition, forgetting where it was. Sometimes you want it to remember. A **history junction**, a small circle with an H inside, placed in a superstate, does that: on re-entry, the superstate reactivates the substate that was active when it was last left, instead of following its default.

Picture a satellite in a SCIENCE superstate with substates IMAGING and DOWNLINK. A brief sensor glitch sends it to a HOLD state for a few seconds, then back to SCIENCE. With a history junction in SCIENCE, a satellite that was in DOWNLINK resumes DOWNLINK. Without one, it restarts at IMAGING. Use history on purpose and sparingly: after a real fault, returning to the old activity **[[automatically|history-in-flight]]** is often exactly what you do not want.

::: warning Every exclusive group still needs a default transition
A history junction does not replace the default transition. The first time the superstate is entered there is no history to recall, so the default transition decides.
:::

## Check yourself

::: check
In the traced chart, suppose the altitude jumped straight from 40 m to 300 m and the velocity from 40 m/s to 100 m/s at step 5. Which state is active after step 5, and after step 6?
:::

::: answer
After step 5: ASCENT.PITCHOVER. The chart woke in LIFTOFF, found `alt > 100` true and took that one transition, then stopped. Even though `vel > 60` is also true, PITCHOVER's arrow is not tested in the same wake-up. After step 6 (assuming the engines are still fine and vel is still above 60): ASCENT.GRAVITY_TURN.
:::

::: check
The engines fail on the same step that the pitch-over altitude is reached, while the chart is in ASCENT.LIFTOFF. Which transition is taken, and why?
:::

::: answer
ASCENT to SAFE. Stateflow tests the transitions of the outermost active state first. ASCENT is active and its outgoing transition `[~engines_ok]` is valid, so it is taken, and LIFTOFF's transition to PITCHOVER is never tested. Leaving ASCENT also deactivates LIFTOFF.
:::

::: check
A colleague adds a new superstate BOOST with substates CORE_BURN and THROTTLE_BUCKET, and draws a transition into BOOST, but no default transition inside it. What goes wrong?
:::

::: answer
BOOST is an exclusive group, so when it is entered exactly one of its substates must become active. Nothing says which one, so Stateflow cannot enter it and reports the missing default transition. The fix is a default transition inside BOOST pointing at the substate to start in, presumably CORE_BURN.
:::

::: check
A junction has two outgoing segments, `[mode == 1]` to state A and `[mode == 2]` to state B, and no others. What happens when `mode` is 3, and what is the usual fix?
:::

::: answer
The path reaches the junction and neither segment is valid, so Stateflow backtracks toward the source. If no other path works, no transition is taken and the chart stays where it was. That may be intended, but a reader cannot tell. The usual fix is an unconditional last segment, an "else", leading somewhere deliberate, so every started path ends at a state.
:::

::: check
What is the difference between a history junction in a superstate and a default transition in the same superstate?
:::

::: answer
The default transition says which substate to enter when the superstate is entered with nothing to remember, including the very first time. The history junction says: if the superstate was active before, reactivate the substate that was active when it was left. A superstate with history still needs a default transition for that first entry.
:::

## Summary

| Idea | Meaning | What to remember |
|---|---|---|
| Chart | A Stateflow block in a Simulink model | Input, Output and Local data; wakes once per sample time |
| State | A mode the chart can be in | Active or inactive; rounded rectangle |
| Exclusive (OR) group | States side by side, solid borders | Exactly one active at a time |
| Superstate, substate | States inside states | Child active only if parent active |
| Transition | Arrow with a label such as `[alt > 100]` | Taken when valid; one per wake-up |
| Default transition | Arrow from a dot | Needed in every exclusive group |
| Parent first | Outer transitions tested before inner | A superstate's abort beats its substates |
| Connective junction | Circle where a path splits | Path must reach a state; else backtrack |
| Flow chart | Junctions only | Runs start to end each wake-up; no memory |
| History junction | H in a circle | Re-enter the last active substate |

The chart so far only says *where* the vehicle is. The next lesson makes states *do* things: entry, during and exit actions, the two kinds of transition action and the exact order they run in, and parallel states that let a fault monitor run alongside the phase machine.

::: context state-machine State machines are everywhere
A traffic light, a vending machine and an elevator are all state machines: a small set of situations and rules for moving between them. Computer scientists call the simplest version a finite-state machine, "finite" because the set of states is fixed. Flight software is full of them, because a vehicle's behavior depends so heavily on which phase of the mission it is in.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="15" y="40" width="80" height="36" rx="10" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="55" y="63" font-size="12" text-anchor="middle" fill="#1f2a44">GREEN</text>
  <rect x="140" y="40" width="80" height="36" rx="10" fill="#f2b880" stroke="#1f2a44"/>
  <text x="180" y="63" font-size="12" text-anchor="middle" fill="#1f2a44">YELLOW</text>
  <rect x="265" y="40" width="80" height="36" rx="10" fill="#ffffff" stroke="#b4232c"/>
  <text x="305" y="63" font-size="12" text-anchor="middle" fill="#b4232c">RED</text>
  <line x1="95" y1="58" x2="134" y2="58" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="134,54 140,58 134,62" fill="#1f2a44"/>
  <line x1="220" y1="58" x2="259" y2="58" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="259,54 265,58 259,62" fill="#1f2a44"/>
  <path d="M305,76 L305,100 L55,100 L55,82" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="51,82 55,76 59,82" fill="#1f2a44"/>
  <text x="180" y="30" font-size="11" text-anchor="middle" fill="#6c7a93">each arrow fires when its timer is up</text>
</svg>
```
:::

::: context stateflow-origin Where statecharts come from
In 1987 the computer scientist David Harel published "Statecharts: A visual formalism for complex systems". He had been working on avionics for a fighter aircraft and found that flat state machines exploded in size. His answer was hierarchy (states inside states) and concurrency (states running side by side), the two ideas this lesson and the next are built on. Stateflow is MathWorks' implementation of statecharts, tied into Simulink so the chart can read signals and drive them.
:::

::: context wake-up What "waking up" means
Unlike a Gain block, a chart has no output formula. Each time Simulink reaches the chart in its sorted execution order, at the chart's sample time, it runs the chart once: this is one wake-up, or chart execution. Between wake-ups nothing inside the chart moves, even if an input changes. A condition that becomes true and false again between two wake-ups is never seen, which is one reason sequencers run fast enough to catch every change that matters.
:::

::: context ascent-chart The chart in the lesson, drawn
Rounded boxes are states. ASCENT contains its three phases. The dots mark default transitions, and the red arrow leaves from ASCENT's border, so it applies to all three phases inside.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <circle cx="20" cy="30" r="4" fill="#1f2a44"/>
  <line x1="24" y1="30" x2="36" y2="30" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="36,26 42,30 36,34" fill="#1f2a44"/>
  <rect x="42" y="15" width="90" height="30" rx="8" fill="#ffffff" stroke="#1f2a44"/>
  <text x="87" y="35" font-size="11" text-anchor="middle" fill="#1f2a44">PRELAUNCH</text>
  <rect x="42" y="75" width="250" height="125" rx="10" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="52" y="90" font-size="11" fill="#1f2a44">ASCENT</text>
  <line x1="87" y1="45" x2="87" y2="69" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="83,69 87,75 91,69" fill="#1f2a44"/>
  <circle cx="60" cy="118" r="4" fill="#1f2a44"/>
  <line x1="64" y1="118" x2="72" y2="118" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="72,114 78,118 72,122" fill="#1f2a44"/>
  <rect x="78" y="105" width="75" height="26" rx="7" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="115" y="122" font-size="11" text-anchor="middle" fill="#1f2a44">LIFTOFF</text>
  <rect x="190" y="105" width="90" height="26" rx="7" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="235" y="122" font-size="11" text-anchor="middle" fill="#1f2a44">PITCHOVER</text>
  <rect x="150" y="160" width="120" height="26" rx="7" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="210" y="177" font-size="11" text-anchor="middle" fill="#1f2a44">GRAVITY_TURN</text>
  <line x1="153" y1="118" x2="184" y2="118" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="184,114 190,118 184,122" fill="#1f2a44"/>
  <line x1="235" y1="131" x2="235" y2="154" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="231,154 235,160 239,154" fill="#1f2a44"/>
  <line x1="292" y1="137" x2="314" y2="137" stroke="#b4232c" stroke-width="1.5"/>
  <polygon points="314,133 320,137 314,141" fill="#b4232c"/>
  <rect x="320" y="124" width="36" height="26" rx="7" fill="#ffffff" stroke="#b4232c"/>
  <text x="338" y="141" font-size="11" text-anchor="middle" fill="#b4232c">SAFE</text>
</svg>
```
:::

::: context parent-first Why the parent goes first
Think of a teacher calling a fire drill. It does not matter which exercise each student is halfway through: the whole class leaves. Testing the superstate's transitions before its substates' is what makes that true in a chart. It is also why flight teams put abort and safe-mode arrows on the outermost state they apply to: the arrow wins every time, and no phase can delay it.
:::

::: context backtracking Backtracking, like a maze
Backtracking is how you solve a maze with your hand on the wall: walk down a corridor, and if it dead-ends, go back to the last fork and try the next way. Stateflow does the same at junctions. The danger is that anything done along the dead-end corridor has already happened: lesson 9 shows that actions attached to segments can run even on a path that is later abandoned.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="45" width="60" height="28" rx="7" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="40" y="63" font-size="11" text-anchor="middle" fill="#1f2a44">source</text>
  <line x1="70" y1="59" x2="130" y2="59" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="136" cy="59" r="6" fill="#ffffff" stroke="#1f2a44"/>
  <line x1="142" y1="55" x2="200" y2="25" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4,3"/>
  <circle cx="206" cy="22" r="6" fill="#ffffff" stroke="#b4232c"/>
  <text x="220" y="26" font-size="11" fill="#b4232c">dead end: go back</text>
  <line x1="142" y1="63" x2="244" y2="92" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="242,87 250,94 240,96" fill="#1f2a44"/>
  <rect x="250" y="80" width="70" height="28" rx="7" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="285" y="98" font-size="11" text-anchor="middle" fill="#1f2a44">target</text>
</svg>
```
:::

::: context max-q Max-Q
Dynamic pressure grows with the square of speed and shrinks as the air thins with altitude. Early in the climb speed wins and $q$ rises; higher up the thin air wins and $q$ falls. The peak, called Max-Q, comes roughly a minute after liftoff for many launch vehicles, and launch commentators call it out. Throttling down through it, and back up after, is a common way to keep the aerodynamic load within what the structure was designed for.
:::

::: context history-in-flight Why spacecraft seldom resume on their own
When a spacecraft drops into safe mode after a real fault, it usually waits for the ground team to understand what happened before resuming science. An automatic return to "whatever it was doing" can repeat the activity that caused the fault. History junctions fit short, harmless interruptions, such as pausing a downlink during a brief loss of lock. For anything that looks like a fault, a deliberate default entry is safer.
:::
