---
id: l10-temporal-logic-and-events
title: Temporal logic and events
minutes: 24
covers:
  - 'Temporal logic: after, before, every, at, duration'
  - Events versus conditions, and why flight teams often ban events
---

Think about a microwave oven's door button. You press it once, and inside the switch the metal contacts slap together, bounce apart and slap together again several times in a thousandth of a second. If the oven counted every touch as a separate press, one push would look like five. So the oven waits until the switch has stayed closed for a little while before it believes you. Engineers call that **[[debouncing|debounce]]**: refusing to believe a signal until it has held steady long enough.

A rocket needs the same patience. Do not declare liftoff because one accelerometer sample jumped. Do not separate the stages until the engines have had three seconds to stop pushing. Each rule is about *time*: how long something has been true, or how long the chart has been in a state.

The last two lessons built charts that know where they are and what to do there. This lesson adds the clock. **Temporal logic** is a set of Stateflow operators that talk about time directly: "after 3 seconds in this state", "for as long as this condition has held". The second half of the lesson is about a different way of making a chart react, **events**, and why many flight teams decide not to use them at all.

## Counting time without writing a counter

Before temporal logic, people wrote timers by hand: a local `count`, set to 0 in entry, plus 1 in during, and `[count >= 25]` on the transition. It works, until someone forgets the reset, resets it in the wrong action, or writes `>` for `>=`. Each is a one-step bug that passes most tests and fails the one that matters.

Temporal logic replaces the counter with a word. Stateflow keeps the count for you, starts it when the state becomes active, and restarts it every time the state is entered again.

Each operator is tied to an **associated state**. On a transition, that is the transition's source state. In a state's action, it is that state. The clock starts at zero on the wake-up when the associated state becomes active.

Here are the five operators. Each takes a number $n$ and a **base**: what is being counted.

| Operator | True when | Read it as |
|---|---|---|
| `after(n, sec)` | at least $n$ seconds have passed since the state became active | "after n seconds" |
| `before(n, sec)` | fewer than $n$ seconds have passed | "before n seconds" |
| `at(n, tick)` | exactly the $n$-th wake-up since the state became active | "at the n-th tick" |
| `every(n, tick)` | on every $n$-th wake-up: the $n$-th, $2n$-th, $3n$-th… | "every n ticks" |
| `duration(C)` | not true or false: returns the seconds that condition `C` has been continuously true | "how long C has held" |

The base `sec` means seconds of simulation time. Stateflow also accepts `msec` and `usec` for milliseconds and microseconds. The base **`tick`** means one wake-up of the chart. A base can also be an event, as in `after(3, E)`, which counts how many times event `E` has arrived; events are the second half of this lesson.

`before` is the mirror of `after`: at any moment, `before(n, sec)` is true exactly when `after(n, sec)` is false.

`duration` is different. It measures how long its *condition* has been true without a break, and goes back to zero the moment the condition turns false or its state is left. So `duration(accel > 11) >= 0.1` reads "the acceleration has been above 11 m/s² for at least a tenth of a second". That is a debounce in one line.

### Where you write them

On a transition, a temporal operator goes inside the condition brackets like any other true-or-false test:

```text
[after(3, sec) && alt > 100]
[duration(sep_switch) >= 0.1]
```

In a state, you write it after the keyword `on`, which makes an action that runs only on the wake-ups when the operator is true:

```text
PITCHOVER
en: pitch_cmd = 0;
on every(10, tick): telem_frame = telem_frame + 1;
on after(8, sec): gimbal_limit = 3.0;
```

Read the second line of actions as "on every tenth tick, add one to the telemetry frame counter". Lesson 9 covered `en` (entry) and the other state actions; `on` lines run alongside the during action while the state stays active.

::: key
Temporal logic in Stateflow expresses minimum dwell times, debounce and timeouts directly (after, before, every, duration) instead of hand-rolled counters, which are a classic source of off-by-one and reset bugs.
:::

::: warning Which bases work with which operators
In a chart inside a Simulink model, `after` and `before` accept seconds (`sec`, `msec`, `usec`), ticks and events. `at` and `every` are for ticks and events only: Stateflow does not support them with absolute time in Simulink charts, and it tells you to use `after` instead. `duration` always measures time.
:::

## Seconds are counted in wake-ups

A chart does not watch the clock between wake-ups. It looks only when Simulink runs it. So "after half a second" really means "at the first wake-up when at least half a second has passed". Time in a chart comes in steps, the way a staircase comes in stairs. That rounding to whole steps is called **[[quantization|quantization]]**.

Here is the precise rule. Let the chart's sample time be $h$ (read "h", the step, in seconds). The state becomes active on some wake-up; call that wake-up number $0$. On wake-up number $j$ after that, the elapsed time is $j\,h$. The transition `[after(n, sec)]` is valid on the first $j$ with

$$
j\,h \ge n, \qquad \text{so} \qquad j = \left\lceil \frac{n}{h} \right\rceil .
$$

The brackets $\lceil \; \rceil$ mean "round up to the next whole number" (the **ceiling**). A wake-up in the middle of a step does not exist, so the chart has to wait for the next whole one.

::: example Half a second in three different charts
A sequencer has the transition `[after(0.5, sec)]` out of MECO. How many wake-ups after entering MECO does it fire, and at what elapsed time, when the chart runs at 50 Hz, at about 33 Hz and at 25 Hz?

**Step 1: 50 Hz, so $h = 0.02\,\mathrm{s}$.** $n/h = 0.5 / 0.02 = 25$, a whole number already. The transition fires on the 25th wake-up after entry, at exactly $25 \times 0.02 = 0.50\,\mathrm{s}$.

**Step 2: about 33 Hz, $h = 0.03\,\mathrm{s}$.** $0.5 / 0.03 = 16.67$. Wake-up 16 is at $0.48\,\mathrm{s}$, not yet half a second. Round up: the 17th wake-up, at $17 \times 0.03 = 0.51\,\mathrm{s}$. The dwell came out 10 ms long.

**Step 3: 25 Hz, $h = 0.04\,\mathrm{s}$.** $0.5 / 0.04 = 12.5$, round up to 13, at $13 \times 0.04 = 0.52\,\mathrm{s}$. Now it is 20 ms late.

**Sanity check.** The error is always between zero and one step, $0 \le jh - n < h$: 0, 10 and 20 ms, all less than the step. A slower chart can only make a temporal condition late, never early.
:::

So the chart's sample time (set as in lesson 6 of the solvers module) is part of its design: it decides how finely time is sliced. A value like `after(0.01, sec)` in a 50 Hz chart cannot mean what it says: the first wake-up after entry is already 0.02 s later.

### Ticks versus seconds

You could write the MECO rule as `[after(25, tick)]` instead. In a 50 Hz chart it behaves the same. The difference shows up the day someone changes the rate. Move the chart to 100 Hz and `after(25, tick)` quietly becomes a quarter of a second, while `after(0.5, sec)` becomes 50 wake-ups and still means half a second. So:

- Use `sec` when the requirement is a time: "wait for thrust tail-off, 3 s".
- Use `tick` when the requirement is a count of steps: "every 10th frame", "the step after entry".

::: key
Absolute-time temporal logic is quantized by the chart's sample time: `after(n, sec)` becomes true on the first wake-up whose elapsed time is at least n, the $\lceil n/h \rceil$-th wake-up after entry. In a 0.02 s chart, `after(0.5, sec)` fires on the 25th step.
:::

::: warning Re-entering a state restarts its clock
Every temporal operator restarts when its associated state is entered again. A transition from a state back to itself (a self-loop) exits and re-enters the state, so it resets `after`, `before`, `at`, `every` and `duration` too. If a self-loop exists to update a variable, it is also quietly resetting every timer in the state.
:::

## Debouncing with duration

A **confirmation counter** (or persistence counter) is the flight-software name for debouncing: a condition must hold for $N$ consecutive samples before the software acts on it. With `duration`, the rule "for $N$ samples" becomes "for $T$ seconds", with $T = (N - 1)h$, because `duration` is zero on the first sample where the condition is true.

::: example Liftoff detection that ignores a bump
At 50 Hz, the liftoff transition is `[launch_cmd && duration(accel > 11) >= 0.1]`, where `accel` is the sensed acceleration along the vehicle's long axis in m/s². On the pad the sensor reads about 9.8 m/s², because it feels the pad holding the vehicle up against gravity. Here is a trace, with wake-up numbers:

| Wake-up | accel (m/s²) | accel > 11 | duration (s) | Transition? |
|---|---|---|---|---|
| 2 | 9.8 | false | 0 | no |
| 3 | 15.0 | true | 0 | no |
| 4 | 9.8 | false | 0 (reset) | no |
| 10 | 12.6 | true | 0 | no |
| 11 | 12.7 | true | 0.02 | no |
| 12 | 12.9 | true | 0.04 | no |
| 13 | 13.0 | true | 0.06 | no |
| 14 | 13.0 | true | 0.08 | no |
| 15 | 13.1 | true | 0.10 | yes |

**Step 1: the bump.** At wake-up 3 a vibration spike reads 15.0. The condition is true, so `duration` starts, at 0. One sample later it is false again and `duration` resets. Nothing happened, which is the whole point.

**Step 2: the real liftoff.** Wake-ups 5 to 9 read 9.8 and are left out of the table. From wake-up 10 the condition stays true. `duration` is $0$ at wake-up 10 and grows by $h = 0.02$ each wake-up after: $(k - 10) \times 0.02$ at wake-up $k$.

**Step 3: when does it reach 0.1 s?** $(k - 10) \times 0.02 = 0.1$ gives $k = 15$. That is the sixth consecutive true sample, matching $N = T/h + 1 = 0.1/0.02 + 1 = 6$.

**Sanity check.** Liftoff is declared $0.1\,\mathrm{s}$ after the real crossing, when the vehicle has climbed only centimeters, and a one-sample spike can never trigger it.
:::

::: warning Thresholds that sit exactly on a step
In the example, `duration` reaches 0.1 exactly on a wake-up. Computed in floating point, a time difference such as $15 \times 0.02 - 10 \times 0.02$ comes out as $0.09999999999999998$, a hair below $0.1$. Whether that bites depends on how the time is computed, but a `>=` test that sits exactly on a sample boundary is a knife edge. Either state the rule in ticks, or put the threshold between two samples (0.09 or 0.11) and write down which sample you expect it to fire on.
:::

## Events: telling a chart that something happened

So far, charts have reacted to **conditions**: true-or-false tests on data, checked on every wake-up. There is a second mechanism. An **event** is a named signal with no value, only a moment: "this just happened". A transition can name an event before its condition:

```text
SEP_CMD[pyro_armed]
```

Read that as "when the event SEP_CMD arrives, and `pyro_armed` is true". A transition that names an event can be taken only while that event is being processed. Transitions with no event in their label are tested on every wake-up, whatever woke the chart.

Stateflow has three kinds, by scope:

- **Input events** come from Simulink. A chart with input events wakes up when one arrives, not on a sample time: on a rising or falling edge of a trigger signal, or when another block makes a **function call** into it.
- **Local events** live inside the chart. An action sends one with `send(E)`, which in MATLAB action language is the way to **[[broadcast|broadcast]]** it.
- **Output events** leave the chart. The one flight teams use most is a **function-call output event**: the chart calls a function-call subsystem, the kind lesson 2 of this module introduced, at a precise point in its step.

### What a local event does

Here is the surprise. `send(E)` does not queue the event for later. Stateflow pauses the action and processes the event *right now*, from the top of the chart, through every active state: transitions that name `E` are tested and may be taken, and the active states' during actions run again, now in response to `E`. Only when all of that is finished does it come back and run the rest of the action that sent the event.

So a chart can run twice inside one wake-up, the second run **nested** inside the first. That nesting is where the trouble starts.

- **The sender's world can change under it.** The rest of the action may run after the nested run has already exited its state. Stateflow has rules for this, but a reviewer reading top to bottom cannot see them.
- **Order decides the outcome.** In a chart with parallel states, an event sent by the second state is seen by the first state *in the same wake-up*, through the nested run. A condition set by the second state is seen by the first state only on the *next* wake-up. Swap the two states' order and both answers change.
- **Recursion.** Suppose a fault monitor's during action says: if `fault`, then `send(ABORT_EV)`. The nested run processes `ABORT_EV` through every active state, including the monitor itself, whose during action runs again, finds `fault` still true, and sends `ABORT_EV` again. That is **[[recursion|recursion]]**: an event whose processing sends itself. Stateflow's run-time checks can catch cycles caused by event broadcasts, but a design that needs catching is already wrong.

::: example One fault, two designs
A chart has two parallel states. MONITOR runs first in each wake-up and SEQUENCER second (lesson 9 showed how parallel states get an execution order). At wake-up 40, the engine pressure goes bad.

**Design A: a local event.** MONITOR's during action is `if pc < 0.8, send(ABORT_EV); end`. SEQUENCER has the transition `ABORT_EV` from FLIGHT to SAFE.

- Wake-up 40: MONITOR sees the bad pressure and sends `ABORT_EV`. The nested run starts at the top. MONITOR is active, so its during action runs again for `ABORT_EV`: the pressure is still bad, so it sends `ABORT_EV` again, and the nesting goes one level deeper, and again. Unless something breaks the loop, the chart never reaches SEQUENCER.

**Design B: a condition.** MONITOR's during action is `if pc < 0.8, fault = true; end`, with `fault` a local data item. SEQUENCER has the transition `[fault]` from FLIGHT to SAFE.

- Wake-up 40: MONITOR sets `fault = true`. SEQUENCER runs next, in the same wake-up, tests `[fault]`, and takes it. The chart is in SAFE at the end of wake-up 40.

**Sanity check.** Swap the order so SEQUENCER runs first. Design B still works: SEQUENCER tests `[fault]` at wake-up 40 before MONITOR has set it, sees false, and moves to SAFE at wake-up 41. One step later, 0.02 s at 50 Hz, predictable and visible from the chart's execution-order numbers. Design A still recurses.
:::

## Why flight teams ban events

Events are legal Stateflow, and they produce code. The case against them is about reasoning. A flight chart is reviewed line by line, tested until every state and transition has been exercised, and turned into C code someone must trace back to the chart. Conditions fit that process: each transition is a true-or-false test on data you can log and plot. With events, the path depends on who sent what, from where, in which order, and how deep the nesting went.

So many teams write a rule into their modeling standard: no local events in flight charts. What they use instead:

- **Data conditions.** A flag like `fault`, `sep_confirmed` or `abort_req`, set by one part of the chart and tested by another. The one-step delay, if there is one, is fixed by the execution order and can be read off the diagram.
- **Function-call outputs**, when the chart must make something happen in Simulink at a definite point. The call runs the named subsystem once, synchronously, and returns, like calling a function in a program. It schedules; it does not re-enter the chart.
- **Temporal logic on ticks or seconds** in place of "timer expired" events.

::: key
Many flight teams ban Stateflow events in favour of conditions because events introduce implicit, order-dependent control flow that is hard to review, hard to cover and hard to reason about under code generation. Condition-based transitions evaluated each step are deterministic and readable.
:::

::: warning "Events are slow" is not the argument
The objection is not speed, and it is not that the code generator refuses events: it generates code for them. If you defend a no-events rule in a review, make the real argument: the order-dependent, nested control flow, and what it does to review, **[[test coverage|coverage]]** and determinism.
:::

## Check yourself

::: check
A chart runs at 20 Hz. How many wake-ups after entering a state does `[after(0.33, sec)]` fire, and how long has the chart really waited?
:::

::: answer
The step is $h = 1/20 = 0.05\,\mathrm{s}$. The condition fires on the first wake-up $j$ with $0.05\,j \ge 0.33$, so $j = \lceil 0.33 / 0.05 \rceil = \lceil 6.6 \rceil = 7$. The real wait is $7 \times 0.05 = 0.35\,\mathrm{s}$, 20 ms longer than written, and less than one step late, as it must be.
:::

::: check
A state has the action `on every(5, tick): hb = hb + 1;` in a 50 Hz chart. The state is active for 1.3 s after entry. How many times does `hb` increase, and how often per second?
:::

::: answer
1.3 s at 0.02 s per wake-up is $1.3 / 0.02 = 65$ wake-ups after entry. `every(5, tick)` is true on wake-ups 5, 10, 15, …, 65, which is $65 / 5 = 13$ times. That is once every $5 \times 0.02 = 0.1\,\mathrm{s}$, or 10 times per second.
:::

::: check
A transition out of STAGE_SEP reads `[duration(sep_sw) >= 0.06]`, in a 50 Hz chart. The separation switch `sep_sw` reads true on wake-ups 7, 8, 10, 11, 12, 13 and 14 after entry, and false otherwise. On which wake-up is the transition taken? (Count in whole steps.)
:::

::: answer
`duration` starts at 0 at wake-up 7, reaches 0.02 at wake-up 8, then resets because `sep_sw` is false at wake-up 9. It starts again at 0 on wake-up 10: 0.02 at 11, 0.04 at 12, 0.06 at 13. The transition is taken at wake-up 13, the fourth consecutive true sample ($0.06 / 0.02 + 1 = 4$).
:::

::: check
Your chart has `[after(40, tick)]` on a coast-phase timeout and runs at 50 Hz. A colleague moves the chart to 25 Hz to save processor time. What happens to the timeout, and how would you have written it to avoid the problem?
:::

::: answer
At 50 Hz, 40 ticks is $40 \times 0.02 = 0.8\,\mathrm{s}$. At 25 Hz, 40 ticks is $40 \times 0.04 = 1.6\,\mathrm{s}$: the timeout silently doubled. Because the requirement is a time, it should be written `[after(0.8, sec)]`, which is 40 wake-ups at 50 Hz and 20 at 25 Hz, the same 0.8 s both ways.
:::

::: check
In your own words, why does sending a local event from a state's during action risk recursion, and what would you write instead?
:::

::: answer
`send(E)` processes the event at once through every active state, including the sender. Its during action runs again for the event and, if the condition still holds, sends it again: a nested run inside a nested run. Instead, set a flag (`fault = true`) and put `[fault]` on the transitions that should react. They react in the same or the next wake-up, fixed by the execution order, and nothing re-enters the chart.
:::

## Summary

| Idea | Meaning | What to remember |
|---|---|---|
| `after(n, sec)` | at least n s since the state became active | fires on wake-up $\lceil n/h \rceil$ after entry |
| `before(n, sec)` | fewer than n s | exactly when `after(n, sec)` is false |
| `at(n, tick)`, `every(n, tick)` | the n-th wake-up; every n-th wake-up | ticks or events, not absolute time |
| `duration(C)` | seconds C has been continuously true | resets when C is false or the state is left |
| `sec` versus `tick` | time versus count of wake-ups | `tick` changes meaning if the rate changes |
| Quantization | time only exists at wake-ups | at most one step late, never early |
| Confirmation counter | N consecutive samples | `duration(C) >= (N-1)h` |
| Event | a named moment: input, local, output | a local `send` runs the chart nested, immediately |
| Condition | a true-or-false test on data each wake-up | deterministic; the flight default |

The next lesson asks what happens when a state has several outgoing transitions: the order Stateflow tests them in, and how to write guards so that the order can never change the answer.

::: context debounce Where the word comes from
Debouncing began with mechanical switches, whose contacts really do bounce for a few milliseconds when they close. Keyboards, game controllers and elevator buttons all debounce in hardware or software. Flight software borrowed the word for any signal that must be believed only after it has held: a liftoff switch, a separation indicator, a low-pressure reading.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="100" x2="340" y2="100" stroke="#6c7a93" stroke-width="1"/>
  <text x="330" y="118" font-size="11" text-anchor="end" fill="#6c7a93">time</text>
  <polyline points="20,100 80,100 80,40 92,40 92,100 100,100 100,40 108,40 108,100 114,100 114,40 340,40" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <text x="97" y="30" font-size="11" text-anchor="middle" fill="#b4232c">bounce</text>
  <line x1="114" y1="60" x2="220" y2="60" stroke="#1f2a44" stroke-width="1" stroke-dasharray="4,3"/>
  <text x="167" y="75" font-size="11" text-anchor="middle" fill="#1f2a44">must hold this long</text>
  <line x1="220" y1="30" x2="220" y2="100" stroke="#b4232c" stroke-width="1.5"/>
  <text x="226" y="26" font-size="11" fill="#b4232c">believed here</text>
</svg>
```
:::

::: context quantization Time on a staircase
A digital computer only sees the world at its sample instants, like a movie that is really 24 still pictures a second. Anything that happens between frames is seen at the next frame. For a chart this means every time-based rule rounds up to a whole number of steps. Below, each dot is a wake-up after entry, drawn to scale. The red line is 0.5 s. At 0.02 s per step the 25th dot lands on it. At 0.03 s per step no dot does, and the rule waits for the 17th, at 0.51 s.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="45" x2="340" y2="45" stroke="#6c7a93"/>
  <text x="20" y="30" font-size="11" fill="#1f2a44">h = 0.02 s</text>
  <g fill="#1d6fd1"><circle cx="20" cy="45" r="2.5"/><circle cx="32" cy="45" r="2.5"/><circle cx="44" cy="45" r="2.5"/><circle cx="56" cy="45" r="2.5"/><circle cx="68" cy="45" r="2.5"/><circle cx="80" cy="45" r="2.5"/><circle cx="92" cy="45" r="2.5"/><circle cx="104" cy="45" r="2.5"/><circle cx="116" cy="45" r="2.5"/><circle cx="128" cy="45" r="2.5"/><circle cx="140" cy="45" r="2.5"/><circle cx="152" cy="45" r="2.5"/><circle cx="164" cy="45" r="2.5"/><circle cx="176" cy="45" r="2.5"/><circle cx="188" cy="45" r="2.5"/><circle cx="200" cy="45" r="2.5"/><circle cx="212" cy="45" r="2.5"/><circle cx="224" cy="45" r="2.5"/><circle cx="236" cy="45" r="2.5"/><circle cx="248" cy="45" r="2.5"/><circle cx="260" cy="45" r="2.5"/><circle cx="272" cy="45" r="2.5"/><circle cx="284" cy="45" r="2.5"/><circle cx="296" cy="45" r="2.5"/><circle cx="308" cy="45" r="2.5"/><circle cx="320" cy="45" r="2.5"/></g>
  <line x1="20" y1="85" x2="340" y2="85" stroke="#6c7a93"/>
  <text x="20" y="104" font-size="11" fill="#1f2a44">h = 0.03 s</text>
  <g fill="#1d6fd1"><circle cx="20" cy="85" r="2.5"/><circle cx="38" cy="85" r="2.5"/><circle cx="56" cy="85" r="2.5"/><circle cx="74" cy="85" r="2.5"/><circle cx="92" cy="85" r="2.5"/><circle cx="110" cy="85" r="2.5"/><circle cx="128" cy="85" r="2.5"/><circle cx="146" cy="85" r="2.5"/><circle cx="164" cy="85" r="2.5"/><circle cx="182" cy="85" r="2.5"/><circle cx="200" cy="85" r="2.5"/><circle cx="218" cy="85" r="2.5"/><circle cx="236" cy="85" r="2.5"/><circle cx="254" cy="85" r="2.5"/><circle cx="272" cy="85" r="2.5"/><circle cx="290" cy="85" r="2.5"/><circle cx="308" cy="85" r="2.5"/><circle cx="326" cy="85" r="2.5"/></g>
  <line x1="320" y1="15" x2="320" y2="95" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="3,2"/>
  <text x="316" y="12" font-size="11" text-anchor="end" fill="#b4232c">0.5 s</text>
</svg>
```
:::

::: context broadcast Why "broadcast"
A radio station broadcasts: it does not call one listener, it transmits to everyone tuned in. A Stateflow local event sent with `send(E)` works the same way by default: every active state gets a chance to react. Stateflow also offers a directed form, `send(E, state_name)`, that goes to one state and its children; MathWorks recommends it over undirected broadcasts where events are used at all, because it limits who can react and avoids much unwanted recursion.
:::

::: context recursion A function that calls itself
In programming, recursion means a function that calls itself, like a set of nesting dolls: open one and there is another inside. Recursion done on purpose, with a stopping rule, is a useful tool. Recursion by accident, in a real-time loop with a fixed time budget, is a disaster: every nested level eats memory on the stack and processor time in the step, and a flight computer that runs out of either stops flying.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="10" width="340" height="110" rx="8" fill="#ffffff" stroke="#1f2a44"/>
  <text x="20" y="28" font-size="11" fill="#1f2a44">wake-up 40: MONITOR during, send(ABORT_EV)</text>
  <rect x="30" y="38" width="310" height="76" rx="8" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="40" y="56" font-size="11" fill="#1f2a44">nested run: MONITOR during, send(ABORT_EV)</text>
  <rect x="50" y="66" width="280" height="42" rx="8" fill="#f2b880" stroke="#1f2a44"/>
  <text x="60" y="84" font-size="11" fill="#1f2a44">nested run: send(ABORT_EV) again</text>
  <text x="60" y="100" font-size="11" fill="#b4232c">... SEQUENCER never reached</text>
</svg>
```
:::

::: context coverage Why coverage cares
Aviation software standards such as DO-178C ask for evidence that tests exercised the code's structure, not only its requirements. For a chart, that means every state entered and every transition taken. A transition triggered by an event sent three levels down from a parallel state is hard to reach deliberately in a test. Module cod_slk_04 returns to coverage and how to read what is missing.
:::
