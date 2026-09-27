---
id: l10-rust-in-space-the-evidence
title: 'Rust in space: what the evidence actually says'
minutes: 24
covers:
  - 'ESA activity: cRustacea in Space (DLR), the armv7-rtems-eabihf target, ADCSS 2024'
  - 'What the evidence actually supports about Rust at SpaceX, and the fabricated claims to reject'
---

Imagine a rumor running down the school hallway: "Tomorrow's math test is canceled!" By lunch, everyone has heard it. Half the class believes it because *everyone* is saying it. Then one careful student walks to the math room and reads the notice on the door: "Test moved to Friday." One sheet of paper, written by the one person who decides, beats a hundred retellings.

That walk to the classroom door is the most useful habit in this whole lesson. The retellings are **secondary sources**: people passing on what they heard. The notice on the door is a **primary source**: a record made by someone in a position to know, which you can go and look at yourself.

Rust in space is a topic full of hallway rumors. Some are true, some are half true, and some were made up by software that writes articles nobody checked. This lesson, the last of the Rust track, does two jobs. It tells you what is really known: two ESA-funded Rust activities with results you can inspect, and the thin but real evidence about Rust at SpaceX. And it teaches you to weigh evidence, so you can sort the next rumor yourself, in an interview or in a design review, before it costs you your credibility.

## Primary, secondary, and the stuff in between

Here are the kinds of source you will meet, from strongest to weakest for a question like "does organization X use Rust?".

- A **primary source** is made by the people who did the work, close to when they did it, and you can inspect it. Examples: code merged into a public repository, a contract listing on the funding agency's own website, the slides a team presented at a conference, a company's own job posting, a peer-reviewed or preprint paper by the engineers involved.
- A **secondary source** reports on primary sources: a news article about the conference talk, a blog post summarizing the paper. A good one links to what it summarizes, so you can walk to the door yourself.
- A **tertiary source** summarizes summaries: encyclopedia pages, listicles, and the automatic answers a search engine writes. Useful for finding leads, never for settling a question.
- **No source at all** is a claim that points to nothing you can check. It may be very detailed. Detail is not evidence.

To judge any claim, ask five questions.

1. **Who made it?** A named person or organization, or nobody in particular?
2. **Could they know?** Were they involved, or are they repeating someone?
3. **Can I inspect the thing itself?** The code, the PDF on the agency's server, the posting.
4. **Does anything independent agree?** Two sources that copy each other count as one.
5. **Does the detail outrun the sourcing?** Precise numbers with no named origin are a warning sign, not a comfort.

::: warning Repetition is not confirmation
Ten articles that all trace back to one unsourced blog post are one unsourced claim, printed ten times. This is called **[[circular reporting|circular-reporting]]**, and it is how most false technical "facts" spread. Always ask what the *first* source was, not how many places repeat it.
:::

## ESA activity one: cRustacea in Space

The **European Space Agency** (ESA) funds a lot of small studies that test new ideas for spacecraft software before anyone bets a mission on them. One of them was run by the Institute for Software Technology of **[[DLR|dlr]]**, the German Aerospace Center. Its name is a pun worth decoding: "cRustacea" hides both **C** and **Rust**, because the study was about C and Rust code working together.

The activity's full title is "Crustacea in space: co-operative Rust and C embedded applications in space, theory and practice". It looked at the whole chain a real project would face:

- the **tools**: can you build Rust for the operating systems European spacecraft already use?
- **existing code**: how do Rust and C live side by side, the extern "C" path from lesson 05?
- **assurance**: what does Rust mean for the ECSS standards from lesson 08, in particular ECSS-E-ST-40C (software engineering) and ECSS-Q-ST-80C (software product assurance)?

The operating system was **[[RTEMS|rtems]]**, a free real-time operating system widely used in European and NASA spacecraft. The team ported Rust's standard library, `std`, to RTEMS. That is a bigger deal than it sounds. Lesson 01 showed that `std` needs an operating system underneath for threads, files and time. RTEMS offers those, so a Rust program on RTEMS can use the top floor of the building, not only `core`.

To make that work, the Rust compiler needed to know about a new **target**, a name for a processor-plus-system combination. The team added `armv7-rtems-eabihf`: 32-bit Armv7 processors, running RTEMS, using the hardware floating-point calling convention ("eabihf", read "E-A-B-I hard-float"). That target was accepted into the official Rust compiler as a **[[Tier 3|rust-tiers]]** target, which means the code is in the compiler but the Rust project does not build or test it for you.

DLR presented the results at **[[ADCSS 2024|adcss]]**, the 18th ESA Workshop on Avionics, Data, Control and Software Systems, held 22 to 24 October 2024 at ESA's technical center in the Netherlands. The talk was titled "Rust for Space applications and RTEMS: The good, the bad and the ECSS". It reported success in porting `std` to RTEMS, and it argued that Rust provides the tools needed for ECSS qualification. The slides and proceedings are on ESA's and DLR's own servers.

Check that against the five questions. Made by the team that did the work. They could know. You can inspect the result: the target is in the compiler itself. Independent agreement: ESA published the talk in its own workshop program. This is about as strong as evidence gets.

::: example Verify the RTEMS target yourself
You do not need to take anyone's word that the target exists. Ask your own compiler. This is Rust 1.94.1:

```text
$ rustc --print target-list | grep rtems
armv7-rtems-eabihf
```

There it is, among the 308 targets this compiler knows. Now ask what the compiler believes about it:

```text
$ rustc --print cfg --target armv7-rtems-eabihf
debug_assertions
panic="unwind"
target_abi="eabihf"
target_arch="arm"
target_endian="little"
target_env="newlib"
target_family="unix"
...
target_os="rtems"
target_pointer_width="32"
```

Read the lines one by one. `target_arch="arm"` and `target_pointer_width="32"`: a 32-bit Arm chip. `target_os="rtems"`: an operating system is there, unlike the `none` in `thumbv7em-none-eabihf`. `target_family="unix"` and `target_env="newlib"`: RTEMS offers a Unix-like interface on top of the newlib C library, which is what let the team reuse Rust's existing Unix code for `std`.

Finally, try to install a ready-made standard library for it:

```text
$ rustup target add armv7-rtems-eabihf
error: toolchain 'stable-x86_64-unknown-linux-gnu' has no prebuilt artifacts available for target 'armv7-rtems-eabihf'
```

That error is not a problem with the claim. It is exactly what Tier 3 means: the support is in the compiler, and you build the library yourself. In about a minute you have checked a primary artifact with your own tools, which beats any article about it.
:::

## ESA activity two: a Rust RTOS on a Cortex-M7

The second activity is listed on ESA's activities website under the number 4000140241, titled "Evaluation of Rust usage in space applications by developing BSP and RTOS targeting SAMV71". The contractor was N7 Space, a Polish space-software company.

Unpack the title with what you already know.

- **SAMV71** is a microcontroller from Microchip built around an Arm **Cortex-M7**, the same family as lessons 01 to 04, and closely related to a **[[radiation-hardened sibling|samv71-samrh71]]** made for space.
- A **BSP**, or board support package, is the layer of drivers for one board's peripherals, like the HAL crates of lesson 02.
- An **RTOS** is a real-time operating system. Theirs is called **[[Aerugo|aerugo-name]]**. Instead of a classic scheduler it uses an **executor** that runs **tasklets**: small units of work that each run one processing step in a bounded time and then hand control back. That is close in spirit to the Embassy and RTIC ideas of lesson 03.
- A **demonstration application** showed it working with the board and sensors.

The team gave the project's final presentation at ESA's software and avionics final-presentation days in June 2024, and Aerugo and the BSP are open source on GitHub. Again: named team, inspectable code, published by the agency itself.

::: key Name two verifiable ESA Rust activities
cRustacea in Space (DLR), which ported the Rust standard library to RTEMS and upstreamed the Tier-3 target armv7-rtems-eabihf, presented at ADCSS 2024; and ESA activity 4000140241, a Rust RTOS with a board support package and demo application on an ARM Cortex-M7 SAMV71.
:::

Alongside these sits an academic paper from the module's reading list: "Bringing Rust to Safety-Critical Systems in Space" by Lukas Seidel and Julian Beier, posted on **[[arXiv|arxiv]]** in 2024 and written for the IEEE Security for Space Systems workshop. It gives a set of recommendations for writing space software in Rust, and it says plainly that industry uptake in safety-critical settings is still lacking. Notice that this is a primary source *for its own argument* and a sober one: it does not claim Rust is flying everywhere.

::: warning A study is not a mission
Both ESA activities are evaluations: small, funded studies that produced a target, an RTOS, a report and recommendations. Neither is a spacecraft flying Rust flight software. When you cite them, say what they produced. "ESA funded Rust evaluations that upstreamed an RTEMS target and built a Cortex-M7 RTOS" is true. "ESA flies Rust" is not supported by either.
:::

## Rust at SpaceX: the whole of the evidence

Now the company everyone asks about. What do primary sources say about SpaceX and Rust?

There is one piece of evidence: a SpaceX job posting for a **Starlink Embedded Software Engineer (Customer Hardware)**. It listed development experience in C, C++, Golang, Python *or* Rust. Read that word "or" carefully. Rust is one of five acceptable languages for a role working on Starlink's customer hardware, the equipment on the user's end. That is the full extent of it.

What does it support? That SpaceX accepts Rust experience for some embedded work. What does it not support? That Rust is required, that Rust is used in vehicle flight software, or anything at all about Falcon, Dragon or Starship.

For contrast, members of SpaceX's software team answered public questions on Reddit in 2020 and described the flight software as largely C++. That is a primary source too, though an informal one and now several years old. Nothing primary since then says the flight software moved to Rust.

::: key What is the actual evidence for Rust at SpaceX?
One Starlink Embedded Software Engineer (Customer Hardware) posting listing development experience in C, C++, Golang, Python or Rust. That is the full extent. Rust is accepted for some embedded work, not required, and not on the vehicle flight-software path.
:::

::: note Job postings are primary, but fragile
A company's own posting is primary evidence about what a team asks for. It is also temporary: postings are edited and taken down, and one posting speaks for one team at one time. If you ever cite one, save a copy, for example through the **[[Internet Archive|web-archive]]**, and quote its words exactly, including the "or".
:::

## The claims to reject

Two claims travel widely online, often with impressive detail.

1. That SpaceX rewrote parts of **Starship flight control in Rust**, running at 1000 Hz for **thrust vector control** (steering the rocket by swiveling its engines).
2. That **NASA's Mars Sample Return** mission runs **Rust path planning**.

Neither has a primary source. No SpaceX engineer, paper, talk, repository or posting says the first. No NASA or JPL document says the second. Both trace back to AI-generated **[[content farms|content-farms]]**: websites that mass-produce articles on popular keywords with no one checking whether they are true.

::: key Which widely circulated Rust-in-space claims should you reject?
That SpaceX rewrote parts of Starship flight control in Rust running at 1000 Hz for thrust vector control, and that NASA Mars Sample Return runs Rust path planning. No primary source exists for either; both trace to AI-generated content farms. Repeating them in an interview is a credibility risk.
:::

Why is repeating them a risk rather than a harmless mistake? Because the person across the table may know. An interviewer who works in flight software, or reads carefully, hears a confident false fact and starts wondering what else you believe without checking. The same care that makes a good GNC engineer, checking the units, checking the sign, checking the source, is on display in how you talk about tools.

::: example Tracing the Starship claim
Run the five questions on "SpaceX rewrote Starship flight control in Rust at 1000 Hz".

1. **Who made it?** Typically an unsigned or generic-bylined blog article, with no named SpaceX person quoted.
2. **Could they know?** Nothing shows the writer had any contact with SpaceX. Details of a launch vehicle's flight software are also the kind of information export-control rules restrict, so engineers do not casually publish them.
3. **Can I inspect the thing?** No repository, paper, talk or posting is linked. Search SpaceX's own site and its engineers' public talks: nothing.
4. **Does anything independent agree?** The copies all trace back to the same kind of article. That is circular reporting, not agreement.
5. **Does the detail outrun the sourcing?** Badly. "1000 Hz", "thrust vector control", "microsecond precision" are precise-sounding numbers attached to zero sources.

Score: no primary source, no independent confirmation, suspiciously exact detail. Reject.

A real twist from writing this lesson: a web search for a fact check of this claim returned an automatic search-engine summary that repeated the claim *as fact*, citing only such a blog post, and then added that it could not find corroboration. The tertiary layer faithfully copied the fabrication. That is why you walk to the door yourself.
:::

::: example Grading six claims
Grade each claim as **supported** (primary evidence you can inspect), **partly supported** (a true core with an overreach) or **unsupported** (no primary source).

| Claim | Best source | Grade |
|---|---|---|
| The Rust compiler has an RTEMS target | The compiler's own target list | Supported |
| DLR ported `std` to RTEMS under ESA funding | ADCSS 2024 talk and proceedings | Supported |
| ESA funded a Rust RTOS for a Cortex-M7 | ESA activity 4000140241, open-source code | Supported |
| SpaceX uses Rust | One Starlink posting listing it as one option | Partly supported |
| Starship steers its engines with Rust at 1000 Hz | None | Unsupported |
| Mars Sample Return plans its paths in Rust | None | Unsupported |

Walk through the "partly" row, since it is the subtle one. The true core: a SpaceX posting accepts Rust experience. The overreach: "uses" suggests Rust runs somewhere important at SpaceX. The honest version keeps the true core and drops the rest: "A Starlink embedded posting listed Rust as one acceptable language."

Sanity check the table: three supported rows, one partly supported and two unsupported add up to the six claims, and every "supported" row names a thing you could open today.
:::

## Where this leaves Rust, and you

Put the whole module together and a fair picture appears. Rust is technically ready for small embedded systems: `no_std`, embedded-hal, RTIC and Embassy, heapless, nalgebra without allocation. It has a qualified compiler with a precisely stated scope, as lesson 09 showed. European agencies are funding careful evaluations. And adoption in real flight software remains early.

For an existing C++ flight codebase, the realistic path is the one from lesson 05: new modules written in Rust, built as a static library, called through `extern "C"` with headers generated by cbindgen, inside the existing build and verification process. Nobody rewrites a certified codebase to change languages.

For your own career, the module ends with one honest sentence.

::: key The honest one-line positioning of Rust for this career
A 2027-2030 bet and an outstanding way to finally understand ownership, aliasing and lifetimes, which makes you better at C++. It should not displace C++ hours, and its interview value is the reasoning you can show, not the language itself.
:::

That reasoning includes this lesson's skill. When you write the module's memo on introducing Rust into a C++ flight codebase, every claim should point to a source a reviewer can open: Ferrocene's published scope, the two ESA activities, the RTEMS target in the compiler. And the memo should say, in one plain line, that the Starship Rust story has no primary source.

## Check yourself

::: check
Classify each as primary, secondary or tertiary for the question "did DLR port Rust's std to RTEMS?": (a) DLR's ADCSS 2024 slides; (b) a news article describing the talk; (c) a search engine's automatic summary.
:::

::: answer
(a) Primary: made by the team that did the work, published through ESA's own workshop. (b) Secondary: it reports on the talk; useful if it links to the slides so you can check. (c) Tertiary: a summary of other pages, fine for finding leads and never enough on its own.
:::

::: check
A friend says: "Twelve websites say SpaceX flies Rust, so it must be true." Which of the five questions does this argument fail, and what would you ask for?
:::

::: answer
It fails question 4, independent agreement, and probably question 3. Twelve sites that copy the same original are one source. Ask for the first source in the chain, and then for something you can inspect: a SpaceX posting, a talk, a paper or code by SpaceX engineers. If none exists, the count of websites is worth nothing.
:::

::: check
What does "Tier 3" tell you about `armv7-rtems-eabihf`, and how did you see that with your own tools?
:::

::: answer
Tier 3 means the target's support is in the official compiler, but the Rust project does not build or test it automatically and ships no prebuilt standard library. You saw it because `rustc --print target-list` lists the target, `rustc --print cfg` describes it, yet `rustup target add armv7-rtems-eabihf` fails with "no prebuilt artifacts available". You build the library for it yourself.
:::

::: check
Rewrite this sentence so every word is supported: "SpaceX's Starlink team writes its satellite software in Rust."
:::

::: answer
"A SpaceX job posting for a Starlink Embedded Software Engineer (Customer Hardware) listed development experience in C, C++, Golang, Python or Rust." The original overreaches three times: the posting is about customer hardware, not the satellites; Rust is one of five acceptable languages, not the language the team writes in; and one posting describes one role, not the whole team.
:::

::: check
An interviewer asks what ESA has done with Rust. Give a two-sentence answer that names what each activity produced.
:::

::: answer
In the ESA-funded cRustacea in Space activity, DLR ported Rust's standard library to the RTEMS real-time operating system and upstreamed the Tier-3 compiler target armv7-rtems-eabihf, presenting the results at ADCSS 2024. In ESA activity 4000140241, N7 Space built Aerugo, a Rust RTOS, with a board support package and a demonstration application on a Cortex-M7 SAMV71 microcontroller.
:::

## Summary

| Idea | Meaning | Example from this lesson |
|---|---|---|
| Primary source | Made by those who did the work; inspectable | The RTEMS target in `rustc`; ESA activity 4000140241 |
| Secondary source | Reports on primary sources | A news story about the ADCSS talk |
| Tertiary source | Summaries of summaries | A search engine's automatic answer |
| Five questions | Who, could they know, can I inspect, independent, detail versus sourcing | Used to reject the Starship claim |
| cRustacea in Space | DLR, ESA-funded; `std` on RTEMS | `armv7-rtems-eabihf`, Tier 3, ADCSS 2024 |
| ESA 4000140241 | N7 Space; Rust RTOS, BSP, demo | Aerugo on a Cortex-M7 SAMV71 |
| Rust at SpaceX | The full evidence | One Starlink posting listing Rust as an option |
| Claims to reject | No primary source | Starship Rust at 1000 Hz; Mars Sample Return path planning |

This is the end of the Rust track. What carries forward is not a list of crates but a habit: state what the evidence supports, name the source, and say plainly where the evidence stops. You will use it in every design review and interview to come, whatever language the flight code is written in.

::: context circular-reporting When a rumor cites itself
Circular reporting happens when source B copies source A, source C copies B, and later someone finds C and cites it as confirmation of A. From the outside it looks like three sources agree. Trace the links and there is one.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="130" y="12" width="100" height="32" rx="6" fill="#fff" stroke="#b4232c" stroke-width="2"/>
  <text x="180" y="32" font-size="11" text-anchor="middle" fill="#b4232c">unsourced post</text>
  <rect x="20" y="100" width="90" height="32" rx="6" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="65" y="120" font-size="11" text-anchor="middle" fill="#1f2a44">repost 1</text>
  <rect x="135" y="100" width="90" height="32" rx="6" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="180" y="120" font-size="11" text-anchor="middle" fill="#1f2a44">repost 2</text>
  <rect x="250" y="100" width="90" height="32" rx="6" fill="#f2b880" stroke="#1f2a44"/>
  <text x="295" y="120" font-size="11" text-anchor="middle" fill="#1f2a44">AI summary</text>
  <line x1="160" y1="44" x2="70" y2="98" stroke="#1f2a44"/>
  <line x1="180" y1="44" x2="180" y2="98" stroke="#1f2a44"/>
  <line x1="200" y1="44" x2="290" y2="98" stroke="#1f2a44"/>
  <text x="180" y="146" font-size="11" text-anchor="middle" fill="#1f2a44">three pages, one origin, zero evidence</text>
</svg>
```
:::

::: context dlr Germany's space agency and research lab
DLR stands for *Deutsches Zentrum für Luft- und Raumfahrt*, the German Aerospace Center. It is both Germany's national aerospace research center, with institutes spread across the country, and the body that manages Germany's space program. Its Institute for Software Technology works on how software for aircraft and spacecraft should be built and checked, which is why a study of Rust for on-board software landed there.
:::

::: context rtems An operating system that has flown for decades
RTEMS, the Real-Time Executive for Multiprocessor Systems, began in the late 1980s as a real-time operating system for US Army missile systems and is now free and open source. It is small, predictable and supports processors common in spacecraft, including the SPARC-based LEON chips ESA has long used and a range of Arm processors. Many ESA and NASA missions have flown it, which is why a Rust port to RTEMS matters more to European space software than a port to a new, untried system would.
:::

::: context rust-tiers Three levels of promise
The Rust project sorts compiler targets into tiers by how much it promises. **Tier 1**: built and fully tested on every change, "guaranteed to work". **Tier 2**: built on every change, with prebuilt standard libraries you can install with rustup, but not fully tested. **Tier 3**: the code is in the compiler, but nobody builds or tests it automatically, and there are no official binaries. A new target usually enters at Tier 3; moving up needs maintainers who commit to keeping it working.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="14" width="320" height="30" fill="#1d6fd1"/>
  <text x="180" y="34" font-size="12" text-anchor="middle" fill="#fff">Tier 1: built, tested, binaries</text>
  <rect x="50" y="50" width="260" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="180" y="70" font-size="12" text-anchor="middle" fill="#1f2a44">Tier 2: built, binaries</text>
  <rect x="80" y="86" width="200" height="30" fill="#f2b880" stroke="#1f2a44"/>
  <text x="180" y="106" font-size="12" text-anchor="middle" fill="#1f2a44">Tier 3: code only</text>
</svg>
```
:::

::: context adcss Where European avionics engineers meet
ADCSS, the ESA Workshop on Avionics, Data, Control and Software Systems, is a yearly gathering at ESTEC, ESA's technical center in Noordwijk in the Netherlands. Agency engineers, industry and research labs present what they have been working on in on-board computers, data handling, control and flight software. Talks and slides are published on ESA's own event pages, which makes the workshop a good place to look for primary sources on where European space software is heading.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="60" x2="340" y2="60" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="40" cy="60" r="6" fill="#f2b880" stroke="#1f2a44"/>
  <text x="40" y="44" font-size="11" text-anchor="middle" fill="#1f2a44">2023</text>
  <text x="40" y="82" font-size="11" text-anchor="middle" fill="#1f2a44">Ferrocene</text>
  <text x="40" y="96" font-size="11" text-anchor="middle" fill="#1f2a44">qualified</text>
  <circle cx="140" cy="60" r="6" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="140" y="44" font-size="11" text-anchor="middle" fill="#1f2a44">Jun 2024</text>
  <text x="140" y="82" font-size="11" text-anchor="middle" fill="#1f2a44">Aerugo final</text>
  <text x="140" y="96" font-size="11" text-anchor="middle" fill="#1f2a44">presentation</text>
  <circle cx="220" cy="60" r="6" fill="#1d6fd1" stroke="#1f2a44"/>
  <text x="220" y="44" font-size="11" text-anchor="middle" fill="#1f2a44">Oct 2024</text>
  <text x="220" y="82" font-size="11" text-anchor="middle" fill="#1f2a44">ADCSS:</text>
  <text x="220" y="96" font-size="11" text-anchor="middle" fill="#1f2a44">std on RTEMS</text>
  <circle cx="310" cy="60" r="6" fill="#f2b880" stroke="#1f2a44"/>
  <text x="310" y="44" font-size="11" text-anchor="middle" fill="#1f2a44">Dec 2025</text>
  <text x="310" y="82" font-size="11" text-anchor="middle" fill="#1f2a44">certified</text>
  <text x="310" y="96" font-size="11" text-anchor="middle" fill="#1f2a44">core subset</text>
</svg>
```

The timeline puts this module's primary sources in order; every point on it is a document you can open.
:::

::: context samv71-samrh71 A commercial chip with a space-grade cousin
Microchip's SAMV71 is an ordinary commercial Cortex-M7 microcontroller, easy to buy on a development board. Microchip also makes the SAMRH71, a radiation-hardened Cortex-M7 designed for space, and the two are closely related. N7 Space's board support package on GitHub targets both. Developing on the cheap commercial part and moving to the space-grade one later is a common and sensible path.
:::

::: context aerugo-name Another rust, in Latin
*Aerugo* is the Latin word for the green corrosion that forms on copper and bronze, the color of old church roofs and the Statue of Liberty. Naming a Rust operating system after another metal's rust follows the same joke as Ferrocene and Ferrous Systems in lesson 09.
:::

::: context arxiv Posted, not yet judged
arXiv, read "archive", is a free website where researchers post papers, often before or alongside peer review. Posting there makes a paper public and dated, which is useful, but no one has necessarily checked it yet. A paper on arXiv is a primary source for what its authors argue; it becomes stronger evidence once reviewers or other researchers have tested its claims.
:::

::: context web-archive Saving the evidence before it vanishes
The Internet Archive's Wayback Machine stores copies of web pages at the moment you ask it to. For something that will disappear, such as a job posting, saving a copy gives you a dated record you can cite later, and lets a reader see exactly what the page said, not what you remember it saying.
:::

::: context content-farms Articles written for search engines
A content farm is a website that publishes large numbers of articles chosen to match popular searches, now often written by AI tools with little or no human checking. The articles read smoothly and are packed with specific-sounding details, because specificity makes text look authoritative. Nothing ties those details to reality. The tell is the missing chain: no named expert, no link to the organization's own material, no document you can open.
:::
