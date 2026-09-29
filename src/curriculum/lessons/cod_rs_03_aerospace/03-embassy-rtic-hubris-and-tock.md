---
id: l03-embassy-rtic-hubris-and-tock
title: 'Many jobs, one processor: Embassy, RTIC, Hubris and Tock'
minutes: 22
covers:
  - 'Embassy as the async-first embedded framework family, and RTIC for static-priority hard real time'
  - 'Hubris (Oxide) and Tock as all-Rust microcontroller operating systems'
---

Think about one cook making a whole dinner. The pasta water takes ten minutes to boil. A good cook does not stare at the pot. She chops onions while it heats, stirs the sauce, and comes back when it bubbles. One pair of hands, many dishes, and almost no time wasted waiting.

Now add a smoke alarm. When it goes off, the cook drops everything and deals with it at once, then goes back to the onions.

A flight computer's microcontroller lives exactly like that cook. It has one processor and many jobs: read the gyro, run the control law, talk to the radio, log housekeeping data, blink a status LED. Some jobs spend most of their time waiting for a bus or a timer, like the pasta. A few must happen *right now*, on time, every time, like the smoke alarm. This lesson shows the two main Rust frameworks for sharing one processor among many jobs: **Embassy**, which is built around waiting efficiently, and **RTIC**, which is built around priorities and deadlines. Then it looks at **Hubris** and **Tock**, two operating systems for microcontrollers written in Rust that put walls between the jobs.

The Embassy example was built with `embassy-executor` 0.10.0, `embassy-stm32` 0.6.0 and `embassy-time` 0.5.1, and the RTIC example with `rtic` 2.3.1 and `stm32f4xx-hal` 0.23.0, both for `thumbv7em-none-eabihf`.

## The problem: one processor, many jobs

The simplest way to run several jobs is the **[[superloop|superloop]]**: one big `loop` in `main` that calls each job in turn. It is easy to understand, and plenty of small firmware works this way. Its weakness is that every job waits for every other. If the radio code takes 8 ms, the control law runs 8 ms late.

The processor's own answer is the **interrupt**. A peripheral, such as a timer that has reached its count or a serial port that has received a byte, raises a signal. The processor pauses what it is doing, saves its place, runs a short **interrupt handler** listed in the vector table from lesson 01, and then returns to where it was. On Cortex-M, a unit called the **[[NVIC|nvic-priorities]]** ("nested vectored interrupt controller") decides which interrupt runs, by priority. A higher-priority interrupt can even interrupt a lower-priority handler that is already running.

Hand-written handlers are where the classic embedded bugs live: a variable shared between `main` and a handler, changed by one while the other is halfway through reading it. Embassy and RTIC each organize this for you, in different ways.

## Embassy: many tasks that wait politely

Embassy is a family of crates for writing firmware with Rust's `async` and `await`. An **`async fn`** is a function that can pause in the middle. Each **`.await`** is a place where it says: "I am waiting for something — a timer, a byte on the bus — so let someone else run until it is ready." The paused function is stored as a **[[future|futures-and-polling]]**, a value that remembers where it stopped and can be resumed.

The code that decides which paused function to resume next is the **executor**. Embassy's executor keeps a small set of **tasks**, each an `async fn` that usually loops forever. When every task is waiting, the executor puts the processor to sleep until an interrupt says something is ready, which saves power. Every task is stored in memory set aside when the program is built, so no heap is needed.

```rust
#![no_std]
#![no_main]

use embassy_executor::Spawner;
use embassy_stm32::gpio::{Level, Output, Speed};
use embassy_time::{Duration, Ticker, Timer};
use panic_halt as _;

// A task: an async function the executor can run alongside others.
#[embassy_executor::task]
async fn heartbeat(mut led: Output<'static>) {
    loop {
        led.toggle();
        Timer::after_millis(500).await; // sleep here; other tasks run
    }
}

#[embassy_executor::main]
async fn main(spawner: Spawner) {
    let p = embassy_stm32::init(Default::default());
    let led = Output::new(p.PA5, Level::Low, Speed::Low);
    spawner.spawn(heartbeat(led).unwrap());

    // main is a task too: here it runs a 10 Hz housekeeping loop.
    let mut ticker = Ticker::every(Duration::from_hz(10));
    loop {
        ticker.next().await;
        // read a temperature, check a voltage, ...
    }
}
```

Read it top to bottom.

- `#[embassy_executor::task]` turns `heartbeat` into a task. Its argument has type `Output<'static>`, read "output, tick static": a pin handle allowed to live for the whole run, which a task that never ends needs. Each task has a fixed number of slots, one by default. Calling `heartbeat(led)` returns a `Result`, which is an error if the slots are full; `.unwrap()` takes the token out, and `spawner.spawn` starts the task.
- `#[embassy_executor::main]` sets up the executor and runs `main` as the first task. `embassy_stm32::init` configures the clocks and hands back all the peripherals, the same single-owner idea as `take()` in the last lesson.
- `Timer::after_millis(500).await` pauses `heartbeat` for half a second; meanwhile `main` runs, and when both wait, the chip sleeps.

There is no `memory.x` here: the `memory-x` feature of `embassy-stm32` provides it for the chosen chip.

The Embassy family covers far more than an executor: `embassy-time` for timers and timeouts, `embassy-sync` for channels and signals between tasks, `embassy-net` for networking and `embassy-usb` for USB. There are Embassy HALs for STM32 (`embassy-stm32`), Nordic (`embassy-nrf`) and Raspberry Pi RP2040 and RP2350 chips (`embassy-rp`). The HALs implement the `async` traits of `embedded-hal-async`, so an I2C read can be `imu.read(...).await` and the processor does other work while the bytes crawl down the wire. That is where Embassy shines: firmware that spends its life waiting on buses, radios and USB.

::: warning A task that never awaits blocks everyone
The executor is **cooperative**: it can only switch tasks at an `.await`. It cannot take the processor away from a task in the middle of a calculation. A task that runs a long loop without awaiting holds up every other task on the same executor, no matter how urgent they are. Break long calculations into pieces, or move time-critical work to an interrupt or a higher-priority executor (Embassy has an `InterruptExecutor` that runs inside an interrupt and can preempt the ordinary one).
:::

::: example How late can the heartbeat be?
Suppose the 10 Hz housekeeping step in `main` does 3 ms of arithmetic with no `.await` in it. If the heartbeat's timer expires right as housekeeping starts, `heartbeat` cannot resume until housekeeping reaches its next `.await`.

The worst-case delay is the whole 3 ms step. For the LED that is

$$
\frac{3\,\mathrm{ms}}{500\,\mathrm{ms}} = 0.006 = 0.6\%
$$

of its period, which nobody will ever see.

Now imagine the delayed task were a 1 kHz control loop instead, with a period of $1\,\mathrm{ms}$. A 3 ms stall is $3 / 1 = 3$ whole periods: three control updates missed in a row. The same design choice that is harmless for an LED is a failure for a control loop. That is the reason for the next framework.
:::

## RTIC: priorities decided when you compile

**RTIC** stands for "Real-Time Interrupt-driven Concurrency". It grew out of real-time systems research at Luleå University of Technology in Sweden. It has no scheduler of its own. Instead, it lets the NVIC hardware do the scheduling, and it checks your use of shared data when the program compiles.

An RTIC program is one module marked `#[rtic::app]`, holding a few kinds of function.

- `#[init]` runs once at start-up and builds all the **resources**, the data the tasks will use.
- A **hardware task** is marked `#[task(binds = TIM2, ...)]`: it *is* the interrupt handler for that interrupt, here timer 2.
- A **software task** is an `async fn` marked `#[task(...)]` without `binds`. You start it with `spawn()`, and RTIC runs it from a spare interrupt you name in `dispatchers`.
- Every task has a fixed **priority**, a small number written in the attribute. Higher numbers win.

```rust
#![no_std]
#![no_main]

use panic_halt as _;

#[rtic::app(device = stm32f4xx_hal::pac, dispatchers = [USART1])]
mod app {
    use stm32f4xx_hal::{pac, prelude::*, timer::{CounterHz, Event}};

    #[shared]
    struct Shared {
        rate_cmd: f32, // written by the slow task, read by the fast loop
    }

    #[local]
    struct Local {
        timer: CounterHz<pac::TIM2>,
        ticks: u32,
    }

    #[init]
    fn init(cx: init::Context) -> (Shared, Local) {
        let mut rcc = cx.device.RCC.constrain();
        let mut timer = cx.device.TIM2.counter_hz(&mut rcc);
        timer.start(1.kHz()).unwrap();
        timer.listen(Event::Update);
        (Shared { rate_cmd: 0.0 }, Local { timer, ticks: 0 })
    }

    // Hardware task: runs on every TIM2 interrupt, 1000 times a second.
    #[task(binds = TIM2, priority = 3, shared = [rate_cmd], local = [timer, ticks])]
    fn control_loop(mut cx: control_loop::Context) {
        cx.local.timer.clear_all_flags();
        let _cmd = cx.shared.rate_cmd.lock(|r| *r);
        *cx.local.ticks += 1;
        if *cx.local.ticks % 1000 == 0 {
            // once a second, ask the slow task for a new command
            telemetry::spawn().ok();
        }
    }

    // Software task: lower priority, may be preempted by the control loop.
    #[task(priority = 1, shared = [rate_cmd])]
    async fn telemetry(mut cx: telemetry::Context) {
        cx.shared.rate_cmd.lock(|r| *r += 0.01);
    }
}
```

(The project also needs `rtic = { version = "2", features = ["thumbv7-backend"] }` and the `cortex-m` critical-section feature from the last lesson.)

`timer` and `ticks` are **local**: only `control_loop` uses them, so it gets plain `&mut` access with no locking. `rate_cmd` is **shared** between a priority-3 task and a priority-1 task. To touch it, each task must call `lock` and work inside the closure.

Here is the clever part. RTIC gives every shared resource a **[[priority ceiling|priority-ceiling]]**: the highest priority of any task that uses it, here 3. When `telemetry` (priority 1) locks `rate_cmd`, RTIC raises the processor's running priority to 3 for the length of the closure, so `control_loop` cannot start in the middle and see half an update. When `control_loop` itself locks it, it is already at priority 3, so the lock costs almost nothing. And if you forget to list `rate_cmd` in a task's `shared = [...]` and try to touch it anyway, the program does not compile.

This scheme is built on a published scheduling method, the Stack Resource Policy, and it gives RTIC three guarantees you can state and check:

1. **No data races.** Shared data can only be reached through `lock`, and the compiler enforces it.
2. **No deadlocks.** Locks can never wait on each other in a circle.
3. **Bounded blocking.** A high-priority task can be held up by lower-priority work at most once per activation, and for at most the longest single critical section of a lower-priority task that shares a resource with it.

Point 3 makes RTIC **analysable**: you can add up the worst cases on paper and prove a deadline is met. That matters for **hard real time**, where a missed deadline is a failure, not a slowdown.

::: key Embassy versus RTIC for a hard 1 kHz loop
RTIC. It is a static-priority, interrupt-driven framework whose resource access is proven at compile time and whose scheduling is analysable. Embassy async is excellent ergonomics for I/O-heavy firmware but its executor is harder to reason about for a hard deadline.
:::

::: example Proving the 1 kHz loop meets its deadline
Take the RTIC program above on an STM32F411 running at 100 MHz. Measure (on the bench, with a timer or a logic analyzer) the worst-case execution time of each task:

- `control_loop`: period $T_1 = 1\,\mathrm{ms}$, worst case $C_1 = 0.30\,\mathrm{ms}$;
- a 50 Hz telemetry task: period $T_2 = 20\,\mathrm{ms}$, worst case $C_2 = 4\,\mathrm{ms}$;
- the longest time the telemetry task holds the `rate_cmd` lock: $B_1 = 0.005\,\mathrm{ms}$ (5 microseconds).

**Step 1, the cycle budget.** At 100 MHz there are $100 \times 10^6 \times 0.001 = 100{,}000$ clock cycles per 1 ms period. The control loop may use at most that many.

**Step 2, total load.** The **utilization** $U$ of a task is how much of the processor it needs, $C/T$:

$$
U = \frac{C_1}{T_1} + \frac{C_2}{T_2} = \frac{0.30}{1} + \frac{4}{20} = 0.30 + 0.20 = 0.50.
$$

For two tasks where the faster one has the higher priority, a classic result by Liu and Layland says every deadline is met if $U \le 2(\sqrt{2} - 1) \approx 0.828$. Here $0.50 \le 0.828$, so the set is schedulable.

**Step 3, the worst response of the control loop.** Its worst response time is its own work plus the one blocking it can suffer:

$$
R_1 = C_1 + B_1 = 0.30 + 0.005 = 0.305\,\mathrm{ms} < 1\,\mathrm{ms}.
$$

**Step 4, the worst response of telemetry.** It is preempted by every control-loop run that starts while it is still working. Start with $R = 4$ and repeat $R \leftarrow C_2 + \lceil R / T_1 \rceil \, C_1$, where $\lceil x \rceil$, read "ceiling of x", rounds up to a whole number:

- $4 + \lceil 4 \rceil \times 0.3 = 4 + 1.2 = 5.2\,\mathrm{ms}$;
- $4 + \lceil 5.2 \rceil \times 0.3 = 4 + 6 \times 0.3 = 5.8\,\mathrm{ms}$;
- $4 + \lceil 5.8 \rceil \times 0.3 = 4 + 1.8 = 5.8\,\mathrm{ms}$, the same, so it has settled.

$R_2 = 5.8\,\mathrm{ms}$, well inside its $20\,\mathrm{ms}$ period. Both deadlines are proven, on paper, from measured numbers. Sanity check: the control loop's answer barely exceeds its own run time, as it should for the highest priority. Try this with a cooperative executor and step 3 has no answer, because the blocking term is "however long the longest stretch between `.await`s in any other task is".
:::

::: note Why blocking happens at most once
Suppose the control loop could be blocked twice in one activation, by two different lower-priority critical sections. For the second one to exist, a lower-priority task must have *started* a critical section after the control loop was already waiting. But the control loop's interrupt is pending at priority 3, and no task of lower priority can start running while it is pending, so no new critical section can begin. The only critical section that can be in progress is the one that was already running when the interrupt arrived. So there is at most one, and its length is the bound.
:::

### Choosing between them

Neither framework is "better"; they answer different questions.

| Question | Embassy | RTIC |
|---|---|---|
| How are tasks switched? | Cooperatively, at each `.await` | By NVIC hardware priorities, preemptively |
| Best at | I/O-heavy firmware: radios, USB, networking | Hard deadlines: control loops, sampling |
| Shared data | Channels and mutexes from `embassy-sync` | `lock` on resources, checked at compile time |
| Timing proof | Hard: depends on every other task's code | Standard analysis from priorities and measured times |

The line is blurring a little: RTIC 2's software tasks are themselves `async` functions, and you can run several Embassy executors at different interrupt priorities. A common pattern is a small set of high-priority RTIC hardware tasks for the control path and `async` code for the chatty I/O.

## Hubris and Tock: operating systems with walls

Embassy and RTIC build *one* program, in which every task can in principle reach any memory. If the radio code writes over the control loop's data, nothing stops it.

An **operating system** adds walls. Most Cortex-M chips have a **[[memory protection unit|mpu-walls]]** (MPU), hardware that can restrict which address ranges the running code may touch. An OS **kernel**, the small privileged core of the system, sets up the MPU so that each part of the software can only reach its own memory. A buggy part then faults on its own, and the kernel decides what happens next instead of the bug spreading. Aviation calls this idea **partitioning**.

### Hubris, from Oxide Computer Company

**Hubris** is a small operating system for microcontrollers made by Oxide Computer Company, which builds rack-scale server computers. Oxide made it public in 2021 and uses it on the microcontrollers inside its own machines, such as the service processor that manages each server. The kernel and all the tasks are written in Rust.

Its documented design choices are:

- **Everything is decided at build time.** The list of tasks, their memory and their priorities are written in a configuration file. The kernel does not create new tasks while running and does not allocate memory dynamically.
- **Tasks are separate programs.** Each task is compiled separately and runs unprivileged in its own MPU-protected memory. Even device drivers are ordinary tasks, not part of the kernel.
- **Tasks talk by synchronous messages.** A task sends a message to another and waits until it replies, like a phone call rather than a letter. A sender can also lend a piece of its memory to the receiver for the length of the call.
- **Faults are contained and restartable.** When a task crashes, the kernel stops it, and a supervisor task can restart it while the others keep running.

Its companion debugger is called **Humility**.

### Tock, from academic research

**Tock** began as a research project at Stanford, and a 2017 paper at the SOSP operating-systems conference described its design. It runs on Cortex-M and RISC-V microcontrollers and is used in security hardware, including Google's open-source security-key firmware, OpenSK.

Tock splits the world into two kinds of code:

- **[[Capsules|tock-capsules]]** are parts of the kernel, such as drivers, written in Rust. They are not allowed to use `unsafe`, so the Rust type system itself keeps a buggy capsule from reaching memory it does not own.
- **Processes** are applications. They are isolated by the MPU, can be written in C as well as Rust, and can be loaded or replaced separately from the kernel.

So Tock's kernel is all Rust, and it leans on the language for one wall and on the hardware for the other.

::: key Hubris and Tock
Hubris (Oxide Computer Company): all-Rust, fully static — tasks fixed at build time, no dynamic allocation in the kernel, drivers as unprivileged tasks, synchronous message passing, crashed tasks restartable. Tock (research origin at Stanford): Rust kernel whose capsules are isolated by the type system (no unsafe), plus MPU-isolated processes in C or Rust that can be loaded separately.
:::

::: warning Do not oversell either one
Neither Hubris nor Tock was built for spacecraft, and you should not describe either as flight software. The real-time operating systems you will meet on flight computers are mostly C systems with long heritage, such as RTEMS, VxWorks and FreeRTOS. What Hubris and Tock offer is a working, open-source example of ideas flight software cares about: static configuration, isolation and restarting a failed part. Cite them for those ideas, not as evidence that Rust flies. Lesson 10 covers what the real evidence for Rust in space is, including the RTEMS work.
:::

## Check yourself

::: check
Your team's firmware must run a USB link to a ground-support laptop, a radio modem and an SD-card logger, with no hard deadlines anywhere. Which framework would you start with, and why?
:::

::: answer
Embassy. Every job is I/O: the code mostly waits for bytes on USB, the modem's serial port and the SD card's bus. `async` tasks express that waiting directly, the chip sleeps when nothing is ready, and the family already provides USB, timers, channels and `async` HAL drivers. With no hard deadline, cooperative scheduling is no problem.
:::

::: check
In an RTIC app, a resource is used by tasks at priorities 1, 2 and 4. What is its ceiling, and what happens to the running priority when the priority-2 task locks it?
:::

::: answer
The ceiling is the highest priority of any task that uses it: 4. When the priority-2 task calls `lock`, RTIC raises the running priority to 4 for the length of the closure, so neither the priority-4 task nor anything at 3 can start in the middle. Tasks at priority 5 or above, which do not use this resource, can still preempt. When the closure ends, the priority drops back to 2.
:::

::: check
A 500 Hz attitude loop (period 2 ms) runs at the top priority with worst case 0.6 ms. The longest lower-priority critical section on a resource it shares is 0.05 ms. A second task runs at 20 Hz (period 50 ms) with worst case 10 ms. Is the pair schedulable by the utilization test, and what is the attitude loop's worst response time?
:::

::: answer
Utilization: $0.6/2 + 10/50 = 0.30 + 0.20 = 0.50$, which is below the two-task bound $2(\sqrt{2} - 1) \approx 0.828$, so every deadline is met. The attitude loop's worst response is its own work plus one blocking: $0.6 + 0.05 = 0.65\,\mathrm{ms}$, well inside its $2\,\mathrm{ms}$ period.
:::

::: check
Why can a single slow calculation in one Embassy task make another Embassy task late, when the same slow calculation in a low-priority RTIC task cannot delay a high-priority RTIC task (beyond one short critical section)?
:::

::: answer
Embassy's executor is cooperative: it switches tasks only at an `.await`, so code with no `.await` holds the processor until it finishes. RTIC tasks are interrupt handlers scheduled by the NVIC: when the high-priority interrupt fires, the hardware preempts the low-priority task at once. Only a lower-priority `lock` on a shared resource can hold it up, bounded by the longest such critical section.
:::

::: check
Name one way Hubris and Tock differ in how they isolate code, and one way they are alike.
:::

::: answer
Different: Hubris runs every task, drivers included, as a separate unprivileged program behind the MPU, with the task list fixed at build time. Tock puts drivers in the kernel as capsules, isolated by the type system because capsules may not use `unsafe`, and uses the MPU only for application processes, which can be loaded separately. Alike: both have a kernel written in Rust, and both use the MPU to wall parts of the system off from each other.
:::

## Summary

| Idea | What it is | Key fact |
|---|---|---|
| Superloop | One `loop` calling each job in turn | Every job waits for every other |
| Interrupt and NVIC | Hardware pauses code to run a handler, by priority | Higher priority preempts lower |
| Embassy | `async` executor, HALs, time, sync, net, USB | Cooperative: switches only at `.await` |
| RTIC | Tasks bound to interrupts with fixed priorities | Compile-time-checked `lock`, bounded blocking |
| Priority ceiling | Highest priority of any task using a resource | `lock` raises to the ceiling |
| Utilization test | $\sum C_i / T_i \le n(2^{1/n} - 1)$ | Two tasks: $\approx 0.828$ |
| Hubris | Oxide's static, all-Rust microcontroller OS | Tasks fixed at build time; restartable |
| Tock | Rust kernel, capsules and MPU-isolated processes | Capsules forbid `unsafe` |

The next lesson turns to the tools you will use every day on real hardware: defmt for logging, probe-rs for flashing and debugging, heapless for fixed-size collections, and the critical sections you have now met twice.

::: context superloop The oldest scheduler
A superloop is literally `loop { read_sensors(); run_control(); send_telemetry(); }`. Its great strength is that it is easy to reason about: the jobs always run in the same order. A superloop plus a few interrupt handlers is still a sound design for a small, simple board. It breaks down when one job's run time varies a lot, because every other job inherits that variation as **jitter**, the wobble in when something happens compared with when it should.
:::

::: context nvic-priorities Interrupting an interrupt
The NVIC lets a higher-priority interrupt preempt a lower-priority handler that is already running. The timeline below shows a low-priority task interrupted by the 1 kHz control interrupt, which runs to completion before the low-priority task resumes.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <text x="10" y="36" font-size="11" fill="#1f2a44">prio 3</text>
  <text x="10" y="76" font-size="11" fill="#1f2a44">prio 1</text>
  <text x="10" y="116" font-size="11" fill="#1f2a44">idle</text>
  <rect x="120" y="22" width="50" height="22" fill="#b4232c"/>
  <text x="145" y="37" font-size="11" text-anchor="middle" fill="#fff">control</text>
  <rect x="70" y="62" width="50" height="22" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="170" y="62" width="80" height="22" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="210" y="77" font-size="11" text-anchor="middle" fill="#1f2a44">telemetry</text>
  <rect x="60" y="102" width="10" height="22" fill="#fff" stroke="#6c7a93"/>
  <rect x="250" y="102" width="90" height="22" fill="#fff" stroke="#6c7a93"/>
  <text x="295" y="117" font-size="11" text-anchor="middle" fill="#6c7a93">sleep</text>
  <line x1="120" y1="10" x2="120" y2="130" stroke="#1f2a44" stroke-dasharray="3,3"/>
  <text x="124" y="14" font-size="11" fill="#1f2a44">timer fires</text>
  <line x1="60" y1="132" x2="345" y2="132" stroke="#1f2a44"/>
  <text x="345" y="128" font-size="11" text-anchor="end" fill="#1f2a44">time</text>
</svg>
```

Saving and restoring the interrupted code's registers is done by the hardware, which is why Cortex-M interrupt handlers can be ordinary Rust functions.
:::

::: context futures-and-polling What a future really is
The compiler turns an `async fn` into a state machine: a struct that remembers which `.await` it stopped at and the local variables it needs to continue. The executor resumes it by calling its `poll` method. `poll` either finishes with a value or says "still pending", and the thing being waited on (a timer, an interrupt) arranges a **waker** to tell the executor when polling again is worthwhile. Because the struct's size is known at compile time, Embassy can reserve memory for every task in advance instead of using a heap.
:::

::: context priority-ceiling Raising the floor while you hold the key
Think of a resource as a room with one key, and the ceiling as the rank of the most important person who ever needs that room. While you hold the key, the building treats you as that rank, so nobody who might need the room can interrupt you and find it half-tidied. People more important than anyone who uses the room can still interrupt you, because they will never ask for the key. RTIC computes each ceiling from the `shared = [...]` lists, before the program runs, and on Cortex-M it raises the level with the BASEPRI register, which masks every interrupt at or below a chosen priority.
:::

::: context mpu-walls Walls made of address ranges
A Cortex-M memory protection unit holds a small number of **regions**, typically 8 on a Cortex-M4. Each region is an address range with rules: readable, writable, executable, and whether unprivileged code may touch it. The kernel reprograms the regions each time it switches to a different task.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="20" width="320" height="26" fill="#6c7a93"/>
  <text x="180" y="37" font-size="11" text-anchor="middle" fill="#fff">kernel (privileged)</text>
  <rect x="20" y="56" width="100" height="50" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="70" y="85" font-size="11" text-anchor="middle" fill="#1f2a44">task A</text>
  <rect x="130" y="56" width="100" height="50" fill="#f2b880" stroke="#1f2a44"/>
  <text x="180" y="85" font-size="11" text-anchor="middle" fill="#1f2a44">task B</text>
  <rect x="240" y="56" width="100" height="50" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="290" y="85" font-size="11" text-anchor="middle" fill="#1f2a44">driver task</text>
  <line x1="120" y1="56" x2="120" y2="106" stroke="#b4232c" stroke-width="3"/>
  <line x1="230" y1="56" x2="230" y2="106" stroke="#b4232c" stroke-width="3"/>
  <text x="180" y="128" font-size="11" text-anchor="middle" fill="#b4232c">a stray write across a wall faults</text>
  <text x="180" y="143" font-size="11" text-anchor="middle" fill="#1f2a44">instead of corrupting a neighbor</text>
</svg>
```

Integrated avionics uses the same idea at a larger scale: the ARINC 653 standard gives each partition its own memory and its own guaranteed slice of processor time.
:::

::: context tock-capsules Isolation by the compiler
A Tock capsule is a Rust module inside the kernel. The crate that holds capsules forbids `unsafe` code, so the only way a capsule can reach memory is through references and APIs that the borrow checker has already verified. That makes isolation between capsules free at run time: no MPU switch, no copying. The price is that capsules must trust the compiler and cannot be written in C. For code that is not trusted, such as third-party applications, Tock uses processes behind the MPU instead.
:::
