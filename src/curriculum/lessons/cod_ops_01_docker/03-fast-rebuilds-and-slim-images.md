---
id: l03-fast-rebuilds-and-slim-images
title: Fast rebuilds and slim images
minutes: 22
covers:
  - Layer caching and instruction ordering for fast rebuilds
  - 'Multi-stage builds: compile fat, ship slim'
  - '.dockerignore and build context size'
---

Think of a stack of pancakes, cooked one at a time and piled up as they come off the pan. If you decide the top pancake needs blueberries, you cook one new pancake and swap it in. But if the *bottom* pancake was wrong, you cannot slide a new one under the pile. You have to cook the bottom one again, and then every pancake above it too, because each was stacked on the one below.

A Docker image is built the same way, one layer on another. Docker keeps every layer it has built before, in a **build cache**, and reuses a layer whenever it can prove nothing below it or in it has changed. When one layer does change, every layer above it must be rebuilt. So *the order of the instructions* decides how much work a rebuild does: put the parts that rarely change at the bottom and the parts you edit all day at the top.

This lesson has three parts. First, how the cache decides, and how ordering turns a rebuild of many minutes into a few seconds. Second, the **multi-stage build**: compile with a big toolchain, then ship a small image with no compiler in it. Third, the **build context** and the `.dockerignore` file, which stop a folder of simulation results from riding along on every build. All output below comes from real builds with Docker 29.3.1, trimmed to the lines that matter. Step labels in the logs are condensed to one line per step.

## How the build cache decides

For each instruction, Docker asks: "Have I built exactly this step before, on top of exactly this parent layer?" If yes, it reuses the old layer and prints `CACHED`. If no, it runs the step, and from then on nothing above can come from the cache.

What counts as "exactly this step" depends on the instruction:

- For `RUN`, `ENV`, `WORKDIR` and most others: the text of the instruction (with any `ARG` and `ENV` values filled in) and the parent layer. Every `RUN` after an `ARG` also receives that argument as an environment variable, and its value is part of the step's key, so changing a `--build-arg` makes every later `RUN` miss the cache even when its text never mentions the argument. Declare an `ARG` just before the first step that needs it.
- For `COPY`: also a **[[checksum|checksum-idea]]** of the contents of every file being copied. Edit one byte in one copied file and the checksum changes, so the `COPY` step misses the cache.

Put those together and you get the **cascade**: once one step misses, every step after it runs again, because each one's parent layer is new.

::: warning The cache does not look outside
A `RUN` step is reused whenever its *text* is unchanged. Docker does not check whether the internet changed since. `RUN pip install numpy` built last month stays cached with last month's NumPy, even if a newer one is out; on a different machine with no cache, the same line installs the newer one. Pin versions in the file you install from (`numpy==2.2.6`), and use `docker build --no-cache` when you really do want everything rebuilt from scratch. Lesson 6 takes this further with lockfiles and digests.
:::

## Order the Dockerfile for the edits you make

Here is a small Monte Carlo simulation. **[[Monte Carlo|monte-carlo-name]]** means running a calculation many times with random inputs to see how spread out the answers are. This one takes the apogee formula from the last lesson and draws 1,000 random burnout speeds around 250 m/s, using a fixed **[[seed|random-seed]]** so the "random" numbers are the same on every run:

```python
"""Monte Carlo spread of a sounding rocket's apogee (no drag)."""
import numpy as np

G0 = 9.80665                       # m/s^2
rng = np.random.default_rng(seed=2026)
speed = rng.normal(250.0, 5.0, size=1000)   # burnout speed, m/s
apogee = 3000.0 + speed**2 / (2 * G0)       # m
print(f"cases: {apogee.size}")
print(f"mean apogee: {apogee.mean():.0f} m, spread (1 sigma): {apogee.std():.0f} m")
```

It needs NumPy, listed in a one-line **manifest** — a file that lists the packages a project depends on. For Python this is usually `requirements.txt`:

```text
numpy==2.2.6
```

Now two Dockerfiles that differ only in the order of their lines.

```dockerfile
# Version A: copy everything, then install
FROM python:3.12-slim
WORKDIR /app
COPY . .
RUN pip install --no-cache-dir -r requirements.txt
ENTRYPOINT ["python3", "dispersion.py"]
```

```dockerfile
# Version B: copy the manifest, install, then copy the source
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
ENTRYPOINT ["python3", "dispersion.py"]
```

(`--no-cache-dir` tells pip not to keep its own download cache inside the image, which would only make the image bigger.)

Both build the same image the first time, in about 9.5 seconds on this machine, most of it the `pip install` step. The difference shows up on the *second* build.

::: example A one-line source edit, rebuilt both ways
Change one line in `dispersion.py` — the number of cases, from `size=1000` to `size=5000` — and rebuild each version. Each block below condenses the build log to one line per step, and adds the time measured around the whole `docker build` command.

Version A:

```text
[2/4] WORKDIR /app                                         CACHED
[3/4] COPY . .                                             DONE 0.1s
[4/4] RUN pip install --no-cache-dir -r requirements.txt   DONE 5.4s
total wall-clock time: 9.54 s
```

The `COPY . .` step copies `dispersion.py`, whose checksum changed, so it missed the cache. The cascade then forced `pip install` to run again, downloading and installing NumPy even though `requirements.txt` did not change at all.

Version B:

```text
[2/5] WORKDIR /app                                         CACHED
[3/5] COPY requirements.txt .                              CACHED
[4/5] RUN pip install --no-cache-dir -r requirements.txt   CACHED
[5/5] COPY . .                                             DONE 0.1s
total wall-clock time: 0.48 s
```

`requirements.txt` did not change, so its `COPY` hit the cache, and so did the install on top of it. Only the final `COPY . .` ran.

Compare: $9.54 / 0.48 \approx 19.9$, so version B rebuilt about 20 times faster. And this project installs only one package. A real simulation stack with SciPy, pandas, plotting libraries and a compiled C++ extension can spend many minutes in that install step, and version A pays those minutes on every one-line edit. The new image still works:

```text
cases: 5000
mean apogee: 6187 m, spread (1 sigma): 128 m
```

A mean near 6187 m is right: that is the apogee for exactly 250 m/s from the last lesson, and the speeds are centered on 250 m/s.
:::

::: key Why COPY order matters
Each instruction is a cached layer keyed on its inputs. If you COPY the whole source before installing dependencies, every source edit invalidates the dependency layer and reinstalls everything. Copy the manifest, install, then copy the source.
:::

The same rule works for every language: copy the file that lists dependencies (`requirements.txt`, `pyproject.toml` with its lockfile, `Cargo.toml` and `Cargo.lock`, a `conanfile.txt` or `vcpkg.json` for C++), install, and only then copy the code. The general principle is to sort instructions from "changes least often" at the top to "changes most often" at the bottom. The base image changes least of all, which is why `FROM` is first.

::: note Why the cascade has to happen
Why can't Docker reuse the `pip install` layer in version A, when the packages installed would be the same? Because a layer is a record of *changes to the layer beneath it*. The `pip install` layer in the cache was recorded on top of the old `COPY . .` layer, the one holding the old `dispersion.py`. On top of a different parent it might behave differently — the install step could, in principle, read any copied file, including the edited one. Docker does not try to guess which files a command reads. It only knows the parent changed, so it must run the step again. Ordering is how you tell Docker, safely, that the install depends on `requirements.txt` alone: it is the only file present when the install runs.
:::

## Multi-stage builds: compile fat, ship slim

Compiled languages bring a new problem. To build a C++ program you need a compiler, a linker, header files and build tools — often a gigabyte or more. To *run* the finished program you need none of that: only the program and the few shared libraries it links against.

A **multi-stage build** puts both jobs in one Dockerfile, as separate **stages**. Each stage starts with its own `FROM`. The last stage becomes the image; the earlier ones are scaffolding. `COPY --from=<stage>` reaches back into an earlier stage and takes only the files you name.

Here is a small C++ tool, `period.cpp`, that prints the time for one lap of a circular orbit at a given altitude, using $T = 2\pi\sqrt{a^3/\mu}$ where $a$ is the orbit's radius and $\mu$ (read "mu") is Earth's gravitational parameter, $3.986 \times 10^{14}\ \mathrm{m^3/s^2}$:

```cpp
// period: orbital period of a circular orbit around Earth.
#include <cmath>
#include <cstring>
#include <iostream>
#include <string>

int main(int argc, char* argv[]) {
    if (argc > 1 && std::strcmp(argv[1], "--version") == 0) {
        std::cout << "period 1.0.0\n";
        return 0;
    }
    const double mu = 3.986004418e14;  // Earth's GM, m^3/s^2
    const double r_earth = 6371e3;     // mean Earth radius, m
    const double pi = std::acos(-1.0);
    double alt_km = (argc > 1) ? std::stod(argv[1]) : 400.0;
    double a = r_earth + alt_km * 1e3;                        // orbit radius, m
    double t_min = 2.0 * pi * std::sqrt(a * a * a / mu) / 60.0;
    std::cout << "altitude " << alt_km << " km -> period " << t_min << " min\n";
    return 0;
}
```

And the two-stage Dockerfile:

```dockerfile
# ---- stage 1: build, with the full compiler toolchain ----
FROM gcc:14 AS build
WORKDIR /src
COPY src/ .
RUN g++ -O2 -Wall -o period period.cpp

# ---- stage 2: run, with nothing but what the program needs ----
FROM debian:trixie-slim
COPY --from=build /src/period /usr/local/bin/period
RUN useradd --uid 1000 sim
USER sim
ENTRYPOINT ["period"]
CMD ["400"]
```

`AS build` gives the first stage a name. The second `FROM` starts a fresh, empty stage from a small Debian image. Its `COPY --from=build` takes exactly one file, the compiled program, out of the first stage. The compiler never enters the second stage.

::: example One program, two images
For comparison, a single-stage version builds in `gcc:14` and runs from there:

```dockerfile
FROM gcc:14
WORKDIR /src
COPY src/ .
RUN g++ -O2 -Wall -o period period.cpp
ENTRYPOINT ["./period"]
CMD ["400"]
```

Build both and compare (`docker images period`, trimmed):

```text
IMAGE           DISK USAGE   CONTENT SIZE
period:1.0.0         118MB         29.8MB
period:single       2.14GB          541MB
```

Both print the same answer:

```text
altitude 400 km -> period 92.4143 min
```

Check it. At 400 km, $a = 6\,371\,000 + 400\,000 = 6\,771\,000\ \mathrm{m}$, and

$$
T = 2\pi\sqrt{\frac{(6.771\times 10^{6})^3}{3.986\times 10^{14}}} \approx 5544.9\ \mathrm{s} \approx 92.41\ \mathrm{min}.
$$

That is about the International Space Station's lap time, as it should be at that height.

Now the sizes. The multi-stage image takes $2140 / 118 \approx 18$ times less disk, and its download is $541 / 29.8 \approx 18$ times smaller too. And the compiler really is gone:

```bash
docker run --rm --entrypoint sh period:1.0.0 -c 'which g++ gcc cc c++ || echo "no compiler found"'
```

```text
no compiler found
```
:::

::: key What a multi-stage build accomplishes
Compilation happens in a stage with the full toolchain, then only the artifacts are COPYed into a minimal runtime stage. The shipped image contains no compiler, headers or build caches, shrinking size and attack surface.
:::

The **[[attack surface|attack-surface]]** is everything in an image that an attacker could try to misuse. A compiler in a production image is a gift to an intruder: they can build new tools right there. Fewer programs also means fewer security fixes to track.

::: warning Deleting the compiler afterwards does not work
It is tempting to stay single-stage and add a last step, `RUN rm -rf /usr/local/libexec/gcc /usr/local/bin/g++ /usr/local/bin/gcc`. Try it:

```text
IMAGE            DISK USAGE   CONTENT SIZE
period:deleted       2.14GB          541MB
```

No smaller at all. The `rm` step added a 20.5 kB layer of whiteouts; the compiler's bytes are still in the `gcc:14` layers underneath, as lesson 1 showed. Removing packages with the system package manager in a later step fails the same way. Only a fresh final stage leaves the toolchain behind.
:::

### Runtime dependencies: what the program still needs

A compiled program usually needs some **[[shared libraries|shared-libraries]]** at run time. The tool `ldd` lists them. Inside the final image:

```bash
docker run --rm --entrypoint sh period:1.0.0 -c 'ldd /usr/local/bin/period'
```

```text
	linux-vdso.so.1 (0x00007f4e0d2dd000)
	libstdc++.so.6 => /lib/x86_64-linux-gnu/libstdc++.so.6 (0x00007f4e0d06e000)
	libm.so.6 => /lib/x86_64-linux-gnu/libm.so.6 (0x00007f4e0cf7e000)
	libgcc_s.so.1 => /lib/x86_64-linux-gnu/libgcc_s.so.1 (0x00007f4e0cf51000)
	libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007f4e0cd5d000)
	/lib64/ld-linux-x86-64.so.2 (0x00007f4e0d2df000)
```

Every line has a `=>` pointing at a real file (the first and last lines are special and always present), so nothing is missing. The C++ standard library `libstdc++` is there because Debian's slim image already contains it. If your program links other libraries — HDF5 for data files, say — the final stage must install the *runtime* package for each, without the development headers.

::: warning Build and run on the same distribution release
The `gcc:14` image is built on Debian 13, "trixie". The first version of this Dockerfile used `debian:bookworm-slim` (Debian 12) for the final stage. It built without complaint, then failed at run time:

```text
period: /lib/x86_64-linux-gnu/libstdc++.so.6: version `GLIBCXX_3.4.32' not found (required by period)
```

The program was compiled against [[a newer C++ library|symbol-versions]] than the older Debian carries. Match the final stage to the release the build stage is based on (trixie with trixie here), or copy the needed libraries across from the build stage. Always run the final image once, including `--version`, before you trust it.
:::

For a CMake project, as in this module's first exercise, only the build stage changes: install CMake, copy the whole project, then configure and build, for example with `cmake -S . -B build -DCMAKE_BUILD_TYPE=Release` followed by `cmake --build build`. The final stage copies the program from the `build` folder in the same way. While debugging a multi-stage file, `docker build --target build .` stops after the named stage, so you can look inside it.

## .dockerignore and the build context

In the last lesson you met the build context: the folder, named by the final `.` of `docker build .`, that is packed up and sent to the **[[builder|builder-daemon]]** — the part of Docker that does the building — so that `COPY` can use its files. The builder cannot see anything that was not sent.

A simulation project folder is rarely tidy. It has a `.git` folder with the whole project history, a virtual environment, and, above all, results: gigabytes of output files. With no instructions, all of it is part of the context.

::: example 300 MB of results riding along
Add a `results` folder holding three 100 MB output files to the Monte Carlo project (version B). Rebuild. The context step reports:

```text
#5 [internal] load build context
#5 transferring context: 300.07MB 1.2s done
```

The build shipped 300 MB to the builder before it could start. Worse, the final `COPY . .` copied the results *into the image*. `docker history` shows that layer at 300 MB, and the image's download size jumped:

```text
IMAGE        DISK USAGE   CONTENT SIZE
disp:good         284MB         66.9MB
disp:junk         884MB          367MB
```

$367 - 66.9 = 300.1\ \mathrm{MB}$: the whole results folder is now inside the image. Random-looking data like simulation output hardly compresses, so it costs its full size.

Now add a file named `.dockerignore` next to the Dockerfile:

```text
.git
.venv/
__pycache__/
results/
*.bin
```

Rebuild the same project, from a fresh copy of the folder so that nothing is reused from before. The context shrinks to under one kilobyte (592 bytes here), the transfer takes no measurable time, and the image is back to 66.9 MB. Nothing in the Dockerfile changed.
:::

A `.dockerignore` file uses patterns much like `.gitignore`: one pattern per line, `*` matches any run of characters, a leading `!` makes an exception, and lines starting with `#` are comments. It lives at the top of the build context.

::: key What .dockerignore changes
It excludes paths from the build context sent to the daemon. Without it a repository containing results, .git and virtualenvs can ship hundreds of megabytes on every build, and any COPY . pulls junk into the image.
:::

::: warning Keep secrets out of the context
If a `.env` file with passwords, a cloud credentials file or an SSH key sits in the project folder, a `COPY . .` puts it into the image, and anyone who can pull the image can read it. List such files in `.dockerignore` as well as in `.gitignore`. It also helps the cache: a file that is ignored can never change a `COPY` checksum, so editing it never triggers a rebuild.
:::

## Check yourself

::: check
A Dockerfile reads, in order: `FROM`, `WORKDIR`, `COPY . .`, `RUN pip install -r requirements.txt`, `RUN python3 setup_data.py`, `ENTRYPOINT`. You edit only `README.md`, which lives in the project folder. Which steps run again on the next build, and why?
:::

::: answer
`COPY . .` runs again, because `README.md` is part of what it copies and its checksum changed. Then the cascade forces both `RUN` steps to run again, since their parent layer is new. `FROM` and `WORKDIR` come from the cache. Adding `README.md` to `.dockerignore`, or copying only the files the build needs, would avoid all of this.
:::

::: check
Rewrite that Dockerfile's order so that editing a Python source file does not reinstall packages. Assume `setup_data.py` only needs the installed packages and itself.
:::

::: answer
```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY setup_data.py .
RUN python3 setup_data.py
COPY . .
ENTRYPOINT ["python3", "main.py"]
```

The manifest is copied and installed first, so the install layer only misses when `requirements.txt` changes. `setup_data.py` is copied on its own, so its step only reruns when that one file changes. Everything else comes last.
:::

::: check
A single-stage image built from a 1.4 GB compiler image ends with `RUN apt-get purge -y g++ && apt-get autoremove -y`. A colleague expects the image to shrink by several hundred megabytes. What will they see, and what should they do instead?
:::

::: answer
The image will be about the same size, possibly a little larger. The purge runs in a new layer, which can only add whiteouts over the compiler's files; the bytes remain in the earlier, read-only layers. The fix is a multi-stage build: compile in the big image, then `COPY --from=` only the program (and any runtime libraries) into a small final stage that never had a compiler.
:::

::: check
Your final stage is `debian:trixie-slim` and your program starts with `error while loading shared libraries: libhdf5.so: cannot open shared object file`. What does that mean, and what are two ways to fix it?
:::

::: answer
The program was linked against the HDF5 library in the build stage, but the final stage does not contain that library, so the loader cannot find it. `ldd` on the program would show `libhdf5… => not found`. Fix 1: install Debian's runtime package for HDF5 in the final stage (the library only, not the `-dev` package with headers). Fix 2: copy the needed `.so` files from the build stage with `COPY --from=build`. Either way, run the final image once to confirm.
:::

::: check
A build prints `transferring context: 2.1GB`, even though the image only needs a 40 kB source folder. Name two costs this causes and the fix.
:::

::: answer
Cost 1: every build first sends 2.1 GB to the builder, which takes time before any step runs (much more on a remote builder or a CI machine). Cost 2: any `COPY . .` copies that junk into the image, making it huge to store and download, and any change in it breaks the cache for that `COPY`. The fix is a `.dockerignore` listing things like `.git`, `results/`, virtual environments and data files, or copying only the needed folder with `COPY src/ ./src/`.
:::

## Summary

| Idea | What it is | Key fact |
| --- | --- | --- |
| Build cache | Reuse of layers built before | A step is reused only if its text, inputs and parent layer are unchanged |
| `COPY` cache key | Checksums of the copied files | One byte changed means a cache miss |
| Cascade | A miss rebuilds every later step | Order from rarely changed to often changed |
| Manifest first | `COPY requirements.txt`, install, then `COPY . .` | Source edits no longer reinstall packages |
| Multi-stage build | Several `FROM` stages; `COPY --from=` | Ship the program without the compiler |
| Deleting later | Adds whiteouts only | Never shrinks an image |
| Runtime libraries | Found with `ldd` | Final stage must have them, on a matching release |
| Build context | Folder sent to the builder | `.dockerignore` trims it and keeps junk and secrets out |

The final stage here was `debian:trixie-slim`, chosen to match the build stage. The next lesson looks at that choice properly — Debian slim versus the even smaller Alpine — and at why the smaller one can be a trap for scientific Python.

::: context checksum-idea A short number that stands for a whole file
A checksum is a short value computed from every byte of some data, so that any change to the data almost certainly changes the value. Docker computes one over the files a `COPY` sends, including their names and permissions, but not their modification times. Touching a file without changing it does not bust the cache, and changing one letter does. The digest from lesson 1 is the same idea applied to a whole image.
:::

::: context monte-carlo-name Named after a casino
The method takes its name from the Monte Carlo casino in Monaco, because it runs on chance, like a roulette wheel. The name is usually credited to Nicholas Metropolis, who worked at Los Alamos in the late 1940s with Stanislaw Ulam and John von Neumann; they ran the method on some of the first electronic computers. Aerospace teams use it constantly: a dispersion analysis flies thousands of simulated missions with randomly varied engine thrust, winds, sensor errors and masses, to see how far the results can spread.
:::

::: context random-seed Random, but repeatable
A computer's random number generator is really a formula that produces a long sequence of numbers that look random. The seed picks where in that sequence to start. Same seed, same sequence, same simulation result, every time. That is what lets a Monte Carlo run be repeated exactly — but only if the environment is also the same, since a different NumPy version is allowed to produce a different sequence from the same seed. A pinned container image and a fixed seed together are what make a stochastic result reproducible.
:::

::: context attack-surface Less inside means less to attack
The phrase comes from computer security: the attack surface is the sum of all the places an attacker could try to get in or misuse something. For a container image that means every program, library and open port it contains. Each one may one day have a published security flaw. Security scanners that check images report flaws per package, so an image without a compiler, headers and build tools also produces a much shorter report to review — a real saving on a team that must sign off on every image it deploys.
:::

::: context shared-libraries Code that programs borrow at run time
A shared library is compiled code that many programs use, kept in one file (ending in `.so`, for "shared object") and loaded when a program starts. The C library `libc`, the math library `libm` and the C++ standard library `libstdc++` are the usual ones. Sharing saves space and lets a security fix reach every program at once. The price is that the right version must be present wherever the program runs. Linking statically — copying the library code into the program itself — avoids that dependency, at the cost of a bigger program and a manual rebuild whenever the library needs a fix.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="20" width="150" height="130" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="85" y="40" font-size="12" text-anchor="middle" fill="#1f2a44" font-weight="700">build stage (gcc:14)</text>
  <rect x="24" y="52" width="122" height="26" rx="4" fill="#f2b880" stroke="#1f2a44"/>
  <text x="85" y="69" font-size="11" text-anchor="middle" fill="#1f2a44">period (program)</text>
  <text x="85" y="98" font-size="11" text-anchor="middle" fill="#6c7a93">g++, headers, cmake,</text>
  <text x="85" y="114" font-size="11" text-anchor="middle" fill="#6c7a93">object files …</text>
  <text x="85" y="136" font-size="11" text-anchor="middle" fill="#b4232c">left behind</text>
  <rect x="200" y="20" width="150" height="130" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="275" y="40" font-size="12" text-anchor="middle" fill="#1f2a44" font-weight="700">final (trixie-slim)</text>
  <rect x="214" y="52" width="122" height="26" rx="4" fill="#f2b880" stroke="#1f2a44"/>
  <text x="275" y="69" font-size="11" text-anchor="middle" fill="#1f2a44">period (program)</text>
  <text x="275" y="98" font-size="11" text-anchor="middle" fill="#1f2a44">libstdc++, libm,</text>
  <text x="275" y="114" font-size="11" text-anchor="middle" fill="#1f2a44">libgcc_s, libc</text>
  <text x="275" y="136" font-size="11" text-anchor="middle" fill="#1f2a44">already in the base</text>
  <line x1="146" y1="65" x2="206" y2="65" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="206,60 214,65 206,70" fill="#1d6fd1"/>
  <text x="180" y="164" font-size="11" text-anchor="middle" fill="#1d6fd1">COPY --from=build: one file crosses</text>
</svg>
```
:::

::: context symbol-versions How a program says which library it needs
`GLIBCXX_3.4.32` is a **symbol version**: a label that the C++ standard library puts on the functions it provides, raised whenever a new compiler release adds functions. A program records the highest label it uses. When it starts, the loader checks that the installed `libstdc++` provides that label, and refuses to run if it does not. Newer libraries keep all the old labels, so a program built on an older system runs on a newer one; the reverse, as here, fails. The same scheme, with `GLIBC_2.xx` labels, applies to the C library.
:::

::: context builder-daemon Who does the building
The `docker` command you type is only a client. The work happens in a background service, the Docker **daemon** (a program that runs quietly without a window), whose building part is called BuildKit. Client and daemon can be on different machines: in continuous integration, which the next module covers, the builder is often a remote server, and a bloated context then travels over the network on every build.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="30" width="120" height="56" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="70" y="54" font-size="12" text-anchor="middle" fill="#1f2a44" font-weight="700">docker client</text>
  <text x="70" y="72" font-size="11" text-anchor="middle" fill="#1f2a44">packs the context</text>
  <line x1="132" y1="58" x2="220" y2="58" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="220,53 228,58 220,63" fill="#1d6fd1"/>
  <text x="180" y="48" font-size="11" text-anchor="middle" fill="#1d6fd1">context</text>
  <text x="180" y="78" font-size="11" text-anchor="middle" fill="#6c7a93">(minus .dockerignore)</text>
  <rect x="230" y="30" width="120" height="56" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="290" y="54" font-size="12" text-anchor="middle" fill="#1f2a44" font-weight="700">daemon</text>
  <text x="290" y="72" font-size="11" text-anchor="middle" fill="#1f2a44">BuildKit, cache</text>
  <text x="180" y="110" font-size="11" text-anchor="middle" fill="#6c7a93">same laptop, or a CI server far away</text>
</svg>
```
:::
