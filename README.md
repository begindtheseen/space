# ORBIT — GNC Flight Academy

A local-first learning platform that takes a complete beginner to guidance, navigation
and control engineering readiness. It runs entirely in a browser tab, or as a Mac app:
no account, no server, no telemetry. Everything you do is stored on your device.

> **Not affiliated with, endorsed by, or connected to SpaceX.** This is an independent
> personal study tool. Job requirements, compensation figures and interview details are
> drawn from public postings and candidate accounts at the time of writing and change
> without notice — verify the live posting before relying on any of it.

---

## What it is

Most study apps are a list of videos with a progress bar. This one is built around a
memory model and a dependency graph, and it shows its working:

- **A 100+ module curriculum** on four pillars: the mathematical and physical
  foundations (algebra through optimization, dynamics, astrodynamics), the languages the
  work is done in (Python, C++, MATLAB/Simulink, Rust, SQL, CAD), the GNC core itself
  (control, estimation, navigation, guidance, flight software), and career preparation.
  Nothing in it is off-topic — if a module does not serve getting hired into GNC, it is
  not here.
- **A real scheduler.** Reviews are timed by FSRS-6, a fitted power-law memory model
  with per-item stability and difficulty. The port is validated against the upstream
  reference implementation digit for digit — see `src/engine/fsrs.test.ts`.
- **A prerequisite DAG.** Nothing is hidden, but the app will tell you plainly when a
  module rests on something you have not built yet, and point upstream instead of
  letting you grind against material you are not ready for.
- **Real code execution.** Python runs for real (CPython 3.14 via Pyodide, with NumPy,
  SciPy, SymPy, pandas and Matplotlib), SQL runs against SQLite compiled to
  WebAssembly, and C++ always compiles and runs: on the Mac's own compiler in the desktop
  app when one is installed, otherwise with clang++ compiled to WebAssembly in the app.
  Rust and shell run through the desktop app's toolchains; without them those exercises
  are compared against the reference solution, and the app says so. MATLAB exercises ship
  a NumPy equivalent you can run.
- **Learn to code.** Roadmaps — GNC Engineer, Flight Software, Test & Data, Software
  Engineer — that lay out courses in order as a numbered path: the command line, Git,
  Python, SQL and C++, lesson by lesson in the same IDE
  window as the playground, every step really run and shown as test cases. The lessons
  are plain text in `src/learn/tracks/*.txt` (format in `src/learn/parse.ts`); the
  roadmaps are in `src/learn/platform.ts`. The same lesson engine runs in APEX's
  LAUNCHPAD app, which adds JavaScript, TypeScript and the web.
- **The playground, embedded.** `components/ide/Embed.tsx` is the playground's window as a
  component. Lesson code blocks that can run become it (`src/lib/practice.ts` decides which),
  each lesson ends with Try it here, code exercises are done and graded in it on the module
  page, and every Workbench scenario is coded in it. `src/lib/run.ts` says how each language
  runs.
- **The playground** has three modes — Code, SQL and Terminal — in one IDE window with
  a floating Run Code button and a panel for test cases, console, input and results.
  Terminal is a practice shell that lives in the page (`src/lib/shell.ts`): files,
  folders and enough git to learn the loop, the same on every machine.
- **Honest numbers.** The Progress page shows your predicted retention over a year,
  your review workload ahead, and a reliability diagram of how well-calibrated your own
  confidence turns out to be. Completion estimates are given as a range, never a date.

---

## How to use it

Open a track, start its first module, and work the module page top to bottom. Every
module runs the same three steps:

1. **Learn.** Read the objectives, then the lessons in order — written for the app,
   with derivations, worked examples and check-yourself questions, and required to cover
   every topic the module lists. Lessons are arriving track by track (Foundations first);
   a module without them yet says so and points at the best free material instead. Skim
   the Notes — the flashcards laid out to read — and press **Mark as studied**.
2. **Practice.** The exercises. Code ones open in the playground with tests; derivations
   and analyses are done on paper and checked against the solution afterwards.
3. **Recall.** The flashcards and questions as a spaced-repetition session. Questions
   are held back until here on purpose — attempting one cold is what makes it stick.

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
mastered. Gated modules are shown, not hidden, and the gate is advice — you can study
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

The first launch takes one extra step. The app is signed ad hoc — there is no $99-a-year
Apple Developer ID behind it, so it is not notarised — and Gatekeeper will refuse to open
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

---

## Updates

The Mac app is two things: a thin Electron shell, and the curriculum bundle — this
site's `dist/` — carried inside it. Almost every change ships as a new bundle, and a
bundle update does not need a new app: **Settings → Updates → Check for updates** asks
GitHub for the latest release, downloads the bundle zip (a few megabytes, seconds),
checks its SHA-256, and switches to it on the next restart. The app also checks quietly
a few seconds after launch and marks the avatar in the top bar when something is
waiting. If a downloaded bundle fails to start, the app quarantines it and goes back to
the last good one on its own; **Roll back** in the same card does the same by hand.

While this repository is private, GitHub answers an anonymous request with 404 and the
card says so. Create a fine-grained personal access token with read-only **Contents**
permission for `begindtheseen/space` and paste it into the Access token row. It is
stored encrypted by macOS (`safeStorage`, backed by the login keychain) and is only
ever sent to `api.github.com` and the release download it redirects to. Two ways to
need no token at all: make the repository public, or publish releases from a separate
public repository and point `orbit.updates.repo` in `package.json` at it.

Changes to the shell itself — anything under `desktop/`, or a new Electron — need a
new DMG. The card says "This update needs a newer ORBIT app" and links to it; nothing
is downloaded that the installed app cannot run.

---

## Running it

```bash
npm install
npm run dev       # http://localhost:5173
```

```bash
npm run build     # static output in dist/
npm run preview   # serve the built output
npm test          # engine + curriculum integrity tests (+ the desktop updater's)
npx tsc -b        # typecheck
```

```bash
npm run desktop        # build the bundle and run it in the Electron shell
npm run desktop:pack   # build the Mac app into release/ (DMG needs macOS)
npm run desktop:e2e    # end-to-end: real Electron against a fake GitHub API
```

Node 22 required. The build output is a plain static site — drop `dist/` on Vercel,
Netlify, Cloudflare Pages or any static host. For a subpath deploy, set `BASE_PATH`:

```bash
BASE_PATH=/space/ npm run build
```

### CI

`.github/workflows/ci.yml` typechecks, tests, builds the bundle and runs the desktop
end-to-end suite under xvfb on every push and pull request, keeping the e2e screenshots
as an artifact. Releases are a separate workflow — see the next section.

---

## Publishing an update (the back door)

Releases are cut by CI from a version tag; nothing is built or uploaded by hand.

```bash
npm version patch          # or minor / major: bumps package.json and creates the tag
git push --follow-tags
```

`.github/workflows/release.yml` then checks that the tag equals `package.json`'s
version, typechecks and tests, builds the bundle zip and `orbit-manifest.json` on
Linux, builds the ad-hoc-signed universal DMG and drag-install zip on macOS, and
publishes all four as a GitHub Release. Installed apps see it on their next check. Put
a `RELEASE_NOTES.md` in the repository before tagging to control the notes shown inside
the app (Markdown); without one, the notes are generated from the commits.

No terminal handy? The same pipeline runs from a file change instead of a tag: set
`version` in `package.json` and write that version on the first line of `RELEASE.txt`,
then commit and push (any branch, or edit both files on github.com). CI checks the two
agree and that the tag does not exist yet, creates `v<version>` at that commit, and
publishes the release. Both routes end in the same place.

What needs what:

| Change | Do | Ships as |
| --- | --- | --- |
| Curriculum, engine, pages — anything under `src/` or `public/` | `npm version patch` (or minor) | A bundle. Every installed app updates in place. |
| Anything under `desktop/`, or the Electron version | The same, **and** set `orbit.minShell` in `package.json` to the new version | A new DMG. Older apps are told to download it instead of a bundle they cannot run. |

`minShell` is the contract between bundle and shell: a bundle is only ever activated by
a shell at least that new, so an old app never ends up running a bundle that expects an
IPC channel it does not have. The manifest carries it, the bundle carries it, and the
shell checks it at both download and startup.

---

## Where things live

| What | Where |
| --- | --- |
| The curriculum | `src/curriculum/gnc-*.ts` (tiers 0–7), `coding.ts`, `tracks-aux.ts`; `types.ts` is the schema |
| The engine | `src/engine/` — FSRS, mastery, graph, scheduler, persistence |
| The Mac app shell | `desktop/` — Electron main process, `app://` server, updater, splash. Architecture in `desktop/README.md` |
| Build helpers | `scripts/` — bundle stamping and zipping, app icon, drag-install zips, the signing hook |
| Packaging config | `electron-builder.yml`; versions, `orbit.updates.repo` and `orbit.minShell` in `package.json` |
| A built bundle | `dist/` after `npm run build:bundle` (with `dist/orbit-bundle.json` stamped in) |
| Release artefacts | `release/` — bundle zip, manifest, DMG, zips; git-ignored |
| Your data (browser) | IndexedDB for the site's origin; export a backup from Settings |
| Your data (Mac app) | `~/Library/Application Support/ORBIT/` — IndexedDB under the `app://orbit` origin, `bundles/` for downloaded updates, `config.json` (encrypted token), `window.json` |

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
item, where `R(t,S) = (1 + FACTOR·t/S)^DECAY` — a power law, not an exponential, which
is why a well-stabilised item stays usable for months. The load-bearing term is
`e^(w₁₀(1−R)) − 1` in the stability update: the gain from a successful retrieval is
*inversely* related to how easily you retrieved it. Recalling something you nearly
forgot is worth far more than drilling something fresh, and the whole product is built
on that.

**Mastery** blends retention, a Bayesian estimate of skill, and durability — then
multiplies by coverage. That last multiplication is deliberate: 100% on 3 of 40 items
is not mastery of a topic, and an additive blend would let it look like one.

**Readiness** (the ring on the dashboard) is a weighted mean of *effective* mastery,
where a module counts for more when more of the curriculum depends on it, and is
discounted by the state of its weakest prerequisite. The discount is soft
(`0.5 + 0.5·gate`) rather than a hard multiply — a number that lurches when one upstream
topic wobbles is a number nobody trusts.

**Selection** takes overdue reviews first, always; then picks new material from the
frontier, ranked by closeness to ~84% predicted success, staleness, novelty, and how
many modules it unblocks.

The whole model is documented inline in `src/engine/`, with the reasoning next to the
code rather than in a wiki that will rot.

---

## Project layout

```
src/
  components/
    art/          procedural SVG + canvas artwork (Earth limb, starfield, thumbnails)
    icons/        the icon set, drawn on a 24×24 grid
    layout/       shell, sidebar, top bar
    ui/           Card, Bar, Ring, Button, Tile, Check, …
    charts.tsx    line / bar / reliability / heat-strip charts
    Editor.tsx    CodeMirror 6 with a theme built from the app's own tokens
  curriculum/
    types.ts      the schema every module conforms to
    gnc-*.ts      the knowledge tree, tier 0 → 7 (tiers 0–2 are the Foundations
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
  lib/            router, markdown, language runtimes
  pages/          dashboard, tracks, module, review, playground, progress, …
  workers/        Pyodide worker
desktop/          the Mac app: Electron shell, app:// server, updater, splash (desktop/README.md)
scripts/          build helpers: bundle stamp + zip, app icon, drag-install zips, signing hook
```

---

## Design notes

The interface follows a single reference layout: a fixed left rail, a full-bleed hero
plate, a two-column body with four domain cards on the left and a focus/tools/resources
rail on the right. Every surface is cold-tinted near-black; no surface is ever pure
`#000` and none is ever neutral grey, so the starfield behind the UI reads as depth
rather than noise.

All artwork is drawn rather than photographed — the Earth limb, the ascending vehicle,
the powered-descent trajectory, the high bay at dusk, the code and candlestick plates.
That keeps the bundle small, the licensing clean, and lets the scene respond to state
(the vehicle on the hero plate climbs with your readiness).

---

## Known trade-offs

The curriculum ships as one ~600KB (gzipped) chunk, because the dashboard
cannot compute readiness without every module's prerequisites and item ids.
It is fetched once and then served from the service worker, so the cost lands
on the first visit only. Splitting the light metadata from the heavy card and
quiz bodies is the obvious next win and wants a generated index rather than a
bundler tweak.

CodeMirror and the Python runtime are both lazy — the dashboard pays for
neither. Opening the playground is what downloads them.

## What this cannot do

Stated plainly, because a study tool that oversells itself wastes your time:

- **It is not a degree.** Essentially every GNC engineer posting requires a bachelor's
  in physics, CS, aerospace or an engineering discipline, and recruiters screen on that
  line. This platform makes you a far stronger candidate; it does not substitute for the
  credential. The Career track covers the three realistic paths honestly.
- **ITAR is a hard gate.** US-person status is required for essentially every role in
  this field. No amount of skill substitutes for it.
- **Rust and MATLAB need the desktop app's toolchains.** There is no Rust compiler that
  runs in a browser at all, and MATLAB is proprietary (Octave is used when installed).
  Without them those exercises are checked against expected output, and the app labels
  them as such. C++ in the browser has no exception support: `throw` and `try` need the
  Mac's own compiler.
- **Your progress lives on one device.** There is no account and no sync. Export a
  backup from Settings and keep it somewhere else — that file is the durable copy.

---

## Licence

Personal project. The curriculum cites third-party books, courses and papers; those
remain the property of their authors and are linked, never reproduced.
