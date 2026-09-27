---
id: l09-ferrocene-the-qualified-toolchain
title: 'Ferrocene: a Rust compiler you are allowed to trust'
minutes: 21
covers:
  - 'Ferrocene: the qualified Rust toolchain and exactly what its qualification covers'
---

Picture a mechanic's torque wrench. When the mechanic tightens the wheel nuts on a car, the wrench clicks at the right force, say 110 newton-meters. How does anyone know the click is honest? Once a year the wrench goes to a lab, gets tested against a reference, and comes back with a **calibration sticker**. The sticker says: this wrench reads true, within a stated error, until this date.

Now notice what the sticker does *not* say. It does not say the wheels on this particular car are on tight. The mechanic still has to use the wrench on every nut, on the right setting, and someone still has to check the work. A calibrated wrench is something you need before the job. It is not the job.

A compiler is the torque wrench of software. Every line of flight code passes through it on the way to the chip. This lesson is about **Ferrocene**, a version of the Rust compiler that comes with the software equivalent of a calibration sticker. You will learn exactly what that sticker covers, what it does not, and how to say both in one honest sentence. That sentence matters: people who oversell Ferrocene lose arguments they should have won.

## A quick reminder from lesson 08

Lesson 08 built the vocabulary this lesson leans on. In one line each:

- **DO-178C** is the aviation software standard. Its **DAL** (design assurance level) runs from A, where a failure could be catastrophic, down to E, where it has no safety effect.
- **Structural coverage**, and at DAL A **MC/DC**, is the evidence that your tests exercised the code's decisions, not only its lines.
- **DO-330** is the companion standard for **tool qualification**. A tool's **TQL** (tool qualification level) says how much evidence you owe about the tool itself.
- **ECSS-Q-ST-80C** is the European space standard for software product assurance, which also asks projects to justify the tools they use.

The thread running through all four: certification is about **evidence**. Someone independent must be able to read your files and agree that the software does what it should and nothing dangerous besides.

## Why a compiler needs qualifying at all

A **compiler** turns the source code you wrote into **machine code**, the numbered instructions the processor actually runs. You review the source. You almost never read the machine code. So the compiler sits in the one place where a mistake could slip in unseen: a bug in the compiler could produce machine code that does something your perfectly reviewed source never said.

That leaves a safety project two choices.

1. **Qualify the tool.** Collect evidence, up front, that the compiler translates correctly for the ways you use it. Then you may trust its output to a stated degree.
2. **Verify the output.** Treat the compiler as untrusted, and test the final machine code so thoroughly that a compiler bug would be caught anyway.

Real projects use a mix. Either way, somebody must produce evidence, and qualifying a compiler from scratch is expensive: it needs a written description of what the language means, a test suite traced to that description, records of every known bug, and a controlled way of building and releasing the compiler. For decades only C, C++ and Ada had compilers with that kind of paperwork. Rust had none until Ferrocene.

::: note Why "verify the output" is not free either
If you refuse to trust the compiler, every test you run on the final program is also a test of the compiler, which is good. But for the highest levels, auditors also want to know that no machine code exists that did not come from your source, for example code the compiler added on its own for bounds checks or stack handling. Tracing that by hand is slow, skilled work. A qualified compiler does not remove all of it, but it gives you a documented, tested starting point instead of an unknown one.
:::

## What Ferrocene is

Ferrocene is made by **[[Ferrous Systems|ferrous-name]]**, a Rust consulting company based in Berlin, Germany. It is not a new language and not a rewrite of the compiler. It is the ordinary Rust compiler, `rustc`, taken from the Rust project, frozen at a chosen version, and wrapped in the evidence that safety standards ask for.

Here is what that wrapping holds, piece by piece.

- **The same compiler.** Ferrocene is **[[drop-in compatible with upstream rustc|upstream-downstream]]**. "Upstream" means the main Rust project that everyone uses. "Drop-in compatible" means code that builds with the matching upstream `rustc` builds with Ferrocene, and `cargo`, `rustdoc` and the rest of the familiar toolchain come along.
- **Open source.** The Ferrocene source code is public on GitHub under the same MIT and Apache-2.0 licenses as Rust itself. So are its qualification documents. What you pay for is the signed, supported binary releases and long-term support.
- **A specification.** Qualification needs a written statement of what the language *means*, so tests can be traced to it. Ferrous Systems wrote the **[[Ferrocene Language Specification|fls-spec]]** (FLS) for exactly this.
- **A traced test suite.** Each qualified release is tested on each qualified target, and the tests are linked back to the specification, so an assessor can see which rule each test checks.
- **Documents for the assessor.** A qualification plan and report, a list of known problems, and a **[[safety manual|safety-manual]]** that states the conditions under which the qualification holds.

The first qualified release, Ferrocene 23.06, was based on Rust 1.68 and received its certificate in 2023. The certificate came from **[[TÜV SÜD|tuv-sud]]**, a German testing and certification company that acts as the independent assessor.

::: warning "Qualified" and "certified" are different words
A **tool** is *qualified*: there is evidence it is fit for a stated use. A **product**, such as an aircraft, a car's brake controller or a satellite, is *certified*: an authority accepted that the whole thing is safe. Ferrocene is a qualified tool. Nothing you build becomes certified because Ferrocene compiled it. When you hear "Ferrocene makes Rust certified", the sentence has already gone wrong.
:::

## The certificates, one by one

Ferrocene's qualification is not one stamp. It is a list, and each line names a standard and a level. The standards come from different industries, and each has its own **[[ladder of levels|integrity-ladders]]**.

- **ISO 26262** is the road-vehicle standard. Its levels are **ASIL** A to D (automotive safety integrity level), with D the strictest. Ferrocene is qualified up to **ASIL D**.
- **IEC 61508** is the general industrial standard, the parent of many others. Its levels are **SIL** 1 to 4 (safety integrity level), with 4 the strictest. Ferrocene is qualified up to **SIL 3**.
- **IEC 62304** is the standard for medical-device software. Its classes are A, B and C, with C for software whose failure could cause death or serious injury. Ferrocene is qualified for **Class C**.
- **DO-178C**, aviation. Here there is no certificate at all. Ferrous Systems *supports customers* who qualify Ferrocene within their own project, towards **DAL C**.

That last line deserves a slow read. Under DO-330, a tool is not qualified once for everyone. It is qualified **inside one project**, and the aviation authority accepts it as part of that project. So no company can hand you a "DO-178C-qualified compiler" certificate. What Ferrous Systems can hand you is documents that make your own tool qualification at DAL C much shorter. For DAL A and B, the heaviest levels, no such package is offered.

The qualification also names its **targets**, the chips and systems the compiler was tested for. They include bare-metal 64-bit Arm (`aarch64-unknown-none`) and the Armv7E-M microcontroller targets `thumbv7em-none-eabi` and `thumbv7em-none-eabihf`, the same Cortex-M4 and M7 family you built for in lesson 01. The list grows with releases, so the current one lives in the Ferrocene user manual. A target not on the list is not covered, even if the compiler happily builds for it.

::: key What exactly is Ferrocene qualified for?
A qualified Rust toolchain certified by TÜV SÜD for ISO 26262 up to ASIL D, IEC 61508 up to SIL 3 and IEC 62304 Class C, with support for customer qualification towards DO-178C DAL C. A certified subset of the core library reached IEC 61508 SIL 2 in December 2025, and ISO 26262 ASIL B in the release after. It is open source and drop-in compatible with upstream rustc.
:::

## The library question: which code is covered?

A qualified compiler covers the *translation*: the step that turns your source into machine code. But your program also calls library code that you did not write. Remember the three floors from lesson 01: `core` on the ground floor, `alloc` above it, `std` on top.

Every `Option`, every slice, every `u32::checked_add` your flight code calls runs code from `core`. That code ends up inside your product. So for a safety project it is *your* code now, and you owe evidence about it, exactly as if you had written it. Until recently, no part of the Rust library came with that evidence.

That changed in steps.

- On 3 December 2025, Ferrous Systems announced that TÜV SÜD had certified a **[[subset of the core library|core-subset]]** to **IEC 61508 SIL 2**, shipped in Ferrocene 25.11.0. It covered 2,903 functions, for use on qualified targets such as Armv7E-M and Armv8-A.
- Ferrocene 26.02.0 added **ISO 26262 ASIL B** for the certified subset and grew it to 5,169 functions.

Notice three limits in those sentences. It is a **subset** of `core`, not all of it. Its levels, SIL 2 and ASIL B, are *lower* than the compiler's SIL 3 and ASIL D. And `alloc` and `std` are not in it at all. For flight software that is less painful than it sounds: lesson 01 already moved you onto the ground floor, and the certified subset includes the everyday pieces such as `Option`, `Clone`, `str`, pointers and most primitive types including slices.

::: example How much did the certified subset grow?
The first certified subset had 2,903 functions. The next release had 5,169.

Step 1: find the growth as a ratio. Divide the new count by the old one:

$$
\frac{5169}{2903} \approx 1.78
$$

Step 2: turn it into words. The subset became about 1.78 times as large, an increase of about 78 percent, in a single release.

Step 3: sanity check. The count did not quite double ($2 \times 2903 = 5806$, more than 5,169), so a ratio a bit under 2 is right.

What the number does *not* tell you: whether the functions *you* call are in it. That is a question you answer by checking your code against the list in the Ferrocene core certification documents, one function at a time. A growth rate is news. The list is evidence.
:::

::: warning Do not round "a subset of core" up to "the standard library"
The certified library code is a subset of `core`. It is not all of `core`, and it is nothing from `alloc` or `std`. If your safety-relevant code uses `Vec`, `String` or anything from `std`, that code carries no library certification and you owe the full evidence for it yourself.
:::

## What Ferrocene is not

Now the other half of the sticker. Everything above is real and hard-won. None of it is any of the following.

- **Not a DO-178C DAL A approval.** There is no DAL A package, and no DO-178C certificate at any level, because DO-330 does not work by certificates.
- **Not the whole standard library.** Only a subset of `core` is certified.
- **Not your verification.** Your requirements, your tests, your structural coverage, your reviews: all still yours.
- **Not an ECSS certificate.** A European space project would still argue its tool choice under ECSS-Q-ST-80C itself. Ferrocene's documents are useful evidence in that argument, but no certificate replaces it.

The deepest point is the last-but-one. A qualified compiler guarantees that the machine code faithfully does what your source says. If your source says the wrong thing, you get the wrong thing, faithfully.

::: key What is Ferrocene NOT?
It is not a blanket DO-178C DAL A approval, it does not qualify the whole standard library, and it does not remove the need for your own verification evidence. A qualified compiler is a prerequisite, not a certification.
:::

::: example A faithful translation of a bug
A telemetry packet carries a frame counter in 16 bits. Here is the code that advances it:

```rust
// A frame counter that a telemetry packet carries in 16 bits.
fn next_frame(count: u16) -> u16 {
    count + 1 // bug: nobody decided what happens after 65535
}

fn main() {
    let mut count: u16 = 65_534;
    for _ in 0..3 {
        count = next_frame(count);
        println!("frame {count}");
    }
}
```

A `u16` holds whole numbers from 0 to 65,535. Build it in the default debug mode with Rust 1.94.1 and run it (the number in brackets is a thread id and changes from run to run; the backtrace is trimmed):

```text
frame 65535

thread 'main' (4626) panicked at src/main.rs:3:5:
attempt to add with overflow
```

Build the same file with optimizations (`rustc -O`, or `cargo run --release`):

```text
frame 65535
frame 0
frame 1
```

Both behaviors are exactly what Rust promises. In debug builds, integer overflow is checked and panics. In release builds, unless you turn the checks back on, it wraps around to zero. A perfectly qualified compiler would do the same, because the compiler is not wrong. The *requirement* is missing: nobody wrote down what the counter should do at its limit.

How soon does it bite? At 50 packets per second, the counter runs through all 65,536 values in

$$
\frac{65536}{50\,\mathrm{s^{-1}}} \approx 1311\,\mathrm{s} \approx 21.8\,\mathrm{min}
$$

so it wraps in under half an hour of flight. The fix is a decision, written as code: `count.wrapping_add(1)` if the ground software expects the wrap, or `count.checked_add(1)` if a wrap should be reported as an error. Then a test at 65,535 proves it. That test is your verification evidence, and no compiler certificate supplies it.
:::

## Saying it right in one breath

Engineers who work on certified software have heard every Rust pitch. What earns their respect is precision. Compare two sentences.

The oversold one: "Rust is certified now, Ferrocene did it."

The honest one: "Ferrocene is a TÜV SÜD-qualified Rust toolchain, up to ASIL D, SIL 3 and IEC 62304 Class C, with support for project-level DO-178C qualification towards DAL C, plus a certified subset of `core` at SIL 2 and ASIL B. It is a prerequisite for using Rust in a certified product, not a certification of anything I build with it."

The second one is longer, and it wins the argument, because every clause in it can be checked. That is also exactly the scope you will need for the memo exercise at the end of this module.

::: example Filling in the evidence gap for a flight controller
A team wants to write a new attitude-control module in Rust for a small satellite's Cortex-M7 flight computer. The software is safety-relevant. The code uses `Option`, slices, `f32` arithmetic and a fixed-size buffer from `heapless`, and no heap. Sort what Ferrocene covers from what the team still owes.

Step 1, the compiler. The target, `thumbv7em-none-eabihf`, is on the qualified list, so the translation step comes with qualification evidence. The team must still follow the safety manual's conditions of use and argue the tool choice under their own standard, ECSS-Q-ST-80C here.

Step 2, the library. `Option`, slices and primitive arithmetic are the kind of `core` items the certified subset covers, but the team must check each function it calls against the published list. Any function not on the list is theirs to verify.

Step 3, third-party code. `heapless` is not part of Ferrocene at all. It is ordinary crate code and gets reviewed and tested like the team's own.

Step 4, everything else. Requirements, design, unit tests, structural coverage and reviews of the attitude-control code are entirely the team's work, just as they would be in C.

Result: Ferrocene removes the "can we trust the Rust compiler?" objection for this target. It shrinks the library question. It does not touch steps 3 and 4, which are most of the work.
:::

## Check yourself

::: check
A colleague says: "Our compiler is qualified, so we can skip unit tests on the Rust modules." Using the torque-wrench picture, explain what is wrong.
:::

::: answer
A calibration sticker says the wrench reads true; it does not say any nut is tight. A qualified compiler says its translation from source to machine code is trustworthy for the stated use. It says nothing about whether the source is correct. Unit tests are the evidence that the source does what the requirements say, and the counter overflow example shows a bug a perfect compiler would faithfully reproduce. The tests stay.
:::

::: check
Put the three strictest levels Ferrocene's compiler reaches in the right standard: ASIL D, SIL 3, Class C. Which industry does each standard come from?
:::

::: answer
ASIL D belongs to ISO 26262, road vehicles. SIL 3 belongs to IEC 61508, general industrial safety. Class C belongs to IEC 62304, medical-device software. For ISO 26262 and IEC 62304 these are the top levels; for IEC 61508 the top is SIL 4, one above what the compiler is qualified to.
:::

::: check
Why can no company sell you a compiler with a "DO-178C DAL C certificate"?
:::

::: answer
Because under DO-330 a tool is qualified within a specific project, and the aviation authority accepts that qualification as part of the project's certification. There is no stand-alone certificate for a tool. A vendor can supply qualification documents that make the project's own tool qualification easier, which is what Ferrous Systems offers towards DAL C.
:::

::: check
Your safety-relevant module uses `Vec<f32>` from `alloc`. What library evidence does Ferrocene give you for `Vec`?
:::

::: answer
None. The certified library code is a subset of `core` only; `alloc` and `std` are outside it. The team would owe its own verification evidence for every `Vec` function the module relies on, plus an argument about the allocator. That is one more reason flight code sticks to `core` and fixed-capacity types such as `heapless::Vec`.
:::

::: check
A blog post says: "Ferrocene is the certified Rust compiler for spacecraft." List what is wrong or missing in that sentence.
:::

::: answer
"Certified" should be "qualified": tools are qualified, products are certified. "For spacecraft" is unsupported: Ferrocene's certificates name ISO 26262, IEC 61508 and IEC 62304, plus support towards DO-178C DAL C; there is no space-standard certificate, and a space project must still justify the tool under ECSS-Q-ST-80C. The sentence also skips the limits: only named targets, only a subset of `core`, and no replacement for the project's own verification.
:::

## Summary

| Idea | Meaning | Fact to remember |
|---|---|---|
| Ferrocene | Ferrous Systems' qualified Rust toolchain | Open source, drop-in compatible with upstream rustc |
| Compiler qualification | Evidence that the tool translates correctly for a stated use | Assessed by TÜV SÜD |
| ISO 26262 | Road vehicles | Qualified up to ASIL D |
| IEC 61508 | General industrial | Qualified up to SIL 3 |
| IEC 62304 | Medical-device software | Qualified for Class C |
| DO-178C | Aviation | Customer qualification supported towards DAL C; no certificate, no DAL A |
| Certified core subset | Part of `core` with certification evidence | SIL 2 (Dec 2025), then ASIL B; 2,903 then 5,169 functions |
| Not covered | alloc, std, unlisted targets, your own code | Your verification evidence is still required |
| The one-line rule | Prerequisite versus certification | A qualified compiler is a prerequisite, not a certification |

The next lesson, the last of the Rust track, turns from what a certificate says to what the evidence says: the real ESA-funded Rust work, what is actually known about Rust at SpaceX, and how to tell a primary source from a story that only sounds like one.

::: context ferrous-name Iron all the way down
The names are a chemistry joke. Rust is iron oxide, so "ferrous", from the Latin *ferrum* for iron, fits a Rust company. Ferrocene is a real chemical compound too: an iron atom sandwiched between two flat rings of carbon atoms, discovered in 1951 and famous for being unusually stable. A stable iron compound is a fitting name for a compiler whose whole selling point is that it does not change under you.
:::

::: context upstream-downstream Rivers of code
Open-source projects borrow river words. **Upstream** is the original project, here the Rust compiler maintained by the Rust project. A **downstream** project takes that code and adds to it. A downstream that drifts far away becomes a real fork, with its own bugs and its own language quirks. Ferrocene deliberately stays close: its changes are mostly to the build, test and documentation process, and fixes go back upstream where they can. That is why code moves between Ferrocene and ordinary Rust without edits.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="20" width="120" height="36" rx="6" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="70" y="42" font-size="12" text-anchor="middle" fill="#1f2a44">upstream rustc</text>
  <rect x="210" y="20" width="140" height="36" rx="6" fill="#f2b880" stroke="#1f2a44"/>
  <text x="280" y="42" font-size="12" text-anchor="middle" fill="#1f2a44">Ferrocene release</text>
  <line x1="130" y1="32" x2="206" y2="32" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="206,27 214,32 206,37" fill="#1f2a44"/>
  <text x="170" y="26" font-size="11" text-anchor="middle" fill="#1f2a44">same code</text>
  <line x1="210" y1="48" x2="134" y2="48" stroke="#6c7a93" stroke-width="2" stroke-dasharray="4,3"/>
  <polygon points="134,43 126,48 134,53" fill="#6c7a93"/>
  <text x="170" y="66" font-size="11" text-anchor="middle" fill="#6c7a93">fixes sent back</text>
  <text x="280" y="80" font-size="11" text-anchor="middle" fill="#1f2a44">+ spec, traced tests,</text>
  <text x="280" y="95" font-size="11" text-anchor="middle" fill="#1f2a44">safety manual, reports</text>
</svg>
```
:::

::: context fls-spec A rulebook for a language that had none
For most of its life Rust was defined by its compiler and its reference documentation, not by a formal standard like ISO C. Safety assessors need something firmer: a document that states each language rule in a numbered paragraph, so a test can say "this checks paragraph so-and-so". Ferrous Systems wrote the Ferrocene Language Specification to fill that gap, and in 2025 the Rust project adopted it, so it is now maintained alongside the language itself.
:::

::: context safety-manual The small print that makes the certificate true
A qualification is only valid under stated conditions, and the safety manual is where they are written. It tells the user which targets and which parts of the toolchain are covered, which options or features fall outside the qualified use, and which known problems must be checked for. A team that ignores it is using an unqualified compiler that happens to share a name with a qualified one. Assessors ask to see how each condition was met.
:::

::: context tuv-sud The inspectors from Munich
TÜV stands for *Technischer Überwachungsverein*, German for "technical inspection association". The TÜV organizations began in the 1800s inspecting steam boilers, which exploded often enough to be a public danger. Today TÜV SÜD, headquartered in Munich, tests and certifies everything from elevators and cars to software tools. In safety standards the job is called **independent assessment**: someone who did not build the thing checks the evidence that it is fit for use.
:::

::: context integrity-ladders Three ladders, one idea
Each industry grades how much could go wrong and asks for more evidence as the stakes rise. The ladders do not map exactly onto one another, so never convert "ASIL D" into "DAL A" in conversation.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <text x="60" y="18" font-size="12" text-anchor="middle" fill="#1f2a44">ISO 26262</text>
  <text x="180" y="18" font-size="12" text-anchor="middle" fill="#1f2a44">IEC 61508</text>
  <text x="300" y="18" font-size="12" text-anchor="middle" fill="#1f2a44">IEC 62304</text>
  <rect x="20" y="30" width="80" height="30" fill="#f2b880" stroke="#1f2a44"/>
  <text x="60" y="50" font-size="12" text-anchor="middle" fill="#1f2a44">ASIL D</text>
  <rect x="20" y="64" width="80" height="30" fill="#f2b880" stroke="#1f2a44"/>
  <text x="60" y="84" font-size="12" text-anchor="middle" fill="#1f2a44">ASIL C</text>
  <rect x="20" y="98" width="80" height="30" fill="#f2b880" stroke="#1f2a44"/>
  <text x="60" y="118" font-size="12" text-anchor="middle" fill="#1f2a44">ASIL B</text>
  <rect x="20" y="132" width="80" height="30" fill="#f2b880" stroke="#1f2a44"/>
  <text x="60" y="152" font-size="12" text-anchor="middle" fill="#1f2a44">ASIL A</text>
  <rect x="140" y="30" width="80" height="30" fill="#fff" stroke="#6c7a93"/>
  <text x="180" y="50" font-size="12" text-anchor="middle" fill="#6c7a93">SIL 4</text>
  <rect x="140" y="64" width="80" height="30" fill="#f2b880" stroke="#1f2a44"/>
  <text x="180" y="84" font-size="12" text-anchor="middle" fill="#1f2a44">SIL 3</text>
  <rect x="140" y="98" width="80" height="30" fill="#f2b880" stroke="#1f2a44"/>
  <text x="180" y="118" font-size="12" text-anchor="middle" fill="#1f2a44">SIL 2</text>
  <rect x="140" y="132" width="80" height="30" fill="#f2b880" stroke="#1f2a44"/>
  <text x="180" y="152" font-size="12" text-anchor="middle" fill="#1f2a44">SIL 1</text>
  <rect x="260" y="30" width="80" height="30" fill="#f2b880" stroke="#1f2a44"/>
  <text x="300" y="50" font-size="12" text-anchor="middle" fill="#1f2a44">Class C</text>
  <rect x="260" y="64" width="80" height="30" fill="#f2b880" stroke="#1f2a44"/>
  <text x="300" y="84" font-size="12" text-anchor="middle" fill="#1f2a44">Class B</text>
  <rect x="260" y="98" width="80" height="30" fill="#f2b880" stroke="#1f2a44"/>
  <text x="300" y="118" font-size="12" text-anchor="middle" fill="#1f2a44">Class A</text>
  <text x="180" y="184" font-size="11" text-anchor="middle" fill="#1f2a44">strictest at the top; orange = compiler qualified to this level</text>
</svg>
```
:::

::: context core-subset Which floor got the certificate
Lesson 01's three-story building, with the certified part shaded. Only a slice of the ground floor carries library certification; the compiler that builds all three floors is qualified separately.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <rect x="40" y="14" width="280" height="36" fill="#fff" stroke="#6c7a93"/>
  <text x="180" y="37" font-size="12" text-anchor="middle" fill="#6c7a93">std: not certified</text>
  <rect x="40" y="54" width="280" height="36" fill="#fff" stroke="#6c7a93"/>
  <text x="180" y="77" font-size="12" text-anchor="middle" fill="#6c7a93">alloc: not certified</text>
  <rect x="40" y="94" width="280" height="36" fill="#fff" stroke="#1f2a44"/>
  <rect x="40" y="94" width="170" height="36" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="125" y="117" font-size="12" text-anchor="middle" fill="#1f2a44">certified subset</text>
  <text x="265" y="117" font-size="12" text-anchor="middle" fill="#1f2a44">rest of core</text>
  <text x="180" y="150" font-size="11" text-anchor="middle" fill="#1f2a44">subset: SIL 2 and ASIL B (widths not to scale)</text>
</svg>
```
:::
