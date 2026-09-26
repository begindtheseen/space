---
id: l11-jq-and-tabular-text
title: jq for JSON, and lining up tabular text
minutes: 22
covers:
  - jq for JSON, column/paste/join for tabular text
---

A set of nesting boxes is not a spreadsheet. A box can hold a box that holds three more, and the useful thing is often at the bottom. You cannot find it by counting "the fourth item on line 12". You find it by name: "open *cases*, then the one with id 12, then its *status*".

The last two lessons were about text shaped like a spreadsheet — lines with fields. A growing share of what a simulation toolchain produces is shaped like the boxes: a run manifest, a solver's diagnostics, a scheduler's job record, the answer from a web service. These arrive as **[[JSON|json-shape]]**, a text format for nested data. In JSON a value may contain the separator, a record may span many lines, and nesting is the point. `grep`, `sed` and `awk` are all wrong for it, and give plausible answers that fail on the first awkward value.

**`jq`** is the right tool. It is worth half an hour, because it turns "parse this in Python" into one line in a pipeline. The second half of this lesson covers three small tools for *tabular* text: `column` to line it up for a person, `paste` to glue files side by side, and `join` to merge them on a shared key.

All output below is real, from jq 1.7 and util-linux 2.39.3 on Ubuntu 24.04. The main example file is a campaign manifest of twelve cases, one of which failed.

## `jq`: a filter language for JSON

`jq 'filter' file.json` reads JSON, applies the **filter** — a small program saying what to pull out — and writes JSON. The simplest filter is `.` (read "dot"), the **identity**: "the whole thing, unchanged". It pretty-prints the file and, usefully, checks that it is valid JSON:

```bash
jq . etc/manifest.json | head -6
```

```text
{
  "campaign": "entry-burn-2026-04",
  "vehicle": "falcon9-s1",
  "generated": "2026-04-02T08:00:00Z",
  "cases": [
    {
```

`.name` picks a field out of an object, and `.[n]` picks element n out of an array, counting from 0. The two combine:

```bash
jq -r '.campaign, .vehicle' etc/manifest.json
jq '.cases | length' etc/manifest.json
```

```text
entry-burn-2026-04
falcon9-s1
```

```text
12
```

**`-r`** means **raw output**. Without it, strings come back wrapped in their JSON quotes, which is not what you want when the value is going into a shell variable. Learn to type it automatically for anything that leaves `jq`.

`.cases[]` — "each element of cases" — **iterates**: it produces one output per element. And `|` (read "pipe") passes results from one filter to the next *inside* `jq`, the way the shell's pipe passes text between programs:

```bash
jq -r '.cases[] | .id' etc/manifest.json | head -4
```

```text
1
2
3
4
```

`select(condition)` keeps only the elements where the condition is true. It is `jq`'s `grep`:

```bash
jq -r '.cases[] | select(.status=="FAIL") | .id' etc/manifest.json
```

```text
12
```

Read it as a **[[pipeline of three stages|jq-pipeline-picture]]**: take each case, keep the ones whose status is `FAIL`, print their id. It is correct whatever the values contain — a status with a space in it, a message with a quote, a number written in scientific notation. That is the whole argument against doing this with `grep`.

### Getting out of JSON and into a pipeline

`[a, b, c]` builds an array, and `@tsv` or `@csv` turns it into one line of tab-separated or comma-separated text, with the quoting and **[[escaping|tsv-escaping]]** done properly:

```bash
jq -r '.cases[] | [.id, .status, .miss_m] | @tsv' etc/manifest.json | head -4
```

```text
1	OK	308.3
2	OK	519.0
3	OK	308.9
4	OK	229.3
```

```bash
jq -r '.cases[] | [.id, .status, .miss_m] | @csv' etc/manifest.json | head -3
```

```text
1,"OK",308.3
2,"OK",519.0
3,"OK",308.9
```

That is the bridge: JSON in, columns out. From there `sort`, `awk` and everything in the last two lessons apply. `@csv` quotes strings and leaves numbers bare, which is what a CSV reader expects.

**String interpolation**, `"\(expr)"` (read "backslash-paren"), drops a value into a piece of text:

```bash
jq -r '.cases | sort_by(-.miss_m) | .[0:3] | .[] | "\(.id) \(.miss_m)"' etc/manifest.json
```

```text
2 519.0
9 501.2
5 474.9
```

These are the three worst miss distances in the campaign, with their case ids. `sort_by(-.miss_m)` sorts by the *negative* of the miss, which puts the largest first. `.[0:3]` **slices** out elements 0, 1 and 2.

### Aggregating

`jq` has the arithmetic `awk` has, plus the structure `awk` lacks:

```bash
jq '[.cases[].miss_m] | add / length' etc/manifest.json
```

```text
308.5666666666666
```

`[.cases[].miss_m]` collects the twelve miss distances into one array. `add` sums it and `length` counts it, so this is the mean. Sanity check: the values run from about 118 to 519 m, and 309 m sits comfortably between.

```bash
jq '[.cases[] | select(.dv_ms != null) | .dv_ms] | {n: length, min: min, max: max}' etc/manifest.json
```

```text
{
  "n": 11,
  "min": 120.11,
  "max": 139.0
}
```

Notice `select(.dv_ms != null)`, where `!=` reads "is not equal to". The failed case has `"dv_ms": null` — **[[null|null-meaning]]** is JSON's word for "no value". `min` over an array containing `null` returns `null`, because `null` sorts below every number. Filtering out nulls before aggregating is the JSON form of last lesson's rule: count what you sum.

`group_by` does what an `awk` array does, with the grouping built in:

```bash
jq -r '.cases | group_by(.status) | map({status: .[0].status, n: length}) | .[] | "\(.status) \(.n)"' etc/manifest.json
```

```text
FAIL 1
OK 11
```

`group_by(.status)` makes an array of groups, one per status. `map(...)` turns each group into a small object: its status (taken from the group's first member, `.[0]`) and its size. Check: $1 + 11 = 12$ cases.

::: example A campaign summary from a manifest, in one pipeline
A run report has three questions to answer: how many cases had each outcome, what the worst miss was, and which case it was. First, the whole manifest as a table:

```bash
jq -r '.cases[] | [.id, .status, .dv_ms, .miss_m] | @tsv' etc/manifest.json | column -t -N id,status,dv_ms,miss_m
```

```text
id  status  dv_ms   miss_m
1   OK      129.89  308.3
2   OK      120.11  519.0
3   OK      135.02  308.9
4   OK      128.5   229.3
5   OK      123.52  474.9
6   OK      121.0   252.7
7   OK      124.98  396.0
8   OK      136.03  165.0
9   OK      133.35  501.2
10  OK      139.0   284.7
11  OK      137.83  118.3
12  FAIL    144.5   
```

`jq` extracts the columns and `column -t` lines them up. `-N` supplies the header names, because the JSON had them as keys, not as a row.

Now look hard at case 12. It seems to say `dv_ms` was 144.5 and `miss_m` was empty. That is **wrong**. Case 12's `dv_ms` is `null`, which `@tsv` writes as an empty field, and its `miss_m` is 144.5. Plain `column -t` splits on whitespace and treats two tabs in a row as one gap, so the empty field **[[vanished and the value slid left|column-shift-picture]]**. Telling `column` that the separator is a tab keeps the empty field:

```bash
jq -r '.cases[] | [.id, .status, .dv_ms, .miss_m] | @tsv' etc/manifest.json | column -t -s "$(printf '\t')" -N id,status,dv_ms,miss_m
```

```text
id  status  dv_ms   miss_m
1   OK      129.89  308.3
2   OK      120.11  519.0
3   OK      135.02  308.9
4   OK      128.5   229.3
5   OK      123.52  474.9
6   OK      121.0   252.7
7   OK      124.98  396.0
8   OK      136.03  165.0
9   OK      133.35  501.2
10  OK      139.0   284.7
11  OK      137.83  118.3
12  FAIL            144.5
```

Now the blank is where it belongs. `"$(printf '\t')"` is a command substitution that produces one tab character.

The two summary lines:

```bash
jq -r '.cases | group_by(.status) | map({status: .[0].status, n: length}) | .[] | "\(.status) \(.n)"' etc/manifest.json
jq -r '.cases | sort_by(-.miss_m) | .[0] | "worst: case \(.id) at \(.miss_m) m"' etc/manifest.json
```

```text
FAIL 1
OK 11
```

```text
worst: case 2 at 519.0 m
```

Everything in `jq` here reads structure by name. Nothing depends on field position, on whitespace, or on a value not containing a comma — so it keeps working when the manifest gains a field. The one place position crept back in was `column`, and it bit.
:::

::: warning Missing keys are silent
`jq` returns `null` for a key that does not exist, and for an index past the end:

```bash
jq '.nosuchkey' etc/manifest.json
jq '.cases[99]' etc/manifest.json
```

```text
null
```

```text
null
```

Exit status 0 both times. So a typo in a filter produces `null`, silently. A shell variable set from it holds the four characters `null` rather than being empty — and that passes an `[[ -n "$x" ]]` ("is not empty") test. Guard with `// "default"` (read "or else"), which substitutes a fallback when the left side is `null` or `false`. Or make it fatal with **`-e`**, which exits 1 when the last output was `null` or `false`.

Malformed input is different, and loud:

```bash
printf '{bad json' | jq .
```

```text
jq: parse error: Invalid numeric literal at line 1, column 5
```

Exit status **[[5|jq-exit-codes]]**. A `jq` pipeline under `set -o pipefail` therefore fails on bad input, as it should.

And never build a filter by pasting a shell variable into it. `--arg name value` passes a string safely, and `--argjson` passes a piece of JSON:

```bash
jq -r --arg s FAIL '.cases[] | select(.status==$s) | .id' etc/manifest.json
```

```text
12
```
:::

Two more options. `-c` prints each result on one line, which is the form for **[[JSON Lines|json-lines]]** and for feeding another program one record per line. `-s` ("slurp") reads the whole input into one array, which is how you aggregate across a stream of separate JSON documents.

## `column`: line it up for a person

```bash
column -t -s "$(printf '\t')" etc/cases.tsv | head -4
```

```text
id  seed    status
1   100001  OK
2   100002  OK
3   100003  OK
```

`-t` makes a table, `-s` sets the input separator, `-N` supplies header names, and `-R` right-aligns the columns you list. `column` is a **display** tool. Its output is lined up with spaces and is no longer machine-readable in the way the input was. It belongs at the very end of a pipeline, never in the middle.

Its default separator is whitespace, which is what shifted case 12 in the example above. On data that can have empty fields, give `-s` the real separator — one more reason to keep the aligned form for human eyes only.

## `paste`: side by side

`paste` joins files **by line number**, with no idea of a key. Line 1 goes with line 1, line 2 with line 2:

```bash
paste etc/cases.tsv etc/miss.tsv | head -4
```

```text
id	seed	status	id	miss_m
1	100001	OK	1	308.3
2	100002	OK	2	519.0
3	100003	OK	3	308.9
```

That is only correct because the two files happen to list the cases in the same order. If one gained or lost a row, every line after it would pair the wrong values, silently. Use `paste` when you *generated* both files from the same list in the same order, and `join` otherwise.

`-d` sets the delimiter. `-s` pastes all of one file's lines into a single line, the compact way to turn a column into a list:

```bash
paste -s -d' ' <(cut -f1 etc/cases.tsv | tail -n +2)
```

```text
1 2 3 4 5 6 7 8 9 10 11 12
```

## `join`: merge on a key

`join` merges two files on a common field — the **key** — the way a database does. It requires both inputs to be **sorted on that field**.

```bash
join <(printf '1 a\n3 c\n') <(printf '1 x\n2 y\n3 z\n')
```

```text
1 a x
3 c z
```

By default it joins on field 1, prints the key followed by the other fields from each side, and prints only lines whose key appears in *both* files. That is an **inner join**. Key 2 exists only in the second file, so it is dropped.

`-a N` also keeps the unmatched lines from file N. `-e` supplies a filler word for the missing side. `-o` chooses the output fields: `0` is the key, and `1.2` means "field 2 of file 1".

```bash
join -a1 -a2 -e MISSING -o 0,1.2,2.2 <(printf '1 a\n3 c\n') <(printf '1 x\n2 y\n3 z\n')
```

```text
1 a x
2 MISSING y
3 c z
```

That is a **full outer join**: every key from either side, with `MISSING` where one side has nothing. On a real campaign, that answers "which runs produced no result file?"

With tab-separated data, `-t` with a tab is required. And `--header` passes the first line of each file through without trying to join it:

```bash
join -t "$(printf '\t')" --header etc/cases.tsv etc/miss.tsv | head -4
```

```text
id	seed	status	miss_m
1	100001	OK	308.3
2	100002	OK	519.0
3	100003	OK	308.9
```

Bash also has a shorter way to write a tab, `$'\t'` (a "dollar-quoted" string, where backslash codes are turned into characters). The two spellings are the same to `join`.

::: warning `join` complains late, and only sometimes
`join` needs its inputs sorted **in the order it compares keys**. When they are not, it says so — after printing partial output:

```bash
join <(printf '3 c\n1 a\n') <(printf '1 x\n3 z\n')
```

```text
join: /dev/fd/63:2: is not sorted: 1 a
3 c z
join: input is not in sorted order
```

Exit status 1, and one joined line was printed before the complaint. A script that ignores the status keeps that partial output. Worse, GNU `join` only checks the order when it meets lines that do not pair up. The `--header` example above had its ids in number order, 1 to 12, which is *not* string order — but every key paired, so no complaint, and the output happened to be right.

"Sorted" means sorted on the key field *as text*, in the current **[[locale|locale-collation]]**. So use `sort -k1,1`, not `sort -n`, and preferably `LC_ALL=C sort -k1,1`, so that `sort` and `join` agree on every machine. In text order, `10` comes before `2`, because the character `1` comes before `2`. That looks odd to a person and is exactly what `join` expects.

The shape that always works:

```bash
join -t "$(printf '\t')" \
  <(tail -n +2 a.tsv | LC_ALL=C sort -k1,1) \
  <(tail -n +2 b.tsv | LC_ALL=C sort -k1,1)
```

`tail -n +2` means "from line 2 on", which drops the header. If getting the sort right is a nuisance, `awk`'s `NR==FNR` idiom from the last lesson needs no sorting at all, and is often the better choice inside a script.
:::

::: example Which runs produced no result?
Two files from the same campaign, not quite with the same rows. One case ran and produced nothing; another has a result but no run record. Here they are side by side:

```text
id	wall_s          id	miss_m
1	182.4           1	308.3
2	174.9           2	519.0
3	201.3           3	308.9
4	168.0           5	120.4
6	190.2           6	252.7
```

A plain inner join shows only the four that matched. It is a useful table, and it hides the problem:

```text
1	182.4	308.3
2	174.9	519.0
3	201.3	308.9
6	190.2	252.7
```

A **[[full outer join|outer-join-picture]]** shows the gap, with `MISSING` where one side has nothing:

```bash
join -t "$(printf '\t')" -a1 -a2 -e MISSING -o 0,1.2,2.2 \
  <(tail -n +2 etc/runs.tsv    | LC_ALL=C sort -k1,1) \
  <(tail -n +2 etc/results.tsv | LC_ALL=C sort -k1,1) | column -t
```

```text
1  182.4    308.3
2  174.9    519.0
3  201.3    308.9
4  168.0    MISSING
5  MISSING  120.4
6  190.2    252.7
```

Case 4 ran for 168 seconds and left no result. Case 5 has a result and no run record. You want to know both before computing any statistic over the campaign, and neither shows in the inner join. Count check: 4 matched + 1 + 1 = 6 distinct ids.

`-v1` and `-v2` print only the unmatched lines from each side — the form to use in a check that must fail:

```bash
join -t "$(printf '\t')" -v1 <(…runs…) <(…results…)
join -t "$(printf '\t')" -v2 <(…runs…) <(…results…)
```

```text
4	168.0
```

```text
5	120.4
```

And here is why `paste` would have been wrong. The two files part ways at data row 4, and every row after that would pair the wrong values:

```bash
paste etc/runs.tsv etc/results.tsv | awk -F'\t' '$1 != $3 {print "MISMATCH at line " NR; exit 1}'
```

```text
MISMATCH at line 5
```

Exit status 1. Line 5 counts the header, so it is data row 4. That one-line check costs nothing and turns a silent mix-up into a failed job.
:::

::: key
`jq 'filter' file` reads JSON by structure: `.key`, `.[n]`, `.arr[]`, `select(cond)`, `group_by`, `sort_by`, `add`, `length`, `min`, `max`. `-r` for raw strings, `@tsv`/`@csv` to leave JSON for a pipeline, `--arg` to pass shell values, `-e` to make a `null` result a failure. `column -t` aligns for humans only; `paste` joins by line number and is silently wrong if the files diverge; `join` merges on a key and requires both inputs sorted on it.
:::

## Check yourself

::: check
`status=$(jq '.cases[0].status' manifest.json)` then `[[ $status == "OK" ]]` is false, although the case is `OK`. What is wrong?
:::

::: answer
Without `-r`, `jq` writes JSON, so the value is the four characters `"OK"` — quotes included — and the comparison with `OK` fails. Printing `$status` in a message looks right, which is why this survives casual checking.

`status=$(jq -r '.cases[0].status' manifest.json)` gives `OK`. `-r` only changes strings; numbers and objects come out the same, so it is safe to use always.

Two related traps sit in the same line. If the key is misspelled, `jq` prints `null` with exit status 0, so `status` becomes the four characters `null` and passes `[[ -n "$status" ]]`. Add `-e`, which makes a final `null` or `false` exit 1, and check the status. And command substitution strips trailing newlines — what you want here, but not for a result with several values. For those, use `mapfile -t arr < <(jq -r '…')` from lesson 04.
:::

::: check
You have `runs.tsv` (case id, wall-clock seconds) and `results.tsv` (case id, miss distance), both with a header, in different orders. Give a correct `join` and say what breaks if you skip a step.
:::

::: answer
```bash
join -t "$(printf '\t')" \
  <(tail -n +2 runs.tsv    | LC_ALL=C sort -k1,1) \
  <(tail -n +2 results.tsv | LC_ALL=C sort -k1,1)
```

Three steps, each needed. `tail -n +2` removes the headers; otherwise `join` treats `id` as a key and the sort moves it into the middle of the data. (`--header` is the alternative, but then each file must be sorted *below* its first line, which is more awkward.) `sort -k1,1` sorts on the key field only, as text: plain `sort` sorts on the whole line, and `sort -n` gives an order `join` does not use. `LC_ALL=C` makes the ordering the same on every machine, whatever its locale.

If the inputs are not sorted, `join` prints some output, then `join: input is not in sorted order`, and exits 1 — so a script that ignores the status keeps a partial result. If the headers stay in, you get a spurious `id` row and possibly a sort-order complaint.

Add `-a1 -a2 -e MISSING -o 0,1.2,2.2` to see the cases present on only one side — the runs that produced no result.
:::

::: check
Why is `grep '"status": "FAIL"' manifest.json` a bad way to count failed cases?
:::

::: answer
Because it depends on formatting, not structure. The same data is valid JSON with no space after the colon, with keys in another order, or squeezed onto one line — and then there are no line boundaries to count at all. Any of those changes the count without changing the data.

It cannot tell context apart, either. A `"status": "FAIL"` inside some nested per-stage object matches just as well as the one you meant, so the count is an upper bound on something you never defined. And it gives you a count, not the ids; getting those takes a second regular expression.

`jq '[.cases[] | select(.status=="FAIL")] | length'` counts exactly the cases in exactly that array, whatever the whitespace. `jq -r '.cases[] | select(.status=="FAIL") | .id'` lists their ids. Both are shorter than the `grep` and correct by construction.
:::

::: check
When is `paste` right and when is it a bug waiting to happen?
:::

::: answer
`paste` is right when both files came from the same list, in the same order, in the same pass — a column of case ids and a column of results written by one loop, or two filters run over one input. Then line *n* of one really does belong with line *n* of the other, and `paste` is the cheapest way to put them side by side.

It is a bug waiting to happen whenever lines belong together by key rather than by position. If one file is missing a row — a case that crashed and wrote nothing — every line after it pairs the wrong values, and nothing says so. The output has the same shape, the same number of columns, and believable numbers in the wrong rows. That is the worst kind of defect, because it is found downstream as a physics result that makes no sense.

Use `join` when there is a key, or `awk`'s `NR==FNR` idiom when the files are unsorted. If you must use `paste`, check first: `paste a b | awk -F'\t' '$1 != $3 {print "MISMATCH at line " NR; exit 1}'` compares the two key columns and fails loudly.
:::

::: check
A script does `jq -r '.result.value' out.json`, and the downstream comparison silently passes when the run failed. Explain, and give two fixes.
:::

::: answer
When `out.json` has no `result`, or `result` has no `value`, `jq` prints `null` and exits 0. The shell variable then holds the text `null`, which is not empty, so `[[ -n "$v" ]]` passes. A comparison with an expected value just differs — reported, if at all, as a wrong number rather than a missing one. If the downstream test is a threshold, `null` may even compare in a way that passes.

Fix one: `jq -e -r '.result.value' out.json`. `-e` sets the exit status from the last output — 1 if it was `null` or `false`, 4 if there was no output at all — so the command fails, and `set -e` or an explicit check catches it.

Fix two: make the filter state what you expect. `jq -r '.result.value // error("no result.value")'` raises an error with your message and exits 5, which reads more clearly in a log than a bare status. If you want a default instead of an error, `// 0` supplies one.

The general point is the one from `grep`'s exit statuses in the previous module: a tool that reports "nothing here" as a *value* rather than a *failure* needs the script to make the difference explicit.
:::

## Summary

| Form | Meaning | Note |
| --- | --- | --- |
| `jq . f.json` | pretty-print and validate | parse error exits 5 |
| `.key`, `.[n]`, `.arr[]`, `\|` | access, index, iterate, pipe inside the filter | structure by name, not by position |
| `-r` | raw strings, no JSON quotes | without it a value is `"OK"`, not `OK` |
| `select(cond)` | jq's `grep`, on the parsed value | correct whatever the value contains |
| `[a,b] \| @tsv` / `@csv` | leave JSON for a pipeline | escaping done properly |
| `"\(.id) \(.miss_m)"` | string interpolation | format a line directly |
| `length add min max sort_by group_by map` | aggregation | filter `null` before `min`/`add` |
| missing key → `null`, exit 0 | a typo is silent | `-e` makes `null`/`false` exit 1; `// default` |
| `--arg n v`, `--argjson n v` | pass shell values safely | never paste them into the filter |
| `-c`, `-s` | one line per result; slurp into an array | JSON Lines; aggregate across documents |
| `column -t -s SEP -N names` | align for a human | display only; give `-s` if fields can be empty |
| `paste a b`, `-d`, `-s` | join by line number | silently wrong if the files diverge |
| `join a b` | merge on a key, inner join by default | both inputs must be sorted on that key |
| `join -t $'\t' --header -a1 -a2 -e X -o 0,1.2,2.2` | tabs, headers, outer join, filler, field choice | `-a1 -a2` finds one-sided cases |
| `join: input is not in sorted order` | exit 1, **after** partial output | `LC_ALL=C sort -k1,1` both sides |

Lesson 12 adds the tool that would have caught several of the bugs in the last few lessons before they ever ran: `shellcheck`.

::: context json-shape What JSON looks like
**JSON** stands for JavaScript Object Notation. It was drawn from the way the JavaScript language writes data, and is now used by nearly every language and web service. It has only a few pieces:

- an **object**, `{"key": value, …}`, a set of named values — the boxes with labels;
- an **array**, `[value, value, …]`, an ordered list;
- strings in double quotes, numbers, `true`, `false` and `null`.

Objects and arrays can hold each other to any depth. That nesting is what a line-and-field tool like `awk` cannot see.
:::

::: context jq-pipeline-picture Three stages inside one filter
Each `|` inside a `jq` filter hands every result of the left side to the right side. Here is how many values flow between the stages for the manifest:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="8" y="34" width="96" height="40" rx="6" fill="#8fb8f0"/>
    <rect x="132" y="34" width="112" height="40" rx="6" fill="#fff"/>
    <rect x="272" y="34" width="80" height="40" rx="6" fill="#f2b880"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="56" y="58">.cases[]</text>
    <text x="188" y="58">select(FAIL)</text>
    <text x="312" y="58">.id</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="104" y1="54" x2="126" y2="54"/><line x1="244" y1="54" x2="266" y2="54"/>
  </g>
  <polygon points="132,54 124,50 124,58" fill="#1f2a44"/>
  <polygon points="272,54 264,50 264,58" fill="#1f2a44"/>
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="118" y="26">12 cases</text>
    <text x="258" y="26">1 case</text>
    <text x="312" y="96">prints 12</text>
  </g>
</svg>
```

Twelve objects go into `select`, one comes out, and `.id` turns that one object into the number 12 — the id of the failed case.
:::

::: context tsv-escaping Why "escaping" matters
A tab-separated line breaks if a value itself contains a tab or a newline: the reader would see an extra column or an extra row. `@tsv` guards against that by writing a tab inside a value as the two characters `\t`, and a newline as `\n`. This is **escaping** — replacing a character that has a special job with a harmless code for it.

`@csv` does the CSV version: it wraps strings in double quotes and doubles any quote inside them, so a comma in a value stays inside its field.
:::

::: context null-meaning null is not zero
`null` means "there is no value here". It is not zero and not an empty string. A failed case has no delta-v, so writing `0` would claim a perfect burn that never happened.

That is why tools must treat `null` specially. `jq` sorts `null` below every number, so `min` of `[null, 120.11]` is `null`. And `@tsv` writes it as an empty field, which is honest — as long as nothing downstream quietly squeezes the empty field out.
:::

::: context column-shift-picture How an empty field slid left
The row for case 12 holds four fields, and the third is empty. Split on whitespace, the two tabs around the empty field look like one gap.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="8" y="22" font-size="11" fill="#1f2a44">split on tab</text>
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="96" y="8" width="56" height="24" fill="#fff"/>
    <rect x="158" y="8" width="56" height="24" fill="#fff"/>
    <rect x="220" y="8" width="56" height="24" fill="#fff" stroke-dasharray="4 3"/>
    <rect x="282" y="8" width="66" height="24" fill="#f2b880"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="124" y="24">12</text><text x="186" y="24">FAIL</text><text x="248" y="24">(empty)</text><text x="315" y="24">144.5</text>
    <text x="124" y="52">id</text><text x="186" y="52">status</text><text x="248" y="52">dv_ms</text><text x="315" y="52">miss_m</text>
  </g>
  <text x="8" y="92" font-size="11" fill="#1f2a44">split on space</text>
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="96" y="78" width="56" height="24" fill="#fff"/>
    <rect x="158" y="78" width="56" height="24" fill="#fff"/>
    <rect x="220" y="78" width="56" height="24" fill="#f2b880"/>
    <rect x="282" y="78" width="66" height="24" fill="#fff" stroke-dasharray="4 3"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="124" y="94">12</text><text x="186" y="94">FAIL</text><text x="248" y="94">144.5</text><text x="315" y="94">(empty)</text>
  </g>
  <text x="180" y="130" font-size="11" text-anchor="middle" fill="#b4232c">144.5 lands under dv_ms: a wrong table that looks fine</text>
</svg>
```

The value did not change; its column did. `column -t -s` with a tab keeps the empty slot in place.
:::

::: context jq-exit-codes What jq's exit statuses mean
`jq` uses its exit status to tell different failures apart:

- **0** — the program ran.
- **1** — with `-e`, the last output was `null` or `false`.
- **2** — a usage or system problem, such as a file that cannot be opened.
- **3** — the filter itself has a syntax error.
- **4** — with `-e`, there was no output at all.
- **5** — an error while running, including input that is not valid JSON and `error(…)` in the filter.

A script can branch on these the same way it branches on `grep`'s 0, 1 and 2.
:::

::: context json-lines One JSON document per line
**JSON Lines** is a simple convention: a file where every line is a complete JSON object. Logs and event streams love it, because a program can append one line per event and a reader can process the file line by line, without loading it all.

`jq -c` writes exactly that shape, and `jq -s` reads a stream of such documents back into one array so you can count or sum across them.
:::

::: context locale-collation Why sort order depends on the machine
A **locale** is a machine's language and region settings. Among other things, it decides **collation** — the order in which text is sorted. In many English locales, sorting ignores punctuation and case at first, so `a-b` and `ab` may land next to each other.

`LC_ALL=C` switches that off for one command and compares raw byte values instead. The result is the same on every machine, which is what two programs that must agree — `sort` and `join` — need.
:::

::: context outer-join-picture Inner join and outer join
Picture the case ids in each file as two overlapping sets. An inner join keeps only the overlap. A full outer join keeps everything, and marks the side that is missing.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <circle cx="140" cy="72" r="58" fill="#8fb8f0" fill-opacity="0.6" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="220" cy="72" r="58" fill="#f2b880" fill-opacity="0.6" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="110" y="76">4</text>
    <text x="180" y="66">1 2</text>
    <text x="180" y="84">3 6</text>
    <text x="250" y="76">5</text>
  </g>
  <g font-size="11" text-anchor="middle">
    <text x="100" y="146" fill="#1d6fd1">runs.tsv</text>
    <text x="260" y="146" fill="#1f2a44">results.tsv</text>
    <text x="180" y="10" fill="#1f2a44">inner join: 1 2 3 6</text>
  </g>
</svg>
```

Case 4 is only in the runs file and case 5 only in the results; the outer join prints both, with `MISSING` for the empty side.
:::
