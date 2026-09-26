---
id: l10-awk
title: awk — fields, patterns and arrays
minutes: 21
covers:
  - sed substitution and addressing; awk fields, patterns, BEGIN/END, arrays
---

Think of a spreadsheet. Every row is one reading, and every column holds one kind of thing — time, channel, value. You never think "a long string of characters". You think "the third cell of row 12".

`sed`, from the last lesson, sees a line as a string. **`awk`** sees it the spreadsheet way: a **[[record|awk-name]]** — one row — cut into **fields**, the cells. It adds variables, decimal arithmetic, tables indexed by name, and a place to run code before the first row and after the last. That turns most log post-processing from a pipeline of five tools into one pass.

A test campaign produces columns — time, channel, value, status, exit code — and the questions you ask are **aggregations**, answers that boil many rows down to a few numbers: how many of each, the largest, which case, the spread. Each is a three-line `awk` program. In bash it is slower and, as lesson 04 showed, harder to get right.

All output below is real, from **GNU Awk 5.2.1** on Ubuntu 24.04. Ubuntu's default `awk` is a different program, **[[`mawk`|three-awks]]**, and `/usr/bin/awk` is a link the system's "alternatives" mechanism points at whichever one is chosen:

```bash
ls -l /usr/bin/awk
```

```text
lrwxrwxrwx 1 root root 21 Apr  8  2024 /usr/bin/awk -> /etc/alternatives/awk
```

Here, `awk` was `gawk`. Where the two differ, the text says so.

## The model

An `awk` program is a list of rules shaped **pattern { action }** — a test, then what to do when it passes. For each record (by default, each line), `awk` tries every pattern in order and runs the action of each one that matches. A rule with no pattern runs on every record. A rule with no action prints the record.

Each record is split into fields on **`FS`**, the field separator. By default that is "any run of spaces or tabs". Then:

- `$1` (read "dollar one") is the first field, `$2` the second, and so on.
- `$0` is the whole record.
- `NF` is the **number of fields** in this record.
- `$NF` (read "dollar N F") is the last field — field number `NF`.
- `NR` is the **number of the record** — which line you are on, counted across all input.

Here is a driver log, and a program that prints three of those values for each line:

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

Line 1 has **[[5 fields|field-picture]]**, the last being `dv_ms=128.84`. The two spaces after `INFO` did not create an empty field: whitespace splitting treats a run of spaces as one gap and ignores spaces at the ends of the line. `cut -d' '` cannot do that (lesson 06 of the previous module), which is the main reason to prefer `awk` on output lined up for human eyes.

::: key In awk, what are NR and NF?
`NR` is the current record (line) number across all input; `NF` is the number of fields in the current record. `$NF` is the last field, which is the idiomatic way to grab a trailing value.
:::

**Always put the program in single quotes.** It is full of `$`, `{` and `"`, which the shell would otherwise grab first.

## Patterns

A pattern can be a regular expression between slashes, a comparison, a range of line numbers, or one of the two special words `BEGIN` and `END`.

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

Read `==` as "is equal to" and `&&` as "and". The second and third programs have no action, so the default — print the record — applies.

The second is why `awk` beats `grep` on structured logs. `$2 == "WARN"` tests the severity *field* and nothing else, so a message that mentions `WARN` elsewhere on the line is not caught.

`BEGIN` runs before any input is read. `END` runs after the last record:

```bash
awk 'BEGIN{print "start"} {n++} END{print "lines:", n}' logs/run.log
```

```text
start
lines: 400
```

`n++` (read "n plus plus") adds one to `n`. The middle rule has no pattern, so it runs on all 400 lines, and `END` reports the count.

`BEGIN` is where you set `FS`, `OFS` and constants, and print a header. `END` is where aggregations report. A program that is *only* a `BEGIN` block reads no input at all — which is how `awk 'BEGIN{printf "%.4f\n", 10/3}'` became lesson 04's calculator.

## Field separators

The `-F` option sets the input separator, and it may be a regular expression:

```bash
awk -F'[= ]+' '{print $2, $4, $6}' logs/run.log | head -3
```

```text
0.5 WHEEL_RPM 4187.0
1.0 BUS_VOLTS 27.9
1.5 GYRO_X_DPS -0.1
```

Read `[= ]+` as "one or more characters, each an equals sign or a space" — see **[[reading the pattern|reading-the-separator]]**. The line `t=0.5 chan=WHEEL_RPM val=4187.0` splits into six fields: names in the odd positions, values in the even ones. Getting that count off by one is the commonest `awk` mistake, so print `NF` and a few `$n` before writing the rest.

For a tab-separated file, `-F'\t'` is required, and `-F,` is wrong:

```bash
awk -F'\t' 'NR>1 {print $1, $3}' etc/cases.tsv | head -3
```

```text
1 OK
2 OK
3 OK
```

`NR>1` skips the header. **`OFS`**, the output field separator, is what `print` puts between comma-separated items — a single space unless you change it:

```bash
awk 'BEGIN{OFS=" | "} {print $2, $3}' logs/driver.log | head -3
```

```text
INFO | case=001
INFO | case=002
INFO | case=003
```

`RS` and `ORS` do the same for records. `RS=""` reads blank-line-separated paragraphs as single records, for formats where one record spans several lines.

## Arithmetic and `printf`

`awk` does arithmetic with decimals, which bash cannot:

```bash
awk 'BEGIN {print 10/3, 2^10, int(7/2), 7%2}'
```

```text
3.33333 1024 3 1
```

Left to right: ten divided by three; two to the power ten (`^`); `int` chops the fraction off 3.5; and `%` is the remainder of 7 divided by 2.

`print` shows about six significant digits — fine for a quick look. For anything a person or program will read, use **`printf`**, whose format string works like C's:

```bash
awk 'BEGIN {printf "%.4f %.2e %5d|%-5d|\n", 10/3, 1234.5, 42, 42}'
```

```text
3.3333 1.23e+03    42|42   |
```

Each `%` code takes the next value. `%.4f` is four decimal places. `%.2e` is scientific notation — `1.23e+03` is $1.23 \times 10^3$. `%5d` is a whole number padded on the left to five characters; `%-5d` pads on the right. The **[[bars show the padding|printf-widths]]**.

```bash
awk -F'[= ]+' 'NR<=3 {printf "%6.1f  %-12s %10.2f\n", $2, $4, $6}' logs/run.log
```

```text
   0.5  WHEEL_RPM       4187.00
   1.0  BUS_VOLTS         27.90
   1.5  GYRO_X_DPS        -0.10
```

`printf` does not add a newline. The `\n` is yours to write, and forgetting it produces one very long line.

Variables need no declaration. They start empty, and empty counts as zero, so `{n++}` works without setting `n` first. A field that does not look like a number converts to 0 in arithmetic. So `dv_ms=nan` in the driver log adds nothing to a sum — but it is still a record, and still counts in `NR`.

::: warning `NR` counts records read, not records you chose
Dividing a filtered sum by `NR` is a silent, plausible error:

```bash
awk -F'[= ]+' '$4=="BUS_VOLTS" {s+=$6} END {printf "wrong: dividing by NR=%d gives %.3f\n", NR, s/NR}' logs/run.log
```

```text
wrong: dividing by NR=400 gives 6.998
```

```bash
awk -F'[= ]+' '$4=="BUS_VOLTS" {s+=$6; n++} END {printf "bus mean over %d samples = %.3f\n", n, s/n}' logs/run.log
```

```text
bus mean over 100 samples = 27.990
```

`s+=$6` (read "s plus-equals dollar six") adds to a running total. The bus runs at 28 V, and the first command reported 7.0 — a quarter of the truth, because one line in four is a bus reading. Without knowing the answer, 7.0 would not look absurd. **Count what you sum**: add to your own counter in the same rule that adds to the total, and divide by that.

The same trap waits in `END{print s/NR}` on a file with a header, a trailing blank line or comment lines. All of them are records.
:::

## Arrays

An `awk` array is **associative**: its index — the **subscript**, in square brackets — is a string, not a position. Think of labeled jars rather than numbered boxes. This is what makes one-pass aggregation possible.

```bash
awk -F'[= ]+' '{ n[$4]++ } END { for (c in n) print c, n[c] }' logs/run.log | sort
```

```text
BUS_VOLTS 100
GYRO_X_DPS 100
TANK_PSI 100
WHEEL_RPM 100
```

`n[$4]++` means "add one to the jar labeled with this line's channel". The first time a name appears, its jar is **[[created on the spot|jars-picture]]** holding 0.

`for (c in n)` walks the labels in an **unspecified order** — however the **[[table happens to store them|hash-order]]** — which is why the `| sort` is there. Without it, the two versions of `awk` disagree:

```bash
gawk -F'[= ]+' '{ n[$4]++ } END { for (c in n) print c, n[c] }' logs/run.log
mawk -F'[= ]+' '{ n[$4]++ } END { for (c in n) print c, n[c] }' logs/run.log
```

```text
GYRO_X_DPS 100
WHEEL_RPM 100
TANK_PSI 100
BUS_VOLTS 100
```

```text
TANK_PSI 100
BUS_VOLTS 100
WHEEL_RPM 100
GYRO_X_DPS 100
```

Same data, two orders, neither wrong. GNU awk can sort for you:

```bash
awk 'BEGIN{PROCINFO["sorted_in"]="@ind_str_asc"} {n[$2]++} END{for (k in n) print k, n[k]}' logs/driver.log
```

```text
ERROR 1
INFO 24
WARN 1
```

But that is a `gawk` extension, and `mawk` ignores it without a word:

```bash
mawk 'BEGIN{PROCINFO["sorted_in"]="@ind_str_asc"} {n[$2]++} END{for (k in n) print k, n[k]}' logs/driver.log
```

```text
INFO 24
ERROR 1
WARN 1
```

No error, different order. If order matters, pipe to `sort`, which works everywhere, or state that the script needs `gawk`.

`key in array` tests whether a label exists *without* creating it, and `delete array[key]` removes one. A two-part subscript, `a[i,j]`, is really one string key with a hidden separator, `SUBSEP`, between the parts.

::: example Min, max and range per channel in one pass
Four hundred interleaved records, four channels, one read of the file.

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

The first rule runs on every record. It copies the channel into `c` and the value into `v`, then says: "if this channel has no low yet (`!` is "not", `||` is "or"), or this value is lower, store it". The same for the high. `END` prints each channel's low, high and difference.

Sanity check: for the bus, $28.90 - 27.20 = 1.70$; for the wheel, $4405.10 - 3964.20 = 440.90$. Both match the range column.

Four details make it correct:

- `!(c in lo)` seeds each channel from its own first value, not from a made-up sentinel like `1e99`, which fails the day a channel's values are larger.
- `v < lo[c]` compares as numbers because both came from numeric-looking fields. If a value could be non-numeric, force it with `v+0` and check.
- `c=$4` and `v=$6` put the field numbers in one place instead of four.
- `| sort` gives a fixed order, which matters once this output is compared with a previous run.

A per-channel mean, or a count outside a limit, is one more array and one more line each.
:::

## Passing values in, and out

`-v name=value` sets an `awk` variable before the program runs. It is the safe way to get a shell value into an `awk` program:

```bash
awk -F'[= ]+' -v chan=WHEEL_RPM -v lim=4400 '$4==chan && $6>lim {print NR": "$0}' logs/run.log
```

```text
201: t=100.5 chan=WHEEL_RPM val=4401.7
369: t=184.5 chan=WHEEL_RPM val=4405.1
```

Two wheel readings went over 4400 rpm. The alternative, pasting the value in with double quotes — `awk "\$4==\"$chan\""` — makes the shell rewrite the program text. A value containing a quote, a backslash or a `/` breaks it, and the quoting is unreadable by the second variable.

Output goes the other way: `print > "file"` writes, `>>` appends, and `| "command"` pipes into a command:

```bash
awk -F'[= ]+' '{ n[$4]++ } END { for (c in n) printf "%-12s %d\n", c, n[c] | "sort" }' logs/run.log
```

```text
BUS_VOLTS    100
GYRO_X_DPS   100
TANK_PSI     100
WHEEL_RPM    100
```

The `sort` runs as a child of `awk`, occasionally useful for writing several sorted files in one pass. For one output stream, a pipe outside is clearer.

`exit N` stops reading and sets `awk`'s exit status — but still runs `END` first:

```bash
awk 'BEGIN{exit 3}'; echo "awk exit=$?"
```

```text
awk exit=3
```

That is how an `awk` check becomes a test in a script: `awk '...' log || handle_failure`.

## Several files, and longer programs

When you give `awk` several files, **`FNR`** is the record number *within the current file* and **`FILENAME`** is that file's name. `NR` keeps counting across all of them:

```bash
awk '{print FILENAME, FNR, NR}' logs/driver.log etc/sim.conf | sed -n '1p;26p;27p;30p'
```

```text
logs/driver.log 1 1
logs/driver.log 26 26
etc/sim.conf 1 27
etc/sim.conf 4 30
```

At the start of `sim.conf`, `FNR` **[[starts again at 1|nr-fnr-picture]]** while `NR` carries on to 27. So `FNR==1` means "the first line of each file" — for skipping every header. And `NR==FNR` is true only while the *first* file is read: the classic two-file join.

`next` skips the remaining rules for this record:

```bash
awk '/^#/ {next} {print "kept:", $0}' etc/sim.conf
```

```text
kept: vehicle = falcon9-s1
kept: dt      = 0.002
kept: horizon = 18.0
```

The comment line matched `/^#/` ("starts with #"), so `next` skipped the print. Past about three lines, put the program in a file and run `awk -f prog.awk data`, or in a here-document with a quoted delimiter:

```bash
awk -f /dev/stdin logs/driver.log <<'AWKEOF'
$2 == "ERROR" { bad++ }
END { printf "%d error line(s) in %d\n", bad, NR }
AWKEOF
```

```text
1 error line(s) in 26
```

The quotes around `'AWKEOF'` are what stop bash from expanding `$2` (lesson 08). Without them the program would arrive as `== "ERROR"`.

::: example Joining a manifest to a result log in one pass
The seeds file lists a random seed for some of the cases:

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

The separator `[= \t]+` splits on equals signs, spaces and tabs, so in a log line the case id is `$4` and the value `$8`. While reading the seeds file, rule one stores each seed under its id and calls `next`, so rule two never sees those lines. While reading the log, rule two looks the id up.

`(id in seed ? seed[id] : "?")` reads "if the id is in the table, its seed, otherwise a question mark". Cases 004 and 005 have no seed, so they print `?`. Testing membership matters: a bare `seed[id]` would *create* the key and quietly report a blank seed.

One blind spot: if the first file is empty, `NR` and `FNR` stay equal all through the second file, and every log line is stored as a seed. `FILENAME==ARGV[1]` has no such hole.

The `join` command does this for pre-sorted files (lesson 11). `awk` wins when the key must be computed, the files are unsorted, or the output needs formatting.
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

`chan=WHEEL_RPM` is 14 characters; from character 6 on it reads `WHEEL_RPM`; the `=` is at position 5. Positions count from 1, not 0. The set to know:

- `length`, `substr` (counting from 1) and `index` for pieces of strings.
- `split(s, a, sep)`, which fills array `a` and returns how many pieces it made.
- `match(s, /re/)`, which sets `RSTART` (where the match begins) and `RLENGTH` (how long it is).
- `sub` and `gsub`, which edit `$0` or a named field in place and return how many replacements they made.
- `sprintf`, which is `printf` into a string, and `toupper`/`tolower`.

`split($0, a, /re/)` takes apart a field with inner structure without changing `FS` for the whole program.

::: key
`awk` runs **pattern { action }** rules against each record, which is split into `$1`…`$NF` on `FS`. `BEGIN` runs before input, `END` after. Patterns may be regexes, field comparisons or ranges; an empty action prints. Arrays are associative and iterate in unspecified order — pipe to `sort`. `NR` counts records read, not records matched, so count what you sum. Use `-v` to pass shell values in, and single-quote the program always.
:::

## Check yourself

::: check
`awk '{s += $3} END {print s/NR}' telemetry.txt` reports a value about a tenth of what you expected. Give two reasons this can happen.
:::

::: answer
First, `NR` counts every record read, not the ones that added to `s`. A header, blank lines, comment lines, or other channels mixed in all make the divisor too big, and the mean too small in proportion — four mixed channels divide by four times too many. Count in the same rule that sums, `{s += $3; n++}`, under a pattern that picks the records you mean.

Second, non-numeric values in column 3 convert to 0. `N/A`, `-` or an empty field adds nothing to `s` but still adds one to `NR`, and `awk` does not warn. (`nan` is special: GNU awk treats it as 0 like any other word, but `mawk` reads it as not-a-number and the whole sum becomes `nan`.) Filter explicitly: `$3 ~ /^-?[0-9.]+$/ {s += $3; n++}`, where `~` reads "matches".

Also rule out a wrong field number: a file lined up with spaces can number its fields differently from one lined up with tabs. Print `NF` and `$3` for a few records first.
:::

::: check
Explain the difference between `awk '/WARN/'` and `awk '$2 == "WARN"'` on a log, and why the second is usually what you want.
:::

::: answer
The first matches the *record*: any line containing `WARN` anywhere — in a case name, a file path, a message like `NO WARNINGS`. It is `grep` with extra steps.

The second matches a *field*: the second whitespace-separated field must be exactly `WARN`. A mention elsewhere on the line does not match, and neither does `WARNING` in that column, because the test is equality, not "contains".

The second is usually right because the severity lives in a known column, and it is faster, with no regular expression involved. When you do want a pattern, `$2 ~ /^WARN/` gives the regex *and* the column. `awk` can see structure and `grep` cannot; using `awk` as a slower `grep` throws that away.
:::

::: check
Why does `awk "\$1 == \"$chan\""` sometimes fail, and what should you write instead?
:::

::: answer
Because bash pastes the value of `$chan` into the program *text*, so the program depends on the value. A double quote in it ends the string early — a syntax error. A backslash is eaten by bash. An empty value leaves `$1 == ""`, which quietly matches blank fields. And escaping `awk`'s own `$1` makes the line unreadable.

Write `awk -v chan="$chan" '$1 == chan'`. The program stays in single quotes, so bash does not touch it, and the value arrives through `awk`'s own variable mechanism.

One catch with `-v`: the value goes through escape processing, so `\t` in it becomes a tab and a literal backslash must be doubled. If the value is a path or a pattern with backslashes in it, pass it through the environment instead and read it with `ENVIRON["chan"]`, which does no processing at all.
:::

::: check
An aggregation prints its channels in a different order on two machines, with identical input. What causes it, and what are two fixes?
:::

::: answer
`for (k in array)` walks the keys in the order of the implementation's internal hash table, which need not match between implementations, versions, or even runs. `mawk` and `gawk` gave different orders from the same data in this lesson. Neither is wrong.

Fix one, portable: pipe to `sort`, whose behavior is specified — `sort` for alphabetical, `sort -k2 -g` to order by a computed value in column 2.

Fix two, `gawk` only: `PROCINFO["sorted_in"]="@ind_str_asc"` gives ascending key order. `mawk` ignores it **silently** — the script seems to work and gives unsorted output elsewhere. If you rely on it, check the interpreter first:

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

Exit 0 and exit 2. `PROCINFO` does not exist in `mawk`, so the lookup is empty. Testing `"sorted_in" in PROCINFO` does *not* work, because that key is missing under `gawk` too until you set it. Any output compared with a previous run needs a defined order, and "whatever awk produced" is not one.
:::

::: check
When is `awk` the wrong tool, and what replaces it?
:::

::: answer
When the input is not lines and fields. JSON, XML and YAML nest, and a value may span lines or contain the separator. `jq` handles JSON (next lesson); XML needs a parser; CSV with quoted commas needs a real CSV reader, because `-F,` splits inside the quotes and gives plausible wrong columns.

When the computation needs more than accumulating: sorting a big intermediate, joining on several keys, fitting a curve, statistics beyond means and extremes, or code that must be tested. That is Python with `numpy` or `pandas` (lesson 14). `awk`'s arrays are one-level string maps; a program that needs more is fighting the language.

When the numbers need care. `awk` computes in **[[double precision|double-precision]]**: no decimal type, integer overflow that differs between implementations, and `%d` beyond $2^{53}$ silently losing precision.

`awk` stays right for what it is good at: one pass over columns, choosing by field, adding into arrays, printing a formatted summary — the shape of most campaign post-processing.
:::

## Summary

| Form | Meaning | Note |
| --- | --- | --- |
| `pattern { action }` | run the action on matching records | no pattern = every record; no action = print |
| `$0 $1 … $NF`, `NF`, `NR` | record, fields, field count, record number | whitespace splitting merges runs |
| `-F'[= ]+'`, `-F'\t'` | input separator, may be a regex | print `NF` first; off-by-one is the usual bug |
| `OFS`, `RS`, `ORS` | output field, input record, output record separators | `RS=""` reads paragraphs |
| `BEGIN` / `END` | before any input / after the last record | set `FS` and constants; report aggregates |
| `$2 == "WARN"` vs `/WARN/` | field equality vs substring anywhere | the field test is what structure buys you |
| `printf "%.3f %-10s\n"` | C-style formatting | no automatic newline |
| `{n++}`, `s += $6` | variables need no declaration; start at 0/"" | a non-numeric field converts to 0 |
| `NR` in `END` | records **read** | count what you sum; `{s+=$6; n++}` |
| `a[$4]++`, `for (k in a)`, `k in a`, `delete a[k]` | associative arrays | iteration order is unspecified — pipe to `sort` |
| `PROCINFO["sorted_in"]` | ordered iteration | **gawk only**; mawk ignores it silently |
| `-v name=value` | pass a shell value in safely | never paste it into the program text |
| `print > "f"`, `\| "cmd"` | write or pipe from inside awk | the child runs under awk |
| `exit N` | sets awk's exit status | `END` still runs |
| `FNR`, `FILENAME`, `NR==FNR` | per-file counter, name, "still on the first file" | the two-file join idiom |
| `next` | skip the remaining rules for this record | the comment-skipping idiom |
| `awk -f prog.awk`, `<<'EOF'` | longer programs | quote the here-doc delimiter |
| `length substr index split match sub gsub sprintf toupper` | the built-ins you will use | `substr` counts from 1; `match` sets `RSTART`/`RLENGTH` |

Lesson 11 handles the data `awk` should not touch — JSON, with `jq` — and the `column`, `paste` and `join` tools for lining tabular text up and merging it.

::: context awk-name A language named after its authors
`awk` was written at Bell Labs in 1977 by Alfred **A**ho, Peter **W**einberger and Brian **K**ernighan — the name is their initials. Aho is known for compiler theory and Kernighan co-wrote the classic book on C.

They built it for exactly the job in this lesson: short programs, often one line, that pick records out of text and add things up. The word "record" comes from the world of data processing, where a record is one entry — one row — in a file of many.
:::

::: context three-awks Three awks, one command name
The language has several implementations that all answer to `awk`:

- **POSIX awk** is the standard: the features every version must have.
- **gawk** is GNU's version. It adds extras such as `PROCINFO`, sorted array loops and network access.
- **mawk**, written by Mike Brennan, is small and fast, and is what a fresh Ubuntu install uses.

Each one runs everything in the standard, so a script that sticks to it works everywhere. The trouble starts when a script leans on a `gawk` extra and then runs on a machine where `awk` means `mawk`.
:::

::: context field-picture One line, five fields
Whitespace splitting cuts at every run of spaces, so the double space after `INFO` is one gap, not an empty field between two.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="6" y="30" width="112" height="30" fill="#8fb8f0"/>
    <rect x="124" y="30" width="44" height="30" fill="#fff"/>
    <rect x="174" y="30" width="58" height="30" fill="#fff"/>
    <rect x="238" y="30" width="54" height="30" fill="#fff"/>
    <rect x="298" y="30" width="56" height="30" fill="#f2b880"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="62" y="49">2026-04-02T08…</text>
    <text x="146" y="49">INFO</text>
    <text x="203" y="49">case=001</text>
    <text x="265" y="49">status=OK</text>
    <text x="326" y="49">dv_ms=…</text>
    <text x="62" y="20">$1</text>
    <text x="146" y="20">$2</text>
    <text x="203" y="20">$3</text>
    <text x="265" y="20">$4</text>
    <text x="326" y="20">$5 = $NF</text>
  </g>
  <text x="180" y="88" font-size="12" text-anchor="middle" fill="#1f2a44">NF = 5, so $NF is the same field as $5</text>
  <text x="180" y="112" font-size="11" text-anchor="middle" fill="#6c7a93">$0 is the whole line, all five together</text>
</svg>
```

`$NF` is a field number computed on the fly: `NF` is 5, so `$NF` means `$5`. On a line with seven fields it would mean `$7`. That is why it always gets the last one.
:::

::: context reading-the-separator Reading [= ]+ aloud
The pattern after `-F` is a small regular expression, the same language `grep` speaks.

- `[= ]` is a **bracket expression**: one character, which may be either `=` or a space.
- `+` means "one or more of the thing before me".

So `[= ]+` is "a run of one or more equals signs and spaces, in any mix". In `t=0.5 chan=WHEEL_RPM`, the `=` after `t` is one run, the space before `chan` is another, and the `=` after `chan` a third. Each run becomes one cut between fields.
:::

::: context printf-widths What the numbers in %5d mean
In a `printf` code, the number between `%` and the letter is the **width**: the least number of characters to print. If the value is shorter, spaces fill the gap — on the left by default, on the right with a minus sign.

In `%10.2f` there are two numbers. `10` is the width and `.2` is the number of digits after the decimal point. So `27.9` becomes `     27.90`: five characters of value, padded to ten.

Widths are what make columns line up, which is why the channel table earlier reads cleanly down the page.
:::

::: context jars-picture An array as a row of labeled jars
After reading the whole log, the array `n` from `n[$4]++` looks like this — four jars, each named by a channel, each holding a count.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="10" y="40" width="80" height="44" rx="6" fill="#fff"/>
    <rect x="97" y="40" width="80" height="44" rx="6" fill="#fff"/>
    <rect x="184" y="40" width="80" height="44" rx="6" fill="#fff"/>
    <rect x="271" y="40" width="80" height="44" rx="6" fill="#fff"/>
  </g>
  <g font-size="11" fill="#1d6fd1" text-anchor="middle">
    <text x="50" y="30">BUS_VOLTS</text>
    <text x="137" y="30">GYRO_X_DPS</text>
    <text x="224" y="30">TANK_PSI</text>
    <text x="311" y="30">WHEEL_RPM</text>
  </g>
  <g font-size="16" fill="#1f2a44" text-anchor="middle">
    <text x="50" y="68">100</text>
    <text x="137" y="68">100</text>
    <text x="224" y="68">100</text>
    <text x="311" y="68">100</text>
  </g>
  <text x="180" y="108" font-size="11" text-anchor="middle" fill="#6c7a93">the label is the subscript; the number inside is the value</text>
</svg>
```

A new label gets a new jar the first time it is used, starting at zero. That is why no setup is needed — and why reading `n["TYPO"]` by accident quietly creates an empty jar, while `"TYPO" in n` does not.
:::

::: context hash-order Why the order looks random
To find a key fast, `awk` stores its array as a **hash table**. It runs each key through a scrambling function that turns the text into a number, and uses that number to pick a storage slot. Looking a key up is then one calculation, not a search.

The cost is that the slots have nothing to do with alphabetical order or with the order keys arrived in. Different versions of `awk` use different scrambling functions and table sizes, so they visit the slots in different orders — exactly what the `gawk` and `mawk` runs in this lesson showed.

Python dictionaries use a hash table too. Since Python 3.7 they also remember insertion order, which is an extra promise `awk` never made.
:::

::: context nr-fnr-picture Two counters over two files
`NR` counts every line `awk` has read. `FNR` counts lines in the current file, and starts over when a new file begins.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="30" width="260" height="28" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="280" y="30" width="40" height="28" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="150" y="48" font-size="11" text-anchor="middle" fill="#1f2a44">driver.log, 26 lines</text>
  <text x="300" y="22" font-size="11" text-anchor="middle" fill="#1f2a44">sim.conf</text>
  <g font-size="11" fill="#1f2a44">
    <text x="4" y="84">NR</text>
    <text x="4" y="114">FNR</text>
    <text x="24" y="84">1</text><text x="262" y="84">26</text><text x="284" y="84">27</text><text x="308" y="84">30</text>
    <text x="24" y="114">1</text><text x="262" y="114">26</text><text x="284" y="114" fill="#b4232c">1</text><text x="308" y="114">4</text>
  </g>
  <text x="180" y="134" font-size="11" text-anchor="middle" fill="#6c7a93">NR == FNR only while the first file is being read</text>
</svg>
```

The bar widths are to scale: 26 lines against 4. The red 1 is the moment the two counters part ways.
:::

::: context double-precision What double precision can hold
`awk` keeps every number as a 64-bit **double**, the same kind of floating-point number that C, Python and most flight software use. It carries about 15 to 16 significant decimal digits.

Whole numbers are exact up to $2^{53} = 9\,007\,199\,254\,740\,992$. Beyond that, not every integer can be stored: the gaps between neighboring doubles grow larger than 1. A nanosecond timestamp since 1970 is already about $1.8 \times 10^{18}$, far past that limit — so do not do exact arithmetic on it in `awk`.
:::
