---
id: l04-requirements-and-model-advisor
title: 'Requirements and the Model Advisor: every block has a reason'
minutes: 22
covers:
  - 'Requirements Toolbox: authoring, linking to blocks and tests, traceability matrices, change tracking'
  - Model Advisor with MAB and JMAAB guidelines and the high-integrity check packs
---

Think about building a house. Before anyone pours concrete, the owner writes down what she wants: three bedrooms, a kitchen facing the garden, a front door wide enough for a wheelchair. The builder turns that list into drawings. The inspector walks through the finished house with the same list in hand and ticks each line. If the owner changes her mind about the door, everyone has to know: the drawing changes, the inspector's checklist changes, and the old tick no longer counts. And the city has its own rulebook too, the building code, which every house must follow whatever the owner wants.

Flight software works the same way. The list is the set of **requirements**: short, testable statements of what the software must do. The drawing is the Simulink model. The inspector's checklist is the tests from the previous lessons. The building code is a set of modeling rules that every model must follow, checked by a tool.

This lesson covers both halves: **Requirements Toolbox**, for writing requirements and linking them to the blocks that meet them and the tests that check them, and the **Model Advisor**, which checks a model against rulebooks of modeling guidelines. The previous three lessons built the tests and measured what they reached. This lesson ties those tests to the reasons they exist.

## Requirements: writing down what "right" means

Lesson 1 said MIL proves the model "behaves as specified". Specified where? In the requirements. A **requirement** is one statement of something the system must do, written so that someone can check it. Good requirements are short, use the word **[[shall|shall-language]]** for an obligation, and carry numbers you can measure:

- PC-1: The pitch loop shall settle to within 2% of a step command within 3.0 s.
- PC-2: The pitch loop shall overshoot a step command by no more than 10%.
- PC-3: The fin command shall not change faster than 20 deg/s.
- PC-4: The fin command shall be limited to ±15 deg.
- PC-5: On a gyro fault, the controller shall hold the last valid fin command.

Each has an **ID** (a short unique name such as PC-1, read "P C one"), a one-line summary, and usually a longer description and a rationale explaining why it exists. "The controller shall be robust" is not a requirement; nobody can tick it. "Settle within 3.0 s" is.

On a real program, requirements come in layers. The vehicle has requirements ("the rocket shall hold its planned attitude within 1 degree"). Those are split into requirements for each subsystem, and those into requirements for the software. A lower requirement that exists because of a higher one is **derived** from it. Following a chain of these from the top down to one line of code, or back up, is what **traceability** means: every piece can say where it came from and what it answers to.

### Requirements Toolbox

**Requirements Toolbox** (called Simulink Requirements before release R2022a) lets you write and store requirements inside the MATLAB and Simulink world. You work in the **Requirements Editor**, a window with a tree of requirements on the left and each requirement's fields on the right. A collection of requirements is a **requirement set**, and it is saved as a file with the extension `.slreqx`. That file sits in your project next to the model and goes under version control like any other source file.

Many programs keep master requirements in a tool such as **[[IBM DOORS|doors-reqif]]**, or in Word and Excel. Requirements Toolbox can import from Word, Excel and the ReqIF exchange format.

You can also build a requirement set from a script. This needs Requirements Toolbox, so it is not run here:

```matlab
rs = slreq.new('pitchReqs');          % creates pitchReqs.slreqx
r1 = add(rs, 'Id', 'PC-1', ...
    'Summary', 'Pitch settling time', ...
    'Description', 'The pitch loop shall settle to within 2% of a step command within 3.0 s.');
save(rs);
```

Inside Simulink, the **Requirements Perspective** shows the requirements beside the model canvas, so links are visible where the engineer works.

## Links: Implements and Verifies

A requirement on its own is only a wish. It becomes useful when it is **linked**: connected, in both directions, to the things that answer it. Requirements Toolbox has several link types. Two matter most.

- An **Implements** link runs from a design item, such as a block or a subsystem, to the requirement it meets. The Rate Limiter block *implements* PC-3.
- A **Verifies** link runs from a test, such as a Simulink Test case or a `verify` statement in a Test Assessment block, to the requirement it checks. The rate-step test *verifies* PC-3.

A **Derives** link connects a lower requirement to the higher one it came from.

Links are stored in a separate **link set** file, with the extension `.slmx`, saved next to the model. Adding a link does not change the model file itself.

Once links exist, the Requirements Editor can show two progress bars for each requirement. **Implementation status** says whether something implements it. **Verification status** says whether a test verifies it and, after the tests have run, whether they passed. A requirement with no Implements link is a promise nobody kept. A requirement with no Verifies link is a promise nobody checked. For a whole requirement set, you want both bars full.

::: warning A link is a claim, not a proof
Drawing an Implements link from a Saturation block to PC-4 says "this block is why PC-4 is met". It does not check that the block's limits really are ±15 degrees. Only the Verifies side, a test that runs and passes, supplies evidence. Reviewers read links the way they read comments: useful, and to be checked.
:::

## The traceability matrix

With dozens of requirements and hundreds of blocks and tests, you need a way to see the whole web at once. A **traceability matrix** is a table with requirements down one side and model elements or tests across the other. A mark in a cell means a link. Requirements Toolbox can build this table for you and highlight the rows and columns that have no links at all.

The matrix is read in both directions, and each direction answers a different question.

- **Along each requirement's row:** is it implemented, and is it verified? An empty row is a requirement that nothing answers.
- **Down each model element's column:** does this block exist for a reason? An empty column is a block that no requirement asked for. It might be leftover debug logic, a feature someone added on their own, or a requirement nobody wrote down. Every one of those is a problem for a safety review.

::: key
What does a traceability matrix in Requirements Toolbox give an auditor? A map in both directions: from each requirement to the model elements that implement it and the tests that verify it, and from each model element back to the requirement that justifies it. Empty rows and columns are the gaps: unmet requirements, unchecked requirements and unexplained design.
:::

::: example Reading a matrix for the pitch controller
The pitch controller has five requirements (PC-1 to PC-5), five blocks or subsystems (PID, Rate Limiter, Saturation, Fault Hold, Debug Gain) and four tests (Step, Rate Step, Big Command, Gyro Dropout). The links are:

| Requirement | Implemented by | Verified by |
|---|---|---|
| PC-1 settle in 3.0 s | PID | Step |
| PC-2 overshoot at most 10% | PID | Step |
| PC-3 rate at most 20 deg/s | Rate Limiter | Rate Step |
| PC-4 limit ±15 deg | Saturation | none |
| PC-5 hold on gyro fault | Fault Hold | Gyro Dropout |

**Step 1: implementation.** Every requirement has an Implements link. That is 5 of 5, or 100%.

**Step 2: verification.** PC-4 has no Verifies link. So 4 of 5 are verified: $4/5 = 80\%$.

**Step 3: the other direction.** Look at each block's column. PID, Rate Limiter, Saturation and Fault Hold each link to a requirement. Debug Gain links to nothing. It is an unexplained block.

**Step 4: the tests.** The Big Command test links to nothing either, even though its name suggests it drives the fins into their limit. Most likely it was meant to verify PC-4 and nobody drew the link.

**Result.** Two actions: link Big Command to PC-4 (after checking that its assessment really tests the ±15 degree limit), and either write a requirement for Debug Gain or delete the block.

**Sanity check.** The coverage lesson points the same way from the other side: logic no requirement asks for is logic no requirement-based test is designed to reach.
:::

## Change tracking: when a requirement moves

Requirements change. A review decides the pitch loop must settle faster, and PC-1 goes from 3.0 s to 2.5 s. Everything linked to PC-1 was built and checked against the old number, so none of it is known to be right any more.

Requirements Toolbox handles this with **change tracking**. When you create a link, it records the revision of the items at each end. If either end changes later, the link is flagged with a **change issue**, often called a **[[suspect link|suspect-link]]** in the wider requirements world. The flag does not say anything is wrong. It says "the thing at the other end has changed since this link was made; someone needs to look".

The engineer opens each flagged link, reads what changed, updates the model or test if needed, re-runs the tests, and clears the flag with a comment an auditor can read later.

::: example Following a changed requirement through the model
PC-1 changes from "within 3.0 s" to "within 2.5 s". The links to PC-1 are: Implements from PID, Verifies from the Step test, and one derived requirement, PC-1.1 ("the loop shall have natural frequency 2.0 rad/s and damping ratio 0.7"), linked by Derives. How many change issues appear, and what does the engineer find?

**Step 1: count the flags.** Every link that touches PC-1 is flagged: the Implements link, the Verifies link and the Derives link. That is 3 change issues.

**Step 2: re-run the Step test.** The loop behaves like a second-order system with natural frequency $\omega_n = 2.0$ rad/s (read "omega n") and damping ratio $\zeta = 0.7$ (read "zeta"). Its step response, computed in Python, settles within 2% after 2.99 s. That passed the old limit of 3.0 s, by a hair. Against 2.5 s it fails.

**Step 3: fix the design.** A rough rule for such a loop is that the settling time is about $4/(\zeta\omega_n)$. To bring that under 2.5 s with the same damping, raise $\omega_n$. With $\omega_n = 2.5$ rad/s the estimate is $4/(0.7 \times 2.5) = 2.29$ s, and the exact response settles in 2.39 s. The overshoot depends only on $\zeta$, so it stays at 4.6%, still within PC-2's 10%.

**Step 4: clear the flags.** Update PC-1.1 to 2.5 rad/s, retune the PID gains, re-run the Step test (now passing), and clear each of the three change issues with a comment naming the new test result.

**Sanity check.** The old design met 3.0 s with only 0.01 s to spare, so any tightening at all was going to break it. Without change tracking, the Step test's assessment would still say "3.0 s" and keep passing, and the model would ship against a requirement it does not meet.
:::

::: warning Clearing a flag without looking
The fastest way to empty a list of change issues is to clear them all at once. That destroys the one piece of information the flags carried. Clear each one only after checking the item at the other end, and write in the comment what you checked.
:::

## The Model Advisor: a building code for models

Requirements say what the model must do. They say nothing about how it is drawn. Two models can both meet PC-1 while one is a tidy left-to-right diagram and the other is a tangle of crossing lines, unnamed signals and blocks whose settings quietly produce code that could divide by zero. Teams that build flight software agree on **modeling guidelines**: rules about how a model is built, so it is readable, reviewable and turns into safe code.

The **Model Advisor** is the Simulink tool that checks a model against rules like these. You open it from the Modeling tab, pick the checks you want, and run them. Each check reports **passed**, **warning** or **failed**, with the blocks involved listed as links you can click to jump to them. Some checks offer an automatic fix. The results can be saved as a report, and the Model Advisor can also run from a script, so it fits in the same headless CI job as the tests from lesson 2. Some rules can also be checked while you edit, with offending blocks highlighted as you draw them.

A basic set of checks comes with Simulink itself. The rulebooks for professional and safety work come with a separate product, **Simulink Check**.

### MAB and JMAAB: the style guides

The most widely used modeling guidelines come from the **[[MathWorks Advisory Board|mab-history]] (MAB)**, a group of companies that use MathWorks tools and agree on common rules. It was first called MAAB, the MathWorks Automotive Advisory Board, because it started in the car industry. Its guidelines are published as a free document by MathWorks. The **JMAAB** (Japan MATLAB Automotive Advisory Board) writes guidelines of its own, and the two sets now share much of their content.

Each guideline has a short ID and a title. The ID prefix hints at where the rule came from: many start `jc_` (from the JMAAB), others `db_` or `na_`. The rules cover things such as:

- **Naming.** Which characters are allowed in names, so generated C identifiers are legal and readable.
- **Layout.** Signals flow left to right and feedback right to left; guideline db_0141 is about this signal flow.
- **Block use.** Which blocks and settings to prefer or avoid, and how to set up Stateflow charts.

These rules do not change what the model computes. They let a second engineer review it quickly and the next engineer change it safely.

### High-integrity check packs

Simulink Check also carries sets of checks written for **safety standards**. Each set looks for the modeling practices that the standard's evidence depends on. The ones a GNC engineer meets most:

- **DO-178C** and its model-based supplement **DO-331**, the standards for software on aircraft. Their check pack is where most flight programs start. The software's **[[design assurance level|dal-levels]]** decides how much evidence the standard demands.
- **ISO 26262**, the functional safety standard for road vehicles.
- **IEC 61508**, the general functional safety standard for electrical and programmable systems, which ISO 26262 grew from.

Alongside these sit the MathWorks **High-Integrity System Modeling** guidelines, whose IDs start `hisl_`. They cover block settings and patterns that could lead to unsafe code, such as operations that can divide by zero or overflow an integer, and configuration settings that affect how the code handles those cases.

::: key
Model Advisor checks a model against rule sets. MAB and JMAAB guidelines cover naming, layout and block use so models are readable and reviewable. The high-integrity check packs in Simulink Check (DO-178C/DO-331, ISO 26262, IEC 61508 and the hisl_ guidelines) look for the modeling practices those safety standards rely on. A passing Model Advisor report is part of the certification evidence, not a proof the design is correct.
:::

::: warning A clean report is not a correct model
The Model Advisor checks *how* the model is built, not *whether it meets its requirements*. A model can pass every MAB check and still have the wrong gain. Requirements, tests and coverage answer "is it right". The Model Advisor answers "is it built so we can trust and review it".
:::

Spacecraft are not certified under DO-178C, which is written for aircraft. But NASA's software rules (NPR 7150.2) and the European space standards (ECSS) ask for the same kinds of evidence, so many space teams borrow DO-178C practices and its check pack.

## Check yourself

::: check
A requirement reads: "The attitude controller shall be fast enough." What is wrong with it, and how would you rewrite it?
:::

::: answer
Nobody can check it: "fast enough" has no number and no test can pass or fail against it. Rewrite it with a measurable quantity and a limit, for example "The attitude controller shall settle to within 2% of a step command within 2.5 s" or "The attitude controller shall complete each step within 400 µs". Then a Verifies link can point at a test that checks exactly that number.
:::

::: check
Which way does each link point? A Test Assessment block checks that the fin rate stays under 20 deg/s, and a Rate Limiter block is the reason the rate stays under 20 deg/s.
:::

::: answer
The test is linked by a Verifies link to the requirement (PC-3): the test verifies it. The Rate Limiter block is linked by an Implements link to the same requirement: the block implements it. Both links point at the requirement from the thing that answers it. The link set file (`.slmx`) stores them, so the model file does not change.
:::

::: check
A traceability matrix shows a Stateflow state that links to no requirement. Name two possible explanations and what you would do for each.
:::

::: answer
First, it may be logic nobody asked for, such as leftover debug code. Then delete it, or ask the systems team whether a requirement should exist. Second, the requirement may exist but the link was never drawn. Then add the Implements link. Either way, an unlinked element must not stay unexplained in a safety review.
:::

::: check
A requirement's limit changes from 15 deg to 12 deg. It has two Implements links and three Verifies links. What does change tracking do, and what must the engineer do before the flags are cleared?
:::

::: answer
All five links are flagged with a change issue, because the item at one end changed after the links were made. For each, the engineer checks the item at the other end against the new limit: the two blocks' settings (for example a Saturation block's limits) and the three tests' assessments. Anything using 15 must be updated to 12. Then the tests are re-run, and each flag is cleared with a comment saying what was checked and the result.
:::

::: check
Your model passes all MAB checks in the Model Advisor. A colleague says this means it is ready for flight. What would you answer?
:::

::: answer
The MAB checks show the model is built in an agreed, reviewable style: legal names, clean layout, preferred block use. They do not check the model's behavior. Readiness also needs every requirement implemented and verified (the traceability matrix), passing tests at each stage, structural coverage, and for flight software, the high-integrity checks for the relevant standard and then the code-level checks that come in later lessons.
:::

## Summary

| Idea | Meaning | Where it lives |
|---|---|---|
| Requirement | one checkable statement of what the system shall do | a requirement set, `.slreqx` |
| Implements link | design item → requirement it meets | link set, `.slmx` |
| Verifies link | test → requirement it checks | link set, `.slmx` |
| Derives link | lower requirement → higher one it came from | link set |
| Traceability matrix | requirements against model elements and tests; empty rows and columns are gaps | Requirements Toolbox |
| Change issue (suspect link) | flag on a link whose end has changed since it was made | Requirements Editor |
| Model Advisor | runs rule checks on a model: passed, warning, failed | Simulink |
| MAB, JMAAB | modeling style guidelines for readable, reviewable models | Simulink Check |
| High-integrity packs | DO-178C/DO-331, ISO 26262, IEC 61508, hisl_ checks | Simulink Check |

The next lesson moves from the model to the code it becomes: Polyspace looks at C itself and, in the case of Code Prover, proves whole classes of run-time error cannot happen, without running a single test.

::: context shall-language Why requirements say "shall"
Requirements writers use a small, strict vocabulary. "Shall" marks something mandatory that will be verified. "Should" marks a goal that is nice to have. "Will" often states a fact about the surroundings ("the gyro will provide data at 1 kHz") rather than an obligation on the software. NASA's systems engineering handbook and most aerospace programs use this convention. It sounds old-fashioned on purpose: a word nobody uses in everyday speech cannot be confused with a casual one, so a reviewer can find every obligation by searching for "shall".
:::

::: context doors-reqif Where big programs keep requirements
IBM DOORS (Dynamic Object Oriented Requirements System) is a database built for requirements, and for decades it has been the standard tool on large aerospace and defense programs. Each requirement is an object with an ID, text and attributes, and links between objects are stored in the database. ReqIF, the Requirements Interchange Format, is an open standard published by the Object Management Group so that different tools can pass requirements back and forth. It came out of the German car industry, where carmakers and suppliers needed to swap requirement documents without forcing everyone onto one tool.
:::

::: context suspect-link A flag for "something changed"
The phrase "suspect link" comes from requirements databases such as DOORS, which mark a link as suspect when the object at one end is edited. Requirements Toolbox calls the same idea a change issue. The picture below is the pitch example: PC-1 changes, and every link touching it is flagged until someone checks the item at the other end.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="130" y="65" width="100" height="36" fill="#f2b880" stroke="#1f2a44"/>
  <text x="180" y="81" font-size="12" fill="#1f2a44" text-anchor="middle">PC-1</text>
  <text x="180" y="95" font-size="11" fill="#1f2a44" text-anchor="middle">3.0 s to 2.5 s</text>
  <rect x="10" y="15" width="90" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="55" y="34" font-size="11" fill="#1f2a44" text-anchor="middle">PID block</text>
  <rect x="10" y="120" width="90" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="55" y="139" font-size="11" fill="#1f2a44" text-anchor="middle">Step test</text>
  <rect x="260" y="15" width="90" height="30" fill="#ffffff" stroke="#1f2a44"/>
  <text x="305" y="34" font-size="11" fill="#1f2a44" text-anchor="middle">PC-1.1</text>
  <line x1="100" y1="35" x2="130" y2="70" stroke="#b4232c" stroke-width="2" stroke-dasharray="5,3"/>
  <line x1="100" y1="130" x2="130" y2="96" stroke="#b4232c" stroke-width="2" stroke-dasharray="5,3"/>
  <line x1="260" y1="35" x2="230" y2="70" stroke="#b4232c" stroke-width="2" stroke-dasharray="5,3"/>
  <text x="112" y="45" font-size="11" fill="#b4232c">implements</text>
  <text x="116" y="124" font-size="11" fill="#b4232c">verifies</text>
  <text x="248" y="62" font-size="11" fill="#b4232c">derives</text>
  <text x="300" y="140" font-size="11" fill="#6c7a93" text-anchor="middle">dashed red:</text>
  <text x="300" y="154" font-size="11" fill="#6c7a93" text-anchor="middle">3 change issues</text>
</svg>
```
:::

::: context mab-history Rules written by the people who use the tool
The MathWorks Advisory Board is made up of engineers from companies that build control software with MATLAB and Simulink, with MathWorks as the host. It began in the car industry, which is why it was once the Automotive Advisory Board, and it widened its name as aerospace and other users adopted the guidelines. The guidelines document is free to download, and each rule comes with a rationale and often a picture of a right and a wrong way to draw something.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="90" y="16" font-size="12" fill="#1d6fd1" text-anchor="middle">follows the rule</text>
  <rect x="15" y="45" width="40" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="85" y="45" width="40" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <line x1="55" y1="60" x2="85" y2="60" stroke="#1f2a44" stroke-width="2"/>
  <line x1="125" y1="60" x2="160" y2="60" stroke="#1f2a44" stroke-width="2"/>
  <polyline points="145,60 145,110 35,110 35,75" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <text x="90" y="128" font-size="11" fill="#1f2a44" text-anchor="middle">forward left to right,</text>
  <text x="90" y="142" font-size="11" fill="#1f2a44" text-anchor="middle">feedback right to left</text>
  <text x="270" y="16" font-size="12" fill="#b4232c" text-anchor="middle">breaks it</text>
  <rect x="280" y="45" width="40" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="210" y="45" width="40" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <polyline points="320,60 340,60 340,30 195,30 195,60 210,60" fill="none" stroke="#b4232c" stroke-width="2"/>
  <polyline points="250,60 265,60 265,95 300,95 300,75" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="270" y="128" font-size="11" fill="#1f2a44" text-anchor="middle">signal flows the wrong way,</text>
  <text x="270" y="142" font-size="11" fill="#1f2a44" text-anchor="middle">hard to review</text>
</svg>
```
:::

::: context dal-levels How much evidence is enough
DO-178C sorts software into five levels, A to E, by what the worst failure of that software could do. Level A software could contribute to a catastrophic failure, one that could bring down the aircraft; level E has no safety effect at all. The higher the level, the more objectives must be met: level A has 71 objectives, including MC/DC structural coverage from the coverage lesson, and many must be met "with independence", meaning checked by someone other than the author. ISO 26262 uses a similar ladder called ASIL, from A (lowest) to D (highest).
:::
