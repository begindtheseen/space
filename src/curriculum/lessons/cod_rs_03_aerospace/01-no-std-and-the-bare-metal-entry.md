---
id: l01-no-std-and-the-bare-metal-entry
title: 'no_std, no_main and how a microcontroller starts'
minutes: 24
covers:
  - 'no_std and no_main; core versus alloc versus std'
  - 'Panic handlers; cortex-m and cortex-m-rt; the entry attribute, vector tables, memory.x'
---

Think about the difference between staying in a hotel and camping. In a hotel, a lot happens without you. Someone turns on the lights, the water is hot, the front desk takes messages, and if something breaks you call down and it gets fixed. On a campsite there is nobody. You bring the tent, you light the stove, you decide where the water comes from. You can still cook a very good dinner. You cannot call room service.

Every Rust program you have written so far lived in the hotel. The hotel is the **operating system** — Linux, macOS or Windows, the program that runs underneath yours and hands it memory, files, a screen and a clock. Rust's **standard library**, `std`, is the front desk: `Vec`, `String`, `println!`, files and threads all quietly ask the operating system for help.

A small computer on a spacecraft is usually a campsite. A reaction-wheel controller, a sun-sensor board or a power-distribution board often runs on a **microcontroller** — a whole computer on one chip, with its own processor, flash memory and a little RAM, and no operating system at all. Your program is the only thing on it. This lesson shows what you give up, what you keep, and what happens between power-on and the first line of your `main`. The examples target the **[[Arm Cortex-M|cortex-m-family]]** family of processors, the most common microcontroller core in the world and the one the ESA-funded Rust work in lesson 10 uses.

Everything here was built with Rust 1.94.1, `cortex-m` 0.7.9 and `cortex-m-rt` 0.7.7, and every error message is copied from a real build.

## Three layers: core, alloc and std

Rust's standard library is really three libraries stacked on top of each other. Picture a three-story building.

- **`core`** is the ground floor. It is the language itself: integers and floats, `Option` and `Result`, slices and `str`, iterators, traits like `Clone` and `Iterator`, `core::fmt` for formatting, and atomic integers. None of it needs an operating system or a heap. It works on any chip Rust can compile for.
- **`alloc`** is the second floor. It holds the types that need a **heap** — a pool of memory you can ask for at run time: `Box`, `Vec`, `String`, `Rc`, `Arc`, `BTreeMap`. It does not need an operating system, but it does need an **allocator**, some code that hands out and takes back pieces of the heap.
- **`std`** is the top floor. It re-exports everything in `core` and `alloc` and adds what only an operating system can provide: files (`std::fs`), threads (`std::thread`), networking (`std::net`), the wall clock, environment variables, `println!` to a terminal, and `HashMap` (which asks the operating system for random numbers to seed its hashing).

When you write `#![no_std]` at the top of a crate you move out of the top floor. You keep the ground floor for free. You can move back into the second floor if you bring an allocator. The top floor is gone.

::: key What no_std takes away
You lose everything requiring an OS or an allocator: std collections, files, threads, networking, and the default panic handler. core remains for language fundamentals, alloc can be opted into with an allocator, and heapless provides fixed-capacity collections.
:::

Notice what you do *not* lose. Pattern matching, traits, generics, closures, iterators and the borrow checker are all part of the language, so they all live in `core`. The ownership rules from the last module work the same on a chip with 128 KiB of RAM as on a laptop, and they cost nothing at run time.

What replaces `Vec` and `String` without a heap? The `heapless` crate gives you versions whose maximum size is fixed when you compile. Lesson 04 covers it.

## Turning std off with #![no_std]

The line that moves out of the hotel is a crate-level **attribute** — an instruction to the compiler written with `#!`, read "hash bang", at the very top of `lib.rs` or `main.rs`:

```rust
#![no_std]
```

After that line, the compiler links your crate against `core` instead of `std`, and the automatic imports (the "prelude") come from `core` too. Anything that names `std` stops compiling. This is the real message when a `no_std` program tries `std::vec::Vec`:

```text
error[E0433]: failed to resolve: use of unresolved module or unlinked crate `std`
 --> src/main.rs:8:13
  |
8 |     let v = std::vec::Vec::<u8>::new();
  |             ^^^ use of unresolved module or unlinked crate `std`
```

A plain library doing arithmetic on fixed-size arrays, like a filter, is the gentlest way in: it needs no `main` and no panic handler.

::: example A no_std filter, tested on the laptop and built for the chip
Here is a moving average over the last `N` gyro readings. It uses a fixed array, so it never touches a heap. `const N: usize` is a **const generic**: the array length is part of the type and is known when the code compiles.

```rust
#![no_std]

/// Average of the last N gyro samples, kept in a fixed array.
/// No heap, no operating system: only `core` is used.
pub struct MovingAverage<const N: usize> {
    buf: [f32; N],
    next: usize,
    filled: usize,
}

impl<const N: usize> MovingAverage<N> {
    pub const fn new() -> Self {
        MovingAverage { buf: [0.0; N], next: 0, filled: 0 }
    }

    pub fn push(&mut self, x: f32) -> f32 {
        self.buf[self.next] = x;
        self.next = (self.next + 1) % N;
        if self.filled < N {
            self.filled += 1;
        }
        let sum: f32 = self.buf[..self.filled].iter().sum();
        sum / self.filled as f32
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn averages_the_last_four() {
        let mut avg: MovingAverage<4> = MovingAverage::new();
        let mut out = 0.0;
        for x in [0.10, 0.20, 0.30, 0.40, 0.90] {
            out = avg.push(x);
        }
        // last four samples: 0.20, 0.30, 0.40, 0.90
        assert!((out - 0.45).abs() < 1e-6);
    }
}
```

Work the test by hand. The buffer holds four values. After the fifth push, the oldest value, $0.10$, has been overwritten by $0.90$, so the four left are $0.20, 0.30, 0.40, 0.90$. Their sum is $1.80$, and $1.80 / 4 = 0.45$ rad/s. The test agrees.

The *same file* runs in two worlds.

```bash
cargo test                                        # on the laptop
cargo build --release --target thumbv7em-none-eabihf   # for a Cortex-M4F or M7
```

```text
test tests::averages_the_last_four ... ok
test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
```

and the second command finishes with no errors and leaves `libsmooth.rlib` in `target/thumbv7em-none-eabihf/release/`. The tests may use `std` because `#[cfg(test)]` compiles them only for the laptop. The name `thumbv7em-none-eabihf` is a **[[target triple|target-triple]]**, the compiler's name for "which chip, which operating system, which calling rules". You add it once with `rustup target add thumbv7em-none-eabihf`.
:::

::: warning Some float methods live in std, not core
On the laptop you write `x.sqrt()` without thinking. In a `no_std` crate on this toolchain, you get:

```text
error[E0599]: no method named `sqrt` found for type `f32` in the current scope
```

Square root, sine and cosine on floats are provided by the operating system's maths library, so `std` has them and `core` does not. On a microcontroller you use the `libm` crate (`libm::sqrtf(x)`), which is pure Rust. Lesson 07 comes back to [[libm and micromath|libm-bridge]].
:::

## Why a program also needs #![no_main]

On a laptop, your `main` is not the first code that runs. The operating system starts the program, a small piece of `std` code sets up things like the command-line arguments, and then it calls your `main`. When `main` returns, an exit code goes back to the operating system.

On a microcontroller there is nobody to call `main` and nobody to return to. So a bare-metal *program* (not a library) adds a second attribute:

```rust
#![no_std]
#![no_main]
```

`#![no_main]` tells the compiler: "do not generate the usual start-up code that calls `main`; I will say where the program begins myself". Something else must then provide the true starting point. On Cortex-M chips that something is the **cortex-m-rt** crate, short for "Cortex-M runtime".

## The panic handler you must write

When Rust code **panics** — an index past the end of an array, an `unwrap` on `None`, an integer overflow in a debug build — it calls a **panic handler**. With `std`, the handler prints the message to the terminal and ends the program. Without `std` there is no terminal and no "ending the program", so the compiler insists that you provide one. Leave it out and the build stops:

```text
error: `#[panic_handler]` function required, but not found
```

The handler is a function marked `#[panic_handler]` that takes a `&PanicInfo` (information about where the panic happened) and never returns:

```rust
use core::panic::PanicInfo;

#[panic_handler]
fn panic(_info: &PanicInfo) -> ! {
    loop {
        cortex_m::asm::bkpt(); // stop here if a debugger is attached
    }
}
```

The return type `!` is read "never". It is the **[[never type|never-type]]**: a function returning `!` promises it will not come back. A panic handler cannot return, because the code that panicked has nowhere sensible to continue.

You need exactly one panic handler in the finished program, and you can pull one in from a crate. `panic-halt` loops forever. `panic-probe`, which you will meet with `defmt` in lesson 04, sends the panic message to your laptop over the debug cable. The line `use panic_halt as _;` links the crate in without giving it a name you will use.

::: key The panic handler contract
In a no_std binary you must provide exactly one `#[panic_handler]` with signature `fn(&PanicInfo) -> !`. On Cortex-M targets the panic strategy is abort: there is no unwinding, so `Drop` code does not run on the way out.
:::

::: warning Halting forever is not a flight design
`panic-halt` is fine on the desk. On a vehicle, a frozen processor can be worse than one that restarts. Flight designs usually let a **[[watchdog timer|watchdog-safe-mode]]** reset the chip, record why, and come back up in a safe mode. Choose the panic behavior on purpose.
:::

## cortex-m-rt and the entry attribute

The **cortex-m** crate gives you safe access to the parts every Cortex-M core has: special instructions like `nop` and `bkpt`, the system timer, and the interrupt controller. The **cortex-m-rt** crate gives you the start-up code. Its most visible piece is the `#[entry]` attribute, which marks the function your program starts in:

```rust
#![no_std]
#![no_main]

use core::panic::PanicInfo;
use core::sync::atomic::{AtomicU32, Ordering};
use cortex_m_rt::entry;

static TICKS: AtomicU32 = AtomicU32::new(0);

#[entry]
fn main() -> ! {
    loop {
        TICKS.fetch_add(1, Ordering::Relaxed);
        cortex_m::asm::nop();
    }
}

#[panic_handler]
fn panic(_info: &PanicInfo) -> ! {
    loop {
        cortex_m::asm::bkpt();
    }
}
```

The entry function must also be `-> !`: a microcontroller program runs until the power goes off, so it ends in a `loop` that never exits. Write `fn main()` and the attribute rejects it:

```text
error: `#[entry]` function must have signature `[unsafe] fn() -> !`
```

What happens between power-on and the first line of `main`? Here is the whole story, in order.

1. The chip comes out of reset. The processor hardware, not any software, reads the first two 4-byte words at the start of flash.
2. It loads the first word into the **stack pointer**, the register that says where the stack starts.
3. It jumps to the address in the second word. That address is the **reset handler**, a function called `Reset` that cortex-m-rt provides.
4. `Reset` fills the `.bss` section with zeros and copies the starting values of the `.data` section from flash into RAM. These are the [[static variables|bss-and-data]], and Rust promises they hold their initial values before any of your code runs. On a hard-float chip, `Reset` also switches the floating-point unit on.
5. `Reset` calls the function you marked `#[entry]`.

The table of addresses that step 1 reads is the next idea.

## The vector table

Picture the emergency phone list taped inside a school's front door: where to gather, who to call first, the number for a fire, the number for a flood. The list does not *do* anything. It says where to go when each thing happens.

The **vector table** is that list for the processor. It is an array of 4-byte addresses at the very start of flash. On Cortex-M:

- entry 0 is the initial stack pointer;
- entry 1 is the reset handler;
- entries 2 to 15 are the processor's own **exceptions**, such as NMI, HardFault (a serious fault, like reading an address that does not exist), SVCall, PendSV and SysTick (the system timer); some of these slots are reserved and hold zero;
- from entry 16 on come the chip's **interrupts**, one per peripheral event: a timer rolling over, a byte arriving on a serial port.

cortex-m-rt builds the table for you. Any handler you do not write points at a default that loops. You write a handler for one exception with its `#[exception]` attribute, and a device's peripheral interrupts are listed by the device crate you will meet in the next lesson.

::: example Reading a real vector table byte by byte
The program above was built for an STM32F411, a Cortex-M4F with 512 KiB of flash starting at address `0x08000000` and 128 KiB of RAM starting at `0x20000000`. Dumping the first 16 bytes of its `.vector_table` section with `llvm-objdump -s -j .vector_table` gives:

```text
Contents of section .vector_table:
 8000000 00000220 01040008 77040008 83040008  ... ....w.......
```

Each group of 8 hex digits is one 4-byte word, but written in memory order. Cortex-M is **[[little-endian|little-endian]]**: the lowest byte of a number is stored first. So to read a word, reverse its bytes.

- Word 0 is `00 00 02 20`. Reversed: `0x20020000`. This is the initial stack pointer.
- Word 1 is `01 04 00 08`. Reversed: `0x08000401`. This is the reset vector.

Check word 0. RAM starts at `0x20000000`, and 128 KiB is $128 \times 1024 = 131{,}072$ bytes, which is `0x20000` in hex. The end of RAM is $\mathtt{0x20000000} + \mathtt{0x20000} = \mathtt{0x20020000}$. The stack starts at the very top of RAM, as it should, because the Cortex-M stack grows *downward*.

Check word 1. The symbol table (`llvm-nm -n`) lists `08000400 T Reset`. The vector says `0x08000401`, one more. That extra 1 is the **[[Thumb bit|thumb-bit]]**: the lowest bit of a jump address tells the processor to run in Thumb mode, the only mode a Cortex-M has. So the table points at `Reset`, exactly as the start-up story said.

Word 2, `0x08000477`, is NMI: `DefaultHandler` sits at `0x08000476`, so the unused exception points at the default loop, Thumb bit set.
:::

::: note Why the table is 1024 bytes here
The build's section list reports `.vector_table 1024`. With no device crate, cortex-m-rt reserves the 16 core entries plus 240 interrupt slots, the most any Cortex-M can have: $16 + 240 = 256$ entries, and $256 \times 4 = 1024$ bytes. A device crate shrinks the table to the chip's real interrupt count. For the STM32F411 build in the next lesson it is 408 bytes, which is $408 / 4 = 102$ entries: 16 core entries and 86 device interrupt slots.
:::

## memory.x: telling the linker where things go

The **[[linker|linker-script]]** is the program that glues compiled pieces together and decides the address of every function and variable. On a microcontroller you must tell it where the flash and RAM are on this particular chip.

You do that with a small file named `memory.x` in the root of your project:

```text
MEMORY
{
  /* STM32F411: 512 KiB of flash, 128 KiB of RAM */
  FLASH : ORIGIN = 0x08000000, LENGTH = 512K
  RAM   : ORIGIN = 0x20000000, LENGTH = 128K
}
```

`ORIGIN` is the starting address and `LENGTH` the size, both from the chip's datasheet. cortex-m-rt supplies the full linker script, `link.x`, which pulls in your `memory.x` and places the vector table first in `FLASH`, then the code, then the constants, with `.data` and `.bss` in `RAM`. You turn it on, and pick the default target, in `.cargo/config.toml`:

```toml
[build]
target = "thumbv7em-none-eabihf"

[target.thumbv7em-none-eabihf]
rustflags = ["-C", "link-arg=-Tlink.x"]
```

and the project's `Cargo.toml` lists `cortex-m = "0.7"` and `cortex-m-rt = "0.7"` under `[dependencies]`. After that, plain `cargo build --release` builds for the chip.

::: key The bare-metal checklist
`#![no_std]` drops std; `#![no_main]` drops the OS start-up; cortex-m-rt's `Reset` handler initialises `.bss` and `.data` and calls the `#[entry] fn main() -> !`; the vector table at the start of flash holds the initial stack pointer, then the reset vector, then exception and interrupt handlers; `memory.x` gives the linker the FLASH and RAM origins and lengths.
:::

::: warning A wrong memory.x builds fine and fails on the bench
The linker believes whatever `memory.x` says. Copy a file from a chip with more RAM and the build succeeds, but the stack pointer lands at an address with no memory behind it. The chip faults before the first line of `main`, and nothing on the board tells you why. Always check `ORIGIN` and `LENGTH` against the datasheet of the exact part number on your board.
:::

## Measuring what you built

On a microcontroller, flash and RAM are counted in kilobytes, so you read the section sizes after every build. The `size -A` command from binutils lists them:

```text
section           size        addr
.vector_table     1024   134217728
.text              136   134218752
.rodata              0   134218888
.data                0   536870912
.bss                 4   536870912
```

(The addresses are printed in decimal: `134217728` is `0x08000000`, the start of flash, and `536870912` is `0x20000000`, the start of RAM.)

::: example How full is the chip?
Flash holds the vector table, the code and the constants, plus the starting values for `.data`:

$$
1024 + 136 + 0 + 0 = 1160 \text{ bytes of flash}.
$$

The chip has $512 \times 1024 = 524{,}288$ bytes of flash, so this program uses $1160 / 524{,}288 \approx 0.22\%$ of it.

RAM holds `.data` and `.bss`: $0 + 4 = 4$ bytes. Those 4 bytes are the `TICKS` counter, an `AtomicU32` of 32 bits. It is in `.bss` because it starts at zero, and zero-valued statics need no copy in flash. The rest of RAM is left for the stack. The numbers match the program exactly, which is how you know they are telling the truth.
:::

These are the same numbers the first exercise of this module asks you to report for your attitude-propagation library.

## Asking for a heap anyway

You can opt back into the second floor with `extern crate alloc;`, which makes `alloc::vec::Vec` available. But then someone has to hand out heap memory, and the build says so if nobody does:

```text
error: no global memory allocator found but one is required; link to std or add `#[global_allocator]` to a static item that implements the GlobalAlloc trait
```

Crates such as `embedded-alloc` provide an allocator over a fixed block of RAM. Most flight software avoids a heap after start-up, because running out of heap mid-mission is a failure you cannot test away. That makes this error useful: give the final program *no* allocator, and any code that quietly needs a heap refuses to link. "This filter does not allocate" stops being a promise in a code review and becomes a check the machine does. Lesson 06 leans on exactly this with nalgebra.

## Check yourself

::: check
Your colleague writes a `#![no_std]` library that uses `Option`, a `match`, an iterator with `.map()` and `.sum()`, and the `?` operator. Will it compile without an allocator? Which layer does each feature come from?
:::

::: answer
Yes. All four are part of the language and live in `core`; none needs a heap or an operating system. It would need `alloc` only to build a `Vec`, `String` or `Box`, and `std` only for files, threads, networking or `HashMap`.
:::

::: check
Why does a bare-metal binary need `#![no_main]` when a `#![no_std]` library does not?
:::

::: answer
`#![no_main]` is about how a *program* starts: normally `std` start-up code runs first and calls `main`, and on a microcontroller that code cannot exist. A library has no start-up at all; the program that links it provides one. So only the final binary says `#![no_main]`, and cortex-m-rt's `Reset` handler becomes its real starting point.
:::

::: check
A chip has 64 KiB of RAM starting at `0x20000000`. What should word 0 of its vector table be, and how would those four bytes appear in an `objdump` of flash?
:::

::: answer
64 KiB is $64 \times 1024 = 65{,}536$ bytes, which is `0x10000`. The top of RAM is $\mathtt{0x20000000} + \mathtt{0x10000} = \mathtt{0x20010000}$, and the stack starts there because it grows downward. In little-endian memory order, the lowest byte comes first, so the dump shows `00000120`: the bytes `00 00 01 20`.
:::

::: check
A vector-table entry reads `0x08000401` and the symbol table says `Reset` is at `0x08000400`. Is the table wrong?
:::

::: answer
No. The lowest bit of an address loaded into the program counter selects Thumb mode, and Cortex-M only runs Thumb code, so every handler address in the table has that bit set. `0x08000401` means "jump to `0x08000400` in Thumb mode", which is exactly `Reset`.
:::

::: check
A teammate says: "Our flight board uses `panic-halt`, so a panic stops everything cleanly and safely." What would you say?
:::

::: answer
Stopping is not the same as safe. With `panic-halt` the processor spins forever: no commands, no sensor reads, no messages to the rest of the vehicle. For flight you want the handler to record what happened and let a watchdog reset the chip into a known safe mode. And because the panic strategy is abort, no `Drop` code runs on the way out, so any hardware that must be made safe has to be handled by the handler or by the restart.
:::

## Summary

| Idea | Meaning | Where you see it |
|---|---|---|
| `core` | Language fundamentals, no heap, no OS | `Option`, iterators, slices, atomics |
| `alloc` | Heap types; needs a `#[global_allocator]` | `Box`, `Vec`, `String`, `Rc`, `Arc` |
| `std` | `core` + `alloc` + OS services | files, threads, networking, `HashMap`, `println!` |
| `#![no_std]` | Link `core` instead of `std` | top of `lib.rs` or `main.rs` |
| `#![no_main]` | No OS start-up code; you name the entry | bare-metal binaries only |
| `#[panic_handler]` | `fn(&PanicInfo) -> !`, exactly one per binary | `panic-halt`, `panic-probe`, or your own |
| `#[entry]` | cortex-m-rt's start function, `fn() -> !` | called by `Reset` after `.bss`/`.data` set-up |
| Vector table | Word 0 stack pointer, word 1 reset vector, then handlers | start of flash, `0x08000000` on STM32 |
| `memory.x` | FLASH and RAM `ORIGIN` and `LENGTH` for the linker | project root, used by `link.x` |

You now have a program that starts, runs and stops safely, but it cannot touch anything outside the processor yet. The next lesson reaches out to the chip's pins and buses through peripheral access crates, HAL crates and the embedded-hal traits that let one sensor driver work on every chip.

::: context cortex-m-family A family of small processors
Arm designs processor cores and licenses them to chip makers such as ST, NXP, Nordic, Microchip and Raspberry Pi, who add memory and peripherals around them. The **Cortex-M** family is Arm's line for microcontrollers. The Cortex-M0 and M0+ are the smallest; the M3 adds more instructions; the M4 adds signal-processing instructions and, in its M4F form, single-precision floating point; the M7 is the fastest classic member. Microchip's SAMV71, a Cortex-M7 part, also comes in a radiation-tolerant version for space, and it is the board the ESA Rust operating-system activity in lesson 10 targets.
:::

::: context target-triple Reading a target name
A target triple names the machine the code will run on, in pieces separated by dashes. Read `thumbv7em-none-eabihf` like this:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="14" width="120" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="70" y="34" font-size="13" text-anchor="middle" fill="#1f2a44">thumbv7em</text>
  <rect x="130" y="14" width="70" height="30" fill="#fff" stroke="#1f2a44"/>
  <text x="165" y="34" font-size="13" text-anchor="middle" fill="#1f2a44">none</text>
  <rect x="200" y="14" width="80" height="30" fill="#f2b880" stroke="#1f2a44"/>
  <text x="240" y="34" font-size="13" text-anchor="middle" fill="#1f2a44">eabihf</text>
  <text x="70" y="66" font-size="11" text-anchor="middle" fill="#1f2a44">instruction set:</text>
  <text x="70" y="81" font-size="11" text-anchor="middle" fill="#1f2a44">Thumb, Armv7E-M</text>
  <text x="70" y="96" font-size="11" text-anchor="middle" fill="#6c7a93">(Cortex-M4, M7)</text>
  <text x="165" y="66" font-size="11" text-anchor="middle" fill="#1f2a44">no operating</text>
  <text x="165" y="81" font-size="11" text-anchor="middle" fill="#1f2a44">system</text>
  <text x="240" y="66" font-size="11" text-anchor="middle" fill="#1f2a44">calling rules,</text>
  <text x="240" y="81" font-size="11" text-anchor="middle" fill="#1f2a44">hard float</text>
  <text x="180" y="118" font-size="11" text-anchor="middle" fill="#6c7a93">laptop: x86_64-unknown-linux-gnu</text>
</svg>
```

Other Cortex-M targets are `thumbv6m-none-eabi` (M0, M0+), `thumbv7m-none-eabi` (M3) and `thumbv7em-none-eabi` (M4 or M7 without using the float unit). "hf" means floats are passed in floating-point registers.
:::

::: context libm-bridge Where the maths functions went
On a desktop, `sqrt`, `sin` and `atan2` come from the C maths library that ships with the operating system, and `std` forwards to it. A bare chip has no such library, so `core` leaves them out. The `libm` crate is a pure-Rust port of a well-known C maths library and works anywhere. `micromath` trades some accuracy for speed and size. Lesson 07 compares them, since an attitude filter on a microcontroller calls these functions thousands of times a second.
:::

::: context never-type A type with no values
Most types have values: `bool` has two, `u8` has 256. The never type `!` has none at all. A function that returns `!` can therefore never actually return, because it would have to hand back a value that does not exist. It can only loop forever, stop the processor, or reset. That is exactly the promise a panic handler and a bare-metal `main` must make, and the compiler checks it: a `loop` with no `break` has type `!`, so it satisfies the signature.
:::

::: context watchdog-safe-mode The dog that barks if you stop feeding it
A watchdog timer is a counter, built into most microcontrollers, that counts down on its own clock. Healthy software "feeds" it (resets the count) regularly. If the software hangs, the count reaches zero and the watchdog resets the whole chip. Spacecraft use watchdogs heavily, together with a **safe mode**: a minimal, well-tested configuration that points the solar arrays at the Sun, keeps the radio listening and waits for the ground to diagnose the problem.
:::

::: context bss-and-data Two kinds of starting value
A static variable that starts at zero goes in `.bss`. The start-up code only has to fill that stretch of RAM with zeros, so nothing is stored in flash for it. A static that starts at any other value goes in `.data`. Its starting value must survive power-off, so it is stored in flash, and the start-up code copies it into RAM.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="80" y="16" font-size="12" text-anchor="middle" fill="#1f2a44">FLASH 0x0800_0000</text>
  <rect x="20" y="24" width="120" height="24" fill="#fff" stroke="#1f2a44"/><text x="80" y="40" font-size="11" text-anchor="middle" fill="#1f2a44">.vector_table</text>
  <rect x="20" y="48" width="120" height="24" fill="#fff" stroke="#1f2a44"/><text x="80" y="64" font-size="11" text-anchor="middle" fill="#1f2a44">.text (code)</text>
  <rect x="20" y="72" width="120" height="24" fill="#fff" stroke="#1f2a44"/><text x="80" y="88" font-size="11" text-anchor="middle" fill="#1f2a44">.rodata</text>
  <rect x="20" y="96" width="120" height="24" fill="#f2b880" stroke="#1f2a44"/><text x="80" y="112" font-size="11" text-anchor="middle" fill="#1f2a44">.data start values</text>
  <text x="280" y="16" font-size="12" text-anchor="middle" fill="#1f2a44">RAM 0x2000_0000</text>
  <rect x="220" y="24" width="120" height="24" fill="#f2b880" stroke="#1f2a44"/><text x="280" y="40" font-size="11" text-anchor="middle" fill="#1f2a44">.data</text>
  <rect x="220" y="48" width="120" height="24" fill="#8fb8f0" stroke="#1f2a44"/><text x="280" y="64" font-size="11" text-anchor="middle" fill="#1f2a44">.bss (zeroed)</text>
  <rect x="220" y="72" width="120" height="72" fill="#fff" stroke="#1f2a44"/><text x="280" y="112" font-size="11" text-anchor="middle" fill="#1f2a44">free</text>
  <text x="280" y="138" font-size="11" text-anchor="middle" fill="#6c7a93">stack grows down</text>
  <line x1="140" y1="108" x2="218" y2="36" stroke="#b4232c" stroke-width="2"/>
  <polygon points="218,36 208,38 213,46" fill="#b4232c"/>
  <text x="178" y="92" font-size="11" text-anchor="middle" fill="#b4232c">copy</text>
  <text x="280" y="162" font-size="11" text-anchor="middle" fill="#1f2a44">top: initial SP</text>
</svg>
```
:::

::: context little-endian Which end comes first
Say you must store the number `0x20020000` in four one-byte boxes. A little-endian machine puts the *little* end, the lowest byte `00`, in the first box, and the biggest byte `20` last. A big-endian machine does the opposite. Arm Cortex-M chips are little-endian, and so is your laptop. Many sensors, though, send their readings big-endian over the wire, which is why the next lesson's IMU driver calls `i16::from_be_bytes`. The names come from *Gulliver's Travels*, where two nations go to war over which end of a boiled egg to crack.
:::

::: context thumb-bit Why the odd address
Older Arm processors could run two instruction sets: the full 32-bit "Arm" set and the compact "Thumb" set. The lowest bit of a jump address chose between them, which works because instructions always start at even addresses, so that bit is otherwise unused. Cortex-M processors run only Thumb (with the newer Thumb-2 extension), but they kept the rule. A vector entry with the lowest bit clear would try to switch to Arm mode, which a Cortex-M cannot do, and the chip would fault at once.
:::

::: context linker-script The linker and its map
Compiling turns each crate into an object file full of functions and data with no fixed addresses yet. The linker combines them, discards what nothing uses (that is why the program above is only 136 bytes of code), and assigns every piece an address. A **linker script** is its map. `memory.x` names the regions, and cortex-m-rt's `link.x` lists which sections go in which region and in what order. The `.cargo/config.toml` line `-C link-arg=-Tlink.x` passes that map to the linker, which is `rust-lld` for these targets.
:::
