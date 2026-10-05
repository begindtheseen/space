# ORBIT: GNC Flight Academy

ORBIT is a study app I built to take myself, and anyone else starting from zero, to the
point of being ready for an entry-level job in guidance, navigation and control (GNC)
engineering or flight software. It runs in a browser tab or as a Mac app, with no account
and no backend server: everything you do is stored on your own device.

- **Web version:** https://orbit-ten-amber.vercel.app (deployed on Vercel from `main`)
- **Mac app:** the [Releases](https://github.com/begindtheseen/space/releases) page
- **Built with:** TypeScript, React 19, Vite and Vitest; CodeMirror 6 for the editor;
  Pyodide and sql.js to run Python and SQLite in the browser (WebAssembly); IndexedDB for
  storage; Electron for the Mac app; GitHub Actions for CI and releases.

> **Not affiliated with, endorsed by, or connected to SpaceX.** This is an independent
> personal study tool. Job requirements, compensation figures and interview details are
> drawn from public postings and candidate accounts at the time of writing and change
> without notice. Verify the live posting before relying on any of it.

---

## What it does

I built it around a memory model and a dependency graph instead of a list of videos,
and it shows how it gets to its numbers:

- **A curriculum of 100+ modules** on four pillars: the mathematical and physical
  foundations (algebra through optimization, dynamics, astrodynamics), the languages the
  work is done in (Python, C++, MATLAB/Simulink, Rust, SQL, CAD), the GNC core itself
  (control, estimation, navigation, guidance, flight software), and career preparation.
  If a module does not help with getting hired into GNC, it is not here.
- **A real scheduler.** Reviews are timed by FSRS-6, a fitted power-law memory model
  with per-item stability and difficulty. My port is checked against the upstream
  reference implementation digit for digit in `src/engine/fsrs.test.ts`.
- **A prerequisite graph.** Nothing is hidden, but the app tells you plainly when a
  module rests on something you have not built yet, and points you upstream instead of
  letting you grind against material you are not ready for.
- **Code that really runs.** Python runs for real (CPython 3.14 via Pyodide, with NumPy,
  SciPy, SymPy, pandas and Matplotlib), SQL runs against SQLite compiled to
  WebAssembly, and C++ always compiles and runs: on the Mac's own compiler in the desktop
  app when one is installed, otherwise with clang++ compiled to WebAssembly in the app.
  Rust and shell run through the desktop app's toolchains; without them those exercises
  are compared against the reference solution, and the app says so. MATLAB exercises ship
  a NumPy equivalent you can run.
- **Learn to code.** Roadmaps (GNC Engineer, Flight Software, Test & Data, Software
  Engineer, a Computer Science degree, and a mastery roadmap per language) lay out
  courses in order as a numbered path. There are 38 courses: the command line, Git,
  Python, SQL and C++, each from basics to advanced or expert and then a projects course,
  plus computer science courses and five capstone projects. Every step is really run in
  the same IDE window as the playground and shown as test cases. A course is one
  plain-text file in `src/learn/tracks/` (format in `src/learn/parse.ts`); the roadmaps
  are in `src/learn/platform.ts`. The same lesson engine and course files come from
  APEX's LAUNCHPAD app, which adds JavaScript, TypeScript and the web, and checks every
  lesson's starter and solution in the real runtimes.
- **Read aloud** uses a neural voice, Kokoro-82M, generated on the device
  (`src/lib/voice/`) and downloaded once (92 MB) from Hugging Face; the device's own
  voices stay in the picker as the fallback. **C++ on iPhone and iPad**, which cannot run
  the in-browser compiler, is compiled on Compiler Explorer, with Wandbox as a fallback
  (`src/lib/cppRemote.ts`).
- **The playground** has three modes (Code, SQL and Terminal) in one IDE window with a
  Run Code button and a panel for test cases, console, input and results. Terminal is a
  practice shell that lives in the page (`src/lib/shell.ts`): files, folders and enough
  git to learn the loop, the same on every machine. The same window is embedded in
  lessons (`src/components/ide/Embed.tsx`), so exercises are done and graded where you
  read them. `src/lib/run.ts` says how each language runs.
- **Honest numbers.** The Progress page shows your predicted retention over a year, your
  review workload ahead, and a reliability diagram of how well calibrated your own
  confidence turns out to be. Completion estimates are given as a range, never a date.

---

## Running it

Node 22 required.

```bash
npm install
npm run dev         # http://localhost:5173
```

```bash
npm run build       # static output in dist/
npm run preview     # serve the built output
npm run typecheck   # tsc -b
npm test            # vitest run: engine, curriculum, lessons and the desktop updater
```

`npm test` includes the lesson checker (`src/learn/solutions.test.ts`), which runs every
exercise's reference solution and starter code for real (Python on `python3`, C++ on
`clang++`). It is thousands of programs and takes a long time, so CI runs it in three
parallel shards on Python 3.14. To run everything else, the way CI's main job does:

```bash
npx vitest run --exclude src/learn/solutions.test.ts
```

```bash
npm run desktop        # build the bundle and run it in the Electron shell
npm run desktop:pack   # build the Mac app into release/ (DMG needs macOS)
npm run desktop:e2e    # end-to-end: real Electron against a fake GitHub API
```

The build output is a plain static site that any static host can serve from `dist/`.
For a subpath deploy, set `BASE_PATH`:

```bash
BASE_PATH=/space/ npm run build
```

### CI

`.github/workflows/ci.yml` typechecks, tests, builds the bundle and runs the desktop
end-to-end suite under xvfb on every push and pull request, keeping the e2e screenshots
as an artifact. Every merge to `main` is also released automatically; how that works is
in [docs/releasing.md](docs/releasing.md).

---

## How this project evolved

The full history is in [CHANGELOG.md](CHANGELOG.md) and the git log. The main steps:

- **It started as a browser-only app** (2026-09-20): the curriculum, the FSRS scheduler
  and the prerequisite graph. The next change I made that day was making it work
  properly on a phone.
- **Two days later I added the Mac app**, an Electron shell with its own updater and a
  GitHub Releases pipeline. The first fixes after that were to the release itself: the
  macOS build needed fixing, and 1.0.1 hardened the updater and the boot path after a
  review.
- **Writing lessons for every module (1.0.3) taught me to test my own content.** I added
  an arithmetic checker to the test suite, and once it understood units, and later
  `\approx`, it found wrong numbers in lessons I had already written.
- **Learn to code (1.1.0) meant running real code in the browser**, which brought its own
  bugs: some solutions failed only in the browser's Python (Pyodide). CI now runs every
  exercise's starter and solution, split across three machines because it is thousands
  of programs.
- **1.2.0 added the computer science courses**, with practice sets, timed gates and five
  capstone projects, and 1.2.3 added a tutor voice that explains why a run failed.
- **The 1.3 releases were mostly about the read-aloud voice.** 1.3.0 fixed a buzz caused
  by rounding the voice model's audio to 8 bits on a computer's processor, and 1.3.2
  through 1.3.4 made it start sooner and stopped it pausing between sentences.

---

## How to use it

Open a track, start its first module, and work the module page top to bottom. Every
module runs the same three steps:

1. **Learn.** Read the objectives, then the lessons in order. They are written for the
   app, with derivations, worked examples and check-yourself questions, and they cover
   every topic the module lists. A module without lessons yet says so and points at the
   best free material instead. Skim the Notes (the flashcards laid out to read) and press
   **Mark as studied**.
2. **Practice.** The exercises. Code ones open in the playground with tests; derivations
   and analyses are done on paper and checked against the solution afterwards.
3. **Recall.** The flashcards and questions as a spaced-repetition session. Questions
   are held back until here on purpose: attempting one cold is what makes it stick.

**Where to start.** A complete beginner starts in Foundations & Math with Algebra &
Precalculus, which assumes nothing. If the maths is already comfortable, go to Learning
→ Open now for the modules whose prerequisites you have met. If you are here for the
job, read the Career track first, starting with the ITAR gate.

**Grading recall.** Prompt, optional confidence rating, reveal, grade. Again (1) means
you did not get it and brings the item back within minutes; Hard (2), Good (3) and Easy
(4) all count as a recall and set progressively longer intervals, and every button shows
the interval it will set. "Nothing due right now" is the scheduler working, not a bug.

**Mastery and unlocking.** Every module has a mastery percentage built from its recall
items. A prerequisite at 70% unlocks the modules that rest on it; 90% counts as
mastered. Gated modules are shown, not hidden, and the gate is advice: you can study
one anyway, it will just be harder than it needs to be.

**Back up your data.** Everything lives on this device; there is no account and no sync.
Settings → Export writes a JSON backup. Keep it somewhere else and refresh it regularly.

The full guide lives in the app under **Guide** (`#/guide`) and reads its numbers from the
curriculum and the scheduler as you look at it.

---

## Install on a Mac

Download `ORBIT-<version>-universal.dmg` from the
[Releases](https://github.com/begindtheseen/space/releases) page, open it, and drag
ORBIT onto the Applications folder shown beside it. One app runs natively on Apple
silicon and Intel; it needs macOS 12 (Monterey) or newer.

The first launch takes one extra step. The app is signed ad hoc (there is no $99-a-year
Apple Developer ID behind it, so it is not notarised), and Gatekeeper will refuse to open
it the first time ("Apple could not verify ORBIT is free of malware", or on older
systems "cannot be opened because Apple cannot check it for malicious software"):

1. Open ORBIT once normally and dismiss the dialog (Done).
2. Go to **System Settings → Privacy & Security**, scroll down to the message about
   ORBIT and click **Open Anyway**, then confirm.

Alternatively, from Terminal: `xattr -dr com.apple.quarantine /Applications/ORBIT.app`.
On macOS 14 (Sonoma) and earlier, right-clicking (or Control-clicking) `ORBIT.app` and
choosing Open, then Open again, also works; macOS 15 (Sequoia) removed that shortcut for
apps that are not notarised.

macOS remembers the choice; every launch after that is ordinary. If you would rather
have a zip than a disk image, `ORBIT-<version>-universal-mac.zip` holds the same app
with an Applications shortcut and the same instructions in a text file.

Your progress lives in `~/Library/Application Support/ORBIT/` and survives updates,
reinstalls and moving the app. The backup in Settings is still the copy to keep
somewhere else.

Most updates arrive inside the app (**Settings → Updates**) as a small bundle download,
without a new DMG. How updates and releases work is in [docs/releasing.md](docs/releasing.md).

---

## What this cannot do

Stated plainly, because a study tool that oversells itself wastes your time:

- **It is not a degree.** Essentially every GNC engineer posting requires a bachelor's
  in physics, CS, aerospace or an engineering discipline, and recruiters screen on that
  line. This platform can make you a stronger candidate; it does not substitute for the
  credential. The Career track covers the three realistic paths honestly.
- **ITAR is a hard gate.** US-person status is required for essentially every role in
  this field. No amount of skill substitutes for it.
- **Rust and MATLAB need the desktop app's toolchains.** There is no Rust compiler that
  runs in a browser at all, and MATLAB is proprietary (Octave is used when installed).
  Without them those exercises are checked against expected output, and the app labels
  them as such. C++ in the browser has no exception support: `throw` and `try` need the
  Mac's own compiler.
- **Your progress lives on one device.** There is no account and no sync. Export a
  backup from Settings and keep it somewhere else; that file is the durable copy.

---

## How the engine works

Four models, each answering a different question. None of them answers all of it, which
is why there are four.

| Model | Question | Where |
| --- | --- | --- |
| **FSRS-6** | Do I still remember this? | `src/engine/fsrs.ts` |
| **BKT** | Can I actually do this? | `src/engine/mastery.ts` |
| **Elo / IRT** | How hard is this item, really? | `src/engine/mastery.ts` |
| **Prerequisite DAG** | What is safe to study next? | `src/engine/graph.ts` |

**Scheduling.** FSRS tracks stability `S`, difficulty `D` and retrievability `R` per
item, where `R(t,S) = (1 + FACTOR·t/S)^DECAY`. That is a power law, not an exponential,
which is why a well-stabilised item stays usable for months. The key term is
`e^(w₁₀(1−R)) − 1` in the stability update: the gain from a successful retrieval is
*inversely* related to how easily you retrieved it. Recalling something you nearly
forgot is worth far more than drilling something fresh, and the whole app is built
on that.

**Mastery** blends retention, a Bayesian estimate of skill, and durability, then
multiplies by coverage. That last multiplication is deliberate: 100% on 3 of 40 items
is not mastery of a topic, and an additive blend would let it look like one.

**Readiness** (the ring on the dashboard) is a weighted mean of *effective* mastery,
where a module counts for more when more of the curriculum depends on it, and is
discounted by the state of its weakest prerequisite. The discount is soft
(`0.5 + 0.5·gate`) rather than a hard multiply, because a number that lurches when one
upstream topic wobbles is a number nobody trusts.

**Selection** takes overdue reviews first, always; then picks new material from the
frontier, ranked by closeness to ~84% predicted success, staleness, novelty, and how
many modules it unblocks.

The whole model is documented inline in `src/engine/`, with the reasoning next to the
code.

---

## Project layout

```
src/
  components/
    art/          procedural SVG + canvas artwork (Earth limb, starfield, thumbnails)
    icons/        the icon set, drawn on a 24×24 grid
    ide/          the playground window, also embedded in lessons
    layout/       shell, sidebar, top bar
    ui/           Card, Bar, Ring, Button, Tile, Check, …
    charts.tsx    line / bar / reliability / heat-strip charts
    Editor.tsx    CodeMirror 6 with a theme built from the app's own tokens
  curriculum/
    types.ts      the schema every module conforms to
    gnc-*.ts      the knowledge tree, tiers 0 to 7 (tiers 0 to 2 are the Foundations
                  pillar, 3+ are GNC Preparation)
    coding.ts     Python, C++, MATLAB, Simulink, Rust, SQL, CAD, Linux, Git
    tracks-aux.ts the career track
  engine/
    fsrs.ts       FSRS-6 (validated against upstream)
    mastery.ts    BKT, IRT, Elo, calibration, scaffolding
    graph.ts      prerequisite DAG, frontier, readiness
    scheduler.ts  session assembly, daily plan, projection
    diagnose.ts   struggling / stale / leech / prereq-gap detection
    apply.ts      the single write path for a graded attempt
    state.ts      learner state + migration
    store.ts      IndexedDB persistence, backup, restore
  learn/          Learn to code: course files, parser, roadmaps, lesson checker
  lib/            router, markdown, language runtimes, voice
  pages/          dashboard, tracks, module, review, playground, progress, …
  workers/        Pyodide worker
desktop/          the Mac app: Electron shell, app:// server, updater, splash (desktop/README.md)
scripts/          build helpers: bundle stamp + zip, app icon, drag-install zips, signing hook
docs/             how updates and releases work
```

### Where things live

| What | Where |
| --- | --- |
| The curriculum | `src/curriculum/gnc-*.ts` (tiers 0 to 7), `coding.ts`, `tracks-aux.ts`; `types.ts` is the schema |
| The engine | `src/engine/`: FSRS, mastery, graph, scheduler, persistence |
| The Mac app shell | `desktop/`: Electron main process, `app://` server, updater, splash. Architecture in `desktop/README.md` |
| Build helpers | `scripts/`: bundle stamping and zipping, app icon, drag-install zips, the signing hook |
| Packaging config | `electron-builder.yml`; versions, `orbit.updates.repo` and `orbit.minShell` in `package.json` |
| Release request file | `RELEASE.txt`, read by `.github/workflows/release-request.yml` (see [docs/releasing.md](docs/releasing.md)) |
| A built bundle | `dist/` after `npm run build:bundle` (with `dist/orbit-bundle.json` stamped in) |
| Release artefacts | `release/`: bundle zip, manifest, DMG, zips; git-ignored |
| Your data (browser) | IndexedDB for the site's origin; export a backup from Settings |
| Your data (Mac app) | `~/Library/Application Support/ORBIT/`: IndexedDB under the `app://orbit` origin, `bundles/` for downloaded updates, `config.json` (encrypted token), `window.json` |

---

## Design notes

The interface follows a single reference layout: a fixed left rail, a full-bleed hero
plate, and a two-column body with four domain cards on the left and a focus/tools/resources
rail on the right. Every surface is a cold-tinted near-black; no surface is ever pure
`#000` and none is ever neutral grey, so the starfield behind the UI reads as depth
rather than noise.

All artwork is drawn in code rather than photographed: the Earth limb, the ascending
vehicle, the powered-descent trajectory, the high bay at dusk, the code and candlestick
plates. That keeps the bundle small and the licensing clean, and lets the scene respond
to state (the vehicle on the hero plate climbs with your readiness).

## Known trade-offs

The curriculum ships as one ~600KB (gzipped) chunk, because the dashboard
cannot compute readiness without every module's prerequisites and item ids.
It is fetched once and then served from the service worker, so the cost lands
on the first visit only. Splitting the light metadata from the heavy card and
quiz bodies is the obvious next improvement, and it needs a generated index
rather than a bundler tweak.

CodeMirror and the Python runtime are both lazy loaded, so the dashboard pays for
neither. Opening the playground is what downloads them.

---

## Licence

Personal project. The curriculum cites third-party books, courses and papers; those
remain the property of their authors and are linked, never reproduced.
