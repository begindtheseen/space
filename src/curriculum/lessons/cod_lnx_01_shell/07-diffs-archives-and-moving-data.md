---
id: l07-diffs-archives-and-moving-data
title: Diffs, archives and moving data between machines
minutes: 20
covers:
  - diff/patch, tar, gzip, zstd, rsync, scp
---

A campaign finishes on the cluster and the results have to come to you; a corrected configuration has to go the other way; and six weeks later someone asks what changed between the two runs. Those three jobs — compare, pack, copy — are the everyday traffic of simulation work, and they are done by six programs that have been stable for decades.

The one that repays learning properly is `rsync`, because it is the difference between re-copying 40 GB every evening and copying the 200 MB that changed. The one that will bite you is `rsync --delete`, which is the same command with a flag that makes a wrong source path destructive. Both are here.

All output below was produced on this machine and pasted verbatim: GNU diffutils 3.10, GNU patch 2.7.6, GNU tar 1.35, gzip 1.12, Zstandard 1.5.5, rsync 3.2.7 and OpenSSH_9.6p1, on Ubuntu 24.04.4. These transcripts were taken as an ordinary user `eng`, and `sim01` is a host alias defined in `~/.ssh/config`, shown below and explained fully in lesson 08. File sizes, timestamps and transfer rates are specific to this machine.

## `diff`: what changed

`diff a b` prints the edits that would turn `a` into `b`.

```bash
diff configs/entry_burn.yaml configs/entry_burn_v2.yaml
```

```text
3,4c3,4
< dt: 0.002
< horizon_s: 18.0
---
> dt: 0.001
> horizon_s: 22.0
5a6
> margin_m: 25.0
```

That is the traditional format: `3,4c3,4` means lines 3–4 of the first file were *changed* into lines 3–4 of the second; `<` marks lines from the first file and `>` from the second; `5a6` means a line was *added* after line 5. The other letter is `d` for deleted.

`diff -u` is the *unified* format, and it is the one everything else speaks — `git diff`, code review tools, `patch`:

```bash
diff -u configs/entry_burn.yaml configs/entry_burn_v2.yaml
```

```text
--- configs/entry_burn.yaml	2026-09-22 20:10:36.755359417 +0000
+++ configs/entry_burn_v2.yaml	2026-09-22 20:10:36.755459182 +0000
@@ -1,5 +1,6 @@
 vehicle: falcon9-s1
 profile: entry-burn
-dt: 0.002
-horizon_s: 18.0
+dt: 0.001
+horizon_s: 22.0
 seed_base: 100000
+margin_m: 25.0
```

Read the pieces: `---` is the original and `+++` the new file, each with its modification time. `@@ -1,5 +1,6 @@` is the *hunk header*: starting at line 1, five lines of the original correspond to six lines of the new. Then each line carries a marker in column one — a space for context, `-` for removed, `+` for added. Unified format is easier to read because the unchanged lines stay in place around the change.

Three flags matter in daily use:

- `-q` reports only whether the files differ, which is what a script wants;
- `-r` compares two directory trees recursively;
- `-w` and `-B` ignore whitespace and blank-line changes, which is how you find the real difference between two runs' outputs when one was written with a different float formatter.

`diff` also uses its exit status as an answer: **0** identical, **1** different, **2** trouble.

```bash
diff -q configs/entry_burn.yaml configs/entry_burn_v2.yaml; echo "exit=$?"
```

```text
Files configs/entry_burn.yaml and configs/entry_burn_v2.yaml differ
exit=1
```

Recursively, it also reports files that exist on only one side:

```bash
diff -r /tmp/da /tmp/db
```

```text
diff -r /tmp/da/entry_burn.yaml /tmp/db/entry_burn.yaml
5a6
> margin_m: 25.0
Only in /tmp/db: new.yaml
```

That is the "did my rerun reproduce the baseline?" check, in one command: `diff -r baseline/ rerun/` and read what comes back. Combined with the process substitution from lesson 05, it also compares the output of two commands directly:

```bash
diff <(head -2 runs/case_0001.log) <(head -2 runs/case_0417.log)
```

```text
1,2c1,2
< 2026-03-14T09:00:00Z INFO  sim start case=0001 seed=545923
< 2026-03-14T09:00:00Z INFO  vehicle=falcon9-s1 profile=entry-burn dt=0.002
---
> 2026-03-14T12:34:56Z INFO  sim start case=0417 seed=105273
> 2026-03-14T12:34:56Z INFO  vehicle=falcon9-s1 profile=entry-burn dt=0.002
```

## `patch`: applying a diff

A unified diff is not only a report; it is an instruction. `patch` reads one and edits the file to match.

```bash
diff -u configs/entry_burn.yaml configs/entry_burn_v2.yaml > cfg.patch
cp configs/entry_burn.yaml target.yaml
patch target.yaml < cfg.patch
```

```text
patching file target.yaml
```

`target.yaml` now holds `dt: 0.001`, `horizon_s: 22.0` and the new `margin_m` line. This is how a fix travels to a machine you cannot push a repository to: a one-kilobyte text file instead of a whole tree.

`patch` keeps track of what it is doing:

```bash
patch target.yaml < cfg.patch
```

```text
patching file target.yaml
Reversed (or previously applied) patch detected!  Assume -R? [n]
Apply anyway? [n]
Skipping patch.
1 out of 1 hunk ignored -- saving rejects to file target.yaml.rej
```

Exit status 1. It noticed the file already looked like the *result*, asked whether you meant to reverse it, took the default no, and wrote the hunks it could not apply to `target.yaml.rej`. Reading a `.rej` file is how you find out which part of a patch failed and why.

`patch -R` reverses a patch deliberately, which is the undo:

```bash
patch -R target.yaml < cfg.patch
```

```text
patching file target.yaml
```

Back to `dt: 0.002`. Two other flags: `-pN` strips N leading path components, because a patch made in one directory layout is usually applied in another (`-p1` is the convention for patches made by `git`), and `--dry-run` reports what would happen without touching anything.

## `tar`: one file out of many

`tar` — tape archive — concatenates a tree into a single stream. It does not compress; it invokes a compressor for you when you ask.

```bash
tar -czf /tmp/campaign.tar.gz runs configs telemetry
ls -l /tmp/campaign.tar.gz
```

```text
-rw-r--r-- 1 eng eng 45813 Sep 22 20:37 /tmp/campaign.tar.gz
```

The flags, which are worth learning as three separate decisions: `-c` create (`-x` extract, `-t` list); `-z` filter through gzip (`-j` bzip2, `--zstd` zstd, nothing for a plain archive); `-f FILE` name the archive, and it must be immediately followed by the filename.

**Always list before extracting.** An archive can contain anything, including a top-level directory you did not expect or paths that unpack all over your home directory:

```bash
tar -tzf /tmp/campaign.tar.gz | head -4
```

```text
runs/
runs/case_0500.log
runs/case_0499.log
runs/case_0498.log
```

This one is well behaved: everything is under directories it created. `-C DIR` extracts into a chosen directory, and naming a member extracts just that one:

```bash
tar -xzf /tmp/campaign.tar.gz -C /tmp/unpack configs/entry_burn.yaml
```

::: warning
`tar` strips a leading `/` and tells you so, because an archive of absolute paths would overwrite system files on extraction:

```bash
tar -czf /tmp/abs.tar.gz /home/eng/campaign/configs
```

```text
tar: Removing leading `/' from member names
```

```bash
tar -tzf /tmp/abs.tar.gz | head -3
```

```text
home/eng/campaign/configs/
home/eng/campaign/configs/entry_burn_v2.yaml
home/eng/campaign/configs/entry_burn.yaml
```

The members are now *relative*, so extracting in `/tmp` creates `/tmp/home/eng/campaign/configs/` — almost certainly not what you wanted. Archive from the right directory instead: `tar -czf out.tar.gz -C /home/eng campaign/configs` gives members starting at `campaign/`, which unpack where you expect.
:::

## `gzip` and `zstd`

Compression on its own, for a single file.

```bash
ls -l /tmp/t.csv /tmp/t.csv.gz
```

```text
-rw-r--r-- 1 eng eng 7497 Sep 22 20:37 /tmp/t.csv
-rw-r--r-- 1 eng eng 3099 Sep 22 20:37 /tmp/t.csv.gz
```

`gzip file` replaces the file with `file.gz` — the original is gone unless you pass `-k` to keep it, which is the surprise the first time. `gunzip` reverses it, and `zcat`/`zgrep`/`zless` read a compressed file without unpacking it:

```bash
zgrep -c , /tmp/t.csv.gz
```

```text
202
```

That matters more than it sounds. A directory of 10,000 compressed run logs can be searched in place with `zgrep` — no temporary files, no disk space, no unpacking step to forget to clean up.

`zstd` is the modern alternative: comparable ratios at much higher speed, with a compression level you can turn up when the archive is being kept rather than moved.

```bash
ls -l /tmp/t.csv.zst /tmp/t19.csv.zst
```

```text
-rw-r--r-- 1 eng eng 3149 Sep 22 20:37 /tmp/t.csv.zst
-rw-r--r-- 1 eng eng 2524 Sep 22 20:37 /tmp/t19.csv.zst
```

Default level gave 3149 bytes, barely different from gzip's 3099; level 19 gave 2524, twenty per cent smaller than either, at a large cost in compression time and none in decompression. On the whole campaign the gap is clearer:

```bash
ls -l /tmp/campaign.tar.gz /tmp/campaign.tar.zst
```

```text
-rw-r--r-- 1 eng eng 45813 Sep 22 20:37 /tmp/campaign.tar.gz
-rw-r--r-- 1 eng eng 39131 Sep 22 20:37 /tmp/campaign.tar.zst
```

`zstdcat` is the counterpart to `zcat`, and `tar --zstd` uses it as a filter, exactly like `-z`.

The rule of thumb: **gzip when the recipient's tooling matters** — it is on every machine ever built, and every language has a reader — and **zstd when throughput matters**, which is nightly archives of telemetry and anything large moving over a network.

## `scp`: copy a file over SSH

`scp` has `cp`'s shape with `host:path` allowed on either side.

```bash
cat ~/.ssh/config
```

```text
Host sim01
    HostName 127.0.0.1
    Port 2222
    User root
    IdentityFile ~/.ssh/id_ed25519
```

That alias is what makes the rest readable; lesson 08 builds it. With it in place:

```bash
scp configs/entry_burn.yaml sim01:/srv/campaign/
ssh sim01 "ls -l /srv/campaign"
```

```text
total 4
-rw-r--r-- 1 root root 84 Sep 22 20:39 entry_burn.yaml
```

`-r` recurses, and either side may be remote:

```bash
scp sim01:/srv/campaign/entry_burn.yaml /tmp/back.yaml
```

`scp` is fine for one file. It has no notion of what is already there, so it re-sends everything every time, and it has no resume. For anything bigger than "one config, once", use `rsync`.

## `rsync`: copy only what changed

```bash
rsync -a runs/ sim01:/srv/campaign/runs/
ssh sim01 "ls /srv/campaign/runs | wc -l"
```

```text
500
```

`-a` is *archive* mode: recurse, and preserve times, permissions, symlinks and ownership where it can. It is the flag you will use every time. `-v` makes it talk, `-z` compresses in flight, `-P` shows progress and allows resuming a partial file, and `-n` is a dry run.

The point of `rsync` is the second invocation. Run the identical command again, with statistics:

```bash
rsync -av --stats runs/ sim01:/srv/campaign/runs/ | tail -6
```

```text
Number of regular files transferred: 0
Total file size: 314,819 bytes
Total transferred file size: 0 bytes

sent 8,617 bytes  received 12 bytes  17,258.00 bytes/sec
total size is 314,819  speedup is 36.48
```

Zero files transferred. It sent 8.6 kB of file list and metadata to establish that 315 kB of logs were already identical. Now change exactly one file and repeat:

```bash
touch runs/case_0001.log
rsync -av runs/ sim01:/srv/campaign/runs/
```

```text
sending incremental file list
case_0001.log

sent 8,668 bytes  received 41 bytes  17,418.00 bytes/sec
total size is 314,819  speedup is 36.15
```

One name in the list: the one whose timestamp changed. By default `rsync` decides with a *quick check* — same size and same modification time means "same file", no content read at all. `-c` makes it checksum instead, which is slower and correct even when timestamps lie, as they do across filesystems with different clock resolutions.

Scale that up and you have the nightly workflow: a campaign directory that grows by 200 MB a day, mirrored to your workstation in the time it takes to transfer 200 MB, however large the directory has become.

::: example The trailing slash, which is not a typo
This is the one piece of `rsync` syntax everybody gets wrong once.

```bash
rsync -a runs/ sim01:/srv/campaign/runs/
```

sends the *contents* of `runs` into the destination directory. Without the trailing slash on the source:

```bash
rsync -a runs sim01:/srv/campaign/nested/
ssh sim01 "ls /srv/campaign/nested"
```

```text
runs
```

it sends the *directory itself*, creating `/srv/campaign/nested/runs/`. A trailing slash on the source means "the things in here"; no trailing slash means "this thing". The destination's trailing slash makes no difference at all.

The failure this produces is `campaign/runs/runs/case_0001.log` — a nested duplicate that the next night's sync dutifully keeps up to date, and that you find weeks later when the disk fills. Say the command out loud before running it: "contents of runs, into runs".
:::

::: example `--delete`, and the dry run that saves you
`--delete` removes files from the destination that no longer exist in the source, which is what makes a mirror a mirror. It also means the source path decides what survives.

Here is the command with the *wrong* source — `configs/` instead of `runs/` — run with `-n` so that nothing actually happens:

```bash
rsync -avn --delete configs/ sim01:/srv/campaign/runs/
```

```text
sending incremental file list
deleting case_0500.log
deleting case_0499.log
deleting case_0498.log
deleting case_0497.log
deleting case_0496.log
deleting case_0495.log
deleting case_0494.log
```

It lists 500 deletions, because `configs/` does not contain any of those names, so by `--delete`'s rules they are stale. Without the `-n` this would have removed an entire campaign from the server and reported success.

The discipline is fixed and not negotiable: **run `--delete` with `-n` first, read the deletion list, then run it for real.** The second guard is `--max-delete=N`, which aborts the whole run rather than exceeding N removals:

```bash
rsync -avn --delete --max-delete=5 configs/ sim01:/srv/campaign/runs/
```

```text
rsync error: the --max-delete limit stopped deletions (code 25) at main.c(1356) [sender=3.2.7]
```

Exit code 25, and a job that has visibly failed instead of one that has quietly succeeded at the wrong thing. Set it to a number you would never legitimately exceed and put it in the script, not in your memory.
:::

::: key
`diff -u` is the format everything speaks; exit status 0 same, 1 different, 2 error. `tar -czf` creates, `-tzf` lists, `-xzf` extracts, and `-f` must be last among the clustered flags. `gzip` replaces the file unless you pass `-k`. `rsync -a` preserves metadata and transfers only what changed; a trailing slash on the source means "the contents of"; `--delete` is only safe after `-n`.
:::

## Check yourself

::: check
`rsync -av /data/campaign /backup/campaign/` run nightly produces `/backup/campaign/campaign/` after the first night, and keeps it updated. What is the single-character fix, and what should you do about the directory that is already there?
:::

::: answer
Add a trailing slash to the source: `rsync -av /data/campaign/ /backup/campaign/`. Without it, `rsync` copies the directory `campaign` *as an entry* into the destination, so it lands inside the destination directory that is also called `campaign`. With it, it copies the directory's contents.

For the one already there: do not fix it with `--delete` on the corrected command as your first move, because if you get the source path wrong you will delete the good copy. Check first with `diff -r /data/campaign /backup/campaign/campaign` to confirm the nested copy is what you think it is, then `rm -r /backup/campaign/campaign` explicitly, then run the corrected sync. Verify with a dry run — `rsync -avn /data/campaign/ /backup/campaign/` should report nothing to transfer once the first real run completes.
:::

::: check
A colleague sends `fix.patch`, made with `diff -u` in her checkout at `/home/ana/sim/src/`. You are in `/opt/sim/src/`. `patch < fix.patch` says it cannot find the file. What is happening and which flag fixes it?
:::

::: answer
The `---` and `+++` lines in the patch carry the paths as she saw them, so `patch` is looking for something like `home/ana/sim/src/guidance.cpp` relative to your current directory. It does not exist.

`-pN` strips N leading path components from those names before looking. `-p1` removes the first component, `-p4` removes four, and so on; the right N is however many levels of her layout you need to drop to be left with the path as it exists under your directory. `patch -p1 < fix.patch` is the conventional value because `git`-generated patches prefix paths with `a/` and `b/`, exactly one component to strip.

Run `patch --dry-run -p1 < fix.patch` first. It reports what would be applied and what would be rejected, and changes nothing.
:::

::: check
You need to send 40 GB of telemetry from the cluster to your laptop over a connection that drops every few hours. Compare `scp`, `tar` piped over `ssh`, and `rsync`, and say what you would run.
:::

::: answer
`scp` transfers the whole set every time and has no resume: a drop at 39 GB means starting again. `tar czf - dir | ssh host 'tar xzf -'` streams and compresses, which is efficient for a first copy, but it is also all-or-nothing — a drop leaves a truncated stream and you start again.

`rsync` is the answer, because it is restartable by construction. `rsync -avzP --partial telemetry/ laptop:/data/telemetry/` — `-a` preserves metadata, `-z` compresses in flight, `-P` combines `--progress` with `--partial` so an interrupted file keeps its partial contents and resumes from there, and re-running after a drop transfers only what is still missing. On the second and later attempts the file-list exchange costs a few seconds and the transfer picks up where it stopped.

Two refinements: `--bwlimit=20000` if you must not saturate the link, and `--append-verify` for very large single files that only ever grow. Run the whole thing inside `tmux` on the cluster so the transfer itself does not die with your connection.
:::

::: check
Why does `tar` refuse to store absolute paths, and what goes wrong if you archive `/home/eng/campaign/configs` and extract the result in `/tmp`?
:::

::: answer
It strips the leading `/` — printing `tar: Removing leading '/' from member names` — so that extracting an archive cannot overwrite arbitrary system files. An archive containing `/etc/passwd` as a member would otherwise replace the real one on any machine where someone unpacked it as root.

The consequence is that the members become relative to wherever you extract: `home/eng/campaign/configs/entry_burn.yaml`. Extracted in `/tmp`, that creates `/tmp/home/eng/campaign/configs/`, four directories deeper than you meant, and nothing lands where you expected. The fix is to archive from the right place rather than to fight the stripping: `tar -czf out.tar.gz -C /home/eng campaign/configs` changes to `/home/eng` first, so the members begin at `campaign/` and unpack sensibly anywhere.
:::

::: check
When would you choose `gzip` over `zstd` for a nightly archive of 60 GB of simulation logs, and when the other way round?
:::

::: answer
Choose `zstd` for the nightly archive itself. It compresses several times faster at a similar ratio, and turning the level up — `-19` — buys a further reduction that costs compression time only, since decompression speed is roughly level-independent. For 60 GB written every night and read rarely, that is the right trade, and `tar --zstd` makes it a one-flag change.

Choose `gzip` when the recipient is the constraint. It is present on every Unix machine including ancient ones, every language's standard library reads it, and every analysis tool that accepts "a compressed file" accepts `.gz`. If the archive goes to a partner organisation, into a long-term store you will not control, or to a machine where you cannot install software, the compatibility is worth more than the speed.

In both cases compress the *tar*, not each file: one archive of many small logs compresses far better than many small archives, because the compressor sees repeated structure across files.
:::

## Summary

| Command | Does | Note |
| --- | --- | --- |
| `diff a b` | traditional format: `3,4c3,4`, `<`, `>` | exit 0 same, 1 different, 2 error |
| `diff -u` | unified: `@@ -1,5 +1,6 @@`, `-`/`+`/space | the format `patch` and `git` speak |
| `diff -q` / `-r` / `-w` | differ or not / whole trees / ignore whitespace | `diff -r baseline/ rerun/` is the reproducibility check |
| `patch f < p`, `-R`, `-pN`, `--dry-run` | apply, reverse, strip path components, rehearse | failures land in `f.rej` |
| `tar -czf a.tgz dir` | create, gzip, named file | `-f` immediately before the filename |
| `tar -tzf` / `-xzf` / `-C dir` | list / extract / extract into | **list before extracting** |
| `tar: Removing leading '/'` | absolute paths become relative | archive with `-C` from the right directory |
| `gzip`, `gunzip`, `-k` | compress in place, restore, keep the original | without `-k` the original is gone |
| `zcat`, `zgrep`, `zless`, `zstdcat` | read compressed files without unpacking | search 10,000 logs in place |
| `zstd`, `-19`, `tar --zstd` | faster, denser than gzip | gzip for compatibility, zstd for throughput |
| `scp f host:path`, `-r` | one-shot copy over SSH | no incremental, no resume |
| `rsync -a` | recurse and preserve metadata | quick check is size + mtime; `-c` checksums |
| `rsync -avzP` | verbose, compressed, progress and resumable | the flag set for a big transfer over a flaky link |
| trailing `/` on the source | "the contents of" vs "this directory" | the cause of `campaign/campaign/` |
| `rsync --delete` | make the destination a mirror | `-n` first, every time; `--max-delete=N` as a guard |

Lesson 08 is the layer all of this sits on: SSH keys, the `~/.ssh/config` that turned a host, a port and an identity file into the single word `sim01`, agent forwarding and port forwarding.
