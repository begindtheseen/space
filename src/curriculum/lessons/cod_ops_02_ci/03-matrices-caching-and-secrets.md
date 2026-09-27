---
id: l03-matrices-caching-and-secrets
title: Matrices, caches, artifacts and secrets
minutes: 26
covers:
  - 'Matrix builds across OS, compiler and interpreter version'
  - 'Caching pip, cargo and ccache; artefacts; secrets; environments'
---

Think about a company that makes a new running-shoe sole. Before it goes on sale, they do not test one shoe. They test it in every size, for every model it will be glued into, on road and on track. Then they keep a pantry of ready-cut parts, so each test shoe does not start from a raw sheet of rubber. Every test ends with a printed report that goes in a binder. And the key to the factory's storeroom hangs in a lockbox, not on a hook by the door.

That is this lesson in one picture. The last lesson's pipeline runs on one Linux machine, from scratch each time, and keeps nothing. A real simulation team needs four more things:

- the same job on **many platforms** at once — the **matrix build**,
- a way to skip repeated setup work — the **cache**,
- a way to keep what a run produced — the **artifact**,
- and a safe place for passwords and access keys — **secrets** and **environments**.

## Matrix builds: one job, many combinations

A **[[matrix|matrix-word]]** is a table of settings. You list a few values for each setting, and GitHub runs the job once for every combination.

Why bother? Suppose the simulator's developers use Linux with Python 3.12, but its analysts use Windows and macOS, and one lab machine is stuck on Python 3.10, an older **interpreter** (the program that runs Python code). Code that works for the developers can break for all of them. A matrix makes those platforms part of every pull request.

```yaml
jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        python-version: ["3.10", "3.11", "3.12"]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: ${{ matrix.python-version }}
      - run: python -m pip install -r requirements-dev.txt
      - run: pytest -q
```

Read the new parts:

- **`strategy:`** holds settings for running the job many times.
- **`matrix:`** names the settings (`os`, `python-version` — the names are yours to choose) and lists values for each.
- **`${{ matrix.os }}`** reads the value for the current combination. Here it picks the runner, so each combination runs on the right operating system. `${{ matrix.python-version }}` is handed to setup-python.

Three operating systems times three Python versions is $3 \times 3 = 9$ combinations, so this one job becomes nine jobs, all running side by side. Each shows as its own check on the pull request, labeled with its values, such as `test (windows-latest, 3.11)`.

**`fail-fast`** decides what happens when one combination fails. It is `true` unless you say otherwise: the first failure cancels all the other combinations still running. That saves runner time, but it hides information. If Windows fails, you also want to know whether macOS failed too, so for a portability matrix set `fail-fast: false`.

::: key What a matrix build is for
Running the same job across combinations of OS, compiler, standard version or dependency version, so a portability break surfaces at the pull request rather than at deployment.
:::

::: warning Quote your version numbers
YAML reads `3.10` without quotes as a number, and the number three-point-ten is the same as three-point-one. Checked with Python's YAML reader:

```text
>>> yaml.safe_load('v: [3.10, "3.10", 3.12]')
{'v': [3.1, '3.10', 3.12]}
```

Your matrix would ask setup-python for Python 3.1, which fails or picks the wrong thing. Write version numbers in quotes: `"3.10"`.
:::

## Shaping the matrix with exclude and include

Not every combination makes sense, and sometimes you want one extra. Two keys handle this.

- **`exclude:`** removes combinations. Each entry lists values; any combination matching all of them is dropped.
- **`include:`** adds. If an entry fits an existing combination without changing any of its values, it adds its extra keys to that combination. If it would have to change a value, it becomes a brand-new combination.

::: example Counting the jobs in a shaped matrix
Suppose the team no longer supports Python 3.10 on macOS, and wants to try the newest Python on Linux only:

```yaml
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        python-version: ["3.10", "3.11", "3.12"]
        exclude:
          - os: macos-latest
            python-version: "3.10"
        include:
          - os: ubuntu-latest
            python-version: "3.13"
```

Count step by step.

1. The grid: $3 \times 3 = 9$ combinations.
2. `exclude` removes the one that matches macOS with 3.10: $9 - 1 = 8$.
3. `include` offers Linux with 3.13. Could it be added to an existing Linux combination? No: every Linux combination already has a `python-version` (3.10, 3.11 or 3.12), and adding this entry would change it. So it becomes a new combination: $8 + 1 = 9$.

Nine jobs again, but a different nine. Sanity check by listing: Linux 3.10, 3.11, 3.12, 3.13; Windows 3.10, 3.11, 3.12; macOS 3.11, 3.12. That is $4 + 3 + 2 = 9$.
:::

The other kind of `include`, which adds keys to existing combinations, gives each one extra settings. Here is the simulator's C++ core built with two compilers, in two build types.

::: example A compiler matrix for the C++ core
```yaml
  cpp:
    runs-on: ubuntu-24.04
    strategy:
      matrix:
        compiler: [gcc, clang]
        build_type: [Debug, Release]
        include:
          - compiler: gcc
            cc: gcc
            cxx: g++
          - compiler: clang
            cc: clang
            cxx: clang++
    env:
      CC: ${{ matrix.cc }}
      CXX: ${{ matrix.cxx }}
    steps:
      - uses: actions/checkout@v4
      - run: cmake -S . -B build -DCMAKE_BUILD_TYPE=${{ matrix.build_type }}
      - run: cmake --build build -j 4
      - run: ctest --test-dir build --output-on-failure
```

How many jobs? The grid is $2 \times 2 = 4$: gcc Debug, gcc Release, clang Debug, clang Release.

Now the `include` entries. The first says `compiler: gcc` and adds two new keys, `cc` and `cxx`. It fits both gcc combinations without changing any value they already have, so both gain `cc: gcc` and `cxx: g++`. The second does the same for the two clang combinations. Nothing new is created: still 4 jobs, each now knowing its compiler's two command names.

Those land in `env:` as `CC` and `CXX`, the variables CMake reads to choose the C and C++ compilers.

Why both compilers? They warn about different things, optimize differently, and treat code with undefined behavior differently, so a bug that one hides, the other often exposes. Lesson 5 explains why both the Debug and Release builds are needed too.
:::

A matrix grows fast: three settings with four values each is $4 \times 4 \times 4 = 64$ jobs, and GitHub stops at 256 per workflow run. Keep the full grid for a nightly schedule and a smaller one on pull requests, as lesson 5 explains.

## Caching: skip the work you did yesterday

Most of a CI job's time is often not the tests. It is getting ready: installing packages, compiling C++ from nothing, fetching Rust crates. Every runner starts empty, so it repeats all of that on every run, even when nothing has changed.

A **cache** is a pantry. At the end of one job you save a folder (the downloaded packages, the compiled objects) under a name called a **key**. At the start of the next job, if a saved folder with that key exists, you restore it instead of rebuilding it.

::: key Why cache dependencies in CI
Package installs and C++ compiles dominate job time. Caching pip wheels, cargo registries and ccache objects keyed on a lockfile hash turns a ten-minute job into a two-minute one without changing what is built.
:::

Hold on to **"without changing what is built"**. A cache is only a shortcut: the job must produce the same result with or without it. That is why the key matters so much.

### The key: a fingerprint of the inputs

The key should change whenever the cached thing would be different. For dependencies, the thing that decides them is the **[[lockfile|lockfiles]]** — `Cargo.lock`, or a requirements file with exact versions pinned. So the key includes a fingerprint of that file:

```yaml
      - uses: actions/cache@v4
        with:
          path: |
            ~/.cargo/registry/index/
            ~/.cargo/registry/cache/
            ~/.cargo/git/db/
            target/
          key: ${{ runner.os }}-cargo-${{ hashFiles('**/Cargo.lock') }}
          restore-keys: |
            ${{ runner.os }}-cargo-
      - run: cargo test --locked
```

- **`path:`** lists the folders to save and restore. These are where cargo keeps downloaded crates and where it puts compiled output.
- **`hashFiles('**/Cargo.lock')`** computes a **[[hash|hash-fingerprint]]** of the lockfile: a 64-character fingerprint that changes completely if even one character of the file changes.
- **`key:`** is the exact name to look for, for example `Linux-cargo-` followed by that fingerprint.
- **`restore-keys:`** is the fallback. If no cache has the exact key, take the newest one whose name *starts with* `Linux-cargo-`. An older pantry is better than an empty one.

`cargo test --locked` refuses to run if `Cargo.lock` would need changing, so the lockfile really is the whole truth about the dependencies.

::: example Three pushes through the cache
Follow the cargo job over three pushes. Fingerprints are shortened here to four characters.

1. **First push ever.** The key is `Linux-cargo-3f9a…`. No cache exists at all, so neither the key nor the fallback matches. The job downloads every crate and compiles everything. At the end, the cache action saves the folders under `Linux-cargo-3f9a…`.
2. **Second push**, code changed but `Cargo.lock` did not. The fingerprint is the same, so the key is still `Linux-cargo-3f9a…`. **Exact hit**: the folders come back, nothing is downloaded, and only your changed code recompiles. At the end, nothing is saved, because an entry with that key already exists and entries are never overwritten.
3. **Third push**, a new crate was added, so `Cargo.lock` changed. New fingerprint, key `Linux-cargo-c71e…`. No exact hit. The fallback prefix `Linux-cargo-` matches the entry from push 1, so it is restored: all the old crates are already there, and cargo only downloads the new one. At the end, the job saves a fresh entry under `Linux-cargo-c71e…`, ready for push 4.

Sanity check: the only cold start was push 1, and the cache never decided *which* versions were used — `Cargo.lock` did, every time.
:::

A few rules of the pantry that are worth knowing:

- A cache is saved only if the job succeeds, and only if there was no exact hit.
- Caches are shared carefully between branches. A branch can use caches saved on itself or on the default branch, so a pull request can reuse `main`'s cache but cannot poison it.
- A repository gets a limited amount of cache storage (10 GB by default), and entries that have not been used for seven days are removed. A cache can vanish at any time, so a job must always work without it.

### pip: one line

For Python, setup-python has caching built in. Add two lines to the step:

```yaml
      - uses: actions/setup-python@v5
        with:
          python-version: ${{ matrix.python-version }}
          cache: pip
          cache-dependency-path: requirements-dev.txt
```

This saves pip's download cache, keyed on the OS, the Python version and the fingerprint of `requirements-dev.txt`. pip still installs each time, but from files already on disk.

### ccache: a cache for the C++ compiler

**[[ccache|ccache-how]]** is a program that sits in front of the compiler. Before compiling a file, it computes a fingerprint of everything that could affect the result: the source, every header it includes, the compiler version and the flags. If it has compiled exactly that before, it hands back the saved object file instantly.

```yaml
    env:
      CCACHE_DIR: ${{ github.workspace }}/.ccache
    steps:
      - uses: actions/checkout@v4
      - name: Install ccache
        run: sudo apt-get update && sudo apt-get install -y ccache
      - uses: actions/cache@v4
        with:
          path: .ccache
          key: ccache-${{ runner.os }}-${{ matrix.compiler }}-${{ matrix.build_type }}-${{ github.sha }}
          restore-keys: |
            ccache-${{ runner.os }}-${{ matrix.compiler }}-${{ matrix.build_type }}-
      - name: Configure
        run: >-
          cmake -S . -B build
          -DCMAKE_BUILD_TYPE=${{ matrix.build_type }}
          -DCMAKE_CXX_COMPILER_LAUNCHER=ccache
      - run: cmake --build build -j 4
      - run: ccache --show-stats
```

Notice the key is different in kind from cargo's. It ends in **`${{ github.sha }}`**, the commit being built, so every commit gets a new key and there is never an exact hit. That is on purpose. The `restore-keys` prefix always restores the newest earlier ccache folder for the same compiler and build type, and at the end the job saves an updated one. It is safe because ccache itself checks every file's fingerprint: a stale object is never used. The CMake option `CMAKE_CXX_COMPILER_LAUNCHER=ccache` tells the build to call the compiler through ccache. The last step prints how many files were hits and misses, so you can see the cache working.

::: example What caching is worth, in runner time
The card above says caching can turn a ten-minute job into a two-minute one. Suppose that is true of the matrix job, and put numbers on a month.

- Say the repository sees 120 workflow runs in a month.
- Each run has 9 matrix jobs, as in the first example.
- Each job saves $10 - 2 = 8$ minutes.

Runner time saved: $120 \times 9 \times 8 = 8640$ minutes. Divide by 60: $8640 / 60 = 144$ hours of machine time a month.

The number people feel more is the wait: a developer who pushes a fix learns the answer in about two minutes instead of ten. Sanity check on scale: 144 hours is six full days of one computer running nonstop.
:::

## Artifacts: keeping what a run produced

When a job ends, its machine is deleted. Anything worth keeping — a test report, a trajectory plot, the compiled simulator — must be saved out first. A file saved this way is an **artifact**: an output of the run, stored with it and downloadable from the run's page.

```yaml
      - run: pytest -q --junitxml=report.xml
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-report-${{ matrix.os }}-py${{ matrix.python-version }}
          path: report.xml
          retention-days: 14
```

- `--junitxml=report.xml` tells pytest to write its results into an XML file in a [[common report format|junit-xml]].
- `if: always()` uploads the report even when tests fail, which is exactly when you want it.
- `name:` is what the artifact is called on the run's page.
- `retention-days: 14` deletes it after two weeks. Without it, the repository's default applies (90 days unless changed).

A later job can fetch artifacts with `actions/download-artifact@v4`. This is the answer to the problem from the last lesson, where one job could not see another's files: the first job uploads, and the job that `needs:` it downloads.

::: warning Artifact names must be unique within a run
With `upload-artifact@v4`, two uploads with the same name in one run make the second one fail (unless the step asks to overwrite). In a matrix, every combination runs the same step. Put the matrix values into the name, as above, so the nine jobs make nine different artifacts.
:::

A cache and an artifact both save files, but they are not the same thing:

| | Cache | Artifact |
| --- | --- | --- |
| Purpose | Speed: skip repeated setup | Keep a result of this run |
| Who uses it | Later jobs, automatically | People, or a later job in the same run |
| If it vanishes | The job is slower, the result is the same | The evidence is gone |
| Examples | pip downloads, cargo registry, ccache | Test reports, plots, binaries, Monte Carlo summary |

## Secrets: keys that never appear in the log

Some jobs need a password or an access key, such as a token to upload results to the team's server. Written into the workflow file, it would be visible to everyone who can read the repository, and live in the git history forever.

Instead you store it as a **secret**: an encrypted value kept by GitHub, set in the repository's settings, and read in a workflow as `${{ secrets.NAME }}`. The value never appears in the repository.

::: key Keeping secrets out of a pipeline log
Store them as repository or environment secrets, pass them as environment variables to only the step that needs them, never echo them, and never accept them from a fork-triggered workflow.
:::

**Only the step that needs it.** Put the secret in that step's `env:`, not in the workflow's or the job's. Other steps, including actions written by strangers, then never see it.

```yaml
      - name: Send reports to the results server
        env:
          RESULTS_TOKEN: ${{ secrets.RESULTS_TOKEN }}
        run: |
          tar czf reports.tgz reports
          curl --fail --silent --show-error \
            -H "Authorization: Bearer $RESULTS_TOKEN" \
            --upload-file reports.tgz \
            https://results.example.com/upload
```

Inside the script, `$RESULTS_TOKEN` is an ordinary environment variable. The backslash at the end of a line continues the `curl` command onto the next line.

**Never echo it.** GitHub replaces the exact text of every secret in the log with `***`. That is a safety net, not a guarantee.

::: warning The log mask only catches the exact text
If a script prints the secret in any changed form — [[base64-encoded|base64]], split into pieces, one letter per line, or inside an error message that quotes it differently — the mask does not recognize it, and the key is in the log for anyone with read access. Never print a secret, and be careful with debugging options such as `set -x` in bash, which echo every command with its variables filled in.
:::

**Never from a fork.** On a public repository, anyone can fork it and open a pull request. That pull request's code runs in your workflow. If it could read your secrets, one line — `curl` the token to their own server — would steal them. So GitHub does not give secrets to workflows started by pull requests from forks; the `GITHUB_TOKEN` they get is read-only. There is a different event, **`pull_request_target`**, that [[does run with secrets|pull-request-target]] for fork pull requests. It exists for narrow jobs like adding labels, and it must never build or run the pull request's code.

## Environments: a gate in front of the secrets

Some secrets are more dangerous than others. A key that publishes a new simulator release to every analyst, or pushes a configuration to a real ground station, deserves a human check first.

An **environment** is a named target, such as `results-server` or `production`, set up in the repository's settings. It can have:

- its own **environment secrets**, which only jobs that name this environment can read,
- **protection rules**: required reviewers who must approve before the job starts, a wait timer, and limits on which branches may use it.

A job opts in with one line:

```yaml
  publish-report:
    needs: test
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-24.04
    environment: results-server
    steps:
      - uses: actions/download-artifact@v4
        with:
          pattern: test-report-*
          path: reports
```

When the run reaches this job, it pauses and waits until a required reviewer approves it in the GitHub page. Only then does it start, and only then can it read the environment's secrets. The `if:` adds a second fence: it only runs for pushes to `main`, never for a pull request. `pattern: test-report-*` downloads every artifact whose name starts with `test-report-`, each into its own folder under `reports`.

Sanity check on the design: the matrix jobs, which run for every pull request, touch no secrets. The one job holding a secret runs only on `main`, after the tests pass, behind a human approval.

::: key Environments
An environment is a named deployment target with its own secrets and protection rules (required reviewers, wait timer, allowed branches). A job reads those secrets only after naming the environment and passing its rules.
:::

## Check yourself

::: check
A matrix has `os: [ubuntu-latest, windows-latest]`, `compiler: [gcc, clang, msvc]`, and excludes `{os: ubuntu-latest, compiler: msvc}` and `{os: windows-latest, compiler: gcc}`. How many jobs run?
:::

::: answer
The grid is $2 \times 3 = 6$. Each exclude entry removes one combination, so $6 - 2 = 4$ jobs: Linux with gcc, Linux with clang, Windows with clang, Windows with msvc.
:::

::: check
The matrix lists `python-version: [3.9, 3.10, 3.11]` without quotes. What goes wrong?
:::

::: answer
YAML reads the bare `3.10` as the number 3.1, so one job asks for Python 3.1 instead of 3.10 and fails or tests the wrong thing. Quote each version: `["3.9", "3.10", "3.11"]`.
:::

::: check
A developer's cargo cache key is `cargo-cache` (a fixed text, no hash). Describe what goes wrong when someone updates a dependency.
:::

::: answer
The key never changes, so every later run is an exact hit, and exact hits are never re-saved: the cache stays frozen at its first contents. The build still works, but the new crates are downloaded on every run, so the cache helps less and less. Put `hashFiles('**/Cargo.lock')` in the key, with a prefix in `restore-keys`.
:::

::: check
Why does the ccache key end in `github.sha`, while the cargo key ends in a hash of `Cargo.lock`?
:::

::: answer
The cargo cache holds dependencies, which are fully decided by `Cargo.lock`, so the lockfile's fingerprint is the right name and an exact hit is correct. The ccache folder holds compiled objects for code that changes on every commit. Keying on the commit forces a fresh save each run, while `restore-keys` restores the newest earlier folder. That is safe because ccache checks each file's own fingerprint and never reuses a stale object.
:::

::: check
A job prints `echo "token is $API_TOKEN" | base64` for debugging. The log shows a long string of letters, not `***`. What happened, and what should be done now?
:::

::: answer
GitHub's mask only hides the exact secret text, and the base64-encoded version is different text, so it was printed in the clear; anyone who can read the log can decode it. Remove the line, delete the run's log, and rotate the secret: revoke the old token and store a new one, because it must be treated as leaked.
:::

## Summary

| Idea | What it does | Key syntax or fact |
| --- | --- | --- |
| Matrix | Runs a job for every combination | `strategy: matrix:`, `${{ matrix.os }}`, quote `"3.10"` |
| `fail-fast` | Cancel the rest on first failure | Default `true`; use `false` for portability grids |
| `exclude` / `include` | Remove or add combinations | `include` extends matching combinations if it changes no value |
| Cache | Reuses setup work between runs | `actions/cache@v4`, `key` from `hashFiles(...)`, `restore-keys` |
| pip cache | Keeps pip's downloads | `setup-python` with `cache: pip` |
| ccache | Reuses compiled objects | key ends in `github.sha`, restore by prefix |
| Artifact | Keeps a run's outputs | `upload-artifact@v4`, unique names, `retention-days` |
| Secret | Encrypted value, masked in logs | `${{ secrets.NAME }}` in one step's `env:`; none for forks |
| Environment | Named target with rules | `environment: name`, required reviewers, own secrets |

Next you stop copying the same setup steps into every workflow: reusable workflows and composite actions, your own self-hosted runners for licensed tools and lab hardware, and a look at GitLab CI and Jenkins.

::: context matrix-word Why it is called a matrix
In mathematics a matrix is a grid of numbers in rows and columns. A build matrix is the same shape, filled with jobs: one setting along each side, one job in every cell. With a third setting the grid becomes a block, but the name stays. Here is the shaped matrix from the first example, with the excluded cell crossed out and the included job added below the grid.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="140" y="18">3.10</text><text x="210" y="18">3.11</text><text x="280" y="18">3.12</text>
  </g>
  <g font-size="12" fill="#1f2a44">
    <text x="10" y="46">ubuntu</text><text x="10" y="84">windows</text><text x="10" y="122">macos</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5" fill="#8fb8f0">
    <rect x="110" y="28" width="60" height="28" rx="4"/><rect x="180" y="28" width="60" height="28" rx="4"/><rect x="250" y="28" width="60" height="28" rx="4"/>
    <rect x="110" y="66" width="60" height="28" rx="4"/><rect x="180" y="66" width="60" height="28" rx="4"/><rect x="250" y="66" width="60" height="28" rx="4"/>
    <rect x="180" y="104" width="60" height="28" rx="4"/><rect x="250" y="104" width="60" height="28" rx="4"/>
  </g>
  <rect x="110" y="104" width="60" height="28" rx="4" fill="#fff" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <line x1="116" y1="108" x2="164" y2="128" stroke="#b4232c" stroke-width="2"/>
  <line x1="164" y1="108" x2="116" y2="128" stroke="#b4232c" stroke-width="2"/>
  <rect x="110" y="140" width="60" height="26" rx="4" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="140" y="158" font-size="11" text-anchor="middle" fill="#1f2a44">ubuntu 3.13</text>
  <text x="250" y="158" font-size="11" fill="#6c7a93">8 + 1 = 9 jobs</text>
</svg>
```
:::

::: context lockfiles The file that fixes every version
A lockfile records the exact version of every dependency, including the dependencies of your dependencies. `Cargo.lock` does this for Rust; a requirements file with every version pinned by `==` does it for pip. Because it fully decides what gets installed, its fingerprint is a perfect cache key: same file, same packages.
:::

::: context hash-fingerprint A fingerprint for files
A hash function turns any amount of data into a short, fixed-length code. `hashFiles` uses SHA-256, which gives 256 bits, written as 64 hexadecimal characters. Change one byte of the input and about half the bits flip, so two different lockfiles essentially never share a fingerprint.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="14" width="100" height="36" rx="5" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="60" y="36" font-size="12" text-anchor="middle" fill="#1f2a44">Cargo.lock</text>
  <rect x="10" y="70" width="100" height="36" rx="5" fill="#fff" stroke="#b4232c" stroke-width="1.5"/>
  <text x="60" y="86" font-size="11" text-anchor="middle" fill="#1f2a44">Cargo.lock</text>
  <text x="60" y="100" font-size="11" text-anchor="middle" fill="#b4232c">one line changed</text>
  <rect x="140" y="40" width="70" height="40" rx="5" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="175" y="64" font-size="12" text-anchor="middle" fill="#1f2a44">SHA-256</text>
  <line x1="110" y1="32" x2="140" y2="52" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="110" y1="88" x2="140" y2="68" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="210" y1="52" x2="238" y2="32" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="210" y1="68" x2="238" y2="88" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="242" y="36" font-size="12" fill="#1f2a44">3f9a…</text>
  <text x="242" y="92" font-size="12" fill="#b4232c">c71e…</text>
  <text x="300" y="64" font-size="11" text-anchor="middle" fill="#6c7a93">new key</text>
</svg>
```
:::

::: context ccache-how How ccache knows it is safe
ccache's safety comes from what goes into its fingerprint: the preprocessed source (with every header pasted in), the compiler's identity and the full command line. If any of those differ, it is a miss and the real compiler runs. That is why a CI cache of ccache objects can be restored freely: correctness is checked file by file, not by the cache key. It works with gcc and clang; the same idea exists for Rust in a tool called sccache.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="55" width="80" height="36" rx="5" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="50" y="77" font-size="12" text-anchor="middle" fill="#1f2a44">drag.cpp</text>
  <rect x="120" y="55" width="80" height="36" rx="5" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="160" y="77" font-size="12" text-anchor="middle" fill="#1f2a44">ccache</text>
  <line x1="90" y1="73" x2="118" y2="73" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="200" y1="66" x2="240" y2="36" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="200" y1="80" x2="240" y2="110" stroke="#b4232c" stroke-width="1.5"/>
  <text x="244" y="30" font-size="12" fill="#1d6fd1">hit: saved drag.o</text>
  <text x="244" y="46" font-size="11" fill="#6c7a93">instantly</text>
  <text x="244" y="112" font-size="12" fill="#b4232c">miss: run g++,</text>
  <text x="244" y="128" font-size="11" fill="#6c7a93">then save the result</text>
</svg>
```
:::

::: context junit-xml A report format everyone reads
JUnit is a testing framework for Java, and its XML report layout became a common language between test tools and CI systems. pytest, ctest and many others can write it, and many CI systems can read it to show which tests failed without anyone digging through the log. Kept as an artifact, it is also a record of exactly what passed on a given commit.
:::

::: context base64 Scrambled is not hidden
Base64 rewrites any bytes using 64 safe characters (letters, digits, plus and slash), so binary data can travel as text. It is an encoding, not encryption: anyone can reverse it with one command, `base64 -d`. A secret that has been base64-encoded is as exposed as the original, but it no longer matches the text the log mask is looking for.
:::

::: context pull-request-target The event that holds the keys
`pull_request_target` runs the workflow file from the target branch (usually `main`), not from the pull request, and it runs with the repository's secrets and a token that can write. That is safe only while the workflow never checks out or runs the pull request's own code. Workflows that break that rule have been a well-known way for attackers to steal secrets from open-source projects, so treat any use of this event as something a second person must review.
:::
