---
id: l07-diffs-archives-and-moving-data
title: Diffs, archives and moving data between machines
minutes: 22
covers:
  - diff/patch, tar, gzip, zstd, rsync, scp
---

Think about moving house. You make a list of what changed since last time. You pack many small things into a few boxes. You squash the boxes down so they fit in the truck. Then you drive the truck, and next time you only move what is new. Simulation work has exactly the same four chores: **compare** two sets of files, **pack** many files into one, **squash** it smaller, and **copy** it to another machine.

Results come back from the cluster; a corrected configuration goes out; weeks later someone asks what changed between two runs. Six programs, stable for decades, do all of this: `diff` and `patch` compare, `tar` packs, `gzip` and `zstd` squash, and `scp` and `rsync` copy.

The one that pays you back most is `rsync`: it copies the 200 MB that changed instead of all 40 GB every evening. The one that will bite you is `rsync --delete`, where one wrong path means lost data. Both are here.

All output below is real, pasted as it came out (GNU diffutils 3.10, patch 2.7.6, tar 1.35, gzip 1.12, Zstandard 1.5.5, rsync 3.2.7, OpenSSH 9.6p1, Ubuntu 24.04), run by an ordinary user `eng`. `sim01` is a short name for a server, set up in `~/.ssh/config` — read `~` aloud as "home". Lesson 08 builds that file. Sizes and speeds will differ on your machine.

## `diff`: what changed

Imagine two copies of a recipe, one edited by a friend. The list of exactly which lines changed is a **diff**. `diff a b` prints the edits that would turn file `a` into file `b`.

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

This is the **traditional format**. Read it line by line:

- `3,4c3,4` says lines 3 to 4 of the first file were **c**hanged into lines 3 to 4 of the second.
- `<` (read "from the left") marks a line from the first file. `>` ("from the right") marks a line from the second.
- `5a6` says a line was **a**dded after line 5, and it becomes line 6.
- The third letter you will meet is `d`, for **d**eleted.

### The unified format

`diff -u` prints the **unified format** — the one that everything else speaks: `git diff`, code-review tools, and `patch`.

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

Take it apart piece by piece:

- `---` names the original file and `+++` the new one, each with its last-modified time.
- `@@ -1,5 +1,6 @@` is the **[[hunk header|hunk-header]]**. A **hunk** is one block of changes. This header says: starting at line 1, five lines of the original match six lines of the new file.
- Every line after it starts with a marker in the first column: a space for an unchanged **context** line, `-` for a removed line, `+` for an added one.

### Flags and exit status

Three flags matter daily:

- `-q` ("quiet") says only *whether* the files differ, which is what a script wants.
- `-r` ("recursive") compares two whole directory trees.
- `-w` ignores changes in spaces, and `-B` ignores blank-line changes. That is how you find the real difference between two runs' outputs when one was printed with a different number formatter.

`diff` also answers with its **[[exit status|diff-exit-status]]**, the number every program hands back when it finishes (lesson 05 read it with `$?`, said "dollar question mark"): **0** means identical, **1** means different, **2** means trouble, such as a missing file.

```bash
diff -q configs/entry_burn.yaml configs/entry_burn_v2.yaml; echo "exit=$?"
```

```text
Files configs/entry_burn.yaml and configs/entry_burn_v2.yaml differ
exit=1
```

With `-r` it also reports files that exist on only one side:

```bash
diff -r /tmp/da /tmp/db
```

```text
diff -r /tmp/da/entry_burn.yaml /tmp/db/entry_burn.yaml
5a6
> margin_m: 25.0
Only in /tmp/db: new.yaml
```

That is the "did my rerun reproduce the baseline?" check: `diff -r baseline/ rerun/`. No output and exit 0 means a perfect match.

Lesson 05 taught **process substitution**, `<(command)`, which hands a command's output to another program as if it were a file. With it, `diff` compares the output of two commands directly:

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

A unified diff is also a set of instructions, like edits a teacher writes in the margin. `patch` reads them and makes the edits for you.

```bash
diff -u configs/entry_burn.yaml configs/entry_burn_v2.yaml > cfg.patch
cp configs/entry_burn.yaml target.yaml
patch target.yaml < cfg.patch
```

```text
patching file target.yaml
```

Step by step: save the diff in `cfg.patch` (`>` sends output into a file, from lesson 05); make a fresh copy of the old config; feed the patch in (`<` reads a file as input). Now `target.yaml` holds `dt: 0.001`, `horizon_s: 22.0` and the new `margin_m` line.

This is how a fix travels to a machine you cannot push a repository to: a one-kilobyte text file instead of a whole tree.

`patch` also notices when something is off. Run the same command a second time:

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

Exit status 1. It saw the file already looked like the *result*, asked whether you meant to undo the patch, took the default "no", and wrote the hunk it could not apply to `target.yaml.rej`. A **reject file** (`.rej`) holds the parts of a patch that failed; read it to see what went wrong.

`patch -R` ("reverse") undoes a patch on purpose:

```bash
patch -R target.yaml < cfg.patch
```

```text
patching file target.yaml
```

The file is back to `dt: 0.002`.

Two more flags matter:

- `-pN` strips N leading folder names from the paths inside the patch. A patch made in one folder layout is usually applied in another. `-p1` is the convention for patches made by `git`.
- `--dry-run` reports what would happen and touches nothing. It is a rehearsal.

## `tar`: many files into one

Mailing a hundred loose photos is a mess; one envelope is easy. `tar` is the envelope. Its name is short for **[[tape archive|tape-archive]]**: it joins a whole tree of files into one continuous stream. It does not squash anything by itself, but it will call a compressor for you when you ask.

```bash
tar -czf /tmp/campaign.tar.gz runs configs telemetry
ls -l /tmp/campaign.tar.gz
```

```text
-rw-r--r-- 1 eng eng 45813 Sep 22 20:37 /tmp/campaign.tar.gz
```

The flags are worth learning as three separate choices:

1. **What to do:** `-c` create, `-x` extract, `-t` list.
2. **Which compressor:** `-z` gzip, `-j` bzip2, `--zstd` zstd, or nothing for a plain archive.
3. **Which archive file:** `-f FILE`. The very next word must be the file name, so in a cluster like `-czf`, the `f` goes last.

::: warning List before you extract
An archive can hold anything — a top-level folder you did not expect, or paths that spill files all over your home directory. Always look inside first:

```bash
tar -tzf /tmp/campaign.tar.gz | head -4
```

```text
runs/
runs/case_0500.log
runs/case_0499.log
runs/case_0498.log
```
:::

This one is well behaved. `-C DIR` extracts into a chosen folder, and naming a member extracts only that one:

```bash
tar -xzf /tmp/campaign.tar.gz -C /tmp/unpack configs/entry_burn.yaml
```

::: warning The leading slash is removed
`tar` strips a leading `/` from every path, and tells you so. An archive of absolute paths could otherwise overwrite system files when someone extracts it:

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

The members are now *relative*. Extracting in `/tmp` creates `/tmp/home/eng/campaign/configs/` — almost certainly not what you wanted. Archive from the right folder instead: `tar -czf out.tar.gz -C /home/eng campaign/configs` makes members that start at `campaign/`, and they unpack where you expect.
:::

## `gzip` and `zstd`: squashing files

A **compressor** makes a file smaller by writing repeated patterns only once, the way you might write "the same again" instead of copying out a whole line. Log files and CSV tables are full of repeats, so they [[squash well|why-logs-compress]].

```bash
ls -l /tmp/t.csv /tmp/t.csv.gz
```

```text
-rw-r--r-- 1 eng eng 7497 Sep 22 20:37 /tmp/t.csv
-rw-r--r-- 1 eng eng 3099 Sep 22 20:37 /tmp/t.csv.gz
```

The table went from 7497 bytes to 3099 — about 2.4 times smaller. `gzip file` *replaces* the file with `file.gz`; the original is gone unless you pass `-k` ("keep"). `gunzip` reverses it. And `zcat`, `zgrep` and `zless` read a compressed file without unpacking it:

```bash
zgrep -c , /tmp/t.csv.gz
```

```text
202
```

That counts the lines with a comma: 201 rows of data plus one header. So a folder of 10,000 compressed run logs can be searched where it sits — no temporary files, no extra disk space, nothing to clean up.

`zstd` is the modern alternative. It reaches similar sizes much faster, and it has a **compression level** you can turn up when you plan to keep the archive rather than move it.

```bash
ls -l /tmp/t.csv.zst /tmp/t19.csv.zst
```

```text
-rw-r--r-- 1 eng eng 3149 Sep 22 20:37 /tmp/t.csv.zst
-rw-r--r-- 1 eng eng 2524 Sep 22 20:37 /tmp/t19.csv.zst
```

The default level gave 3149 bytes, almost the same as gzip's 3099. Level 19 gave 2524 bytes: $2524 / 3099 \approx 0.81$, so about a fifth smaller than either. Level 19 costs a lot of time to *compress*, and almost none extra to *decompress*. On the whole campaign the gap is clearer:

```bash
ls -l /tmp/campaign.tar.gz /tmp/campaign.tar.zst
```

```text
-rw-r--r-- 1 eng eng 45813 Sep 22 20:37 /tmp/campaign.tar.gz
-rw-r--r-- 1 eng eng 39131 Sep 22 20:37 /tmp/campaign.tar.zst
```

That is about 15 percent smaller. `zstdcat` is the partner of `zcat`, and `tar --zstd` uses zstd as its filter, exactly the way `-z` uses gzip.

The rule of thumb: **gzip when the other person's tools matter** — it is on every machine ever built, and every language can read it. **zstd when speed matters** — nightly archives of telemetry, and anything large crossing a network.

## `scp`: copy a file over SSH

`scp` ("[[secure copy|scp-sftp]]") has the same shape as `cp`, except either side may be `host:path` — "this path, on that machine". The colon is what tells `scp` the path is remote.

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

That short alias makes the rest readable. With it in place:

```bash
scp configs/entry_burn.yaml sim01:/srv/campaign/
ssh sim01 "ls -l /srv/campaign"
```

```text
total 4
-rw-r--r-- 1 root root 84 Sep 22 20:39 entry_burn.yaml
```

`-r` copies whole folders, and either side may be remote:

```bash
scp sim01:/srv/campaign/entry_burn.yaml /tmp/back.yaml
```

`scp` is fine for one file. But it does not know what is already on the other side, so it re-sends everything, and it cannot resume a broken copy. For anything bigger than "one config, once", use `rsync`.

## `rsync`: copy only what changed

Picture two photo albums, one at your house and one at your grandmother's. Each week you mail her only the new photos, not the whole album. `rsync` works the same way: it compares both sides, then sends only the difference.

```bash
rsync -a runs/ sim01:/srv/campaign/runs/
ssh sim01 "ls /srv/campaign/runs | wc -l"
```

```text
500
```

`-a` is **archive mode**: go into every folder, and keep times, permissions, symbolic links and ownership where possible. You will use it every time. Other flags you will meet:

- `-v` ("verbose") makes it list what it does.
- `-z` squashes the data while it travels.
- `-P` shows progress *and* keeps a partly sent file, so a broken copy can resume.
- `-n` is a **dry run**: say what would happen, change nothing.

The magic is in the *second* run. Run the identical command again, asking for statistics:

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

Zero files transferred. It sent about 8.6 kB of file names and details to learn that 315 kB of logs were already identical. The "speedup" is the total size divided by what actually crossed the wire: $314{,}819 / (8{,}617 + 12) \approx 36.5$.

Now change one file and repeat. `touch` updates a file's modification time without changing its contents:

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

One name in the list: the one whose timestamp changed. By default `rsync` decides with a **quick check**: same size and same modification time means "same file", and it never reads the contents. `-c` ("checksum") makes it read every file and compare a fingerprint instead. That is slower, and correct even when timestamps lie — as they do between filesystems that store time with different precision.

Scale it up: a campaign folder that grows by 200 MB a day is mirrored to your workstation in the time it takes to send 200 MB, however large it has become. Under the hood, rsync can even send only the changed *parts* of a big file — that is the **[[rsync algorithm|rsync-algorithm]]**.

::: example The trailing slash, which is not a typo
This is the one piece of `rsync` syntax everybody gets wrong once.

```bash
rsync -a runs/ sim01:/srv/campaign/runs/
```

With a slash after `runs`, it sends the *contents* of `runs` into the destination folder. Now leave the slash off the source:

```bash
rsync -a runs sim01:/srv/campaign/nested/
ssh sim01 "ls /srv/campaign/nested"
```

```text
runs
```

Without the slash, it sends the *folder itself*, creating `/srv/campaign/nested/runs/`. So a **[[trailing slash|trailing-slash-tree]]** on the source means "the things in here", and no slash means "this thing". A trailing slash on the destination makes no difference.

The failure this causes is `campaign/runs/runs/case_0001.log`: a nested duplicate that each night's sync keeps up to date, found weeks later when the disk fills.

Sanity check: say it aloud before you run it — "contents of runs, into runs". If that is not what you meant, stop.
:::

::: example `--delete`, and the dry run that saves you
`--delete` removes files from the destination that no longer exist in the source. That is what turns a copy into a **[[mirror|mirror-meaning]]** — an exact twin. It also means the *source* path decides what survives.

Here is the command with the *wrong* source — `configs/` instead of `runs/` — run with `-n` so nothing really happens:

```bash
rsync -avn --delete configs/ sim01:/srv/campaign/runs/ | head -5
```

```text
sending incremental file list
deleting case_0500.log
deleting case_0499.log
deleting case_0498.log
deleting case_0497.log
```

The full list has 500 deletions: `configs/` contains none of those names, so by `--delete`'s rules all are stale. Without `-n`, this would have wiped the campaign from the server and reported success.

The discipline is fixed: **run `--delete` with `-n` first, read the deletion list, then run it for real.**

The second guard is `--max-delete=N`. It lets rsync delete at most N files, then stops deleting and fails loudly:

```bash
rsync -avn --delete --max-delete=5 configs/ sim01:/srv/campaign/runs/
```

```text
sending incremental file list
deleting case_0500.log
deleting case_0499.log
deleting case_0498.log
deleting case_0497.log
deleting case_0496.log
entry_burn.yaml
entry_burn_v2.yaml
Deletions stopped due to --max-delete limit (495 skipped)

sent 111 bytes  received 110 bytes  147.33 bytes/sec
total size is 183  speedup is 0.83 (DRY RUN)
rsync error: the --max-delete limit stopped deletions (code 25) at main.c(1356) [sender=3.2.7]
```

Five deletions are listed, 495 skipped, and rsync exits with code 25. Without `-n`, those five files *would* really be deleted — the limit caps the damage rather than preventing it. What it buys you is a job that visibly failed instead of one that quietly succeeded at the wrong thing. Set N to a number you would never legitimately exceed, and put it in the script, not in your memory.
:::

::: key diff, tar, gzip, rsync in one breath
`diff -u` is the format everything speaks; exit status 0 same, 1 different, 2 error. `tar -czf` creates, `-tzf` lists, `-xzf` extracts, and `-f` must be last among the clustered flags. `gzip` replaces the file unless you pass `-k`. `rsync -a` preserves metadata and transfers only what changed; a trailing slash on the source means "the contents of"; `--delete` is only safe after `-n`.
:::

## Check yourself

::: check
`rsync -av /data/campaign /backup/campaign/` runs every night. After the first night it has made `/backup/campaign/campaign/`, and it keeps that updated. What is the one-character fix, and what should you do about the folder that is already there?
:::

::: answer
Add a trailing slash to the source: `rsync -av /data/campaign/ /backup/campaign/`. Without it, rsync copies the folder `campaign` *as an item* into the destination, so it lands inside the destination folder that is also called `campaign`. With the slash, it copies the folder's contents.

For the copy already there, do not reach for `--delete` first — one wrong path and you delete the good copy. Instead:

1. Check with `diff -r /data/campaign /backup/campaign/campaign` that the nested copy is what you think it is.
2. Remove it on purpose: `rm -r /backup/campaign/campaign`.
3. Run the corrected sync.
4. Verify with a dry run: `rsync -avn /data/campaign/ /backup/campaign/` should report nothing to transfer once the real run has finished.
:::

::: check
A colleague ran `diff -ru sim.orig sim > fix.patch` in her home folder, comparing her untouched copy of the simulator with her edited one. You are at the top of your own checkout, `/opt/sim/`, which contains `src/guidance.cpp`. `patch < fix.patch` says `can't find file to patch`. What is happening, and which flag fixes it?
:::

::: answer
The `---` and `+++` lines in her patch carry the paths as she saw them: `sim.orig/src/guidance.cpp` and `sim/src/guidance.cpp`. From `/opt/sim/`, `patch` looks for `sim/src/guidance.cpp`, which does not exist. It even suggests the fix: "Perhaps you should have used the -p or --strip option?"

`-pN` strips N leading folder names from those paths before looking. Here one folder, `sim/`, must go, leaving `src/guidance.cpp`, which is exactly where your file lives. So `patch -p1 < fix.patch`. The same `-p1` is the usual choice for `git` patches, which start their paths with `a/` and `b/` — one folder to strip.

Rehearse first with `patch --dry-run -p1 < fix.patch`. It says `checking file src/guidance.cpp`, reports anything that would be rejected, and changes nothing.
:::

::: check
You must bring 40 GB of telemetry from the cluster to your laptop over a connection that drops every few hours. Compare `scp`, `tar` piped over `ssh`, and `rsync`, and say what you would run.
:::

::: answer
`scp` sends the whole set every time and cannot resume. A drop at 39 GB means starting again from zero.

`tar czf - dir | ssh host 'tar xzf -'` packs, squashes and streams in one go (`-` means "standard output" on the left and "standard input" on the right). Efficient for a first copy, but all-or-nothing too: a drop leaves a cut-off stream.

`rsync` is the answer, because it can restart by design: `rsync -avzP telemetry/ laptop:/data/telemetry/`. `-a` keeps file details, `-z` squashes in flight, and `-P` combines `--progress` with `--partial`, so an interrupted file keeps what arrived. After a drop, run the same command again: a few seconds comparing file lists, then only what is still missing.

Two refinements: `--bwlimit=20000` (about 20 MB/s) if you must not hog the link, and `--append-verify` for very large single files that only ever grow. And run the whole thing inside `tmux` on the cluster (lesson 09), so the transfer does not die with your connection.
:::

::: check
Why does `tar` refuse to store absolute paths, and what goes wrong if you archive `/home/eng/campaign/configs` and extract the result in `/tmp`?
:::

::: answer
It strips the leading `/`, printing `tar: Removing leading '/' from member names`, so that extracting an archive can never overwrite system files. Otherwise an archive holding `/etc/passwd` would replace the real one on any machine where someone unpacked it as the administrator.

The side effect: members become relative to wherever you extract, so in `/tmp` you get `/tmp/home/eng/campaign/configs/` — four folders deeper than you meant. The fix is to archive from the right place: `tar -czf out.tar.gz -C /home/eng campaign/configs` moves into `/home/eng` first, so the members begin at `campaign/` and unpack sensibly anywhere.
:::

::: check
When would you choose `gzip` over `zstd` for a nightly archive of 60 GB of simulation logs, and when the other way round?
:::

::: answer
Choose `zstd` for the nightly archive itself. It compresses several times faster at a similar size, and a higher level such as `-19` squeezes further at the cost of compression time only — decompression stays about as fast whatever the level. For 60 GB written every night and read rarely, that is the right trade, and `tar --zstd` makes it a one-flag change.

Choose `gzip` when the *receiver* is the limit. It is on every Unix machine, even ancient ones, and every language and analysis tool reads `.gz`. If the archive goes to a partner organization, into storage you do not control, or to a machine where you cannot install software, compatibility beats speed.

Either way, compress the *tar*, not each file: one archive of many logs squashes far better, because the compressor sees patterns repeated across files.
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
| `rsync --delete` | make the destination a mirror | `-n` first, every time; `--max-delete=N` caps the damage and exits 25 |

Lesson 08 is the layer all of this rides on: SSH keys, the `~/.ssh/config` file that turned a host, a port and a key file into the single word `sim01`, agent forwarding, and port forwarding.

::: context hunk-header Reading the @@ line
`@@ -1,5 +1,6 @@` is two little ranges, one for each file. `-1,5` means "in the old file, starting at line 1, take 5 lines". `+1,6` means "in the new file, starting at line 1, the same stretch is now 6 lines long". The counts include the unchanged context lines, which is why they are bigger than the number of edits.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="70" y="16" font-size="12" text-anchor="middle" fill="#1f2a44">old: -1,5</text>
  <text x="290" y="16" font-size="12" text-anchor="middle" fill="#1f2a44">new: +1,6</text>
  <g font-size="11" fill="#1f2a44">
    <rect x="10" y="24" width="120" height="20" fill="#fff" stroke="#1f2a44"/><text x="16" y="38">1 vehicle</text>
    <rect x="10" y="44" width="120" height="20" fill="#fff" stroke="#1f2a44"/><text x="16" y="58">2 profile</text>
    <rect x="10" y="64" width="120" height="20" fill="#f2b880" stroke="#1f2a44"/><text x="16" y="78">3 dt 0.002</text>
    <rect x="10" y="84" width="120" height="20" fill="#f2b880" stroke="#1f2a44"/><text x="16" y="98">4 horizon 18</text>
    <rect x="10" y="104" width="120" height="20" fill="#fff" stroke="#1f2a44"/><text x="16" y="118">5 seed_base</text>
    <rect x="230" y="24" width="120" height="20" fill="#fff" stroke="#1f2a44"/><text x="236" y="38">1 vehicle</text>
    <rect x="230" y="44" width="120" height="20" fill="#fff" stroke="#1f2a44"/><text x="236" y="58">2 profile</text>
    <rect x="230" y="64" width="120" height="20" fill="#8fb8f0" stroke="#1f2a44"/><text x="236" y="78">3 dt 0.001</text>
    <rect x="230" y="84" width="120" height="20" fill="#8fb8f0" stroke="#1f2a44"/><text x="236" y="98">4 horizon 22</text>
    <rect x="230" y="104" width="120" height="20" fill="#fff" stroke="#1f2a44"/><text x="236" y="118">5 seed_base</text>
    <rect x="230" y="124" width="120" height="20" fill="#8fb8f0" stroke="#1f2a44"/><text x="236" y="138">6 margin_m</text>
  </g>
  <g stroke="#6c7a93" stroke-width="1.2">
    <line x1="130" y1="34" x2="230" y2="34"/><line x1="130" y1="54" x2="230" y2="54"/><line x1="130" y1="114" x2="230" y2="114"/>
  </g>
  <text x="180" y="162" font-size="11" text-anchor="middle" fill="#6c7a93">grey lines: unchanged context</text>
</svg>
```
:::

::: context diff-exit-status Why "different" is not an error
Most programs use exit status 0 for success and anything else for failure. `diff` bends that: 1 is a perfectly good answer ("they differ"), and only 2 means something broke. This bites scripts that run with `set -e` (stop at the first failing command, which you will meet in the scripting module): a `diff` that finds a difference stops the script. When a difference is expected, write `diff a b || true`, or test the status yourself.
:::

::: context tape-archive A tape, a stream, and 512-byte blocks
`tar` dates from the days when backups went onto reels of magnetic tape, which can only be written from start to end, like a cassette. So a tar archive is one long stream: a 512-byte **header** with a file's name, size and permissions, then the file's bytes padded up to a multiple of 512, then the next header, and so on. At least two blocks of zeros mark the end. Because it is a stream, tar can write straight into a pipe, which is how `-z` hands it to gzip.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 100" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="30" width="70" height="34" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="80" y="30" width="70" height="34" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="150" y="30" width="70" height="34" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="220" y="30" width="70" height="34" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="290" y="30" width="60" height="34" fill="#6c7a93" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="45" y="51">header A</text><text x="115" y="51">data A</text>
    <text x="185" y="51">header B</text><text x="255" y="51">data B</text>
    <text x="320" y="51" fill="#fff">zeros</text>
    <text x="180" y="20">each box is a 512-byte block</text>
    <text x="180" y="86">file data is padded to fill its last block</text>
  </g>
</svg>
```
:::

::: context why-logs-compress Why logs shrink so much
A compressor looks for text it has already seen and replaces the repeat with a short pointer: "copy 40 characters from 300 back". Every log line here starts with a date, `INFO` and `vehicle=falcon9-s1`, so most of each line is a repeat. gzip (1992) combines those pointers with a shorter code for common symbols. zstd, released by Yann Collet at Facebook in 2016, uses the same basic idea with faster modern machinery. Random data, or data that is already compressed, has nothing to point back to and barely shrinks at all.
:::

::: context scp-sftp What scp does under the hood today
Since OpenSSH 9.0 (2022), the `scp` command talks the newer SFTP protocol to the server instead of the old scp protocol, which had awkward rules about quoting file names on the far side. You type the same command and get the same result; `scp -O` asks for the old protocol if an ancient server needs it. Either way, the copy rides inside an ordinary SSH connection, so the keys and `~/.ssh/config` from lesson 08 apply to `scp` and `rsync` exactly as they apply to `ssh`.
:::

::: context rsync-algorithm Sending only the changed pieces
rsync was written by Andrew Tridgell and Paul Mackerras in 1996. Its clever trick: when a big file changed a little, the receiver cuts its old copy into blocks and sends a small fingerprint of each. The sender slides a window along its new version, finds the blocks the receiver already has, and sends only the bytes in between plus "block 17 goes here". For a 2 GB log with a few new lines at the end, that is a few kilobytes instead of 2 GB. Between two folders on the *same* machine, rsync skips the trick and copies whole files, because reading both copies would cost more than copying.
:::

::: context trailing-slash-tree Picture the trailing slash
Both commands start from the same `runs` folder. The only difference is one slash, and it decides whether you get the logs or a folder of logs.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="90" y="16" font-size="12" text-anchor="middle" fill="#1d6fd1">rsync -a runs/ dest/</text>
  <text x="270" y="16" font-size="12" text-anchor="middle" fill="#b4232c">rsync -a runs dest/</text>
  <g font-size="12" fill="#1f2a44">
    <text x="30" y="44">dest/</text>
    <text x="50" y="66">case_0001.log</text>
    <text x="50" y="88">case_0002.log</text>
    <text x="50" y="110">…</text>
    <text x="210" y="44">dest/</text>
    <text x="230" y="66">runs/</text>
    <text x="250" y="88">case_0001.log</text>
    <text x="250" y="110">case_0002.log</text>
    <text x="250" y="132">…</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1.2" fill="none">
    <path d="M36,48 V106 M36,62 H46 M36,84 H46 M36,106 H46"/>
    <path d="M216,48 V62 H226"/>
    <path d="M236,70 V128 M236,84 H246 M236,106 H246 M236,128 H246"/>
  </g>
  <line x1="180" y1="26" x2="180" y2="140" stroke="#6c7a93" stroke-dasharray="4 3"/>
</svg>
```
:::

::: context mirror-meaning What makes a mirror
A **mirror** is a copy kept identical to its source: same files, same contents, and nothing extra. Plain copying gets you the first two; only deleting what vanished from the source gets you the third. Big software sites have "mirrors" around the world for the same reason. The danger is built into the word: a mirror copies mistakes as faithfully as good data, so a wrong source becomes a wrong destination within one run.
:::
