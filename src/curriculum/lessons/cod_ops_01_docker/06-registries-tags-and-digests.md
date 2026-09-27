---
id: l06-registries-tags-and-digests
title: Registries, tags and digests
minutes: 23
covers:
  - 'Registries, tagging discipline, never :latest in a pipeline'
  - Digest pinning and lockfiles for true reproducibility
---

Imagine a library where the librarian puts a sticky note saying "Staff pick" on one book each week. If you tell a friend "read the staff pick", you have told them nothing lasting: next week the note is on a different book. Now imagine every book also carried a fingerprint, computed from every letter printed in it. Tell your friend "read the book with this fingerprint", and there is only one book in the world that matches, forever. If anyone reprinted it with one comma changed, the fingerprint would change too.

Docker images have both. A **tag**, such as `3.12-slim`, is the sticky note: a name someone can move to a different image at any time. A **digest**, such as `sha256:f77ac9e4…`, is the fingerprint: computed from the image's exact bytes, so it can only ever name one image.

This lesson is about where images are kept (registries), how to name them so that people can find them (tags), and how to name them so that the same bytes come back years later (digests, plus lockfiles for the packages inside). That last part is what turns a container from a convenience into evidence. If an anomaly investigation in 2031 has to rerun a guidance Monte Carlo from 2026, "we used `python:3.12-slim`" is not an answer. Everything below was run with Docker 29.3.1 and uv 0.8.17 on one x86-64 Linux machine in September 2026, and the output is copied from the real terminal.

## Registries: where images live

A **registry** is a server that stores images and hands them out. `docker pull` downloads from one; `docker push` uploads to one. You have been using the biggest public one, **Docker Hub**, every time you pulled `python:3.12-slim`. Others you will meet: GitHub's registry at `ghcr.io`, the registries run by cloud providers such as Amazon's ECR, the one built into GitLab, and private registries a company runs on its own network, which is common in aerospace and defence, where build machines may have no internet access at all.

A full [[image reference|reference-parts]] names the registry, the repository and the tag:

```text
ghcr.io/gnc-team/landing-mc:1.0.0
└─────┘ └──────────────────┘ └───┘
registry     repository        tag
```

When you leave parts out, Docker fills them in. `python:3.12-slim` is short for `docker.io/library/python:3.12-slim`: registry `docker.io` (Docker Hub), and the `library/` namespace that holds the official images. Leave out the tag entirely and Docker fills in `latest`.

You can run a registry yourself in one line; the official image is called `registry`. Here it is on the loopback address from lesson 5, so only this machine can use it:

```bash
docker run -d --name reg -p 127.0.0.1:5000:5000 registry:2
docker tag landing-mc:1.0.0 localhost:5000/gnc/landing-mc:1.0.0
docker push localhost:5000/gnc/landing-mc:1.0.0
```

```text
eb560cfa823c: Pushed
6b37362b3da7: Pushed
1.0.0: digest: sha256:d71b1bc801fd46951c9323a573102f1d87d09e9e98758dda6ec79c641fe091c4 size: 856
```

`docker tag` added a second name to an image already on the machine; it copied nothing. The name starts with `localhost:5000`, so `docker push` knew which registry to send it to. The push uploaded each layer, then reported the image's **digest**. Keep that digest in mind; we will need it in a moment.

## Tags are sticky notes

A **tag** is a human-readable name that points at one image in a repository. The registry keeps a small table: tag name on one side, digest on the other. Pushing a tag that already exists simply changes the table, so the tag points at the new image. Nothing stops it and nothing warns you.

Tags also overlap. One image can have many tags at once. Asking the registry which digest each tag points at today:

```bash
docker buildx imagetools inspect python:3.12-slim
```

| Tag | Digest today |
| --- | --- |
| `python:3.12-slim` | `sha256:f77ac9e44ae96ef2c90b8053ea08c31f8be030f824196b0ae4db6d462c84e51f` |
| `python:3.12-slim-trixie` | `sha256:f77ac9e44ae96ef2c90b8053ea08c31f8be030f824196b0ae4db6d462c84e51f` |
| `python:3.12-slim-bookworm` | `sha256:392307d22300de8b5986851a12d9176dfc0fc073e65bf6523ebd7dcbeb23564e` |
| `python:3.12.14-slim-bookworm` | `sha256:392307d22300de8b5986851a12d9176dfc0fc073e65bf6523ebd7dcbeb23564e` |

The first two are the same image under two names: Python 3.12.14 on Debian 13, "trixie". The last two are another image: the same Python on Debian 12, "bookworm". And every one of these tags moves. The same `inspect` output shows this image was built on 2026-09-19; the Python image maintainers rebuild these tags whenever Debian ships a security fix or Python ships a patch release. Before Debian 13 existed, a build `FROM python:3.12-slim` got Debian 12, with an older glibc. The line in the Dockerfile never changed. The software under it did.

Tags come in a range of stability, from most moving to least:

- `latest`: whatever the publisher last pushed without a tag. It is only the default name; it does not even promise to be the newest.
- `3.12-slim`: newest 3.12 patch, newest Debian.
- `3.12.14-slim-bookworm`: one Python patch, one Debian release, but still rebuilt for security fixes.
- Your own release tag, such as `1.0.0`: stable only if your team promises never to push it twice.

::: example A tag that moved under a pipeline
Continue with the local registry. Suppose someone builds a new version of the simulation image, this time on Python 3.13, and pushes it under the tag that already exists:

```bash
docker tag landing-mc:py313 localhost:5000/gnc/landing-mc:1.0.0
docker push localhost:5000/gnc/landing-mc:1.0.0
```

```text
1.0.0: digest: sha256:3dfb30644b9d0c1f36cc32bd675a6ffd72dd496a868c7f37294da2163fb4d9b6 size: 856
```

The push succeeded without a word of warning. Now two people pull and check the Python version inside. One uses the tag, the other the digest the first push reported:

```bash
docker run --rm --entrypoint python localhost:5000/gnc/landing-mc:1.0.0 -V
docker run --rm --entrypoint python \
  localhost:5000/gnc/landing-mc@sha256:d71b1bc801fd46951c9323a573102f1d87d09e9e98758dda6ec79c641fe091c4 -V
```

```text
Python 3.13.15
Python 3.12.14
```

Same tag, `1.0.0`, but the tag now gives Python 3.13. The digest still gives the original Python 3.12 image, because a digest can only ever name those exact bytes. (The `@` separates a repository from a digest, in the same place a `:` would separate a tag. `--entrypoint python` replaced the image's usual program for one run, so we could ask for the version.)

If a CI pipeline had said `landing-mc:1.0.0`, it would have silently switched Python versions between Tuesday's run and Wednesday's.
:::

::: key Why :latest is banned in pipelines
It is a mutable pointer, so the same pipeline definition builds different software on different days. Pin an immutable tag, and pin by sha256 digest when the result has to be reproducible years later.
:::

## Tagging discipline

The problem in the example was not Docker; it was the team's habits. Four rules keep tags trustworthy.

1. **Never push over a released tag.** Once `1.0.0` exists, the next build is `1.0.1` or `1.1.0`. Use a [[version-numbering scheme|semver]] everyone understands.
2. **Tag every build with the git commit it came from**, for example `landing-mc:git-3f9c2ab`. Then any image can be traced back to exact source code, and each commit's tag is written once.
3. **Let the registry enforce it.** Many registries, Amazon ECR and the open-source Harbor among them, can mark tags as immutable, so a second push of `1.0.0` is refused instead of silently accepted.
4. **Never use `latest`, or any bare moving tag, in anything automated**: CI pipelines, compose files that run tests, `FROM` lines of images you release. `latest` is fine for trying something out at your own terminal.

::: warning The pull that did not happen
`docker run python:3.12-slim` uses the copy already on your machine if there is one; it does not check the registry. So two machines with the "same" tag can hold different images: whichever each one pulled last. A build machine that pulled in March and a laptop that pulled in September disagree without anyone noticing. `docker pull` refreshes the local copy; pinning a digest makes the question disappear.
:::

## Digests: naming the exact bytes

Lesson 1 introduced the digest: the SHA-256 hash of an image's content, 64 hexadecimal digits long. Change one byte anywhere, in any layer or in the settings, and the digest changes completely. That makes it **content-addressed**: the name is computed from the content, so it cannot be moved to other content. Git names its commits the same way.

For images published for several kinds of computer, there is one more level. The digest you usually see names an **image index**: a short list with one entry per [[platform|index-manifest]] (x86-64, 64-bit ARM, and so on). Each entry is itself a digest of that platform's image. The full `imagetools` output for `python:3.12-slim`, trimmed:

```text
Name:      docker.io/library/python:3.12-slim
MediaType: application/vnd.oci.image.index.v1+json
Digest:    sha256:f77ac9e44ae96ef2c90b8053ea08c31f8be030f824196b0ae4db6d462c84e51f

Manifests:
  Name:        docker.io/library/python:3.12-slim@sha256:44ff437bba879d4941b710a369a8f19266aea34b29002807f0c487fabc9eec9b
  Platform:    linux/amd64
    org.opencontainers.image.version:     3.12.14-slim-trixie
    org.opencontainers.image.base.name:   debian:trixie-slim
    org.opencontainers.image.created:     2026-09-19T00:58:30Z
  ...
```

Pinning the index digest (`f77ac9e4…`) is the usual choice: the same line then works on an x86 build server and an ARM laptop, and each gets its own exact, fixed image. On any one platform, the index digest always leads to the same platform image.

To pin, add `@sha256:…` after the tag. You can keep the tag for humans to read; when both are present, Docker ignores the tag and uses the digest:

```dockerfile
FROM python:3.12-slim@sha256:f77ac9e44ae96ef2c90b8053ea08c31f8be030f824196b0ae4db6d462c84e51f
```

Find a digest with `docker buildx imagetools inspect name:tag`, or for an image you already pulled, with:

```bash
docker image inspect python:3.12-slim --format '{{json .RepoDigests}}'
```

```text
["python@sha256:f77ac9e44ae96ef2c90b8053ea08c31f8be030f824196b0ae4db6d462c84e51f"]
```

A digest pin does not mean never updating. It means updating on purpose: someone changes the digest in a reviewed commit, the tests run, and the change is in git history with a reason. [[Bots can open those commits for you|update-bots]] when a new image appears.

::: warning A digest only helps if the image still exists
A registry is not an archive. Many registries delete images that no tag points at any more, under a retention rule, and a public image can be withdrawn. For results that must be rerun in five years, also keep your own copy: push the exact image to a registry your organisation controls, and for the most important runs save it to a file with `docker save image@sha256:… -o image.tar` and store that with the results.
:::

## Lockfiles: pinning what is inside

A digest-pinned `FROM` fixes the floor. It does nothing for this line:

```dockerfile
RUN pip install numpy
```

Built today, that installs today's NumPy. Built next year, next year's. The Dockerfile looks identical and the image is not. The same goes for `apt-get install` without versions, and for every package the ones you named depend on.

The fix is a **lockfile**: a file listing every package, including the dependencies of your dependencies, at one exact version, usually with a hash of each package file. You write a short list of what you want; a tool works out the full, exact list once, and you commit both.

For pip, the common form is a requirements file with `==` versions and `--hash` lines. Here `uv`, a fast Python package tool, generates it from a one-line wish list:

```bash
echo "numpy==2.2.6" > requirements.in
uv pip compile requirements.in --generate-hashes --python-version 3.12 -o requirements.lock
```

```text
# This file was autogenerated by uv via the following command:
#    uv pip compile requirements.in --generate-hashes --python-version 3.12 -o requirements.lock
numpy==2.2.6 \
    --hash=sha256:038613e9fb8c72b0a41f025a7e4c3f0b7a1b5d768ece4796b674c8f3fe13efff \
    --hash=sha256:0678000bb9ac1475cd454c6b8c799206af8107e310843532b04d49649c717a47 \
    ... (55 hashes in all: one for every NumPy 2.2.6 file on the package index)
```

Then install with `pip install --require-hashes -r requirements.lock`. With that flag, pip refuses any package whose file does not match one of the listed hashes, and refuses any package not in the list at all. [[A hash mismatch stops the build|hash-check]].

Other languages have the same idea built in: Rust's `Cargo.lock`, JavaScript's `package-lock.json`, Python's `uv.lock` and `poetry.lock`, and `conda-lock` for conda environments (lesson 8 compares these tools).

::: note Why rebuilding is weaker than keeping the image
Even with every pin, rebuilding a Dockerfile years later is not guaranteed to give the same image. An `apt-get install` line fetches whatever the Debian mirrors hold that day, and old package versions do disappear from them; a package index can remove a file; timestamps inside layers differ. So the digest of the *built image* is the real record. Treat the Dockerfile and lockfile as the recipe that explains the image, and the pushed, archived image digest as the thing you actually rerun.
:::

## The full recipe for a rerunnable result

Put the pieces together for a Monte Carlo campaign. The simulation below drops 100 parachute landings with random crosswind and a random drag error, and writes each case's miss distance to a CSV file:

```python
"""Seeded Monte Carlo: 100 parachute landings with random wind and drag error."""
import sys
import numpy as np

rng = np.random.default_rng(seed=2026)
n = 100
wind = rng.normal(0.0, 3.0, n)          # m/s, crosswind
drag = rng.normal(1.0, 0.05, n)         # drag multiplier
descent_s = 600.0 * drag                # time under canopy, s
miss_m = wind * descent_s               # downrange miss, m
sigma = np.std(miss_m)

out = sys.stdout
out.write("case,wind_mps,drag,miss_m\n")
for i in range(n):
    out.write(f"{i},{float(wind[i])!r},{float(drag[i])!r},{float(miss_m[i])!r}\n")
print(f"numpy {np.__version__}, sigma = {sigma:.1f} m", file=sys.stderr)
```

The `!r` writes each number with every digit needed to get the exact same float back, so the CSV captures the results bit for bit. And the Dockerfile pins everything it can:

```dockerfile
FROM python:3.12-slim@sha256:f77ac9e44ae96ef2c90b8053ea08c31f8be030f824196b0ae4db6d462c84e51f
WORKDIR /app
COPY requirements.lock .
RUN pip install --no-cache-dir --require-hashes -r requirements.lock
COPY mc.py .
USER 1000:1000
ENTRYPOINT ["python", "mc.py"]
```

::: example Hashing the output
Build it, run it twice, and fingerprint each output file with `sha256sum`:

```bash
docker build -t landing-mc:1.0.0 .
docker run --rm landing-mc:1.0.0 > run1.csv
docker run --rm landing-mc:1.0.0 > run2.csv
sha256sum run1.csv run2.csv
```

```text
numpy 2.2.6, sigma = 1842.7 m
numpy 2.2.6, sigma = 1842.7 m
1fa0aaa402a5f3e78dcc47e78f3826bf6c35fcdd91055b4885a3d5597429f625  run1.csv
1fa0aaa402a5f3e78dcc47e78f3826bf6c35fcdd91055b4885a3d5597429f625  run2.csv
```

The two hashes match, so the files are identical to the last bit. Check one row by hand. The first line of data is

```text
0,-2.3793674254736974,0.9021386092655288,-1287.9115320891258
```

The descent time is $600 \times 0.90214 = 541.28$ s, and the miss is $-2.3794 \times 541.28 \approx -1287.9$ m: a 2.4 m/s crosswind for nine minutes carries the capsule about 1.3 km. The spread of all 100 misses, $\sigma \approx 1843$ m, is about $3.0 \times 600 = 1800$ m, as expected for a wind spread of 3 m/s acting for about 600 s.

Then two deliberate changes. First, the lockfile regenerated for NumPy 2.5.3; second, the original NumPy 2.2.6 on a Python 3.13 base:

```text
numpy 2.5.3, sigma = 1842.7 m
1fa0aaa402a5f3e78dcc47e78f3826bf6c35fcdd91055b4885a3d5597429f625  runA.csv
numpy 2.2.6, sigma = 1842.7 m
1fa0aaa402a5f3e78dcc47e78f3826bf6c35fcdd91055b4885a3d5597429f625  runB.csv
```

The same hash, both times. Is that a contradiction of everything above? No. This program only draws random numbers and multiplies pairs of them. NumPy kept its random-number algorithm the same across these releases, and a single multiplication of two floats has exactly one correct answer under the floating-point standard. Nothing in it depends on the order of a long sum, on a math library, or on threads. A matching hash tells you the numbers did not change *for this program, this time*. It does not tell you the next NumPy upgrade is safe, and [[NumPy itself does not promise it|rng-stability]]. The only way to know is to rerun and compare, which is exactly what the pins make possible.
:::

The example used all three ingredients, and each is needed:

- **A pinned environment**: the image digest, with a lockfile inside it.
- **Seeded randomness**: `default_rng(seed=2026)`. Without a seed, NumPy picks one from the operating system, and every run differs.
- **Versioned inputs**: here the inputs were constants in the code, so git holds them. A real campaign reads wind models, mass properties and dispersion tables from files, and the exact version of each must be recorded.

Missing any one, the others cannot save you. And even with all three, some things can still move the last bits: compiler flags such as `-ffast-math` that let the compiler reorder arithmetic, parallel sums whose order depends on the number of threads, and running the same image on a different kind of processor. Record the thread count and the machine type with the results too.

::: key How a container makes a 2026 simulation reproducible in 2031
It pins the OS, compiler, libraries, interpreter and package versions as one addressable artefact. Combined with a seeded RNG and pinned input data, rerunning the digest reproduces the numbers, which is what a configuration-management or anomaly-investigation requirement demands.
:::

That key is also the answer you give an auditor. **[[Configuration management|config-management]]** asks: for this result, exactly which software produced it, and can you produce that software again? With digests, the answer is one line in the run's record, for example `image = registry.example/gnc/landing-mc@sha256:d71b…, seed = 2026, inputs = wind-model v4.2 (git 3f9c2ab)`, and a copy of that image in storage you control.

## Check yourself

::: check
Your CI file says `FROM python:3.12-slim`. A build on Monday passes; the same commit rebuilt on Thursday fails a regression test, and nobody touched the repository. Give a likely explanation and the change that prevents it.
:::

::: answer
The tag `python:3.12-slim` moved between Monday and Thursday. The maintainers rebuild it for Debian security fixes and Python patch releases, so Thursday's build started from different bytes: perhaps a new Python patch, a new system library, or even a new Debian release with a newer glibc. The fix is to pin the digest, `FROM python:3.12-slim@sha256:…`, so every build starts from the same image, and to change that digest only in a reviewed commit that reruns the tests.
:::

::: check
What is the difference between `landing-mc:1.0.0` and `landing-mc@sha256:d71b…`? Which of them can a colleague change by running `docker push`?
:::

::: answer
`landing-mc:1.0.0` is a tag: an entry in the registry's table that points at some image, and a push of another image under the same name changes where it points. `landing-mc@sha256:d71b…` is a digest: a hash of the image's content, so it can only ever refer to those exact bytes. A colleague can move the tag with `docker push`; nobody can make the digest point at different content, because different content has a different digest.
:::

::: check
An image is pinned by digest, and its Dockerfile contains `RUN pip install scipy`. The image is rebuilt from that Dockerfile a year later. Is the result the same image? What should the Dockerfile have used instead?
:::

::: answer
Almost certainly not. The digest pins only the base image. `pip install scipy` installs whatever SciPy version is newest on the day of the build, along with the newest versions of its dependencies, so a year later different packages land in the image and its digest changes. The Dockerfile should install from a lockfile with exact versions and hashes, `pip install --require-hashes -r requirements.lock`. Even then, the safest record is the built image's own digest, pushed to a registry you control and archived.
:::

::: check
A teammate says: "Our image is pinned by digest, so our Monte Carlo is reproducible." Name two more things that must also be true, and one thing that can still change the last digits even when everything is pinned.
:::

::: answer
Every random-number generator must be seeded explicitly, with the seed recorded; and the input data (wind models, mass properties, dispersion tables) must be versioned and the exact version recorded. Even with all of that, the last bits can move if the code is compiled with flags like `-ffast-math`, if parallel reductions add numbers in an order that depends on the thread count, or if the same image runs on a different processor type. Recording the thread count and machine with the results helps catch that.
:::

::: check
Your team's image `landing-mc:1.0.0` has to be rerun for an investigation in 2031. List what you would archive in 2026 so that it can be.
:::

::: answer
The image digest, written into the results record; a copy of the image itself in a registry the organisation controls, and for critical runs a `docker save` file stored with the results; the Dockerfile and lockfile in git at a tagged commit, so the environment can be explained and inspected; the seeds; the exact versions of all input data; and the run settings that can affect bit-exactness, such as the thread count and machine type. With those, rerunning the digest with the same seeds and inputs reproduces the numbers.
:::

## Summary

| Idea | Meaning | Example |
| --- | --- | --- |
| Registry | Server that stores images | Docker Hub, `ghcr.io`, ECR, `registry:2` |
| Reference | registry / repository : tag @ digest | `ghcr.io/gnc-team/landing-mc:1.0.0` |
| Tag | Movable name for an image | `3.12-slim`, `latest`, `1.0.0` |
| `latest` | Default tag; just a name | Never in pipelines |
| Digest | SHA-256 of the image content; cannot move | `@sha256:f77ac9e4…` |
| Image index | One digest covering several platforms | Pin this in `FROM` |
| Lockfile | Every package at one version, with hashes | `pip install --require-hashes -r requirements.lock` |
| Reproducible run | Digest + seeds + versioned inputs | Plus thread count and machine type |

Pinning the environment makes a result rerunnable; the next lesson uses the same pinned images to make a new teammate productive on day one with Dev Containers, and introduces Kubernetes, which runs images like these by the hundred.

::: context reference-parts Reading an image name
Every image reference has the same parts, and Docker fills in whatever you leave out.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="30" width="80" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="50" y="50" font-size="12" text-anchor="middle" fill="#1f2a44">docker.io</text>
  <rect x="94" y="30" width="126" height="30" fill="#ffffff" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="157" y="50" font-size="12" text-anchor="middle" fill="#1f2a44">library/python</text>
  <rect x="224" y="30" width="62" height="30" fill="#f2b880" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="255" y="50" font-size="12" text-anchor="middle" fill="#1f2a44">:3.12-slim</text>
  <rect x="290" y="30" width="60" height="30" fill="#b4232c" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="320" y="50" font-size="12" text-anchor="middle" fill="#ffffff">@sha256:</text>
  <text x="50" y="80" font-size="11" text-anchor="middle" fill="#1f2a44">registry</text>
  <text x="157" y="80" font-size="11" text-anchor="middle" fill="#1f2a44">repository</text>
  <text x="255" y="80" font-size="11" text-anchor="middle" fill="#1f2a44">tag</text>
  <text x="320" y="80" font-size="11" text-anchor="middle" fill="#1f2a44">digest</text>
  <text x="255" y="112" font-size="11" text-anchor="middle" fill="#6c7a93">can move</text>
  <text x="320" y="130" font-size="11" text-anchor="middle" fill="#b4232c">cannot move</text>
  <text x="104" y="112" font-size="11" text-anchor="middle" fill="#6c7a93">filled in if you omit them</text>
</svg>
```

Typing `python:3.12-slim` really means `docker.io/library/python:3.12-slim`, with no digest, so Docker uses whatever the tag points at.
:::

::: context semver Numbers that carry a promise
Semantic versioning writes a version as MAJOR.MINOR.PATCH, like 1.4.2. Bump PATCH for a bug fix that changes nothing else, MINOR for a new feature that keeps old uses working, and MAJOR for a change that can break people who depended on the old behaviour. For a simulation image, a sensible team rule is that any change that can move numerical results is at least a MINOR bump, and is written in the release notes.
:::

::: context index-manifest One name, several computers
A multi-platform image is a small tree of documents, each named by its own digest. The index lists one manifest per platform; each manifest lists that platform's configuration and layers.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <rect x="110" y="10" width="140" height="32" fill="#b4232c" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="180" y="30" font-size="12" text-anchor="middle" fill="#ffffff">index f77ac9e4…</text>
  <line x1="150" y1="42" x2="80" y2="76" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="210" y1="42" x2="280" y2="76" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="10" y="76" width="140" height="32" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="80" y="96" font-size="11" text-anchor="middle" fill="#1f2a44">linux/amd64 44ff437b…</text>
  <rect x="210" y="76" width="140" height="32" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="280" y="96" font-size="11" text-anchor="middle" fill="#1f2a44">other platforms …</text>
  <line x1="50" y1="108" x2="40" y2="136" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="80" y1="108" x2="90" y2="136" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="110" y1="108" x2="140" y2="136" stroke="#1f2a44" stroke-width="1.2"/>
  <rect x="14" y="136" width="52" height="26" fill="#ffffff" stroke="#1f2a44" stroke-width="1"/>
  <text x="40" y="153" font-size="11" text-anchor="middle" fill="#1f2a44">config</text>
  <rect x="68" y="136" width="44" height="26" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <text x="90" y="153" font-size="11" text-anchor="middle" fill="#1f2a44">layer</text>
  <rect x="118" y="136" width="44" height="26" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <text x="140" y="153" font-size="11" text-anchor="middle" fill="#1f2a44">layer</text>
</svg>
```

Because each level names the next by digest, fixing the top digest fixes everything under it.
:::

::: context update-bots Letting a robot propose the update
Tools such as Renovate and GitHub's Dependabot watch the images and packages your repository pins. When a newer version appears, they open a pull request that changes the digest or version. Your CI then runs the full test suite on the proposed change, and a human decides whether to merge. The pin stays strict, and updates still happen, but each one is reviewed and recorded.
:::

::: context hash-check What the hash protects against
The hash in a lockfile guards against more than accidents. If a package file on the index were ever replaced, by a mistake or by an attacker who took over an account, its hash would no longer match and the build would stop instead of quietly installing it. Attacks on the software supply chain, where the target is a library everyone installs rather than the final program, are a real and growing concern for flight software teams.
:::

::: context rng-stability What NumPy promises about random numbers
NumPy's newer random API, `default_rng`, uses a generator called PCG64. NumPy's documented policy is that the older `RandomState` interface keeps producing the same stream forever, but the newer `Generator` interface may change its algorithms between releases to fix bugs or improve them. So the same seed is not promised to give the same numbers after an upgrade, even if it happened to in this lesson's test. Pinning the NumPy version, as the lockfile does, is what actually protects you.
:::

::: context config-management Configuration management in plain words
Configuration management is the engineering discipline of knowing exactly what you built and tested, and being able to reproduce it. Each controlled thing, such as a software build, a document or a data set, is a configuration item with an identity and a version, and a set of approved versions is a baseline. NASA's software engineering requirements, and the quality standards aerospace suppliers work under, require it for flight and safety-related software. An image digest is a strong identity for a software configuration item: it cannot drift, and anyone can check it.
:::
