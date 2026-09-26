---
id: l01-the-filesystem-and-getting-around
title: The filesystem, paths, and moving things about
minutes: 22
covers:
  - Filesystem hierarchy, absolute vs relative paths, ~ . ..
  - ls cd cp mv rm mkdir ln (hard vs symbolic links)
---

The computer that runs your simulations is almost never the one in front of you. It is a box in a rack with forty-eight cores, no monitor, no mouse, and a hundred gigabytes of Monte Carlo output. You cannot click on anything. Everything you do to it, you do by typing.

That is normal in this job. The rocket's own computers run **[[Linux|why-linux]]**, and so do the build servers and simulation clusters. So the first thing to own is not a list of commands. It is a clear picture of *where things are*, and how a typed name — a **path** — points at them.

This lesson gives you that picture and seven commands that act on it: `ls`, `cd`, `mkdir`, `cp`, `mv`, `rm` and `ln`. Linking, the last, is the one people misunderstand for years, so it gets the most room.

Every command below was really run and its output pasted exactly (Ubuntu 24.04.4, bash 5.2.21, GNU coreutils 9.4, home directory `/home/eng`). Owners, dates and inode numbers will differ on your screen; the rest will match.

## One tree, rooted at `/`

Think of a family tree drawn upside down. Linux keeps *everything* in one such tree. At the top is the **root**, written `/` and read "slash". There are no drive letters like `C:`: every disk and USB stick shows up as a folder somewhere inside the **[[one tree|one-tree]]**. (On Linux a folder is called a **directory**.)

Ask for the top level with `ls` ("list"):

```bash
ls /
```

```text
bin
bin.usr-is-merged
boot
container_info.json
dev
etc
home
lib
lib.usr-is-merged
lib64
lost+found
media
mnt
old_root
opt
proc
root
run
sbin
srv
sys
tmp
usr
var
```

A few of those — `container_info.json`, `old_root` and the `*.usr-is-merged` markers — are local oddities of the container this ran in. The rest follows the **Filesystem Hierarchy Standard**, a shared agreement about what goes where on every Linux machine:

- `/bin`, `/sbin`, `/usr/bin`, `/usr/sbin` — programs. `/usr/bin` is the big one; `ls /usr/bin | wc -l` counts 1065 programs here. On modern Ubuntu `/bin` is only a pointer to `/usr/bin`, which is what "usr-is-merged" means.
- `/etc` — settings for the whole machine, as plain text: the list of users, the network setup.
- `/home` — one directory per person. Yours is `/home/<yourname>`. The superuser's is `/root`, kept outside `/home` so it still works if the disk holding `/home` fails to attach.
- `/var` — data that changes while the machine runs. Services write their logs in `/var/log`.
- `/tmp` — scratch space that anyone may write to, usually wiped at reboot.
- `/opt`, `/usr/local` — software you built or installed yourself, outside the package manager.
- `/proc`, `/sys`, `/dev` — not files on a disk at all. The kernel (the core of the operating system) makes them up the instant you read them. `/proc/cpuinfo` is written fresh each time you look, which is why **[[so much diagnosis is reading files|proc-files]]**.

## Absolute and relative paths

Directions come in two kinds. "123 Main Street, Springfield" works from anywhere. "Two doors down on the left" works only if you know where the speaker is standing.

So do paths. A path starting with `/` is **absolute**: read from the root, it means the same thing wherever you are. Any other path is **relative**: read from your **working directory**, the directory you are "standing in" right now. Every running program carries one.

`pwd` ("print working directory") shows where you are. `cd` ("change directory") moves you.

```bash
pwd
cd runs; pwd
cd ..; pwd
```

```text
/home/eng/campaign
/home/eng/campaign/runs
/home/eng/campaign
```

The `;` (semicolon) separates two commands on one line. Three short names appear in paths all the time:

- `.` (read "dot") is the current directory. `./analyse.sh` and `analyse.sh` name the same file, but only the first form runs it — the reason is in the lesson on `PATH`.
- `..` ("dot-dot") is the parent, one level up. It chains: `../../shared/configs` climbs two levels, then goes down into `shared/configs`.
- `~` ("tilde") is your home directory.

```bash
echo ~
cd ~; pwd
cd -
```

```text
/home/eng
/home/eng
/home/eng/campaign
```

`echo` prints its arguments. `cd -` ("cd dash") jumps back to the previous directory and prints where it landed.

`~` became `/home/eng` because that is what the variable `HOME` held; for you it will be `/home/<yourname>`, for the superuser `/root`. The **shell** — the program reading your typing — swaps `~` for the value of `HOME` *before* the command runs. That is **[[expansion|shell-expands]]**, and it happens only when `~` starts a word.

::: warning Quoting a tilde turns it off
Because the shell does the swap, quotes stop it, and the program receives a literal `~` character. `tar -cf ~/backup.tar .` works. Quote the tilde and `tar` is asked to write into a directory actually named `~`, which does not exist:

```bash
tar -cf "~/backup.tar" .
```

```text
tar: ~/backup.tar: Cannot open: No such file or directory
tar: Error is not recoverable: exiting now
```

Exit status 2, and no archive anywhere. The same thing happens wherever no shell reads the line: a `~` inside a settings file, a `crontab` entry or a `Dockerfile` is very often just a character. When you need your home directory and are not sure a shell will expand it, write `$HOME`.
:::

## `ls`, past the defaults

Plain `ls` prints names in columns. The **flags** — options starting with a dash — make it useful. `-l` means "long":

```bash
ls -l runs | head -4
```

```text
total 2000
-rw-r--r-- 1 root root 541 Sep 26 17:52 case_0001.log
-rw-r--r-- 1 root root 541 Sep 26 17:52 case_0002.log
-rw-r--r-- 1 root root 541 Sep 26 17:52 case_0003.log
```

The `|` ("pipe") hands the output of `ls` to `head -4`, which keeps the first four lines (lesson 05 is all about pipes). Read a long line left to right: type and permissions (`-rw-r--r--`, decoded in lesson 03), link count, owner, group, size in bytes, time last changed, name. The owner is `root` because this ran as the superuser. The first line, `total 2000`, is the **[[disk space the listed files take up|total-blocks]]**, counted in blocks of 1024 bytes.

The flags that earn their keep:

- `-h` ("human") prints big sizes in units: a 3.2-gigabyte trajectory file shows as `3.2G` instead of `3435973837`.
- `-t` sorts newest first and `-r` reverses. So `ls -ltr` puts the most recently changed file at the *bottom*, right above your next prompt — the most useful `ls` on a machine producing output.
- `-a` ("all") also shows names beginning with a dot, which `ls` otherwise hides — including `.` and `..`:

```bash
ls -a configs
```

```text
.
..
entry_burn.yaml
entry_burn_v2.yaml
```

- `-d` lists a directory itself instead of what is inside it: `ls -ld configs` describes `configs`.
- `-i` prints each file's **inode number**, which matters a lot in the section on links.

When the thing is not there, `ls` says so and reports failure:

```bash
ls nosuchdir
```

```text
ls: cannot access 'nosuchdir': No such file or directory
```

Every program ends with an **exit status**: 0 means success, anything else means failure. Here it is 2. "No such file or directory" is the kernel's message for the error named **[[ENOENT|enoent]]**, so every tool uses the identical wording.

## Making, copying, moving

`mkdir` ("make directory") makes one directory, and fails if its parent is missing. `mkdir -p` ("parents") makes the whole chain and — usefully — succeeds quietly if it already exists. `ls -R` lists recursively, into every subdirectory:

```bash
mkdir -p out/2026-03-14/plots
ls -R out
```

```text
out:
2026-03-14

out/2026-03-14:
plots

out/2026-03-14/plots:
```

```bash
mkdir out
```

```text
mkdir: cannot create directory 'out': File exists
```

That failure, exit status 1, is why scripts use `-p`: it makes the step **[[idempotent|idempotent]]** — safe to run twice — so a re-run batch job does not crash here.

`cp src dst` copies a file; `cp -r` copies a whole directory tree. If `dst` is an existing directory, the source is copied *into* it and keeps its name. Now the part to be careful about. Suppose `entry_burn_v2.yaml` held a different `dt`, a longer horizon and an extra `margin_m` line, and you type:

```bash
cp configs/entry_burn.yaml configs/entry_burn_v2.yaml
cat configs/entry_burn_v2.yaml
```

```text
vehicle: falcon9-s1
profile: entry-burn
dt: 0.002
horizon_s: 18.0
seed_base: 100000
```

(`cat` prints a file; see lesson 02.) The version-2 settings are gone, and `cp` said nothing. Linux tools are silent on success — and "success" included destroying the file you meant to keep. Three safer spellings:

- `cp -i` ("interactive") asks before overwriting.
- `cp -n` ("no clobber") refuses to overwrite. Coreutils 9.4 now prints a warning that this spelling may change and suggests `--update=none`.
- `cp --backup=numbered` keeps the old file as `entry_burn_v2.yaml.~1~`.

Before bulk file surgery on a machine, put `alias cp='cp -i'` in your shell settings (lesson 10).

`mv` ("move") also renames. Within one filesystem it is a **[[single rename call|rename-atomic]]**, instant whatever the size, because only the name moves. Between filesystems it copies then deletes, which takes time and can be interrupted.

## `rm`, and why it deserves its reputation

`rm` ("remove") deletes. There is no trash can, no undo, and no "are you sure?" unless you ask for one.

Everything in this section ran in a throwaway directory, `scratch`, holding one copy of a log file. Try these only somewhere like that.

```bash
rm scratch/doomed
```

```text
rm: cannot remove 'scratch/doomed': Is a directory
```

Plain `rm` refuses directories. `rm -r` ("recursive") goes into them and deletes everything inside. `rm -f` ("force") skips every question and error, and reports success even when there was nothing to delete. So `rm -rf` means "delete this and everything under it, ask nothing, complain about nothing". `-r` is dangerous because the damage has no limit; `-f` because it hides the sign that you aimed at the wrong thing.

```bash
rm scratch/nothing-here.log
```

```text
rm: cannot remove 'scratch/nothing-here.log': No such file or directory
```

Exit status 1. A typo in the path was caught. That protection is exactly what `-f` switches off.

The mistake that has cost real people real data is an **[[empty variable|empty-variable]]**. A script builds a path from a variable, the variable is empty because of a typo or an earlier failure, and the path shrinks to something enormous. Watch it safely by putting `echo` in front, so the command is printed instead of run:

```bash
OUTDIR=; echo "rm -rf /home/eng/$OUTDIR"
OUTDIR=results-2026-03-14; echo "rm -rf /home/eng/$OUTDIR"
```

```text
rm -rf /home/eng/
rm -rf /home/eng/results-2026-03-14
```

`OUTDIR=` sets the variable to nothing; `$OUTDIR` (read "dollar OUTDIR") means "its value here". The second line is what the script meant. The first, with `OUTDIR` empty, deletes your entire home directory.

Three habits prevent this:

1. `set -u` at the top of every script, so an *unset* variable is an error instead of an empty string. (A variable set to empty, like `OUTDIR=` here, needs `${OUTDIR:?}` — see Check yourself.)
2. `echo` in front of a destructive command the first time you run it.
3. `cd` into the parent first rather than gluing a deletion path together.

::: example Laying out a campaign directory, then cleaning up after it
You are about to run 500 entry-burn cases. You want a dated output folder with room for plots, a copy of the settings, and a record of exactly which settings file the run used.

```bash
mkdir -p out/2026-03-14/plots
cp -r configs out/2026-03-14/configs-copy
cp configs/entry_burn.yaml out/2026-03-14/
mv out/2026-03-14/entry_burn.yaml out/2026-03-14/entry_burn_run.yaml
ls out/2026-03-14
```

```text
configs-copy
entry_burn_run.yaml
plots
```

Step by step:

1. `mkdir -p` built `out`, `out/2026-03-14` and `plots` in one go.
2. `cp -r` copied the whole `configs` directory to a new one called `configs-copy`.
3. `cp` put one more copy of `entry_burn.yaml` straight into the dated folder.
4. `mv` renamed that copy `entry_burn_run.yaml`, recording that the run read this file.

Check: three entries, exactly the three you made. Keeping the settings beside the output means that in six weeks, when someone asks which horizon the campaign used, the answer is right there.

To throw it all away afterwards: `rm -r out/2026-03-14`. Notice there is no `-f`. If the path is wrong, you want to be told.
:::

## Hard links and symbolic links

Picture one student listed on two rosters, "Room 12" and "Chess Club". Cross her off one and she still exists; she is gone from the school only when no roster lists her.

A directory is a roster. It holds **names**, and each name points at an **[[inode|inode]]** — the record that *is* the file: owner, permissions, size, and where the data sits on disk. A second name for the same inode is a **hard link**, made by `ln` ("link"). `ln -s` makes a different kind, a **symbolic link** or "symlink":

```bash
ln case_0417.log diverged.log
ln -s case_0417.log latest.log
ls -li case_0417.log diverged.log latest.log
```

```text
1885276 -rw-r--r-- 2 root root 716 Sep 26 17:52 case_0417.log
1885276 -rw-r--r-- 2 root root 716 Sep 26 17:52 diverged.log
1885407 lrwxrwxrwx 1 root root  13 Sep 26 17:52 latest.log -> case_0417.log
```

The first column is the inode number. `case_0417.log` and `diverged.log` share inode 1885276, and both show a **link count** of 2 (the number after the permissions). One inode, two names, and neither is "the original".

`latest.log` has its own inode, 1885407, and type letter `l`. Its size is 13 bytes — exactly the length of the text `case_0417.log` — because that text *is* its contents. A symbolic link is a tiny file holding a path, which the kernel follows when a program opens it.

The difference shows the moment you delete the target:

```bash
rm case_0417.log
wc -l diverged.log
cat latest.log
```

```text
12 diverged.log
cat: latest.log: No such file or directory
```

(`wc -l` counts lines; see lesson 02.) The hard link still works: removing a name only lowered the link count to 1, and data stays until the count reaches zero. The symlink is now **dangling**: it holds the text `case_0417.log`, and nothing by that name exists. `ls -l` still lists it, arrow and all — a dangling link is not an error until something opens it.

So "I deleted a 40 GB file and the free space did not change" has an answer: you removed one *name*, and something else still holds the inode.

Hard links have two limits. (`/dev/shm` is a separate, memory-backed filesystem.)

```bash
ln case_0001.log /dev/shm/case_0001_hard.log
```

```text
ln: failed to create hard link '/dev/shm/case_0001_hard.log' => 'case_0001.log': Invalid cross-device link
```

```bash
ln ../configs configs_hard
```

```text
ln: ../configs: hard link not allowed for directory
```

The first fails because inode numbers are only unique *within* one filesystem. The second fails because hard-linked directories could form loops that a tree-walking program like `find` would never escape. Symbolic links have neither limit: they only hold a path, so they can point anywhere — even at something that does not exist yet.

::: warning A symlink stores what you typed
A symlink keeps the exact path text you gave it, not the place that text pointed to at the time. Make a relative one, move it, and it breaks:

```bash
ln -s ../configs/entry_burn.yaml used_config.yaml
mv used_config.yaml ../used_config.yaml
cat ../used_config.yaml
```

```text
cat: ../used_config.yaml: No such file or directory
```

The link still says `../configs/entry_burn.yaml`, but from its new home `..` means a different directory. Relative symlinks suit a tree copied as one piece; absolute ones suit a pointer that must survive being moved alone. Use `readlink -f` to see where a link really lands.
:::

::: example A stable name for a moving target
Your notebook, plotting script and report template all want "the current best settings". If each says `entry_burn_v2.yaml`, three files need editing when v3 arrives. Instead, give them one name that never changes:

```bash
ln -s /home/eng/campaign/configs cfg
ls cfg
```

```text
entry_burn.yaml
entry_burn_v2.yaml
```

`cfg` is a symlink to the settings directory; listing it shows the target's contents. For one file, a link called `current.yaml` works the same way. When v3 lands, `ln -sf entry_burn_v3.yaml current.yaml` (`-f` replaces the old link) re-points it and every reader follows, with no edits. Coreutils 9.4 builds the new link under a temporary name and renames it into place, so no reader finds the name missing.

To check where a link ends up, `readlink -f` follows the whole chain to a real path. Run on the `latest.log` link from earlier, before its target was deleted:

```bash
readlink -f latest.log
```

```text
/home/eng/campaign/runs/case_0417.log
```

Sanity check: it resolved to a full absolute path ending in the target's name, as it should. This is the same pattern **[[software releases use|release-links]]**.
:::

::: key Hard link vs symbolic link
A hard link is a second directory entry pointing at the same inode: same filesystem only, no notion of an original, and the data survives until the last link is removed. A symlink is a small file holding a path: it can cross filesystems and point at directories, and it dangles if the target moves. `ls -li` tells you which you have — the same inode number with a link count above 1 means hard; type `l` and an arrow means symbolic.
:::

## Check yourself

::: check
You are in `/home/eng/campaign/runs`. Write three different paths that all name the file `/home/eng/campaign/configs/entry_burn.yaml`. Which would you put in a script that another team will run?
:::

::: answer
1. Absolute: `/home/eng/campaign/configs/entry_burn.yaml`.
2. Relative: `../configs/entry_burn.yaml` — up one level from `runs` to `campaign`, then down into `configs`.
3. Tilde: `~/campaign/configs/entry_burn.yaml`, which the shell expands using `HOME`.

For another team's script, none is right as written. The absolute path assumes their campaign lives in `/home/eng`; the tilde path assumes it is under whoever runs the script; the relative path assumes a working directory. A good script takes the campaign's top folder as an argument or environment variable and builds the rest relative to it. Of the three literals, the relative one travels best: it survives the whole tree being copied to another machine or user.
:::

::: check
`ls -li` shows two names with the same inode number and a link count of 2. You delete one name and check the free disk space. What changed, and why?
:::

::: answer
The free space did not change. Deleting a name removes one directory entry and lowers the inode's link count from 2 to 1. The inode still exists, still owns its data, and is still reachable through the other name.

The space comes back only when the link count reaches zero *and* no running program still has the file open. That second condition is why a deleted log that a program is still writing can keep gigabytes busy until that program is restarted.
:::

::: check
A colleague's script runs `rm -rf "$RESULTS/$RUN_ID"`. `RUN_ID` is set from a command that failed without saying so. What does the shell actually run, and what one line at the top would have stopped it?
:::

::: answer
With `RUN_ID` empty, `"$RESULTS/$RUN_ID"` becomes `$RESULTS/`, so the command is `rm -rf /path/to/results/` — *every* run, not one. The quotes did not help: they stop a value being split at spaces, not an empty value.

`set -u` at the top makes the shell stop at an unset variable, so `rm` never runs; the fuller habit is `set -euo pipefail` (the scripting module explains each letter). `set -u` catches *unset*, not *empty*, so the belt-and-braces form is `rm -rf "${RESULTS:?}/${RUN_ID:?}"`, where `:?` makes an empty value an error too.
:::

::: check
Inside `runs/` you make `ln -s ../configs/entry_burn.yaml current.yaml`. Then you `tar` up the whole `campaign` directory and unpack it on the cluster at `/scratch/campaign`. Does the link still work? What if you had made it absolute?
:::

::: answer
The relative link still works. It stores the text `../configs/entry_burn.yaml`, and one level up from `runs/` is now `/scratch/campaign`, which still contains `configs/entry_burn.yaml`. The tree moved as a whole, so its relative paths are still right.

An absolute link storing `/home/eng/campaign/configs/entry_burn.yaml` would dangle, because that path does not exist on the cluster. Relative links travel with their tree; absolute links stay pinned to one machine. That is why source trees and release archives use relative links almost everywhere.
:::

::: check
Why does `ls` not show `.bashrc` unless you add `-a`? What is the actual rule?
:::

::: answer
No "hidden" switch is stored in the filesystem. It is a habit of the listing tools: `ls` leaves out names beginning with a dot unless you give `-a` (all) or `-A` (all except `.` and `..`). The shell's `*` wildcard follows the same habit, which is why `cp * /backup/` quietly leaves your dotfiles behind. Rename `.bashrc` to `bashrc` and it shows up.
:::

## Summary

| Thing | What it is | Worth remembering |
| --- | --- | --- |
| `/` | the root of the one tree | no drive letters; every device appears inside it |
| `/etc`, `/var/log`, `/usr/local`, `/proc` | settings, logs, self-built software, kernel-made files | `/proc` is why `ps` and `top` are file readers |
| absolute vs relative | starts with `/` vs starts from the working directory | relative paths travel with a copied tree |
| `.` `..` `~` | here, parent, `$HOME` | `~` is expanded by the shell; quoting it turns it off |
| `cd -` | back to the previous directory | prints where it landed |
| `ls -ltr` / `-a` / `-d` / `-i` | oldest-first by time / dotfiles / the directory itself / inode | `-ltr` puts the newest file just above your prompt |
| `mkdir -p` | make the whole chain; succeed if present | makes a batch job safe to re-run |
| `cp` | overwrites silently on success | `-i`, `-n` or `--backup=numbered` |
| `mv` | rename within a filesystem, copy-and-delete across | the rename is instant |
| `rm -r`, `rm -f` | recurse; skip questions and errors | `-f` also hides a wrong path; `set -u` guards the empty variable |
| `ln a b` | second name for one inode | same filesystem, no directories; `ls -li` proves it |
| `ln -s a b` | small file holding the path `a` | crosses filesystems, can dangle, stores what you typed |
| `readlink -f` | follow a link chain to a real path | checks where a link really points |
| `No such file or directory` | the `ENOENT` error | same wording from every tool, because it is the kernel's |

Lesson 02 stays in this directory and starts reading what is *inside* the files — `cat`, `less`, `head`, `tail -f` and `wc` — including how to watch a running job's log grow without opening an editor on it.

::: context why-linux Linux on the rocket and on the ground
SpaceX engineers have said publicly that Falcon 9 flies three dual-core x86 flight computers running Linux, with the flight software written in C++. The same operating system runs the build servers, simulation clusters and much of the ground equipment.

That is a practical reason to learn the shell well, not a matter of taste. The compilers (`gcc`, `clang`), the debugger (`gdb`), profilers like `perf`, and build tools like CMake are first-class on Linux, and everything can be scripted. When the target and the desk run the same system, what you test is closer to what flies.
:::

::: context one-tree Everything hangs from one root
A slice of the tree. Every path is a walk down from `/`, one directory at a time. The path `/home/eng/campaign/runs` reads as: start at the root, go into `home`, then `eng`, then `campaign`, then `runs`.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5" fill="none">
    <path d="M180,28 L180,40 L40,40 L40,52"/>
    <path d="M180,40 L110,40 L110,52"/>
    <path d="M180,40 L180,52"/>
    <path d="M180,40 L250,40 L250,52"/>
    <path d="M180,40 L320,40 L320,52"/>
    <path d="M180,70 L180,92"/>
    <path d="M180,110 L180,132"/>
    <path d="M180,150 L180,160 L130,160 L130,172"/>
    <path d="M180,160 L230,160 L230,172"/>
  </g>
  <g font-size="13" fill="#1f2a44" text-anchor="middle">
    <text x="180" y="22" font-weight="700" fill="#1d6fd1">/</text>
    <text x="40" y="66">etc</text>
    <text x="110" y="66">usr</text>
    <text x="180" y="66">home</text>
    <text x="250" y="66">var</text>
    <text x="320" y="66">tmp</text>
    <text x="180" y="106">eng</text>
    <text x="180" y="146">campaign</text>
    <text x="130" y="188">configs</text>
    <text x="230" y="188">runs</text>
  </g>
  <text x="250" y="106" font-size="11" fill="#6c7a93">~ means this one</text>
</svg>
```

A USB stick or a second disk is attached ("mounted") at some directory in this same tree, never as a separate letter.
:::

::: context proc-files Files the kernel writes on demand
Nothing in `/proc` is stored on a disk. When you read one of its files, the kernel writes the answer at that instant. Process number 4211's command line is the file `/proc/4211/cmdline`. The machine's load is `/proc/loadavg`. Try `cat /proc/loadavg` twice a few seconds apart and the numbers change, although nobody saved anything.

This is why so much Linux diagnosis is just reading files. Tools like `ps` and `top` (lesson 04) are, underneath, programs that read `/proc` and format what they find.
:::

::: context shell-expands The shell rewrites your line first
When you press Enter, the shell does not hand your text straight to the program. It first rewrites it: `~` at the start of a word becomes your home directory, `$HOME` becomes its value, and `*.log` becomes the list of matching names. Only then does it start the program with the finished words.

So `ls` never sees a `~`. It sees `/home/eng`. That is why a program reading a settings file, where no shell was involved, finds a plain `~` character instead.
:::

::: context total-blocks Why 500 small files take 2000 blocks
Each log is only 541 bytes, yet `ls -l` reports `total 2000`. A filesystem hands out space in fixed-size **blocks**, commonly 4096 bytes (4 KiB) each, and even a one-byte file gets a whole block.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 100" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="30" width="320" height="34" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="20" y="30" width="42.3" height="34" fill="#1d6fd1"/>
  <text x="41" y="22" font-size="11" text-anchor="middle" fill="#1d6fd1">541 bytes used</text>
  <text x="200" y="52" font-size="12" text-anchor="middle" fill="#6c7a93">3555 bytes allocated but empty</text>
  <text x="180" y="86" font-size="12" text-anchor="middle" fill="#1f2a44">one 4096-byte block per file</text>
</svg>
```

$$
500 \text{ files} \times 4\,\mathrm{KiB} = 2000\,\mathrm{KiB}
$$

`ls` counts that total in 1024-byte units, so it prints 2000. The files hold about 271 KB of text but occupy about 2 MB of disk. Many tiny files waste space this way, which comes back in lesson 13.
:::

::: context enoent The error names behind the messages
When a request to the kernel fails, the kernel returns a short numbered error code, and each has a name. `ENOENT` means "error: no entry" — no directory entry by that name. Its standard message is "No such file or directory".

Other names you will meet: `EACCES` ("Permission denied", lesson 03), `EEXIST` ("File exists", as `mkdir` said above) and `EXDEV` ("Invalid cross-device link", from the hard-link attempt). Because the message comes from one shared table, the wording is identical in `ls`, `cat`, `rm` and your own programs. Search for the exact words and you will find the cause.
:::

::: context idempotent A step you can safely repeat
**Idempotent** (say "eye-dem-POH-tent") describes an action where doing it twice leaves things the same as doing it once. Pressing an elevator's call button is idempotent: pressing it again does not summon a second elevator.

`mkdir -p out` is idempotent: the first run makes the directory, and later runs change nothing and still report success. Plain `mkdir out` is not, because the second run fails. Batch jobs are restarted all the time after a crash or a timeout, so every setup step in them should be idempotent.
:::

::: context rename-atomic Why a rename is instant
A file's data sits in blocks on the disk, and the directory only holds the name pointing to it. Renaming within one filesystem changes that directory entry and nothing else, so a 50 GB file renames as fast as a tiny one.

The kernel also does it as one indivisible step: any other program looking at that moment sees either the old name or the new one, never a half-finished state. Software uses this trick all the time: write a new file under a temporary name, then rename it over the old one, so readers never see a half-written file.
:::

::: context empty-variable A real script that emptied home directories
In January 2015, users of Valve's Steam client for Linux reported that it had deleted every file they owned. The launcher script ran a line of the form `rm -rf "$STEAMROOT/"*`. When the script had been moved to an unexpected place, `STEAMROOT` came out empty, and the line became `rm -rf "/"*` — delete everything the user was allowed to delete.

The quotes did not help, because the problem was an empty value, not a space. `set -u` and the `${STEAMROOT:?}` form from the Check yourself section are exactly the guards that stop this class of bug.
:::

::: context inode Names, inodes and data
A directory is a table of names. Each name points at an inode. The inode points at the data. A hard link is a second name pointing at the same inode. A symlink has its own inode, and its "data" is a path.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="20" width="110" height="130" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="65" y="14" font-size="11" text-anchor="middle" fill="#6c7a93">directory runs/</text>
  <text x="18" y="48" font-size="11" fill="#1f2a44">case_0417.log</text>
  <text x="18" y="88" font-size="11" fill="#1f2a44">diverged.log</text>
  <text x="18" y="128" font-size="11" fill="#1f2a44">latest.log</text>
  <rect x="170" y="45" width="80" height="44" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="210" y="63" font-size="11" text-anchor="middle" fill="#1f2a44">inode</text>
  <text x="210" y="79" font-size="11" text-anchor="middle" fill="#1f2a44">links: 2</text>
  <rect x="170" y="110" width="80" height="40" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="210" y="127" font-size="11" text-anchor="middle" fill="#1f2a44">symlink</text>
  <text x="210" y="142" font-size="11" text-anchor="middle" fill="#1f2a44">inode</text>
  <rect x="290" y="45" width="60" height="44" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="320" y="71" font-size="11" text-anchor="middle" fill="#1f2a44">data</text>
  <text x="300" y="134" font-size="11" text-anchor="middle" fill="#1f2a44">"case_0417.log"</text>
  <g stroke="#1d6fd1" stroke-width="1.5" fill="none">
    <path d="M116,44 L168,60"/>
    <path d="M116,84 L168,74"/>
    <path d="M250,67 L288,67"/>
  </g>
  <path d="M116,124 L168,128" stroke="#b4232c" stroke-width="1.5" fill="none"/>
  <path d="M250,130 L258,130" stroke="#b4232c" stroke-width="1.5" fill="none"/>
</svg>
```

Delete `case_0417.log` and the blue path through `diverged.log` still reaches the data. The symlink's text still names `case_0417.log`, which no longer exists — so it dangles.
:::

::: context release-links How deployments swing a symlink
Many teams install each build of a program in its own dated directory, such as `/opt/sim/releases/2026-03-14-a`, and keep one symlink, `/opt/sim/current`, pointing at the one in use. Everything else refers only to `/opt/sim/current`.

Promoting a new build means re-pointing that one link; rolling back means pointing it at the old directory again. When the link points at a *directory*, write `ln -sfn` — the `-n` stops `ln` from treating the existing link as a directory and creating the new link inside it.
:::
