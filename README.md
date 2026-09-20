# ORBIT — GNC Flight Academy

A local-first learning platform that takes a complete beginner to guidance, navigation
and control engineering readiness. It runs entirely in a browser tab: no account, no
server, no telemetry. Everything you do is stored on your device.

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
  SciPy, SymPy, pandas and Matplotlib), and SQL runs against SQLite compiled to
  WebAssembly. C++, Rust and MATLAB are checked against expected output — and the app
  says so rather than pretending otherwise.
- **Honest numbers.** The Progress page shows your predicted retention over a year,
  your review workload ahead, and a reliability diagram of how well-calibrated your own
  confidence turns out to be. Completion estimates are given as a range, never a date.

---

## Running it

```bash
npm install
npm run dev       # http://localhost:5173
```

```bash
npm run build     # static output in dist/
npm run preview   # serve the built output
npm test          # engine + curriculum integrity tests
npx tsc -b        # typecheck
```

Node 20+ required. The build output is a plain static site — drop `dist/` on GitHub
Pages, Vercel, Netlify, Cloudflare Pages or any static host.

### Deploying

`.github/workflows/deploy.yml` typechecks, tests and builds on every push and pull
request, then publishes `main` to GitHub Pages. Enable it under
**Settings → Pages → Build and deployment → Source: GitHub Actions**.

For a subpath deploy, set `BASE_PATH` (the workflow does this automatically for Pages):

```bash
BASE_PATH=/space/ npm run build
```

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
- **C++, Rust and MATLAB do not execute here.** No browser-side C++ toolchain is small
  enough to ship, there is no Rust compiler that runs in a browser at all, and MATLAB is
  proprietary. Those exercises are checked against expected output, and the app labels
  them as such.
- **Your progress lives on one device.** There is no account and no sync. Export a
  backup from Settings and keep it somewhere else — that file is the durable copy.

---

## Licence

Personal project. The curriculum cites third-party books, courses and papers; those
remain the property of their authors and are linked, never reproduced.
