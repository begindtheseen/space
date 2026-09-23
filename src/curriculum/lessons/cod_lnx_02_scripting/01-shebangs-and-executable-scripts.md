---
id: l01-shebangs-and-executable-scripts
title: Shebang lines and executable scripts
minutes: 19
covers:
  - Shebang lines and executable scripts
---

A shell script is the smallest unit of automation you will build, and the first two bytes of it decide what runs your code. Get them wrong and the failure is one of three unhelpful messages — "Permission denied", "cannot execute: required file not found", or a syntax error in code that is perfectly valid — none of which mentions the line you actually need to fix.

This lesson is about that line and the mechanics around it: what the kernel does with `#!`, why `#!/usr/bin/env bash` is usually right, why `#!/bin/sh` is not the same thing as bash, and how a script finds its own directory so that it can be run from anywhere. It is short, and every one of its failure modes will happen to you.

All output below was produced on this machine and pasted verbatim: Ubuntu 24.04.4, GNU bash 5.2.21, dash 0.5.12 as `/bin/sh`, GNU coreutils 9.4. Transcripts were taken as an ordinary user `eng` in a working directory holding a small campaign tree. Paths and ownership are specific to this machine.

## What the kernel actually does

When you run `./sweep.sh`, the shell calls `execve()` on that file. The kernel looks at the first two bytes. If they are the ELF magic number, it loads a binary. If they are `#` and `!` — 0x23 0x21 — it reads the rest of that first line, treats it as an interpreter path and an optional single argument, and instead executes *that* program, handing it the script's path as an argument.

```bash
head -c 2 bin/sweep.sh | od -c
```

```text
0000000   #   !
0000002
```

So `#!/usr/bin/env bash` in `bin/sweep.sh`, run as `./bin/sweep.sh a b`, becomes the equivalent of running `/usr/bin/env bash ./bin/sweep.sh a b`. The `#!` line is not a comment that bash happens to ignore — bash never sees it as anything special. It is an instruction to the kernel, and it only works because `#` also happens to start a comment in every shell.

`file` reads the same two bytes and tells you what it found:

```bash
file bin/sweep.sh
```

```text
bin/sweep.sh: Bourne-Again shell script, ASCII text executable
```

## The execute bit, and three error messages

A script needs the execute bit to be run by name. From lesson 03 of the previous module:

```bash
./bin/sweep.sh
```

```text
bash: ./bin/sweep.sh: Permission denied
```

Exit status 126 — found, not executable. `chmod +x bin/sweep.sh` fixes it. And note that the file is still perfectly *readable*, so you can always run it by handing it to an interpreter explicitly:

```bash
bash bin/sweep.sh a b
```

```text
sweep.sh: 2 arguments
$0 is bin/sweep.sh
```

That form works with no execute bit and ignores the shebang entirely — which is both a convenience and a hazard, because a script that works under `bash script.sh` may fail under `./script.sh` for a reason the shebang alone explains.

The second message is the confusing one:

```bash
./bin/bad.sh
```

```text
bash: ./bin/bad.sh: cannot execute: required file not found
```

Exit status 127. The script is there; the *interpreter* named on its first line is not — `#!/usr/bin/bashh`, with a typo. The kernel's `execve` returns `ENOENT` for the interpreter, and bash renders that in wording that points at the script.

::: warning
The third message is the same as the second, and the cause is invisible:

```bash
./bin/crlf.sh
```

```text
bash: ./bin/crlf.sh: cannot execute: required file not found
```

```bash
head -1 bin/crlf.sh | cat -A
```

```text
#!/bin/bash^M$
```

The file was written on Windows, so the first line ends `\r\n`. The kernel reads the interpreter path as `/bin/bash\r` — a path that does not exist, because a carriage return is a perfectly legal character in a filename and this one is part of the name it was asked for.

`cat -A` from lesson 02 of the previous module is the diagnosis; `sed -i 's/\r$//' script.sh` is the fix, and `dos2unix` does the same if it is installed. Afterwards the script runs. This will happen to you the first time a colleague sends a script by email or a repository is checked out with the wrong line-ending setting.
:::

## No shebang at all

A script with no `#!` still works when a shell runs it, because the shell falls back to running it with itself:

```bash
./bin/nosb.sh
```

```text
no shebang, argv0=./bin/nosb.sh
```

That fallback is a shell convention, not a kernel one — and the difference matters the moment something other than a shell tries to run your script. Python's `subprocess`, `make`, a CI runner, `systemd`'s `ExecStart`, `find -exec`: all of them call `execve` directly, and the kernel refuses a file that is neither ELF nor `#!`:

```text
OSError: [Errno 8] Exec format error: './bin/nosb.sh'
```

`Exec format error` is `ENOEXEC`. It means "I do not know how to run this", and the fix is always the same: give the script a shebang.

## `#!/bin/bash` or `#!/usr/bin/env bash`?

Both name an interpreter. They differ in *how* it is found.

- `#!/bin/bash` is an absolute path. The kernel runs exactly that file, or fails.
- `#!/usr/bin/env bash` runs `env`, which searches `PATH` for `bash` and executes the first one it finds.

```bash
type -a bash
```

```text
bash is /usr/bin/bash
bash is /bin/bash
```

On this machine both resolve to the same program, because `/bin` is a symlink to `/usr/bin`. On a cluster they routinely do not: a newer bash under `/usr/local/bin`, a module-loaded toolchain, a Homebrew bash on a colleague's Mac where the system one is fifteen years old. The `env` form follows `PATH` and therefore picks the bash the user has arranged for; the absolute form pins one.

Prefer **`#!/usr/bin/env bash`** for scripts you share. Use an absolute path when you deliberately want the system interpreter regardless of the caller's `PATH` — a `systemd` unit, a `cron` job, a setuid-adjacent context, anything where following `PATH` is a security or reproducibility problem.

::: warning
The shebang line takes the interpreter and **at most one argument**, and `env` sees them as a single word:

```bash
printf '#!/usr/bin/env bash -x\necho hi\n' > bin/envx.sh; chmod +x bin/envx.sh
./bin/envx.sh
```

```text
/usr/bin/env: 'bash -x': No such file or directory
/usr/bin/env: use -[v]S to pass options in shebang lines
```

`env` was asked for a program literally called `bash -x`. GNU coreutils names the fix in the error itself:

```bash
printf '#!/usr/bin/env -S bash -x\necho hi\n' > bin/envS.sh; chmod +x bin/envS.sh
./bin/envS.sh
```

```text
+ echo hi
hi
```

`-S` splits the rest of the line into separate arguments. It is GNU-specific and recent; portable scripts put their options in a `set` line inside the script instead, which is what the next lesson does with `set -euo pipefail`.
:::

## `#!/bin/sh` is a different language

On Ubuntu, and on Debian and most derivatives:

```bash
ls -l /bin/sh
```

```text
lrwxrwxrwx 1 root root 4 Mar 31  2024 /bin/sh -> dash
```

`/bin/sh` is `dash`, a small POSIX shell chosen because it starts faster than bash — which matters when the boot sequence runs thousands of scripts. It is *not* bash with a different name, and the features bash adds are simply absent.

::: example The same three lines under two shells
An array, which is ordinary bash and not POSIX at all.

```bash
printf '#!/bin/sh\nx=(a b c)\necho ${x[1]}\n' > bin/sh_arr.sh; chmod +x bin/sh_arr.sh
./bin/sh_arr.sh
```

```text
./bin/sh_arr.sh: 2: Syntax error: "(" unexpected
```

Exit status 2, and the error names line 2 and the character it could not parse. Change one word of the shebang:

```bash
printf '#!/bin/bash\nx=(a b c)\necho ${x[1]}\n' > bin/bash_arr.sh; chmod +x bin/bash_arr.sh
./bin/bash_arr.sh
```

```text
b
```

The same file, the same three lines, running correctly. The features that exist in bash and not in `dash` are exactly the ones this module is built on: arrays, `[[ ]]`, `${var:-default}` beyond the POSIX subset, `$(( ))` with C-style `for`, process substitution `<( )`, `local`, `declare`, `PIPESTATUS` and `set -o pipefail`.

The practical rule: **write `#!/usr/bin/env bash` and use bash**, or write `#!/bin/sh` and restrict yourself to POSIX. What you must not do is write `#!/bin/sh` and test with bash, because on your Mac or your RHEL box `/bin/sh` *is* bash in POSIX mode and everything passes — then the script reaches an Ubuntu build node and dies at line 2. If you must be portable, test with `dash script.sh` explicitly.
:::

## `$0`, `BASH_SOURCE`, and finding your own directory

A script frequently needs a file that lives next to it: a configuration, a template, a helper. Writing `./etc/defaults.yaml` assumes the caller's working directory, which you do not control.

```text
$0            = work/bin/where.sh
BASH_SOURCE[0] = work/bin/where.sh
script dir     = /home/eng/work/bin
cwd            = /home/eng
```

That was produced by running `work/bin/where.sh` from `/home/eng`, and it shows the whole problem: `$0` is the path *as invoked*, relative to a working directory that is not the script's. The idiom that fixes it is one line:

```bash
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
```

Read it inside out. `${BASH_SOURCE[0]}` is the path of the file currently being executed — better than `$0`, because inside a sourced file `$0` is the *calling* shell's name while `BASH_SOURCE` is still the file. `dirname` strips the filename. `cd` there and `pwd` prints the absolute, symlink-resolved path. From then on, `"$here/../etc/defaults.yaml"` is unambiguous wherever the script was called from.

::: example A script skeleton to start every new file from
Everything in this lesson, in the form you should type before writing any logic.

```bash
#!/usr/bin/env bash
# sweep.sh — run a parameter sweep and collect the results.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly here

main() {
  echo "script dir : $here"
  echo "arguments  : $#"
}

main "$@"
```

Six decisions are already made: `env bash` so it follows `PATH`; a comment saying what the file is for; `set -euo pipefail`, which lesson 02 takes apart; `here` computed once and marked `readonly`; the work inside a `main` function so that nothing runs while the file is being read; and `main "$@"` passing the arguments through with the quoting that lesson 08 explains.

Make it executable and run it, from its own directory and from somewhere else:

```bash
chmod +x bin/skeleton.sh
./bin/skeleton.sh a b c
```

```text
script dir : /home/eng/work/bin
arguments  : 3
```

```bash
cd /home/eng && work/bin/skeleton.sh one
```

```text
script dir : /home/eng/work/bin
arguments  : 1
```

`here` is the same absolute path both times, while the invocation path differs — which is exactly the property you want for finding a file that sits next to the script. `$0`, by contrast, is the path as typed, which is why usage messages conventionally print `$0`: it shows the user the name they actually used.
:::

## Tracing, when a script does not do what it reads like

`set -x` makes bash print every command after expansion, prefixed with `+`:

```bash
printf '#!/usr/bin/env bash\nset -x\nn=3\necho "running $n cases"\n' > bin/trace.sh
chmod +x bin/trace.sh; ./bin/trace.sh
```

```text
+ n=3
+ echo 'running 3 cases'
running 3 cases
```

The trace shows `running 3 cases` *already substituted*, which is the point: you see what bash decided the command was, not what you wrote. For a script that mangles a filename, or expands a variable to nothing, the `+` lines are the answer. Turn it on for a section with `set -x` and off with `set +x`, or run the whole script with `bash -x script.sh` without editing it at all.

::: key
`#!` is read by the kernel, not by bash: it names an interpreter and at most one argument. Missing execute bit gives "Permission denied" and exit 126; a missing or misspelled interpreter — including one with a trailing `\r` — gives "cannot execute: required file not found" and exit 127; no shebang at all gives `Exec format error` to anything that is not a shell. Prefer `#!/usr/bin/env bash`; `#!/bin/sh` is `dash` on Debian and has no arrays.
:::

## Check yourself

::: check
A script runs when you type `bash deploy.sh` and fails with "Permission denied" when you type `./deploy.sh`. Explain both outcomes and give the fix.
:::

::: answer
`bash deploy.sh` starts a new bash and hands it the file to *read*. Reading needs only the read bit, so it works. `./deploy.sh` asks the kernel to *execute* the file, which needs the execute bit; without it, `execve` returns `EACCES` and bash reports "Permission denied" with exit status 126.

`chmod +x deploy.sh` is the fix. Note the distinction from exit 127, "cannot execute: required file not found", which means the file *was* executable and its interpreter could not be found.

There is a second cause of the same message worth knowing: the file may be on a filesystem mounted `noexec`, which is common for `/tmp` on hardened machines. Then `chmod +x` succeeds and changes nothing, and `findmnt -T deploy.sh` shows `noexec` in the options. Move the script somewhere else, or keep invoking it as `bash deploy.sh`.
:::

::: check
Why is `#!/usr/bin/env python3` usually preferred over `#!/usr/bin/python3`, and when would you deliberately choose the absolute path?
:::

::: answer
Because `env` searches `PATH` and the absolute path does not. Python in particular is rarely at one fixed location: a virtual environment puts its own interpreter first on `PATH`, `conda` and `pyenv` do the same, and `/usr/bin/python3` is the system one that your project's dependencies are deliberately *not* installed into. `#!/usr/bin/env python3` runs whichever interpreter the user has activated, which is almost always the one they intended.

Choose the absolute path when following `PATH` is itself the risk. A `systemd` unit or a `cron` job runs with an environment you do not control (previous module, lesson 10), so pinning the interpreter makes the behaviour reproducible. Anything running with elevated privilege should never resolve its interpreter through a `PATH` an attacker might influence. And a script that must use the system Python because it imports a system-installed module should say so explicitly.

The same argument applies to bash, with the difference that bash is almost always at `/bin/bash` on Linux and almost never up to date on macOS — which is why shared scripts use `env`.
:::

::: check
`./run_sweep.sh` gives `cannot execute: required file not found`, and `ls -l` shows `-rwxr-xr-x`. Name the two likely causes and the single command that distinguishes them.
:::

::: answer
The interpreter named on the shebang line does not exist as written. Either it is genuinely absent or misspelled — `#!/usr/bin/bashh`, or `#!/usr/local/bin/python3.11` on a machine that does not have it — or the line ends with a carriage return, so the kernel is looking for a file whose name ends in `\r`.

`head -1 run_sweep.sh | cat -A` distinguishes them in one line. It prints the shebang, and a `^M` immediately before the `$` means the second case. If there is no `^M`, read the path and check it with `ls -l` or `command -v`.

The fixes differ: `sed -i 's/\r$//' run_sweep.sh` for line endings, and correcting the path — or switching to `#!/usr/bin/env` — for the other. Both cases exit 127, the same status as "command not found", which is why the message is worded as it is.
:::

::: check
A colleague's script starts `#!/bin/sh` and uses `[[ -n "$x" ]]` and an array. It passes on his RHEL workstation and fails on the Ubuntu build node. Explain precisely.
:::

::: answer
`/bin/sh` is not a language, it is a symlink, and it points at different shells on different systems. On RHEL it is bash — running in POSIX mode, but still bash, so `[[ ]]` and arrays work. On Debian and Ubuntu it is `dash`, a small strictly-POSIX shell chosen for boot speed, which has neither. So the same file is interpreted by two different languages and only one of them accepts it.

The failure is a parse error, not a run-time one: `dash` reports something like `Syntax error: "(" unexpected` with a line number, and the script exits 2 without running anything at all — which is why "it did not even get to the first command" is a symptom of this specific problem.

The fix is to decide which language the script is in and say so. If it uses bash features, the shebang must be `#!/usr/bin/env bash`. If it must be portable to `dash`, remove the bashisms — `[ -n "$x" ]` instead of `[[ ]]`, and a whitespace-separated string or separate variables instead of an array — and test it with `dash script.sh`, not with your login shell. `shellcheck` (lesson 12) reads the shebang and flags bashisms under `#!/bin/sh` automatically.
:::

::: check
Why is `here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"` better than `here="$(dirname "$0")"`, and what does it still not handle?
:::

::: answer
Three improvements. `BASH_SOURCE[0]` is the file being executed even when the file has been `source`d into another shell, where `$0` would be the *calling* shell's name — so helper libraries can use the same line. The `cd ... && pwd` turns a relative path into an absolute one, so the value stays correct after the script later changes directory. And `pwd` resolves `..` and symlinked directory components along the way, giving one canonical path.

What it still does not handle: if the *script file itself* is a symlink, `dirname` gives the directory of the link, not of the target. A script installed as `/usr/local/bin/sweep -> /opt/sweep/2.1/bin/sweep` would compute `/usr/local/bin`, and `"$here/../etc"` would be wrong. `readlink -f "${BASH_SOURCE[0]}"` resolves the whole chain first, at the cost of being a GNU extension.

It also does not survive a script read from standard input (`bash < script.sh`), where there is no file and `BASH_SOURCE[0]` is empty — a good reason to test the value rather than assume it.
:::

## Summary

| Thing | Meaning | Note |
| --- | --- | --- |
| `#!` | the kernel reads bytes 0 and 1 | an instruction to `execve`, not a comment bash reads |
| `#!/usr/bin/env bash` | find bash on `PATH` | prefer for shared scripts |
| `#!/bin/bash` | that exact file | prefer for `systemd`, `cron`, privileged contexts |
| `#!/bin/sh` | `dash` on Debian/Ubuntu, bash on RHEL/macOS | no arrays, no `[[ ]]`; test with `dash` |
| one argument only | `#!/usr/bin/env bash -x` fails | GNU `env -S` splits it; `set -x` inside is portable |
| `chmod +x`, exit 126 | missing execute bit | "Permission denied"; `bash script.sh` still works |
| exit 127, "cannot execute: required file not found" | the *interpreter* is missing | or the shebang ends `\r`: check `head -1 \| cat -A` |
| `Exec format error` (`ENOEXEC`) | no shebang, run by a non-shell | `subprocess`, `systemd`, `make` all need one |
| `file script.sh` | identifies it from the first bytes | says which shell it claims |
| `$0` vs `${BASH_SOURCE[0]}` | invocation path vs the file itself | `BASH_SOURCE` also works in a sourced file |
| `here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"` | the script's own directory, absolute | does not resolve a symlinked script |
| `set -x` / `bash -x script.sh` | trace each command after expansion | lines prefixed `+`, with expansions already done |

Lesson 02 takes the second line of that skeleton apart: what `set -e`, `set -u` and `set -o pipefail` each protect against, and — just as important — what they do not.
