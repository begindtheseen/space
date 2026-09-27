---
id: l08-certification-do-178c-and-ecss
title: 'Allowed to fly: DO-178C, coverage, tool qualification and ECSS'
minutes: 24
covers:
  - 'Certification: DO-178C DAL levels, structural coverage, DO-330 tool qualification, ECSS-Q-ST-80C'
---

Think about building inspectors. When a family builds a garden shed, nobody checks much. When a builder puts up a house, an inspector looks at the wiring and the foundations. When a city builds a hospital, inspectors want drawings, test reports, material certificates and signatures for every stage. The inspector never stands in the finished hospital and says "it looks fine". They ask for **evidence**, and the more people could get hurt, the more evidence they ask for.

Flight software is inspected the same way. Nobody can look at a million lines of code and declare them correct. Instead, a set of standards says what evidence a team must produce, and the amount grows with how bad a software failure could be. In civil aviation that standard is **DO-178C**. In European space projects it is **ECSS-Q-ST-80C**. And because the evidence is produced with tools (compilers, test runners, coverage analyzers), a third document, **DO-330**, says when you must also produce evidence about the tools.

This lesson gives you the vocabulary of a certification conversation, so you can judge what bringing Rust into flight code would really cost.

## Certification is about evidence, not a keyword

A certification authority does not approve a programming language, and it does not approve a piece of code because it "looks safe". It approves an aircraft (or, for space, a customer accepts a system), and part of the case for that approval is a body of evidence showing the software does what its requirements say and nothing else.

In aviation the approval comes from an authority such as the FAA in the United States or EASA in Europe. DO-178C, published by **[[RTCA|rtca-eurocae]]** in 2011 (its European twin is EUROCAE ED-12C), is the document those authorities recognize as an acceptable way to show that the software part is sound. Software is never certified on its own; it is approved as part of a specific aircraft or engine.

The evidence has a shape. A team writes **plans** before coding, starting with the **[[PSAC|psac]]**, the Plan for Software Aspects of Certification, which tells the authority how the team intends to comply. Then it keeps **[[traceability|traceability]]**: every high-level requirement traces down to low-level requirements, to the code that implements them, and to the tests that verify them, and every line of code traces back up to a requirement. At the end, a Software Accomplishment Summary states what was done and whether the plans were followed.

This is why a keyword like Rust's `unsafe` does not end the conversation. Certification asks: is every part of the code backed by requirements, reviews and tests, and can an auditor follow the argument? An `unsafe` block is a place where the compiler's checks stop and a human's argument takes over. If that block is small, has its invariants written down, sits behind a safe API, has been reviewed and has been run under **miri** (the interpreter from the ownership module that detects undefined behaviour), then it is exactly the kind of evidence an auditor can check. The safe code around it keeps all of its compiler-checked guarantees.

::: key
unsafe is not a certification dealbreaker, because certification cares about evidence, not about the absence of a keyword. unsafe blocks that are small, documented with their invariants, wrapped in safe APIs, reviewed and checked with miri are auditable, and the surrounding safe code still carries its guarantees.
:::

::: warning "Certified" is the wrong word for code or tools
Products are certified: an aircraft gets a type certificate. Software is *approved as part of* that product, and tools are *qualified* for use on a project. Saying "a DO-178C certified compiler" marks you as someone who has not done this work. Precise words are cheap credibility.
:::

## DAL: how much evidence is enough

Before any code is written, the aircraft's system safety assessment asks: if this software misbehaved, what is the worst thing that could happen? That process, described in the aerospace recommended practices **[[ARP4754A and ARP4761|arp-safety]]**, assigns each software item a **Design Assurance Level**, or **DAL** (read "D-A-L" or "dal"). There are five, from A (the worst possible failure) down to E.

| DAL | Worst failure condition | Example of the effect | DO-178C objectives |
|---|---|---|---|
| A | Catastrophic | Could prevent continued safe flight and landing | 71 |
| B | Hazardous | Large reduction in safety margins; serious or fatal injury to some occupants | 69 |
| C | Major | Significant reduction in safety margins; discomfort or possible injuries | 62 |
| D | Minor | Slight reduction in safety margins; a nuisance for the crew | 26 |
| E | No safety effect | No effect on safety or crew workload | 0 |

An **objective** is one thing the team must show it achieved: "low-level requirements are accurate and consistent", "the code complies with the coding standard", "tests achieve MC/DC coverage", and so on. DO-178C lists them in tables in its Annex A, with a mark for which levels must meet each one.

At the higher levels, more objectives must be met **with [[independence|independence]]**, which means the person who checks a piece of work must not be the person who made it. Independence is a large share of the extra cost of DAL A and B: more people, more reviews, more records.

A primary flight control computer is usually DAL A; a cabin entertainment system is usually DAL E.

::: key
DO-178C DAL runs from A (catastrophic failure condition) through B (hazardous), C (major) and D (minor) to E (no safety effect). The number of objectives falls with the level: 71 at A, 69 at B, 62 at C, 26 at D, none at E. More of them require independence at the higher levels.
:::

## Structural coverage: did the tests really exercise the code?

Picture a school fire drill. Someone walks the halls with a clipboard and ticks off each emptied classroom. A room nobody ticked was either missed or unknown. Both are worth knowing.

**Structural coverage** is that clipboard for code. The team writes tests from the *requirements*, runs them, and measures which parts of the code actually ran. The point is not to poke at the code until every line has run. It is that any code the requirement-based tests did not reach is a question: is a requirement missing, is a test missing, or is this **[[dead code|dead-code]]** that should not be there at all?

DO-178C asks for three strengths of coverage, and the level decides which:

- **Statement coverage** (DAL C and above): every statement in the program has run at least once.
- **Decision coverage** (DAL B and above): every point of entry and exit has been reached, and every **decision** (the whole true-or-false question in an `if`, a `while` or a `match` guard) has come out both true and false.
- **Modified condition/decision coverage**, **MC/DC** (DAL A): on top of decision coverage, every **condition** (each single true-or-false piece joined by `&&` or `||` inside a decision) has taken both values, and each condition has been shown to *independently* change the decision's outcome.

"Independently" is the heart of MC/DC. It means you can point at two tests where only that one condition changed, and the decision's answer changed with it. That proves the condition is really wired into the logic, and not, say, masked by a mistake that makes it irrelevant.

::: key
DO-178C structural coverage: statement coverage for DAL C, plus decision coverage for DAL B, plus MC/DC for DAL A. MC/DC shows each condition independently affects its decision's outcome, which for a decision with $N$ conditions takes at least $N + 1$ tests instead of the $2^N$ of trying every combination.
:::

::: example MC/DC for a three-condition abort decision
A pad-abort command fires if both pressure sensors agree the chamber pressure is low, or if the crew presses the manual abort switch. Call the conditions $a$ (sensor A low), $b$ (sensor B low) and $c$ (manual switch). The decision is $(a \wedge b) \vee c$, read "a and b, or c".

First, the full truth table. With three conditions there are $2^3 = 8$ rows. Write T for true and F for false.

| Row | a | b | c | abort |
|---|---|---|---|---|
| 1 | F | F | F | F |
| 2 | F | F | T | T |
| 3 | F | T | F | F |
| 4 | F | T | T | T |
| 5 | T | F | F | F |
| 6 | T | F | T | T |
| 7 | T | T | F | T |
| 8 | T | T | T | T |

Now find, for each condition, a pair of rows that differ in *only* that condition and give different answers.

- **Condition a.** Rows 3 and 7 differ only in $a$ (F versus T, with $b$ = T and $c$ = F in both). The answer goes F to T. That is the only such pair for $a$: when $c$ is T the answer is always T, and when $b$ is F the $a \wedge b$ part is always F.
- **Condition b.** Rows 5 and 7 differ only in $b$ (with $a$ = T, $c$ = F). The answer goes F to T. Again the only pair.
- **Condition c.** Rows 1 and 2, rows 3 and 4, and rows 5 and 6 all work: whenever $a \wedge b$ is F, flipping $c$ flips the answer.

Pick the smallest set that contains a pair for every condition. Rows 3, 5 and 7 are forced (they give the only pairs for $a$ and $b$). For $c$ we need one more row that pairs with 3 or 5: row 4 pairs with 3, and row 6 pairs with 5. So **four tests** do it, for example rows 3, 5, 6 and 7:

| Test | a | b | c | abort | shows |
|---|---|---|---|---|---|
| Row 3 | F | T | F | F | a (with row 7) |
| Row 5 | T | F | F | F | b (with row 7), c (with row 6) |
| Row 6 | T | F | T | T | c (with row 5) |
| Row 7 | T | T | F | T | a and b |

Four tests is $N + 1$ for $N = 3$, the minimum. That growth rate is why MC/DC is affordable: a decision with 10 conditions has $2^{10} = 1024$ combinations but needs as few as 11 MC/DC tests. The minimum is not always reachable, though, so flight code keeps decisions small. Compare the weaker measures on the same code: **one** test that aborts (say row 7) runs every statement; **two** tests, one true and one false (rows 7 and 3), give decision coverage but never show that $b$ or $c$ matters.

Here are the four tests as a Rust program. Notice that in row 3, where $a$ is F, Rust never even reads $b$: the `&&` operator **[[short-circuits|short-circuit]]**. Certification guidance accepts MC/DC arguments that allow for this, but your coverage tool must understand it to report MC/DC correctly.

```rust
/// Command an abort if both pressure sensors agree the pressure is low,
/// or if the crew pressed the manual abort switch.
fn abort(press_low_a: bool, press_low_b: bool, manual: bool) -> bool {
    (press_low_a && press_low_b) || manual
}

fn main() {
    // The four MC/DC test cases: (a, b, c, expected)
    let cases = [
        (false, true, false, false), // T3
        (true, false, false, false), // T5
        (true, false, true, true),   // T6
        (true, true, false, true),   // T7
    ];
    for (a, b, c, want) in cases {
        let got = abort(a, b, c);
        assert_eq!(got, want);
        println!("a={a:<5} b={b:<5} c={c:<5} -> abort={got}");
    }
}
```

```text
a=false b=true  c=false -> abort=false
a=true  b=false c=false -> abort=false
a=true  b=false c=true  -> abort=true
a=true  b=true  c=false -> abort=true
```

Sanity check: suppose a bug had written `press_low_a || press_low_b`, so a single failed sensor could abort the flight. Row 5 ($a$ = T, $b$ = F, $c$ = F) would then give T instead of the expected F, and the test would fail. The decision-coverage pair (rows 7 and 3) would pass with the bug in place.
:::

::: warning Coverage of what the compiler wrote, too
Coverage is usually measured on the source code. But the chip runs object code, and a compiler can add branches the source does not show. In Rust these include array bounds checks, integer overflow checks in debug builds, and the hidden early return inside the `?` operator. For DAL A, DO-178C asks for extra analysis whenever the object code contains code that does not trace directly to the source. A Rust team must explain every such branch: which tests reach it, or why none can. And check what your coverage tool measures: stable Rust's `-C instrument-coverage` reports line and region coverage, not MC/DC.
:::

## DO-330: evidence about the tools

A tool can break the chain of evidence in two ways. A tool that *makes* flight code, such as a code generator, can insert an error. A tool that *checks* flight code, such as a coverage analyzer, can miss one.

**Tool qualification** is the process of producing evidence that a tool does its job. **DO-330**, *Software Tool Qualification Considerations*, published alongside DO-178C in 2011, says how. DO-178C decides *whether* a tool must be qualified and *how hard*, using three **criteria**:

- **Criteria 1**: the tool's output is part of the airborne software, so it could insert an error. A code generator is the classic example.
- **Criteria 2**: the tool automates verification, and its output is used to justify cutting back other verification or development steps. For example, a tool whose results are used to skip a manual code review.
- **Criteria 3**: the tool could fail to detect an error, within its intended use. A structural coverage analyzer is the typical case.

Combine the criteria with the software's DAL and you get a **Tool Qualification Level**, **TQL**, from TQL-1 (most rigorous) to TQL-5 (least):

| Criteria | DAL A | DAL B | DAL C | DAL D |
|---|---|---|---|---|
| 1 | TQL-1 | TQL-2 | TQL-3 | TQL-4 |
| 2 | TQL-4 | TQL-4 | TQL-5 | TQL-5 |
| 3 | TQL-5 | TQL-5 | TQL-5 | TQL-5 |

::: key
DO-330 is the tool qualification standard used with DO-178C. A tool's criteria (1: could insert an error; 2: automates verification and is used to reduce other processes; 3: could fail to detect an error) and the software's DAL give its TQL, from TQL-1 (most rigorous) to TQL-5. Tools are qualified inside a specific project, never certified on their own.
:::

::: example Where does each tool land?
**A code generator producing DAL B flight code.** Its output is flight code, so criteria 1. Row 1, column B: **TQL-2**, close to the rigor of the flight code itself.

**A coverage analyzer used on DAL A code.** It can only fail to notice that code was not covered; it cannot put errors into the flight code. Criteria 3. Row 3, column A: **TQL-5**, the lightest level, even though the flight software is DAL A.

**A static analyzer on DAL C code whose clean result lets the team drop a manual review of those checks.** It automates verification and replaces another process: criteria 2. Row 2, column C: **TQL-5**.

Sanity check: the heaviest burden falls on tools that write the most critical flight code, the lightest on tools that can only miss something. That matches the risk.
:::

What about the compiler? Its output, object code, *is* the flight software. Yet most DO-178C projects do not qualify their compiler. They verify its output instead: requirement-based tests run on the real object code, and coverage plus source-to-object analysis catch what the compiler did. Qualifying a compiler can still shorten that work and strengthen the argument, which is the role the next lesson's Ferrocene plays. But a qualified compiler never replaces your own verification.

## ECSS-Q-ST-80C: the European space view

A satellite is not approved by an aviation authority. It is built under a **contract** between a customer (for European missions, often ESA or a national agency) and a supplier (an industrial prime contractor and its subcontractors). The standards come from **[[ECSS|ecss-origin]]**, the European Cooperation for Space Standardization. Two of them matter most for software:

- **ECSS-E-ST-40C**, software engineering: the life cycle, the reviews and the documents to produce.
- **ECSS-Q-ST-80C**, software product assurance: how quality and safety of the software are assured, including verification, the choice of methods and tools, and how much rigor each part of the software gets.

Instead of DAL, ECSS-Q-ST-80C uses **software criticality categories**, lettered A to D. The category comes from the worst consequence of the software failing, judged at system level:

| Category | Worst consequence of a software failure |
|---|---|
| A | Catastrophic |
| B | Critical |
| C | Major |
| D | Minor or negligible |

The higher the category, the more the standard asks for: more independent verification, more code coverage, with the strictest coverage measures for category A, and stricter justification of tools. One difference from aviation matters a great deal in practice: ECSS standards are **tailored**. For each project, the customer and supplier agree which requirements apply and how, and write that down. There is no single fixed list of objectives per category that every mission uses unchanged. What every mission shares is the reason the standard exists: space software fails in expensive ways, as the [[first Ariane 5|ariane-501]] showed the whole industry.

ECSS-Q-ST-80C also asks projects to justify the tools they use. Qualification evidence from another domain helps, but the space project still makes that argument under its own standard.

::: key
ECSS-Q-ST-80C is the European space standard for software product assurance. It grades software into criticality categories A (catastrophic) to D (minor or negligible), is tailored per project by customer and supplier, and works alongside ECSS-E-ST-40C for software engineering.
:::

::: warning Do not translate between ladders
DAL A, ECSS category A, the automotive ASIL D and the industrial SIL 3 all mean "the top end of this industry's scale", but they are defined differently and demand different evidence. Never say "DAL A is the same as ASIL D". Say which standard you mean, and what it asks for.
:::

## What this means for bringing Rust into flight code

The language's safety is a genuine help: whole classes of memory bugs never reach review. But the certification work does not shrink to zero. A Rust module still needs plans that say how Rust is used, a Rust coding standard, traceability, requirement-based tests, structural coverage at the level the DAL or category demands, an argument about compiler-inserted branches, a justified toolchain, and a team skilled enough to do all of it. Some of those tools are mature for C and young for Rust.

That is not a reason to say no. It is the honest cost list that belongs in any recommendation, including this module's memo exercise.

## Check yourself

::: check
A decision reads `if armed && (cmd > 0.0) { ignite(); }`. Give a smallest set of test cases for statement coverage, for decision coverage and for MC/DC.
:::

::: answer
Call the conditions $a$ (armed) and $p$ (`cmd > 0.0`). Statement coverage needs one test where `ignite()` runs: $a$ = T, $p$ = T. Decision coverage adds a test where the decision is false, for example $a$ = F, $p$ = T. MC/DC needs each condition to flip the outcome alone: (T, T) gives T; (F, T) gives F, showing $a$ matters; (T, F) gives F, showing $p$ matters. So three tests, $N + 1$ with $N = 2$.
:::

::: check
A team uses an automatic code generator to produce DAL C flight code, and a structural coverage tool on the same code. What TQL does each tool need?
:::

::: answer
The code generator's output is part of the airborne software, so it is criteria 1; at DAL C that is TQL-3. The coverage tool can only fail to detect missing coverage, so it is criteria 3, which is TQL-5 at every DAL.
:::

::: check
A job candidate says: "Rust can't be used in safety-critical software, because it has `unsafe`." Write a two-sentence reply.
:::

::: answer
Certification is judged on evidence, not on whether a keyword appears: a small `unsafe` block with written invariants, a safe wrapper, review and miri runs is an auditable piece of that evidence, and the safe code around it keeps its compiler-checked guarantees. C and C++, where every line has the powers `unsafe` fences off, are used at DAL A every day, so the question is always the quality of the evidence, not the presence of a trapdoor.
:::

::: check
How does the way ECSS-Q-ST-80C is applied differ from the way DO-178C is applied?
:::

::: answer
DO-178C is recognized by aviation authorities such as the FAA and EASA, and its Annex A tables give a fixed set of objectives for each DAL, which the applicant shows to the authority. ECSS-Q-ST-80C is applied through a contract between a space customer and supplier, and it is tailored for each project: the two sides agree which requirements apply to each criticality category, and the customer accepts the result.
:::

## Summary

| Idea | Meaning | The fact to remember |
|---|---|---|
| DO-178C | Aviation software standard (EUROCAE ED-12C) | Evidence scaled to the DAL; software approved as part of an aircraft |
| DAL A–E | Design Assurance Level | Catastrophic, hazardous, major, minor, no effect; 71, 69, 62, 26, 0 objectives |
| Independence | Checker is not the author | Required for more objectives at higher DALs |
| Statement / decision / MC/DC | Structural coverage | DAL C / B / A; MC/DC needs at least $N + 1$ tests |
| DO-330 | Tool qualification | Criteria 1–3 plus DAL give TQL-1 to TQL-5 |
| ECSS-Q-ST-80C | European space software product assurance | Categories A–D; tailored per project |
| `unsafe` | Where the human argument takes over | Acceptable when small, documented, wrapped, reviewed and miri-checked |

The next lesson takes these words to Ferrocene, the qualified Rust toolchain, and pins down exactly which of these standards its qualification covers and which it does not.

::: context rtca-eurocae Who writes the aviation software standard
RTCA, founded in 1935 as the Radio Technical Commission for Aeronautics, is a US nonprofit where industry and government write technical standards together; EUROCAE is its European counterpart. The DO-178 series has a long history: the first version appeared in 1982, DO-178B in 1992 served the industry for nearly two decades, and DO-178C replaced it in 2011 together with four supplements: DO-330 on tools, DO-331 on model-based development, DO-332 on object-oriented technology and DO-333 on formal methods.
:::

::: context psac The plan that comes first
The Plan for Software Aspects of Certification is the first document the authority sees. It describes the system, the software's DAL, the life cycle, the tools and how each objective will be met. It sits on top of a set of more detailed plans for development, verification, configuration management and quality assurance. The authority reviews the team's progress at several points during the project, so a team cannot write the plan at the end to match what it happened to do.
:::

::: context traceability A chain you can follow both ways
Traceability links each requirement to the code that implements it and the tests that verify it. Following the chain downward shows every requirement was built and tested. Following it upward shows every line of code exists for a reason. Teams keep these links in a requirements tool or as tags in the code and tests, and auditors sample them.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="20" width="75" height="40" rx="4" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="47" y="44" font-size="11" text-anchor="middle" fill="#1f2a44">High-level</text>
  <rect x="100" y="20" width="75" height="40" rx="4" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="137" y="44" font-size="11" text-anchor="middle" fill="#1f2a44">Low-level</text>
  <rect x="190" y="20" width="70" height="40" rx="4" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="225" y="44" font-size="11" text-anchor="middle" fill="#1f2a44">Code</text>
  <rect x="275" y="20" width="75" height="40" rx="4" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="312" y="44" font-size="11" text-anchor="middle" fill="#1f2a44">Tests</text>
  <line x1="85" y1="36" x2="100" y2="36" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="175" y1="36" x2="190" y2="36" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="260" y1="36" x2="275" y2="36" stroke="#1d6fd1" stroke-width="2"/>
  <path d="M 312 60 C 312 110, 47 110, 47 60" fill="none" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="5 4"/>
  <text x="180" y="130" font-size="12" text-anchor="middle" fill="#1f2a44">every test traces back to a requirement</text>
</svg>
```
:::

::: context arp-safety Where the DAL comes from
ARP4754A (guidelines for developing aircraft and systems) and ARP4761 (safety assessment methods), both from the standards body SAE, describe how an aircraft's functions are analysed for what could go wrong, and how bad each failure would be. The DAL of each software item falls out of that analysis. The software team does not pick its own DAL; it inherits one from the system safety work, which is why a GNC engineer ends up in those meetings.
:::

::: context independence Why the author cannot be the checker
People are poor at spotting their own mistakes, because they read what they meant to write. Independence rules make sure a second person, or a tool, does the verification. It is the same reason a school essay improves when a friend reads it. At DAL A, independence covers many verification activities, including checking that the tests achieve their coverage.
:::

::: context dead-code Dead code and deactivated code
Dead code is code that no requirement asks for and that cannot be reached in any configuration; DO-178C expects it to be removed. Deactivated code is different: it is there on purpose, for example a feature switched off on one aircraft model but used on another, and the team must show it cannot run by accident where it is off.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="20" width="150" height="70" rx="6" fill="#fff" stroke="#b4232c" stroke-width="1.5"/>
  <text x="95" y="45" font-size="12" text-anchor="middle" fill="#b4232c">Dead code</text>
  <text x="95" y="65" font-size="11" text-anchor="middle" fill="#1f2a44">no requirement</text>
  <text x="95" y="81" font-size="11" text-anchor="middle" fill="#1f2a44">remove it</text>
  <rect x="190" y="20" width="150" height="70" rx="6" fill="#fff" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="265" y="45" font-size="12" text-anchor="middle" fill="#1d6fd1">Deactivated code</text>
  <text x="265" y="65" font-size="11" text-anchor="middle" fill="#1f2a44">switched off here</text>
  <text x="265" y="81" font-size="11" text-anchor="middle" fill="#1f2a44">prove it stays off</text>
</svg>
```
:::

::: context short-circuit Why the second half may never run
In `a && b`, if `a` is false the whole thing is false no matter what `b` is, so Rust, like C and C++, skips evaluating `b`. The same holds for `a || b` when `a` is true. Programmers rely on this, as in `ptr_ok && read(ptr)`. For coverage it means some conditions are never looked at in some tests, and the tool must track which ones were.
:::

::: context ecss-origin A shared rulebook for European space
ECSS was set up in 1993 by ESA, several national space agencies and European industry, to replace the many separate standards each agency had used with one coherent set. Its documents are grouped into branches: M for project management, E for engineering, Q for product assurance and U for sustainability. That is why the software pair is E-ST-40 (engineering) and Q-ST-80 (product assurance).

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="8" y="15" width="80" height="48" rx="4" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="48" y="36" font-size="14" text-anchor="middle" fill="#1f2a44">M</text>
  <text x="48" y="54" font-size="11" text-anchor="middle" fill="#1f2a44">management</text>
  <rect x="96" y="15" width="80" height="48" rx="4" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="136" y="36" font-size="14" text-anchor="middle" fill="#1f2a44">E</text>
  <text x="136" y="54" font-size="11" text-anchor="middle" fill="#1f2a44">engineering</text>
  <rect x="184" y="15" width="80" height="48" rx="4" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="224" y="36" font-size="14" text-anchor="middle" fill="#1f2a44">Q</text>
  <text x="224" y="54" font-size="11" text-anchor="middle" fill="#1f2a44">assurance</text>
  <rect x="272" y="15" width="80" height="48" rx="4" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="312" y="36" font-size="14" text-anchor="middle" fill="#1f2a44">U</text>
  <text x="312" y="54" font-size="11" text-anchor="middle" fill="#1f2a44">sustainability</text>
  <text x="136" y="88" font-size="12" text-anchor="middle" fill="#1f2a44">E-ST-40C</text>
  <text x="224" y="88" font-size="12" text-anchor="middle" fill="#1f2a44">Q-ST-80C</text>
  <text x="180" y="116" font-size="11" text-anchor="middle" fill="#6c7a93">the two software standards</text>
</svg>
```
:::

::: context ariane-501 The software failure every space engineer knows
On 4 June 1996 the first Ariane 5 broke up about 40 seconds after lift-off. Its inertial reference software, reused from Ariane 4, converted a 64-bit floating-point value to a 16-bit signed integer. Ariane 5's faster trajectory made the value too big, the conversion raised an unhandled exception, and both the main and the backup unit shut down the same way, because they ran identical code. The inquiry found that the function involved did nothing useful after lift-off. The lesson that stuck: reused software needs its assumptions re-verified against the new vehicle, which is what product assurance standards exist to force.
:::
