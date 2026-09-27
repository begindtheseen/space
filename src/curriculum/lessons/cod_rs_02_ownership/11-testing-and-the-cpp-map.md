---
id: l11-testing-and-the-cpp-map
title: Testing, and the map back to C++
minutes: 30
covers:
  - 'Testing: #[test], integration tests, criterion benchmarks, proptest, cargo-fuzz, miri'
  - 'Mapping each concept back to its C++ equivalent'
---

Think about how a new car is checked before anyone drives it home. Each part is tested alone on a bench: does the brake caliper squeeze with the right force? Then the whole car goes around a test track, the way a customer would drive it. Someone times it with a stopwatch. A machine shakes it thousands of times in random ways, looking for the one bump that snaps something. And a technician X-rays the welds, looking for cracks you cannot see from outside, which have not broken anything yet but one day will.

Rust has a tool for each of those jobs. **Unit tests** check one piece from the inside. **Integration tests** drive the whole library from the outside, as a user would. **Benchmarks** are the stopwatch. **Property tests** and **fuzzing** are the shaking machine: they invent inputs you would never think of. And **miri** is the X-ray: it finds undefined behavior in `unsafe` code even when the test passed.

A GNC team needs all six, because each catches a different kind of mistake. This lesson runs each of them on the frame parser from the last lesson and on the code from earlier ones. It ends the module with a single map: every idea from these eleven lessons, next to the C++ you would write for it.

## Unit tests: one piece, from the inside

You met the basics in the previous module: a function marked `#[test]` passes unless it panics, and a `#[cfg(test)] mod tests` block keeps tests out of the real build. Here is a rate limiter, the kind of block that stops a command from jumping faster than an actuator can follow, with three tests that show three different styles.

```rust
/// Moves an output toward a command by at most `max_step` per call.
pub struct RateLimiter {
    max_step: f64,
    out: f64,
}

impl RateLimiter {
    pub fn new(max_step: f64) -> Self {
        assert!(max_step > 0.0, "max_step must be positive, got {max_step}");
        RateLimiter { max_step, out: 0.0 }
    }

    pub fn step(&mut self, command: f64) -> f64 {
        let delta = (command - self.out).clamp(-self.max_step, self.max_step);
        self.out += delta;
        self.out
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn hex_line_to_frame() -> Result<(), FrameError> {
        let bytes = parse_hex_line("00 64 0A 14 82")?;
        let (apid, payload) = parse_frame(&bytes)?;
        assert_eq!(apid, 100);
        assert_eq!(payload, &[0x0A, 0x14]);
        Ok(())
    }

    #[test]
    #[should_panic(expected = "max_step must be positive")]
    fn zero_step_limiter_is_a_bug() {
        RateLimiter::new(0.0);
    }

    #[test]
    fn limiter_moves_at_most_one_step() {
        let mut lim = RateLimiter::new(0.5);
        assert_eq!(lim.step(2.0), 0.5);
        assert_eq!(lim.step(2.0), 1.0);
        assert_eq!(lim.step(0.8), 0.8);
    }
}
```

(The frame functions are the thiserror versions from lesson 10, in the same crate.)

- **A test can return `Result`.** `hex_line_to_frame` returns `Result<(), FrameError>`, so it can use `?`. If any step returns `Err`, the test fails and prints the error. This keeps error-path tests free of `unwrap`.
- **`#[should_panic(expected = "...")]`** passes only if the test panics *and* the panic message contains that text. Zero `max_step` is a programming mistake, so `new` asserts, and this test proves the assert is there. The `expected` part matters: without it, a panic for any other reason would also count as a pass.
- **`assert_eq!`** compares with `==` and prints both sides when they differ. The limiter starts at 0 and may move 0.5 per step: $0 \to 0.5 \to 1.0$, and then the command 0.8 is only $0.2$ away, so it arrives exactly.

```text
running 3 tests
test tests::limiter_moves_at_most_one_step ... ok
test tests::hex_line_to_frame ... ok
test tests::zero_step_limiter_is_a_bug - should panic ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

Useful switches: `cargo test limiter` runs only tests whose names contain "limiter" (the rest show as "filtered out"). `cargo test -- --nocapture` shows what tests print, which is normally hidden. A test marked `#[ignore]`, for a slow one, runs only with `cargo test -- --ignored`. The tests run in parallel on several threads, so they must not depend on each other's order.

::: warning Never compare computed floats with assert_eq
A test that adds two burns of 0.1 and 0.2 m/s and asserts the total `== 0.3` fails:

```text
assertion `left == right` failed
  left: 0.30000000000000004
 right: 0.3
```

Neither 0.1 nor 0.2 is exact in binary, so their sum is off in the 17th digit. Compare with a tolerance that fits the physics: `assert!((total - 0.3).abs() < 1e-12, "total was {total}")`. The limiter test above could use `assert_eq!` only because $0.5$ and $1.0$ are exact in binary and the last step lands exactly on the command.
:::

## Integration tests: the whole library, from outside

A unit test lives inside the module it tests, so it can see private items. An **integration test** lives in a folder called `tests/` next to `src/`. Cargo compiles each file in `tests/` as a **[[separate crate|package-layout]]** that depends on your library, exactly as a user's program would. It can reach only what is `pub`.

```rust
// tests/frames.rs
use tlm::{FrameError, parse_frame, parse_hex_line};

#[test]
fn a_logged_line_round_trips() {
    let bytes = parse_hex_line("00 C8 FF C7").expect("valid hex");
    let (apid, payload) = parse_frame(&bytes).expect("valid frame");
    assert_eq!(apid, 200);
    assert_eq!(payload, &[0xFF]);
}

#[test]
fn garbage_hex_is_an_error_not_a_panic() {
    assert!(matches!(parse_hex_line("00 ZZ"), Err(FrameError::BadHex(_))));
}
```

`tlm` is the library's package name. `cargo test` now runs each test binary in turn:

```text
     Running unittests src/lib.rs (target/debug/deps/tlm-ed8646453a148f12)
running 3 tests
...
     Running tests/frames.rs (target/debug/deps/frames-ae93764d0b7fee25)
running 2 tests
test a_logged_line_round_trips ... ok
test garbage_hex_is_an_error_not_a_panic ... ok
```

Why bother, when unit tests can already call everything? Because an integration test checks the thing a user actually gets: that the right items are public, that the names make sense together, and that a whole workflow works end to end. If you make `parse_hex_line` private by accident, every unit test still passes, and this file stops compiling. Helper code shared by several test files goes in `tests/common/mod.rs`; a subfolder like that is not compiled as a test of its own.

## Benchmarks with criterion

A **benchmark** measures how long code takes. Timing something once is almost worthless: the processor's clock speed changes, caches warm up, and other programs interrupt. The **criterion** crate handles that. It warms the code up, runs it many thousands of times, and reports a range with statistics. (Built with criterion 0.8.2.)

The module's first exercise asks you to compare static and dynamic dispatch for a `Sensor` trait (lesson 08). Here is that benchmark. In `Cargo.toml`:

```toml
[dev-dependencies]
criterion = "0.8.2"

[[bench]]
name = "dispatch"
harness = false
```

`harness = false` tells Cargo that criterion provides its own `main`. The file `benches/dispatch.rs`:

```rust
use criterion::{Criterion, criterion_group, criterion_main};
use dispatch::{Counter, Gyro, Sensor, mean_dynamic, mean_static};
use std::hint::black_box;

fn bench_dispatch(c: &mut Criterion) {
    let mut gyro = Gyro { t: 0.0, bias: [1e-3, -2e-3, 5e-4] };
    c.bench_function("gyro static", |b| {
        b.iter(|| mean_static(black_box(&mut gyro), 1000))
    });
    c.bench_function("gyro dynamic", |b| {
        b.iter(|| mean_dynamic(black_box(&mut gyro as &mut dyn Sensor), 1000))
    });

    let mut counter = Counter { n: 0.0 };
    c.bench_function("counter static", |b| {
        b.iter(|| mean_static(black_box(&mut counter), 1000))
    });
    c.bench_function("counter dynamic", |b| {
        b.iter(|| mean_dynamic(black_box(&mut counter as &mut dyn Sensor), 1000))
    });
}

criterion_group!(benches, bench_dispatch);
criterion_main!(benches);
```

`mean_static` and `mean_dynamic` are the exercise's two functions: one generic over `S: Sensor`, one taking `&mut dyn Sensor`, each averaging 1000 reads. `Gyro::read` computes a sine and a cosine. `Counter::read` does almost nothing: it adds 1 to a number and returns it. **`black_box`** is a function that returns its argument unchanged while asking the optimizer to treat the value as unknown. (The standard library documents it as a best-effort hint, which is enough for benchmarks like this one.) Without it, the compiler could notice that the concrete type behind the `dyn` is known and turn the dynamic call back into a static one, and the benchmark would compare two copies of the same code.

::: example What dispatch really costs
`cargo bench` builds in release mode and prints one line per benchmark (trimmed):

```text
gyro static             time:   [14.301 µs 14.380 µs 14.477 µs]
gyro dynamic            time:   [14.813 µs 14.943 µs 15.094 µs]
counter static          time:   [785.79 ns 788.41 ns 791.90 ns]
counter dynamic         time:   [8.3690 µs 8.4972 µs 8.6354 µs]
```

The middle number is criterion's best estimate; the outer two bound a **[[confidence interval|confidence-interval]]** around it.

1. Gyro: $14.943 / 14.380 \approx 1.04$. Dynamic dispatch is about 4% slower. Per read, that is $(14.943 - 14.380)\,\mu\mathrm{s} / 1000 \approx 0.56$ ns.
2. Counter: $8497 / 788.4 \approx 10.8$. Dynamic dispatch is almost eleven times slower. Per read: $0.79$ ns static against $8.5$ ns dynamic.

Why so different? In both cases the static version lets the compiler **[[inline|inlining]]** `read` into the loop and optimize them together. For the gyro, that saves little, because the sine and cosine take most of the 14 ns. For the counter, the whole read becomes one addition kept in a register, while the dynamic version must make a real call through the vtable every time and keep the counter in memory between calls.

Sanity check: both pairs return identical averages (the exercise's test checks this), and the gap is largest exactly where the work per call is smallest. That is the lesson for a 1 kHz control loop: static dispatch never costs more, and it matters most for small, frequently called functions. These numbers come from one machine on one day; measure on your own target before you quote them.
:::

## Property tests with proptest

A unit test checks examples you chose. A **property test** states a rule that must hold for *every* input, then tries hundreds of random inputs to break it. The **proptest** crate does this, and when it finds a failure it **[[shrinks|shrinking]]** it: it keeps simplifying the failing input while it still fails, so you get a small case to debug instead of a random mess. (Built with proptest 1.11.0.)

Here is a helper that finds the midpoint of two timestamps in milliseconds, for interpolating between samples:

```rust
pub fn mid_tick(a: u32, b: u32) -> u32 {
    (a + b) / 2
}
```

The property: the midpoint always lies between the two inputs. In `tests/proptests.rs`:

```rust
use proptest::prelude::*;
use tlm::mid_tick;

proptest! {
    #[test]
    fn midpoint_lies_between(a: u32, b: u32) {
        let m = mid_tick(a, b);
        prop_assert!(a.min(b) <= m && m <= a.max(b));
    }
}
```

The `proptest!` macro turns the arguments `a: u32, b: u32` into randomly generated values, 256 cases per run by default. `prop_assert!` is its version of `assert!`.

::: example proptest finds the overflow
`cargo test` (trimmed):

```text
thread 'midpoint_lies_between' (12125) panicked at src/lib.rs:45:5:
attempt to add with overflow
...
Test failed: attempt to add with overflow.
minimal failing input: a = 2055681604, b = 2239285692
	successes: 0
```

Look at the minimal input. Add the two: $2\,055\,681\,604 + 2\,239\,285\,692 = 4\,294\,967\,296 = 2^{32}$. A `u32` holds at most $2^{32} - 1$, so this is the smallest total that overflows. Shrinking did not find "small numbers"; it found the exact edge. And "successes: 0" says that random `u32` pairs overflow so often that the very first case failed: about half of all pairs have a sum of $2^{32}$ or more.

The fix is to add in a wider type: `((a as u64 + b as u64) / 2) as u32`. The sum of two `u32` values always fits in a `u64`, and half of it always fits back in a `u32`. (The standard library also has `a.midpoint(b)` for this.) Run again:

```text
running 1 test
test midpoint_lies_between ... ok
```

Sanity check: a hand-written test with timestamps like 1000 and 3000 would have passed forever. A flight computer counting milliseconds in a `u32` reaches $2^{31}$ after about 24.9 days, and from then on two recent timestamps add past $2^{32}$.
:::

When proptest finds a failure, it also saves the case's seed in a file ending in `.proptest-regressions` next to the test, and replays it first on every later run. Commit that file, so the whole team keeps checking that input.

## Fuzzing with cargo-fuzz

**Fuzzing** is property testing's harder-working cousin, aimed at code that reads untrusted bytes. A **fuzzer** generates inputs, runs your code on each, and watches which branches of the code each input reaches. Inputs that reach new branches are kept and mutated further. Over millions of runs it works its way into corners that random bytes alone would never hit. **cargo-fuzz** connects Rust to **[[libFuzzer|fuzz-name]]**, the fuzzer built into the LLVM compiler project. It needs the nightly compiler. (cargo-fuzz 0.13.2, on nightly Rust 1.100.)

Suppose version 2 of the frame format adds a length byte after the APID. Here is a first attempt, with its own small error enum (`TooShort`, `BadLength`, `BadChecksum`, no fields):

```rust
/// Version 2 layout: [apid_hi, apid_lo, len, payload (len bytes), checksum]
pub fn parse_frame_v2(bytes: &[u8]) -> Result<(u16, &[u8]), FrameError> {
    if bytes.len() < 4 {
        return Err(FrameError::TooShort);
    }
    let len = bytes[2] as usize;
    let payload = &bytes[3..3 + len]; // trusts the length byte
    let sum = bytes[..3 + len].iter().fold(0u8, |a, &b| a.wrapping_add(b));
    if sum != bytes[3 + len] {
        return Err(FrameError::BadChecksum);
    }
    Ok((u16::from_be_bytes([bytes[0], bytes[1]]), payload))
}
```

`cargo fuzz init -t parse_v2` creates a `fuzz/` folder with a target named `parse_v2`. The **fuzz target** states the rule: any bytes at all may come in; the parser may return `Err`, but it must never panic.

```rust
// fuzz/fuzz_targets/parse_v2.rs
#![no_main]

use libfuzzer_sys::fuzz_target;

fuzz_target!(|data: &[u8]| {
    let _ = frame2::parse_frame_v2(data);
});
```

`cargo +nightly fuzz run parse_v2` stopped almost at once, before the fuzzer had even reported its first new branch (trimmed):

```text
thread '<unnamed>' (18741) panicked at .../frame2/src/lib.rs:13:25:
range end index 13 out of range for slice of length 4
...
Output of `std::fmt::Debug`:

	[10, 10, 10, 10]
```

Four bytes, and the third one says the payload is 10 bytes long. The parser believed it, so it tried to slice bytes 3 to 13 of a 4-byte frame. On a spacecraft, one flipped bit in a length field would have been enough to crash the parser. The fuzzer saved the input under `fuzz/artifacts/`, so it can be replayed. The fix checks the length byte against the real length before using it:

```rust
    let len = bytes[2] as usize;
    if bytes.len() != 3 + len + 1 {
        return Err(FrameError::BadLength);
    }
```

After that, a 30-second run (`cargo +nightly fuzz run parse_v2 -- -max_total_time=30`) ended with `Done 20530841 runs in 31 second(s)` and no crash: over 20 million inputs, about 660,000 per second. That is not a proof that the parser is correct, but it is strong evidence that no short input makes it panic.

::: key Match the tool to the question
Unit tests check examples from the inside; integration tests check the public API from outside; criterion measures time with statistics; proptest checks a rule over random inputs and shrinks failures; cargo-fuzz drives a parser with millions of coverage-guided inputs, hunting panics; miri checks that `unsafe` code has no undefined behavior.
:::

## miri: the X-ray for unsafe code

Every tool so far checks whether code gives the right *answer*. Undefined behavior can give the right answer and still be broken, because the answer depends on luck: on what the memory allocator happened to leave in freed memory, or on the optimizer. **miri** is an interpreter for Rust's **[[MIR|mir]]**, the compiler's simplified internal form of your program. Instead of running machine code, it runs your program one step at a time and tracks, for every byte of memory, whether it is allocated, initialized, and which pointers are allowed to touch it.

::: key What is miri for?
An interpreter that detects undefined behaviour in unsafe code: out-of-bounds, misaligned access, invalid aliasing under Stacked Borrows, uninitialised reads. It is the Rust equivalent of running everything under a very strict sanitizer.
:::

::: example A test that passes, and should not
This function is lesson 02's forbidden push, sneaked past the borrow checker with a raw pointer. The borrow checker is still on inside `unsafe`, but a raw pointer is not a borrow, so it does not track `prev`. The only unsafe operation is the final read: dereferencing a raw pointer, one of lesson 07's five superpowers.

```rust
/// Appends a sample and returns the sample that was newest before it.
pub fn push_and_prev(log: &mut Vec<f64>, x: f64) -> f64 {
    let prev: *const f64 = &log[log.len() - 1]; // raw pointer into the buffer
    log.push(x); // may move the whole buffer
    unsafe { *prev } // BUG: may read memory that was freed
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn returns_previous_sample() {
        let mut log = vec![0.1, 0.2, 0.3, 0.4];
        assert_eq!(push_and_prev(&mut log, 0.5), 0.4);
    }
}
```

A normal `cargo test` says:

```text
test tests::returns_previous_sample ... ok
```

It passes. `vec![...]` with four items has room for exactly four, so the push must move everything to a bigger buffer and free the old one. `prev` still points into the freed buffer. The allocator had not yet reused those bytes, so the old 0.4 was still sitting there.

`cargo +nightly miri test` (nightly Rust 1.100, trimmed):

```text
test tests::returns_previous_sample ... error: Undefined Behavior: memory access failed: alloc39580 has been freed, so this pointer is dangling
  --> src/lib.rs:5:14
   |
 5 |     unsafe { *prev } // BUG: may read memory that was freed
   |              ^^^^^ Undefined Behavior occurred here
   |
help: alloc39580 was allocated here:
  --> src/lib.rs:14:23
   |
14 |         let mut log = vec![0.1, 0.2, 0.3, 0.4];
   |                       ^^^^^^^^^^^^^^^^^^^^^^^^
help: alloc39580 was deallocated here:
  --> src/lib.rs:4:5
   |
 4 |     log.push(x); // may move the whole buffer
   |     ^^^^^^^^^^^
```

miri names the three lines that matter: where the memory was allocated, where it was freed, and where the dangling pointer read it. The fix needs no `unsafe` at all: copy the `f64` out first, `let prev = log[log.len() - 1];`, then push and return `prev`.
:::

miri is far slower than running natively, so teams run it on unit tests with small inputs, usually in a nightly CI job. It cannot run most calls into C libraries or real hardware. Within those limits, it is the check every crate containing `unsafe` should pass.

::: warning A passing test proves nothing about undefined behavior
The test above passed because of what the allocator happened to do. A different allocator, a different optimization level, or one more thread, and it returns garbage. That is why "the tests pass" is not enough for `unsafe` code, in Rust or in C++. You need a tool that checks the rules themselves: miri for Rust, and AddressSanitizer and UndefinedBehaviorSanitizer for C and C++.
:::

## The map back to C++

This module promised to make you a better C++ programmer. Here is every idea from it, next to its closest C++ counterpart, and what the Rust compiler checks that the C++ compiler does not.

| Rust idea | Closest C++ | What changes |
|---|---|---|
| Ownership and move (L01) | `std::unique_ptr`, `std::move` | Rust moves by default and forbids using the moved-from name; C++ copies by default and leaves a moved-from object "valid but unspecified" |
| `Copy` / `.clone()` (L01) | trivially copyable types / copy constructor | Deep copies are always written out in Rust |
| `&T` / `&mut T` (L02) | `const T&` / `T&` | `&mut` is guaranteed exclusive; a C++ `T&` is not (the nearest promise is the non-standard `__restrict`) |
| Aliasing XOR mutability (L02, L03) | rules you follow by hand | Push-while-borrowed and iterator invalidation are compile errors, not undefined behavior |
| Lifetimes (L04) | none in the language; `[[clang::lifetimebound]]` catches a few cases | A returned reference cannot outlive its source |
| `Rc` / `Arc` / `Weak` (L05) | `std::shared_ptr` / `std::weak_ptr` | `Rc` is a cheaper single-thread count; the compiler stops it crossing threads |
| `Mutex<T>`, `RwLock<T>` (L05) | `std::mutex`, `std::shared_mutex` plus a separate variable | Rust's mutex owns the data, so it cannot be touched without the lock |
| `Cell` / `RefCell` (L05) | `mutable` members | `RefCell` checks borrows at runtime and panics on a violation |
| `OnceLock` (L05) | function-local `static`, `std::call_once` | Same idea: initialize once, thread-safely |
| `Send` / `Sync` (L06) | no equivalent; convention plus ThreadSanitizer | Thread safety is checked in the type system |
| `Drop` (L06) | destructor, RAII | No rule of five; a moved-from value is not dropped |
| `Box<T>` / `Pin` (L06) | `std::unique_ptr<T>` / deleted move constructor | `Pin` states "must not move" in the type |
| `unsafe` (L07) | all of C++ | Five marked operations, instead of the whole language |
| Traits (L08) | concepts plus abstract base classes | One feature covers both jobs |
| Generics, `impl Trait` (L08) | templates, CRTP | Checked against the trait bound before instantiation |
| `dyn Trait` (L08) | `virtual` functions | vtable pointer lives in the fat pointer, not inside the object |
| Operator traits, `From`, `Display`, `Default`, `Iterator`, `Deref` (L09) | operator overloading, converting constructors, `operator<<` or `std::formatter`, default constructor, iterators, `operator*` / `operator->` | No implicit converting constructors: `from` and `into` are called by name (only `Deref` coerces automatically) |
| `Result` / `Option` (L10) | `std::expected` (C++23) / `std::optional` | `?` propagates in one character; `Result` is `#[must_use]` |
| panic, `panic = "abort"` (L10) | `assert`, `std::terminate`, `-fno-exceptions` | Bugs abort; ordinary failures travel as values |
| `#[test]`, criterion, proptest (L11) | GoogleTest or Catch2, Google Benchmark, RapidCheck | Testing is built into Cargo, not bolted on |
| cargo-fuzz, miri (L11) | libFuzzer, ASan and UBSan | miri also checks Rust's borrow-based aliasing rules, which C++ does not have |

Read down the right-hand column and one pattern stands out. In nearly every row, C++ already has the rule. A good C++ engineer already uses `unique_ptr` for single ownership, does not touch an object after `std::move`, does not keep a reference into a vector across a `push_back`, protects shared data with a lock, and avoids exceptions in flight code. What C++ does not do is *check*. The rules live in coding standards, code review and runtime sanitizers, and a single missed case compiles without a word.

Rust turns those same rules into types that the compiler checks. That is why the errors in lesson 03 were worth reading slowly: each one was a C++ bug that would have compiled. The habit carries back. After this module, when you read `auto& first = v[0]; v.push_back(x);` in a C++ review, you will see the dangling reference at a glance, because you have spent weeks with a compiler that would not let you write it.

Two rows deserve a closer look. For `dyn Trait` against `virtual`: C++ stores a hidden vtable pointer inside every object of a class with virtual functions, so the cost is paid by every object, used polymorphically or not. Rust keeps the object plain and puts the vtable pointer in the reference, the fat pointer from lesson 08, so you pay only where you use dynamic dispatch. For `unsafe`: C++ has no keyword because nothing is checked; every line is implicitly the equivalent of an `unsafe` block. Rust's `unsafe` marks the few lines where a person, not the compiler, carries the proof, and miri and review can concentrate there.

::: note Why the checks cannot be added to C++ afterward
Tools such as clang-tidy and the C++ Core Guidelines lifetime checks catch some of these bugs, and they are worth running. They cannot catch them all, for a structural reason. The C++ type `T&` does not say whether the reference is the only one, and a function signature does not say which argument a returned reference borrows from. A checker looking at one function at a time must either guess (and miss bugs) or assume the worst (and reject correct code). Rust puts exactly that missing information into the types: `&mut` means exclusive, and a lifetime names which input a result borrows from. With it, each function can be checked on its own and the results combine. That is the real content of "aliasing and lifetime rules made explicit".
:::

## Check yourself

::: check
You want to make sure that a library's `pub use` lines really expose `Quaternion` and `propagate` to users. Which kind of test catches a mistake there, and why would a unit test miss it?
:::

::: answer
An integration test in `tests/`. Cargo compiles it as a separate crate that sees only public items, the same view a user has. If `propagate` stopped being public, the integration test would fail to compile. A unit test inside the library sits in a child module that can see private items too (through `use super::*`), so it keeps passing even when the public interface is broken.
:::

::: check
A criterion benchmark of a function reports `time: [2.1 ns 2.2 ns 2.3 ns]`, but the function computes a Kalman gain that should take around 300 ns. What probably went wrong, and how do you fix it?
:::

::: answer
The optimizer probably removed most of the work. Either the inputs were constants it could compute at compile time, or the result was never used, so the computation was deleted. Wrap the inputs in `std::hint::black_box(...)` so the compiler must treat them as unknown, and return the result from the closure given to `b.iter` (criterion keeps whatever the closure returns alive). Then re-run and check that the time is in the expected range.
:::

::: check
Write a proptest property for a function `wrap_deg(a: f64) -> f64` that should map any finite angle into the range $-180 < x \le 180$ degrees without changing the direction it points. Say what each check tests.
:::

::: answer
```rust
proptest! {
    #[test]
    fn wrap_is_in_range_and_same_direction(a in -1.0e6f64..1.0e6) {
        let w = wrap_deg(a);
        prop_assert!(w > -180.0 && w <= 180.0);
        let d = (w - a).to_radians();
        prop_assert!((d.cos() - 1.0).abs() < 1e-9);
    }
}
```

`a in -1.0e6f64..1.0e6` asks proptest for floats in a range, which avoids infinities and NaN. The first check tests the range. The second tests the direction: two angles point the same way exactly when they differ by a whole number of turns, and then the cosine of the difference is 1. A tolerance is needed because the subtraction of large angles loses a few digits.
:::

::: check
Your fuzz target for a star-tracker message parser has run for an hour with no crash. A teammate says: "So the parser is correct." What has the run actually shown, and what has it not?
:::

::: answer
It has shown that none of the inputs the fuzzer tried (for a small parser, often hundreds of millions in an hour) made the parser panic, and, if the target also checks results, that none broke those checks. It has not shown that the parser returns the *right* values for valid messages; a parser that returned `Err` for everything would never crash either. It has also not covered inputs longer than the fuzzer's maximum length, or rare branches it never reached. Pair it with unit tests of real messages, and look at the coverage report to see which branches were never hit.
:::

::: check
A C++ engineer asks why the Rust `&mut T` row in the map says "guaranteed exclusive" when `T&` in C++ also lets you change the value. Explain the difference, with one bug it prevents.
:::

::: answer
Both let you change the value through the reference. The difference is what else may exist at the same time. While a `&mut T` is alive, the compiler guarantees that no other reference to that value can be used, so nothing can change or read it behind your back. A C++ `T&` makes no such promise: other references and pointers to the same object may exist and be used. The prevented bug is lesson 02's: in C++, holding `const T& first = v[0]` while calling `v.push_back(x)` compiles, and `first` dangles after the reallocation. In Rust, `push` needs `&mut v`, which cannot exist while `first` borrows `v`, so the program is rejected.
:::

## Summary

| Tool | Where it lives | What it catches |
|---|---|---|
| `#[test]`, `#[should_panic]`, `Result` tests | `#[cfg(test)] mod tests` in `src/` | Wrong answers in one unit, including private code |
| Integration tests | `tests/*.rs`, each its own crate | Broken public API and end-to-end workflows |
| criterion | `benches/`, `harness = false`, `black_box` | Speed, with statistics; static vs dynamic dispatch |
| proptest | `proptest! { ... }` | Rules broken for some input; shrinks to a minimal case |
| cargo-fuzz | `fuzz/fuzz_targets/`, nightly | Panics on untrusted bytes, found with coverage guidance |
| miri | `cargo +nightly miri test` | Undefined behavior in `unsafe` code that tests miss |
| The C++ map | every lesson of this module | Same rules as good C++, but checked by the compiler |

This module taught Rust on a desktop, with the standard library, an allocator and an operating system underneath. The next module, on no_std Rust and its real aerospace footprint, takes all of that away: no heap, a panic handler you write yourself, and code that runs on a bare microcontroller, followed by an honest look at where Rust is actually used in space today.

::: context package-layout One package, several crates
A Cargo package can hold several crates, and each gets compiled on its own. The library in `src/lib.rs` is one. Each file in `tests/` becomes a separate test crate that depends on the library. Each file in `benches/` becomes a benchmark crate. `cargo fuzz init` adds a `fuzz/` folder that is a whole package of its own.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="10" width="340" height="160" fill="#fff" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <text x="20" y="28" font-size="12" fill="#6c7a93">package tlm</text>
  <rect x="120" y="40" width="120" height="40" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="180" y="58" font-size="12" text-anchor="middle" fill="#1f2a44">src/lib.rs</text>
  <text x="180" y="73" font-size="11" text-anchor="middle" fill="#1f2a44">+ unit tests inside</text>
  <rect x="20" y="118" width="100" height="36" fill="#f2b880" stroke="#1f2a44"/>
  <text x="70" y="140" font-size="11" text-anchor="middle" fill="#1f2a44">tests/frames.rs</text>
  <rect x="130" y="118" width="100" height="36" fill="#f2b880" stroke="#1f2a44"/>
  <text x="180" y="140" font-size="11" text-anchor="middle" fill="#1f2a44">tests/proptests.rs</text>
  <rect x="240" y="118" width="100" height="36" fill="#f2b880" stroke="#1f2a44"/>
  <text x="290" y="140" font-size="11" text-anchor="middle" fill="#1f2a44">benches/*.rs</text>
  <line x1="70" y1="118" x2="150" y2="84" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="180" y1="118" x2="180" y2="84" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="290" y1="118" x2="210" y2="84" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="300" y="100" font-size="11" text-anchor="middle" fill="#1d6fd1">pub items only</text>
</svg>
```
:::

::: context confidence-interval Three numbers instead of one
Criterion runs the code in batches, collecting 100 samples by default, and estimates the true average time from them. The three numbers are a lower bound, the best estimate, and an upper bound. By default the bounds form a 95% confidence interval: if the whole measurement were repeated many times, intervals built this way would contain the true value about 95 times in 100. When two benchmarks' intervals do not overlap, as for the gyro's 14.30–14.48 µs against 14.81–15.09 µs, the difference is very unlikely to be noise. Criterion also saves each run, and on the next run reports whether the time changed.
:::

::: context inlining Copying the function into the caller
Inlining means the compiler pastes a function's body into the place that calls it, instead of jumping to it. The jump itself is cheap. The real win is what comes after: once the body sits inside the loop, the optimizer can keep values in registers across iterations, remove repeated work, and sometimes process several iterations at once. A call through a vtable cannot be inlined, because the compiler does not know which function will run until the program is running. With static dispatch it knows the exact type, so it can inline `read`.
:::

::: context shrinking Walking a failure back to its edge
When proptest finds a failing input, it tries simpler versions: smaller numbers, shorter lists. It keeps each simplification that still fails and drops each that passes. For two integers it moves them toward zero step by step. Here it stopped at a pair whose sum is exactly $2^{32}$, because making either number smaller by even 1 would bring the sum to $2^{32} - 1$, which fits, and the test would pass. The result sits exactly on the edge of the bug.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="60" x2="340" y2="60" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="200" y="50" width="140" height="20" fill="#f2b880" stroke="none" opacity="0.7"/>
  <line x1="200" y1="44" x2="200" y2="76" stroke="#b4232c" stroke-width="2"/>
  <text x="200" y="92" font-size="11" text-anchor="middle" fill="#b4232c">a + b = 2^32</text>
  <text x="100" y="92" font-size="11" text-anchor="middle" fill="#1d6fd1">passes</text>
  <text x="270" y="92" font-size="11" text-anchor="middle" fill="#b4232c">overflows</text>
  <circle cx="320" cy="60" r="5" fill="#1f2a44"/>
  <circle cx="270" cy="60" r="5" fill="#6c7a93"/>
  <circle cx="230" cy="60" r="5" fill="#6c7a93"/>
  <circle cx="202" cy="60" r="5" fill="#b4232c"/>
  <text x="320" y="40" font-size="11" text-anchor="middle" fill="#1f2a44">first failure</text>
  <text x="202" y="30" font-size="11" text-anchor="middle" fill="#b4232c">shrunk</text>
</svg>
```
:::

::: context fuzz-name Where "fuzz" comes from
The idea goes back to a class project at the University of Wisconsin around 1988, where Barton Miller's students fed streams of random characters to standard Unix utilities and found that a surprising number of them crashed or hung. The random input was called "fuzz". Modern fuzzers such as libFuzzer and AFL added the key improvement, coverage guidance: they measure which parts of the code each input reaches and breed new inputs from the ones that reached somewhere new. Parsers of radio frames, file formats and ground commands are the classic targets, because they read bytes someone else controls.
:::

::: context mir The compiler's middle language
Rust source code passes through several forms on its way to machine code. MIR, the Mid-level Intermediate Representation, is a simplified version in which every borrow, move and drop is written out explicitly. The borrow checker works on MIR. miri runs it directly, which is why it can see exactly when memory is freed and which pointer came from which borrow.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="30" width="70" height="34" fill="#fff" stroke="#1f2a44"/>
  <text x="45" y="51" font-size="12" text-anchor="middle" fill="#1f2a44">source</text>
  <rect x="100" y="30" width="70" height="34" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="135" y="51" font-size="12" text-anchor="middle" fill="#1f2a44">MIR</text>
  <rect x="190" y="30" width="70" height="34" fill="#fff" stroke="#1f2a44"/>
  <text x="225" y="51" font-size="12" text-anchor="middle" fill="#1f2a44">LLVM IR</text>
  <rect x="280" y="30" width="70" height="34" fill="#fff" stroke="#1f2a44"/>
  <text x="315" y="51" font-size="12" text-anchor="middle" fill="#1f2a44">machine</text>
  <line x1="80" y1="47" x2="94" y2="47" stroke="#1f2a44"/>
  <polygon points="100,47 92,43 92,51" fill="#1f2a44"/>
  <line x1="170" y1="47" x2="184" y2="47" stroke="#1f2a44"/>
  <polygon points="190,47 182,43 182,51" fill="#1f2a44"/>
  <line x1="260" y1="47" x2="274" y2="47" stroke="#1f2a44"/>
  <polygon points="280,47 272,43 272,51" fill="#1f2a44"/>
  <line x1="135" y1="64" x2="135" y2="86" stroke="#b4232c" stroke-width="2"/>
  <text x="135" y="104" font-size="12" text-anchor="middle" fill="#b4232c">miri runs here</text>
  <text x="315" y="84" font-size="11" text-anchor="middle" fill="#6c7a93">normal tests</text>
  <text x="315" y="98" font-size="11" text-anchor="middle" fill="#6c7a93">run here</text>
</svg>
```

Stacked Borrows, the aliasing model miri checks by default, was designed by Ralf Jung and colleagues to state precisely which pointer uses are allowed. A newer model, Tree Borrows, can be selected with a flag.
:::
