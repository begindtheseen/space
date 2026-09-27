---
id: l08-alternatives-podman-nix-spack-conda-uv
title: 'Other ways to pin an environment: Podman, Nix, Spack, conda-lock and uv'
minutes: 22
covers:
  - 'Alternatives: Podman, Nix, Spack, conda-lock, uv'
---

Suppose you want to bake the exact same cake as your grandmother did last year. You could ask her to freeze one and mail it to you: the whole thing, sealed, ready to eat. You could ask for the recipe with every brand and weight written down: "Brand X flour, 250 grams, from the bag with this code". Or, if you are very serious, you could ask for the recipe for the flour too, and the recipe for the oven, all the way down, so anyone could rebuild the whole kitchen from nothing.

All three give you the same cake, with different amounts of carrying and work.

This module has been about the first answer, the frozen cake: a container image, sealed and addressed by a digest. It is the most common answer, not the only one. This last lesson meets five other tools you will see on real teams, what each pins, and how they fit with Docker:

- **Podman**, which runs the same container images without Docker's background service;
- **Nix**, which builds every package from a recipe whose hash becomes the package's address;
- **Spack**, which builds scientific libraries from source on supercomputers, with every option spelled out;
- **conda-lock**, which freezes a conda environment into an exact list with checksums;
- **uv**, a fast Python project tool with a lockfile of its own.

Every output below is real, from the versions named.

## Three layers of "the same environment"

Before comparing tools, split the environment into layers, because each tool pins a different set of them.

1. **The operating system layer**: the C library (glibc or musl), system packages, and things like `/etc`. A container image pins this. So does Nix, in its own way.
2. **Compiled libraries**: the compiler, BLAS and LAPACK math libraries, HDF5, MPI. Spack, Nix and conda pin these. pip mostly does not; it relies on whatever the wheel carries inside it.
3. **Language packages**: NumPy, SciPy, your own Python code. uv, conda-lock and pip lockfiles pin these.

Underneath all three sits the **kernel**, which containers share with the host and which none of these tools pins. That is the limit from the first lesson of the module, and it holds for every tool here.

::: key What each tool pins
Container image: OS layer and everything above it, by digest. Podman: the same images, run without a daemon and, usually, without root. Nix: every package and its whole dependency tree, each at a store path named by a hash of its build inputs. Spack: compiled scientific libraries, built from source with explicit versions, variants and compilers. conda-lock: a conda environment's exact packages and checksums, per platform. uv: a Python project's exact packages and hashes in `uv.lock`. None of them pins the host kernel.
:::

## Podman: the same containers, no daemon

When you type `docker run`, the `docker` program you typed is only a messenger. It sends a request to a background program, the **[[Docker daemon|daemon-picture]]** (`dockerd`), which really creates the container. The daemon runs all the time, usually as root, and every container on the machine is started and managed through it.

**Podman** is a container engine, started at Red Hat, that works without that middleman. It is **daemonless**: when you type `podman run`, the `podman` process itself sets up the container, and a tiny monitor program keeps an eye on it. There is no always-running service to crash, to secure, or to need root.

Podman speaks the same image format (OCI) and pulls from the same registries, and its commands deliberately copy Docker's. Many people type `alias docker=podman` and carry on. Here it is on a machine where Docker is also installed:

```bash
podman --version
podman run --rm docker.io/library/debian:bookworm-slim sh -c 'grep PRETTY /etc/os-release; id'
pgrep -a podman || echo "no podman process running"
pgrep -a dockerd
```

```text
podman version 4.9.3
PRETTY_NAME="Debian GNU/Linux 12 (bookworm)"
uid=0(root) gid=0(root) groups=0(root)
no podman process running
9802 dockerd
```

Read the last two lines together. After the container finished, nothing Podman-related was left running, while Docker's daemon sits there as process 9802 whether or not any container exists.

::: warning Write the full image name
Notice the image is written `docker.io/library/debian`, not `debian`. Docker assumes Docker Hub for a short name. Podman reads a list of registries from its configuration and may ask you which one you meant, or refuse in a script. In a pipeline, write the full name (and, as the registries lesson said, the digest) so no tool has to guess.
:::

### Rootless: root inside, you outside

Podman's other big feature is running containers **rootless**: started by an ordinary user, with no root anywhere on the host. It uses a Linux kernel feature called a **[[user namespace|user-namespace-map]]**, which lets a process see different user numbers than the host does.

Each user gets a private range of spare user ids, listed in `/etc/subuid`. On one test machine, the line for a user called `tester` (uid 1001) reads:

```text
tester:165536:65536
```

That means "tester owns 65,536 ids starting at 165,536", so the range runs from 165,536 to $165\,536 + 65\,536 - 1 = 231\,071$. In a rootless container, Podman maps them like this:

- uid 0 (root) inside the container is uid 1001, tester's own id, on the host;
- uids 1 to 65,536 inside are 165,536 to 231,071 on the host.

Here is why that matters for this module. In the `USER` lesson, a container running as root wrote files into a bind-mounted folder and left them owned by root on the host. In a rootless Podman container, "root" inside *is* you outside, so those same files land owned by you. And if a program escapes the container, it escapes as an ordinary user, not as root.

Docker can run rootless too, since version 20.10, but it is an extra setup step there; in Podman it is the normal way to work.

Podman also borrows an idea from the last lesson: it can group containers into **pods**, and `podman kube generate` writes Kubernetes YAML from them, while `podman kube play` runs Kubernetes YAML locally.

## Nix: every package named by the hash of its recipe

**Nix** is a package manager with one unusual rule. Every package is built from a **derivation**: a complete, exact description of the build — the source code, the compiler, every library, every flag and every environment variable. The result is stored in a folder under `/nix/store` whose name starts with a hash computed from all of those inputs.

Here is the `hello` program from the Nix package collection, **[[nixpkgs|nixpkgs-word]]**, run in the official `nixos/nix` Docker image with Nix 2.35.2:

```bash
nix-shell -p hello --run 'hello; readlink -f $(which hello)'
```

```text
Hello, world!
/nix/store/nm7p8wxflggcwxfzayhysq4z6a1wg373-hello-2.12.3/bin/hello
```

Read the path in pieces. `/nix/store/` is where every package lives. `nm7p8wxflggcwxfzayhysq4z6a1wg373` is a 32-character **[[store hash|store-hash]]**. `hello-2.12.3` is the name and version, there for people to read.

The hash is the powerful part. Change anything about the recipe — a newer compiler, one extra flag, a patched dependency three levels down — and the hash changes, so it becomes a different folder. Two versions of one library sit side by side and never overwrite each other. And a machine that asks for a hash can download the finished result from a shared cache instead of building it, because the same hash means the same inputs.

To pin a whole environment, you pin the package collection itself to one git commit, and check it with a hash so nobody can swap it:

```nix
let
  # nixpkgs 26.05, pinned to one exact commit and checked by hash
  pkgs = import (fetchTarball {
    url = "https://github.com/NixOS/nixpkgs/archive/714a5f8c4ead6b31148d829288440ed033ccc041.tar.gz";
    sha256 = "0v06aa1pwq9l69531mv8ll2zp2kg22ayai93vmfwism7ijxp3r35";
  }) { };
in
pkgs.mkShell {
  packages = [
    (pkgs.python3.withPackages (ps: [ ps.numpy ps.scipy ]))
    pkgs.gcc
    pkgs.cmake
  ];
}
```

Save that as `shell.nix` and run `nix-shell`. This file is written in the **Nix language**, which has its own small grammar: `let … in` names things, `{ }` is a set of named values, and `(ps: [ ps.numpy ps.scipy ])` is a tiny function, read "given ps, the list ps.numpy and ps.scipy".

::: example What the pinned shell really contains
Inside that shell, ask every tool its version:

```bash
nix-shell --run 'python3 -c "import numpy, scipy; print(numpy.__version__, scipy.__version__)";
  gcc --version | head -1; cmake --version | head -1; which python3'
```

```text
2.4.4 1.17.1
gcc (GCC) 15.2.0
cmake version 4.1.2
/nix/store/ibwbfy20pnwxpbsfv5xbrfn9wd2fqk4q-python3-3.13.13-env/bin/python3
```

NumPy 2.4.4, SciPy 1.17.1, GCC 15.2.0, CMake 4.1.2, and a Python 3.13.13 that lives at its own hashed store path. Nothing came from the host's own packages: the Docker image this ran in has no GCC or CMake of its own.

Now the check. Anyone who runs `nix-shell` on this file, on any x86-64 Linux machine, next week or in five years, gets the same commit of nixpkgs and therefore the same recipes, the same hashes and the same versions. If the commit were not pinned, the answer would depend on whatever nixpkgs their machine had last updated to.
:::

Nix can also build ordinary Docker images, so a team can use Nix to pin and Docker to ship. The honest cost is the learning curve: the Nix language and its way of thinking take real time. Newer Nix setups use **flakes**, which record the pinned commits in a `flake.lock` file, the same lockfile idea you will meet again below.

## Spack: from-source builds for supercomputers

**Spack** is a package manager from **[[Lawrence Livermore National Laboratory|spack-origin]]**, made for high-performance computing. On a supercomputer you often cannot use a ready-made binary: you need the library built with a particular compiler, for a particular processor, with MPI on or off, linked against the vendor's math library. Spack builds from source, and it makes every one of those choices explicit in a one-line **spec**.

Read a spec with this table:

| Symbol | Read it as | Example | Meaning |
| --- | --- | --- | --- |
| `@` | "at version" | `zlib@1.3.1` | this version |
| `+` | "with" | `+cxx` | turn a build option on |
| `~` | "without" | `~mpi` | turn a build option off |
| `%` | "compiled with" | `%gcc@13` | this compiler |
| `^` | "depending on" | `^openmpi@5` | choose a dependency's spec |

The build options are called **variants**. `spack spec` shows what Spack would build, fully worked out, without building anything. This is Spack 1.2.2:

```bash
spack spec zlib@1.3.1 ~shared %gcc@13
```

```text
 -   zlib@1.3.1+optimize+pic~shared build_system=makefile platform=linux os=ubuntu24.04 target=icelake %c,cxx=gcc@13.3.0
 -       ^compiler-wrapper@1.1.0 build_system=generic platform=linux os=ubuntu24.04 target=icelake
[e]      ^gcc@13.3.0+binutils+bootstrap~graphite+libsanitizer~mold~nvptx~piclibs~profiled~strip build_system=autotools build_type=RelWithDebInfo languages:='c,c++' platform=linux os=ubuntu24.04 target=x86_64
 -       ^gcc-runtime@13.3.0 build_system=generic platform=linux os=ubuntu24.04 target=icelake
[e]      ^glibc@2.39 build_system=autotools platform=linux os=ubuntu24.04 target=x86_64
 -       ^gmake@4.4.1~guile build_system=generic platform=linux os=ubuntu24.04 target=icelake %c=gcc@13.3.0
```

You asked for three things: version 1.3.1, no shared library, and GCC 13. Spack filled in everything else: the other variants (`+optimize+pic`), the exact compiler (`gcc@13.3.0`), the operating system, and the processor it would tune for (`target=icelake`). The `[e]` marks an **external** package, one Spack found already installed on the machine instead of building; the `-` marks one it would build.

A project lists its specs in a `spack.yaml` file, and `spack concretize` writes every decision, with hashes, into `spack.lock`. Spack installs each configuration in its own hashed folder, like Nix, so `hdf5 +mpi` and `hdf5 ~mpi` can live on one machine without a fight.

::: warning Similar-looking specs are different builds
`hdf5 ~mpi` and `hdf5 +mpi` are two different libraries with different dependencies and possibly different numerical behavior in parallel I/O. When a cluster result will not reproduce on a laptop, compare the full `spack spec` output of both, not only the version number.
:::

## conda-lock: freezing a conda environment

**conda** is a package manager, very popular in science, whose packages can hold anything, not only Python: compilers, the **[[BLAS|blas-word]]** math library NumPy calls, HDF5, even R. An `environment.yml` file lists what you want:

```yaml
name: gnc-sim
channels:
  - conda-forge
dependencies:
  - python=3.12
  - numpy=2.2
  - scipy
platforms:
  - linux-64
  - osx-arm64
```

That is a wish, with ranges: "any 2.2.x NumPy", "any SciPy". Solved today and solved next month, it can give different answers. **conda-lock** solves it once, for every platform you list, and writes the exact answer to `conda-lock.yml`. Running conda-lock 4.0.2 on the file above gave a lockfile with 33 packages for `linux-64` and 28 for `osx-arm64` (the lists differ because each platform has its own runtime pieces: Linux gets GNU `libstdcxx` and `libgomp`, the Mac gets `libcxx` and `llvm-openmp`). An excerpt for one package:

```yaml
- name: numpy
  version: 2.2.6
  manager: conda
  platform: linux-64
  url: https://conda.anaconda.org/conda-forge/linux-64/numpy-2.2.6-py312h72c5963_0.conda
  hash:
    md5: 17fac9db62daa5c810091c2882b28f45
    sha256: c3b3ff686c86ed3ec7a2cc38053fd6234260b64286c2bd573e436156f39d14a7
```

Every package gets its exact version, the exact file to download, and a checksum. The same solve picked Python 3.12.14 and SciPy 1.18.1 for both platforms. A teammate installs exactly that with `conda-lock install -n gnc-sim conda-lock.yml`, and if a downloaded file does not match its checksum, the install stops.

## uv: a fast Python tool with a real lockfile

**uv** is a Python package and project manager written in Rust by the company Astral. You met its `uv pip compile` command in the registries lesson. It also replaces several older tools at once (pip, virtualenv, pip-tools and more), and it is very fast. Here the part that matters is its project lockfile.

You write your wishes in `pyproject.toml`, the standard Python project file:

```toml
[project]
name = "traj"
version = "0.1.0"
requires-python = "==3.11.*"
dependencies = [
    "numpy>=2.0,<3",
]
```

`uv lock` solves the ranges and writes the answer to `uv.lock`. Here is the start of the real file uv 0.8.17 wrote (the long URL is cut):

```toml
version = 1
revision = 3
requires-python = "==3.11.*"

[[package]]
name = "numpy"
version = "2.4.6"
source = { registry = "https://pypi.org/simple" }
sdist = { url = "https://files.pythonhosted.org/…/numpy-2.4.6.tar.gz", hash = "sha256:f3a3570c4a2a16746ac2c31a7c7c7b0c186b95ce902e33db6f28094ed7387dda", size = 20735807, upload-time = "2026-05-18T23:37:14.07Z" }
```

The range `>=2.0,<3` became exactly 2.4.6. Below this, the file lists the **[[wheels|wheel-and-sdist]]** too: 18 of them for this one NumPy version, one for each combination of operating system, processor and Python build it supports (Linux, macOS and Windows; Intel and ARM), each with its own hash. That makes `uv.lock` **universal**: one file serves Linux, macOS and Windows, and each machine installs its own wheel from the list.

Two commands use the lock:

- `uv sync --locked` builds the project's virtual environment from `uv.lock` and refuses to go on if the lock no longer matches `pyproject.toml`;
- `uv run script.py` runs a script inside that environment.

::: example A seeded Monte Carlo, rebuilt from the lock
Here is a small script, `mc.py`. It draws 100 landing miss distances from a normal distribution with a spread of 5 m, writes them as text, and hashes the text:

```python
import hashlib
import numpy as np

rng = np.random.default_rng(seed=2026)
miss_m = np.abs(rng.normal(0.0, 5.0, size=100))   # 100 landing misses, metres
csv = "\n".join(f"{m:.6f}" for m in miss_m)
print("numpy", np.__version__)
print("mean miss", round(float(miss_m.mean()), 3), "m")
print("sha256", hashlib.sha256(csv.encode()).hexdigest()[:16])
```

Delete the virtual environment entirely, rebuild it from the lock, and run:

```bash
rm -rf .venv
uv sync --locked
uv run --locked mc.py
```

```text
Using CPython 3.11.15 interpreter at: /usr/local/bin/python3
Creating virtual environment at: .venv
Resolved 2 packages in 3ms
Installed 1 package in 11ms
 + numpy==2.4.6
numpy 2.4.6
mean miss 4.11 m
sha256 e5fe5d17d45c134a
```

The rebuilt environment got exactly NumPy 2.4.6, and the output hash `e5fe5d17d45c134a` matched the run before the delete. Sanity check on the number: the mean of the absolute value of a normal draw with spread $\sigma$ is $\sigma\sqrt{2/\pi}$, and $5 \times \sqrt{2/\pi} \approx 3.99\,\mathrm{m}$. With only 100 samples, 4.11 m is close, as it should be.

Now break the rule. Add `"scipy>=1.14"` to `pyproject.toml` without re-locking, and run `uv sync --locked` again:

```text
Resolved 3 packages in 95ms
The lockfile at `uv.lock` needs to be updated, but `--locked` was provided. To update the lockfile, run `uv lock`.
```

The exit code is 1. In CI that is a red build, which is exactly what you want: nobody can change the dependencies without changing, and reviewing, the lockfile.
:::

::: note A result that happened to survive
Out of curiosity, the same script was also run with NumPy 1.26.4 and 2.2.6. It printed the same hash both times. Do not lean on that. NumPy's own policy for its random `Generator` (written down in its enhancement proposal NEP 19) does not promise the same stream of numbers across versions, so a future release is allowed to change them. The lockfile turns "probably the same" into "the same version, so the question never comes up". A seed pins the randomness; the lock pins the code that turns the seed into numbers. You need both, plus pinned input data.
:::

## Choosing, and combining

These tools are not rivals to pick one of. Most real projects stack two of them: a container for the OS layer, and a lockfile for the packages inside it.

| Tool | Pins | Typical home |
| --- | --- | --- |
| Docker image by digest | OS and everything above | Shipping, CI, long-term archives |
| Podman | Same images as Docker | Servers and laptops that want no root daemon |
| Nix | Every package, by input hash | Teams that want the whole tree rebuilt exactly |
| Spack | Source builds, variants, compilers | Supercomputers and HPC clusters |
| conda-lock | Exact conda packages, per platform | Scientific Python with native libraries |
| uv | Exact Python packages, universal lock | Python projects of any size |

A sensible default for a GNC simulation team: a digest-pinned `debian-slim` image, with `uv sync --locked` (or `conda-lock install`) inside the Dockerfile. The image pins glibc and the system; the lockfile pins every Python package and its hash; the seed and the versioned input data pin the rest.

::: warning A lockfile is not a container
A `uv.lock` or `conda-lock.yml` pins package versions, not the operating system. The same NumPy wheel on two different Linux distributions still loads each machine's own C library, and a conda environment on macOS uses a different BLAS build from the one on Linux. When the result has to match to the last bit, run the locked install inside a pinned image, on the same processor family.
:::

## Check yourself

::: check
Your colleague says: "Podman is Docker with a different name, nothing more." Give two real differences in how it runs containers.
:::

::: answer
First, Podman is daemonless: `podman run` creates the container from the command's own process, with a small monitor, instead of asking an always-running root service to do it. Second, Podman is designed to run rootless: an ordinary user starts containers, and a user namespace maps root inside the container to that user's own id on the host. They do share the image format, the registries and nearly all the command names.
:::

::: check
In a rootless Podman container for a user with uid 1001 and the `/etc/subuid` line `tester:165536:65536`, a process inside runs as uid 0 and writes a file into a bind-mounted folder. Who owns the file on the host? What if the process ran as uid 1000 inside?
:::

::: answer
Container uid 0 maps to the user's own id, so the file is owned by uid 1001 on the host, the user who started the container. Container uids 1 and up map onto the subordinate range starting at 165,536, so container uid 1 is host uid 165,536, and container uid 1000 is host uid $165\,536 + 1000 - 1 = 166\,535$.
:::

::: check
Two teammates both have OpenBLAS 0.3.28 installed with Nix, but their store paths have different hashes. Is that a problem, and what does it tell you?
:::

::: answer
It tells you the two builds came from different inputs, even though the version number is the same: a different compiler, a different flag, a patch, or a different version of some dependency further down. The hash covers every input, not only the version. Whether it matters depends on the use, but for a result that must reproduce exactly, they should align on the same pinned nixpkgs commit so the hashes match.
:::

::: check
Read this Spack spec aloud and say what it asks for: `hdf5@1.14 ~mpi +cxx %gcc@13`.
:::

::: answer
"hdf5 at 1.14, without mpi, with cxx, compiled with gcc at 13." It asks for HDF5 version 1.14 (any 1.14 release Spack knows), built with the MPI variant off and the C++ interface on, using a GCC 13 compiler. Everything not stated — the exact patch version, other variants, dependencies, target processor — Spack chooses and shows in `spack spec`.
:::

::: check
Your CI job runs `uv sync --locked` and fails with "The lockfile at `uv.lock` needs to be updated". What happened, and what is the right fix?
:::

::: answer
Someone changed the dependencies in `pyproject.toml` but did not update and commit `uv.lock`, so the two files disagree. The right fix is to run `uv lock` on a developer machine, review the changes to `uv.lock` (which packages and versions moved), and commit it with the `pyproject.toml` change. Removing `--locked` from CI would hide the problem and let builds pick versions nobody reviewed.
:::

## Summary

| Tool | What it is | Key fact |
| --- | --- | --- |
| Podman | Daemonless, rootless container engine | Same OCI images and commands as Docker; container root maps to your own uid |
| Nix | Hash-addressed package manager | `/nix/store/<hash>-name-version`; hash covers every build input; pin nixpkgs by commit |
| Spack | HPC source-build manager | Spec syntax `@` version, `+`/`~` variant, `%` compiler, `^` dependency |
| conda-lock | Lockfile for conda environments | Exact packages, URLs and checksums per platform in `conda-lock.yml` |
| uv | Fast Python project manager | Universal `uv.lock` with hashes; `uv sync --locked` fails on a stale lock |
| Combination | Image plus lockfile | Pinned image for the OS, lockfile for packages, seed and data for the rest |

This ends the Docker module. The next module, Continuous Integration for Simulation Code, **[[puts all of it to work|ci-bridge]]**: a pipeline that builds your pinned image, runs `uv sync --locked` and the tests on every change, and turns "it worked on my machine" into a check that runs on every commit.

::: context daemon-picture Messenger and worker
A daemon is a program that runs in the background, waiting for requests, with no window of its own. The name comes from an old idea of a helpful spirit working unseen, and Unix programmers have used it since the 1960s. With Docker, the command you type is a client that sends requests to the daemon; with Podman, the command does the work itself.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="10" y="18" font-size="12" fill="#1f2a44" font-weight="700">Docker</text>
  <rect x="10" y="26" width="90" height="34" rx="5" fill="#fff" stroke="#1f2a44"/>
  <text x="55" y="47" font-size="12" text-anchor="middle" fill="#1f2a44">docker run</text>
  <rect x="135" y="26" width="100" height="34" rx="5" fill="#f2b880" stroke="#1f2a44"/>
  <text x="185" y="41" font-size="12" text-anchor="middle" fill="#1f2a44">dockerd</text>
  <text x="185" y="54" font-size="11" text-anchor="middle" fill="#1f2a44">always on, root</text>
  <rect x="270" y="26" width="80" height="34" rx="5" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="310" y="47" font-size="12" text-anchor="middle" fill="#1f2a44">container</text>
  <line x1="100" y1="43" x2="129" y2="43" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="129,39 135,43 129,47" fill="#1f2a44"/>
  <line x1="235" y1="43" x2="264" y2="43" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="264,39 270,43 264,47" fill="#1f2a44"/>
  <text x="10" y="100" font-size="12" fill="#1f2a44" font-weight="700">Podman</text>
  <rect x="10" y="108" width="90" height="34" rx="5" fill="#fff" stroke="#1f2a44"/>
  <text x="55" y="129" font-size="12" text-anchor="middle" fill="#1f2a44">podman run</text>
  <rect x="270" y="108" width="80" height="34" rx="5" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="310" y="129" font-size="12" text-anchor="middle" fill="#1f2a44">container</text>
  <line x1="100" y1="125" x2="264" y2="125" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="264,121 270,125 264,129" fill="#1f2a44"/>
  <text x="185" y="160" font-size="11" text-anchor="middle" fill="#6c7a93">no service in between</text>
</svg>
```
:::

::: context user-namespace-map Two sets of numbers for one user
Linux knows users only by number. A user namespace gives a group of processes its own numbering, plus a table that translates each inside number to an outside one. Rootless Podman fills that table from your own uid and your range in `/etc/subuid`.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="70" y="18" font-size="12" text-anchor="middle" fill="#1f2a44" font-weight="700">inside container</text>
  <text x="280" y="18" font-size="12" text-anchor="middle" fill="#1f2a44" font-weight="700">on the host</text>
  <rect x="20" y="30" width="100" height="30" rx="4" fill="#f2b880" stroke="#1f2a44"/>
  <text x="70" y="50" font-size="12" text-anchor="middle" fill="#1f2a44">uid 0 (root)</text>
  <rect x="230" y="30" width="110" height="30" rx="4" fill="#f2b880" stroke="#1f2a44"/>
  <text x="285" y="50" font-size="12" text-anchor="middle" fill="#1f2a44">uid 1001 (you)</text>
  <rect x="20" y="80" width="100" height="44" rx="4" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="70" y="98" font-size="12" text-anchor="middle" fill="#1f2a44">uid 1 …</text>
  <text x="70" y="115" font-size="12" text-anchor="middle" fill="#1f2a44">65 536</text>
  <rect x="230" y="80" width="110" height="44" rx="4" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="285" y="98" font-size="12" text-anchor="middle" fill="#1f2a44">uid 165 536 …</text>
  <text x="285" y="115" font-size="12" text-anchor="middle" fill="#1f2a44">231 071</text>
  <line x1="120" y1="45" x2="224" y2="45" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="224,41 230,45 224,49" fill="#1f2a44"/>
  <line x1="120" y1="102" x2="224" y2="102" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="224,98 230,102 224,106" fill="#1f2a44"/>
  <text x="175" y="143" font-size="11" text-anchor="middle" fill="#6c7a93">from /etc/subuid: tester:165536:65536</text>
</svg>
```
:::

::: context nixpkgs-word One giant recipe book in git
nixpkgs is the collection of Nix recipes, kept in a single public git repository on GitHub with tens of thousands of packages. A "channel" such as 26.05 is a tested snapshot of it. Because it is one repository, one commit id fixes the recipe for every package at once, which is why pinning a commit pins the whole world your shell sees.
:::

::: context store-hash How the store hash is made
Nix gathers everything that goes into a build — the source, the builder, the dependencies' own store paths, the flags — into the derivation, then hashes it with SHA-256. The long hash is shortened to 160 bits and written in a 32-character alphabet of digits and lowercase letters, which is why it looks unlike the hex digests you met with Docker. Because dependencies' paths are part of the input, a change anywhere below a package changes the package's own hash too. The idea came from Eelco Dolstra's PhD research at Utrecht University, written up in his 2006 thesis.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="20" width="80" height="30" rx="4" fill="#fff" stroke="#1f2a44"/>
  <text x="50" y="40" font-size="12" text-anchor="middle" fill="#1f2a44">/nix/store/</text>
  <rect x="90" y="20" width="160" height="30" rx="4" fill="#f2b880" stroke="#1f2a44"/>
  <text x="170" y="40" font-size="12" text-anchor="middle" fill="#1f2a44">nm7p8wxf…6a1wg373</text>
  <rect x="250" y="20" width="100" height="30" rx="4" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="300" y="40" font-size="12" text-anchor="middle" fill="#1f2a44">-hello-2.12.3</text>
  <g stroke="#1f2a44" stroke-width="1.2">
    <line x1="50" y1="50" x2="50" y2="72"/><line x1="170" y1="50" x2="170" y2="72"/><line x1="300" y1="50" x2="300" y2="72"/>
  </g>
  <g font-size="11" text-anchor="middle" fill="#1f2a44">
    <text x="50" y="88">where every</text><text x="50" y="102">package lives</text>
    <text x="170" y="88">32 characters: hash of</text><text x="170" y="102">every build input</text>
    <text x="300" y="88">name and version,</text><text x="300" y="102">for people</text>
  </g>
</svg>
```
:::

::: context spack-origin Built where the big computers are
Lawrence Livermore National Laboratory in California runs some of the largest supercomputers in the United States. Spack was started there by Todd Gamblin around 2013 to cope with building the same scientific codes with many compilers, MPI libraries and options. It is now used at many national laboratories and HPC centers, and the US Exascale Computing Project used it to build and deliver its scientific software stack.
:::

::: context blas-word The math library underneath NumPy
BLAS, short for Basic Linear Algebra Subprograms, is a standard set of routines for vector and matrix arithmetic such as multiplying two matrices. NumPy and SciPy do not do that heavy lifting themselves; they call a BLAS library such as OpenBLAS or Intel's MKL. Different BLAS builds can add numbers in a different order, and floating-point addition is not associative, so the last few digits of a result can change. That is why pinning BLAS matters for bit-exact simulations.
:::

::: context wheel-and-sdist Wheels and source distributions
A Python package is published in two forms. A **wheel** (file ending `.whl`) is ready to install: already compiled for one Python version, operating system and processor, so installing is only unpacking. A **source distribution**, or sdist (`.tar.gz`), is the source code, which pip or uv must build on your machine, needing a compiler and taking much longer. The name "wheel" is a pun on "cheese shop", the old nickname of the Python Package Index, from a Monty Python sketch.
:::

::: context ci-bridge Where this goes next
Everything in this module becomes a line in a CI pipeline in the next module: `docker build` with a pinned base, `uv sync --locked` so a stale lockfile fails the build, a seeded simulation whose output hash is compared with a stored one. The pipeline is where reproducibility stops being a promise and becomes a test.
:::
