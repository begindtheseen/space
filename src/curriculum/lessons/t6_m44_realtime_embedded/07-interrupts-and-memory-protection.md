---
id: l07-interrupts-and-memory-protection
title: Interrupts, latency and memory protection
minutes: 22
covers:
  - "Interrupt handling, interrupt latency, and the split between the handler and the deferred half"
  - Memory protection with an MMU or MPU; stack sizing and stack-overflow detection
---

You are cooking dinner and the doorbell rings. A package needs a signature. You do not carry the whole meal to the front door and finish cooking there. You turn down the stove, sign, set the box inside the door, and go back to the kitchen. You open the box later, when dinner is done. The doorbell got an answer within seconds, and the cooking lost only a few seconds.

Now picture a different house. Your roommate's closet is right behind your bedroom wall. Keep stuffing clothes into your closet, and one day the back wall gives way. Your sweaters end up in her closet. She does not find out until next week, when she reaches for a shirt and pulls out your sock. By then nobody remembers how it happened.

A flight computer faces both problems every millisecond. Hardware rings its doorbell all the time — a sensor has a new sample, a bus finished a transfer, a timer ran out. And every task's memory sits right next to some other task's memory. This lesson covers the two mechanisms that keep those from going wrong. The first is **interrupt handling**: answering the hardware fast, with a bound on how long it takes. The second is **memory protection**: a wall that sounds an alarm the moment anything pushes through it, instead of letting the damage turn up somewhere else, days later.

Both matter because of the lessons before this one. Every schedulability proof assumed a task starts when the scheduler says it does. But on real hardware, the first thing that happens after an event is an interrupt, before any scheduler runs, and nothing so far has put a number on it. Every proof also assumed each task's memory behaves. Nothing in a schedulability proof stops a stack from quietly spilling into someone else's data.

## What an interrupt is

A processor could check each device over and over: "anything new? anything new?" That is called polling, and it wastes time asking when the answer is usually no. The other way is to let the device ring a bell. An **[[interrupt|polling-vs-interrupts]]** is a hardware signal that makes the processor stop what it is doing, run a special piece of code, and then go back to exactly where it was.

That special code is the **interrupt handler** — also called an interrupt service routine, or ISR. The processor finds the right handler through the **interrupt vector table**, a list of addresses with one entry per kind of interrupt. The entry for "gyro has a new sample" says where the gyro's handler lives in memory.

To go back to exactly where it was, the processor must first store the state of the code it interrupted — the numbers sitting in its working registers, and the address of the next instruction. That step is called **[[saving the context|context-save]]**. When the handler finishes, the saved state is put back and the interrupted code carries on, never knowing it was paused.

## Interrupt latency

**Interrupt latency** is the time from the hardware event to the first instruction of its handler. Think of it as the time from the doorbell ringing to you opening the door. It is made of four pieces, one after another:

1. **Hardware response.** The processor notices the signal and finishes or abandons the instruction it was on.
2. **Time with interrupts masked.** Code can briefly turn interrupts off — this is called **[[masking|masking]]** them — to protect a few instructions that must not be split. A higher-priority handler that is already running has the same effect. Either way, the new interrupt waits.
3. **Context save.** Storing the interrupted code's registers.
4. **Dispatch.** Looking up the vector table and jumping to the right handler.

Every one of these is a real duration. Their sum must be bounded the same way lesson one bounded worst-case execution time: by the worst case over every state the processor could be in when the event arrives. The typical case tells you nothing about the time the event lands in the middle of the longest masked section in the whole program.

Units: interrupt timing is measured in **microseconds** ($\mathrm{\mu s}$, read "micro-seconds", millionths of a second) and **nanoseconds** ($\mathrm{ns}$, billionths of a second). One microsecond is $1000\,\mathrm{ns}$. A modern microcontroller answers in tens to hundreds of nanoseconds when nothing is masked.

### Why a long handler hurts everyone

While a handler runs, it usually blocks everything of equal or lower priority — other interrupts included — for as long as it takes. Suppose a handler does real work whose time depends on the data, or waits on something. Then it is not only slow. It adds latency to every other interrupt, and to every task in the scheduled system underneath it.

That is exactly the problem lesson four spent its whole length removing from ordinary tasks: a high-priority job stuck behind work of unknown length. Only now it is happening at the hardware level, where lesson four's fix cannot reach. Priority inheritance works through mutexes, and most kernels do not allow a handler to lock a priority-inheriting mutex at all, because a handler is not a task and cannot be put to sleep.

::: warning A handler is not a place to do the work
A handler that runs a filter update, parses a long message, or waits for anything behaves like a critical section of unknown length that outranks the whole scheduler. Its time becomes latency for everything else in the system, and none of the scheduling theory from lessons two to five can see it. If you catch yourself writing a loop inside a handler, stop and ask whether that work could wait.
:::

## The split: top half and bottom half

The standard answer is the doorbell answer: split the work in two.

The **top half** is the interrupt handler itself. It does the least that must happen right now:

- **acknowledge** the device, so its interrupt line stops ringing;
- **capture** anything that would otherwise be lost — a data register the next sample will overwrite, a timestamp, a single reading;
- **signal** the task that will do the real work.

Nothing else. No waiting, no locks that a lower-priority task might hold, no work whose length depends on the data. Its worst-case time must be small and provable, because for as long as it runs it sits above the entire scheduled system.

The **bottom half** is the deferred part. It does the real processing, as an ordinary task with a priority you choose. It competes for the processor like any other task, instead of jumping ahead of everything. In a small real-time operating system, it is a task waiting on a semaphore that the top half gives, exactly as in lesson five. In Linux it has [[several names|linux-bottom-halves]]: softirq, tasklet, workqueue item, or threaded interrupt.

This is not a new idea. It is lesson six's threaded-interrupt change seen from another side. `PREEMPT_RT` turns most interrupt handlers into schedulable kernel threads for exactly this reason. The bottom half becomes an ordinary thread with an ordinary priority. Then lesson two's priority rules and lesson three's response-time analysis apply to it, the same as to everything else. The top half shrinks to the few instructions that truly cannot wait. Everything that can wait, waits — at a priority the schedulability proof already accounts for.

::: key
**Top half**: the minimum work that must happen at interrupt time — acknowledge, capture, signal — kept small enough that its own worst-case time is provable. **Bottom half**: the actual processing, deferred to an ordinary schedulable task at a priority you choose, brought back inside the scheduling theory of lessons two through five.
:::

::: example An interrupt latency budget
A sensor sample must be captured, timestamped and ready for the control task within $10\,\mathrm{\mu s}$ of the hardware event that produced it. That is the deadline for the whole handling path. First turn it into nanoseconds: $10\,\mathrm{\mu s} = 10\,000\,\mathrm{ns}$.

Two pieces are fixed. Hardware response and entry into the handler take $200\,\mathrm{ns}$. The top half — acknowledge the device, copy the raw sample into a slot set aside in advance, signal the waiting task, nothing else — was measured at $300\,\mathrm{ns}$ worst case.

Subtract both from the deadline:

$$
10\,000\,\mathrm{ns} - 200\,\mathrm{ns} - 300\,\mathrm{ns} = 9\,500\,\mathrm{ns}.
$$

That $9\,500\,\mathrm{ns}$ is left for the scheduler to notice that the signaled task is now the highest-priority task ready to run, and to actually run it. That is the bottom half's own dispatch latency — exactly the kind of number lesson six's core isolation and priority machinery exists to bound.

Look at where the budget went. Only $500\,\mathrm{ns}$, which is $500 / 10\,000 = 5\%$, is spent inside the interrupt path. The other $95\%$ is left on purpose for the ordinary, provable, schedulable half of the system. Sanity check: $500 + 9\,500 = 10\,000$, the whole deadline.
:::

## Memory protection: MMU and MPU

Back to the closet wall. There are two kinds of wall a processor can build.

An **MMU** — memory management unit — is the full version. It gives every program its own made-up set of addresses, called **[[virtual addresses|virtual-memory]]**, and translates each one to a real place in the memory chips through a lookup table called a page table. Two programs can both use "address 1000" and land in completely different memory. The operating system can also mark each page — a block of memory, usually $4\,\mathrm{KiB}$ — as read-only, not runnable as code, or off-limits to a given program. This is what makes the Linux side of a flight computer from lesson six workable at all. Separate processes cannot damage each other's memory, because they do not share any addresses in the first place.

An **MPU** — memory protection unit — is the simpler version, common on the small bare-metal microcontrollers this module returns to in lesson ten. There is no translation: every address is the real one. Instead, you get a small number of **regions**, often eight to sixteen. Each region is a range of addresses with its own permissions: read, write, run as code, or reachable only by privileged code (the operating system's own code, not ordinary tasks). An MPU does not need virtual memory to be useful. Mark one small region "no access at all" and you have a **guard region**: a deliberate gap between one task's stack and whatever sits next to it in memory.

### Why the guard region is worth so much

A task's **stack** is the scratch memory its functions use for local variables and return addresses. Each call adds a block on the stack, called a **stack frame**; each return removes one. On most processors the stack [[grows toward lower addresses|stack-grows-down]].

Without a guard, a stack that grows past its allocation writes into whatever is next door — another variable, another task's stack, even code. It happens silently. The symptom shows up whenever that damaged memory is next read, which can be in a completely different subsystem, much later, with no visible link to the overrun that caused it. That is the sweater in your roommate's closet.

With a [[guard region|guard-region]] in place, the first write past the end lands in the no-access gap. The MPU raises a fault on the spot, naming the exact instruction and the exact task. The fault is not "nicer" in some vague way. It turns a failure you could never trace into one you can pin down precisely. It is the same trade lesson one made between an unbounded tail and a bounded worst case: a hard fault you can act on beats silent damage you cannot even find.

## Stack sizing

How big should a stack be? Picture a stack of trays in a cafeteria. Each function call puts one tray on top; each return takes one off. The tallest the pile ever gets is set by the **deepest possible call path** — the longest chain of "this function calls that one, which calls that one" the code can ever produce.

So a task's worst-case stack use is the sum of the frame sizes along that deepest path. This is a question about the code's structure, with exactly the shape of lesson one's worst-case execution time analysis. Draw the **call graph** — a map of which function calls which. If the graph has no loops, meaning no function can end up calling itself, it has one deepest path you can find and one worst-case total you can prove. (Lesson eight explains why recursion breaks this.)

::: example Sizing a stack from the call graph
A control task's deepest call chain is `main_loop` → `read_sensors` → `kalman_update` → `matrix_inverse_3x3`. Their frame sizes, measured or bounded by a tool, are $64$, $96$, $512$ and $128$ bytes. Add them along the chain:

$$
64 + 96 + 512 + 128 = 800\,\mathrm{bytes}.
$$

A real allocation adds margin. It covers an interrupt frame nobody counted, a compiler that lays out frames a bit less tightly than expected, or a call path not yet found. Doubling is a common, simple choice:

$$
2 \times 800 = 1\,600\,\mathrm{bytes}.
$$

So the stack gets $1\,600$ bytes, with the guard region placed right past it.

The $800$ bytes did not come from a test run that happened to reach that depth. It is the sum along the one path that is, by the code's structure, the worst the code can produce. Sanity check: the matrix routine's $512$-byte frame is the biggest piece, and it is less than the $800$ total, as a part must be.
:::

### When there is no protection unit

Some processors have neither an MMU nor an MPU. The fallback is a software trick called **[[stack painting|stack-painting]]**. At startup, fill the whole unused stack with a known pattern of bytes. Later — every so often, or after an unusually deep call — check whether the pattern near the far end has been overwritten. If it has, the stack came close to its limit or went past it.

Stack painting is strictly weaker than a hardware guard. It only catches what it checks, when it checks, instead of faulting at the exact instruction that overran. A big local array can also jump right over the checked bytes without touching them. It is still worth having on hardware with no protection unit, and worth having as a second, independent check even where there is one.

::: warning Do not size a stack from what testing showed
Sizing a stack from the deepest use a debugger saw during testing repeats lesson one's worst-case execution time mistake with a different number. A test campaign only reports the paths it happened to run. The path that matters is the one nobody ran — an error-handling branch, or a rare mix of nested calls. Size the stack from the call graph's worst case, for the same reason worst-case execution time comes from analysis and not from profiling alone.
:::

## Check yourself

::: check
An interrupt handler for a sensor bus runs a full Kalman filter update right inside the top half. The designer says this keeps latency low, because it avoids switching to a separate task. What is wrong with this design?
:::

::: answer
The filter update is real work that depends on the data. It has no small, provable worst-case time. Inside the top half it runs at a priority above the entire scheduled system, for however long it takes on that particular input.

Every other interrupt and every task pays that time as extra latency. That is the same "high priority stuck behind work of unknown length" problem lesson four removed from ordinary tasks. Here priority inheritance cannot fix it, because most kernels forbid the locks it depends on inside a handler.

The fix is the standard split. The top half captures the raw sample and signals a task. The bottom half, a task at a priority that lesson two's theory already covers, does the filter update.
:::

::: check
In the latency budget example, suppose the top half is later found to take $700\,\mathrm{ns}$ instead of $300\,\mathrm{ns}$. Hardware latency and the deadline are unchanged. How much is left for the bottom half's dispatch? And what does this say about the top half being "the part kept small and provable"?
:::

::: answer
$10\,000 - 200 - 700 = 9\,100\,\mathrm{ns}$ are left. That still fits comfortably.

But the top half has more than doubled, and that is the real worry. Someone has added work beyond the bare acknowledge–capture–signal pattern. That extra work now runs at a priority none of this module's scheduling theory can analyze.

The right response is to find what grew and move it to the bottom half if it can wait at all. Do not accept the new figure just because the total still fits. The property being protected is the top half's smallness, not only the total.
:::

::: check
An MPU does no address translation at all. Explain how it can still stop a stack overflow from damaging nearby memory. What is the practical difference between that and stack painting?
:::

::: answer
To enforce permissions, the MPU does not need translation. It only needs to know which ranges of real addresses may be touched, and how. So it can mark a small gap right past the stack as no-access, and fault on any access into it.

The difference from stack painting is timing and certainty. The MPU faults at once, at the exact instruction that overran, whether or not anyone was looking. Stack painting only notices an overrun the next time some code checks the pattern. That can be long after the overrun happened. It can also miss an overrun that jumps past the checked bytes entirely.
:::

::: check
A task's call graph splits after `read_sensors`. The normal path goes through `apply_filter` (frame $80\,\mathrm{bytes}$). The fault path goes through `apply_filter` and then `emergency_recovery` (frames $80$ and $240\,\mathrm{bytes}$). `read_sensors` uses $96\,\mathrm{bytes}$ and `main_loop` uses $64\,\mathrm{bytes}$. Testing only ever ran the normal path. What stack does the worst case need, and why would testing alone have made it too small?
:::

::: answer
The worst path includes the fault branch:

$$
64 + 96 + 80 + 240 = 480\,\mathrm{bytes}.
$$

The normal path is only $64 + 96 + 80 = 240\,\mathrm{bytes}$ — exactly half.

A stack sized from testing, which never ran `emergency_recovery`, would have been set from $240$ bytes. The first time the fault path runs in flight, the stack would overrun by the full $240$ bytes the recovery function needs. That is the least-tested code in the system, by its nature. And it runs exactly when the system is already dealing with a fault, and can least afford a second, unrelated failure on top of it.
:::

## Summary

| Term | Meaning |
| --- | --- |
| Interrupt | A hardware signal that pauses the running code, runs a handler, then resumes |
| Interrupt latency | Time from hardware event to the handler's first instruction: hardware response + masked time + context save + dispatch |
| Top half | Minimal interrupt-time work — acknowledge, capture, signal; small enough to have a provable worst-case time |
| Bottom half | Deferred processing as an ordinary schedulable task at an assigned priority, covered by lessons two to five |
| MMU | Full address translation; gives each process its own address space |
| MPU | No translation; a handful of regions with permissions; enough to build a no-access guard region |
| Guard region | Turns a stack overflow into an immediate, attributable fault instead of silent damage |
| Stack sizing | Sum of frame sizes along the deepest path in the call graph, plus margin — a structural bound, not a test result |
| Stack painting | Software fallback: a known pattern, checked from time to time; weaker than a hardware guard, better than nothing |

Both ideas in this lesson limit damage from outside a task's own logic — an interrupt's timing, a stack spilling over its edge. The next lesson turns to damage a task can do entirely to itself, through the memory and control-flow habits that flight coding standards ban outright.

::: context polling-vs-interrupts Asking again and again, or waiting for the bell
**Polling** means the processor keeps asking a device whether it has something new. It is simple, and its timing is easy to predict. But it wastes time when the answer is usually no, and it can only notice an event as fast as it asks.

With an **interrupt**, the device rings and the processor answers. That is faster and wastes nothing while waiting, but the answer arrives at a moment nobody chose.

Real flight code uses both. Fast, rare events use interrupts. Some very predictable control loops deliberately poll at a fixed rate, because a fixed schedule is easy to prove even if it wastes a little time.
:::

::: context context-save What "the context" is
The **context** of running code is everything the processor needs to pick it up again: the values in its working registers, the address of the next instruction (the **program counter**), and some status flags.

On an ARM Cortex-M microcontroller, the hardware itself pushes eight 4-byte words onto the stack when an interrupt arrives — $8 \times 4 = 32$ bytes — before a single line of the handler runs (more if the floating-point unit is in use). That hidden frame lands on whatever stack was in use. It is one reason the stack-sizing example adds margin.
:::

::: context masking Turning the doorbell off for a moment
To **mask** an interrupt is to tell the processor "do not answer this yet". The event is not lost. It waits, marked as pending, until the mask is lifted. (If the same event fires twice while masked, the two can merge into one, so a long mask can lose count.)

Code masks interrupts to protect a few instructions that must run without being split — for example, updating two numbers that must always change together. That is safe only if the masked stretch is very short and its length is known. The longest masked stretch anywhere in the program is added to every interrupt's worst-case latency, so one careless masked loop slows down the whole system's answers.
:::

::: context linux-bottom-halves Linux's four ways to defer work, and the budget to scale
Linux grew several bottom-half mechanisms over the years. A **softirq** is a small fixed set of deferred handlers for the busiest jobs, like networking. A **tasklet** is built on top of softirqs for drivers. A **workqueue** hands work to kernel threads that are allowed to sleep. A **threaded interrupt** gives each handler its own kernel thread, with the top half reduced to a quick check.

Under `PREEMPT_RT`, most of these end up running in threads with priorities you can set. That is what lets a real-time task outrank an unimportant device's deferred work. Here is the budget example from the lesson, drawn to scale: the interrupt path is the thin sliver at the left.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="30" y="50" width="6" height="26" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <rect x="36" y="50" width="9" height="26" fill="#b4232c" stroke="#1f2a44" stroke-width="1"/>
  <rect x="45" y="50" width="285" height="26" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <text x="187" y="67" font-size="12" text-anchor="middle" fill="#1f2a44">left for the bottom half: 9 500 ns</text>
  <line x1="30" y1="40" x2="30" y2="86" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="330" y1="40" x2="330" y2="86" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="30" y="100" font-size="11" text-anchor="middle" fill="#1f2a44">0</text>
  <text x="330" y="100" font-size="11" text-anchor="middle" fill="#1f2a44">10 000 ns</text>
  <line x1="33" y1="46" x2="60" y2="22" stroke="#6c7a93"/>
  <text x="64" y="20" font-size="11" fill="#1f2a44">hardware 200 ns + top half 300 ns = 5%</text>
  <text x="180" y="120" font-size="11" text-anchor="middle" fill="#6c7a93">1 px = 33.3 ns</text>
</svg>
```
:::

::: context virtual-memory Made-up addresses, real memory
With an MMU, every process sees its own tidy set of **virtual** addresses, starting from the same numbers. The MMU quietly maps each page of them onto real memory, wherever it actually is.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="60" y="16" font-size="12" text-anchor="middle" fill="#1f2a44">process A</text>
  <text x="300" y="16" font-size="12" text-anchor="middle" fill="#1f2a44">process B</text>
  <text x="180" y="16" font-size="12" text-anchor="middle" fill="#1f2a44">real memory</text>
  <rect x="30" y="26" width="60" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="30" y="56" width="60" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="60" y="46" font-size="11" text-anchor="middle" fill="#1f2a44">page 0</text>
  <text x="60" y="76" font-size="11" text-anchor="middle" fill="#1f2a44">page 1</text>
  <rect x="270" y="26" width="60" height="30" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="270" y="56" width="60" height="30" fill="#f2b880" stroke="#1f2a44"/>
  <text x="300" y="46" font-size="11" text-anchor="middle" fill="#1f2a44">page 0</text>
  <text x="300" y="76" font-size="11" text-anchor="middle" fill="#1f2a44">page 1</text>
  <rect x="150" y="26" width="60" height="120" fill="#fff" stroke="#1f2a44"/>
  <rect x="150" y="26" width="60" height="30" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="150" y="56" width="60" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="150" y="116" width="60" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <g stroke="#6c7a93" stroke-width="1.5" fill="none">
    <line x1="90" y1="41" x2="150" y2="71"/>
    <line x1="90" y1="71" x2="150" y2="131"/>
    <line x1="270" y1="41" x2="210" y2="41"/>
    <line x1="270" y1="71" x2="210" y2="101"/>
  </g>
  <rect x="150" y="86" width="60" height="30" fill="#f2b880" stroke="#1f2a44"/>
  <text x="180" y="163" font-size="11" text-anchor="middle" fill="#1f2a44">both say "page 0", land in different places</text>
</svg>
```

Neither process can even name the other's memory, so it cannot damage it.
:::

::: context stack-grows-down Why the stack grows downward
On ARM and x86 processors, the stack starts at a high address and each new frame is placed at a lower one. The heap or other data usually sits below it. So a stack that grows too far runs downward into whatever lives below — which is why the guard region goes at the stack's *low* end, just past the last byte it is allowed to use.
:::

::: context guard-region A tripwire below the stack
The stack grows down toward the guard. Any write into the guard faults at once, before it can reach the neighbor below.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <text x="120" y="14" font-size="11" text-anchor="middle" fill="#6c7a93">higher addresses</text>
  <rect x="70" y="22" width="100" height="100" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="120" y="66" font-size="12" text-anchor="middle" fill="#1f2a44">task stack</text>
  <text x="120" y="82" font-size="11" text-anchor="middle" fill="#1f2a44">1 600 bytes</text>
  <rect x="70" y="122" width="100" height="22" fill="#b4232c" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="120" y="137" font-size="11" text-anchor="middle" fill="#fff">guard: no access</text>
  <rect x="70" y="144" width="100" height="36" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="120" y="166" font-size="11" text-anchor="middle" fill="#1f2a44">other task's data</text>
  <text x="120" y="196" font-size="11" text-anchor="middle" fill="#6c7a93">lower addresses</text>
  <line x1="195" y1="40" x2="195" y2="110" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="195,120 189,108 201,108" fill="#1d6fd1"/>
  <text x="205" y="70" font-size="11" fill="#1d6fd1">grows down</text>
  <text x="205" y="137" font-size="11" fill="#b4232c">overrun faults here</text>
</svg>
```
:::

::: context stack-painting How a real RTOS paints its stacks
FreeRTOS, one of the most widely used small real-time operating systems, fills every new task's stack with the byte value `0xA5` when it creates the task. It can then report each task's **high-water mark**: how many bytes at the far end have never been touched. It can also check for overflow at every task switch.

Engineers read the high-water marks during long test runs to confirm the stacks have margin. They are a useful cross-check on the call-graph sum — but, like any measurement, they only show the paths that actually ran.
:::
