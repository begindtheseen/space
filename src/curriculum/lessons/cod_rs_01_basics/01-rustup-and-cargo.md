---
id: l01-rustup-and-cargo
title: Installing Rust, and running everything with Cargo
minutes: 25
covers:
  - 'rustup, toolchains, editions; cargo new, build, run, test, doc, clippy, fmt'
  - 'Cargo.toml, dev and release profiles, workspaces, semver and feature flags'
---

Think about a well-run kitchen. There is one cupboard where every tool lives. There is one recipe card for each dish, listing the ingredients and where to buy them. And there is one head cook who reads the card, fetches what is missing, and runs the whole meal from start to finish. Nobody hunts for a whisk or argues about which brand of flour the recipe meant.

In the C++ module you built programs the other way. You ran the compiler by hand, wrote a Makefile to remember the steps, and installed libraries yourself, one at a time, hoping the versions matched. That works, but every team does it a little differently. Rust ships with the tidy kitchen already set up. **rustup** is the cupboard: it installs and updates the compiler and its tools. **Cargo** is the head cook: one command builds, runs, tests, documents, checks and formats your code. And **`Cargo.toml`** is the recipe card: one file that says what the project is and what it needs.

This lesson sets up that kitchen and walks through every tool in it. Everything below was run with Rust 1.94.1, and the output is copied from the real terminal.

## Why learn Rust at all

**Rust** is a compiled language, like C++. It turns your source code into a fast machine-code program with no garbage collector running in the background. What makes it different is that the compiler checks rules about memory and data that C++ leaves to you. A whole family of C++ bugs — using memory after it was freed, two threads writing to the same variable, forgetting a case in a `switch` — becomes a compile error instead of a crash in the field.

Be honest with yourself about where it stands in the job market. For a SpaceX-style GNC role, Rust is **not a hiring gate**. The flight software that flies the vehicles is C++, and the evidence this course has found for Rust at SpaceX is modest: a Starlink embedded software posting that listed Rust as one acceptable language beside C, C++, Go and Python. Stories that Starship's flight control was rewritten in Rust have no primary source behind them. So Rust should never take hours away from your C++ practice.

Why learn it, then? Because its ideas make your C++ sharper: types that say exactly which cases can happen, a compiler that will not let you forget one, and a strict model of who may change a piece of memory. A small number of space startups also use it. Treat it as a second lens on the same problems.

## rustup: one tool that manages the toolchain

A **[[toolchain|what-is-a-toolchain]]** is the full set of programs that turn source code into a running program: the compiler `rustc`, the build tool `cargo`, the standard library, and helpers like the linter and formatter. **rustup** is the program that installs toolchains, keeps them up to date, and lets you switch between them.

On Linux or macOS the official installer is one line (Windows has a downloadable installer on the same site):

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

After that, ask rustup what it has installed:

```bash
rustup show
```

```text
Default host: x86_64-unknown-linux-gnu
rustup home:  /root/.rustup

installed toolchains
--------------------
stable-x86_64-unknown-linux-gnu (active, default)

active toolchain
----------------
name: stable-x86_64-unknown-linux-gnu
active because: it's the default toolchain
installed targets:
  x86_64-unknown-linux-gnu
```

Read the long name in pieces. `stable` is the **channel**. `x86_64-unknown-linux-gnu` is the **target**: the kind of processor and operating system the compiled program will run on (a 64-bit Intel or AMD chip running Linux).

### Three channels, one train timetable

Rust comes out on a fixed **[[six-week release train|release-train]]**. There are three channels:

- **stable** — the release everyone should use for real work. A new one arrives every six weeks.
- **beta** — the next stable, being tested for six weeks before it ships.
- **nightly** — built every night from the newest code. It can turn on experimental features that stable refuses.

You can install another channel beside the first and pick one per command:

```bash
rustup update                  # bring every installed toolchain up to date
rustup toolchain install nightly
cargo +nightly build           # read "cargo plus nightly": use nightly for this one command
rustup component add clippy rustfmt
rustup target add thumbv7em-none-eabihf   # add a target for an ARM Cortex-M4F/M7F microcontroller
```

A team that wants every machine to use the exact same compiler puts a small file called `rust-toolchain.toml` at the top of the project. rustup reads it, and installs that version if it is missing:

```toml
[toolchain]
channel = "1.94.1"
components = ["clippy", "rustfmt"]
```

::: warning Nightly is not "newer and therefore better"
Nightly features can change or vanish overnight. Flight and simulation code should build on stable, pinned with `rust-toolchain.toml`, so the same source always meets the same compiler.
:::

## Editions: new language rules that never break old code

Every few years Rust makes small changes that would break some old code — a new keyword, a tighter rule. Instead of forcing everyone to rewrite, it groups those changes into an **[[edition|editions-explained]]**: a named set of language rules a project opts into. The editions so far are 2015, 2018, 2021 and 2024. Edition 2024 arrived with Rust 1.85 in early 2025, and it is what `cargo new` picks today.

The key idea: the edition belongs to each **crate** (a Rust package — one library or one program), not to the whole world. The current compiler understands all four editions at once. A 2024-edition program can use a library written for 2018, and they link together without trouble. So upgrading your compiler never breaks your code; changing the `edition` line in your recipe card is a separate, deliberate step, and `cargo fix --edition` automates most of it.

::: key Toolchains and editions
rustup installs and switches toolchains (stable, beta, nightly; plus extra targets and components). A toolchain holds `rustc`, `cargo`, the standard library, `clippy` and `rustfmt`. The **edition** (2015, 2018, 2021, 2024) is chosen per crate in `Cargo.toml`, and crates of different editions work together.
:::

## Your first project: cargo new, run and build

Make a project with `cargo new`:

```bash
cargo new hello_orbit
cd hello_orbit
```

Cargo creates this layout, and also starts a git repository with a `.gitignore` that ignores the `target/` build folder (unless you are already inside a git repository):

```text
hello_orbit/
├── Cargo.toml
└── src/
    └── main.rs
```

`src/main.rs` already holds a working program:

```rust
fn main() {
    println!("Hello, world!");
}
```

`fn main()` is where the program starts, as in C++. `println!` prints a line; the `!` (read "bang") marks it as a **macro**, code that writes more code for you at compile time.

Now run it:

```bash
cargo run
```

```text
   Compiling hello_orbit v0.1.0 (/…/hello_orbit)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.50s
     Running `target/debug/hello_orbit`
Hello, world!
```

`cargo run` compiled, linked and started the program. `dev profile [unoptimized + debuginfo]` says it made a **debug build** — quick to compile, easy to debug, not optimized. It landed in `target/debug/`.

The other commands in this family:

- `cargo build` compiles without running.
- `cargo build --release` builds the fast, optimized version into `target/release/`.
- `cargo check` only checks that the code compiles, without producing a program. It is the fastest way to see compiler errors while you type.

::: example Debug and release builds of the same program
Build both versions of `hello_orbit` and compare the files:

```bash
cargo build --release
ls -la target/debug/hello_orbit target/release/hello_orbit
```

```text
-rwxr-xr-x 2 root root 3962456 Sep 26 18:36 target/debug/hello_orbit
-rwxr-xr-x 2 root root  436192 Sep 26 18:36 target/release/hello_orbit
```

The debug file is $3\,962\,456$ bytes, about $3.96\,\mathrm{MB}$. The release file is $436\,192$ bytes, about $0.436\,\mathrm{MB}$. Divide: $3\,962\,456 / 436\,192 \approx 9.08$, so the debug program is about nine times larger.

Why? The debug build carries **[[debug information|debug-info]]**: a map from machine instructions back to your source lines, for the debugger. The release build leaves that out and optimizes the code. Both print the same "Hello, world!", as they should.
:::

## The everyday commands: test, doc, clippy, fmt

A real project also needs tests, documentation, one agreed style, and a second pair of eyes. Cargo has a command for each.

Make a **library** — code meant to be used by other programs, with no `main` — using `cargo new --lib twr`. Put this in `src/lib.rs`. It computes a rocket's **thrust-to-weight ratio**: the engine's push divided by the vehicle's weight. If the ratio is above 1, the rocket can lift off.

```rust
/// Standard gravity in metres per second squared.
pub const G0: f64 = 9.80665;

/// Thrust-to-weight ratio of a vehicle at Earth's surface.
///
/// ```
/// let r = twr::thrust_to_weight(12_000.0, 800.0);
/// assert!((r - 1.5296).abs() < 1e-4);
/// ```
pub fn thrust_to_weight(thrust_n: f64, mass_kg: f64) -> f64 {
    thrust_n / (mass_kg * G0)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn hover_is_exactly_one() {
        let r = thrust_to_weight(800.0 * G0, 800.0);
        assert_eq!(r, 1.0);
    }

    #[test]
    fn small_rocket_lifts_off() {
        assert!(thrust_to_weight(12_000.0, 800.0) > 1.0);
    }
}
```

A few new pieces of notation:

- `pub` (read "pub", short for public) lets code outside this file use the item.
- Lines starting `///` (three slashes) are **doc comments**: documentation that belongs to the item below them.
- `#[test]` (read "attribute test") marks a function as a test. `#[cfg(test)]` means "compile the module below only when testing", so the tests never end up in the real program. The last lesson of this module goes deeper into both.
- `assert!` stops the test with a failure if its condition is false; `assert_eq!` does the same if two values differ.
- `12_000.0` is twelve thousand. Rust lets you put underscores in numbers so long ones are easy to read.

::: example Running the tests, including the one inside the documentation
Run the test suite:

```bash
cargo test
```

```text
running 2 tests
test tests::hover_is_exactly_one ... ok
test tests::small_rocket_lifts_off ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests twr

running 1 test
test src/lib.rs - thrust_to_weight (line 6) ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

Three tests ran, not two. The third is the example inside the `///` comment: Cargo found it, compiled it and ran it. That is a **doc test**, and it means the example in your documentation cannot quietly go stale.

Check the number in that doc test by hand. The weight is $800\,\mathrm{kg} \times 9.80665\,\mathrm{m/s^2} = 7845.32\,\mathrm{N}$. The ratio is

$$
\frac{12\,000\,\mathrm{N}}{7845.32\,\mathrm{N}} \approx 1.5296 .
$$

Above 1, so this small rocket lifts off, and the test agrees. Now try `cargo doc`: it turns every `///` comment into a web page at `target/doc/twr/index.html`, with the example shown as code.
:::

Two more commands keep code tidy.

**`cargo fmt`** rewrites your files in the one standard Rust style, using a tool called **rustfmt**. Style arguments in code review disappear, because the formatter decides. Here is a squashed line before and after:

```text
before:  fn main(){let thrust_n=12000.0;let mass_kg=800.0;
         println!("{}",thrust_n/(mass_kg*9.80665));}
```

```rust
fn main() {
    let thrust_n = 12000.0;
    let mass_kg = 800.0;
    println!("{}", thrust_n / (mass_kg * 9.80665));
}
```

`cargo fmt --check` changes nothing. It prints the difference and exits with an error code if any file is not formatted, which is how a build server enforces the style.

**`cargo clippy`** runs **[[Clippy|clippy-name]]**, a linter: a program that reads your code and points out things that compile but are clumsy or suspicious. Feed it some C++-flavored Rust:

```rust
fn is_go(armed: bool) -> bool {
    if armed == true {
        return true;
    }
    return false;
}

fn main() {
    println!("go for launch: {}", is_go(true));
}
```

```text
warning: unneeded `return` statement
 --> src/main.rs:5:5
  |
5 |     return false;
  |     ^^^^^^^^^^^^
  |
help: remove `return`
  |
5 -     return false;
5 +     false
  |

warning: equality checks against true are unnecessary
 --> src/main.rs:2:8
  |
2 |     if armed == true {
  |        ^^^^^^^^^^^^^ help: try: `armed`
```

Each warning names the problem, points at the line, and shows the fix. In Rust the last expression of a function, with no semicolon, is its value, so the whole body could be `armed`.

## Cargo.toml: the recipe card

Every Cargo project has a `Cargo.toml` at its top. It is written in **[[TOML|toml-format]]**, a simple format of `[sections]` and `key = value` lines. The one `cargo new` wrote looks like this:

```toml
[package]
name = "hello_orbit"
version = "0.1.0"
edition = "2024"

[dependencies]
```

`[package]` names the crate, gives its version, and picks its edition. `[dependencies]` lists other crates it needs. The public home of shared Rust crates is **crates.io**, and `cargo add` fetches from there. Adding a small maths library:

```bash
cargo add libm@0.2
```

```text
    Updating crates.io index
     Locking 1 package to latest Rust 1.94.1 compatible version
      Adding libm v0.2.16
```

That wrote `libm = "0.2"` under `[dependencies]`. It also created a file called **`Cargo.lock`**, which records the exact version picked (0.2.16) and a checksum of its contents. The next build, on this machine or any other, uses exactly that version until you ask Cargo to update it. Commit `Cargo.lock` to git for anything you build and ship, so that everyone builds the identical program.

### Semantic versioning

Why did `"0.2"` pick 0.2.16 and not 0.3.0? Because Rust crates follow **semantic versioning** (semver). A version has three numbers, **MAJOR.MINOR.PATCH**:

- **PATCH** goes up for bug fixes that change nothing you rely on.
- **MINOR** goes up when features are added, but old code still works.
- **MAJOR** goes up when something changes in a way that can break code that uses it.

A requirement like `"1.4.2"` in `Cargo.toml` is a **[[caret requirement|caret-range]]**: "this version or any later one that promises to be compatible". For versions starting at 1 or above, compatible means the same MAJOR number. For versions starting with 0, the crate is still young, so Cargo treats the MINOR number as the one that may break things.

::: key Semver in Cargo
`"1.4.2"` means at least 1.4.2 and below 2.0.0. `"0.2"` means at least 0.2.0 and below 0.3.0. `"=1.4.2"` means exactly 1.4.2. `Cargo.lock` pins the exact version actually chosen.
:::

::: example Which versions will Cargo accept?
Suppose a crate has published 1.3.9, 1.4.0, 1.4.2, 1.9.1 and 2.0.0. Your `Cargo.toml` says `"1.4.2"`.

- 1.3.9 is below 1.4.2: rejected.
- 1.4.0 is below 1.4.2: rejected.
- 1.4.2, 1.9.1: at least 1.4.2 and below 2.0.0: accepted.
- 2.0.0 is a new MAJOR: rejected, because it may break your code.

Cargo picks the newest accepted one, 1.9.1, and writes it into `Cargo.lock`. Now suppose you wrote `"0.2"` for `libm`, and the published versions include 0.2.16 and 0.3.0. The allowed range is at least 0.2.0 and below 0.3.0, so Cargo picks 0.2.16 — which is what the real run above printed.
:::

## Profiles: dev and release

A **profile** is a named set of compiler settings. Cargo has two you use every day:

| Setting | `dev` (used by `cargo build`) | `release` (used by `--release`) |
| --- | --- | --- |
| `opt-level` (how hard to optimize) | 0, none | 3, maximum |
| `debug` (debug information) | on | off |
| `debug-assertions` | on | off |
| `overflow-checks` | on | off |

The **[[optimizer|what-optimizing-means]]** is the part of the compiler that rewrites your program to run faster without changing what it does. Level 0 skips it, so builds are quick and the machine code follows your source line by line. Level 3 works hardest.

Look at the last row. In a debug build, Rust checks every integer addition for overflow. In a release build, it does not. That single line is the subject of the whole next lesson.

You can change any setting in `Cargo.toml`. A project that wants release builds to keep the overflow checks writes:

```toml
[profile.release]
overflow-checks = true
```

::: warning Test the build you ship
Your tests usually run in the dev profile. If the dev and release profiles differ in some setting that changes behavior, a test can pass in dev and the shipped program can still misbehave. Either keep the settings that matter the same in both profiles, or also run your tests with `cargo test --release`.
:::

## Feature flags and workspaces

### Feature flags

A **feature flag** is an optional part of a crate that users switch on by name. It is declared in `Cargo.toml` and tested in code with `#[cfg(feature = "…")]`, which keeps or removes the item below it at compile time. Here is a units library whose feet conversion is optional:

```toml
[package]
name = "units"
version = "0.1.0"
edition = "2024"

[features]
default = []
imperial = []
```

```rust
/// Metres per foot, exact by definition.
pub const FT_TO_M: f64 = 0.3048;

/// Always available: format an altitude in metres.
pub fn altitude_m(alt_m: f64) -> String {
    format!("{:.0} m", alt_m)
}

/// Only compiled when the `imperial` feature is switched on.
#[cfg(feature = "imperial")]
pub fn altitude_ft(alt_m: f64) -> String {
    format!("{:.0} ft", alt_m / FT_TO_M)
}
```

`default = []` says no features are on unless asked for. A user switches one on with `features = ["imperial"]` in their own `Cargo.toml`, or with `cargo build --features imperial`. Features should only **add** things. If one crate in a project turns a feature on, it is on for everyone who uses that crate, so a feature that changed or removed existing behavior would surprise the others.

### Workspaces

A real GNC project is several crates: a units library, a dynamics model, a simulation program, a telemetry decoder. A **workspace** is a folder of crates that share one `Cargo.lock` and one `target/` folder, so they all build together with matching dependency versions. The top-level `Cargo.toml` has no `[package]`, only a list of members:

```toml
[workspace]
resolver = "3"
members = ["sim", "units"]
```

Running `cargo new units` inside that folder adds `units` to the `members` list for you. The `resolver` line picks the version of Cargo's dependency-choosing rules; "3" is the one that goes with edition 2024.

::: example A two-crate workspace
The `sim` crate is a program that uses `units`, turning the feature on. Its `Cargo.toml`:

```toml
[package]
name = "sim"
version = "0.1.0"
edition = "2024"

[dependencies]
units = { path = "../units", features = ["imperial"] }
```

`path = "../units"` means "this crate lives next door on disk", not on crates.io. Its `src/main.rs`:

```rust
fn main() {
    let alt = 3_048.0;
    println!("{} = {}", units::altitude_m(alt), units::altitude_ft(alt));
}
```

`cargo run -p sim` (read `-p` as "package") prints:

```text
3048 m = 10000 ft
```

Check: $3048 / 0.3048 = 10\,000$ exactly, because a foot is defined as exactly $0.3048\,\mathrm{m}$. Delete `features = ["imperial"]` and build again, and the compiler says `cannot find function altitude_ft in crate units`: the function was never compiled, because nobody asked for it.
:::

## Cargo versus make

In the C++ module, **[[make|make-bridge]]** rebuilt only the files that had changed, following rules you wrote by hand. `make` is only a build runner. It knows nothing about libraries, versions, tests or documentation.

Cargo builds too, but it also does jobs C++ teams stitch together from other tools. It downloads dependencies, chooses versions by semver, and pins them in a lockfile. Every project has the same layout. Test, benchmark, doc and lint commands are built in. And one manifest drives all of it, so a fresh machine rebuilds the same program from the same files.

::: key What Cargo does that make does not
Dependency resolution with semantic versioning and a lockfile, a standard project layout, integrated test, bench, doc and lint commands, and reproducible builds from a single manifest. It is package manager and build system in one.
:::

::: note Why one tool matters on a flight team
A team that certifies software must prove which exact compiler and library versions built each binary. In Rust, `rust-toolchain.toml` pins the compiler and `Cargo.lock` pins every library to a checksum, both in git beside the code. A C++ team can get there too, but with several tools that each need setting up.
:::

## Check yourself

::: check
A teammate says "I updated to the newest Rust compiler, so now my code is on edition 2024." Is that right?
:::

::: answer
No. The edition is set per crate, by the `edition = "…"` line in that crate's `Cargo.toml`. A new compiler understands every edition, so updating it leaves the code on whatever edition the file names. Moving to 2024 is a separate step: change that line (with `cargo fix --edition` to help), then rebuild and test.
:::

::: check
Your `Cargo.toml` asks for `serde = "1.0.100"`. The published versions include 1.0.99, 1.0.210 and 2.0.0 (imagine that last one exists). Which does Cargo pick, and where is the choice recorded?
:::

::: answer
The caret range is at least 1.0.100 and below 2.0.0. 1.0.99 is too old and 2.0.0 is a new MAJOR, so both are out. Cargo picks the newest allowed version, 1.0.210, and records it, with a checksum, in `Cargo.lock`. Later builds use 1.0.210 until someone runs `cargo update`.
:::

::: check
You want the fastest way to see whether your code compiles while you are editing. Which Cargo command, and why is it faster than `cargo build`?
:::

::: answer
`cargo check`. It runs the compiler's checks (syntax, types and the other rules) but stops before generating machine code and linking, so there is no program at the end. That skipped work is most of the time a build takes.
:::

::: check
Name the four settings that differ between the `dev` and `release` profiles in the table above, and say which one changes what your program actually does.
:::

::: answer
`opt-level` (0 versus 3), `debug` information (on versus off), `debug-assertions` (on versus off), and `overflow-checks` (on versus off). The optimizer and debug information change speed and size, not results. `overflow-checks` can change behavior: with it on, an integer overflow stops the program; with it off, the value wraps around. (Debug assertions can too, since `debug_assert!` checks only run in dev.)
:::

::: check
A friend's library has a feature called `fast` that, when switched on, replaces the accurate `sin` function with a rough one. Why is that a poor use of a feature flag?
:::

::: answer
Features should only add things. If any crate in a project switches `fast` on, it is on for every crate that uses that library, including ones that needed the accurate `sin`. They would silently get the rough version. A better design keeps `sin` accurate and adds a separate `fast_sin` behind the feature.
:::

## Summary

| Tool or idea | What it is | Key fact |
| --- | --- | --- |
| rustup | Toolchain manager | Installs stable, beta, nightly, components and targets; `rust-toolchain.toml` pins a version |
| Edition | Named set of language rules | 2015, 2018, 2021, 2024; chosen per crate, crates of any edition mix |
| `cargo new`, `run`, `build`, `check` | Create, run, compile, check | Debug output in `target/debug/`, release in `target/release/` |
| `cargo test`, `doc`, `clippy`, `fmt` | Test, document, lint, format | Doc comments with code are run as doc tests |
| `Cargo.toml`, `Cargo.lock` | Manifest and pinned versions | Commit both for anything you ship |
| Semver caret | `"1.4.2"` is at least 1.4.2, below 2.0.0 | For `0.x`, the MINOR number is the breaking one |
| Profiles | `dev` and `release` settings | `overflow-checks` on in dev, off in release |
| Features, workspaces | Optional parts; groups of crates | Features should only add; a workspace shares one lockfile |

Next, you write real Rust inside this kitchen: variables and types, and the one place where the dev and release profiles really do give different answers — integer overflow.

::: context what-is-a-toolchain A chain of tools, one after another
The word comes from the way the tools hand work down a line, like a factory. You write source code. The compiler turns it into machine code. The linker joins that with the standard library into one program. Cargo drives the whole line, and the linter and formatter sit beside it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="10" width="340" height="34" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="32" font-size="13" text-anchor="middle" fill="#1f2a44">rustup: installs and switches toolchains</text>
  <rect x="10" y="56" width="220" height="104" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="120" y="74" font-size="12" text-anchor="middle" fill="#1f2a44" font-weight="700">stable 1.94.1 (active)</text>
  <rect x="20" y="84" width="60" height="28" rx="4" fill="#f2b880" stroke="#1f2a44"/>
  <text x="50" y="102" font-size="12" text-anchor="middle" fill="#1f2a44">rustc</text>
  <rect x="90" y="84" width="60" height="28" rx="4" fill="#f2b880" stroke="#1f2a44"/>
  <text x="120" y="102" font-size="12" text-anchor="middle" fill="#1f2a44">cargo</text>
  <rect x="160" y="84" width="60" height="28" rx="4" fill="#f2b880" stroke="#1f2a44"/>
  <text x="190" y="102" font-size="12" text-anchor="middle" fill="#1f2a44">std</text>
  <rect x="20" y="120" width="95" height="28" rx="4" fill="#fff" stroke="#1f2a44"/>
  <text x="67" y="138" font-size="12" text-anchor="middle" fill="#1f2a44">clippy</text>
  <rect x="125" y="120" width="95" height="28" rx="4" fill="#fff" stroke="#1f2a44"/>
  <text x="172" y="138" font-size="12" text-anchor="middle" fill="#1f2a44">rustfmt</text>
  <rect x="242" y="56" width="108" height="104" rx="6" fill="#fff" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <text x="296" y="100" font-size="12" text-anchor="middle" fill="#6c7a93">nightly</text>
  <text x="296" y="118" font-size="11" text-anchor="middle" fill="#6c7a93">(if installed)</text>
</svg>
```
:::

::: context release-train Why Rust ships like a train
Every six weeks the nightly code is copied onto the beta channel, and the old beta becomes the new stable. A feature that misses one train waits for the next, so no release is held back for it. The result is a steady, predictable stream of small releases instead of rare, risky big ones. Each version spends six weeks on nightly, then six on beta, then ships.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44">
    <text x="8" y="36">nightly</text><text x="8" y="72">beta</text><text x="8" y="108">stable</text>
  </g>
  <rect x="70" y="20" width="90" height="24" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="115" y="36" font-size="12" text-anchor="middle" fill="#1f2a44">1.95</text>
  <rect x="160" y="20" width="90" height="24" fill="#f2b880" stroke="#1f2a44"/>
  <text x="205" y="36" font-size="12" text-anchor="middle" fill="#1f2a44">1.96</text>
  <rect x="160" y="56" width="90" height="24" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="205" y="72" font-size="12" text-anchor="middle" fill="#1f2a44">1.95</text>
  <rect x="250" y="56" width="90" height="24" fill="#f2b880" stroke="#1f2a44"/>
  <text x="295" y="72" font-size="12" text-anchor="middle" fill="#1f2a44">1.96</text>
  <rect x="250" y="92" width="90" height="24" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="295" y="108" font-size="12" text-anchor="middle" fill="#1f2a44">1.95</text>
  <line x1="70" y1="128" x2="340" y2="128" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="70" y="143">week 0</text><text x="160" y="143">week 6</text><text x="250" y="143">week 12</text><text x="336" y="143">18</text>
  </g>
</svg>
```
:::

::: context editions-explained Editions are like spelling reforms
Imagine a country changes a few spelling rules, but every old book stays legal to read and print forever. Each book says on its cover which rules it follows. That is an edition. Most edition changes are small: 2018, for example, made `async` a reserved word so it could later mean something. Because the compiler speaks all editions, the Rust library ecosystem never splits into "old" and "new" halves.
:::

::: context debug-info What debug information is
A compiled program is only machine instructions and data. Debug information is an extra table stored with it that says "these instructions came from line 12 of `main.rs`, and this register holds the variable `mass_kg`". A debugger such as gdb reads it so it can show your source and your variable names. It makes the file bigger but does not slow the program down. The debugging module later in the course uses it constantly.
:::

::: context clippy-name Where the name Clippy comes from
The name is a nod to the cartoon paperclip assistant in older versions of Microsoft Office, which popped up with suggestions while you typed. Rust's Clippy is much more useful: it has several hundred lints, each with a page explaining why the pattern is a problem. The last lesson of this module treats it as a teaching tool in its own right.
:::

::: context toml-format A file format meant for people
TOML stands for "Tom's Obvious, Minimal Language", after Tom Preston-Werner, who designed it. It aims to be easy for a person to read and hard to get wrong: `key = "value"` lines grouped under `[section]` headings, with no indentation rules. Strings go in quotes, numbers do not, and lists go in square brackets like `["sim", "units"]`.
:::

::: context caret-range The allowed range, drawn
The requirement names the oldest version you accept. The top of the range is the next version that could break you: the next MAJOR, or for a `0.x` crate, the next MINOR.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <text x="10" y="20" font-size="12" fill="#1f2a44" font-weight="700">"1.4.2"</text>
  <line x1="20" y1="45" x2="340" y2="45" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="110" y="38" width="170" height="14" fill="#8fb8f0"/>
  <circle cx="110" cy="45" r="5" fill="#1d6fd1"/>
  <circle cx="280" cy="45" r="5" fill="#fff" stroke="#b4232c" stroke-width="2"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="50" y="68">1.3.9</text><text x="110" y="68">1.4.2</text><text x="200" y="68">1.9.1</text><text x="280" y="68">2.0.0</text>
  </g>
  <text x="10" y="92" font-size="12" fill="#1f2a44" font-weight="700">"0.2"</text>
  <line x1="20" y1="112" x2="340" y2="112" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="80" y="105" width="170" height="14" fill="#8fb8f0"/>
  <circle cx="80" cy="112" r="5" fill="#1d6fd1"/>
  <circle cx="250" cy="112" r="5" fill="#fff" stroke="#b4232c" stroke-width="2"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="80" y="134">0.2.0</text><text x="180" y="134">0.2.16</text><text x="250" y="134">0.3.0</text>
  </g>
</svg>
```

Filled blue dot: included. Open red dot: excluded.
:::

::: context what-optimizing-means What an optimizer does
The optimizer looks for work it can skip or do more cheaply, while keeping every result the same. It keeps values in the processor's fast registers instead of memory, works out sums of constants at compile time, removes code whose answer is never used, and copies small functions into the place they are called. That last trick, called inlining, comes back when you learn why Rust iterators cost nothing extra.
:::

::: context make-bridge Where you met make
In the C++ module's lesson on linker errors you wrote a Makefile: rules saying which file is built from which, and the command to run. `make` compares file timestamps and reruns only what is out of date. It is a fine build runner, and many C and C++ flight codebases still use it or CMake. Cargo's own build step does the same "rebuild only what changed" job, but you never write those rules by hand.
:::
