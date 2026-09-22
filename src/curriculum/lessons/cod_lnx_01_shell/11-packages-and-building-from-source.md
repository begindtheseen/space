---
id: l11-packages-and-building-from-source
title: Packages, and building from source
minutes: 19
covers:
  - Package management (apt/dnf) and building from source
---

Every program in `/usr/bin` got there somehow, and on a shared simulation machine you will need to know which ones came from the distribution, which were built by a colleague three years ago, and how to add the one you need without breaking the other two. That is two skills: driving the package manager, and running the `configure`–`make`–`make install` sequence that almost every piece of scientific software still ships with.

The distinction that matters is *who owns which directory*. The package manager owns `/usr/bin` and `/usr/lib` and will happily overwrite anything it finds there. Software you build yourself belongs in `/usr/local`, or — on a cluster where you are not root, which is most of them — in a prefix inside your own home directory. Keeping those apart is the difference between a machine that can be upgraded and one that cannot.

All output below was produced on this machine and pasted verbatim: Ubuntu 24.04.4 LTS, apt 2.8.3, dpkg 1.22.6, GNU Make 4.3 and gcc 13.3.0. This is a Debian-family machine, so every `apt` and `dpkg` transcript is real and the `dnf`/`rpm` equivalents are *not* — those are named for translation and were not run here; nothing rpm-based is installed:

```bash
command -v dnf yum rpm || echo "(no rpm-family tools on this machine)"
```

```text
(no rpm-family tools on this machine)
```

## Two layers: `dpkg` and `apt`

`dpkg` installs, removes and queries *one package file* and knows nothing about where packages come from. `apt` sits on top: it knows the repositories, resolves dependencies, downloads, and calls `dpkg`. You use `apt` to install and `dpkg` to ask questions about what is installed.

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

Read it as three answers at once: what is installed, what `apt install` would give you (the *candidate*), and every version any configured repository offers, with the priority of each. `***` marks the installed one. When a colleague says "it works on my machine", this is the command that finds out whether you have the same build.

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

`apt update` refreshes the *index*, not the software; `apt upgrade` installs newer versions. Running `install` without a recent `update` is the commonest cause of `E: Version ... not found`: your index is stale and the version it names has been superseded on the mirror.

Two queries you will use constantly. Which package owns a file:

```bash
dpkg -S /usr/bin/rsync
```

```text
rsync: /usr/bin/rsync
```

And what a package put on the machine:

```bash
dpkg -L rsync | grep bin
```

```text
/usr/bin
/usr/bin/rrsync
/usr/bin/rsync
/usr/bin/rsync-ssl
```

That pair answers "where did this binary come from, and did the same package install anything else I should know about?" — the first question when a tool behaves differently from the documentation.

::: warning
`apt` is the friendly front end for humans and says so when you use it in a script:

```bash
apt list --installed | head -3
```

```text

WARNING: apt does not have a stable CLI interface. Use with caution in scripts.

Listing...
adduser/noble,now 3.137ubuntu1 all [installed]
adwaita-icon-theme/noble,now 46.0-1 all [installed]
```

The warning appears only when the output is not a terminal, which is exactly the case in a provisioning script — and it will land in the middle of whatever you were parsing. Use `apt-get` and `apt-cache` in scripts: their output format is a stable interface and they print no such banner. Interactively, `apt` is nicer.
:::

Package management needs root, and the failure names the reason:

```text
E: Could not open lock file /var/lib/dpkg/lock-frontend - open (13: Permission denied)
E: Unable to acquire the dpkg frontend lock (/var/lib/dpkg/lock-frontend), are you root?
```

The same lock produces the *other* common message — "Could not get lock ... it is held by process NNNN" — when an unattended-upgrade job is running in the background. Wait for it; do not delete the lock file.

::: example Rehearsing an install before doing it
`--dry-run` (also spelled `-s`) prints exactly what would happen and changes nothing. It is how you find out what a package drags in before you put it on a machine other people are using.

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
0 upgraded, 2 newly installed, 0 to remove and 190 not upgraded.
Inst libtext-charwidth-perl (0.04-11build3 Ubuntu:24.04/noble [amd64])
Inst cowsay (3.03+dfsg2-8 Ubuntu:24.04/noble [all])
```

Read the summary line: **0 upgraded, 2 newly installed, 0 to remove**. That is the line to check every single time, and the number that should stop you is anything other than zero in "to remove". A dependency conflict can make `apt` propose removing a package something else depends on — including, on a bad day, a desktop environment or a simulation toolchain — and the one-line summary is where that shows up before it happens.

When a name is simply wrong, `apt` says so and does nothing:

```bash
apt-get install -y nosuchpackage-xyz
```

```text
E: Unable to locate package nosuchpackage-xyz
```

Exit status 100 from `apt-get`, which is a real exit code your provisioning script should check rather than assume.
:::

## Building from source

Most scientific and numerical software still ships as a tarball with a GNU autotools build: `./configure`, `make`, `make install`. The whole sequence below was run on this machine against the real GNU `hello` 2.10 source, which is the canonical minimal example of exactly that build system.

Unpack, and look before you leap:

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

Everything under one top-level directory, as a well-behaved tarball should be. After extracting, the four files worth reading before anything else are `README`, `INSTALL`, `NEWS` and `ChangeLog` — `INSTALL` in particular lists the options this package's `configure` accepts.

### `./configure`

`configure` is a large shell script that inspects the machine and writes `Makefile`s and a `config.h` to match.

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

Every line is a probe. `checking for gawk... no` followed by `checking for mawk... mawk` is the script settling for what is here — which is why the same source can produce subtly different builds on two machines. It ends with the files it generated:

```text
config.status: creating po/Makefile.in
config.status: creating config.h
config.status: executing depfiles commands
config.status: executing po-directories commands
config.status: creating po/POTFILES
config.status: creating po/Makefile
```

`--prefix` is the single most important option: it decides where `make install` will put things. The default is `/usr/local`, and the convention is worth memorising.

| Prefix | Who owns it | When |
| --- | --- | --- |
| `/usr` | the package manager | never set this by hand |
| `/usr/local` | locally built software, system-wide | you have root and everyone should get it |
| `$HOME/.local` or `~/opt/name` | you | a shared cluster where you are not root |

Under any prefix the layout is the same: `bin/`, `lib/`, `include/`, `share/`. Other options you will meet: `--enable-X`/`--disable-X` and `--with-Y`/`--without-Y` for features, and `CC`, `CFLAGS`, `LDFLAGS` passed as environment variables — `./configure CFLAGS="-O3 -march=native"` for a solver you want fast on this machine specifically. `./configure --help` lists everything the package supports.

### `make`, then `make install`

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

`-j N` runs N compilations in parallel; `$(nproc)` is the core count from lesson 04. The `ar:` line is a warning, not an error — and telling warnings from errors in a hundred lines of build output is most of the skill. The rule: `make` stops on an error and exits non-zero. If it reached the final link, the warnings did not matter.

```bash
make install
```

```text
 /usr/bin/install -c -m 644 ./doc/hello.info '/home/eng/.local/share/info'
 /usr/bin/mkdir -p '/home/eng/.local/share/man/man1'
 /usr/bin/install -c -m 644 hello.1 '/home/eng/.local/share/man/man1'
```

Note that it is `install`, not `cp`: the same program that sets modes and creates directories, which is why installed files come out with the right permissions. And note the paths — everything under the prefix you chose, nothing in `/usr`.

::: example The built program, and making the shell find it
The install put one binary under the prefix:

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

The first `which` printed nothing and exited non-zero — the prefix was not on `PATH`. After prepending it, the program is found and runs. That is lesson 10's rule doing real work: **a private prefix is useless until `$HOME/.local/bin` is on `PATH`**, and the place to put that line is `~/.bash_profile`, above the guard, so that batch jobs see it too.

Check what it linked against before you trust it anywhere else:

```bash
ldd $HOME/.local/bin/hello | head -3
```

```text
	linux-vdso.so.1 (0x00007f744a749000)
	libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007f744a400000)
	/lib64/ld-linux-x86-64.so.2 (0x00007f744a74b000)
```

Only the C library, so this binary will run on any machine with a compatible glibc. A solver linked against a library under `/home/you/.local/lib` will *not* run on a node that cannot see your home directory — a failure that appears as `error while loading shared libraries` at start-up, on the cluster, at two in the morning.

Finally, the exit route. Autotools packages provide `make uninstall`, and it works only from the build directory that installed them:

```bash
make uninstall
ls $HOME/.local/bin
```

The listing came back empty: the binary is gone. **Keep the build directory** for anything you install, or you have no supported way to remove it. That is the central weakness of installing from source and the reason `/usr/local` is kept separate from `/usr`: the package manager has a record of everything it did, and `make install` has none.
:::

::: note
Newer projects use CMake instead of autotools, and the shape is the same with different spellings: `cmake -S . -B build -DCMAKE_INSTALL_PREFIX=$HOME/.local`, then `cmake --build build -j"$(nproc)"`, then `cmake --install build`. `-DCMAKE_BUILD_TYPE=Release` is the option people forget, and its absence is why a hand-built solver is sometimes ten times slower than the packaged one — CMake's default build type is empty, which means no optimisation flags at all.
:::

::: key
`apt`/`dnf` own `/usr`; software you build owns `/usr/local` or a prefix in your home directory. `dpkg -S` says which package owns a file and `dpkg -L` what a package installed. `--dry-run` rehearses an install, and the line to read is "0 upgraded, N newly installed, 0 to remove". From source: `./configure --prefix=...`, `make -j"$(nproc)"`, `make install`, and keep the build directory so `make uninstall` still exists.
:::

## Check yourself

::: check
`apt install` proposes `0 upgraded, 3 newly installed, 14 to remove`. What do you do, and what is the likeliest cause?
:::

::: answer
You stop and read the list of what would be removed before typing `y`. Fourteen removals to install three packages means `apt` has resolved a conflict by throwing things away, and on a shared machine those fourteen may be someone else's toolchain.

The likeliest cause is a dependency conflict between repositories: a third-party PPA or vendor repository offering a different version of a shared library, so that satisfying the new package requires downgrading or removing everything built against the distribution's version. The second likeliest is a stale index — run `apt update` and try again, because the resolver may be working from versions that no longer exist.

Investigate with `apt-cache policy <library>` to see which repositories offer which versions and at what priority, and with `apt-get install --dry-run` to rehearse alternatives. If you genuinely need the third-party version, pin it with apt preferences rather than letting the resolver improvise.
:::

::: check
You build a solver with `./configure && make && sudo make install` and a colleague later cannot upgrade the distribution's version of the same program. Explain what went wrong and what you should have done.
:::

::: answer
Without `--prefix`, autotools defaults to `/usr/local`, which is correct — but if the project's default or your invocation put it in `/usr` (for example `--prefix=/usr`, which some build instructions suggest), the files landed in territory the package manager believes it owns. `dpkg` now has a record saying it installed `/usr/bin/solver` at version 2.1, while the bytes on disk are your build. An upgrade will overwrite yours without warning, and a reinstall or removal may delete files your build depends on. Conflicts like this also make `dpkg -S` lie: it names a package for a file that package did not produce.

What you should have done: leave the default `/usr/local`, or better, not install into a system directory at all — `--prefix=$HOME/.local` or `--prefix=/opt/solver-2.1`, with `PATH` pointing at it. A versioned prefix under `/opt` additionally lets several versions coexist, which is what you want when you must reproduce last quarter's results with last quarter's solver.

To find out what is where: `dpkg -S $(which solver)` tells you whether any package claims the file, and `ls -l` its timestamp against `dpkg -l` the package's version.
:::

::: check
A `make` run prints forty warnings and then stops. How do you tell whether the build succeeded, without reading all forty?
:::

::: answer
By the exit status, and by whether the last thing it did was a link. `make` exits 0 if every recipe succeeded and non-zero otherwise, so `make; echo $?` answers the question in one character — or `make && echo BUILD OK`, which only prints on success. Warnings do not affect the status.

Reading the tail is the other half. A successful build's last lines are a linker invocation producing the target and `make: Leaving directory`; a failed one ends with `make: *** [Makefile:NN: target] Error 1`, which names the makefile line and the rule that failed. Scroll up from *that* line, not from the top: the first error is the cause and everything after it is consequence.

Two practical notes. With `-j` the output of parallel jobs is interleaved, so the error may not be at the very bottom — `make -j8 2>&1 | tee build.log` and then `grep -n "Error" build.log` finds it. And an error that mentions a missing header or library is not a compiler problem: it is a missing `-dev` package, which `apt-get build-dep` or the project's `INSTALL` file will name.
:::

::: check
Why does `apt` print a warning about its CLI interface, and what should a provisioning script use instead?
:::

::: answer
Because `apt` is explicitly a human-facing front end whose output format and option behaviour may change between releases — progress bars, colour, column widths, ordering. A script that parses it can break on an upgrade with no warning. The banner is printed only when standard output is not a terminal, which is precisely the case in a script, so it also lands in the middle of any output you were capturing.

Scripts should use `apt-get` for actions and `apt-cache` for queries. Those are the stable interfaces: their output format is maintained deliberately, and they print no banner. In a non-interactive context, add `-y` to skip prompts and `DEBIAN_FRONTEND=noninteractive` to stop any package's configuration dialogue from blocking the run, and check the exit status rather than grepping the output.
:::

::: check
You install a tool into `$HOME/.local` on a cluster. It works from your login shell and fails from the batch queue with "command not found". Give the diagnosis and two fixes.
:::

::: answer
`$HOME/.local/bin` is on `PATH` only because a line in `~/.bashrc` put it there, and that line sits below the interactivity guard from lesson 10 — so it never runs for the non-interactive shell the scheduler uses. The tool is installed correctly; nothing can find it.

Fix one: move the `export PATH="$HOME/.local/bin:$PATH"` into `~/.bash_profile` above the line that sources `~/.bashrc`, or into `~/.profile`. Verify with the same kind of shell the queue uses — `ssh node01 'echo $PATH'` — rather than with a login session.

Fix two, and the more robust one for a batch job: do not rely on inheritance at all. Have the job script set its own environment explicitly at the top, or call the tool by absolute path. A job that states its own `PATH`, `LD_LIBRARY_PATH` and prefix in the script is reproducible six months later; one that depends on a login file is reproducible only on the day.

There is a third possibility worth ruling out on a real cluster: the compute node may not mount your home directory at all, in which case nothing under `$HOME` exists there. `ls $HOME/.local/bin` from inside the job answers that in one line.
:::

## Summary

| Command | Does | Note |
| --- | --- | --- |
| `apt update` / `apt upgrade` | refresh the index / install newer versions | a stale index causes "version not found" |
| `apt install`, `apt remove`, `apt search`, `apt show` | the interactive front end | prints a CLI-stability warning when piped |
| `apt-get`, `apt-cache` | the stable interfaces | what scripts should use; add `-y` |
| `apt-get install --dry-run` | rehearse | read "0 upgraded, N newly installed, **0 to remove**" |
| `apt-cache policy NAME` | installed, candidate, and every available version | the "same build?" question |
| `dpkg -S /path` / `dpkg -L NAME` / `dpkg -l NAME` | which package owns a file / its files / its version | `rpm -qf` / `-ql` / `-q` on the RPM family |
| `E: ... lock-frontend ... are you root?` | needs privilege, or another apt is running | never delete the lock file |
| `tar -tzf` before extracting | check the tarball has one top directory | lesson 07's rule |
| `./configure --prefix=...` | probe the machine, generate makefiles | `--help` lists the options; `INSTALL` documents them |
| `/usr` vs `/usr/local` vs `$HOME/.local` | package manager / local system-wide / yours | never build into `/usr` |
| `make -j"$(nproc)"` | build in parallel | check `$?`, not the warnings |
| `make install`, `make uninstall` | copy into the prefix; remove again | uninstall needs the original build directory |
| `ldd BIN` | what it will load at run time | a home-directory library will not exist on a compute node |
| `cmake -S . -B build -DCMAKE_INSTALL_PREFIX=... -DCMAKE_BUILD_TYPE=Release` | the modern equivalent | without a build type there are no optimisation flags |

Lesson 12 turns from installing software to running it as a service: `systemd` units, `systemctl`, and reading `journalctl` when something that is supposed to be running is not.
