---
id: l10-awk
title: awk — fields, patterns and arrays
minutes: 20
covers:
  - sed substitution and addressing; awk fields, patterns, BEGIN/END, arrays
---

`sed` sees a line as a string. `awk` sees it as a record split into fields, and gives you variables, floating-point arithmetic, associative arrays and a place to run code before the first record and after the last. That is enough to turn most log post-processing from a pipeline of five tools into one pass.

It matters for simulation work more than for anything else on this list. A campaign produces columns — time, channel, value, status, exit code — and the questions you ask of them are aggregations: how many of each, what was the largest, which case, what is the spread. Those are three-line `awk` programs, and writing them in bash instead is both slower and, as lesson 04 showed, harder to get right.

All output below was produced on this machine and pasted verbatim, with **GNU Awk 5.2.1** on Ubuntu 24.04.4. That matters: Ubuntu's default `awk` is `mawk`, and `/usr/bin/awk` is a symlink managed by the alternatives system that points at whichever is installed. This machine has `gawk`, so `awk` is `gawk` here. Where the two differ, the text says so.

```bash
ls -l /usr/bin/awk
```

```text
lrwxrwxrwx 1 root root 21 Apr  8  2024 /usr/bin/awk -> /etc/alternatives/awk
```

## The model

An `awk` program is a list of **pattern { action }** rules. For each input record — by default, each line — `awk` tests every pattern in order and runs the action of each one that matches. A rule with no pattern runs on every record; a rule with no action prints the record.

Each record is split into fields on `FS` (runs of whitespace by default). `$1` is the first field, `$0` the whole record, `NF` the number of fields and `$NF` the last one. `NR` is the record number.

```bash
head -3 logs/driver.log
```

```text
2026-04-02T08:01:00Z INFO  case=001 status=OK dv_ms=128.84
2026-04-02T08:02:00Z INFO  case=002 status=OK dv_ms=124.27
2026-04-02T08:03:00Z INFO  case=003 status=OK dv_ms=129.46
```

```bash
awk '{print NR, NF, $NF}' logs/driver.log | head -3
```

```text
1 5 dv_ms=128.84
2 5 dv_ms=124.27
3 5 dv_ms=129.46
```

Note that the two spaces after `INFO` did not create an empty field: whitespace field splitting collapses runs and ignores leading and trailing space. That is precisely what `cut -d' '` cannot do (lesson 06 of the previous module), and it is the main reason to prefer `awk` on human-formatted output.

**Always single-quote the program.** It is full of `$`, `{` and `"`, all of which the shell would take first.

## Patterns

A pattern can be a regular expression, an expression, a range, or `BEGIN`/`END`.

```bash
awk '/ERROR/ {print}' logs/driver.log
awk '$2 == "WARN"' logs/driver.log
awk 'NR>=3 && NR<=5' logs/driver.log
```

```text
2026-04-02T08:12:40Z ERROR case=012 status=FAIL dv_ms=nan
```

```text
2026-04-02T08:12:30Z WARN  case=012 solver retry 1
```

```text
2026-04-02T08:03:00Z INFO  case=003 status=OK dv_ms=129.46
2026-04-02T08:04:00Z INFO  case=004 status=OK dv_ms=138.02
2026-04-02T08:05:00Z INFO  case=005 status=OK dv_ms=135.92
```

The second and third have no action, so the default — print the record — applies. `$2 == "WARN"` is why `awk` beats `grep` for structured logs: it matches the *field*, so a case whose description happens to contain the word `WARN` is not caught.

`BEGIN` runs before any input is read, `END` after the last record:

```bash
awk 'BEGIN{print "start"} {n++} END{print "lines:", n}' logs/run.log
```

```text
start
lines: 400
```

`BEGIN` is where you set `FS`, `OFS` and constants, and print a header. `END` is where almost every aggregation reports. An `awk` program that is only a `BEGIN` block reads no input at all, which is how `awk 'BEGIN{printf "%.4f\n", 10/3}'` became lesson 04's calculator.

## Field separators

`-F` sets the input separator, and it may be a regular expression:

```bash
awk -F'[= ]+' '{print $2, $4, $6}' logs/run.log | head -3
```

```text
0.5 WHEEL_RPM 4187.0
1.0 BUS_VOLTS 27.9
1.5 GYRO_X_DPS -0.1
```

The log line is `t=0.5 chan=WHEEL_RPM val=4187.0`, and splitting on runs of `=` and space gives six fields: the three names in the odd positions and the three values in the even ones. Getting that off by one is the commonest `awk` mistake — print `NF` and a few `$n` before writing the rest.

For a tab-separated file, `-F'\t'` is required and `-F,` is wrong:

```bash
awk -F'\t' 'NR>1 {print $1, $3}' etc/cases.tsv | head -3
```

```text
1 OK
2 OK
3 OK
```

`OFS` is the output separator used by `print` between comma-separated items, and it defaults to a single space:

```bash
awk 'BEGIN{OFS=" | "} {print $2, $3}' logs/driver.log | head -3
```

```text
INFO | case=001
INFO | case=002
INFO | case=003
```

`RS` and `ORS` do the same for records; setting `RS=""` reads blank-line-separated paragraphs, which is how you parse a multi-line record format.

## Arithmetic and `printf`

`awk` has floating point, which bash does not:

```bash
awk 'BEGIN {print 10/3, 2^10, int(7/2), 7%2}'
```

```text
3.33333 1024 3 1
```

`print` uses `OFMT` (`%.6g` by default) and is fine for a quick look. For anything a person or another program will read, use `printf`, whose format string is C's:

```bash
awk 'BEGIN {printf "%.4f %.2e %5d|%-5d|\n", 10/3, 1234.5, 42, 42}'
```

```text
3.3333 1.23e+03    42|42   |
```

```bash
awk -F'[= ]+' 'NR<=3 {printf "%6.1f  %-12s %10.2f\n", $2, $4, $6}' logs/run.log
```

```text
   0.5  WHEEL_RPM       4187.00
   1.0  BUS_VOLTS         27.90
   1.5  GYRO_X_DPS        -0.10
```

`printf` in `awk` does not add a newline — the `\n` is yours to write, and forgetting it produces one very long line.

Variables need no declaration and start empty, which is zero in a numeric context: `{n++}` works without initialising `n`. A field used arithmetically is converted to a number, and a field that is not numeric converts to 0 — so `dv_ms=nan` in the log above contributes nothing to a sum and still counts in `NR`.

::: warning
`NR` is the number of records **read**, not the number you selected. Dividing a filtered sum by `NR` is a silent, plausible error:

```bash
awk -F'[= ]+' '$4=="BUS_VOLTS" {s+=$6} END {printf "wrong: dividing by NR=%d gives %.3f\n", NR, s/NR}' logs/run.log
```

```text
wrong: dividing by NR=400 gives 6.997
```

```bash
awk -F'[= ]+' '$4=="BUS_VOLTS" {s+=$6; n++} END {printf "bus mean over %d samples = %.3f\n", n, s/n}' logs/run.log
```

```text
bus mean over 100 samples = 27.990
```

The bus voltage is 28 V, and the first command reported 7.0 — which is not obviously absurd if you do not already know the answer. **Count what you sum.** Increment your own counter in the same rule that accumulates, and divide by that.

The same applies to `END{print s/NR}` on a file with a header line, a trailing blank line, or comment lines: all of them are records.
:::

## Arrays

`awk` arrays are associative — the subscript is a string — and they are the feature that makes one-pass aggregation possible.

```bash
awk -F'[= ]+' '{ n[$4]++ } END { for (c in n) print c, n[c] }' logs/run.log | sort
```

```text
BUS_VOLTS 100
GYRO_X_DPS 100
TANK_PSI 100
WHEEL_RPM 100
```

`n[$4]++` creates the entry on first use with value 0 and increments it. `for (c in n)` iterates the keys — in an **unspecified order**, which is why the `| sort` is there. GNU awk can sort for you:

```bash
awk 'BEGIN{PROCINFO["sorted_in"]="@ind_str_asc"} {n[$2]++} END{for (k in n) print k, n[k]}' logs/driver.log
```

```text
ERROR 1
INFO 24
WARN 1
```

but that is a `gawk` extension, and `mawk` ignores it silently:

```bash
mawk 'BEGIN{PROCINFO["sorted_in"]="@ind_str_asc"} {n[$2]++} END{for (k in n) print k, n[k]}' logs/driver.log
```

```text
INFO 24
ERROR 1
WARN 1
```

No error, different order. If the output order matters, pipe to `sort` — which works everywhere — or state in the script that it requires `gawk`.

`key in array` tests membership without creating the key, and `delete array[key]` removes one. Multidimensional subscripts are written `a[i,j]` and are really a single key with `SUBSEP` between the parts.

::: example Min, max and range per channel in one pass
The whole point of arrays: four hundred interleaved records, four channels, one read of the file.

```bash
awk -F'[= ]+' '
  { c=$4; v=$6
    if (!(c in lo) || v < lo[c]) lo[c]=v
    if (!(c in hi) || v > hi[c]) hi[c]=v }
  END { for (c in lo) printf "%-12s min=%10.2f  max=%10.2f  range=%10.2f\n", c, lo[c], hi[c], hi[c]-lo[c] }
' logs/run.log | sort
```

```text
BUS_VOLTS    min=     27.20  max=     28.90  range=      1.70
GYRO_X_DPS   min=     -2.10  max=      3.00  range=      5.10
TANK_PSI     min=    297.80  max=    323.90  range=     26.10
WHEEL_RPM    min=   3964.20  max=   4405.10  range=    440.90
```

Four details make it correct. `!(c in lo)` seeds each channel from its first record instead of from a magic sentinel like `1e99`, which would be wrong for a channel whose values are larger. The comparison `v < lo[c]` is numeric because both sides came from fields that look like numbers — if a value could be non-numeric, force it with `v+0` and check. Assigning `c=$4` and `v=$6` once costs nothing and stops the field indices being repeated in four places, where they are easy to get wrong. And `| sort` gives a deterministic order, which matters the moment this output is compared against a previous run.

Extending it to a per-channel mean, or to a count of samples outside a limit, is one more array and one more line each — which is the shape of most real post-processing.
:::

## Passing values in, and out

`-v name=value` sets a variable before the program runs, and is the only safe way to get a shell value into an `awk` program:

```bash
awk -F'[= ]+' -v chan=WHEEL_RPM -v lim=4400 '$4==chan && $6>lim {print NR": "$0}' logs/run.log
```

```text
201: t=100.5 chan=WHEEL_RPM val=4401.7
369: t=184.5 chan=WHEEL_RPM val=4405.1
```

The alternative — interpolating with double quotes, `awk "\$4==\"$chan\""` — makes the shell rewrite the program text, so a value containing a quote, a backslash or a `/` breaks it, and the quoting becomes unreadable at the second variable. Use `-v` and keep the program single-quoted.

Sending output somewhere is the mirror image: `print > "file"` writes, `>>` appends, and `| "command"` pipes:

```bash
awk -F'[= ]+' '{ n[$4]++ } END { for (c in n) printf "%-12s %d\n", c, n[c] | "sort" }' logs/run.log
```

```text
BUS_VOLTS    100
GYRO_X_DPS   100
TANK_PSI     100
WHEEL_RPM    100
```

The `sort` runs as a child of `awk`, which is occasionally useful for writing several sorted files in one pass. For a single output stream, piping outside is clearer.

`awk` exits 0 normally, and `exit N` in a rule sets the status — after running `END`, which is a detail worth knowing:

```bash
awk 'BEGIN{exit 3}'; echo "awk exit=$?"
```

```text
awk exit=3
```

That is how an `awk` check becomes a test in a script: `awk '...' log || handle_failure`.

## Several files, and longer programs

`FNR` is the record number within the current file and `FILENAME` is its name, which is how you treat files separately:

```bash
awk '{print FILENAME, FNR, NR}' logs/driver.log etc/sim.conf | sed -n '1p;26p;27p;30p'
```

```text
logs/driver.log 1 1
logs/driver.log 26 26
etc/sim.conf 1 27
etc/sim.conf 4 30
```

`FNR==1` is therefore "the first line of each file" — the idiom for skipping a header in every input, or for printing a banner. `NR==FNR` is true only while the *first* file is being read, which is the classic two-file join: build an array from file one, then look it up while reading file two.

`next` skips the remaining rules for this record and `exit` stops reading:

```bash
awk '/^#/ {next} {print "kept:", $0}' etc/sim.conf
```

```text
kept: vehicle = falcon9-s1
kept: dt      = 0.002
kept: horizon = 18.0
```

Once a program is more than about three lines, put it in a file and run `awk -f prog.awk data`, or embed it in a here-document with a quoted delimiter so the shell leaves it alone:

```bash
awk -f /dev/stdin logs/driver.log <<'AWKEOF'
$2 == "ERROR" { bad++ }
END { printf "%d error line(s) in %d\n", bad, NR }
AWKEOF
```

```text
1 error line(s) in 26
```

The quoted `'AWKEOF'` is what stops bash expanding `$2` (lesson 05 of the previous module). Without the quotes the program would arrive as `== "ERROR"`.

::: example Joining a manifest to a result log in one pass
`NR==FNR` is true only while the first file is being read, which makes a two-file lookup natural: build an array from file one, then use it while reading file two.

```text
001	100001
002	100002
003	100003
012	100012
```

```bash
awk -F'[= \t]+' '
  NR==FNR { seed[$1]=$2; next }
  $2=="INFO" { id=$4; printf "case %s  seed=%s  dv=%s\n", id, (id in seed ? seed[id] : "?"), $8 }
' etc/seeds.tsv logs/driver.log | head -5
```

```text
case 001  seed=100001  dv=128.84
case 002  seed=100002  dv=124.27
case 003  seed=100003  dv=129.46
case 004  seed=?  dv=138.02
case 005  seed=?  dv=135.92
```

The seed file lists four cases; the log has twenty-six. Cases 004 and 005 print `?` because `(id in seed)` is false — which is the point of testing membership rather than reading `seed[id]` directly, since a bare read would create the key with an empty value and quietly report a blank seed.

Two details. `next` after the first rule stops the second rule from also running on the manifest's records, which would otherwise be processed as if they were log lines. And `NR==FNR` is subtly wrong if the first file can be empty — `FNR` restarts at 1 for the second file while `NR` continues, so with an empty first file the test is never true and everything is treated as file two, which is usually the right failure but is worth knowing. A file-name test, `FILENAME==ARGV[1]`, is unambiguous.

The `join` command does the same job for pre-sorted files and is lesson 11's subject; `awk` wins when the key needs computing, the files are not sorted, or the output needs formatting.
:::

## The built-in functions worth knowing

```bash
awk 'BEGIN{ s="chan=WHEEL_RPM"; print length(s), substr(s,6), index(s,"="), toupper("ok") }'
awk 'BEGIN{ n=split("a:b:c", p, ":"); print n, p[1], p[3] }'
awk 'BEGIN{ if (match("dv_ms=128.84", /[0-9]+\.[0-9]+/)) print RSTART, RLENGTH, substr("dv_ms=128.84", RSTART, RLENGTH) }'
```

```text
14 WHEEL_RPM 5 OK
```

```text
3 a c
```

```text
7 6 128.84
```

`length`, `substr` (1-based), `index`, `split` (which returns the count and fills an array), `match` (which sets `RSTART` and `RLENGTH`), `sub` and `gsub` (which edit `$0` or a named field in place and return how many replacements they made), `sprintf`, `toupper`/`tolower`. `split($0, a, /re/)` is how you parse a field that has internal structure without changing `FS` for the whole program.

::: key
`awk` runs **pattern { action }** rules against each record, which is split into `$1`…`$NF` on `FS`. `BEGIN` runs before input, `END` after. Patterns may be regexes, field comparisons or ranges; an empty action prints. Arrays are associative and iterate in unspecified order — pipe to `sort`. `NR` counts records read, not records matched, so count what you sum. Use `-v` to pass shell values in, and single-quote the program always.
:::

## Check yourself

::: check
`awk '{s += $3} END {print s/NR}' telemetry.txt` reports a value about a tenth of what you expected. Give two reasons this can happen.
:::

::: answer
First, `NR` counts every record read, not the ones that contributed to `s`. If the file has a header line, blank lines, comment lines, or interleaves several channels and only some have a meaningful column 3, the denominator is too large and the mean comes out proportionally small. A file of four interleaved channels divides by four times too many. The fix is to count in the same rule that sums — `{s += $3; n++}` — under whatever pattern selects the records you mean.

Second, non-numeric values in column 3 convert to 0. A field of `nan`, `N/A`, `-` or an empty string adds nothing to `s` and still increments `NR`. `awk` does not warn; conversion is silent and defined. If the data can contain those, filter explicitly: `$3 ~ /^-?[0-9.]+$/ {s += $3; n++}`.

A third possibility to rule out: the field index is wrong because the separator is not what you assume. Whitespace splitting collapses runs, so a file aligned with spaces has different field numbers from one aligned with tabs. Print `NF` and `$3` for a few records before trusting the sum.
:::

::: check
Explain the difference between `awk '/WARN/'` and `awk '$2 == "WARN"'` on a log, and why the second is usually what you want.
:::

::: answer
The first matches the *record*: any line containing the four characters `WARN` anywhere, including inside a case name, a file path, a message such as `no warnings`, or a field that happens to end in it. It is `grep` with extra steps.

The second matches a *field*: the second whitespace-separated field must be exactly `WARN`. A message mentioning warnings elsewhere on the line does not match, and neither does `WARNING` in that position, because the comparison is exact equality rather than a substring test.

The second is usually right because a log line is structured, and the severity lives in a known column. It is also faster, because no regular expression is involved. The cases for the regex form are when the position varies, or when you deliberately want a substring — and then `$2 ~ /^WARN/` gives you the regex *and* the column, which is usually the best of both.

The underlying point is that `awk` can see the structure and `grep` cannot. Using `awk` as a slower `grep` gives up its main advantage.
:::

::: check
Why does `awk "\$1 == \"$chan\""` sometimes fail, and what should you write instead?
:::

::: answer
Because the shell rewrites the program before `awk` sees it. Inside double quotes, bash expands `$chan` into the program *text*, so the program that runs depends on the value. A value containing a double quote ends the string early and produces a syntax error; a backslash is consumed by bash; a value that is empty leaves `$1 == ""`, which quietly matches blank fields. And the escaping needed for `awk`'s own `$1` makes the line unreadable once there are two variables.

Write `awk -v chan="$chan" '$1 == chan'`. The program stays single-quoted, so bash does not touch it, and the value arrives through `awk`'s own variable mechanism where quoting and backslashes are handled correctly.

One caveat on `-v`: the value goes through escape-sequence processing, so a literal backslash must be doubled. If the value is a path or a pattern containing backslashes, pass it in the environment instead and read it with `ENVIRON["chan"]`, which does no processing at all.
:::

::: check
An aggregation prints its channels in a different order on two machines, with identical input. What causes it, and what are two fixes?
:::

::: answer
`for (k in array)` iterates in an implementation-defined order — effectively the hash order — and it is not guaranteed to be stable between implementations, between versions, or between runs. Two machines with `mawk` and `gawk`, or with different `gawk` versions, produce different orders from the same data. Nothing is wrong with either.

Fix one, portable: pipe the output to `sort`, so the ordering is done by a program whose behaviour is specified. `... | sort` for lexicographic, `sort -k2 -g` to order by a computed value. This also lets you sort by something other than the key.

Fix two, `gawk` only: `PROCINFO["sorted_in"]="@ind_str_asc"` makes `for (k in array)` iterate in ascending key order. `mawk` ignores the setting **silently**, which is the trap — the script appears to work and produces unsorted output on the other machine. If you rely on it, check the interpreter first:

```bash
awk  'BEGIN { if (PROCINFO["version"] == "") { print "this script needs gawk" > "/dev/stderr"; exit 2 } print "gawk", PROCINFO["version"] }'
mawk 'BEGIN { if (PROCINFO["version"] == "") { print "this script needs gawk" > "/dev/stderr"; exit 2 } print "gawk", PROCINFO["version"] }'
```

```text
gawk 5.2.1
```

```text
this script needs gawk
```

Exit 0 and exit 2. `PROCINFO` does not exist at all in `mawk`, so the subscript yields the empty string; note that testing `"sorted_in" in PROCINFO` does *not* work, because that key is absent under `gawk` too until you set it.

The general principle: any output that will be diffed against a previous run must have a defined order, and "the order awk happened to produce" is not one.
:::

::: check
When is `awk` the wrong tool, and what replaces it?
:::

::: answer
When the input is not line-and-field structured. JSON, XML and YAML have nesting that a record-and-field model cannot represent; a value may span lines and may contain the separator. `jq` handles JSON properly and is the next lesson; for XML use a parser; for CSV with quoted fields containing commas, use a real CSV reader, because `-F,` splits inside the quotes and produces plausible wrong columns.

When the computation needs more than accumulation. Sorting a large intermediate, joining on several keys, fitting a curve, anything statistical beyond means and extrema, or anything that must be tested — those belong in Python with `numpy` or `pandas`, which lesson 14 argues for at length. `awk`'s arrays are one-dimensional string maps and its only control flow is loops and conditionals; a program that needs more is fighting the language.

When the numbers need care. `awk` computes in double precision, which is usually fine, but it has no decimal type, no integer overflow behaviour you can rely on across implementations, and `%d` on a value beyond 2^53 loses precision silently.

`awk` remains the right tool for exactly what it is good at: one pass over a columnar text stream, selecting by field, accumulating into arrays, and printing a formatted summary. Most campaign post-processing is precisely that shape, which is why it earns a lesson.
:::

## Summary

| Form | Meaning | Note |
| --- | --- | --- |
| `pattern { action }` | run the action on matching records | no pattern = every record; no action = print |
| `$0 $1 … $NF`, `NF`, `NR` | record, fields, field count, record number | whitespace splitting collapses runs |
| `-F'[= ]+'`, `-F'\t'` | input separator, may be a regex | print `NF` first; off-by-one is the usual bug |
| `OFS`, `RS`, `ORS` | output field, input record, output record separators | `RS=""` reads paragraphs |
| `BEGIN` / `END` | before any input / after the last record | set `FS` and constants; report aggregates |
| `$2 == "WARN"` vs `/WARN/` | field equality vs substring anywhere | the field test is what structure buys you |
| `printf "%.3f %-10s\n"` | C-style formatting | no implicit newline |
| `{n++}`, `s += $6` | variables need no declaration; start at 0/"" | a non-numeric field converts to 0 |
| `NR` in `END` | records **read** | count what you sum; `{s+=$6; n++}` |
| `a[$4]++`, `for (k in a)`, `k in a`, `delete a[k]` | associative arrays | iteration order is unspecified — pipe to `sort` |
| `PROCINFO["sorted_in"]` | ordered iteration | **gawk only**; mawk ignores it silently |
| `-v name=value` | pass a shell value in safely | never interpolate into the program text |
| `print > "f"`, `\| "cmd"` | write or pipe from inside awk | the child runs under awk |
| `exit N` | sets awk's exit status | `END` still runs |
| `FNR`, `FILENAME`, `NR==FNR` | per-file counter, name, "still on the first file" | the two-file join idiom |
| `next` | skip the remaining rules for this record | the comment-stripping idiom |
| `awk -f prog.awk`, `<<'EOF'` | longer programs | quote the here-doc delimiter |
| `length substr index split match sub gsub sprintf toupper` | the built-ins you will use | `substr` is 1-based; `match` sets `RSTART`/`RLENGTH` |

Lesson 11 handles the data `awk` should not touch: JSON with `jq`, and the `column`, `paste` and `join` tools for lining tabular text up.
