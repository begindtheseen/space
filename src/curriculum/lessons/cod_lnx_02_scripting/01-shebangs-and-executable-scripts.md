---
id: l01-shebangs-and-executable-scripts
title: Shebang lines and executable scripts
minutes: 22
covers:
  - Shebang lines and executable scripts
---

A shell script is a text file full of commands you could have typed by hand. Save those commands in a file, and you can run the same sequence tomorrow, on another machine, or five hundred times in a row. It is the smallest piece of automation you will ever build, and in flight-software and ground-station work you will build a lot of them: scripts that run a batch of simulations, tidy up telemetry logs, or check a build before it goes to a test stand.

Think of a letter that arrives with a note at the very top: "Please read this in French." Before anyone reads a word of the letter, the note decides who should read it. A script has the same kind of note. Its first line — the **shebang** — tells the computer which program should read the rest. Get that line wrong and you meet one of three unhelpful messages: "Permission denied", "cannot execute: required file not found", or a syntax error in code that is perfectly fine. None of them points at the line you need to fix.

This lesson is about that first line: what the computer does with `#!`, why `#!/usr/bin/env bash` is usually right, why `#!/bin/sh` is not bash, and how a script finds its own folder. Every one of its failure modes will happen to you at least once.

All output below was produced on a real machine and pasted exactly: Ubuntu 24.04.4, GNU bash 5.2.21, dash 0.5.12 as `/bin/sh`, GNU coreutils 9.4. The user is called `eng`, working in a directory that holds a small campaign of simulation runs.

## What the kernel actually does

When you type `./sweep.sh` (read `./` as "dot slash": "the file called sweep.sh in *this* directory"), your shell asks the **[[kernel|kernel]]** — the core of the operating system, the part that actually starts programs — to run that file. The request is a system call named **[[execve|execve-argv]]**.

The kernel does not trust the file's name. It looks at the first two bytes. If they are the **[[magic number|magic-bytes]]** of a compiled program, it loads that program. If they are `#` and `!` — the bytes 0x23 and 0x21 in hexadecimal — it reads the rest of that first line as the path of an interpreter, plus at most one argument. Then it runs *that* program instead, and hands it your script's path.

You can look at those two bytes yourself. `head -c 2` prints the first two bytes, and `od -c` shows them as characters:

```bash
head -c 2 bin/sweep.sh | od -c
```

```text
0000000   #   !
0000002
```

People read `#!` aloud as "hash-bang", or "shebang". So when `bin/sweep.sh` starts with `#!/usr/bin/env bash` and you run `./bin/sweep.sh a b`, the kernel turns it into this command:

```text
/usr/bin/env bash ./bin/sweep.sh a b
```

The `#!` line is an instruction to the kernel, not a comment bash happens to skip. It works because `#` also starts a comment in every shell, so bash ignores that line when it reads the file.

The `file` command reads the start of a file and tells you what it found:

```bash
file bin/sweep.sh
```

```text
bin/sweep.sh: Bourne-Again shell script, ASCII text executable
```

"Bourne-Again shell" is bash's full name. The word "executable" here means "has a shebang", not "has permission to run".

## The execute bit, and three error messages

A file needs its **execute bit** — the `x` permission you met in the previous module's lesson 03 — before you can run it by name. Without it:

```bash
./bin/sweep.sh
```

```text
bash: ./bin/sweep.sh: Permission denied
```

The **[[exit status|exit-codes]]** — the number a finished command hands back, where 0 means success — is 126. That means "found it, but it is not executable". `chmod +x bin/sweep.sh` adds the bit and fixes it.

The file is still perfectly *readable*, though. So you can always run it by handing it to an interpreter yourself:

```bash
bash bin/sweep.sh a b
```

```text
sweep.sh: 2 arguments
$0 is bin/sweep.sh
```

That form ignores both the execute bit and the shebang. Handy, but a trap: a script that works under `bash script.sh` can still fail under `./script.sh`.

The second message is the confusing one:

```bash
./bin/bad.sh
```

```text
bash: ./bin/bad.sh: cannot execute: required file not found
```

The exit status is 127. The script is right there. What is missing is the *interpreter* named on its first line: `#!/usr/bin/bashh`, with a typo. The kernel's `execve` reports "no such file" for the interpreter, and bash words that as if the script were the problem.

::: warning The invisible character
The third message is identical to the second, and the cause cannot be seen:

```bash
./bin/crlf.sh
```

```text
bash: ./bin/crlf.sh: cannot execute: required file not found
```

`cat -A` (from the previous module's lesson 02) shows every hidden character. A line end shows as `$`:

```bash
head -1 bin/crlf.sh | cat -A
```

```text
#!/bin/bash^M$
```

That `^M` is a **[[carriage return|carriage-return]]**, written `\r`. The file was saved on Windows, where each line ends with `\r\n` instead of Linux's plain `\n`. So the kernel goes looking for an interpreter called `/bin/bash\r`. That name is legal — a carriage return is allowed inside a filename — but no such file exists.

The fix is `sed -i 's/\r$//' script.sh`, which deletes a `\r` at the end of every line. The `dos2unix` tool does the same if it is installed. This will happen to you the first time a colleague emails you a script, or a repository is checked out with the wrong line-ending setting.
:::

## No shebang at all

A script with no `#!` still runs when a shell starts it, because the shell falls back to running the file with itself:

```bash
./bin/nosb.sh
```

```text
no shebang, argv0=./bin/nosb.sh
```

That fallback is a habit of shells, not of the kernel, and it vanishes when a program that is not a shell runs your script. Python's `subprocess`, `make`, a CI runner, `systemd`'s `ExecStart`, `find -exec`: all of them call `execve` directly, and the kernel refuses a file that is neither a compiled program nor a `#!` script. From Python:

```text
OSError: [Errno 8] Exec format error: './bin/nosb.sh'
```

`Exec format error` (its code name is `ENOEXEC`) means "I do not know how to run this". The fix is always the same: give the script a shebang.

## `#!/bin/bash` or `#!/usr/bin/env bash`?

Both name bash. They differ in *how* bash is found.

- `#!/bin/bash` is an absolute path — a full address starting from the top folder `/`. The kernel runs exactly that file, or fails.
- `#!/usr/bin/env bash` runs a small program called `env`, which searches your **[[PATH|path-search]]** — the list of folders where the shell looks for commands — and runs the first `bash` it finds.

`type -a` lists every match on `PATH`, in order:

```bash
type -a bash
```

```text
bash is /usr/bin/bash
bash is /bin/bash
```

Here both are the same program, because `/bin` is a link to `/usr/bin`. On a cluster they often differ: a newer bash under `/usr/local/bin`, a toolchain loaded by a module system, or a Homebrew bash on a colleague's Mac, where the built-in one is bash 3.2 from 2007. The `env` form follows `PATH`, so it picks the bash the user has set up. The absolute form pins one.

Prefer **`#!/usr/bin/env bash`** for scripts you share. Use an absolute path when you deliberately want the system's own interpreter no matter what the caller's `PATH` says: a `systemd` unit, a `cron` job, anything running with extra privileges. In those places, following `PATH` is a security or reproducibility risk.

::: warning Only one argument on the shebang line
The shebang line holds the interpreter and **at most one argument**. Linux passes everything after the interpreter as one single word:

```bash
printf '#!/usr/bin/env bash -x\necho hi\n' > bin/envx.sh; chmod +x bin/envx.sh
./bin/envx.sh
```

```text
/usr/bin/env: 'bash -x': No such file or directory
/usr/bin/env: use -[v]S to pass options in shebang lines
```

`env` was asked for a program literally named `bash -x`, space included. GNU coreutils names the fix in its own error message:

```bash
printf '#!/usr/bin/env -S bash -x\necho hi\n' > bin/envS.sh; chmod +x bin/envS.sh
./bin/envS.sh
```

```text
+ echo hi
hi
```

`-S` tells `env` to split the rest of the line into separate words. Not every system's `env` has it. Portable scripts put their options on a `set` line inside the script instead, which is exactly what the next lesson does with `set -euo pipefail`.
:::

## `#!/bin/sh` is a different language

On Ubuntu, Debian and most of their relatives:

```bash
ls -l /bin/sh
```

```text
lrwxrwxrwx 1 root root 4 Mar 31  2024 /bin/sh -> dash
```

The arrow means `/bin/sh` is a link, and it points at **[[dash|dash-history]]** — a small shell that follows only the POSIX standard, chosen because it starts faster than bash. That matters when a computer boots and runs thousands of little scripts. **POSIX** is the common-ground standard every Unix-like system agrees on. dash is *not* bash under another name: the extra features bash adds are not there.

::: example The same three lines under two shells
An **array** — one variable holding a list — is ordinary bash and not POSIX at all. This script makes an array of three letters and prints item number 1 (counting starts at 0, so that is `b`):

```bash
printf '#!/bin/sh\nx=(a b c)\necho ${x[1]}\n' > bin/sh_arr.sh; chmod +x bin/sh_arr.sh
./bin/sh_arr.sh
```

```text
./bin/sh_arr.sh: 2: Syntax error: "(" unexpected
```

Step 1: read the error. The `2` is the line number, and `"("` is the character dash could not understand. The exit status is 2, and nothing ran — dash rejected the file while reading it.

Step 2: change one word of the shebang, from `/bin/sh` to `/bin/bash`:

```bash
printf '#!/bin/bash\nx=(a b c)\necho ${x[1]}\n' > bin/bash_arr.sh; chmod +x bin/bash_arr.sh
./bin/bash_arr.sh
```

```text
b
```

Step 3: check the answer. Item 1 of `a b c` is `b`, as expected. The same three lines now run correctly.

The features that bash has and dash lacks are the ones this whole module is built on: arrays, `[[ ]]`, pattern replacement like `${var//a/b}`, C-style `for (( ))` loops, process substitution `<( )`, `declare`, `PIPESTATUS`, and `set -o pipefail`.

The practical rule: **write `#!/usr/bin/env bash` and use bash**, or write `#!/bin/sh` and stick to POSIX. What you must never do is write `#!/bin/sh` and test with bash. On a Mac or a Red Hat machine `/bin/sh` *is* bash in POSIX mode, so everything passes — and then the script reaches an Ubuntu build machine and dies at line 2. If you need to be portable, test with `dash script.sh` directly.
:::

## `$0`, `BASH_SOURCE`, and finding your own directory

A script often needs a file that sits next to it: a settings file, a template, a helper. Writing `./etc/defaults.yaml` assumes the caller is standing in the script's folder, which you do not control.

Here is a script that prints four things, run as `work/bin/where.sh` from `/home/eng`:

```text
$0            = work/bin/where.sh
BASH_SOURCE[0] = work/bin/where.sh
script dir     = /home/eng/work/bin
cwd            = /home/eng
```

`$0` (read "dollar zero") is the script's path *as typed*, which only makes sense from the caller's current working directory (`cwd`). That is the whole problem. One line fixes it:

```bash
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
```

Read it from the inside out:

1. `${BASH_SOURCE[0]}` is the path of the file being run right now. It beats `$0`, because inside a file loaded with `source` (which runs a file's commands inside the current shell), `$0` is the *calling* shell's name while `BASH_SOURCE` is still the file.
2. `dirname` cuts off the filename and leaves the folder: `work/bin`.
3. `$( … )` (read "dollar paren") runs the command inside and pastes in what it printed. Lesson 04 covers it properly.
4. `cd` goes to that folder, and `&&` (read "and-and") runs `pwd` only if the `cd` worked.
5. `pwd` prints the full, absolute path of where it now stands.

From then on, `"$here/../etc/defaults.yaml"` means the same file no matter where the script was called from.

::: example A script skeleton to start every new file from
Everything in this lesson, in the form to type before you write any logic:

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

Six decisions are already made:

1. `env bash`, so it follows `PATH`.
2. A comment saying what the file is for.
3. `set -euo pipefail`, which lesson 02 takes apart.
4. `here` computed once and marked `readonly`, so nothing can change it later.
5. The work inside a `main` **[[function|main-function]]**, so nothing runs while the file is still being read.
6. `main "$@"`, which passes every argument through unchanged, with the quoting that lesson 08 explains. `$#` (read "dollar hash") is the number of arguments.

Make it executable and run it from its own folder's parent, with three arguments:

```bash
chmod +x bin/skeleton.sh
./bin/skeleton.sh a b c
```

```text
script dir : /home/eng/work/bin
arguments  : 3
```

Now run it from somewhere else, with one argument:

```bash
cd /home/eng && work/bin/skeleton.sh one
```

```text
script dir : /home/eng/work/bin
arguments  : 1
```

Check the result: `here` is the same absolute path both times, even though you typed the script's name differently. That is the property you want. `$0`, by contrast, is the path as typed — which is why usage messages print `$0`: it shows the user the name they actually used.
:::

## Tracing, when a script does not do what it says

`set -x` makes bash print every command after it has filled in the variables, with a **[[plus sign in front|trace-prefix]]**:

```bash
printf '#!/usr/bin/env bash\nset -x\nn=3\necho "running $n cases"\n' > bin/trace.sh
chmod +x bin/trace.sh; ./bin/trace.sh
```

```text
+ n=3
+ echo 'running 3 cases'
running 3 cases
```

The trace shows `running 3 cases` with the `3` *already put in*. You see what bash decided the command was, not what you wrote — which is how you catch a mangled filename or an empty variable. Switch tracing on for one section with `set -x` and off again with `set +x`, or trace a whole script without editing it: `bash -x script.sh`.

::: key Shebangs and exit statuses
`#!` is read by the kernel, not by bash: it names an interpreter and at most one argument. A missing execute bit gives "Permission denied" and exit 126. A missing or misspelled interpreter — including one with a trailing `\r` — gives "cannot execute: required file not found" and exit 127. No shebang at all gives `Exec format error` to anything that is not a shell. Prefer `#!/usr/bin/env bash`; `#!/bin/sh` is `dash` on Debian and Ubuntu, and has no arrays.
:::

## Check yourself

::: check
A script runs when you type `bash deploy.sh`, and fails with "Permission denied" when you type `./deploy.sh`. Explain both outcomes and give the fix.
:::

::: answer
`bash deploy.sh` starts a new bash and hands it the file to *read*. Reading needs only the read permission, so it works.

`./deploy.sh` asks the kernel to *execute* the file, and that needs the execute bit. Without it, `execve` fails with a permission error (`EACCES`), and bash reports "Permission denied" with exit status 126.

The fix is `chmod +x deploy.sh`. Do not confuse this with exit 127, "cannot execute: required file not found", which means the file *was* executable but its interpreter could not be found.

There is a second cause of the same message worth knowing. The file may sit on a disk mounted `noexec` ("no execute"), which is common for `/tmp` on locked-down machines. Then `chmod +x` succeeds and changes nothing. `findmnt -T deploy.sh` shows `noexec` in its options. Move the script somewhere else, or keep running it as `bash deploy.sh`.
:::

::: check
Why is `#!/usr/bin/env python3` usually preferred over `#!/usr/bin/python3`, and when would you choose the absolute path on purpose?
:::

::: answer
Because `env` searches `PATH` and the absolute path does not. Python in particular rarely lives in one fixed place. A virtual environment puts its own interpreter first on `PATH`, and `conda` and `pyenv` do the same. Meanwhile `/usr/bin/python3` is the system's copy, which your project's packages were deliberately *not* installed into. `#!/usr/bin/env python3` runs whichever interpreter the user has switched on, which is almost always the one they meant.

Choose the absolute path when following `PATH` is itself the risk. A `systemd` unit or a `cron` job runs with an environment you do not control (previous module, lesson 10), so pinning the interpreter makes its behavior repeatable. Anything running with extra privileges should never find its interpreter through a `PATH` an attacker might change. And a script that needs the system Python, because it imports a module installed only there, should say so plainly.

The same goes for bash: it is almost always at `/bin/bash` on Linux and almost never up to date on macOS, so shared scripts use `env`.
:::

::: check
`./run_sweep.sh` gives `cannot execute: required file not found`, and `ls -l` shows `-rwxr-xr-x`. Name the two likely causes and the one command that tells them apart.
:::

::: answer
The interpreter named on the shebang line does not exist as written. Either it really is missing or misspelled — `#!/usr/bin/bashh`, or `#!/usr/local/bin/python3.11` on a machine without it — or the line ends with a carriage return, so the kernel is hunting for a name ending in `\r`.

`head -1 run_sweep.sh | cat -A` tells them apart. It prints the shebang line with hidden characters shown. A `^M` right before the final `$` means the second cause. No `^M` means the first: read the path, and check it with `ls -l` or `command -v`.

The fixes differ. For line endings, `sed -i 's/\r$//' run_sweep.sh`. For a bad path, correct it, or switch to `#!/usr/bin/env`. Both cases exit 127, the same status as "command not found" — and that is exactly what happened: a command, the interpreter, was not found.
:::

::: check
A colleague's script starts `#!/bin/sh` and uses `[[ -n "$x" ]]` and an array. It passes on his Red Hat (RHEL) workstation and fails on the Ubuntu build machine. Explain exactly why.
:::

::: answer
`/bin/sh` is not a language. It is a link, and it points at different shells on different systems. On RHEL it points at bash — running in POSIX mode, but still bash, so `[[ ]]` and arrays work. On Debian and Ubuntu it points at `dash`, a small strictly-POSIX shell chosen for fast booting, which has neither. The same file is being read by two different languages, and only one accepts it.

It is a parse error: `dash` reports something like `Syntax error: "(" unexpected` with a line number and exits 2 without running a single command. "It did not even reach the first line" is the fingerprint of this problem.

The fix is to decide which language the script is in and say so. If it uses bash features, the shebang must be `#!/usr/bin/env bash`. If it must run under `dash`, remove the bash-only features — `[ -n "$x" ]` instead of `[[ ]]`, and a space-separated string or separate variables instead of the array — and test it with `dash script.sh`, not with your login shell. `shellcheck` (lesson 12) reads the shebang and flags bash-only features under `#!/bin/sh` automatically.
:::

::: check
Why is `here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"` better than `here="$(dirname "$0")"`, and what does it still not handle?
:::

::: answer
It improves on the simple form in two ways. First, `BASH_SOURCE[0]` is the file being run even when that file was loaded with `source` into another shell, where `$0` would be the *calling* shell's name — so helper libraries can use the same line. Second, the `cd … && pwd` turns a relative path like `work/bin` into an absolute one, so the value stays correct even after the script later changes directory. It also tidies away any `..` in the path.

What it still does not handle:

- **Symbolic links.** `pwd` prints the path you arrived by; it does not resolve linked folders. Use `pwd -P` if you need the real, physical folder.
- **A script that is itself a link.** `dirname` then gives the link's folder, not the target's. A script installed as `/usr/local/bin/sweep -> /opt/sweep/2.1/bin/sweep` would compute `/usr/local/bin`, and `"$here/../etc"` would point to the wrong place. `readlink -f "${BASH_SOURCE[0]}"` follows the whole chain first, at the cost of being a GNU extension.
- **A script fed on standard input** (`bash < script.sh`). There is no file, `BASH_SOURCE[0]` is empty, and the line quietly gives the current directory instead. Test the value rather than assume it.
:::

## Summary

| Thing | Meaning | Note |
| --- | --- | --- |
| `#!` | the kernel reads bytes 0 and 1 | an instruction to `execve`, not a comment bash reads |
| `#!/usr/bin/env bash` | find bash on `PATH` | prefer for shared scripts |
| `#!/bin/bash` | that exact file | prefer for `systemd`, `cron`, privileged contexts |
| `#!/bin/sh` | `dash` on Debian/Ubuntu, bash on RHEL/macOS | no arrays, no `[[ ]]`; test with `dash` |
| one argument only | `#!/usr/bin/env bash -x` fails | `env -S` splits it; `set -x` inside is portable |
| `chmod +x`, exit 126 | missing execute bit | "Permission denied"; `bash script.sh` still works |
| exit 127, "cannot execute: required file not found" | the *interpreter* is missing | or the shebang ends `\r`: check `head -1 \| cat -A` |
| `Exec format error` (`ENOEXEC`) | no shebang, run by a non-shell | `subprocess`, `systemd`, `make` all need one |
| `file script.sh` | identifies a file from its first bytes | says which shell it claims |
| `$0` vs `${BASH_SOURCE[0]}` | path as typed vs the file itself | `BASH_SOURCE` also works in a sourced file |
| `here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"` | the script's own folder, absolute | does not resolve symlinks (`pwd -P` does) |
| `set -x` / `bash -x script.sh` | trace each command after expansion | lines start with `+`, variables already filled in |

Lesson 02 takes the second line of that skeleton apart: what `set -e`, `set -u` and `set -o pipefail` each protect against — and, equally important, what they do not.

::: context kernel The kernel, the program under all programs
The **kernel** is the part of the operating system that is always running and in charge of the hardware. It decides which program gets the processor next, hands out memory, and talks to disks and networks. Everything else — your shell, your editor, a flight simulation — is an ordinary program that has to *ask* the kernel whenever it wants something done. Those requests are called **system calls**. On a Linux flight computer or a ground-station server, it is the same Linux kernel doing this job; "Linux" is, strictly, the name of the kernel alone.
:::

::: context execve-argv How execve rewrites your command
A running program keeps its arguments as a numbered list, called `argv` ("argument vector"). When the kernel finds `#!` at the start of a file, it builds a new list: first the interpreter, then the one optional argument from the shebang line, then the script's path, then your original arguments.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="10" y="18" font-size="12" fill="#1f2a44">You type:</text>
  <rect x="112" y="26" width="94" height="24" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="159" y="42" font-size="11" text-anchor="middle" fill="#1f2a44">./bin/sweep.sh</text>
  <rect x="212" y="26" width="24" height="24" fill="#fff" stroke="#1f2a44"/>
  <text x="224" y="42" font-size="11" text-anchor="middle" fill="#1f2a44">a</text>
  <rect x="242" y="26" width="24" height="24" fill="#fff" stroke="#1f2a44"/>
  <text x="254" y="42" font-size="11" text-anchor="middle" fill="#1f2a44">b</text>
  <line x1="180" y1="56" x2="180" y2="80" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="180,86 175,77 185,77" fill="#1f2a44"/>
  <text x="190" y="74" font-size="11" fill="#6c7a93">reads #!/usr/bin/env bash</text>
  <text x="10" y="104" font-size="12" fill="#1f2a44">Kernel runs:</text>
  <rect x="10" y="112" width="82" height="24" fill="#f2b880" stroke="#1f2a44"/>
  <text x="51" y="128" font-size="11" text-anchor="middle" fill="#1f2a44">/usr/bin/env</text>
  <rect x="98" y="112" width="40" height="24" fill="#f2b880" stroke="#1f2a44"/>
  <text x="118" y="128" font-size="11" text-anchor="middle" fill="#1f2a44">bash</text>
  <rect x="144" y="112" width="94" height="24" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="191" y="128" font-size="11" text-anchor="middle" fill="#1f2a44">./bin/sweep.sh</text>
  <rect x="244" y="112" width="24" height="24" fill="#fff" stroke="#1f2a44"/>
  <text x="256" y="128" font-size="11" text-anchor="middle" fill="#1f2a44">a</text>
  <rect x="274" y="112" width="24" height="24" fill="#fff" stroke="#1f2a44"/>
  <text x="286" y="128" font-size="11" text-anchor="middle" fill="#1f2a44">b</text>
</svg>
```

Orange came from the shebang line, blue is your script, white are your arguments. Because the shebang supplies only one orange slot after the interpreter, `bash -x` cannot be split into two.
:::

::: context magic-bytes Magic numbers: a file's fingerprint
Many file types start with a fixed pattern of bytes called a **magic number**, so a program can tell what a file is without trusting its name. A compiled Linux program (an ELF file) starts with the byte 0x7F followed by the letters E, L, F. A script starts with `#!`.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <text x="10" y="34" font-size="12" fill="#1f2a44">script</text>
  <text x="10" y="84" font-size="12" fill="#1f2a44">program</text>
  <g font-size="12" text-anchor="middle" fill="#1f2a44">
    <rect x="80" y="14" width="60" height="32" fill="#f2b880" stroke="#1f2a44"/><text x="110" y="28">23</text><text x="110" y="42">#</text>
    <rect x="140" y="14" width="60" height="32" fill="#f2b880" stroke="#1f2a44"/><text x="170" y="28">21</text><text x="170" y="42">!</text>
    <rect x="200" y="14" width="60" height="32" fill="#fff" stroke="#1f2a44"/><text x="230" y="28">2F</text><text x="230" y="42">/</text>
    <rect x="260" y="14" width="60" height="32" fill="#fff" stroke="#1f2a44"/><text x="290" y="28">75</text><text x="290" y="42">u</text>
    <rect x="80" y="64" width="60" height="32" fill="#8fb8f0" stroke="#1f2a44"/><text x="110" y="78">7F</text><text x="110" y="92">DEL</text>
    <rect x="140" y="64" width="60" height="32" fill="#8fb8f0" stroke="#1f2a44"/><text x="170" y="78">45</text><text x="170" y="92">E</text>
    <rect x="200" y="64" width="60" height="32" fill="#8fb8f0" stroke="#1f2a44"/><text x="230" y="78">4C</text><text x="230" y="92">L</text>
    <rect x="260" y="64" width="60" height="32" fill="#8fb8f0" stroke="#1f2a44"/><text x="290" y="78">46</text><text x="290" y="92">F</text>
  </g>
  <text x="200" y="114" font-size="11" text-anchor="middle" fill="#6c7a93">first four bytes, in hexadecimal and as characters</text>
</svg>
```

The kernel checks only the first two bytes for `#!`; the `file` command knows hundreds of these patterns.
:::

::: context exit-codes What the exit numbers mean
Every command ends by handing back a number from 0 to 255. Zero means success; anything else means some kind of failure, and the program chooses which. The shell reserves a few: **126** means the file was found but could not be executed, **127** means the command (or the interpreter) was not found, and **128 + n** means the program was killed by signal number n — so 130 is Ctrl-C (signal 2). You can read the last one with `echo $?`. Lesson 06 builds on this.
:::

::: context carriage-return Why Windows ends lines with two characters
The names come from typewriters and teleprinters. A **carriage return** slid the print head back to the left edge; a **line feed** rolled the paper up one line. A new line needed both. Windows kept both as the line ending, `\r\n`. Unix, and so Linux and macOS, kept only the line feed, `\n`. Most editors hide the difference, which is why the `^M` catches people. Git can convert line endings on checkout, so a repository setting can introduce the problem without anyone editing a file.
:::

::: context path-search How PATH is searched
`PATH` is a list of folders separated by colons. To find a command, the shell (or `env`) tries each folder in order and stops at the first one that has it. An imaginary cluster account, for example:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <text x="10" y="18" font-size="12" fill="#1f2a44">PATH = /opt/tools/bin : /usr/local/bin : /usr/bin</text>
  <rect x="10" y="34" width="104" height="40" fill="#fff" stroke="#1f2a44"/>
  <text x="62" y="52" font-size="11" text-anchor="middle" fill="#1f2a44">/opt/tools/bin</text>
  <text x="62" y="66" font-size="11" text-anchor="middle" fill="#6c7a93">no bash</text>
  <rect x="128" y="34" width="104" height="40" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <text x="180" y="52" font-size="11" text-anchor="middle" fill="#1f2a44">/usr/local/bin</text>
  <text x="180" y="66" font-size="11" text-anchor="middle" fill="#1f2a44">bash 5.2</text>
  <rect x="246" y="34" width="104" height="40" fill="#fff" stroke="#6c7a93"/>
  <text x="298" y="52" font-size="11" text-anchor="middle" fill="#6c7a93">/usr/bin</text>
  <text x="298" y="66" font-size="11" text-anchor="middle" fill="#6c7a93">bash 4.4</text>
  <polygon points="121,54 115,49 115,59" fill="#1f2a44"/>
  <text x="180" y="96" font-size="12" text-anchor="middle" fill="#1d6fd1">env picks this one</text>
  <text x="298" y="96" font-size="11" text-anchor="middle" fill="#6c7a93">never reached</text>
</svg>
```

`#!/usr/bin/env bash` would run bash 5.2 here; `#!/usr/bin/bash` would run 4.4.
:::

::: context dash-history Where dash comes from
dash is the Debian Almquist shell. Kenneth Almquist wrote a small Bourne-compatible shell, `ash`, in 1989. Herbert Xu later ported it to Linux for Debian, and in 2002 it was renamed dash. Ubuntu made `/bin/sh` point to dash in 2006, and Debian followed a few years later, because boot scripts started noticeably faster with a smaller shell. The price is that scripts which quietly relied on bash features under `#!/bin/sh` broke — the same failure you saw above.
:::

::: context main-function Why wrap the work in main
Bash reads a script a little at a time as it runs it, not all at once. If the file changes while it runs, or arrives incomplete (for example, a download piped straight into bash), bash may execute half a line. Putting the work inside `main() { … }` and calling `main "$@"` on the very last line means bash has to read the whole file before anything happens. It also makes the file easy to scan: definitions first, one call at the end.
:::

::: context trace-prefix Changing what the + says
The `+` at the start of each traced line is the value of a variable called `PS4`. You can change it. Setting `PS4='+ ${BASH_SOURCE}:${LINENO}: '` (single quotes, so it is filled in fresh for each line) makes every traced command show its file and line number — very handy in a long script. When commands run inside other commands, the `+` repeats, one per level of nesting.
:::
