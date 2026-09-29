---
id: l09-actions-and-decomposition
title: State actions, transition actions and parallel states
minutes: 24
covers:
  - entry, during and exit actions; condition actions versus transition actions
  - Parallel (AND) versus exclusive (OR) decomposition
---

Think about a school day. When you walk into the science room, the teacher hands out goggles: once, at the door. While you are there, every few minutes you check the experiment. When you leave, you hand the goggles back: once, at the door. Nobody hands out goggles every five minutes, and nobody collects them at the start of class. The *when* of each thing matters as much as the thing itself.

The last lesson built an ascent chart that knows *where* the vehicle is: PRELAUNCH, ASCENT with its three phases, SAFE. But a flight mode is only useful if being in it makes something happen. Entering PITCHOVER should start the pitch program. While in GRAVITY_TURN, the chart should keep updating a command. Leaving a burn should shut an engine valve. This lesson is about those actions: the three kinds that belong to a state, the two kinds that belong to a transition, and the exact order in which they all run.

The second half of the lesson meets the other way to arrange states. In the last lesson, states side by side took turns: exactly one was active. Now you will see states that are all active at once, so a fault monitor can watch the vehicle while the phase machine flies it.

## Three actions a state can have

A state's label is its name followed by lines that say what to do and when. Each line starts with a keyword and a colon:

```text
PITCHOVER
entry: pitch_cmd = 89;
during: pitch_cmd = pitch_cmd - 0.5;
exit: pitchover_done = true;
```

- **entry** (short form `en`) runs **once, when the state becomes active**. Here it sets the **[[pitch command|pitch-program]]** to 89 degrees, just off vertical.
- **during** (short form `du`) runs **on each wake-up while the state stays active**. Here it tips the command half a degree further every step.
- **exit** (short form `ex`) runs **once, when the state is left**. Here it records that the pitch-over is finished.

The short forms work anywhere the long ones do, and one line can serve two keywords: `en, du: y = x;` runs the same statement on entry and on every later step. The statements are in the chart's action language, MATLAB here, with a semicolon after each.

A state with no keyword on a line treats that line as an entry action. Write the keyword anyway: a reviewer should never have to remember a default.

::: key
entry, during and exit actions: entry runs once when the state becomes active, during runs on each step while it remains active, exit runs once on leaving. Putting a latch or a command in the wrong one is a common source of one-cycle glitches.
:::

### When during does not run

The rule "during runs on each step while it remains active" hides two exceptions that trip people up.

1. **On the step a state is entered, its during action does not run.** That wake-up was spent taking the transition and running entry.
2. **On the step a state is left, its during action does not run either.** Remember from the last lesson that Stateflow tests a state's outgoing transitions first. If one is valid, the chart takes it, runs exit, and never gets to during. During runs only when every outgoing transition was tested and found false.

So a state that is active for $N$ wake-ups, counting the step it was entered and the step it was left, runs its entry once, its exit once, and its during action $N - 2$ times.

::: example A command one step late, and a counter one short
A flight computer runs its sequencer at 50 Hz, so one wake-up every $0.02\,\mathrm{s}$. The state IGNITION should raise the igniter command.

**Version A: the command in entry.** `entry: igniter_cmd = true;`. The chart enters IGNITION at step 1. Entry runs at step 1, so the command is true from step 1 on.

**Version B: the command in during.** `during: igniter_cmd = true;`. The chart enters IGNITION at step 1, but during does not run on the entry step. The command first becomes true at step 2.

| Step | 0 | 1 | 2 | 3 |
|---|---|---|---|---|
| Active state | PRE | IGNITION | IGNITION | IGNITION |
| igniter_cmd, version A | false | true | true | true |
| igniter_cmd, version B | false | false | true | true |

Version B is late by one step: $0.02\,\mathrm{s}$. That may be harmless for an igniter. It is not harmless for a command that another subsystem waits for on exactly the entry step.

**The counter.** A second engineer wants to count the steps of a burn that lasts $3.2\,\mathrm{s}$ and writes `during: n = n + 1;` in the BURN state, expecting the burn length in steps. The chart enters BURN at step 0 and leaves at step $3.2 \times 50 = 160$. During runs on steps 1 through 159: that is $159$ times, not $160$, a classic **[[off-by-one error|fence-post]]**.

**Sanity check.** BURN was active on steps 0 through 160, which is $161$ wake-ups. Entry took the first, exit took the last, so during got $161 - 2 = 159$, matching the rule. A burn-time estimate from this counter would be $159 \times 0.02 = 3.18\,\mathrm{s}$, off by one step. Lesson 10's temporal logic exists largely so you never write this counter by hand.
:::

::: warning A transition from a state to itself runs exit and entry
An arrow that leaves a state and comes back to the same state is a real transition. Taking it runs the exit action, then the entry action again. If entry resets a timer or zeroes a command, a self-loop resets it. Draw a self-loop only when you mean "leave and come back in".
:::

## Two actions a transition can have

A transition's label can carry actions too, and there are two kinds. Here is the full shape of a label, with the pieces you know:

```text
[condition]{condition_action}/{transition_action}
```

- A **condition action**, in curly braces right after the condition, runs **as soon as the condition is found true**, before the chart leaves the source state.
- A **transition action**, after a slash, runs **only when the whole transition is taken**, after the source state's exit action and before the destination's entry action.

When a transition goes straight from one state to another, the difference is only one of order. The **[[full sequence|order-timeline]]** for taking a transition from state A to state B is:

1. Test the condition: true.
2. Run the **condition action**.
3. Run A's **exit** action (and, if A is a superstate, the exits of its active substates first, innermost first). A becomes inactive.
4. Run the **transition action**.
5. B becomes active and runs its **entry** action (and, if B is a superstate, the entry of its default substate after its own).

::: key
Condition actions {…} run when the condition is found true, before the source state exits. Transition actions /{…} run after the source state's exit and before the destination's entry. Order when taking a transition: condition action, exit, transition action, entry.
:::

The difference becomes large when a path goes through **junctions**. A condition action runs the moment its segment's condition is true, even if the path later **dead-ends** and Stateflow backtracks. A transition action waits until the path has reached a state, so it runs only for the path that was really taken.

That is why the two are used differently. Condition actions are the actions of flow charts, which have no states: in a flow chart, a condition action is simply "if this, do that". Transition actions are for work that belongs to the move itself, such as setting up data the new state's entry will need.

::: example Watching the order with a log
To see the order, give every action one job: append a digit to a number called `log`. Appending the digit $d$ is `log = 10*log + d`. The chart is in GRAVITY_TURN, which has:

```text
GRAVITY_TURN
during: log = 10*log + 5;
exit: log = 10*log + 2;
```

Its outgoing path goes through a junction: the first segment is `[prop_frac < 0.02]{log = 10*log + 1;}`, and the only segment out of the junction is `[sep_ready]/{log = 10*log + 3;}`, leading to MECO (main engine cutoff), which has `entry: log = 10*log + 4;`. Here `prop_frac` is the fraction of propellant left, and `sep_ready` says the stage is ready to separate. Start each case with `log = 0`.

**Case 1: plenty of propellant.** $\text{prop\_frac} = 0.05$. Is $0.05 < 0.02$? No. No transition, so during runs: `log` $= 0 \times 10 + 5 = 5$.

**Case 2: low propellant, not ready.** $\text{prop\_frac} = 0.015$, `sep_ready` false. The first condition is true, so its condition action runs at once: `log` $= 1$. At the junction, `sep_ready` is false and there is no other segment. Dead end: Stateflow backtracks, finds nothing else, and takes no transition. The chart is still in GRAVITY_TURN, so during runs: `log` $= 1 \times 10 + 5 = 15$. The condition action ran, even though no transition happened.

**Case 3: low propellant, ready.** $\text{prop\_frac} = 0.015$, `sep_ready` true. Condition action: 1. Exit GRAVITY_TURN: $1 \times 10 + 2 = 12$. Transition action: $12 \times 10 + 3 = 123$. Entry MECO: $123 \times 10 + 4 = 1234$. During does not run, since a transition was taken.

**Sanity check.** Reading 1234 left to right gives the order: condition action, exit, transition action, entry. Case 2's 15 shows the trap: if the condition action had been "command engine cutoff", it would have fired on a step when the chart did not go to MECO, and it would fire again on every step the propellant is low and the stage not ready.
:::

::: warning Commands belong in transition actions or entry, not in condition actions on a junction path
A condition action on a segment that leads into a junction runs even if the path is abandoned. Put a command that must go with the move itself in a transition action, or in the destination's entry action, so it happens only if the move really happens.
:::

## Two ways to arrange states

The **decomposition** of a chart or superstate says how its substates relate. There are two kinds, and you choose by right-clicking inside the parent and picking Decomposition.

**Exclusive (OR) decomposition** is what you have used so far. Exactly one substate is active at a time, and the chart moves between them by transitions. Borders are solid. Every exclusive group needs a default transition.

**Parallel (AND) decomposition** makes every substate active at the same time. When the parent is active, all its parallel substates are active; when it is entered, all of them are entered. So there is nothing to choose, and parallel states need no default transitions. They have **dashed borders**, and there are no transitions between them: you cannot "go" from one to another, because you are already in both.

::: key
Parallel versus exclusive states, with a spacecraft example: Exclusive (OR): the vehicle is in exactly one flight phase at a time. Parallel (AND): a thermal supervisor, a power supervisor and a fault monitor all run simultaneously alongside the phase machine.
:::

A typical flight chart mixes both. The top level is parallel, with one state per job. Inside each, the states are exclusive:

| Parallel state (top level) | Order | Exclusive substates inside |
|---|---|---|
| FAULT_MONITOR | 1 | NOMINAL, FAULT |
| PHASE | 2 | PRELAUNCH, ASCENT (with LIFTOFF, PITCHOVER, GRAVITY_TURN), SAFE |
| THERMAL | 3 | HEATERS_OFF, HEATERS_ON |

The monitor watches sensors and raises a fault flag. The phase machine flies the vehicle and reads the flag in a transition condition such as `[fault]`. The thermal supervisor switches heaters. Each is a small exclusive machine that a reviewer can read on its own. Written as one exclusive machine, every combination — ascent with heaters on, ascent with heaters off, and so on — would need its own state, and the chart would grow as the **[[product of the parts|state-explosion]]** instead of their sum. The exercise's **[[parallel ABORT supervisor|abort-supervisor]]** is exactly this pattern.

## Execution order numbers

"All active at once" does not mean "all computed at once". The chart runs on **[[one processor|concurrency]]**, one statement after another. On each wake-up, Stateflow runs the parallel states **one after the other**, in a fixed order, and each is finished before the next begins.

That order is shown as a small **execution order number** in the **[[upper-right corner|parallel-drawing]]** of each parallel state: 1, 2, 3. With the chart setting **User specified state/transition execution order** turned on (the default for new charts), you set the numbers yourself, by right-clicking a state and choosing its execution order. With it off, Stateflow numbers them by position on the drawing: top to bottom, then left to right. Explicit is better, for the same reason as lesson 1's block priorities: the order is then a decision someone made and a reviewer can check.

Because they run in sequence, the order is visible whenever one parallel state writes data that another reads in the same wake-up. The reader sees the fresh value if it runs after the writer, and last step's value if it runs before.

::: example A fault monitor, first or second
The chart above wakes at 50 Hz. FAULT_MONITOR sets `fault = true` when the pitch rate is above $4.0\,\mathrm{deg/s}$. PHASE leaves ASCENT for SAFE on `[fault]`. In a test, the pitch rate climbs as $0.8\,k\,\mathrm{deg/s}$ at step $k$. The flag `fault` is local chart data, so it keeps its value between wake-ups.

**Step 1: when is the limit crossed?** At $k = 5$, the rate is $4.0$, not above $4.0$. At $k = 6$ it is $4.8\,\mathrm{deg/s}$. So the monitor first sets `fault` at step 6.

**Step 2: monitor is number 1.** At step 6 the monitor runs first and sets `fault`. Then PHASE runs, sees `fault` true, and goes to SAFE. Safe mode at $t = 6 \times 0.02 = 0.12\,\mathrm{s}$.

**Step 3: monitor is number 2.** At step 6 PHASE runs first and reads `fault`, still false from step 5. Then the monitor sets it. PHASE sees it at step 7: safe mode at $t = 0.14\,\mathrm{s}$, when the rate is already $0.8 \times 7 = 5.6\,\mathrm{deg/s}$.

**Sanity check.** Swapping two numbers moved the response by exactly one step, $0.02\,\mathrm{s}$, and the rate grows $0.8\,\mathrm{deg/s}$ per step, so the late version reacts at $4.8 + 0.8 = 5.6\,\mathrm{deg/s}$. It is the data-store surprise from lesson 1 in a new place: two parts share data without a line, and the order decides who sees what. The usual rule is that monitors and supervisors get the low numbers, so the phase machine always acts on this step's health.
:::

::: warning Parallel does not mean independent
Parallel states that write the same data, or read each other's outputs, depend on their execution order. Either keep each piece of data written by exactly one parallel state, and order readers after writers on purpose, or the chart's behavior will change when someone renumbers the states or drags one across the drawing (if order is set by position).
:::

## Check yourself

::: check
A state DEPLOY_ARRAY should fire a pyrotechnic release exactly once, and should count how many wake-ups it has spent waiting for the deploy switch. Which action gets which statement?
:::

::: answer
The release command goes in entry: it runs once, on the step the state becomes active. The waiting counter goes in during: it runs on each later step while the state stays active (remembering it does not run on the entry step or the exit step). Putting the release in during would fire it on every step; putting the counter in entry would count to one.
:::

::: check
A transition from COAST to ENTRY_BURN has the label `[alt < 70000]{mark = 1;}/{mark = 2;}`. COAST's exit action is `mark = 10*mark;`. What is `mark` right after the transition is taken, if ENTRY_BURN's entry action does not touch it?
:::

::: answer
The order is condition action, exit, transition action, entry. The condition action sets `mark = 1`. COAST's exit sets `mark = 10*1 = 10`. The transition action sets `mark = 2`. So `mark` is 2. If the order were different, the answer would be different, which is why knowing it matters.
:::

::: check
Why does a parallel state need no default transition, while every exclusive group needs one?
:::

::: answer
A default transition answers "which substate becomes active when the group is entered?". In an exclusive group only one can be active, so the chart must be told which. In a parallel group, all substates become active together when the parent is entered, so there is no choice to make.
:::

::: check
A power supervisor (parallel state number 1) computes `bus_voltage_ok`, and a heater controller (number 2) reads it. A colleague renumbers them so the heater controller is 1. What changes?
:::

::: answer
Now the heater controller runs first on each wake-up, so it reads the value `bus_voltage_ok` had at the end of the previous step, not the one the supervisor is about to compute. Its reaction to a voltage change is delayed by one wake-up. Nothing reports an error; only the timing moved. Writers should run before readers, and the order should be set on purpose and documented.
:::

::: check
Why is a mission's vehicle phase modeled with exclusive states, while its thermal control and fault monitoring are parallel states beside it?
:::

::: answer
The vehicle is in exactly one flight phase at a time, and moving between phases is the point, so the phases are exclusive with transitions between them. Thermal control and fault monitoring must run continuously whatever the phase, at the same time as the phase machine, so they are parallel states. Each parallel state has its own small exclusive machine inside, and the chart stays small instead of needing a state for every combination.
:::

## Summary

| Idea | Meaning | What to remember |
|---|---|---|
| entry (en) | Runs once when the state becomes active | Commands that must happen on the first step |
| during (du) | Runs each wake-up while the state stays active | Not on the entry step or the exit step |
| exit (ex) | Runs once on leaving | Innermost state exits first |
| Condition action | `{…}` after a condition | Runs when the condition is true, even on a dead-end path |
| Transition action | `/{…}` | Runs only when the move completes, after exit, before entry |
| Action order | Taking a transition | condition action, exit, transition action, entry |
| Exclusive (OR) | Solid borders | One substate active; needs a default transition |
| Parallel (AND) | Dashed borders | All substates active; no default transition |
| Execution order number | Upper-right corner of a parallel state | Parallel states run one after another in this order |

The chart now acts, but only on conditions tested each step. The next lesson adds time and events: temporal logic such as `after` and `duration` for dwell times and timeouts, and why flight teams prefer conditions to events.

::: context pitch-program The pitch program
A rocket lifts off pointing straight up, 90 degrees above the horizon. To reach orbit it must end up flying nearly sideways, so shortly after clearing the tower it tips over by a few degrees. That small, deliberate tip is the pitch-over, or pitch kick. After it, gravity bends the path the rest of the way, which is the gravity turn in the chart. The numbers in the lesson are illustrative; each vehicle's pitch program is designed from its own trajectory.
:::

::: context fence-post Fence posts and wake-ups
A fence 10 meters long with a post every meter has 11 posts, not 10. Counting steps has the same trap. BURN is active on 161 wake-ups (steps 0 to 160); entry takes the first, exit the last, and during gets the 159 in between.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="50" x2="340" y2="50" stroke="#6c7a93" stroke-width="1.5"/>
  <circle cx="30" cy="50" r="7" fill="#1d6fd1"/>
  <text x="30" y="80" font-size="11" text-anchor="middle" fill="#1d6fd1">entry</text>
  <text x="30" y="30" font-size="11" text-anchor="middle" fill="#1f2a44">step 0</text>
  <circle cx="80" cy="50" r="5" fill="#f2b880" stroke="#1f2a44"/>
  <circle cx="120" cy="50" r="5" fill="#f2b880" stroke="#1f2a44"/>
  <circle cx="160" cy="50" r="5" fill="#f2b880" stroke="#1f2a44"/>
  <text x="210" y="54" font-size="12" text-anchor="middle" fill="#1f2a44">. . .</text>
  <circle cx="260" cy="50" r="5" fill="#f2b880" stroke="#1f2a44"/>
  <text x="170" y="80" font-size="11" text-anchor="middle" fill="#1f2a44">during: steps 1 to 159</text>
  <circle cx="320" cy="50" r="7" fill="#b4232c"/>
  <text x="320" y="80" font-size="11" text-anchor="middle" fill="#b4232c">exit</text>
  <text x="320" y="30" font-size="11" text-anchor="middle" fill="#1f2a44">step 160</text>
</svg>
```
:::

::: context order-timeline The order on one line
Taking a transition from A to B, left to right. The condition action runs while A is still active; the transition action runs in the gap when neither A nor B is active.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="60" x2="340" y2="60" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="340,56 348,60 340,64" fill="#1f2a44"/>
  <rect x="20" y="25" width="140" height="18" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="90" y="38" font-size="11" text-anchor="middle" fill="#1f2a44">A active</text>
  <rect x="240" y="25" width="100" height="18" fill="#f2b880" stroke="#1f2a44"/>
  <text x="290" y="38" font-size="11" text-anchor="middle" fill="#1f2a44">B active</text>
  <circle cx="60" cy="60" r="5" fill="#1f2a44"/>
  <text x="60" y="82" font-size="11" text-anchor="middle" fill="#1f2a44">1 condition</text>
  <circle cx="140" cy="60" r="5" fill="#1f2a44"/>
  <text x="140" y="82" font-size="11" text-anchor="middle" fill="#1f2a44">2 exit A</text>
  <circle cx="200" cy="60" r="5" fill="#b4232c"/>
  <text x="200" y="100" font-size="11" text-anchor="middle" fill="#b4232c">3 transition</text>
  <circle cx="260" cy="60" r="5" fill="#1f2a44"/>
  <text x="260" y="82" font-size="11" text-anchor="middle" fill="#1f2a44">4 entry B</text>
</svg>
```
:::

::: context state-explosion Sums versus products
Suppose the phase machine has 7 states, the fault monitor 2 and the thermal supervisor 2. As three parallel machines, that is $7 + 2 + 2 = 11$ states to draw and review. As one exclusive machine, every combination is its own state: $7 \times 2 \times 2 = 28$, with transitions between many of them. Add a power supervisor with 3 states and the sum becomes 14 while the product becomes 84. David Harel's statecharts, the idea Stateflow is built on, introduced parallel states to stop this "state explosion".
:::

::: context abort-supervisor What an abort supervisor watches
An abort supervisor runs beside the phase machine from before liftoff and watches for conditions that make continuing unsafe: an engine out, an attitude error too large, a structural limit, a range safety signal. When one is met, it sets a flag that the phase machine reads, and the phase machine's outermost transition takes the vehicle into its abort or safe sequence. Lesson 12 builds one in full, together with the fault detection, isolation and recovery logic around it.
:::

::: context concurrency Simultaneous, but not at the same instant
"Simultaneous" in a chart means "all active during the same wake-up", not "computed at the same instant". The generated code for a parallel chart is a sequence of function calls in execution order, all inside one task. That is good news: the result is deterministic, the same every run. Truly concurrent tasks on several processor cores are a different and harder problem, which flight software architectures handle outside the chart.
:::

::: context parallel-drawing What a parallel chart looks like
Dashed borders mark parallel states; the number in each upper-right corner is its execution order. Inside each, the states are exclusive again, with solid borders and a default transition.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="15" width="105" height="120" rx="8" fill="#ffffff" stroke="#1f2a44" stroke-dasharray="6,4"/>
  <text x="16" y="31" font-size="11" fill="#1f2a44">FAULT_MON</text>
  <text x="106" y="31" font-size="11" text-anchor="end" fill="#b4232c">1</text>
  <rect x="127" y="15" width="105" height="120" rx="8" fill="#ffffff" stroke="#1f2a44" stroke-dasharray="6,4"/>
  <text x="133" y="31" font-size="11" fill="#1f2a44">PHASE</text>
  <text x="223" y="31" font-size="11" text-anchor="end" fill="#b4232c">2</text>
  <rect x="244" y="15" width="105" height="120" rx="8" fill="#ffffff" stroke="#1f2a44" stroke-dasharray="6,4"/>
  <text x="250" y="31" font-size="11" fill="#1f2a44">THERMAL</text>
  <text x="340" y="31" font-size="11" text-anchor="end" fill="#b4232c">3</text>
  <rect x="25" y="50" width="75" height="24" rx="6" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="62" y="66" font-size="11" text-anchor="middle" fill="#1f2a44">NOMINAL</text>
  <rect x="25" y="95" width="75" height="24" rx="6" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="62" y="111" font-size="11" text-anchor="middle" fill="#1f2a44">FAULT</text>
  <rect x="142" y="50" width="75" height="24" rx="6" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="179" y="66" font-size="11" text-anchor="middle" fill="#1f2a44">ASCENT</text>
  <rect x="142" y="95" width="75" height="24" rx="6" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="179" y="111" font-size="11" text-anchor="middle" fill="#1f2a44">SAFE</text>
  <rect x="259" y="50" width="75" height="24" rx="6" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="296" y="66" font-size="11" text-anchor="middle" fill="#1f2a44">HTR_OFF</text>
  <rect x="259" y="95" width="75" height="24" rx="6" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="296" y="111" font-size="11" text-anchor="middle" fill="#1f2a44">HTR_ON</text>
  <line x1="62" y1="74" x2="62" y2="89" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="58,89 62,95 66,89" fill="#1f2a44"/>
  <line x1="179" y1="74" x2="179" y2="89" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="175,89 179,95 183,89" fill="#1f2a44"/>
  <line x1="296" y1="74" x2="296" y2="89" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="292,89 296,95 300,89" fill="#1f2a44"/>
</svg>
```
:::
