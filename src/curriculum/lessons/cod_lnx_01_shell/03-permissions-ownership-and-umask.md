---
id: l03-permissions-ownership-and-umask
title: Permissions, ownership and umask
minutes: 22
covers:
  - 'Permissions: chmod octal and symbolic, chown, umask'
---

The permissions column is the first thing in an `ls -l` line and the last thing most people learn to read. On a shared analysis machine it decides whether the team can read your results, whether your build script runs, and whether the nightly job may write into your directory. "Permission denied" is the most common error in this module, and it always has a mechanical explanation.

Think of an apartment. It has one owner, who can hand spare keys to a group — family, say — and everyone else in the building gets whatever the owner allows the public. Every Linux file likewise has an owning **user**, an owning **group**, and a rule for **everyone else**, and says what each of the three may do.

This lesson covers that grid, both ways of writing `chmod`, `chown`, and the `umask` that decides what every new file gets. The rules are small and exact; they feel slippery only because a letter means something different on a directory than on a file.

All output below was really run and pasted exactly (Ubuntu 24.04.4, GNU coreutils 9.4, bash 5.2.21). Privileged steps ran as the superuser, `root`; unprivileged ones as the standard **[[nobody|nobody-account]]** account (user number 65534), because root skips these checks entirely.

## Nine letters, three groups

```bash
ls -l configs/entry_burn.yaml
```

```text
-rw-r--r-- 1 root root 84 Sep 26 17:54 configs/entry_burn.yaml
```

The first ten characters split up as one, then three, three and three:

- character 1 is the **type**: `-` a regular file, `d` a directory, `l` a symbolic link, `c` or `b` a device, `s` a socket, `p` a named pipe;
- characters 2–4: what the **owning user** may do;
- characters 5–7: what members of the **owning group** may do;
- characters 8–10: what **everyone else** ("others") may do.

Inside each three the order is always `r` (read), `w` (write), `x` (execute: run it as a program), and a dash means "not allowed". So `-rw-r--r--` is a regular file the owner may read and write, and the group and others may read.

Each three is three yes/no switches, called **bits**. Give them the values **read = 4, write = 2, execute = 1** and add the ones that are on. Each group becomes one digit from 0 to 7 — an **[[octal|octal]]** digit:

| Digit | Bits | Meaning |
| --- | --- | --- |
| 7 | `rwx` | read, write, execute |
| 6 | `rw-` | read, write |
| 5 | `r-x` | read, execute |
| 4 | `r--` | read |
| 0 | `---` | nothing |

So `rw-` is $4 + 2 + 0 = 6$, `r--` is $4 + 0 + 0 = 4$, and `-rw-r--r--` is **644** (read "six-four-four"). `stat` prints both forms at once; `%A` asks for the letters and `%a` for the digits:

```bash
stat -c "%A %a %U %G %n" configs/entry_burn.yaml configs
```

```text
-rw-r--r-- 644 root root configs/entry_burn.yaml
drwxr-xr-x 755 root root configs
```

The kernel checks **exactly one** group of three. If you are the owner, it uses the owner's three and stops; it does *not* fall back to the group's. So a file with mode 466 (`r--rw-rw-`) is *unwritable by its own owner* and writable by everybody else. Here `nobody` tries to add a line to its own mode-466 file:

```text
sh: 1: cannot create /home/eng/perm/own.txt: Permission denied
```

::: warning Root ignores all of this
The same read that fails for an ordinary user **[[succeeds silently for root|root-bypass]]**, which is why testing permissions from a root shell tells you nothing. `id -u` prints your user number; 0 is root:

```bash
id -u
cat tree/a.log
```

```text
0
x
```

Every entry in `tree` was mode 644 at that point, directories included — no execute bit, so no way through. As `nobody`, the same read fails:

```text
cat: /home/eng/perm3/tree/a.log: Permission denied
```

When you check that a deployment is readable by the service account, check *as* the service account.
:::

## The letters mean different things on a directory

This is the part that catches people. Think of a directory as a **[[sheet of paper listing names|directory-bits]]**. On a directory:

- **`r`** means you may *read the list of names*.
- **`w`** means you may *change the list*: create, rename and delete entries. Notice what follows. The right to delete a file comes from its directory's mode, not the file's own. A read-only file in a writable directory can be deleted.
- **`x`** means you may *go through* the directory — use a name on the list to reach the thing it names. Without `x` on a directory, nothing below it is reachable, whatever the modes down there say.

The two halves come apart cleanly. A directory with `r` but no `x` lets you see the names and nothing else. Both commands below ran as `nobody` on a directory whose mode is 644:

```bash
ls /home/eng/perm/listable
```

```text
d.txt
```

```bash
ls -l /home/eng/perm/listable
```

```text
ls: cannot access '/home/eng/perm/listable/d.txt': Permission denied
total 0
-????????? ? ? ? ?            ? d.txt
```

`ls` could read the list — the `r` bit — so it knows the name `d.txt`. To fill in size, owner and mode it must look up the file *through* the directory, which needs `x`. Every field it could not get is a question mark. That row of question marks is the signature of a missing execute bit on a parent directory.

The opposite — `x` but no `r` — is a real pattern: you cannot list the directory, but you can open a file inside if you know its name. Some systems set home directories to 711 for this reason. As `nobody`:

```text
ls: cannot open directory '/home/eng/perm/hx': Permission denied
secret
```

The listing failed; `cat hx/known.txt` worked. Mode 700 gives others nothing at all:

```bash
ls /home/eng/perm/vault
```

```text
ls: cannot open directory '/home/eng/perm/vault': Permission denied
```

## `chmod`, the digit way

`chmod` ("change mode") followed by three digits sets all nine bits at once. It is **absolute**: whatever was there before is replaced.

```bash
chmod 640 configs/entry_burn.yaml; ls -l configs/entry_burn.yaml
chmod 754 configs/entry_burn.yaml; ls -l configs/entry_burn.yaml
```

```text
-rw-r----- 1 root root 84 Sep 26 17:54 configs/entry_burn.yaml
-rwxr-xr-- 1 root root 84 Sep 26 17:54 configs/entry_burn.yaml
```

Decode each digit separately. 640 is $6 = 4 + 2$ (`rw-`), $4$ (`r--`), $0$ (`---`): owner reads and writes, group reads, others nothing — right for anything sensitive on a shared machine. 754 is $7 = 4 + 2 + 1$ (`rwx`), $5 = 4 + 1$ (`r-x`), $4$ (`r--`).

::: key What `chmod 754 file` grants
Owner rwx (7), group r-x (5), others r-- (4). Each digit is a bitfield: read=4, write=2, execute=1.
:::

The four you will type most: **644** data file, **755** script or directory, **600** private file, **640** team may read, only you may change.

## `chmod`, the letter way

The **symbolic** form changes bits *relative* to what is already there. It reads as *who*, *operation*, *what*. *Who* is any of `u` (user, the owner), `g` (group), `o` (others) and `a` (all three). The operation is `+` to add, `-` to remove, `=` to set exactly.

```bash
chmod u=rw,g=r,o= configs/entry_burn.yaml; ls -l configs/entry_burn.yaml
chmod a+r configs/entry_burn.yaml;          ls -l configs/entry_burn.yaml
chmod go-r configs/entry_burn.yaml;         stat -c "%A %a %n" configs/entry_burn.yaml
```

```text
-rw-r----- 1 root root 84 Sep 26 17:54 configs/entry_burn.yaml
-rw-r--r-- 1 root root 84 Sep 26 17:54 configs/entry_burn.yaml
-rw------- 600 configs/entry_burn.yaml
```

Line by line: `u=rw,g=r,o=` set owner to exactly `rw`, group to `r`, others to nothing — 640, with no arithmetic. `a+r` added read for all. `go-r` removed it from group and others, leaving 600. Use letters when you mean "add this one ability, leave the rest alone" — most often `chmod +x script.sh`.

::: key Octal and symbolic
Octal sets all nine bits absolutely: read 4, write 2, execute 1, in the order owner, group, others. Symbolic edits bits relative to what is there: `u g o a` with `+ - =`. On a directory, `r` lists names, `w` creates and deletes entries, `x` traverses. The kernel checks one triple — owner, else group, else other — and does not fall back.
:::

## The execute bit, and two error messages

A script without the execute bit cannot be run by name, however correct it is. (`./` means "the one in this directory"; `a b c` are three arguments for it.)

```bash
./sweep.sh a b c
```

```text
bash: ./sweep.sh: Permission denied
```

Exit status **[[126|exit-126-127]]** — "found, but could not be run". Compare 127, "not found at all". A script that checks exit statuses can tell the two apart.

The file is still readable, so you can hand it to bash directly. This needs no execute bit, and it is how you run a script from a read-only copy:

```bash
bash sweep.sh a b c
```

```text
sweep: 3 cases
```

Add the bit and the direct form works:

```bash
chmod +x sweep.sh; ./sweep.sh a b c
```

```text
sweep: 3 cases
```

`chmod +x` with no *who* means "add `x` for all three, except where the `umask` (below) says no". With the usual umask of 022 that gives 755; with umask 077 the same command gives 744.

::: warning "cannot execute: required file not found"
This message is not about permissions at all:

```bash
./bad.py
```

```text
bash: ./bad.py: cannot execute: required file not found
```

Exit status 127. The execute bit is set. What is missing is the program named on the file's first line, the **[[shebang line|shebang]]**: `#!/usr/bin/pythn3`, with a typo. The kernel reports "no such file" for that program, worded as if the script were missing. Read the first line with `head -1 bad.py`.

The same message appears when a script has Windows line endings, because the program path then ends in an invisible carriage return. `cat -A` shows it:

```text
#!/bin/bash^M$
```
:::

A script with the execute bit and no `#!` line is fine: bash runs it itself.

## `chown` and `chgrp`

`chown` ("change owner") changes the owning user, `chgrp` the owning group, and `chown user:group` does both:

```bash
chown 65534:65534 tree/a.log; ls -l tree/a.log
chown root:root   tree/a.log; ls -l tree/a.log
chgrp 65534       tree/a.log; ls -l tree/a.log
```

```text
-rw-r--r-- 1 nobody nogroup 2 Sep 26 17:54 tree/a.log
-rw-r--r-- 1 root root 2 Sep 26 17:54 tree/a.log
-rw-r--r-- 1 root nogroup 2 Sep 26 17:54 tree/a.log
```

Names and numbers work equally. The kernel stores only numbers; `ls` looks names up in `/etc/passwd` and `/etc/group`. That is why a file from another machine can show a bare number: no name here matches it.

The rule that surprises people: **only root may give a file away**. Here is `nobody` trying to hand its own file to root:

```text
chown: changing ownership of '/home/eng/perm3/tree/a.log': Operation not permitted
```

Otherwise you could dodge a disk quota or plant a file in someone else's account. You *can* change your file's group, but only to a group you belong to. `chown -R` walks a whole tree, and `chown --reference=other_file` copies ownership from an existing file — the safe way to match a new file to its neighbors.

## `umask`: what a new file gets

You never choose the mode of a file you create with `>` or `touch`. The program asks for a generous mode — 666 for files, 777 for directories — and the kernel then removes every bit that is set in your **umask** ("user file-creation mask"). A mask is like a stencil: wherever it has a bit, that bit is blocked.

Notice that 666 has no execute bits. That is why a brand-new file is never executable, whatever your umask.

```bash
umask
touch /tmp/p1.txt; mkdir -p /tmp/p1dir; stat -c "%a %n" /tmp/p1.txt /tmp/p1dir
```

```text
0022
644 /tmp/p1.txt
755 /tmp/p1dir
```

(`touch` creates an empty file.) Digit by digit: umask 022 blocks write for group and others. From 666 the owner keeps `rw-` (6) and the others each drop to `r--` (4): 644. From 777 the same rule leaves 755.

::: warning A mask is not a subtraction
With 022 or 002 the result looks like subtraction: $666 - 022 = 644$. That is a coincidence. With umask 027, subtraction would give 637, but the real answer is 640: the mask's `7` for others blocks `r`, `w` and `x`, and there was no `x` to remove. Always go **[[bit by bit|umask-bits]]**: a bit survives only if the request has it and the mask does not.
:::

```bash
umask 077; touch /tmp/p2.txt; mkdir -p /tmp/p2dir; stat -c "%a %n" /tmp/p2.txt /tmp/p2dir
umask 002; touch /tmp/p3.txt; mkdir -p /tmp/p3dir; stat -c "%a %n" /tmp/p3.txt /tmp/p3dir
```

```text
600 /tmp/p2.txt
700 /tmp/p2dir
664 /tmp/p3.txt
775 /tmp/p3dir
```

`umask 077` is private: nothing you create is visible to others. `umask 002` is the team setting for shared project directories: files come out group-writable. The default, 022, sits between.

The umask belongs to the *process* and is passed down to every program it starts. Set it in `~/.bashrc` for your shells, or at the top of a batch script for everything that script makes. A nightly Monte Carlo running with `umask 077` makes 500 files nobody else can read — and the fix is one line in the job script, not a `chmod -R` afterwards.

::: example Making a campaign directory the team can actually use
The goal: everyone in the group may read the results and add new runs; nobody outside may read anything; the analysis scripts stay runnable.

```bash
chmod 750 campaign
chmod -R u+rwX,g+rX,o-rwx campaign
chmod 755 campaign/bin/sweep.sh
```

Line by line:

1. `750` on the top directory: owner everything, group read and go-through, others nothing.
2. `-R` walks the tree. Capital `X` adds execute **only to directories, and to files that already have execute for somebody**: directories become passable, scripts stay runnable, logs stay non-executable. On a practice tree (a 600 log, a 700 script, two 700 directories) it gave:

```text
750 d t2
640 f t2/a.log
750 f t2/run.sh
750 d t2/sub
```

Check: every directory is 750, the log is 640 with no `x`, and the script kept its `x` for the group. Exactly the goal.

3. `755` on one script, by name, for anyone who needs to run it.

Lower-case `x` does not discriminate. (`find ... -printf "%m %y %p\n"` prints each entry's mode, type and path.)

```bash
chmod -R a+x tree
find tree -printf "%m %y %p\n" | sort -k3
```

```text
755 d tree
755 f tree/a.log
755 f tree/run.sh
755 d tree/sub
```

The log is now marked executable. Nothing breaks today, which is the problem: it is wrong, it gets committed, and someone later asks why the repository is full of executable text.

Finally, set the umask so things stay right for every file made later:

```bash
umask 027
```

Bit by bit, 666 under mask 027 gives 640, and 777 gives 750 — team-readable, outsiders shut out, automatically.
:::

::: example `chmod -R 644` on a tree, and why `X` cannot fully undo it
The classic accident is a digit-style `chmod -R` on a directory tree. This ran in a throwaway directory, `tree`, holding one log file, one script and one subdirectory. Before:

```text
755 d tree
644 f tree/a.log
755 f tree/run.sh
755 d tree/sub
```

```bash
chmod -R 644 tree
find tree -printf "%m %y %p\n" | sort -k3
```

```text
644 d tree
644 f tree/a.log
644 f tree/run.sh
644 d tree/sub
```

The directories are now 644: readable, not passable. As `nobody`, listing still works and reading does not:

```text
a.log
run.sh
sub
```

```text
cat: /home/eng/perm3/tree/a.log: Permission denied
```

The names are readable; the contents are unreachable. Now the repair:

```bash
chmod -R u+rwX,go+rX tree
find tree -printf "%m %y %p\n" | sort -k3
```

```text
755 d tree
644 f tree/a.log
644 f tree/run.sh
755 d tree/sub
```

Compare with "before". Directories are passable and the log is right — but `run.sh` is 644, and it was 755. `X` adds execute only where it already exists *somewhere*, and the first `chmod -R` erased it everywhere. Nothing on disk now records that `run.sh` was a program.

So the danger of `chmod -R <digits>` is not failure. It wipes out the difference between a script and a log, beyond repair. Set directories and files separately — `find tree -type d -exec chmod 755 {} +` and `find tree -type f -exec chmod 644 {} +` — and re-mark scripts by name.
:::

## Why `sudo command > file` fails

`sudo` runs one command as root. So why does `sudo echo hello > /root/f` say "Permission denied"? Because of the order of events:

1. Your shell reads the line.
2. Your shell opens `/root/f` for writing — the `>` is *its* job.
3. Only then does your shell start `sudo`.

The file is opened by your unprivileged shell before `sudo` exists, so the open fails.

The demonstration uses `nobody` instead of `sudo`, because this shell was already root. `rootonly` is a directory `nobody` may not write to:

```bash
echo hello > /home/eng/perm/rootonly/f.txt
```

```text
bash: line 1: /home/eng/perm/rootonly/f.txt: Permission denied
```

The error names `bash`, not `echo` — the clue. The fix is to make the *writing program* privileged. **[[`tee`|tee-name]]** copies its input to a file and to the screen:

```bash
echo hello | tee rootonly/f.txt
```

```text
hello
```

So `| sudo tee file` writes with privilege, and `| sudo tee -a file` appends. Or hand the whole line to a root shell: `sudo sh -c 'echo hello > /root/f'`, where the shell doing the `>` is the one `sudo` started.

::: key Why `sudo echo hello > /root/f` fails
The redirection is performed by your shell, which is still unprivileged, before sudo ever runs. Use `echo hello | sudo tee /root/f` or `sudo sh -c "echo hello > /root/f"`.
:::

## Check yourself

::: check
After `chmod 754 flight_report.csv`, what does `ls -l` show for the mode? And who can delete the file?
:::

::: answer
7 is `rwx`, 5 is `r-x`, 4 is `r--`, so the string is `-rwxr-xr--`: type `-` for a regular file, then owner `rwx`, group `r-x`, others `r--`.

Who can delete it is a trick question: you cannot tell from that line. Deleting removes a name from a directory, so what matters is `w` on the *containing directory*. Anyone with write there can delete the file despite its read-only mode, and even the owner cannot if the directory denies them write. The exception is the **[[sticky bit|sticky-bit]]** (`chmod +t`), which makes `/tmp` safe: there you may delete only your own files.
:::

::: check
A user runs `ls -l results/` and gets a full listing, but `cat results/run_0001.log` says "Permission denied" — even though the file is mode 644 and she is in its group. What is the likeliest cause, and which one command would confirm it?
:::

::: answer
A parent directory is missing its execute bit for her. `r` on `results/` lets her read the names; opening a file inside needs `x` to go through. The file's own 644 is never checked.

Confirm with `namei -l results/run_0001.log`, which prints the mode of every directory along the path (or `ls -ld results`). Another clue is an `ls -l` line of question marks, `-????????? ? ? ?`: the name was read but the file could not be looked up.
:::

::: check
Your nightly campaign job writes 500 files your colleague cannot read; `ls -l` shows them as `-rw-------`. Give the one-line fix that stops it happening tomorrow, and say why `chmod -R 644` on the output tree is the wrong answer.
:::

::: answer
The job runs with `umask 077`, so every file comes out as 666 masked to 600. The fix is to set the mask in the job itself: `umask 027` (team reads, outsiders shut out) or `umask 022`, near the top of the batch script, before any output is written.

`chmod -R 644` is wrong three ways. It is after the fact, so tomorrow repeats the problem. It sets directories to 644, removing their `x` and cutting off everything below. And it strips `x` from every script, with no record of which were programs. To repair an existing tree, use `find ... -type d -exec chmod 755 {} +` and `find ... -type f -exec chmod 644 {} +` separately, or `chmod -R u+rwX,g+rX`.
:::

::: check
`./run_sweep.sh` gives `bash: ./run_sweep.sh: cannot execute: required file not found`, and `ls -l` shows `-rwxr-xr-x`. The file is plainly there. What is actually missing, and what are the two usual causes?
:::

::: answer
The program named on the `#!` line is missing, not the script. The kernel reads the shebang, cannot find that program, and reports "no such file"; the shell's wording makes it sound like the script.

Two usual causes. First, the path is wrong or the program is not installed — `#!/usr/bin/python3` where Python lives at `/usr/local/bin/python3`; `#!/usr/bin/env python3` avoids this by searching `PATH`. Second, Windows line endings, so the path ends in a carriage return. `head -1 run_sweep.sh | cat -A` shows both: the path, and a `^M` if there is one. The exit status is 127 either way, against 126 for a real permission problem.
:::

::: check
Why can you not `chown` your own file to a colleague, when you can `chmod` it to 777 and let her do anything to it anyway?
:::

::: answer
Because ownership is what disk quotas and responsibility are charged to. If you could give a file away, you could dump a hundred gigabytes and bill it to someone else's quota, and nobody could tell who created what. Mode 777 grants access without moving that responsibility: the file still counts against you and names you as owner.

There is a security reason too: handing someone a file you prepared, which then becomes theirs, is a classic step in breaking into their account. So giving files away is reserved for root. Changing the *group* is allowed, but only to one you belong to.
:::

## Summary

| Thing | Meaning | Note |
| --- | --- | --- |
| `-rw-r--r--` | type, then owner / group / others, each `rwx` | one triple is checked, with no fallback |
| 4 / 2 / 1 | read / write / execute | 644 data, 755 script or directory, 600 private, 640 team-readable |
| `r` `w` `x` on a directory | list names / create and delete entries / go through | delete permission comes from the directory, not the file |
| `-????????? ? ? ?` in `ls -l` | the name was readable, the file was not reachable | a parent directory is missing `x` |
| `chmod 640 f` | set all nine bits absolutely | replaces whatever was there |
| `chmod u=rw,go-r f` | edit bits relative to what is there | `u g o a` with `+ - =` |
| `chmod -R ...X` | execute only on directories and already-executable files | the safe recursive form |
| `chmod -R 644 tree` | wipes out the script/data difference | directories lose `x` too |
| `chown u:g`, `chgrp g` | change owner, group | giving a file away is root-only |
| `umask 022` | blocks those bits from 666 (files) and 777 (dirs) | a mask, not a subtraction; inherited by child processes |
| exit 126 vs 127 | found but not runnable vs not found | "required file not found" means the `#!` program is missing |
| `cmd \| sudo tee f` | let the privileged program do the writing | `sudo cmd > f` redirects in your unprivileged shell |

Lesson 04 turns from files to the things that use them: processes, the signals that stop them, and how to keep a six-hour job alive when you close your laptop.

::: context nobody-account An account that owns nothing
Every user on Linux is really a number, the **user ID**. Root is 0. Ordinary people usually start at 1000. The account called `nobody`, number 65534, exists precisely to be *unprivileged*: it owns no files and belongs to no useful groups.

Services that need to run with as little power as possible sometimes run as `nobody`. For testing permissions it is ideal, because anything `nobody` can read, *everyone* can read.
:::

::: context octal Why permissions come in eights
**Octal** means base 8: each digit runs from 0 to 7. Three yes/no bits have exactly $2 \times 2 \times 2 = 8$ combinations, so one group of three permission bits fits one octal digit with nothing wasted.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#6c7a93" text-anchor="middle">
    <text x="68" y="18">owner</text><text x="180" y="18">group</text><text x="292" y="18">others</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1.2">
    <rect x="20" y="26" width="32" height="30" fill="#8fb8f0"/><rect x="52" y="26" width="32" height="30" fill="#8fb8f0"/><rect x="84" y="26" width="32" height="30" fill="#8fb8f0"/>
    <rect x="132" y="26" width="32" height="30" fill="#8fb8f0"/><rect x="164" y="26" width="32" height="30" fill="#fff"/><rect x="196" y="26" width="32" height="30" fill="#8fb8f0"/>
    <rect x="244" y="26" width="32" height="30" fill="#8fb8f0"/><rect x="276" y="26" width="32" height="30" fill="#fff"/><rect x="308" y="26" width="32" height="30" fill="#fff"/>
  </g>
  <g font-size="14" fill="#1f2a44" text-anchor="middle">
    <text x="36" y="46">r</text><text x="68" y="46">w</text><text x="100" y="46">x</text>
    <text x="148" y="46">r</text><text x="180" y="46">-</text><text x="212" y="46">x</text>
    <text x="260" y="46">r</text><text x="292" y="46">-</text><text x="324" y="46">-</text>
  </g>
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="36" y="72">4</text><text x="68" y="72">2</text><text x="100" y="72">1</text>
    <text x="148" y="72">4</text><text x="180" y="72">0</text><text x="212" y="72">1</text>
    <text x="260" y="72">4</text><text x="292" y="72">0</text><text x="324" y="72">0</text>
  </g>
  <g font-size="18" font-weight="700" fill="#1d6fd1" text-anchor="middle">
    <text x="68" y="104">7</text><text x="180" y="104">5</text><text x="292" y="104">4</text>
  </g>
  <text x="180" y="124" font-size="11" text-anchor="middle" fill="#1f2a44">rwxr-xr-- = 754</text>
</svg>
```

Blue boxes are bits that are on. Add each group's values to get its digit: $4 + 2 + 1 = 7$, $4 + 0 + 1 = 5$, $4 + 0 + 0 = 4$.
:::

::: context root-bypass What root can and cannot skip
Root skips the read and write checks on every file, and can go through any directory. That is what lets an administrator repair anything, and why a mistake typed as root can damage anything.

There is one small limit. Root may *run* a file only if at least one of its three execute bits is set. So a script at mode 644 will not run even for root — the kernel takes the missing `x` as a sign that the file is not a program. Root could, of course, add the bit first.
:::

::: context directory-bits A directory is a list
Picture a directory as a sheet of paper with names written on it, each name pointing to a file.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="20" width="130" height="100" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="85" y="14" font-size="11" text-anchor="middle" fill="#6c7a93">directory results/</text>
  <text x="32" y="48" font-size="12" fill="#1f2a44">run_0001.log</text>
  <text x="32" y="74" font-size="12" fill="#1f2a44">run_0002.log</text>
  <text x="32" y="100" font-size="12" fill="#1f2a44">run_0003.log</text>
  <g font-size="12" fill="#1f2a44">
    <text x="176" y="44"><tspan font-weight="700" fill="#1d6fd1">r</tspan>  read the names</text>
    <text x="176" y="74"><tspan font-weight="700" fill="#b4232c">w</tspan>  add, rename, erase names</text>
    <text x="176" y="104"><tspan font-weight="700" fill="#1f2a44">x</tspan>  follow a name to its file</text>
  </g>
</svg>
```

Reading the sheet (`r`) and following a name on it (`x`) are separate permissions. Changing the sheet (`w`) is what creating or deleting a file really is — which is why deletion depends on the directory, not on the file.
:::

::: context exit-126-127 Two numbers worth knowing
When bash cannot run a command at all, it sets a special exit status. **127** means "command not found": no such program in `PATH`, or, as with a bad shebang, a file the kernel needed was missing. **126** means "found, but not executable": the file is there, and the kernel refused to run it.

Programs themselves use 0 for success and small numbers, often 1 or 2, for their own failures. So 126 or 127 in a batch log tells you the job never started, which is a different problem from a job that started and failed.
:::

::: context shebang The two characters at the top of a script
`#!` is read "shebang" (from "hash" and "bang", the programmers' names for `#` and `!`). When the kernel is asked to run a file, it looks at the first two bytes. If they are `#!`, it reads the rest of the line as the path of a program and runs *that* program, handing it the script's name.

So `#!/bin/bash` means "run me with bash", and `#!/usr/bin/env python3` means "find `python3` in `PATH` and run me with it". Nothing else in the file matters until that program starts.
:::

::: context umask-bits The mask, bit by bit
Write the requested mode and the umask as bits, then keep a bit only where the request has a 1 **and** the mask has a 0. Here is a file (666) under umask 027:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44">
    <text x="12" y="30">request 666</text><text x="12" y="62">mask 027</text><text x="12" y="98" font-weight="700">result 640</text>
  </g>
  <g font-family="Courier New, monospace" font-size="16" fill="#1f2a44">
    <text x="120" y="30">110 110 110</text>
    <text x="120" y="62" fill="#b4232c">000 010 111</text>
    <text x="120" y="98" fill="#1d6fd1" font-weight="700">110 100 000</text>
  </g>
  <line x1="116" y1="74" x2="236" y2="74" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="250" y="62" font-size="11" fill="#6c7a93">red 1 = blocked</text>
</svg>
```

Owner: nothing blocked, stays 6. Group: the `w` bit is blocked, 6 becomes 4. Others: everything blocked, 0. Subtraction would have said $666 - 027 = 637$, which is wrong.
:::

::: context sticky-bit The t at the end of /tmp
Everyone may write in `/tmp`, so without a special rule anyone could delete anyone else's files there. The **sticky bit** is that rule. On a directory it means: you may delete or rename an entry only if you own it (or own the directory, or are root).

`ls -ld /tmp` shows `drwxrwxrwt`. The final `t` is the sticky bit sitting where others' `x` would be. In digits it is an extra leading 1, so `/tmp` is mode 1777, and `chmod +t dir` turns it on.
:::

::: context tee-name Named after a pipe fitting
In plumbing, a **T-fitting** splits one pipe into two. `tee` does the same to a stream of data: whatever flows in goes out to its standard output, *and* a copy goes into the file you name.

That makes it useful in two ways. It lets you watch output on screen while also saving it to a log (lesson 05). And because `tee` is the program that opens the file, putting `sudo` in front of it makes the file-writing privileged — which is exactly what the redirection could not do.
:::
