---
id: l08-derive-cfg-doc-tests-and-clippy
title: derive, cfg, doc tests and clippy
minutes: 24
covers:
  - derive macros; cfg attributes; doc tests
  - clippy as a teaching tool
---

Imagine a school office that uses rubber stamps. Instead of writing "RECEIVED, checked by the office" by hand on every form, someone presses a stamp and the whole line appears, the same every time. Imagine too that some pages of the school handbook carry a sticky note: "only in the winter edition". And imagine a cookbook where the printer actually cooks every recipe before each new printing, so a recipe with a missing ingredient never gets printed again.

Rust has all three. **`derive`** is the rubber stamp: one line that asks the compiler to write routine code for you. **`cfg`** is the sticky note: code that exists only in some builds. **Doc tests** are the cookbook that gets cooked: examples in your documentation that `cargo test` compiles and runs. And there is a fourth tool, **clippy**, which is like a patient coach reading over your shoulder, pointing out every line that still sounds like C++ with Rust spelling.

These tools turn the language of the last seven lessons into a working library. The module's unit-conversion exercise uses them all: a `ConvError` with `#[derive(Debug, PartialEq)]`, a test module behind `#[cfg(test)]`, and documentation whose examples run. On a flight-software team they stamp out telemetry structs, switch between real and simulated sensors, and keep a large codebase consistent.

## Attributes: notes to the compiler

Three of these tools are written as an **attribute**, and clippy is tuned with them too. An attribute is a note to the compiler, written `#[...]` directly above the thing it applies to. Read `#[derive(Debug)]` as "attribute derive Debug". You have already met two: `#[test]` in lesson 01, which marks a function as a test, and `#[inline(never)]` in the last lesson.

A version with an exclamation mark, `#![...]`, applies to the whole file or module it sits inside, instead of the next item. It usually appears at the very top of a file. You will see it as `#![allow(...)]` or, later in the course, as `#![no_std]` at the top of embedded code. The difference between the two is a common [[source of confusion|attribute-bang]].

## `derive`: have the compiler write the routine code

Take a three-component vector for a position or velocity:

```rust
struct Vec3 {
    x: f64,
    y: f64,
    z: f64,
}
```

You would like to print it, compare two of them with `==`, copy one, and get a zero vector for free. Each of those is a **trait** — an ability a type can have — and each needs code. For `==` the code is dull: compare `x` with `x`, `y` with `y`, `z` with `z`. Written by hand, the fragment looks like this:

```rust
impl PartialEq for Vec3 {
    fn eq(&self, other: &Self) -> bool {
        self.x == other.x && self.y == other.y && self.z == other.z
    }
}
```

Easy for three fields — and easy to get wrong when someone adds a fourth and forgets this function. **`derive`** asks the compiler to write it for you, field by field, from the struct's own definition:

```rust
#[derive(Debug, Clone, Copy, PartialEq, Default)]
struct Vec3 {
    x: f64,
    y: f64,
    z: f64,
}
```

Add a field and the derived code grows to match, automatically. `derive` is a **[[macro|macro-kinds]]**: code that writes code while your program compiles. `println!` is a macro too — the `!` tells you so — but `derive` is a different kind that lives inside an attribute.

### The traits you will derive most

- **`Debug`** — lets you print the value with `{:?}`, or `{:#?}` for a spread-out, "pretty" version. For logs, tests and debugging, not for users.
- **`Clone`** — gives the type a `.clone()` method that makes a full, independent copy.
- **`Copy`** — makes plain assignment `let w = v;` copy the value instead of moving it, so `v` stays usable. Only allowed if every field is itself `Copy` (numbers, `bool`, `char`, and other `Copy` types). A type that is `Copy` must also be `Clone`.
- **`PartialEq`** — lets you use `==` and `!=`.
- **`Eq`** — a promise that `==` is a true equality: every value equals itself.
- **`PartialOrd`** and **`Ord`** — let you compare with `<` and `>`, and sort. For an enum, the order is the order the variants are written in.
- **`Hash`** — lets the type be a key in a `HashMap`.
- **`Default`** — gives a `Type::default()` that fills every field with its default: zero for numbers, `false` for `bool`, empty for `String` and `Vec`.

::: example Stamping out a vector and a vehicle mode
```rust
#[derive(Debug, Clone, Copy, PartialEq, Default)]
struct Vec3 {
    x: f64,
    y: f64,
    z: f64,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
enum Mode {
    Prelaunch,
    Ascent,
    Coast,
}

fn main() {
    let v = Vec3 { x: 1.0, y: -2.5, z: 0.0 };
    let w = v; // Copy: v is still usable afterwards
    println!("{:?}", v);
    println!("{:#?}", w);
    println!("equal? {}", v == w);
    println!("default = {:?}", Vec3::default());
    println!("Ascent < Coast? {}", Mode::Ascent < Mode::Coast);
    let mut modes = vec![Mode::Coast, Mode::Prelaunch, Mode::Ascent];
    modes.sort();
    println!("sorted = {:?}", modes);
}
```

```text
Vec3 { x: 1.0, y: -2.5, z: 0.0 }
Vec3 {
    x: 1.0,
    y: -2.5,
    z: 0.0,
}
equal? true
default = Vec3 { x: 0.0, y: 0.0, z: 0.0 }
Ascent < Coast? true
sorted = [Prelaunch, Ascent, Coast]
```

`let w = v;` copied the vector, because of `Copy`; without it, `v` would have been moved into `w` and the next line would not compile. `{:?}` printed it on one line and `{:#?}` spread it out, both thanks to `Debug`. `==` compared all three fields. `Vec3::default()` filled every field with `0.0`. For `Mode`, the derived order follows the order the variants are declared, so `Ascent` comes before `Coast` and `sort` puts them in flight order.

Notice what the vector did not derive: `Eq`, `Ord` or `Hash`. That was not forgetfulness, as the next warning shows.
:::

::: warning Floats cannot promise `Eq`
Add `Eq` to a struct with an `f64` field and the compiler stops you: the trait `Eq` is not implemented for `f64`. `Eq` promises that every value equals itself. A float cannot keep that promise, because of NaN ("not a number"): `f64::NAN == f64::NAN` is `false`. So structs of floats get `PartialEq` but not `Eq`, and for the same reason not `Ord` or `Hash` either. That is also why you cannot use a float as a `HashMap` key or call `max()` on floats, as the last lesson showed. It is the same [[NaN rule|nan-rule]] C++ follows, now enforced by the type system.
:::

### Why the unit-conversion error type derives two traits

The module exercise defines its error like this:

```rust
#[derive(Debug, PartialEq)]
pub enum ConvError {
    BadNumber(String),
    UnknownUnit(String),
}
```

Both traits are there for the tests. A test checks the error with `assert_eq!(result, Err(ConvError::UnknownUnit("xyz".to_string())))`. The macro `assert_eq!` needs two things from the type: `PartialEq`, to compare the two sides, and `Debug`, to print both sides if they differ. Leave out `Debug` and the error says so directly:

```text
error[E0277]: `ConvError` doesn't implement `Debug`
  = note: add `#[derive(Debug)]` to `ConvError` or manually `impl Debug for ConvError`
```

`Copy` is not derived, because the variants hold a `String`, which owns heap memory and cannot be copied bit for bit. Try it and the compiler points at the field, saying that this field does not implement `Copy`.

::: key Derive what the type needs
`#[derive(...)]` asks the compiler to write standard trait implementations field by field. `Debug` for `{:?}`, `PartialEq` for `==`, `Clone`/`Copy` for copying, `Default` for a zero value. `assert_eq!` needs both `PartialEq` and `Debug`. Floats allow `PartialEq` but not `Eq`, `Ord` or `Hash`.
:::

## `cfg`: code that exists only in some builds

Sometimes you want two versions of some code and exactly one in each build: a flight computer reads a real altimeter, a laptop simulation reads a made-up value. And you want tests compiled when you test, and left out of the flight build.

The attribute **`#[cfg(...)]`** (read "config") does this. It puts a condition on the item below it. If the condition is true for this build, the item is compiled. If not, the compiler throws it away before even checking it, as if it had never been written. This is called [[conditional compilation|conditional-compilation]].

The conditions you will meet first:

- `test` — true while `cargo test` is building.
- `debug_assertions` — true in the dev profile, false in release (lesson 01's profiles).
- `feature = "name"` — true if that Cargo feature is switched on (also lesson 01).
- `target_os = "linux"`, `target_arch = "arm"` and friends — true when building for that system.
- `not(...)`, `all(...)`, `any(...)` — combine the others.

There is also a macro form, `cfg!(...)`, which does not delete anything. It becomes a plain `true` or `false` that ordinary code can test.

::: example One program, two builds
The package declares a feature in `Cargo.toml`:

```text
[features]
sim-sensors = []
```

And `src/main.rs`:

```rust
// Two versions of the same function; the build picks exactly one.
#[cfg(feature = "sim-sensors")]
fn read_altimeter_m() -> f64 {
    1234.5 // canned value for simulation runs
}

#[cfg(not(feature = "sim-sensors"))]
fn read_altimeter_m() -> f64 {
    0.0 // stands in for code that talks to the real sensor
}

fn main() {
    println!("altimeter      = {} m", read_altimeter_m());
    println!("debug checks   = {}", cfg!(debug_assertions));

    #[cfg(target_os = "linux")]
    println!("built for      = linux");

    let dt_s = 0.01;
    debug_assert!(dt_s > 0.0, "time step must be positive");
}
```

Run it twice:

```text
--- cargo run
altimeter      = 0 m
debug checks   = true
built for      = linux
--- cargo run --release --features sim-sensors
altimeter      = 1234.5 m
debug checks   = false
built for      = linux
```

In the first build the feature is off, so only the second `read_altimeter_m` exists. In the second, only the first exists. Two functions with the same name never clash, because the compiler only ever sees one.

`cfg!(debug_assertions)` flipped from `true` to `false` when `--release` was added. The `debug_assert!` on the last line follows the same switch: it checks the time step in dev builds and is compiled away in release — exactly like C++'s `assert` under `NDEBUG`.
:::

### The test module

Now you can read the block at the bottom of the unit-conversion exercise, word by word:

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn unknown_unit_is_reported() {
        assert_eq!(
            parse_and_convert("10 xyz"),
            Err(ConvError::UnknownUnit("xyz".to_string()))
        );
    }
}
```

- `#[cfg(test)]` — compile what follows only when testing. A normal `cargo build` never sees it, so tests add nothing to the program you ship.
- `mod tests { ... }` — a module named `tests` (lesson 05), a room of its own inside the file.
- `use super::*;` — "bring in everything from the module one level up". `super` means the parent module — here, the file that contains the functions being tested. Because `tests` is inside that file, it can also reach private items.
- `#[test]` — this function is a test. `cargo test` runs it, and it passes unless it panics.

This layout — tests in the same file as the code, in a `cfg(test)` module — is how almost every Rust library does [[unit tests|test-module-picture]].

::: key cfg attributes
`#[cfg(condition)]` compiles the item below only when the condition holds, and deletes it otherwise. `#[cfg(test)] mod tests { use super::*; ... }` keeps unit tests out of normal builds. `cfg!(...)` is the macro form that gives a `bool` without deleting anything.
:::

::: warning Code behind a `cfg` is not checked when it is off
The compiler discards a disabled item before checking it. So a typo inside `#[cfg(feature = "sim-sensors")]` goes unnoticed until someone builds with that feature — maybe months later, on the day of a simulation campaign. Build and test every feature combination you ship, which a CI job can do for you.
:::

## Doc tests: examples that cannot rot

Rust documentation is written in Markdown in comments that start with three slashes, `///`, directly above the item they describe. `cargo doc` turns them into a website, the kind you see for every crate on [[docs.rs|docs-rs]]. A `//!` comment documents the file or module it sits inside, rather than the next item.

The clever part: any code block in a doc comment is also a test. `cargo test` pulls each one out, compiles it as a small program of its own, and runs it. That is a **doc test**. If the example does not compile, or panics, the test fails.

::: key What is a doc test?
A code example in a documentation comment that cargo test compiles and runs. It makes the documentation executable, so an example cannot silently rot as the API changes.
:::

::: example Documenting a conversion so the example is checked
Here is `src/lib.rs` of a small library crate called `units08`:

```rust
//! Small unit conversions for ground tools.

/// Metres in one international foot (exact by definition).
pub const FT_TO_M: f64 = 0.3048;

/// Converts feet to metres.
///
/// # Examples
///
/// ```
/// use units08::ft_to_m;
///
/// let m = ft_to_m(12.5);
/// assert!((m - 3.81).abs() < 1e-12);
/// ```
pub fn ft_to_m(ft: f64) -> f64 {
    ft * FT_TO_M
}

/// Converts a temperature in rankine to kelvin.
///
/// ```
/// # use units08::rankine_to_kelvin;
/// assert_eq!(rankine_to_kelvin(900.0), 500.0);
/// ```
pub fn rankine_to_kelvin(r: f64) -> f64 {
    r * 5.0 / 9.0
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn zero_feet_is_zero_metres() {
        assert_eq!(ft_to_m(0.0), 0.0);
    }

    #[test]
    fn one_mile_in_metres() {
        // 5280 ft in a mile
        assert!((ft_to_m(5280.0) - 1609.344).abs() < 1e-9);
    }
}
```

First check the numbers the examples claim. $12.5 \times 0.3048 = 3.81$ m. $5280 \times 0.3048 = 1609.344$ m, the length of a mile. And $900 \times 5 / 9 = 500$ K.

`cargo test` runs both kinds of test (cargo 1.94.1, trimmed):

```text
running 2 tests
test tests::one_mile_in_metres ... ok
test tests::zero_feet_is_zero_metres ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests units08

running 2 tests
test src/lib.rs - rankine_to_kelvin (line 22) ... ok
test src/lib.rs - ft_to_m (line 10) ... ok
```

Two things to notice. The doc test calls the function as `units08::ft_to_m`, the way a user of the library would, because each doc test is compiled as a separate program outside the crate. And the line `# use units08::rankine_to_kelvin;` starts with `# `: the line still runs in the test, but it is hidden from the published documentation, which keeps the reader's view short.

Now rename `ft_to_m` to `feet_to_metres`, update the unit tests, and forget the doc comment. The unit tests pass. The doc test does not:

```text
test src/lib.rs - feet_to_metres (line 10) ... FAILED

error[E0432]: unresolved import `units08::ft_to_m`
  --> src/lib.rs:12:5
   |
12 | use units08::ft_to_m;
   |     ^^^^^^^^^-------
   |     |        |
   |     |        help: a similar name exists in the module: `FT_TO_M`
   |     no `ft_to_m` in the root
```

The documentation itself told you it was out of date, instead of waiting for a new teammate to copy the stale example.
:::

A few markers after the opening three backticks change how a doc test is treated. `should_panic` expects the example to panic — good for showing what bad input does. `compile_fail` expects the example not to compile — good for showing a mistake the type system catches. `no_run` compiles the example without running it, for code that would touch real hardware or the network. `ignore` skips it; use it rarely, since an ignored example can rot.

::: warning Doc tests need a library
Doc tests are run for library crates — code in `src/lib.rs` and its modules. Examples in the doc comments of a program's `src/main.rs` are not run. A common pattern is to keep almost all the code in `lib.rs`, tested and documented, with a thin `main.rs` that calls into it.
:::

## clippy: a coach that reads your code

The compiler's job is to check that your program is valid Rust. It does not tell you when valid code is clumsy, slow, or a little suspicious. **Clippy** does. It is a **[[linter|lint-word]]** — a tool that reads your code and flags patterns that are legal but probably not what you want — and it ships with the Rust toolchain. You run it with `cargo clippy`.

The clippy that comes with Rust 1.94 has 801 lints, sorted into groups. Most groups warn by default; the **correctness** group, for code that is almost certainly a bug, is an error by default. Two groups are off unless you ask: **pedantic**, stricter and more opinionated, and **restriction**, a menu of rules a project may choose to adopt.

::: key What does cargo clippy add over the compiler?
Several hundred lints about idiom, correctness and performance, from needless clones to suspicious comparisons. For a learner it is the fastest feedback loop from writing C++-flavored Rust to writing Rust.
:::

::: example Cleaning up C++-flavored Rust
Here is a function written by someone fresh from C++. It compiles, runs, and gives the right answer:

```rust
fn mean_thrust(samples: &Vec<f64>) -> f64 {
    if samples.len() == 0 {
        return 0.0;
    }
    let mut total = 0.0;
    for i in 0..samples.len() {
        total = total + samples[i];
    }
    return total / samples.len() as f64;
}

fn main() {
    let thrust_kn = vec![845.0, 851.5, 848.0];
    let armed = true;
    if armed == true {
        println!("mean thrust = {:.1} kN", mean_thrust(&thrust_kn));
    }
}
```

```text
mean thrust = 848.2 kN
```

The mean is $(845.0 + 851.5 + 848.0) / 3 = 2544.5 / 3 \approx 848.17$ kN, which prints as 848.2. Correct. Now run `cargo clippy`. It gives six warnings; here is the core of each (clippy 0.1.94, trimmed):

```text
warning: unneeded `return` statement            (needless_return)
warning: writing `&Vec` instead of `&[_]` involves a new object where a slice will do
                                                (ptr_arg)
warning: length comparison to zero              (len_zero)
  help: using `is_empty` is clearer and more explicit: `samples.is_empty()`
warning: the loop variable `i` is only used to index `samples`
                                                (needless_range_loop)
warning: manual implementation of an assign operation
  help: replace it with: `total += samples[i]` (assign_op_pattern)
warning: equality checks against true are unnecessary
  help: try: `armed`                            (bool_comparison)
```

Each warning is a small lesson from earlier in this module:

1. `&Vec<f64>` → `&[f64]`: take a slice, so the function also accepts arrays and parts of vectors. Same reasoning as `&str` over `&String` in lesson 03.
2. `len() == 0` → `is_empty()`: says what you mean.
3. The index loop → an iterator, from the last lesson. It removes the indexing and its bounds checks.
4. `return x;` at the end → `x` alone: in Rust the last expression of a block is its value.
5. `total = total + ...` → `+=`.
6. `armed == true` → `armed`: it is already a `bool`.

Here is the result. Clippy prints nothing for it, and the answer is unchanged:

```rust
fn mean_thrust(samples: &[f64]) -> f64 {
    if samples.is_empty() {
        return 0.0;
    }
    samples.iter().sum::<f64>() / samples.len() as f64
}

fn main() {
    let thrust_kn = vec![845.0, 851.5, 848.0];
    let armed = true;
    if armed {
        println!("mean thrust = {:.1} kN", mean_thrust(&thrust_kn));
    }
}
```

The early `return 0.0;` stays: it is in the middle of the function, where `return` is the right tool. Clippy only objected to the one on the last line.
:::

### Correctness lints catch real bugs

Style is not all clippy knows. Suppose you convert degrees to radians with a hand-typed pi:

```rust
fn deg_to_rad(d: f64) -> f64 {
    d * 3.14159 / 180.0
}
```

Clippy refuses to let this build:

```text
error: approximate value of `f{32, 64}::consts::PI` found
 --> examples/pi.rs:2:9
  |
2 |     d * 3.14159 / 180.0
  |         ^^^^^^^
  = help: consider using the constant directly
  = note: `#[deny(clippy::approx_constant)]` on by default
```

The error looks tiny: for 90 degrees the function returns 1.570795 instead of 1.5707963…, off by about $1.3 \times 10^{-6}$ rad. But in a navigation filter an error like that is applied every step and adds up. The fix is `std::f64::consts::PI`, or the built-in `d.to_radians()`. Another correctness lint, `eq_op`, rejects comparing a value with itself, such as `x != x` — an old C trick for spotting NaN, which in Rust should be `x.is_nan()`.

### Turning lints up, down and off

You control clippy with the same attributes as everything else in this lesson:

- `cargo clippy -- -W clippy::pedantic` turns on the pedantic group for one run. On the clean `mean_thrust`, it flags `samples.len() as f64`: converting a `usize` to `f64` can lose precision, because an `f64` holds integers exactly only up to $2^{53}$.
- `cargo clippy -- -D warnings` makes every warning an error. This is the usual line in a CI pipeline, so no warning can be merged.
- `#[allow(clippy::lint_name)]` on an item switches one lint off there. Better is `#[expect(...)]`, which does the same but warns if the lint stops firing, so stale exceptions do not pile up. Both take a `reason`:

```rust
#[expect(
    clippy::cast_precision_loss,
    reason = "sample counts stay far below 2^53"
)]
fn mean_thrust(samples: &[f64]) -> f64 {
```

With that in place, `cargo clippy -- -W clippy::pedantic -D warnings` passes. The reason is written where a reviewer — or an auditor — will see it, which matters on any team that has to [[justify every waiver|waivers-and-ci]].

::: warning Do not silence what you do not understand
When clippy flags something you do not follow, read the linked page before adding an `allow`: it explains why the pattern is a problem and shows the fix. A warning switched off unread is a lesson skipped.
:::

## Check yourself

::: check
A teammate writes `#[derive(Debug, Clone, Copy, PartialEq, Eq)]` on `struct GpsFix { lat_deg: f64, lon_deg: f64, sats: u8 }`. Which derive fails, why, and what should the line be?
:::

::: answer
`Eq` fails: the trait `Eq` is not implemented for `f64`. `Eq` promises that every value equals itself, and a float cannot keep that promise because NaN is not equal to NaN. `Debug`, `Clone`, `Copy` and `PartialEq` are all fine, because every field (`f64`, `f64`, `u8`) is `Copy` and comparable. The line should be `#[derive(Debug, Clone, Copy, PartialEq)]`.
:::

::: check
You deleted `Debug` from `#[derive(Debug, PartialEq)]` on `ConvError` because "we never print errors". Now the tests will not compile. Explain why.
:::

::: answer
The tests use `assert_eq!`, which compares its two sides with `==` (needing `PartialEq`) and, if they differ, prints both in the failure message with `{:?}` (needing `Debug`). So a type checked with `assert_eq!` needs `Debug` even if the program never prints it. The compiler says `ConvError` doesn't implement `Debug`, and suggests adding the derive back.
:::

::: check
What does `cargo build --release` include from a file containing `#[cfg(test)] mod tests { ... }`, a `debug_assert!`, and a function under `#[cfg(feature = "sim-sensors")]`, when no features are passed?
:::

::: answer
None of those three. The `tests` module exists only when `cfg(test)` is true, which is only under `cargo test`. `debug_assert!` checks only when `debug_assertions` is on, which the release profile turns off. And the feature-gated function is removed because the `sim-sensors` feature was not switched on. Because the compiler throws these away before checking them, a type error inside the feature-gated function would not even be reported by this build.
:::

::: check
A library's README shows `let v = orbit_utils::circular_speed(mu, r);`. Six months later the function becomes `circular_speed_m_s`. Compare what happens if the same example lives in a `///` doc comment on the function in `src/lib.rs`.
:::

::: answer
The README example is plain text: nothing checks it, so it silently goes stale. In a `///` doc comment the code block is a doc test: the next `cargo test` fails with a "cannot find function" error pointing at the documentation, so whoever renamed the function must fix the example in the same change.
:::

::: check
Clippy reports `needless_range_loop` on `for i in 0..v.len() { total += v[i]; }` and `ptr_arg` on the parameter `v: &Vec<f64>`. Rewrite the function header and body, and name one other good thing the rewrite gives you besides silencing the warnings.
:::

::: answer
Take a slice and use an iterator: `fn total(v: &[f64]) -> f64 { v.iter().sum() }`.

Besides silencing clippy, the function now accepts a `Vec`, an array, or part of either, because `&[f64]` is more general than `&Vec<f64>`. And with no index there is no index to get wrong.
:::

## Summary

| Tool | What it does | Fact to keep |
| --- | --- | --- |
| Attribute `#[...]` | a note to the compiler about the next item | `#![...]` applies to the whole file or module |
| `#[derive(...)]` | compiler writes trait impls field by field | `Debug`, `Clone`, `Copy`, `PartialEq`, `Eq`, `PartialOrd`, `Ord`, `Hash`, `Default` |
| Floats and `Eq` | `f64` is `PartialEq` only | NaN is not equal to itself, so no `Eq`, `Ord` or `Hash` |
| `assert_eq!` | compares and prints on failure | needs `PartialEq` and `Debug` |
| `#[cfg(...)]` | compile the item only if the condition holds | `test`, `debug_assertions`, `feature = "..."`, `target_os = "..."` |
| `#[cfg(test)] mod tests` | unit tests beside the code | `use super::*;` brings in the parent module |
| Doc test | a code block in a `///` comment | `cargo test` compiles and runs it; library crates only |
| `cargo clippy` | hundreds of lints beyond the compiler | correctness is deny by default; `-D warnings` in CI |
| `#[expect(lint, reason = "...")]` | a documented, self-checking exception | warns if the lint stops firing |

That completes the basics: you can now write, test, document and lint a small Rust library. The next module, on ownership, borrowing and lifetimes, explains the rules that have been quietly shaping every example so far — why `into_iter` used the collection up, why `move` was needed, and why `Copy` changes what `let w = v;` means.

::: context attribute-bang Outer and inner attributes
`#[...]` is an **outer attribute**: it applies to the item that comes after it. `#![...]` is an **inner attribute**: it applies to the item it sits inside, which is usually the whole file. So `#![allow(dead_code)]` at the top of `lib.rs` affects the whole crate, while `#[allow(dead_code)]` above one function affects only that function. The same rule explains `//!` versus `///` in doc comments: `//!` documents the thing you are inside, `///` documents the thing that follows.
:::

::: context macro-kinds Two kinds of macro
Rust has two kinds of macro. **Declarative macros**, written with `macro_rules!`, work by pattern matching on the code you pass in; `println!`, `vec!` and `assert_eq!` are of this kind, and you call them with a `!`. **Procedural macros** are small Rust programs that the compiler runs during the build; they receive your code as a stream of tokens and hand back new code. `derive` uses procedural macros. The standard ones like `Debug` come with the compiler, but any crate can provide its own: the popular `serde` crate supplies `#[derive(Serialize, Deserialize)]`, which writes the code to turn a struct into JSON and back — a common way to save and load simulation configurations.
:::

::: context nan-rule Why NaN breaks equality
Under the IEEE 754 floating-point standard, which C, C++, Python and Rust all follow, NaN — "not a number", the result of things like $0/0$ — compares false with everything, including itself. That rule is useful: a NaN that sneaks into a navigation filter cannot quietly pass an equality check. But it means floats break the promise that `Eq` makes, so Rust keeps the two traits apart. The honest way to ask "is this a NaN?" is `x.is_nan()`.
:::

::: context conditional-compilation Rust's answer to #ifdef
C and C++ do this with the preprocessor: `#ifdef SIM_SENSORS ... #endif` pastes text in or out before the compiler runs. Rust's `cfg` works on whole items — functions, modules, statements — rather than raw text, so it cannot leave half a bracket behind.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="120" y="10" width="120" height="44" rx="6" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <text x="180" y="29" font-size="12" fill="#1f2a44" text-anchor="middle">main.rs</text>
  <text x="180" y="45" font-size="11" fill="#6c7a93" text-anchor="middle">both versions written</text>
  <line x1="160" y1="54" x2="80" y2="100" stroke="#1f2a44" stroke-width="2"/>
  <line x1="200" y1="54" x2="280" y2="100" stroke="#1f2a44" stroke-width="2"/>
  <text x="74" y="80" font-size="11" fill="#1f2a44" text-anchor="middle">no feature</text>
  <text x="290" y="80" font-size="11" fill="#1f2a44" text-anchor="middle">--features sim-sensors</text>
  <rect x="10" y="100" width="150" height="56" rx="6" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="85" y="122" font-size="12" fill="#1f2a44" text-anchor="middle">real read_altimeter_m</text>
  <text x="85" y="142" font-size="11" fill="#1f2a44" text-anchor="middle">sim version deleted</text>
  <rect x="200" y="100" width="150" height="56" rx="6" fill="#f2b880" stroke="#1f2a44"/>
  <text x="275" y="122" font-size="12" fill="#1f2a44" text-anchor="middle">sim read_altimeter_m</text>
  <text x="275" y="142" font-size="11" fill="#1f2a44" text-anchor="middle">real version deleted</text>
</svg>
```
:::

::: context test-module-picture What each command compiles
The same `lib.rs` produces different programs depending on the command. `cargo build` leaves out everything under `#[cfg(test)]`. `cargo test` builds a special test program that includes the `tests` module and runs every `#[test]` function, then builds each doc test as its own tiny program and runs that.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="10" width="110" height="160" rx="6" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <text x="65" y="30" font-size="12" fill="#1f2a44" text-anchor="middle" font-weight="700">lib.rs</text>
  <rect x="20" y="42" width="90" height="34" fill="#8fb8f0" stroke="#1f2a44"/><text x="65" y="63" font-size="11" fill="#1f2a44" text-anchor="middle">functions</text>
  <rect x="20" y="84" width="90" height="34" fill="#f2b880" stroke="#1f2a44"/><text x="65" y="105" font-size="11" fill="#1f2a44" text-anchor="middle">/// examples</text>
  <rect x="20" y="126" width="90" height="34" fill="#ffffff" stroke="#b4232c" stroke-dasharray="4 3"/><text x="65" y="147" font-size="11" fill="#b4232c" text-anchor="middle">cfg(test) mod</text>
  <text x="250" y="40" font-size="12" fill="#1f2a44" text-anchor="middle" font-weight="700">cargo build</text>
  <text x="250" y="58" font-size="11" fill="#1f2a44" text-anchor="middle">functions only</text>
  <text x="250" y="100" font-size="12" fill="#1f2a44" text-anchor="middle" font-weight="700">cargo test</text>
  <text x="250" y="118" font-size="11" fill="#1f2a44" text-anchor="middle">functions + tests module, run</text>
  <text x="250" y="136" font-size="11" fill="#1f2a44" text-anchor="middle">then each doc example, run</text>
  <line x1="120" y1="59" x2="180" y2="50" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="120" y1="118" x2="170" y2="112" stroke="#1d6fd1" stroke-width="2"/>
</svg>
```
:::

::: context docs-rs Documentation for every published crate
When a crate is published to crates.io, the Rust community's package registry, the docs.rs service builds its documentation with the same tool as `cargo doc` and hosts it. So every public Rust library has reference pages in the same layout, with the same search box, and the examples on those pages are the doc tests its authors ran. `cargo doc --open` builds the same pages for your own project, including all its dependencies, and opens them in a browser — handy on a machine with no internet access.
:::

::: context lint-word Where "lint" comes from
Lint is the fluff that collects on clothes. In 1978 Stephen C. Johnson at Bell Labs wrote a program called `lint` that picked the "fluff" out of C code: constructs that compiled but were suspicious or unportable. Every tool of that kind since has been called a linter — pylint and ruff for Python, clang-tidy for C++, and clippy for Rust. What makes clippy unusual is that it ships with the official toolchain, so every Rust programmer has the same one.
:::

::: context waivers-and-ci Why written reasons matter
Safety-critical software processes, like the DO-178C standard used for airborne software, expect a team to follow its coding standard and to justify every deviation. A `reason = "..."` next to an `#[expect]` is that justification, kept in the code where it cannot get separated from what it excuses. In continuous integration, `cargo clippy -- -D warnings` then makes the rule mechanical: a new warning fails the build. You will set up exactly that kind of lint gate in the CI module, and meet DO-178C properly in the last Rust module.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <rect x="10" y="35" width="90" height="40" rx="6" fill="#ffffff" stroke="#1f2a44"/><text x="55" y="59">push</text>
    <rect x="135" y="35" width="90" height="40" rx="6" fill="#8fb8f0" stroke="#1f2a44"/><text x="180" y="52">clippy</text><text x="180" y="67" font-size="11">-D warnings</text>
    <rect x="260" y="10" width="90" height="36" rx="6" fill="#ffffff" stroke="#1d6fd1" stroke-width="2"/><text x="305" y="33">merge</text>
    <rect x="260" y="64" width="90" height="36" rx="6" fill="#ffffff" stroke="#b4232c" stroke-width="2"/><text x="305" y="87" fill="#b4232c">blocked</text>
  </g>
  <line x1="100" y1="55" x2="133" y2="55" stroke="#1f2a44" stroke-width="2"/>
  <line x1="225" y1="48" x2="258" y2="30" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="225" y1="62" x2="258" y2="80" stroke="#b4232c" stroke-width="2"/>
  <text x="240" y="24" font-size="11" fill="#1d6fd1" text-anchor="middle">clean</text>
  <text x="236" y="100" font-size="11" fill="#b4232c" text-anchor="middle">1 warning</text>
</svg>
```
:::
