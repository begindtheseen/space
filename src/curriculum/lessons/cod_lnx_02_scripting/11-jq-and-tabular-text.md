---
id: l11-jq-and-tabular-text
title: jq for JSON, and lining up tabular text
minutes: 19
covers:
  - jq for JSON, column/paste/join for tabular text
---

The previous two lessons were about text that is a line with fields in it. A growing share of what a simulation toolchain emits is not that: a run manifest, a solver's diagnostics, a scheduler's job record, a REST API's answer all arrive as JSON, where a value may contain the separator, a record may span lines, and nesting is the point. `grep`, `sed` and `awk` are all wrong for it, and produce plausible answers that fail on the first awkward value.

`jq` is the right tool, and it is worth half an hour because it turns "parse this in Python" into a line in a pipeline. The second half of this lesson is the small set of coreutils that handle *tabular* text — `column` to line it up for a human, `paste` to glue files side by side, `join` to merge them on a key.

All output below was produced on this machine and pasted verbatim, with jq 1.7 and util-linux 2.39.3 on Ubuntu 24.04.4. The fixture is a campaign manifest of twelve cases, one of which failed.

## `jq`: a filter language for JSON

`jq 'filter' file.json` reads JSON, applies the filter, and writes JSON. The identity filter `.` pretty-prints and, usefully, validates:

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

Field access is `.name`, array indexing `.[n]`, and the two compose:

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

`-r` is **raw output**: without it, strings come back with their JSON quotes, which is not what you want when the value is going into a shell variable. Learn to type it automatically for anything that leaves `jq`.

`.cases[]` iterates the array, producing one output per element, and `|` pipes inside the filter:

```bash
jq -r '.cases[] | .id' etc/manifest.json | head -4
```

```text
1
2
3
4
```

`select(condition)` keeps only the elements that match, which is `jq`'s `grep`:

```bash
jq -r '.cases[] | select(.status=="FAIL") | .id' etc/manifest.json
```

```text
12
```

One command, and it is correct whatever the values contain — a status with a space in it, a message with a quote, a number written in scientific notation. That is the whole argument against doing this with `grep`.

### Getting out of JSON and into a pipeline

`[a, b, c]` builds an array and `@tsv` or `@csv` formats it, with the quoting and escaping done properly:

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

That is the bridge: JSON in, columns out, and from there `sort`, `awk` and everything in the last two lessons apply. `@csv` quotes strings and leaves numbers bare, which is what a CSV reader expects.

String interpolation, `"\(expr)"`, formats a line directly:

```bash
jq -r '.cases | sort_by(-.miss_m) | .[0:3] | .[] | "\(.id) \(.miss_m)"' etc/manifest.json
```

```text
2 519.0
9 501.2
5 474.9
```

The three worst misses in the campaign, by case id. `sort_by(-.miss_m)` sorts descending — negating the key rather than reversing — and `.[0:3]` slices.

### Aggregating

`jq` has the arithmetic that `awk` has and the structure that `awk` does not:

```bash
jq '[.cases[].miss_m] | add / length' etc/manifest.json
```

```text
308.5666666666666
```

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

Note the `select(.dv_ms != null)`: the failed case has `"dv_ms": null`, and `min` over an array containing `null` would return `null`, because `null` sorts below every number. Filtering nulls before aggregating is the JSON equivalent of the "count what you sum" rule from the last lesson.

`group_by` does what an `awk` array does, with the grouping built in:

```bash
jq -r '.cases | group_by(.status) | map({status: .[0].status, n: length}) | .[] | "\(.status) \(.n)"' etc/manifest.json
```

```text
FAIL 1
OK 11
```

::: example A campaign summary from a manifest, in one pipeline
Three questions a run report has to answer: how many cases of each outcome, what the worst miss was, and which case it was.

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

`jq` extracts and `column -t` aligns; `-N` supplies the header names, since the JSON had them as keys rather than as a row. Case 12 has an empty `miss_m` because its value is `null`, which `@tsv` renders as an empty field — honest, and worth noticing before the column is treated as numeric.

The two summary lines:

```bash
jq -r '.cases | group_by(.status) | map({status: .[0].status, n: length}) | .[] | "\(.status) \(.n)"' etc/manifest.json
jq -r '.cases | sort_by(-.miss_m) | .[0] | "worst: case \(.id) at \(.miss_m) m"' etc/manifest.json
```

```text
FAIL 1
OK 11
```

Everything here is reading structure by name. Nothing depends on field position, on whitespace, or on a value not containing a comma — which means it keeps working when the manifest gains a field, and fails loudly rather than quietly if a field is renamed.
:::

::: warning
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

Exit status 0 both times. A typo in a filter therefore produces `null`, silently, and a shell variable set from it contains the four characters `null` rather than being empty — which then passes an `[[ -n "$x" ]]` test. Guard with `// "default"` for a fallback, or make it fatal with `-e`, which exits 1 when the last output was `null` or `false`.

Malformed input is different and is loud:

```bash
printf '{bad json' | jq .
```

```text
jq: parse error: Invalid numeric literal at line 1, column 5
```

Exit status **5**, which is worth remembering: a `jq` pipeline under `set -o pipefail` fails on bad input, as it should.

And never build a filter by string-interpolating a shell variable. `--arg name value` passes a string safely and `--argjson` passes JSON:

```bash
jq -r --arg s FAIL '.cases[] | select(.status==$s) | .id' etc/manifest.json
```

```text
12
```
:::

`-c` prints each result on one line, which is the form for JSON Lines and for feeding another program one record per line. `-s` ("slurp") reads the whole input into one array, which is how you aggregate across a stream of separate JSON documents.

## `column`: align for a human

```bash
column -t -s "$(printf '\t')" etc/cases.tsv | head -4
```

```text
id  seed    status
1   100001  OK
2   100002  OK
3   100003  OK
```

`-t` creates a table, `-s` sets the input separator, `-N` supplies header names, `-R` right-aligns the listed columns. It is a **display** tool: the output is aligned with spaces and is no longer machine-readable in the way the input was, so it belongs at the very end of a pipeline and never in the middle.

The default separator is whitespace, which means `column -t` on data containing empty fields will shift columns — one more reason to keep the aligned form for humans only.

## `paste`: side by side

`paste` joins files **by line number**, with no notion of a key:

```bash
paste etc/cases.tsv etc/miss.tsv | head -4
```

```text
id	seed	status	id	miss_m
1	100001	OK	1	17.5
2	100002	OK	2	291.5
3	100003	OK	3	5.6
```

That is only correct because the two files happen to be in the same order — and if one gained a row, every subsequent line would pair the wrong values, silently. Use `paste` when you *generated* both files from the same list in the same order, and `join` otherwise.

`-d` sets the delimiter, and `-s` pastes a file's lines into one line, which is the compact way to turn a column into a list:

```bash
paste -s -d' ' <(cut -f1 etc/cases.tsv | tail -n +2)
```

```text
1 2 3 4 5 6 7 8 9 10 11 12
```

## `join`: merge on a key

`join` merges two files on a common field, like a database join — and it requires both inputs to be **sorted on that field**.

```bash
join <(printf '1 a\n3 c\n') <(printf '1 x\n2 y\n3 z\n')
```

```text
1 a x
3 c z
```

By default it joins on field 1, outputs the key followed by the remaining fields of each side, and prints only lines that matched — an inner join. Key 2 appears in the second file only and is dropped.

`-a N` keeps the unpairable lines from file N, `-e` supplies a filler, and `-o` chooses the output fields (`0` means the key, `1.2` means field 2 of file 1):

```bash
join -a1 -a2 -e MISSING -o 0,1.2,2.2 <(printf '1 a\n3 c\n') <(printf '1 x\n2 y\n3 z\n')
```

```text
1 a x
2 MISSING y
3 c z
```

That is a full outer join, and the `MISSING` marks where a case exists on one side only — which, on a real campaign, is exactly the question "which runs produced no result file".

With tab-separated data, `-t` is required, and `--header` passes the first line of each file through without joining it:

```bash
join -t "$(printf '\t')" --header etc/cases.tsv etc/miss.tsv | head -4
```

```text
id	seed	status	miss_m
1	100001	OK	17.5
2	100002	OK	291.5
3	100003	OK	5.6
```

::: warning
`join` needs its inputs sorted **in the collating order it uses**, and it tells you when they are not — after producing partial output:

```bash
join <(printf '3 c\n1 a\n') <(printf '1 x\n3 z\n')
```

```text
join: /dev/fd/63:2: is not sorted: 1 a
3 c z
join: input is not in sorted order
```

Exit status 1, and one joined line was printed before the complaint. A script that ignores the status keeps that partial output.

The subtlety is that "sorted" means sorted by the *key field as a string*, in the current locale — so `sort -k1,1` and not `sort -n`, and preferably `LC_ALL=C sort -k1,1` so that both `sort` and `join` agree regardless of the machine's locale. Numeric ids sort as strings, which is why `10` comes before `2` in the transcript earlier in this lesson; that is consistent and correct for `join`, and it is not the order a person expects.

The shape that always works:

```bash
join -t "$(printf '\t')" \
  <(tail -n +2 a.tsv | LC_ALL=C sort -k1,1) \
  <(tail -n +2 b.tsv | LC_ALL=C sort -k1,1)
```

If getting the sort right is a nuisance, `awk`'s `NR==FNR` two-file idiom from the last lesson needs no sorting at all, and is usually the better choice inside a script.
:::

::: example Which runs produced no result?
Two files from the same campaign, in the same order but not with the same rows: one case ran and produced nothing, another produced a result with no run record.

```text
id	wall_s          id	miss_m
1	182.4           1	308.3
2	174.9           2	519.0
3	201.3           3	308.9
4	168.0           5	120.4
6	190.2           6	252.7
```

A plain inner join shows only the four that matched, which is the useful table and hides the problem:

```text
1	182.4	308.3
2	174.9	519.0
3	201.3	308.9
6	190.2	252.7
```

A full outer join shows the discrepancy, with `MISSING` where one side has nothing:

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

Case 4 ran for 168 seconds and produced no result; case 5 has a result and no run record. Both are things you want to know before computing a statistic over the campaign, and neither is visible in the inner join.

`-v1` and `-v2` isolate each side, which is the form to use in a check that must fail:

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

And the reason not to have used `paste` here, made explicit — the two files diverge at row 4, so every row after it would have paired the wrong values:

```bash
paste etc/runs.tsv etc/results.tsv | awk -F'\t' '$1 != $3 {print "MISMATCH at line " NR; exit 1}'
```

```text
MISMATCH at line 5
```

Exit status 1. That two-line check costs nothing and turns a silent misalignment into a failed job.
:::

::: key
`jq 'filter' file` reads JSON structurally: `.key`, `.[n]`, `.arr[]`, `select(cond)`, `group_by`, `sort_by`, `add`, `length`, `min`, `max`. `-r` for raw strings, `@tsv`/`@csv` to leave JSON for a pipeline, `--arg` to pass shell values, `-e` to make a `null` result a failure. `column -t` aligns for humans only; `paste` joins by line number and is silently wrong if the files diverge; `join` merges on a key and requires both inputs sorted on it.
:::

## Check yourself

::: check
`status=$(jq '.cases[0].status' manifest.json)` then `[[ $status == "OK" ]]` is false, although the case is `OK`. What is wrong?
:::

::: answer
Without `-r`, `jq` emits JSON, so the value is the six characters `"OK"` — with the quotes. The comparison against `OK` fails. Printing `$status` looks right in a message, which is why this survives casual checking.

`status=$(jq -r '.cases[0].status' manifest.json)` gives `OK`. `-r` applies to strings only; numbers and objects are unaffected, so it is safe to use always.

Two related traps in the same line. If the key is misspelled, `jq` outputs `null` with exit status 0, so `status` becomes the four characters `null` and passes `[[ -n "$status" ]]`. Add `-e`, which makes a final result of `null` or `false` exit 1, and check the status. And the command substitution strips trailing newlines, which is what you want here but not if you are capturing a multi-value result — for several values, use `mapfile -t arr < <(jq -r '…')` from lesson 04.
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

Three steps, each necessary. `tail -n +2` removes the headers, because `join` would otherwise treat `id` as a key and sort it into the middle of the data — `--header` is the alternative, and then the files must be sorted *excluding* their first line, which is more awkward. `sort -k1,1` sorts on the key field only, as a string; `sort` alone would sort on the whole line and `sort -n` would produce an order `join` does not use. `LC_ALL=C` makes the collation deterministic, so the same script gives the same answer on a machine with a different locale.

If the inputs are not sorted, `join` emits some output and then `join: input is not in sorted order` with exit status 1 — so a script that does not check the status silently keeps a partial result. If the headers are left in, you get a spurious `id` row and possibly a sort-order complaint.

Add `-a1 -a2 -e MISSING -o 0,1.2,2.2` when you need to see the cases present on only one side, which is how you find runs that produced no result.
:::

::: check
Why is `grep '"status": "FAIL"' manifest.json` a bad way to count failed cases?
:::

::: answer
Because it depends on formatting rather than on structure. The same document is valid with no space after the colon, with different key ordering, minified onto one line — in which case there are no line boundaries to count at all — or with the status expressed as `"status":"FAIL"`. Any of those changes the count to zero without changing the data.

It also cannot distinguish context. A `"status": "FAIL"` nested inside a per-stage sub-object, or inside a comment-like string field, matches just as well as the one you meant, so the count is an upper bound on something you did not define.

And it gives no way to act on the result: you have a count, not the ids, and extracting the ids means a second regular expression over a different line.

`jq '[.cases[] | select(.status=="FAIL")] | length'` counts exactly the cases in exactly that array, whatever the whitespace, and `jq -r '.cases[] | select(.status=="FAIL") | .id'` gives the ids. Both are shorter than the `grep` and correct by construction.
:::

::: check
When is `paste` right and when is it a bug waiting to happen?
:::

::: answer
`paste` is right when both files were produced from the same list, in the same order, in the same pass — a column of case ids and a column of results written by the same loop, or the output of two filters over the same input. Then line *n* of one genuinely corresponds to line *n* of the other, and `paste` is the cheapest way to put them side by side.

It is a bug waiting to happen whenever the correspondence is by key rather than by position. If one file is missing a row — a case that crashed and wrote no result — every line after that point pairs the wrong values, and nothing reports it: the output has the same shape, the same number of columns, and plausible numbers in the wrong rows. That is the worst kind of defect, because it is discovered downstream as a physics result that does not make sense.

Use `join` when there is a key, or the `awk` `NR==FNR` idiom when the files are unsorted. If you must use `paste`, verify first: `paste a b | awk -F'\t' '$1 != $3 {print "MISMATCH at line " NR; exit 1}'` compares the two key columns and fails loudly.
:::

::: check
A script does `jq -r '.result.value' out.json` and the downstream comparison silently passes when the run failed. Explain, and give two fixes.
:::

::: answer
When `out.json` lacks `result`, or `result` lacks `value`, `jq` outputs `null` and exits 0. The shell variable then holds the literal string `null`, which is non-empty, so `[[ -n "$v" ]]` passes and a comparison against an expected value simply differs — reported, if at all, as a wrong number rather than as a missing one. If the downstream test is a threshold, `null` may even compare in a way that passes.

Fix one: `jq -e -r '.result.value' out.json`. `-e` sets the exit status from the last output — 1 if it was `null` or `false`, 4 if there was no output at all — so the command fails and `set -e` or an explicit check catches it.

Fix two: make the filter assert what you expect. `jq -r '.result.value // error("no result.value")'` raises an error with your message and exits 5, which is clearer in a log than a bare status. For a default rather than an error, `// 0` supplies one.

The general point is the same as for `grep` exit statuses in the previous module: a tool that reports "nothing here" as a value rather than as a failure needs the script to make the distinction explicitly.
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
| `--arg n v`, `--argjson n v` | pass shell values safely | never interpolate into the filter |
| `-c`, `-s` | one line per result; slurp into an array | JSON Lines; aggregate across documents |
| `column -t -s SEP -N names` | align for a human | display only; never mid-pipeline |
| `paste a b`, `-d`, `-s` | join by line number | silently wrong if the files diverge |
| `join a b` | merge on a key, inner join by default | both inputs must be sorted on that key |
| `join -t $'\t' --header -a1 -a2 -e X -o 0,1.2,2.2` | tabs, headers, outer join, filler, field choice | `-a1 -a2` finds one-sided cases |
| `join: input is not in sorted order` | exit 1, **after** partial output | `LC_ALL=C sort -k1,1` both sides |

Lesson 12 adds the tool that would have caught several of the bugs in the last five lessons before they ran: `shellcheck`.
