---
id: l11-packages-and-building-from-source
title: Packages, and building from source
minutes: 21
covers:
  - Package management (apt/dnf) and building from source
---

There are two ways to get bread. You can buy a loaf at the store: it comes in a labeled bag, the store knows exactly what it sold you, and it will take it back. Or you can bake it yourself from a recipe: you choose every ingredient and the oven temperature, but nobody else keeps a record of what went in.

Software on Linux arrives the same two ways. A **package manager** is the store. It installs ready-made programs, tracks every file it put on the machine, and can upgrade or remove them later. **Building from source** is baking: you download the program's source code and compile it yourself, usually with the three-step `configure`–`make`–`make install` recipe that almost every piece of scientific software still ships with.

On a shared simulation machine you need both skills, and one rule that keeps them from fighting: *who owns which directory*. The package manager owns `/usr/bin` and `/usr/lib` and will overwrite anything it finds there. Software you build belongs in `/usr/local` — or, on a cluster where you are not the administrator (most of them), in a folder inside your home directory. Keeping those apart is the difference between a machine that can be upgraded and one that cannot.

The transcripts come from Ubuntu 24.04 with apt 2.8.3, dpkg 1.22.6, GNU Make 4.3 and gcc 13.3. Ubuntu belongs to the Debian family, so every `apt` and `dpkg` transcript is real. The **[[RPM-family|rpm-family]]** equivalents (`dnf`, `rpm`) are named for translation only; none are installed here:

```bash
command -v dnf yum rpm || echo "(no rpm-family tools on this machine)"
```

```text
(no rpm-family tools on this machine)
```

## Two layers: `dpkg` and `apt`

A **package** is one archive file holding a program's files plus a label: its name, version, and the other packages it needs. Debian-family systems use two tools in layers.

- **`dpkg`** installs, removes and queries *one package file*. It knows nothing about where packages come from.
- **`apt`** sits on top. It knows the **[[repositories|repository]]** — the online warehouses of packages — works out what else each package needs, downloads everything, and calls `dpkg` to do the installing.

Use `apt` to install. Use `dpkg` to ask questions about what is already installed.

```bash
apt-cache policy tmux
```

```text
tmux:
  Installed: 3.4-1ubuntu0.1
  Candidate: 3.4-1ubuntu0.1
  Version table:
 *** 3.4-1ubuntu0.1 500
        500 http://archive.ubuntu.com/ubuntu noble-updates/main amd64 Packages
        100 /var/lib/dpkg/status
     3.4-1build1 500
        500 http://archive.ubuntu.com/ubuntu noble/main amd64 Packages
```

That output answers three questions at once. What is installed (`Installed:`). What `apt install` would give you right now — the **candidate**. And every version any configured repository offers, each with a **[[priority number|pin-priority]]**. The `***` marks the installed one. When a colleague says "it works on my machine", this is the command that tells you whether you have the same build.

The everyday commands:

| Task | Debian family | RPM family |
| --- | --- | --- |
| refresh the package index | `apt update` | `dnf check-update` |
| install | `apt install NAME` | `dnf install NAME` |
| remove | `apt remove NAME` | `dnf remove NAME` |
| upgrade everything | `apt upgrade` | `dnf upgrade` |
| search | `apt search TEXT` | `dnf search TEXT` |
| show details | `apt show NAME` | `dnf info NAME` |
| which package owns this file | `dpkg -S /path` | `rpm -qf /path` |
| what files does it own | `dpkg -L NAME` | `rpm -ql NAME` |
| is it installed, and which version | `dpkg -l NAME` | `rpm -q NAME` |

Two of these are easy to mix up. `apt update` refreshes the **index** — the store's catalog of what exists — and installs nothing. `apt upgrade` installs newer versions. Running `install` without a recent `update` is the most common cause of `E: Version ... not found`: your catalog is stale, and the version it names has been replaced on the server.

Two queries you will use all the time. Which package owns a file:

```bash
dpkg -S /usr/bin/rsync
```

```text
rsync: /usr/bin/rsync
```

And what a package put on the machine. Here `grep bin` keeps only the lines containing "bin":

```bash
dpkg -L rsync | grep bin
```

```text
/usr/bin
/usr/bin/rrsync
/usr/bin/rsync
/usr/bin/rsync-ssl
```

That pair answers "where did this binary come from, and did its package install anything else I should know about?" — the first question to ask when a tool behaves differently from its documentation.

::: warning apt is for people; apt-get is for scripts
`apt` is the friendly front end, and it says so when you use it in a script:

```bash
apt list --installed | head -3
```

```text

WARNING: apt does not have a stable CLI interface. Use with caution in scripts.

Listing...
adduser/noble,now 3.137ubuntu1 all [installed]
adwaita-icon-theme/noble,now 46.0-1 all [installed]
```

The warning appears only when the output is not going to a terminal — exactly the case in a setup script — and it lands in the middle of whatever you were parsing. In scripts, use `apt-get` and `apt-cache`: their output format is a stable promise, and they print no banner. At the keyboard, `apt` is nicer.
:::

Installing needs **root** — the administrator account — and the error says so:

```text
E: Could not open lock file /var/lib/dpkg/lock-frontend - open (13: Permission denied)
E: Unable to acquire the dpkg frontend lock (/var/lib/dpkg/lock-frontend), are you root?
```

A **lock file** makes sure only one package tool changes the system at a time. The same lock produces the *other* common message — "Could not get lock ... it is held by process NNNN" — when an automatic update is running in the background. Wait for it. Do not delete the lock file.

::: example Rehearsing an install before doing it
`--dry-run` (also spelled `-s`) prints exactly what would happen and changes nothing. It is how you find out what a package drags in before you put it on a machine other people use.

```bash
apt-get install --dry-run cowsay
```

```text
Reading package lists...
Building dependency tree...
Reading state information...
The following additional packages will be installed:
  libtext-charwidth-perl
Suggested packages:
  filters cowsay-off
The following NEW packages will be installed:
  cowsay libtext-charwidth-perl
0 upgraded, 2 newly installed, 0 to remove and 193 not upgraded.
Inst libtext-charwidth-perl (0.04-11build3 Ubuntu:24.04/noble [amd64])
Inst cowsay (3.03+dfsg2-8 Ubuntu:24.04/noble [all])
Conf libtext-charwidth-perl (0.04-11build3 Ubuntu:24.04/noble [amd64])
Conf cowsay (3.03+dfsg2-8 Ubuntu:24.04/noble [all])
```

Step one: see why there are two packages. You asked for `cowsay`, and it needs a small Perl library that is not yet installed, so `apt` adds it — that is a **[[dependency|dependency-tree]]**. "Suggested" packages are optional extras it will *not* install.

Step two: read the summary line — **0 upgraded, 2 newly installed, 0 to remove**. Check that line every single time. The number that should stop you is anything other than zero in "to remove". A conflict can make `apt` propose removing a package something else depends on — on a bad day a whole simulation toolchain — and this one line is where that shows up before it happens. (The "193 not upgraded" only means this machine has updates waiting; it is harmless here.)

Step three: the `Inst` and `Conf` lines are the plan, in order — unpack each package, then configure it. Sanity check: two `Inst` lines, matching "2 newly installed".

When a name is wrong, `apt` says so and does nothing:

```bash
apt-get install -y nosuchpackage-xyz
```

```text
E: Unable to locate package nosuchpackage-xyz
```

`apt-get` exits with status 100 here — a real failure code your setup script should check rather than assume away.
:::

## Building from source

Most scientific and numerical software still ships as a **[[tarball|tarball]]** — a `.tar.gz` archive of source code — built with the GNU **autotools**: `./configure`, then `make`, then `make install`. The whole sequence below was run on the real source of GNU `hello` 2.10, the standard tiny example of exactly this build system.

First, look before you unpack. `tar -tzf` lists the contents without extracting (lesson 07):

```bash
tar -tzf hello_2.10.orig.tar.gz | head -5
```

```text
hello-2.10/
hello-2.10/COPYING
hello-2.10/tests/
hello-2.10/tests/greeting-1
hello-2.10/tests/traditional-1
```

Everything sits under one top-level folder, as a well-behaved tarball should. After extracting, four files are worth reading before anything else: `README`, `INSTALL`, `NEWS` and `ChangeLog`. `INSTALL` in particular lists the options this package's `configure` accepts.

### Step 1: `./configure`

**`configure`** is a large **[[shell script|autotools]]** that inspects the machine — which compiler, which tools, which libraries — and writes `Makefile`s and a `config.h` header to match. The `./` is there because the current directory is not on `PATH` (lesson 10).

```bash
./configure --prefix=$HOME/.local
```

```text
checking for a BSD-compatible install... /usr/bin/install -c
checking whether build environment is sane... yes
checking for a thread-safe mkdir -p... /usr/bin/mkdir -p
checking for gawk... no
checking for mawk... mawk
checking whether make sets $(MAKE)... yes
checking whether make supports nested variables... yes
checking for gcc... gcc
checking whether the C compiler works... yes
checking for C compiler default output file name... a.out
checking for suffix of executables...
checking whether we are cross compiling... no
checking for suffix of object files... o
checking whether we are using the GNU C compiler... yes
```

Every line is a probe. `checking for gawk... no` followed by `checking for mawk... mawk` is the script settling for what is available — which is why the same source can produce slightly different builds on two machines. This package runs about 290 such checks, and ends by listing the files it wrote:

```text
config.status: creating po/Makefile.in
config.status: creating config.h
config.status: executing depfiles commands
config.status: executing po-directories commands
config.status: creating po/POTFILES
config.status: creating po/Makefile
```

**`--prefix`** is the most important option. It is the top folder that `make install` will copy into. The default is `/usr/local`, and the convention is worth memorizing:

| Prefix | Who owns it | When |
| --- | --- | --- |
| `/usr` | the package manager | never set this by hand |
| `/usr/local` | locally built software, system-wide | you have root and everyone should get it |
| `$HOME/.local` or `~/opt/name` | you | a shared cluster where you are not root |

Under any prefix the **[[layout is the same|prefix-layout]]**: `bin/`, `lib/`, `include/`, `share/`. Other options you will meet: `--enable-X`/`--disable-X` and `--with-Y`/`--without-Y` to switch features on or off, and the variables `CC` (which compiler), `CFLAGS` (compiler options) and `LDFLAGS` (linker options). For example, `./configure CFLAGS="-O3 -march=native"` builds a solver tuned for **[[this machine's processor|march-native]]**. `./configure --help` lists everything a package supports.

### Step 2: `make`, and step 3: `make install`

**`make`** reads the `Makefile` and runs the compiler for every piece that needs building, **[[skipping pieces that are already up to date|make-timestamps]]**.

```bash
make -j"$(nproc)"
```

```text
ar cru lib/libhello.a lib/c-ctype.o lib/c-strcasecmp.o ...
ar: `u' modifier ignored since `D' is the default (see `U')
ranlib lib/libhello.a
gcc  -g -O2   -o hello src/hello.o  ./lib/libhello.a
make[2]: Leaving directory '/home/eng/build/hello-2.10'
make[1]: Leaving directory '/home/eng/build/hello-2.10'
```

`-j N` runs N compile jobs at once. `$(nproc)` (read "dollar-paren nproc") runs `nproc` and pastes in its answer — the number of processor cores, from lesson 04. So `-j"$(nproc)"` means "one job per core".

The `ar:` line is a **warning**, not an error — and telling the two apart in a hundred lines of output is most of the skill. The rule: `make` stops at the first error and exits with a non-zero status. The `gcc ... -o hello` line is the final **link**, which glues the compiled pieces into the finished program. If `make` got that far and exited 0, the warnings did not stop anything.

```bash
make install
```

```text
  /usr/bin/install -c hello '/home/eng/.local/bin'
...
 /usr/bin/install -c -m 644 ./doc/hello.info '/home/eng/.local/share/info'
 /usr/bin/mkdir -p '/home/eng/.local/share/man/man1'
 /usr/bin/install -c -m 644 hello.1 '/home/eng/.local/share/man/man1'
```

Notice two things. It uses `install`, not `cp`: `install` copies *and* sets permissions (`-m 644` is lesson 03's octal mode), which is why installed files come out with the right modes. And every path is under the prefix you chose — nothing went into `/usr`.

::: example The built program, and making the shell find it
The install put one program under the prefix. Can the shell find it?

```bash
which hello
PATH=$HOME/.local/bin:$PATH
which hello
hello
```

```text
/home/eng/.local/bin/hello
Hello, world!
```

Step one: the first `which` printed nothing and exited 1 — the prefix was not on `PATH`. Step two: after prepending it, `which` finds the file and the program runs. That is lesson 10's rule doing real work: **a private prefix is useless until `$HOME/.local/bin` is on `PATH`**, and the place to put that line is `~/.bash_profile`, above the guard, so batch jobs see it too.

Step three: check what it will load at run time before you trust it anywhere else:

```bash
ldd $HOME/.local/bin/hello | head -3
```

```text
	linux-vdso.so.1 (0x00007f744a749000)
	libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007f744a400000)
	/lib64/ld-linux-x86-64.so.2 (0x00007f744a74b000)
```

Only the C library. The `libhello.a` from the build log is not listed, because it was **[[copied into the program|static-vs-shared]]** when it was linked. So this binary runs on any machine with a compatible C library. A solver linked against a shared library under `/home/you/.local/lib` will *not* run on a compute node that cannot see your home directory. That failure shows up as `error while loading shared libraries` at start-up — on the cluster, at two in the morning.

Step four, the exit route. Autotools packages provide `make uninstall`, and it works only from the build directory that did the install:

```bash
make uninstall
ls $HOME/.local/bin
```

The listing came back empty: the program is gone. Sanity check: `find $HOME/.local -type f` found no leftover files either (a few empty folders remain). So **keep the build directory** for anything you install, or you have no supported way to remove it. That is the central weakness of installing from source, and the reason `/usr/local` is kept apart from `/usr`: the package manager keeps a record of everything it did, and `make install` keeps none.
:::

::: note CMake: the same recipe, different spelling
Newer projects use CMake instead of autotools. The shape is the same: `cmake -S . -B build -DCMAKE_INSTALL_PREFIX=$HOME/.local` (configure, with the source in `.` and the build in `build`), then `cmake --build build -j"$(nproc)"`, then `cmake --install build`. The option people forget is `-DCMAKE_BUILD_TYPE=Release`. Without it the build type is empty, which for the usual Makefile or Ninja builds means no optimization flags at all — and that is why a hand-built solver is sometimes several times slower than the packaged one.
:::

::: key Packages and source builds
`apt`/`dnf` own `/usr`; software you build owns `/usr/local` or a prefix in your home directory. `dpkg -S` says which package owns a file and `dpkg -L` what a package installed. `--dry-run` rehearses an install, and the line to read is "0 upgraded, N newly installed, 0 to remove". From source: `./configure --prefix=...`, `make -j"$(nproc)"`, `make install` — and keep the build directory so `make uninstall` still works.
:::

## Check yourself

::: check
`apt install` proposes `0 upgraded, 3 newly installed, 14 to remove`. What do you do, and what is the likeliest cause?
:::

::: answer
Stop, and read the list of what would be removed before typing `y`. Fourteen removals to install three packages means `apt` solved a conflict by throwing things away, and on a shared machine those fourteen may be someone else's toolchain.

The likeliest cause is a conflict between repositories: a third-party repository offering a different version of a shared library, so that installing the new package means downgrading or removing everything built against the distribution's version. The second likeliest is a stale index — run `apt update` and try again, because the resolver may be working from versions that no longer exist.

Investigate with `apt-cache policy <library>` to see which repositories offer which versions at what priority, and rehearse alternatives with `apt-get install --dry-run`. If you truly need the third-party version, **pin** it (set its priority in apt's preferences file) rather than letting the resolver improvise.
:::

::: check
You build a solver with `./configure && make && sudo make install` and a colleague later cannot upgrade the distribution's version of the same program. Explain what went wrong and what you should have done.
:::

::: answer
Without `--prefix`, autotools installs into `/usr/local`, which is fine. The trouble starts when the files land in `/usr` — for example because build instructions said `--prefix=/usr`. That is territory the package manager believes it owns. `dpkg` still has a record saying it installed `/usr/bin/solver` at, say, version 2.1, while the bytes on disk are your build. An upgrade will overwrite yours without warning, and a removal may delete files your build depends on. It also makes `dpkg -S` misleading: it names a package for a file that package did not produce.

What you should have done: keep the default `/usr/local`, or better, stay out of system directories entirely — `--prefix=$HOME/.local` or `--prefix=/opt/solver-2.1`, with `PATH` pointing at it. A versioned prefix under `/opt` lets several versions live side by side, which is what you want when you must reproduce last quarter's results with last quarter's solver.

To find out what is where: `dpkg -S $(which solver)` says whether any package claims the file, and comparing the file's `ls -l` date with the version `dpkg -l` reports tells you whose bytes they are.
:::

::: check
A `make` run prints forty warnings and then stops. How do you tell whether the build succeeded, without reading all forty?
:::

::: answer
By the exit status, and by whether the last thing it did was a link. `make` exits 0 if every step succeeded and non-zero otherwise, so `make; echo $?` answers in one character — or `make && echo BUILD OK`, which prints only on success. Warnings do not change the status.

Reading the end is the other half. A successful build ends with a link producing the target and `make: Leaving directory`. A failed one ends with `make: *** [Makefile:NN: target] Error 1`, naming the makefile line and the step that failed. Scroll up from *that* line, not down from the top: the first error is the cause, and everything after it is fallout.

Two practical notes. With `-j` the output of parallel jobs is interleaved, so the error may not be at the very bottom — `make -j8 2>&1 | tee build.log` and then `grep -n "Error" build.log` finds it. And an error about a missing header or library is not a compiler problem. It is a missing development package (named `...-dev` on Debian), which `apt-get build-dep` or the project's `INSTALL` file will name.
:::

::: check
Why does `apt` print a warning about its CLI interface, and what should a provisioning script use instead?
:::

::: answer
Because `apt` is openly a front end for people, whose output — progress bars, color, column widths, ordering — may change between releases. A script that parses it can break on an upgrade with no warning. The banner appears only when output is not a terminal, which is exactly the case in a script, so it also lands in the middle of whatever you were capturing.

Scripts should use `apt-get` for actions and `apt-cache` for queries. Those are the stable interfaces, and they print no banner. When nobody is at the keyboard, add `-y` to skip the yes/no prompt and set `DEBIAN_FRONTEND=noninteractive` so no package's setup questions block the run. Check the exit status rather than grepping the output.
:::

::: check
You install a tool into `$HOME/.local` on a cluster. It works from your login shell and fails from the batch queue with "command not found". Give the diagnosis and two fixes.
:::

::: answer
`$HOME/.local/bin` is on `PATH` only because a line in `~/.bashrc` put it there, below the interactivity guard from lesson 10. So that line never runs for the non-interactive shell the scheduler uses. The tool is installed correctly; nothing can find it.

Fix one: move `export PATH="$HOME/.local/bin:$PATH"` into `~/.bash_profile` above the line that sources `~/.bashrc`, or into `~/.profile`. Test with the same kind of shell the queue uses — `ssh node01 'echo $PATH'` — not with a login session.

Fix two, sturdier for a batch job: do not rely on inheritance at all. Have the job script set its own `PATH` and `LD_LIBRARY_PATH` at the top, or call the tool by its absolute path. A job that states its own environment is reproducible six months later; one that depends on a login file is reproducible only on the day.

One more thing to rule out on a real cluster: the compute node may not mount your home directory at all, so nothing under `$HOME` exists there. `ls $HOME/.local/bin` from inside the job answers that in one line.
:::

## Summary

| Command | Does | Note |
| --- | --- | --- |
| `apt update` / `apt upgrade` | refresh the index / install newer versions | a stale index causes "version not found" |
| `apt install`, `remove`, `search`, `show` | the interactive front end | warns about its CLI when piped |
| `apt-get`, `apt-cache` | the stable interfaces | what scripts should use; add `-y` |
| `apt-get install --dry-run` | rehearse | read "0 upgraded, N newly installed, **0 to remove**" |
| `apt-cache policy NAME` | installed, candidate, every available version | the "same build?" question |
| `dpkg -S /path` / `-L NAME` / `-l NAME` | owner of a file / its files / its version | `rpm -qf` / `-ql` / `-q` on the RPM family |
| `E: ... lock-frontend ... are you root?` | needs root, or another apt is running | never delete the lock file |
| `tar -tzf` before extracting | check for one top folder | lesson 07's rule |
| `./configure --prefix=...` | probe the machine, write makefiles | `--help` lists the options |
| `/usr` vs `/usr/local` vs `$HOME/.local` | package manager / local system-wide / yours | never build into `/usr` |
| `make -j"$(nproc)"` | build in parallel | check `$?`, not the warnings |
| `make install`, `make uninstall` | copy into the prefix; remove again | uninstall needs the build directory |
| `ldd BIN` | what it loads at run time | a home-directory library may not exist on a compute node |
| `cmake ... -DCMAKE_BUILD_TYPE=Release` | the modern equivalent | no build type means no optimization |

Lesson 12 turns from installing software to keeping it running as a service: `systemd` units, `systemctl`, and reading `journalctl` when something that should be running is not.

::: context rpm-family The other big family
Linux distributions come in families that share a package format. Debian and Ubuntu use `.deb` files with `dpkg` and `apt`. Red Hat Enterprise Linux, Fedora, Rocky Linux and AlmaLinux use `.rpm` files with `rpm` underneath and `dnf` on top; `dnf` replaced the older `yum`, and on many systems `yum` is now a name for `dnf`. The ideas in this lesson carry over one to one — only the spellings in the table change.
:::

::: context repository The warehouse and its catalog
A **repository** is a web server holding thousands of packages plus an index file listing them all, with versions and checksums. Your machine's list of repositories lives under `/etc/apt/`. `apt update` downloads the index files, and apt checks each one against a digital signature, so a tampered mirror is refused. A **mirror** is a copy of a repository hosted somewhere closer to you.
:::

::: context pin-priority What 500 and 100 mean
Each version in `apt-cache policy` carries a priority, and `apt` installs the available version with the highest one (preferring newer versions on a tie). A normal repository gets 500. The line `100 /var/lib/dpkg/status` is the copy already on your disk, which gets 100. Raising a version above 1000 in apt's preferences file makes apt choose it even if that means going *down* a version — that is what "pinning" does.
:::

::: context dependency-tree What apt worked out
`cowsay` needs two things: a small library, `libtext-charwidth-perl`, and Perl itself. That library in turn needs the C library and the core of Perl. Only one box in the tree was missing, so only one extra package was added.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <rect x="120" y="10" width="120" height="30" rx="5" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="30" font-size="12" text-anchor="middle" fill="#1f2a44">cowsay (new)</text>
  <rect x="10" y="75" width="200" height="30" rx="5" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="110" y="95" font-size="12" text-anchor="middle" fill="#1f2a44">libtext-charwidth-perl (new)</text>
  <rect x="240" y="75" width="110" height="30" rx="5" fill="#fff" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="295" y="95" font-size="12" text-anchor="middle" fill="#6c7a93">perl (have)</text>
  <rect x="10" y="140" width="100" height="30" rx="5" fill="#fff" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="60" y="160" font-size="12" text-anchor="middle" fill="#6c7a93">libc6 (have)</text>
  <rect x="130" y="140" width="130" height="30" rx="5" fill="#fff" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="195" y="160" font-size="12" text-anchor="middle" fill="#6c7a93">perl-base (have)</text>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="160" y1="40" x2="110" y2="75"/><line x1="200" y1="40" x2="295" y2="75"/>
    <line x1="80" y1="105" x2="60" y2="140"/><line x1="150" y1="105" x2="195" y2="140"/>
  </g>
</svg>
```
:::

::: context tarball Why it is called a tarball
`tar` stands for "tape archive": it was first written to bundle many files into one stream for magnetic tape. A `.tar.gz` is that bundle squeezed with `gzip`. People call it a **tarball**. The `.orig.tar.gz` in the file name here is Debian's naming for the untouched source as the original authors released it.
:::

::: context autotools Where configure comes from
Nobody writes a `configure` script by hand. The project's authors write a short description of what they need in a file called `configure.ac`, and a tool called **Autoconf** expands it into the long, portable shell script you run. That is why `configure` is thousands of lines long and runs on almost any Unix: it was generated to avoid depending on anything fancy. Its companion, Automake, writes the `Makefile` templates.
:::

::: context prefix-layout Every prefix looks the same inside
Whatever prefix you choose, `make install` fills the same four folders. That is why putting one line on `PATH` (for `bin`) and, if needed, one on `LD_LIBRARY_PATH` (for `lib`) is all it takes to use a private install.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="20" y="22" font-size="13" fill="#1f2a44" font-weight="700">$HOME/.local</text>
  <line x1="30" y1="30" x2="30" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="30" y1="50" x2="50" y2="50"/><line x1="30" y1="80" x2="50" y2="80"/>
    <line x1="30" y1="110" x2="50" y2="110"/><line x1="30" y1="140" x2="50" y2="140"/>
  </g>
  <text x="56" y="54" font-size="12" fill="#1d6fd1" font-weight="700">bin/</text>
  <text x="130" y="54" font-size="12" fill="#1f2a44">programs: hello (goes on PATH)</text>
  <text x="56" y="84" font-size="12" fill="#1d6fd1" font-weight="700">lib/</text>
  <text x="130" y="84" font-size="12" fill="#1f2a44">libraries: .so and .a files</text>
  <text x="56" y="114" font-size="12" fill="#1d6fd1" font-weight="700">include/</text>
  <text x="130" y="114" font-size="12" fill="#1f2a44">headers for compiling against it</text>
  <text x="56" y="144" font-size="12" fill="#1d6fd1" font-weight="700">share/</text>
  <text x="130" y="144" font-size="12" fill="#1f2a44">manuals, info pages, data</text>
</svg>
```
:::

::: context march-native Fast here, broken there
`-march=native` tells the compiler to use every instruction this processor supports, including the newest vector instructions. The program can get noticeably faster. But copy that binary to an older machine whose processor lacks one of those instructions, and it dies with `Illegal instruction`. On a cluster with mixed hardware, build on the oldest node type, or name a specific target instead of `native`.
:::

::: context make-timestamps How make knows what to skip
A `Makefile` is a list of rules: "this output file is made from these input files, by running this command." Before running a rule, `make` compares file modification times. If the output is newer than all its inputs, it is already up to date and `make` skips it. That is why a second `make` right after a successful one does almost nothing, and why editing one source file rebuilds only what depends on it.
:::

::: context static-vs-shared Copied in, or borrowed at start-up
A **static** library (`.a`, "archive") is copied into the program when it is linked, so the finished file carries that code with it. A **shared** library (`.so`, "shared object") stays a separate file that the program borrows each time it starts — so it must exist on whatever machine runs the program.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="20" width="160" height="100" rx="8" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="100" y="40" font-size="13" text-anchor="middle" fill="#1f2a44" font-weight="700">hello (the program)</text>
  <rect x="35" y="52" width="130" height="24" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <text x="100" y="68" font-size="11" text-anchor="middle" fill="#1f2a44">hello.o</text>
  <rect x="35" y="82" width="130" height="24" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <text x="100" y="98" font-size="11" text-anchor="middle" fill="#1f2a44">from libhello.a</text>
  <rect x="230" y="52" width="110" height="36" rx="5" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="285" y="75" font-size="12" text-anchor="middle" fill="#1f2a44">libc.so.6</text>
  <line x1="180" y1="70" x2="222" y2="70" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="5 3"/>
  <polygon points="230,70 220,65 220,75" fill="#1d6fd1"/>
  <text x="285" y="108" font-size="11" text-anchor="middle" fill="#1d6fd1">loaded at start-up</text>
  <text x="180" y="142" font-size="11" text-anchor="middle" fill="#6c7a93">ldd lists only the dashed kind</text>
</svg>
```
:::
