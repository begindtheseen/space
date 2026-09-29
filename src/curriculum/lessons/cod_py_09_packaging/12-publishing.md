---
id: l12-publishing
title: Publishing to PyPI and to private indexes
minutes: 24
covers:
  - Publishing internally versus on PyPI; private indexes
---

Think about two ways to share a book you wrote. You can publish it: it goes to bookstores and public libraries, anyone in the world can read it, and once it is printed you can never un-print it. Or you can put copies on the shelf in your company's own library, where only people with a badge can walk in. Same book, very different decision. Which one is right depends on who should read it, and on what it says.

A Python package is shared the same two ways. The **Python Package Index**, **PyPI** (say "pie-pee-eye"), is the public library: when you type `pip install numpy`, this is where it comes from, and anything you upload there is readable by anyone, forever. A **private index** is the company shelf: a server that speaks the same language as PyPI but only answers people inside your organization.

Most GNC code lives on the private shelf. A guidance library tuned for one vehicle, a thrust curve, the aerodynamic tables of a real rocket — these can be company secrets, and some of them are **[[export-controlled|export-control]]**, meaning the law limits who may receive them. Open-source tools, like a general orbit-propagation library, may belong on PyPI. This lesson shows what an index really is, how to build and upload a release, how to run a private index yourself, and the one attack that catches teams who mix the two.

## What a package index really is

An index sounds grand. It is a very simple website. The standard it follows, the **[[simple repository API|simple-api]]**, says an index needs one page per project, at an address ending in `/simple/<project-name>/`, and that page lists links to the project's files. That is all pip needs.

When you run `pip install gnc-toolkit`, pip does three things:

1. It fetches `https://pypi.org/simple/gnc-toolkit/`, the project's page.
2. It reads the links on it — wheels and sdists, one per version and platform — and picks the best file for your Python and your computer, as the wheels lesson described.
3. It downloads that file, checks its hash if one is given, and installs it.

Project names are **normalized** before they go in the address, so that people who type the name slightly differently still reach the same project. The rule: make it lowercase, and replace every run of `-`, `_` and `.` with a single `-`.

```python
import re


def normalize(name):
    return re.sub(r"[-_.]+", "-", name).lower()


for n in ["GNC_Toolkit", "gnc.toolkit", "gnc--toolkit", "gnc-toolkit"]:
    print(f"{n!r:16} -> {normalize(n)}")
# 'GNC_Toolkit'    -> gnc-toolkit
# 'gnc.toolkit'    -> gnc-toolkit
# 'gnc--toolkit'   -> gnc-toolkit
# 'gnc-toolkit'    -> gnc-toolkit
```

All four names mean the same project, and an index treats them as one. (The file names inside use an underscore instead, as in `gnc_toolkit-0.1.0-py3-none-any.whl`, because the dash separates fields in a wheel's file name.)

PyPI also answers the same question as data instead of a web page, if asked politely. Here is the real reply for the small `six` package, trimmed:

```text
$ curl -s -H "Accept: application/vnd.pypi.simple.v1+json" https://pypi.org/simple/six/
{"meta": {"api-version": "1.4", ...}, "name": "six",
 "files": [ ... 48 files ...,
   {"filename": "six-1.17.0.tar.gz",
    "hashes": {"sha256": "ff70335d468e7eb6ec65b95b99d3a2836546063f63acc5171de367e834932a81"}, ...}]}
```

Every file comes with its SHA-256 hash. Those are the hashes that lockfiles copy, as in the version-pinning and environment lessons.

::: key What an index is
A package index is a web server with one page per project at `/simple/<normalized-name>/`, listing links to that project's wheels and sdists with their hashes. PyPI is the public one. A private index serves the same pages to your organization only, so pip and uv work with it unchanged.
:::

## Build once, check, then ship

Before anything is uploaded, build the release files and inspect them. From the project folder:

```text
$ python -m build
* Creating isolated environment: venv+pip...
* Installing packages in isolated environment:
  - hatchling
...
Successfully built gnc_toolkit-0.1.0.tar.gz and gnc_toolkit-0.1.0-py3-none-any.whl
$ ls -l dist
2770 gnc_toolkit-0.1.0-py3-none-any.whl
3045 gnc_toolkit-0.1.0.tar.gz
```

`python -m build` asks the build backend from `[build-system]` for both a wheel and an sdist, in a clean temporary environment, and puts them in `dist/`. Then check them with **twine**, the standard upload tool:

```text
$ python -m pip install twine
$ twine check dist/*
Checking dist/gnc_toolkit-0.1.0-py3-none-any.whl: PASSED
Checking dist/gnc_toolkit-0.1.0.tar.gz: PASSED
```

`twine check` makes sure the metadata is complete and that the long description — your README, which becomes the project's front page on the index — will render properly. It is cheap, so run it every time.

Here is the rule that matters most: **build once, and ship the files you tested**. The CI job that builds the wheel should install that very file into a fresh environment, run the tests from outside the source tree (as in the src-layout and editable-installs lessons), and then upload those same files. Rebuilding on another machine "for the upload" gives you files nobody tested.

## A private index in two minutes

Because an index is only a website with the right folder shape, you can make one with nothing but Python's built-in web server. Make a folder `simple/`, one subfolder per normalized project name, and drop the files in:

```text
internal/
    simple/
        gnc-toolkit/
            gnc_toolkit-0.1.0-py3-none-any.whl
            gnc_toolkit-0.1.0.tar.gz
        numpy/
            numpy-2.3.3-cp311-cp311-manylinux_2_27_x86_64.manylinux_2_28_x86_64.whl
```

The NumPy wheel is there because `gnc-toolkit` depends on NumPy, and this index is going to be the *only* place pip looks. It was fetched once with `pip download --no-deps "numpy==2.3.3" -d internal/simple/numpy`. Copying the public packages you depend on into your own index is called **mirroring**.

::: example Installing from your own index
Serve the folder and install from it into a fresh environment, telling pip to use this index instead of PyPI:

```text
$ cd internal && python3 -m http.server 8765 &
$ python3 -m venv user
$ user/bin/pip install --index-url http://localhost:8765/simple/ gnc-toolkit
Looking in indexes: http://localhost:8765/simple/
Collecting gnc-toolkit
  Downloading http://localhost:8765/simple/gnc-toolkit/gnc_toolkit-0.1.0-py3-none-any.whl (2.8 kB)
Collecting numpy>=1.24 (from gnc-toolkit)
  Downloading http://localhost:8765/simple/numpy/numpy-2.3.3-cp311-cp311-manylinux_2_27_x86_64.manylinux_2_28_x86_64.whl (16.9 MB)
Installing collected packages: numpy, gnc-toolkit
Successfully installed gnc-toolkit-0.1.0 numpy-2.3.3
$ user/bin/gnc-orbit 400
speed    7668.6 m/s
period     92.6 min
```

The web server's log shows exactly what pip asked for:

```text
"GET /simple/gnc-toolkit/ HTTP/1.1" 200 -
"GET /simple/gnc-toolkit/gnc_toolkit-0.1.0-py3-none-any.whl HTTP/1.1" 200 -
"GET /simple/numpy/ HTTP/1.1" 200 -
"GET /simple/numpy/numpy-2.3.3-cp311-...whl HTTP/1.1" 200 -
```

**Step 1.** pip asked for the project page, `/simple/gnc-toolkit/`. Python's server answered with a folder listing — a page of links, which is all the standard requires.

**Step 2.** pip preferred the wheel over the sdist and downloaded it.

**Step 3.** The wheel's metadata said `numpy>=1.24`, so pip asked the same index for NumPy's page and took the one wheel it found.

**Sanity check.** No request went to PyPI at all, and the entry point from the entry-points lesson works: $7668.6\,\mathrm{m/s}$ and $92.6$ minutes at $400\,\mathrm{km}$, as before. With no network, `pip install --no-index --find-links internal/simple/gnc-toolkit --find-links internal/simple/numpy gnc-toolkit` does the same from the folders directly — the way a machine in a closed lab installs packages.
:::

A folder behind a web server is fine for a lab. A team needs more: uploads with passwords, many users, and a copy of PyPI kept up to date. The common choices:

- **pypiserver** or **devpi**: small open-source index servers you run yourself. devpi can also cache PyPI and stage releases.
- **Artifactory** or **Nexus**: company-wide artifact stores that also hold container images and other languages' packages.
- **Cloud registries**: AWS CodeArtifact, Google Artifact Registry, Azure Artifacts, and the GitLab package registry all speak the same index protocol.

To point every install at your index without typing the address each time, set it once in pip's configuration file (`pip.conf`, or `pip.ini` on Windows) or in the environment variable `PIP_INDEX_URL`. For uv, the equivalent lives in `pyproject.toml` or `uv.toml`. Keep passwords out of these files and out of any requirements file you commit; use a credential helper such as **keyring**, or a token that CI injects at run time.

## Uploading, and why a release is forever

**twine** uploads with one command. Here it uploads to a pypiserver running on this machine, which accepts uploads the way PyPI does:

::: example An upload, and a second upload that fails
```text
$ twine upload --repository-url http://localhost:8795/ dist/*
Uploading distributions to http://localhost:8795/
Uploading gnc_toolkit-0.1.0-py3-none-any.whl
100% ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 5.0/5.0 kB
Uploading gnc_toolkit-0.1.0.tar.gz
100% ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 5.3/5.3 kB
```

Now fix a typo in the README, rebuild, and try to upload version 0.1.0 again:

```text
$ twine upload --repository-url http://localhost:8795/ dist/*.whl
Uploading gnc_toolkit-0.1.0-py3-none-any.whl
WARNING  Error during upload. Retry with the --verbose option for more details.
ERROR    HTTPError: 400 Bad Request from http://localhost:8795/
```

**Step 1.** The first upload stored both files under their exact file names.

**Step 2.** The second upload used a file name that already existed. The server refused to replace it.

**Step 3.** The only way forward is a new version, `0.1.1`, even for a README typo.

**Sanity check.** Refusing is the right behavior. If a server let `gnc_toolkit-0.1.0-py3-none-any.whl` change, every lockfile holding its hash would suddenly fail, and anyone without a lockfile would get different code under the same version number. PyPI is stricter still: a file name can never be used again, even if you delete the release.
:::

What if you publish something broken? You cannot replace it, but you can **[[yank|yanking]]** it: mark the release so installers skip it unless someone asked for exactly that version with `==`. Nothing that pinned it breaks, and nobody new gets it by accident. Then publish a fixed version with the right version bump from the semantic-versioning lesson.

## Publishing on PyPI

Uploading to the public index works the same way, with twine pointed at PyPI's upload address (its default). A few things are different because the audience is the whole world.

- **Accounts and tokens.** You need a PyPI account with two-factor authentication, which PyPI requires of everyone. Upload with an **API token**, a long secret starting with `pypi-` that can be limited to one project, never with your password. twine takes the user name `__token__` and the token as the password.
- **Rehearse on TestPyPI.** **[[TestPyPI|testpypi]]** is a separate copy of PyPI for practice. `twine upload --repository testpypi dist/*` sends your files there, and you can install from it to check that the front page and the install work before anything goes public.
- **Better: no stored secret at all.** With **[[Trusted Publishing|trusted-publishing]]**, you tell PyPI "uploads for this project may come from this CI workflow in this repository". The CI job then proves who it is to PyPI and receives a short-lived token for that one upload. There is no long-lived secret to leak.
- **The name is first come, first served.** Check that your name is free on PyPI before you announce it.

And a guard against the worst mistake. If a package must never go public, add this line to the classifiers in `[project]`:

```toml
classifiers = ["Private :: Do Not Upload"]
```

PyPI rejects any upload carrying a classifier that starts with `Private ::`. If someone runs `twine upload` against the wrong index, the upload fails instead of publishing your vehicle's aerodynamics to the world.

::: warning Public means public, forever
Anything uploaded to PyPI is copied within minutes by mirrors and archives that you do not control. Deleting a release later does not un-publish it. Before any upload, check that the package holds no credentials, no customer or vehicle data, and nothing export-controlled. When in doubt, it goes on the internal index, and someone whose job it is decides.
:::

## When two indexes disagree: dependency confusion

The natural setup for a team is "our private packages come from our index, everything else from PyPI". pip even has a flag for it: `--extra-index-url`. It is a trap.

pip treats all indexes as equal. It collects every candidate version of a name from all of them and picks the highest. So if a stranger uploads a package to PyPI with the same *name* as your private one and a bigger version number, pip installs the stranger's. This attack is called **[[dependency confusion|dependency-confusion]]**.

::: example Watching pip pick the wrong package
Set up two local indexes. The "internal" one, on port 8775, serves the real `gnc-toolkit` 0.1.0. A "public" one, on port 8776, serves a harmless impostor named `gnc-toolkit`, version 99.0.0, whose only code prints a message. Install the way many teams do:

```text
$ dc/bin/pip install --index-url http://localhost:8775/simple/ \
      --extra-index-url http://localhost:8776/simple/ gnc-toolkit
Looking in indexes: http://localhost:8775/simple/, http://localhost:8776/simple/
Collecting gnc-toolkit
  Downloading http://localhost:8776/simple/gnc-toolkit/gnc_toolkit-99.0.0-py2.py3-none-any.whl (962 bytes)
Successfully installed gnc-toolkit-99.0.0
$ dc/bin/python -c "import gnc"
imposter gnc-toolkit 99.0.0 loaded
```

**Step 1.** pip read both indexes' pages for `gnc-toolkit`: version 0.1.0 from one, 99.0.0 from the other.

**Step 2.** It picked the highest version, $99.0.0 > 0.1.0$, without caring which index it came from.

**Step 3.** Importing the package ran the impostor's code. A real attacker's code would run with your permissions, on your laptop and in your CI.

**Sanity check.** uv, by default, stops at the first index that has the name at all — its `first-index` strategy — and it searches extra indexes *before* the default one. With the internal index as the extra, uv installed `gnc-toolkit==0.1.0`. Asking uv to behave like pip, with `--index-strategy unsafe-best-match`, installed 99.0.0. The flag's name is the warning.
:::

The defenses, strongest first:

1. **One index URL.** Point every install at a single internal index that serves your packages and [[proxies PyPI|proxy-index]] for the rest, and that refuses to fetch any public package whose name matches an internal one. Artifactory, Nexus, devpi and the cloud registries can all do this.
2. **Pin names to an index.** uv lets you say, in `pyproject.toml`, that a given package may come only from a named index.
3. **Lock with hashes.** A lockfile holding `gnc-toolkit==0.1.0` and its hash cannot be satisfied by any other file, from any index.
4. **Hold the name.** Some companies also register their internal package names on PyPI as empty placeholders, so nobody else can.

## Internal or public: deciding

| Question | Internal index | PyPI |
|---|---|---|
| Who can install it? | people and machines you authorize | anyone on Earth |
| Can it hold vehicle data or controlled technology? | yes, with access control | never |
| Who approves a release? | your team and its process | you, and the whole world sees it |
| Needed for | proprietary GNC code, sim models, internal tools | open-source libraries meant for everyone |
| Danger to watch | dependency confusion when mixed with PyPI | leaks that cannot be undone |

Whichever index you use, a release follows the same checklist, drawing on the whole module: decide the version bump from the diff; write the changelog entry; tag the commit; build the wheel and sdist once; install that wheel into a fresh environment and run the tests from outside the source tree; `twine check`; upload those same files; and check that the docs site for the new version is up.

::: key Publishing checklist
Build once with `python -m build`, check with `twine check`, test the built wheel in a fresh environment, then upload those exact files. A released file name is permanent: fix mistakes by yanking and releasing a new version. Point installs at one index; `--extra-index-url` invites dependency confusion.
:::

## Check yourself

::: check
A colleague's package is named `Traj.Tools` in its `pyproject.toml`. At what address on your private index will pip look for it, and what is the start of its wheel's file name?
:::

::: answer
Normalize the name: lowercase gives `traj.tools`, and the run `.` becomes `-`, so pip fetches `/simple/traj-tools/`. The wheel's file name uses an underscore in place of the dash (the dash separates the fields of a wheel name), so it starts `traj_tools-` followed by the version, as in `traj_tools-1.2.0-py3-none-any.whl`.
:::

::: check
You uploaded `gnc-toolkit` 1.4.0 to your internal index, and an hour later found that the wheel is missing a data file. Your manager says "delete it and upload the fixed file as 1.4.0 again." Why is that a bad idea, and what do you do instead?
:::

::: answer
Anyone who installed 1.4.0 in that hour — or recorded its hash in a lockfile — now has a different file under the same name and version. Their installs either fail the hash check or quietly differ from a colleague's, and "which 1.4.0 did you run?" becomes unanswerable. Many indexes, PyPI included, refuse to reuse a file name anyway. Instead, yank 1.4.0 so new installs skip it, fix the packaging, add a test that checks the data file is in the built wheel, and release 1.4.1 as a bug-fix bump.
:::

::: check
Your CI installs with `pip install --index-url https://pypi.org/simple/ --extra-index-url https://pkgs.internal.example/simple/ -r requirements.txt`, and `requirements.txt` lists `gnc-toolkit>=0.1`. Explain the risk and give two fixes.
:::

::: answer
pip gathers `gnc-toolkit` candidates from both indexes and installs the highest version. If anybody uploads a package named `gnc-toolkit` with a higher version to PyPI, CI installs and runs it — dependency confusion. Fixes: use a single index URL pointing at an internal proxy that serves internal packages and proxies PyPI while blocking public packages with internal names; and install from a lockfile with exact pins and hashes (`--require-hashes`), so only the known file can satisfy the requirement. uv's first-index behavior or its per-package index pinning is a third option.
:::

::: check
What does the classifier `Private :: Do Not Upload` protect against, and what does it not protect against?
:::

::: answer
It protects against an accidental upload to PyPI: PyPI rejects any upload with a classifier beginning `Private ::`, so a mistyped command or wrong default index fails instead of publishing. It does not stop an upload to some other public index that does not check classifiers, it does not control who can read your internal index, and it does not help if someone removes the line. It is a seat belt, not a lock.
:::

::: check
A lab computer has no internet connection. You have a USB stick holding a folder of wheels, including `gnc-toolkit` and all its dependencies. Write the install command, and explain why the folder must hold the dependencies too.
:::

::: answer
`pip install --no-index --find-links /media/usb/wheels gnc-toolkit`. `--no-index` tells pip not to contact any index at all, and `--find-links` tells it to look for files in that folder. pip still has to satisfy every requirement in the wheel's metadata, such as `numpy>=1.24`, and with no index the folder is the only source. If NumPy's wheel for this platform and Python is missing, the install fails. `pip download gnc-toolkit -d wheels` on a connected machine of the same platform collects the whole set.
:::

## Summary

| Idea | What it is | Fact to remember |
|---|---|---|
| Package index | website with one page per project | `/simple/<normalized-name>/`, links plus hashes |
| Name normalization | lowercase, runs of `-_.` become `-` | `GNC_Toolkit` and `gnc.toolkit` are `gnc-toolkit` |
| `python -m build` / `twine check` | build and inspect release files | build once; ship the files you tested |
| `twine upload` | sends files to an index | a file name, once released, is permanent |
| Yank | hide a release from new installs | `==` pins still get it |
| PyPI | the public index | 2FA, scoped tokens, TestPyPI, Trusted Publishing |
| Private index | same protocol, access controlled | folder + web server, pypiserver, devpi, Artifactory, cloud registries |
| Dependency confusion | public package shadows an internal name | one proxy index, pinned index, hashed lockfile |

That completes the module and the Python sequence: you can now take a folder of scripts to a documented, versioned, tested package that installs identically on a colleague's laptop, in CI and in a container, from the right index. The coding track moves on to C++, where the same questions — build systems, binary interfaces, versioned libraries — come back with fewer guard rails.

::: context export-control Laws about who may receive technical data
In the United States, two sets of rules govern aerospace technology. ITAR, the International Traffic in Arms Regulations, covers items and technical data on the U.S. Munitions List, which includes many launch vehicle and missile technologies. EAR, the Export Administration Regulations, covers a wider range of commercial and dual-use items. Under both, putting controlled technical data where a foreign person can read it can count as an export, and uploading it to a public website does exactly that. Other countries have similar rules. This is why aerospace companies keep most code on internal servers and have a formal review before anything is released as open source.
:::

::: context simple-api A standard that is only a page of links
The simple repository API was written down in PEP 503 in 2015, describing what PyPI had already been doing for years: plain HTML pages of links. Later proposals added hashes in the link fragments, a way to mark files that need a particular Python version, a JSON form of the same pages (PEP 691) and yanking (PEP 592). Because the core is only "a page of links per project", a folder served by any web server is a valid index, which is why so many private index products exist.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="12" width="120" height="30" rx="5" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="70" y="32" font-size="12" text-anchor="middle" fill="#1f2a44">/simple/</text>
  <line x1="70" y1="42" x2="70" y2="62" stroke="#1f2a44"/>
  <rect x="10" y="62" width="120" height="30" rx="5" fill="#fff" stroke="#1f2a44"/>
  <text x="70" y="82" font-size="12" text-anchor="middle" fill="#1f2a44">gnc-toolkit/</text>
  <line x1="130" y1="77" x2="170" y2="77" stroke="#1f2a44"/>
  <line x1="170" y1="60" x2="170" y2="130" stroke="#1f2a44"/>
  <line x1="170" y1="60" x2="185" y2="60" stroke="#1f2a44"/>
  <line x1="170" y1="95" x2="185" y2="95" stroke="#1f2a44"/>
  <line x1="170" y1="130" x2="185" y2="130" stroke="#1f2a44"/>
  <text x="190" y="64" font-size="11" fill="#1f2a44">…0.1.0-py3-none-any.whl</text>
  <text x="190" y="99" font-size="11" fill="#1f2a44">…0.1.0.tar.gz</text>
  <text x="190" y="134" font-size="11" fill="#6c7a93">each link + #sha256=…</text>
  <text x="10" y="120" font-size="11" fill="#6c7a93">one page per project</text>
</svg>
```
:::

::: context yanking Hiding a release without breaking anyone
Yanking, defined in PEP 592, marks a release on the index without deleting it. An installer choosing a version for `gnc-toolkit>=1.3` skips yanked releases. But a requirement that pins exactly, `gnc-toolkit==1.4.0`, still gets it, so existing lockfiles keep working. The index can also show a reason, like "missing data file, use 1.4.1". Deleting would break every pinned user; yanking only steers new ones away.
:::

::: context testpypi A practice copy of the public index
TestPyPI, at test.pypi.org, runs the same software as PyPI but with a separate database: you need a separate account, and packages there may be deleted from time to time. It exists so you can try an upload, see how your README renders as the project page, and test `pip install --index-url https://test.pypi.org/simple/ gnc-toolkit` before your first real release. Dependencies usually are not on TestPyPI, so add `--extra-index-url https://pypi.org/simple/` for them — the one place that flag is fine, because nothing there is secret.
:::

::: context trusted-publishing Uploading with no password to steal
Trusted Publishing, launched by PyPI in 2023, uses a standard called OpenID Connect. The CI system — GitHub Actions, GitLab CI/CD and a few others are supported — signs a short statement saying "this job runs workflow X in repository Y". You register that repository and workflow with your PyPI project once. At upload time PyPI checks the signature and hands the job a token valid for about fifteen minutes. There is no long-lived token sitting in CI settings for an attacker to copy.
:::

::: context dependency-confusion The attack that hit big companies in 2021
In February 2021 the security researcher Alex Birsan published how he had run code inside dozens of large companies, including Apple, Microsoft and PayPal. He found names of internal packages in public places, such as a leaked `package.json` or a requirements file, then uploaded packages with those names and high version numbers to public indexes like npm and PyPI. Build machines that searched both internal and public indexes installed his versions. His packages only reported back that they had run, and he was paid through the companies' bug-bounty programs. The fix everywhere was the same: one trusted source per package name.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="14" width="140" height="44" rx="6" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="80" y="33" font-size="12" text-anchor="middle" fill="#1f2a44">internal index</text>
  <text x="80" y="50" font-size="11" text-anchor="middle" fill="#1f2a44">gnc-toolkit 0.1.0</text>
  <rect x="10" y="90" width="140" height="44" rx="6" fill="#f2b880" stroke="#1f2a44"/>
  <text x="80" y="109" font-size="12" text-anchor="middle" fill="#1f2a44">public index</text>
  <text x="80" y="126" font-size="11" text-anchor="middle" fill="#b4232c">gnc-toolkit 99.0.0</text>
  <rect x="240" y="52" width="110" height="44" rx="6" fill="#fff" stroke="#1f2a44"/>
  <text x="295" y="71" font-size="12" text-anchor="middle" fill="#1f2a44">pip</text>
  <text x="295" y="88" font-size="11" text-anchor="middle" fill="#1f2a44">takes highest</text>
  <line x1="150" y1="40" x2="238" y2="66" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <line x1="150" y1="112" x2="238" y2="84" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="238,78 248,82 237,90" fill="#b4232c"/>
</svg>
```
:::

::: context proxy-index One front door for every package
A proxy index sits between your machines and PyPI. When pip asks it for a public package such as NumPy, it fetches the files from PyPI once, keeps a copy, and serves that copy to everyone after. When pip asks for an internal name, it answers only from the internal store and never looks outside. So every machine has exactly one index URL, public packages keep flowing, the cache keeps working if PyPI is slow or down, and a stranger's upload cannot take the place of an internal package.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="53" width="80" height="44" rx="6" fill="#fff" stroke="#1f2a44"/>
  <text x="50" y="80" font-size="12" text-anchor="middle" fill="#1f2a44">pip / uv</text>
  <line x1="90" y1="75" x2="128" y2="75" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="128,70 138,75 128,80" fill="#1f2a44"/>
  <rect x="140" y="45" width="100" height="60" rx="6" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="190" y="72" font-size="12" text-anchor="middle" fill="#1f2a44">proxy index</text>
  <text x="190" y="89" font-size="11" text-anchor="middle" fill="#1f2a44">one URL</text>
  <line x1="240" y1="62" x2="270" y2="35" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="240" y1="88" x2="270" y2="115" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="272" y="14" width="80" height="36" rx="6" fill="#fff" stroke="#1f2a44"/>
  <text x="312" y="36" font-size="11" text-anchor="middle" fill="#1f2a44">internal store</text>
  <rect x="272" y="100" width="80" height="36" rx="6" fill="#fff" stroke="#1f2a44"/>
  <text x="312" y="122" font-size="11" text-anchor="middle" fill="#1f2a44">PyPI (cached)</text>
  <text x="190" y="140" font-size="11" text-anchor="middle" fill="#6c7a93">internal names never fetched from PyPI</text>
</svg>
```
:::
