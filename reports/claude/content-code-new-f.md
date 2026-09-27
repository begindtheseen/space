# Writer report: claude/content-code-new-f

Tranche: new modules with no lessons, written from scratch in the plain voice with context notes in every lesson. All five modules pass `LESSON_MODULE=<id> NOTES_REQUIRED=<id> npx vitest run src/curriculum/lessons.test.ts`, carry `.plain-voice`, and are in `manifest.ts`.

| Module | Lessons | Context notes | Validator |
|---|---|---|---|
| cod_cad_01_drawings — Engineering Drawing Literacy | 9 | 70 | 92 passed, 1 skipped |
| cod_cad_02_gdt — GD&T (ASME Y14.5) | 11 | 85 | 112 passed, 1 skipped |
| cod_cad_03_tools — CAD Tools | 14 | 104 | 142 passed, 1 skipped |
| cod_int_01_algorithms — Algorithmic Fluency for the SpaceX Screen | 12 | 89 | 122 passed, 1 skipped |
| cod_int_02_onsite — The SpaceX Onsite | 9 | 71 | 92 passed, 1 skipped |

## What was done, per module

**cod_cad_01_drawings.** Projection (third vs first angle, the truncated-cone symbol worked out from first principles), views and sections, lines and scales, title/revision blocks and the drawing as legal definition, BOMs/balloons/notes, tolerances and fits (ISO 286 H7/g6/k6/p6 worked at 20 mm), stack-up (worst case vs RSS, small-angle conversion to boresight error, GNC consequences), finishes/welds/fasteners/materials, standards/MBD/export control. Lesson 07 also carries a short introduction to datums because this module's objective and exercise ask for them (see problems below).

**cod_cad_02_gdt.** Why GD&T exists and the feature control frame; datums and 3-2-1; datum targets and precedence (with a numeric pass/fail flip); form; orientation (thruster-seat tilt to disturbance torque); position, plus concentricity/symmetry as legacy controls removed in Y14.5-2018; MMC/LMC/RFS and bonus; virtual condition, composite position, projected zones; profile and runout; free state and geometric stack-ups with a full error-budget → feature-control-frame trace (0.03°, leaving 0.02° for the exercise); CMM inspection and PMI.

**cod_cad_03_tools.** AutoCAD command line and coordinates; draw/modify; layers; blocks and xrefs; annotation and paper space; templates, DWG/DXF and where AutoCAD really lives in aerospace; parametric sketches (DOF counting); features; the feature tree and design intent (topological naming problem); assemblies; mass properties (runnable numpy inertia-tensor example, parallel-axis theorem, principal moments, material-change comparison); drawings/PMI/sheet metal/OML; interchange formats and the CAD landscape; PLM, revisions and effectivity.

**cod_int_01_algorithms.** Calibration and language choice; complexity out loud (time and space, amortized); two pointers and sliding windows (monotonic deque in Python; the C++ left for int01_ex3); hash maps and binary search on the answer; sorting, intervals, stacks, lists; trees and graphs (Kahn's topological sort); heaps, prefix sums, light DP, bits and what to skip; talking and testing; bytes, endianness, struct, checksums, C++ bit assembly; decommutation (taught on a different frame layout so int01_ex1 is not given away) and dropouts; ring buffers (C++ std::array version; the Python API left for int01_ex2) and two-rate time alignment; PID anti-windup (simulated comparison of four variants) and running median. Every code block was run with python3 or g++ -std=c++17 -Wall and shows real output.

**cod_int_02_onsite.** Process and ITAR gate; the systems C++ round (eight runnable C++ programs); live debugging with real ASan/UBSan/valgrind/gdb output; designing a GNC sim infrastructure and a 6,000-satellite telemetry pipeline (sizing stated as assumptions); verification (MC/DC worked) and fault-tolerant flight computers (card int02_c4 as stated; probability sketch labelled illustrative); domain rounds and Fermi estimates; the technical presentation; behavioural themes and ownership; STAR stories and questions to ask. All hiring facts are stated as "reported" and kept within the module definition.

Nothing wrong was found in lesson content that had to be fixed beyond normal drafting; one arithmetic slip in cod_cad_03_tools/11 (0.212 − 0.105 written as 0.108) was caught by the validator and corrected.

## Problems in the module definitions

| Id | What is wrong | Suggested fix |
|---|---|---|
| cod_cad_01_drawings objective 1, cad01_ex1 | Ask the learner to identify "the datums" / "the datum scheme", but no topic in the module teaches datums (they are in cod_cad_02_gdt). Lesson 07 now carries a short datum introduction as a stopgap. | Add a topic such as "Datums and datum feature symbols (introduction)", or drop datums from the objective and exercise. |
| cad01_ex2 | Asks for a boresight misalignment stack-up from four parts' length and tilt tolerances, but gives no baseline, so length tolerances cannot be converted to angle. | State the baseline (e.g. mounting-pad spacing) in the prompt. |
| cad01_c1 | Says the projection symbol is "in the title block"; on real sheets it is often beside it. | "in or beside the title block". |
| cad02_c13 | Says Y14.5-2018 "pushes designers away from" concentricity; the 2018 edition removed the concentricity and symmetry symbols. | "…which is why Y14.5-2018 removed the concentricity and symmetry symbols; runout, position or profile express the requirement." Topic 7 should call them legacy controls. |
| cad03_c1 vs cad03_c4 / cad03_q5 | c1 calls Teamcenter "product data management"; c4 and q5 call it lifecycle management (PLM). | Use "product lifecycle management (PLM)" in c1. |
| cad03_c11 | Grammar: "the model becomes dumb solid". | "becomes a dumb solid". |
| cad03_q7 explain | "The research is explicit…" refers to research the learner never sees. | Remove the reference or name the source. |
| int01_ex2 hidden test "storage never grows" | Asserts `len(rb._buf) == 1000`, but the prompt never says the backing list must be named `_buf`; a correct solution with another name fails. Lesson 11 now hints to use `self._buf`. | Say "store the items in `self._buf`" in the prompt, or test behaviour instead of the private name. |
| int02_c12 | Defines US person as "a citizen or lawful permanent resident"; the ITAR definition also includes protected individuals (refugees and asylees), as car_01 lesson 02 teaches. | Add "or protected individual (refugee or asylee)". |
| int02_c7 vs topic 3 | The card includes "why you would avoid new in a hot path" (not in the topic); the topic includes static/const/volatile and cache effects (not in the card). Lesson 02 covers both. | Align the card and topic lists. |
| int02_c8, int02_q6 explain | Refer to "the Katalyst sentence" / "the Katalyst posting" with no explanation of what Katalyst is. | Say what it is (the job posting) or drop the name. |
| int02_c4, int02_q2 | Do not state the rule the actuator "judge" uses to choose among three commands, so the fault-tolerance argument cannot be completed from the card. | Add the voting rule if it is documented, or say it is not public. |
| int02_ex1 | Asks the learner to critique against "the real Starlink GNC-Simulations job description", which the module neither includes nor links. | Link it in resources or drop the reference. |
| Spelling (cad03 topics/cards, int01_c11/c12, int02_c2) | British spellings (centre, modelling, defence, resynchronisation) where STYLE.md asks for American. Key blocks copy card wording; prose uses American. | Americanize the module text if desired. |
