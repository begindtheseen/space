---
id: l10-environment-path-and-startup-files
title: The environment, PATH, and startup files
minutes: 20
covers:
  - Environment variables, PATH, .bashrc vs .bash_profile
---

"It works when I type it and fails when the batch job runs it" is the single most common report in simulation work, and the cause is almost always in this lesson. A process does not inherit your shell; it inherits an *environment*, a list of name-value strings that the kernel copies to it at `exec` time. Which strings are in that list depends on which startup files ran, and which startup files ran depends on how the shell was started — interactively, as a login shell, or as neither.

Get this right and you stop guessing. `PATH` decides which `python3` runs; `LD_LIBRARY_PATH` decides which shared library a simulator loads; `LANG` decides how `sort` orders and how a solver prints a decimal point. All three are invisible until one of them differs between your terminal and the queue.

All output below was produced on this machine and pasted verbatim: GNU bash 5.2.21 on Ubuntu 24.04.4, running as an ordinary user `eng`, with a remote host aliased `sim01` over OpenSSH_9.6p1. The exact contents of `PATH` and the set of variables present are specific to this machine — yours will differ in every value and be identical in structure.

## Two kinds of variable

A **shell variable** lives in your shell. An **environment variable** is a shell variable marked for export, and only exported ones are copied to child processes.

```bash
SIM_ROOT=/home/eng/campaign
bash -c 'echo child sees: [$SIM_ROOT]'
```

```text
child sees: []
```

```bash
export SIM_ROOT=/home/eng/campaign
bash -c 'echo child sees: [$SIM_ROOT]'
```

```text
child sees: [/home/eng/campaign]
```

Same assignment, one word of difference. `export` is the whole mechanism, and forgetting it is why a variable set at the top of a script is invisible to the program the script runs.

The two sets are listed by different commands. `set` lists every shell variable and function; `printenv` (or `env`) lists only the exported ones:

```bash
MYLOCAL=1
set | grep "^MYLOCAL="
printenv | grep "^MYLOCAL="; echo "printenv exit=$?"
```

```text
MYLOCAL=1
printenv exit=1
```

On this shell `set` reported 176 assignments and `printenv` 146: thirty variables that exist but are not exported. `declare -x` shows the exported ones with their quoting, and `unset NAME` removes a variable entirely, which is different from setting it to the empty string.

Inheritance is one-way and a snapshot. A child gets a *copy* at the moment it starts; nothing it does can change yours, and nothing you do afterwards reaches it. That is why `cd` and `export` must be shell builtins — an external program could not possibly change its parent's state.

To set a variable for one command only, put the assignment in front of it:

```bash
env SIM_DT=0.001 bash -c 'echo dt=$SIM_DT'; echo "after: [$SIM_DT]"
```

```text
dt=0.001
after: []
```

The variables you will meet constantly: `HOME`, `USER`, `SHELL`, `PWD`, `PATH`, `TERM` (what your terminal can do), `LANG` and `LC_*` (language and formatting), `EDITOR` and `VISUAL` (which editor other programs open), `TMPDIR`, and `LD_LIBRARY_PATH`.

## `PATH`

`PATH` is a colon-separated list of directories. When you type a command with no slash in it, the shell searches them **in order** and runs the first match.

```bash
echo "$PATH" | tr ":" "\n"
```

```text
/usr/local/sbin
/usr/local/bin
/usr/sbin
/usr/bin
/sbin
/bin
```

`which` reports the path; `type` is better because it also knows about builtins, functions and aliases; `type -a` shows *every* match in order, which is the one you want when two versions are fighting:

```bash
type cd
type ls
type -a python3
```

```text
cd is a shell builtin
ls is /usr/bin/ls
python3 is /usr/local/bin/python3
python3 is /usr/bin/python3
python3 is /bin/python3
```

Three `python3`s. The first wins, and on this machine `/usr/local/bin/python3` is a symlink to `/usr/bin/python3.11`, so all three are the same interpreter — but they need not be, and on a machine where someone has installed a second Python under `/usr/local`, the order in `PATH` is the entire answer to "which interpreter am I running?".

Order is everything:

```bash
PATH=~/bin:$PATH; which python3; python3
```

```text
/home/eng/bin/python3
MINE
```

```bash
PATH=$PATH:~/bin; which python3
```

```text
/usr/local/bin/python3
```

Prepending puts your directory first and it shadows the system's; appending puts it last and it is only used for names nothing else provides. Prepend when you are deliberately overriding; append when you are adding.

::: warning
The current directory is **not** in `PATH`, by design:

```bash
sweep2.sh
```

```text
bash: sweep2.sh: command not found
```

Exit status 127. `./sweep2.sh` runs the same file perfectly. The omission is deliberate: if `.` were in `PATH`, anyone who could write a file called `ls` into a shared directory could run their code the next time you typed `ls` there. Do not add `.` to `PATH`. Type the `./`.

Note the two distinct failures: **127 with "command not found"** means nothing in `PATH` matched the name, and **126 with "Permission denied"** means a file was found but is not executable (lesson 03).
:::

::: example The stale hash, and a command that "disappeared"
Bash remembers where it found each command, so it does not search `PATH` again next time. That cache outlives the file.

```bash
PATH=~/bin:$PATH
hash python3
hash
```

```text
hits	command
   0	/home/eng/bin/python3
```

Now remove that file and run the command again:

```bash
rm ~/bin/python3
python3
```

```text
bash: /home/eng/bin/python3: No such file or directory
```

Exit status 127, and the message names a path that no longer exists rather than saying "command not found" — the giveaway that this is the hash, not `PATH`. The system `python3` is still there and still on `PATH`; bash simply did not look.

```bash
hash -r
python3 --version
```

```text
Python 3.11.15
```

`hash -r` empties the table. You will meet this every time you rebuild a tool into a different directory, or install a newer version over an older one in a different prefix: the shell keeps using the old path until you clear it or open a new shell. `hash -r` is the first thing to try when a command's behaviour does not match the file you just changed.
:::

## Which startup file runs, and when

Bash reads different files depending on two independent properties of the shell.

- A **login shell** is one started as part of logging in — `ssh host` with no command, a console login, `bash -l`, or a terminal emulator configured to start one. It reads `/etc/profile`, then the **first** of `~/.bash_profile`, `~/.bash_login`, `~/.profile` that exists.
- An **interactive** shell is one with a terminal, reading commands from you. A non-login interactive shell — a new tmux pane, a new terminal tab — reads `~/.bashrc`.
- A shell that is **neither** — `bash script.sh`, `ssh host 'command'`, a `cron` job — reads *neither file* by default.

You can ask a shell which it is. `$-` holds its option flags, and `i` appears there if and only if it is interactive.

```bash
bash -c 'echo SIM_ROOT=[$SIM_ROOT]'
```

```text
SIM_ROOT=[]
```

```bash
bash -i -c 'echo SIM_ROOT=[$SIM_ROOT]'
```

```text
[.bashrc ran]
SIM_ROOT=[/home/eng/campaign]
```

```bash
bash -l -c 'echo SIM_ROOT=[$SIM_ROOT] FROM_PROFILE=[$FROM_PROFILE]'
```

```text
[.bash_profile ran]
[.bashrc ran]
SIM_ROOT=[/home/eng/campaign] FROM_PROFILE=[yes]
```

Both files announce themselves here so you can see who ran. The non-interactive, non-login shell read nothing. The interactive one read `~/.bashrc`. The login one read `~/.bash_profile`, which in turn sourced `~/.bashrc` — because `~/.bash_profile` contained the line almost every such file contains:

```bash
[ -f ~/.bashrc ] && . ~/.bashrc
```

Without that line, a login shell would get none of your interactive settings, which is why every distribution ships it. `.` (or `source`) runs a file *in the current shell*, so its assignments persist — as opposed to `bash file`, which would run it in a child and throw the result away.

The division of labour that follows:

- **`~/.bashrc`** — things that only matter to an interactive shell: prompt, aliases, shell options, key bindings, completions.
- **`~/.bash_profile`** (or `~/.profile`) — things that should be inherited by everything you start from that login: `export PATH=...`, `export EDITOR=...`, an SSH agent.

::: example Why the queue cannot find your tools
The classic. `~/.bashrc` on the server begins with the guard that Ubuntu ships by default:

```bash
ssh sim01 'cat ~/.bashrc'
```

```text
# Ubuntu's default guard: do nothing unless this shell is interactive.
case $- in
    *i*) ;;
      *) return;;
esac

export SIM_TOOLS=/opt/simtools/bin
PATH="/opt/simtools/bin:$PATH"
```

Everything below the guard runs only in an interactive shell. Now run a command over SSH, which is exactly what a batch driver, a CI runner or an `rsync` hook does:

```bash
ssh sim01 'echo $-; echo PATH=$PATH; echo SIM_TOOLS=[$SIM_TOOLS]'
```

```text
hBc
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
SIM_TOOLS=[]
```

`$-` is `hBc` — no `i`, so the shell is not interactive, so the guard returned, so the `PATH` line never ran. `SIM_TOOLS` is empty and `/opt/simtools/bin` is not on the path. Log in interactively and everything works; run it from a script and `simrun: command not found`.

A login shell does not save you either:

```bash
ssh sim01 'bash -lc "echo \$-; echo PATH=\$PATH; echo SIM_TOOLS=[\$SIM_TOOLS]; echo FROM_PROFILE=[\$FROM_PROFILE]"'
```

```text
hBc
PATH=/opt/ruby-3.3.6/bin:/opt/rbenv/shims:/opt/rbenv/bin:/opt/node22/bin:/opt/maven/bin:/usr/lib/jvm/java-21-openjdk-amd64/bin:/opt/gradle/bin:/root/.bun/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
SIM_TOOLS=[]
FROM_PROFILE=[yes]
```

`FROM_PROFILE=yes` proves `~/.bash_profile` ran, and the long `PATH` comes from the system-wide `/etc/profile.d` scripts that a login shell sources. But `$-` is still `hBc`: `bash -l` is a *login* shell, not an *interactive* one. `.bash_profile` sourced `.bashrc`, the guard fired again, and `SIM_TOOLS` is still empty.

The fix is to put the `PATH` export **in `~/.bash_profile`, above the line that sources `.bashrc`**, or in `~/.profile`, or system-wide in `/etc/profile.d/simtools.sh`. Anything a non-interactive process must see does not belong below that guard. And the reliable way to check is the command itself — `ssh host 'echo $PATH'` — not a login session that proves nothing about the queue.
:::

::: warning
Never print anything from `~/.bashrc`. `scp`, `sftp` and `rsync` run a non-interactive remote shell and expect the protocol's bytes and nothing else. With a `.bashrc` whose first line was `echo "[remote .bashrc ran]"`, a copy to that host fails:

```text
scp: Received message too long 1534223725
scp: Ensure the remote shell produces no output for non-interactive sessions.
```

The number is your banner text read as a length field. The second line is `scp` telling you exactly what to fix, and it is worth quoting because the first line sends people looking for a network problem. Remove the banner — or put it below the interactivity guard, which is what the guard is for — and the same `scp` succeeds.
:::

## `LD_LIBRARY_PATH` and the rest

A dynamically linked program finds its shared libraries at start-up. `ldd` shows what it needs and what it resolved to:

```bash
ldd /usr/bin/ls | head -4
```

```text
	linux-vdso.so.1 (0x00007fa200db6000)
	libselinux.so.1 => /lib/x86_64-linux-gnu/libselinux.so.1 (0x00007fa200d53000)
	libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007fa200a00000)
	libpcre2-8.so.0 => /lib/x86_64-linux-gnu/libpcre2-8.so.0 (0x00007fa200cb9000)
```

`LD_LIBRARY_PATH` is searched *before* the system directories, so it is how you point a simulator at a locally built library — and how you accidentally point everything else at it too. It is empty here, which is the normal state. Set it narrowly, for one command (`LD_LIBRARY_PATH=/opt/sim/lib ./sim`), and never export it from `.bashrc`: a stale entry makes every program on the machine load the wrong `libstdc++`, and the failure looks like a corrupted binary rather than a path problem. The durable alternative is to link the program with an `RPATH`, or to add the directory to `/etc/ld.so.conf.d/` and run `ldconfig`.

`LANG` and the `LC_*` variables are the other silent difference between machines. They decide how `sort` orders letters, whether `wc -m` counts characters or bytes (lesson 02), and — in some locales — whether a decimal point prints as a comma. For anything a program must parse, set `LC_ALL=C` explicitly rather than hoping the machines agree.

::: key
Only *exported* variables reach child processes, and a child gets a copy. `PATH` is searched in order, `.` is not in it, and bash caches the result — `hash -r` clears it. A login shell reads `~/.bash_profile`; an interactive non-login shell reads `~/.bashrc`; a shell that is neither, which is what `ssh host 'cmd'` and `cron` use, reads neither. Put exports in the profile, interactive settings in the rc, and nothing that prints in either.
:::

## Check yourself

::: check
A cron job runs `simrun --config entry.yaml` and fails with `simrun: command not found`, but the same line works when you type it. Explain the mechanism and give the fix.
:::

::: answer
`cron` runs the job with a minimal environment and a non-interactive, non-login shell, so neither `~/.bash_profile` nor `~/.bashrc` is read. `simrun` lives in a directory — `/opt/simtools/bin`, say — that one of those files adds to `PATH`, and that line never ran. `cron`'s own default `PATH` is typically just `/usr/bin:/bin`.

Three fixes, in increasing order of robustness. Set `PATH=...` at the top of the crontab, which `cron` honours. Better, use the absolute path in the job — `/opt/simtools/bin/simrun --config entry.yaml` — so nothing has to be inherited. Best, have the job invoke a wrapper script that sets its own environment explicitly and starts with `#!/bin/bash` and `set -euo pipefail`; then the job's environment is written down in one file you can read, rather than assembled from whatever the machine happened to have.

The way to test is to reproduce the environment, not the command: `env -i /bin/bash -c 'simrun --version'` starts with an empty environment and will fail the same way.
:::

::: check
You add `export PATH="$HOME/sim/bin:$PATH"` to `~/.bashrc`, below the standard interactivity guard. Interactive sessions find your tools; `ssh sim01 'simrun --version'` does not. Where should the line go, and why does `bash -lc` not fix it?
:::

::: answer
It should go in `~/.bash_profile` — above the line that sources `~/.bashrc` — or in `~/.profile`, or, if it should apply to every user, in a file under `/etc/profile.d/`. Those are read by login shells and, in the profile case, their exports propagate to everything started from them.

`bash -lc` does not fix it because *login* and *interactive* are independent properties. `bash -l` makes the shell a login shell, so it reads `~/.bash_profile`, which sources `~/.bashrc` — but the shell is still non-interactive, `$-` has no `i`, and the guard at the top of `.bashrc` returns before reaching your line. Anything below that guard is, by construction, unavailable to any non-interactive process, which is exactly the set of processes a batch system uses.

The check that tells the truth is `ssh sim01 'echo $PATH'`, because it runs a shell of the same kind your job will.
:::

::: check
You build a new `sim` binary into `~/bin`, which is first on `PATH`, run it, then rebuild it into `/opt/sim/bin` and delete the one in `~/bin`. The next `sim` gives `bash: /home/eng/bin/sim: No such file or directory`. What is happening, and what are two ways to fix it in the current shell?
:::

::: answer
Bash's command hash table. The first run recorded the full path `/home/eng/bin/sim`, and bash does not re-search `PATH` for a name it has cached. The file is gone, so the `exec` fails with `ENOENT`, and the message names the stale path — which is the tell that distinguishes this from an ordinary "command not found".

Two fixes: `hash -r` clears the whole table, or `hash -d sim` removes just that entry. Opening a new shell also works, since the table is per-process. You can inspect it with plain `hash`, which prints each cached command and how many times it has been used.

`type sim` is the quickest diagnosis: it reports the hashed path explicitly ("sim is hashed (/home/eng/bin/sim)"), which `which` does not, because `which` is an external program searching `PATH` itself and knows nothing about your shell's cache.
:::

::: check
Why must `cd` be a shell builtin rather than a program in `/usr/bin`, and what does that have to do with environment inheritance?
:::

::: answer
Because a child process cannot change its parent's state. If `cd` were an external program, the shell would `fork` and `exec` it; the child would change *its own* working directory, then exit — and the shell, which never moved, would print its old prompt in its old directory. The same argument applies to `export`, `umask`, `ulimit`, `set` and `source`: each of them modifies the shell itself, so each must run inside it.

The connection to the environment is that inheritance runs one way only, at `exec` time. A child receives a copy of the environment and of properties such as the working directory; it can change its copy freely and nothing propagates back. That is the safety property that makes `env VAR=x cmd` sound — the setting cannot leak into your session — and it is also the reason a script that does `export PATH=...` affects only itself and its own children, unless you `source` it.
:::

::: check
Two machines run the same analysis script over the same data and produce differently ordered output files. Neither has changed. Name the likely variable and how you would confirm it.
:::

::: answer
`LANG` or `LC_ALL`, through `LC_COLLATE`, which decides how `sort` and shell globbing order strings. In the `C`/`POSIX` locale, sorting is by byte value, so all uppercase letters precede all lowercase; in many `en_*.UTF-8` locales it is case-insensitive and ignores punctuation, so `Case_10` and `case_2` land in different relative positions. Nothing in the script has to change for its output to.

Confirm by printing the locale on both machines — `locale`, or `echo "$LANG $LC_ALL $LC_COLLATE"` — and by running the deciding command with the locale pinned: `printf 'b\nA\na\nB\n' | LC_ALL=C sort` against the same with `LC_ALL=en_US.UTF-8`. If the two machines disagree there, you have it.

The fix is to pin it rather than to match it: put `export LC_ALL=C` at the top of any script whose output another program parses. Locale-dependent ordering, and locale-dependent decimal separators, are a standing hazard for anything that writes numbers to a file that will be read elsewhere.
:::

## Summary

| Thing | Meaning | Note |
| --- | --- | --- |
| shell variable vs environment variable | local vs exported | only exported ones reach children |
| `export`, `unset`, `declare -x` | mark for export, remove, list exported | a child gets a copy; nothing propagates back |
| `set` vs `printenv`/`env` | all shell variables vs exported ones | 176 against 146 on this shell |
| `env VAR=v cmd` | set for one command | `env -i` starts with an empty environment |
| `PATH` | colon-separated, searched in order | prepend to override, append to add |
| `type -a name` | every match, plus builtins and aliases | better than `which`; shows the hash too |
| `.` not in `PATH` | deliberate; type `./script` | 127 not found, 126 found but not executable |
| `hash`, `hash -r`, `hash -d name` | the command cache and how to clear it | a message naming a deleted path is the tell |
| login shell | `/etc/profile` then the first of `~/.bash_profile`, `~/.bash_login`, `~/.profile` | `ssh host` with no command; `bash -l` |
| interactive non-login | `~/.bashrc` | a new tmux pane or terminal tab |
| neither | no startup file at all | `ssh host 'cmd'`, `cron`, `bash script.sh` |
| `$-` contains `i` | this shell is interactive | `hBc` means it is not |
| the `case $- in *i*) ;; *) return;; esac` guard | everything below it is interactive-only | put exports above it, or in the profile |
| output from `~/.bashrc` | breaks `scp`/`sftp`/`rsync` | `Received message too long` |
| `LD_LIBRARY_PATH`, `ldd` | pre-empts the system library path; shows what resolved | set it per command, never globally |
| `LANG`, `LC_ALL`, `LC_COLLATE` | ordering, character counting, decimal separators | pin `LC_ALL=C` in scripts whose output is parsed |

Lesson 11 follows `PATH` to its source: where the programs in `/usr/bin` came from, how `apt` puts them there, and what changes when you build one yourself into `/usr/local`.
