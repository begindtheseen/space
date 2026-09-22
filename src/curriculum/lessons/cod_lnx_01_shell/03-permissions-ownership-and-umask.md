---
id: l03-permissions-ownership-and-umask
title: Permissions, ownership and umask
minutes: 22
covers:
  - 'Permissions: chmod octal and symbolic, chown, umask'
---

The permissions column is the first thing in an `ls -l` line and the last thing most people learn to read. That is backwards, because on a shared analysis box it decides whether your campaign results are readable by the team, whether your build script will run, and whether the nightly job that writes into your directory can actually write into it. "Permission denied" is the most common error in this whole module, and it always has a mechanical explanation.

This lesson covers the three-by-three grid of bits, both spellings of `chmod`, what `chown` can and cannot do, and the `umask` that silently decides what every new file gets. The rules are small and exact; the only reason they feel slippery is that the same bit means something different on a directory than on a file.

All output below was produced on this machine and pasted verbatim: Ubuntu 24.04.4 LTS, GNU coreutils 9.4, GNU bash 5.2.21. The privileged half of each demonstration ran as `root` and the unprivileged half as the standard `nobody` account (uid 65534), because root bypasses these checks entirely and a demonstration that never fails teaches nothing. Owner and group names in your own listings will be yours.

## Nine bits, three triples

```bash
ls -l configs/entry_burn.yaml
```

```text
-rw-r--r-- 1 root root 84 Sep 22 20:10 configs/entry_burn.yaml
```

The ten characters break up as one plus three plus three plus three:

- character 1 is the **type**: `-` regular file, `d` directory, `l` symbolic link, `c` or `b` a device, `s` a socket, `p` a named pipe.
- characters 2–4 are what the **owning user** may do;
- characters 5–7 are what members of the **owning group** may do;
- characters 8–10 are what **everyone else** may do.

Within each triple the order is always `r`, `w`, `x`, and a dash means the bit is off. So `-rw-r--r--` is: a regular file; the owner may read and write; the group may read; others may read.

Each triple is three bits, which is one octal digit, with **read = 4, write = 2, execute = 1**. Add them:

| Digit | Bits | Meaning |
| --- | --- | --- |
| 7 | `rwx` | read, write, execute |
| 6 | `rw-` | read, write |
| 5 | `r-x` | read, execute |
| 4 | `r--` | read |
| 0 | `---` | nothing |

`-rw-r--r--` is therefore 644, and `stat` will tell you both forms at once:

```bash
stat -c "%A %a %U %G %n" configs/entry_burn.yaml configs
```

```text
-rw-r--r-- 644 root root configs/entry_burn.yaml
drwxr-xr-x 755 root root configs
```

The kernel checks exactly one triple. If you are the owner, it uses the owner triple and stops — it does not fall back to the group triple. So a file with mode 466 (`r--rw-rw-`) is *unwritable by its owner* and writable by everybody else, which is a fine way to lock yourself out.

::: warning
Root ignores all of this. The same command that failed for an ordinary user succeeds silently for root, which is why testing permissions from a root shell tells you nothing:

```bash
id -u
cat tree/a.log
```

```text
0
x
```

Every file in `tree` was mode 644 at that point, including the directories — no execute bit, so no traversal. As `nobody`, the same read fails:

```text
cat: /home/eng/perm3/tree/a.log: Permission denied
```

When you are checking that a deployment is readable by the service account, check *as* the service account.
:::

## The bits mean different things on a directory

This is the part that catches people, and it is worth stating flatly. On a directory:

- **`r`** means you may *list the names* in it.
- **`w`** means you may *create, rename and delete entries* in it. Note what that implies: the right to delete a file comes from the directory's mode, not the file's. A read-only file in a writable directory can be removed.
- **`x`** means you may *traverse* it — resolve a path through it and reach what is inside. Without `x` on a directory, nothing below it is reachable, whatever the modes down there say.

The two halves come apart cleanly. A directory with `r` but no `x` lets you see the names and nothing else:

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

Both run as `nobody` against a directory whose mode is 644. `ls` could read the directory itself — that is the `r` bit — so it knows the name `d.txt`. To fill in the size, owner and mode it must `stat` the file, which means resolving a path *through* the directory, which needs `x`. Every field it could not obtain is printed as a question mark. That row of question marks is the signature of a missing execute bit on a parent directory, and once you have seen it you will never misdiagnose it again.

The reverse — `x` but no `r` — is a real pattern, not a curiosity: you cannot list the directory, but you can open a file in it if you already know its name. Home directories are often mode 711 for exactly this reason.

```bash
ls /home/eng/perm/vault
```

```text
ls: cannot open directory '/home/eng/perm/vault': Permission denied
```

That is mode 700 as seen by `nobody`: no bits at all, so neither listing nor traversal.

## `chmod`, octal

`chmod <octal> <files>` sets all nine bits at once. It is absolute: whatever was there is replaced.

```bash
chmod 640 configs/entry_burn.yaml; ls -l configs/entry_burn.yaml
chmod 754 configs/entry_burn.yaml; ls -l configs/entry_burn.yaml
```

```text
-rw-r----- 1 root root 84 Sep 22 20:10 configs/entry_burn.yaml
-rwxr-xr-- 1 root root 84 Sep 22 20:10 configs/entry_burn.yaml
```

640 is `rw-` `r--` `---`: the owner reads and writes, the group reads, others get nothing. That is the right mode for a file with anything sensitive in it on a shared machine. 754 is `rwx` `r-x` `r--`: owner everything, group read and execute, others read only.

The four you will actually type: **644** for a data file, **755** for a script or a directory, **600** for a private file, **640** for a file the team may read and only you may change.

## `chmod`, symbolic

The symbolic form changes bits relative to what is there. It is `who` `op` `what`, where `who` is any of `u` (user/owner), `g` (group), `o` (others), `a` (all), and `op` is `+` to add, `-` to remove, `=` to set exactly.

```bash
chmod u=rw,g=r,o= configs/entry_burn.yaml; ls -l configs/entry_burn.yaml
chmod a+r configs/entry_burn.yaml;          ls -l configs/entry_burn.yaml
chmod go-r configs/entry_burn.yaml;         stat -c "%A %a %n" configs/entry_burn.yaml
```

```text
-rw-r----- 1 root root 84 Sep 22 20:10 configs/entry_burn.yaml
-rw-r--r-- 1 root root 84 Sep 22 20:10 configs/entry_burn.yaml
-rw------- 600 configs/entry_burn.yaml
```

`u=rw,g=r,o=` reproduced 640 without arithmetic. `a+r` added read for everyone. `go-r` took it away from group and others, leaving 600. The symbolic form is what you want when you mean "add this one capability and leave the rest alone" — most often `chmod +x script.sh`.

::: key
Octal sets all nine bits absolutely: read 4, write 2, execute 1, in the order owner, group, others. Symbolic edits bits relative to what is there: `u g o a` with `+ - =`. On a directory, `r` lists names, `w` creates and deletes entries, `x` traverses. The kernel checks one triple — owner, else group, else other — and does not fall back.
:::

## The execute bit, and two error messages

A script without the execute bit cannot be run by name, however correct it is:

```bash
./sweep.sh a b c
```

```text
bash: ./sweep.sh: Permission denied
```

Exit status 126 — "found, but could not be executed". Compare with 127, "not found at all". The two are worth telling apart in a script that checks `$?`.

The file is still perfectly readable, so you can hand it to an interpreter explicitly. This works with no execute bit at all, and it is how you run someone else's script out of a read-only checkout:

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

`chmod +x` with no `who` is `a+x` as filtered by your `umask`; on a default umask of 022 that gives 755.

::: warning
This message is not about permissions at all, despite appearances:

```bash
./bad.py
```

```text
bash: ./bad.py: cannot execute: required file not found
```

Exit status 127. The execute bit is set; what is missing is the *interpreter* named on the `#!` line — the file says `#!/usr/bin/pythn3`, with a typo. The kernel reports `ENOENT` for the interpreter, and the shell renders it as a message that reads like the script is missing. Whenever "cannot execute" arrives for a file you can plainly see, read the first line of it: `head -1 bad.py`. The same message appears when a script has Windows line endings, because the interpreter path then ends in an invisible carriage return.
:::

A script with the execute bit and *no* `#!` line is not an error: the shell falls back to running it with itself.

## `chown` and `chgrp`

`chown` changes the owning user, `chgrp` the owning group, and `chown user:group` does both.

```bash
chown 65534:65534 tree/a.log; ls -l tree/a.log
chown root:root   tree/a.log; ls -l tree/a.log
chgrp 65534       tree/a.log; ls -l tree/a.log
```

```text
-rw-r--r-- 1 nobody nogroup 2 Sep 22 20:19 tree/a.log
-rw-r--r-- 1 root root 2 Sep 22 20:19 tree/a.log
-rw-r--r-- 1 root nogroup 2 Sep 22 20:19 tree/a.log
```

Names and numbers are interchangeable; `ls` resolves the numbers through `/etc/passwd` and `/etc/group` for display, which is why a file copied from another machine sometimes shows a bare number — the uid exists, the name does not.

The rule that surprises people: **only root may give a file away**. An ordinary user cannot `chown` their own file to someone else, because that would let anyone dodge a disk quota or plant a file in another account. You can change the *group* of your own file, but only to a group you are a member of. Both operations above needed root.

`chown -R` walks a tree, and `chown --reference=other_file` copies ownership from an existing file, which is the safe way to make a new file match its neighbours.

## `umask`: what a new file gets

You never choose the mode of a file you create with `>` or `touch`. The program asks for a mode, and the kernel subtracts your **umask** from it. The requested mode is 666 for files and 777 for directories; note that 666 has no execute bit, which is why a newly created file is never executable no matter what your umask is.

```bash
umask
touch /tmp/p1.txt; mkdir -p /tmp/p1dir; stat -c "%a %n" /tmp/p1.txt /tmp/p1dir
```

```text
0022
644 /tmp/p1.txt
755 /tmp/p1dir
```

666 with 022 masked off is 644; 777 with 022 masked off is 755. The mask is a mask, not a subtraction — each bit set in the umask is cleared in the result — but on the usual values the arithmetic looks like subtraction.

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

`umask 077` is the private setting: nothing you create is visible to anyone else. `umask 002` is the collaborative setting used on shared project directories, where files come out group-writable so your teammates can edit the campaign outputs you generate. `umask 022`, the default, is in between.

`umask` is a property of the *process*, inherited by children. Set it in `~/.bashrc` and it applies to your interactive shells; set it at the top of a batch script and it applies to everything that script produces. This matters more than it sounds: a nightly Monte Carlo that runs with `umask 077` produces 500 output files nobody else can read, and the fix is one line in the job script rather than a `chmod -R` afterwards.

::: example Making a campaign directory the team can actually use
The requirement: everyone in the group may read the results and add new runs; nobody outside may read anything; the analysis scripts stay executable.

```bash
chmod 750 campaign
chmod -R u+rwX,g+rX,o-rwx campaign
chmod 755 campaign/bin/sweep.sh
```

Read the middle line carefully. Capital `X` adds the execute bit **only to directories and to files that already have execute set for somebody**. That is exactly what you want when recursing over a mixed tree: directories become traversable, scripts stay runnable, and the 500 log files stay non-executable.

Lower-case `x` does not discriminate:

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

`tree/a.log` is a log file and is now marked executable. Nothing breaks immediately, which is the problem: it is wrong, it will be committed, and someone will eventually ask why the repository is full of executable text.

Then set the umask so it stays that way for everything created later:

```bash
umask 027
```

666 masked by 027 gives 640, and 777 gives 750 — team-readable, world-excluded, automatically, for every file the campaign writes from then on.
:::

::: example `chmod -R 644` on a tree, and why `X` cannot fully undo it
The classic accident is octal `chmod -R` applied to a directory tree. Everything below was done inside a throwaway directory, `/home/eng/perm3/tree`, containing one log file, one script and one subdirectory.

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

The directories are now 644 — readable, not traversable. As `nobody`, listing still works and reading does not:

```text
a.log
run.sh
sub
```

```text
cat: /home/eng/perm3/tree/a.log: Permission denied
```

That is the mode-644-directory failure again: the names are readable, the contents are unreachable. Now the repair:

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

The directories are traversable again and the data file is correct — but `tree/run.sh` is 644, and it was 755 before the accident. `X` adds execute only where execute already exists *somewhere*, and the first `chmod -R` erased that information from every file at once. Nothing in the filesystem now records that `run.sh` was a program. This is why the dangerous form is `chmod -R <octal>`: it is not that it fails, it is that it destroys the distinction between a script and a log and there is nothing to restore it from. Set modes on directories and files separately — `find tree -type d -exec chmod 755 {} +` and `find tree -type f -exec chmod 644 {} +` — and re-mark the scripts by name.
:::

## Why `sudo command > file` does not do what you expect

A flashcard's worth of mechanism. When you type `sudo echo hello > /root/f`, three things happen in this order: your shell parses the line; your shell opens `/root/f` for writing; your shell runs `sudo`. The redirection is performed by the shell you are sitting in, which is unprivileged, and it happens *before* `sudo` exists. So the open fails.

Demonstrated here with an unprivileged uid rather than with `sudo`, because the shell in this container is already root and a root shell cannot fail this way. `rootonly` is a directory that `nobody` may not write to:

```bash
echo hello > /home/eng/perm/rootonly/f.txt
```

```text
bash: line 1: /home/eng/perm/rootonly/f.txt: Permission denied
```

The error names the shell, not `echo` — that is the tell. The fix is to make the *writing program* the privileged one:

```bash
echo hello | tee rootonly/f.txt
```

```text
hello
```

`tee` copies its input to a file and to standard output, so `| sudo tee file` writes with privilege, and `| sudo tee -a file` appends. For anything more involved, hand the whole line to a privileged shell: `sudo sh -c 'echo hello > /root/f'`, where the shell doing the redirection is the one `sudo` started.

## Check yourself

::: check
`chmod 754 flight_report.csv` — write out the resulting `ls -l` string, and say who can delete the file.
:::

::: answer
7 is `rwx`, 5 is `r-x`, 4 is `r--`, so the string is `-rwxr-xr--`. Type `-` for a regular file, then owner `rwx`, group `r-x`, others `r--`.

Who can delete it is a trick question, and the answer is: nobody can tell from that line. Deleting a file means removing a name from a directory, so the permission that matters is `w` on the *containing directory*, not anything on the file. Anyone with write permission on the directory can delete the file even though its own mode says read-only — and the owner cannot delete it if the directory denies them write. (The sticky bit, `chmod +t`, is the exception that makes `/tmp` safe: in a sticky directory you may only delete entries you own.)
:::

::: check
An ordinary user runs `ls -l results/` and gets a full listing, but `cat results/run_0001.log` says "Permission denied" even though the file is mode 644 and she is in the owning group. What is the likeliest cause, and which single command would confirm it?
:::

::: answer
A parent directory is missing its execute bit for her. `r` on `results/` is enough for `ls` to read the names, but opening a file inside requires traversing the directory, which needs `x`. The file's own 644 never gets consulted.

Confirm with `namei -l results/run_0001.log`, which prints the mode of every component of the path, or with `ls -ld results` and `ls -ld .` to look at the directories themselves rather than their contents. The other signature to look for is a `ls -l` line full of question marks — `-????????? ? ? ?` — which means `ls` read the name but could not `stat` the file.
:::

::: check
Your nightly campaign job writes 500 files that your colleague cannot read. `ls -l` shows them as `-rw-------`. Give the one-line fix that prevents it happening again tomorrow, and explain why `chmod -R 644` on the output tree is the wrong answer.
:::

::: answer
The job is running with `umask 077`, so every file it creates is 666 masked down to 600. The fix is to set the mask in the job itself: `umask 027` (team reads, world excluded) or `umask 022` near the top of the batch script, before any output is created. That is one line and it applies to every file the job writes from then on.

`chmod -R 644` is wrong for three reasons. It is after the fact, so tomorrow's run repeats the problem. It sets directories to 644 as well, which removes their execute bit and makes everything below them unreachable. And it strips the execute bit from any script in the tree, with nothing left to record which files were programs. If you must repair an existing tree, use `find ... -type d -exec chmod 755 {} +` and `find ... -type f -exec chmod 644 {} +` separately, or `chmod -R u+rwX,g+rX`.
:::

::: check
`./run_sweep.sh` gives `bash: ./run_sweep.sh: cannot execute: required file not found`, and `ls -l` shows `-rwxr-xr-x`. The file is obviously there. What is actually missing, and what are the two usual causes?
:::

::: answer
The interpreter on the `#!` line is missing, not the script. The kernel tries to execute the file, reads the shebang, fails to find the program it names, and returns `ENOENT`; the shell reports that in wording that sounds like it is about the script.

Two usual causes. First, the path is simply wrong or the interpreter is not installed — `#!/usr/bin/python3` on a machine where Python lives at `/usr/local/bin/python3`; `#!/usr/bin/env python3` avoids this by searching `PATH`. Second, the file has Windows line endings, so the interpreter path the kernel reads is `/usr/bin/python3\r`, which does not exist. `head -1 run_sweep.sh | cat -A` shows both cases at once: it prints the interpreter and shows a `^M` if one is there. Exit status is 127 either way, against 126 for a genuine permission problem.
:::

::: check
Why can you not `chown` your own file to a colleague, when you can `chmod` it to 777 and let her do anything to it anyway?
:::

::: answer
Because ownership is what disk quotas and accountability are charged against. If you could give a file away, you could dump a hundred gigabytes into a directory and then assign it to someone else's quota, and an auditor could no longer tell who created what. Mode 777 grants access without moving that liability: the file still counts against you and still records you as its creator.

There is a second reason on systems with setuid binaries: being able to hand someone a file you had prepared, which then becomes theirs, is a classic privilege-escalation step. So `chown` to another user is reserved for root. Changing the *group* is allowed, but only to a group you belong to.
:::

## Summary

| Thing | Meaning | Note |
| --- | --- | --- |
| `-rw-r--r--` | type, then owner / group / others, each `rwx` | one triple is checked, with no fallback |
| 4 / 2 / 1 | read / write / execute | 644 data, 755 script or directory, 600 private, 640 team-readable |
| `r` `w` `x` on a directory | list names / create and delete entries / traverse | delete permission comes from the directory, not the file |
| `-????????? ? ? ?` in `ls -l` | the name was readable, the file was not `stat`-able | a parent directory is missing `x` |
| `chmod 640 f` | set all nine bits absolutely | replaces whatever was there |
| `chmod u=rw,go-r f` | edit bits relative to what is there | `u g o a` with `+ - =` |
| `chmod -R ...X` | execute only on directories and already-executable files | the safe recursive form |
| `chmod -R 644 tree` | destroys the script/data distinction | directories lose `x` as well |
| `chown u:g`, `chgrp g` | change owner, group | giving a file away is root-only |
| `umask 022` | clears those bits from 666 (files) and 777 (dirs) | inherited by child processes; set it in the job script |
| exit 126 vs 127 | found but not executable vs not found | `cannot execute: required file not found` means the *interpreter* is missing |
| `cmd \| sudo tee f` | let the privileged program do the writing | `sudo cmd > f` redirects in your unprivileged shell |

Lesson 04 moves from files to the things that use them: processes, the signals that stop them, and how to keep a six-hour job alive when you close the lid of your laptop.
