---
id: l06-grep-regex-and-the-text-toolkit
title: grep, regular expressions, and the text toolkit
minutes: 22
covers:
  - grep and regular expressions, cut, sort, uniq -c, tr, find -exec
---

You have 500 run logs and one of them diverged. Nobody knows which. That question — *find the one that is different* — is the single most common thing a simulation engineer does at a terminal, and the tools for it are `grep`, `cut`, `sort`, `uniq`, `tr` and `find`. Each does one thing. The skill is knowing which one and in what order, and that comes from knowing precisely what each does to a line of text.

This lesson is longer than the others because it is the working core of the module. Two things in it repay real attention: the regular-expression syntax that `grep` takes, because a wrong metacharacter gives you a plausible answer rather than an error; and the rule that `uniq` only collapses *adjacent* duplicates, which is the single most common defect in beginner pipelines.

All output below was produced on this machine and pasted verbatim: GNU grep 3.11, GNU coreutils 9.4 (`cut`, `sort`, `uniq`, `tr`), GNU findutils 4.9.0 (`find`), mawk 1.3.4, on Ubuntu 24.04.4. The fixture is a campaign of 500 entry-burn logs plus telemetry CSVs for three of the cases. The order `find` returns entries in is filesystem order, so yours will differ.

## `grep`: lines that match

`grep PATTERN file...` prints the lines that contain a match.

```bash
grep ERROR runs/case_0417.log
```

```text
2026-03-14T12:36:10Z ERROR divergence detected in attitude loop, residual=1.8e+03
```

The flags that do most of the work:

- `-i` ignore case; `-w` match whole words only, so `INFO` does not match `INFOX`.
- `-v` invert — print the lines that do *not* match. `grep -v INFO` on the log above leaves just the `WARN` and the `ERROR`.
- `-n` prefix the line number; `-H` prefix the filename, which is the default with more than one file; `-h` suppress it.
- `-c` count matching lines instead of printing them; `-l` print only the names of files with a match; `-L` the names of files without one.
- `-r` recurse into directories; `--include='*.log'` restricts which files it reads.
- `-o` print only the matched part, not the whole line.
- `-A n`, `-B n`, `-C n` — n lines of context after, before, or both.
- `-E` extended regular expressions; `-F` fixed strings, no metacharacters at all.

Three of those turn a directory of logs into an answer immediately:

```bash
grep -l ERROR runs/*.log
```

```text
runs/case_0417.log
```

One file out of 500. And the context flags tell you what led up to it:

```bash
grep -B 1 -A 1 ERROR runs/case_0417.log
```

```text
2026-03-14T12:36:06Z WARN  solver iteration limit reached, falling back to previous solution
2026-03-14T12:36:10Z ERROR divergence detected in attitude loop, residual=1.8e+03
2026-03-14T12:36:16Z INFO  MISS_DISTANCE_M 4812.6
```

The solver hit its iteration limit four seconds before the divergence, and the run still reported a miss distance afterwards. That is the whole diagnosis, from one command.

`-o` extracts rather than selects, which is how you get a number out of prose:

```bash
grep -o "residual=[0-9.e+]*" runs/case_0417.log
```

```text
residual=1.8e+03
```

### The exit status

`grep` has three exit statuses and they all mean something:

| Status | Meaning |
| --- | --- |
| 0 | at least one line matched |
| 1 | no lines matched — *not an error* |
| 2 | a real error: file missing, unreadable, bad pattern |

```bash
grep ERROR nosuchfile.log; echo "exit=$?"
```

```text
grep: nosuchfile.log: No such file or directory
exit=2
```

This is what makes `grep` usable as a test: `if grep -q DIVERGED "$log"; then ...` asks a yes/no question, with `-q` suppressing the output entirely. It is also the trap in `set -e` scripts, where a `grep` that legitimately finds nothing exits 1 and stops the script. Write `grep ... || true` when "no match" is an acceptable outcome.

## Regular expressions

A regular expression is a pattern language. `grep` without `-E` uses **basic** regular expressions (BRE) and with `-E` uses **extended** ones (ERE); the difference is only which characters need backslashes. Use `-E`. The pieces:

| Pattern | Matches |
| --- | --- |
| `.` | any single character |
| `[abc]`, `[0-9]`, `[^0-9]` | one character from the set, a range, or anything *not* in the set |
| `^`, `$` | start of line, end of line |
| `*` | zero or more of the preceding item |
| `+`, `?` | one or more, zero or one (ERE; in BRE write `\+`, `\?`) |
| `{3}`, `{2,5}` | exactly 3, between 2 and 5 (ERE; in BRE `\{3\}`) |
| `(a\|b)` | either alternative, grouped (ERE; in BRE `\(a\|b\)`) |
| `\.` | a literal dot |
| `\b` | a word boundary |

Two examples against the campaign:

```bash
grep -E "status=(OK|DIVERGED)" runs/case_0417.log
```

```text
2026-03-14T12:36:17Z INFO  sim end status=DIVERGED wall_s=156.0
```

```bash
grep -E "MISS_DISTANCE_M [0-9]{4}" runs/*.log
```

```text
runs/case_0288.log:2026-03-14T11:29:37Z INFO  MISS_DISTANCE_M 1904.3
runs/case_0417.log:2026-03-14T12:36:16Z INFO  MISS_DISTANCE_M 4812.6
```

"Four digits before the decimal point" is "a miss of a kilometre or more", and it found both bad cases without anyone specifying a threshold in advance.

::: warning
The metacharacter that will actually bite you is `.`, because it silently matches too much rather than failing:

```bash
grep "1.8e" /tmp/re.txt
```

```text
residual=1.8e+03
residual=128e+03
```

You searched for `1.8e` and got `128e` too, because `.` matched the `2`. Nothing reported an error; you simply have one extra line in your answer, and on a real log you would never notice.

Two fixes, and they are for different situations. Escape the dot when you want a literal one — `grep "1\.8e"` — or, when the whole pattern is a literal string, say so with `-F`:

```bash
grep -F "1.8e" /tmp/re.txt
```

```text
residual=1.8e+03
```

`-F` is also much faster on large inputs, and it is the right flag whenever you are searching for a path, a version number or anything else full of dots and slashes.
:::

Always single-quote a pattern. `*`, `?`, `[` and `$` mean something to the shell as well, and the shell gets them first.

## `cut`: columns by delimiter

`cut -d<char> -f<list>` selects fields.

```bash
head -3 telemetry/case_0417.csv
```

```text
t_s,alt_m,vspeed_ms,q_pa,alpha_deg,thrust_n
0.0,12000.0,-310.0,8286.2,-0.03,0
0.5,11947.6,-308.7,8337.5,0.84,0
```

```bash
cut -d, -f1,4 telemetry/case_0417.csv | head -4
```

```text
t_s,q_pa
0.0,8286.2
0.5,8337.5
1.0,8389.0
```

Time and dynamic pressure, extracted from a six-column telemetry file in one command. `-c` cuts by character position instead: `cut -c1-10` on a log line gives you the date.

`cut` has three limitations you must know, because each of them produces wrong output rather than an error.

1. **The delimiter is a single character and is not repeated.** Columns aligned with runs of spaces cannot be cut on `-d' '`, because each space is its own separator and the empty fields count. Use `awk`, whose default field splitting collapses runs of whitespace.
2. **It cannot reorder.** Ask for fields 4 and 1 and you get them in file order anyway:

```bash
cut -d, -f4,1 telemetry/case_0417.csv | head -2
```

```text
t_s,q_pa
0.0,8286.2
```

`awk -F, '{print $4, $1}'` does reorder, and prints `q_pa t_s`.
3. **It does not understand quoting.** A CSV field containing a comma inside quotes will be split. For real CSV, use Python's `csv` module; `cut` is for the well-behaved machine-generated files that make up most telemetry.

## `sort`: and the three different orders

Plain `sort` sorts as text, which is almost never what you want for numbers:

```bash
printf "10\n9\n100\n" | sort
```

```text
10
100
9
```

`-n` sorts numerically:

```bash
printf "10\n9\n100\n" | sort -n
```

```text
9
10
100
```

And `-g` sorts by general numeric value, which is what handles scientific notation — the form every solver writes residuals in:

```bash
printf "1e3\n5\n2.5e2\n" | sort -n
printf "1e3\n5\n2.5e2\n" | sort -g
```

```text
1e3
2.5e2
5
```

```text
5
2.5e2
1e3
```

`-n` read `1e3` as the number 1 and stopped; `-g` read it as 1000. Use `-g` for any column that might hold exponents, and `-n` when you know it will not (it is faster and not locale-sensitive). `-h` handles human sizes like `2.0M` and `14G`, which is what makes `du -h | sort -h` work.

The other flags: `-r` reverses, `-u` keeps one of each equal key, and `-k` with `-t` sorts by a field rather than the whole line.

```bash
tail -n +2 telemetry/case_0417.csv | sort -t, -k5 -g -r | head -2
```

```text
61.5,6374.6,-150.1,16061.2,9.27,760000
82.5,4834.9,-95.5,19250.8,9.20,760000
```

`-t,` sets the field separator, `-k5` sorts on the fifth field (`alpha_deg`), `-g` numerically, `-r` descending. The largest angle of attack in the run was 9.27° at t = 61.5 s. `tail -n +2` dropped the header first, so the word `alpha_deg` did not get sorted along with the numbers.

::: warning
`sort -t' ' -k4` on text aligned with *two* spaces does not do what it looks like. `-t` takes one literal character, so a double space is two separators with an empty field between them, and field 4 is not the fourth thing you can see. The symptom is output that comes back in its original order, because the key you selected is the same on every line and `sort` is stable. If a `sort -k` is mysteriously a no-op, print the key you are actually selecting — `awk -F' ' '{print $4}'` — before blaming the sort.
:::

## `uniq -c`: counting, and the sort that must come first

`uniq` collapses **adjacent** identical lines. That word is the whole lesson. `uniq -c` prefixes each group with its count.

```bash
grep -h "sim end" runs/*.log | awk '{print $5}' | sort | uniq -c
```

```text
      1 status=DIVERGED
    499 status=OK
```

One line, and you know the campaign's outcome: 499 clean, one diverged. Now remove the `sort`:

```bash
grep -h "sim end" runs/*.log | awk '{print $5}' | uniq -c
```

```text
    416 status=OK
      1 status=DIVERGED
     83 status=OK
```

Three groups instead of two, and `status=OK` counted twice. Nothing failed; the answer is simply wrong, and it is wrong in a way that looks like a plausible answer. This is the defect to watch for in your own pipelines and in everyone else's: **`uniq` after `sort`, always.**

The other three forms:

```bash
printf "b\na\nb\nc\na\n" | sort -u
printf "b\na\nb\nc\na\n" | sort | uniq -d
printf "b\na\nb\nc\na\n" | sort | uniq -u
```

```text
a
b
c
```

```text
a
b
```

```text
c
```

`sort -u` is distinct values. `uniq -d` shows only the values that appeared more than once — which is how you find duplicated case ids or repeated seeds. `uniq -u` shows only the values that appeared exactly once, which is how you find the run that is unlike all the others.

::: example Which guidance settings did this campaign actually use?
A campaign is only reproducible if every case ran the configuration you think it did. Check rather than assume:

```bash
grep -h "guidance mode" runs/*.log | awk '{print $5}' | sort | uniq -c
```

```text
    500 horizon_s=18.0
```

One group of 500. Every case used the same horizon. Two groups would mean the configuration changed part-way through the sweep — someone edited the YAML while it was running, or half the cases picked up a stale copy — and every statistic computed over the whole 500 would be a mixture of two populations.

The same three-command shape answers most campaign questions. Pull the field out with `grep` and `awk`, `sort`, then `uniq -c`. Run it on the seed, on the timestep, on the vehicle name and on the exit status of every campaign before you plot anything.
:::

## `tr`: characters, not words

`tr` translates or deletes single characters. It reads only standard input, so it always sits inside a pipe.

```bash
printf "a,b,c\n" | tr "," "\n"
printf "AZIMUTH\n" | tr "A-Z" "a-z"
printf "a   b     c\n" | tr -s " "
printf "1,204.8\n" | tr -d ","
```

```text
a
b
c
```

```text
azimuth
```

```text
a b c
```

```text
1204.8
```

Four idioms worth having: commas to newlines turns one CSV row into a column that `sort` and `uniq` can work on; `A-Z` to `a-z` normalises case before counting; `-s` squeezes runs of a character into one, which is how you make whitespace-aligned output cuttable; and `-d` deletes, which is how thousands separators and stray carriage returns come out. `tr -d '\r' < windows.csv > unix.csv` is the fix for the `^M` problem from lesson 02.

## `find`: selecting files rather than lines

`grep` searches inside files. `find` chooses which files. It walks a tree and tests each entry against expressions you give it.

```bash
find . -type f -size +4k
```

```text
./telemetry/case_0417.csv
./telemetry/case_0002.csv
./telemetry/case_0001.csv
```

The tests you will use:

- `-name '*.log'` glob on the name (quote it, or the shell expands it first); `-iname` case-insensitive; `-path '*runs*'` matches the whole path.
- `-type f`, `-type d`, `-type l` — regular file, directory, symlink.
- `-size +4k`, `-size +1G` — larger than; `-` for smaller.
- `-mtime -1` modified in the last day, `-mmin -60` in the last hour, `-newer FILE` more recently than that file's timestamp.
- `-maxdepth 1` do not recurse.

They combine with an implicit "and"; `-o` is "or" and `!` negates.

`-printf` formats the output, which saves a pipeline:

```bash
find . -name "*.log" -printf "%s %p\n" | sort -n | tail -3
```

```text
722 ./runs/case_0063.log
723 ./runs/case_0288.log
811 ./runs/case_0417.log
```

Size then path, numerically sorted: the three largest logs in the campaign are exactly the three that printed something the others did not. Finding the odd run by *file size* is a trick worth keeping.

### `-exec`, and the difference `+` makes

`-exec cmd {} \;` runs the command once per file, with `{}` replaced by the path. `-exec cmd {} +` batches as many paths as fit onto each command line, exactly as `xargs` does.

```bash
find . -name "*.log" -exec grep -l DIVERGED {} +
```

```text
./runs/case_0417.log
```

That ran `grep` a handful of times over 500 files. The `\;` form would have run it 500 times — measurably slower, and it changes the output of anything that summarises across its arguments. The backslash in `\;` is there because a bare `;` would be eaten by the shell.

`-exec ... +` is the preferred pairing whenever `find` is already in play, because no filename is ever converted into text and re-split, so spaces and newlines in names are simply not an issue. When you need `xargs` flags — `-P` for parallelism, `-n` for batch size — use `-print0 | xargs -0` instead, as in lesson 05.

::: example Counting files safely, and deleting them safely
`find . -type f | wc -l` counts the lines `find` printed, which is the number of files only if no filename contains a newline. The robust form prints one byte per match and counts bytes:

```bash
find . -type f -printf . | wc -c
find . -type f | wc -l
```

```text
505
```

```text
505
```

They agree here, because these filenames are sane. On a tree that came from somewhere else they may not, and only the first is right.

Deletion is where this matters most. `find` has a built-in `-delete`, which needs no external command and no quoting at all. Run on a scratch directory made for the purpose, holding one file to remove and one to keep:

```bash
mkdir -p /tmp/fd && touch /tmp/fd/old.tmp /tmp/fd/keep.log
find /tmp/fd -name "*.tmp" -delete
ls /tmp/fd
```

```text
keep.log
```

What makes `-delete` dangerous is not the deleting; it is that a mistyped `-name` deletes a different set and says nothing. The discipline is the same as with `rm`: **run the `find` with `-print` first**, read the list, and only then change `-print` to `-delete`.

There is one more trap, and it is worth seeing rather than being told. `find` evaluates its expression left to right, and `-delete` is an action, not a filter. Put it before the test and the test never gets a chance to run. On a throwaway tree holding one `.tmp` file and two files to keep:

```bash
find /tmp/fd3
find /tmp/fd3 -delete -name "*.tmp"
find /tmp/fd3
```

```text
/tmp/fd3
/tmp/fd3/a.tmp
/tmp/fd3/keep.log
/tmp/fd3/sub
/tmp/fd3/sub/b.log
```

```text
find: '/tmp/fd3': No such file or directory
```

The second command printed nothing and exited 0. It deleted every file, every subdirectory and the starting directory itself, because `-delete` matched everything it visited and `-name` was only consulted afterwards, on entries that no longer existed. `-delete` also implies `-depth`, so contents are visited before their directories — which is what lets it remove the tree from the bottom up. **`-delete` goes last, always.**
:::

::: key
`grep` chooses lines, `cut` and `awk` choose columns, `sort` orders them, `uniq -c` counts *adjacent* runs — so it must follow a `sort` — `tr` maps single characters, and `find` chooses files. `sort -g` handles scientific notation where `sort -n` reads `1e3` as 1. `find ... -exec cmd {} +` batches; `\;` runs once per file.
:::

## Check yourself

::: check
`cut -d' ' -f4 sim.log` on lines that are aligned with two spaces between columns returns empty strings. Explain, and give a command that works.
:::

::: answer
`cut` treats every single delimiter character as a field separator and does not collapse runs of them. With two spaces between columns, `a  b` is three fields — `a`, the empty string, and `b` — so field 4 is somewhere you did not intend, and often empty.

`awk '{print $4}'` works, because awk's default field splitting treats any run of whitespace as one separator and also ignores leading whitespace. If you must use `cut`, squeeze first: `tr -s ' ' < sim.log | cut -d' ' -f4`. The general rule: `cut` for single-character-delimited machine output such as CSV, `awk` for anything aligned for human eyes.
:::

::: check
`grep -c DIVERGED runs/*.log | sort -rn | head -3` is meant to show which files had the most matches. It returns `case_0500`, `case_0499`, `case_0498`, all with count 0, and never mentions the one file that did match. What went wrong?
:::

::: answer
With multiple files, `grep -c` prefixes each count with the filename, so the lines are `runs/case_0001.log:0`, not `0`. `sort -n` reads a leading numeric prefix, and a line beginning with `r` has none, so every key compares equal. `sort` is stable, so the lines come back in input order — which `grep` produced alphabetically — and `-r` reverses that, giving the highest-numbered case first. Nothing was sorted by count at all.

Sort on the right field instead: `sort -t: -k2 -rn` makes the colon the separator and sorts on the second field, which puts `runs/case_0417.log:1` at the top. The general lesson: whenever `sort -n` looks like it did nothing, print the key you are actually selecting before blaming the data.
:::

::: check
Write, in words, what `grep -rh --include='*.log' -E '^[0-9-]+T[0-9:]+Z (WARN|ERROR)' runs/ | awk '{print $2}' | sort | uniq -c | sort -rn` computes, and say which stage would break if the `sort` before `uniq` were removed.
:::

::: answer
It searches recursively under `runs/`, restricted to files ending `.log`, for lines that begin with a timestamp — digits and dashes, a `T`, digits and colons, a `Z` — followed by a space and either `WARN` or `ERROR`. `-h` suppresses the filename prefix so the fields line up. `awk '{print $2}'` takes the second whitespace-separated field, which is the severity word itself. `sort` groups the identical words together, `uniq -c` counts each group, and the final `sort -rn` puts the most frequent severity first.

Without the first `sort`, `uniq -c` would count each *run of adjacent* identical severities rather than each severity. Since the lines come out in file order, you would get one group every time the severity changed — a long list of small counts, summing correctly but grouped meaninglessly. The final `sort -rn` would then rank those accidental groups, giving an answer that is wrong and looks right.
:::

::: check
You need to delete every `*.tmp` file under a 40,000-file results tree. Give three commands that do it, and say which you would actually run and why.
:::

::: answer
`rm results/**/*.tmp` with `globstar` on; `find results -name '*.tmp' -print0 | xargs -0 rm`; `find results -name '*.tmp' -delete`.

The first can fail outright with `Argument list too long` once the match count is large, since the shell builds one command line, and it depends on a shell option being set. The second is safe — NUL-separated, batched by `xargs` — and is the right form when you need `xargs` features such as `-P`.

I would run the third, after running `find results -name '*.tmp' -print` first and reading the list. `-delete` involves no second program, no argument-list limit and no text parsing of filenames at all, so there is nothing between the match and the removal that can misinterpret a name. The `-print` dry run is the part that actually protects you: the failure mode here is never the mechanism, it is a pattern that matches more than you meant.
:::

::: check
Why is `grep` exiting 1 a problem in a script that starts with `set -e`, and what are two correct ways to handle "the pattern might legitimately not be there"?
:::

::: answer
`set -e` stops the script when any command exits non-zero. `grep` exits 1 to report "no lines matched", which is a normal result, not a failure — so a campaign check that happens to find no errors kills the script that was checking for them, and often at the exact moment everything was fine.

Two correct handlings. Append `|| true` so the pipeline's status is forced to zero: `matches=$(grep -c ERROR "$log" || true)`. Or test explicitly with `-q` inside an `if`, which `set -e` does not apply to because the status is being consumed by the conditional:

```bash
if grep -q ERROR "$log"; then
  echo "case failed: $log"
fi
```

The second is clearer about intent. Note that exit status 2 — file missing or unreadable — *is* a real error, and `|| true` swallows that too; if you care about the difference, capture the status and test for 2 separately.
:::

## Summary

| Tool | Does | Watch for |
| --- | --- | --- |
| `grep -l` / `-c` / `-n` / `-o` / `-v` | files with a match / counts / line numbers / the match itself / non-matching lines | `-c` and `-l` prefix the filename when given several files |
| `grep -A -B -C` | context lines around a match | shows what led up to a failure |
| `grep` exit 0 / 1 / 2 | matched / no match / real error | exit 1 kills a `set -e` script |
| `-E` vs `-F` | extended regex vs literal string | `-F` for anything with dots or slashes |
| `.` `[..]` `^ $` `*` `+` `?` `{n}` `(a\|b)` | the regex pieces | `.` matches too much and never errors |
| `cut -d, -f1,4` | fields by single-character delimiter | cannot reorder, cannot collapse repeated delimiters |
| `awk -F, '{print $4, $1}'` | fields, reordered, whitespace-aware | the fix for both `cut` limitations |
| `sort -n` / `-g` / `-h` / `-r` / `-u` | numeric / general numeric / human sizes / reverse / distinct | `-n` reads `1e3` as 1; `-g` reads it as 1000 |
| `sort -t, -k5` | sort on one field | a stable no-op means the key is constant |
| `uniq -c` / `-d` / `-u` | count runs / only repeats / only singletons | **adjacent only — sort first** |
| `tr ',' '\n'` / `-s` / `-d` | map characters / squeeze runs / delete | `tr -d '\r'` fixes Windows line endings |
| `find -name -type -size -mtime -maxdepth` | choose files | quote the glob |
| `find -printf "%s %p\n"` | format the output | size-sorting finds the odd run |
| `find -exec cmd {} +` vs `\;` | batched vs once per file | `+` is faster and space-safe |
| `find -delete` | remove matches with no second program | run it as `-print` first, every time |

Lesson 07 moves the results off the machine: `diff` and `patch` for what changed, `tar`, `gzip` and `zstd` for packing it, and `rsync` and `scp` for copying it somewhere else.
