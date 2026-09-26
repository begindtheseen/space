---
id: l06-grep-regex-and-the-text-toolkit
title: grep, regular expressions, and the text toolkit
minutes: 22
covers:
  - grep and regular expressions, cut, sort, uniq -c, tr, find -exec
---

Imagine 500 printed flight reports, one of which describes a crash. You would not read them all. You would flip through for the word "ERROR", pull out a column of numbers, put them in order, and count how often each result appears. The shell has a small tool for each move: `grep`, `cut`, `sort`, `uniq`, `tr` and `find`.

*Find the one run that is different* is the most common thing a simulation engineer does at a terminal. The skill is knowing which tool, in what order, and exactly what each does to a line of text. Two things deserve real attention: the pattern language `grep` speaks, where a wrong symbol gives a *plausible* answer instead of an error; and the rule that `uniq` merges only *neighboring* duplicates — the most common bug in beginner pipelines.

Output is real, from GNU grep 3.11, coreutils 9.4, findutils 4.9.0 and mawk 1.3.4 on Ubuntu 24.04. The data is lesson 05's campaign — 500 logs in `runs/` — plus telemetry for three cases in `telemetry/`.

## `grep`: lines that match

**[[`grep`|grep-name]]** is a highlighter pen. `grep PATTERN file...` prints every line that contains the pattern:

```bash
grep ERROR runs/case_0417.log
```

```text
2026-03-14T12:35:26Z ERROR divergence detected in attitude loop, residual=1.8e+03
```

The options that do most of the work:

- `-i` ignore upper/lower case; `-w` whole words only, so `INFO` does not match `INFOX`.
- `-v` invert: print the lines that do *not* match. `grep -v INFO` on this log leaves only the `WARN` and `ERROR` lines.
- `-n` add line numbers; `-H` add the filename (the default with several files); `-h` leave it off.
- `-c` count matching lines; `-l` list only files that match; `-L` files that do not.
- `-r` search folders recursively; `--include='*.log'` limits which files are read.
- `-o` print only the matching part, not the whole line.
- `-A n`, `-B n`, `-C n`: show n lines of context after, before, or both.
- `-E` extended patterns; `-F` fixed strings, with no special symbols at all.

Two of those turn a folder of logs into an answer at once:

```bash
grep -l ERROR runs/*.log
```

```text
runs/case_0417.log
```

One file out of 500. The context options show what led up to it:

```bash
grep -B 1 -A 1 ERROR runs/case_0417.log
```

```text
2026-03-14T12:35:22Z WARN  solver iteration limit reached, falling back to previous solution
2026-03-14T12:35:26Z ERROR divergence detected in attitude loop, residual=1.8e+03
2026-03-14T12:35:32Z INFO  MISS_DISTANCE_M 4812.6
```

The solver hit its iteration limit four seconds before the divergence ($26 - 22 = 4$). That is the diagnosis, from one command.

`-o` extracts instead of selects — how you pull a number out of a sentence:

```bash
grep -o 'residual=[0-9.e+]*' runs/case_0417.log
```

```text
residual=1.8e+03
```

(`1.8e+03` is **[[scientific notation|e-notation]]** for $1.8 \times 10^3 = 1800$.)

### The exit status

`grep`'s three exit statuses each mean something:

| Status | Meaning |
| --- | --- |
| 0 | at least one line matched |
| 1 | no lines matched — *not an error* |
| 2 | a real error: missing file, unreadable file, broken pattern |

```bash
grep ERROR nosuchfile.log; echo "exit=$?"
```

```text
grep: nosuchfile.log: No such file or directory
exit=2
```

So `grep` works as a yes/no test: `if grep -q DIVERGED "$log"; then ...`, where `-q` ("quiet") prints nothing. It is also a trap in `set -e` scripts, where a `grep` that rightly finds nothing exits 1 and stops the script. Write `grep ... || true` when "no match" is fine. (`||`, read "or else", runs the right side only if the left failed.)

## Regular expressions

A **regular expression** (regex) describes a *shape* of text instead of exact text, like the blank in a word puzzle: `c_t` fits cat, cot and cut. Without `-E`, `grep` uses **basic** regular expressions (BRE); with `-E`, **extended** ones (ERE). The only **[[difference|bre-and-ere]]** is which symbols need a backslash. Use `-E`:

| Pattern | Matches |
| --- | --- |
| `.` | any single character |
| `[abc]`, `[0-9]`, `[^0-9]` | one character from the set, from a range, or *not* in the set |
| `^`, `$` | start of line, end of line |
| `*` | zero or more of the item before it |
| `+`, `?` | one or more, zero or one (ERE; in BRE write `\+`, `\?`) |
| `{3}`, `{2,5}` | exactly 3, between 2 and 5 (ERE; in BRE `\{3\}`) |
| `(a\|b)` | either choice, grouped (ERE; in BRE `\(a\|b\)`) |
| `\.` | a literal dot |
| `\b` | a word boundary |

Two examples on the campaign. The first asks for either status word:

```bash
grep -E 'status=(OK|DIVERGED)' runs/case_0417.log
```

```text
2026-03-14T12:35:33Z INFO  sim end status=DIVERGED wall_s=156.0
```

The second asks for `MISS_DISTANCE_M`, a space, then four digits in a row:

```bash
grep -E 'MISS_DISTANCE_M [0-9]{4}' runs/*.log
```

```text
runs/case_0288.log:2026-03-14T11:28:53Z INFO  MISS_DISTANCE_M 1904.3
runs/case_0417.log:2026-03-14T12:35:32Z INFO  MISS_DISTANCE_M 4812.6
```

"Four digits before the decimal point" means "a miss of 1,000 m or more" — both bad cases, with no threshold chosen in advance.

::: warning The dot matches too much, silently
The symbol that will actually bite you is `.`, because it quietly matches too much instead of failing:

```bash
grep "1.8e" re.txt
```

```text
residual=1.8e+03
residual=128e+03
```

You searched for `1.8e` and also got **[[`128e`|dot-picture]]**, because `.` matched the `2`. No error — only an extra line you would never notice in a real log.

Escape the dot when you want a real dot — `grep '1\.8e'` — or, when the whole pattern is plain text, say so with `-F`:

```bash
grep -F "1.8e" re.txt
```

```text
residual=1.8e+03
```

`-F` is usually faster too, and right for any path, version number or text full of dots and slashes.
:::

Put patterns in single quotes. `*`, `?`, `[` and `$` mean something to the shell as well, and the shell sees them first.

## `cut`: columns by delimiter

A **delimiter** is the character that separates columns — a comma in a **CSV** file ("comma-separated values"). `cut -d<char> -f<list>` keeps the fields you list:

```bash
head -3 telemetry/case_0417.csv
```

```text
t_s,alt_m,vspeed_ms,q_pa,alpha_deg,thrust_n
0.0,12000.0,-100.0,8286.2,-0.03,0
0.5,11950.1,-99.7,8336.1,1.04,0
```

```bash
cut -d, -f1,4 telemetry/case_0417.csv | head -4
```

```text
t_s,q_pa
0.0,8286.2
0.5,8336.1
1.0,8386.2
```

Time and dynamic pressure (`q_pa`, the air's push on the vehicle), in one command. `-c` cuts by character position instead: `cut -c1-10` on a log line gives the date.

`cut` has three limits, and each gives *wrong output*, not an error.

1. **The delimiter is one character, and repeats are not merged.** In columns lined up with runs of spaces, every space is its own separator and the empty fields between them count. Use `awk`, whose default splitting treats any run of spaces as one separator.
2. **It cannot reorder.** Ask for fields 4 and 1 and you still get them in file order:

```bash
cut -d, -f4,1 telemetry/case_0417.csv | head -2
```

```text
t_s,q_pa
0.0,8286.2
```

`awk -F, '{print $4, $1}'` does reorder, and prints `q_pa t_s`. `awk -F` also accepts a *pattern* as the separator: `-F'[: ]+'` splits on any run of colons and spaces, which neatly takes apart `grep -H` output like `runs/case_0417.log:MISS_DISTANCE_M 4812.6`. And `$NF` is always the last field.

3. **It does not understand quotes.** A CSV field holding a **[[comma inside quotes|csv-quotes]]** gets split. For real-world CSV, use Python's `csv` module. `cut` is for the tidy machine-written files that make up most telemetry.

## `sort`: three different orders

Plain `sort` sorts as text, letter by letter, like a dictionary. That is almost never what you want for numbers:

```bash
printf "10\n9\n100\n" | sort
```

```text
10
100
9
```

As text, `1` comes before `9`, so `100` beats `9`. `-n` sorts by value:

```bash
printf "10\n9\n100\n" | sort -n
```

```text
9
10
100
```

And `-g` ("general numeric") also understands scientific notation, which is how every solver writes residuals:

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

`-n` read `1e3` as 1, stopping at the `e`; `-g` read it as 1000. Use `-g` for any column that might hold exponents, `-n` when it will not (it is faster). `-h` understands human sizes like `2.0M` and `14G`, so `du -h | sort -h` works.

`-r` reverses, `-u` keeps one of each equal line, and `-t` with `-k` sorts by one field:

```bash
tail -n +2 telemetry/case_0417.csv | sort -t, -k5 -g -r | head -2
```

```text
61.5,7173.8,-57.0,17113.4,9.27,760000
82.5,6132.2,-42.3,18373.4,9.20,760000
```

`-t,` makes the comma the separator, `-k5` sorts on field 5 (`alpha_deg`, the angle of attack), `-g` numerically, `-r` largest first: the biggest angle of attack was 9.27° at t = 61.5 s. `tail -n +2` (start at line 2) dropped the header so `alpha_deg` was not sorted in with the numbers.

::: warning A sort that does nothing
`sort -t' ' -k4` on text lined up with *two* spaces does not do what it seems. `-t` takes one literal character, so a double space is two separators with an empty field between them, and field 4 is not the fourth thing you see. The chosen key comes out empty — the same on every line — so every line ties, and GNU `sort` **[[breaks ties|tie-breaking]]** by comparing whole lines. The symptom is output sorted from the first character, as if you had given no `-k` at all. If a `sort -k` seems to ignore your key, print the key you are really selecting — `awk -F' ' '{print $4}'` — before blaming the sort.
:::

## `uniq -c`: counting, and the sort that must come first

`uniq` merges **adjacent** identical lines — lines that sit right next to each other. That word is the whole lesson. `uniq -c` puts a count in front of each group.

```bash
grep -h "sim end" runs/*.log | awk '{print $5}' | sort | uniq -c
```

```text
      1 status=DIVERGED
    499 status=OK
```

One line, and you know the campaign's outcome: 499 clean runs, one diverged ($499 + 1 = 500$). Now remove the `sort`:

```bash
grep -h "sim end" runs/*.log | awk '{print $5}' | uniq -c
```

```text
    416 status=OK
      1 status=DIVERGED
     83 status=OK
```

Three groups instead of two, with `status=OK` counted twice: 416 cases before case 417, and $500 - 417 = 83$ after it. Nothing failed. The answer is **[[wrong in a way that looks right|uniq-picture]]**. Watch for this in your own pipelines and everyone else's: **`uniq` after `sort`, always.**

The other forms:

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

`sort -u` gives distinct values. `uniq -d` shows values seen more than once — repeated case ids or seeds. `uniq -u` shows values seen exactly once — the run unlike the others.

::: example Which guidance settings did this campaign really use?
A campaign is only reproducible if every case ran the settings you think it did. Check rather than assume:

```bash
grep -h "guidance mode" runs/*.log | awk '{print $5}' | sort | uniq -c
```

```text
    500 horizon_s=18.0
```

One group of 500: every case used the same 18-second horizon. Two groups would mean the settings changed mid-sweep — an edited file, a stale copy — and every statistic over all 500 would blend two populations.

The same shape — `grep` and `awk` to pull the field, `sort`, `uniq -c` — answers most campaign questions. Run it on the seed, time step, vehicle and exit status before you plot anything.
:::

## `tr`: characters, not words

`tr` ("translate") swaps or deletes single characters. It reads only stdin, so it always sits in a pipe.

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

Commas to newlines turns a CSV row into a column for `sort` and `uniq`. `A-Z` to `a-z` evens out case before counting. `-s` squeezes runs of a character into one, making space-aligned output cuttable. `-d` deletes thousands separators and stray **[[carriage returns|carriage-return]]**: `tr -d '\r' < windows.csv > unix.csv` fixes the `^M` problem from lesson 02.

## `find`: choosing files instead of lines

`grep` searches *inside* files. `find` chooses *which* files. It walks a folder tree and tests every entry against conditions you give it:

```bash
find . -type f -size +4k
```

```text
./telemetry/case_0002.csv
./telemetry/case_0417.csv
./telemetry/case_0001.csv
```

The tests you will use:

- `-name '*.log'` matches the name against a pattern (quote it, or the shell expands it first); `-iname` ignores case; `-path '*runs*'` matches the whole path.
- `-type f`, `-type d`, `-type l`: regular file, directory, symbolic link.
- `-size +4k`, `-size +1G`: bigger than; use `-` for smaller than.
- `-mtime -1` changed in the last day, `-mmin -60` in the last hour, `-newer FILE` more recently than that file.
- `-maxdepth 1`: do not go into subfolders.

Tests side by side must all hold ("and"); `-o` means "or", `!` means "not". `find` lists entries in the filesystem's own order, so yours may differ.

`-printf` formats the output, which can save a whole pipeline:

```bash
find . -name "*.log" -printf "%s %p\n" | sort -n | tail -3
```

```text
527 ./runs/case_0063.log
528 ./runs/case_0288.log
711 ./runs/case_0417.log
```

`%s` is the size in bytes, `%p` the path. The three largest logs are exactly the three that printed warnings. Finding the odd run by *file size* is a trick worth keeping.

### `-exec`, and the difference `+` makes

`-exec cmd {} \;` runs the command once per file, with `{}` replaced by the path. `-exec cmd {} +` packs as many paths as fit onto each command line, as `xargs` does:

```bash
find . -name "*.log" -exec grep -l DIVERGED {} +
```

```text
./runs/case_0417.log
```

That ran `grep` a handful of times over 500 files; `\;` would run it 500 times — slower, and it changes the output of anything that summarizes across its arguments. The backslash stops the shell swallowing a bare `;`.

Prefer `-exec ... +` whenever `find` is already involved: no filename is turned into text and split again, so spaces and newlines in names are harmless. When you need `xargs` options such as `-P` or `-n`, use `-print0 | xargs -0` (lesson 05).

::: key find versus a shell glob
`find` walks the tree itself and passes each match to its own actions, so it recurses and handles huge match counts. `ls *.log` relies on the shell expanding the glob first, which only matches the current directory and can blow the argument-list limit. So `find . -name "*.log" -delete` reaches every level and any number of files; `-exec cmd {} +` batches, while `\;` runs once per file.
:::

::: example Counting files safely, and deleting them safely
`find . -type f | wc -l` counts the lines `find` printed, which equals the number of files only if no filename contains a newline. The sturdy form prints one dot per match and counts bytes:

```bash
find . -type f -printf . | wc -c
find . -type f | wc -l
```

```text
503
```

```text
503
```

Both say 503 — the 500 logs plus 3 telemetry files — because these names are tidy. On a tree from somewhere else they may disagree, and only the first is right.

Deleting is where this matters most. `find` has a built-in `-delete`, which needs no other program and no quoting at all. On a scratch folder holding one file to remove and one to keep:

```bash
mkdir -p fd && touch fd/old.tmp fd/keep.log
find fd -name "*.tmp" -delete
ls fd
```

```text
keep.log
```

The danger of `-delete` is not the deleting; it is a mistyped `-name` deleting a different set and saying nothing. So, as with `rm`: **run the `find` with `-print` first**, read the list, then change `-print` to `-delete`.

One more trap is worth seeing. `find` checks conditions left to right, and `-delete` is an *action*, not a filter. Put it first and the test never gets a say. On a throwaway tree with one `.tmp` file and two to keep:

```bash
find fd3
find fd3 -delete -name "*.tmp"
find fd3
```

```text
fd3
fd3/a.tmp
fd3/keep.log
fd3/sub
fd3/sub/b.log
```

```text
find: 'fd3': No such file or directory
```

The middle command printed nothing and exited 0. It deleted every file, the subfolder and the starting folder: `-delete` acted on everything it visited, and `-name` was checked only afterward. `-delete` also turns on `-depth`, which visits a folder's **[[contents before the folder|depth-first]]** — that is what lets it empty the tree from the bottom up. **`-delete` goes last, always.**
:::

::: key The text toolkit
`grep` chooses lines, `cut` and `awk` choose columns, `sort` orders them, `uniq -c` counts *adjacent* runs — so it must follow a `sort` — `tr` maps single characters, and `find` chooses files. `sort -g` handles scientific notation where `sort -n` reads `1e3` as 1. `find ... -exec cmd {} +` batches; `\;` runs once per file.
:::

## Check yourself

::: check
`cut -d' ' -f4 sim.log`, on lines lined up with two spaces between columns, returns empty strings. Explain, and give a command that works.
:::

::: answer
`cut` treats every single space as a separator and never merges runs. With two spaces between columns, `a  b` is three fields: `a`, an empty string, `b`. So field 4 lands somewhere unintended, often empty.

`awk '{print $4}'` works: its default splitting treats any run of spaces as one separator and ignores leading spaces. Or squeeze first: `tr -s ' ' < sim.log | cut -d' ' -f4`. Rule of thumb: `cut` for single-character-separated machine output like CSV, `awk` for anything lined up for human eyes.
:::

::: check
`grep -c DIVERGED runs/*.log | sort -rn | head -3` is meant to show the files with the most matches. It returns `case_0500`, `case_0499` and `case_0498`, all with count 0, and never mentions the one file that matched. What went wrong?
:::

::: answer
With several files, `grep -c` puts the filename in front of each count, so the lines look like `runs/case_0001.log:0`, not `0`. `sort -n` reads a number from the *start* of the line, and a line starting with `r` has none, so every line ties. GNU `sort` then breaks the ties by comparing whole lines as text, and `-r` reverses that too, so the highest case number comes first. Nothing was sorted by count.

Sort on the right field instead: `sort -t: -k2 -rn` makes the colon the separator and sorts on field 2, which puts `runs/case_0417.log:1` on top. The general lesson: whenever `sort -n` seems to ignore the numbers, print the key you are really selecting before blaming the data.
:::

::: check
Say in words what `grep -rh --include='*.log' -E '^[0-9-]+T[0-9:]+Z (WARN|ERROR)' runs/ | awk '{print $2}' | sort | uniq -c | sort -rn` computes, and which stage would break if the `sort` before `uniq` were removed.
:::

::: answer
It searches every `.log` file under `runs/` for lines *starting* with a timestamp — digits and dashes, a `T`, digits and colons, a `Z` — then a space and `WARN` or `ERROR`. `-h` drops filenames so fields line up; `awk '{print $2}'` takes the severity word; `sort` groups identical words; `uniq -c` counts each group; `sort -rn` puts the most common first. Here it prints `4 WARN` then `1 ERROR`.

Without the first `sort`, `uniq -c` would count each *run of neighboring* identical words. Lines arrive in file order, so every change of severity starts a new group — small counts that add up correctly but are grouped meaninglessly — and `sort -rn` would rank those accidents: wrong, and looking right.
:::

::: check
You need to delete every `*.tmp` file under a results tree of 40,000 files. Give three commands that do it, and say which one you would actually run and why.
:::

::: answer
One: `rm results/**/*.tmp`, with bash's `globstar` option switched on so `**` reaches into subfolders. Two: `find results -name '*.tmp' -print0 | xargs -0 rm`. Three: `find results -name '*.tmp' -delete`.

The first can fail with `Argument list too long`, since the shell builds one giant command line, and it needs a shell option set. The second is safe — NUL-separated, batched by `xargs` — and right when you need `-P`.

Run the third, after `find results -name '*.tmp' -print` and reading the list. `-delete` involves no second program, no length limit and no splitting of names as text, so nothing can misread a name. The `-print` dry run is the real protection: the danger is never the mechanism, it is a pattern matching more than you meant.
:::

::: check
Why is `grep` exiting 1 a problem in a script that starts with `set -e`, and what are two correct ways to handle "the pattern might legitimately be absent"?
:::

::: answer
`set -e` stops the script when any command exits non-zero, and `grep` exits 1 for "no lines matched" — a normal result, not a failure. So a check that finds no errors kills the very script doing the checking.

Two correct handlings. Add `|| true` to force a zero status: `matches=$(grep -c ERROR "$log" || true)`. Or test explicitly with `-q` inside an `if`; `set -e` does not act on it there, because the `if` is using the status:

```bash
if grep -q ERROR "$log"; then
  echo "case failed: $log"
fi
```

The second states your intent more plainly. Note that exit status 2 — a missing or unreadable file — *is* a real error, and `|| true` swallows it too. If the difference matters, save the status and test for 2 separately.
:::

## Summary

| Tool | Does | Watch for |
| --- | --- | --- |
| `grep -l` / `-c` / `-n` / `-o` / `-v` | files with a match / counts / line numbers / the match itself / non-matching lines | `-c` and `-l` add the filename with several files |
| `grep -A -B -C` | context lines around a match | shows what led up to a failure |
| `grep` exit 0 / 1 / 2 | matched / no match / real error | exit 1 stops a `set -e` script |
| `-E` vs `-F` | extended regex vs literal text | `-F` for anything with dots or slashes |
| `.` `[..]` `^ $` `*` `+` `?` `{n}` `(a\|b)` | the regex pieces | `.` matches too much and never errors |
| `cut -d, -f1,4` | fields by a one-character delimiter | cannot reorder, cannot merge repeated delimiters |
| `awk -F, '{print $4, $1}'` | fields, reordered, space-aware | `-F'[: ]+'` splits on a pattern; `$NF` is the last field |
| `sort -n` / `-g` / `-h` / `-r` / `-u` | numeric / general numeric / human sizes / reverse / distinct | `-n` reads `1e3` as 1; `-g` reads it as 1000 |
| `sort -t, -k5` | sort on one field | whole-line order means the key is the same on every line |
| `uniq -c` / `-d` / `-u` | count runs / only repeats / only singletons | **adjacent only — sort first** |
| `tr ',' '\n'` / `-s` / `-d` | map characters / squeeze runs / delete | `tr -d '\r'` fixes Windows line endings |
| `find -name -type -size -mtime -maxdepth` | choose files | quote the pattern |
| `find -printf "%s %p\n"` | format the output | sorting by size finds the odd run |
| `find -exec cmd {} +` vs `\;` | batched vs once per file | `+` is faster and space-safe |
| `find -delete` | remove matches with no second program | run it as `-print` first; `-delete` goes last |

Next lesson moves the results off the machine: `diff` and `patch` for what changed, `tar`, `gzip` and `zstd` for packing it up, and `rsync` and `scp` for copying it somewhere else.

::: context grep-name Where the name grep comes from
Early Unix had a line editor called `ed`. Its command `g/re/p` meant "**g**lobally, for every line matching the **r**egular **e**xpression, **p**rint it". Ken Thompson turned that one command into a standalone program in the early 1970s, and the name stuck.

That is also why so many Unix tools share the same pattern language: `ed`, `sed`, `grep` and `vim` are all descendants of the same idea.
:::

::: context e-notation Reading 1.8e+03
Solvers print very large and very small numbers in **e-notation**. `1.8e+03` means $1.8 \times 10^{3} = 1800$, and `4.2e-06` means $4.2 \times 10^{-6} = 0.0000042$. The number after the `e` says how many places to slide the decimal point: right for plus, left for minus.

A residual — how far the solver's answer is from satisfying its equations — of `1.8e+03` when healthy runs sit near `1e-06` is a difference of about nine powers of ten. That is why the run diverged.
:::

::: context bre-and-ere Why there are two regex dialects
The first Unix tools used the small "basic" syntax, where `+`, `?`, `{`, `(` and `|` were ordinary characters. Later tools such as `egrep` added more power, and those symbols became special. To avoid breaking old scripts, basic mode kept them ordinary unless you put a backslash in front.

So `grep 'a+'` looks for the text "a+", while `grep -E 'a+'` looks for one or more a's. Picking `-E` every time spares you from remembering which is which.
:::

::: context dot-picture Why 1.8e matched 128e
Line the pattern up against the text one character at a time. Each pattern character must match the character below it, and `.` accepts anything.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <text x="14" y="38" font-size="12" fill="#1f2a44">pattern</text>
  <text x="14" y="88" font-size="12" fill="#1f2a44">text</text>
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="90" y="18" width="40" height="30" fill="#fff"/>
    <rect x="140" y="18" width="40" height="30" fill="#f2b880"/>
    <rect x="190" y="18" width="40" height="30" fill="#fff"/>
    <rect x="240" y="18" width="40" height="30" fill="#fff"/>
    <rect x="90" y="68" width="40" height="30" fill="#8fb8f0"/>
    <rect x="140" y="68" width="40" height="30" fill="#8fb8f0"/>
    <rect x="190" y="68" width="40" height="30" fill="#8fb8f0"/>
    <rect x="240" y="68" width="40" height="30" fill="#8fb8f0"/>
  </g>
  <g font-size="16" text-anchor="middle" fill="#1f2a44">
    <text x="110" y="39">1</text><text x="160" y="39">.</text><text x="210" y="39">8</text><text x="260" y="39">e</text>
    <text x="110" y="89">1</text><text x="160" y="89">2</text><text x="210" y="89">8</text><text x="260" y="89">e</text>
  </g>
  <text x="160" y="114" font-size="11" text-anchor="middle" fill="#b4232c">"." matched the 2</text>
</svg>
```

All four positions pass, so `residual=128e+03` counts as a match. `\.` or `-F` turns the dot back into a plain dot.
:::

::: context csv-quotes Commas inside a field
Real spreadsheets often contain text with commas, so CSV lets a field be wrapped in double quotes: `42,"Vandenberg, CA",OK` is three fields. `cut -d,` does not know about quotes and sees four: `42`, `"Vandenberg`, ` CA"` and `OK`.

Python's `csv` module, or a spreadsheet program, reads the quotes correctly. Telemetry written by your own code rarely has this problem, which is why `cut` is still so useful.
:::

::: context tie-breaking What sort does with a tie
When two lines have equal keys, GNU `sort` does not leave them as they came. As a last resort it compares the *entire* lines, character by character, so the output is always the same whatever order the input arrived in. The `-s` option ("stable") switches that off and keeps tied lines in their arrival order.

A related surprise: text order depends on your language settings. `LC_ALL=C sort` compares raw byte values, which is faster and gives the same answer on every machine.
:::

::: context uniq-picture What uniq actually sees
`uniq` only compares each line with the one right before it. Without `sort`, the DIVERGED line splits the OK lines into two separate runs.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="10" y="22" font-size="12" fill="#1f2a44">file order</text>
  <rect x="10" y="30" width="260" height="26" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="270" y="30" width="8" height="26" fill="#b4232c" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="278" y="30" width="54" height="26" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="140" y="48" font-size="11" text-anchor="middle" fill="#1f2a44">416 OK</text>
  <text x="305" y="48" font-size="11" text-anchor="middle" fill="#1f2a44">83 OK</text>
  <text x="10" y="84" font-size="12" fill="#1f2a44">after sort</text>
  <rect x="10" y="92" width="8" height="26" fill="#b4232c" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="18" y="92" width="314" height="26" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="175" y="110" font-size="11" text-anchor="middle" fill="#1f2a44">499 OK</text>
  <text x="340" y="48" font-size="11" fill="#1f2a44">3</text>
  <text x="340" y="110" font-size="11" fill="#1f2a44">2</text>
</svg>
```

Bar widths are roughly to scale — 416, 1 and 83 cases above, 1 and 499 below — with the single DIVERGED case widened so you can see it. The numbers on the right are how many groups `uniq -c` reports.
:::

::: context carriage-return Where ^M comes from
Old teleprinters needed two separate moves to start a new line: a **carriage return** (slide the print head back to the left) and a **line feed** (roll the paper up one line). Windows still ends each line with both characters, `\r\n`; Linux uses only `\n`.

A Windows file read on Linux therefore has a stray `\r` at the end of every line. Terminals show it as `^M`, and it quietly breaks comparisons: `OK\r` is not equal to `OK`.
:::

::: context depth-first Contents before the folder
`find -depth` lists everything inside a folder before the folder itself. That order matters for deleting, because a folder can only be removed once it is empty.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44">
    <text x="20" y="24">fd3/</text>
    <text x="44" y="50">a.tmp</text>
    <text x="44" y="76">keep.log</text>
    <text x="44" y="102">sub/</text>
    <text x="68" y="128">b.log</text>
  </g>
  <g stroke="#6c7a93" stroke-width="1">
    <line x1="30" y1="30" x2="30" y2="98"/><line x1="30" y1="46" x2="40" y2="46"/><line x1="30" y1="72" x2="40" y2="72"/><line x1="30" y1="98" x2="40" y2="98"/>
    <line x1="54" y1="106" x2="54" y2="124"/><line x1="54" y1="124" x2="64" y2="124"/>
  </g>
  <text x="190" y="24" font-size="12" fill="#1f2a44">order with -delete:</text>
  <g font-size="12" fill="#1d6fd1">
    <text x="190" y="50">1  a.tmp</text>
    <text x="190" y="72">2  keep.log</text>
    <text x="190" y="94">3  sub/b.log</text>
    <text x="190" y="116">4  sub/</text>
    <text x="190" y="138" fill="#b4232c">5  fd3/ (last)</text>
  </g>
</svg>
```

Each folder comes after its own contents, so by the time `find` reaches it, it is already empty and can be removed.
:::
