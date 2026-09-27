---
id: l04-embedded-tooling-and-static-memory
title: Logging, flashing and fixed-size memory on a chip
minutes: 30
covers:
  - 'defmt logging, probe-rs, cargo-embed, rtt-target'
  - 'heapless collections: Vec, String and spsc::Queue with static capacity'
  - 'critical-section and static_assertions'
---

Think about an egg carton. It holds exactly twelve eggs. You know how much room it takes in the fridge before you go shopping, and you can never squeeze in a thirteenth: the carton is simply full. Compare that with a shopping bag, which stretches until something tears. A shopping bag is flexible, but you never quite know how much room it will need.

A microcontroller program is a fridge with no spare shelf. In lesson 01 you gave up the heap, the stretchy shopping bag, because running out of heap in the middle of a mission is a failure you cannot test away. This lesson gives you the egg cartons: collections whose size is fixed when you compile. It also gives you two other things every piece of firmware needs on day one. The first is a way to *see* what the chip is doing, since there is no screen and no `println!`. The second is a way to share data safely between the main loop and an **interrupt**, and a way to have the compiler check facts about sizes and layouts before the code ever reaches the board.

Everything here was built with Rust 1.94.1 for the `thumbv7em-none-eabihf` target you met in lesson 01 (a Cortex-M4 or M7 with a floating-point unit), using `defmt` 1.1.1, `defmt-rtt` 1.3.0, `panic-probe` 1.0.0, `rtt-target` 0.6.2, `heapless` 0.9.3, `critical-section` 1.2.0 and `static_assertions` 1.1.0. Every size and message quoted is from a real build.

## The debug probe: a cable into the chip

On a laptop you run a program and read what it prints. A microcontroller on a circuit board has no screen, no keyboard and no files. So how do you even put a program onto it?

You use a **[[debug probe|debug-probe]]** — a small adapter that plugs into your laptop by USB on one side and into two or three pins on the chip on the other. On Cortex-M those pins speak **SWD**, Serial Wire Debug, a wiring standard built into every Cortex-M core. Through them the probe can stop and start the processor, write the flash memory, and read or write any address in RAM while the program runs. Many development boards have a probe built in: ST's Nucleo boards carry an ST-LINK, and plenty of others carry a CMSIS-DAP probe. Stand-alone probes such as SEGGER's J-Link do the same job.

**probe-rs** is a toolkit, written in Rust, that talks to all of these probes. It can flash a program, reset the chip, read memory, act as a server for a debugger like `gdb`, and print the log messages your firmware sends. You install it once with `cargo install probe-rs-tools --locked`, which gives you the `probe-rs` command and also `cargo embed`.

The everyday way to use it is to make it the **runner** for your project. A runner is the command cargo uses when you type `cargo run`. On a laptop the runner is "execute the program here". For the chip you tell cargo, in `.cargo/config.toml`, to hand the finished program to probe-rs instead:

```toml
[build]
target = "thumbv7em-none-eabihf"

[target.thumbv7em-none-eabihf]
runner = "probe-rs run --chip STM32F411RETx"
rustflags = ["-C", "link-arg=-Tlink.x", "-C", "link-arg=-Tdefmt.x"]
```

Now `cargo run --release` compiles for the chip, and then probe-rs flashes the program, resets the chip, and stays attached, printing every log message until you press Ctrl+C. The `--chip` name must match the exact part on your board, the same way `memory.x` must. (`-Tdefmt.x` is a second linker script that the `defmt` crate needs; you will see why in a moment.)

**cargo-embed** is the other front end from the same project. Instead of command-line flags it reads a file called `Embed.toml` in your project, so a whole team shares one setup:

```toml
[default.general]
chip = "STM32F411RETx"

[default.rtt]
enabled = true

[default.gdb]
enabled = false
```

Typing `cargo embed --release` builds, flashes, and opens a terminal showing the chip's messages. Turn `gdb` on and it also starts a debug server you can attach `gdb` to, for breakpoints and stepping on the real hardware.

::: warning A probe cannot rescue the wrong chip name
`probe-rs run --chip` does not guess. Name a chip with a different flash layout and the flashing either fails or writes to the wrong place. When a board refuses to start, check the exact part number printed on the chip, then `--chip`, then `memory.x`, in that order.
:::

## RTT: a mailbox in RAM

Now you can flash a program. How does the program talk back?

The old way is a serial port: wire a pin to a USB-serial adapter and send text one bit at a time. It works, but it costs a pin, it is slow, and sending a long line can take longer than one pass of your control loop.

**RTT**, Real-Time Transfer, is a cleverer trick invented by SEGGER, the company that makes J-Link probes. The firmware sets aside a small block of RAM with a known label on it: the **[[RTT control block|rtt-control-block]]**, holding one or more ring buffers. To "print", the firmware copies bytes into a buffer, which takes a few microseconds. The debug probe is already able to read any RAM address while the processor keeps running, so the laptop side keeps peeking at that buffer through the probe and pulls the new bytes out. No extra pin, no stopping the processor, no waiting for a slow wire.

The **rtt-target** crate is the plain-text way to use RTT from Rust:

```rust
#![no_std]
#![no_main]

use cortex_m_rt::entry;
use panic_halt as _;
use rtt_target::{rprintln, rtt_init_print};

#[entry]
fn main() -> ! {
    rtt_init_print!(); // set up one RTT "up" channel for text
    rprintln!("boot: attitude board v{}", 3u8);
    let mut tick: u32 = 0;
    loop {
        let rate = core::hint::black_box(0.0123_f32) * tick as f32;
        rprintln!("tick {} gyro_z = {} rad/s", tick, rate);
        if rate > 1.0 {
            rprintln!("rate above limit: {}", rate);
        }
        tick = tick.wrapping_add(1);
        cortex_m::asm::delay(8_000_000);
    }
}
```

`rtt_init_print!()` creates one "up" channel (chip to laptop) with a 1024-byte buffer, and `rprintln!` works like `println!`. (`black_box` stops the compiler from working out the whole calculation in advance, so the program really computes and prints a float.) This is easy and familiar. It has one cost, and on a chip the cost matters: to turn `rate` into the characters `15.1782`, the chip itself has to run Rust's full text-formatting machinery, `core::fmt`, and that code has to live in flash.

## defmt: send the number, not the sentence

Picture a busy burger stand. The kitchen does not shout "one cheeseburger with no onions, extra pickles and a large lemonade" across the counter every time an order is ready. Everyone already has a receipt with a number on it, so the kitchen shouts "forty-seven!". The meaning lives on the receipt. Only the short number travels.

**defmt**, short for **[[deferred formatting|defmt-name]]**, does the same with log messages. When you compile, each format string such as `"tick {} gyro_z = {} rad/s"` is given a small index number, and the string itself is stored in the program's **[[ELF file|elf-file]]** — the full build output on your laptop, with its debug information — but *not* in the part that gets written to flash. At run time the chip sends only the index and the raw bytes of the arguments: four bytes for a `u32`, four for an `f32`. The laptop-side tool (probe-rs, or `defmt-print`) looks the index up in the same ELF file and does the formatting there, where memory and time are cheap.

Here is the same program written with defmt:

```rust
#![no_std]
#![no_main]

use cortex_m_rt::entry;
use defmt_rtt as _; // the transport: sends defmt frames over RTT
use panic_probe as _; // on panic, print the message with defmt, then stop

#[entry]
fn main() -> ! {
    defmt::info!("boot: attitude board v{}", 3u8);
    let mut tick: u32 = 0;
    loop {
        let rate = core::hint::black_box(0.0123_f32) * tick as f32;
        defmt::info!("tick {} gyro_z = {} rad/s", tick, rate);
        if rate > 1.0 {
            defmt::warn!("rate above limit: {}", rate);
        }
        tick = tick.wrapping_add(1);
        cortex_m::asm::delay(8_000_000);
    }
}
```

The pieces fit together like this. `defmt` provides the logging macros. `defmt-rtt` is the **transport**: it carries defmt's compact bytes over an RTT buffer. `panic-probe` is a panic handler (lesson 01) that logs the panic message through defmt and then stops the chip. The `-Tdefmt.x` line in the runner config is the linker script that collects all the interned strings into their own section of the ELF.

Messages come in five **[[log levels|log-levels]]**: `trace`, `debug`, `info`, `warn` and `error`. You choose which ones are compiled in with the `DEFMT_LOG` environment variable, for example `DEFMT_LOG=info`. Levels below the one you pick are removed completely when you compile, so they cost nothing at all. If you set nothing, only `error` messages are kept, which surprises everyone the first time their `info!` lines print nothing.

Your own types can be logged too: put `#[derive(defmt::Format)]` on a struct or enum, the way you put `#[derive(Debug)]` on one for `println!`.

::: key What defmt solves
Formatting strings on a device with kilobytes of RAM is expensive. defmt sends compact binary tokens and reconstructs the message on the host using the debug information, cutting both code size and link bandwidth dramatically.
:::

::: example Measuring the difference in flash
Both programs above were built with `cargo build --release` for `thumbv7em-none-eabihf`, and `llvm-size -A` listed their sections. The rows that end up in flash:

```text
                  rtt-target + core::fmt     defmt
.vector_table            1024                1024
.text                   27392                6260
.rodata                  4368                 856
.data                       0                  56
```

Flash holds the vector table, the code (`.text`), the constants (`.rodata`) and the starting values of `.data`. Add each column.

For the `rtt-target` version: $1024 + 27392 + 4368 + 0 = 32784$ bytes.

For the defmt version: $1024 + 6260 + 856 + 56 = 8196$ bytes.

The ratio is $32784 / 8196 = 4.0$. The defmt build is a quarter of the size. Almost all of the saving is `core::fmt`, and especially the code for printing floats, which the chip no longer needs.

On a chip with 512 KiB of flash, that is $32784 / 524288 \approx 6.3\%$ against $8196 / 524288 \approx 1.6\%$. On a small part with 32 KiB of flash, the text version would already have used the whole chip.

Where did the words go? Searching the flashable image of the defmt build for `gyro_z` finds nothing. The string is still in the ELF file, as the name of a symbol in its symbol table (`llvm-nm` prints it):

```text
00000006 N {"package":"fwdefmt","tag":"defmt_info","data":"tick {} gyro_z = {} rad/s","disambiguator":"8300568402406072548","crate_name":"fwdefmt"}
```

The `00000006` is the index the chip sends. The laptop reads it, finds this entry, and fills in `{}` and `{}` with the bytes that followed.
:::

The bandwidth saving is just as real. The text line `tick 1234 gyro_z = 15.1782 rad/s` plus its newline is 33 characters. The defmt frame for it is an index and eight bytes of arguments, plus a little framing.

::: warning Decode with the exact ELF you flashed
The index numbers only mean something next to the ELF file from the same build. Flash one build, then decode its output with the ELF from a later build, and the laptop happily prints the wrong messages or garbage. Let `cargo run` or `cargo embed` do both steps from one build, and archive the ELF next to every binary you release, so logs from a unit in the field can still be read.
:::

## heapless: the egg-carton collections

In a `no_std` program without an allocator, `Vec` and `String` from the standard library are not available. The **heapless** crate gives you versions that keep their storage inside themselves, with a maximum size written into the type:

- `heapless::Vec<T, N>` — a list of at most `N` items of type `T`.
- `heapless::String<N>` — text of at most `N` bytes.
- `heapless::spsc::Queue<T, N>` — a first-in, first-out queue for passing items from one part of the program to another.

The `N` is a **const generic**, the same idea as `MovingAverage<N>` in lesson 01: a number that is part of the type and known when the code compiles. Because the size is known, the whole collection can live on the stack or in a `static`, and the memory it will ever need is counted in `.bss` before the chip is switched on.

The other big difference is what happens when the carton is full. `std::Vec::push` never fails; it asks the heap for more room. `heapless::Vec::push` cannot grow, so it returns a `Result`. If there is room you get `Ok(())`. If not, you get `Err(item)`, with the item you tried to add handed back to you, so nothing is silently lost.

::: example Filling a Vec, a String and a Queue
```rust
use core::fmt::Write;
use heapless::{String, Vec};
use heapless::spsc::Queue;

fn main() {
    // A list of at most 4 temperatures. The 4 is part of the type.
    let mut temps: Vec<f32, 4> = Vec::new();
    for t in [21.5, 22.0, 22.4, 23.1, 23.9] {
        match temps.push(t) {
            Ok(()) => println!("stored {t}"),
            Err(rejected) => println!("full, rejected {rejected}"),
        }
    }
    println!("len = {}, capacity = {}", temps.len(), temps.capacity());

    // A telemetry line of at most 32 bytes.
    let mut line: String<32> = String::new();
    write!(line, "T={:.1}C N={}", temps[3], temps.len()).unwrap();
    println!("line = {:?} ({} bytes)", line.as_str(), line.len());
    let too_long = line.push_str(" and a lot more text here");
    println!("push_str -> {:?}", too_long);

    // A queue of u16 samples. Queue<T, 4> holds at most 3 items.
    let mut q: Queue<u16, 4> = Queue::new();
    for s in [100, 101, 102, 103] {
        println!("enqueue {s} -> {:?}", q.enqueue(s));
    }
    println!("capacity = {}", q.capacity());
    while let Some(s) = q.dequeue() {
        println!("dequeue {s}");
    }
}
```

This ran on the laptop (heapless works with or without `std`, which is exactly why you can unit-test firmware logic on a laptop):

```text
stored 21.5
stored 22
stored 22.4
stored 23.1
full, rejected 23.9
len = 4, capacity = 4
line = "T=23.1C N=4" (11 bytes)
push_str -> Err(CapacityError)
enqueue 100 -> Ok(())
enqueue 101 -> Ok(())
enqueue 102 -> Ok(())
enqueue 103 -> Err(103)
capacity = 3
dequeue 100
dequeue 101
dequeue 102
```

Walk through it. The fifth temperature does not fit in four slots, so `push` hands `23.9` back. `write!` works on a heapless `String` because it implements `core::fmt::Write`; the line is 11 bytes, well under 32. Adding 25 more bytes would make 36, over the limit, so `push_str` returns `Err(CapacityError)` and leaves the string as it was. The queue of type `Queue<u16, 4>` accepts only three items, and they come out in the order they went in.
:::

Why does a `Queue<u16, 4>` hold only three? A queue like this is a [[ring buffer|one-empty-slot]]: a reading position chases a writing position around a fixed circle of slots. In heapless 0.9 one slot always stays empty, so the queue can tell "full" apart from "empty" by comparing the two positions. So `Queue<T, N>` holds `N - 1` items. Choose `N` one larger than the number you need.

How big are these things? On the laptop, where `usize` is 8 bytes, `size_of` gave 24 bytes for `Vec<f32, 4>` (a length counter plus four 4-byte floats) and 40 for `String<32>` (a length plus 32 bytes). There is no pointer and no separate heap block: what you see is all there is. On a Cortex-M, where `usize` is 4 bytes, the same `Vec` is 20 bytes.

### Splitting a queue between an interrupt and the main loop

The "spsc" in `spsc::Queue` means **single producer, single consumer**: exactly one part of the program puts items in, and exactly one takes them out. That is the shape of most firmware. An interrupt handler receives bytes from a sensor and enqueues them; the main loop dequeues and processes them.

`queue.split()` turns one queue into a `Producer`, which can only enqueue, and a `Consumer`, which can only dequeue. Each half goes to its own context. Because only one side ever moves the write position and only one side ever moves the read position, the two can run at the same time without a lock. The borrow checker does its part too: `split` borrows the queue mutably, so nobody else can touch it while the halves exist.

On a laptop you can rehearse this with a thread standing in for the interrupt:

```rust
use heapless::spsc::Queue;

fn main() {
    let mut q: Queue<u32, 8> = Queue::new();
    let (mut producer, mut consumer) = q.split();

    std::thread::scope(|s| {
        // Plays the part of an interrupt handler: it only ever enqueues.
        s.spawn(move || {
            for sample in 1..=20u32 {
                while producer.enqueue(sample).is_err() {
                    std::hint::spin_loop(); // queue full: wait for the reader
                }
            }
        });
        // Plays the part of the main loop: it only ever dequeues.
        let mut sum = 0;
        let mut got = 0;
        while got < 20 {
            if let Some(v) = consumer.dequeue() {
                sum += v;
                got += 1;
            }
        }
        println!("received {got} samples, sum = {sum}");
    });
}
```

```text
received 20 samples, sum = 210
```

Twenty samples pass through a queue that holds seven at a time, and the sum $1 + 2 + \dots + 20 = 210$ proves none was lost or repeated. On a real chip the queue usually lives in a `static`, and the framework you met in lesson 03 hands the producer to the interrupt and the consumer to the main task.

heapless has more cartons. The one you will want for the module exercise is `HistoryBuf<T, N>`, which keeps only the last `N` values written and quietly drops the oldest: write 10, 20, 30, 40, 50 into a `HistoryBuf<i32, 3>` and it holds 30, 40, 50.

::: key heapless in one line each
`Vec<T, N>`, `String<N>` and `spsc::Queue<T, N>` store their items inline with a capacity fixed in the type, so they need no allocator and can live in a `static`. `push`, `push_str` and `enqueue` return an error instead of growing. `Queue<T, N>` holds `N - 1` items and splits into one `Producer` and one `Consumer`.
:::

::: warning Do not throw the error away
`let _ = log.push(sample);` compiles, and silently drops samples when the list is full. Decide what "full" means for each buffer: drop the newest, drop the oldest (that is what `HistoryBuf` is for), count the drops in a health counter, or treat it as a fault. And keep big collections out of the stack: a `Vec<[f32; 6], 4096>` is 96 KiB, which will overflow a small stack before `main` gets going. Put it in a `static`.
:::

## critical-section: sharing with an interrupt

Picture a family with one bathroom and a lock on the door. Whoever is inside turns the lock; everyone else waits. The lock is only turned for a short time, and nobody has to agree on anything else.

An **[[interrupt|interrupt]]** is a signal from hardware (a timer, a sensor saying "data ready") that makes the processor pause whatever it is doing, run a special function called an interrupt handler, and then carry on. The pause can come between any two instructions. So if the main loop is halfway through updating a shared struct when the handler fires and updates it too, the struct can end up half old and half new. That is a data race on one core, and `static mut` (lesson 07 of the last module) invites it.

A **critical section** is a stretch of code during which nothing else can run that could touch the shared data — the bathroom with the door locked. On a single-core Cortex-M the simplest way to get one is to switch interrupts off, do the short job, and switch them back on.

The **critical-section** crate gives every library the same way to ask for this, without knowing how it is done on a particular chip:

```rust
use core::cell::RefCell;
use critical_section::Mutex;

// One telemetry frame, laid out the way the radio expects it.
#[repr(C)]
struct Frame {
    seq: u16,
    flags: u16,
    rate_mdps: [i32; 3], // body rate in milli-degrees per second
}

// Shared between the main loop and an interrupt handler.
static LATEST: Mutex<RefCell<Option<Frame>>> = Mutex::new(RefCell::new(None));

fn on_radio_interrupt(seq: u16) {
    let frame = Frame { seq, flags: 0, rate_mdps: [120, -45, 3] };
    critical_section::with(|cs| {
        LATEST.borrow(cs).replace(Some(frame));
    });
}

fn main() {
    on_radio_interrupt(7);
    let seq = critical_section::with(|cs| {
        LATEST.borrow(cs).borrow().as_ref().map(|f| f.seq)
    });
    println!("latest frame seq = {:?}", seq);
}
```

```text
latest frame seq = Some(7)
```

Read it slowly. `critical_section::with` runs the closure you give it inside a critical section, and passes it `cs`, a **[[token|cs-token]]** of type `CriticalSection` that exists only while the section lasts. The crate's `Mutex` is not a lock that waits; it is a box whose `borrow(cs)` method needs that token. You cannot get at `LATEST`'s contents without being inside a critical section, and the compiler checks that for you. Inside, `RefCell` (lesson 05 of the last module) gives the mutable access.

Where does "switch interrupts off" come from? From exactly one place in the final program. Library crates only *call* `critical_section::with`. The application picks the **implementation** once, usually by turning on a feature: on a single-core Cortex-M it is `cortex-m = { version = "0.7", features = ["critical-section-single-core"] }`, which disables interrupts on entry and restores them on exit. An RTOS or a multi-core chip provides a different implementation. The example above ran on a laptop with the crate's `std` feature, which uses an ordinary lock. The same driver code works in all three.

::: warning Keep the door locked for as short a time as possible
While a critical section is open on a single-core chip, interrupts wait. Copy the data in or out and leave. Doing a long calculation, or waiting on a bus, inside `critical_section::with` delays every interrupt by that much, and a 1 kHz control loop driven by a timer interrupt will start to jitter or miss its deadline.
:::

## static_assertions: checks the compiler runs for you

The frame above is sent over a radio link, and the ground software expects exactly 16 bytes. Suppose someone later adds a one-byte `health` field after `flags`. The code still compiles and runs, but every frame is now the wrong size, and the ground station reads nonsense. You would like the build to stop the moment that happens.

The **static_assertions** crate gives you checks that run when the code compiles, not when it runs:

```rust
use static_assertions::{assert_eq_size, const_assert};

const FRAME_BYTES: usize = 16;
assert_eq_size!(Frame, [u8; FRAME_BYTES]);

const QUEUE_DEPTH: usize = 64;
const_assert!(QUEUE_DEPTH.is_power_of_two());
```

`assert_eq_size!(A, B)` fails the build unless the two types have the same size. `const_assert!(expr)` fails the build unless a condition the compiler can work out is true. (There is also `const_assert_eq!(a, b)` for two equal constants.) If the checks pass, they produce no code at all.

Modern Rust can do the second kind with no crate: `const _: () = assert!(condition, "message");` forces the compiler to evaluate the `assert!` while compiling, and lets you write your own message. The crate is still common because `assert_eq_size!` and its friends read clearly and work on older compilers.

::: example A padding surprise caught at compile time
Add `health: u8` after `flags` in `Frame`, and set `QUEUE_DEPTH` to 60. The build stops with these real messages (trimmed):

```text
error[E0512]: cannot transmute between types of different sizes, or dependently-sized types
  --> src/main.rs:15:1
   |
15 | assert_eq_size!(Frame, [u8; FRAME_BYTES]);
   | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
   |
   = note: source type: `Frame` (160 bits)
   = note: target type: `[u8; 16]` (128 bits)

error[E0080]: attempt to compute `0_usize - 1_usize`, which would overflow
  --> src/main.rs:17:1
   |
17 | const_assert!(QUEUE_DEPTH.is_power_of_two());
```

The second message is odd-looking, because the macro makes a false condition into an impossible subtraction; what matters is that it names the line. The built-in form is friendlier:

```text
error[E0080]: evaluation panicked: QUEUE_DEPTH must be a power of two
```

Now the first message. The frame grew from 128 bits to 160 bits, that is from 16 bytes to 20 bytes, though only one byte was added. Why four more?

Count it out. `seq` and `flags` take $2 + 2 = 4$ bytes. `health` is the fifth byte. The array of `i32` must start at an address that is a multiple of 4, so the compiler inserts three empty [[padding bytes|padding]] after `health`, bringing the offset to 8. The array adds $3 \times 4 = 12$ bytes, and $8 + 12 = 20$. Without the assertion, those three invisible bytes would have gone out over the radio in every frame.
:::

::: key What each tool is for
`critical-section`: one API, `critical_section::with(|cs| ...)`, for short exclusive access to data shared with interrupts; `Mutex<RefCell<T>>` needs the `cs` token; the final application picks the implementation (on single-core Cortex-M, disable interrupts). `static_assertions`: `const_assert!`, `const_assert_eq!` and `assert_eq_size!` turn facts about constants, sizes and layouts into build failures, at zero run-time cost.
:::

## Check yourself

::: check
Your firmware has `defmt::debug!("filter reset")` in it, but when you run it with probe-rs the message never appears, though `defmt::error!` messages do. You have not set anything special. What is going on, and how do you fix it?
:::

::: answer
defmt decides which levels to compile in from the `DEFMT_LOG` environment variable, and when it is not set, only `error` level is kept. The `debug!` line was removed completely when the code compiled. Set `DEFMT_LOG=debug` (for example in the `[env]` table of `.cargo/config.toml`) and rebuild. Levels you leave out cost nothing, which is why the default is so strict.
:::

::: check
Explain in two or three sentences why a defmt build can be much smaller in flash than the same program using `rprintln!`, even though both send their output over RTT.
:::

::: answer
With `rprintln!` the chip formats the text itself, so it needs Rust's formatting code (including the large float-printing routines) and every format string in flash. With defmt the format strings stay in the ELF file on the laptop and are never flashed; the chip sends only an index and the raw argument bytes, and the laptop does the formatting. In the measured example that took flash from 32784 bytes to 8196 bytes.
:::

::: check
You declare `let mut q: heapless::spsc::Queue<u8, 16> = Queue::new();` to buffer bytes from a UART interrupt. How many bytes can it hold, and what does `enqueue` return when it is full?
:::

::: answer
It holds $16 - 1 = 15$ bytes, because one slot always stays empty so the queue can tell full from empty. When it is full, `enqueue(b)` returns `Err(b)`, handing the byte back to the caller instead of storing it or panicking. The interrupt handler must decide what to do with it, for example count it as a dropped byte.
:::

::: check
A driver crate calls `critical_section::with`. You build your application for a single-core Cortex-M but forget to turn on any implementation. Who is supposed to provide the implementation, and why is the choice left to that crate rather than to the driver?
:::

::: answer
The final application is. It is the only crate that knows the whole system: whether the chip has one core or several, and whether an RTOS is running. On a single-core Cortex-M it turns on `cortex-m`'s `critical-section-single-core` feature, which disables and restores interrupts. If the driver chose, it would force one implementation on every chip it runs on, and two drivers could choose two different ones. Without any implementation the program cannot link, so the mistake is caught at build time.
:::

::: check
A message struct is `#[repr(C)] struct Cmd { id: u8, value: f32 }`. How many bytes is it, and what one-line check would catch someone assuming it is 5?
:::

::: answer
`id` takes byte 0. An `f32` must start at a multiple of 4, so three padding bytes follow and `value` sits in bytes 4 to 7. The size is $4 + 4 = 8$ bytes. The line `assert_eq_size!(Cmd, [u8; 8]);` (from `static_assertions`) documents that and fails the build if the layout ever changes; `const _: () = assert!(core::mem::size_of::<Cmd>() == 8);` does the same without the crate.
:::

## Summary

| Tool | What it is | The fact to remember |
|---|---|---|
| Debug probe | USB-to-SWD adapter | Flashes, halts, and reads RAM while the chip runs |
| probe-rs | Rust toolkit for probes | `probe-rs run --chip ...` as cargo's runner |
| cargo-embed | Front end configured by `Embed.toml` | Build, flash, RTT terminal, optional gdb server |
| RTT / rtt-target | Ring buffers in RAM read by the probe | `rtt_init_print!()` then `rprintln!`; formats on the chip |
| defmt | Deferred formatting | Index plus argument bytes; strings stay in the ELF; `DEFMT_LOG` picks levels |
| `heapless::Vec<T, N>`, `String<N>` | Inline, fixed-capacity collections | `push` returns `Err` when full |
| `spsc::Queue<T, N>` | Lock-free single producer, single consumer queue | Holds `N - 1`; `split()` gives `Producer` and `Consumer` |
| `critical_section::with` | Short exclusive access | `Mutex<RefCell<T>>` needs the `cs` token; the app picks the implementation |
| `static_assertions` | Compile-time checks | `const_assert!`, `assert_eq_size!`; zero run-time cost |

You can now build, flash, see and store things on a chip without a heap. The next lesson steps sideways into the biggest practical question for a flight team with years of C and C++: how Rust code and C code call each other, in both directions.

::: context debug-probe The little box between laptop and board
A debug probe is a tiny computer whose only job is to translate between USB on your laptop and the debug pins on the target chip. Every Cortex-M core contains a debug unit that can halt the processor, set breakpoints and reach the memory bus, and SWD needs only a clock wire and a data wire (plus ground) to reach it. That is why a probe can read a variable while your control loop keeps running.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="35" width="80" height="50" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="50" y="64" font-size="12" text-anchor="middle" fill="#1f2a44">laptop</text>
  <line x1="90" y1="60" x2="140" y2="60" stroke="#1d6fd1" stroke-width="2"/>
  <text x="115" y="52" font-size="11" text-anchor="middle" fill="#1d6fd1">USB</text>
  <rect x="140" y="40" width="70" height="40" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="175" y="64" font-size="12" text-anchor="middle" fill="#1f2a44">probe</text>
  <line x1="210" y1="52" x2="260" y2="52" stroke="#b4232c" stroke-width="2"/>
  <line x1="210" y1="68" x2="260" y2="68" stroke="#b4232c" stroke-width="2"/>
  <text x="235" y="44" font-size="11" text-anchor="middle" fill="#b4232c">SWDIO</text>
  <text x="235" y="84" font-size="11" text-anchor="middle" fill="#b4232c">SWCLK</text>
  <rect x="260" y="25" width="90" height="70" rx="4" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="305" y="55" font-size="12" text-anchor="middle" fill="#1f2a44">Cortex-M</text>
  <text x="305" y="72" font-size="11" text-anchor="middle" fill="#1f2a44">flash + RAM</text>
  <text x="180" y="112" font-size="11" text-anchor="middle" fill="#6c7a93">flash, halt, read RAM while running</text>
</svg>
```
:::

::: context rtt-control-block How the laptop finds the mailbox
The RTT control block starts with a fixed text marker, `SEGGER RTT`. The laptop side scans the chip's RAM for that marker (or reads its address from the ELF), and then knows where every buffer is. Each buffer is a ring with a write position moved only by the chip and a read position moved only by the laptop. The chip never waits for the laptop unless you choose a blocking mode; if the laptop falls behind, the default mode skips the message rather than stalling the firmware.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="20" y="20" font-size="12" fill="#1f2a44">RAM on the chip</text>
  <rect x="20" y="30" width="100" height="70" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="70" y="50" font-size="11" text-anchor="middle" fill="#1f2a44">"SEGGER RTT"</text>
  <text x="70" y="68" font-size="11" text-anchor="middle" fill="#1f2a44">buffer address</text>
  <text x="70" y="86" font-size="11" text-anchor="middle" fill="#1f2a44">read, write pos</text>
  <line x1="120" y1="65" x2="150" y2="65" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#1f2a44" stroke-width="1">
    <rect x="150" y="50" width="25" height="30" fill="#fff"/>
    <rect x="175" y="50" width="25" height="30" fill="#8fb8f0"/>
    <rect x="200" y="50" width="25" height="30" fill="#8fb8f0"/>
    <rect x="225" y="50" width="25" height="30" fill="#8fb8f0"/>
    <rect x="250" y="50" width="25" height="30" fill="#fff"/>
    <rect x="275" y="50" width="25" height="30" fill="#fff"/>
  </g>
  <text x="187" y="100" font-size="11" text-anchor="middle" fill="#1d6fd1">read</text>
  <line x1="187" y1="88" x2="187" y2="82" stroke="#1d6fd1" stroke-width="2"/>
  <text x="262" y="100" font-size="11" text-anchor="middle" fill="#b4232c">write</text>
  <line x1="262" y1="88" x2="262" y2="82" stroke="#b4232c" stroke-width="2"/>
  <text x="225" y="120" font-size="11" text-anchor="middle" fill="#6c7a93">blue: bytes waiting for the probe</text>
</svg>
```
:::

::: context defmt-name Why "deferred"
To defer something is to put it off until later. defmt defers the expensive part of logging, turning numbers into characters, from the moment the chip logs the message to the moment the laptop displays it. The same idea appears in other embedded logging systems: store a short identifier, keep the dictionary on the ground. Spacecraft telemetry works this way too. A packet carries raw counts and an identifier, and the ground system's database turns them into named, scaled engineering values.
:::

::: context elf-file What the ELF holds that the chip never sees
ELF, the Executable and Linkable Format, is the file format the linker writes on Linux and on most embedded targets. Its sections include the bytes destined for flash (`.vector_table`, `.text`, `.rodata`, the start values of `.data`), but also a symbol table and debug information that map addresses back to function names, source lines and variable types. Flashing tools copy only the loadable sections. So the ELF on your laptop can hold far more than the chip does, and defmt's `.defmt` section, placed at address 0 and never loaded, is one of those extras.
:::

::: context log-levels Choosing what to hear
The five levels run from the chattiest to the most serious: `trace` for step-by-step detail, `debug` for developer information, `info` for normal milestones like "boot complete", `warn` for something odd but survivable, and `error` for a real fault. `DEFMT_LOG` can also be set per module, for example `DEFMT_LOG=info,my_app::imu=trace`, to turn up the detail on the one driver you are chasing without flooding the link with everything else.
:::

::: context one-empty-slot Why one slot stays empty
The queue keeps two positions: `head`, where the next item will be read, and `tail`, where the next item will be written. Empty means `head == tail`. If you let the writer fill every slot, it would wrap around until `tail` landed on `head` again, and "full" would look exactly like "empty". Keeping one slot free means full is "tail is one step behind head", which is different.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <text x="90" y="18" font-size="12" text-anchor="middle" fill="#1f2a44">empty: head = tail</text>
  <g stroke="#1f2a44" stroke-width="1.2">
    <rect x="30" y="30" width="30" height="30" fill="#fff"/>
    <rect x="60" y="30" width="30" height="30" fill="#fff"/>
    <rect x="90" y="30" width="30" height="30" fill="#fff"/>
    <rect x="120" y="30" width="30" height="30" fill="#fff"/>
  </g>
  <text x="45" y="80" font-size="11" text-anchor="middle" fill="#1d6fd1">h,t</text>
  <text x="270" y="18" font-size="12" text-anchor="middle" fill="#1f2a44">full: 3 of 4 used</text>
  <g stroke="#1f2a44" stroke-width="1.2">
    <rect x="210" y="30" width="30" height="30" fill="#8fb8f0"/>
    <rect x="240" y="30" width="30" height="30" fill="#8fb8f0"/>
    <rect x="270" y="30" width="30" height="30" fill="#8fb8f0"/>
    <rect x="300" y="30" width="30" height="30" fill="#fff"/>
  </g>
  <text x="225" y="80" font-size="11" text-anchor="middle" fill="#1d6fd1">head</text>
  <text x="315" y="80" font-size="11" text-anchor="middle" fill="#b4232c">tail</text>
  <text x="180" y="108" font-size="11" text-anchor="middle" fill="#6c7a93">Queue&lt;T, 4&gt;: one step more would make tail = head</text>
</svg>
```
:::

::: context interrupt What an interrupt is
Imagine reading a book when the doorbell rings. You put a finger on your page, answer the door, then carry on from the same word. An interrupt is the processor's doorbell. A peripheral raises a signal, the core saves where it was, jumps to the handler listed for that interrupt in the vector table from lesson 01, and returns to exactly where it left off. Handlers should be short, because while one runs, lower-priority work is waiting.
:::

::: context cs-token A zero-byte permission slip
`CriticalSection` is a type with no data in it, so passing it around costs nothing at run time. Its only job is to prove, to the compiler, that you are inside a critical section: you can only get one from `critical_section::with`, and its lifetime ends when the closure returns. This "token" pattern turns a rule that used to live in a comment ("only touch this with interrupts off") into a rule the borrow checker enforces. RTIC, from lesson 03, uses a similar compile-time idea for its shared resources.
:::

::: context padding The empty bytes between fields
Processors read memory fastest, and on some chips only correctly, when a 4-byte value starts at an address divisible by 4. So compilers add unused padding bytes to line fields up. With `#[repr(C)]` Rust follows C's rules exactly: fields in the order you wrote them, each placed at the next multiple of its alignment.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 100" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1">
    <rect x="20" y="30" width="30" height="30" fill="#8fb8f0"/>
    <rect x="50" y="30" width="30" height="30" fill="#8fb8f0"/>
    <rect x="80" y="30" width="15" height="30" fill="#f2b880"/>
    <rect x="95" y="30" width="45" height="30" fill="#fff"/>
    <rect x="140" y="30" width="60" height="30" fill="#8fb8f0"/>
    <rect x="200" y="30" width="60" height="30" fill="#8fb8f0"/>
    <rect x="260" y="30" width="60" height="30" fill="#8fb8f0"/>
  </g>
  <text x="35" y="50" font-size="11" text-anchor="middle" fill="#1f2a44">seq</text>
  <text x="65" y="50" font-size="11" text-anchor="middle" fill="#1f2a44">flags</text>
  <text x="117" y="50" font-size="11" text-anchor="middle" fill="#6c7a93">pad</text>
  <text x="230" y="50" font-size="11" text-anchor="middle" fill="#1f2a44">rate_mdps</text>
  <text x="87" y="22" font-size="11" text-anchor="middle" fill="#1f2a44">health</text>
  <text x="20" y="78" font-size="11" fill="#1f2a44">0</text>
  <text x="136" y="78" font-size="11" fill="#1f2a44">8</text>
  <text x="310" y="78" font-size="11" fill="#1f2a44">20</text>
  <text x="180" y="95" font-size="11" text-anchor="middle" fill="#6c7a93">byte offsets: 2 + 2 + 1 + 3 padding + 12 = 20</text>
</svg>
```
:::
