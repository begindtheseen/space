---
id: l10-environment-path-and-startup-files
title: The environment, PATH, and startup files
minutes: 22
covers:
  - Environment variables, PATH, .bashrc vs .bash_profile
---

Think about a kid heading off on a school trip. A parent packs a bag: a lunch, a jacket, a phone number. Once the bus leaves, the kid has exactly what was packed. If the jacket was forgotten, it does not matter that there is one back at home.

Every program you start gets a bag like that, called the **environment**: a list of `NAME=value` strings copied into the new program the moment it starts. The program never sees your shell. It sees only the bag.

That one fact explains the most common complaint in simulation work: "it works when I type it, and fails when the batch job runs it." Your terminal packed one bag; the batch job packed another. What goes in the bag depends on which **startup files** ran — small scripts a shell reads as it starts — and that depends on *how* the shell was started. Three variables do most of the damage: `PATH` picks which `python3` runs, `LD_LIBRARY_PATH` picks which shared library a simulator loads, and `LANG` decides how `sort` orders lines.

The transcripts come from Ubuntu 24.04 and bash 5.2, as an ordinary user `eng`, with a remote host nicknamed `sim01`. Your values will differ; the behavior will not.

## Two kinds of variable

A **shell variable** lives only inside your shell. An **environment variable** is a shell variable you have marked for **export** — "pack this one in the bag". Only exported variables are copied into programs the shell starts, which are called its **child processes** (or children).

Here is the difference in two runs. `bash -c '...'` starts a brand-new child shell that runs the quoted command and exits. Inside it, `$SIM_ROOT` (read "dollar SIM_ROOT") means "the value of the variable `SIM_ROOT`".

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

Same assignment, one word of difference. Forgetting `export` is why a variable set at the top of a script is invisible to the program that script runs.

Two commands list the two sets. `set` lists every shell variable (and every shell function). `printenv` — or `env` — lists only the exported ones.

```bash
MYLOCAL=1
set | grep "^MYLOCAL="
printenv | grep "^MYLOCAL="; echo "printenv exit=$?"
```

```text
MYLOCAL=1
printenv exit=1
```

`set` found it; `printenv` did not, so `grep` exited with status 1. On this shell `set` reported 176 assignments and `printenv` 146: thirty variables were never exported. `declare -x` lists the exported ones with their quoting, and `unset NAME` removes a variable entirely — not the same as setting it to the empty string.

### A copy, one way, at the start

Like the packed bag, the child gets a **copy**, **once**, at the moment it starts, and it goes **one way**: nothing the child does can change your shell, and nothing you change later reaches a running child.

This is why `cd` and `export` have to be **[[builtins|fork-exec]]** — commands built into the shell rather than separate programs. A separate program runs as a child. It could change its own directory, then exit, and your shell would not have moved at all.

To set a variable for one command only, put the assignment right in front of the command. You can write it with `env` or without it:

```bash
env SIM_DT=0.001 bash -c 'echo dt=$SIM_DT'; echo "after: [$SIM_DT]"
```

```text
dt=0.001
after: []
```

The child saw `0.001`; your own shell never had the variable at all. `SIM_DT=0.001 bash -c '...'` does the same thing.

The variables you will meet all the time: `HOME` (your home directory, also written `~`, read "tilde"), `USER`, `SHELL`, `PWD` (the current directory), `PATH`, `TERM` (what your terminal can draw), `LANG` and the `LC_*` family (language and number formatting), `EDITOR` and `VISUAL` (which editor other programs open for you), `TMPDIR`, and `LD_LIBRARY_PATH`.

## `PATH`: where the shell looks for commands

Picture a friend asking you to grab "the scissors". You check the kitchen drawer, then the desk, then the garage, and stop at the first pair you find — even if a better pair is in the garage.

**`PATH`** is that list of places. It is a list of directories separated by colons (`:`). When you type a command name with no slash in it, the shell **[[searches them in order|path-search]]** and runs the first match. The pipe `|` (lesson 05) feeds the value to `tr ":" "\n"`, which swaps each colon for a line break:

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

To find out which file a name will run, use `type` (`which` also exists, but knows nothing about builtins, functions or aliases). `type -a` shows *every* match in order — the one you want when two versions are fighting.

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

Three `python3`s, and the first one wins. Here all three are links to the same interpreter, but they need not be. On a machine where someone installed a second Python under `/usr/local`, the order of `PATH` is the whole answer to "which interpreter am I running?"

### Order is everything

Suppose `~/bin` holds a script called `python3` that prints `MINE`. Put `~/bin` at the front:

```bash
PATH=~/bin:$PATH; which python3; python3
```

```text
/home/eng/bin/python3
MINE
```

Now put it at the back instead (starting from the original `PATH`):

```bash
PATH=$PATH:~/bin; which python3
```

```text
/usr/local/bin/python3
```

**Prepending** (adding to the front) puts your directory first, so it **shadows** — hides — the system's copy. **Appending** (adding to the end) puts it last, so it is used only for names nothing else provides. Prepend when you mean to override. Append when you are only adding.

::: warning The current directory is not on PATH
```bash
sweep2.sh
```

```text
bash: sweep2.sh: command not found
```

The file is right there, and the shell still says **[[exit status 127|exit-127]]**. `./sweep2.sh` (read "dot slash") runs the same file perfectly, because a name with a slash in it skips the `PATH` search.

This is on purpose. If `.` (the current directory) were on `PATH`, anyone who could drop a file called `ls` into a shared directory could run their code the next time you typed `ls` there. Type the `./`.

Learn to tell the two failures apart. **127 with "command not found"** means nothing on `PATH` matched the name. **126 with "Permission denied"** means a file was found but is not executable (lesson 03).
:::

::: example The stale hash, and a command that "disappeared"
Searching six directories every time you type a command would be slow, so bash remembers where it found each one. That memory is the **hash table**, and it can outlive the file.

Step one: put `~/bin` first again and tell bash to remember where `python3` is with `hash python3` (running it once does the same). `hash` with no arguments prints the table:

```bash
PATH=~/bin:$PATH
hash python3
hash
```

```text
hits	command
   0	/home/eng/bin/python3
```

Step two: delete that file and run the command again.

```bash
rm ~/bin/python3
python3
```

```text
bash: /home/eng/bin/python3: No such file or directory
```

Exit status 127 again — but read the message. It names a path that no longer exists instead of saying "command not found". That is the giveaway: this is the hash, not `PATH`. The system `python3` is still there and still on `PATH`. Bash did not look.

Step three: `type python3` would now say `python3 is hashed (/home/eng/bin/python3)`, which confirms it. Clear the table with `hash -r` and try again:

```bash
hash -r
python3 --version
```

```text
Python 3.11.15
```

Sanity check: the system interpreter answered, exactly as `PATH` says it should once the stale entry is gone. You will meet this whenever you rebuild a tool into a different directory. When a command does not behave like the file you just changed, `hash -r` is the first thing to try.
:::

## Which startup file runs, and when

A new shell may read setup files first, like a new employee reading a handbook on day one. Bash decides which from two separate yes-or-no questions.

- **Is it a login shell?** A **login shell** is the first shell of a login: `ssh host` with no command, a console login, or `bash -l`. It reads `/etc/profile`, then the **first** of `~/.bash_profile`, `~/.bash_login` and `~/.profile` that exists. (Programs mark a login shell by **[[a dash in front of its name|login-dash]]**.)
- **Is it interactive?** An **interactive** shell is one with a terminal, reading commands you type. An interactive shell that is *not* a login shell — a new tmux pane, a new terminal tab — reads `~/.bashrc` (read "dot bash R C"; the "rc" is old Unix shorthand for a file of startup commands).
- **Neither?** A shell that is neither — `bash script.sh`, a `cron` job — reads **no startup file at all**.

One special case matters. When `sshd`, the SSH server, runs a command for you — `ssh host 'command'` — the shell is neither login nor interactive, yet bash on Ubuntu and most distributions reads `~/.bashrc` anyway. That explains the guard you are about to meet.

You can ask a shell what it is. The special variable `$-` (read "dollar dash") holds its **[[option letters|dollar-dash]]**, and the letter `i` appears in it if and only if the shell is interactive.

In the runs below, `SIM_ROOT` is set only inside `~/.bashrc`, and both startup files print a line when they run, so you can see who ran:

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

The plain child read nothing. The interactive one (`-i`) read `~/.bashrc`. The login one (`-l`) read `~/.bash_profile`, which pulled in `~/.bashrc` with the line almost every such file contains:

```bash
[ -f ~/.bashrc ] && . ~/.bashrc
```

Read it aloud as: "if the file `~/.bashrc` exists, *and then* (`&&`, read "and-and": run the right side only if the left side succeeded) run it here." The lone `.` — also spelled `source` — runs a file *inside the current shell*, so its assignments stick. `bash file` would run it in a child and throw the results away.

Without that line a login shell would miss your interactive settings. The **[[division of labor|startup-flow]]** that follows:

- **`~/.bashrc`** — things that matter only when a person is typing: the prompt, aliases, shell options, key bindings, tab completion.
- **`~/.bash_profile`** (or `~/.profile`) — things that everything started from the login should inherit: `export PATH=...`, `export EDITOR=...`, an SSH agent.

::: example Why the queue cannot find your tools
The classic. `~/.bashrc` on the server begins with the guard that Ubuntu ships by default. `case $- in *i*) ;; *) return;; esac` reads as "if `$-` contains an `i`, carry on; otherwise stop reading this file right here."

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

Everything below the guard runs only in an interactive shell. Now run a command over SSH — exactly what a batch driver, a CI runner or an `rsync` job does:

```bash
ssh sim01 'echo $-; echo PATH=$PATH; echo SIM_TOOLS=[$SIM_TOOLS]'
```

```text
hBc
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
SIM_TOOLS=[]
```

Follow the chain. Bash did read `~/.bashrc`, because `sshd` started it. But `$-` is `hBc` — no `i` — so the guard hit `return` and the `PATH` line never ran. Typed at a login, everything works; run from a script, you get `simrun: command not found`.

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

`FROM_PROFILE=yes` proves `~/.bash_profile` ran. The long `PATH` comes from the system-wide scripts in `/etc/profile.d/` that every login shell reads. But `$-` is still `hBc`. `bash -l` is a *login* shell, not an *interactive* one. `.bash_profile` pulled in `.bashrc`, the guard fired again, and `SIM_TOOLS` is still empty.

The fix: put the `PATH` export **in `~/.bash_profile`, above the line that sources `.bashrc`**, or in `~/.profile`, or system-wide in `/etc/profile.d/simtools.sh`. Nothing a non-interactive process must see belongs below that guard. The honest test is `ssh host 'echo $PATH'`, not a login session.
:::

::: warning Never print anything from ~/.bashrc
Because `ssh host 'command'` reads `~/.bashrc`, so do `scp`, `sftp` and `rsync`, which run a non-interactive remote shell and expect their own protocol bytes and nothing else. With a `.bashrc` whose first line was `echo "[remote .bashrc ran]"`, a copy to that host fails:

```text
scp: Received message too long 1534223725
scp: Ensure the remote shell produces no output for non-interactive sessions.
```

The **[[huge number is your banner text|scp-length]]**, read as a length. The second line tells you exactly what to fix; the first sends people hunting for a network problem. Remove the banner, or move it below the interactivity guard, and the same `scp` succeeds.
:::

## `LD_LIBRARY_PATH`, locales, and the rest

Most programs do not carry all their code inside themselves. They borrow pieces at start-up from **[[shared libraries|shared-library]]** — files ending in `.so` that many programs use at once. `ldd` (read "L D D") shows what a program needs and which file each need was matched to:

```bash
ldd /usr/bin/ls | head -4
```

```text
	linux-vdso.so.1 (0x00007fa200db6000)
	libselinux.so.1 => /lib/x86_64-linux-gnu/libselinux.so.1 (0x00007fa200d53000)
	libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007fa200a00000)
	libpcre2-8.so.0 => /lib/x86_64-linux-gnu/libpcre2-8.so.0 (0x00007fa200cb9000)
```

Read `=>` as "was found at". **`LD_LIBRARY_PATH`** is a `PATH` for libraries, searched *before* the system directories. It is how you point a simulator at a library you built yourself — and how you accidentally point everything else at it too.

Set it narrowly, for one command: `LD_LIBRARY_PATH=/opt/sim/lib ./sim`. Never export it from `.bashrc`: a stale entry makes every program load the wrong `libstdc++`, and the failure looks like a corrupted binary, not a path problem. The durable alternatives are to link the program with an **RPATH** (a library search path baked into the binary) or to add the directory to `/etc/ld.so.conf.d/` and run `ldconfig`.

`LANG` and the `LC_*` variables are the other silent difference between machines. They choose a **[[locale|locale]]**, which decides how `sort` orders letters, whether `wc -m` counts characters or bytes (lesson 02), and in some locales whether a decimal point prints as a comma. For anything another program must parse, set `LC_ALL=C` rather than hoping two machines agree.

::: key Environment, PATH, and startup files
Only *exported* variables reach child processes, and a child gets a copy. `PATH` is searched in order, `.` is not in it, and bash caches the result — `hash -r` clears it. A login shell reads `~/.bash_profile`; an interactive non-login shell reads `~/.bashrc`; a shell that is neither — a `cron` job, `bash script.sh` — reads neither. (`ssh host 'cmd'` reads `~/.bashrc`, but its guard stops at once.) Put exports in the profile, interactive settings in the rc, and nothing that prints in either.
:::

## Check yourself

::: check
A cron job runs `simrun --config entry.yaml` and fails with `simrun: command not found`, but the same line works when you type it. Explain the mechanism and give the fix.
:::

::: answer
`cron` runs the job with a tiny environment in a shell that is neither login nor interactive, so no startup file is read. `simrun` lives in a directory — say `/opt/simtools/bin` — that one of those files adds to `PATH`, and that line never ran. `cron`'s default `PATH` is typically only `/usr/bin:/bin`.

Three fixes, from weakest to strongest:

1. Set `PATH=...` at the top of the crontab, which `cron` honors.
2. Use the absolute path in the job — `/opt/simtools/bin/simrun --config entry.yaml` — so nothing has to be inherited.
3. Best: have the job call a wrapper script that starts with `#!/bin/bash` and `set -euo pipefail` and sets its own environment. Then the environment is written down in one file you can read.

To test, reproduce the environment, not the command: `env -i /bin/bash -c 'simrun --version'` starts with an empty environment and fails the same way.
:::

::: check
You add `export PATH="$HOME/sim/bin:$PATH"` to `~/.bashrc`, below the standard interactivity guard. Interactive sessions find your tools; `ssh sim01 'simrun --version'` does not. Where should the line go, and why does `bash -lc` not fix it?
:::

::: answer
Put it in `~/.bash_profile` — above the line that sources `~/.bashrc` — or in `~/.profile`, or, if every user should get it, in a file under `/etc/profile.d/`. Login shells read those, and their exports pass down to everything started from them.

`bash -lc` does not help because *login* and *interactive* are separate properties. `bash -l` reads `~/.bash_profile`, which sources `~/.bashrc` — but the shell is still non-interactive, `$-` has no `i`, and the guard returns before your line. Anything below that guard is unavailable to every non-interactive process, which is exactly what a batch system runs.

The check that tells the truth is `ssh sim01 'echo $PATH'`, because it runs the same kind of shell your job will.
:::

::: check
You build a new `sim` binary into `~/bin`, which is first on `PATH`, and run it. Then you rebuild it into `/opt/sim/bin` and delete the one in `~/bin`. The next `sim` gives `bash: /home/eng/bin/sim: No such file or directory`. What is happening, and what are two ways to fix it in the current shell?
:::

::: answer
It is bash's hash table. The first run recorded `/home/eng/bin/sim`, and bash does not search `PATH` again for a cached name. The file is gone, so starting it fails — and the message names the stale path, the tell that separates this from an ordinary "command not found".

Two fixes: `hash -r` clears the whole table, or `hash -d sim` removes only that entry. A new shell also works, because each shell has its own table.

`type sim` is the quickest diagnosis: it reports "sim is hashed (/home/eng/bin/sim)". `which` cannot, because it is a separate program that knows nothing about your shell's memory.
:::

::: check
Why must `cd` be a shell builtin rather than a program in `/usr/bin`, and what does that have to do with environment inheritance?
:::

::: answer
Because a child process cannot change its parent. A separate `cd` program would run as a child, change *its own* working directory and exit — and the shell, which never moved, would print its old prompt in its old directory. The same goes for `export`, `umask`, `ulimit`, `set` and `source`: each changes the shell itself, so each must run inside it.

The link to the environment: inheritance runs one way, at start-up. A child gets a copy of the environment and the working directory, changes its copy freely, and nothing flows back. That makes `env VAR=x cmd` safe — the setting cannot leak into your session — and it is why a script that runs `export PATH=...` affects only itself and its children, unless you `source` it.
:::

::: check
Two machines run the same analysis script over the same data and produce differently ordered output files. Neither has changed. Name the likely variable and how you would confirm it.
:::

::: answer
`LANG` or `LC_ALL`, acting through `LC_COLLATE`, which decides how `sort` and shell globbing order text. In the `C` (also called `POSIX`) locale, sorting is by byte value, so every uppercase letter comes before every lowercase one. In many `en_*.UTF-8` locales, sorting mostly ignores case and punctuation, so `Case_10` and `case_2` can land in different relative positions. Nothing in the script has to change for its output to change.

Confirm it by running `locale` on both machines, and by running the deciding command with the locale pinned. `printf 'b\nA\na\nB\n' | LC_ALL=C sort` gives `A B a b`; the same with `LC_ALL=en_US.UTF-8` gives `a A b B`. If the two machines disagree there, you have it.

The fix is to pin the locale rather than try to match it: put `export LC_ALL=C` at the top of any script whose output another program parses.
:::

## Summary

| Thing | Meaning | Note |
| --- | --- | --- |
| shell vs environment variable | local vs exported | only exported ones reach children |
| `export`, `unset`, `declare -x` | mark for export, remove, list exported | a child gets a copy |
| `set` vs `printenv`/`env` | all shell variables vs exported ones | 176 against 146 on this shell |
| `env VAR=v cmd` | set for one command | `env -i` starts with an empty environment |
| `PATH` | colon-separated, searched in order | prepend to override, append to add |
| `type -a name` | every match, plus builtins and aliases | better than `which`; shows the hash too |
| `.` not in `PATH` | deliberate; type `./script` | 127 not found, 126 found but not executable |
| `hash`, `hash -r`, `hash -d name` | the command cache; clear it | an error naming a deleted path |
| login shell | `/etc/profile`, then the first of `~/.bash_profile`, `~/.bash_login`, `~/.profile` | `ssh host` with no command; `bash -l` |
| interactive non-login | `~/.bashrc` | a new tmux pane or terminal tab |
| neither | no startup file | `cron`, `bash script.sh`; `ssh host 'cmd'` reads `~/.bashrc` but stops at the guard |
| `$-` contains `i` | this shell is interactive | `hBc` means it is not |
| `case $- in *i*) ;; *) return;; esac` | everything below is interactive-only | exports go above it, or in the profile |
| output from `~/.bashrc` | breaks `scp`/`sftp`/`rsync` | `Received message too long` |
| `LD_LIBRARY_PATH`, `ldd` | searched before system libraries; shows what resolved | set it per command, never globally |
| `LANG`, `LC_ALL`, `LC_COLLATE` | sort order, character counting, decimals | pin `LC_ALL=C` for parsed output |

Lesson 11 follows `PATH` back to its source: where the programs in `/usr/bin` came from, how `apt` puts them there, and what changes when you build one yourself.

::: context fork-exec How a shell starts a program
Starting a program on Linux takes two steps. First the shell calls **fork**, which makes an almost exact copy of the shell — same variables, same directory. Then the copy calls **exec**, which swaps its own code for the new program's code. Exec hands over only the exported variables, and that list is the new program's environment.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="20" width="140" height="120" rx="8" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="80" y="40" font-size="13" text-anchor="middle" fill="#1f2a44" font-weight="700">your shell</text>
  <text x="22" y="66" font-size="11" fill="#1d6fd1">PATH   exported</text>
  <text x="22" y="88" font-size="11" fill="#1d6fd1">SIM_ROOT   exported</text>
  <text x="22" y="110" font-size="11" fill="#b4232c">MYLOCAL   not exported</text>
  <line x1="152" y1="80" x2="200" y2="80" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="208,80 198,75 198,85" fill="#1f2a44"/>
  <text x="180" y="70" font-size="11" text-anchor="middle" fill="#6c7a93">fork, exec</text>
  <rect x="210" y="20" width="140" height="120" rx="8" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="280" y="40" font-size="13" text-anchor="middle" fill="#1f2a44" font-weight="700">child program</text>
  <text x="222" y="66" font-size="11" fill="#1d6fd1">PATH</text>
  <text x="222" y="88" font-size="11" fill="#1d6fd1">SIM_ROOT</text>
  <text x="222" y="110" font-size="11" fill="#6c7a93">(no MYLOCAL)</text>
  <text x="180" y="162" font-size="11" text-anchor="middle" fill="#1f2a44">a copy, one way, at start-up</text>
</svg>
```

A builtin skips both steps: the shell runs it itself, so it can change the shell.
:::

::: context path-search The first match wins
The shell walks the `PATH` list from left to right and stops at the first directory that holds a file with the right name. Anything later in the list is never looked at — which is how one directory "shadows" another.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="10" y="18" font-size="12" fill="#1f2a44">you type: python3</text>
  <rect x="10" y="30" width="100" height="36" rx="5" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="60" y="53" font-size="11" text-anchor="middle" fill="#1f2a44">/home/eng/bin</text>
  <rect x="130" y="30" width="100" height="36" rx="5" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="53" font-size="11" text-anchor="middle" fill="#6c7a93">/usr/local/bin</text>
  <rect x="250" y="30" width="100" height="36" rx="5" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="300" y="53" font-size="11" text-anchor="middle" fill="#6c7a93">/usr/bin</text>
  <text x="120" y="53" font-size="14" text-anchor="middle" fill="#1f2a44">:</text>
  <text x="240" y="53" font-size="14" text-anchor="middle" fill="#1f2a44">:</text>
  <line x1="60" y1="70" x2="60" y2="96" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="60,104 55,94 65,94" fill="#1d6fd1"/>
  <text x="60" y="120" font-size="12" text-anchor="middle" fill="#1d6fd1">found: runs this</text>
  <text x="240" y="100" font-size="12" text-anchor="middle" fill="#6c7a93">never searched</text>
</svg>
```
:::

::: context exit-127 Where 126 and 127 come from
Every program ends with a small number, its **exit status**: 0 for success, anything else for some kind of failure. When the shell cannot even start the program, it has to invent a status of its own. The POSIX standard, which most Unix shells follow, reserves two for this: 127 when no command by that name was found, and 126 when a file was found but could not be run. Seeing either one tells you the program itself never ran.
:::

::: context dollar-dash Reading the letters in $-
Each letter in `$-` is a shell option that is switched on. In `hBc`: **h** means the shell hashes command locations (the table in the stale-hash example), **B** means brace expansion is on (so `{a,b}` expands to `a b`), and **c** means the commands came from a `-c` string rather than a terminal or a file. An interactive shell adds **i**, and usually **H** for history expansion with `!`. You only ever need to look for the `i`.
:::

::: context login-dash How a program knows it is a login shell
When a login program starts your shell, it puts a dash in front of the shell's name: the running process calls itself `-bash` rather than `bash`. Bash checks for that dash (or for the `-l` option) and decides it is a login shell. You can see it yourself: in a fresh SSH session, `echo $0` usually prints `-bash`, while the same command in a new tmux pane prints `bash`.
:::

::: context startup-flow Which files each kind of shell reads
Three ways a shell can start, and the files each one reads. The dashed arrow is the line in `~/.bash_profile` that pulls in `~/.bashrc`.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <text x="60" y="18" font-size="12" text-anchor="middle" fill="#1f2a44" font-weight="700">login</text>
  <text x="180" y="18" font-size="12" text-anchor="middle" fill="#1f2a44" font-weight="700">interactive</text>
  <text x="300" y="18" font-size="12" text-anchor="middle" fill="#1f2a44" font-weight="700">neither</text>
  <rect x="10" y="30" width="100" height="30" rx="5" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="60" y="50" font-size="11" text-anchor="middle" fill="#1f2a44">/etc/profile</text>
  <rect x="10" y="80" width="100" height="30" rx="5" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="60" y="100" font-size="11" text-anchor="middle" fill="#1f2a44">~/.bash_profile</text>
  <line x1="60" y1="60" x2="60" y2="78" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="130" y="80" width="100" height="30" rx="5" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="100" font-size="11" text-anchor="middle" fill="#1f2a44">~/.bashrc</text>
  <line x1="110" y1="95" x2="126" y2="95" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="4 3"/>
  <rect x="250" y="80" width="100" height="30" rx="5" fill="#fff" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="300" y="100" font-size="11" text-anchor="middle" fill="#6c7a93">nothing</text>
  <text x="60" y="135" font-size="11" text-anchor="middle" fill="#1f2a44">ssh host</text>
  <text x="60" y="151" font-size="11" text-anchor="middle" fill="#1f2a44">bash -l</text>
  <text x="180" y="135" font-size="11" text-anchor="middle" fill="#1f2a44">new tmux pane</text>
  <text x="180" y="151" font-size="11" text-anchor="middle" fill="#1f2a44">new terminal tab</text>
  <text x="300" y="135" font-size="11" text-anchor="middle" fill="#1f2a44">cron job</text>
  <text x="300" y="151" font-size="11" text-anchor="middle" fill="#1f2a44">bash script.sh</text>
  <text x="180" y="188" font-size="11" text-anchor="middle" fill="#6c7a93">exports in the profile; aliases in the rc</text>
</svg>
```
:::

::: context scp-length The banner, read as a number
The file-copy protocol starts every message with a 4-byte length. `scp` expected one and got the first four characters of your banner instead: `[`, `r`, `e`, `m`. As bytes those are 0x5B, 0x72, 0x65, 0x6D, and read together as one 32-bit number they make 1,534,223,725 — a "message" of about 1.5 GB, so `scp` gives up.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <g font-size="13" text-anchor="middle" fill="#1f2a44">
    <rect x="30" y="20" width="70" height="34" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
    <rect x="100" y="20" width="70" height="34" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
    <rect x="170" y="20" width="70" height="34" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
    <rect x="240" y="20" width="70" height="34" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
    <text x="65" y="42">[  0x5B</text><text x="135" y="42">r  0x72</text>
    <text x="205" y="42">e  0x65</text><text x="275" y="42">m  0x6D</text>
  </g>
  <line x1="30" y1="66" x2="310" y2="66" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="170" y="86" font-size="12" text-anchor="middle" fill="#1f2a44">read as one length: 0x5B72656D</text>
  <text x="170" y="106" font-size="12" text-anchor="middle" fill="#b4232c">= 1,534,223,725 bytes</text>
</svg>
```
:::

::: context shared-library Borrowed code
A **shared library** is a file of ready-made code that many programs use at once. Nearly every program on the machine needs `libc.so.6`, the C library, so there is one copy on disk and one in memory, shared by all of them. When a program starts, a small helper called the dynamic linker (`ld-linux-x86-64.so.2`) finds each library the program asks for and connects it. `LD_LIBRARY_PATH` changes where that helper looks first — for every program that inherits it.
:::

::: context locale What a locale is
A **locale** is a bundle of local conventions: which alphabet order to sort by, which character is the decimal point, how dates look. `en_US.UTF-8` means English as used in the US, with UTF-8 text. The special locale `C` means "no local rules at all": sort by raw byte value and use a dot for decimals. That is why `C` is the safe choice for files machines will read — it behaves the same everywhere.
:::
