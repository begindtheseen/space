# Career track: plain-voice rewrite report (branch `claude/content-career`)

All 13 Career modules are rewritten in the plain voice with context notes. Each module has its `.plain-voice` marker, the manifest is regenerated, and every module passes `LESSON_MODULE=<id> NOTES_REQUIRED=<id> npx vitest run src/curriculum/lessons.test.ts`. No module needed new lessons: each already had 7–13 lessons, which were rewritten in place with `id` and `covers` unchanged.

Across all lessons the rewrite:
- kept every formula, key block, worked example, warning and Check-yourself pair;
- converted British spellings in prose to American (`covers` strings are left verbatim);
- recomputed the numbers with python3 and ran the code;
- rendered and checked the SVGs;
- added `::: key` blocks wherever a flashcard fact was not yet stated in the card's wording.

**One thing the coordinator must do:** the full-suite check "lists only modules that still await their rewrite" now fails, because `WRITTEN_BEFORE_NOTES` in `src/curriculum/lessons.test.ts` still lists `car_09_screens`, `car_10_past_project_presentation`, `car_11_domain_round`, `car_12_first_principles` and `car_13_behavioral_star`. All five now carry `.plain-voice`, so remove them from that list. I did not edit the test file because it is outside my brief.

## Per module

| Module | Lessons | Context notes | Notes with SVG |
| --- | --- | --- | --- |
| car_01_itar_gate | 8 | 69 | 22 |
| car_02_role_families | 10 | 101 | 29 |
| car_03_levels_and_quals | 8 | 69 | 21 |
| car_04_degree_reality | 7 | 61 | 19 |
| car_05_tooling_reality | 11 | 96 | 31 |
| car_06_portfolio | 12 | 103 | 35 |
| car_07_resume_and_referrals | 10 | 84 | 27 |
| car_08_pipeline | 13 | 117 | 36 |
| car_09_screens | 12 | 122 | 39 |
| car_10_past_project_presentation | 12 | 108 | 37 |
| car_11_domain_round | 13 | 145 | 39 |
| car_12_first_principles | 13 | 118 | 37 |
| car_13_behavioral_star | 12 | 114 | 37 |

### What was wrong in the lessons and was fixed

**car_01_itar_gate**
- A foreign person was described as "not otherwise authorized". A license does not make someone a US person.
- The country reach of a release is now stated correctly: citizenship held now or in the past, but permanent residency only if held now.
- § 120.50 transfer of registration is narrowed to aircraft, vessels and satellites.
- A US citizen taking technical data abroad is exporting it, so that example is now hedged.
- Drug testing versus state law is hedged: some states limit cannabis testing, and government contracts can themselves require testing.
- Export Control Reform dating is corrected: authority came in 2013 and took effect in late 2014.
- The MTCR Category II step-down is added.
- "Citizens-only for reasons of its own" was wrong under 8 U.S.C. § 1324b and is corrected. Protected individuals include permanent residents, with conditions.
- DSP-5 versus DSP-85 roles are corrected.
- "Landed immigrant" (outdated) is updated.
- EAR 9x515 items can still need licenses for many foreign nationals.
- Mitsubishi Heavy Industries built the H-IIA (retired 2025) and builds the H3.
- Lesson cross-references are fixed.

**car_02_role_families**
- The nine families are now listed outright; objective 1 asks the learner to name them.
- Boostback is not flown on every flight; it is small or skipped on droneship landings.
- The deorbit Δv is computed (about 87 m/s).
- Docking contact speed is hedged.
- The Operations Automation specialist caveat is added, for consistency with q5.
- The ADCS reason used in a check answer is now taught in the body.

**car_03_levels_and_quals**
- Hawthorne is no longer SpaceX's headquarters (it moved to Starbase in 2024).
- "Slosh" is propellant motion, not an airframe mode.
- Accelerometers measure non-gravitational acceleration.
- Branch logic in the applied-math example is fixed.
- Candidate B's self-contradiction is removed.
- The summary table's degree row is corrected.
- The absence of an in-lieu clause at Level I–II is now stated explicitly.

**car_04_degree_reality**
- The "two resumes" example passed a 14-month resume against a 2+ year hard filter. It now uses the 1+ year posting.
- The community-college timeline ignored the first 60 credits; a sanity check is added.
- "Regional accreditor" is now "institutional accreditor".
- A check answer applied the 4+ years line to both branches; it belongs only to the in-lieu branch.
- The Firefly claim is narrowed to one Blue Ghost landing (March 2025).
- A wrong lesson cross-reference is fixed.

**car_05_tooling_reality**
- Step-response overshoot is 16.3% at 1.81 s.
- The "atmosphere_1976" values were really an exponential model; they are replaced with real 1976 US Standard Atmosphere values.
- Code that could not run is replaced or made runnable (an RK4 stub, a missing import).
- Adaptive step counts were off by one.
- Timing tables are labeled machine-dependent.
- Printed output is corrected (0.3936).
- Cards c8 and c9, the build tools named in q7, and hardware-in-the-loop (objective 5) were untaught; all are now taught.

**car_06_portfolio**
- Powered descent: u is the thrust acceleration, not the net acceleration.
- Powered descent: the cost identity holds exactly, not "almost exactly".
- Powered descent: infeasibility comes from initial velocity, not altitude (reproduced).
- RK4 limitation and precession-error figures are recomputed.
- Orbit-determination velocity units were mm/s; they are m/s.
- Single-station OD: the unobservable direction is a rotation about the station, not a velocity component.
- The ARW/RRW crossover is about 231 s, not 20 s.
- Bias recovery is seed-dependent and is now said to be so.
- The GPL does not restrict running code; the reason to prefer a permissive license is corrected.
- The four-part talk mapping is replaced by car_10's seven-part talk, and "twenty" hardest questions is now "thirty".

**car_07_resume_and_referrals**
- The referral request said "five things" but listed six.
- The model cover letter claimed a team's method without verification; that claim is removed.
- An example title said "six weeks" while its body said three.
- The bullet structure is aligned to card c3.
- The recruiter's "well under a minute" first pass (card c1) was untaught; it is now taught.
- The target list for exercise x4 was untaught; a section is added.

**car_08_pipeline**
- The simulation example's "four-hour mark" contradicted its own notes (about two hours).
- The onsite schedule's totals could not be checked; round lengths are added.
- "Amortised constant" work per sample is now "bounded per sample".
- Two Fermi routes agree to about 1%, not "a few per cent".
- The significant-figure claim about the 2.8 difficulty rating is corrected, and its check question too.
- An invented written report is removed.

**car_09_screens**
- Word counts in the example narratives are corrected (190 → 150; "we" eleven times → four).
- "Three failures" is now four.
- The PD loop settles in about one natural period, not several.
- A 26° margin is below the 30° floor, not at its edge.
- Gauss (1801) makes the method more than two centuries old, not one.
- A higher proportional gain shrinks steady-state offset; only integral action removes it.
- The absolute compensation claim is softened.

**car_10_past_project_presentation**
- The anchor B cost range now matches car_06.
- "Six people" is now seven.
- The falling-behind example compared the two decks at inconsistent paces; both are now compared both ways.
- A garbled check answer is rewritten.
- Momentum along the magnetic field is unremovable only at that instant.
- The NDA-expiry claim is hedged.
- The foreign-person definition is aligned with car_01.
- Exercise cross-references are fixed.

**car_11_domain_round**
- As R → 0, the Kalman gain satisfies HK → I; it is not generally the pseudo-inverse.
- The +R/−R sign check argument is corrected.
- "Four times noisier in standard deviation" is twice (four times in variance).
- The unscented mean matches to seven significant figures, not eight.
- Gyro noise enters Q when the gyro drives propagation.
- The Wahba versus Procrustes history is reworded.
- The MEKF left-multiplicative Jacobian warning is corrected.
- "Ten orders of magnitude in conditioning" is about 23×.
- The Gauss–Markov spread "equals" bias instability is softened.
- Warnings are added on the SVD determinant and the QUEST 180° singularity.

**car_12_first_principles**
- The perfect-expansion check was circular; it now compares against the standard atmosphere (61.6 kPa).
- Gimbal loss is about 2.5 m/s.
- Gravity loss from the pitch profile changes by about 8%.
- Gravity at 100 km is about 3% weaker.
- 45° at 0.8°/s takes about 57 s.
- The pitch kick happens at about 13 s.
- The 6-DOF state count with mass is 14 (quaternion) or 13 (Euler angles).
- The self-contradictory spinning-stage torque example is fixed.
- Earth's rotation saves about 0.3% of the energy to orbit, not "a few per cent".
- The radiator did not radiate more than the array collects, and tungsten is not the only metal that survives.
- Drag at perigee on an elliptical orbit was described backwards.
- A values-only monotonic queue does work, and the false O(k) space claim is removed.
- Several ratios are recomputed (≈180×, 1 in 850, 1/(3q)).

**car_13_behavioral_star**
- The exponential model is off by about 10% (not 5%) against the 1976 atmosphere.
- "30% lower" is about a quarter lower.
- Counts of "we" and of words are corrected.
- "Four of six" is now five.
- An answer labeled "sixty seconds" runs about 96 s.
- "Falsehood" is now "overstatement".
- The observability note is qualified (angles versus range).
- Several lesson cross-references are fixed.

## Problems in the module definitions

None of these block a learner: every quiz question is answerable from the lessons. They are listed for the coordinator to fix in `src/curriculum/tracks-aux.ts`.

| Id | What is wrong | Suggested fix |
| --- | --- | --- |
| car01c6 | "SRE" is never defined, and "Clearance requires US citizenship" is absolute (rare exceptions exist). | Spell out "Site Reliability Engineer, GNC"; say "generally requires US citizenship". |
| car01c7 | "Independent of state law" is simplified; some states restrict cannabis testing, with exemptions for federal-contract and clearance roles. | "…required by the employer and its government contracts; state-law limits usually exempt such roles." |
| car01q4 | A wrong option spells "licence". | "license". |
| car01c1 / car01x1 | Presented as verbatim SpaceX posting text; not re-checked against a live posting. | Verify against a current posting. |
| car02c9 vs car02q5 | c9 calls Software Engineer, GNC and Operations Automation "one of the more accessible entry points"; q5 says Operations Automation specialist roles need a Master's or PhD. | Add to c9: "(specialist Operations Automation roles excepted)". |
| car02c11, car02q7 | "First flight June 2026" is stated as a fixed future fact; it is now past (the date is Sep 2026). | Update to the actual outcome, or say "first flight planned for mid-2026". |
| car02c2 | Says "largest launch vehicle ever built" while the topic says "largest vehicle ever flown". | Align the wording. |
| car03c4 | "The Dragon variant has been seen at 1+ years" is stated firmly. | Hedge: "has been reported at". |
| car03q5 (explain) | "MATLAB secondary" cannot be checked from posting text. | Say "less emphasized than C++ and Python in postings". |
| car03c10 | "The only widely seen degree-optional routes" is unsourced. | Hedge: "the degree-optional routes seen in these postings". |
| car04c5 | Two to three years "converts into" the 5+ / 7+ years overstates it. | "counts toward". |
| car04c11 / car04q6 | "Three to five years part-time" holds only with some credits already earned or a heavy part-time load; from zero at a light pace it is about 6–7 years. q6 also drops "plus the time to get hired" for Path 3. | Hedge the timeline; restore the clause in q6. |
| car05c4 / car05q4 | The 3.2 kernel is stated as a flat fact. | "reported as". |
| car05q7 (explain) | Names Vagrant and virtualization, which neither the card nor the correct choice mentions. The lessons now teach them. | Align the explanation with the card. |
| car07c3 | "Action, method, measured result"; the originals taught "problem, method, result". The lessons now follow the card. | None needed now; keep consistent. |
| car07c4 | "An automatic rejection that you never learn about" overstates it; behavior varies by ATS. | "can cause a rejection you never learn about". |
| car07c8 | Lists five parts of the referral ask and omits "state how you know them", which exercise x3 includes (six). | Add the sixth part. |
| car07q1 | The correct option is near-identical to card c3's example bullet, so it tests recall rather than application. | Use a different bullet. |
| car08c8 | Uses "just" ("not just the night before"), a word STYLE.md bans. The key quotes the card. | "not only the night before". |
| car09q6 | Near-identical to lesson 09's first worked example (a pre-existing overlap). | Reword the quiz scenario. |
| car11 cards | The ids skip car11c9 and car11c14. | Renumber or confirm intentional. |
| car11c5 / car11q3 | Write the control matrix as **B**; the lessons use **G** (the key now says "G, often written B"). | Pick one notation. |
| car12x2 | Lists an "impulsive frame" assumption that no lesson explains. | Reword, e.g. "impulsive (instantaneous) burn". |
| Spelling (cosmetic) | British spellings in cards, quizzes, titles and topics. Examples: car03 "behaviourally/memorising/optimisation/artefact"; car05c2/q8 "organisation/Sceptical"; car07c2 "prioritise/programme"; car07q1, car07q4 "artefact/favour"; car08q5 "Programme"; car08x2 "artefact"; car09c8 "linearises"; car10c9 "characterise"; car10c12 "practised"; car10 "monopolise/judgement"; car10 DDTC resource note "defence"; car11 "linearisation/initialisation"; car12 "minimises/centre"; car12c12 "behaviour"; car13 title "Behavioural"; car13c10 "artefacts". | Convert to American spelling to match the lessons (and update `covers` strings together with topic strings). |
