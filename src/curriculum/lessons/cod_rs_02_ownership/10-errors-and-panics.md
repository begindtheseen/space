---
id: l10-errors-and-panics
title: Errors and panics
minutes: 26
covers:
  - 'Error handling: custom error enums, thiserror for libraries, anyhow for applications'
  - 'panic versus recoverable errors; unwrap and expect discipline; panic = abort'
---

Think about a snack machine. Sometimes it shows a message: "B4 sold out, choose another." That is a normal event. The machine was built to expect it, it tells you what happened, and you pick something else. Other times smoke comes out of the back. Nobody expects the machine to handle that. It switches itself off, and a technician comes.

Programs fail in the same two ways. Some failures are part of normal life: a packet arrives corrupted, a file is missing, a sensor times out. The program should report them and carry on. Other failures mean the program itself is wrong: it looked up entry 4 of a table with 4 entries, or a value that "can never be empty" was empty. Carrying on after that would mean flying on a wrong belief.

Rust gives each kind its own tool. A **recoverable error** is a failure the caller can do something about, returned as a value of type `Result<T, E>`. A **[[panic|panic-recap]]** is a deliberate stop when the program finds it has a bug. You met `Result`, `?` and `unwrap` in the previous module. This lesson is about using them the way a flight-software team does: error types a caller can act on, the two crates nearly every Rust project uses to build them, the rules for when `unwrap` is allowed, and why flight-style Rust stops the whole program the moment a panic happens.

## Two kinds of failure

Here is the question to ask about every failure: **can the caller reasonably do something about it?**

- A frame from the radio fails its checksum. The caller can ask for a resend. Return an error.
- A configuration file is missing. The caller can use defaults, or tell the operator. Return an error.
- A star tracker cannot find a solution because the Sun is in its view. The navigation filter can skip the update and rely on the gyros. Return an error.
- Code indexes a four-entry table with 4. There is no sensible way to continue: some earlier step computed a wrong number. Panic.
- An internal state machine reaches a state the design says is impossible. Panic.

The first three come from the outside world. The outside world is allowed to be messy, so messy input is never a bug in your program. The last two come from inside your own logic. They are bugs, and the honest response to a bug is to stop.

::: key Result or panic?
If the caller can reasonably do something about a failure, return a `Result` and let it decide. If the failure means the program's own logic is wrong, panic. Input from outside (sensors, radio, files, ground commands) must never be able to cause a panic.
:::

::: warning Do not panic on data you did not create
A program that panics when a packet is malformed hands every noisy radio link a way to crash it. Anything that crosses into your program from outside gets checked and turned into an `Err`. Only assumptions about your *own* code, which you can prove, may panic when they are broken.
:::

## A custom error enum, by hand

A library reports failures with its own **error enum**: an enum with one variant per way things can go wrong, each variant carrying the details a caller needs. You built a small one in the previous module. Here is a fuller one, for a toy telemetry frame (simpler than the real CCSDS packet from lesson 04). The frame layout is:

- bytes 0 and 1: the **[[APID|apid-toy]]**, a 16-bit number saying which instrument sent it;
- the bytes in between: the payload;
- the last byte: a **checksum**, the sum of all the earlier bytes, keeping only the lowest 8 bits.

```rust
use std::fmt;

#[derive(Debug, PartialEq)]
pub enum FrameError {
    TooShort { len: usize },
    BadChecksum { expected: u8, found: u8 },
    UnknownApid(u16),
}

impl fmt::Display for FrameError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            FrameError::TooShort { len } => {
                write!(f, "frame too short: {len} bytes, need at least 4")
            }
            FrameError::BadChecksum { expected, found } => {
                write!(f, "bad checksum: expected {expected:#04x}, found {found:#04x}")
            }
            FrameError::UnknownApid(apid) => write!(f, "unknown APID {apid}"),
        }
    }
}

impl std::error::Error for FrameError {}

const KNOWN_APIDS: [u16; 2] = [100, 200];

/// Frame layout: [apid_hi, apid_lo, payload..., checksum]
pub fn parse_frame(bytes: &[u8]) -> Result<(u16, &[u8]), FrameError> {
    if bytes.len() < 4 {
        return Err(FrameError::TooShort { len: bytes.len() });
    }
    let (body, last) = bytes.split_at(bytes.len() - 1);
    let expected = body.iter().fold(0u8, |acc, &b| acc.wrapping_add(b));
    if expected != last[0] {
        return Err(FrameError::BadChecksum { expected, found: last[0] });
    }
    let apid = u16::from_be_bytes([body[0], body[1]]);
    if !KNOWN_APIDS.contains(&apid) {
        return Err(FrameError::UnknownApid(apid));
    }
    Ok((apid, &body[2..]))
}
```

Three pieces make this a proper error type.

1. **The enum itself.** Each variant is one failure, and it carries the facts: how long the frame was, which checksum was expected and which arrived, which APID was unknown. `derive(Debug, PartialEq)` lets tests compare and print errors.
2. **`Display`.** This trait decides how the error reads to a human, used by `{}` in `println!`. Lesson 09 covers `Display` fully. Here each arm of the `match` writes one sentence. `{expected:#04x}` prints a byte in hexadecimal with a `0x` prefix, padded to four characters, such as `0x82`.
3. **`std::error::Error`.** This is the standard trait every error type is expected to implement. It needs `Debug` and `Display` to exist, and it has an optional method, **`source()`**, that returns the lower-level error this one was caused by, if there is one. Our errors have no deeper cause, so the empty `impl` block is enough. Implementing the trait is what lets other code, including the crates later in this lesson, treat `FrameError` as "an error" without knowing its exact type.

The parser itself uses the `Result` habits you know. `split_at` cuts off the last byte. The `fold` adds the body bytes with **[[wrapping_add|wrapping-sum]]**, so the sum wraps around past 255 instead of overflowing. `u16::from_be_bytes` joins two bytes into one 16-bit number, most significant byte first ("be" is big-endian). Notice that nothing here can panic: the length check comes first, so `bytes.len() - 1`, `last[0]`, `body[0]` and `body[1]` are all known to be in range.

::: example A caller that acts on the error
Four frames arrive. The caller asks for a resend on a bad checksum, and drops anything else it cannot use.

```rust
fn main() {
    let frames: [&[u8]; 4] = [
        &[0x00, 0x64, 0x0A, 0x14, 0x82],
        &[0x00, 0x64],
        &[0x00, 0x64, 0x0A, 0x14, 0x83],
        &[0x01, 0x2C, 0x07, 0x34],
    ];
    for f in frames {
        match parse_frame(f) {
            Ok((apid, payload)) => println!("ok: APID {apid}, payload {payload:?}"),
            Err(e @ FrameError::BadChecksum { .. }) => println!("{e}; request resend"),
            Err(e) => println!("dropped: {e}"),
        }
    }
}
```

```text
ok: APID 100, payload [10, 20]
dropped: frame too short: 2 bytes, need at least 4
bad checksum: expected 0x82, found 0x83; request resend
dropped: unknown APID 300
```

Work through each frame.

1. Body bytes `0x00, 0x64, 0x0A, 0x14` are $0 + 100 + 10 + 20 = 130$ in decimal, and $130$ is `0x82`. The last byte is `0x82`, so the checksum passes. The APID is `0x0064` $= 100$, which is known. The payload is the bytes between: `[10, 20]`.
2. Only 2 bytes: `TooShort { len: 2 }`, caught before anything else is read.
3. Same body, so the expected sum is still `0x82`, but the last byte is `0x83`. One bit flipped in transit. The caller matches this case and asks for a resend.
4. Body `0x01, 0x2C, 0x07`: $1 + 44 + 7 = 52 =$ `0x34`, which matches, so the frame arrived intact. But the APID `0x012C` is $1 \times 256 + 44 = 300$, not in the list.

The pattern `e @ FrameError::BadChecksum { .. }` reads "bind the name `e` to the value, if it matches this pattern". The `..` means "ignore the other fields". Sanity check: the only frame that arrived damaged is the only one that asked for a resend. That is the whole point of a typed error: the caller could tell a corrupt frame from a frame that was never meant for it.
:::

::: key Custom error enums
A library error is an enum with one variant per failure, each carrying the details a caller needs, plus `Display` for humans and `std::error::Error` so generic code can handle it. Callers `match` on the variants to decide what to do.
:::

## thiserror: the same enum, written for you

Writing `Display` and `Error` by hand for every error type is repetitive. The **thiserror** crate writes them for you. It is a **[[derive macro|proc-macro]]**: you add `#[derive(Error)]` and a message on each variant, and at compile time it generates the same code you wrote above. Here is the library again, now with one more variant for reading frames typed in as hex text, like `00 64 0A 14 82`. It was built with thiserror 2.0.21, added with `cargo add thiserror`.

```rust
use thiserror::Error;

#[derive(Debug, Error, PartialEq)]
pub enum FrameError {
    #[error("frame too short: {len} bytes, need at least 4")]
    TooShort { len: usize },
    #[error("bad checksum: expected {expected:#04x}, found {found:#04x}")]
    BadChecksum { expected: u8, found: u8 },
    #[error("unknown APID {0}")]
    UnknownApid(u16),
    #[error("not a hex byte")]
    BadHex(#[from] std::num::ParseIntError),
}

/// "00 64 0A 14 82" -> [0x00, 0x64, 0x0A, 0x14, 0x82]
pub fn parse_hex_line(line: &str) -> Result<Vec<u8>, FrameError> {
    let mut out = Vec::new();
    for token in line.split_whitespace() {
        out.push(u8::from_str_radix(token, 16)?);
    }
    Ok(out)
}
```

(`parse_frame` is unchanged.) Here is what each attribute generates:

- `#[error("...")]` becomes that variant's arm in `Display`. Inside the message, `{len}` names a field, and `{0}` names the first field of a tuple variant.
- `#[derive(Error)]` writes `impl std::error::Error for FrameError`.
- `#[from]` on a field does two jobs. It writes `impl From<ParseIntError> for FrameError`, so `?` can convert the error automatically, as you saw in the previous module. And it makes `source()` return the `ParseIntError`, so the original cause is not lost.

`u8::from_str_radix(token, 16)` reads "u8 from string, in base 16": it turns text like `"0A"` into the number 10, or returns a `ParseIntError`. The `?` after it converts that error into `FrameError::BadHex` through the generated `From`, and returns it.

The result is exactly as typed as before. A caller still matches on `FrameError::BadChecksum`. Nothing about the crate appears in your library's public interface: the generated code is plain standard-library impls, so you could later replace the derive with hand-written code and no caller would notice.

## anyhow: one error type for the application

Now climb to the top of the program. The ground-software tool that reads a log file of frames does not need to decide anything per error case. When something fails, it needs to tell the operator what failed and where, and stop. For that, the **anyhow** crate offers a single error type, `anyhow::Error`, that can hold *any* error, plus a way to wrap extra explanation, called **context**, around it. (Built with anyhow 1.0.104.)

```rust
use anyhow::{Context, Result, bail};
use errs::{parse_frame, parse_hex_line};

fn count_good_frames(path: &str) -> Result<usize> {
    let text = std::fs::read_to_string(path)
        .with_context(|| format!("could not read frame log {path}"))?;
    let mut good = 0;
    for (i, line) in text.lines().enumerate() {
        let bytes = parse_hex_line(line)
            .with_context(|| format!("line {} of {path}", i + 1))?;
        parse_frame(&bytes).with_context(|| format!("line {} of {path}", i + 1))?;
        good += 1;
    }
    if good == 0 {
        bail!("{path} holds no frames");
    }
    Ok(good)
}

fn main() -> Result<()> {
    let path = std::env::args().nth(1).unwrap_or("frames.txt".to_string());
    let n = count_good_frames(&path)?;
    println!("{n} good frames");
    Ok(())
}
```

Here `errs` is the name of the package, whose `src/lib.rs` holds the thiserror library above and whose `src/main.rs` is this program. The new pieces:

- `anyhow::Result<T>` is short for `Result<T, anyhow::Error>`. Any error that implements `std::error::Error` converts into it with `?`, whether it is an I/O error, a `FrameError` or a `ParseIntError`.
- `.with_context(|| ...)` wraps an error in a sentence saying what the program was trying to do. The closure only runs if there is an error, so the `format!` costs nothing on success. `.context("fixed text")` is the version for a message that needs no formatting.
- `bail!(...)` returns early with a new error made from a message. It is shorthand for `return Err(anyhow!(...))`.
- When `main` returns `Err`, Rust prints `Error:` followed by the error's `Debug` form, and exits with code 1. anyhow's `Debug` form prints the whole chain of causes.

::: example Five log files through the tool
Each file holds one frame per line. `bad.txt` has a corrupted third line; `hex.txt` has `ZZ` where a byte should be; `empty.txt` is empty; `missing.txt` does not exist.

```text
$ errs good.txt
2 good frames

$ errs bad.txt
Error: line 3 of bad.txt

Caused by:
    bad checksum: expected 0x82, found 0x83

$ errs hex.txt
Error: line 2 of hex.txt

Caused by:
    0: not a hex byte
    1: invalid digit found in string

$ errs empty.txt
Error: empty.txt holds no frames

$ errs missing.txt
Error: could not read frame log missing.txt

Caused by:
    No such file or directory (os error 2)
```

(With `RUST_BACKTRACE=1` set, anyhow also prints where each error was created. These runs had it off.)

Read the `hex.txt` report from top to bottom. It is a story told from the outside in. The outermost layer is the context this program added: line 2 of the file. Below it, cause 0 is the library's `FrameError::BadHex`, displayed as "not a hex byte". Below that, cause 1 is the standard library's `ParseIntError`, which thiserror kept as the `source()`. Each layer was added by a different piece of code, and none of them had to know about the others.

Check `good.txt` by hand: its lines are `00 64 0A 14 82` (checked in the last example) and `00 C8 FF C7`. For the second, $0 + 200 + 255 = 455$, and $455 - 256 = 199 =$ `0xC7`, so it passes; `0x00C8` $= 200$ is a known APID. Two good frames, as printed.
:::

For a one-line log entry, format the error with `{:#}`, read "alternate display". It prints the chain joined by colons. An error made with `.context("frame from the S-band link")` around a bad checksum prints as `frame from the S-band link: bad checksum: expected 0x82, found 0x83`.

### What a library's callers lose with anyhow

Suppose `parse_frame` itself returned `anyhow::Result`. A caller that wants to ask for a resend on a bad checksum now holds an `anyhow::Error`: a box that could contain anything. The compiler no longer knows which failures are possible, so there are no variants to `match` on and no warning when a new failure is added. The caller can still guess the type and look inside:

```rust
if let Some(FrameError::BadChecksum { .. }) = err.downcast_ref::<FrameError>() {
    println!("it was a checksum error after all");
}
```

That works, but it is a guess the compiler cannot check. If the library later wraps its error differently, the guess silently stops matching, and resends quietly stop happening. This loss is called **[[type erasure|type-erasure]]**: the concrete type is erased, and only "some error" remains.

::: key thiserror versus anyhow
thiserror derives a typed error enum for a library, so callers can match on the cases. anyhow provides a single boxed error with context for an application, where the caller only reports. Libraries use the first, binaries the second.
:::

::: warning The rule is about who calls you
"Library" here means any code whose caller might want to react to specific failures: a sensor driver, a frame parser, an orbit propagator. "Application" means the top of the program: `main`, a command-line tool, a test harness. One package often holds both, as `errs` did. The lib side exposes `FrameError`; the binary side uses anyhow and adds context.
:::

## Panics: stopping on purpose

Now the other kind of failure. When a panic happens, by default Rust does three things. It prints a message saying what went wrong and at which file and line. It **[[unwinds|unwinding]]** the thread: it walks back up through every function that was running, and runs the cleanup (`Drop`) of every value those functions owned. And if the panicking thread is the main thread, the process then exits with code 101.

::: example A throttle table and a bad index
A table maps four throttle settings to percent of rated thrust. A `Valve` value prints a line when dropped, as in lesson 01.

```rust
struct Valve(&'static str);

impl Drop for Valve {
    fn drop(&mut self) {
        println!("closing {}", self.0);
    }
}

// Percent of rated thrust for throttle settings 0, 1, 2 and 3.
const THROTTLE_TABLE: [u32; 4] = [0, 40, 70, 100];

fn thrust_pct(setting: usize) -> u32 {
    THROTTLE_TABLE[setting]
}

fn main() {
    let _valve = Valve("LOX main");
    for setting in [2, 4] {
        println!("setting {setting}: {}% thrust", thrust_pct(setting));
    }
    println!("end of main");
}
```

```text
setting 2: 70% thrust

thread 'main' (8987) panicked at src/main.rs:13:5:
index out of bounds: the len is 4 but the index is 4
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
closing LOX main
```

The exit code was 101. Step through it.

1. Setting 2 is index 2 of `[0, 40, 70, 100]`, counting from 0, which is $70$.
2. Setting 4 would be a fifth entry. Indexes run from 0 to 3, so Rust's bounds check fires and panics, naming line 13, the index and the length.
3. Unwinding begins. `thrust_pct` owned nothing. `main` owned `_valve`, so its `Drop` runs: "closing LOX main".
4. "end of main" never prints. The program did not stagger on with a made-up thrust value.

Sanity check against C: reading `table[4]` from a four-entry C array is undefined behavior. It might return whatever bytes sit after the table, and the program would command that thrust.
:::

Some panics are written in plain sight: `panic!("...")`, `assert!`, `unreachable!()`, `todo!()`, `unwrap()`, `expect()`. Others hide inside ordinary-looking operations:

- indexing out of range, `v[i]`, and slicing out of range, `&v[a..b]`;
- integer division or remainder by zero (float division by zero gives infinity instead, and does not panic);
- integer overflow in a debug build;
- `RefCell::borrow_mut` while another borrow is live (lesson 05);
- slicing a `String` in the middle of a multi-byte character.

Each has a non-panicking twin: `.get(i)`, `checked_div`, `checked_add`, `try_borrow_mut`, and so on, all returning `Option` or `Result`.

## unwrap and expect discipline

`unwrap()` on an `Option` or `Result` means "give me the value; if there is none, panic". `expect("message")` does the same with your message. Each one is a claim: *this cannot fail*. Flight teams treat every such claim like a signature on a form: someone must be able to say why it is true.

The rules most teams settle on:

1. **In tests, anything goes.** A test that panics fails, which is exactly what you want. `unwrap` is normal there.
2. **In prototypes and throwaway tools**, `unwrap` is a fine placeholder, as long as it gets revisited.
3. **In production code, prefer `expect` to `unwrap`, and only for a proven invariant.** Write the message as the fact that should have been true, not as a cry of pain. `expect("mode table is loaded before the loop starts")` tells whoever reads the crash report which assumption broke. `expect("failed")` tells them nothing.
4. **Never for outside input.** If the value came from a sensor, a file or the radio, handle the `Err`.

Clippy can enforce this. Its "restriction" group has lints that are off by default and that a flight crate can switch on with one attribute at the top of `lib.rs`. `#![deny(...)]` turns the named lints into errors for the whole crate.

With that line at the top, here is a small library file:

```rust
#![deny(clippy::unwrap_used, clippy::expect_used, clippy::indexing_slicing, clippy::panic)]

pub fn first_reading(buf: &[f64]) -> f64 {
    buf[0]
}

pub fn parse_rate(s: &str) -> f64 {
    s.parse().unwrap()
}
```

It compiles with plain `cargo build`, but `cargo clippy` rejects both functions (trimmed):

```text
error: indexing may panic
 --> src/lib.rs:4:5
  |
4 |     buf[0]
  |     ^^^^^^
  |
  = help: consider using `.get(n)` or `.get_mut(n)` instead

error: used `unwrap()` on a `Result` value
 --> src/lib.rs:8:5
  |
8 |     s.parse().unwrap()
  |     ^^^^^^^^^^^^^^^^^^
  |
  = note: if this value is an `Err`, it will panic
```

Where one `expect` really is justified, you allow it for that single line with `#[allow(clippy::expect_used)]` and a comment giving the reason. The exception is then written down, in the code, where a reviewer will see it.

::: warning expect is not error handling
Replacing every `unwrap()` with `expect("...")` makes the crash message nicer. It does not make the program crash less. If the value can really be missing, the fix is a `match`, a default, or a `?`, not a better message.
:::

## panic = abort

Unwinding is useful on a desktop. On a flight computer, most teams switch it off. You do it in `Cargo.toml`:

```toml
[profile.dev]
panic = "abort"

[profile.release]
panic = "abort"
```

Now a panic prints its message and then **aborts**: the process stops immediately. No unwinding, no `Drop`. Run the throttle program again with this setting:

```text
setting 2: 70% thrust

thread 'main' (9019) panicked at src/main.rs:13:5:
index out of bounds: the len is 4 but the index is 4
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

"closing LOX main" is gone, and the shell reports exit status 134, which on Linux means the process was stopped by the **[[abort signal|exit-codes]]**. Why would anyone want less cleanup? Because of what unwinding costs.

- **Machinery.** To unwind, the compiler emits tables describing every function's cleanup, plus extra code paths (called landing pads) that run the drops. The binary gets bigger, and the unwinder itself is a piece of runtime code that must be carried and trusted.
- **An extra path through the code.** Every call that might panic has a hidden second exit: the unwind path. Reviewers and analysis tools must reason about code that runs only while the program is already broken. How long it takes depends on how deep the stack is and what the drops do, so it has no fixed upper bound.

This is exactly the objection flight-software standards raise against C++ exceptions, and why many flight C++ codebases are built with `-fno-exceptions` and follow coding rules like **[[the JSF standard|no-exceptions-in-flight]]**.

::: key Why flight-style Rust sets panic = abort
Unwinding requires runtime machinery and creates an unbounded control-flow path, exactly the objection to C++ exceptions. Aborting makes the failure immediate and analysable, and usually hands recovery to a watchdog.
:::

"Hands recovery to a watchdog" deserves a word. The flight computer does not try to repair itself from the inside after a bug. A **[[watchdog|watchdog]]**, a separate hardware timer, resets the computer when the software stops checking in, and the system comes back up in a known state. Before the abort, you can still save evidence. A **panic hook** is a function Rust calls with the panic's details before it aborts or unwinds:

```rust
use std::panic;

fn main() {
    panic::set_hook(Box::new(|info| {
        let place = info
            .location()
            .map(|l| format!("{}:{}", l.file(), l.line()))
            .unwrap_or_default();
        // A flight program would write this to a crash record in
        // non-volatile memory, then let the watchdog reset the computer.
        let msg = info.payload_as_str().unwrap_or("(no message)");
        eprintln!("CRASH RECORD: {msg} at {place}");
    }));

    let mode: Option<u8> = None;
    let m = mode.expect("mode table is loaded before the loop starts");
    println!("{m}");
}
```

```text
CRASH RECORD: mode table is loaded before the loop starts at src/bin/hook.rs:16
```

The hook replaced the default message. The `expect` message landed in the crash record word for word, which is why rule 3 above asks for a useful one. Then the process aborted, with exit status 134 as before. In the next module, on a microcontroller with no operating system, you will write a `#[panic_handler]` function that plays this role.

Two related facts. First, `std::panic::catch_unwind` can stop an unwinding panic at a chosen point, but it is meant for boundaries such as a thread pool or a call from C, not for ordinary error handling, and under `panic = "abort"` there is nothing to catch. Second, the test runner in `cargo test` needs unwinding to report one failing test and keep running the rest, so Cargo ignores the `panic` setting when building tests. A test marked `#[should_panic]` still works in a crate that aborts in production.

::: note Why Result and abort fit together
In C++, exceptions do two jobs at once: they report ordinary failures (a file is missing) and they report bugs (an invariant is broken). Turning exceptions off with `-fno-exceptions` takes away both, so C++ flight code falls back to error codes, which are easy to ignore. Rust splits the jobs. Ordinary failures travel as `Result` values: they cost no hidden control flow, they appear in every function signature, and the compiler warns if you ignore one (`Result` is marked `#[must_use]`). Only bugs use the panic path. So switching the panic path to abort loses nothing a correct program needs. That split is what lets Rust take the flight-software position on exceptions without giving up good error reporting.
:::

## Check yourself

::: check
For each failure, say whether it should be a `Result` error or a panic, and why. (a) A ground command asks for a thruster number 9 on a vehicle with 8 thrusters. (b) A private helper is called with an index that the calling function computed as `i % 8`, and the helper's table has 8 entries, but the index is 8. (c) The magnetometer's I2C read times out.
:::

::: answer
(a) A `Result` error. The number came from outside, from the ground, and the right reaction is to reject the command and report it, not to crash the flight computer. (b) A panic. `i % 8` can only produce 0 to 7, so an 8 means the code computing it is not the code you think it is: a bug. Stopping is the honest response. (c) A `Result` error. Timeouts are a normal event for a bus device, and the caller can retry, skip the sample, or mark the sensor unhealthy.
:::

::: check
Write the thiserror attribute line and variant for an error `Timeout` that carries the number of milliseconds waited in a field `ms`, and prints as `sensor timed out after 25 ms` when `ms` is 25. Then say what code the derive generates for it.
:::

::: answer
```rust
#[error("sensor timed out after {ms} ms")]
Timeout { ms: u32 },
```

The derive generates the `Display` arm, equivalent to `SensorError::Timeout { ms } => write!(f, "sensor timed out after {ms} ms")`, and (once for the whole enum) `impl std::error::Error`. Since there is no `#[from]` or `#[source]`, `source()` returns `None` for this variant.
:::

::: check
A teammate's orbit-propagation library returns `anyhow::Result<State>` from `propagate`. The mission-planning tool that calls it needs to retry with a smaller step when the integrator fails to converge, but give up on any other error. What goes wrong, and what should the library do instead?
:::

::: answer
The planning tool receives an `anyhow::Error`, which has erased the concrete type. It cannot `match` on "did not converge", so it must either guess the inner type with `downcast_ref` or compare message text, and both break silently if the library changes how it builds its errors. The library should expose a typed enum, for example `PropagateError::NoConvergence { step_s: f64 }` alongside the other cases, derived with thiserror. The tool can then match `NoConvergence` and retry, and the compiler will point out every `match` that needs updating when a variant is added.
:::

::: check
A program with `panic = "abort"` panics while it holds a `BufWriter<File>`, a writer that collects output in memory and passes it to the file in large pieces, with 100 bytes still waiting in its buffer. What happens to its `Drop`, which would normally flush those bytes? Explain why that is acceptable on a flight computer.
:::

::: answer
It does not run. Abort stops the process at once, with no unwinding, so no destructors run. The operating system still closes the file handle when the process ends, but the 100 bytes in the `BufWriter`'s memory are never written: they are lost. It is acceptable because the design never relies on cleanup during a failure: state that must survive is written to non-volatile memory at known points during normal operation (or in the panic hook), and the watchdog brings the system back to a known state. Cleanup code that runs only while the program is already broken is exactly the path flight teams prefer not to have.
:::

::: check
Find the hidden panics in this function, and rewrite it so it cannot panic.

```rust
fn mean_rate(samples: &[i32], count: usize) -> i32 {
    let total: i32 = samples[..count].iter().sum();
    total / count as i32
}
```
:::

::: answer
There are three. `samples[..count]` panics if `count` is larger than `samples.len()`. The division panics if `count` is 0. And in a debug build the sum can overflow an `i32` and panic. A version that cannot panic returns an `Option`:

```rust
fn mean_rate(samples: &[i32], count: usize) -> Option<i32> {
    let window = samples.get(..count)?;
    let total: i64 = window.iter().map(|&x| x as i64).sum();
    total.checked_div(count as i64).map(|m| m as i32)
}
```

`get(..count)` returns `None` if the range is out of bounds, and `?` passes it on. Summing into an `i64` makes overflow impossible for any slice that fits in memory. `checked_div` returns `None` for a zero divisor. The mean of `i32` values always fits back into an `i32`, so the final cast is safe.
:::

## Summary

| Idea | Tool | Fact |
|---|---|---|
| Recoverable failure | `Result<T, E>` | The caller decides; outside input always lands here |
| Bug | panic | Message, then unwind (exit 101) or abort (SIGABRT) |
| Library error | enum + `Display` + `std::error::Error` | Callers `match` on variants |
| thiserror | `#[derive(Error)]`, `#[error("...")]`, `#[from]` | Generates the impls; `#[from]` also sets `source()` |
| anyhow | `anyhow::Result`, `.context()`, `bail!` | One boxed error with a chain of causes; type erased |
| `expect` | `.expect("invariant that should hold")` | Only for proven invariants; never for outside input |
| Clippy restriction lints | `unwrap_used`, `expect_used`, `indexing_slicing`, `panic` | Turn hidden panics into review items |
| `panic = "abort"` | `[profile.*]` in `Cargo.toml` | No unwinding; failure is immediate; a watchdog recovers |

Errors are values, so they can be tested like values. The last lesson of this module is about testing: unit and integration tests, benchmarks, property tests, fuzzing, and miri, and then a map of every idea in the module back to its C++ equivalent.

::: context panic-recap What you already know about panics
In the previous module you saw panics from integer overflow in a debug build, from indexing past the end of an array, and from `unwrap` on `None`. Each one printed a file and line and stopped the program with exit code 101. That module promised a fuller story about when to panic and when to return an error. This lesson is that story.
:::

::: context apid-toy A toy frame, not a real packet
Real spacecraft packets use the CCSDS Space Packet header from lesson 04, whose APID is 11 bits wide inside a 6-byte header, with a length field and a sequence count. The frame here is deliberately smaller: a 16-bit identifier, a payload, and a one-byte sum. It keeps the arithmetic short enough to check by hand, while the error handling is exactly what a real parser needs. Real links usually protect frames with a CRC, a stronger check than a plain sum, because a sum cannot notice two bytes swapping places.
:::

::: context wrapping-sum Why the sum wraps
A `u8` holds 0 to 255. Adding `0xC8` (200) and `0xFF` (255) gives 455, which does not fit. With the ordinary `+`, a debug build would panic on that overflow. `wrapping_add` says the wraparound is intended: 455 becomes $455 - 256 = 199$. Keeping only the lowest 8 bits of a sum is the whole idea of this checksum, so here the wrap is the correct answer, not an accident. Writing `wrapping_add` makes that intent visible to a reader and identical in debug and release builds.
:::

::: context proc-macro Code that writes code
A procedural macro is a small Rust program that the compiler runs while compiling yours. It receives the source of your enum, and it hands back new source: here, the `Display` and `Error` impls. `#[derive(Debug)]` works the same way, but is built in. thiserror and anyhow were both written by David Tolnay, who also maintains `serde` and `syn`, the libraries most Rust macros are built on. Because the macro only runs at compile time, thiserror adds nothing to the finished program that you could not have typed yourself.
:::

::: context type-erasure A box with the label torn off
`anyhow::Error` is a single pointer, 8 bytes on a 64-bit machine, to a heap box that holds the real error, its chain of context, and a small table of functions for printing it. The type of the thing inside is known only at runtime. Code outside can ask "are you a `FrameError`?" with `downcast_ref`, but the compiler cannot list the possibilities. A typed enum (16 bytes for `FrameError`, no heap) keeps the full list of failures in the type, where `match` can check it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="20" y="20" font-size="12" fill="#1f2a44">typed enum: compiler sees every case</text>
  <rect x="20" y="30" width="95" height="26" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="67" y="47" font-size="11" text-anchor="middle" fill="#1f2a44">TooShort</text>
  <rect x="115" y="30" width="95" height="26" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="162" y="47" font-size="11" text-anchor="middle" fill="#1f2a44">BadChecksum</text>
  <rect x="210" y="30" width="95" height="26" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="257" y="47" font-size="11" text-anchor="middle" fill="#1f2a44">UnknownApid</text>
  <text x="20" y="86" font-size="12" fill="#1f2a44">anyhow::Error: one pointer to a box</text>
  <rect x="20" y="98" width="70" height="30" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="55" y="117" font-size="11" text-anchor="middle" fill="#1f2a44">8 bytes</text>
  <line x1="90" y1="113" x2="164" y2="113" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="170,113 160,108 160,118" fill="#1d6fd1"/>
  <rect x="170" y="96" width="170" height="34" fill="#f2b880" stroke="#1f2a44"/>
  <text x="255" y="117" font-size="11" text-anchor="middle" fill="#1f2a44">some error + context</text>
  <text x="255" y="144" font-size="11" text-anchor="middle" fill="#b4232c">which type? only at runtime</text>
</svg>
```
:::

::: context unwinding Walking back up the stack
Picture the call stack as a pile of trays, one per function that is running. When a panic starts in the top function, unwinding lifts the trays off one at a time, from the top down, and runs the `Drop` for every value on each tray before throwing it away. When it reaches the bottom of the thread, the thread is finished. To do this, the compiler must record for every function where its cleanup code is, so the program carries tables for that, plus the code that reads them.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="40" y="20" width="160" height="34" fill="#f2b880" stroke="#1f2a44"/>
  <text x="120" y="41" font-size="12" text-anchor="middle" fill="#1f2a44">thrust_pct: panics</text>
  <rect x="40" y="62" width="160" height="34" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="120" y="83" font-size="12" text-anchor="middle" fill="#1f2a44">main: owns _valve</text>
  <rect x="40" y="104" width="160" height="34" fill="#fff" stroke="#1f2a44"/>
  <text x="120" y="125" font-size="12" text-anchor="middle" fill="#1f2a44">runtime start</text>
  <line x1="222" y1="32" x2="222" y2="118" stroke="#b4232c" stroke-width="2"/>
  <polygon points="222,126 217,116 227,116" fill="#b4232c"/>
  <text x="234" y="44" font-size="11" fill="#b4232c">1. nothing to drop</text>
  <text x="234" y="84" font-size="11" fill="#b4232c">2. drop _valve</text>
  <text x="234" y="124" font-size="11" fill="#b4232c">3. exit code 101</text>
  <text x="40" y="160" font-size="11" fill="#6c7a93">abort skips all three steps: the process stops at once</text>
</svg>
```
:::

::: context exit-codes What 101 and 134 mean
When a program ends, it hands the operating system a small number, its exit status. Zero means success. Rust uses 101 for "the main thread panicked" and 1 for "`main` returned an error". When a process is killed by a signal instead, a Linux shell reports 128 plus the signal number. The abort signal, SIGABRT, is number 6, so $128 + 6 = 134$. A script or a test harness can tell these apart without reading any text.
:::

::: context no-exceptions-in-flight Exceptions in flight C++
The Joint Strike Fighter Air Vehicle C++ Coding Standard, written for the F-35's software, forbids C++ exceptions outright (its rule 208), because the timing and control flow of a thrown exception are hard to bound and analyze. Many other embedded and flight C++ codebases compile with `-fno-exceptions` for the same reasons. Newer C++ has `std::expected` (C++23), a return type that holds a value or an error, much like Rust's `Result`.
:::

::: context watchdog A timer that must be fed
A watchdog is a hardware counter that counts down on its own. Healthy software "kicks" it, resetting the count, every cycle of its main loop. If the software hangs, crashes or aborts, the kicks stop, the counter reaches zero, and the watchdog resets the processor. Because it is separate hardware, it works even when the software is completely lost. Spacecraft pair it with safe modes: after an unexpected reset, the software boots into a simple, power-positive, Sun-pointing configuration and waits for the ground.
:::
