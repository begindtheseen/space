---
id: l01-the-filesystem-and-getting-around
title: The filesystem, paths, and moving things about
minutes: 21
covers:
  - Filesystem hierarchy, absolute vs relative paths, ~ . ..
  - ls cd cp mv rm mkdir ln (hard vs symbolic links)
---

The machine that runs your simulations is almost certainly not the machine in front of you. It is a build box in a rack with forty-eight cores, no monitor, no mouse, and a home directory holding a hundred gigabytes of Monte Carlo output. Everything you do to it, you do by typing a path. So the first thing to own is not a list of commands — it is a clear picture of where things are and how a path names them.

This lesson gives you that picture and the seven commands that act on it: `ls`, `cd`, `mkdir`, `cp`, `mv`, `rm` and `ln`. The last one, linking, is the one people skip and then misread for years, so it gets the most room. By the end you should be able to lay out a campaign directory, point a stable name at whichever run is current, and explain why deleting a file did not free any disk space.

Every command and every block of output below was run on this machine and pasted verbatim: Ubuntu 24.04.4 LTS, kernel 6.18.44, GNU bash 5.2.21, GNU coreutils 9.4. Where the output depends on the machine — file owners, timestamps, the size of a directory, which extra entries live at the root — the text says so. Yours will differ in those places and be identical in the rest.

## One tree, rooted at `/`

Linux has no drive letters. There is one tree, its root is written `/`, and every disk, every USB stick and every network share appears somewhere inside it. Ask for the top level:

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
sbin.usr-is-merged
srv
sys
tmp
usr
var
```

Three of those entries — `container_info.json`, `old_root`, and the `*.usr-is-merged` markers — are artefacts of the container this was captured in, not part of any standard. That is normal: the root of a real machine always carries a few local oddities. The rest is the Filesystem Hierarchy Standard, and it is the same everywhere you will work:

- `/bin`, `/sbin`, `/usr/bin`, `/usr/sbin` — programs. `/usr/bin` is the big one; `ls /usr/bin | wc -l` reports 1097 here. On modern Ubuntu `/bin` is a symlink to `/usr/bin`, which is what "usr-is-merged" refers to.
- `/etc` — system-wide configuration, plain text, editable. Your SSH client config, the list of users, the network setup.
- `/home` — one directory per human. Yours is `/home/<yourname>`; the superuser's is `/root`, which is deliberately not under `/home` so that it stays reachable if `/home` fails to mount.
- `/var` — data that changes as the machine runs. `/var/log` is where services write their logs.
- `/tmp` — scratch space, wiped on reboot, writable by everyone.
- `/opt`, `/usr/local` — software that did not come from the package manager. A simulator you built yourself belongs here.
- `/proc`, `/sys`, `/dev` — not files on a disk at all. The kernel synthesises them on read. `/proc/cpuinfo` is generated the instant you look at it.

::: note
`/proc` is why so much of Linux diagnosis is just reading files. Process 4211's command line is the file `/proc/4211/cmdline`; the machine's load average is `/proc/loadavg`. Tools like `ps` and `top` are, underneath, readers of `/proc`.
:::

## Absolute and relative paths

A path starting with `/` is **absolute**: it is read from the root and means the same thing from anywhere. A path that does not start with `/` is **relative**: it is read from your current working directory, which every process carries with it.

`pwd` prints that directory; `cd` changes it.

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

Three names appear in every path and never name a file you can see with plain `ls`:

- `.` is the current directory. `./analyse.sh` and `analyse.sh` name the same file, but only the first will run it — more on that in the lesson on `PATH`.
- `..` is the parent. It chains: `../../shared/configs` climbs two levels then descends.
- `~` is your home directory. The shell expands it before the command ever sees it, so it works as the first character of a path but not in the middle.

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

`cd -` returns to the previous directory and prints where it landed. It is the cheapest thing in this lesson and you will use it fifty times a day, bouncing between a source tree and an output directory.

`~` expanded to `/home/eng` here because that is what `HOME` was set to in the shell that produced this transcript. On your workstation it will be `/home/<yourname>`; in a root shell it is `/root`. The expansion is always the value of `HOME`, whatever that is.

::: warning
`~` is expanded by the shell, not by the kernel and not by the program, so quoting it turns it back into a literal character. `tar -cf ~/backup.tar .` works. Quote it and the program is handed a path that starts with a directory named `~`, which does not exist:

```bash
tar -cf "~/backup.tar" .
```

```text
tar: ~/backup.tar: Cannot open: No such file or directory
tar: Error is not recoverable: exiting now
```

Exit status 2, and no archive anywhere. The same thing happens wherever no shell is involved at all — a `~` inside a configuration file, a `crontab` entry or a `Dockerfile` is very often just a character. Write `$HOME` when you need the value and are not certain a shell will expand it.
:::

## `ls`, past the defaults

Plain `ls` gives you names in columns. The flags that earn their keep:

```bash
ls -l runs | head -4
```

```text
total 2000
-rw-r--r-- 1 root root 629 Sep 22 20:10 case_0001.log
-rw-r--r-- 1 root root 629 Sep 22 20:10 case_0002.log
-rw-r--r-- 1 root root 629 Sep 22 20:10 case_0003.log
```

Read the long line left to right: type and permissions (`-rw-r--r--`, decoded in a later lesson), link count, owner, group, size in bytes, modification time, name. The owner and group here are `root` because this capture ran as root; on your machine they will be your username. The `total 2000` is the disk space the listing occupies, in 1K blocks, and it is a property of the filesystem rather than of the files.

- `-h` makes sizes human: `811` becomes `811`, but a 3.2-gigabyte trajectory file becomes `3.2G` instead of `3435973837`.
- `-t` sorts newest first, `-r` reverses; `-ltr` — long, by time, oldest first — puts the file that changed most recently at the *bottom*, right above your next prompt. That is the single most useful `ls` on a machine that is producing output while you watch.
- `-a` shows entries beginning with a dot, which `ls` otherwise hides. Note that `.` and `..` show up too:

```bash
ls -a configs
```

```text
.
..
entry_burn.yaml
entry_burn_v2.yaml
```

- `-d` lists a directory itself rather than its contents — `ls -ld configs` tells you about `configs`, not what is in it.
- `-i` prints the inode number, which is the whole point of the next-but-one section.

When the thing is not there, `ls` says so and exits non-zero:

```bash
ls nosuchdir
```

```text
ls: cannot access 'nosuchdir': No such file or directory
```

Exit status 2. "No such file or directory" is the wording for the `ENOENT` error, and you will see it from every tool on Linux, because they are all reporting the same kernel error.

## Making, copying, moving

`mkdir` makes one directory and fails if the parent is missing. `mkdir -p` makes the whole chain and, usefully, succeeds silently if it is already there:

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

That failure — exit status 1 — is exactly why scripts use `-p`: it makes the operation idempotent, so re-running a batch job does not abort on directory creation.

`cp src dst` copies a file. `cp -r src dst` copies a directory tree. If `dst` is an existing directory, the source is copied *into* it, keeping its name. And this is the part to be careful about:

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

`entry_burn_v2.yaml` had a different `dt`, a longer horizon and a `margin_m` line. `cp` overwrote it without a single word of output. Unix tools are silent on success, and "success" here included destroying the file you meant to keep. `cp -i` asks first; `cp -n` refuses to overwrite, though coreutils 9.4 now warns that the spelling is non-portable and suggests `--update=none`; `cp --backup=numbered` keeps the old one as `entry_burn_v2.yaml.~1~`. Put `alias cp='cp -i'` in your shell configuration on any machine where you are about to do bulk file surgery.

`mv` renames within a filesystem — it is one `rename()` call, instantaneous whatever the file size — and copies-then-deletes across filesystems, which is not instantaneous and can be interrupted.

## `rm`, and why it deserves its reputation

`rm` deletes. There is no trash can, no undo, and no confirmation unless you ask for one.

Everything below was run on a scratch directory made for the purpose, `/home/eng/scratch`, holding nothing but a copy of one log file. That is the only way to show these commands honestly: a bare `rm -rf` recipe in a lesson is how people end up pasting one into the wrong terminal.

```bash
rm scratch/doomed
```

```text
rm: cannot remove 'scratch/doomed': Is a directory
```

Plain `rm` refuses directories. `rm -r` recurses into them; `rm -f` suppresses the prompts and the errors and returns success even when there was nothing to delete. Together, `rm -rf` means "delete this and everything under it, ask nothing, complain about nothing". Both halves are dangerous in their own way: `-r` because the damage is unbounded, `-f` because it hides the evidence that you aimed at the wrong thing.

```bash
rm scratch/nothing-here.log
```

```text
rm: cannot remove 'scratch/nothing-here.log': No such file or directory
```

Exit status 1 — a typo in a path is caught, which is the protection that `-f` removes.

The failure mode that has cost real people real data is an empty variable. A script builds a path from a variable, the variable is unset because of a typo or an earlier failure, and the path collapses to something enormous. You can see it without running anything destructive, by putting `echo` in front:

```bash
OUTDIR=; echo "rm -rf /home/eng/$OUTDIR"
OUTDIR=results-2026-03-14; echo "rm -rf /home/eng/$OUTDIR"
```

```text
rm -rf /home/eng/
rm -rf /home/eng/results-2026-03-14
```

The second line is what the script was supposed to build. Read the first one again: with `OUTDIR` empty, the command your script was about to run was `rm -rf /home/eng/`. Three habits prevent this: `set -u` in every script, so an unset variable is an error rather than an empty string; `echo` in front of a destructive command the first time you run it; and never building a deletion path by concatenation when you could `cd` into the parent first.

::: example Laying out a campaign directory, then cleaning up after it
A campaign of 500 entry-burn cases, with room for the dated output and its plots.

```bash
mkdir -p out/2026-03-14/plots
cp -r configs out/2026-03-14/configs-copy
mv out/2026-03-14/entry_burn.yaml out/2026-03-14/entry_burn_run.yaml
ls out/2026-03-14
```

```text
configs-copy
entry_burn_run.yaml
plots
```

Copying the configuration *into* the output directory is not redundancy for its own sake: six weeks later, when someone asks which horizon that campaign used, the answer sits next to the numbers instead of in a repository history you have to reconstruct. The rename records that this copy is the one the run actually consumed.

To throw the whole thing away afterwards, `rm -r out/2026-03-14`. Note the absence of `-f`: if the path is wrong, you want to be told.
:::

## Hard links and symbolic links

A directory does not contain files. It contains **names** that point at **inodes**, and the inode is the file: its permissions, its size, its data blocks. Two names can point at one inode. That is a hard link, and `ln` makes one.

```bash
ln case_0417.log diverged.log
ln -s case_0417.log latest.log
ls -li case_0417.log diverged.log latest.log
```

```text
421 -rw-r--r-- 2 root root 811 Sep 22 20:10 case_0417.log
421 -rw-r--r-- 2 root root 811 Sep 22 20:10 diverged.log
519 lrwxrwxrwx 1 root root  13 Sep 22 20:12 latest.log -> case_0417.log
```

Read the first column. `case_0417.log` and `diverged.log` have the same inode number, 421, and both show a link count of 2 — one inode, two names, and neither is the original. The inode numbers are specific to this filesystem; yours will be different integers.

`latest.log` is a different animal. Its own inode is 519, its type character is `l`, its size is 13 bytes — exactly the length of the string `case_0417.log` — and that string *is* its contents. A symbolic link is a tiny file holding a path, which the kernel follows when you open it.

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

The hard link still works, because removing a name only decrements the link count; the data survives until the count reaches zero. The symlink is now dangling: it still holds the string `case_0417.log`, and nothing is there. `ls -l latest.log` still lists it happily, arrow and all — a dangling symlink is not an error until something opens it.

This is also the answer to "I deleted a 40 GB file and `df` did not change". A name was removed; if another name, or a running process, still holds the inode, nothing is freed.

Hard links have two hard limits, and both produce a clear error:

```bash
ln case_0001.log /tmp/case_0001_hard.log
```

```text
ln: failed to create hard link '/tmp/case_0001_hard.log' => 'case_0001.log': Invalid cross-device link
```

```bash
ln ../configs configs_hard
```

```text
ln: ../configs: hard link not allowed for directory
```

Inode numbers are only unique within one filesystem, so a hard link cannot cross one; here `/home` is a tmpfs and `/tmp` is on the root disk. And hard-linking directories would let you build cycles that `find` could never terminate on, so the kernel forbids it. Symbolic links have neither restriction: they hold a path, so they can point anywhere, at anything, including something that does not exist yet.

::: warning
A symlink stores the path you typed, not the path it resolved to. Make a relative one, move it, and it breaks:

```bash
ln -s ../configs/entry_burn.yaml used_config.yaml
mv used_config.yaml ../used_config.yaml
cat ../used_config.yaml
```

```text
cat: ../used_config.yaml: No such file or directory
```

The link still reads `-> ../configs/entry_burn.yaml`, but `..` now means something else. Relative symlinks are the right choice inside a tree that gets copied or archived as a unit; absolute ones are the right choice for a pointer that must survive being moved. Choose deliberately, and use `readlink -f` to see where one actually lands.
:::

::: example A stable name for a moving target
Your analysis notebook, your plotting script and the report template all want to read "the current best-fit configuration". Hard-coding `entry_burn_v2.yaml` means editing three files when v3 arrives.

```bash
ln -s /home/eng/campaign/configs cfg
ls cfg
```

```text
entry_burn.yaml
entry_burn_v2.yaml
```

A symlink named `cfg` pointing at the configuration directory, or `current.yaml` pointing at one file, gives every consumer one name that never changes. When v3 lands you re-point the link — `ln -sf entry_burn_v3.yaml current.yaml` — and every consumer follows, atomically, with no edits. Verify with `readlink -f current.yaml`, which resolves the whole chain:

```bash
readlink -f latest.log
```

```text
/home/eng/campaign/runs/case_0417.log
```

This is exactly the pattern release directories use: `/opt/sim/releases/2026-03-14-a` holding the build, and `/opt/sim/current` a symlink you swing when you promote it.
:::

::: key
A hard link is another name for the same inode: same filesystem only, no original, data lives until the last name goes. A symbolic link is a small file containing a path: it crosses filesystems, points at directories, and dangles if the target moves. `ls -li` shows you which you have — same inode number and a link count above 1 means hard; type `l` and an arrow means symbolic.
:::

## Check yourself

::: check
You are in `/home/eng/campaign/runs`. Write three different paths that all name the file `/home/eng/campaign/configs/entry_burn.yaml`, and say which one you would put in a script that another team will run.
:::

::: answer
The absolute path `/home/eng/campaign/configs/entry_burn.yaml`; the relative path `../configs/entry_burn.yaml`; and the tilde path `~/campaign/configs/entry_burn.yaml`, which the shell expands using `HOME`.

For a script another team runs, none of the three is right as written. The absolute path assumes their campaign lives at `/home/eng`; the tilde path assumes the file is under whoever's home directory happens to be running it; the relative path assumes a working directory. A script should take the campaign root as an argument or an environment variable and build the rest relative to that — the relative form, anchored to something explicit. Of the three literals, the relative one is the most portable, because it survives the whole tree being copied to another machine or another user.
:::

::: check
`ls -li` shows two names with the same inode number and a link count of 2. You delete one and run `df`. What changed, and why?
:::

::: answer
Nothing changed in `df`. Deleting a name calls `unlink()`, which removes the directory entry and decrements the inode's link count from 2 to 1. The inode still exists, still owns its data blocks, and is still reachable through the other name. The space is released only when the link count reaches zero *and* no process still has the file open — which is why a deleted-but-still-open log file can hold gigabytes hostage until the process writing it is restarted.
:::

::: check
A colleague's script does `rm -rf "$RESULTS/$RUN_ID"`. `RUN_ID` is set from the output of a command that failed silently. What does the shell actually run, and what single line at the top of the script would have prevented it?
:::

::: answer
With `RUN_ID` empty, `"$RESULTS/$RUN_ID"` expands to `$RESULTS/` — so the command becomes `rm -rf /path/to/results/`, deleting every run in the results directory rather than one of them. The quoting did not help: quotes prevent word-splitting, not empty expansion.

`set -u` at the top makes the shell abort with an error when an unset variable is referenced, so the script stops before `rm` is ever invoked. The fuller habit is `set -euo pipefail`. Note that `set -u` catches *unset*, not *empty*, so the belt-and-braces form is `rm -rf "${RESULTS:?}/${RUN_ID:?}"` — the `:?` makes an empty value an error too.
:::

::: check
You create `ln -s ../configs/entry_burn.yaml current.yaml` inside `runs/`, then `tar` up the whole `campaign` directory and unpack it on the cluster at `/scratch/campaign`. Does the link still work? What if you had made it absolute?
:::

::: answer
The relative link still works. It stores the literal string `../configs/entry_burn.yaml`, and after unpacking, the directory one level up from `runs/` is `/scratch/campaign`, which still contains `configs/entry_burn.yaml`. The whole tree moved together, so every relative path inside it is still correct.

An absolute link storing `/home/eng/campaign/configs/entry_burn.yaml` would dangle on the cluster, because that path does not exist there. Relative links travel with the tree; absolute links stay pinned to one machine's layout. This is why source trees and release tarballs use relative links almost exclusively.
:::

::: check
Why does `ls` show nothing for `.bashrc` unless you pass `-a`, and what is the actual rule?
:::

::: answer
There is no "hidden" attribute in the filesystem. The rule is purely a convention in the listing tools: `ls` omits any entry whose name begins with a dot, unless `-a` (all) or `-A` (all but `.` and `..`) is given. The shell's globbing follows the same convention — `*` does not match a leading dot — which is why `cp * /backup/` silently leaves your dotfiles behind. Nothing about the file itself is different; rename `.bashrc` to `bashrc` and it appears.
:::

## Summary

| Thing | What it is | Worth remembering |
| --- | --- | --- |
| `/` | the single root of the one tree | no drive letters; every device appears inside it |
| `/etc`, `/var/log`, `/usr/local`, `/proc` | config, logs, self-built software, kernel-synthesised files | `/proc` is why `ps` and `top` are just file readers |
| absolute vs relative | starts with `/` vs starts from the working directory | relative paths travel with a tree that gets copied |
| `.` `..` `~` | here, parent, `$HOME` | `~` is expanded by the shell; quoting it kills it |
| `cd -` | back to the previous directory | prints where it landed |
| `ls -ltr` / `-a` / `-d` / `-i` | time-sorted oldest-first / dotfiles / the directory itself / inode | `-ltr` puts the newest file just above your prompt |
| `mkdir -p` | make the whole chain, succeed if present | makes a batch job re-runnable |
| `cp` | silent overwrite on success | `-i`, `-n` or `--backup=numbered` |
| `rm -r`, `rm -f` | recurse; suppress prompts and errors | `-f` also hides a wrong path; `set -u` guards the empty-variable case |
| `ln a b` | second name for one inode | same filesystem, no directories, `ls -li` proves it |
| `ln -s a b` | small file holding the path `a` | crosses filesystems, dangles freely, stores what you typed |
| `readlink -f` | resolve a link chain to a real path | the way to check what a link really points at |
| `No such file or directory` | the `ENOENT` error | same wording from every tool, because it is the kernel's |

Lesson 02 stays in this directory and starts reading what is in the files: `cat`, `less`, `head`, `tail -f` and `wc`, and how to watch a running job's log without opening an editor on a growing file.
