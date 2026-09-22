/* ============================================================================
   ORBIT — "Coding & Software" track
   ----------------------------------------------------------------------------
   Weighting follows the research: SpaceX flight software is C++ on Linux,
   Python is the production test/analysis language, MATLAB/Simulink is co-equal
   for the GNC-analyst and model-based-design path, SQL is real but supporting,
   Rust is a forward bet rather than a hiring gate, and CAD is cross-discipline
   literacy rather than a GNC skill.

   Ids are `cod_<area>_<nn>_<slug>`. The track is self-contained: every prereq
   below names a module in this file.
   ========================================================================== */

import type { Module } from './types'

export const CODING: Module[] = [
  /* ══ LINUX & THE SHELL ═══════════════════════════════════════════════════ */
  {
    id: 'cod_lnx_01_shell',
    track: 'coding',
    tier: 0,
    title: 'Linux and the Shell',
    summary:
      "The first module in the whole track. Falcon 9 carries three dual-core x86 flight computers running Linux, and essentially all flight-software and simulation development happens on Linux, so the shell is the room you will live in.",
    prereqs: [],
    hours: 25,
    topics: [
      'Filesystem hierarchy, absolute vs relative paths, ~ . ..',
      'ls cd cp mv rm mkdir ln (hard vs symbolic links)',
      'cat less head tail -f wc',
      'Permissions: chmod octal and symbolic, chown, umask',
      'Processes: ps, top/htop, kill, SIGTERM vs SIGKILL, job control, nohup',
      'systemd: systemctl, journalctl',
      'Pipes and redirection: | > >> 2> 2>&1 /dev/null, here-docs, tee, xargs',
      'grep and regular expressions, cut, sort, uniq -c, tr, find -exec',
      'diff/patch, tar, gzip, zstd, rsync, scp',
      'ssh keys, ~/.ssh/config, agent forwarding, port forwarding',
      'tmux sessions, windows, panes, detach/attach',
      'Environment variables, PATH, .bashrc vs .bash_profile',
      'Package management (apt/dnf) and building from source',
      'df du lsblk ip ss curl strace lsof dmesg',
      'vim survival: modes, motions, :wq',
    ],
    objectives: [
      'Navigate, inspect and modify a remote Linux machine entirely from the shell without a GUI.',
      'Compose pipelines of grep/sort/uniq/awk/cut to answer a question about a directory of log files.',
      'Explain the difference between SIGTERM and SIGKILL and choose correctly when a simulation hangs.',
      'Keep a six-hour Monte Carlo alive across a dropped SSH connection using tmux.',
      'Read and set Unix permissions in both octal and symbolic form.',
    ],
    resources: [
      {
        title: 'The Missing Semester of Your CS Education',
        author: 'Anish Athalye, Jon Gjengset, Jose Javier Gonzalez Ortiz (MIT)',
        kind: 'course',
        url: 'https://missing.csail.mit.edu/',
        free: true,
        note: 'Eleven one-hour lectures with notes and exercises. Lectures 1-4 are this module.',
      },
      {
        title: 'The Linux Command Line',
        author: 'William Shotts',
        kind: 'book',
        url: 'https://linuxcommand.org/tlcl.php',
        free: true,
        note: 'Full PDF is free from the author. The most complete beginner path.',
      },
      {
        title: 'explainshell',
        kind: 'tool',
        url: 'https://explainshell.com/',
        free: true,
        note: 'Paste any command line and it annotates every flag. Use it while reading other people scripts.',
      },
      {
        title: 'Linux Pocket Guide, 4th ed.',
        author: 'Daniel J. Barrett',
        kind: 'book',
        free: false,
        note: 'Keep on the desk as a lookup table, not a read-through.',
      },
    ],
    exercises: [
      {
        id: 'lnx01_ex1',
        title: 'Worst-case miss distance across 500 Monte Carlo logs',
        prompt:
          'A directory `runs/` holds 500 files named `case_0001.log` ... `case_0500.log`. Each contains a line of the form `MISS_DISTANCE_M 1234.5`. Write a single pipeline that prints the ten largest miss distances together with the file they came from, largest first. Expected output: ten lines, each `<filename>:<value>`, sorted descending by value.',
        kind: 'code',
        lang: 'bash',
        starter: 'grep -H "MISS_DISTANCE_M" runs/*.log | # ...continue the pipeline\n',
        solution:
          "grep -H 'MISS_DISTANCE_M' runs/*.log \\\n  | awk -F'[: ]+' '{print $1 \":\" $3}' \\\n  | sort -t: -k2 -g -r \\\n  | head -10\n",
        hours: 1,
      },
      {
        id: 'lnx01_ex2',
        title: 'Survive a dropped connection',
        prompt:
          'On a remote machine, set up passwordless SSH with an ed25519 key and a `~/.ssh/config` host alias, start a named tmux session, launch a long-running job inside it, detach, disconnect, reconnect and reattach. Success is the job still running and its scrollback intact.',
        kind: 'build',
        hours: 2,
      },
    ],
    cards: [
      {
        id: 'lnx01_c1',
        front: 'SIGTERM vs SIGKILL',
        back:
          'SIGTERM (15) is a polite request the process can catch and handle, so it can flush buffers and close files. SIGKILL (9) is delivered by the kernel and cannot be caught, blocked or ignored, so partial output is lost. Always try SIGTERM first.',
      },
      {
        id: 'lnx01_c2',
        front: 'What does `chmod 754 file` grant?',
        back:
          'Owner rwx (7), group r-x (5), others r-- (4). Each digit is a bitfield: read=4, write=2, execute=1.',
      },
      {
        id: 'lnx01_c3',
        front: 'What does `2>&1` mean, and why does order matter in `cmd > out 2>&1`?',
        back:
          'It makes fd 2 (stderr) a duplicate of wherever fd 1 currently points. Redirections are applied left to right, so `> out 2>&1` sends both streams to the file, while `2>&1 > out` sends stderr to the original terminal and only stdout to the file.',
      },
      {
        id: 'lnx01_c4',
        front: 'Hard link vs symbolic link',
        back:
          'A hard link is a second directory entry pointing at the same inode: same filesystem only, no notion of an original, data survives until the last link is removed. A symlink is a small file holding a path: it can cross filesystems and point at directories, and it dangles if the target moves.',
      },
      {
        id: 'lnx01_c5',
        front: 'Why does `sudo echo hello > /root/f` fail even with sudo?',
        back:
          'The redirection is performed by your shell, which is still unprivileged, before sudo ever runs. Use `echo hello | sudo tee /root/f` or `sudo sh -c "echo hello > /root/f"`.',
      },
      {
        id: 'lnx01_c6',
        front: 'What is the difference between `find . -name "*.log" -delete` and `ls *.log`?',
        back:
          '`find` walks the tree itself and passes each match to its own actions, so it recurses and handles huge match counts. `ls *.log` relies on the shell expanding the glob first, which only matches the current directory and can blow the argument-list limit.',
      },
      {
        id: 'lnx01_c7',
        front: 'What is `xargs` for?',
        back:
          'It converts data on stdin into command-line arguments. Use `-0` with `find -print0` so filenames containing spaces or newlines survive, and `-n`/`-P` to batch and parallelise.',
      },
      {
        id: 'lnx01_c8',
        front: 'Why does a job started with `&` still die when you close the terminal?',
        back:
          'Closing the terminal sends SIGHUP to the foreground process group. `nohup`, `disown`, `setsid` or, best, running inside tmux detaches the job from that terminal lifecycle.',
      },
      {
        id: 'lnx01_c9',
        front: 'Load average of 8.0 on an 8-core box means what?',
        back:
          'On average eight tasks were runnable or in uninterruptible sleep, i.e. the machine is roughly fully committed but not necessarily oversubscribed. Compare against core count, and check whether the tasks are CPU-bound or blocked on I/O before concluding anything.',
      },
      {
        id: 'lnx01_c10',
        front: 'Where do you look first when a simulation binary silently exits on a remote box?',
        back:
          'Exit status ($?), then the process stderr, then `dmesg` (the OOM killer logs there), then `journalctl -u <unit>` if it was a service, then check `ulimit -c` and look for a core file.',
      },
      {
        id: 'lnx01_c11',
        front: 'What does `tail -f` do that `cat` cannot?',
        back:
          'It keeps the file open and prints new bytes as they are appended, so you can watch a running job. `tail -F` additionally re-opens the file if it is rotated or replaced.',
      },
      {
        id: 'lnx01_c12',
        front: 'What is an SSH agent forward and when is it dangerous?',
        back:
          'It lets a remote host use your local private key for onward authentication without copying the key. Anyone with root on that remote host can use your agent socket while you are connected, so never forward to machines you do not trust.',
      },
    ],
    quiz: [
      {
        id: 'lnx01_q1',
        q: 'A 6-hour Monte Carlo is running over SSH and your laptop is about to sleep. What is the correct action?',
        choices: [
          'Press Ctrl-Z to suspend it until you reconnect',
          'Run it inside tmux and detach with the prefix key then d',
          'Nice the process to priority 19 so it survives',
          'Redirect stdout to a file, which detaches it from the terminal',
        ],
        answer: 1,
        explain:
          'tmux keeps the process attached to a session owned by the server, not by your terminal, so the SSH drop is irrelevant. Ctrl-Z only stops the job, nice changes scheduling priority, and redirection does not change process-group membership, so SIGHUP still reaches it.',
        b: -1.0,
        bloom: 'apply',
      },
      {
        id: 'lnx01_q2',
        q: 'What is `chmod 640 telemetry.csv` in symbolic terms?',
        choices: [
          'u=rwx, g=r, o=—',
          'u=rw, g=r, o=—',
          'u=rw, g=rw, o=r',
          'u=r, g=rw, o=—',
        ],
        answer: 1,
        explain: '6 = 4+2 = rw for the owner, 4 = r for the group, 0 = no permission for others.',
        b: -1.2,
        bloom: 'recall',
      },
      {
        id: 'lnx01_q3',
        q: 'Which command counts how many distinct vehicle ids appear in a log column?',
        choices: [
          'cut -d, -f2 log.csv | sort | uniq -c | wc -l',
          'cut -d, -f2 log.csv | uniq | wc -l',
          'grep -c "," log.csv',
          'awk "{print $2}" log.csv | wc -l',
        ],
        answer: 0,
        explain:
          '`uniq` only collapses adjacent duplicates, so it must be preceded by `sort`. Option B misses non-adjacent repeats, C counts lines, and D counts every row rather than distinct values.',
        b: -0.3,
        bloom: 'apply',
      },
      {
        id: 'lnx01_q4',
        q: 'Which statement about SIGKILL is correct?',
        choices: [
          'A process can install a handler for it to flush its buffers',
          'It is delivered only after SIGTERM has been ignored twice',
          'It cannot be caught, blocked or ignored',
          'It asks the process to reload its configuration',
        ],
        answer: 2,
        explain:
          'SIGKILL and SIGSTOP are the two signals the kernel refuses to let a process intercept. That is exactly why it can lose buffered output.',
        b: -0.8,
        bloom: 'recall',
      },
      {
        id: 'lnx01_q5',
        q: 'You run `cmd 2>&1 > out.txt`. Where does stderr end up?',
        choices: [
          'In out.txt, together with stdout',
          'On the terminal, because fd 2 was duplicated before fd 1 was redirected',
          'Discarded',
          'In a file named 1',
        ],
        answer: 1,
        explain:
          'Redirections apply left to right. At the moment of `2>&1`, fd 1 still points at the terminal, so stderr is bound to the terminal; only afterwards is stdout moved to the file.',
        b: 0.8,
        bloom: 'analyze',
      },
      {
        id: 'lnx01_q6',
        q: 'Why do flight-software and simulation teams work on Linux rather than Windows?',
        choices: [
          'Because MATLAB only runs on Linux',
          'Because the target itself runs Linux, and the toolchain, debuggers and automation are native there',
          'Because Linux floating-point arithmetic is more accurate',
          'Because C++ cannot be compiled on Windows',
        ],
        answer: 1,
        explain:
          'Falcon 9 flight computers run Linux on x86, and the gcc/clang/gdb/perf/CMake toolchain plus scripted automation are first-class there. The other three options are simply false.',
        b: -0.5,
        bloom: 'understand',
      },
      {
        id: 'lnx01_q7',
        q: 'Which of these safely handles filenames containing spaces?',
        choices: [
          'find . -name "*.log" | xargs rm',
          'find . -name "*.log" -print0 | xargs -0 rm',
          'for f in $(ls *.log); do rm $f; done',
          'rm `find . -name "*.log"`',
        ],
        answer: 1,
        explain:
          'NUL is the only byte that cannot appear in a filename, so `-print0` with `xargs -0` is the safe pairing. The other three all split on whitespace.',
        b: 0.4,
        bloom: 'apply',
      },
      {
        id: 'lnx01_q8',
        q: 'A process shows state D in `ps`. What does that tell you?',
        choices: [
          'It is a daemon',
          'It is dead and waiting to be reaped',
          'It is in uninterruptible sleep, almost always blocked on I/O',
          'It has been debugged and stopped',
        ],
        answer: 2,
        explain:
          'D is uninterruptible sleep: the task is inside a kernel call that cannot be interrupted, typically disk or network I/O. It does not respond to SIGKILL until the call returns, which is why such processes look unkillable.',
        b: 1.1,
        bloom: 'analyze',
      },
    ],
    tags: ['spacex-core', 'tooling', 'linux'],
    importance: 1.4,
  },

  {
    id: 'cod_lnx_02_scripting',
    track: 'coding',
    tier: 1,
    title: 'Bash Scripting and Text Processing',
    summary:
      "Turn one-off commands into reproducible automation: sweep scripts, log post-processing and glue code. Quoting discipline here is the single largest source of silent bugs in engineering shell scripts.",
    prereqs: ['cod_lnx_01_shell'],
    hours: 15,
    topics: [
      'Shebang lines and executable scripts',
      'set -euo pipefail and what each flag actually does',
      'Variables, quoting, word splitting, glob expansion',
      'Command substitution $( ), arithmetic $(( )), arrays',
      'if / for / while / case, test [[ ]] vs [ ]',
      'Functions, return values, exit codes, $?',
      'trap for cleanup on EXIT/INT/TERM',
      'getopts for flags, positional args, "$@" vs "$*"',
      'Here-docs and here-strings',
      'sed substitution and addressing; awk fields, patterns, BEGIN/END, arrays',
      'jq for JSON, column/paste/join for tabular text',
      'shellcheck as a mandatory linter',
      'cron and systemd timers',
      'When to stop writing bash and switch to Python',
    ],
    objectives: [
      'Write a parameter-sweep driver that runs N simulation cases, collects results and fails loudly on the first error.',
      'Explain line by line what `set -euo pipefail` protects against.',
      'Quote every variable expansion correctly and justify why.',
      'Extract and reshape columns from an unstructured log with awk in one pass.',
      'Pass shellcheck with zero warnings.',
    ],
    resources: [
      {
        title: 'The Missing Semester: Shell Tools and Scripting',
        author: 'MIT',
        kind: 'course',
        url: 'https://missing.csail.mit.edu/2020/shell-tools/',
        free: true,
      },
      {
        title: 'ShellCheck',
        kind: 'tool',
        url: 'https://www.shellcheck.net/',
        free: true,
        note: 'Run it on every script you write. It catches the quoting class of bug automatically.',
      },
      {
        title: 'The Linux Command Line, Part 4 (Writing Shell Scripts)',
        author: 'William Shotts',
        kind: 'book',
        url: 'https://linuxcommand.org/tlcl.php',
        free: true,
      },
      {
        title: 'GNU Awk User Guide',
        author: 'Free Software Foundation',
        kind: 'docs',
        url: 'https://www.gnu.org/software/gawk/manual/gawk.html',
        free: true,
      },
    ],
    exercises: [
      {
        id: 'lnx02_ex1',
        title: 'Monte Carlo sweep driver',
        prompt:
          'Write `sweep.sh` that takes `-n <cases>` and `-o <outdir>`, creates the output directory, runs `./sim --seed $i --out $OUTDIR/case_$i.csv` for i in 1..n, aborts immediately if any case fails, tars the output directory on success, and always removes its temp directory via a trap. It must pass shellcheck. Expected behaviour: exit code 0 and a tarball on success; non-zero exit and no tarball if any case fails.',
        kind: 'code',
        lang: 'bash',
        starter: '#!/usr/bin/env bash\nset -euo pipefail\n\n# TODO: parse -n and -o with getopts\n# TODO: mktemp -d and trap cleanup\n# TODO: loop, run sim, tar results\n',
        solution:
          '#!/usr/bin/env bash\nset -euo pipefail\n\nn=10\noutdir="results"\nwhile getopts ":n:o:" opt; do\n  case "$opt" in\n    n) n="$OPTARG" ;;\n    o) outdir="$OPTARG" ;;\n    *) echo "usage: $0 [-n cases] [-o outdir]" >&2; exit 2 ;;\n  esac\ndone\n\ntmp="$(mktemp -d)"\ntrap \'rm -rf "$tmp"\' EXIT\n\nmkdir -p "$outdir"\nfor ((i = 1; i <= n; i++)); do\n  ./sim --seed "$i" --out "$outdir/case_$i.csv"\ndone\n\ntar -czf "$outdir.tar.gz" -C "$(dirname "$outdir")" "$(basename "$outdir")"\necho "wrote $outdir.tar.gz"\n',
        hours: 2,
      },
      {
        id: 'lnx02_ex2',
        title: 'Single-pass awk summary',
        prompt:
          'A log has lines `t=12.5 chan=WHEEL_RPM val=4211.0`. Write one awk program that prints, per channel, the count, mean and max of val, sorted by channel name. Expected output format: `CHANNEL count mean max` with mean to three decimals.',
        kind: 'code',
        lang: 'bash',
        starter: "awk -F'[= ]' '{ # fields: 1=t 2=<time> 3=chan 4=<name> 5=val 6=<value>\n}' run.log\n",
        solution:
          "awk -F'[= ]' '\n  { c[$4]++; s[$4] += $6; if (!($4 in mx) || $6 > mx[$4]) mx[$4] = $6 }\n  END { for (k in c) printf \"%s %d %.3f %g\\n\", k, c[k], s[k]/c[k], mx[k] }\n' run.log | sort\n",
        hours: 1,
      },
    ],
    cards: [
      {
        id: 'lnx02_c1',
        front: 'What does each part of `set -euo pipefail` do?',
        back:
          '-e exits on the first command that returns non-zero, -u makes an unset variable an error instead of an empty string, -o pipefail makes a pipeline return the first non-zero status instead of only the last command status.',
      },
      {
        id: 'lnx02_c2',
        front: 'Why must you write "$var" and not $var?',
        back:
          'Unquoted expansion undergoes word splitting on IFS and then glob expansion. A path containing a space becomes two arguments, and a value containing * expands against the directory. Quoting suppresses both.',
      },
      {
        id: 'lnx02_c3',
        front: '"$@" vs "$*"',
        back:
          '"$@" expands to one shell word per argument, preserving argument boundaries. "$*" joins all arguments into a single word separated by the first character of IFS. Forwarding arguments always uses "$@".',
      },
      {
        id: 'lnx02_c4',
        front: 'What does `trap \'rm -rf "$tmp"\' EXIT` buy you?',
        back:
          'Cleanup runs on every exit path, including error exits caused by set -e and Ctrl-C, so a failed run does not leave gigabytes of scratch data behind.',
      },
      {
        id: 'lnx02_c5',
        front: 'Why is `set -e` not a complete safety net?',
        back:
          'It is suppressed inside conditions (if, while, &&, ||), for commands whose status is tested, and for functions called in such contexts. It also cannot see a failure hidden mid-pipeline unless pipefail is on. Check critical statuses explicitly.',
      },
      {
        id: 'lnx02_c6',
        front: '`[ ]` vs `[[ ]]` in bash',
        back:
          '[ is the POSIX test builtin: it needs quoting everywhere and does not know about && or pattern matching. [[ is a bash keyword: no word splitting inside, supports && || < >, =~ regex and glob matching. Prefer [[ in bash scripts.',
      },
      {
        id: 'lnx02_c7',
        front: 'Default value expansion syntax',
        back:
          'Colon-dash gives a default if unset or empty; colon-equals assigns the default; colon-question aborts with a message. These are how you keep -u from killing scripts with optional parameters.',
      },
      {
        id: 'lnx02_c8',
        front: 'In awk, what are NR and NF?',
        back:
          'NR is the current record (line) number across all input; NF is the number of fields in the current record. $NF is the last field, which is the idiomatic way to grab a trailing value.',
      },
      {
        id: 'lnx02_c9',
        front: 'sed: what does `s/x/y/g` change versus `s/x/y/`?',
        back:
          'Without g only the first match on each line is replaced; with g every match on the line is. Neither touches the file unless you pass -i, which edits in place.',
      },
      {
        id: 'lnx02_c10',
        front: 'When should you stop writing bash?',
        back:
          'When you need data structures beyond flat arrays, floating-point arithmetic, error handling with context, or tests. Bash is glue for invoking programs; anything with real logic belongs in Python.',
      },
      {
        id: 'lnx02_c11',
        front: 'Why does `for f in $(ls)` break?',
        back:
          'ls output is split on whitespace, so filenames with spaces become multiple words, and the output is also glob-expanded. Use a glob directly: `for f in ./*`, quoting "$f" on use.',
      },
      {
        id: 'lnx02_c12',
        front: 'What exit code convention should a script follow?',
        back:
          '0 means success and any non-zero means failure; reserve 2 for usage errors and pick distinct small codes for distinct failure modes so CI can branch on them. Never exit 0 on a failed run just to keep a pipeline green.',
      },
    ],
    quiz: [
      {
        id: 'lnx02_q1',
        q: 'Which flag makes a pipeline fail when an early command in it fails?',
        choices: ['set -e', 'set -u', 'set -o pipefail', 'set -x'],
        answer: 2,
        explain:
          'By default a pipeline returns the status of its last command, so `false | tee log` succeeds. pipefail returns the rightmost non-zero status instead. -x only traces.',
        b: -0.2,
        bloom: 'recall',
      },
      {
        id: 'lnx02_q2',
        q: 'A script contains `rm -rf $DIR/`. $DIR is unset. What happens with and without `set -u`?',
        choices: [
          'Identical behaviour; bash refuses empty paths',
          'Without -u it becomes `rm -rf /`; with -u the script aborts before running it',
          'Both abort',
          'Without -u it is a no-op',
        ],
        answer: 1,
        explain:
          'An unset variable expands to nothing, leaving `rm -rf /`. `set -u` turns the expansion into a fatal error, which is exactly why it belongs at the top of every script.',
        b: 0.6,
        bloom: 'analyze',
      },
      {
        id: 'lnx02_q3',
        q: 'Which invocation forwards all of a wrapper script arguments unchanged?',
        choices: ['./sim $*', './sim "$*"', './sim "$@"', './sim ${@}'],
        answer: 2,
        explain:
          '"$@" preserves argument boundaries, so an argument like `--name my run` stays one argument. "$*" collapses everything into one word, and the unquoted forms word-split.',
        b: 0.3,
        bloom: 'apply',
      },
      {
        id: 'lnx02_q4',
        q: 'What does `awk \'{s += $3} END {print s/NR}\' f` compute?',
        choices: [
          'The sum of column 3',
          'The mean of column 3 over all lines',
          'The mean of column 3 over lines where column 3 is numeric',
          'The last value of column 3',
        ],
        answer: 1,
        explain:
          'NR is the total record count at END, so s/NR is the mean over every input line. Non-numeric fields contribute 0 to s but still count in NR, which is a real trap on ragged logs.',
        b: 0.2,
        bloom: 'understand',
      },
      {
        id: 'lnx02_q5',
        q: 'Where should cleanup of a temporary directory be placed?',
        choices: [
          'At the end of the script',
          'In a trap on EXIT',
          'In a cron job that runs nightly',
          'Inside each loop iteration',
        ],
        answer: 1,
        explain:
          'A trailing rm is skipped whenever the script exits early through set -e, an explicit exit, or a signal. An EXIT trap runs on all of those paths.',
        b: -0.1,
        bloom: 'apply',
      },
      {
        id: 'lnx02_q6',
        q: 'shellcheck flags `cd $dir && make`. What is the underlying risk?',
        choices: [
          'cd is slower than pushd',
          'If $dir contains a space or is empty, the cd can target the wrong directory and make runs in the wrong place',
          '&& is deprecated in bash',
          'make cannot be used after cd',
        ],
        answer: 1,
        explain:
          'Unquoted expansion word-splits. Quote it, and prefer `cd -- "$dir"` so a leading dash is not read as an option.',
        b: 0.5,
        bloom: 'analyze',
      },
      {
        id: 'lnx02_q7',
        q: 'Which is the best reason to rewrite a 400-line bash script in Python?',
        choices: [
          'Python is faster at launching subprocesses',
          'Bash cannot call external binaries',
          'It has grown real data structures, float math and error handling, none of which bash expresses safely',
          'Bash is not installed on flight computers',
        ],
        answer: 2,
        explain:
          'Bash is excellent glue and terrible logic. Once you are parsing structured data or doing numerics, the failure modes stop being visible.',
        b: -0.4,
        bloom: 'understand',
      },
    ],
    tags: ['spacex-core', 'tooling', 'linux'],
    importance: 1.3,
  },

  /* ══ GIT ═════════════════════════════════════════════════════════════════ */
  {
    id: 'cod_git_01_basics',
    track: 'coding',
    tier: 1,
    title: 'Git: the Object Model and Daily Use',
    summary:
      "Git stops being magic the moment you understand that it stores snapshots in a DAG of commits and that branches are just movable pointers. Learn the model first, the commands second.",
    prereqs: ['cod_lnx_01_shell'],
    hours: 12,
    topics: [
      'Blobs, trees, commits, refs, HEAD and the commit DAG',
      'The three areas: working tree, index/staging, repository',
      'init, clone, add, status, diff, diff --staged, commit',
      'log --oneline --graph --all, show, blame',
      'Branches as pointers; checkout/switch; detached HEAD',
      'Fast-forward vs true merge; resolving a conflict',
      'reset --soft/--mixed/--hard vs revert vs restore',
      'stash and reflog as the undo net',
      '.gitignore, .gitattributes, Git LFS for large binary artefacts',
      'Commit message craft: imperative subject, why-not-what body',
      'Tags and semantic versioning',
      'bisect for regression hunting',
    ],
    objectives: [
      'Draw the commit DAG of a small repository from memory after reading its log.',
      'Recover a commit that appears lost after a hard reset using the reflog.',
      'Use git bisect to find the commit that introduced a numerical regression.',
      'Explain exactly what moves when you run each of reset --soft, --mixed and --hard.',
      'Write a commit history a reviewer can read.',
    ],
    resources: [
      {
        title: 'Pro Git, 2nd ed.',
        author: 'Scott Chacon and Ben Straub',
        kind: 'book',
        url: 'https://git-scm.com/book/en/v2',
        free: true,
        note: 'Chapters 2, 3 and 10 (Git Internals) are the core. Chapter 10 is what makes the rest obvious.',
      },
      {
        title: 'Learn Git Branching',
        kind: 'course',
        url: 'https://learngitbranching.js.org/',
        free: true,
        note: 'Interactive DAG visualiser. The fastest way to internalise branching and rebasing.',
      },
      {
        title: 'The Missing Semester: Version Control (Git)',
        author: 'MIT',
        kind: 'course',
        url: 'https://missing.csail.mit.edu/2020/version-control/',
        free: true,
      },
    ],
    exercises: [
      {
        id: 'git01_ex1',
        title: 'Bisect a seeded regression',
        prompt:
          'Clone a repository with 60 commits in which one commit changed a gravity constant from 9.80665 to 9.81. Write a test script that exits non-zero when the constant is wrong, then use `git bisect run` to identify the offending commit. Report the commit hash and the number of steps bisect needed.',
        kind: 'analysis',
        hours: 1.5,
      },
      {
        id: 'git01_ex2',
        title: 'Recover from a hard reset',
        prompt:
          'Commit work on a branch, run `git reset --hard HEAD~3`, then recover all three commits using only the reflog and `git cherry-pick` or `git branch`. Write down what `reset --hard` actually destroyed and what it did not.',
        kind: 'build',
        hours: 1,
      },
    ],
    cards: [
      {
        id: 'git01_c1',
        front: 'What are the four Git object types?',
        back:
          'Blob (file contents), tree (a directory listing of blobs and trees), commit (a tree plus parents, author, message) and annotated tag. Everything is content-addressed by the hash of its contents.',
      },
      {
        id: 'git01_c2',
        front: 'What is a branch, physically?',
        back:
          'A 41-byte file under .git/refs/heads containing a commit hash. Creating a branch is free; moving it is a one-line write. HEAD is a ref that usually points at a branch ref.',
      },
      {
        id: 'git01_c3',
        front: 'reset --soft vs --mixed vs --hard',
        back:
          '--soft moves the branch pointer only, leaving index and working tree; --mixed (default) also resets the index, leaving your edits unstaged; --hard additionally overwrites the working tree, which is the only one that can lose uncommitted work.',
      },
      {
        id: 'git01_c4',
        front: 'reset vs revert',
        back:
          'reset moves a branch pointer, rewriting what the branch claims its history is. revert creates a new commit that undoes an old one, leaving history intact. Shared branches take revert.',
      },
      {
        id: 'git01_c5',
        front: 'What does the reflog record?',
        back:
          'Every local movement of HEAD and of branch tips, with timestamps, for about 90 days by default. It is how you recover commits that are no longer reachable from any branch, including after a hard reset or a botched rebase.',
      },
      {
        id: 'git01_c6',
        front: 'How does `git bisect` work?',
        back:
          'You mark one good and one bad commit; Git binary-searches the range, checking out midpoints for you to test. With `bisect run <script>` it automates the whole search and finds the culprit among N commits in about log2(N) builds.',
      },
      {
        id: 'git01_c7',
        front: 'Fast-forward merge vs merge commit',
        back:
          'If the target branch tip is an ancestor of the source, Git can just slide the pointer forward with no new commit. Otherwise it creates a merge commit with two parents. --no-ff forces the merge commit so the branch topology survives in history.',
      },
      {
        id: 'git01_c8',
        front: 'What does `.gitattributes` control that `.gitignore` does not?',
        back:
          'Per-path behaviour for tracked files: text vs binary, end-of-line normalisation, diff and merge drivers, and which paths go through Git LFS. It is how teams stop Git from trying to text-merge a Simulink .slx or a CAD part file.',
      },
      {
        id: 'git01_c9',
        front: 'Why is Git LFS relevant in aerospace repositories?',
        back:
          'Simulink models, CAD parts, golden telemetry files and reference datasets are large binaries that Git stores as whole new objects on every change, bloating clones. LFS keeps a pointer in the repository and the payload on a separate server.',
      },
      {
        id: 'git01_c10',
        front: 'What makes a good commit message?',
        back:
          'An imperative subject under about 50 characters describing the change, a blank line, then a body explaining why the change was needed and what alternative was rejected. The diff already says what changed; only you can record why.',
      },
      {
        id: 'git01_c11',
        front: 'What does `git blame -L 120,140 file` give you?',
        back:
          'For each of those lines, the commit, author and date that last touched it. It is the entry point to the archaeology question that matters: what was this change trying to fix.',
      },
      {
        id: 'git01_c12',
        front: 'Does Git store diffs?',
        back:
          'No. Each commit references a complete tree snapshot; identical file contents are shared by hash. Diffs are computed on demand, and packfiles later apply delta compression as a storage optimisation only.',
      },
    ],
    quiz: [
      {
        id: 'git01_q1',
        q: 'You run `git reset --hard HEAD~2` with no uncommitted work. Are those two commits gone forever?',
        choices: [
          'Yes, hard reset deletes objects immediately',
          'No: they are unreachable but still in the object store, and the reflog names them',
          'Only if you pushed them first',
          'Only if the repository has no remote',
        ],
        answer: 1,
        explain:
          'Objects survive until garbage collection prunes unreachable ones, typically after 30 days for loose objects. `git reflog` gives you the hash to check out or branch from.',
        b: 0.1,
        bloom: 'understand',
      },
      {
        id: 'git01_q2',
        q: 'Which command undoes a bad commit that is already on a shared branch?',
        choices: [
          'git reset --hard HEAD~1 then force push',
          'git revert <hash>',
          'git checkout HEAD~1',
          'git stash',
        ],
        answer: 1,
        explain:
          'revert adds a new commit that applies the inverse change, so everyone else history stays valid. Resetting and force-pushing shared history breaks every other clone.',
        b: -0.4,
        bloom: 'apply',
      },
      {
        id: 'git01_q3',
        q: 'A regression appeared somewhere in the last 256 commits. Roughly how many test runs does `git bisect` need?',
        choices: ['256', '128', '8', '16'],
        answer: 2,
        explain:
          'Binary search costs about log2(256) = 8 evaluations. That is why bisect is the standard tool for a regression whose cause is not obvious from the diff.',
        b: 0.2,
        bloom: 'apply',
      },
      {
        id: 'git01_q4',
        q: 'What is stored in .git/refs/heads/main?',
        choices: [
          'A compressed copy of the branch files',
          'A list of every commit on the branch',
          'The 40-character hash of the branch tip commit',
          'The diff between main and its upstream',
        ],
        answer: 2,
        explain:
          'A branch is only a pointer to a commit; the commit chain gives the rest of the history through its parent links.',
        b: 0.3,
        bloom: 'recall',
      },
      {
        id: 'git01_q5',
        q: 'Why do aerospace teams add Simulink .slx files to .gitattributes with a binary/lockable setting?',
        choices: [
          'To make them diff as text',
          'Because Git cannot store binary files at all',
          'Because they cannot be three-way merged, so concurrent edits must be prevented rather than resolved',
          'To compress them better',
        ],
        answer: 2,
        explain:
          'A model file has no meaningful line-based merge. Teams enforce single-owner editing plus Simulink Model Comparison instead of asking Git to merge them.',
        b: 0.9,
        bloom: 'understand',
      },
      {
        id: 'git01_q6',
        q: 'What does `git diff` with no arguments show?',
        choices: [
          'Working tree vs last commit',
          'Working tree vs index (unstaged changes)',
          'Index vs last commit',
          'Local branch vs remote branch',
        ],
        answer: 1,
        explain:
          'Plain `git diff` is unstaged changes. `git diff --staged` is index vs HEAD, and `git diff HEAD` is working tree vs HEAD.',
        b: 0.0,
        bloom: 'recall',
      },
      {
        id: 'git01_q7',
        q: 'Two commits have identical file contents in different repositories. What is true of their blob hashes?',
        choices: [
          'They differ, because commit metadata is hashed in',
          'They are identical, because blobs are content-addressed',
          'They differ unless the files have the same name',
          'Git does not hash file contents',
        ],
        answer: 1,
        explain:
          'A blob hash covers only the contents (plus a type/length header). Names live in trees, which is why renames are inferred rather than recorded.',
        b: 0.8,
        bloom: 'analyze',
      },
    ],
    tags: ['tooling', 'git'],
    importance: 1.2,
  },

  {
    id: 'cod_git_02_collab',
    track: 'coding',
    tier: 2,
    title: 'Branching, Rebase and Collaborative Workflow',
    summary:
      "How real teams actually use Git: short-lived branches, small reviewable pull requests, a history somebody can bisect two years from now, and the rules that keep a shared branch from exploding.",
    prereqs: ['cod_git_01_basics'],
    hours: 12,
    topics: [
      'Merge vs rebase and the golden rule about shared history',
      'Interactive rebase: squash, fixup, reword, drop, reorder',
      'cherry-pick and backporting a fix to a release branch',
      'Conflict resolution strategy; rerere',
      'Remotes: fetch vs pull, pull --rebase, upstream tracking',
      'push --force-with-lease vs --force',
      'Trunk-based development vs GitFlow vs forking workflows',
      'Pull requests: small diffs, draft PRs, required checks, CODEOWNERS',
      'Release branches, tags, semantic versioning, changelogs',
      'Submodules vs subtrees vs vendoring',
      'Reviewing a diff: correctness, tests, interfaces, units and frames',
      'Binary-file pain: model locking for Simulink and CAD assets',
    ],
    objectives: [
      'Rewrite a messy eight-commit branch into two clean, reviewable commits.',
      'Decide correctly between merge and rebase for a given branch situation and defend it.',
      'Resolve a three-way conflict by reasoning about both sides rather than picking one.',
      'Explain why --force-with-lease is safe where --force is not.',
      'Review a 300-line numerical pull request and leave comments that would catch a unit or frame error.',
    ],
    resources: [
      {
        title: 'Pro Git, 2nd ed., Chapters 3 and 5',
        author: 'Scott Chacon and Ben Straub',
        kind: 'book',
        url: 'https://git-scm.com/book/en/v2',
        free: true,
      },
      {
        title: 'Google Engineering Practices: Code Review Developer Guide',
        author: 'Google',
        kind: 'docs',
        url: 'https://google.github.io/eng-practices/review/',
        free: true,
        note: 'The standard of code review: approve when the change definitively improves overall code health, even if imperfect.',
      },
      {
        title: 'Oh Shit, Git!?!',
        author: 'Katie Sylor-Miller',
        kind: 'site',
        url: 'https://ohshitgit.com/',
        free: true,
      },
    ],
    exercises: [
      {
        id: 'git02_ex1',
        title: 'Clean up a branch for review',
        prompt:
          'Take a branch with eight commits including two typo fixes, a debug-print commit and a reverted experiment. Interactive-rebase it into two commits with well-written messages, then push with --force-with-lease. Success: the diff against the base branch is unchanged and `git log --oneline` shows exactly two commits.',
        kind: 'build',
        hours: 1.5,
      },
      {
        id: 'git02_ex2',
        title: 'Review a numerical pull request',
        prompt:
          'Given a 300-line PR adding a quaternion-to-DCM conversion and its tests, write ten review comments. At least four must concern correctness of units, frame conventions, quaternion ordering, or division-by-zero/NaN behaviour, and each must be marked blocking or non-blocking.',
        kind: 'analysis',
        hours: 2,
      },
    ],
    cards: [
      {
        id: 'git02_c1',
        front: 'Merge vs rebase, one line each',
        back:
          'Merge preserves the true topology and never rewrites existing commits. Rebase replays your commits onto a new base, producing a linear history at the cost of new commit hashes. Rebase your own unpushed work; merge anything others have.',
      },
      {
        id: 'git02_c2',
        front: 'What is the golden rule of rebasing?',
        back:
          'Never rebase commits that exist outside your repository. Rewriting published history forces everyone else into a painful reconciliation and can silently duplicate or drop commits.',
      },
      {
        id: 'git02_c3',
        front: 'Why is --force-with-lease safer than --force?',
        back:
          'It refuses the push if the remote ref has moved since your last fetch, so you cannot silently overwrite a colleague commit that landed while you were rebasing. Plain --force overwrites unconditionally.',
      },
      {
        id: 'git02_c4',
        front: 'fetch vs pull',
        back:
          'fetch downloads remote objects and updates remote-tracking refs, changing nothing in your working tree. pull is fetch followed by merge (or rebase with --rebase). Fetch first when you want to look before you integrate.',
      },
      {
        id: 'git02_c5',
        front: 'What does `git rebase -i` squash vs fixup do?',
        back:
          'Both combine a commit into the previous one; squash opens an editor to combine the messages, fixup discards the later message entirely. fixup is what you want for the typo-fix commits.',
      },
      {
        id: 'git02_c6',
        front: 'What is rerere?',
        back:
          'Reuse recorded resolution. Git remembers how you resolved a specific conflict hunk and replays it automatically the next time the identical conflict appears, which matters on long-lived branches rebased repeatedly.',
      },
      {
        id: 'git02_c7',
        front: 'Trunk-based development in one sentence',
        back:
          'Everyone integrates into one main branch through short-lived branches merged within a day or two, behind feature flags if needed, so integration pain stays small and CI always reflects reality.',
      },
      {
        id: 'git02_c8',
        front: 'When do you approve a pull request you would have written differently?',
        back:
          'When it definitively improves overall code health even if it is not the way you would have done it. Style preference is a non-blocking nit; correctness, tests and interface design are blocking.',
      },
      {
        id: 'git02_c9',
        front: 'Why keep pull requests small?',
        back:
          'Review quality collapses with diff size; a reviewer who cannot hold the change in their head approves it anyway. Small diffs also bisect better and revert cleanly.',
      },
      {
        id: 'git02_c10',
        front: 'cherry-pick: what is it for and what is its risk?',
        back:
          'Applying one commit onto another branch, typically backporting a fix to a release line. The risk is divergent duplicates: the same logical change now exists as two different commits, so later merges can conflict or double-apply.',
      },
      {
        id: 'git02_c11',
        front: 'Reviewer checklist for a numerical change',
        back:
          'Units, reference frame and sign convention; division by zero and NaN propagation; integer overflow; array bounds; allocation in a hot path; magic numbers; and whether a test would have caught the bug you are imagining.',
      },
      {
        id: 'git02_c12',
        front: 'Submodule vs vendoring',
        back:
          'A submodule pins an external repository by commit and keeps its history separate, at the cost of a second clone step everyone forgets. Vendoring copies the source in, making builds hermetic but updates manual. Pick by how often the dependency changes.',
      },
    ],
    quiz: [
      {
        id: 'git02_q1',
        q: 'Your feature branch is three commits ahead and main has moved on. You have not pushed. What is the cleanest integration?',
        choices: [
          'git merge main into the feature branch',
          'git rebase main, then open the PR',
          'git reset --hard main',
          'git cherry-pick main',
        ],
        answer: 1,
        explain:
          'The commits are private, so rebasing is allowed and yields a linear, easily reviewed history. Merging main in would add a noisy merge commit to a branch nobody else has seen.',
        b: 0.0,
        bloom: 'apply',
      },
      {
        id: 'git02_q2',
        q: 'A colleague pushed to the shared branch while you were rebasing. You run `git push --force`. What happens?',
        choices: [
          'Git refuses because the remote moved',
          'Their commit is removed from the branch history',
          'Both histories are merged automatically',
          'Nothing; force only affects tags',
        ],
        answer: 1,
        explain:
          'Force sets the remote ref to your tip unconditionally, orphaning their commit. --force-with-lease would have rejected the push instead.',
        b: 0.4,
        bloom: 'analyze',
      },
      {
        id: 'git02_q3',
        q: 'Which change belongs in a pull request comment marked as blocking?',
        choices: [
          'Variable named dcm should be named C_bi',
          'This function assumes degrees but its caller passes radians',
          'Prefer a range-based for loop here',
          'The file could use a blank line before the return',
        ],
        answer: 1,
        explain:
          'A unit mismatch is a defect that will fly. The other three are style preferences, appropriate as nits that do not block approval.',
        b: -0.6,
        bloom: 'understand',
      },
      {
        id: 'git02_q4',
        q: 'What does an interactive rebase change about the commits it touches?',
        choices: [
          'Nothing; it only reorders the log display',
          'Their hashes, because parent and content change',
          'Only their messages',
          'Their authorship timestamps only',
        ],
        answer: 1,
        explain:
          'Every rewritten commit is a new object with a new hash, which is precisely why rebasing published commits breaks other clones.',
        b: 0.5,
        bloom: 'understand',
      },
      {
        id: 'git02_q5',
        q: 'Why do teams require status checks to pass before merge rather than after?',
        choices: [
          'It is faster for CI',
          'It keeps the main branch always releasable and keeps bisect meaningful',
          'GitHub requires it',
          'It reduces repository size',
        ],
        answer: 1,
        explain:
          'If broken commits land on main, every later bisect hits build failures and every developer branching off inherits the breakage.',
        b: -0.3,
        bloom: 'understand',
      },
      {
        id: 'git02_q6',
        q: 'A hotfix must go to both main and the release/1.4 branch. What is the standard mechanism?',
        choices: [
          'Rebase release/1.4 onto main',
          'Cherry-pick the fix commit onto release/1.4',
          'Force-push main to release/1.4',
          'Create a submodule',
        ],
        answer: 1,
        explain:
          'Cherry-pick applies just that change to the release line without dragging unrelated main commits with it.',
        b: 0.2,
        bloom: 'apply',
      },
      {
        id: 'git02_q7',
        q: 'Why can two engineers not usefully merge concurrent edits to the same .slx model?',
        choices: [
          'Simulink files are encrypted',
          'Git refuses to track files over 1 MB',
          'The format is not line-oriented, so a three-way text merge produces a corrupt or meaningless model',
          'Simulink licences forbid version control',
        ],
        answer: 2,
        explain:
          'Hence the industry practice of file locking plus Simulink Model Comparison, rather than trying to resolve model conflicts in a text editor.',
        b: 0.6,
        bloom: 'understand',
      },
    ],
    tags: ['tooling', 'git'],
    importance: 1.2,
  },

  /* ══ CONTAINERS & CI ═════════════════════════════════════════════════════ */
  {
    id: 'cod_ops_01_docker',
    track: 'coding',
    tier: 3,
    title: 'Docker and Reproducible Environments',
    summary:
      "A simulation result that cannot be reproduced five years later is not evidence. Containers pin the toolchain, the libraries and the OS so an anomaly investigation in 2031 can rerun a 2026 case byte for byte.",
    prereqs: ['cod_lnx_02_scripting', 'cod_git_02_collab'],
    hours: 15,
    topics: [
      'Images vs containers; layers and the union filesystem',
      'Dockerfile: FROM RUN COPY WORKDIR ENV ARG ENTRYPOINT CMD USER HEALTHCHECK',
      'Layer caching and instruction ordering for fast rebuilds',
      'Multi-stage builds: compile fat, ship slim',
      '.dockerignore and build context size',
      'Base-image choice: debian-slim vs alpine and the musl trap for scientific Python',
      'Volumes and bind mounts, networks, port publishing',
      'docker compose for sim + database + dashboard stacks',
      'Registries, tagging discipline, never :latest in a pipeline',
      'Digest pinning and lockfiles for true reproducibility',
      'Dev Containers for onboarding',
      'Kubernetes literacy: pods, deployments, services',
      'Alternatives: Podman, Nix, Spack, conda-lock, uv',
    ],
    objectives: [
      'Containerise a C++ and Python project with a multi-stage build that ships no compiler.',
      'Order a Dockerfile so that a source-only change does not reinstall dependencies.',
      'Bring up a multi-service stack with docker compose and explain each service network binding.',
      'Produce a byte-identical simulation output from a digest-pinned image on two machines.',
      'Explain to an auditor how a container satisfies a configuration-management requirement.',
    ],
    resources: [
      {
        title: 'Docker Docs: Get Started',
        author: 'Docker Inc.',
        kind: 'docs',
        url: 'https://docs.docker.com/get-started/',
        free: true,
      },
      {
        title: 'Docker Deep Dive',
        author: 'Nigel Poulton',
        kind: 'book',
        free: false,
        note: 'Readable, current, and the right depth for an engineer who is not a platform specialist.',
      },
      {
        title: 'Play with Docker',
        kind: 'tool',
        url: 'https://labs.play-with-docker.com/',
        free: true,
        note: 'Throwaway Docker hosts in the browser; useful before you have a local install.',
      },
    ],
    exercises: [
      {
        id: 'ops01_ex1',
        title: 'Multi-stage build for a C++ simulator',
        prompt:
          'Write a Dockerfile that builds a CMake project in a gcc image and copies only the resulting binary and its runtime dependencies into a debian-slim final stage. Success criteria: final image under 120 MB, `docker run image --version` works, and no compiler is present in the final image.',
        kind: 'build',
        hours: 2,
      },
      {
        id: 'ops01_ex2',
        title: 'Prove reproducibility',
        prompt:
          'Pin a Python image by digest, install dependencies from a lockfile, run a seeded Monte Carlo of 100 cases, and hash the output CSV. Run the same image on a second machine and show identical hashes. Then change only the base tag to a newer patch release and report whether the hash still matches, and why.',
        kind: 'analysis',
        hours: 2,
      },
    ],
    cards: [
      {
        id: 'ops01_c1',
        front: 'Image vs container',
        back:
          'An image is an immutable stack of read-only filesystem layers plus metadata. A container is a running (or stopped) instance of that image with a thin writable layer on top. Deleting a container never changes the image.',
      },
      {
        id: 'ops01_c2',
        front: 'Why does COPY order matter so much in a Dockerfile?',
        back:
          'Each instruction is a cached layer keyed on its inputs. If you COPY the whole source before installing dependencies, every source edit invalidates the dependency layer and reinstalls everything. Copy the manifest, install, then copy the source.',
      },
      {
        id: 'ops01_c3',
        front: 'ENTRYPOINT vs CMD',
        back:
          'ENTRYPOINT is the executable the container always runs; CMD supplies default arguments that a `docker run` argument list replaces. Use ENTRYPOINT for the tool and CMD for its default flags.',
      },
      {
        id: 'ops01_c4',
        front: 'What does a multi-stage build accomplish?',
        back:
          'Compilation happens in a stage with the full toolchain, then only the artefacts are COPYed into a minimal runtime stage. The shipped image contains no compiler, headers or build caches, shrinking size and attack surface.',
      },
      {
        id: 'ops01_c5',
        front: 'Why is alpine a trap for scientific Python?',
        back:
          'Alpine uses musl libc, so manylinux wheels for NumPy/SciPy do not apply and pip falls back to building from source, which is slow, fragile, and can link a different BLAS. Use debian-slim unless you have measured a reason not to.',
      },
      {
        id: 'ops01_c6',
        front: 'Why is :latest banned in pipelines?',
        back:
          'It is a mutable pointer, so the same pipeline definition builds different software on different days. Pin an immutable tag, and pin by sha256 digest when the result has to be reproducible years later.',
      },
      {
        id: 'ops01_c7',
        front: 'Bind mount vs named volume',
        back:
          'A bind mount maps a host path into the container, so the host owns the data and the layout; a named volume is managed by Docker with its own lifecycle. Bind mounts for source during development, volumes for databases.',
      },
      {
        id: 'ops01_c8',
        front: 'What does .dockerignore change?',
        back:
          'It excludes paths from the build context sent to the daemon. Without it a repository containing results, .git and virtualenvs can ship hundreds of megabytes on every build, and any COPY . pulls junk into the image.',
      },
      {
        id: 'ops01_c9',
        front: 'How does a container make a 2026 simulation reproducible in 2031?',
        back:
          'It pins the OS, compiler, libraries, interpreter and package versions as one addressable artefact. Combined with a seeded RNG and pinned input data, rerunning the digest reproduces the numbers, which is what a configuration-management or anomaly-investigation requirement demands.',
      },
      {
        id: 'ops01_c10',
        front: 'Is a container a virtual machine?',
        back:
          'No. Containers share the host kernel and isolate processes with namespaces and cgroups. That is why they start in milliseconds, and why a container cannot change the host kernel version your real-time patch depends on.',
      },
      {
        id: 'ops01_c11',
        front: 'What runs as root inside a container by default, and why care?',
        back:
          'The process runs as uid 0 unless USER says otherwise. Files it writes to a bind mount are root-owned on the host, and a container escape starts from root. Add a non-root USER for anything that touches shared storage.',
      },
      {
        id: 'ops01_c12',
        front: 'Where does Kubernetes enter an aerospace data story?',
        back:
          'Starlink telemetry infrastructure is reported to run on Docker and Kubernetes alongside Kafka, HBase and HDFS, so pods, deployments and services are literacy an engineer touching that pipeline needs, not a specialisation.',
      },
    ],
    quiz: [
      {
        id: 'ops01_q1',
        q: 'Your image rebuild takes eight minutes on every one-line source change. What is the most likely cause?',
        choices: [
          'The base image is too small',
          'COPY . comes before the dependency install, invalidating its cache layer',
          'You are not using docker compose',
          'The Dockerfile has too few layers',
        ],
        answer: 1,
        explain:
          'Cache invalidation cascades: once a layer changes, every later layer rebuilds. Copy only the manifest, install, then copy source.',
        b: 0.1,
        bloom: 'analyze',
      },
      {
        id: 'ops01_q2',
        q: 'Which pair keeps the final image smallest?',
        choices: [
          'Single stage with apt-get purge at the end',
          'Multi-stage build copying only the binary into debian-slim',
          'Squashing all layers with --squash',
          'Using alpine with pip install from source',
        ],
        answer: 1,
        explain:
          'Deleting files in a later layer does not remove them from earlier layers, so purging inside one stage saves nothing. Only a separate final stage leaves the toolchain behind.',
        b: 0.3,
        bloom: 'apply',
      },
      {
        id: 'ops01_q3',
        q: 'What does ARG differ from ENV in?',
        choices: [
          'ARG is available only during the build; ENV persists into the running container',
          'ARG is encrypted',
          'ENV is build-only and ARG is runtime',
          'They are aliases',
        ],
        answer: 0,
        explain:
          'ARG values vanish after build (though they remain visible in image history, so they are not a secrets mechanism). ENV becomes part of the container environment.',
        b: 0.4,
        bloom: 'recall',
      },
      {
        id: 'ops01_q4',
        q: 'You need the exact same numerical output from a sim run in two years. Which is necessary but NOT sufficient?',
        choices: [
          'Pinning the image by sha256 digest',
          'Seeding every random number generator explicitly',
          'Recording the input data version',
          'Any one of these alone',
        ],
        answer: 3,
        explain:
          'Reproducibility needs all three: pinned environment, seeded stochastics and versioned inputs. Compiler flags such as -ffast-math and thread-count-dependent reductions can still break bit-exactness on top of that.',
        b: 1.0,
        bloom: 'analyze',
      },
      {
        id: 'ops01_q5',
        q: 'A container writes results to a bind-mounted host directory and the files are owned by root. What is the fix?',
        choices: [
          'Run docker with sudo',
          'Declare a USER with the host uid, or chown in an entrypoint',
          'Use CMD instead of ENTRYPOINT',
          'Mount the directory read-only',
        ],
        answer: 1,
        explain:
          'The uid inside the container is what lands on the host filesystem. Matching uids (or fixing ownership on exit) is the standard remedy.',
        b: 0.7,
        bloom: 'apply',
      },
      {
        id: 'ops01_q6',
        q: 'Which statement about containers and the kernel is true?',
        choices: [
          'Each container boots its own kernel',
          'Containers share the host kernel; only user space is isolated',
          'Containers require a hypervisor',
          'A container can load its own real-time kernel patch',
        ],
        answer: 1,
        explain:
          'Namespaces and cgroups isolate processes within one kernel. That is the source of both their speed and their limits.',
        b: 0.2,
        bloom: 'understand',
      },
      {
        id: 'ops01_q7',
        q: 'Why is docker compose a good fit for the telemetry-dashboard exercise?',
        choices: [
          'It compiles C++ faster',
          'It declares several dependent services, their networks and volumes in one versioned file',
          'It is required to publish images',
          'It replaces the need for a database',
        ],
        answer: 1,
        explain:
          'A sim, a PostgreSQL instance and a Grafana front end are three services with a shared network; compose makes that stack one reproducible declaration.',
        b: -0.2,
        bloom: 'understand',
      },
    ],
    tags: ['tooling', 'devops'],
    importance: 1.15,
  },

  {
    id: 'cod_ops_02_ci',
    track: 'coding',
    tier: 5,
    title: 'Continuous Integration for Simulation Code',
    summary:
      "The Starlink GNC-Simulations posting asks for improving reliability and performance of simulation software via continuous integration and profiling. This is that pipeline: lint, sanitizers, unit tests, tolerance-based regression sims, and a nightly Monte Carlo.",
    prereqs: ['cod_git_02_collab', 'cod_py_06_testing', 'cod_ops_01_docker'],
    hours: 20,
    topics: [
      'What CI buys a simulation team, stated as failure modes it prevents',
      'GitHub Actions: workflows, events, jobs, steps, runners',
      'Matrix builds across OS, compiler and interpreter version',
      'Caching pip, cargo and ccache; artefacts; secrets; environments',
      'Reusable workflows and composite actions',
      'Self-hosted runners for licensed tools and special hardware',
      'GitLab CI and Jenkins, still common in defence and aerospace',
      'A GNC pipeline: lint, static analysis, unit tests, coverage gate, Debug+ASan and Release builds, regression sims with tolerances, benchmark thresholds, docs, artefacts',
      'Golden-file regression comparison with numerical tolerance',
      'Nightly and scheduled long-running Monte Carlo jobs',
      'MATLAB and Simulink in CI: setup-matlab, headless Simulink Test, licence servers',
      'Flaky-test policy; quarantine rather than retry-until-green',
      'Branch protection, required checks, release automation',
    ],
    objectives: [
      'Write a workflow that builds a matrix of compilers and runs unit tests, sanitizers and coverage with a hard gate.',
      'Compare a simulation output to a golden file with an explicit tolerance rather than exact equality.',
      'Diagnose a flaky test correctly instead of adding a retry.',
      'Schedule a nightly dispersion run that publishes a report artefact.',
      'Explain why both a Debug-plus-sanitizer job and an optimised Release job are needed.',
    ],
    resources: [
      {
        title: 'GitHub Actions Documentation',
        author: 'GitHub',
        kind: 'docs',
        url: 'https://docs.github.com/actions',
        free: true,
      },
      {
        title: 'The Missing Semester: Metaprogramming (build systems, testing, CI)',
        author: 'MIT',
        kind: 'course',
        url: 'https://missing.csail.mit.edu/2020/metaprogramming/',
        free: true,
      },
      {
        title: 'matlab-actions',
        author: 'MathWorks',
        kind: 'tool',
        url: 'https://github.com/matlab-actions',
        free: true,
        note: 'setup-matlab and run-tests actions; needs a licence the runner can reach.',
      },
    ],
    exercises: [
      {
        id: 'ops02_ex1',
        title: 'Pipeline for the Python simulator',
        prompt:
          'Write a GitHub Actions workflow that on every pull request runs ruff, mypy, pytest with coverage failing under 85 percent, and a regression job that propagates a reference orbit and compares against a committed golden CSV with a relative tolerance of 1e-9. On a nightly schedule it also runs a 500-case dispersion and uploads the report as an artefact.',
        kind: 'build',
        hours: 3,
      },
      {
        id: 'ops02_ex2',
        title: 'Tolerance-based golden comparison',
        prompt:
          'Implement `compare_golden(actual_csv, golden_csv, rtol, atol)` that returns a list of (column, row, actual, expected, err) for every element outside tolerance, and exits non-zero if the list is non-empty. It must handle NaN equality correctly (NaN in both is a match) and report the worst offender first.',
        kind: 'code',
        lang: 'python',
        starter:
          'import math\n\n\ndef compare_golden(actual, expected, rtol=1e-9, atol=1e-12):\n    """actual and expected are dicts of column name -> list of floats.\n\n    Return a list of tuples (column, row_index, actual, expected, abs_err)\n    for every element outside tolerance, worst absolute error first.\n    NaN in both actual and expected counts as a match.\n    """\n    raise NotImplementedError\n',
        solution:
          'import math\n\n\ndef compare_golden(actual, expected, rtol=1e-9, atol=1e-12):\n    bad = []\n    for col, exp_vals in expected.items():\n        act_vals = actual.get(col)\n        if act_vals is None:\n            raise KeyError(f"missing column {col}")\n        if len(act_vals) != len(exp_vals):\n            raise ValueError(f"length mismatch in {col}")\n        for i, (a, e) in enumerate(zip(act_vals, exp_vals)):\n            if math.isnan(a) and math.isnan(e):\n                continue\n            err = abs(a - e)\n            if not (err <= atol + rtol * abs(e)):\n                bad.append((col, i, a, e, err))\n    bad.sort(key=lambda t: t[4], reverse=True)\n    return bad\n',
        tests: [
          {
            name: 'identical data passes',
            assert:
              'g = {"x": [1.0, 2.0, 3.0]}\nassert compare_golden(dict(g), g) == [], "identical inputs must compare clean"\n',
          },
          {
            name: 'NaN matches NaN',
            assert:
              'nan = float("nan")\nassert compare_golden({"x": [nan, 1.0]}, {"x": [nan, 1.0]}) == [], "NaN in both should be a match"\n',
          },
          {
            name: 'relative tolerance respected',
            assert:
              'assert compare_golden({"x": [1.0 + 1e-10]}, {"x": [1.0]}, rtol=1e-9) == []\nbad = compare_golden({"x": [1.0 + 1e-7]}, {"x": [1.0]}, rtol=1e-9)\nassert len(bad) == 1 and bad[0][0] == "x", "1e-7 relative error must be reported"\n',
          },
          {
            name: 'worst offender sorts first',
            assert:
              'bad = compare_golden({"x": [1.0, 5.0], "y": [0.0]}, {"x": [1.0, 1.0], "y": [3.0]})\nassert bad[0][4] >= bad[1][4], "results must be sorted by absolute error, worst first"\n',
            hidden: true,
          },
        ],
        hours: 2,
      },
    ],
    cards: [
      {
        id: 'ops02_c1',
        front: 'Why run both a Debug-plus-ASan job and an optimised Release job?',
        back:
          'Sanitizers need instrumented, unoptimised builds to report precise faults, but optimisation itself changes behaviour: it exposes undefined behaviour, different floating-point contraction and different timing. Each job catches bugs the other hides.',
      },
      {
        id: 'ops02_c2',
        front: 'Why can a simulation regression test not use exact equality?',
        back:
          'Floating-point results differ across compilers, libm versions, vectorisation and thread counts. Compare with an explicit relative and absolute tolerance chosen from the physics, and record the tolerance as part of the test contract.',
      },
      {
        id: 'ops02_c3',
        front: 'A test fails one run in twenty. What do you do?',
        back:
          'Treat flakiness as a defect: quarantine the test out of the gate, file it, and find the real cause, usually an unseeded RNG, a wall-clock dependency, a shared temp file, or genuine numerical marginality. Do not add automatic retries, which hide real intermittent bugs.',
      },
      {
        id: 'ops02_c4',
        front: 'What is a matrix build for?',
        back:
          'Running the same job across combinations of OS, compiler, standard version or dependency version, so a portability break surfaces at the pull request rather than at deployment.',
      },
      {
        id: 'ops02_c5',
        front: 'When do you need a self-hosted CI runner?',
        back:
          'When the job needs something the hosted runner cannot have: a MATLAB or Simulink licence reachable on a private network, specialised hardware for hardware-in-the-loop, GPUs, or data under export control.',
      },
      {
        id: 'ops02_c6',
        front: 'What belongs in the fast pull-request pipeline versus the nightly pipeline?',
        back:
          'Pull request: lint, unit tests, coverage gate, sanitizer build, a small regression set. Nightly: full Monte Carlo, long-horizon propagations, performance benchmarking and cross-platform matrices. Keep the PR loop under about ten minutes or people stop reading it.',
      },
      {
        id: 'ops02_c7',
        front: 'What is a coverage gate, and its failure mode?',
        back:
          'A threshold below which CI fails. It catches untested new code, but coverage measures execution, not assertion quality: a suite can execute every line and check nothing. Use it as a floor, never as a definition of done.',
      },
      {
        id: 'ops02_c8',
        front: 'Why cache dependencies in CI?',
        back:
          'Package installs and C++ compiles dominate job time. Caching pip wheels, cargo registries and ccache objects keyed on a lockfile hash turns a ten-minute job into a two-minute one without changing what is built.',
      },
      {
        id: 'ops02_c9',
        front: 'How do you keep secrets out of a pipeline log?',
        back:
          'Store them as repository or environment secrets, pass them as environment variables to only the step that needs them, never echo them, and never accept them from a fork-triggered workflow.',
      },
      {
        id: 'ops02_c10',
        front: 'What does a performance-regression job assert?',
        back:
          'That a benchmarked hot path stays within a threshold of its baseline, e.g. no more than 10 percent slower, measured on a consistent runner with warmup and repetitions, so a quiet algorithmic regression is caught as a build failure.',
      },
      {
        id: 'ops02_c11',
        front: 'How does Simulink fit into CI?',
        back:
          'Run MATLAB headless on a runner that can reach a licence server, execute Simulink Test suites and coverage programmatically, run Model Advisor checks, and publish the coverage and traceability reports as artefacts.',
      },
      {
        id: 'ops02_c12',
        front: 'Why does CI matter more for a simulator than for a web app?',
        back:
          'Simulator output is the evidence behind design decisions. A silent numerical regression propagates into analysis, reports and possibly flight rationale, and unlike a crashed web page nothing tells you it happened.',
      },
    ],
    quiz: [
      {
        id: 'ops02_q1',
        q: 'A regression test comparing trajectory output fails on macOS but passes on Linux with differences of 3e-16. The correct response is:',
        choices: [
          'Mark the test as expected-to-fail on macOS',
          'Use a relative tolerance appropriate to double precision instead of exact comparison',
          'Force -ffast-math so both platforms agree',
          'Round all outputs to four decimals before comparison',
        ],
        answer: 1,
        explain:
          'Differences at the last bit are normal across libm and vectorisation. A tolerance encodes the real requirement. -ffast-math makes reproducibility worse and breaks NaN handling, and blunt rounding destroys the test sensitivity.',
        b: 0.3,
        bloom: 'apply',
      },
      {
        id: 'ops02_q2',
        q: 'Which is NOT a legitimate reason for a self-hosted runner?',
        choices: [
          'A MATLAB licence server on a private network',
          'Hardware-in-the-loop equipment attached to the machine',
          'Wanting to skip code review',
          'Export-controlled data that may not leave managed infrastructure',
        ],
        answer: 2,
        explain:
          'Runner choice is about access to licences, hardware and controlled data. It has nothing to do with review policy, which is enforced by branch protection.',
        b: -0.7,
        bloom: 'understand',
      },
      {
        id: 'ops02_q3',
        q: 'Your pull-request pipeline takes 45 minutes and developers have started merging without waiting. Best first move?',
        choices: [
          'Remove the coverage gate',
          'Split the pipeline: fast checks on PR, full Monte Carlo and matrices nightly',
          'Increase the runner count until it is fast',
          'Disable required checks',
        ],
        answer: 1,
        explain:
          'The gate only works if people wait for it. Move the long-tail jobs to a schedule and keep the PR loop short; scale hardware after the split, not instead of it.',
        b: 0.4,
        bloom: 'analyze',
      },
      {
        id: 'ops02_q4',
        q: 'What does a green coverage gate at 90 percent prove?',
        choices: [
          'The code is correct',
          'Ninety percent of lines executed during the suite',
          'Ninety percent of requirements are verified',
          'MC/DC coverage is met',
        ],
        answer: 1,
        explain:
          'Statement coverage records execution only. A test can run a line and assert nothing, and requirement coverage and MC/DC are entirely different measures.',
        b: 0.1,
        bloom: 'understand',
      },
      {
        id: 'ops02_q5',
        q: 'A nightly Monte Carlo occasionally fails with a different random seed each night. What is the design fix?',
        choices: [
          'Retry the job three times',
          'Seed the run deterministically per case and record the seed in the artefact so any failure is reproducible',
          'Reduce the case count',
          'Ignore failures on scheduled runs',
        ],
        answer: 1,
        explain:
          'A dispersion run should be stochastic by design but reproducible by record. Logging the seed lets you rerun exactly the failing case instead of chasing it.',
        b: 0.6,
        bloom: 'apply',
      },
      {
        id: 'ops02_q6',
        q: 'Which pipeline stage would catch a use-after-free that only manifests under optimisation?',
        choices: [
          'clang-format',
          'Coverage report',
          'A Debug build with AddressSanitizer plus a Release build running the same tests',
          'Docs build',
        ],
        answer: 2,
        explain:
          'ASan detects the invalid access deterministically when the code path is exercised; running the same tests in Release confirms behaviour under the flags you ship.',
        b: 0.5,
        bloom: 'apply',
      },
      {
        id: 'ops02_q7',
        q: 'Why store CI configuration in the repository rather than in the CI server UI?',
        choices: [
          'It runs faster',
          'It is versioned, reviewed and branches with the code, so old commits still build the way they did',
          'The UI cannot express matrices',
          'It avoids needing a runner',
        ],
        answer: 1,
        explain:
          'Pipeline-as-code makes the build reproducible at any commit and reviewable like any other change, which is the same configuration-management argument as container pinning.',
        b: -0.2,
        bloom: 'understand',
      },
    ],
    tags: ['tooling', 'devops'],
    importance: 1.2,
  },

  {
    id: 'cod_dbg_01_gdb',
    track: 'coding',
    tier: 5,
    title: 'Debugging and Profiling as a Discipline',
    summary:
      "Reproduce, minimise, hypothesise, bisect, verify. Then the tools: gdb on a core dump, sanitizers for memory and races, and perf for where the time actually goes rather than where you guessed it went.",
    prereqs: ['cod_cpp_02_memory', 'cod_lnx_02_scripting'],
    hours: 15,
    topics: [
      'The scientific method of debugging; minimal reproducers',
      'gdb: break, conditional breakpoints, watchpoints, run, bt, frame, up/down',
      'info args, info locals, info registers, print, p *ptr@n, x/16xb',
      'step vs next vs finish vs until; tbreak; display; set var',
      'Attaching to a running process; gdb -p',
      'Core dumps: ulimit -c unlimited, gdb ./bin ./core, thread apply all bt',
      'TUI mode, .gdbinit, pretty-printers for STL and Eigen',
      'gdbserver and remote/embedded debugging; rr for reverse debugging',
      'Python: pdb, breakpoint(), py-spy for a live process',
      'AddressSanitizer, UBSan, ThreadSanitizer, LeakSanitizer',
      'Valgrind memcheck, helgrind, callgrind and when to prefer it over ASan',
      'perf stat (IPC, cache misses, branch misses), perf record/report, flame graphs',
      'hyperfine for wall clock, Google Benchmark for microbenchmarks',
      'Logging strategy: levels, structured logs, flight-side ring buffers',
      'Post-flight anomaly investigation: one dataset, no reruns',
    ],
    objectives: [
      'Take a core dump with no debug output and get to the root-cause line.',
      'Find a data race with ThreadSanitizer and explain the interleaving it reports.',
      'Choose between Valgrind and AddressSanitizer for a given situation and justify it.',
      'Profile a hot loop and achieve a measured speedup with evidence at each step.',
      'Design the logging for a component so a single flight dataset is enough to diagnose it.',
    ],
    resources: [
      {
        title: 'The Missing Semester: Debugging and Profiling',
        author: 'MIT',
        kind: 'course',
        url: 'https://missing.csail.mit.edu/2020/debugging-profiling/',
        free: true,
      },
      {
        title: 'Debugging with GDB',
        author: 'GNU Project',
        kind: 'docs',
        url: 'https://sourceware.org/gdb/current/onlinedocs/gdb/',
        free: true,
      },
      {
        title: 'The Art of Debugging with GDB, DDD, and Eclipse',
        author: 'Norman Matloff and Peter Jay Salzman',
        kind: 'book',
        free: false,
      },
      {
        title: 'Flame Graphs',
        author: 'Brendan Gregg',
        kind: 'site',
        url: 'https://www.brendangregg.com/flamegraphs.html',
        free: true,
      },
    ],
    exercises: [
      {
        id: 'dbg01_ex1',
        title: 'Core dump to root cause',
        prompt:
          'Given a stripped-down C++ binary built with -g that segfaults on a particular input, enable core dumps, reproduce, open the core in gdb, and report: the faulting frame, the value of the pointer that was dereferenced, the call path that produced it, and the one-line fix.',
        kind: 'analysis',
        hours: 2,
      },
      {
        id: 'dbg01_ex2',
        title: 'Measure before you optimise',
        prompt:
          'Profile a numerical loop with perf record and a flame graph. Write down your hypothesis BEFORE looking at the profile, then record what the profile actually showed, apply one change, and re-measure. Deliverable: a short note with three numbers (baseline, hypothesis, post-change) and an explanation of why your hypothesis was right or wrong.',
        kind: 'analysis',
        hours: 2,
      },
    ],
    cards: [
      {
        id: 'dbg01_c1',
        front: 'First question of any debugging session',
        back:
          'Can I reproduce it deterministically? Everything else, including a minimal test case, bisecting and instrumenting, is cheaper once the answer is yes. If it is no, the work is to make it reproducible.',
      },
      {
        id: 'dbg01_c2',
        front: 'gdb: bt, frame N, info locals',
        back:
          'bt prints the call stack; frame N selects a stack frame so that print and info operate in its scope; info locals dumps that frame local variables. This trio answers most crash questions.',
      },
      {
        id: 'dbg01_c3',
        front: 'What is a watchpoint?',
        back:
          'A breakpoint on data rather than code: gdb stops when an expression value changes. It is the tool for finding who corrupted a variable, and hardware watchpoints make it nearly free for small objects.',
      },
      {
        id: 'dbg01_c4',
        front: 'How do you enable and open a core dump?',
        back:
          'ulimit -c unlimited (and a writable core_pattern), reproduce the crash, then `gdb ./binary ./core`. The process is frozen at the fault, so bt and locals are available with no rerun.',
      },
      {
        id: 'dbg01_c5',
        front: 'ASan vs Valgrind memcheck: pick one for CI',
        back:
          'ASan. It needs a recompile but costs roughly 2x runtime, so it can run the whole suite. Valgrind needs no recompile, which is why you reach for it on a third-party or pre-built binary, but at roughly 20x slowdown it is a targeted tool, not a gate.',
      },
      {
        id: 'dbg01_c6',
        front: 'What does ThreadSanitizer detect that testing rarely does?',
        back:
          'Data races: two threads accessing the same memory with at least one write and no synchronisation. It reports the race even on an execution where the outcome happened to be correct, which is exactly what stress testing cannot guarantee.',
      },
      {
        id: 'dbg01_c7',
        front: 'step vs next vs finish',
        back:
          'step enters the called function; next executes the call as one unit; finish runs until the current function returns and prints its return value. until is next that will not go backwards in a loop.',
      },
      {
        id: 'dbg01_c8',
        front: 'Why profile before optimising?',
        back:
          'Engineers guess wrong about hotspots most of the time, and optimisation always costs readability. A profile turns the work into measurement-driven engineering, and gives you the before number you need to prove the after number.',
      },
      {
        id: 'dbg01_c9',
        front: 'perf stat shows a very low IPC and high cache-miss rate. What does that suggest?',
        back:
          'The loop is memory-bound rather than compute-bound: the CPU is stalling on data. Look at layout and access patterns (structure of arrays vs array of structures, stride, working-set size) rather than at instruction count.',
      },
      {
        id: 'dbg01_c10',
        front: 'Your profile says 60 percent of time is in memcpy. What do you investigate?',
        back:
          'Who is calling it and why: unnecessary copies of large objects, pass-by-value at an interface, vector reallocation from a missing reserve, or an expression producing temporaries. memcpy itself is rarely the problem.',
      },
      {
        id: 'dbg01_c11',
        front: 'How do you debug a process running on a flight computer you cannot rebuild?',
        back:
          'Attach with gdbserver over the network and connect a local gdb that has the matching unstripped binary and source, or capture a core dump and analyse it offline against the same build artefacts. This is why build artefacts and symbol files are archived per release.',
      },
      {
        id: 'dbg01_c12',
        front: 'Why is logging design an engineering decision in flight software?',
        back:
          'After a flight you usually get exactly one dataset and cannot rerun the event. What was not logged, at a rate and resolution that captures the event, is simply unknowable. Ring buffers and rate-limited structured logs are designed in, not added later.',
      },
      {
        id: 'dbg01_c13',
        front: 'What does UBSan catch that ASan does not?',
        back:
          'Undefined behaviour that is not a memory error: signed integer overflow, shifts past the width, misaligned or null-derived pointer arithmetic, invalid enum or bool values, and float-to-int conversions that do not fit.',
      },
    ],
    quiz: [
      {
        id: 'dbg01_q1',
        q: 'A crash reproduces once every few hundred runs and only in Release. What is the most productive first step?',
        choices: [
          'Add print statements until it appears',
          'Build with -O2 -g plus ASan/UBSan and run the suite in a loop to make the fault deterministic',
          'Switch compilers',
          'Disable optimisation and declare it fixed',
        ],
        answer: 1,
        explain:
          'Intermittency usually means undefined behaviour or a race. Sanitizers convert a probabilistic symptom into a deterministic report; disabling optimisation only hides it.',
        b: 0.5,
        bloom: 'apply',
      },
      {
        id: 'dbg01_q2',
        q: 'Which gdb command tells you the value of the pointer that was just dereferenced in the faulting frame?',
        choices: ['info registers only', 'frame 0 then print ptr', 'list', 'continue'],
        answer: 1,
        explain:
          'Select the frame, then print the expression in that frame scope. info registers helps when there is no symbol information, and list and continue do not inspect state.',
        b: 0.0,
        bloom: 'apply',
      },
      {
        id: 'dbg01_q3',
        q: 'You must check a third-party binary you cannot recompile for leaks. Which tool?',
        choices: ['AddressSanitizer', 'Valgrind memcheck', 'ThreadSanitizer', 'perf record'],
        answer: 1,
        explain:
          'Sanitizers are compile-time instrumentation. Valgrind runs unmodified binaries under dynamic recompilation, which is precisely its niche despite the slowdown.',
        b: 0.3,
        bloom: 'understand',
      },
      {
        id: 'dbg01_q4',
        q: 'perf stat reports IPC of 0.35 and an L3 miss rate of 40 percent for your propagator. What do you do?',
        choices: [
          'Unroll the inner loop',
          'Improve data locality and layout; the loop is memory-bound',
          'Add more threads',
          'Enable -ffast-math',
        ],
        answer: 1,
        explain:
          'Low IPC with heavy cache misses means the CPU is waiting on memory. Unrolling and threading do not help a stalled pipeline, and -ffast-math changes numerical semantics without addressing the stall.',
        b: 1.0,
        bloom: 'analyze',
      },
      {
        id: 'dbg01_q5',
        q: 'TSan reports a race on a variable written by one thread and read by another, yet all your tests pass. What is the correct conclusion?',
        choices: [
          'A false positive, since the tests pass',
          'A real defect whose outcome happens to be benign on this machine and compiler today',
          'It only matters if the variable is a pointer',
          'Marking the variable volatile resolves it',
        ],
        answer: 1,
        explain:
          'A data race is undefined behaviour regardless of the observed result, and volatile provides no atomicity or ordering. Fix it with an atomic or a mutex.',
        b: 0.8,
        bloom: 'analyze',
      },
      {
        id: 'dbg01_q6',
        q: 'What does `thread apply all bt` in gdb most directly help with?',
        choices: [
          'Measuring throughput',
          'Diagnosing a deadlock by showing what every thread is blocked on',
          'Finding memory leaks',
          'Checking compiler flags',
        ],
        answer: 1,
        explain:
          'A deadlock is visible as a cycle of threads each waiting on a lock another holds, which the full set of backtraces reveals immediately.',
        b: 0.6,
        bloom: 'apply',
      },
      {
        id: 'dbg01_q7',
        q: 'Which logging design best supports post-flight anomaly investigation?',
        choices: [
          'Verbose text logs at maximum rate for everything',
          'Rate-limited structured records for key states, plus a high-rate ring buffer kept for the seconds around a fault trigger',
          'Log only errors',
          'Log nothing on the vehicle; reconstruct from ground commands',
        ],
        answer: 1,
        explain:
          'Bandwidth and storage are finite, so you design for the event: continuous low-rate context plus a high-rate snapshot retained when something trips. Error-only logging loses the lead-up that explains the error.',
        b: 0.7,
        bloom: 'analyze',
      },
    ],
    tags: ['tooling', 'debugging'],
    importance: 1.25,
  },

  /* ══ PYTHON ══════════════════════════════════════════════════════════════ */
  {
    id: 'cod_py_01_basics',
    track: 'coding',
    tier: 1,
    title: 'Python Fundamentals',
    summary:
      "Python is a production language at SpaceX: flight software is C++, but the tests, analysis and simulation tooling around it are Python. This is zero to writing a 200-line multi-function program from a specification.",
    prereqs: ['cod_lnx_01_shell'],
    hours: 35,
    topics: [
      'Interpreter, REPL, running scripts, the difference between them',
      'int, float, bool, str; f-strings; str methods',
      'list, tuple, dict, set; slicing; truthiness; mutability',
      'if/elif/else; for, while, range, enumerate, zip; break/continue/else',
      'Functions: positional, keyword, default, *args, **kwargs',
      'Scope and LEGB; closures at a first-pass level',
      'Modules, import, packages, the if __name__ == "__main__" guard',
      'Files, pathlib, csv and json',
      'Exceptions: try/except/else/finally, raising, custom exception types',
      'The mutable default argument trap',
      'Virtual environments with venv, pip, requirements and pyproject.toml',
      'Floating point: why 0.1 + 0.2 != 0.3 and what to do about it',
    ],
    objectives: [
      'Write a multi-function 200-line script from a written specification without a tutorial.',
      'Explain and fix the mutable-default-argument bug.',
      'Choose between list, tuple, dict and set from the access pattern.',
      'Create and use an isolated virtual environment from the shell.',
      'Read a CSV of time-tagged accelerometer data and report per-axis min, max, mean and RMS.',
    ],
    resources: [
      {
        title: 'CS50P: Introduction to Programming with Python',
        author: 'David J. Malan, Harvard/edX',
        kind: 'course',
        url: 'https://cs50.harvard.edu/python/',
        free: true,
        note: 'Roughly nine weeks; the problem sets are the value.',
      },
      {
        title: 'Automate the Boring Stuff with Python, 3rd ed.',
        author: 'Al Sweigart',
        kind: 'book',
        url: 'https://automatetheboringstuff.com/',
        free: true,
      },
      {
        title: 'Python Crash Course, 3rd ed.',
        author: 'Eric Matthes',
        kind: 'book',
        free: false,
        note: 'Part I is the fastest paper path through the fundamentals.',
      },
      {
        title: 'The Python Tutorial',
        author: 'Python Software Foundation',
        kind: 'docs',
        url: 'https://docs.python.org/3/tutorial/',
        free: true,
      },
    ],
    exercises: [
      {
        id: 'py01_ex1',
        title: 'Unit conversion library',
        prompt:
          'Implement four conversions with their exact definitional constants: international feet to metres (0.3048 exactly), pound-force to newtons (4.4482216152605 exactly), degrees to radians, and degrees Rankine to kelvin (factor 5/9 exactly). Mixing unit systems is a classic loss-of-mission bug, so exactness matters.',
        kind: 'code',
        lang: 'python',
        starter:
          'import math\n\n\ndef ft_to_m(ft):\n    """International feet to metres. 1 ft = 0.3048 m exactly."""\n    raise NotImplementedError\n\n\ndef lbf_to_n(lbf):\n    """Pound-force to newtons. 1 lbf = 4.4482216152605 N exactly."""\n    raise NotImplementedError\n\n\ndef deg_to_rad(deg):\n    """Degrees to radians."""\n    raise NotImplementedError\n\n\ndef rankine_to_kelvin(r):\n    """Degrees Rankine to kelvin. 1 R = 5/9 K exactly."""\n    raise NotImplementedError\n',
        solution:
          'import math\n\nFT_TO_M = 0.3048\nLBF_TO_N = 4.4482216152605\n\n\ndef ft_to_m(ft):\n    return ft * FT_TO_M\n\n\ndef lbf_to_n(lbf):\n    return lbf * LBF_TO_N\n\n\ndef deg_to_rad(deg):\n    return deg * math.pi / 180.0\n\n\ndef rankine_to_kelvin(r):\n    return r * 5.0 / 9.0\n',
        tests: [
          {
            name: 'feet to metres is exact',
            assert:
              'assert abs(ft_to_m(1.0) - 0.3048) < 1e-15, "1 ft must be 0.3048 m"\nassert ft_to_m(0.0) == 0.0\nassert abs(ft_to_m(1000.0) - 304.8) < 1e-9\n',
          },
          {
            name: 'pound-force to newtons',
            assert:
              'assert abs(lbf_to_n(1.0) - 4.4482216152605) < 1e-12, "wrong lbf definition"\nassert abs(lbf_to_n(1_500_000.0) - 6672332.42289075) < 1e-3\n',
          },
          {
            name: 'angles',
            assert:
              'import math\nassert abs(deg_to_rad(180.0) - math.pi) < 1e-12\nassert abs(deg_to_rad(-90.0) + math.pi / 2) < 1e-12\n',
          },
          {
            name: 'Rankine to kelvin',
            assert:
              'assert abs(rankine_to_kelvin(491.67) - 273.15) < 1e-9, "491.67 R is the ice point, 273.15 K"\nassert abs(rankine_to_kelvin(0.0)) < 1e-15\n',
            hidden: true,
          },
        ],
        hours: 2,
      },
      {
        id: 'py01_ex2',
        title: 'Per-axis accelerometer statistics',
        prompt:
          'Implement `rms(values)` returning 0.0 for an empty sequence instead of raising, and `axis_stats(rows)` where rows is a list of dicts with keys t, ax, ay, az. Return a dict mapping each axis name to a dict with keys min, max, mean and rms. An empty input must return zeros, not a crash: a telemetry gap is normal and should not take down the report.',
        kind: 'code',
        lang: 'python',
        starter:
          'import math\n\n\ndef rms(values):\n    """Root mean square; return 0.0 for an empty sequence."""\n    raise NotImplementedError\n\n\ndef axis_stats(rows):\n    """rows: list of dicts with keys t, ax, ay, az.\n\n    Return {"ax": {"min": .., "max": .., "mean": .., "rms": ..}, "ay": {...}, "az": {...}}\n    For an empty rows list every statistic is 0.0.\n    """\n    raise NotImplementedError\n',
        solution:
          'import math\n\n\ndef rms(values):\n    vals = list(values)\n    if not vals:\n        return 0.0\n    return math.sqrt(sum(v * v for v in vals) / len(vals))\n\n\ndef axis_stats(rows):\n    out = {}\n    for axis in ("ax", "ay", "az"):\n        vals = [r[axis] for r in rows]\n        if not vals:\n            out[axis] = {"min": 0.0, "max": 0.0, "mean": 0.0, "rms": 0.0}\n        else:\n            out[axis] = {\n                "min": min(vals),\n                "max": max(vals),\n                "mean": sum(vals) / len(vals),\n                "rms": rms(vals),\n            }\n    return out\n',
        tests: [
          {
            name: 'rms basics',
            assert:
              'assert rms([]) == 0.0, "empty input must return 0.0, not raise"\nassert abs(rms([3.0, 4.0]) - 3.5355339059327378) < 1e-12\nassert abs(rms([-2.0, 2.0]) - 2.0) < 1e-12\n',
          },
          {
            name: 'axis statistics',
            assert:
              'rows = [\n    {"t": 0.0, "ax": 1.0, "ay": -1.0, "az": 9.81},\n    {"t": 0.1, "ax": 3.0, "ay": 1.0, "az": 9.79},\n]\ns = axis_stats(rows)\nassert abs(s["ax"]["mean"] - 2.0) < 1e-12\nassert s["ay"]["min"] == -1.0 and s["ay"]["max"] == 1.0\nassert abs(s["az"]["rms"] - 9.800005102039488) < 1e-6\n',
          },
          {
            name: 'empty telemetry does not crash',
            assert:
              's = axis_stats([])\nassert set(s) == {"ax", "ay", "az"}\nassert all(v == 0.0 for axis in s.values() for v in axis.values()), "all stats must be 0.0"\n',
            hidden: true,
          },
        ],
        hours: 2,
      },
    ],
    cards: [
      {
        id: 'py01_c1',
        front: 'Why does `def f(x, acc=[])` misbehave?',
        back:
          'The default object is created once, when the function is defined, and shared by every call that omits the argument, so mutations accumulate across calls. Use `acc=None` and build a fresh list inside the body.',
      },
      {
        id: 'py01_c2',
        front: 'list vs tuple: when is a tuple required?',
        back:
          'When the value must be hashable, i.e. used as a dict key or a set member, and when you want immutability as a contract. Tuples also signal a fixed-length heterogeneous record rather than a homogeneous sequence.',
      },
      {
        id: 'py01_c3',
        front: 'What does `if __name__ == "__main__":` guard?',
        back:
          'Code that should run only when the file is executed directly, not when it is imported. Without it, importing your simulation module to reuse one function would execute the whole run.',
      },
      {
        id: 'py01_c4',
        front: 'Why is `0.1 + 0.2 == 0.3` False?',
        back:
          'Binary floating point cannot represent those decimals exactly, so the sum lands one ulp away from the stored value of 0.3. Compare with a tolerance (math.isclose or pytest.approx), never with ==.',
      },
      {
        id: 'py01_c5',
        front: 'What is the LEGB rule?',
        back:
          'Name lookup order: Local, Enclosing function, Global (module), Built-in. Assignment inside a function creates a local name unless declared global or nonlocal, which is why reading then assigning a module-level counter raises UnboundLocalError.',
      },
      {
        id: 'py01_c6',
        front: 'a = [1,2,3]; b = a; b.append(4). What is a?',
        back:
          '[1, 2, 3, 4]. Assignment binds a second name to the same object; it does not copy. Use list(a), a[:] or copy.deepcopy when you need independence.',
      },
      {
        id: 'py01_c7',
        front: 'try/except/else/finally: what is `else` for?',
        back:
          'It runs only if no exception was raised, letting you keep the risky line alone in the try block. finally always runs, on success, on exception and on return, which is where cleanup belongs.',
      },
      {
        id: 'py01_c8',
        front: 'Why catch a specific exception rather than bare `except:`?',
        back:
          'A bare except also swallows KeyboardInterrupt, SystemExit and genuine programming errors like NameError, turning a crash you could fix into silently wrong numbers.',
      },
      {
        id: 'py01_c9',
        front: 'What does a virtual environment isolate?',
        back:
          'The interpreter site-packages for one project, so two projects can pin different NumPy versions and a pinned requirements file actually reproduces. It does not isolate the OS, the compiler or system libraries; that is what containers are for.',
      },
      {
        id: 'py01_c10',
        front: 'dict lookup vs list scan: complexity',
        back:
          'Average O(1) for a dict by hash versus O(n) for scanning a list. For a channel lookup table keyed by id, the dict is the right structure and the difference shows at a few hundred entries.',
        formula: false,
      },
      {
        id: 'py01_c11',
        front: 'What does `enumerate(seq, start=1)` give you?',
        back:
          'Pairs of (index, item) with the index beginning at 1. It replaces the manual counter variable, which is a common source of off-by-one errors when a loop gains a continue.',
      },
      {
        id: 'py01_c12',
        front: 'Which of `str`, `list`, `tuple`, `dict`, `set` are mutable?',
        back:
          'list, dict and set are mutable; str and tuple are immutable. Immutable objects can be dict keys and can be safely shared; mutable ones cannot and cannot.',
      },
      {
        id: 'py01_c13',
        front: 'What is the difference between `is` and `==`?',
        back:
          '`is` compares object identity, `==` compares value. Use `is` only for None, True, False and sentinels; small-int and string interning makes `is` appear to work for values, then fail in production data.',
      },
    ],
    quiz: [
      {
        id: 'py01_q1',
        q: 'What does this print?\n\ndef add(v, acc=[]):\n    acc.append(v)\n    return acc\n\nprint(add(1)); print(add(2))',
        choices: ['[1] then [2]', '[1] then [1, 2]', '[1] then []', 'It raises TypeError'],
        answer: 1,
        explain:
          'The default list is created once at definition time and reused, so the second call appends to the same object. Use acc=None and create the list inside.',
        b: 0.2,
        bloom: 'analyze',
      },
      {
        id: 'py01_q2',
        q: 'Which comparison is correct for two computed float velocities?',
        choices: [
          'a == b',
          'round(a, 6) == round(b, 6)',
          'math.isclose(a, b, rel_tol=1e-9, abs_tol=1e-12)',
          'str(a) == str(b)',
        ],
        answer: 2,
        explain:
          'isclose applies both a relative and an absolute tolerance, so it behaves sensibly for large values and near zero. Rounding is a blunt fixed-absolute test, and string comparison is worse.',
        b: -0.2,
        bloom: 'apply',
      },
      {
        id: 'py01_q3',
        q: 'You need an ordered, fixed collection of channel names usable as a dict key. Which type?',
        choices: ['list', 'set', 'tuple', 'dict'],
        answer: 2,
        explain:
          'Keys must be hashable. Tuples are immutable and therefore hashable, and they keep order; lists and sets and dicts are not hashable.',
        b: -0.1,
        bloom: 'apply',
      },
      {
        id: 'py01_q4',
        q: 'A module-level `count = 0`, and a function body does `count += 1`. What happens?',
        choices: [
          'count becomes 1',
          'UnboundLocalError, because assignment makes count local to the function',
          'SyntaxError',
          'Nothing; the assignment is ignored',
        ],
        answer: 1,
        explain:
          'Any assignment in a function body makes that name local for the entire body, so the read on the right-hand side happens before it is bound. Declare `global count` or, better, return the new value.',
        b: 0.9,
        bloom: 'analyze',
      },
      {
        id: 'py01_q5',
        q: 'What is the purpose of `finally`?',
        choices: [
          'It runs only if no exception occurred',
          'It runs only if an exception occurred',
          'It always runs, including on exception and on return',
          'It re-raises the last exception',
        ],
        answer: 2,
        explain:
          'finally is the unconditional cleanup path; `else` is the no-exception path. In modern code a context manager usually expresses this better.',
        b: -0.3,
        bloom: 'recall',
      },
      {
        id: 'py01_q6',
        q: 'Why does a test-and-analysis team keep Python code in modules rather than notebooks?',
        choices: [
          'Notebooks cannot import NumPy',
          'Notebooks execute out of order, diff badly and cannot be imported or unit tested as-is',
          'Notebooks are slower at floating-point math',
          'Notebooks require a paid licence',
        ],
        answer: 1,
        explain:
          'Hidden execution-order state makes a notebook result hard to reproduce, and JSON cell storage makes review painful. Notebooks are for exploring; modules are for shipping.',
        b: 0.3,
        bloom: 'understand',
      },
      {
        id: 'py01_q7',
        q: 'Which statement about `a = [1,2]; b = a[:]` is true?',
        choices: [
          'b is a shallow copy; appending to b does not affect a',
          'b is the same object as a',
          'b is a deep copy of nested structures',
          'Slicing a list raises for step-less slices',
        ],
        answer: 0,
        explain:
          'a[:] builds a new list containing the same element references. Top-level mutation is independent, but mutating a nested object still shows through both.',
        b: 0.4,
        bloom: 'understand',
      },
      {
        id: 'py01_q8',
        q: 'Best way to build a path to a data file inside a package?',
        choices: [
          'Hard-code "/home/user/data/x.csv"',
          'Concatenate strings with "/"',
          'Use pathlib.Path and the module location',
          'Use os.system("find")',
        ],
        answer: 2,
        explain:
          'pathlib handles separators, expansion and joining portably, and deriving from the module location survives being run from any working directory.',
        b: -0.4,
        bloom: 'apply',
      },
    ],
    tags: ['spacex-core', 'python'],
    importance: 1.5,
  },

  {
    id: 'cod_py_02_idiomatic',
    track: 'coding',
    tier: 2,
    title: 'Idiomatic and Structured Python',
    summary:
      "Comprehensions, generators, classes, dataclasses, context managers, decorators and type annotations: the toolkit that turns a working script into a module other engineers can reuse and a type checker can police.",
    prereqs: ['cod_py_01_basics'],
    hours: 25,
    topics: [
      'List, dict and set comprehensions; generator expressions',
      'Generators and yield; the iterator protocol; laziness and memory',
      'lambda, map, filter, sorted with key=',
      'Classes: __init__, attributes vs methods, @property, @staticmethod, @classmethod',
      'Dunder methods: __repr__, __eq__, __add__, __mul__, __len__, __iter__',
      'dataclasses and frozen dataclasses',
      'Inheritance vs composition; duck typing and Protocols',
      'Context managers: with, __enter__/__exit__, contextlib',
      'Decorators, functools.wraps, functools.lru_cache',
      'Type annotations, Optional, Sequence, npt.NDArray, and mypy',
      'logging instead of print; levels and handlers',
      'argparse for command-line tools',
      'Package layout: src/ layout, __init__.py, relative imports',
    ],
    objectives: [
      'Design a State and Vehicle class family for a six-degree-of-freedom simulation with clear responsibilities.',
      'Write a decorator that times and logs a function without breaking its signature or docstring.',
      'Implement a Quaternion class with multiplication, conjugation and a correct __repr__.',
      'Type-annotate a module and get a clean mypy run.',
      'Replace print debugging with structured logging.',
    ],
    resources: [
      {
        title: 'Fluent Python, 2nd ed.',
        author: 'Luciano Ramalho',
        kind: 'book',
        free: false,
        note: 'Chapters 1-2, 5-6, 9 and 13-14 map onto this module.',
      },
      {
        title: 'Effective Python, 3rd ed.',
        author: 'Brett Slatkin',
        kind: 'book',
        free: false,
      },
      {
        title: 'Python typing documentation',
        author: 'Python Software Foundation',
        kind: 'docs',
        url: 'https://docs.python.org/3/library/typing.html',
        free: true,
      },
      {
        title: 'Real Python: Primer on Decorators',
        author: 'Real Python',
        kind: 'site',
        url: 'https://realpython.com/primer-on-python-decorators/',
        free: true,
      },
    ],
    exercises: [
      {
        id: 'py02_ex1',
        title: 'Quaternion class',
        prompt:
          'Implement a Quaternion class storing w, x, y, z (scalar first). Provide __mul__ implementing Hamilton product, conj(), norm(), normalized(), and __repr__. Convention: q1 * q2 composes rotations so that applying q1*q2 to a vector is applying q2 first then q1. Do not use NumPy.',
        kind: 'code',
        lang: 'python',
        starter:
          'import math\n\n\nclass Quaternion:\n    """Scalar-first quaternion: q = w + x i + y j + z k."""\n\n    def __init__(self, w, x, y, z):\n        self.w, self.x, self.y, self.z = float(w), float(x), float(y), float(z)\n\n    def __mul__(self, other):\n        """Hamilton product."""\n        raise NotImplementedError\n\n    def conj(self):\n        raise NotImplementedError\n\n    def norm(self):\n        raise NotImplementedError\n\n    def normalized(self):\n        raise NotImplementedError\n\n    def __repr__(self):\n        return f"Quaternion({self.w!r}, {self.x!r}, {self.y!r}, {self.z!r})"\n',
        solution:
          'import math\n\n\nclass Quaternion:\n    """Scalar-first quaternion: q = w + x i + y j + z k."""\n\n    def __init__(self, w, x, y, z):\n        self.w, self.x, self.y, self.z = float(w), float(x), float(y), float(z)\n\n    def __mul__(self, other):\n        a, b, c, d = self.w, self.x, self.y, self.z\n        e, f, g, h = other.w, other.x, other.y, other.z\n        return Quaternion(\n            a * e - b * f - c * g - d * h,\n            a * f + b * e + c * h - d * g,\n            a * g - b * h + c * e + d * f,\n            a * h + b * g - c * f + d * e,\n        )\n\n    def conj(self):\n        return Quaternion(self.w, -self.x, -self.y, -self.z)\n\n    def norm(self):\n        return math.sqrt(self.w ** 2 + self.x ** 2 + self.y ** 2 + self.z ** 2)\n\n    def normalized(self):\n        n = self.norm()\n        if n == 0.0:\n            raise ValueError("cannot normalize a zero quaternion")\n        return Quaternion(self.w / n, self.x / n, self.y / n, self.z / n)\n\n    def __repr__(self):\n        return f"Quaternion({self.w!r}, {self.x!r}, {self.y!r}, {self.z!r})"\n',
        tests: [
          {
            name: 'identity and basis products',
            assert:
              'one = Quaternion(1, 0, 0, 0)\ni = Quaternion(0, 1, 0, 0)\nj = Quaternion(0, 0, 1, 0)\nk = Quaternion(0, 0, 0, 1)\nr = i * j\nassert (r.w, r.x, r.y, r.z) == (0.0, 0.0, 0.0, 1.0), "i*j must equal k"\nr = j * i\nassert (r.w, r.x, r.y, r.z) == (0.0, 0.0, 0.0, -1.0), "j*i must equal -k"\nr = i * i\nassert (r.w, r.x, r.y, r.z) == (-1.0, 0.0, 0.0, 0.0), "i*i must equal -1"\nr = one * k\nassert (r.w, r.x, r.y, r.z) == (0.0, 0.0, 0.0, 1.0)\n',
          },
          {
            name: 'conjugate and norm',
            assert:
              'import math\nq = Quaternion(1, 2, 3, 4)\nc = q.conj()\nassert (c.w, c.x, c.y, c.z) == (1.0, -2.0, -3.0, -4.0)\nassert abs(q.norm() - math.sqrt(30.0)) < 1e-12\np = q * q.conj()\nassert abs(p.w - 30.0) < 1e-12 and abs(p.x) < 1e-12 and abs(p.y) < 1e-12 and abs(p.z) < 1e-12\n',
          },
          {
            name: 'normalized has unit norm',
            assert:
              'u = Quaternion(1, 2, 3, 4).normalized()\nassert abs(u.norm() - 1.0) < 1e-12, "normalized() must produce a unit quaternion"\ntry:\n    Quaternion(0, 0, 0, 0).normalized()\nexcept ValueError:\n    pass\nelse:\n    raise AssertionError("normalizing a zero quaternion must raise ValueError")\n',
            hidden: true,
          },
        ],
        hours: 3,
      },
      {
        id: 'py02_ex2',
        title: 'A retry decorator that preserves the function',
        prompt:
          'Write `retry(times, exceptions=(Exception,))`, a decorator factory that re-calls the wrapped function up to `times` total attempts when it raises one of the listed exception types, re-raising the last exception if all attempts fail. It must preserve __name__ and __doc__, and must not retry exceptions outside the listed types.',
        kind: 'code',
        lang: 'python',
        starter:
          'import functools\n\n\ndef retry(times, exceptions=(Exception,)):\n    """Return a decorator that retries the function up to `times` attempts."""\n\n    def decorator(fn):\n        raise NotImplementedError\n\n    return decorator\n',
        solution:
          'import functools\n\n\ndef retry(times, exceptions=(Exception,)):\n    """Return a decorator that retries the function up to `times` attempts."""\n\n    def decorator(fn):\n        @functools.wraps(fn)\n        def wrapper(*args, **kwargs):\n            last = None\n            for _ in range(times):\n                try:\n                    return fn(*args, **kwargs)\n                except exceptions as exc:\n                    last = exc\n            raise last\n\n        return wrapper\n\n    return decorator\n',
        tests: [
          {
            name: 'retries until success',
            assert:
              'calls = {"n": 0}\n\n@retry(3, (ValueError,))\ndef flaky():\n    """docstring preserved"""\n    calls["n"] += 1\n    if calls["n"] < 3:\n        raise ValueError("not yet")\n    return "ok"\n\nassert flaky() == "ok"\nassert calls["n"] == 3, "should have taken exactly three attempts"\n',
          },
          {
            name: 'metadata preserved',
            assert:
              '@retry(2)\ndef documented():\n    """the doc"""\n    return 1\n\nassert documented.__name__ == "documented", "use functools.wraps"\nassert documented.__doc__ == "the doc"\n',
          },
          {
            name: 'unlisted exceptions are not retried',
            assert:
              'attempts = {"n": 0}\n\n@retry(5, (ValueError,))\ndef boom():\n    attempts["n"] += 1\n    raise KeyError("different")\n\ntry:\n    boom()\nexcept KeyError:\n    pass\nelse:\n    raise AssertionError("KeyError should propagate")\nassert attempts["n"] == 1, "must not retry exception types outside the list"\n',
            hidden: true,
          },
        ],
        hours: 2,
      },
    ],
    cards: [
      {
        id: 'py02_c1',
        front: 'When does a generator beat a list?',
        back:
          'When the sequence is large or unbounded and you consume it once: the generator holds one item at a time instead of materialising all of them. It loses when you need random access, len(), or multiple passes.',
      },
      {
        id: 'py02_c2',
        front: 'What exactly does `yield` do to a function?',
        back:
          'It turns the function into a generator function. Calling it runs no body code; it returns a generator object whose __next__ resumes execution until the next yield, preserving local state between resumptions.',
      },
      {
        id: 'py02_c3',
        front: '@property: what problem does it solve?',
        back:
          'It lets an attribute access run code, so you can start with a plain attribute and later add validation, lazy computation or a derived value without changing any caller. That is why Python does not need Java-style getters up front.',
      },
      {
        id: 'py02_c4',
        front: 'Implementing __eq__ on a state vector: what is the trap?',
        back:
          'Exact float comparison. Two states that differ by one ulp compare unequal, so an equality test built for convenience becomes a flaky test. Either compare with a tolerance in an explicit method, or make __eq__ exact and never use it for numerical checks. Also remember defining __eq__ sets __hash__ to None unless you define it.',
      },
      {
        id: 'py02_c5',
        front: 'Composition or inheritance for Sensor, IMU and Gyro?',
        back:
          'Composition for capabilities and inheritance only for genuine is-a substitutability. An IMU that contains a Gyro and an Accelerometer models reality; making IMU inherit from Gyro forces an is-a claim that breaks the first time the IMU needs two gyros.',
      },
      {
        id: 'py02_c6',
        front: 'Why does a decorator need functools.wraps?',
        back:
          'Without it the wrapper replaces the original __name__, __doc__, __module__ and __wrapped__, which breaks help(), tracebacks, pytest test collection and any introspection-based tooling.',
      },
      {
        id: 'py02_c7',
        front: 'What contract does a context manager implement?',
        back:
          '__enter__ acquires and returns the resource, __exit__ releases it and runs even when the body raises. It is Python RAII, and contextlib.contextmanager lets you write it as a generator with one yield.',
      },
      {
        id: 'py02_c8',
        front: 'dataclass vs plain class',
        back:
          'A dataclass generates __init__, __repr__ and optionally __eq__ and ordering from annotated fields, so a record type costs three lines. Use frozen=True for value semantics; use a plain class when behaviour dominates over data.',
      },
      {
        id: 'py02_c9',
        front: 'Does Python enforce type annotations at runtime?',
        back:
          'No. They are metadata, checked only by external tools such as mypy or pyright, or at runtime by libraries that choose to read them. Their value is catching interface mistakes before the simulation runs for an hour.',
      },
      {
        id: 'py02_c10',
        front: 'Why logging instead of print?',
        back:
          'Levels let you keep diagnostics in the code and turn them on selectively; handlers route to file, console or a collector; records carry timestamp, module and line. print writes to stdout unconditionally and is stripped or forgotten.',
      },
      {
        id: 'py02_c11',
        front: 'What is a Protocol in typing terms?',
        back:
          'A structural type: any object with the right methods satisfies it, with no inheritance required. It types duck typing, so a mock sensor and a real sensor both satisfy a SensorProtocol without a shared base class.',
      },
      {
        id: 'py02_c12',
        front: 'What does functools.lru_cache change about a function?',
        back:
          'It memoises results keyed by the arguments, which must be hashable. It is a large win for expensive pure functions and a correctness hazard for anything that is not pure or whose arguments are mutable.',
      },
      {
        id: 'py02_c13',
        front: 'sorted(items, key=f) vs items.sort()',
        back:
          'sorted returns a new list and works on any iterable; list.sort mutates in place and returns None. Both are stable, which is what lets you sort by a secondary key first and a primary key second.',
      },
    ],
    quiz: [
      {
        id: 'py02_q1',
        q: 'You must stream 50 GB of telemetry records, filtering about one percent. Which construction is appropriate?',
        choices: [
          'Read all records into a list, then filter with a list comprehension',
          'A generator pipeline that yields matching records as it reads',
          'Load into a dict keyed by timestamp',
          'Recursion over the file',
        ],
        answer: 1,
        explain:
          'Generators keep memory proportional to one record rather than the whole file. The list version needs 50 GB of RAM, and a dict is worse.',
        b: -0.1,
        bloom: 'apply',
      },
      {
        id: 'py02_q2',
        q: 'A decorator is applied but pytest no longer collects the test functions it wraps. Likely cause?',
        choices: [
          'Missing functools.wraps, so names and metadata were lost',
          'The decorator returns None',
          'Decorators cannot be used on tests',
          'pytest requires classes',
        ],
        answer: 0,
        explain:
          'Collection and reporting rely on __name__ and the wrapped signature. wraps copies that metadata across.',
        b: 0.6,
        bloom: 'analyze',
      },
      {
        id: 'py02_q3',
        q: 'Which is the best reason to make a State dataclass frozen?',
        choices: [
          'It runs faster',
          'It makes instances hashable and prevents a propagator from mutating a state another object still references',
          'It enables inheritance',
          'It allows NumPy arrays as fields safely',
        ],
        answer: 1,
        explain:
          'Value semantics eliminate a whole class of aliasing bug in simulation code. Note that a frozen dataclass containing a NumPy array is still only shallowly immutable.',
        b: 0.5,
        bloom: 'understand',
      },
      {
        id: 'py02_q4',
        q: 'What does `with open(path) as f:` guarantee?',
        choices: [
          'The file is closed only on successful completion',
          'The file is closed on normal exit and when an exception propagates',
          'The file contents are cached',
          'Writes are flushed every line',
        ],
        answer: 1,
        explain:
          '__exit__ runs on both paths, which is the whole point; relying on garbage collection to close files is not deterministic.',
        b: -0.5,
        bloom: 'recall',
      },
      {
        id: 'py02_q5',
        q: 'Defining __eq__ on a class without defining __hash__ results in:',
        choices: [
          'A default hash by identity',
          'The instances becoming unhashable',
          'A TypeError at class definition',
          'Automatic structural hashing',
        ],
        answer: 1,
        explain:
          'Python sets __hash__ to None when __eq__ is defined, since objects that compare equal must hash equal. Provide __hash__ explicitly or use a frozen dataclass.',
        b: 1.2,
        bloom: 'analyze',
      },
      {
        id: 'py02_q6',
        q: 'Which is the strongest argument for Protocol over an abstract base class for sensors?',
        choices: [
          'It runs faster at import time',
          'Third-party and test objects satisfy it without inheriting from your class',
          'It enforces types at runtime',
          'It allows multiple inheritance',
        ],
        answer: 1,
        explain:
          'Structural typing means a vendor SDK object or a lightweight fake can conform without modifying its class hierarchy, which is exactly what test doubles need.',
        b: 0.8,
        bloom: 'understand',
      },
      {
        id: 'py02_q7',
        q: 'What does mypy give a numerical codebase that tests do not?',
        choices: [
          'Proof the algorithm is correct',
          'Whole-program checking of interface mistakes without executing any code path',
          'Faster execution',
          'Automatic vectorisation',
        ],
        answer: 1,
        explain:
          'Static checking covers branches your tests never take, catching argument order, Optional misuse and shape-type mismatches cheaply. It says nothing about numerical correctness.',
        b: 0.3,
        bloom: 'understand',
      },
    ],
    tags: ['spacex-core', 'python'],
    importance: 1.4,
  },

  {
    id: 'cod_py_03_numpy',
    track: 'coding',
    tier: 3,
    title: 'NumPy and Array Thinking',
    summary:
      "The single highest-leverage Python skill for GNC. Stop writing element loops and start writing array expressions, and learn the two things that bite everyone: broadcasting rules and views versus copies.",
    prereqs: ['cod_py_02_idiomatic'],
    hours: 30,
    topics: [
      'ndarray: dtype, shape, ndim, strides, itemsize',
      'Creation: zeros, ones, full, arange, linspace, eye, default_rng',
      'Indexing and slicing; views vs copies; base; fancy indexing and boolean masks',
      'Broadcasting rules, newaxis, and when shapes are incompatible',
      'Axis semantics in reductions: sum, mean, std, min, argmax with axis=',
      'reshape, ravel, transpose, stack, concatenate, C vs Fortran order',
      'Linear algebra: solve, lstsq, eig, svd, norm, cond, and why not inv',
      'matmul and @, dot, cross, einsum',
      'Float pitfalls: allclose, catastrophic cancellation, float32 vs float64',
      'Random numbers: default_rng, seeding, reproducibility',
      'save, load, npz, memmap for big telemetry',
      'Vectorisation as the default, and when it genuinely does not apply',
    ],
    objectives: [
      'Replace an explicit loop with an array expression and measure at least a fifty-fold speedup.',
      'Predict the result shape of a broadcast expression before running it.',
      'Say whether a given indexing expression produces a view or a copy, and prove it.',
      'Explain why solve(A, b) is preferable to inv(A) @ b in both accuracy and cost.',
      'Rotate a million vectors by a direction cosine matrix in one expression.',
    ],
    resources: [
      {
        title: 'NumPy: the absolute basics and NumPy fundamentals',
        author: 'NumPy developers',
        kind: 'docs',
        url: 'https://numpy.org/doc/stable/user/absolute_beginners.html',
        free: true,
      },
      {
        title: 'Python Data Science Handbook, Chapter 2',
        author: 'Jake VanderPlas',
        kind: 'book',
        url: 'https://jakevdp.github.io/PythonDataScienceHandbook/',
        free: true,
        note: 'Full text free online; chapter 2 is the NumPy treatment.',
      },
      {
        title: 'Scientific Python Lectures',
        author: 'Scientific Python community',
        kind: 'course',
        url: 'https://lectures.scientific-python.org/',
        free: true,
      },
    ],
    exercises: [
      {
        id: 'py03_ex1',
        title: 'Euler 3-2-1 to DCM, and a stacked skew operator',
        prompt:
          'Implement `dcm321(yaw, pitch, roll)` returning the 3x3 body-from-inertial direction cosine matrix for the aerospace 3-2-1 sequence (rotate about z by yaw, then y by pitch, then x by roll; angles in radians). Implement `skew(v)` taking an (N,3) array and returning (N,3,3) such that the skew matrix of a applied to b equals cross(a, b). Both must be pure NumPy with no Python loop over N.',
        kind: 'code',
        lang: 'python',
        starter:
          'import numpy as np\n\n\ndef dcm321(yaw, pitch, roll):\n    """Body-from-inertial DCM for the 3-2-1 sequence. Angles in radians."""\n    raise NotImplementedError\n\n\ndef skew(v):\n    """v: (N,3) -> (N,3,3) skew-symmetric matrices with skew(a) @ b == cross(a, b)."""\n    raise NotImplementedError\n',
        solution:
          'import numpy as np\n\n\ndef dcm321(yaw, pitch, roll):\n    cpsi, spsi = np.cos(yaw), np.sin(yaw)\n    cth, sth = np.cos(pitch), np.sin(pitch)\n    cph, sph = np.cos(roll), np.sin(roll)\n    r3 = np.array([[cpsi, spsi, 0.0], [-spsi, cpsi, 0.0], [0.0, 0.0, 1.0]])\n    r2 = np.array([[cth, 0.0, -sth], [0.0, 1.0, 0.0], [sth, 0.0, cth]])\n    r1 = np.array([[1.0, 0.0, 0.0], [0.0, cph, sph], [0.0, -sph, cph]])\n    return r1 @ r2 @ r3\n\n\ndef skew(v):\n    v = np.asarray(v, dtype=float)\n    n = v.shape[0]\n    out = np.zeros((n, 3, 3))\n    out[:, 0, 1] = -v[:, 2]\n    out[:, 0, 2] = v[:, 1]\n    out[:, 1, 0] = v[:, 2]\n    out[:, 1, 2] = -v[:, 0]\n    out[:, 2, 0] = -v[:, 1]\n    out[:, 2, 1] = v[:, 0]\n    return out\n',
        tests: [
          {
            name: 'DCM is a proper rotation',
            assert:
              'import numpy as np\nrng = np.random.default_rng(0)\nfor _ in range(20):\n    a, b, c = rng.uniform(-3, 3, 3)\n    C = dcm321(a, b, c)\n    assert C.shape == (3, 3)\n    assert np.allclose(C @ C.T, np.eye(3), atol=1e-12), "DCM must be orthonormal"\n    assert abs(np.linalg.det(C) - 1.0) < 1e-12, "determinant must be +1"\n',
          },
          {
            name: 'yaw of 90 degrees rotates x into -y',
            assert:
              'import numpy as np\nC = dcm321(np.pi / 2, 0.0, 0.0)\nassert np.allclose(C @ np.array([1.0, 0.0, 0.0]), np.array([0.0, -1.0, 0.0]), atol=1e-12), "check the 3-2-1 convention and sign of the sine terms"\nC = dcm321(0.0, np.pi / 2, 0.0)\nassert np.allclose(C @ np.array([1.0, 0.0, 0.0]), np.array([0.0, 0.0, 1.0]), atol=1e-12), "a 90 degree pitch must map body x onto inertial z in this convention"\n',
          },
          {
            name: 'skew reproduces the cross product',
            assert:
              'import numpy as np\nrng = np.random.default_rng(7)\nA = rng.normal(size=(50, 3))\nB = rng.normal(size=(50, 3))\nS = skew(A)\nassert S.shape == (50, 3, 3)\nassert np.allclose(np.einsum("nij,nj->ni", S, B), np.cross(A, B), atol=1e-12)\nassert np.allclose(S + np.transpose(S, (0, 2, 1)), 0.0, atol=1e-15), "must be skew-symmetric"\n',
            hidden: true,
          },
        ],
        hours: 3,
      },
      {
        id: 'py03_ex2',
        title: 'Vectorise the rotation loop',
        prompt:
          'Given a 3x3 DCM and an (N,3) array whose rows are vectors, implement `rotate_all(C, v)` returning (N,3) rows of C @ v_i, `norms(v)` returning (N,), and `unit(v)` returning unit vectors with zero-length rows left as zeros (no NaNs, no warnings). No Python-level loop over N is allowed.',
        kind: 'code',
        lang: 'python',
        starter:
          'import numpy as np\n\n\ndef rotate_all(C, v):\n    """C: (3,3), v: (N,3). Return (N,3) with row i equal to C @ v[i]."""\n    raise NotImplementedError\n\n\ndef norms(v):\n    """v: (N,3) -> (N,) Euclidean norms."""\n    raise NotImplementedError\n\n\ndef unit(v):\n    """v: (N,3) -> (N,3) unit vectors; zero rows stay exactly zero."""\n    raise NotImplementedError\n',
        solution:
          'import numpy as np\n\n\ndef rotate_all(C, v):\n    return np.asarray(v, dtype=float) @ np.asarray(C, dtype=float).T\n\n\ndef norms(v):\n    return np.linalg.norm(np.asarray(v, dtype=float), axis=1)\n\n\ndef unit(v):\n    v = np.asarray(v, dtype=float)\n    n = norms(v)\n    safe = np.where(n > 0.0, n, 1.0)\n    out = v / safe[:, None]\n    out[n == 0.0] = 0.0\n    return out\n',
        tests: [
          {
            name: 'rotate_all matches an explicit loop',
            assert:
              'import numpy as np\nrng = np.random.default_rng(3)\nC = np.array([[0.0, 1.0, 0.0], [-1.0, 0.0, 0.0], [0.0, 0.0, 1.0]])\nV = rng.normal(size=(200, 3))\nref = np.array([C @ row for row in V])\nout = rotate_all(C, V)\nassert out.shape == (200, 3)\nassert np.allclose(out, ref, atol=1e-12), "row i must be C @ v[i], watch the transpose"\n',
          },
          {
            name: 'norms shape and values',
            assert:
              'import numpy as np\nV = np.array([[3.0, 4.0, 0.0], [0.0, 0.0, 0.0], [1.0, 1.0, 1.0]])\nn = norms(V)\nassert n.shape == (3,)\nassert abs(n[0] - 5.0) < 1e-12 and n[1] == 0.0\nassert abs(n[2] - np.sqrt(3.0)) < 1e-12\n',
          },
          {
            name: 'unit leaves zero rows alone and never returns NaN',
            assert:
              'import numpy as np\nV = np.array([[3.0, 4.0, 0.0], [0.0, 0.0, 0.0], [-2.0, 0.0, 0.0]])\nU = unit(V)\nassert np.all(np.isfinite(U)), "zero-length rows must not produce NaN"\nassert np.allclose(U[0], [0.6, 0.8, 0.0], atol=1e-12)\nassert np.all(U[1] == 0.0)\nassert np.allclose(U[2], [-1.0, 0.0, 0.0], atol=1e-12)\n',
            hidden: true,
          },
        ],
        hours: 2,
      },
    ],
    cards: [
      {
        id: 'py03_c1',
        front: 'State the broadcasting rule',
        back:
          'Align shapes from the trailing axis. Two dimensions are compatible if they are equal or one of them is 1; a missing leading dimension counts as 1. The result takes the maximum along each axis.',
      },
      {
        id: 'py03_c2',
        front: 'a.shape = (3,1), b.shape = (1,4). What is (a+b).shape?',
        back:
          '(3,4). Each array is stretched along its length-1 axis, producing the outer combination. This is the mechanism behind most accidental memory explosions in NumPy code.',
      },
      {
        id: 'py03_c3',
        front: 'Is x[::2] a view or a copy?',
        back:
          'A view: basic slicing only changes offset, shape and strides. Mutating it changes the parent. Fancy indexing (x[[0,2,4]]) and boolean masking always copy.',
      },
      {
        id: 'py03_c4',
        front: 'Why prefer solve(A, b) over inv(A) @ b?',
        back:
          'solve factorises once and back-substitutes, costing about a third of the work of forming an explicit inverse, and it avoids the extra rounding of computing and then multiplying by the inverse. Explicit inverses are for when you genuinely need the matrix itself, which is rare.',
      },
      {
        id: 'py03_c5',
        front: 'What does axis= mean in a reduction?',
        back:
          'The axis that is collapsed. For an (N,3) array, sum(axis=0) gives 3 numbers (one per column) and sum(axis=1) gives N numbers (one per row). Say aloud which axis disappears.',
      },
      {
        id: 'py03_c6',
        front: 'Why compare DCMs with allclose rather than ==?',
        back:
          'Every trigonometric evaluation and matrix product introduces rounding at the 1e-16 level, so two mathematically identical matrices differ in their last bits. allclose applies rtol and atol; == will essentially always be False.',
      },
      {
        id: 'py03_c7',
        front: 'What is the condition number telling you?',
        back:
          'The factor by which relative input error can be amplified in the solution: a cond of 1e12 means you can lose twelve digits, and double precision has about sixteen. Check cond before trusting a least-squares or covariance result.',
      },
      {
        id: 'py03_c8',
        front: 'What does einsum("nij,nj->ni", A, b) compute?',
        back:
          'A batched matrix-vector product: for each n, the 3x3 matrix A[n] times the vector b[n]. It is the readable way to express stacked linear algebra without reshaping gymnastics.',
      },
      {
        id: 'py03_c9',
        front: 'float32 vs float64 in a GNC context',
        back:
          'float32 has about seven decimal digits, which is not enough for ECI positions in metres or for long-horizon integration. Use float64 by default and drop to float32 only for bulk storage or a memory-bound stage you have measured.',
      },
      {
        id: 'py03_c10',
        front: 'Why np.random.default_rng and not np.random.seed?',
        back:
          'The Generator API gives you an independent, explicitly seeded stream you can pass around, instead of a hidden global state that any library call can perturb. Reproducible Monte Carlo requires the explicit version.',
      },
      {
        id: 'py03_c11',
        front: 'What is catastrophic cancellation?',
        back:
          'Subtracting two nearly equal floating-point numbers destroys the leading significant digits, so the relative error of the result explodes. Reformulate the expression (for example the stable quadratic formula) rather than adding precision.',
      },
      {
        id: 'py03_c12',
        front: 'C order vs Fortran order: when does it matter?',
        back:
          'It determines which axis is contiguous in memory, so it changes cache behaviour of loops and reductions and whether a reshape can be a view. It also matters at library boundaries: LAPACK and Eigen default to column-major.',
      },
      {
        id: 'py03_c13',
        front: 'np.dot vs @ vs np.multiply',
        back:
          '@ (matmul) is matrix multiplication with batched semantics on the leading axes; np.dot behaves differently for arrays above two dimensions; np.multiply (and *) is element-wise. In GNC code, * where you meant @ is a silent-wrong-answer bug.',
      },
    ],
    quiz: [
      {
        id: 'py03_q1',
        q: 'a has shape (100,3) and b has shape (3,). What does a * b do?',
        choices: [
          'Raises a shape error',
          'Multiplies each row of a element-wise by b',
          'Computes the matrix product',
          'Multiplies each column of a by b',
        ],
        answer: 1,
        explain:
          'b is broadcast to (1,3) then to (100,3), so it scales the three components of every row. For a matrix product you need a @ b, which would be a shape error here unless b were (3,k).',
        b: 0.0,
        bloom: 'understand',
      },
      {
        id: 'py03_q2',
        q: 'y = x[2:5]; y[0] = 99. What is x[2]?',
        choices: ['Unchanged', '99, because basic slicing returns a view', 'NaN', 'Undefined'],
        answer: 1,
        explain:
          'Basic slicing produces a view over the same buffer. Use x[2:5].copy() when the caller must not see your edits.',
        b: 0.2,
        bloom: 'understand',
      },
      {
        id: 'py03_q3',
        q: 'Which is both the most accurate and cheapest way to get x from Ax = b for a 6x6 covariance-like symmetric positive definite A?',
        choices: [
          'np.linalg.inv(A) @ b',
          'np.linalg.solve(A, b)',
          'np.linalg.pinv(A) @ b',
          'np.linalg.lstsq(A, b)[0]',
        ],
        answer: 1,
        explain:
          'solve performs an LU (or Cholesky via scipy for SPD) factorisation and back-substitutes. pinv and lstsq are for rank-deficient or over-determined systems and cost far more, and forming inv is both slower and less accurate.',
        b: 0.4,
        bloom: 'apply',
      },
      {
        id: 'py03_q4',
        q: 'An (N,3) array of positions; you want the RMS of each component over time. Which expression?',
        choices: [
          'np.sqrt(np.mean(p**2, axis=1))',
          'np.sqrt(np.mean(p**2, axis=0))',
          'np.sqrt(np.mean(p, axis=0)**2)',
          'np.linalg.norm(p) / np.sqrt(len(p))',
        ],
        answer: 1,
        explain:
          'Collapsing axis 0 (time) leaves three numbers, one per component. axis=1 would give one number per sample, and the third option squares the mean instead of meaning the square.',
        b: 0.5,
        bloom: 'apply',
      },
      {
        id: 'py03_q5',
        q: 'x = np.arange(10); mask = x > 5; y = x[mask]; y[0] = 0. What happens to x?',
        choices: [
          'x[6] becomes 0',
          'x is unchanged, because boolean indexing copies',
          'An error is raised',
          'All of x above 5 becomes 0',
        ],
        answer: 1,
        explain:
          'Advanced (fancy and boolean) indexing always allocates a new array, unlike basic slicing. That asymmetry is the most common NumPy surprise.',
        b: 0.7,
        bloom: 'analyze',
      },
      {
        id: 'py03_q6',
        q: 'A loop over 10 million samples takes 40 s; a vectorised version takes 0.3 s. The main reason is:',
        choices: [
          'NumPy uses the GPU',
          'The per-element Python interpreter overhead and boxing are removed, and the inner loop runs in compiled, cache-friendly C',
          'NumPy uses lower precision',
          'The loop version was not compiled',
        ],
        answer: 1,
        explain:
          'Each Python iteration costs tens of nanoseconds of interpreter work and object handling; the array version pays that once and then runs a tight typed loop, often vectorised by the compiler.',
        b: 0.1,
        bloom: 'understand',
      },
      {
        id: 'py03_q7',
        q: 'Which statement about np.float32 in an orbit propagator is correct?',
        choices: [
          'It halves memory and is otherwise equivalent',
          'It gives about seven significant digits, so a position of 7,000,000 m is resolved no better than about a metre',
          'It is more accurate for small numbers',
          'NumPy promotes it to float64 automatically in all operations',
        ],
        answer: 1,
        explain:
          'Relative precision is roughly 1.2e-7, so the absolute resolution scales with magnitude. That is fatal for ECI positions and for accumulating integration error.',
        b: 0.8,
        bloom: 'analyze',
      },
      {
        id: 'py03_q8',
        q: 'You need reproducible dispersions across machines. Which is correct?',
        choices: [
          'Call np.random.seed(0) once at import',
          'Create one default_rng(seed) per case, derived from a recorded master seed, and pass it explicitly',
          'Use the system clock so runs are independent',
          'Reproducibility is impossible with floating point',
        ],
        answer: 1,
        explain:
          'Explicit generators avoid hidden global state that any import can disturb, and per-case seeds derived from a recorded master let you rerun exactly one failing case.',
        b: 0.6,
        bloom: 'apply',
      },
    ],
    tags: ['spacex-core', 'python', 'math'],
    importance: 1.5,
  },

  {
    id: 'cod_py_04_scipy',
    track: 'coding',
    tier: 4,
    title: 'SciPy for Engineering',
    summary:
      "The engineering half of the scientific stack: root finding and optimisation, dense linear algebra beyond NumPy, signal processing, interpolation, statistics for dispersions, and spatial.transform.Rotation for industrial-strength attitude handling.",
    prereqs: ['cod_py_03_numpy'],
    hours: 30,
    topics: [
      'scipy.optimize: brentq, root, fsolve, newton',
      'scipy.optimize: minimize, least_squares, curve_fit, differential_evolution',
      'Residuals, Jacobians, scaling and why conditioning of decision variables matters',
      'scipy.linalg: cholesky, qr, expm, solve_continuous_are and solve_discrete_are',
      'scipy.signal: butter, filtfilt vs lfilter, welch, bode, tf2ss, cont2discrete',
      'scipy.interpolate: interp1d, CubicSpline, RegularGridInterpolator for aero tables',
      'scipy.spatial.transform.Rotation: from_quat, as_quat, from_euler, as_matrix, slerp',
      'The scalar-last quaternion convention in SciPy and the scalar-first convention elsewhere',
      'scipy.stats: distributions, rvs, fit, percentile-based reporting for Monte Carlo',
      'scipy.constants and dimensional sanity',
      'Choosing a solver from the structure of the problem',
    ],
    objectives: [
      'Solve Kepler equation to machine precision and defend the choice of root finder.',
      'Fit a physical model to noisy data with least_squares and report parameter uncertainty.',
      'Convert a continuous-time plant to discrete at two rates and explain the difference.',
      'Interconvert quaternions between SciPy scalar-last and aerospace scalar-first without sign errors.',
      'Solve an algebraic Riccati equation and form the corresponding state-feedback gain.',
    ],
    resources: [
      {
        title: 'SciPy Reference Guide',
        author: 'SciPy developers',
        kind: 'docs',
        url: 'https://docs.scipy.org/doc/scipy/reference/',
        free: true,
      },
      {
        title: 'Orbital Mechanics for Engineering Students, 4th ed.',
        author: 'Howard D. Curtis',
        kind: 'book',
        free: false,
        note: 'The de-facto GNC text; its MATLAB algorithms port to SciPy almost line for line.',
      },
      {
        title: 'Scientific Python Lectures: optimization and signal processing',
        author: 'Scientific Python community',
        kind: 'course',
        url: 'https://lectures.scientific-python.org/',
        free: true,
      },
    ],
    exercises: [
      {
        id: 'py04_ex1',
        title: 'Kepler equation',
        prompt:
          'Implement `solve_kepler(M, e)` returning the eccentric anomaly E in radians satisfying E - e*sin(E) = M, for 0 <= e < 1 and any real M. Use a bracketed root finder or a damped Newton iteration; the result must satisfy the equation to better than 1e-12 for eccentricities up to 0.9. Reduce M to [0, 2*pi) first.',
        kind: 'code',
        lang: 'python',
        starter:
          'import numpy as np\nfrom scipy.optimize import brentq\n\n\ndef solve_kepler(M, e):\n    """Return E with E - e*sin(E) = M (radians), 0 <= e < 1."""\n    raise NotImplementedError\n',
        solution:
          'import numpy as np\nfrom scipy.optimize import brentq\n\n\ndef solve_kepler(M, e):\n    if not (0.0 <= e < 1.0):\n        raise ValueError("eccentricity must satisfy 0 <= e < 1")\n    two_pi = 2.0 * np.pi\n    k = np.floor(M / two_pi)\n    Mr = M - k * two_pi\n    f = lambda E: E - e * np.sin(E) - Mr\n    E = brentq(f, -1e-12, two_pi + 1e-12, xtol=1e-15, rtol=8.9e-16, maxiter=200)\n    return E + k * two_pi\n',
        tests: [
          {
            name: 'satisfies Kepler equation across e and M',
            assert:
              'import numpy as np\nfor e in (0.0, 0.1, 0.5, 0.9):\n    for M in np.linspace(0.0, 2 * np.pi, 17):\n        E = solve_kepler(M, e)\n        assert abs((E - e * np.sin(E)) - M) < 1e-10, f"residual too large for e={e}, M={M}"\n',
          },
          {
            name: 'circular orbit is the identity',
            assert:
              'import numpy as np\nfor M in (0.0, 1.0, 3.0, 6.0):\n    assert abs(solve_kepler(M, 0.0) - M) < 1e-12, "with e=0, E must equal M"\n',
          },
          {
            name: 'handles M outside one revolution',
            assert:
              'import numpy as np\nM = 2 * np.pi * 3 + 1.25\nE = solve_kepler(M, 0.3)\nassert abs((E - 0.3 * np.sin(E)) - M) < 1e-9, "must handle M beyond 2*pi"\n',
            hidden: true,
          },
        ],
        hours: 2.5,
      },
      {
        id: 'py04_ex2',
        title: 'Fit a decaying model to noisy test data',
        prompt:
          'A rate gyro bias decays as b(t) = a*exp(-t/tau) + c. Implement `fit_bias(t, y)` using scipy.optimize.least_squares to return (a, tau, c). Choose a sensible initial guess from the data rather than hard-coding the truth, and make the residual well scaled. The test uses seeded noise and requires each parameter within five percent of truth.',
        kind: 'code',
        lang: 'python',
        starter:
          'import numpy as np\nfrom scipy.optimize import least_squares\n\n\ndef fit_bias(t, y):\n    """Fit y = a*exp(-t/tau) + c. Return (a, tau, c) as floats."""\n    raise NotImplementedError\n',
        solution:
          'import numpy as np\nfrom scipy.optimize import least_squares\n\n\ndef fit_bias(t, y):\n    t = np.asarray(t, dtype=float)\n    y = np.asarray(y, dtype=float)\n    c0 = float(np.mean(y[-max(1, len(y) // 10):]))\n    a0 = float(y[0] - c0)\n    tau0 = float(max(t[-1] - t[0], 1e-6) / 3.0)\n\n    def resid(p):\n        a, tau, c = p\n        return a * np.exp(-t / tau) + c - y\n\n    sol = least_squares(\n        resid,\n        x0=[a0, tau0, c0],\n        bounds=([-np.inf, 1e-9, -np.inf], [np.inf, np.inf, np.inf]),\n    )\n    a, tau, c = sol.x\n    return float(a), float(tau), float(c)\n',
        tests: [
          {
            name: 'recovers the truth from noisy data',
            assert:
              'import numpy as np\nrng = np.random.default_rng(42)\nt = np.linspace(0.0, 60.0, 600)\ntruth = (0.02, 12.0, 0.003)\ny = truth[0] * np.exp(-t / truth[1]) + truth[2] + rng.normal(0.0, 2e-4, t.size)\na, tau, c = fit_bias(t, y)\nassert abs(a - truth[0]) < 0.05 * truth[0], f"a off: {a}"\nassert abs(tau - truth[1]) < 0.05 * truth[1], f"tau off: {tau}"\nassert abs(c - truth[2]) < 0.05 * truth[2], f"c off: {c}"\n',
          },
          {
            name: 'noiseless data is fit essentially exactly',
            assert:
              'import numpy as np\nt = np.linspace(0.0, 50.0, 400)\ny = 1.5 * np.exp(-t / 8.0) - 0.25\na, tau, c = fit_bias(t, y)\nassert abs(a - 1.5) < 1e-4 and abs(tau - 8.0) < 1e-4 and abs(c + 0.25) < 1e-5\n',
            hidden: true,
          },
        ],
        hours: 2.5,
      },
    ],
    cards: [
      {
        id: 'py04_c1',
        front: 'brentq vs fsolve vs newton: how do you choose?',
        back:
          'brentq when you can bracket a sign change in one dimension: it is guaranteed to converge and needs no derivative. newton when you have a good initial guess and a derivative, for speed. fsolve/root for multi-dimensional systems, where bracketing no longer exists.',
      },
      {
        id: 'py04_c2',
        front: 'least_squares vs minimize for a curve fit',
        back:
          'least_squares knows the objective is a sum of squared residuals, so it builds a Gauss-Newton/Levenberg-Marquardt approximation of the Hessian from the Jacobian. Handing the same problem to minimize as a scalar throws that structure away and converges far more slowly.',
      },
      {
        id: 'py04_c3',
        front: 'What convention does scipy.spatial.transform.Rotation use for quaternions?',
        back:
          'Scalar-last: (x, y, z, w). MATLAB Aerospace, Eigen constructors and most textbooks are scalar-first (w, x, y, z). Reordering is required at every boundary, and getting it wrong yields a rotation that looks plausible but is wrong.',
      },
      {
        id: 'py04_c4',
        front: 'Detecting a scalar-first/scalar-last mix-up in 30 seconds',
        back:
          'Feed a small rotation about one axis: the scalar part should be near 1 and the vector part near zero. If the near-1 element sits at the wrong end of the array, the convention is flipped. Round-tripping through a DCM also breaks immediately.',
      },
      {
        id: 'py04_c5',
        front: 'filtfilt vs lfilter',
        back:
          'lfilter is the causal difference equation with its inherent phase lag. filtfilt runs the filter forwards and backwards, giving zero phase distortion and double the order, but it is non-causal: perfectly valid in post-flight analysis, never valid inside a control loop.',
      },
      {
        id: 'py04_c6',
        front: 'What does cont2discrete with zoh model?',
        back:
          'A zero-order hold: the input is held constant over each sample period, which is exactly what a digital controller driving a DAC does. Tustin (bilinear) instead maps the s-plane to the z-plane conformally and preserves frequency response shape better near the prewarp frequency.',
      },
      {
        id: 'py04_c7',
        front: 'What is an algebraic Riccati equation used for here?',
        back:
          'Solving it gives the cost-to-go matrix P for an infinite-horizon LQR; the optimal gain is then K = R^-1 B^T P (continuous) or the discrete analogue. scipy.linalg.solve_continuous_are and solve_discrete_are compute P.',
        formula: true,
      },
      {
        id: 'py04_c8',
        front: 'Why scale decision variables before optimising?',
        back:
          'Solvers use one set of tolerances across all variables. If one parameter is 1e-6 and another is 1e6, the trust region and convergence tests are meaningless for one of them. Normalise to order 1, or supply x_scale.',
      },
      {
        id: 'py04_c9',
        front: 'curve_fit returns pcov. What is it?',
        back:
          'The estimated covariance of the fitted parameters; the square roots of the diagonal are one-sigma uncertainties, assuming the residuals are independent Gaussian with the scale implied by the fit. Report those, not just the point estimate.',
      },
      {
        id: 'py04_c10',
        front: 'RegularGridInterpolator: why does it matter in aerospace?',
        back:
          'Aerodynamic coefficient tables are functions of Mach, angle of attack and control deflection on a regular grid. It does multilinear interpolation on N-dimensional grids efficiently, which is what a 6-DOF sim calls thousands of times per second.',
      },
      {
        id: 'py04_c11',
        front: 'Welch method: what does it estimate and why not a raw FFT?',
        back:
          'It estimates the power spectral density by averaging windowed, overlapping periodograms, trading frequency resolution for variance reduction. A single raw FFT of noisy data has about 100 percent variance in every bin, no matter how long the record.',
      },
      {
        id: 'py04_c12',
        front: 'Given a plant and 40 ms of transport delay, what happens to phase margin?',
        back:
          'Delay adds phase lag linearly in frequency, minus omega times T radians, with no gain change. At the crossover frequency that subtracts directly from phase margin; 40 ms at 10 rad/s costs about 23 degrees.',
        formula: true,
      },
    ],
    quiz: [
      {
        id: 'py04_q1',
        q: 'You need the root of a scalar function that changes sign on [a, b] and you have no derivative. Which solver?',
        choices: ['scipy.optimize.newton', 'scipy.optimize.brentq', 'scipy.optimize.minimize', 'np.roots'],
        answer: 1,
        explain:
          'Brent method combines bisection with interpolation: guaranteed convergence within the bracket, superlinear in practice, no derivative required. newton can diverge without a good guess, and minimize solves a different problem.',
        b: -0.1,
        bloom: 'apply',
      },
      {
        id: 'py04_q2',
        q: 'A quaternion from SciPy as_quat() is passed straight into a MATLAB Aerospace quatrotate. What is the result?',
        choices: [
          'Correct, both use the same convention',
          'A wrong but plausible-looking rotation, because SciPy is scalar-last and Aerospace is scalar-first',
          'An error is raised immediately',
          'A rotation of the correct angle about a negated axis',
        ],
        answer: 1,
        explain:
          'The element order differs, so the scalar is interpreted as a vector component. Nothing raises; the numbers stay unit-norm and the error is silent.',
        b: 0.6,
        bloom: 'analyze',
      },
      {
        id: 'py04_q3',
        q: 'Why is filtfilt forbidden in a flight control loop?',
        choices: [
          'It is too slow',
          'It requires the entire future of the signal, so it is non-causal',
          'It is only defined for FIR filters',
          'It amplifies noise',
        ],
        answer: 1,
        explain:
          'Zero phase is achieved by a reverse pass over data that has not happened yet. In post-flight analysis that is free; in real time it is impossible.',
        b: 0.2,
        bloom: 'understand',
      },
      {
        id: 'py04_q4',
        q: 'least_squares is converging to a different answer depending on the initial guess. The most likely cause is:',
        choices: [
          'A bug in SciPy',
          'The residual surface has multiple local minima or the parameters are badly scaled and nearly degenerate',
          'Too many data points',
          'Double precision is insufficient',
        ],
        answer: 1,
        explain:
          'Non-linear least squares is local. Multiple minima, near-collinear parameters and poor scaling all produce guess-dependent answers; reparameterise, scale, or use a global start.',
        b: 0.7,
        bloom: 'analyze',
      },
      {
        id: 'py04_q5',
        q: 'Which is the correct use of scipy.linalg.solve_continuous_are in an LQR design?',
        choices: [
          'It returns the gain K directly',
          'It returns P, from which K = inv(R) @ B.T @ P',
          'It returns the closed-loop poles',
          'It returns the controllability matrix',
        ],
        answer: 1,
        explain:
          'The ARE solution is the cost-to-go matrix. The gain follows from P, and the closed-loop poles are then the eigenvalues of A - B K.',
        b: 0.8,
        bloom: 'apply',
      },
      {
        id: 'py04_q6',
        q: 'A Welch PSD of accelerometer data shows a sharp peak at 47 Hz that also appears in reaction-wheel speed telemetry. What do you conclude?',
        choices: [
          'The accelerometer is failing',
          'The wheel is exciting a structural response or injecting a disturbance at its running frequency',
          'Aliasing from a 94 Hz signal',
          'A software timing bug',
        ],
        answer: 1,
        explain:
          'Coincidence between a mechanical driver frequency and a structural peak is the classic wheel-induced jitter signature, and it is exactly why notch filters and wheel-speed avoidance zones exist.',
        b: 0.9,
        bloom: 'analyze',
      },
      {
        id: 'py04_q7',
        q: 'Discretising a continuous controller with cont2discrete at 50 Hz and 500 Hz, what changes?',
        choices: [
          'Nothing; discretisation is exact',
          'The 50 Hz version has more phase lag near crossover and may lose stability margin',
          'The 500 Hz version is less accurate',
          'Only the gain changes',
        ],
        answer: 1,
        explain:
          'Sampling introduces an effective half-sample delay plus hold dynamics. Lower rates eat phase margin; that is why the sample rate is part of the control design, not an afterthought.',
        b: 0.7,
        bloom: 'analyze',
      },
    ],
    tags: ['spacex-core', 'python', 'math'],
    importance: 1.45,
  },

  {
    id: 'cod_py_05_plotting',
    track: 'coding',
    tier: 4,
    title: 'Matplotlib and Flight-Data Handling',
    summary:
      "Plots are the deliverable a GNC engineer is judged on. Learn the figure-and-axes API properly, build publication-quality multi-panel reviews with three-sigma envelopes, and handle time-aligned multi-rate telemetry with pandas.",
    prereqs: ['cod_py_03_numpy'],
    hours: 25,
    topics: [
      'Figure and Axes object API versus the pyplot state machine',
      'subplots, shared axes, twin axes, gridspec, constrained layout',
      'Line, scatter, step, stem, errorbar, fill_between for sigma envelopes',
      'Log and semilog axes; annotated Bode, pole-zero and root-locus plots',
      'Ticks, locators, formatters, datetime axes',
      'Colour: colourblind-safe cycles, sequential vs diverging, when colour carries data',
      'Text, annotation, legends outside axes, units in every axis label',
      'Saving: vector formats, dpi, font embedding, figure size for a slide vs a report',
      'Animation and interactive review; Plotly for exploratory telemetry',
      'pandas: DataFrame, Series, DatetimeIndex, read_csv, read_parquet',
      'resample, rolling, interpolate, groupby and agg',
      'merge and merge_asof for aligning a 200 Hz IMU stream to 1 Hz GPS',
      'Downsampling for plotting without hiding transients (min/max decimation)',
    ],
    objectives: [
      'Produce a six-panel flight-review figure with a shared time axis, three-sigma shaded bands and correct units.',
      'Explain when to use fill_between with percentile bands rather than mean plus three sigma.',
      'Align two asynchronous telemetry streams onto a common time base and justify the tolerance.',
      'Downsample ten million points for a plot without losing a 30 ms transient.',
      'Export a figure that stays legible when printed in greyscale.',
    ],
    resources: [
      {
        title: 'Matplotlib Tutorials and the Quick Start Guide',
        author: 'Matplotlib developers',
        kind: 'docs',
        url: 'https://matplotlib.org/stable/users/explain/quick_start.html',
        free: true,
      },
      {
        title: 'Python for Data Analysis, 3rd ed.',
        author: 'Wes McKinney',
        kind: 'book',
        url: 'https://wesmckinney.com/book/',
        free: true,
        note: 'Free online from the author of pandas; chapters on time series and joins are the relevant ones.',
      },
      {
        title: 'Python Data Science Handbook, Chapters 3 and 4',
        author: 'Jake VanderPlas',
        kind: 'book',
        url: 'https://jakevdp.github.io/PythonDataScienceHandbook/',
        free: true,
      },
    ],
    exercises: [
      {
        id: 'py05_ex1',
        title: 'Dispersion envelope from a Monte Carlo ensemble',
        prompt:
          'Implement `envelope(runs)` where runs is an (M, N) array of M Monte Carlo cases sampled at the same N times. Return a dict with keys mean, lo3, hi3, p005, p995: the sample mean, mean minus and plus three sample standard deviations (use the unbiased, ddof=1 estimate), and the 0.5th and 99.5th percentiles across cases at each time. All outputs are length N.',
        kind: 'code',
        lang: 'python',
        starter:
          'import numpy as np\n\n\ndef envelope(runs):\n    """runs: (M, N). Return dict with mean, lo3, hi3, p005, p995, each (N,)."""\n    raise NotImplementedError\n',
        solution:
          'import numpy as np\n\n\ndef envelope(runs):\n    a = np.asarray(runs, dtype=float)\n    mean = a.mean(axis=0)\n    sd = a.std(axis=0, ddof=1)\n    return {\n        "mean": mean,\n        "lo3": mean - 3.0 * sd,\n        "hi3": mean + 3.0 * sd,\n        "p005": np.percentile(a, 0.5, axis=0),\n        "p995": np.percentile(a, 99.5, axis=0),\n    }\n',
        tests: [
          {
            name: 'shapes and keys',
            assert:
              'import numpy as np\nrng = np.random.default_rng(1)\nruns = rng.normal(size=(500, 40))\ne = envelope(runs)\nassert set(e) == {"mean", "lo3", "hi3", "p005", "p995"}\nfor k, v in e.items():\n    assert np.asarray(v).shape == (40,), f"{k} must have shape (40,)"\n',
          },
          {
            name: 'statistics are correct',
            assert:
              'import numpy as np\nruns = np.array([[1.0, 2.0], [3.0, 4.0], [5.0, 12.0]])\ne = envelope(runs)\nassert np.allclose(e["mean"], [3.0, 6.0])\nsd = np.std(runs, axis=0, ddof=1)\nassert np.allclose(e["hi3"], e["mean"] + 3 * sd), "use the ddof=1 sample standard deviation"\nassert np.allclose(e["lo3"], e["mean"] - 3 * sd)\n',
          },
          {
            name: 'percentiles bracket the data',
            assert:
              'import numpy as np\nrng = np.random.default_rng(5)\nruns = rng.normal(size=(1000, 10))\ne = envelope(runs)\nassert np.all(e["p005"] <= e["p995"])\nassert np.all(e["p005"] >= runs.min(axis=0) - 1e-12)\nassert np.all(e["p995"] <= runs.max(axis=0) + 1e-12)\n',
            hidden: true,
          },
        ],
        hours: 2,
      },
      {
        id: 'py05_ex2',
        title: 'Align a fast stream onto a slow one',
        prompt:
          'Implement `align_nearest(t_fast, x_fast, t_slow, tol)` doing what pandas merge_asof with direction nearest does: for each time in t_slow (sorted ascending), return the x_fast sample whose timestamp is nearest, or NaN if the nearest sample is further away than tol. t_fast is sorted ascending. Use np.searchsorted, not a Python loop over t_slow.',
        kind: 'code',
        lang: 'python',
        starter:
          'import numpy as np\n\n\ndef align_nearest(t_fast, x_fast, t_slow, tol):\n    """Return (len(t_slow),) array of nearest x_fast values, NaN beyond tol."""\n    raise NotImplementedError\n',
        solution:
          'import numpy as np\n\n\ndef align_nearest(t_fast, x_fast, t_slow, tol):\n    tf = np.asarray(t_fast, dtype=float)\n    xf = np.asarray(x_fast, dtype=float)\n    ts = np.asarray(t_slow, dtype=float)\n    if tf.size == 0:\n        return np.full(ts.shape, np.nan)\n    idx = np.searchsorted(tf, ts)\n    left = np.clip(idx - 1, 0, tf.size - 1)\n    right = np.clip(idx, 0, tf.size - 1)\n    dl = np.abs(ts - tf[left])\n    dr = np.abs(tf[right] - ts)\n    pick = np.where(dl <= dr, left, right)\n    dist = np.minimum(dl, dr)\n    out = xf[pick].astype(float)\n    out[dist > tol] = np.nan\n    return out\n',
        tests: [
          {
            name: 'exact hits',
            assert:
              'import numpy as np\ntf = np.arange(0.0, 1.0, 0.005)\nxf = np.sin(2 * np.pi * tf)\nts = np.array([0.0, 0.25, 0.5, 0.995])\nout = align_nearest(tf, xf, ts, 0.003)\nassert np.allclose(out, np.sin(2 * np.pi * ts), atol=1e-12), "exact timestamps must return the exact samples"\n',
          },
          {
            name: 'nearest not previous',
            assert:
              'import numpy as np\ntf = np.array([0.0, 1.0, 2.0])\nxf = np.array([10.0, 20.0, 30.0])\nout = align_nearest(tf, xf, np.array([0.9, 1.4, 1.6]), 1.0)\nassert np.allclose(out, [20.0, 20.0, 30.0]), "must pick the nearest sample in either direction"\n',
          },
          {
            name: 'gaps become NaN',
            assert:
              'import numpy as np\ntf = np.array([0.0, 10.0])\nxf = np.array([1.0, 2.0])\nout = align_nearest(tf, xf, np.array([5.0, 9.9]), 0.5)\nassert np.isnan(out[0]), "a 5 s gap with tol=0.5 must be NaN"\nassert abs(out[1] - 2.0) < 1e-12\nassert np.isnan(align_nearest(np.array([]), np.array([]), np.array([1.0]), 1.0)[0])\n',
            hidden: true,
          },
        ],
        hours: 2.5,
      },
      {
        id: 'py05_ex3',
        title: 'Six-panel flight review figure',
        prompt:
          'Build one figure with six stacked panels sharing a time axis: altitude, Mach, dynamic pressure, angle of attack, commanded versus actual gimbal angle, and body rates. Add a shaded three-sigma band from a Monte Carlo ensemble on the angle-of-attack panel, mark staging and MECO with vertical lines, label every axis with units, and export to PDF at a size that stays legible on a slide. Deliverable: the figure plus a paragraph on what a reviewer should notice first.',
        kind: 'build',
        hours: 4,
      },
    ],
    cards: [
      {
        id: 'py05_c1',
        front: 'Why prefer fig, ax = plt.subplots() over plt.plot()?',
        back:
          'It gives you explicit Figure and Axes objects instead of relying on a hidden current-axes state. Functions that take an ax argument compose into multi-panel figures; functions that call plt.plot do not.',
      },
      {
        id: 'py05_c2',
        front: 'Mean plus three sigma, or the 0.5th and 99.5th percentiles?',
        back:
          'Three sigma assumes near-Gaussian behaviour and is what most requirements are written in. Percentiles make no distributional assumption and are what you report when the dispersion is skewed or bounded, for example by a saturation. Show both when the difference is large; it is itself a finding.',
      },
      {
        id: 'py05_c3',
        front: 'What does fill_between get used for in GNC plots?',
        back:
          'Shaded envelopes: dispersion bands, requirement corridors, filter three-sigma covariance bounds around an error. A band plus the mean conveys an ensemble far better than 500 overplotted lines.',
      },
      {
        id: 'py05_c4',
        front: 'What does merge_asof do that merge cannot?',
        back:
          'It joins on nearest time rather than exact equality, with a direction and a tolerance. That is the only sane way to align a 200 Hz IMU stream with 1 Hz GPS fixes, where no two timestamps ever match exactly.',
      },
      {
        id: 'py05_c5',
        front: 'Naive decimation of ten million points for a plot: what is the risk?',
        back:
          'Taking every Nth sample can step straight over a short transient, so a 30 ms spike vanishes from the figure. Use min/max decimation per pixel column, which preserves the visual extremes at the same cost.',
      },
      {
        id: 'py05_c6',
        front: 'resample vs rolling in pandas',
        back:
          'resample changes the sampling rate by grouping into time bins and aggregating, producing a new index. rolling keeps the index and computes a moving statistic over a window. Downsampling telemetry is resample; a moving average is rolling.',
      },
      {
        id: 'py05_c7',
        front: 'Why label axes with units, always?',
        back:
          'Because the reader cannot tell metres from feet or radians from degrees from the numbers, and in aerospace that ambiguity has destroyed vehicles. The axis label is the cheapest interface control document in the business.',
      },
      {
        id: 'py05_c8',
        front: 'Which figure format for a report and why?',
        back:
          'A vector format (PDF or SVG) so text stays selectable and lines stay sharp at any zoom. Raster (PNG at 200+ dpi) only when the figure has a huge number of elements or an image layer.',
      },
      {
        id: 'py05_c9',
        front: 'Rule for colour in an engineering plot',
        back:
          'Colour may encode a category, never a critical distinction on its own: use line style or markers as well, keep to a colourblind-safe cycle, and check the figure in greyscale. Two signals distinguished only by red versus green is a defect.',
      },
      {
        id: 'py05_c10',
        front: 'Twin axes: when is it right and when is it a trap?',
        back:
          'Right when two quantities share a time base and genuinely need different units, for example altitude and Mach. A trap when the two vertical scales are chosen so the curves appear to correlate; readers infer a relationship from crossings that mean nothing.',
      },
      {
        id: 'py05_c11',
        front: 'What is a DatetimeIndex worth in telemetry work?',
        back:
          'It makes resample, rolling with a time window, time-based slicing and merge_asof work, and it keeps time zone information explicit. Storing time as a float of seconds since an unstated epoch is how ground and vehicle clocks quietly diverge.',
      },
      {
        id: 'py05_c12',
        front: 'Your plot shows data but hides the requirement. What is missing?',
        back:
          'The limit line. An engineering figure should show the measured quantity, the requirement or predicted envelope, and the margin between them; otherwise the reader has to remember the spec to interpret the picture.',
      },
    ],
    quiz: [
      {
        id: 'py05_q1',
        q: 'You have 500 Monte Carlo trajectories to show on one axis. Best presentation?',
        choices: [
          'Plot all 500 lines at full opacity',
          'Plot the mean with a shaded three-sigma or percentile band, plus a handful of representative cases and any violators',
          'Plot only the worst case',
          'Plot the first 20 runs',
        ],
        answer: 1,
        explain:
          'The band conveys the distribution, the representative traces convey shape, and the violators are what the reviewer actually needs to see. Overplotting hides all three.',
        b: 0.0,
        bloom: 'apply',
      },
      {
        id: 'py05_q2',
        q: 'A 200 Hz IMU log and 1 Hz GPS fixes must go into one table. Which pandas operation?',
        choices: [
          'merge on the timestamp column',
          'concat along axis 1',
          'merge_asof with direction nearest and a tolerance',
          'join on the index',
        ],
        answer: 2,
        explain:
          'Exact-equality joins find no matches between asynchronous clocks. merge_asof matches nearest in time, and the tolerance encodes how much skew you are willing to accept.',
        b: 0.4,
        bloom: 'apply',
      },
      {
        id: 'py05_q3',
        q: 'Why does every Nth-sample decimation risk misleading a reviewer?',
        choices: [
          'It changes the mean',
          'It can skip entirely over short transients, so a real excursion never appears',
          'It aliases the DC component',
          'It requires interpolation',
        ],
        answer: 1,
        explain:
          'Plotting is a form of sampling. Min/max decimation per pixel keeps the extremes, which is what a reviewer is scanning for.',
        b: 0.5,
        bloom: 'analyze',
      },
      {
        id: 'py05_q4',
        q: 'Which axis label is acceptable in a flight review?',
        choices: ['alt', 'Altitude', 'Altitude (m, WGS-84 ellipsoidal)', 'y'],
        answer: 2,
        explain:
          'Quantity, unit and, where it is ambiguous, the reference. Altitude above the ellipsoid and altitude above mean sea level differ by tens of metres.',
        b: -0.6,
        bloom: 'understand',
      },
      {
        id: 'py05_q5',
        q: 'The three-sigma band on your filter error plot contains only 85 percent of the errors. What does that indicate?',
        choices: [
          'Normal statistical variation',
          'The filter covariance is optimistic; Q or R is mistuned or an error source is unmodelled',
          'Too few Monte Carlo cases',
          'The plot units are wrong',
        ],
        answer: 1,
        explain:
          'A consistent filter should keep roughly 99.7 percent of errors inside three sigma. Systematic escape means the reported covariance understates the true error, which is the classic symptom of an unmodelled bias or an under-sized process noise.',
        b: 1.1,
        bloom: 'analyze',
      },
      {
        id: 'py05_q6',
        q: 'Which statement about df.resample("1min").mean() is true?',
        choices: [
          'It requires a DatetimeIndex (or an explicit on= column)',
          'It computes a moving average without changing the index',
          'It is identical to rolling(60).mean()',
          'It works only on integer indices',
        ],
        answer: 0,
        explain:
          'resample is a time-based groupby, so it needs time-aware index or column, and it returns one row per bin rather than one row per original sample.',
        b: 0.3,
        bloom: 'recall',
      },
      {
        id: 'py05_q7',
        q: 'Best reason to export a Bode plot as PDF rather than PNG for a design review package?',
        choices: [
          'Smaller file size always',
          'Vector output keeps thin phase-margin annotations sharp when the reviewer zooms in',
          'PDF supports more colours',
          'PNG cannot show log axes',
        ],
        answer: 1,
        explain:
          'Reviewers zoom into the crossover region. Vector geometry and embedded text survive that; a rasterised figure does not.',
        b: -0.2,
        bloom: 'understand',
      },
    ],
    tags: ['spacex-core', 'python'],
    importance: 1.3,
  },

  {
    id: 'cod_py_06_testing',
    track: 'coding',
    tier: 4,
    title: 'Testing with pytest and Engineering Hygiene',
    summary:
      "Numerical code is only trustworthy if it is tested, and numerical tests need tolerances, properties and golden files rather than equality. This is pytest, Hypothesis, coverage and the regression pattern that actually protects a simulator.",
    prereqs: ['cod_py_03_numpy', 'cod_git_02_collab'],
    hours: 25,
    topics: [
      'pytest discovery rules, plain assert, and the rewritten assertion output',
      'pytest.approx and its rel/abs semantics; the 1e-6 relative default',
      'numpy.testing assert_allclose and assert_array_equal',
      'parametrize for tables of cases; ids for readable failures',
      'Fixtures, scopes, conftest.py, tmp_path, monkeypatch',
      'Markers, -k, -x, --lf, and keeping the fast suite fast',
      'Property-based testing with Hypothesis; invariants over examples',
      'Golden-file regression tests with explicit tolerances',
      'Testing numerical code: invariants, convergence order, conservation laws',
      'Test doubles: fakes and mocks for sensors and hardware interfaces',
      'Coverage with pytest-cov, and why coverage is a floor not a goal',
      'ruff, black, mypy and pre-commit hooks',
      'Docstrings in NumPy style and doctest',
    ],
    objectives: [
      'Write tests for a rotation library that would catch a sign error, using invariants rather than hard-coded outputs.',
      'Choose correctly between relative and absolute tolerance for a value that passes through zero.',
      'Parametrize a solver test over initial conditions with readable case ids.',
      'Build a golden-file regression test that survives a compiler change but catches a physics change.',
      'Explain how to test an integrator whose long-horizon output is chaotic.',
    ],
    resources: [
      {
        title: 'pytest documentation: Get Started, Parametrizing, Fixtures',
        author: 'pytest developers',
        kind: 'docs',
        url: 'https://docs.pytest.org/',
        free: true,
      },
      {
        title: 'Python Testing with pytest, 2nd ed.',
        author: 'Brian Okken',
        kind: 'book',
        free: false,
      },
      {
        title: 'Hypothesis documentation',
        author: 'David MacIver and contributors',
        kind: 'docs',
        url: 'https://hypothesis.readthedocs.io/',
        free: true,
      },
      {
        title: 'NumPy testing guidelines',
        author: 'NumPy developers',
        kind: 'docs',
        url: 'https://numpy.org/doc/stable/reference/testing.html',
        free: true,
      },
    ],
    exercises: [
      {
        id: 'py06_ex1',
        title: 'Implement approx-equality with the right semantics',
        prompt:
          'Implement `close(a, b, rel=1e-6, abs_=1e-12)` returning True when |a-b| <= max(abs_, rel*max(|a|,|b|)), and `assert_close(a, b, ...)` that raises AssertionError with a message containing both values and the actual error when they differ. This is the comparison every numerical test needs, and writing it once makes the rel-versus-abs distinction concrete.',
        kind: 'code',
        lang: 'python',
        starter:
          'def close(a, b, rel=1e-6, abs_=1e-12):\n    """True when a and b agree to within a relative or absolute tolerance."""\n    raise NotImplementedError\n\n\ndef assert_close(a, b, rel=1e-6, abs_=1e-12):\n    """Raise AssertionError naming a, b and the error when they differ."""\n    raise NotImplementedError\n',
        solution:
          'def close(a, b, rel=1e-6, abs_=1e-12):\n    err = abs(a - b)\n    return err <= max(abs_, rel * max(abs(a), abs(b)))\n\n\ndef assert_close(a, b, rel=1e-6, abs_=1e-12):\n    if not close(a, b, rel, abs_):\n        raise AssertionError(\n            f"values differ: a={a!r} b={b!r} err={abs(a - b)!r} rel={rel!r} abs={abs_!r}"\n        )\n',
        tests: [
          {
            name: 'relative tolerance scales with magnitude',
            assert:
              'assert close(1e6, 1e6 + 0.5, rel=1e-6)\nassert not close(1e6, 1e6 + 5.0, rel=1e-6)\nassert close(1.0, 1.0 + 1e-7, rel=1e-6)\nassert not close(1.0, 1.0 + 1e-4, rel=1e-6)\n',
          },
          {
            name: 'absolute tolerance rescues values near zero',
            assert:
              'assert close(0.0, 1e-13), "a pure relative tolerance can never pass at exactly zero"\nassert not close(0.0, 1e-9)\nassert close(0.0, 1e-9, abs_=1e-8)\n',
          },
          {
            name: 'assert_close reports the numbers',
            assert:
              'assert_close(2.0, 2.0 + 1e-9)\ntry:\n    assert_close(1.0, 2.0)\nexcept AssertionError as exc:\n    msg = str(exc)\n    assert "1.0" in msg and "2.0" in msg, "the message must contain both values"\nelse:\n    raise AssertionError("assert_close must raise when values differ")\n',
            hidden: true,
          },
        ],
        hours: 1.5,
      },
      {
        id: 'py06_ex2',
        title: 'Property checks for a rotation matrix',
        prompt:
          'Implement `rotation_violations(C, tol=1e-9)` returning a sorted list of strings naming which invariants a candidate 3x3 matrix fails: "orthonormal" when C @ C.T is not the identity within tol, "determinant" when det(C) is not +1 within tol, and "finite" when any entry is not finite. A proper rotation returns an empty list. This is how you test a rotation library without hard-coding expected matrices.',
        kind: 'code',
        lang: 'python',
        starter:
          'import numpy as np\n\n\ndef rotation_violations(C, tol=1e-9):\n    """Return sorted list of failed invariants among finite, orthonormal, determinant."""\n    raise NotImplementedError\n',
        solution:
          'import numpy as np\n\n\ndef rotation_violations(C, tol=1e-9):\n    C = np.asarray(C, dtype=float)\n    bad = []\n    if not np.all(np.isfinite(C)):\n        return ["finite"]\n    if not np.allclose(C @ C.T, np.eye(3), atol=tol, rtol=0.0):\n        bad.append("orthonormal")\n    if abs(float(np.linalg.det(C)) - 1.0) > tol:\n        bad.append("determinant")\n    return sorted(bad)\n',
        tests: [
          {
            name: 'a proper rotation passes',
            assert:
              'import numpy as np\nth = 0.7\nC = np.array([[np.cos(th), np.sin(th), 0.0], [-np.sin(th), np.cos(th), 0.0], [0.0, 0.0, 1.0]])\nassert rotation_violations(C) == [], "a proper rotation must report no violations"\n',
          },
          {
            name: 'a reflection fails on determinant only',
            assert:
              'import numpy as np\nC = np.diag([1.0, 1.0, -1.0])\nassert rotation_violations(C) == ["determinant"], "a reflection is orthonormal but has det -1"\n',
          },
          {
            name: 'scaling and non-finite entries',
            assert:
              'import numpy as np\nshear = np.array([[1.0, 1.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]])\nassert rotation_violations(shear) == ["orthonormal"], "a unit-determinant shear is not orthonormal"\nassert rotation_violations(2.0 * np.eye(3)) == ["determinant", "orthonormal"]\nbad = np.eye(3).copy()\nbad[0, 0] = np.nan\nassert rotation_violations(bad) == ["finite"]\n',
            hidden: true,
          },
        ],
        hours: 2,
      },
    ],
    cards: [
      {
        id: 'py06_c1',
        front: 'What is pytest.approx default tolerance?',
        back:
          'Relative 1e-6 with an absolute floor of 1e-12. That is far looser than double precision, so for a tight numerical check you must state the tolerance you actually mean.',
      },
      {
        id: 'py06_c2',
        front: 'rel or abs tolerance for a velocity component that passes through zero?',
        back:
          'Absolute. A relative tolerance around zero demands exact equality, so the test fails on noise at 1e-18. State an absolute floor that reflects the physically meaningful resolution.',
      },
      {
        id: 'py06_c3',
        front: 'Why assert_allclose rather than assert_array_equal for floats?',
        back:
          'assert_array_equal requires bit-for-bit equality, which differs across BLAS builds, vectorisation and compilers. assert_allclose takes rtol and atol and prints the worst mismatch and its index when it fails.',
      },
      {
        id: 'py06_c4',
        front: 'What does @pytest.mark.parametrize buy over a loop in the test body?',
        back:
          'Each case becomes a separate test: they all run even if one fails, failures name the specific case, and you can select or mark individual cases. A loop stops at the first failure and hides the rest.',
      },
      {
        id: 'py06_c5',
        front: 'Fixture scopes: function, class, module, session',
        back:
          'They control how often the fixture is built and torn down. A reference orbit that costs ten seconds belongs at session scope; anything mutable that tests could contaminate belongs at function scope.',
      },
      {
        id: 'py06_c6',
        front: 'How do you test an integrator whose trajectory is chaotic?',
        back:
          'Do not test the trajectory. Test the properties: convergence order under step halving, conservation of energy or of a known integral, time-reversibility for a symplectic scheme, and agreement with an analytic solution on a non-chaotic subproblem.',
      },
      {
        id: 'py06_c7',
        front: 'What is a golden-file regression test?',
        back:
          'A committed reference output plus a comparison at a stated tolerance. It answers the question no unit test can: did anything about this simulation change. The tolerance is part of the contract and must be justified, not tuned until green.',
      },
      {
        id: 'py06_c8',
        front: 'What does property-based testing add?',
        back:
          'It generates many inputs and checks invariants, so it explores cases you would not have written: near-singular angles, huge magnitudes, denormals. Hypothesis also shrinks a failure to a minimal reproducing example.',
      },
      {
        id: 'py06_c9',
        front: 'Name three good invariants for a quaternion library',
        back:
          'Unit norm is preserved by multiplication; q and -q give the same rotation matrix; converting to a DCM and back reproduces the original rotation. None of these require a hard-coded expected value.',
      },
      {
        id: 'py06_c10',
        front: 'Coverage is 95 percent. What can you still not conclude?',
        back:
          'That the code is correct. Coverage records executed lines, not checked behaviour, and it says nothing about untested inputs, missing requirements or wrong tolerances. It is a floor for finding untested code, not evidence of correctness.',
      },
      {
        id: 'py06_c11',
        front: 'What does monkeypatch do, and when should you not use it?',
        back:
          'It replaces attributes, environment variables or dictionary entries for the duration of one test, undoing them after. Avoid it when the need for patching is telling you the dependency should have been injected as a parameter instead.',
      },
      {
        id: 'py06_c12',
        front: 'Why does a deliberately injected sign error belong in your workflow?',
        back:
          'It is the only way to know your tests can fail. Flip a sign, confirm the suite goes red and that the failure message points at the cause, then revert. A suite that never fails is measuring nothing.',
      },
      {
        id: 'py06_c13',
        front: 'conftest.py: what is it for?',
        back:
          'Fixtures and hooks shared by every test in that directory and below, with no import needed. It is also where you register markers and command-line options for the suite.',
      },
    ],
    quiz: [
      {
        id: 'py06_q1',
        q: 'Which assertion is appropriate for a computed thrust of about 7.6e6 N?',
        choices: [
          'assert thrust == 7.607e6',
          'assert thrust == pytest.approx(7.607e6, rel=1e-6)',
          'assert round(thrust) == 7607000',
          'assert abs(thrust - 7.607e6) < 1e-12',
        ],
        answer: 1,
        explain:
          'A relative tolerance is the right shape for a large non-zero value. Exact equality fails on the last bit and the 1e-12 absolute test is absurdly tight at this magnitude.',
        b: -0.3,
        bloom: 'apply',
      },
      {
        id: 'py06_q2',
        q: 'A test asserts a lateral velocity is approximately zero and fails intermittently with values around 3e-17. The fix is:',
        choices: [
          'Increase the relative tolerance',
          'Use an absolute tolerance chosen from the physically meaningful resolution',
          'Round the result to six decimals',
          'Skip the test on that platform',
        ],
        answer: 1,
        explain:
          'Relative tolerance is meaningless at zero. Pick an absolute floor, for example 1e-9 m/s, and document why that is the resolution you care about.',
        b: 0.4,
        bloom: 'apply',
      },
      {
        id: 'py06_q3',
        q: 'Which test would catch a sign error in a rotation about the z axis without hard-coding a matrix?',
        choices: [
          'Checking the matrix is orthonormal',
          'Checking det(C) == 1',
          'Checking that rotating the x axis by +90 degrees gives the expected axis, i.e. an explicit directional case',
          'Checking all entries are finite',
        ],
        answer: 2,
        explain:
          'A sign flip still yields an orthonormal matrix with determinant one. Handedness needs at least one directed example; invariants alone cannot see it.',
        b: 1.0,
        bloom: 'analyze',
      },
      {
        id: 'py06_q4',
        q: 'Your golden-file regression fails after a NumPy upgrade with differences of 2e-16. What is the correct action?',
        choices: [
          'Regenerate the golden file and move on',
          'Confirm the tolerance reflects double-precision reality, and if it does, widen it with a documented justification',
          'Pin NumPy forever',
          'Delete the test',
        ],
        answer: 1,
        explain:
          'Last-bit differences are expected across library versions. Regenerating silently destroys the baseline; the right move is to reason about and document the tolerance.',
        b: 0.8,
        bloom: 'analyze',
      },
      {
        id: 'py06_q5',
        q: 'What does a session-scoped fixture risk?',
        choices: [
          'Slower test runs',
          'Cross-test contamination if the object is mutable and a test modifies it',
          'Incompatibility with parametrize',
          'Loss of coverage data',
        ],
        answer: 1,
        explain:
          'One shared instance means one test mutation is visible to every later test, which produces order-dependent failures. Share only immutable or rebuilt-on-demand state.',
        b: 0.7,
        bloom: 'understand',
      },
      {
        id: 'py06_q6',
        q: 'Hypothesis finds that your Euler-to-quaternion conversion fails at pitch = pi/2. This is:',
        choices: [
          'A false positive, since that input is unlikely',
          'A real defect: gimbal lock is a physical singularity the code must handle explicitly',
          'A floating-point rounding artefact',
          'Evidence the property was wrong',
        ],
        answer: 1,
        explain:
          'Pitch of ninety degrees is exactly where the 3-2-1 sequence degenerates. Property testing surfacing it is the tool doing its job, and vehicles do fly through that attitude.',
        b: 0.6,
        bloom: 'analyze',
      },
      {
        id: 'py06_q7',
        q: 'Which statement about coverage is correct?',
        choices: [
          '100 percent line coverage implies the tests assert correct behaviour',
          'Coverage measures execution, so a test with no assertions still raises it',
          'Coverage and MC/DC are the same measure',
          'Coverage proves the requirements are met',
        ],
        answer: 1,
        explain:
          'This is precisely why a coverage gate is a floor. It tells you what was never run; it says nothing about what was checked.',
        b: 0.2,
        bloom: 'understand',
      },
      {
        id: 'py06_q8',
        q: 'A physical test fixture is unavailable. How should the sensor interface be tested?',
        choices: [
          'Skip those tests until hardware arrives',
          'Inject a fake implementing the same interface, and verify the code against recorded real data as well',
          'Comment out the hardware calls',
          'Test only in hardware-in-the-loop',
        ],
        answer: 1,
        explain:
          'A seam at the interface lets you test logic now and swap the real driver later; recorded data guards against the fake drifting away from reality.',
        b: 0.3,
        bloom: 'apply',
      },
    ],
    tags: ['spacex-core', 'python', 'testing'],
    importance: 1.4,
  },

  {
    id: 'cod_py_07_integration',
    track: 'coding',
    tier: 5,
    title: 'Numerical Integration of Dynamics',
    summary:
      "The central computational skill of simulation: choosing and driving an ODE solver. Fixed-step Runge-Kutta by hand, then solve_ivp with RK45, DOP853, Radau and BDF, tolerance selection, event detection and conservation checks.",
    prereqs: ['cod_py_04_scipy'],
    hours: 35,
    topics: [
      'The initial value problem and local versus global truncation error',
      'Euler, RK2, classic RK4 implemented by hand; order verification by step halving',
      'Embedded pairs and adaptive step size control',
      'solve_ivp methods: RK45, RK23, DOP853, Radau, BDF, LSODA',
      'rtol and atol: what each controls and how to choose them from the state magnitudes',
      't_eval versus dense_output',
      'Events: terminal, direction, apogee and impact detection',
      'Stiffness: how to recognise it and when to switch to an implicit method',
      'Energy and Jacobi-constant drift as an independent accuracy check',
      'Symplectic integrators and long-horizon propagation',
      'Discontinuities: staging, thrust cutoff and why you restart the solver',
      'Fixed-step integration for real-time and code generation',
    ],
    objectives: [
      'Implement RK4 and demonstrate fourth-order convergence numerically.',
      'Propagate a two-body orbit for many revolutions and bound the relative energy drift.',
      'Choose a method and tolerances for a stated accuracy requirement and defend the choice.',
      'Locate an apogee crossing to sub-millisecond accuracy with an event function.',
      'Recognise stiffness from solver behaviour rather than from theory alone.',
    ],
    resources: [
      {
        title: 'SciPy: solve_ivp reference',
        author: 'SciPy developers',
        kind: 'docs',
        url: 'https://docs.scipy.org/doc/scipy/reference/generated/scipy.integrate.solve_ivp.html',
        free: true,
      },
      {
        title: 'Solving Ordinary Differential Equations I: Nonstiff Problems',
        author: 'Ernst Hairer, Syvert Norsett, Gerhard Wanner',
        kind: 'book',
        free: false,
        note: 'The reference behind DOP853 and the adaptive step-size theory.',
      },
      {
        title: 'Orbital Mechanics for Engineering Students, 4th ed.',
        author: 'Howard D. Curtis',
        kind: 'book',
        free: false,
        note: 'Chapters 2-3 for the two-body problem and the orbit-propagation algorithms.',
      },
    ],
    exercises: [
      {
        id: 'py07_ex1',
        title: 'RK4 by hand and its convergence order',
        prompt:
          'Implement `rk4_step(f, t, y, h)` performing one classic four-stage Runge-Kutta step, and `integrate(f, y0, t0, t1, n)` taking exactly n uniform steps and returning (ts, ys) with ts of length n+1 and ys of shape (n+1, len(y0)). f(t, y) returns an array-like derivative. The test verifies fourth-order convergence, so the coefficients must be exactly right.',
        kind: 'code',
        lang: 'python',
        starter:
          'import numpy as np\n\n\ndef rk4_step(f, t, y, h):\n    """One classic RK4 step. Return the new state as a 1-D array."""\n    raise NotImplementedError\n\n\ndef integrate(f, y0, t0, t1, n):\n    """n uniform RK4 steps from t0 to t1. Return (ts, ys) with ys shape (n+1, len(y0))."""\n    raise NotImplementedError\n',
        solution:
          'import numpy as np\n\n\ndef rk4_step(f, t, y, h):\n    y = np.asarray(y, dtype=float)\n    k1 = np.asarray(f(t, y), dtype=float)\n    k2 = np.asarray(f(t + 0.5 * h, y + 0.5 * h * k1), dtype=float)\n    k3 = np.asarray(f(t + 0.5 * h, y + 0.5 * h * k2), dtype=float)\n    k4 = np.asarray(f(t + h, y + h * k3), dtype=float)\n    return y + (h / 6.0) * (k1 + 2.0 * k2 + 2.0 * k3 + k4)\n\n\ndef integrate(f, y0, t0, t1, n):\n    y0 = np.atleast_1d(np.asarray(y0, dtype=float))\n    h = (t1 - t0) / n\n    ts = t0 + h * np.arange(n + 1)\n    ys = np.empty((n + 1, y0.size))\n    ys[0] = y0\n    for i in range(n):\n        ys[i + 1] = rk4_step(f, ts[i], ys[i], h)\n    return ts, ys\n',
        tests: [
          {
            name: 'exponential decay matches the analytic solution',
            assert:
              'import numpy as np\nf = lambda t, y: -2.0 * y\nts, ys = integrate(f, [1.0], 0.0, 2.0, 200)\nassert ts.shape == (201,) and ys.shape == (201, 1)\nassert abs(ts[-1] - 2.0) < 1e-12\nassert abs(ys[-1, 0] - np.exp(-4.0)) < 1e-9, "RK4 on a simple decay should be far more accurate than this"\n',
          },
          {
            name: 'fourth-order convergence',
            assert:
              'import numpy as np\nf = lambda t, y: -2.0 * y\nexact = np.exp(-4.0)\ne1 = abs(integrate(f, [1.0], 0.0, 2.0, 20)[1][-1, 0] - exact)\ne2 = abs(integrate(f, [1.0], 0.0, 2.0, 40)[1][-1, 0] - exact)\nratio = e1 / e2\nassert 12.0 < ratio < 20.0, f"halving h must cut the error by about 16x, got {ratio}"\n',
          },
          {
            name: 'harmonic oscillator conserves energy well',
            assert:
              'import numpy as np\nf = lambda t, y: np.array([y[1], -y[0]])\nts, ys = integrate(f, [1.0, 0.0], 0.0, 20.0, 4000)\nE = 0.5 * (ys[:, 0] ** 2 + ys[:, 1] ** 2)\ndrift = abs(E[-1] - E[0]) / E[0]\nassert drift < 1e-8, f"energy drift too large: {drift}"\nassert abs(ys[-1, 0] - np.cos(20.0)) < 1e-6\n',
            hidden: true,
          },
        ],
        hours: 3,
      },
      {
        id: 'py07_ex2',
        title: 'Two-body propagation and apogee detection',
        prompt:
          'Using scipy.integrate.solve_ivp, implement `propagate(r0, v0, t_end, mu, rtol, atol)` returning the final position and velocity of a point mass in a two-body gravity field, and `apogee_time(r0, v0, t_max, mu)` returning the time of the first apogee, found with a solver event on the radial rate (the dot product of r and v) crossing zero from positive to negative. Use a high-accuracy method; the tests require sub-metre closure after a full revolution.',
        kind: 'code',
        lang: 'python',
        starter:
          'import numpy as np\nfrom scipy.integrate import solve_ivp\n\nMU_EARTH = 3.986004418e14\n\n\ndef two_body(t, y, mu):\n    """State y = [rx, ry, rz, vx, vy, vz]."""\n    raise NotImplementedError\n\n\ndef propagate(r0, v0, t_end, mu=MU_EARTH, rtol=1e-12, atol=1e-9):\n    """Return (r, v) at t_end as two length-3 arrays."""\n    raise NotImplementedError\n\n\ndef apogee_time(r0, v0, t_max, mu=MU_EARTH):\n    """Time of the first apogee, or None if none occurs before t_max."""\n    raise NotImplementedError\n',
        solution:
          'import numpy as np\nfrom scipy.integrate import solve_ivp\n\nMU_EARTH = 3.986004418e14\n\n\ndef two_body(t, y, mu):\n    r = y[:3]\n    v = y[3:]\n    rn = np.linalg.norm(r)\n    return np.concatenate([v, -mu * r / rn ** 3])\n\n\ndef propagate(r0, v0, t_end, mu=MU_EARTH, rtol=1e-12, atol=1e-9):\n    y0 = np.concatenate([np.asarray(r0, float), np.asarray(v0, float)])\n    sol = solve_ivp(two_body, (0.0, t_end), y0, args=(mu,), method="DOP853", rtol=rtol, atol=atol)\n    if not sol.success:\n        raise RuntimeError(sol.message)\n    yf = sol.y[:, -1]\n    return yf[:3], yf[3:]\n\n\ndef apogee_time(r0, v0, t_max, mu=MU_EARTH):\n    def radial_rate(t, y, mu):\n        return float(np.dot(y[:3], y[3:]))\n\n    radial_rate.terminal = True\n    radial_rate.direction = -1.0\n    y0 = np.concatenate([np.asarray(r0, float), np.asarray(v0, float)])\n    sol = solve_ivp(\n        two_body, (0.0, t_max), y0, args=(mu,), method="DOP853",\n        rtol=1e-12, atol=1e-9, events=radial_rate,\n    )\n    if len(sol.t_events[0]) == 0:\n        return None\n    return float(sol.t_events[0][0])\n',
        tests: [
          {
            name: 'circular orbit closes after one period',
            assert:
              'import numpy as np\nmu = 3.986004418e14\na = 7.0e6\nr0 = np.array([a, 0.0, 0.0])\nv0 = np.array([0.0, np.sqrt(mu / a), 0.0])\nT = 2 * np.pi * np.sqrt(a ** 3 / mu)\nr, v = propagate(r0, v0, T, mu)\nassert np.linalg.norm(r - r0) < 1.0, f"position closure {np.linalg.norm(r - r0)} m is too large"\nassert np.linalg.norm(v - v0) < 1e-3\n',
          },
          {
            name: 'specific energy is conserved',
            assert:
              'import numpy as np\nmu = 3.986004418e14\na = 7.0e6\nr0 = np.array([a, 0.0, 0.0])\nv0 = np.array([0.0, np.sqrt(mu / a), 0.0])\nT = 2 * np.pi * np.sqrt(a ** 3 / mu)\ne0 = 0.5 * v0 @ v0 - mu / np.linalg.norm(r0)\nr, v = propagate(r0, v0, 20 * T, mu)\ne1 = 0.5 * v @ v - mu / np.linalg.norm(r)\nassert abs((e1 - e0) / e0) < 1e-10, "relative energy drift over 20 revolutions must stay below 1e-10"\n',
          },
          {
            name: 'apogee of an eccentric orbit is at half a period',
            assert:
              'import numpy as np\nmu = 3.986004418e14\nrp, ecc = 7.0e6, 0.2\na = rp / (1 - ecc)\nvp = np.sqrt(mu * (2.0 / rp - 1.0 / a))\nT = 2 * np.pi * np.sqrt(a ** 3 / mu)\nt_apo = apogee_time([rp, 0.0, 0.0], [0.0, vp, 0.0], 2 * T, mu)\nassert t_apo is not None, "an eccentric orbit must have an apogee"\nassert abs(t_apo - T / 2) < 0.05, f"apogee time {t_apo} should be T/2 = {T / 2}"\nr, v = propagate([rp, 0.0, 0.0], [0.0, vp, 0.0], t_apo, mu)\nassert abs(np.linalg.norm(r) - a * (1 + ecc)) < 5.0\n',
            hidden: true,
          },
        ],
        hours: 4,
      },
    ],
    cards: [
      {
        id: 'py07_c1',
        front: 'Local versus global truncation error',
        back:
          'Local error is what one step introduces; for a method of order p it scales as h to the (p+1). Global error accumulates over roughly 1/h steps, so it scales as h to the p. That is why RK4 error falls by 16 when you halve the step.',
        formula: true,
      },
      {
        id: 'py07_c2',
        front: 'How do you verify an integrator order empirically?',
        back:
          'Integrate a problem with a known solution at step h and h/2 and take the ratio of the errors. The ratio should approach 2 to the p: 4 for RK2, 16 for RK4. If it does not, a coefficient is wrong or you are already at round-off.',
        formula: true,
      },
      {
        id: 'py07_c3',
        front: 'What do rtol and atol actually control in solve_ivp?',
        back:
          'The step controller keeps the estimated local error of each component below atol + rtol*|y|. rtol governs significant digits for large components, atol sets the floor that matters near zero, and atol must be set per the physical scale of each state.',
        formula: true,
      },
      {
        id: 'py07_c4',
        front: 'When do you choose DOP853 over RK45?',
        back:
          'When you need tight tolerances. DOP853 is eighth order, so near rtol of 1e-12 it reaches the same accuracy in far fewer, larger steps than the fifth-order RK45, which is why it is the default choice for high-accuracy orbit propagation.',
      },
      {
        id: 'py07_c5',
        front: 'How do you recognise stiffness from solver behaviour?',
        back:
          'The solver takes enormous numbers of tiny steps on a smooth-looking solution, and tightening the tolerance barely changes the answer while multiplying the cost. The fix is an implicit method (Radau, BDF) that is stable at large steps.',
      },
      {
        id: 'py07_c6',
        front: 'What does terminal=True and direction=-1 do on an event?',
        back:
          'terminal stops the integration at the crossing; direction=-1 only triggers on a zero crossing where the event function is decreasing. For apogee, the event is the radial rate and you want the positive-to-negative crossing.',
      },
      {
        id: 'py07_c7',
        front: 'How accurately does an event locate the crossing?',
        back:
          'Solvers use the dense output of the accepted step and a bracketing root solve, so the crossing is found to the solver tolerance, effectively independent of the step size. That is how you get a sub-millisecond apogee time with 30-second steps.',
      },
      {
        id: 'py07_c8',
        front: 't_eval versus dense_output',
        back:
          't_eval requests output at specified times and does not change the steps taken. dense_output builds a continuous interpolant you can evaluate anywhere afterwards. Neither is a substitute for tolerances: asking for output every second does not improve accuracy.',
      },
      {
        id: 'py07_c9',
        front: 'Why is specific energy a good accuracy check for two-body?',
        back:
          'It is an exact invariant of the true dynamics, so any drift is purely numerical and requires no reference trajectory. Relative drift below about 1e-10 over many revolutions is a reasonable bar for a high-accuracy propagation.',
      },
      {
        id: 'py07_c10',
        front: 'Symplectic versus adaptive high-order integration',
        back:
          'Symplectic schemes conserve a nearby Hamiltonian, so energy error stays bounded and oscillatory over very long horizons instead of drifting secularly. Adaptive high-order methods are more accurate per step but drift; over centuries of propagation the symplectic scheme wins.',
      },
      {
        id: 'py07_c11',
        front: 'Why restart the solver at staging?',
        back:
          'Mass and thrust change discontinuously, which invalidates the smoothness the error estimator assumes. Integrate up to the event, apply the discrete change, and start a new integration; otherwise the controller either rejects steps endlessly or quietly smears the discontinuity.',
      },
      {
        id: 'py07_c12',
        front: 'Why does deployed flight code use fixed-step integration?',
        back:
          'Because a control task must finish in a bounded, known time every cycle. Variable-step solvers have data-dependent cost and no worst-case bound, which is incompatible with real-time scheduling and with code generation for an embedded target.',
      },
      {
        id: 'py07_c13',
        front: 'Your integrator takes a million tiny steps over a 100-second span. Diagnose.',
        back:
          'Either the system is stiff and needs Radau or BDF, or there is a discontinuity or a near-singularity being stepped over (a saturation, a table edge, a division as a radius approaches zero), or atol is set far below the physical scale of a state.',
      },
    ],
    quiz: [
      {
        id: 'py07_q1',
        q: 'Halving the step in your RK4 integrator reduces the end-state error by a factor of about 4. What does that mean?',
        choices: [
          'The implementation is correct',
          'The method is behaving as second order, so a coefficient or stage argument is wrong',
          'Round-off dominates',
          'The problem is stiff',
        ],
        answer: 1,
        explain:
          'A correct RK4 shows a factor of about 16. A factor of 4 is the signature of a second-order scheme, typically a mis-set stage time or weight.',
        b: 0.7,
        bloom: 'analyze',
      },
      {
        id: 'py07_q2',
        q: 'You need 1e-12 relative accuracy over 30 days of orbit propagation. Which solver setting is most appropriate?',
        choices: [
          'RK23 with rtol=1e-12',
          'DOP853 with rtol=1e-12 and atol scaled per state',
          'LSODA with default tolerances',
          'Fixed-step RK4 with h = 60 s',
        ],
        answer: 1,
        explain:
          'A high-order method reaches tight tolerances with far fewer function evaluations. Low-order methods at 1e-12 take an impractical number of steps, and a fixed step gives no error control at all.',
        b: 0.5,
        bloom: 'apply',
      },
      {
        id: 'py07_q3',
        q: 'Which event definition finds an impact at zero altitude going downward?',
        choices: [
          'An event returning altitude, with direction=+1',
          'An event returning altitude, with direction=-1 and terminal=True',
          'An event returning velocity, terminal=True',
          'An event returning time minus t_end',
        ],
        answer: 1,
        explain:
          'The event function must be zero at the condition, and direction=-1 selects the crossing where altitude is decreasing. terminal stops the run at touchdown.',
        b: 0.3,
        bloom: 'apply',
      },
      {
        id: 'py07_q4',
        q: 'A chemically reacting subsystem forces your solver down to 1e-9 s steps for a 100 s trajectory. Best response?',
        choices: [
          'Loosen rtol until it runs fast',
          'Switch to an implicit method such as Radau or BDF',
          'Switch to DOP853',
          'Reduce the state dimension',
        ],
        answer: 1,
        explain:
          'That is textbook stiffness: an explicit method is limited by stability, not accuracy. An implicit method is stable at steps set by the slow dynamics you care about.',
        b: 0.6,
        bloom: 'analyze',
      },
      {
        id: 'py07_q5',
        q: 'Passing t_eval at 1 Hz to solve_ivp changes what?',
        choices: [
          'The accuracy of the solution',
          'The internal step sizes',
          'Only the times at which output is reported',
          'The method used',
        ],
        answer: 2,
        explain:
          'Output times come from interpolation within the accepted steps. If you want more accuracy you change rtol and atol, not the output grid.',
        b: 0.4,
        bloom: 'understand',
      },
      {
        id: 'py07_q6',
        q: 'Relative specific-energy drift grows linearly with time in a long propagation. Which choice best bounds it?',
        choices: [
          'A symplectic integrator at fixed step',
          'A smaller atol on the velocity states only',
          'Switching from float64 to float32',
          'A longer output interval',
        ],
        answer: 0,
        explain:
          'Symplectic methods have bounded, oscillatory energy error because they exactly conserve a perturbed Hamiltonian. Tightening tolerances slows the drift but does not remove its secular character.',
        b: 1.2,
        bloom: 'analyze',
      },
      {
        id: 'py07_q7',
        q: 'Which atol is sensible for a state vector whose positions are ~7e6 m and velocities ~7.5e3 m/s?',
        choices: [
          'A single atol of 1e-12 for all six states',
          'Per-state atol: about 1e-6 m for position and 1e-9 m/s for velocity, with rtol carrying the accuracy requirement',
          'atol = 1 for all states',
          'atol is irrelevant when rtol is set',
        ],
        answer: 1,
        explain:
          'atol is a floor in the units of each state, so it must reflect that state physical scale. A single tiny atol across mixed units forces pointless work on the large components.',
        b: 0.9,
        bloom: 'analyze',
      },
      {
        id: 'py07_q8',
        q: 'Why must a solver be restarted at stage separation rather than integrated straight through?',
        choices: [
          'Because mass is conserved',
          'Because the error estimator assumes smoothness, and a discontinuity in mass and thrust breaks that assumption',
          'Because events cannot be used twice',
          'Because the state dimension changes',
        ],
        answer: 1,
        explain:
          'Adaptive controllers derive step size from a smoothness assumption. Integrating across a jump either causes endless step rejection or silently produces a wrong, smoothed answer.',
        b: 0.8,
        bloom: 'understand',
      },
    ],
    tags: ['spacex-core', 'python', 'math'],
    importance: 1.45,
  },

  {
    id: 'cod_py_08_performance',
    track: 'coding',
    tier: 5,
    title: 'Python Performance for Monte Carlo Work',
    summary:
      "Taking a 500-case dispersion from forty minutes to two. Profile first, fix the algorithm, vectorise, then reach for Numba, multiprocessing or a C++ extension, in that order and only with measurements.",
    prereqs: ['cod_py_04_scipy', 'cod_py_05_plotting'],
    hours: 25,
    topics: [
      'Measure first: timeit, cProfile, pstats, snakeviz, line_profiler, memory_profiler',
      'Algorithmic complexity before micro-optimisation',
      'Vectorisation as the default; when it costs more memory than it saves time',
      'Numba njit: nopython mode, supported subset, cache=True, parallel and prange',
      'Why an njit function can be slower: compile time, object mode fallback, unsupported types',
      'Cython and pybind11; calling a C++ simulation core from a Python harness',
      'The GIL: what it does and does not block',
      'Threads for I/O and released-GIL numerics, processes for CPU-bound Python',
      'multiprocessing, concurrent.futures and joblib for embarrassingly parallel Monte Carlo',
      'Serialisation cost and why passing large arrays between processes can dominate',
      'numpy.memmap, chunking and Parquet for telemetry larger than memory',
      'Caching and precomputation: lookup tables, interpolators built once',
      'Benchmark methodology: warmup, repetitions, frequency scaling, noise',
    ],
    objectives: [
      'Profile a simulator and identify the true hotspot before changing any code.',
      'Replace an O(n squared) routine with an O(n) one and show the scaling change.',
      'Decide correctly between vectorisation, Numba, processes and a native extension.',
      'Explain why threads do not speed up pure-Python compute but do speed up NumPy-heavy code.',
      'Report a benchmark honestly, with a baseline, a method and run-to-run variability.',
    ],
    resources: [
      {
        title: 'Numba documentation: 5-minute guide and performance tips',
        author: 'Numba developers',
        kind: 'docs',
        url: 'https://numba.readthedocs.io/en/stable/user/5minguide.html',
        free: true,
      },
      {
        title: 'High Performance Python, 2nd ed.',
        author: 'Micha Gorelick and Ian Ozsvald',
        kind: 'book',
        free: false,
      },
      {
        title: 'The Python Profilers',
        author: 'Python Software Foundation',
        kind: 'docs',
        url: 'https://docs.python.org/3/library/profile.html',
        free: true,
      },
      {
        title: 'joblib documentation',
        author: 'joblib developers',
        kind: 'docs',
        url: 'https://joblib.readthedocs.io/',
        free: true,
      },
    ],
    exercises: [
      {
        id: 'py08_ex1',
        title: 'Linear-time moving average',
        prompt:
          'Implement `moving_average(x, w)` returning the length len(x)-w+1 array of averages of every window of w consecutive samples. It must run in O(n) using a cumulative sum, not O(n*w). Raise ValueError for w < 1 or w > len(x). The test runs it on five million samples, which an O(n*w) implementation will not survive.',
        kind: 'code',
        lang: 'python',
        starter:
          'import numpy as np\n\n\ndef moving_average(x, w):\n    """Mean of every window of w consecutive samples. O(n)."""\n    raise NotImplementedError\n',
        solution:
          'import numpy as np\n\n\ndef moving_average(x, w):\n    x = np.asarray(x, dtype=float)\n    w = int(w)\n    if w < 1 or w > x.size:\n        raise ValueError("window must satisfy 1 <= w <= len(x)")\n    c = np.empty(x.size + 1, dtype=float)\n    c[0] = 0.0\n    np.cumsum(x, out=c[1:])\n    return (c[w:] - c[:-w]) / w\n',
        tests: [
          {
            name: 'matches a brute-force window mean',
            assert:
              'import numpy as np\nrng = np.random.default_rng(11)\nx = rng.normal(size=200)\nfor w in (1, 2, 7, 50, 200):\n    ref = np.array([x[i:i + w].mean() for i in range(x.size - w + 1)])\n    got = moving_average(x, w)\n    assert got.shape == ref.shape, f"wrong length for w={w}"\n    assert np.allclose(got, ref, atol=1e-10), f"values wrong for w={w}"\n',
          },
          {
            name: 'validates the window',
            assert:
              'import numpy as np\nfor bad in (0, -3, 11):\n    try:\n        moving_average(np.zeros(10), bad)\n    except ValueError:\n        pass\n    else:\n        raise AssertionError(f"w={bad} must raise ValueError")\n',
          },
          {
            name: 'linear time on five million samples',
            assert:
              'import numpy as np\nx = np.ones(5_000_000)\nout = moving_average(x, 1000)\nassert out.shape == (4_999_001,)\nassert abs(out[0] - 1.0) < 1e-9 and abs(out[-1] - 1.0) < 1e-9\n',
            hidden: true,
          },
        ],
        hours: 2,
      },
      {
        id: 'py08_ex2',
        title: 'Sliding-window maximum in linear time',
        prompt:
          'Implement `running_max(x, w)` returning the maximum of every window of w consecutive samples, in O(n) total using a monotonic deque (each element is pushed and popped at most once). The naive version is O(n*w); the test exercises a two-million-sample input with a window of 5000, which the naive version cannot complete.',
        kind: 'code',
        lang: 'python',
        starter:
          'from collections import deque\n\n\ndef running_max(x, w):\n    """Maximum of every window of w consecutive samples, O(n) total."""\n    raise NotImplementedError\n',
        solution:
          'from collections import deque\n\n\ndef running_max(x, w):\n    w = int(w)\n    n = len(x)\n    if w < 1 or w > n:\n        raise ValueError("window must satisfy 1 <= w <= len(x)")\n    out = []\n    dq = deque()  # indices, values decreasing\n    for i in range(n):\n        while dq and x[dq[-1]] <= x[i]:\n            dq.pop()\n        dq.append(i)\n        if dq[0] <= i - w:\n            dq.popleft()\n        if i >= w - 1:\n            out.append(x[dq[0]])\n    return out\n',
        tests: [
          {
            name: 'matches brute force',
            assert:
              'import random\nrandom.seed(4)\nx = [random.uniform(-5, 5) for _ in range(500)]\nfor w in (1, 2, 9, 100, 500):\n    ref = [max(x[i:i + w]) for i in range(len(x) - w + 1)]\n    got = list(running_max(x, w))\n    assert len(got) == len(ref), f"wrong length for w={w}"\n    assert all(abs(a - b) < 1e-12 for a, b in zip(got, ref)), f"wrong values for w={w}"\n',
          },
          {
            name: 'monotone and constant inputs',
            assert:
              'assert list(running_max([1, 2, 3, 4, 5], 2)) == [2, 3, 4, 5]\nassert list(running_max([5, 4, 3, 2, 1], 2)) == [5, 4, 3, 2]\nassert list(running_max([7, 7, 7], 3)) == [7]\n',
          },
          {
            name: 'linear time on a large input',
            assert:
              'x = [(i * 7919) % 100003 for i in range(2_000_000)]\nout = running_max(x, 5000)\nassert len(out) == len(x) - 5000 + 1\nassert out[0] == max(x[:5000])\nassert out[-1] == max(x[-5000:])\n',
            hidden: true,
          },
        ],
        hours: 2.5,
      },
    ],
    cards: [
      {
        id: 'py08_c1',
        front: 'First rule of optimisation',
        back:
          'Measure. Profile the real workload, find where the time actually is, and record a baseline number. Engineers guess wrong about hotspots most of the time, and without a baseline you cannot prove the change helped.',
      },
      {
        id: 'py08_c2',
        front: 'cProfile versus line_profiler',
        back:
          'cProfile gives per-function call counts and cumulative time for the whole program, which is how you find the hot function. line_profiler then shows the time per line inside that one function. Use them in that order.',
      },
      {
        id: 'py08_c3',
        front: 'What does the GIL actually prevent?',
        back:
          'Two threads executing Python bytecode at the same time. It does not block threads waiting on I/O, nor threads inside NumPy, BLAS or compiled extensions that release it, which is why array-heavy code can still scale with threads.',
      },
      {
        id: 'py08_c4',
        front: 'Threads or processes for a 500-case Monte Carlo in pure Python?',
        back:
          'Processes. Each case is CPU-bound Python, so threads serialise on the GIL. joblib or ProcessPoolExecutor gives near-linear scaling until memory bandwidth or per-case startup cost dominates.',
      },
      {
        id: 'py08_c5',
        front: 'You add @njit and the function gets slower. Name three causes.',
        back:
          'Compilation time is being counted (warm it up first, or cache=True); the function fell back to object mode because of an unsupported type; or the function is already dominated by a NumPy call that Numba cannot improve, so you have only added overhead.',
      },
      {
        id: 'py08_c6',
        front: 'Name two things Numba cannot compile in nopython mode',
        back:
          'Arbitrary Python objects, including most classes, pandas DataFrames, dicts with heterogeneous value types and general list-of-anything; and calls into libraries it has no lowering for, such as SciPy routines or the Python C API.',
      },
      {
        id: 'py08_c7',
        front: 'When does vectorisation cost more than it saves?',
        back:
          'When the intermediate arrays no longer fit in cache or memory: a broadcast that materialises an N by M temporary can be slower than a loop, and can simply exhaust RAM. Chunk the computation, or use einsum and in-place operations.',
      },
      {
        id: 'py08_c8',
        front: 'Why can passing big arrays to worker processes dominate the runtime?',
        back:
          'Each argument is pickled, copied through a pipe and unpickled per task. If the per-case work is small relative to the data, you pay serialisation for nothing; batch the work, use shared memory, or have workers load data themselves.',
      },
      {
        id: 'py08_c9',
        front: 'What is numpy.memmap for?',
        back:
          'Treating an on-disk array as an ndarray, with the OS paging in only the parts you touch. It is how you analyse a telemetry file larger than RAM without writing a chunking loop by hand.',
      },
      {
        id: 'py08_c10',
        front: 'Why is pybind11 the realistic pattern for a heavy GNC core?',
        back:
          'The numerics live in tested, optimised C++ that can also be flown or reused, and Python drives the dispersion harness, the plotting and the reporting. You get compiled speed where it matters and scripting speed where it matters.',
      },
      {
        id: 'py08_c11',
        front: 'How do you benchmark honestly?',
        back:
          'Fix the input, warm up, repeat enough times to see the spread, report the minimum and the variability, pin the frequency governor or note that you did not, and state the machine. A single timing number with no spread is not a measurement.',
      },
      {
        id: 'py08_c12',
        front: 'Order of attack when a simulation is too slow',
        back:
          'Profile, fix the algorithm, remove redundant work and recomputation, vectorise, then compile the remaining scalar hotspot with Numba or C++, then parallelise across cases. Parallelising a bad algorithm just buys you the same waste on more cores.',
      },
      {
        id: 'py08_c13',
        front: 'Why is caching an interpolator outside the loop a big win?',
        back:
          'Constructing a spline or a grid interpolator does setup work proportional to the table size. Building it once and calling it inside the loop turns per-call setup into per-call evaluation, often an order of magnitude.',
      },
    ],
    quiz: [
      {
        id: 'py08_q1',
        q: 'A 500-case Monte Carlo of pure-Python physics takes 40 minutes on an 8-core machine. Best first change?',
        choices: [
          'Run the cases in 8 threads',
          'Profile one case, then vectorise or compile the hotspot, and only then parallelise across cases with processes',
          'Rewrite the whole simulator in C++',
          'Switch to float32',
        ],
        answer: 1,
        explain:
          'Threads will not help CPU-bound Python. Fix the per-case cost first, since an 8x from processes on top of a 20x from the hotspot is a far better outcome than 8x alone.',
        b: 0.3,
        bloom: 'apply',
      },
      {
        id: 'py08_q2',
        q: 'Which workload does benefit from Python threads?',
        choices: [
          'A tight pure-Python loop computing a sum',
          'Large NumPy matrix multiplications that release the GIL inside BLAS',
          'Recursive tree traversal in Python',
          'String formatting in a loop',
        ],
        answer: 1,
        explain:
          'Compiled extensions that release the GIL run genuinely concurrently. Everything expressed as Python bytecode is serialised by the interpreter lock.',
        b: 0.6,
        bloom: 'understand',
      },
      {
        id: 'py08_q3',
        q: 'Your @njit(parallel=True) function produces different results from run to run at the 1e-15 level. Why?',
        choices: [
          'A race condition bug in Numba',
          'Parallel reductions sum in a non-deterministic order, and floating-point addition is not associative',
          'The RNG is unseeded',
          'Object mode fallback',
        ],
        answer: 1,
        explain:
          'Chunked reductions change the grouping of additions, which changes rounding. If bitwise reproducibility is required, use a deterministic reduction order.',
        b: 1.1,
        bloom: 'analyze',
      },
      {
        id: 'py08_q4',
        q: 'An O(n*w) windowed maximum over 2 million samples with w = 5000 is too slow. The right fix is:',
        choices: [
          'Rewrite it in Numba, keeping the same algorithm',
          'Use a monotonic deque so each element is pushed and popped once, making it O(n)',
          'Parallelise across four processes',
          'Downsample the input',
        ],
        answer: 1,
        explain:
          'The problem is complexity, not constant factors. Ten billion operations do not become acceptable through compilation or four cores; the O(n) algorithm does about 4 million.',
        b: 0.5,
        bloom: 'apply',
      },
      {
        id: 'py08_q5',
        q: 'A vectorised rewrite of a loop is slower and uses 30 GB of RAM. Most likely cause?',
        choices: [
          'NumPy is misconfigured',
          'A broadcast materialised a huge intermediate array that no longer fits in cache or memory',
          'The loop version was compiled',
          'float64 is slower than float32 here',
        ],
        answer: 1,
        explain:
          'Vectorisation trades memory traffic for interpreter overhead. Once the temporaries exceed cache, memory bandwidth dominates; chunk the computation or fuse it with einsum or in-place ops.',
        b: 0.8,
        bloom: 'analyze',
      },
      {
        id: 'py08_q6',
        q: 'Which profiling result most strongly suggests an algorithmic problem rather than a constant-factor one?',
        choices: [
          'Time is spread evenly across many functions',
          'Runtime grows roughly as the square of the input size',
          'A single function accounts for 60 percent of runtime',
          'High memory usage',
        ],
        answer: 1,
        explain:
          'Scaling behaviour is the signature of complexity. A dominant function may just need a better implementation; quadratic growth needs a different algorithm.',
        b: 0.7,
        bloom: 'analyze',
      },
      {
        id: 'py08_q7',
        q: 'Why is a single timing number an inadequate benchmark report?',
        choices: [
          'It should always be an average',
          'It hides run-to-run variability, warmup effects, frequency scaling and the machine state, so it cannot be compared to anything',
          'Timing must be done in C',
          'Because timeit is more accurate',
        ],
        answer: 1,
        explain:
          'Without a spread and a stated method, a 10 percent improvement claim is indistinguishable from noise, which is exactly the trap a performance regression gate has to avoid.',
        b: 0.2,
        bloom: 'understand',
      },
    ],
    tags: ['spacex-core', 'python'],
    importance: 1.35,
  },

  {
    id: 'cod_py_09_packaging',
    track: 'coding',
    tier: 5,
    title: 'Packaging, Environments and Distribution',
    summary:
      "Turning a folder of scripts into an installable, versioned, importable package that CI, colleagues and a reproducible container can all consume identically.",
    prereqs: ['cod_py_06_testing', 'cod_py_02_idiomatic'],
    hours: 15,
    topics: [
      'The src layout and why it prevents accidental local imports',
      'pyproject.toml: project metadata, dependencies, optional-dependencies, build-system',
      'Build backends: setuptools, hatchling, flit',
      'Editable installs and what they actually do',
      'Wheels versus source distributions; manylinux',
      'Console entry points for command-line tools',
      '__init__.py, package versus namespace package, relative imports',
      'Version pinning: exact pins for applications, ranges for libraries, lockfiles for both',
      'Semantic versioning and how to decide a bump',
      'Dependency resolution, extras, and the scientific-stack ABI problem',
      'venv, pip, uv, conda and when each is the right answer',
      'Sphinx and NumPy-style docstrings; README that lets a stranger run it',
      'Publishing internally versus on PyPI; private indexes',
    ],
    objectives: [
      'Convert a script folder into an installable package with a working console entry point.',
      'Explain what an editable install changes and why it can hide a packaging bug.',
      'Choose pins versus ranges appropriately for a library and for an application.',
      'Decide a semantic version bump from a diff.',
      'Write a README that lets a new engineer reproduce a result in ten minutes.',
    ],
    resources: [
      {
        title: 'Python Packaging User Guide',
        author: 'Python Packaging Authority',
        kind: 'docs',
        url: 'https://packaging.python.org/',
        free: true,
      },
      {
        title: 'Semantic Versioning 2.0.0',
        author: 'Tom Preston-Werner',
        kind: 'docs',
        url: 'https://semver.org/',
        free: true,
      },
      {
        title: 'Scientific Python Development Guide',
        author: 'Scientific Python community',
        kind: 'docs',
        url: 'https://learn.scientific-python.org/development/',
        free: true,
        note: 'Opinionated, current guidance for exactly this kind of research-adjacent package.',
      },
    ],
    exercises: [
      {
        id: 'py09_ex1',
        title: 'Semantic version comparison',
        prompt:
          'Implement `parse_version(s)` and `compare_versions(a, b)` for the core of semantic versioning: MAJOR.MINOR.PATCH with an optional prerelease after a hyphen. Numeric identifiers compare numerically, alphanumeric ones compare lexically, a numeric identifier is lower than an alphanumeric one, a larger set of prerelease fields wins when all earlier fields are equal, and any prerelease is lower than the corresponding release. Return -1, 0 or +1. Ignore build metadata after a plus sign.',
        kind: 'code',
        lang: 'python',
        starter:
          'def parse_version(s):\n    """Return (major, minor, patch, prerelease_tuple). Build metadata is ignored."""\n    raise NotImplementedError\n\n\ndef compare_versions(a, b):\n    """Return -1 if a < b, 0 if equal, +1 if a > b."""\n    raise NotImplementedError\n',
        solution:
          'def parse_version(s):\n    s = s.split("+", 1)[0]\n    core, _, pre = s.partition("-")\n    parts = core.split(".")\n    if len(parts) != 3:\n        raise ValueError(f"bad version: {s}")\n    major, minor, patch = (int(p) for p in parts)\n    pre_fields = tuple(pre.split(".")) if pre else ()\n    return major, minor, patch, pre_fields\n\n\ndef _cmp_pre_field(x, y):\n    xn, yn = x.isdigit(), y.isdigit()\n    if xn and yn:\n        a, b = int(x), int(y)\n        return (a > b) - (a < b)\n    if xn != yn:\n        return -1 if xn else 1\n    return (x > y) - (x < y)\n\n\ndef compare_versions(a, b):\n    ma, mi, pa, pra = parse_version(a)\n    mb, mj, pb, prb = parse_version(b)\n    for x, y in ((ma, mb), (mi, mj), (pa, pb)):\n        if x != y:\n            return -1 if x < y else 1\n    if not pra and not prb:\n        return 0\n    if not pra:\n        return 1\n    if not prb:\n        return -1\n    for x, y in zip(pra, prb):\n        c = _cmp_pre_field(x, y)\n        if c:\n            return c\n    if len(pra) == len(prb):\n        return 0\n    return -1 if len(pra) < len(prb) else 1\n',
        tests: [
          {
            name: 'core ordering',
            assert:
              'assert compare_versions("1.0.0", "2.0.0") == -1\nassert compare_versions("2.1.0", "2.0.9") == 1\nassert compare_versions("1.2.3", "1.2.3") == 0\nassert compare_versions("1.2.3+build.5", "1.2.3") == 0, "build metadata is ignored"\n',
          },
          {
            name: 'prerelease is lower than release',
            assert:
              'assert compare_versions("1.0.0-alpha", "1.0.0") == -1\nassert compare_versions("1.0.0", "1.0.0-rc.1") == 1\n',
          },
          {
            name: 'prerelease field rules',
            assert:
              'assert compare_versions("1.0.0-alpha", "1.0.0-alpha.1") == -1\nassert compare_versions("1.0.0-alpha.1", "1.0.0-alpha.beta") == -1, "numeric identifiers rank below alphanumeric"\nassert compare_versions("1.0.0-beta.2", "1.0.0-beta.11") == -1, "numeric identifiers compare numerically, not lexically"\nassert compare_versions("1.0.0-rc.1", "1.0.0-beta.11") == 1\n',
            hidden: true,
          },
          {
            name: 'parse_version shape',
            assert:
              'assert parse_version("3.4.5") == (3, 4, 5, ())\nassert parse_version("3.4.5-rc.2+meta") == (3, 4, 5, ("rc", "2"))\n',
          },
        ],
        hours: 2,
      },
      {
        id: 'py09_ex2',
        title: 'Package the simulator',
        prompt:
          'Convert a folder of simulation scripts into a package with a src layout, a pyproject.toml declaring dependencies and a console entry point, a tests directory run by pytest, NumPy-style docstrings and a README with a ten-minute quickstart. Success criteria: a fresh virtual environment plus `pip install .` gives a working command, and `pytest` passes from a directory outside the source tree.',
        kind: 'build',
        hours: 3,
      },
    ],
    cards: [
      {
        id: 'py09_c1',
        front: 'Why the src/ layout?',
        back:
          'It makes the package unimportable from the repository root, so tests run against the installed copy. That catches missing data files, missing modules in the wheel and bad relative imports before your users do.',
      },
      {
        id: 'py09_c2',
        front: 'What does `pip install -e .` actually do?',
        back:
          'Installs a link (a path entry or hook) to your source tree instead of copying files, so edits take effect without reinstalling. It is a development convenience, and it can hide packaging errors that a real install would expose.',
      },
      {
        id: 'py09_c3',
        front: 'Wheel versus sdist',
        back:
          'A wheel is a prebuilt, installable archive; an sdist is the source that must be built on the target. Wheels install fast and avoid needing a compiler, which is why the scientific stack ships manylinux wheels.',
      },
      {
        id: 'py09_c4',
        front: 'Pins or ranges?',
        back:
          'A library declares compatible ranges so it can coexist with others. An application or a simulation pins exact versions, usually through a lockfile, because reproducibility outweighs flexibility.',
      },
      {
        id: 'py09_c5',
        front: 'How do you decide a semantic version bump?',
        back:
          'Break a public interface, bump MAJOR. Add capability compatibly, bump MINOR. Fix behaviour without interface change, bump PATCH. For a simulation library, a change that alters numerical results is at minimum a MINOR and arguably a MAJOR, and must be in the changelog.',
      },
      {
        id: 'py09_c6',
        front: 'What goes in [build-system] in pyproject.toml?',
        back:
          'The build backend and the requirements needed to run it, for example setuptools or hatchling. It is what lets pip build your package in an isolated environment without your dependencies being installed first.',
      },
      {
        id: 'py09_c7',
        front: 'What is a console entry point?',
        back:
          'A declaration that maps a command name to a module function; the installer generates the executable shim. It is how a package ships a CLI without users invoking python -m or setting PATH by hand.',
      },
      {
        id: 'py09_c8',
        front: 'Why do NumPy and SciPy version constraints matter more than most?',
        back:
          'Compiled extensions link against a specific binary interface. A mismatch between the version a package was built against and the one installed produces import-time crashes or silently wrong memory layout, which is why the scientific stack pins more tightly than pure Python.',
      },
      {
        id: 'py09_c9',
        front: 'requirements.txt or lockfile?',
        back:
          'requirements.txt is usually a human-written list of direct dependencies. A lockfile records the full resolved graph with hashes, which is what makes an install reproducible. Simulation work needs the lockfile.',
      },
      {
        id: 'py09_c10',
        front: 'What belongs in the README of a sim repository?',
        back:
          'What it computes, how to install it, one command that reproduces a headline result, where the data comes from, and the assumptions and limits of the model. If a new engineer cannot get a plot in ten minutes, the README is incomplete.',
      },
      {
        id: 'py09_c11',
        front: 'Why is __init__.py still worth writing explicitly?',
        back:
          'It marks a regular package, controls what the package exports, and avoids ambiguity with implicit namespace packages, which silently merge directories and produce baffling import behaviour in a large monorepo.',
      },
      {
        id: 'py09_c12',
        front: 'How does packaging interact with reproducibility?',
        back:
          'A pinned lockfile plus a versioned package plus a container digest is the full chain. Any one alone leaves a gap: the same code with different dependency versions can produce different numbers.',
      },
    ],
    quiz: [
      {
        id: 'py09_q1',
        q: 'Tests pass locally but fail in CI with ModuleNotFoundError for a submodule. Most likely cause?',
        choices: [
          'CI has the wrong Python version',
          'The module is importable from the repo root locally but is not included in the built package',
          'A missing __pycache__',
          'CI does not support pytest',
        ],
        answer: 1,
        explain:
          'Running from the repository root puts the source directory on sys.path, masking packaging mistakes. The src layout removes that mask.',
        b: 0.5,
        bloom: 'analyze',
      },
      {
        id: 'py09_q2',
        q: 'Your library changes a default integration tolerance, altering numerical output. What is the minimum correct version bump?',
        choices: ['PATCH', 'MINOR, with a changelog entry noting the behaviour change', 'No bump', 'Only the build number'],
        answer: 1,
        explain:
          'Users consuming your results would see different numbers, which is a behaviour change rather than a bug fix. Many teams treat it as MAJOR; nobody should treat it as a silent PATCH.',
        b: 0.6,
        bloom: 'apply',
      },
      {
        id: 'py09_q3',
        q: 'Which is the right dependency policy for a simulation application whose results feed a design review?',
        choices: [
          'Latest versions always, for security',
          'Exact pins recorded in a lockfile, updated deliberately and re-baselined',
          'Ranges only',
          'No declared dependencies',
        ],
        answer: 1,
        explain:
          'Result reproducibility is the requirement. Updates still happen, but as a deliberate change with a re-run baseline, not implicitly on someone machine.',
        b: 0.2,
        bloom: 'apply',
      },
      {
        id: 'py09_q4',
        q: 'What does declaring [project.scripts] achieve?',
        choices: [
          'It runs tests at install time',
          'It creates a command on PATH that calls a function in your package',
          'It pins dependencies',
          'It builds a wheel',
        ],
        answer: 1,
        explain:
          'Entry points are the standard mechanism for shipping a CLI; the installer writes the shim for the target platform.',
        b: -0.1,
        bloom: 'recall',
      },
      {
        id: 'py09_q5',
        q: 'A colleague reports that your package imports fine in editable mode but fails after `pip install .`. What is the general lesson?',
        choices: [
          'Editable installs are broken',
          'Editable mode hides packaging errors because it points at the source tree; test the real install in CI',
          'Wheels cannot contain data files',
          'The package needs a namespace package',
        ],
        answer: 1,
        explain:
          'The two install modes exercise different file sets. A CI job that installs the built wheel and runs the tests from outside the tree catches this class of bug.',
        b: 0.7,
        bloom: 'analyze',
      },
      {
        id: 'py09_q6',
        q: 'Why does a container image plus a lockfile give more than either alone?',
        choices: [
          'The container pins the OS, compiler and system libraries while the lockfile pins the Python graph with hashes',
          'The lockfile makes the image smaller',
          'Containers cannot install Python packages',
          'They are redundant',
        ],
        answer: 0,
        explain:
          'They pin different layers of the stack. Together they cover the whole chain from libc to the last transitive wheel.',
        b: 0.4,
        bloom: 'understand',
      },
    ],
    tags: ['spacex-core', 'python', 'tooling'],
    importance: 1.3,
  },

  /* ══ C++ ═════════════════════════════════════════════════════════════════ */
  {
    id: 'cod_cpp_01_basics',
    track: 'coding',
    tier: 3,
    title: 'C++ Fundamentals and the Build Pipeline',
    summary:
      "All Falcon and Dragon flight software is C++, so this is the biggest single investment in the track. Start with the compile-assemble-link model, because most beginner pain is build pain rather than language pain.",
    prereqs: ['cod_py_02_idiomatic', 'cod_lnx_02_scripting'],
    hours: 40,
    topics: [
      'Preprocess, compile, assemble, link: what each stage consumes and emits',
      'Translation units, headers vs sources, include guards and pragma once',
      'g++ and clang++ invocation; -Wall -Wextra -Wpedantic -Werror; -g; -O0 to -O3; -std=c++20',
      'Reading a linker error: undefined reference, multiple definition',
      'Fundamental types; fixed-width types from cstdint; size_t',
      'Integer promotion, signed/unsigned pitfalls, signed overflow as undefined behaviour',
      'const, constexpr, consteval, auto',
      'Values, references and the difference from Python names',
      'Functions, overloading, default arguments',
      'Arrays vs std::array vs std::vector; range-based for',
      'enum class; struct and class; access specifiers; namespaces',
      'Declaration vs definition, the one-definition rule, inline, internal linkage',
      'Scope, lifetime, and stack vs heap vs static storage',
      'std::string vs const char*; iostream and std::format',
      'assert and static_assert',
    ],
    objectives: [
      'Build a multi-file program by hand with g++, then with a Makefile, and explain every flag.',
      'Diagnose an undefined-reference and a multiple-definition error from the message alone.',
      'Explain what undefined behaviour is and name three concrete instances.',
      'Choose the right fixed-width integer type for a telemetry field and justify it.',
      'Read a small program and state where every object lives and when it dies.',
    ],
    resources: [
      {
        title: 'learncpp.com',
        author: 'Alex and contributors',
        kind: 'site',
        url: 'https://www.learncpp.com/',
        free: true,
        note: 'The single best free structured beginner path; roughly twenty chapters, updated for modern C++.',
      },
      {
        title: 'cppreference.com',
        kind: 'docs',
        url: 'https://en.cppreference.com/',
        free: true,
        note: 'The reference. Prefer it over cplusplus.com, which is often out of date.',
      },
      {
        title: 'Programming: Principles and Practice Using C++, 3rd ed.',
        author: 'Bjarne Stroustrup',
        kind: 'book',
        free: false,
        note: 'Written for true beginners by the language designer.',
      },
      {
        title: 'Compiler Explorer',
        author: 'Matt Godbolt',
        kind: 'tool',
        url: 'https://godbolt.org/',
        free: true,
        note: 'Make reading the generated assembly a habit from week one.',
      },
    ],
    exercises: [
      {
        id: 'cpp01_ex1',
        title: 'Fixed-width types and overflow',
        prompt:
          'Write a program that prints exactly four lines. Line 1: the value stored when 200 is assigned to an int8_t, printed as an integer. Line 2: the value of static_cast<uint8_t>(-1). Line 3: the result of the comparison `-1 < 1u` printed as the word true or false. Line 4: sizeof(std::size_t) on your platform. Then write one sentence per line explaining the result. Expected output on a typical 64-bit Linux build: -56, 255, false, 8.',
        kind: 'code',
        lang: 'cpp',
        starter:
          '#include <cstdint>\n#include <cstdio>\n#include <cstddef>\n\nint main() {\n    // TODO: print the four values described in the prompt, one per line\n    return 0;\n}\n',
        solution:
          '#include <cstdint>\n#include <cstdio>\n#include <cstddef>\n\nint main() {\n    std::int8_t a = static_cast<std::int8_t>(200);   // C++20: wraps modulo 2^8, and is defined\n    std::printf("%d\\n", static_cast<int>(a));        // -56\n    std::printf("%d\\n", static_cast<int>(static_cast<std::uint8_t>(-1)));  // 255\n    // The next line warns under -Wall (-Wsign-compare), which is the point of\n    // it. Build without -Werror, read the warning, then work out the fix.\n    std::printf("%s\\n", (-1 < 1u) ? "true" : "false");  // false: -1 converts to a huge unsigned\n    std::printf("%zu\\n", sizeof(std::size_t));       // 8 on LP64\n    return 0;\n}\n',
        hours: 1.5,
      },
      {
        id: 'cpp01_ex2',
        title: 'Split a program into translation units',
        prompt:
          'Given a single-file program containing a vector3 struct, its operations and a main, split it into vec3.hpp, vec3.cpp and main.cpp. Compile each to an object file and link them by hand, then write a Makefile that rebuilds only what changed. Deliberately remove the include guard and describe the resulting error, then remove the definition of one function from vec3.cpp and describe that error. Expected: the first is a redefinition error at compile time, the second is an undefined reference at link time.',
        kind: 'code',
        lang: 'cpp',
        starter:
          '// vec3.hpp\n#pragma once\n\nstruct Vec3 {\n    double x{}, y{}, z{};\n};\n\nVec3 add(const Vec3& a, const Vec3& b);\ndouble dot(const Vec3& a, const Vec3& b);\ndouble norm(const Vec3& v);\n',
        solution:
          '// vec3.cpp\n#include "vec3.hpp"\n#include <cmath>\n\nVec3 add(const Vec3& a, const Vec3& b) { return Vec3{a.x + b.x, a.y + b.y, a.z + b.z}; }\ndouble dot(const Vec3& a, const Vec3& b) { return a.x * b.x + a.y * b.y + a.z * b.z; }\ndouble norm(const Vec3& v) { return std::sqrt(dot(v, v)); }\n\n// main.cpp\n// #include "vec3.hpp"\n// #include <cstdio>\n// int main() {\n//     Vec3 a{3, 4, 0}, b{1, 0, 0};\n//     std::printf("%.6f\\n", norm(add(a, b)));  // 5.656854\n//     return 0;\n// }\n\n// Build by hand:\n//   g++ -std=c++20 -Wall -Wextra -c vec3.cpp -o vec3.o\n//   g++ -std=c++20 -Wall -Wextra -c main.cpp -o main.o\n//   g++ vec3.o main.o -o app\n',
        hours: 2,
      },
    ],
    cards: [
      {
        id: 'cpp01_c1',
        front: 'What does "undefined reference to f()" actually mean?',
        back:
          'The compiler saw a declaration of f and accepted the call, but the linker found no definition in any object file or library. Either the .cpp was not compiled and linked, the signature differs (including const or namespace), or the library was not passed.',
      },
      {
        id: 'cpp01_c2',
        front: 'Why does a header need include guards or pragma once?',
        back:
          'Without them, a header included twice in one translation unit redefines its types and inline entities, violating the one-definition rule. The guard makes the second inclusion a no-op.',
      },
      {
        id: 'cpp01_c3',
        front: 'Declaration versus definition',
        back:
          'A declaration introduces a name and its type so code can refer to it; a definition also provides the entity (function body, storage for a variable). A name may be declared many times but defined once per program, which is the one-definition rule.',
      },
      {
        id: 'cpp01_c4',
        front: 'What is undefined behaviour? Give three instances.',
        back:
          'Behaviour the standard places no requirement on, so the compiler may assume it never happens and optimise accordingly. Examples: signed integer overflow, reading an uninitialised variable, indexing past the end of an array, dereferencing a null or dangling pointer, and a data race.',
      },
      {
        id: 'cpp01_c5',
        front: 'int8_t x = 200; what happens?',
        back:
          'The value does not fit, so it is converted; since C++20 the conversion is defined as the value modulo 2^8, so x holds -56, and with -Wconversion the compiler warns. The lesson is to pick a type wide enough for the range, which is why flight code uses explicit fixed-width types.',
      },
      {
        id: 'cpp01_c6',
        front: 'Why does -1 < 1u evaluate to false?',
        back:
          'The usual arithmetic conversions promote the signed operand to unsigned, so -1 becomes a very large unsigned value. Mixing signed and unsigned in a comparison is a classic loop-bound bug; compile with -Wsign-compare.',
      },
      {
        id: 'cpp01_c7',
        front: 'Why do flight-software standards mandate types from cstdint?',
        back:
          'int and long have implementation-defined width, so a struct written as a wire format or shared with another processor can change size across a toolchain change. int32_t and uint8_t state exactly what is on the wire.',
      },
      {
        id: 'cpp01_c8',
        front: 'const versus constexpr',
        back:
          'const means this name cannot be modified through this reference; the value may still be computed at runtime. constexpr means it can be evaluated at compile time and, for variables, that it is a compile-time constant usable as an array bound or template argument.',
      },
      {
        id: 'cpp01_c9',
        front: 'Stack, heap and static storage: lifetime of each',
        back:
          'Automatic (stack) objects live until the end of their enclosing scope; dynamic (heap) objects live until explicitly destroyed; static and thread-local objects live for the whole program or thread. Knowing which applies is how you reason about dangling references.',
      },
      {
        id: 'cpp01_c10',
        front: 'enum class versus plain enum',
        back:
          'enum class is scoped (you must write Colour::Red) and does not implicitly convert to int, so it cannot silently mix with unrelated enums or integers. Plain enums leak their enumerators into the surrounding scope.',
      },
      {
        id: 'cpp01_c11',
        front: 'Why compile with -Wall -Wextra -Werror?',
        back:
          'Most C++ defects the compiler can see are reported as warnings, not errors. Treating them as errors is what turns the compiler into your first static analyser, and a warning-free pedantic build is a Power-of-Ten requirement.',
      },
      {
        id: 'cpp01_c12',
        front: 'What does static at file scope do?',
        back:
          'It gives the entity internal linkage, so it is visible only within that translation unit and cannot collide with a same-named symbol elsewhere. An anonymous namespace is the modern, more general way to say the same thing.',
      },
      {
        id: 'cpp01_c13',
        front: 'std::array versus a raw array versus std::vector',
        back:
          'std::array is a fixed-size aggregate with size known at compile time and no heap use, so it is the flight-code default. A raw array decays to a pointer and loses its size. std::vector is heap-allocated and resizable, which is exactly what you cannot have in a hard real-time path.',
      },
    ],
    quiz: [
      {
        id: 'cpp01_q1',
        q: 'A build fails with "multiple definition of dot(Vec3 const&, Vec3 const&)". Most likely cause?',
        choices: [
          'The function was declared but never defined',
          'The definition is in a header included by two translation units without inline',
          'The wrong C++ standard was selected',
          'A missing include guard in a source file',
        ],
        answer: 1,
        explain:
          'Each including translation unit emits its own definition and the linker sees duplicates. Mark it inline, move it to one .cpp, or make it a template.',
        b: 0.5,
        bloom: 'analyze',
      },
      {
        id: 'cpp01_q2',
        q: 'Which is undefined behaviour?',
        choices: [
          'Unsigned integer overflow',
          'Signed integer overflow',
          'Converting a double to an int that fits',
          'Comparing two unrelated pointers for equality',
        ],
        answer: 1,
        explain:
          'Unsigned arithmetic is defined to wrap modulo 2^N. Signed overflow is undefined, which is why compilers can assume loop counters never wrap and why UBSan flags it.',
        b: 0.6,
        bloom: 'recall',
      },
      {
        id: 'cpp01_q3',
        q: 'for (std::size_t i = v.size() - 1; i >= 0; --i) on an empty vector does what?',
        choices: [
          'Skips the loop',
          'Loops once',
          'Runs effectively forever and indexes out of bounds, because size_t is unsigned and never goes below zero',
          'Raises an exception',
        ],
        answer: 2,
        explain:
          'v.size() - 1 on an empty vector wraps to a huge value, and the condition i >= 0 is always true for an unsigned type. Use a reverse iterator or index from size() downwards with a different test.',
        b: 0.9,
        bloom: 'analyze',
      },
      {
        id: 'cpp01_q4',
        q: 'Which statement about -O2 versus -O0 is most important to a flight-software team?',
        choices: [
          '-O2 always produces the same results as -O0',
          '-O2 can expose latent undefined behaviour and change floating-point contraction, so both configurations must be tested',
          '-O0 is unsafe to ship',
          'Optimisation changes the language standard',
        ],
        answer: 1,
        explain:
          'Optimisers exploit the assumption that UB never happens, so a program that works unoptimised can fail optimised. Test what you ship, and also test instrumented builds.',
        b: 0.8,
        bloom: 'understand',
      },
      {
        id: 'cpp01_q5',
        q: 'Why is std::uint8_t preferred over unsigned char for a telemetry byte field?',
        choices: [
          'It is faster',
          'It states the width explicitly and does not change with the platform, which a wire format requires',
          'It cannot overflow',
          'It prints as a number',
        ],
        answer: 1,
        explain:
          'Explicit width is the point. Note that uint8_t is usually a typedef of unsigned char, so it still prints as a character unless you cast.',
        b: 0.2,
        bloom: 'understand',
      },
      {
        id: 'cpp01_q6',
        q: 'What does the linker do that the compiler does not?',
        choices: [
          'Type checking',
          'Template instantiation',
          'Resolving symbol references across translation units and laying out the final image',
          'Preprocessing includes',
        ],
        answer: 2,
        explain:
          'The compiler works one translation unit at a time and emits unresolved symbols; the linker matches them to definitions, picks library members and assigns addresses.',
        b: 0.3,
        bloom: 'understand',
      },
      {
        id: 'cpp01_q7',
        q: 'Which declaration makes a compile-time constant usable as an array bound?',
        choices: ['const int n = f();', 'constexpr int n = 8;', 'static int n = 8;', 'int const* n;'],
        answer: 1,
        explain:
          'constexpr guarantees compile-time evaluation. A const initialised from a runtime call is not a constant expression, and static only affects linkage and storage duration.',
        b: 0.4,
        bloom: 'apply',
      },
    ],
    tags: ['spacex-core', 'cpp'],
    importance: 1.5,
  },

  {
    id: 'cod_cpp_02_memory',
    track: 'coding',
    tier: 4,
    title: 'Memory, Pointers, References and Ownership',
    summary:
      "The object model, the difference between a pointer and a reference, what the stack and heap actually cost, and the ownership vocabulary (unique_ptr, shared_ptr, and why shared_ptr is a poor default in a 1 kHz loop).",
    prereqs: ['cod_cpp_01_basics'],
    hours: 40,
    topics: [
      'Storage duration: automatic, static, thread-local, dynamic; lifetime and initialisation order',
      'Pointers: dereference, arithmetic, nullptr, pointer-to-const vs const pointer, void*, function pointers',
      'References: lvalue and rvalue, binding rules, lifetime extension of temporaries',
      'Array-to-pointer decay and why sizeof breaks at a function boundary',
      'new/delete, new[]/delete[], placement new',
      'The stack: frames, stack overflow, why deep recursion is banned in flight code',
      'The heap: fragmentation, non-deterministic allocation time, allocator behaviour',
      'Dangling pointers, use-after-free, double free, buffer overrun, uninitialised reads',
      'Alignment, alignas, struct padding, offsetof, packing and wire formats',
      'Endianness and serialising telemetry',
      'Strict aliasing; memcpy and std::bit_cast as the legal reinterpretation',
      'volatile: what it does (memory-mapped I/O) and does not do (threads)',
      'Value semantics vs reference semantics; the rule of zero, three and five',
      'unique_ptr, make_unique, shared_ptr and its control block, weak_ptr and cycles',
      'AddressSanitizer as the daily tool for this material',
    ],
    objectives: [
      'Implement a fixed-capacity container with correct construct and destroy semantics and no heap use.',
      'Find and fix injected memory bugs using AddressSanitizer.',
      'Explain the difference between const int*, int* const and const int* const without hesitating.',
      'Say why shared_ptr is inappropriate in a hard real-time control loop, with two distinct reasons.',
      'Compute the size and layout of a struct including padding, and say how to make it match a wire format.',
    ],
    resources: [
      {
        title: 'learncpp.com chapters on compound types, dynamic allocation and smart pointers',
        kind: 'site',
        url: 'https://www.learncpp.com/',
        free: true,
      },
      {
        title: 'C++ Core Guidelines, sections R (resource management) and ES (expressions and statements)',
        author: 'Bjarne Stroustrup and Herb Sutter',
        kind: 'docs',
        url: 'https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines',
        free: true,
      },
      {
        title: 'Effective Modern C++',
        author: 'Scott Meyers',
        kind: 'book',
        free: false,
        note: 'Items 18 to 22 on smart pointers are the relevant chapter here.',
      },
      {
        title: 'AddressSanitizer documentation',
        author: 'LLVM project',
        kind: 'docs',
        url: 'https://clang.llvm.org/docs/AddressSanitizer.html',
        free: true,
      },
    ],
    exercises: [
      {
        id: 'cpp02_ex1',
        title: 'StaticVector with no heap allocation',
        prompt:
          'Implement StaticVector<T, N>: fixed capacity N in a member buffer with no dynamic allocation, supporting push_back (returning false when full), pop_back, size, capacity, empty, operator[] and begin/end. Objects must be constructed in place and destroyed exactly once. Demonstrate correctness with a type whose constructor and destructor print, so the program prints the exact construct and destroy sequence. Expected output for pushing three elements then destroying the container: three ctor lines followed by three dtor lines in reverse order, and no leaked or double-destroyed element.',
        kind: 'code',
        lang: 'cpp',
        starter:
          '#include <cstddef>\n#include <new>\n#include <utility>\n\ntemplate <typename T, std::size_t N>\nclass StaticVector {\npublic:\n    StaticVector() = default;\n    ~StaticVector();\n\n    bool push_back(const T& value);\n    void pop_back();\n    std::size_t size() const { return size_; }\n    static constexpr std::size_t capacity() { return N; }\n    bool empty() const { return size_ == 0; }\n\n    T& operator[](std::size_t i);\n    const T& operator[](std::size_t i) const;\n\nprivate:\n    alignas(T) unsigned char storage_[sizeof(T) * N];\n    std::size_t size_{0};\n    // TODO: a helper returning a T* into storage_\n};\n',
        solution:
          '#include <cstddef>\n#include <new>\n#include <utility>\n\ntemplate <typename T, std::size_t N>\nclass StaticVector {\npublic:\n    StaticVector() = default;\n    StaticVector(const StaticVector&) = delete;\n    StaticVector& operator=(const StaticVector&) = delete;\n\n    ~StaticVector() {\n        while (size_ > 0) pop_back();\n    }\n\n    bool push_back(const T& value) {\n        if (size_ == N) return false;\n        ::new (data() + size_) T(value);\n        ++size_;\n        return true;\n    }\n\n    void pop_back() {\n        if (size_ == 0) return;\n        --size_;\n        (data() + size_)->~T();\n    }\n\n    std::size_t size() const { return size_; }\n    static constexpr std::size_t capacity() { return N; }\n    bool empty() const { return size_ == 0; }\n\n    T& operator[](std::size_t i) { return data()[i]; }\n    const T& operator[](std::size_t i) const { return data()[i]; }\n\n    T* begin() { return data(); }\n    T* end() { return data() + size_; }\n\nprivate:\n    T* data() { return reinterpret_cast<T*>(storage_); }\n    const T* data() const { return reinterpret_cast<const T*>(storage_); }\n\n    alignas(T) unsigned char storage_[sizeof(T) * N];\n    std::size_t size_{0};\n};\n\n// Destruction runs in reverse order because ~StaticVector pops from the back.\n',
        hours: 5,
      },
      {
        id: 'cpp02_ex2',
        title: 'Struct layout and a wire format',
        prompt:
          'Given struct Packet { uint8_t id; uint32_t t_ms; uint16_t flags; double value; }; print sizeof(Packet) and the offsetof each member on a 64-bit build, then reorder the members to minimise padding and print the new size. Finally, write serialise(const Packet&, uint8_t* out) that produces a 15-byte little-endian wire image by shifting each field into place, so the result depends on neither the struct layout nor the host byte order. Expected: the naive struct is 24 bytes, the reordered one is 16, and the wire image is always 15.',
        kind: 'code',
        lang: 'cpp',
        starter:
          '#include <cstdint>\n#include <cstddef>\n#include <cstring>\n#include <cstdio>\n\nstruct Packet {\n    std::uint8_t id;\n    std::uint32_t t_ms;\n    std::uint16_t flags;\n    double value;\n};\n\nint main() {\n    std::printf("%zu\\n", sizeof(Packet));\n    // TODO: offsets, reordered struct, serialise()\n    return 0;\n}\n',
        solution:
          '#include <cstdint>\n#include <cstddef>\n#include <cstring>\n#include <cstdio>\n\nstruct Packet {           // 24 bytes: 1 + 3 pad + 4 + 2 + 6 pad + 8\n    std::uint8_t id;\n    std::uint32_t t_ms;\n    std::uint16_t flags;\n    double value;\n};\n\nstruct PacketPacked {     // 16 bytes: 8 + 4 + 2 + 1 + 1 pad\n    double value;\n    std::uint32_t t_ms;\n    std::uint16_t flags;\n    std::uint8_t id;\n};\n\n// Shifting is what makes the image little-endian on every host. A memcpy of\n// the field copies the HOST byte order, which only looks right on a\n// little-endian machine.\nstatic void put_u16(std::uint8_t* out, std::uint16_t v) {\n    for (int i = 0; i < 2; ++i) out[i] = std::uint8_t(v >> (8 * i));\n}\nstatic void put_u32(std::uint8_t* out, std::uint32_t v) {\n    for (int i = 0; i < 4; ++i) out[i] = std::uint8_t(v >> (8 * i));\n}\nstatic void put_f64(std::uint8_t* out, double v) {\n    std::uint64_t bits;\n    std::memcpy(&bits, &v, 8);   // type pun only; the shifts below fix the order\n    for (int i = 0; i < 8; ++i) out[i] = std::uint8_t(bits >> (8 * i));\n}\n\n// 15-byte little-endian wire image, independent of struct layout and of host\n// byte order.\nvoid serialise(const Packet& p, std::uint8_t* out) {\n    std::size_t k = 0;\n    out[k] = p.id;              k += 1;\n    put_u32(out + k, p.t_ms);   k += 4;\n    put_u16(out + k, p.flags);  k += 2;\n    put_f64(out + k, p.value);  k += 8;  // k == 15\n}\n\nint main() {\n    std::printf("%zu\\n", sizeof(Packet));        // 24\n    std::printf("%zu\\n", offsetof(Packet, t_ms)); // 4\n    std::printf("%zu\\n", offsetof(Packet, value));// 16\n    std::printf("%zu\\n", sizeof(PacketPacked));   // 16\n\n    Packet p{0x2a, 0x11223344, 0xbeef, 1.0};\n    std::uint8_t wire[15];\n    serialise(p, wire);\n    for (std::size_t i = 0; i < sizeof wire; ++i) std::printf("%02x ", wire[i]);\n    std::printf("\\n");  // 2a 44 33 22 11 ef be 00 00 00 00 00 00 f0 3f\n    return 0;\n}\n',
        hours: 3,
      },
    ],
    cards: [
      {
        id: 'cpp02_c1',
        front: 'const int*, int* const, const int* const',
        back:
          'Pointer to const int (the pointee cannot be modified through it); const pointer to int (the pointer cannot be repointed); const pointer to const int (neither). Read the declaration right to left from the name.',
      },
      {
        id: 'cpp02_c2',
        front: 'Pointer versus reference: the practical differences',
        back:
          'A reference must be bound at initialisation, cannot be rebound and cannot be null; a pointer can be null, reseated and arithmetic-ed. Use a reference for a required parameter, a pointer (or std::optional) when absence is meaningful.',
      },
      {
        id: 'cpp02_c3',
        front: 'Explain RAII in three sentences',
        back:
          'Every resource is owned by an object. Acquisition happens in the constructor and release in the destructor. Because destructors run automatically at scope exit, including during exception propagation, the resource cannot leak.',
      },
      {
        id: 'cpp02_c4',
        front: 'Why is shared_ptr a poor default in a 1 kHz control loop?',
        back:
          'Its reference count is atomic, so every copy is a synchronised read-modify-write; and destruction happens at an unpredictable point in whichever thread drops the last reference, which makes timing non-deterministic. It also costs a second allocation unless you use make_shared.',
      },
      {
        id: 'cpp02_c5',
        front: 'unique_ptr: what does it cost?',
        back:
          'Nothing at runtime compared to a raw pointer with a stateless deleter; it is the same size and compiles to the same code plus the delete at scope exit. It buys exclusive ownership expressed in the type system.',
      },
      {
        id: 'cpp02_c6',
        front: 'Why is new banned after initialisation in flight software?',
        back:
          'Allocation time is not bounded (the allocator may search free lists or take a lock), and long-running allocation and release fragments the heap so a later request can fail with memory still available. Both are unacceptable when a deadline must be met every cycle for years.',
      },
      {
        id: 'cpp02_c7',
        front: 'What is struct padding and why does a wire format not use the struct?',
        back:
          'The compiler inserts padding so each member meets its alignment requirement, and the amounts differ by ABI and compiler. Serialise field by field with memcpy in a defined order and endianness instead of memcpy-ing the whole struct.',
      },
      {
        id: 'cpp02_c8',
        front: 'What does volatile guarantee and not guarantee?',
        back:
          'It prevents the compiler from eliding or reordering accesses to that object relative to other volatile accesses, which is what memory-mapped hardware registers require. It provides no atomicity and no inter-thread ordering, so it is not a threading tool.',
      },
      {
        id: 'cpp02_c9',
        front: 'What does array-to-pointer decay break?',
        back:
          'sizeof. Inside a function taking T* the size information is gone, so sizeof gives the pointer size. Pass std::array, std::span or an explicit length.',
      },
      {
        id: 'cpp02_c10',
        front: 'What is a dangling reference and the most common way to create one?',
        back:
          'A reference to an object whose lifetime has ended. The classic is returning a reference or pointer to a local, or holding a reference into a vector that then reallocates on push_back.',
      },
      {
        id: 'cpp02_c11',
        front: 'Rule of zero, three, five',
        back:
          'Rule of zero: design classes so that no special member is needed, letting members manage themselves. If you must write a destructor, copy constructor or copy assignment, you probably need all three (rule of three) plus the move pair (rule of five).',
      },
      {
        id: 'cpp02_c12',
        front: 'Why does strict aliasing matter, and what is the legal way to reinterpret bytes?',
        back:
          'The compiler assumes objects of unrelated types do not overlap, so a reinterpret_cast read of a float through an int* is undefined and can be optimised into nonsense. Use std::memcpy or, in C++20, std::bit_cast.',
      },
      {
        id: 'cpp02_c13',
        front: 'Why is deep recursion banned in flight code?',
        back:
          'Stack depth becomes data-dependent and unbounded, so static stack analysis cannot prove the worst case and an overflow corrupts memory silently. Rule 1 of the NASA/JPL Power of Ten forbids recursion for exactly this reason.',
      },
      {
        id: 'cpp02_c14',
        front: 'What does AddressSanitizer catch?',
        back:
          'Heap and stack buffer overflow, use-after-free, use-after-return and scope, double free, and with LeakSanitizer, leaks. It costs about 2x on typical code and several times that when the code is memory-dense, plus roughly 2x peak memory, which is why it belongs in CI rather than in a flight build.',
      },
    ],
    quiz: [
      {
        id: 'cpp02_q1',
        q: 'std::vector<double> v; double& r = v[0]; v.push_back(1.0); r = 2.0; What is wrong?',
        choices: [
          'Nothing',
          'v[0] on an empty vector is already out of bounds, and push_back may reallocate, leaving r dangling',
          'push_back cannot be called after taking a reference',
          'r must be const',
        ],
        answer: 1,
        explain:
          'Two defects: indexing an empty vector is undefined, and reallocation invalidates all references and iterators. ASan reports the resulting use-after-free immediately.',
        b: 0.7,
        bloom: 'analyze',
      },
      {
        id: 'cpp02_q2',
        q: 'Which is the best default for an object a function must own exclusively?',
        choices: ['raw pointer with delete', 'std::unique_ptr', 'std::shared_ptr', 'A global'],
        answer: 1,
        explain:
          'unique_ptr encodes exclusive ownership at zero runtime cost and makes transfer explicit through move. shared_ptr implies shared lifetime that nobody asked for.',
        b: -0.2,
        bloom: 'apply',
      },
      {
        id: 'cpp02_q3',
        q: 'Two distinct reasons heap allocation is forbidden in a hard real-time task are:',
        choices: [
          'It is slow, and it uses more memory',
          'Its worst-case time is unbounded, and long-run fragmentation can make a request fail with memory still free',
          'It requires exceptions, and it needs the STL',
          'It is not supported on embedded targets',
        ],
        answer: 1,
        explain:
          'Determinism and fragmentation are the two arguments. Average speed is not the issue; a deadline cares about the worst case.',
        b: 0.6,
        bloom: 'understand',
      },
      {
        id: 'cpp02_q4',
        q: 'struct S { uint8_t a; uint32_t b; uint8_t c; }; On a typical 64-bit ABI, sizeof(S) is:',
        choices: ['6', '9', '12', '16'],
        answer: 2,
        explain:
          'a at 0, three bytes of padding, b at 4, c at 8, then three trailing bytes so the whole struct keeps 4-byte alignment in an array: 12.',
        b: 0.8,
        bloom: 'apply',
      },
      {
        id: 'cpp02_q5',
        q: 'What does marking a shared flag volatile achieve for two threads?',
        choices: [
          'It makes reads and writes atomic',
          'It establishes happens-before ordering',
          'Neither: it only constrains compiler elision and reordering of volatile accesses, so a data race remains',
          'It is equivalent to std::atomic',
        ],
        answer: 2,
        explain:
          'volatile is for memory-mapped hardware. Inter-thread communication needs std::atomic or a mutex; volatile gives neither atomicity nor ordering against non-volatile accesses.',
        b: 0.9,
        bloom: 'analyze',
      },
      {
        id: 'cpp02_q6',
        q: 'Which reinterpretation of the bytes of a float as a uint32_t is well-defined?',
        choices: [
          '*reinterpret_cast<uint32_t*>(&f)',
          'union { float f; uint32_t u; }',
          'std::memcpy(&u, &f, sizeof u) or std::bit_cast<uint32_t>(f)',
          'static_cast<uint32_t>(f)',
        ],
        answer: 2,
        explain:
          'memcpy and bit_cast are the standard-blessed routes. The reinterpret_cast form violates strict aliasing, the union type-pun is defined in C but not in C++, and static_cast converts the value, not the bits.',
        b: 1.0,
        bloom: 'analyze',
      },
      {
        id: 'cpp02_q7',
        q: 'A function returns a reference to a local std::string. Calling it gives garbage. Which tool finds this fastest?',
        choices: ['Valgrind memcheck', 'AddressSanitizer (use-after-return detection)', 'ThreadSanitizer', 'gprof'],
        answer: 1,
        explain:
          'ASan with use-after-return detection reports the stale stack frame directly; Valgrind is weaker on stack lifetime issues, and TSan and gprof address different problems.',
        b: 0.7,
        bloom: 'apply',
      },
      {
        id: 'cpp02_q8',
        q: 'What is the size and runtime overhead of std::unique_ptr with the default deleter?',
        choices: [
          'Two pointers and a virtual call',
          'The same as a raw pointer, with no runtime overhead beyond the delete itself',
          'A control block allocation',
          'An atomic counter',
        ],
        answer: 1,
        explain:
          'The stateless default deleter is empty-base optimised away. The control block and atomic counter belong to shared_ptr.',
        b: 0.5,
        bloom: 'recall',
      },
    ],
    tags: ['spacex-core', 'cpp'],
    importance: 1.5,
  },

  {
    id: 'cod_cpp_03_raii',
    track: 'coding',
    tier: 5,
    title: 'Classes, RAII in Depth and the Object Lifecycle',
    summary:
      "Constructors, destructors, the copy and move pairs, and the special-member generation rules. This is where C++ stops being C with classes and starts being a language about ownership and lifetime.",
    prereqs: ['cod_cpp_02_memory'],
    hours: 35,
    topics: [
      'Constructors: default, parameterised, delegating, converting, explicit',
      'Member initialiser lists and the actual initialisation order (declaration order, not list order)',
      'Destructors; virtual destructors for polymorphic bases',
      'Copy constructor and copy assignment; deep versus shallow',
      'Move constructor and move assignment; noexcept on moves and why containers check it',
      '= default and = delete; the special-member generation rules',
      'Rule of five and rule of zero; copy-and-swap',
      'const member functions and mutable',
      'static members; friend functions',
      'Operator overloading: arithmetic, comparison and the spaceship operator, subscript, call, stream',
      'Inheritance, virtual, override, final; pure virtual and abstract classes',
      'vtables and the real cost of dynamic dispatch',
      'Object slicing and how to prevent it',
      'Composition over inheritance; CRTP for static polymorphism',
      'std::variant plus std::visit as a closed-set alternative to virtual dispatch',
      'PIMPL for compilation firewalls',
    ],
    objectives: [
      'Write three RAII types: a scoped timer, a file handle and a lock guard.',
      'Implement a Matrix3 with the full rule of five and correct operator overloads.',
      'Explain exactly when the compiler will and will not generate a move constructor.',
      'Measure virtual dispatch versus CRTP in a hot loop and interpret the result.',
      'Identify object slicing in a code review and propose the fix.',
    ],
    resources: [
      {
        title: 'Effective Modern C++',
        author: 'Scott Meyers',
        kind: 'book',
        free: false,
        note: 'Items 11, 17 and 23 to 30 cover this material precisely.',
      },
      {
        title: 'C++ Software Design',
        author: 'Klaus Iglberger',
        kind: 'book',
        free: false,
        note: 'The best modern treatment of value semantics versus inheritance-based design.',
      },
      {
        title: 'C++ Core Guidelines, section C (classes and class hierarchies)',
        kind: 'docs',
        url: 'https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#S-class',
        free: true,
      },
    ],
    exercises: [
      {
        id: 'cpp03_ex1',
        title: 'Three RAII types',
        prompt:
          'Implement ScopedTimer (prints elapsed microseconds on destruction), FileHandle (owns a FILE*, closes in the destructor, move-only) and MutexLock (locks in the constructor, unlocks in the destructor, non-copyable and non-movable). Each must be correct under an exception thrown inside the guarded scope. Demonstrate with a program that throws inside each scope and prints the release message; the expected output shows every resource released exactly once, in reverse construction order, before the exception is reported.',
        kind: 'code',
        lang: 'cpp',
        starter:
          '#include <chrono>\n#include <cstdio>\n#include <mutex>\n#include <utility>\n\nclass ScopedTimer {\npublic:\n    explicit ScopedTimer(const char* name);\n    ~ScopedTimer();\n    ScopedTimer(const ScopedTimer&) = delete;\n    ScopedTimer& operator=(const ScopedTimer&) = delete;\nprivate:\n    const char* name_;\n    std::chrono::steady_clock::time_point t0_;\n};\n\nclass FileHandle {\n    // TODO: move-only ownership of a FILE*\n};\n',
        solution:
          '#include <chrono>\n#include <cstdio>\n#include <mutex>\n#include <utility>\n\nclass ScopedTimer {\npublic:\n    explicit ScopedTimer(const char* name)\n        : name_(name), t0_(std::chrono::steady_clock::now()) {}\n    ~ScopedTimer() {\n        const auto us = std::chrono::duration_cast<std::chrono::microseconds>(\n            std::chrono::steady_clock::now() - t0_).count();\n        std::printf("%s: %lld us\\n", name_, static_cast<long long>(us));\n    }\n    ScopedTimer(const ScopedTimer&) = delete;\n    ScopedTimer& operator=(const ScopedTimer&) = delete;\nprivate:\n    const char* name_;\n    std::chrono::steady_clock::time_point t0_;\n};\n\nclass FileHandle {\npublic:\n    FileHandle() = default;\n    FileHandle(const char* path, const char* mode) : f_(std::fopen(path, mode)) {}\n    ~FileHandle() { reset(); }\n\n    FileHandle(const FileHandle&) = delete;\n    FileHandle& operator=(const FileHandle&) = delete;\n\n    FileHandle(FileHandle&& other) noexcept : f_(other.f_) { other.f_ = nullptr; }\n    FileHandle& operator=(FileHandle&& other) noexcept {\n        if (this != &other) { reset(); f_ = other.f_; other.f_ = nullptr; }\n        return *this;\n    }\n\n    bool valid() const { return f_ != nullptr; }\n    std::FILE* get() const { return f_; }\n\nprivate:\n    void reset() {\n        if (f_) { std::fclose(f_); std::puts("file closed"); f_ = nullptr; }\n    }\n    std::FILE* f_{nullptr};\n};\n\nclass MutexLock {\npublic:\n    explicit MutexLock(std::mutex& m) : m_(m) { m_.lock(); }\n    ~MutexLock() { m_.unlock(); std::puts("mutex released"); }\n    MutexLock(const MutexLock&) = delete;\n    MutexLock& operator=(const MutexLock&) = delete;\nprivate:\n    std::mutex& m_;\n};\n',
        hours: 3,
      },
      {
        id: 'cpp03_ex2',
        title: 'Matrix3 with the rule of five and operators',
        prompt:
          'Implement a 3x3 matrix class holding its nine doubles by value, with default and element constructors, operator* for matrix-matrix and matrix-vector, operator+ and operator-, transpose(), determinant(), a stream operator, and a comment justifying why the rule of zero applies here rather than the rule of five. Then write a second version that heap-allocates its storage and implement the full rule of five for it, so you have written both. Expected demonstration output: the product of a 90-degree z rotation with its transpose prints the identity to within 1e-15.',
        kind: 'code',
        lang: 'cpp',
        starter:
          '#include <array>\n#include <cmath>\n#include <cstdio>\n\nclass Matrix3 {\npublic:\n    Matrix3() = default;                       // zero matrix\n    static Matrix3 identity();\n    double& operator()(int r, int c) { return m_[3 * r + c]; }\n    double operator()(int r, int c) const { return m_[3 * r + c]; }\n    // TODO: operator*, operator+, transpose, determinant\nprivate:\n    std::array<double, 9> m_{};\n};\n',
        solution:
          '#include <array>\n#include <cmath>\n#include <cstdio>\n\n// Rule of zero: every member (std::array<double,9>) manages itself, so the\n// compiler-generated copy, move and destructor are already correct and optimal.\nclass Matrix3 {\npublic:\n    Matrix3() = default;\n    static Matrix3 identity() {\n        Matrix3 r;\n        r(0, 0) = r(1, 1) = r(2, 2) = 1.0;\n        return r;\n    }\n    static Matrix3 rot_z(double a) {\n        Matrix3 r = identity();\n        const double c = std::cos(a), s = std::sin(a);\n        r(0, 0) = c;  r(0, 1) = s;\n        r(1, 0) = -s; r(1, 1) = c;\n        return r;\n    }\n\n    double& operator()(int r, int c) { return m_[3 * r + c]; }\n    double operator()(int r, int c) const { return m_[3 * r + c]; }\n\n    Matrix3 operator*(const Matrix3& b) const {\n        Matrix3 out;\n        for (int i = 0; i < 3; ++i)\n            for (int j = 0; j < 3; ++j) {\n                double s = 0.0;\n                for (int k = 0; k < 3; ++k) s += (*this)(i, k) * b(k, j);\n                out(i, j) = s;\n            }\n        return out;\n    }\n\n    Matrix3 operator+(const Matrix3& b) const {\n        Matrix3 out;\n        for (int i = 0; i < 9; ++i) out.m_[i] = m_[i] + b.m_[i];\n        return out;\n    }\n\n    Matrix3 transpose() const {\n        Matrix3 out;\n        for (int i = 0; i < 3; ++i)\n            for (int j = 0; j < 3; ++j) out(j, i) = (*this)(i, j);\n        return out;\n    }\n\n    double determinant() const {\n        const Matrix3& a = *this;\n        return a(0,0)*(a(1,1)*a(2,2)-a(1,2)*a(2,1))\n             - a(0,1)*(a(1,0)*a(2,2)-a(1,2)*a(2,0))\n             + a(0,2)*(a(1,0)*a(2,1)-a(1,1)*a(2,0));\n    }\n\nprivate:\n    std::array<double, 9> m_{};\n};\n\nint main() {\n    const Matrix3 r = Matrix3::rot_z(1.5707963267948966);\n    const Matrix3 p = r * r.transpose();\n    std::printf("%.1f %.1f %.1f\\n", p(0,0), p(1,1), p(2,2));  // 1.0 1.0 1.0\n    std::printf("%.6f\\n", r.determinant());                   // 1.000000\n    return 0;\n}\n',
        hours: 4,
      },
    ],
    cards: [
      {
        id: 'cpp03_c1',
        front: 'In what order are members initialised?',
        back:
          'In the order they are declared in the class, regardless of the order written in the member initialiser list. Writing them out of order earns a warning and is a real bug source when one member is initialised from another.',
      },
      {
        id: 'cpp03_c2',
        front: 'Why must a polymorphic base class have a virtual destructor?',
        back:
          'Deleting a derived object through a base pointer with a non-virtual destructor is undefined behaviour: only the base destructor runs, so derived members leak. Either make it virtual or make the destructor protected and non-virtual to forbid that deletion.',
      },
      {
        id: 'cpp03_c3',
        front: 'When does the compiler NOT generate a move constructor?',
        back:
          'When the class declares any of: a copy constructor, a copy assignment operator, a move assignment operator, or a destructor. Declaring a destructor silently costs you moves, which is a common reason a class becomes accidentally copy-heavy.',
      },
      {
        id: 'cpp03_c4',
        front: 'What does std::move actually do?',
        back:
          'It is an unconditional cast to an rvalue reference. It moves nothing by itself; it merely makes the expression eligible to bind to a move constructor or move assignment that can then steal the resources.',
      },
      {
        id: 'cpp03_c5',
        front: 'Why do move operations need to be noexcept?',
        back:
          'std::vector reallocation uses move_if_noexcept: if the move constructor is not noexcept it copies instead, to preserve the strong exception guarantee. A missing noexcept silently turns your moves back into copies.',
      },
      {
        id: 'cpp03_c6',
        front: 'What is object slicing?',
        back:
          'Assigning or copying a derived object into a base-typed variable copies only the base part, discarding derived state and the dynamic type. Prevent it by passing polymorphic objects by reference or pointer and by making base classes non-copyable.',
      },
      {
        id: 'cpp03_c7',
        front: 'What does a vtable cost?',
        back:
          'One pointer per object plus an indirect call per virtual invocation, which usually blocks inlining and may mispredict. That is often fine, and is unacceptable in a tight inner loop, which is why CRTP or std::variant appear in hot flight-code paths.',
      },
      {
        id: 'cpp03_c8',
        front: 'Rule of zero: state it',
        back:
          'Prefer classes whose members already manage their own resources, so you write none of the five special members and get correct copy, move and destruction for free. Writing any of them is a sign a resource is being managed by hand.',
      },
      {
        id: 'cpp03_c9',
        front: 'Why mark single-argument constructors explicit?',
        back:
          'Otherwise they define an implicit conversion, so a function expecting your type silently accepts an unrelated value. explicit makes the conversion opt-in and eliminates a whole class of surprising overload resolution.',
      },
      {
        id: 'cpp03_c10',
        front: 'copy-and-swap: what problem does it solve?',
        back:
          'It writes assignment once, in terms of the copy constructor and a noexcept swap, giving self-assignment safety and the strong exception guarantee with no duplicated cleanup logic. Its cost is always making a copy, which matters in hot paths.',
      },
      {
        id: 'cpp03_c11',
        front: 'CRTP in one sentence, and why flight code cares',
        back:
          'A base class templated on its derived type, so calls are resolved at compile time and inlined, giving polymorphic structure with zero dispatch overhead and no vtable pointer in the object.',
      },
      {
        id: 'cpp03_c12',
        front: 'When is std::variant plus std::visit better than virtual dispatch?',
        back:
          'When the set of alternatives is closed and known at compile time, as mode-machine states usually are. You get no heap allocation, no vtable, value semantics, and the compiler tells you when a visitor forgets a case.',
      },
      {
        id: 'cpp03_c13',
        front: 'What does override buy you?',
        back:
          'A compile error if the function does not actually override a base virtual, which catches a silently different signature, most often a missing const. It costs nothing and should be on every overriding function.',
      },
      {
        id: 'cpp03_c14',
        front: 'const member function: what is it promising?',
        back:
          'That it does not modify the observable state of the object, so it can be called on a const instance. mutable exempts a member, which is legitimate for a cache or a mutex and a smell for anything else.',
      },
    ],
    quiz: [
      {
        id: 'cpp03_q1',
        q: 'A class declares a destructor to log its destruction. What happens to its move operations?',
        choices: [
          'They are still generated',
          'They are not generated, so moves silently become copies',
          'The class becomes non-copyable',
          'It is a compile error',
        ],
        answer: 1,
        explain:
          'Declaring a destructor suppresses implicit move generation. Copies remain (deprecated but generated), so the code still compiles and just runs slower.',
        b: 1.0,
        bloom: 'analyze',
      },
      {
        id: 'cpp03_q2',
        q: 'What does std::move(x) do?',
        choices: [
          'Moves the contents of x immediately',
          'Casts x to an rvalue reference, enabling an overload that can steal its resources',
          'Deletes x',
          'Copies x into a temporary',
        ],
        answer: 1,
        explain:
          'It is a cast and nothing more. If no move-enabled overload exists, the expression binds to a copy and nothing is stolen.',
        b: 0.4,
        bloom: 'understand',
      },
      {
        id: 'cpp03_q3',
        q: 'void f(Base b) is called with a Derived object. What happens?',
        choices: [
          'Virtual calls inside f dispatch to Derived',
          'The Derived part is sliced away and virtual calls resolve to Base',
          'A compile error',
          'An exception at runtime',
        ],
        answer: 1,
        explain:
          'Pass-by-value constructs a Base from the Base subobject. Take Base& or const Base& to preserve the dynamic type.',
        b: 0.7,
        bloom: 'analyze',
      },
      {
        id: 'cpp03_q4',
        q: 'struct S { int a; int b; S(int x) : b(x), a(b) {} }; What is the defect?',
        choices: [
          'It will not compile',
          'a is initialised before b because members initialise in declaration order, so a reads an uninitialised b',
          'b is initialised twice',
          'Nothing is wrong',
        ],
        answer: 1,
        explain:
          'Declaration order wins over list order. Compilers warn with -Wreorder; the fix is to initialise a from x directly.',
        b: 1.1,
        bloom: 'analyze',
      },
      {
        id: 'cpp03_q5',
        q: 'Which is the best reason to prefer std::variant over virtual dispatch for a vehicle mode state machine?',
        choices: [
          'It is easier to type',
          'The alternative set is closed, so you get value semantics, no allocation and exhaustiveness checking',
          'variant is faster for open hierarchies',
          'virtual dispatch cannot be used on embedded targets',
        ],
        answer: 1,
        explain:
          'The modes of a launch vehicle are a fixed list. variant makes that explicit in the type, avoids heap use and lets the compiler catch a forgotten mode in a visitor.',
        b: 0.8,
        bloom: 'understand',
      },
      {
        id: 'cpp03_q6',
        q: 'Your move constructor is not marked noexcept. What does std::vector do on reallocation?',
        choices: [
          'Moves anyway',
          'Copies instead, to preserve the strong exception guarantee',
          'Throws',
          'Uses memcpy',
        ],
        answer: 1,
        explain:
          'move_if_noexcept falls back to copying so a throwing move cannot leave the vector in a broken half-moved state. Marking the move noexcept is usually free and often a large speedup.',
        b: 1.0,
        bloom: 'analyze',
      },
      {
        id: 'cpp03_q7',
        q: 'Where does a virtual destructor matter most in flight software?',
        choices: [
          'Nowhere; flight code never uses inheritance',
          'Anywhere an object is deleted through a base pointer, which is also a reason many teams avoid owning polymorphic objects at all',
          'Only for classes with virtual functions and no data',
          'Only in template code',
        ],
        answer: 1,
        explain:
          'The rule is about deletion through a base pointer. Flight-code style often sidesteps the whole question by avoiding dynamic allocation and polymorphic ownership.',
        b: 0.5,
        bloom: 'understand',
      },
      {
        id: 'cpp03_q8',
        q: 'A hot loop calls a virtual function ten million times. CRTP converts it to a direct call. What is the main source of the speedup?',
        choices: [
          'Smaller object size',
          'Inlining becomes possible, which also exposes the body to further optimisation',
          'Fewer cache misses on the data',
          'The compiler skips bounds checks',
        ],
        answer: 1,
        explain:
          'The indirect call itself is cheap; the real cost is the optimisation barrier. Once inlined, constant propagation and vectorisation can apply.',
        b: 1.2,
        bloom: 'analyze',
      },
    ],
    tags: ['spacex-core', 'cpp'],
    importance: 1.5,
  },

  {
    id: 'cod_cpp_04_stl',
    track: 'coding',
    tier: 6,
    title: 'The Standard Library: Containers, Algorithms, Lambdas',
    summary:
      "Choosing the right container from the access pattern, replacing raw loops with algorithms, and knowing which parts of the standard library a flight-software coding standard will let you keep.",
    prereqs: ['cod_cpp_03_raii'],
    hours: 35,
    topics: [
      'array, vector (size vs capacity, reserve, iterator invalidation), deque, list',
      'map and set (red-black tree, ordered, node-based, cache-hostile)',
      'unordered_map and unordered_set: hashing, load factor, worst case',
      'span and string_view: non-owning views, and the dangling-view hazard',
      'optional, variant, tuple, pair, bitset',
      'Iterators and their categories; per-container invalidation rules',
      'Algorithms: sort, stable_sort, nth_element, lower_bound, binary_search, find_if',
      'transform, accumulate, reduce, copy_if, all_of/any_of/none_of, clamp, rotate, unique',
      'The erase-remove idiom and C++20 std::erase_if',
      'numeric: iota, inner_product, partial_sum',
      'Execution policies and parallel algorithms',
      'Lambdas: capture by value and reference, init-capture, mutable, generic lambdas',
      'std::function versus templates versus function pointers, and its allocation',
      'chrono: steady_clock for intervals, system_clock for wall time, never mixed',
      'random: engines, distributions, reproducible seeding for Monte Carlo',
      'C++20 ranges and views',
      'Error handling: exceptions, error_code, expected, and why flight code disables exceptions',
    ],
    objectives: [
      'Pick the right container for a stated access pattern and defend it against two alternatives.',
      'Rewrite a loop-heavy file using algorithms without changing behaviour.',
      'State the iterator-invalidation rule for vector, deque, map and unordered_map.',
      'Use chrono correctly for a control-loop period and for a telemetry timestamp.',
      'Explain the erase-remove idiom and why erase alone is the common bug.',
    ],
    resources: [
      {
        title: 'cppreference: containers and algorithms library',
        kind: 'docs',
        url: 'https://en.cppreference.com/w/cpp/container',
        free: true,
      },
      {
        title: 'Effective STL',
        author: 'Scott Meyers',
        kind: 'book',
        free: false,
        note: 'Dated on syntax, still the clearest reasoning about container choice.',
      },
      {
        title: 'The C++ Standard Library, 2nd ed.',
        author: 'Nicolai M. Josuttis',
        kind: 'book',
        free: false,
        note: 'Reference-grade coverage; use it to look things up, not to read cover to cover.',
      },
    ],
    exercises: [
      {
        id: 'cpp04_ex1',
        title: 'Reimplement two algorithms as templates',
        prompt:
          'Write my_accumulate(first, last, init, op) and my_find_if(first, last, pred) as function templates working with any forward iterator, then use them on a std::vector<double> and a std::array<int,5>. Show that they compile for both and produce the same results as the standard versions. Expected output: for the vector {1.5, 2.5, 3.0} the sum prints 7.0, and find_if for the first value above 2.0 prints index 1.',
        kind: 'code',
        lang: 'cpp',
        starter:
          '#include <array>\n#include <cstdio>\n#include <vector>\n\ntemplate <typename It, typename T, typename Op>\nT my_accumulate(It first, It last, T init, Op op) {\n    // TODO\n    return init;\n}\n\ntemplate <typename It, typename Pred>\nIt my_find_if(It first, It last, Pred pred) {\n    // TODO\n    return last;\n}\n',
        solution:
          '#include <array>\n#include <cstdio>\n#include <vector>\n\ntemplate <typename It, typename T, typename Op>\nT my_accumulate(It first, It last, T init, Op op) {\n    for (; first != last; ++first) init = op(init, *first);\n    return init;\n}\n\ntemplate <typename It, typename Pred>\nIt my_find_if(It first, It last, Pred pred) {\n    for (; first != last; ++first)\n        if (pred(*first)) return first;\n    return last;\n}\n\nint main() {\n    const std::vector<double> v{1.5, 2.5, 3.0};\n    const double s = my_accumulate(v.begin(), v.end(), 0.0,\n                                   [](double a, double b) { return a + b; });\n    std::printf("%.1f\\n", s);                                     // 7.0\n    const auto it = my_find_if(v.begin(), v.end(),\n                               [](double x) { return x > 2.0; });\n    std::printf("%td\\n", it - v.begin());                          // 1\n\n    const std::array<int, 5> a{1, 2, 3, 4, 5};\n    std::printf("%d\\n", my_accumulate(a.begin(), a.end(), 0,\n                                      [](int x, int y) { return x + y; }));  // 15\n    return 0;\n}\n',
        hours: 2.5,
      },
      {
        id: 'cpp04_ex2',
        title: 'Container choice under measurement',
        prompt:
          'Build a 128-entry telemetry channel table keyed by a 16-bit channel id and benchmark 10 million lookups three ways: std::map, std::unordered_map, and a sorted std::array searched with std::lower_bound. Report the three timings, the memory footprint, and which you would ship in flight code and why. Expected finding: the sorted array is competitive or fastest at this size and is the only one of the three with no dynamic allocation.',
        kind: 'code',
        lang: 'cpp',
        starter:
          '#include <algorithm>\n#include <array>\n#include <chrono>\n#include <cstdint>\n#include <cstdio>\n#include <map>\n#include <unordered_map>\n\nstruct Entry { std::uint16_t id; double scale; };\n\nint main() {\n    // TODO: build the three structures, time 10e6 lookups each with steady_clock\n    return 0;\n}\n',
        solution:
          '#include <algorithm>\n#include <array>\n#include <chrono>\n#include <cstdint>\n#include <cstdio>\n#include <map>\n#include <unordered_map>\n\nstruct Entry { std::uint16_t id; double scale; };\n\nint main() {\n    constexpr int N = 128;\n    std::array<Entry, N> sorted{};\n    std::map<std::uint16_t, double> tree;\n    std::unordered_map<std::uint16_t, double> hash;\n    for (int i = 0; i < N; ++i) {\n        const auto id = static_cast<std::uint16_t>(i * 7 + 1);\n        sorted[static_cast<std::size_t>(i)] = Entry{id, 0.5 * i};\n        tree[id] = 0.5 * i;\n        hash[id] = 0.5 * i;\n    }\n    std::sort(sorted.begin(), sorted.end(),\n              [](const Entry& a, const Entry& b) { return a.id < b.id; });\n\n    auto bench = [](const char* name, auto&& lookup) {\n        const auto t0 = std::chrono::steady_clock::now();\n        double acc = 0.0;\n        for (int k = 0; k < 10000000; ++k) acc += lookup(static_cast<std::uint16_t>((k % 128) * 7 + 1));\n        const auto us = std::chrono::duration_cast<std::chrono::microseconds>(\n            std::chrono::steady_clock::now() - t0).count();\n        std::printf("%s %lld us (acc %.1f)\\n", name, static_cast<long long>(us), acc);\n    };\n\n    bench("map      ", [&](std::uint16_t id) { return tree.find(id)->second; });\n    bench("unordered", [&](std::uint16_t id) { return hash.find(id)->second; });\n    bench("sorted   ", [&](std::uint16_t id) {\n        const auto it = std::lower_bound(sorted.begin(), sorted.end(), id,\n            [](const Entry& e, std::uint16_t v) { return e.id < v; });\n        return it->scale;\n    });\n    return 0;\n}\n',
        hours: 3,
      },
    ],
    cards: [
      {
        id: 'cpp04_c1',
        front: 'vector: size versus capacity',
        back:
          'size is how many elements exist; capacity is how many fit before reallocation. push_back beyond capacity allocates a larger buffer, moves everything and invalidates every iterator, pointer and reference into the vector.',
      },
      {
        id: 'cpp04_c2',
        front: 'Explain the erase-remove idiom',
        back:
          'std::remove does not remove: it shifts the surviving elements forward and returns the new logical end, leaving the tail unspecified. You must call container.erase(new_end, end()) to actually shrink. C++20 std::erase_if does both in one call.',
      },
      {
        id: 'cpp04_c3',
        front: 'Which container for a fixed 128-entry table looked up by id in flight code?',
        back:
          'A sorted std::array with std::lower_bound, or a perfect-hash lookup. It is contiguous, cache-friendly, allocation-free and its worst case is a bounded log2(128) = 7 comparisons, which a real-time analysis can use.',
      },
      {
        id: 'cpp04_c4',
        front: 'Why is std::map often slower than a sorted vector for small N?',
        back:
          'It is a node-based red-black tree: every node is a separate allocation, so traversal chases pointers and misses cache. A contiguous array of the same data fits in a few cache lines.',
      },
      {
        id: 'cpp04_c5',
        front: 'unordered_map worst case',
        back:
          'O(n) per operation when many keys collide in one bucket, and rehashing on growth invalidates all iterators (though not references to elements). The average O(1) is a statement about a good hash, not a guarantee.',
      },
      {
        id: 'cpp04_c6',
        front: 'What is std::span for?',
        back:
          'A non-owning view of a contiguous sequence with its length: pointer plus size, in one parameter. It replaces the pointer-and-length pair in interfaces and works for arrays, vectors and fixed buffers alike, which is ideal for flight-code buffer passing.',
      },
      {
        id: 'cpp04_c7',
        front: 'The main hazard with string_view and span',
        back:
          'They do not own anything, so they dangle if the underlying storage dies or reallocates. Never store one in a member expecting the owner to outlive it unless that lifetime is documented and enforced.',
      },
      {
        id: 'cpp04_c8',
        front: 'steady_clock versus system_clock',
        back:
          'steady_clock is monotonic and cannot jump, which is what you need for measuring intervals and scheduling. system_clock is wall time and can be stepped by NTP or the operator. Never subtract one from the other.',
      },
      {
        id: 'cpp04_c9',
        front: 'Lambda capture: by value or by reference?',
        back:
          'By value copies at lambda creation; by reference keeps a reference that dangles if the lambda outlives the scope. Default-capture-by-reference in a lambda that is stored or posted to another thread is a classic dangling bug.',
      },
      {
        id: 'cpp04_c10',
        front: 'Why avoid std::function in a hot path?',
        back:
          'It is type-erased: calling through it is an indirect call that resists inlining, and it may heap-allocate if the callable does not fit its small-buffer. Pass the lambda as a template parameter instead when you control the call site.',
      },
      {
        id: 'cpp04_c11',
        front: 'Why do many flight-software teams build with -fno-exceptions?',
        back:
          'Throwing has unbounded, hard-to-analyse worst-case time, it needs unwinding tables and a runtime, and a missed catch terminates the process. Deterministic error returns (error codes, std::expected-style types) are auditable and bounded.',
      },
      {
        id: 'cpp04_c12',
        front: 'lower_bound versus find versus binary_search',
        back:
          'lower_bound gives the first position not less than the key, so it also tells you where to insert; binary_search returns only a bool; find is a linear scan that works on unsorted ranges. Only the first two require a sorted range.',
      },
      {
        id: 'cpp04_c13',
        front: 'Seeding std::mt19937 reproducibly',
        back:
          'Seed it explicitly from a recorded value, one generator per case, never from random_device in a run you need to reproduce. Also remember distributions carry state, so reuse of a distribution across cases can leak between them.',
      },
      {
        id: 'cpp04_c14',
        front: 'nth_element: what is it for?',
        back:
          'Partial selection: it places the nth element where it would be if sorted and partitions around it, in O(n) average rather than O(n log n). It is the right tool for a median or a percentile of a large sample.',
      },
    ],
    quiz: [
      {
        id: 'cpp04_q1',
        q: 'You hold a pointer to v[0] and then call v.push_back(x). What is the status of your pointer?',
        choices: [
          'Always valid',
          'Valid unless the push exceeded capacity, in which case it dangles',
          'Always invalid',
          'Valid only for const vectors',
        ],
        answer: 1,
        explain:
          'Reallocation moves the buffer. reserve() up front bounds this, and taking indices rather than pointers avoids it entirely.',
        b: 0.4,
        bloom: 'understand',
      },
      {
        id: 'cpp04_q2',
        q: 'std::remove(v.begin(), v.end(), 0) is called and nothing appears to be removed. Why?',
        choices: [
          'remove needs a sorted range',
          'remove only reorders and returns the new logical end; you must call v.erase(new_end, v.end())',
          'The comparison was wrong',
          'remove works only on lists',
        ],
        answer: 1,
        explain:
          'Algorithms operate on iterators and cannot change container size. This asymmetry is the reason erase_if was added in C++20.',
        b: 0.3,
        bloom: 'understand',
      },
      {
        id: 'cpp04_q3',
        q: 'Which container is least appropriate inside a 1 kHz control task?',
        choices: [
          'std::array<double, 12>',
          'A fixed-capacity ring buffer',
          'std::map<int, State> populated during the loop',
          'std::span over a preallocated buffer',
        ],
        answer: 2,
        explain:
          'Every insertion allocates a node, so the loop has unbounded worst-case time and fragments the heap. The other three are allocation-free.',
        b: 0.5,
        bloom: 'apply',
      },
      {
        id: 'cpp04_q4',
        q: 'A lambda with [&] capture is stored in a member and invoked later from a timer. What is the risk?',
        choices: [
          'It cannot be stored',
          'The captured references may dangle once the creating scope exits',
          'It becomes a virtual call',
          'It forces a heap allocation',
        ],
        answer: 1,
        explain:
          'Capture by reference is only safe for a lambda that does not outlive the captured objects. For a stored callback, capture by value or by init-capturing a shared owner.',
        b: 0.7,
        bloom: 'analyze',
      },
      {
        id: 'cpp04_q5',
        q: 'Which clock do you use to measure whether a control cycle met its 1 ms deadline?',
        choices: ['system_clock', 'steady_clock', 'high_resolution_clock, which is portable and monotonic', 'time()'],
        answer: 1,
        explain:
          'steady_clock is guaranteed monotonic. high_resolution_clock is an alias for one of the others and is not portably monotonic, and system_clock can be stepped by time synchronisation.',
        b: 0.6,
        bloom: 'apply',
      },
      {
        id: 'cpp04_q6',
        q: 'Benchmarking 10 thousand lookups in a 128-entry table, the sorted array beats unordered_map. The main reason is:',
        choices: [
          'Hashing is always slower than comparison',
          'At this size the array fits in cache and has no pointer indirection, while the hash map pays a hash, a bucket indirection and poor locality',
          'unordered_map has O(n) lookup',
          'lower_bound is O(1)',
        ],
        answer: 1,
        explain:
          'Asymptotics do not decide small-N performance; memory locality does. That is why the flight-code answer and the benchmark answer coincide here.',
        b: 0.9,
        bloom: 'analyze',
      },
      {
        id: 'cpp04_q7',
        q: 'Which of these is NOT a reason flight-software standards restrict exceptions?',
        choices: [
          'Unbounded worst-case propagation time',
          'The need for unwinding tables and runtime support',
          'Exceptions cannot express error information',
          'An uncaught exception calls terminate',
        ],
        answer: 2,
        explain:
          'Exceptions carry error information perfectly well. The objections are all about determinism, footprint and analysability.',
        b: 0.6,
        bloom: 'understand',
      },
      {
        id: 'cpp04_q8',
        q: 'You need the 95th percentile of ten million latency samples once. Best algorithm?',
        choices: [
          'std::sort then index',
          'std::nth_element then index',
          'std::stable_sort then index',
          'std::partial_sort of the whole range',
        ],
        answer: 1,
        explain:
          'nth_element is linear on average and does exactly the partitioning you need. A full sort does far more work than the question requires.',
        b: 0.7,
        bloom: 'apply',
      },
    ],
    tags: ['spacex-core', 'cpp'],
    importance: 1.4,
  },

  {
    id: 'cod_cpp_05_templates',
    track: 'coding',
    tier: 7,
    title: 'Templates and Compile-Time Programming',
    summary:
      "Generic code, non-type template parameters for fixed-size matrices, concepts instead of SFINAE, and expression templates, which is what makes Eigen fast. A dimension error caught at compile time is worth more than any runtime assert.",
    prereqs: ['cod_cpp_04_stl'],
    hours: 35,
    topics: [
      'Function and class templates; argument deduction; explicit and partial specialisation',
      'Non-type template parameters: the key to Matrix<double,3,3>',
      'Variadic templates, parameter packs, fold expressions',
      'typename vs class; dependent names and the typename/template disambiguators',
      'Two-phase name lookup',
      'SFINAE and enable_if, and the C++20 replacement: concepts and requires',
      'Type traits: is_same, is_floating_point, conditional, decay, remove_cvref',
      'constexpr functions, consteval, constinit, compile-time computation',
      'if constexpr for compile-time branching',
      'CRTP revisited for static polymorphism',
      'Expression templates and lazy evaluation; how Eigen removes temporaries',
      'Template instantiation cost, build-time blow-up, extern template',
      'Policy-based design and when it beats inheritance',
      'Reading a template error message without despair',
    ],
    objectives: [
      'Write a Matrix<T, R, C> whose dimension mismatch is a compile error, not a runtime assert.',
      'Constrain a template with a concept and produce a readable diagnostic on misuse.',
      'Explain what an expression template is and why Eigen uses one.',
      'Use if constexpr to select behaviour on a type property without specialisation.',
      'Compute a rotation lookup table at compile time with constexpr.',
    ],
    resources: [
      {
        title: 'C++ Templates: The Complete Guide, 2nd ed.',
        author: 'David Vandevoorde, Nicolai Josuttis, Douglas Gregor',
        kind: 'book',
        free: false,
      },
      {
        title: 'C++20: The Complete Guide',
        author: 'Nicolai M. Josuttis',
        kind: 'book',
        free: false,
        note: 'Concepts, ranges and the rest of C++20 from the reference author.',
      },
      {
        title: 'cppreference: constraints and concepts',
        kind: 'docs',
        url: 'https://en.cppreference.com/w/cpp/language/constraints',
        free: true,
      },
      {
        title: 'C++ Weekly',
        author: 'Jason Turner',
        kind: 'video',
        url: 'https://www.youtube.com/c/lefticus1',
        free: true,
      },
    ],
    exercises: [
      {
        id: 'cpp05_ex1',
        title: 'Compile-time dimension checking',
        prompt:
          'Implement Matrix<T, R, C> with storage in a std::array<T, R*C>, operator() for element access, and operator* defined so that Matrix<T,R,K> times Matrix<T,K,C> yields Matrix<T,R,C>. A product with mismatched inner dimensions must fail to compile rather than assert at runtime. Add a static_assert with a readable message. Deliverable: a program that multiplies a 3x4 by a 4x2 successfully and a commented-out line that, when uncommented, produces your static_assert message. Expected: the valid product prints a 3x2 result; the invalid one never reaches the linker.',
        kind: 'code',
        lang: 'cpp',
        starter:
          '#include <array>\n#include <cstddef>\n#include <cstdio>\n\ntemplate <typename T, std::size_t R, std::size_t C>\nclass Matrix {\npublic:\n    T& operator()(std::size_t r, std::size_t c) { return m_[r * C + c]; }\n    T operator()(std::size_t r, std::size_t c) const { return m_[r * C + c]; }\n    static constexpr std::size_t rows = R;\n    static constexpr std::size_t cols = C;\nprivate:\n    std::array<T, R * C> m_{};\n};\n\n// TODO: operator* with compile-time dimension agreement\n',
        solution:
          '#include <array>\n#include <cstddef>\n#include <cstdio>\n\ntemplate <typename T, std::size_t R, std::size_t C>\nclass Matrix {\npublic:\n    T& operator()(std::size_t r, std::size_t c) { return m_[r * C + c]; }\n    T operator()(std::size_t r, std::size_t c) const { return m_[r * C + c]; }\n    static constexpr std::size_t rows = R;\n    static constexpr std::size_t cols = C;\nprivate:\n    std::array<T, R * C> m_{};\n};\n\n// The inner dimension K appears in both parameter types, so a mismatch is a\n// deduction failure at the call site: no runtime check exists or is needed.\ntemplate <typename T, std::size_t R, std::size_t K, std::size_t C>\nMatrix<T, R, C> operator*(const Matrix<T, R, K>& a, const Matrix<T, K, C>& b) {\n    static_assert(K > 0, "inner dimension must be non-zero");\n    Matrix<T, R, C> out;\n    for (std::size_t i = 0; i < R; ++i)\n        for (std::size_t j = 0; j < C; ++j) {\n            T s{};\n            for (std::size_t k = 0; k < K; ++k) s += a(i, k) * b(k, j);\n            out(i, j) = s;\n        }\n    return out;\n}\n\nint main() {\n    Matrix<double, 3, 4> a;\n    Matrix<double, 4, 2> b;\n    for (std::size_t i = 0; i < 3; ++i)\n        for (std::size_t k = 0; k < 4; ++k) a(i, k) = static_cast<double>(i + k);\n    for (std::size_t k = 0; k < 4; ++k)\n        for (std::size_t j = 0; j < 2; ++j) b(k, j) = static_cast<double>(k * 2 + j);\n\n    const auto c = a * b;                       // Matrix<double,3,2>\n    std::printf("%zux%zu %.1f\\n", c.rows, c.cols, c(0, 0));  // 3x2 28.0\n\n    // Matrix<double, 3, 3> bad;\n    // const auto d = a * bad;   // no matching operator*: inner dimensions 4 and 3\n    return 0;\n}\n',
        hours: 4,
      },
      {
        id: 'cpp05_ex2',
        title: 'Constrain it with a concept',
        prompt:
          'Add a concept Scalar requiring that T is a floating-point type supporting the arithmetic the matrix uses, and constrain Matrix and operator* with it. Then instantiate Matrix<std::string, 2, 2> and capture the compiler diagnostic. Compare its length and clarity with the diagnostic you get from the unconstrained version. Expected: the constrained version names the failed constraint in the first few lines, the unconstrained one produces a long instantiation backtrace.',
        kind: 'code',
        lang: 'cpp',
        starter:
          '#include <concepts>\n#include <type_traits>\n\n// TODO: define concept Scalar and apply it to the Matrix template\n',
        solution:
          '#include <concepts>\n#include <type_traits>\n#include <array>\n#include <cstddef>\n\ntemplate <typename T>\nconcept Scalar = std::floating_point<T> && requires(T a, T b) {\n    { a + b } -> std::convertible_to<T>;\n    { a * b } -> std::convertible_to<T>;\n};\n\ntemplate <Scalar T, std::size_t R, std::size_t C>\nclass Matrix {\npublic:\n    T& operator()(std::size_t r, std::size_t c) { return m_[r * C + c]; }\n    T operator()(std::size_t r, std::size_t c) const { return m_[r * C + c]; }\nprivate:\n    std::array<T, R * C> m_{};\n};\n\n// Matrix<std::string, 2, 2> m;  // error: constraint Scalar<std::string> not satisfied\n',
        hours: 2,
      },
    ],
    cards: [
      {
        id: 'cpp05_c1',
        front: 'Why is a compile-time dimension error worth more than a runtime assert?',
        back:
          'It cannot reach flight. A runtime assert only fires if that path executes with that data, which may first happen in flight; a type error fails the build, on every machine, every time, at zero runtime cost.',
      },
      {
        id: 'cpp05_c2',
        front: 'What is a non-type template parameter?',
        back:
          'A compile-time value (an integer, an enum, a pointer, and in C++20 a structural type) used as a template argument. Matrix<double,3,3> is the canonical GNC use: the dimensions are part of the type, so they can be checked and unrolled.',
      },
      {
        id: 'cpp05_c3',
        front: 'What problem do concepts solve that enable_if solved badly?',
        back:
          'They express requirements directly and readably, produce diagnostics naming the failed requirement, participate in overload resolution with a clear subsumption ordering, and can be reused by name. enable_if hid the intent in the return type and produced unreadable errors.',
      },
      {
        id: 'cpp05_c4',
        front: 'What is an expression template?',
        back:
          'Operators return small proxy objects describing the computation rather than performing it, so a whole expression is fused into one loop when it is finally assigned. This is how Eigen evaluates a + b + c with no intermediate temporaries.',
      },
      {
        id: 'cpp05_c5',
        front: 'if constexpr: what does it change?',
        back:
          'The untaken branch is not instantiated, so it may contain code that would be ill-formed for that type. It replaces tag dispatch and much specialisation with an ordinary readable if.',
      },
      {
        id: 'cpp05_c6',
        front: 'Why do you sometimes need the typename keyword inside a template?',
        back:
          'Because a name dependent on a template parameter is assumed to be a value unless you say otherwise; typename tells the compiler it is a type. C++20 relaxed many of these cases but the rule still applies in general.',
      },
      {
        id: 'cpp05_c7',
        front: 'Two-phase lookup in one sentence',
        back:
          'Non-dependent names are looked up when the template is defined, dependent names when it is instantiated, which is why a typo in a never-instantiated branch may go unnoticed on one compiler and fail on another.',
      },
      {
        id: 'cpp05_c8',
        front: 'What does constexpr on a function guarantee?',
        back:
          'That it may be evaluated at compile time when its arguments are constant expressions; it does not force it. consteval does force it, making the function immediate.',
      },
      {
        id: 'cpp05_c9',
        front: 'Why do templates blow up build times?',
        back:
          'Every distinct set of template arguments instantiates a new copy, and the definitions must live in headers so every translation unit re-parses and re-instantiates them. extern template, explicit instantiation and type-erased interfaces at boundaries are the mitigations.',
      },
      {
        id: 'cpp05_c10',
        front: 'Partial specialisation: what can and cannot be partially specialised?',
        back:
          'Class templates and variable templates can; function templates cannot (you overload instead). This is why generic function customisation is usually done with overloads, tag types or if constexpr.',
      },
      {
        id: 'cpp05_c11',
        front: 'What is a fold expression for?',
        back:
          'Applying a binary operator across a parameter pack in one expression, for example summing all arguments or calling a function on each. It replaces the old recursive-variadic-template pattern with one line.',
      },
      {
        id: 'cpp05_c12',
        front: 'Policy-based design',
        back:
          'Behaviour is injected as template parameters (a storage policy, a checking policy), so the composition is resolved at compile time with no virtual calls. It is how you make a library configurable for both a desktop sim and a flight target from one source.',
      },
      {
        id: 'cpp05_c13',
        front: 'Which is checked at compile time: Matrix<double,3,3> * Matrix<double,3,1>, or a runtime shape assert?',
        back:
          'The template version. Because the dimensions are template parameters, an inner-dimension mismatch is simply no viable overload; there is nothing left to check at runtime, and the compiler can also fully unroll the small loops.',
      },
    ],
    quiz: [
      {
        id: 'cpp05_q1',
        q: 'Matrix<double,3,4> a; Matrix<double,3,3> b; auto c = a * b; with a properly templated operator*. What happens?',
        choices: [
          'Runtime assertion failure',
          'Compile error: no matching operator* because the inner dimensions cannot both deduce K',
          'It compiles and produces garbage',
          'It silently resizes',
        ],
        answer: 1,
        explain:
          'K must deduce to 4 from the first argument and 3 from the second; deduction fails and no overload is viable. That is the entire point of putting dimensions in the type.',
        b: 0.6,
        bloom: 'understand',
      },
      {
        id: 'cpp05_q2',
        q: 'Which statement about Eigen expression templates is correct?',
        choices: [
          'They evaluate each operator immediately into a temporary',
          'They build a compile-time expression tree so the whole statement is evaluated in one fused loop',
          'They require dynamic allocation',
          'They only work for dynamically sized matrices',
        ],
        answer: 1,
        explain:
          'Fusing removes intermediates and improves locality. It is also why an aliasing statement like a = a * b needs eval() or noalias() attention.',
        b: 0.9,
        bloom: 'understand',
      },
      {
        id: 'cpp05_q3',
        q: 'What is the main practical benefit of constraining a template with a concept?',
        choices: [
          'Faster runtime',
          'Shorter object code',
          'The error names the unsatisfied requirement at the call site instead of deep inside instantiation',
          'It removes the need for tests',
        ],
        answer: 2,
        explain:
          'Constraints move the diagnosis to the interface boundary. The runtime code generated is identical.',
        b: 0.4,
        bloom: 'understand',
      },
      {
        id: 'cpp05_q4',
        q: 'Why does if constexpr allow a branch containing code invalid for the current type?',
        choices: [
          'It defers the check to runtime',
          'The discarded branch is not instantiated for that specialisation',
          'It disables type checking',
          'It requires the branch to be a template',
        ],
        answer: 1,
        explain:
          'Discarded statements in a template are not instantiated, which is exactly what tag dispatch used to achieve with far more ceremony.',
        b: 0.8,
        bloom: 'understand',
      },
      {
        id: 'cpp05_q5',
        q: 'Your build time tripled after moving numerical kernels into headers as templates. Which mitigation is most appropriate?',
        choices: [
          'Disable optimisation',
          'Explicitly instantiate the handful of types you actually use and declare them extern template in the header',
          'Increase the parallel job count only',
          'Convert everything to virtual dispatch',
        ],
        answer: 1,
        explain:
          'Explicit instantiation compiles each specialisation once in one translation unit; extern template stops every other unit from re-instantiating it.',
        b: 1.2,
        bloom: 'apply',
      },
      {
        id: 'cpp05_q6',
        q: 'Which can be partially specialised?',
        choices: ['Function templates', 'Class templates', 'Lambdas', 'Concepts'],
        answer: 1,
        explain:
          'Function templates support overloading but not partial specialisation, which is a frequent source of surprising overload resolution when people try.',
        b: 0.7,
        bloom: 'recall',
      },
      {
        id: 'cpp05_q7',
        q: 'A fixed-size Matrix<double,3,3> multiply is much faster than a dynamically sized one of the same dimensions. Why?',
        choices: [
          'Dynamic matrices use float',
          'The sizes are compile-time constants, so the loops unroll, there is no heap allocation and no runtime size checking',
          'Fixed matrices skip bounds checks only',
          'The compiler uses a different algorithm',
        ],
        answer: 1,
        explain:
          'This is exactly the argument for Eigen fixed-size types in flight code: allocation-free, unrolled and vectorisable.',
        b: 0.8,
        bloom: 'analyze',
      },
    ],
    tags: ['spacex-core', 'cpp'],
    importance: 1.35,
  },

  {
    id: 'cod_cpp_06_modern',
    track: 'coding',
    tier: 8,
    title: 'Modern C++ Consolidated (11 through 23)',
    summary:
      "What each standard added, which features reduce defect rates, and the harder question: which subset of C++ you would actually allow inside a 1 kHz control task, and why.",
    prereqs: ['cod_cpp_05_templates'],
    hours: 25,
    topics: [
      'C++11: auto, range-for, lambdas, move semantics, nullptr, enum class, constexpr, smart pointers, thread, override/final, std::array, chrono',
      'C++14: generic lambdas, return type deduction, make_unique, variable templates',
      'C++17: structured bindings, if/switch init statements, if constexpr, fold expressions, optional/variant/any, string_view, filesystem, parallel algorithms, guaranteed copy elision, CTAD',
      'C++20: concepts, ranges, span, format, three-way comparison, designated initialisers, constinit/consteval, modules, coroutines, atomic_ref',
      'C++23 highlights: expected, mdspan, print',
      'Uniform initialisation and the initializer_list gotcha',
      'Guaranteed copy elision and what it means for returning big objects',
      'Why modules adoption is slow and what it will change',
      'Why coroutines are rare in flight code',
      'The flight subset: typically C++11/14/17 core, no exceptions, no RTTI, no dynamic allocation after init, restricted standard library',
      'Modernising legacy code: what to change first and how to justify each change',
    ],
    objectives: [
      'Modernise a C++98-style file to C++20 and justify every change in terms of defect risk.',
      'Write a one-page statement of the C++ subset you would permit in a hard real-time task.',
      'Name three C++17 features that reduce bug risk and explain the mechanism.',
      'Explain why -fno-exceptions and -fno-rtti are common in flight builds.',
      'Use structured bindings, if-init and std::optional to remove an entire class of error-handling noise.',
    ],
    resources: [
      {
        title: 'A Tour of C++, 3rd ed.',
        author: 'Bjarne Stroustrup',
        kind: 'book',
        free: false,
        note: 'Covers C++20; the fastest route to knowing what modern C++ looks like.',
      },
      {
        title: 'Effective Modern C++',
        author: 'Scott Meyers',
        kind: 'book',
        free: false,
      },
      {
        title: 'cppreference: C++ compiler support tables',
        kind: 'docs',
        url: 'https://en.cppreference.com/w/cpp/compiler_support',
        free: true,
        note: 'Check before assuming a feature is available on your embedded toolchain.',
      },
      {
        title: 'CppCon talks',
        kind: 'video',
        url: 'https://www.youtube.com/user/CppCon',
        free: true,
      },
    ],
    exercises: [
      {
        id: 'cpp06_ex1',
        title: 'Modernise a legacy parser',
        prompt:
          'Take a 120-line C++98 telemetry-frame parser using raw new/delete, C arrays, NULL, index loops and out-parameters. Rewrite it with std::span, std::optional, structured bindings, if-init, enum class and std::string_view, keeping the observable behaviour identical. Deliver a table with one row per change: the old construct, the new one, and the specific defect class it eliminates. Expected: identical output on the supplied sample frames, and at least six distinct defect classes named.',
        kind: 'code',
        lang: 'cpp',
        starter:
          '#include <cstdint>\n#include <cstring>\n\n// Legacy shape to be modernised:\n// bool parse_frame(const unsigned char* buf, int len, int* out_id, double* out_value);\n\nbool parse_frame(const unsigned char* buf, int len, int* out_id, double* out_value) {\n    if (buf == 0 || len < 9) return false;\n    *out_id = buf[0];\n    std::memcpy(out_value, buf + 1, 8);\n    return true;\n}\n',
        solution:
          '#include <cstdint>\n#include <cstring>\n#include <optional>\n#include <span>\n\nenum class ChannelId : std::uint8_t { Unknown = 0, ChamberPressure = 7, TankTemp = 9 };\n\nstruct Sample {\n    ChannelId id{ChannelId::Unknown};\n    double value{};\n};\n\n// Returns nothing rather than a bool plus out-parameters, cannot be called with\n// a mismatched pointer/length pair, and cannot leave outputs half-written.\nstd::optional<Sample> parse_frame(std::span<const std::uint8_t> buf) {\n    if (buf.size() < 9) return std::nullopt;\n    Sample s;\n    s.id = static_cast<ChannelId>(buf[0]);\n    std::memcpy(&s.value, buf.data() + 1, sizeof s.value);\n    return s;\n}\n\n// Call site:\n//   if (const auto sample = parse_frame(frame); sample) {\n//       const auto [id, value] = *sample;\n//       ...\n//   }\n//\n// Defect classes removed: mismatched pointer/length, null pointer argument,\n// partially written outputs on failure, forgetting to check the bool return,\n// implicit conversion of an unrelated integer to a channel id, and\n// sizeof-on-a-decayed-array.\n',
        hours: 4,
      },
      {
        id: 'cpp06_ex2',
        title: 'Write the flight subset policy',
        prompt:
          'Write a one-page policy stating which C++ features are permitted, restricted or forbidden inside a 1 kHz control task, with a one-line rationale for each entry. Cover at minimum: dynamic allocation, exceptions, RTTI and dynamic_cast, virtual dispatch, templates, the standard library containers, std::string, recursion, and the standard algorithms. Then justify one deliberate exception to your own rules.',
        kind: 'analysis',
        hours: 3,
      },
    ],
    cards: [
      {
        id: 'cpp06_c1',
        front: 'Three C++17 features that reduce bug risk, and how',
        back:
          'std::optional removes the sentinel-value and uninitialised-out-parameter pattern; structured bindings remove index and get<> mistakes; if-init scopes a result to the branch that checks it so it cannot be misused afterwards.',
      },
      {
        id: 'cpp06_c2',
        front: 'Why -fno-exceptions and -fno-rtti in flight builds?',
        back:
          'Both add runtime machinery with data-dependent cost and code size: unwinding tables and type-info records. Removing them shrinks the image, removes an unbounded control-flow path and makes static worst-case analysis tractable.',
      },
      {
        id: 'cpp06_c3',
        front: 'What does guaranteed copy elision change?',
        back:
          'Since C++17, returning a prvalue constructs directly into the caller storage; there is no copy or move to elide, so returning large objects by value is free and does not require the type to be movable.',
      },
      {
        id: 'cpp06_c4',
        front: 'The initializer_list gotcha',
        back:
          'std::vector<int> v{3, 0} makes a two-element vector, while std::vector<int> v(3, 0) makes three zeros. Braces prefer an initializer_list constructor whenever one is viable, which surprises everyone at least once.',
      },
      {
        id: 'cpp06_c5',
        front: 'What does std::span replace, and why does flight code like it?',
        back:
          'The pointer-plus-length pair. It cannot be mismatched, it carries its size for bounds checking in debug builds, and it owns nothing, so it introduces no allocation.',
      },
      {
        id: 'cpp06_c6',
        front: 'Why is std::string usually banned in a hard real-time path?',
        back:
          'It allocates once the content exceeds its small-string buffer, and the threshold is implementation-defined. Fixed-capacity character buffers or string_view over static storage give the same capability with bounded behaviour.',
      },
      {
        id: 'cpp06_c7',
        front: 'What does the spaceship operator generate?',
        back:
          'Defaulting operator<=> gives you all six relational operators from a member-wise comparison, plus == when you default that too. It removes a large block of boilerplate that was a classic place for an inconsistent comparison bug.',
      },
      {
        id: 'cpp06_c8',
        front: 'Why is module adoption slow?',
        back:
          'Modules change the build model, so every build system, compiler and dependency in the chain has to support them and agree on how compiled module interfaces are produced and found. The benefit is real but the migration is ecosystem-wide.',
      },
      {
        id: 'cpp06_c9',
        front: 'Why do coroutines rarely appear in flight code?',
        back:
          'The compiler allocates the coroutine frame on the heap unless it can prove elision, and the control flow is harder to analyse for worst-case timing. Both conflict with the no-allocation, analysable-timing rules.',
      },
      {
        id: 'cpp06_c10',
        front: 'What is std::expected for?',
        back:
          'Returning either a value or an error in one object, giving exception-free error propagation with the error type in the signature. It is the C++23 form of the pattern flight code has hand-rolled for decades.',
      },
      {
        id: 'cpp06_c11',
        front: 'What is mdspan and why does GNC care?',
        back:
          'A non-owning multidimensional view over contiguous storage with configurable layout. It lets you treat a preallocated buffer as a matrix or a tensor without copying or owning it, which is precisely the flight-code access pattern.',
      },
      {
        id: 'cpp06_c12',
        front: 'CTAD: what and what to watch for',
        back:
          'Class template argument deduction lets you write std::pair p{1, 2.0} without spelling out the types. Watch for deduction that picks a surprising type, especially with initializer lists and with types that decay, which is why library authors write deduction guides.',
      },
      {
        id: 'cpp06_c13',
        front: 'Which C++ subset do flight teams typically allow?',
        back:
          'The C++11/14/17 core: RAII, references, const, constexpr, templates for static dispatch, fixed-size containers, no exceptions, no RTTI, no allocation after initialisation, no recursion, and a restricted standard-library whitelist. Modern does not mean unrestricted.',
      },
    ],
    quiz: [
      {
        id: 'cpp06_q1',
        q: 'std::vector<int> v{5, 0}; how many elements does v have?',
        choices: ['5', '2', '0', 'A compile error'],
        answer: 1,
        explain:
          'Braces select the initializer_list constructor, giving the elements 5 and 0. Parentheses would have given five zeros.',
        b: 0.6,
        bloom: 'recall',
      },
      {
        id: 'cpp06_q2',
        q: 'Which replacement removes the most defect classes from `bool parse(const uint8_t* p, int n, Out* out)`?',
        choices: [
          'Return an int error code instead of bool',
          'Take std::span<const uint8_t> and return std::optional<Out>',
          'Mark the parameters const',
          'Add an assert on p != nullptr',
        ],
        answer: 1,
        explain:
          'span removes the mismatched pointer/length and null-argument cases, and optional removes the ignored-return and partially-written-output cases. The others address only one symptom each.',
        b: 0.5,
        bloom: 'apply',
      },
      {
        id: 'cpp06_q3',
        q: 'A team compiles flight code with -fno-exceptions. What must the code NOT do?',
        choices: [
          'Use templates',
          'Call standard-library functions that report failure by throwing, such as vector::at or std::stod',
          'Use const',
          'Use std::array',
        ],
        answer: 1,
        explain:
          'With exceptions disabled, a throw becomes a call to terminate. Anything whose only error channel is an exception must be avoided or wrapped in a checked alternative.',
        b: 0.8,
        bloom: 'apply',
      },
      {
        id: 'cpp06_q4',
        q: 'Why does returning a large struct by value cost nothing in C++17?',
        choices: [
          'The compiler uses move semantics',
          'Guaranteed copy elision constructs the prvalue directly in the caller storage',
          'Large structs are passed in registers',
          'It does cost a copy',
        ],
        answer: 1,
        explain:
          'There is no temporary to elide: the object is initialised once, in place. The type does not even need to be movable.',
        b: 0.9,
        bloom: 'understand',
      },
      {
        id: 'cpp06_q5',
        q: 'Which feature is least appropriate inside a 1 kHz control task?',
        choices: [
          'constexpr computation of a lookup table',
          'std::array for the state vector',
          'A coroutine that awaits sensor data',
          'if constexpr branching on the platform',
        ],
        answer: 2,
        explain:
          'The coroutine frame is heap-allocated unless the compiler can elide it, and suspension complicates worst-case timing. The other three are compile-time or allocation-free.',
        b: 0.7,
        bloom: 'apply',
      },
      {
        id: 'cpp06_q6',
        q: 'What does defaulting operator<=> give you?',
        choices: [
          'Only operator<',
          'All four relational operators, and == as well if you default that too',
          'A hash function',
          'A swap function',
        ],
        answer: 1,
        explain:
          'Three-way comparison generates <, <=, > and >=; equality is separate because it can often be implemented more cheaply.',
        b: 0.5,
        bloom: 'recall',
      },
      {
        id: 'cpp06_q7',
        q: 'An interviewer asks which modern features you would forbid in flight code. The strongest answer:',
        choices: [
          'None; modern C++ is always better',
          'All of them; flight code should be C',
          'Dynamic allocation after init, exceptions, RTTI and coroutines, because each introduces unbounded or unanalysable behaviour, while keeping RAII, constexpr, templates and fixed-size containers',
          'Templates, because they increase build time',
        ],
        answer: 2,
        explain:
          'The reasoning is what is being assessed: restrict what is unbounded or unanalysable, keep what improves correctness at zero runtime cost.',
        b: 0.4,
        bloom: 'analyze',
      },
    ],
    tags: ['spacex-core', 'cpp'],
    importance: 1.4,
  },

  {
    id: 'cod_cpp_07_concurrency',
    track: 'coding',
    tier: 9,
    title: 'Concurrency, Memory Ordering and Determinism',
    summary:
      "Threads, mutexes, atomics and the C++ memory model, then the parts that matter on a vehicle: priority inversion, lock-free single-producer queues for telemetry, and why average latency is the wrong metric.",
    prereqs: ['cod_cpp_06_modern'],
    hours: 35,
    topics: [
      'Processes vs threads; std::thread and jthread; join and detach',
      'Data races as undefined behaviour, not merely a wrong answer',
      'mutex, lock_guard, unique_lock, scoped_lock, shared_mutex, recursive_mutex',
      'Deadlock: the four conditions, lock ordering, std::lock and scoped_lock',
      'condition_variable and spurious wakeups; the predicate form of wait',
      'std::atomic and memory orderings: relaxed, acquire/release, seq_cst',
      'The C++ memory model; is_lock_free; atomic_ref',
      'future, promise, packaged_task, async, and thread pools',
      'Lock-free single-producer single-consumer ring buffers for telemetry',
      'Lock-free is not wait-free; progress guarantees',
      'False sharing and hardware_destructive_interference_size',
      'Hard, firm and soft real time; WCET and why average latency is irrelevant',
      'Priority inversion and priority inheritance; the Mars Pathfinder case',
      'RTOS landscape: FreeRTOS, RTEMS, VxWorks, Linux PREEMPT_RT',
      'Rate-monotonic scheduling and utilisation bounds',
      'sched_setscheduler, SCHED_FIFO, CPU pinning, mlockall',
      'The SpaceX triple-redundancy architecture as a case study',
    ],
    objectives: [
      'Build a lock-free SPSC ring buffer and validate it with ThreadSanitizer.',
      'Explain what acquire and release actually guarantee, in terms of visibility.',
      'Diagnose a deadlock from a set of thread backtraces.',
      'Explain priority inversion, its fix, and the Mars Pathfinder story.',
      'State why worst-case execution time, not average, governs a control task.',
    ],
    resources: [
      {
        title: 'C++ Concurrency in Action, 2nd ed.',
        author: 'Anthony Williams',
        kind: 'book',
        free: false,
        note: 'The book on this subject; written by the author of the Boost threading library.',
      },
      {
        title: 'Rust Atomics and Locks',
        author: 'Mara Bos',
        kind: 'book',
        url: 'https://marabos.nl/atomics/',
        free: true,
        note: 'Free online. The clearest plain-language explanation of memory ordering in any language.',
      },
      {
        title: 'Real-Time C++, 4th ed.',
        author: 'Christopher Kormanyos',
        kind: 'book',
        free: false,
      },
      {
        title: 'ThreadSanitizer documentation',
        author: 'LLVM project',
        kind: 'docs',
        url: 'https://clang.llvm.org/docs/ThreadSanitizer.html',
        free: true,
      },
    ],
    exercises: [
      {
        id: 'cpp07_ex1',
        title: 'Lock-free SPSC ring buffer',
        prompt:
          'Implement a fixed-capacity single-producer single-consumer ring buffer with atomic head and tail indices, using release on the producer store and acquire on the consumer load, and no mutex. push returns false when full, pop returns false when empty. Write a test with one producer thread writing one million sequence numbers and one consumer reading them; the consumer must observe a strictly increasing sequence with no gaps or duplicates. Build it with -fsanitize=thread and show a clean report. Expected output: the consumer prints the count received equal to one million and the words sequence ok.',
        kind: 'code',
        lang: 'cpp',
        starter:
          '#include <array>\n#include <atomic>\n#include <cstddef>\n\ntemplate <typename T, std::size_t N>\nclass SpscRing {\npublic:\n    bool push(const T& v);\n    bool pop(T& out);\nprivate:\n    std::array<T, N> buf_{};\n    std::atomic<std::size_t> head_{0};  // written by producer\n    std::atomic<std::size_t> tail_{0};  // written by consumer\n};\n',
        solution:
          '#include <array>\n#include <atomic>\n#include <cstddef>\n\n// Capacity N must be a power of two; one slot is kept empty so that\n// head == tail means empty and head + 1 == tail means full.\ntemplate <typename T, std::size_t N>\nclass SpscRing {\n    static_assert((N & (N - 1)) == 0, "N must be a power of two");\npublic:\n    bool push(const T& v) {\n        const std::size_t h = head_.load(std::memory_order_relaxed);\n        const std::size_t next = (h + 1) & (N - 1);\n        if (next == tail_.load(std::memory_order_acquire)) return false;  // full\n        buf_[h] = v;\n        head_.store(next, std::memory_order_release);  // publishes buf_[h]\n        return true;\n    }\n\n    bool pop(T& out) {\n        const std::size_t t = tail_.load(std::memory_order_relaxed);\n        if (t == head_.load(std::memory_order_acquire)) return false;  // empty\n        out = buf_[t];\n        tail_.store((t + 1) & (N - 1), std::memory_order_release);\n        return true;\n    }\n\nprivate:\n    std::array<T, N> buf_{};\n    alignas(64) std::atomic<std::size_t> head_{0};\n    alignas(64) std::atomic<std::size_t> tail_{0};\n};\n\n// The release store of head_ makes the preceding write to buf_[h] visible to\n// any consumer that acquires the same head_ value. Aligning the two indices on\n// separate cache lines avoids false sharing between producer and consumer.\n',
        hours: 5,
      },
      {
        id: 'cpp07_ex2',
        title: 'Prove a control task allocates nothing',
        prompt:
          'Take a control-loop function that currently uses std::vector and std::string internally. Convert it to fixed-capacity storage, then prove there are zero allocations after initialisation by overriding global operator new to increment a counter (and, optionally, to abort once a flag is set). Report the allocation count before and after conversion, and name the two allocations you decided to keep during initialisation. Expected: a non-zero count before, exactly zero during the steady-state loop after.',
        kind: 'code',
        lang: 'cpp',
        starter:
          '#include <atomic>\n#include <cstdio>\n#include <cstdlib>\n#include <new>\n\nstd::atomic<long> g_allocs{0};\nstd::atomic<bool> g_forbid{false};\n\nvoid* operator new(std::size_t n) {\n    // TODO: count, and abort if g_forbid is set\n    return std::malloc(n);\n}\n',
        solution:
          '#include <atomic>\n#include <cstdio>\n#include <cstdlib>\n#include <new>\n\nstd::atomic<long> g_allocs{0};\nstd::atomic<bool> g_forbid{false};\n\nvoid* operator new(std::size_t n) {\n    g_allocs.fetch_add(1, std::memory_order_relaxed);\n    if (g_forbid.load(std::memory_order_relaxed)) {\n        std::fputs("allocation in a no-allocation region\\n", stderr);\n        std::abort();\n    }\n    void* p = std::malloc(n);\n    if (!p) std::abort();   // -fno-exceptions build: cannot throw bad_alloc\n    return p;\n}\n\nvoid operator delete(void* p) noexcept { std::free(p); }\nvoid operator delete(void* p, std::size_t) noexcept { std::free(p); }\n\n// Usage:\n//   initialise_everything();\n//   const long before = g_allocs.load();\n//   g_forbid.store(true);\n//   for (int i = 0; i < 100000; ++i) control_step(...);\n//   g_forbid.store(false);\n//   std::printf("allocations during loop: %ld\\n", g_allocs.load() - before);  // 0\n',
        hours: 4,
      },
    ],
    cards: [
      {
        id: 'cpp07_c1',
        front: 'What is a data race, formally?',
        back:
          'Two threads access the same memory location, at least one writes, and the accesses are not ordered by a synchronisation relationship. It is undefined behaviour, so the program has no defined meaning at all, regardless of what it appears to do.',
      },
      {
        id: 'cpp07_c2',
        front: 'What does memory_order_acquire guarantee?',
        back:
          'If an acquire load reads a value written by a release store, then everything the writing thread did before that store is visible to the reading thread after the load. It is a one-way barrier: later reads and writes cannot move above it.',
      },
      {
        id: 'cpp07_c3',
        front: 'What does memory_order_relaxed give you?',
        back:
          'Atomicity of the operation itself and a single modification order for that variable, but no ordering with respect to any other memory. It is right for a statistics counter and wrong for publishing data.',
      },
      {
        id: 'cpp07_c4',
        front: 'The four conditions for deadlock',
        back:
          'Mutual exclusion, hold and wait, no preemption, and circular wait. Breaking any one prevents deadlock; the practical tool is a global lock ordering, or std::scoped_lock to take several locks atomically.',
      },
      {
        id: 'cpp07_c5',
        front: 'Explain priority inversion and its fix',
        back:
          'A high-priority task blocks on a mutex held by a low-priority task, which is itself preempted by a medium-priority task, so the high-priority task waits on the medium one indefinitely. The fix is priority inheritance: the holder temporarily runs at the priority of the highest waiter.',
      },
      {
        id: 'cpp07_c6',
        front: 'What happened on Mars Pathfinder?',
        back:
          'A high-priority bus-management task blocked on a mutex held by a low-priority meteorological task while a medium-priority communications task ran, so a watchdog reset the lander repeatedly. The fix, uploaded in flight, was to enable priority inheritance on that mutex.',
      },
      {
        id: 'cpp07_c7',
        front: 'Why is average latency the wrong metric for a control task?',
        back:
          'A control loop must finish before its deadline every cycle. A task with a 100 microsecond average and a 3 millisecond tail on a 1 millisecond period misses deadlines, no matter how good the average looks.',
      },
      {
        id: 'cpp07_c8',
        front: 'Lock-free versus wait-free',
        back:
          'Lock-free guarantees that some thread makes progress, so the system cannot stall as a whole. Wait-free guarantees every thread completes its operation in a bounded number of steps, which is the stronger property real-time analysis actually wants.',
      },
      {
        id: 'cpp07_c9',
        front: 'What is false sharing?',
        back:
          'Two threads writing to different variables that happen to share one cache line, so the line ping-pongs between cores. The fix is padding or alignas to the destructive interference size, which can be worth several times the throughput.',
      },
      {
        id: 'cpp07_c10',
        front: 'Why must condition_variable::wait be used with a predicate?',
        back:
          'Because spurious wakeups are permitted and because another thread may consume the condition first. The predicate form re-checks under the lock and goes back to waiting, which is the only correct usage.',
      },
      {
        id: 'cpp07_c11',
        front: 'Name five sources of non-determinism to remove from a hot path',
        back:
          'Heap allocation, exceptions, RTTI and dynamic_cast, unbounded loops and recursion, and I/O. Add virtual dispatch and std::string when you are being strict.',
      },
      {
        id: 'cpp07_c12',
        front: 'What does mlockall buy a real-time process?',
        back:
          'It pins the process pages in physical memory so a page fault cannot introduce a multi-millisecond stall at the worst moment. Paired with SCHED_FIFO and CPU pinning, it is the standard Linux real-time setup.',
      },
      {
        id: 'cpp07_c13',
        front: 'Rate-monotonic scheduling: the utilisation bound',
        back:
          'For n independent periodic tasks with deadlines equal to periods, fixed priorities assigned by rate are schedulable if total utilisation is at most n times (2 to the power 1/n minus 1), which tends to about 69 percent. Above that you need an exact response-time analysis.',
        formula: true,
      },
      {
        id: 'cpp07_c14',
        front: 'How does the SpaceX flight-computer architecture get radiation tolerance from commodity parts?',
        back:
          'Three flight strings, each a dual-core x86 running Linux, where the two cores compare results and a disagreeing string issues no command; PowerPC microcontrollers at the actuators receive three commands and judge the correct one. Redundancy and voting replace rad-hard silicon.',
      },
    ],
    quiz: [
      {
        id: 'cpp07_q1',
        q: 'A producer writes data then stores a flag; the consumer loads the flag then reads the data. Which orderings make this correct?',
        choices: [
          'Both relaxed',
          'Release on the flag store, acquire on the flag load',
          'Acquire on the store, release on the load',
          'volatile on both',
        ],
        answer: 1,
        explain:
          'Release-acquire pairing is what makes the prior writes visible. Relaxed gives atomicity with no ordering, the third option reverses the roles, and volatile provides no ordering at all.',
        b: 0.9,
        bloom: 'apply',
      },
      {
        id: 'cpp07_q2',
        q: 'Two threads acquire mutexes A and B in opposite orders. What is the guaranteed-safe fix?',
        choices: [
          'Use recursive_mutex',
          'Use std::scoped_lock(A, B) in both, or impose a single global lock order',
          'Add a sleep before the second lock',
          'Use try_lock in a loop without backoff',
        ],
        answer: 1,
        explain:
          'scoped_lock uses a deadlock-avoidance algorithm to take both atomically. A consistent ordering breaks the circular-wait condition; sleeps and naive retry loops only change the probability.',
        b: 0.6,
        bloom: 'apply',
      },
      {
        id: 'cpp07_q3',
        q: 'A control task averages 120 microseconds per cycle on a 1 ms period, but the 99.99th percentile is 2.4 ms. Is it acceptable?',
        choices: [
          'Yes, the average has huge margin',
          'No: the task misses its deadline in the tail, which is what a hard real-time requirement forbids',
          'Yes, if the tail is rare enough',
          'It depends on the average CPU utilisation only',
        ],
        answer: 1,
        explain:
          'Hard real time is a statement about the worst case. The engineering work is to find and eliminate the tail source, typically allocation, paging, a lock or an interrupt storm.',
        b: 0.5,
        bloom: 'analyze',
      },
      {
        id: 'cpp07_q4',
        q: 'What did the Mars Pathfinder resets demonstrate?',
        choices: [
          'A memory leak',
          'Priority inversion: a high-priority task blocked on a mutex held by a preempted low-priority task',
          'A cosmic-ray bit flip',
          'A stack overflow',
        ],
        answer: 1,
        explain:
          'Enabling priority inheritance on the offending mutex fixed it, and it remains the canonical teaching example for real-time synchronisation.',
        b: 0.4,
        bloom: 'recall',
      },
      {
        id: 'cpp07_q5',
        q: 'Your SPSC ring buffer passes a million-item stress test but TSan still reports a race on the data array. What is the most likely cause?',
        choices: [
          'A TSan false positive on atomics',
          'The index store uses relaxed rather than release, so the data write is not published',
          'The buffer is too small',
          'The consumer is too slow',
        ],
        answer: 1,
        explain:
          'Without the release-acquire pair, the data write has no ordering with respect to the index publication. The test passing is luck of the hardware and the optimiser, not correctness.',
        b: 1.2,
        bloom: 'analyze',
      },
      {
        id: 'cpp07_q6',
        q: 'Two per-thread counters in adjacent struct members make a parallel loop slower than the single-threaded version. What is happening?',
        choices: [
          'Cache thrash from false sharing on one cache line',
          'The counters overflow',
          'The compiler serialised the loop',
          'Atomic operations are always slower',
        ],
        answer: 0,
        explain:
          'Each write invalidates the line in the other core cache. Pad or align the counters to separate lines, or accumulate locally and combine at the end.',
        b: 1.0,
        bloom: 'analyze',
      },
      {
        id: 'cpp07_q7',
        q: 'Which is NOT a standard technique for making a Linux process real-time-capable?',
        choices: [
          'SCHED_FIFO with a suitable priority',
          'mlockall to prevent paging',
          'CPU affinity pinning and isolating the core',
          'Raising the thread nice value to 19',
        ],
        answer: 3,
        explain:
          'nice applies to the normal time-sharing policy and, at 19, lowers priority. Real-time behaviour comes from the real-time scheduling class, memory locking and isolation.',
        b: 0.7,
        bloom: 'understand',
      },
      {
        id: 'cpp07_q8',
        q: 'Which statement about the SpaceX Actor-Judge architecture is correct?',
        choices: [
          'Three flight computers vote and the majority wins at the computer level',
          'Each of three strings self-checks two cores and stays silent on disagreement, while actuator microcontrollers judge among the three commands they receive',
          'A single rad-hard computer runs the control laws',
          'Voting happens in the ground segment',
        ],
        answer: 1,
        explain:
          'Self-checking pairs plus downstream judging is what lets commodity x86 parts fly: a corrupted string removes itself, and the actuator controller picks the agreed command.',
        b: 1.1,
        bloom: 'understand',
      },
    ],
    tags: ['spacex-core', 'cpp'],
    importance: 1.45,
  },

  {
    id: 'cod_cpp_08_realtime',
    track: 'coding',
    tier: 10,
    title: 'Real-Time Constraints and Allocation-Free Flight Code',
    summary:
      "The rules that make code flyable: bounded loops, no dynamic allocation after initialisation, static stack bounding, watchdogs, and the coding standards (MISRA C++, JSF++, the NASA/JPL Power of Ten) that encode them.",
    prereqs: ['cod_cpp_07_concurrency', 'cod_cpp_09_eigen'],
    hours: 30,
    topics: [
      'Worst-case execution time: measurement, static analysis and their limits',
      'Static memory: pools, arenas, fixed-capacity containers, placement new at init',
      'Stack-depth analysis and static stack bounding; no recursion',
      'Bounded loops and why every loop needs a provable upper bound',
      'Watchdogs, heartbeats and health monitoring',
      'Fault detection, isolation and recovery; safe modes',
      'Radiation effects: SEU, SEL, TID, and the software mitigations (voting, checksums, scrubbing, resets)',
      'Interrupt service routines: what you may and may not do inside one',
      'Cross-compiling to an embedded target with a CMake toolchain file',
      'Linker scripts and memory regions; why you would move a function into RAM',
      'Fixed-point arithmetic where floating point is unavailable or unqualified',
      'Determinism and bit-exact reproducibility across compilers and platforms',
      'The NASA/JPL Power of Ten rules',
      'MISRA C++:2023, which absorbs AUTOSAR C++14; JSF++ AV and its F-35 origin',
      'Static analysis: clang-tidy, cppcheck, Polyspace, LDRA, Helix QAC',
    ],
    objectives: [
      'Convert an allocating control task into a fully static one and prove zero allocation after init.',
      'State each Power of Ten rule and give a concrete example of complying with it in modern C++.',
      'Bound the stack depth of a call graph and explain what breaks the bound.',
      'Explain what a single-event upset is and name three software mitigations.',
      'Argue for or against a specific MISRA rule in a design review without dogma.',
    ],
    resources: [
      {
        title: 'The Power of Ten: Rules for Developing Safety-Critical Code',
        author: 'Gerard J. Holzmann (NASA/JPL)',
        kind: 'paper',
        url: 'https://spinroot.com/gerard/pdf/P10.pdf',
        free: true,
        note: 'Ten rules, four pages. Read it twice; it is the most quoted document in this field.',
      },
      {
        title: 'MISRA C++:2023',
        author: 'MISRA Consortium',
        kind: 'docs',
        url: 'https://misra.org.uk/',
        free: false,
        note: 'The current unified standard; it absorbs AUTOSAR C++14 and largely supersedes JSF++.',
      },
      {
        title: 'Real-Time C++, 4th ed.',
        author: 'Christopher Kormanyos',
        kind: 'book',
        free: false,
      },
      {
        title: 'JPL Institutional Coding Standard for the C Programming Language',
        author: 'NASA JPL',
        kind: 'docs',
        url: 'https://spinroot.com/gerard/pdf/JPL_Coding_Standard_C.pdf',
        free: true,
      },
    ],
    exercises: [
      {
        id: 'cpp08_ex1',
        title: 'Static memory pool for a fixed object set',
        prompt:
          'Implement a Pool<T, N> that hands out and returns objects from a statically sized storage block with an intrusive free list, with acquire() returning nullptr when exhausted and release() returning an object. No dynamic allocation anywhere, O(1) worst case for both operations, and a static_assert that T fits the slot. Then use it for a fixed set of telemetry messages. Expected output: acquiring N objects succeeds, the N+1st returns null, and after releasing one, the next acquire succeeds again.',
        kind: 'code',
        lang: 'cpp',
        starter:
          '#include <array>\n#include <cstddef>\n#include <new>\n#include <utility>\n\ntemplate <typename T, std::size_t N>\nclass Pool {\npublic:\n    Pool();\n    T* acquire();\n    void release(T* p);\nprivate:\n    union Slot { Slot* next; alignas(T) unsigned char storage[sizeof(T)]; };\n    std::array<Slot, N> slots_{};\n    Slot* free_{nullptr};\n};\n',
        solution:
          '#include <array>\n#include <cstddef>\n#include <new>\n#include <utility>\n\n// O(1) acquire and release, no heap, no fragmentation: the free list lives\n// inside the unused slots themselves.\ntemplate <typename T, std::size_t N>\nclass Pool {\n    static_assert(N > 0, "pool must have capacity");\npublic:\n    Pool() {\n        for (std::size_t i = 0; i + 1 < N; ++i) slots_[i].next = &slots_[i + 1];\n        slots_[N - 1].next = nullptr;\n        free_ = &slots_[0];\n    }\n    Pool(const Pool&) = delete;\n    Pool& operator=(const Pool&) = delete;\n\n    template <typename... Args>\n    T* acquire(Args&&... args) {\n        if (!free_) return nullptr;              // exhausted: caller must handle\n        Slot* s = free_;\n        free_ = s->next;\n        return ::new (static_cast<void*>(s->storage)) T(std::forward<Args>(args)...);\n    }\n\n    void release(T* p) {\n        if (!p) return;\n        p->~T();\n        Slot* s = reinterpret_cast<Slot*>(p);\n        s->next = free_;\n        free_ = s;\n    }\n\nprivate:\n    union Slot {\n        Slot* next;\n        alignas(T) unsigned char storage[sizeof(T)];\n        Slot() : next(nullptr) {}\n        ~Slot() {}\n    };\n    std::array<Slot, N> slots_{};\n    Slot* free_{nullptr};\n};\n',
        hours: 4,
      },
      {
        id: 'cpp08_ex2',
        title: 'Power of Ten compliance report',
        prompt:
          'Take your C++ GNC core and produce a compliance report against the ten NASA/JPL rules: for each rule, state compliant, non-compliant with justification, or not applicable, citing file and line. For every non-compliance, write either the fix or a defensible deviation rationale. Then answer, in one paragraph: which rule most often conflicts with idiomatic modern C++, and how do you satisfy it without writing bad code.',
        kind: 'analysis',
        hours: 4,
      },
    ],
    cards: [
      {
        id: 'cpp08_c1',
        front: 'Power of Ten rule 1 and 2',
        back:
          'Restrict all code to simple control flow: no goto, setjmp/longjmp, or recursion. Give every loop a fixed, statically provable upper bound. Together they make the call graph and the execution time analysable.',
      },
      {
        id: 'cpp08_c2',
        front: 'Power of Ten rule 3',
        back:
          'Do not use dynamic memory allocation after initialisation. This removes allocator non-determinism, fragmentation and the whole class of use-after-free and leak defects in one stroke.',
      },
      {
        id: 'cpp08_c3',
        front: 'Power of Ten rules on function size and assertions',
        back:
          'Keep each function short enough to print on one page, about sixty lines, and use a minimum of two runtime assertions per function, checking conditions that should be impossible. Assertions must have an effect other than nothing in flight, such as entering a safe mode.',
      },
      {
        id: 'cpp08_c4',
        front: 'Which Power of Ten rule most often conflicts with idiomatic modern C++?',
        back:
          'The no-dynamic-allocation rule, because most standard containers and std::string allocate. You comply by preallocating at init, using fixed-capacity containers, std::array and std::span, and custom allocators, without giving up RAII or type safety.',
      },
      {
        id: 'cpp08_c5',
        front: 'What is a single-event upset and what does software do about it?',
        back:
          'A charged particle flips a bit in memory or a register. Mitigations are error-correcting memory with periodic scrubbing, checksums or CRCs on critical data and code, redundant computation with voting, and a watchdog that resets a hung processor.',
      },
      {
        id: 'cpp08_c6',
        front: 'Why is unbounded stack depth unacceptable?',
        back:
          'Stack overflow silently corrupts adjacent memory rather than raising an error, and with recursion or data-dependent depth the worst case cannot be bounded statically. Hence the ban on recursion and on variable-length arrays.',
      },
      {
        id: 'cpp08_c7',
        front: 'What may you not do inside an interrupt service routine?',
        back:
          'Block, allocate, take a lock that a non-interrupt context can hold, call anything with unbounded runtime, or do heavy work. The idiom is to capture the minimum state, set a flag or push into a lock-free queue, and return.',
      },
      {
        id: 'cpp08_c8',
        front: 'What does a watchdog actually guarantee?',
        back:
          'That a processor which stops petting the timer is reset within a known time. It converts a hang into a bounded outage plus a recovery, which is why the vehicle can survive software faults nobody predicted.',
      },
      {
        id: 'cpp08_c9',
        front: 'Why would you move a function into RAM via the linker script?',
        back:
          'Because executing from flash can be slower or can stall while flash is being written, and because an interrupt handler may need to run while flash is unavailable. The linker script places the section and the startup code copies it.',
      },
      {
        id: 'cpp08_c10',
        front: 'Why is -ffast-math dangerous in GNC code?',
        back:
          'It permits reassociation and assumes no NaNs or infinities, so results change with optimisation level, NaN-based fault detection stops working, and bit-exact reproducibility across builds is lost. Determinism is a requirement, not a preference.',
      },
      {
        id: 'cpp08_c11',
        front: 'What is WCET and why is measurement alone not enough?',
        back:
          'Worst-case execution time is the upper bound on how long a task can take. Measurement only samples the paths and inputs you tried; caches, branch prediction and interrupt timing can produce a worse case you never hit. Static analysis plus measurement plus margin is the practice.',
      },
      {
        id: 'cpp08_c12',
        front: 'MISRA C++:2023 in one sentence',
        back:
          'The current unified C++ safety-critical coding standard, which absorbs AUTOSAR C++14 and largely supersedes JSF++, defining rules with required, advisory and mandatory categories plus a documented deviation process.',
      },
      {
        id: 'cpp08_c13',
        front: 'What does a static analyser prove that tests cannot?',
        back:
          'Abstract-interpretation tools such as Polyspace Code Prover can prove the absence of certain run-time errors on all inputs, including paths no test exercises. Tests only demonstrate behaviour on the cases you thought of.',
      },
      {
        id: 'cpp08_c14',
        front: 'How do you prove a control loop is allocation-free?',
        back:
          'Instrument the allocator: override global operator new and delete to count and, during the steady-state region, abort. Run the full test suite with the flag set. It is a mechanical, repeatable check you can put in CI.',
      },
    ],
    quiz: [
      {
        id: 'cpp08_q1',
        q: 'Which is the strongest reason to forbid allocation after initialisation in flight code?',
        choices: [
          'Allocation is slow on embedded processors',
          'The worst-case allocation time is unbounded and long-run fragmentation can cause a failure with free memory remaining',
          'The standard library is unavailable',
          'It saves ROM',
        ],
        answer: 1,
        explain:
          'Determinism and fragmentation. Speed is a secondary concern and the standard library is available in most builds.',
        b: 0.3,
        bloom: 'understand',
      },
      {
        id: 'cpp08_q2',
        q: 'A loop runs while a sensor reports motion. What does the Power of Ten require?',
        choices: [
          'Nothing; the condition is clear',
          'A statically provable iteration bound, for example a maximum count that trips a fault if exceeded',
          'That the loop be converted to recursion',
          'That the loop be moved into an ISR',
        ],
        answer: 1,
        explain:
          'Every loop needs an upper bound that a static checker can verify, so a stuck sensor cannot hang the task. The overflow path is a fault condition, not an accident.',
        b: 0.5,
        bloom: 'apply',
      },
      {
        id: 'cpp08_q3',
        q: 'Which set of software mitigations addresses single-event upsets?',
        choices: [
          'ECC memory with scrubbing, data and code checksums, redundant computation with voting, watchdog resets',
          'Compiler optimisation, inlining, loop unrolling',
          'Exceptions and RTTI',
          'Dynamic allocation with a custom allocator',
        ],
        answer: 0,
        explain:
          'All four detect or correct a corrupted bit, or bound the damage. None of the other options relates to radiation effects.',
        b: 0.4,
        bloom: 'recall',
      },
      {
        id: 'cpp08_q4',
        q: 'Your team wants std::vector inside the 1 kHz task for convenience. What is the correct compromise?',
        choices: [
          'Allow it; modern allocators are fast',
          'Use a fixed-capacity container reserved at initialisation, or a vector with a custom pool allocator whose capacity is reserved before the loop starts',
          'Use std::list instead',
          'Disable the rule for that file',
        ],
        answer: 1,
        explain:
          'You keep the interface and lose the allocation. Reserving before the real-time region, or backing the container with a pool, satisfies both the ergonomics and the determinism requirement.',
        b: 0.6,
        bloom: 'apply',
      },
      {
        id: 'cpp08_q5',
        q: 'Which statement about -ffast-math in a navigation filter is correct?',
        choices: [
          'It is a free speedup',
          'It allows reassociation and assumes no NaN or Inf, breaking NaN-based fault detection and cross-build reproducibility',
          'It only affects transcendental functions',
          'It improves accuracy',
        ],
        answer: 1,
        explain:
          'Any of those consequences alone would disqualify it from a GNC build where results must be reproducible and NaN propagation is a diagnostic.',
        b: 0.8,
        bloom: 'analyze',
      },
      {
        id: 'cpp08_q6',
        q: 'What can Polyspace Code Prover establish that a test suite cannot?',
        choices: [
          'That the requirements are correct',
          'That certain run-time errors are absent on all execution paths and inputs, by abstract interpretation',
          'That the code meets its timing budget',
          'That the design is maintainable',
        ],
        answer: 1,
        explain:
          'It is a soundness argument over the whole input space, not a sample. It says nothing about whether the requirements were right.',
        b: 0.9,
        bloom: 'understand',
      },
      {
        id: 'cpp08_q7',
        q: 'An ISR needs to hand a 256-byte sample to a processing task. What is the right mechanism?',
        choices: [
          'Allocate a buffer and push a pointer onto a std::vector',
          'Take a mutex shared with the task',
          'Copy into a preallocated lock-free SPSC queue slot and return immediately',
          'Call the processing function directly from the ISR',
        ],
        answer: 2,
        explain:
          'The ISR must be short, non-blocking and allocation-free. A lock-free queue over static storage satisfies all three; the other options block, allocate, or extend the interrupt.',
        b: 0.7,
        bloom: 'apply',
      },
      {
        id: 'cpp08_q8',
        q: 'A MISRA rule forbids a construct your team believes is safe and clearer. The professional response is:',
        choices: [
          'Ignore the rule silently',
          'Disable the checker for the file',
          'Raise a documented deviation with a rationale and reviewer approval, as the standard deviation process provides for',
          'Rewrite the code in C',
        ],
        answer: 2,
        explain:
          'Safety standards expect deviations; what they require is that each is justified, recorded and approved, so an auditor can see the reasoning.',
        b: 0.5,
        bloom: 'understand',
      },
    ],
    tags: ['spacex-core', 'cpp', 'realtime'],
    importance: 1.5,
  },

  {
    id: 'cod_cpp_09_eigen',
    track: 'coding',
    tier: 8,
    title: 'Eigen: Numerical Linear Algebra in C++',
    summary:
      "The library aerospace C++ actually uses for vectors, matrices, quaternions and decompositions. Fixed-size types are allocation-free and unrolled, which is exactly why PX4 and flight-adjacent codebases ship it.",
    prereqs: ['cod_cpp_05_templates', 'cod_py_03_numpy'],
    hours: 30,
    topics: [
      'Matrix<Scalar, Rows, Cols>; Vector3d, Matrix3d, Quaterniond typedefs; Dynamic sizing',
      'Why fixed-size types allocate nothing and unroll their loops',
      'Storage order; Map for wrapping an external buffer with no copy',
      'Block operations: block, head, tail, segment, row, col',
      'Coefficient-wise operations via .array() versus matrix operations',
      'Reductions and broadcasting',
      'Decompositions: LLT and LDLT (Cholesky, the covariance workhorse), PartialPivLU, HouseholderQR, ColPivHouseholderQR, JacobiSVD, BDCSVD, SelfAdjointEigenSolver',
      'Solving Ax=b with ldlt().solve(b) rather than inverting',
      'The Geometry module: Quaterniond, AngleAxis, Translation, Isometry3d, Transform, slerp',
      'The Quaterniond(w,x,y,z) constructor versus coeffs() returning x,y,z,w',
      'Alignment, fixed-size vectorizable types and EIGEN_MAKE_ALIGNED_OPERATOR_NEW',
      'Expression templates, lazy evaluation, aliasing, eval() and noalias()',
      'Proving no allocation with EIGEN_RUNTIME_NO_MALLOC and set_is_malloc_allowed',
      'Eigen to NumPy mental mapping',
      'Neighbours: Sophus for Lie groups, Ceres and GTSAM for least squares and factor graphs, SymForce for generated C++',
      'IEEE-754 in practice: fma, Kahan summation, condition number, reproducibility',
    ],
    objectives: [
      'Port a NumPy rotation and filter implementation to Eigen and match it to 1e-12.',
      'Explain why Matrix3d never allocates and MatrixXd does.',
      'Avoid the quaternion element-order footgun when crossing a library boundary.',
      'Use noalias() and eval() correctly and explain the aliasing hazard.',
      'Prove an update step performs no dynamic allocation.',
    ],
    resources: [
      {
        title: 'Eigen documentation: Getting Started, Quick Reference, Geometry, Preprocessor Directives',
        author: 'Eigen developers',
        kind: 'docs',
        url: 'https://eigen.tuxfamily.org/dox/',
        free: true,
      },
      {
        title: 'Eigen source repository',
        kind: 'tool',
        url: 'https://gitlab.com/libeigen/eigen',
        free: true,
        note: 'Header-only: vendoring it is a directory copy, which is part of why it is everywhere.',
      },
      {
        title: 'Accuracy and Stability of Numerical Algorithms, 2nd ed.',
        author: 'Nicholas J. Higham',
        kind: 'book',
        free: false,
        note: 'The reference for why one formulation of the same mathematics is numerically better than another.',
      },
    ],
    exercises: [
      {
        id: 'cpp09_ex1',
        title: 'Quaternion and DCM round trip in Eigen',
        prompt:
          'Write a program that builds a Quaterniond from (w,x,y,z) = (0.5, 0.5, 0.5, 0.5), prints coeffs() in its native order, converts to a rotation matrix, converts back, and prints the maximum absolute difference between the original and recovered coefficients. Then rotate the vector (1,0,0) and print the result. Expected output: coeffs prints 0.5 0.5 0.5 0.5 in the order x,y,z,w; the round-trip difference is below 1e-15; and the rotated vector is (0,1,0) to within 1e-15.',
        kind: 'code',
        lang: 'cpp',
        starter:
          '#include <Eigen/Dense>\n#include <Eigen/Geometry>\n#include <cstdio>\n\nint main() {\n    // Note the constructor takes (w, x, y, z) but coeffs() returns (x, y, z, w).\n    Eigen::Quaterniond q(0.5, 0.5, 0.5, 0.5);\n    // TODO: print coeffs, convert to matrix and back, rotate (1,0,0)\n    return 0;\n}\n',
        solution:
          '#include <Eigen/Dense>\n#include <Eigen/Geometry>\n#include <cstdio>\n\nint main() {\n    Eigen::Quaterniond q(0.5, 0.5, 0.5, 0.5);   // (w, x, y, z)\n    const Eigen::Vector4d c = q.coeffs();        // (x, y, z, w)\n    std::printf("%.1f %.1f %.1f %.1f\\n", c[0], c[1], c[2], c[3]);  // 0.5 0.5 0.5 0.5\n\n    const Eigen::Matrix3d R = q.toRotationMatrix();\n    const Eigen::Quaterniond q2(R);\n    const double err = (q2.coeffs() - q.coeffs()).cwiseAbs().maxCoeff();\n    std::printf("%.1e\\n", err);                  // ~0, below 1e-15\n\n    const Eigen::Vector3d v = q * Eigen::Vector3d::UnitX();\n    std::printf("%.1f %.1f %.1f\\n", v.x(), v.y(), v.z());   // 0.0 1.0 0.0\n    return 0;\n}\n',
        hours: 2,
      },
      {
        id: 'cpp09_ex2',
        title: 'Covariance update without inverting',
        prompt:
          'Implement a Kalman measurement update for a 6-state, 3-measurement problem using fixed-size Eigen types. Compute the innovation covariance S = H P H^T + R and the gain K = P H^T S^-1 by solving with an LDLT decomposition rather than forming S.inverse(), then apply the Joseph-form covariance update. Verify that the posterior covariance stays symmetric positive definite (its LLT succeeds) and that no dynamic allocation happens in the update. Expected: the trace of P decreases after the update, symmetry error is below 1e-15, and the allocation counter reads zero.',
        kind: 'code',
        lang: 'cpp',
        starter:
          '#include <Eigen/Dense>\n\nusing State = Eigen::Matrix<double, 6, 1>;\nusing Cov = Eigen::Matrix<double, 6, 6>;\nusing Meas = Eigen::Matrix<double, 3, 1>;\nusing MeasCov = Eigen::Matrix<double, 3, 3>;\nusing H_t = Eigen::Matrix<double, 3, 6>;\n\nvoid update(State& x, Cov& P, const H_t& H, const MeasCov& R, const Meas& z) {\n    // TODO: S = H P H^T + R; K = P H^T S^-1 via ldlt; Joseph form update\n}\n',
        solution:
          '#include <Eigen/Dense>\n\nusing State = Eigen::Matrix<double, 6, 1>;\nusing Cov = Eigen::Matrix<double, 6, 6>;\nusing Meas = Eigen::Matrix<double, 3, 1>;\nusing MeasCov = Eigen::Matrix<double, 3, 3>;\nusing H_t = Eigen::Matrix<double, 3, 6>;\nusing K_t = Eigen::Matrix<double, 6, 3>;\n\nvoid update(State& x, Cov& P, const H_t& H, const MeasCov& R, const Meas& z) {\n    const Eigen::Matrix<double, 6, 3> PHt = P * H.transpose();\n    const MeasCov S = H * PHt + R;\n\n    // K = PHt * S^-1 solved as S^T K^T = PHt^T, i.e. no explicit inverse.\n    const K_t K = S.ldlt().solve(PHt.transpose()).transpose();\n\n    const Meas y = z - H * x;          // innovation\n    x.noalias() += K * y;\n\n    // Joseph form: stays symmetric positive definite under gain error.\n    const Cov I_KH = Cov::Identity() - K * H;\n    P = I_KH * P * I_KH.transpose() + K * R * K.transpose();\n    P = 0.5 * (P + P.transpose().eval());   // re-symmetrise against round-off\n}\n\n// All types are fixed size, so every temporary above lives on the stack and\n// the whole update is allocation-free; verify with EIGEN_RUNTIME_NO_MALLOC and\n// Eigen::internal::set_is_malloc_allowed(false) around the call.\n',
        hours: 5,
      },
    ],
    cards: [
      {
        id: 'cpp09_c1',
        front: 'Why is Matrix3d allocation-free but MatrixXd not?',
        back:
          'Fixed-size types store their coefficients in a member array sized at compile time, so they live wherever the object lives, usually the stack. Dynamic types hold a pointer to a heap buffer sized at runtime.',
      },
      {
        id: 'cpp09_c2',
        front: 'Quaterniond(w,x,y,z) but coeffs() returns what?',
        back:
          '(x, y, z, w). The constructor is scalar-first and the internal storage is scalar-last, which is the single most common Eigen bug at a library boundary. Convert deliberately and test the round trip.',
      },
      {
        id: 'cpp09_c3',
        front: 'What does noalias() prevent?',
        back:
          'Eigen creating a temporary for a matrix product assignment. Write C.noalias() = A * B only when you know C does not appear on the right-hand side; using it when it does gives a silently wrong result.',
      },
      {
        id: 'cpp09_c4',
        front: 'Why is a = a * b hazardous?',
        back:
          'The product reads a while writing it. Eigen inserts a temporary for matrix products by default to be safe, but for coefficient-wise expressions and some in-place ops you must call .eval() yourself.',
      },
      {
        id: 'cpp09_c5',
        front: 'Which decomposition for a covariance matrix and why?',
        back:
          'LDLT (or LLT). Covariances are symmetric positive semi-definite, so Cholesky-family factorisations are about twice as fast as LU, numerically stable for this class, and LDLT tolerates semi-definiteness without a square root of a negative.',
      },
      {
        id: 'cpp09_c6',
        front: 'Why solve rather than invert?',
        back:
          'Forming the inverse costs roughly three times a factorise-and-solve and adds rounding; solve() uses the factorisation directly. Explicit inverses are for when the matrix itself is the answer, which is rare.',
      },
      {
        id: 'cpp09_c7',
        front: 'What is Eigen::Map for?',
        back:
          'Viewing an existing raw buffer as an Eigen matrix or vector without copying. It is how you wrap a DMA buffer, a message payload or a NumPy array crossing a pybind11 boundary.',
      },
      {
        id: 'cpp09_c8',
        front: '.array() versus matrix operations',
        back:
          'Matrix operators mean linear algebra: * is matrix product. Switching to .array() makes operators coefficient-wise, so a.array() * b.array() is the element-wise product. Mixing the two up is a silent-wrong-answer class of bug.',
      },
      {
        id: 'cpp09_c9',
        front: 'How do you prove an Eigen update step allocates nothing?',
        back:
          'Compile with EIGEN_RUNTIME_NO_MALLOC and wrap the region with Eigen::internal::set_is_malloc_allowed(false); any attempted allocation then asserts. Keep it in a test so a future refactor that introduces a dynamic type fails CI.',
      },
      {
        id: 'cpp09_c10',
        front: 'What is the fixed-size vectorizable alignment rule?',
        back:
          'Fixed-size types whose size is a multiple of 16 bytes (for example Vector4d, Matrix4d, Vector2d) require over-aligned storage for SIMD. Classes holding them as members need EIGEN_MAKE_ALIGNED_OPERATOR_NEW on older toolchains; C++17 aligned new largely handles it now.',
      },
      {
        id: 'cpp09_c11',
        front: 'Why does the condition number matter to a filter?',
        back:
          'It bounds how much a relative input error is amplified. A covariance with condition 1e14 in double precision has roughly two trustworthy digits left, which is how a filter silently loses positive definiteness and diverges.',
      },
      {
        id: 'cpp09_c12',
        front: 'Why the Joseph form covariance update?',
        back:
          'It is algebraically equivalent to the simple form for the optimal gain, but stays symmetric positive semi-definite even when the gain is slightly wrong or round-off has crept in. That robustness is why flight filters use it.',
        formula: true,
      },
      {
        id: 'cpp09_c13',
        front: 'Eigen to NumPy mapping: three gotchas',
        back:
          'Eigen defaults to column-major while NumPy defaults to row-major; Eigen quaternion storage is scalar-last while the constructor is scalar-first; and Eigen matrix * is a matrix product while NumPy * is element-wise.',
      },
      {
        id: 'cpp09_c14',
        front: 'What is SymForce and why mention it here?',
        back:
          'A Skydio toolchain that writes the mathematics symbolically in Python and generates optimised C++, including analytic Jacobians. It is the production version of the SymPy-plus-lambdify pattern, and it removes the hand-differentiation bug class.',
      },
    ],
    quiz: [
      {
        id: 'cpp09_q1',
        q: 'Eigen::Quaterniond q(0, 0, 0, 1); what rotation is this?',
        choices: [
          'Identity',
          'A 180 degree rotation, because the constructor is (w,x,y,z) so this sets w=0, z=1',
          'A 90 degree rotation about z',
          'An invalid quaternion',
        ],
        answer: 1,
        explain:
          'The constructor is scalar-first, so this is (w,x,y,z) = (0,0,0,1): a 180 degree rotation about the z axis. Writing coeffs order into the constructor is the classic mistake.',
        b: 0.8,
        bloom: 'apply',
      },
      {
        id: 'cpp09_q2',
        q: 'Which computes the gain K = P H^T S^-1 best?',
        choices: [
          'K = P * H.transpose() * S.inverse()',
          'K = S.ldlt().solve((P * H.transpose()).transpose()).transpose()',
          'K = S.llt().matrixL() * P',
          'K = (P * H.transpose()).array() / S.array()',
        ],
        answer: 1,
        explain:
          'Solving with a Cholesky-family factorisation is faster and more accurate than forming the inverse, and S is symmetric positive definite by construction. The last option is element-wise division, which is simply wrong.',
        b: 1.0,
        bloom: 'apply',
      },
      {
        id: 'cpp09_q3',
        q: 'Why does PX4 and similar flight-adjacent code use fixed-size Eigen types?',
        choices: [
          'They are easier to type',
          'No dynamic allocation, loops unrolled at compile time, and dimension errors caught by the compiler',
          'They use less precision',
          'They are the only ones that support quaternions',
        ],
        answer: 1,
        explain:
          'All three properties are exactly what a real-time, analysable control path requires.',
        b: 0.4,
        bloom: 'understand',
      },
      {
        id: 'cpp09_q4',
        q: 'A = A * B silently gives the wrong answer in a coefficient-wise expression. The cause is:',
        choices: [
          'A compiler bug',
          'Aliasing: the expression reads A while writing it, and lazy evaluation means no temporary was made',
          'Wrong storage order',
          'Missing noalias()',
        ],
        answer: 1,
        explain:
          'Expression templates evaluate into the destination. Call .eval() to force a temporary; noalias() does the opposite, asserting there is no aliasing.',
        b: 1.1,
        bloom: 'analyze',
      },
      {
        id: 'cpp09_q5',
        q: 'How do you prove in CI that the filter update never allocates?',
        choices: [
          'Inspect the code by eye',
          'Build with EIGEN_RUNTIME_NO_MALLOC and assert inside a set_is_malloc_allowed(false) region during the test',
          'Measure the runtime',
          'Use only Vector3d types',
        ],
        answer: 1,
        explain:
          'It converts a review property into an automated check that survives refactoring. A global operator new counter achieves the same for non-Eigen allocations.',
        b: 0.7,
        bloom: 'apply',
      },
      {
        id: 'cpp09_q6',
        q: 'a.array() * b.array() for two Matrix3d computes:',
        choices: [
          'The matrix product',
          'The element-wise product',
          'The outer product',
          'A compile error',
        ],
        answer: 1,
        explain:
          '.array() switches the expression into coefficient-wise semantics. Matrix * on the same objects is the linear-algebra product.',
        b: 0.3,
        bloom: 'recall',
      },
      {
        id: 'cpp09_q7',
        q: 'You must expose a C++ Eigen matrix to a Python harness without copying. Which tool?',
        choices: [
          'Eigen::Map over the NumPy buffer through pybind11',
          'Serialise to CSV',
          'MatrixXd::Random',
          'std::memcpy into a std::vector',
        ],
        answer: 0,
        explain:
          'Map wraps existing memory, and pybind11 eigen support does exactly this for NumPy arrays, which is the standard pattern for a C++ core driven by a Python Monte Carlo harness.',
        b: 0.8,
        bloom: 'apply',
      },
    ],
    tags: ['spacex-core', 'cpp', 'math'],
    importance: 1.45,
  },

  {
    id: 'cod_cpp_10_cmake',
    track: 'coding',
    tier: 6,
    title: 'CMake and the C++ Build System',
    summary:
      "Modern target-based CMake: libraries that carry their own usage requirements, presets, cross-compilation toolchain files, and a project layout a stranger can build in one command.",
    prereqs: ['cod_cpp_03_raii', 'cod_lnx_02_scripting'],
    hours: 20,
    topics: [
      'cmake_minimum_required, project, and why a modern minimum matters',
      'add_library and add_executable; INTERFACE, STATIC and SHARED',
      'target_link_libraries with PUBLIC, PRIVATE and INTERFACE, and what each propagates',
      'target_include_directories, target_compile_features, target_compile_options, target_compile_definitions',
      'Generator expressions and per-configuration settings',
      'find_package and config packages; FetchContent versus submodules versus Conan or vcpkg',
      'CMakePresets.json for reproducible configure and build commands',
      'Out-of-source builds and CMAKE_BUILD_TYPE',
      'Toolchain files for cross-compiling to an embedded target',
      'install and export so downstream projects can find_package you',
      'ctest and test registration',
      'Canonical layout: apps, cmake, extern, include, src, tests',
      'Sanitizer and coverage build configurations',
      'ccache and build-time hygiene',
    ],
    objectives: [
      'Stand up a project with a library, an application and tests that builds with two commands.',
      'Explain what PUBLIC versus PRIVATE propagates to consumers, with an example of getting it wrong.',
      'Write a toolchain file that cross-compiles to arm-none-eabi.',
      'Expose the project through install and export so another project can find_package it.',
      'Add ASan, UBSan and coverage configurations without duplicating the target definitions.',
    ],
    resources: [
      {
        title: 'Professional CMake: A Practical Guide',
        author: 'Craig Scott',
        kind: 'book',
        url: 'https://crascit.com/professional-cmake/',
        free: false,
        note: 'The reference; updated with each CMake release and worth the money if you own a build system.',
      },
      {
        title: 'CMake official tutorial',
        author: 'Kitware',
        kind: 'docs',
        url: 'https://cmake.org/cmake/help/latest/guide/tutorial/index.html',
        free: true,
      },
      {
        title: 'An Introduction to Modern CMake',
        author: 'Henry Schreiner',
        kind: 'site',
        url: 'https://cliutils.gitlab.io/modern-cmake/',
        free: true,
      },
    ],
    exercises: [
      {
        id: 'cpp10_ex1',
        title: 'Target-based project skeleton',
        prompt:
          'Create a project with a gnc library in src/ and include/gnc/, an app in apps/, and tests in tests/. The library must expose its headers through target_include_directories with PUBLIC, require C++20 through target_compile_features, and keep its warning flags PRIVATE. Add a CMakePresets.json with debug, release and asan presets. Success: `cmake --preset debug && cmake --build --preset debug && ctest --preset debug` works from a clean clone.',
        kind: 'build',
        hours: 3,
      },
      {
        id: 'cpp10_ex2',
        title: 'Propagation bug hunt',
        prompt:
          'Given a CMakeLists in which a library links Eigen as PRIVATE but exposes Eigen types in its public headers, explain precisely why a consumer fails to compile, fix it, and then describe the opposite mistake (PUBLIC where PRIVATE was right) and what it costs. Expected: the first fails with a missing Eigen header in the consumer, and the fix is to make the dependency PUBLIC (or INTERFACE for a header-only library).',
        kind: 'analysis',
        hours: 2,
      },
    ],
    cards: [
      {
        id: 'cpp10_c1',
        front: 'PUBLIC, PRIVATE and INTERFACE in target_link_libraries',
        back:
          'PRIVATE: used to build this target only. INTERFACE: not used to build it, but propagated to consumers. PUBLIC: both. The rule follows the headers: if the dependency appears in your public headers it must be PUBLIC or INTERFACE.',
      },
      {
        id: 'cpp10_c2',
        front: 'What is a usage requirement?',
        back:
          'Anything a consumer needs in order to use your target: include directories, compile definitions, language features, and linked libraries. Modern CMake attaches these to the target instead of setting global variables.',
      },
      {
        id: 'cpp10_c3',
        front: 'Why avoid include_directories() and global CMAKE_CXX_FLAGS?',
        back:
          'They apply to everything in the directory and below, so requirements leak between unrelated targets and cannot be composed or exported. Target-scoped commands make dependencies explicit and correct for consumers.',
      },
      {
        id: 'cpp10_c4',
        front: 'What is a toolchain file for?',
        back:
          'Telling CMake about a different target platform before the first compiler test: the cross compiler, the sysroot, the target processor and search behaviour. It is how you build for arm-none-eabi from an x86 host.',
      },
      {
        id: 'cpp10_c5',
        front: 'FetchContent versus find_package',
        back:
          'FetchContent downloads and builds the dependency as part of your build, which is reproducible and hermetic but rebuilds it for everyone. find_package uses a dependency already installed or provided by a package manager. Large teams usually use find_package with vcpkg or Conan.',
      },
      {
        id: 'cpp10_c6',
        front: 'What do CMakePresets.json buy you?',
        back:
          'One committed, versioned definition of the configure, build and test commands, so every developer, the IDE and CI run the same thing. It kills the folklore of long cmake command lines in a wiki.',
      },
      {
        id: 'cpp10_c7',
        front: 'Why an out-of-source build?',
        back:
          'It keeps generated files out of the repository, lets several configurations coexist, and makes a clean build a directory delete. In-source builds pollute git status and make the cache hard to reason about.',
      },
      {
        id: 'cpp10_c8',
        front: 'How do you add a sanitizer build without duplicating targets?',
        back:
          'Define a build configuration or a preset that adds -fsanitize=address,undefined to the compile and link options, typically through a generator expression or an INTERFACE options target that the real targets link. One target definition, several configurations.',
      },
      {
        id: 'cpp10_c9',
        front: 'What does install plus export give a downstream project?',
        back:
          'A generated package configuration file so the consumer can call find_package(gnc) and link an imported target that already carries the usage requirements. Without it, consumers hand-roll include paths and get them wrong.',
      },
      {
        id: 'cpp10_c10',
        front: 'target_compile_features(PUBLIC cxx_std_20): what does it do?',
        back:
          'Requires C++20 for this target and propagates that requirement to consumers, so a consumer stuck on C++17 gets a clear error rather than a mysterious parse failure inside your headers.',
      },
      {
        id: 'cpp10_c11',
        front: 'When should a library be INTERFACE?',
        back:
          'When it is header-only: there is nothing to compile, only usage requirements to propagate. Eigen is the canonical example.',
      },
      {
        id: 'cpp10_c12',
        front: 'Why does CMAKE_BUILD_TYPE matter for a numerical library?',
        back:
          'It selects the optimisation and assertion flags, so Debug and Release can produce different timing, different floating-point contraction and different assertion behaviour. Both must be built and tested, and the type must be stated in any benchmark.',
      },
    ],
    quiz: [
      {
        id: 'cpp10_q1',
        q: 'Your library exposes Eigen::Vector3d in a public header and links Eigen as PRIVATE. What happens to a consumer?',
        choices: [
          'It works; PRIVATE only affects link order',
          'It fails to compile because the Eigen include directory is not propagated',
          'It links but crashes',
          'CMake refuses to configure',
        ],
        answer: 1,
        explain:
          'PRIVATE keeps the usage requirement to yourself. Since the type appears in your interface, the dependency must be PUBLIC (or INTERFACE for header-only).',
        b: 0.6,
        bloom: 'analyze',
      },
      {
        id: 'cpp10_q2',
        q: 'Which is the modern way to require C++20 for a target and its consumers?',
        choices: [
          'set(CMAKE_CXX_FLAGS "-std=c++20")',
          'target_compile_features(tgt PUBLIC cxx_std_20)',
          'add_definitions(-DCXX20)',
          'set(CMAKE_CXX_STANDARD 20) globally',
        ],
        answer: 1,
        explain:
          'It is target-scoped, compiler-agnostic and exported with the target. Raw flags are compiler-specific and the global variable does not propagate to consumers.',
        b: 0.3,
        bloom: 'apply',
      },
      {
        id: 'cpp10_q3',
        q: 'What belongs in a CMake toolchain file?',
        choices: [
          'Unit test definitions',
          'CMAKE_SYSTEM_NAME, the cross compiler paths, the sysroot and find-root-path behaviour',
          'The list of source files',
          'Coverage thresholds',
        ],
        answer: 1,
        explain:
          'The toolchain file describes the target platform and is read before compiler detection, which is why it cannot be expressed as ordinary project settings.',
        b: 0.7,
        bloom: 'recall',
      },
      {
        id: 'cpp10_q4',
        q: 'Why prefer presets over a README full of cmake command lines?',
        choices: [
          'They build faster',
          'They are versioned with the code and used identically by developers, IDEs and CI',
          'They replace the need for CMakeLists.txt',
          'They allow in-source builds',
        ],
        answer: 1,
        explain:
          'The configuration becomes reviewable code rather than folklore, which is the same argument as pipeline-as-code for CI.',
        b: 0.2,
        bloom: 'understand',
      },
      {
        id: 'cpp10_q5',
        q: 'A header-only math library should be declared as:',
        choices: [
          'add_library(math STATIC)',
          'add_library(math INTERFACE) with INTERFACE include directories',
          'add_executable(math)',
          'A global include_directories call',
        ],
        answer: 1,
        explain:
          'There are no sources to compile, only usage requirements to carry, which is exactly what an INTERFACE library models.',
        b: 0.5,
        bloom: 'apply',
      },
      {
        id: 'cpp10_q6',
        q: 'Which statement about FetchContent is most accurate?',
        choices: [
          'It is always preferable to find_package',
          'It makes the build hermetic and reproducible at the cost of building the dependency in every build tree',
          'It requires internet access at run time',
          'It cannot pin a version',
        ],
        answer: 1,
        explain:
          'It is a trade: reproducibility and zero setup versus build time and duplicated work. Pinning by tag or commit is both possible and required.',
        b: 0.6,
        bloom: 'understand',
      },
    ],
    tags: ['spacex-core', 'cpp', 'tooling'],
    importance: 1.3,
  },

  {
    id: 'cod_cpp_11_gtest',
    track: 'coding',
    tier: 7,
    title: 'Testing C++ with GoogleTest and GoogleMock',
    summary:
      "Fixtures, parameterised tests, floating-point assertions, and mocking a sensor or hardware abstraction layer so flight logic can be tested without hardware, wired into CTest and CI with sanitizers and coverage.",
    prereqs: ['cod_cpp_10_cmake', 'cod_cpp_04_stl', 'cod_ops_02_ci'],
    hours: 25,
    topics: [
      'TEST and TEST_F; test suites and fixtures; SetUp and TearDown',
      'ASSERT_* versus EXPECT_* and when a fatal assertion is correct',
      'Floating-point assertions: EXPECT_NEAR, EXPECT_DOUBLE_EQ, and choosing the tolerance',
      'TEST_P parameterised tests and value generators',
      'Typed and type-parameterised tests for template code',
      'Death tests for contract violations',
      'GoogleMock: mocking an ISensor or HAL interface; EXPECT_CALL, matchers, cardinalities',
      'NiceMock, StrictMock and what an uninteresting call means',
      'Dependency injection as the precondition for mockability',
      'gtest_discover_tests, CTest registration, test filters and labels',
      'Catch2 as the alternative and what it trades',
      'Coverage with gcov, lcov and llvm-cov; interpreting an uncovered branch',
      'Sanitizer builds in the test matrix',
      'Testing numerical kernels: invariants, convergence, golden data',
    ],
    objectives: [
      'Write a fixture-based suite for a numerical component with meaningful tolerances.',
      'Mock a sensor interface and verify the logic under nominal, degraded and failed inputs.',
      'Parameterise a test over a table of flight conditions with readable failure output.',
      'Wire the suite into CTest so CI runs it with ASan and reports coverage.',
      'Explain why a StrictMock failure is often a design signal rather than a test bug.',
    ],
    resources: [
      {
        title: 'GoogleTest Primer and Quickstart with CMake',
        author: 'Google',
        kind: 'docs',
        url: 'https://google.github.io/googletest/',
        free: true,
      },
      {
        title: 'gMock Cookbook',
        author: 'Google',
        kind: 'docs',
        url: 'https://google.github.io/googletest/gmock_cook_book.html',
        free: true,
      },
      {
        title: 'Working Effectively with Legacy Code',
        author: 'Michael Feathers',
        kind: 'book',
        free: false,
        note: 'The book on introducing seams so untestable code becomes testable.',
      },
    ],
    exercises: [
      {
        id: 'cpp11_ex1',
        title: 'Mock the IMU behind an interface',
        prompt:
          'Define an interface IImu with read(Vector3& gyro, Vector3& accel) returning a status, make the attitude estimator depend on the interface rather than a concrete driver, and write GoogleMock tests for three cases: nominal data, a stuck sensor returning identical samples, and a read failure. Assert the estimator behaviour in each, including that it does not propagate a stale sample as fresh. Expected: three passing tests, and the failure case must show the estimator flagging invalid rather than silently continuing.',
        kind: 'code',
        lang: 'cpp',
        starter:
          '#include <gmock/gmock.h>\n#include <gtest/gtest.h>\n\nstruct Vec3 { double x{}, y{}, z{}; };\n\nclass IImu {\npublic:\n    virtual ~IImu() = default;\n    virtual bool read(Vec3& gyro, Vec3& accel) = 0;\n};\n\nclass MockImu : public IImu {\npublic:\n    MOCK_METHOD(bool, read, (Vec3& gyro, Vec3& accel), (override));\n};\n',
        solution:
          '#include <gmock/gmock.h>\n#include <gtest/gtest.h>\n\nusing ::testing::_;\nusing ::testing::DoAll;\nusing ::testing::Return;\nusing ::testing::SetArgReferee;\n\nstruct Vec3 { double x{}, y{}, z{}; };\n\nclass IImu {\npublic:\n    virtual ~IImu() = default;\n    virtual bool read(Vec3& gyro, Vec3& accel) = 0;\n};\n\nclass MockImu : public IImu {\npublic:\n    MOCK_METHOD(bool, read, (Vec3& gyro, Vec3& accel), (override));\n};\n\nclass Estimator {\npublic:\n    explicit Estimator(IImu& imu) : imu_(imu) {}\n    void step() {\n        Vec3 g{}, a{};\n        if (!imu_.read(g, a)) { valid_ = false; ++consecutive_failures_; return; }\n        valid_ = true;\n        consecutive_failures_ = 0;\n        rate_ = g;\n    }\n    bool valid() const { return valid_; }\n    int consecutive_failures() const { return consecutive_failures_; }\n    Vec3 rate() const { return rate_; }\nprivate:\n    IImu& imu_;\n    Vec3 rate_{};\n    bool valid_{false};\n    int consecutive_failures_{0};\n};\n\nTEST(Estimator, NominalReadIsAccepted) {\n    MockImu imu;\n    EXPECT_CALL(imu, read(_, _))\n        .WillOnce(DoAll(SetArgReferee<0>(Vec3{0.01, 0.0, 0.0}), Return(true)));\n    Estimator e(imu);\n    e.step();\n    EXPECT_TRUE(e.valid());\n    EXPECT_NEAR(e.rate().x, 0.01, 1e-12);\n}\n\nTEST(Estimator, FailedReadInvalidatesAndCounts) {\n    MockImu imu;\n    EXPECT_CALL(imu, read(_, _)).Times(2).WillRepeatedly(Return(false));\n    Estimator e(imu);\n    e.step();\n    e.step();\n    EXPECT_FALSE(e.valid());\n    EXPECT_EQ(e.consecutive_failures(), 2);\n}\n\nTEST(Estimator, StuckSensorStillReadsButValueNeverChanges) {\n    MockImu imu;\n    EXPECT_CALL(imu, read(_, _))\n        .Times(3)\n        .WillRepeatedly(DoAll(SetArgReferee<0>(Vec3{0.5, 0.5, 0.5}), Return(true)));\n    Estimator e(imu);\n    for (int i = 0; i < 3; ++i) e.step();\n    EXPECT_TRUE(e.valid());\n    EXPECT_NEAR(e.rate().x, 0.5, 1e-12);\n    // A real estimator would also run a staleness check; this test documents\n    // that the current one does not, which is the finding.\n}\n',
        hours: 4,
      },
      {
        id: 'cpp11_ex2',
        title: 'Parameterised integrator test',
        prompt:
          'Write a TEST_P suite that runs a fixed-step integrator over six initial conditions and asserts the end state against an analytic solution with EXPECT_NEAR at a tolerance derived from the step size and method order. Give each case a readable name so a failure identifies the condition immediately. Expected: six named test cases appear in the ctest listing and all pass, and doubling the step makes exactly the cases with the tightest tolerance fail.',
        kind: 'code',
        lang: 'cpp',
        starter:
          '#include <gtest/gtest.h>\n#include <cmath>\n\nstruct Case { const char* name; double y0; double lambda; double t_end; double tol; };\n\nclass IntegratorTest : public ::testing::TestWithParam<Case> {};\n\n// TODO: TEST_P body and INSTANTIATE_TEST_SUITE_P with a name generator\n',
        solution:
          '#include <gtest/gtest.h>\n#include <cmath>\n\nstruct Case { const char* name; double y0; double lambda; double t_end; double tol; };\n\ndouble rk4_decay(double y0, double lambda, double t_end, int n) {\n    const double h = t_end / n;\n    double y = y0;\n    for (int i = 0; i < n; ++i) {\n        const double k1 = lambda * y;\n        const double k2 = lambda * (y + 0.5 * h * k1);\n        const double k3 = lambda * (y + 0.5 * h * k2);\n        const double k4 = lambda * (y + h * k3);\n        y += (h / 6.0) * (k1 + 2 * k2 + 2 * k3 + k4);\n    }\n    return y;\n}\n\nclass IntegratorTest : public ::testing::TestWithParam<Case> {};\n\nTEST_P(IntegratorTest, MatchesAnalyticSolution) {\n    const Case& c = GetParam();\n    const double got = rk4_decay(c.y0, c.lambda, c.t_end, 200);\n    const double want = c.y0 * std::exp(c.lambda * c.t_end);\n    EXPECT_NEAR(got, want, c.tol) << "case " << c.name;\n}\n\nINSTANTIATE_TEST_SUITE_P(\n    DecayCases, IntegratorTest,\n    ::testing::Values(\n        Case{"unit_slow",   1.0, -0.1,  10.0, 1e-10},\n        Case{"unit_fast",   1.0, -5.0,   2.0, 1e-9},\n        Case{"large_y0",  1e3, -1.0,   3.0, 1e-7},\n        Case{"small_y0",  1e-3, -1.0,  3.0, 1e-13},\n        Case{"growth",     1.0,  0.5,   4.0, 1e-8},\n        Case{"zero",       0.0, -1.0,   1.0, 1e-15}),\n    [](const ::testing::TestParamInfo<Case>& info) { return std::string(info.param.name); });\n',
        hours: 3,
      },
    ],
    cards: [
      {
        id: 'cpp11_c1',
        front: 'ASSERT_* versus EXPECT_*',
        back:
          'ASSERT aborts the current test function on failure; EXPECT records the failure and continues. Use ASSERT when continuing would crash or produce meaningless cascading failures, for example after checking a pointer or a container size.',
      },
      {
        id: 'cpp11_c2',
        front: 'EXPECT_DOUBLE_EQ versus EXPECT_NEAR',
        back:
          'EXPECT_DOUBLE_EQ allows about four units in the last place, which is right only for values that should be bitwise-almost-identical. EXPECT_NEAR takes an explicit absolute tolerance, which is what a numerical result with accumulated error needs.',
      },
      {
        id: 'cpp11_c3',
        front: 'What is a test fixture for?',
        back:
          'Shared setup and teardown plus shared members across the tests in a suite, constructed fresh per test. It removes duplication while keeping tests independent, which a static or global would not.',
      },
      {
        id: 'cpp11_c4',
        front: 'Why parameterise a test rather than loop inside it?',
        back:
          'Each parameter becomes its own test case, so all cases run, the failing one is named, and you can filter or mark individual cases. A loop stops at the first failure and hides the rest.',
      },
      {
        id: 'cpp11_c5',
        front: 'What does GoogleMock actually let you test?',
        back:
          'Interaction: which calls the code under test makes, with what arguments, how many times and in what order, plus canned return values and out-parameters. It is how flight logic is tested against a sensor that is not present.',
      },
      {
        id: 'cpp11_c6',
        front: 'NiceMock, naggy and StrictMock',
        back:
          'By default an uninteresting call produces a warning. NiceMock silences it, StrictMock turns it into a failure. StrictMock is valuable when the set of calls is itself part of the contract, for example that a failed read does not trigger an actuator command.',
      },
      {
        id: 'cpp11_c7',
        front: 'Why is dependency injection a precondition for mocking?',
        back:
          'If the class constructs its own concrete driver there is no seam to substitute. Taking the dependency as an interface reference or template parameter is what makes the test double possible, and usually improves the design anyway.',
      },
      {
        id: 'cpp11_c8',
        front: 'What is a death test and when do you want one?',
        back:
          'A test asserting the process terminates (and optionally what it prints) when a contract is violated. In flight-adjacent code it is how you verify an assertion or a safe-mode abort actually fires.',
      },
      {
        id: 'cpp11_c9',
        front: 'gtest_discover_tests: what does it do?',
        back:
          'Runs the test binary at build time to enumerate its cases and registers each with CTest, so ctest reports individual test names and can filter and parallelise them, rather than treating the binary as one opaque test.',
      },
      {
        id: 'cpp11_c10',
        front: 'How do you pick the tolerance in EXPECT_NEAR for an integrator?',
        back:
          'From the method order and step size, not by tuning until green. For a fourth-order scheme at step h, the global error scales as h to the fourth; set the tolerance a small factor above that bound and record the reasoning in a comment.',
        formula: true,
      },
      {
        id: 'cpp11_c11',
        front: 'A branch shows as uncovered. What are the two possible meanings?',
        back:
          'Either a missing test for a reachable case, or dead logic that cannot be reached and should be removed. Both are findings; recording which one it is, is the actual work.',
      },
      {
        id: 'cpp11_c12',
        front: 'Why run the test suite under sanitizers in CI?',
        back:
          'Tests exercise the code paths, and sanitizers turn latent undefined behaviour on those paths into a deterministic failure. A green suite without sanitizers proves only that the bug did not manifest today.',
      },
    ],
    quiz: [
      {
        id: 'cpp11_q1',
        q: 'A test checks vec.size() == 3 and then reads vec[2]. Which assertion should the size check use?',
        choices: ['EXPECT_EQ', 'ASSERT_EQ', 'Either is equivalent', 'EXPECT_TRUE'],
        answer: 1,
        explain:
          'If the size is wrong, continuing reads out of bounds. ASSERT stops the test function before the undefined behaviour.',
        b: 0.3,
        bloom: 'apply',
      },
      {
        id: 'cpp11_q2',
        q: 'Which assertion suits a value produced by a thousand RK4 steps?',
        choices: [
          'EXPECT_EQ',
          'EXPECT_DOUBLE_EQ',
          'EXPECT_NEAR with a tolerance derived from method order and step size',
          'EXPECT_FLOAT_EQ',
        ],
        answer: 2,
        explain:
          'Accumulated truncation error dwarfs a few ULP, so the ULP-based assertions will fail spuriously. The tolerance should come from the numerics, not from experiment.',
        b: 0.5,
        bloom: 'apply',
      },
      {
        id: 'cpp11_q3',
        q: 'What does StrictMock change?',
        choices: [
          'It makes the mock thread-safe',
          'It turns any call with no matching expectation into a test failure',
          'It disables return values',
          'It requires all expectations to be in order',
        ],
        answer: 1,
        explain:
          'Unexpected interactions become failures, which is what you want when the absence of a call, such as commanding an actuator on bad data, is part of the requirement. Ordering is a separate feature (InSequence).',
        b: 0.7,
        bloom: 'understand',
      },
      {
        id: 'cpp11_q4',
        q: 'A class constructs its own UART driver internally and cannot be tested. The right fix is:',
        choices: [
          'Add #ifdef TEST branches inside the class',
          'Introduce an interface and inject the dependency through the constructor',
          'Make the driver members public',
          'Test only on hardware',
        ],
        answer: 1,
        explain:
          'Injection creates the seam, keeps production code free of test-only branches and usually clarifies the design. Conditional compilation means you no longer test what you ship.',
        b: 0.4,
        bloom: 'apply',
      },
      {
        id: 'cpp11_q5',
        q: 'Why register tests with gtest_discover_tests rather than add_test on the binary?',
        choices: [
          'It compiles faster',
          'CTest then knows individual test names, so it can filter, label, parallelise and report them separately',
          'It is required by GoogleTest',
          'It enables sanitizers',
        ],
        answer: 1,
        explain:
          'Granularity is the benefit: a failing case is identified by name in CI output instead of being buried in one opaque binary result.',
        b: 0.5,
        bloom: 'understand',
      },
      {
        id: 'cpp11_q6',
        q: 'Coverage shows an uncovered else branch in a fault handler. What is the correct action?',
        choices: [
          'Delete the branch to raise coverage',
          'Add a test that drives the fault condition, or establish that the branch is unreachable and remove it with justification',
          'Exclude the file from coverage',
          'Lower the coverage threshold',
        ],
        answer: 1,
        explain:
          'Either the fault path is untested (a gap) or it is dead (a defect). Both need resolving; gaming the metric resolves neither.',
        b: 0.6,
        bloom: 'analyze',
      },
      {
        id: 'cpp11_q7',
        q: 'Which is the strongest argument for testing flight logic against a mocked HAL?',
        choices: [
          'It is faster than hardware-in-the-loop',
          'It lets you drive degraded and failed sensor behaviour deterministically and repeatedly, which real hardware rarely does on demand',
          'It removes the need for hardware testing',
          'It improves coverage numbers',
        ],
        answer: 1,
        explain:
          'The value is controllability of fault cases. It complements, and never replaces, hardware-in-the-loop testing.',
        b: 0.6,
        bloom: 'understand',
      },
    ],
    tags: ['spacex-core', 'cpp', 'testing'],
    importance: 1.35,
  },

  /* ══ MATLAB ══════════════════════════════════════════════════════════════ */
  {
    id: 'cod_mat_01_core',
    track: 'coding',
    tier: 2,
    title: 'MATLAB: Core Language and Program Structure',
    summary:
      "MATLAB is secondary to C++ and Python for flight software, but it is not optional for GNC analysis roles, and one live posting demands expert-level proficiency. Learn it after Python, then translate what you already know.",
    prereqs: ['cod_py_01_basics'],
    hours: 25,
    topics: [
      'The desktop, Command Window, Workspace, Editor and Live Editor',
      'Everything is a matrix; the colon operator, linspace, zeros, ones, eye',
      'One-based indexing, end, logical indexing, find',
      'Element-wise .* ./ .^ versus matrix * / ^ (the single most common beginner error)',
      'Backslash mldivide and why A\\b beats inv(A)*b',
      'Concatenation, reshape, size, length, numel',
      'struct, cell, table, categorical, string versus char',
      'Control flow: if, switch, for, while, break, continue',
      'Preallocation and why growing an array in a loop is fatal',
      'fprintf, sprintf, disp; save/load and .mat files; readtable and writetable',
      'Scripts versus functions and the base workspace: a classic interview question',
      'Local, nested and anonymous functions; function handles; closures',
      'nargin, nargout, varargin; arguments blocks and validateattributes',
      'MATLAB OOP: classdef, handle versus value semantics',
      'The Profiler, tic/toc, vectorisation, parfor',
      'Plotting: plot, tiledlayout, yyaxis, semilogx, exportgraphics',
      'timetable, synchronize and retime as the merge_asof equivalent',
    ],
    objectives: [
      'Finish MATLAB Onramp and translate ten Python exercises into idiomatic MATLAB.',
      'Explain A.^2 versus A^2 for a 3x3 matrix without hesitating.',
      'Explain why a script cannot see a function local variable, in terms of workspaces.',
      'Profile a slow script and make it ten times faster through preallocation and vectorisation.',
      'Produce a six-panel flight-data figure with a shared time axis and a shaded band.',
    ],
    resources: [
      {
        title: 'MATLAB Onramp',
        author: 'MathWorks',
        kind: 'course',
        url: 'https://matlabacademy.mathworks.com/details/matlab-onramp/gettingstarted',
        free: true,
        note: 'About two hours, browser-based, with automatic assessment. The single most efficient on-ramp in this curriculum.',
      },
      {
        title: 'MATLAB: A Practical Introduction to Programming and Problem Solving, 6th ed.',
        author: 'Stormy Attaway',
        kind: 'book',
        free: false,
        note: 'Assumes zero programming background; the standard university text.',
      },
      {
        title: 'Introduction to Programming with MATLAB (Vanderbilt)',
        author: 'Mike Fitzpatrick and Akos Ledeczi',
        kind: 'course',
        url: 'https://www.coursera.org/learn/matlab',
        free: true,
        note: 'Free to audit; consistently ranked among the strongest MOOCs in any subject.',
      },
      {
        title: 'MATLAB Documentation',
        author: 'MathWorks',
        kind: 'docs',
        url: 'https://www.mathworks.com/help/matlab/',
        free: true,
      },
    ],
    exercises: [
      {
        id: 'mat01_ex1',
        title: 'Vectorise and preallocate',
        prompt:
          'Given a script that builds a 1e6-element result by x(end+1) = ... inside a loop, rewrite it two ways: preallocated loop, and fully vectorised. Report tic/toc for all three. Expected result: the growing-array version is orders of magnitude slower, the preallocated loop is close to the vectorised one, and all three produce identical output to within 1e-12.',
        kind: 'code',
        lang: 'matlab',
        starter:
          'n = 1e6;\nt = linspace(0, 10, n);\n\n% Version A: the bug\ntic\nx = [];\nfor k = 1:n\n    x(end+1) = sin(2*pi*t(k)) * exp(-0.1*t(k));   %#ok<AGROW>\nend\ntA = toc;\n\n% TODO: Version B preallocated, Version C vectorised, then compare\n',
        solution:
          'n = 1e6;\nt = linspace(0, 10, n);\n\ntic\nx = [];\nfor k = 1:n\n    x(end+1) = sin(2*pi*t(k)) * exp(-0.1*t(k));   %#ok<AGROW>\nend\ntA = toc;\n\n% Version B: preallocated. One allocation instead of n reallocations.\ntic\ny = zeros(1, n);\nfor k = 1:n\n    y(k) = sin(2*pi*t(k)) * exp(-0.1*t(k));\nend\ntB = toc;\n\n% Version C: vectorised. No interpreter loop at all.\ntic\nz = sin(2*pi*t) .* exp(-0.1*t);\ntC = toc;\n\nfprintf("grow %.3f s, prealloc %.3f s, vectorised %.3f s\\n", tA, tB, tC);\nassert(max(abs(x - z)) < 1e-12);\nassert(max(abs(y - z)) < 1e-12);\n',
        hours: 2,
      },
      {
        id: 'mat01_ex2',
        title: 'A validated toolbox function',
        prompt:
          'Write rms_per_axis(data, opts) taking an N-by-3 matrix and returning a 1-by-3 row of per-axis RMS values, using an arguments block to validate that data is a numeric N-by-3 matrix and that an optional Weights vector, if given, is positive and length N. It must return zeros(1,3) for an empty input rather than erroring. Expected: rms_per_axis([3 4 0; 0 0 0]) returns [2.1213 2.8284 0] to four decimals.',
        kind: 'code',
        lang: 'matlab',
        starter:
          'function r = rms_per_axis(data, opts)\n    arguments\n        data (:,3) double\n        % TODO: optional weights with validation\n    end\n    % TODO\nend\n',
        solution:
          'function r = rms_per_axis(data, opts)\n    arguments\n        data (:,3) double {mustBeNumeric}\n        opts.Weights (:,1) double {mustBePositive} = []\n    end\n\n    if isempty(data)\n        r = zeros(1, 3);\n        return\n    end\n\n    if isempty(opts.Weights)\n        r = sqrt(mean(data.^2, 1));\n    else\n        assert(numel(opts.Weights) == size(data, 1), ...\n               "Weights must have one entry per row of data");\n        w = opts.Weights / sum(opts.Weights);\n        r = sqrt(sum(w .* data.^2, 1));\n    end\nend\n\n% rms_per_axis([3 4 0; 0 0 0])  ->  [2.1213  2.8284  0]\n',
        hours: 2,
      },
    ],
    cards: [
      {
        id: 'mat01_c1',
        front: 'A.^2 versus A^2 for a 3x3 matrix',
        back:
          'A.^2 squares each element; A^2 is the matrix product A*A. Confusing them is the most common MATLAB beginner error and it produces plausible-looking wrong numbers rather than an error.',
      },
      {
        id: 'mat01_c2',
        front: 'Why A\\b rather than inv(A)*b?',
        back:
          'Backslash chooses an appropriate factorisation for the structure of A and solves directly, which is faster and more accurate than forming an explicit inverse. MATLAB documentation warns against inv for exactly this reason.',
      },
      {
        id: 'mat01_c3',
        front: 'Why is x(end+1) = v inside a loop a bug?',
        back:
          'Each assignment may reallocate and copy the whole array, making the loop quadratic in the number of iterations. Preallocate with zeros(1,n) and index, or vectorise.',
      },
      {
        id: 'mat01_c4',
        front: 'Scripts versus functions: the workspace difference',
        back:
          'A script runs in the caller workspace (usually base), so it sees and mutates whatever is there. A function has its own workspace and communicates only through arguments and return values, which is why a function cannot see a variable a script defined.',
      },
      {
        id: 'mat01_c5',
        front: 'What does an anonymous function capture?',
        back:
          'The values of the workspace variables it references, at the moment of creation. Later changes to those variables do not affect the handle, which surprises people expecting Python-style late binding.',
      },
      {
        id: 'mat01_c6',
        front: 'handle versus value class for a Spacecraft object',
        back:
          'A value class copies on assignment, so passing it to a function cannot mutate the caller copy. A handle class is a reference, so mutation is visible everywhere. Use handle when the object models a single shared entity, and expect Python users to be surprised by the value default.',
      },
      {
        id: 'mat01_c7',
        front: 'MATLAB is one-based. What else follows from that?',
        back:
          'Ranges are inclusive on both ends (1:5 is five elements), end means the last index, and a translated Python loop is off by one unless you adjust. Index-derived time offsets are a common translation bug.',
      },
      {
        id: 'mat01_c8',
        front: 'What does an arguments block give you?',
        back:
          'Declarative validation of size, class and value, plus defaults and name-value options, checked before the body runs and documented in the function signature. It replaces a page of hand-written inputParser or assert code.',
      },
      {
        id: 'mat01_c9',
        front: 'struct array versus table versus cell',
        back:
          'A struct array is a record per element with named fields; a table is column-oriented with named variables, mixed types and row names, which is what you want for tabular flight data; a cell holds arbitrary heterogeneous contents and should be a last resort.',
      },
      {
        id: 'mat01_c10',
        front: 'What is synchronize on a timetable for?',
        back:
          'Aligning two time-stamped series onto a common time base with a chosen method (nearest, linear, previous), which is the MATLAB equivalent of pandas merge_asof for multi-rate telemetry.',
      },
      {
        id: 'mat01_c11',
        front: 'tiledlayout versus subplot',
        back:
          'tiledlayout manages spacing and shared labels, supports tight padding and lets you add tiles without recomputing indices. subplot still works but wastes space and needs manual position fiddling for publication figures.',
      },
      {
        id: 'mat01_c12',
        front: 'Is vectorising still necessary given the JIT?',
        back:
          'Less than it once was for simple loops, but yes for anything indexing-heavy or growing arrays, and vectorised code is usually clearer about the mathematics. Profile rather than assume, exactly as in Python.',
      },
    ],
    quiz: [
      {
        id: 'mat01_q1',
        q: 'A is 3x3. What does A.^2 compute?',
        choices: ['A*A', 'Each element squared', 'The matrix square root', 'An error'],
        answer: 1,
        explain:
          'The dot forms are element-wise. A^2 would be the matrix product, and for a rotation matrix the two answers look similarly plausible, which is why this bug survives review.',
        b: -0.6,
        bloom: 'recall',
      },
      {
        id: 'mat01_q2',
        q: 'Which selects rows 2 and 4, all columns, of matrix M?',
        choices: ['M(2,4,:)', 'M([2 4], :)', 'M(2:4)', 'M{2,4}'],
        answer: 1,
        explain:
          'A vector index selects multiple rows and the colon takes every column. M(2:4) is linear indexing over three elements and braces are for cell arrays.',
        b: -0.4,
        bloom: 'apply',
      },
      {
        id: 'mat01_q3',
        q: 'A script sets t = 0:0.01:10 and calls a function that references t. What happens?',
        choices: [
          'It works; scripts share their workspace with functions they call',
          'An error: t is undefined, because the function has its own workspace',
          't is empty',
          'MATLAB copies t automatically',
        ],
        answer: 1,
        explain:
          'Functions are scoped. Pass t as an argument; relying on globals is the alternative and it is discouraged for exactly this reason.',
        b: 0.2,
        bloom: 'understand',
      },
      {
        id: 'mat01_q4',
        q: 'Why prefer A\\b over inv(A)*b?',
        choices: [
          'Backslash is shorter to type',
          'It factorises and solves directly, which is faster and more accurate than forming an inverse',
          'inv does not exist in MATLAB',
          'Backslash works only for square systems',
        ],
        answer: 1,
        explain:
          'It also dispatches on the structure of A (triangular, symmetric, over-determined), which an explicit inverse cannot exploit.',
        b: 0.1,
        bloom: 'understand',
      },
      {
        id: 'mat01_q5',
        q: 'A handle-class object is passed to a function which modifies a property. What does the caller see?',
        choices: [
          'No change; MATLAB copies on call',
          'The modification, because handle objects are references',
          'An error',
          'A warning',
        ],
        answer: 1,
        explain:
          'Value classes copy, handle classes do not. Choosing the wrong one produces either surprising aliasing or surprising loss of updates.',
        b: 0.6,
        bloom: 'understand',
      },
      {
        id: 'mat01_q6',
        q: 'Your script takes 40 s. The profiler shows 90 percent in one line that grows an array. Best fix?',
        choices: [
          'Add parfor',
          'Preallocate the array to its final size, then index into it',
          'Convert to single precision',
          'Clear the workspace more often',
        ],
        answer: 1,
        explain:
          'Growing reallocates and copies on most iterations, which is quadratic. Preallocation makes it linear; vectorising removes the loop entirely.',
        b: 0.0,
        bloom: 'apply',
      },
      {
        id: 'mat01_q7',
        q: 'Which is the correct MATLAB analogue of pandas merge_asof for two multi-rate telemetry streams?',
        choices: [
          'join on a timestamp column',
          'synchronize on timetables with a nearest or previous method',
          'horzcat',
          'interp1 only',
        ],
        answer: 1,
        explain:
          'synchronize aligns timetables onto a common time base with an explicit interpolation or matching rule; interp1 is a piece of that, not the whole operation.',
        b: 0.7,
        bloom: 'apply',
      },
    ],
    tags: ['matlab'],
    importance: 1.1,
  },

  {
    id: 'cod_mat_02_gnc_toolboxes',
    track: 'coding',
    tier: 3,
    title: 'MATLAB for GNC: Control System and Aerospace Toolboxes',
    summary:
      "The toolboxes that make MATLAB worth learning for this career: LTI modelling, margins, LQR and discretisation from Control System Toolbox, plus frames, quaternion conventions and environment models from Aerospace Toolbox.",
    prereqs: ['cod_mat_01_core'],
    hours: 30,
    topics: [
      'tf, zpk, ss, frd; series, parallel, feedback, connect, sumblk',
      'step, impulse, lsim, initial, stepinfo',
      'bode, nyquist, nichols, margin, allmargin, sigma',
      'rlocus, pzmap, damp, pole, zero',
      'c2d and d2c with zoh, tustin and prewarp; c2dOptions',
      'ctrb, obsv, gram; place, acker; lqr, dlqr, lqi; kalman, lqg',
      'minreal, balred, modred for model reduction',
      'Control System Designer and PID Tuner; pidtune',
      'Gain scheduling across a flight envelope; arrays of LTI models',
      'Aerospace frames: ECI, ECEF, NED, ENU, body, wind, stability',
      'dcm2angle, angle2dcm, dcm2quat, quat2dcm, quatmultiply, quatrotate',
      'The scalar-first quaternion convention in MathWorks Aerospace products',
      'Atmosphere models: atmosisa, atmoscoesa (valid to 86 km), atmosnrlmsise00',
      'Gravity and magnetic models: gravitywgs84, gravitysphericalharmonic, wrldmagm',
      'Dryden and von Karman turbulence; wind shear',
      'Unit conversion helpers: convang, convvel, convforce, convmass, convlength',
      'satelliteScenario for orbits, access and ground tracks',
    ],
    objectives: [
      'Design a pitch-attitude autopilot meeting gain and phase margin requirements with a flexible mode present.',
      'Produce a gain-scheduled controller across five flight conditions and show the interpolation is sane.',
      'Convert a state between ECI, ECEF and NED and verify it against an independent Python implementation.',
      'Detect a scalar-first versus scalar-last quaternion mix-up within thirty seconds.',
      'Build an atmosphere and wind environment for an ascent simulation and state its validity limits.',
    ],
    resources: [
      {
        title: 'Control System Toolbox documentation',
        author: 'MathWorks',
        kind: 'docs',
        url: 'https://www.mathworks.com/help/control/',
        free: true,
      },
      {
        title: 'Control Design Onramp with Simulink',
        author: 'MathWorks',
        kind: 'course',
        url: 'https://matlabacademy.mathworks.com/details/control-design-onramp-with-simulink/controls',
        free: true,
      },
      {
        title: 'Feedback Systems: An Introduction for Scientists and Engineers, 2nd ed.',
        author: 'Karl J. Astrom and Richard M. Murray',
        kind: 'book',
        url: 'https://www.cds.caltech.edu/~murray/amwiki/index.php/Main_Page',
        free: true,
        note: 'Free PDF from Caltech CDS; the theory behind every command in this module.',
      },
      {
        title: 'Aircraft Control and Simulation, 3rd ed.',
        author: 'Brian L. Stevens, Frank L. Lewis, Eric N. Johnson',
        kind: 'book',
        free: false,
        note: 'The reference text behind most of the Aerospace Toolbox models.',
      },
    ],
    exercises: [
      {
        id: 'mat02_ex1',
        title: 'Margins, delay and a notch',
        prompt:
          'Build a rigid-body pitch plant with an integrator and a lightly damped flexible mode near 20 rad/s. Close a PD loop, report gain and phase margin with margin(), then add 40 ms of transport delay and report the margins again. Finally design a notch at the flexible frequency and show the phase margin recovered. Expected: the delay costs roughly omega_c times 0.04 radians of phase at crossover, and the notch restores margin without changing low-frequency response.',
        kind: 'code',
        lang: 'matlab',
        starter:
          's = tf("s");\nwn = 20; zeta = 0.01;\nP = 1/s^2 * (wn^2)/(s^2 + 2*zeta*wn*s + wn^2);\nC = 1;   % TODO: PD design\nL = C*P;\n% TODO: margin(L), add delay, design notch\n',
        solution:
          's = tf("s");\nwn = 20; zeta = 0.01;\nP = 1/s^2 * (wn^2)/(s^2 + 2*zeta*wn*s + wn^2);\n\nKp = 4; Kd = 2.5;\nC  = Kp + Kd*s/(1 + s/50);          % PD with a derivative roll-off filter\nL  = C*P;\n[Gm, Pm, ~, Wcp] = margin(L);\nfprintf("no delay : GM %.2f dB, PM %.1f deg at %.2f rad/s\\n", 20*log10(Gm), Pm, Wcp);\n\ntau = 0.040;\nLd  = L * exp(-tau*s);\n[Gm2, Pm2] = margin(Ld);\nfprintf("with %.0f ms delay: GM %.2f dB, PM %.1f deg (lost ~%.1f deg)\\n", ...\n        tau*1e3, 20*log10(Gm2), Pm2, rad2deg(Wcp*tau));\n\nzn = 0.02; zd = 0.5;                 % deep, wide-enough notch at wn\nN  = (s^2 + 2*zn*wn*s + wn^2) / (s^2 + 2*zd*wn*s + wn^2);\nLn = C*N*P*exp(-tau*s);\n[Gm3, Pm3] = margin(Ln);\nfprintf("notched  : GM %.2f dB, PM %.1f deg\\n", 20*log10(Gm3), Pm3);\n\nbode(L, Ld, Ln); grid on;\nlegend("nominal", "with delay", "notched + delay");\n',
        hours: 4,
      },
      {
        id: 'mat02_ex2',
        title: 'Frames and the quaternion convention trap',
        prompt:
          'Take a position in geodetic latitude, longitude and altitude, convert to ECEF with lla2ecef, then to NED about a reference point, and back, reporting the round-trip error in metres. Then build a quaternion with angle2quat for a 30 degree yaw, print it, and print what SciPy Rotation.as_quat() would give for the same rotation. State which element moves and how you would detect the mistake in a code review. Expected: round-trip error below 1e-6 m, and the MathWorks quaternion is [0.9659 0 0 0.2588] while the SciPy ordering places the 0.9659 last.',
        kind: 'code',
        lang: 'matlab',
        starter:
          'lla_ref = [28.5729, -80.6490, 3.0];   % Cape Canaveral\nlla_pt  = [28.6629, -80.5470, 2003.0];\n% TODO: lla2ecef both points, rotate the difference with dcmecef2ned, round trip\nq = angle2quat(deg2rad(30), 0, 0);\ndisp(q)\n',
        solution:
          '% Reference point (launch site) and a target point to the north-east and above.\nlla_ref = [28.5729, -80.6490, 3.0];          % deg, deg, m\nlla_pt  = [28.6629, -80.5470, 2003.0];\n\nxyz_ref = lla2ecef(lla_ref);\nxyz_pt  = lla2ecef(lla_pt);\n\nC = dcmecef2ned(lla_ref(1), lla_ref(2));     % 3x3 ECEF to NED\nd_ecef = transpose(xyz_pt - xyz_ref);        % column vector\nned = C * d_ecef;\nfprintf("NED offset: %.1f %.1f %.1f m\\n", ned);\n\nback = xyz_ref + transpose(transpose(C) * ned);\nfprintf("round trip error: %.3e m\\n", norm(back - xyz_pt));\n\nq = angle2quat(deg2rad(30), 0, 0);           % MathWorks order: [w x y z]\nfprintf("MathWorks (w x y z): %.4f %.4f %.4f %.4f\\n", q);\nfprintf("SciPy as_quat (x y z w): %.4f %.4f %.4f %.4f\\n", q(2), q(3), q(4), q(1));\n\n% Review test: for a small rotation the scalar part is near 1. If the element\n% near 1 sits at index 4 rather than index 1, the convention has been flipped.\n',
        hours: 3,
      },
    ],
    cards: [
      {
        id: 'mat02_c1',
        front: 'What do gain margin and phase margin mean physically?',
        back:
          'Gain margin is how much the open-loop gain can grow before the closed loop goes unstable; phase margin is how much extra phase lag it can tolerate. For a launch vehicle, 6 dB and 30 degrees are typical minima because aerodynamics, actuators and flexible modes are all uncertain.',
      },
      {
        id: 'mat02_c2',
        front: 'How much phase does a transport delay cost?',
        back:
          'Minus omega times T radians, with no change in gain. At a 10 rad/s crossover a 40 ms delay costs 0.4 rad, about 23 degrees, straight off the phase margin.',
        formula: true,
      },
      {
        id: 'mat02_c3',
        front: 'c2d with zoh versus tustin',
        back:
          'zoh models a sample-and-hold exactly, which is what a digital controller driving an actuator does. tustin is a bilinear map that preserves frequency-response shape better and can be prewarped to match at a chosen frequency. Pick zoh for plants, tustin for filters and controllers.',
      },
      {
        id: 'mat02_c4',
        front: 'Why do launch vehicles need gain scheduling?',
        back:
          'Dynamic pressure, mass, centre of gravity and aerodynamic moments change by orders of magnitude between lift-off and MECO, so a single fixed gain set cannot hold margins across the trajectory. Gains are scheduled on a measurable variable such as Mach or time from lift-off.',
      },
      {
        id: 'mat02_c5',
        front: 'What is a non-minimum-phase zero and why does a flexible booster have one?',
        back:
          'A zero in the right half plane, which adds phase lag while increasing gain and puts a hard limit on achievable bandwidth. Sensor placement relative to a flexible mode node can invert the initial response, producing exactly this.',
      },
      {
        id: 'mat02_c6',
        front: 'When is a state-space model mandatory over a transfer function?',
        back:
          'MIMO systems, internal state constraints, observers and LQR/LQG design, and anything where you need controllability or observability. Transfer functions are convenient for SISO loop shaping and hide internal modes, including unstable cancellations.',
      },
      {
        id: 'mat02_c7',
        front: 'What does stepinfo give you?',
        back:
          'Rise time, settling time, overshoot, undershoot, peak and peak time from a step response, in one struct. It is how you turn a plot into a requirement check you can assert in a test.',
      },
      {
        id: 'mat02_c8',
        front: 'Which quaternion convention do MathWorks Aerospace products use?',
        back:
          'Scalar first: [w x y z]. SciPy spatial.transform.Rotation is scalar last. Passing one to the other without reordering silently produces a wrong rotation of the right magnitude.',
      },
      {
        id: 'mat02_c9',
        front: 'COESA atmosphere: what is its validity limit?',
        back:
          'Up to 86 km geopotential altitude. Above that use NRLMSISE-00 or a Jacchia-class model, since COESA simply has no data there and will extrapolate nonsense.',
      },
      {
        id: 'mat02_c10',
        front: 'Why is NED a local frame, and what does that imply?',
        back:
          'Its axes are defined relative to the local vertical and the local meridian, so they rotate as you move over the Earth. A trajectory spanning hundreds of kilometres cannot use a single NED frame; integrate in ECI or ECEF and convert for reporting.',
      },
      {
        id: 'mat02_c11',
        front: 'ECI versus ECEF: what is the difference and what does it cost you to ignore?',
        back:
          'ECI is non-rotating (inertial) and ECEF rotates with the Earth at about 7.292e-5 rad/s. Integrating dynamics in ECEF without Coriolis and centrifugal terms, or comparing states across the two without the rotation, gives errors that grow with time and latitude.',
        formula: true,
      },
      {
        id: 'mat02_c12',
        front: 'What is Dryden turbulence used for?',
        back:
          'A shaped-noise model of atmospheric turbulence with power spectra matched to measured data, driven by altitude and airspeed. It is how an ascent or flight simulation gets realistic wind disturbance rather than a step gust.',
      },
      {
        id: 'mat02_c13',
        front: 'lqr: what are you actually choosing when you pick Q and R?',
        back:
          'The relative price of state error versus control effort. Larger Q entries buy tighter regulation of those states at the cost of more actuator activity; larger R entries buy quieter actuators and slower response. It is a design dial, not a tuning accident.',
        formula: true,
      },
    ],
    quiz: [
      {
        id: 'mat02_q1',
        q: 'A 40 ms transport delay is added to a loop with crossover at 12 rad/s. Approximately how much phase margin is lost?',
        choices: ['About 5 degrees', 'About 27 degrees', 'About 90 degrees', 'None; delay affects only gain'],
        answer: 1,
        explain:
          'Phase lag is omega times T = 12 times 0.04 = 0.48 rad, which is about 27.5 degrees. Delay has unit magnitude, so gain margin is unaffected at that frequency.',
        b: 0.7,
        bloom: 'apply',
      },
      {
        id: 'mat02_q2',
        q: 'Which MATLAB call returns rise time, overshoot and settling time as a struct?',
        choices: ['margin(L)', 'stepinfo(step(T))', 'damp(T)', 'allmargin(L)'],
        answer: 1,
        explain:
          'stepinfo summarises a step response into requirement-checkable numbers. margin and allmargin are frequency-domain, damp reports pole damping and frequency.',
        b: 0.1,
        bloom: 'recall',
      },
      {
        id: 'mat02_q3',
        q: 'You receive a quaternion [0.0 0.0 0.0 1.0] from a MATLAB Aerospace function. What rotation is it?',
        choices: [
          'Identity',
          'A 180 degree rotation about z, since MathWorks is scalar-first so w = 0',
          'A 90 degree rotation about z',
          'Invalid',
        ],
        answer: 1,
        explain:
          'Scalar-first means the first element is w. A zero scalar part is a half-turn; if you expected identity you were reading SciPy ordering.',
        b: 0.8,
        bloom: 'analyze',
      },
      {
        id: 'mat02_q4',
        q: 'Above 86 km, which atmosphere model is appropriate?',
        choices: ['atmoscoesa', 'atmosisa', 'atmosnrlmsise00', 'A constant-density assumption'],
        answer: 2,
        explain:
          'COESA and ISA are defined only to 86 km and 20 km respectively. NRLMSISE-00 covers the thermosphere and includes solar and geomagnetic drivers, which matter for drag.',
        b: 0.6,
        bloom: 'recall',
      },
      {
        id: 'mat02_q5',
        q: 'Why schedule gains on dynamic pressure or Mach rather than time?',
        choices: [
          'Time is harder to measure',
          'Because the plant dynamics depend on the flight condition, and a dispersed trajectory reaches a given condition at a different time',
          'Scheduling on time is not supported',
          'Dynamic pressure is constant',
        ],
        answer: 1,
        explain:
          'In a Monte Carlo the vehicle can be seconds early or late. Scheduling on the physical driver keeps the gains matched to the plant the controller actually sees.',
        b: 0.9,
        bloom: 'analyze',
      },
      {
        id: 'mat02_q6',
        q: 'Which statement about ECEF integration is correct?',
        choices: [
          'ECEF is inertial, so Newton second law applies directly',
          'ECEF rotates, so dynamics integrated there need Coriolis and centrifugal terms',
          'ECEF and ECI differ only by a translation',
          'ECEF axes point at fixed stars',
        ],
        answer: 1,
        explain:
          'The Earth rotation rate is about 7.292e-5 rad/s. Omitting the rotating-frame terms produces a slowly growing, latitude-dependent error that is easy to mistake for a model deficiency.',
        b: 0.8,
        bloom: 'understand',
      },
      {
        id: 'mat02_q7',
        q: 'A 3 dB gain margin on a launch-vehicle loop means:',
        choices: [
          'The loop gain can grow by a factor of about 1.41 before instability, which is thin for an uncertain plant',
          'The loop tolerates 3 degrees of extra phase',
          'The response overshoots by 3 percent',
          'The bandwidth is 3 rad/s',
        ],
        answer: 0,
        explain:
          '3 dB is a factor of about 1.41 in gain. Given aerodynamic, mass-property and actuator uncertainty, typical requirements sit at 6 dB or more.',
        b: 0.5,
        bloom: 'understand',
      },
    ],
    tags: ['matlab', 'gnc'],
    importance: 1.15,
  },

  /* ══ SIMULINK ════════════════════════════════════════════════════════════ */
  {
    id: 'cod_slk_01_models',
    track: 'coding',
    tier: 4,
    title: 'Simulink: Block Diagrams and First Models',
    summary:
      "Model-based design is the highest-leverage differentiator in this track: most self-taught candidates have Python, very few have real Simulink depth. Start by building models whose answers you can check analytically.",
    prereqs: ['cod_mat_02_gnc_toolboxes'],
    hours: 20,
    topics: [
      'The Simulink Editor, Library Browser and block search',
      'Signals and lines; Constant, Gain, Sum, Product, Integrator',
      'Why the Derivative block is a trap in a feedback loop',
      'Transfer Fcn and State-Space blocks',
      'Sources: Step, Ramp, Sine Wave, Clock, Signal Editor',
      'Sinks: Scope, Display, To Workspace; the Simulation Data Inspector',
      'Mux versus Bus Creator, and never using Mux for dissimilar signals',
      'Selector and Demux',
      'Nonlinear blocks: Saturation, Rate Limiter, Dead Zone, Quantizer, Switch, Relay, MinMax',
      'Lookup Table (n-D) for aerodynamic and engine data',
      'MATLAB Function block (code-generation-compatible subset) versus Interpreted MATLAB Function',
      'Model parameters in the base workspace versus mask parameters',
      'The Diagnostic Viewer and reading a model error',
      'Comparing a model result to an analytic solution as the first habit',
    ],
    objectives: [
      'Finish Simulink Onramp.',
      'Build a mass-spring-damper and a first-order lag from primitive blocks and match the analytic solution to 1e-6.',
      'Explain why a Derivative block degrades a feedback loop and what to use instead.',
      'State the difference between Mux and Bus Creator in terms of what the signal actually is.',
      'List MATLAB constructs that cannot appear in a MATLAB Function block destined for code generation.',
    ],
    resources: [
      {
        title: 'Simulink Onramp',
        author: 'MathWorks',
        kind: 'course',
        url: 'https://matlabacademy.mathworks.com/details/simulink-onramp/simulink',
        free: true,
        note: 'About two hours, free, self-assessing. Do it before touching anything else in Simulink.',
      },
      {
        title: 'Simulink Documentation: Getting Started',
        author: 'MathWorks',
        kind: 'docs',
        url: 'https://www.mathworks.com/help/simulink/getting-started-with-simulink.html',
        free: true,
      },
      {
        title: 'Model-Based Design with Simulink',
        author: 'MathWorks',
        kind: 'docs',
        url: 'https://www.mathworks.com/solutions/model-based-design.html',
        free: true,
      },
    ],
    exercises: [
      {
        id: 'slk01_ex1',
        title: 'Mass-spring-damper against the analytic solution',
        prompt:
          'Build a second-order mass-spring-damper with two Integrator blocks, a Gain for stiffness and a Gain for damping, driven by a unit step. Use m = 1, c = 0.4, k = 4. Log the output with To Workspace, then in MATLAB compute the analytic step response of the same transfer function and report the maximum absolute difference. Expected: with a tight solver tolerance the difference is below 1e-6, the damped natural frequency is about 1.99 rad/s, and the first peak is about 1.73.',
        kind: 'code',
        lang: 'simulink',
        starter:
          '% Build the model by hand in the editor, then verify here.\nm = 1; c = 0.4; k = 4;\n% TODO: run the model, load yout, compare against step(tf(1, [m c k]))\n',
        solution:
          'm = 1; c = 0.4; k = 4;\n\n% Reference: analytic/numerical step response of the same plant.\nG = tf(1, [m c k]);\n\nmdl = "msd";                  % model built from two Integrators + two Gains\nset_param(mdl, "Solver", "ode45", "RelTol", "1e-10", "AbsTol", "1e-12", ...\n               "StopTime", "20");\nout = sim(mdl);\n\nt  = out.yout{1}.Values.Time;\ny  = out.yout{1}.Values.Data;\nyr = step(G, t) * (1/k) * k;   % unit step into 1/(ms^2+cs+k)\n\nfprintf("max |model - analytic| = %.3e\\n", max(abs(y - yr)));\nfprintf("wd = %.4f rad/s, first peak = %.4f\\n", ...\n        sqrt(k/m)*sqrt(1 - (c/(2*sqrt(k*m)))^2), max(y)*k);\n\n% If the difference is much larger than 1e-6, the solver tolerance is the first\n% suspect, not the model.\n',
        hours: 3,
      },
      {
        id: 'slk01_ex2',
        title: 'Mux versus Bus, demonstrated',
        prompt:
          'Build two subsystems with the same three inputs (altitude in metres, Mach dimensionless, and a mode enumeration), one wired with a Mux and one with a Bus Creator using a Simulink.Bus object. Rename one source signal and show what happens in each case. Write a paragraph on why Mux is acceptable for a same-type vector and wrong for a dissimilar signal group. Expected: the Bus version keeps names and types and fails loudly on a mismatch; the Mux version silently concatenates into an unnamed vector.',
        kind: 'analysis',
        hours: 2,
      },
    ],
    cards: [
      {
        id: 'slk01_c1',
        front: 'Why avoid the Derivative block in a feedback loop?',
        back:
          'It differentiates numerically, amplifying high-frequency noise and behaving badly under variable-step solvers and at discontinuities. Use a filtered derivative, a state available from the model, or a state-space formulation instead.',
      },
      {
        id: 'slk01_c2',
        front: 'Mux versus Bus Creator',
        back:
          'Mux makes a plain vector, so all elements must share a type and the names are gone. A Bus is a structured signal with named, individually typed elements that becomes a C struct in generated code. Use Bus for anything heterogeneous.',
      },
      {
        id: 'slk01_c3',
        front: 'What does a To Workspace block give you that a Scope does not?',
        back:
          'Data in the MATLAB workspace that you can compare against an analytic result, assert on in a test, and save as a baseline. A Scope is for looking; To Workspace (or the Data Inspector) is for verifying.',
      },
      {
        id: 'slk01_c4',
        front: 'MATLAB Function block versus Interpreted MATLAB Function',
        back:
          'The MATLAB Function block supports the code-generation subset and compiles, so it can be deployed. The Interpreted block calls back into MATLAB at each step, which is slower and cannot be code-generated at all.',
      },
      {
        id: 'slk01_c5',
        front: 'Name three MATLAB constructs that cannot go in a codegen-bound MATLAB Function block',
        back:
          'Variable-size data without an upper bound, cell arrays or structs whose fields change at runtime, dynamic field names and eval, and calls to functions with no code-generation support such as many plotting and file functions.',
      },
      {
        id: 'slk01_c6',
        front: 'Where do model parameters live, and why does it matter?',
        back:
          'In the base workspace, a model workspace, a mask, or a data dictionary. Base-workspace parameters are convenient and invisible in the model file, so a model can silently depend on whatever a colleague ran first; dictionaries and mask parameters make the dependency explicit.',
      },
      {
        id: 'slk01_c7',
        front: 'What is a Lookup Table (n-D) used for in aerospace models?',
        back:
          'Aerodynamic coefficients and engine data as functions of Mach, angle of attack and control deflection. Interpolation method and extrapolation behaviour at the table edges are design decisions with real consequences at the envelope boundary.',
      },
      {
        id: 'slk01_c8',
        front: 'Why is comparing a model to an analytic solution the first habit to build?',
        back:
          'Because a Simulink model always produces a plot, and a plot always looks plausible. An independent reference, even for a simplified case, is the only cheap way to know the diagram means what you think it means.',
      },
      {
        id: 'slk01_c9',
        front: 'Saturation and Rate Limiter: why model them early?',
        back:
          'Actuators always saturate in position and rate, and nearly every surprising closed-loop behaviour in a real vehicle involves one of them, including integrator windup and limit cycles. A linear-only model hides the problem you will be asked about.',
      },
      {
        id: 'slk01_c10',
        front: 'What does the Simulation Data Inspector add over a Scope?',
        back:
          'Persisted runs you can compare against each other and against a baseline, with tolerances, plus synchronised cursors and export. It is the tool that turns a run into evidence.',
      },
      {
        id: 'slk01_c11',
        front: 'Integrator block: which settings matter most?',
        back:
          'Initial condition (and whether it is an external input), saturation limits with the anti-windup behaviour, and state name for logging and for linearisation. Getting the initial condition wrong is the single most common cause of a model that will not trim.',
      },
      {
        id: 'slk01_c12',
        front: 'Why do teams keep models small and referenced rather than one big diagram?',
        back:
          'A flat model cannot be reviewed, diffed, tested or built incrementally, and two engineers cannot work on it at once. Model reference gives separate compilation and checked interfaces, which is the same argument as splitting a C++ program into translation units.',
      },
    ],
    quiz: [
      {
        id: 'slk01_q1',
        q: 'Why does adding a Derivative block inside a control loop often hurt?',
        choices: [
          'It cannot be simulated',
          'It amplifies high-frequency noise and interacts badly with variable-step solvers and discontinuities',
          'It requires the Aerospace Blockset',
          'It only works with fixed-step solvers',
        ],
        answer: 1,
        explain:
          'Ideal differentiation has unbounded high-frequency gain. Use a filtered derivative or a measured rate state.',
        b: 0.3,
        bloom: 'understand',
      },
      {
        id: 'slk01_q2',
        q: 'Three signals of different types must go to a subsystem as one line. Which block?',
        choices: ['Mux', 'Bus Creator with a Simulink.Bus object', 'Demux', 'Selector'],
        answer: 1,
        explain:
          'A Bus keeps names and per-element types and becomes a struct in generated code. Mux would force a common type and discard the names.',
        b: 0.2,
        bloom: 'apply',
      },
      {
        id: 'slk01_q3',
        q: 'Your model result differs from the analytic solution by 1e-3. What is the first thing to check?',
        choices: [
          'The block diagram wiring',
          'The solver and its tolerances',
          'The MATLAB version',
          'The Scope settings',
        ],
        answer: 1,
        explain:
          'Default tolerances are loose relative to 1e-6 verification work. Tighten RelTol and AbsTol first; if the difference persists, then suspect the diagram.',
        b: 0.5,
        bloom: 'apply',
      },
      {
        id: 'slk01_q4',
        q: 'Which cannot appear in a MATLAB Function block intended for code generation?',
        choices: [
          'A for loop with a fixed bound',
          'A fixed-size matrix multiply',
          'A call to plot()',
          'An if/else on an input',
        ],
        answer: 2,
        explain:
          'Plotting has no code-generation support. The others are all in the supported subset.',
        b: 0.3,
        bloom: 'recall',
      },
      {
        id: 'slk01_q5',
        q: 'A model works on your machine and fails on a colleague machine with an undefined parameter. Most likely cause?',
        choices: [
          'A licensing issue',
          'The model depends on base-workspace variables set by a script nobody else ran',
          'A solver mismatch',
          'A Simulink version difference',
        ],
        answer: 1,
        explain:
          'Base-workspace dependence is invisible in the model file. Move parameters into a model workspace or a data dictionary that ships with the model.',
        b: 0.6,
        bloom: 'analyze',
      },
      {
        id: 'slk01_q6',
        q: 'Which pair of blocks should be in the very first nonlinear model you build of an actuator?',
        choices: [
          'Saturation and Rate Limiter',
          'Derivative and Transport Delay',
          'Quantizer and Relay',
          'Mux and Demux',
        ],
        answer: 0,
        explain:
          'Position and rate limits are the two nonlinearities every real actuator has, and they drive windup and limit-cycle behaviour that a linear model cannot show.',
        b: 0.4,
        bloom: 'apply',
      },
    ],
    tags: ['simulink', 'gnc'],
    importance: 1.1,
  },

  {
    id: 'cod_slk_02_solvers',
    track: 'coding',
    tier: 6,
    title: 'Simulink Solvers, Sample Times and Numerical Correctness',
    summary:
      "The defining tradeoff in Simulink and a standard interview question: variable-step solvers give error control and zero-crossing detection, fixed-step solvers give the determinism that flight code requires.",
    prereqs: ['cod_slk_01_models', 'cod_py_07_integration'],
    hours: 20,
    topics: [
      'Variable-step versus fixed-step: error control and zero-crossing detection versus determinism',
      'Continuous solvers: ode45 (Dormand-Prince, the default starting point), ode23, ode113',
      'Stiff solvers: ode15s, ode23s, ode23t, ode23tb; daessc',
      'Fixed-step solvers: ode1 (Euler), ode2, ode4 (classic RK4), ode5, ode8, ode14x, ode1be',
      'RelTol and AbsTol; max step size and when to constrain it',
      'Solver reset method Fast versus Robust',
      'Zero-crossing detection: how it works, chattering, adaptive versus non-adaptive, the consecutive-crossing limit',
      'Fixed-step zero-crossing for real-time: bounded, deterministic event cost',
      'Sample times: continuous, discrete, inherited, constant; colour coding',
      'Multirate models and Rate Transition blocks; data integrity versus determinism options',
      'Algebraic loops: what creates them, the Algebraic Constraint block, breaking them with a unit delay and its phase cost',
      'The Solver Profiler',
      'The golden rule for deployable models: fixed-step, cleanly multirate, no algebraic loops',
    ],
    objectives: [
      'Demonstrate the same model diverging under ode1 and converging under ode4.',
      'Find the largest fixed step that keeps a 50 Hz control loop stable and explain the limit.',
      'Diagnose and break an algebraic loop, and quantify the phase cost of the unit delay you inserted.',
      'Explain why a variable-step model cannot be deployed to an embedded target.',
      'Recognise stiffness from solver behaviour in Simulink and choose an implicit solver.',
    ],
    resources: [
      {
        title: 'Simulink documentation: Choose a Solver',
        author: 'MathWorks',
        kind: 'docs',
        url: 'https://www.mathworks.com/help/simulink/ug/choose-a-solver.html',
        free: true,
      },
      {
        title: 'Simulink documentation: Zero-Crossing Detection',
        author: 'MathWorks',
        kind: 'docs',
        url: 'https://www.mathworks.com/help/simulink/ug/zero-crossing-detection.html',
        free: true,
      },
      {
        title: 'Simulink documentation: Algebraic Loops',
        author: 'MathWorks',
        kind: 'docs',
        url: 'https://www.mathworks.com/help/simulink/ug/algebraic-loops.html',
        free: true,
      },
    ],
    exercises: [
      {
        id: 'slk02_ex1',
        title: 'Find the stability limit of a fixed step',
        prompt:
          'Take a linear plant with a fastest eigenvalue at 200 rad/s and a discrete controller at 50 Hz. Sweep the fixed-step size from 0.02 s down to 0.0005 s with ode1 and then with ode4, recording for each whether the response converges, and plot the boundary. Expected: ode1 needs a far smaller step than ode4 for the same accuracy, and the ode1 boundary sits near the explicit-Euler stability limit of h times the fastest eigenvalue magnitude being about 2.',
        kind: 'code',
        lang: 'simulink',
        starter:
          'mdl = "fixedstep_demo";\nsteps = [0.02 0.01 0.005 0.002 0.001 0.0005];\nfor s = ["ode1" "ode4"]\n    for h = steps\n        % TODO: set_param solver and FixedStep, sim, record max|y|\n    end\nend\n',
        solution:
          'mdl = "fixedstep_demo";\nsteps = [0.02 0.01 0.005 0.002 0.001 0.0005];\nresult = strings(0);\n\nfor s = ["ode1" "ode4"]\n    for h = steps\n        set_param(mdl, "SolverType", "Fixed-step", "Solver", s, ...\n                       "FixedStep", num2str(h), "StopTime", "5");\n        out = sim(mdl);\n        y = out.yout{1}.Values.Data;\n        ok = all(isfinite(y)) && max(abs(y)) < 10;\n        result(end+1) = sprintf("%s h=%.4f -> %s", s, h, string(ok)); %#ok<SAGROW>\n    end\nend\ndisp(result);\n\n% Explicit Euler is stable only while |h * lambda| is roughly below 2, so a\n% 200 rad/s eigenvalue needs h below about 0.01 s just to be stable, and far\n% smaller to be accurate. ode4 has a larger stability region and fourth-order\n% accuracy, so it tolerates a much larger step at the same error.\n',
        hours: 3,
      },
      {
        id: 'slk02_ex2',
        title: 'Break an algebraic loop and pay for it',
        prompt:
          'Construct a model with a direct-feedthrough path from a subsystem output back to its own input so Simulink reports an algebraic loop. Fix it three ways: restructure so one path has a state, insert a Unit Delay, and use an Algebraic Constraint block. For the Unit Delay fix at a 100 Hz rate, quantify the added phase lag at the loop crossover frequency and state whether the margin requirement still holds. Expected: a unit delay at rate Ts adds approximately omega times Ts of phase lag, so at 20 rad/s and 100 Hz that is about 11.5 degrees.',
        kind: 'analysis',
        hours: 3,
      },
    ],
    cards: [
      {
        id: 'slk02_c1',
        front: 'Variable-step versus fixed-step: the defining difference',
        back:
          'Variable-step solvers adapt the step to keep an error estimate within tolerance and can locate zero crossings exactly. Fixed-step solvers take a constant step with no error control and no exact event location, but with deterministic, bounded per-step cost.',
      },
      {
        id: 'slk02_c2',
        front: 'Why can a variable-step model not be deployed to an embedded target?',
        back:
          'Because the number of steps and hence the execution time depends on the data, so no worst-case timing bound exists. Real-time execution needs a constant per-cycle budget, which is what fixed-step gives.',
      },
      {
        id: 'slk02_c3',
        front: 'What is zero-crossing detection and why does Saturation need it?',
        back:
          'The solver watches sign changes of designated functions and shortens the step to land on the crossing. For a Saturation block the crossing is the moment the input reaches the limit; without it the solver steps over the corner and smears a discontinuity into the solution.',
      },
      {
        id: 'slk02_c4',
        front: 'What is chattering in zero-crossing terms?',
        back:
          'Repeated crossings in a tiny interval, which drives the step towards zero and stalls the simulation. Simulink caps consecutive crossings and offers an adaptive algorithm; the real fix is usually hysteresis or a small deadband in the model.',
      },
      {
        id: 'slk02_c5',
        front: 'Solver reset method Fast versus Robust',
        back:
          'On a solver reset (for example after a zero crossing), Robust recomputes the Jacobian and related quantities, which is slower but more reliable; Fast reuses them. Start with Robust when a model with events behaves strangely.',
      },
      {
        id: 'slk02_c6',
        front: 'What is an algebraic loop?',
        back:
          'A feedback path in which a block output depends on its own input within the same time step, because every block on the loop has direct feedthrough. Simulink must solve an implicit equation at each step, which is slow, may not converge, and cannot be code-generated cleanly.',
      },
      {
        id: 'slk02_c7',
        front: 'Three ways to break an algebraic loop, and their costs',
        back:
          'Restructure so one path has a state (best, free); insert a Unit Delay (easy, costs about omega times Ts of phase at frequency omega); or use an Algebraic Constraint block with a solver (keeps the mathematics exact, keeps the iteration cost).',
      },
      {
        id: 'slk02_c8',
        front: 'What does a Rate Transition block do?',
        back:
          'Transfers a signal between blocks at different sample rates, with options trading data integrity (no torn values) against determinism (predictable latency). In a deployed model these choices become real buffering code.',
      },
      {
        id: 'slk02_c9',
        front: 'A model slows 100x after adding a fast actuator. Diagnose.',
        back:
          'The new dynamics are much faster than the rest, making the system stiff, so an explicit solver is limited by stability rather than accuracy and takes tiny steps. Switch to an implicit solver such as ode15s, or simplify the actuator if its fast mode does not matter.',
      },
      {
        id: 'slk02_c10',
        front: 'Inherited sample time (-1): what does it mean?',
        back:
          'The block takes the rate of its driving signal, which lets a subsystem be reused at several rates. It also makes the actual rate non-local, so sample-time colour coding and the model display are how you check what you actually got.',
      },
      {
        id: 'slk02_c11',
        front: 'What does the Solver Profiler tell you?',
        back:
          'Where steps were rejected, which zero crossings fired, which states drove the step size and where the solver reset. It converts a vague model-is-slow complaint into a specific block.',
      },
      {
        id: 'slk02_c12',
        front: 'The golden rule for a model destined for flight code',
        back:
          'Fixed-step, discrete, single-rate or cleanly multirate through rate transitions, with no algebraic loops and no continuous states left in the deployed path. Anything else either will not generate code or will not meet a timing budget.',
      },
    ],
    quiz: [
      {
        id: 'slk02_q1',
        q: 'Which is the defining capability a fixed-step solver lacks?',
        choices: [
          'Support for discrete blocks',
          'Error control and exact zero-crossing location',
          'The ability to simulate nonlinear systems',
          'Support for multirate models',
        ],
        answer: 1,
        explain:
          'It takes a constant step regardless of local error and cannot shorten a step to land on an event, which is exactly what buys it deterministic timing.',
        b: 0.3,
        bloom: 'recall',
      },
      {
        id: 'slk02_q2',
        q: 'Your model runs 100 times slower after adding a fast actuator model. The most likely cause is:',
        choices: [
          'Too many Scope blocks',
          'The system became stiff and the explicit solver is step-limited by stability',
          'A missing Rate Transition',
          'The model needs more memory',
        ],
        answer: 1,
        explain:
          'The classic stiffness signature. Try ode15s, or ask whether the fast actuator pole needs to be in this model at all.',
        b: 0.6,
        bloom: 'analyze',
      },
      {
        id: 'slk02_q3',
        q: 'What does zero-crossing detection mean for a Saturation block?',
        choices: [
          'It detects when the output is zero',
          'It detects when the input reaches a limit, so the solver lands exactly on the corner instead of stepping over it',
          'It disables the block',
          'It rounds the output to zero',
        ],
        answer: 1,
        explain:
          'The discontinuity is in the derivative at the limit. Landing on it keeps the integration accurate and avoids a smeared, solver-dependent answer.',
        b: 0.7,
        bloom: 'understand',
      },
      {
        id: 'slk02_q4',
        q: 'You break an algebraic loop with a Unit Delay at 100 Hz. At a 20 rad/s crossover, roughly how much phase do you lose?',
        choices: ['About 1 degree', 'About 11 degrees', 'About 45 degrees', 'None'],
        answer: 1,
        explain:
          'A one-sample delay contributes about omega times Ts radians: 20 times 0.01 = 0.2 rad, about 11.5 degrees. That must be checked against the margin requirement, not assumed free.',
        b: 0.9,
        bloom: 'apply',
      },
      {
        id: 'slk02_q5',
        q: 'Which model configuration can be deployed to a flight target?',
        choices: [
          'Variable-step ode45 with zero-crossing detection',
          'Fixed-step ode4 with continuous states in the control path',
          'Fixed-step, discrete, cleanly multirate with rate transitions and no algebraic loops',
          'Variable-step ode15s with an Algebraic Constraint block',
        ],
        answer: 2,
        explain:
          'Deployment requires deterministic, bounded per-cycle execution. Continuous states, variable steps and implicit constraint solving all violate that.',
        b: 0.5,
        bloom: 'apply',
      },
      {
        id: 'slk02_q6',
        q: 'A simulation stalls with the step size shrinking towards zero near a relay. What is happening and what is the real fix?',
        choices: [
          'Stiffness; switch to ode15s',
          'Zero-crossing chattering; add hysteresis or a deadband to the switching logic',
          'A licence timeout',
          'Too tight an AbsTol on an unrelated state',
        ],
        answer: 1,
        explain:
          'Repeated crossings in a shrinking interval is the chattering signature. Raising the crossing limit is a workaround; hysteresis fixes the model.',
        b: 1.0,
        bloom: 'analyze',
      },
      {
        id: 'slk02_q7',
        q: 'Explicit Euler (ode1) on a system whose fastest eigenvalue is 200 rad/s. Roughly what step is the stability boundary?',
        choices: ['0.1 s', '0.01 s', '0.001 s', 'Any step is stable'],
        answer: 1,
        explain:
          'The explicit-Euler stability condition is roughly h times the eigenvalue magnitude below 2, giving h below about 0.01 s, and accuracy needs considerably less than that.',
        b: 1.1,
        bloom: 'apply',
      },
    ],
    tags: ['simulink', 'gnc'],
    importance: 1.2,
  },

  {
    id: 'cod_slk_03_architecture',
    track: 'coding',
    tier: 7,
    title: 'Simulink Architecture and Stateflow',
    summary:
      "How a 300-block flat model becomes six referenced models with bus interfaces, a data dictionary and a Stateflow mode manager: the structure that lets a team work on one vehicle model without colliding.",
    prereqs: ['cod_slk_02_solvers'],
    hours: 25,
    topics: [
      'Virtual versus atomic subsystems: execution ordering and code-generation consequences',
      'Enabled, triggered and function-call subsystems; If and Switch Case action subsystems; For Each',
      'Masking: parameters, icons, callbacks, self-documenting blocks',
      'Simulink.Bus objects as interface contracts; Bus Creator, Selector, Assignment; nested buses',
      'Virtual versus non-virtual buses, and why non-virtual buses become C structs',
      'Model reference: separate compilation, incremental build, interface checking, accelerator modes',
      'convertToModelReference and the objects it generates',
      'Variant subsystems, variant models and variant source/sink for flight versus test builds',
      'Data dictionaries (.sldd) versus the base workspace; per-subsystem dictionaries',
      'Simulink.Parameter, Simulink.Signal and storage classes',
      'Libraries and linked blocks; Simulink Projects under source control',
      'Stateflow: states, hierarchy, transitions, junctions, default transitions',
      'entry, during and exit actions; condition actions versus transition actions',
      'Parallel (AND) versus exclusive (OR) decomposition',
      'Temporal logic: after, before, every, at, duration',
      'Events versus conditions, and why flight teams often ban events',
      'Transition evaluation order and guaranteeing mutual exclusivity',
      'A launch-vehicle mode sequencer and FDIR/safe-mode logic',
    ],
    objectives: [
      'Refactor a flat model into referenced models with bus-object interfaces and show a build-time improvement.',
      'Explain one observable behavioural difference between a virtual and an atomic subsystem.',
      'Build a vehicle mode manager and prove every transition is reachable and every exit condition mutually exclusive.',
      'Choose between a variant subsystem and an if-block for a configuration difference and justify it.',
      'Explain why non-virtual buses matter once code generation is in the picture.',
    ],
    resources: [
      {
        title: 'Stateflow Onramp',
        author: 'MathWorks',
        kind: 'course',
        url: 'https://matlabacademy.mathworks.com/details/stateflow-onramp/stateflow',
        free: true,
      },
      {
        title: 'Simulink documentation: Model Reference',
        author: 'MathWorks',
        kind: 'docs',
        url: 'https://www.mathworks.com/help/simulink/model-reference.html',
        free: true,
      },
      {
        title: 'MathWorks: Best Practices for Modeling Large Systems',
        author: 'MathWorks',
        kind: 'docs',
        url: 'https://www.mathworks.com/help/simulink/ug/modeling-large-systems.html',
        free: true,
      },
    ],
    exercises: [
      {
        id: 'slk03_ex1',
        title: 'Refactor flat to referenced',
        prompt:
          'Take a 300-block flat vehicle model and split it into six referenced models (environment, aerodynamics, propulsion, dynamics, sensors, GNC) with Simulink.Bus objects defining every interface and a single .sldd holding the parameters. Record the full-build and incremental-build times before and after and the simulation results before and after. Expected: identical results to within solver tolerance, and an incremental build after touching one component that is several times faster than the original full rebuild.',
        kind: 'build',
        hours: 6,
      },
      {
        id: 'slk03_ex2',
        title: 'Launch-vehicle mode sequencer in Stateflow',
        prompt:
          'Build a Stateflow chart with the states PRELAUNCH, LIFTOFF, PITCHOVER, GRAVITY_TURN, MECO, STAGE_SEP, COAST, ENTRY_BURN and LANDING_BURN, plus a parallel ABORT supervisor. Use conditions rather than events, add temporal logic where a minimum dwell time is required, and prove two properties: every state is reachable from PRELAUNCH, and no state has two simultaneously true outgoing transition conditions. Expected: a coverage run reaching 100 percent state and transition coverage, plus a written argument for mutual exclusivity of each transition set.',
        kind: 'build',
        hours: 6,
      },
    ],
    cards: [
      {
        id: 'slk03_c1',
        front: 'Virtual versus atomic subsystem: what actually differs?',
        back:
          'A virtual subsystem is only a drawing convention; its blocks are scheduled as if they were at the top level. An atomic subsystem executes as a unit, which changes execution order, permits its own sample time and function-call semantics, and produces a separate function in generated code.',
      },
      {
        id: 'slk03_c2',
        front: 'Why do non-virtual buses matter for code generation?',
        back:
          'A non-virtual bus becomes an actual C struct with a defined layout, so it can cross a function boundary, be logged, or be shared with hand-written code. A virtual bus exists only in the diagram and disappears in the generated code.',
      },
      {
        id: 'slk03_c3',
        front: 'What does model reference buy a team?',
        back:
          'Separate compilation and incremental rebuild, checked interfaces at the boundary, the ability for several engineers to own different files, and reuse of the same component in several models. It is the Simulink equivalent of splitting a program into libraries.',
      },
      {
        id: 'slk03_c4',
        front: 'When do you choose a variant subsystem over an if inside a MATLAB Function block?',
        back:
          'When the difference is a build-time configuration rather than a run-time decision: flight versus test sensors, a stubbed versus a full environment. Variants can compile only the active choice, so the inactive code never reaches the target.',
      },
      {
        id: 'slk03_c5',
        front: 'Data dictionary versus base workspace',
        back:
          'A dictionary is a versioned file that travels with the model and can be scoped per component, so the model dependency is explicit and reviewable. Base-workspace variables are invisible, unversioned and order-dependent.',
      },
      {
        id: 'slk03_c6',
        front: 'Parallel versus exclusive states, with a spacecraft example',
        back:
          'Exclusive (OR): the vehicle is in exactly one flight phase at a time. Parallel (AND): a thermal supervisor, a power supervisor and a fault monitor all run simultaneously alongside the phase machine.',
      },
      {
        id: 'slk03_c7',
        front: 'Why do many flight teams ban Stateflow events in favour of conditions?',
        back:
          'Events introduce implicit, order-dependent control flow that is hard to review, hard to cover and hard to reason about under code generation. Condition-based transitions evaluated each step are deterministic and readable.',
      },
      {
        id: 'slk03_c8',
        front: 'How do you guarantee two transitions out of one state cannot both fire?',
        back:
          'Make the guard conditions provably mutually exclusive (for example partitioning on a single variable), or make the priority explicit and document it. Relying on the implicit evaluation order is how a reviewed chart still surprises you.',
      },
      {
        id: 'slk03_c9',
        front: 'entry, during and exit actions',
        back:
          'entry runs once when the state becomes active, during runs on each step while it remains active, exit runs once on leaving. Putting a latch or a command in the wrong one is a common source of one-cycle glitches.',
      },
      {
        id: 'slk03_c10',
        front: 'What is temporal logic in Stateflow good for?',
        back:
          'Expressing minimum dwell times, debounce and timeouts directly (after, before, every, duration) instead of hand-rolled counters, which are a classic source of off-by-one and reset bugs.',
      },
      {
        id: 'slk03_c11',
        front: 'What is FDIR and why is Stateflow the usual home for it?',
        back:
          'Fault detection, isolation and recovery: recognise an anomaly, determine which component is responsible, and command a safe configuration. It is inherently mode logic with hierarchy and parallelism, which is exactly what a chart expresses.',
      },
      {
        id: 'slk03_c12',
        front: 'What does a mask give a subsystem?',
        back:
          'A parameter dialog, an icon and documentation, so the block is self-describing and its parameters are scoped to it rather than to the base workspace. It is how a reusable component stops needing a wiki page.',
      },
      {
        id: 'slk03_c13',
        front: 'Why is a 300-block flat model a problem beyond aesthetics?',
        back:
          'It cannot be diffed or merged, so two engineers cannot work on it; it rebuilds entirely on every change; its interfaces are implicit, so a signal change ripples silently; and it cannot be unit tested component by component.',
      },
    ],
    quiz: [
      {
        id: 'slk03_q1',
        q: 'Which is an observable difference between a virtual and an atomic subsystem?',
        choices: [
          'Only atomic subsystems can contain blocks',
          'An atomic subsystem executes as a unit, so its block execution order relative to the rest of the model changes and it becomes a separate function in generated code',
          'Virtual subsystems cannot be masked',
          'Atomic subsystems cannot have inputs',
        ],
        answer: 1,
        explain:
          'Atomicity is about scheduling and code structure. Virtual subsystems are flattened before execution.',
        b: 0.7,
        bloom: 'understand',
      },
      {
        id: 'slk03_q2',
        q: 'Why use Simulink.Bus objects at component interfaces?',
        choices: [
          'They make the model run faster',
          'They are a checked interface contract: a mismatch in name, type or dimension is an error rather than a silent rewiring, and they become structs in generated code',
          'They are required by ode45',
          'They enable variable-step solvers',
        ],
        answer: 1,
        explain:
          'The same argument as a header file in C++: the interface is declared once and both sides are checked against it.',
        b: 0.5,
        bloom: 'understand',
      },
      {
        id: 'slk03_q3',
        q: 'A configuration difference between the flight build and the bench build should be modelled as:',
        choices: [
          'A variant subsystem or variant model',
          'A Switch block driven by a constant',
          'Two separate copies of the whole model',
          'A comment',
        ],
        answer: 0,
        explain:
          'Variants keep one model with one set of interfaces, and only the active choice is built, so bench-only code cannot reach the flight target.',
        b: 0.6,
        bloom: 'apply',
      },
      {
        id: 'slk03_q4',
        q: 'In a mode sequencer, two outgoing transitions from GRAVITY_TURN can both be true at one step. What is the defect?',
        choices: [
          'Nothing; Stateflow picks by priority',
          'The guards are not mutually exclusive, so behaviour depends on an implicit ordering that a reviewer cannot see',
          'The chart needs parallel decomposition',
          'The sample time is wrong',
        ],
        answer: 1,
        explain:
          'Relying on evaluation order is legal but unreviewable. Make the guards disjoint, or make the priority explicit and justified.',
        b: 0.8,
        bloom: 'analyze',
      },
      {
        id: 'slk03_q5',
        q: 'Which action runs exactly once when a state becomes active?',
        choices: ['during', 'entry', 'exit', 'on after'],
        answer: 1,
        explain:
          'entry fires on activation, during fires every step while active, exit fires on deactivation.',
        b: -0.2,
        bloom: 'recall',
      },
      {
        id: 'slk03_q6',
        q: 'A team bans Stateflow events in flight charts. The strongest reason is:',
        choices: [
          'Events are not supported by Embedded Coder',
          'Event broadcasts create implicit, order-dependent control flow that is hard to review, cover and reason about deterministically',
          'Events cost more CPU',
          'Events cannot be logged',
        ],
        answer: 1,
        explain:
          'Determinism and reviewability. Events do generate code; the objection is to the reasoning burden they create.',
        b: 0.9,
        bloom: 'understand',
      },
      {
        id: 'slk03_q7',
        q: 'What is the primary build-time benefit of model reference?',
        choices: [
          'Smaller model files',
          'Incremental rebuild: unchanged referenced models are not recompiled',
          'Faster solvers',
          'Automatic bus creation',
        ],
        answer: 1,
        explain:
          'Separate compilation is the point. It also gives interface checking and lets several engineers own different files.',
        b: 0.4,
        bloom: 'recall',
      },
    ],
    tags: ['simulink', 'gnc'],
    importance: 1.15,
  },

  {
    id: 'cod_slk_04_codegen',
    track: 'coding',
    tier: 8,
    title: 'Verification and Embedded Coder: Models to Flight Code',
    summary:
      "The end of the model-based design chain: MIL, SIL, PIL and HIL, structural coverage including MC/DC, requirements traceability, and Embedded Coder turning a controller model into C that a flight application can call.",
    prereqs: ['cod_slk_03_architecture', 'cod_cpp_03_raii'],
    hours: 25,
    topics: [
      'The MIL to SIL to PIL to HIL progression and what each step proves',
      'Simulink Test: harnesses, test sequences, assessments, baseline and equivalence tests, headless CI runs',
      'Simulink Coverage: decision, condition, MC/DC, lookup-table, signal-range and relational-boundary coverage',
      'Interpreting missing coverage as a missing test or as dead logic',
      'Requirements Toolbox: authoring, linking to blocks and tests, traceability matrices, change tracking',
      'Model Advisor with MAB and JMAAB guidelines and the high-integrity check packs',
      'Polyspace Bug Finder and Code Prover: proving absence of run-time errors without test cases',
      'Simulink Coder versus Embedded Coder; the ert.tlc system target file',
      'Hardware implementation settings: word sizes, endianness, target CPU',
      'Solver constraints for code generation: fixed-step, discrete, no algebraic loops',
      'Storage classes and the data interface: ExportedGlobal, ImportedExtern, Volatile, custom classes',
      'Code mappings: step, initialize and terminate entry points; reusable and reentrant code',
      'Tunable versus inlined parameters; Fixed-Point Designer for MCU targets',
      'Code replacement libraries for vendor intrinsics',
      'Traceability: generated C comments and the HTML report linking back to blocks',
      'Code metrics: RAM, ROM and stack; the Code Profile Analyzer',
      'SIL and PIL as Model block simulation modes; equivalence testing against the model',
      'Integrating generated code with a hand-written C++ application',
      'S-functions and the Legacy Code Tool for wrapping existing C',
      'DO Qualification Kit and what qualifying a tool means',
      'Real-time targets and HIL: Speedgoat, dSPACE, OPAL-RT; RCP versus HIL; fault injection',
    ],
    objectives: [
      'Generate ERT code from a controller model and find the line corresponding to a specific gain block.',
      'Run SIL and demonstrate equivalence between the generated code and the model.',
      'Integrate a generated step function into a hand-written C++ main loop with a real scheduler.',
      'Achieve 100 percent MC/DC on a Stateflow mode manager and explain what it proves.',
      'Explain what a hardware-in-the-loop rig catches that simulation cannot.',
    ],
    resources: [
      {
        title: 'Embedded Coder documentation',
        author: 'MathWorks',
        kind: 'docs',
        url: 'https://www.mathworks.com/help/ecoder/',
        free: true,
      },
      {
        title: 'Simulink Coverage documentation: types of model coverage',
        author: 'MathWorks',
        kind: 'docs',
        url: 'https://www.mathworks.com/help/slcoverage/',
        free: true,
      },
      {
        title: 'DO-178C and Model-Based Design',
        author: 'MathWorks',
        kind: 'docs',
        url: 'https://www.mathworks.com/solutions/aerospace-defense/standards/do-178.html',
        free: true,
        note: 'Also see the DO Qualification Kit product pages for what tool qualification actually covers.',
      },
    ],
    exercises: [
      {
        id: 'slk04_ex1',
        title: 'Model to C to a C++ main loop',
        prompt:
          'Generate ERT code from a discrete PID controller model with tunable gains. Open the generated .c, identify the statement corresponding to the proportional gain block and the struct that holds the tunable parameters, then write a C++ main that calls model_initialize once and model_step at a fixed 100 Hz from a steady_clock-driven loop, feeding a simulated plant. Expected: the C++ loop output matches the Simulink simulation of the same input to within 1e-9, and you can name the exact generated symbol for the gain.',
        kind: 'code',
        lang: 'cpp',
        starter:
          '// After generating code into pid_ert_rtw/\n#include "pid.h"\n#include <chrono>\n#include <cstdio>\n#include <thread>\n\nint main() {\n    pid_initialize();\n    // TODO: 100 Hz loop calling pid_step(), feeding a plant, logging\n    pid_terminate();\n    return 0;\n}\n',
        solution:
          '#include "pid.h"\n#include <chrono>\n#include <cstdio>\n#include <thread>\n\n// Generated interface (names depend on the code mappings you configured):\n//   ExtU_pid_T  pid_U;   inputs\n//   ExtY_pid_T  pid_Y;   outputs\n//   P_pid_T     pid_P;   tunable parameters, e.g. pid_P.Kp_Gain\n\nint main() {\n    using clock = std::chrono::steady_clock;\n    constexpr auto period = std::chrono::milliseconds(10);   // 100 Hz\n\n    pid_initialize();\n\n    double plant = 0.0;                 // trivial first-order plant\n    auto next = clock::now();\n    for (int k = 0; k < 1000; ++k) {\n        pid_U.ref  = 1.0;\n        pid_U.meas = plant;\n\n        pid_step();                      // one control cycle of generated code\n\n        const double u = pid_Y.u;\n        plant += 0.01 * (-2.0 * plant + u);   // Euler at the same 10 ms rate\n        std::printf("%d %.9f %.9f\\n", k, u, plant);\n\n        next += period;\n        std::this_thread::sleep_until(next);\n    }\n\n    pid_terminate();\n    return 0;\n}\n\n// The proportional gain appears in pid_step() as a multiplication by\n// pid_P.Kp_Gain (tunable) or by a literal (if the parameter was inlined),\n// with a traceability comment naming the originating block path.\n',
        hours: 6,
      },
      {
        id: 'slk04_ex2',
        title: 'MC/DC on a mode manager',
        prompt:
          'Run Simulink Coverage on the Stateflow mode sequencer from the architecture module. Reach 100 percent decision coverage first, record the MC/DC percentage at that point, then add the tests needed to reach 100 percent MC/DC. For every condition that required a new test, state which independent effect it demonstrates. Expected finding: full decision coverage typically leaves MC/DC well short, because a compound guard can be fully decided without showing each condition independently affects the outcome.',
        kind: 'analysis',
        hours: 5,
      },
    ],
    cards: [
      {
        id: 'slk04_c1',
        front: 'MIL, SIL, PIL, HIL: what does each prove?',
        back:
          'MIL: the model behaves as specified. SIL: the generated code, compiled on the host, matches the model. PIL: the code behaves correctly when cross-compiled and run on the target processor, including its arithmetic and timing. HIL: the real controller hardware behaves correctly against a simulated plant over real interfaces.',
      },
      {
        id: 'slk04_c2',
        front: 'What does MC/DC require beyond decision coverage?',
        back:
          'That each condition in a decision has been shown to independently affect the outcome, holding the others fixed. Decision coverage only needs the decision to have been both true and false, which a single condition can achieve on its own.',
      },
      {
        id: 'slk04_c3',
        front: 'You have 100 percent decision coverage and 70 percent MC/DC. What does that tell you?',
        back:
          'That compound guards are being exercised only in ways that do not isolate each condition, so a bug in an unexercised condition could hide. Either add the independence-demonstrating cases, or the condition is redundant and the logic should be simplified.',
      },
      {
        id: 'slk04_c4',
        front: 'Name three model constructs that block ERT code generation',
        back:
          'Continuous states with a variable-step solver; algebraic loops; and blocks with no code-generation support such as the Interpreted MATLAB Function, scopes with certain settings, and unbounded variable-size signals.',
      },
      {
        id: 'slk04_c5',
        front: 'What is the difference between SIL and PIL, and what does each catch?',
        back:
          'SIL compiles the generated code for the host, catching code-generation and algorithm mismatches. PIL cross-compiles and runs on the actual target, catching target-specific integer width, endianness, floating-point behaviour and execution-time issues that the host cannot show.',
      },
      {
        id: 'slk04_c6',
        front: 'How does generated code satisfy a DO-178C traceability objective?',
        back:
          'Every generated statement carries a comment naming the originating block, and the HTML code-generation report links code to model to requirement, so a reviewer can trace requirement to model element to source line to test.',
      },
      {
        id: 'slk04_c7',
        front: 'What is a storage class, in code-generation terms?',
        back:
          'A declaration of how a model signal or parameter appears in the generated C: a local, an exported global, a volatile, an imported extern supplied by hand-written code, or a member of a custom structure. It is the interface contract between generated and hand-written code.',
      },
      {
        id: 'slk04_c8',
        front: 'Tunable versus inlined parameters',
        back:
          'A tunable parameter becomes a variable in a parameter struct that can be changed at run time (and via external mode); an inlined one becomes a literal the compiler can fold. Tunability costs RAM and prevents constant folding, so it is a deliberate choice per parameter.',
      },
      {
        id: 'slk04_c9',
        front: 'What does Polyspace Code Prover prove that testing cannot?',
        back:
          'By abstract interpretation it proves that whole classes of run-time error, such as overflow, division by zero and out-of-bounds access, cannot occur on any execution path with any input, rather than demonstrating their absence on the paths you tested.',
      },
      {
        id: 'slk04_c10',
        front: 'RCP versus HIL in one line each',
        back:
          'Rapid control prototyping: a real-time computer runs your controller against real or simulated hardware, so you can iterate on the control law early. Hardware-in-the-loop: the real controller hardware runs against a simulated plant, so you can verify the shipped unit without the full vehicle.',
      },
      {
        id: 'slk04_c11',
        front: 'Your HIL rig shows a 4 ms delay that SIL did not. Where does it come from?',
        back:
          'The real interfaces: bus arbitration and framing on CAN or 1553, driver and DMA buffering, task scheduling and rate-transition latency, and analogue conversion time. None of those exist in a host simulation, which is why HIL is not optional.',
      },
      {
        id: 'slk04_c12',
        front: 'What is the realistic architecture of flight software built this way?',
        back:
          'Generated control-law code from the model, integrated with a hand-written scheduler, I/O drivers, middleware and fault management. Model-based design owns the algorithm; humans own the infrastructure.',
      },
      {
        id: 'slk04_c13',
        front: 'What does tool qualification mean, and why does it matter?',
        back:
          'Under DO-330 and DO-178C, if you rely on a tool to replace or reduce a verification activity, you must show the tool does its job correctly. A qualification kit supplies the evidence so that, for example, Embedded Coder output does not have to be re-verified from scratch.',
      },
      {
        id: 'slk04_c14',
        front: 'Why run Simulink Test headless in CI?',
        back:
          'So that every model change is exercised against its harnesses, coverage and baselines automatically, exactly like a C++ unit-test suite. It needs a runner that can reach a licence server, which is the usual reason such jobs run on self-hosted runners.',
      },
    ],
    quiz: [
      {
        id: 'slk04_q1',
        q: 'Which step in the MIL-SIL-PIL-HIL chain first catches a target-specific integer width problem?',
        choices: ['MIL', 'SIL', 'PIL', 'HIL'],
        answer: 2,
        explain:
          'PIL runs the cross-compiled code on the actual processor, so target word sizes, endianness and floating-point behaviour appear there. SIL runs on the host and would not show it.',
        b: 0.8,
        bloom: 'apply',
      },
      {
        id: 'slk04_q2',
        q: 'A decision is (a AND b). Tests give a=1,b=1 and a=0,b=0. What coverage is achieved?',
        choices: [
          'Full decision and full MC/DC',
          'Full decision coverage, but not MC/DC, since neither condition was shown to independently change the outcome',
          'Neither',
          'Full MC/DC only',
        ],
        answer: 1,
        explain:
          'The decision took both values, but you need a=1,b=0 and a=0,b=1 pairs to demonstrate independent effect. This is exactly the gap DO-178C Level A closes with MC/DC.',
        b: 1.1,
        bloom: 'analyze',
      },
      {
        id: 'slk04_q3',
        q: 'Which model configuration prevents Embedded Coder from generating code?',
        choices: [
          'A fixed-step discrete model with rate transitions',
          'A model containing an algebraic loop',
          'A model using non-virtual buses',
          'A model with tunable parameters',
        ],
        answer: 1,
        explain:
          'An algebraic loop needs an implicit solve each step, which has no deterministic generated-code form. The others are all normal for deployable models.',
        b: 0.6,
        bloom: 'apply',
      },
      {
        id: 'slk04_q4',
        q: 'What makes a generated gain appear as pid_P.Kp_Gain rather than a numeric literal?',
        choices: [
          'The solver setting',
          'Declaring the parameter tunable rather than inlined',
          'Using a non-virtual bus',
          'Enabling coverage',
        ],
        answer: 1,
        explain:
          'Tunable parameters are emitted into a parameter structure so they can be changed at run time; inlined ones are folded into the code as constants.',
        b: 0.7,
        bloom: 'understand',
      },
      {
        id: 'slk04_q5',
        q: 'Your HIL test shows a 4 ms latency that SIL did not. The most likely source is:',
        choices: [
          'A different compiler optimisation level',
          'Real I/O: bus framing, driver buffering and task scheduling that host simulation does not model',
          'A floating-point rounding difference',
          'A wrong gain value',
        ],
        answer: 1,
        explain:
          'Interface and scheduling latency exists only when real hardware and buses are in the loop. That is precisely the class of defect HIL is there to find.',
        b: 0.9,
        bloom: 'analyze',
      },
      {
        id: 'slk04_q6',
        q: 'What is the realistic division of labour when flight software uses generated code?',
        choices: [
          'Everything is generated from models',
          'Generated control-law code integrated with hand-written scheduler, drivers, middleware and fault management',
          'Everything is hand-written and models are only for analysis',
          'Generated code replaces the operating system',
        ],
        answer: 1,
        explain:
          'Model-based design excels at algorithms with heavy verification requirements; infrastructure remains hand-written and separately verified.',
        b: 0.4,
        bloom: 'understand',
      },
      {
        id: 'slk04_q7',
        q: 'What does a traceability matrix in Requirements Toolbox give an auditor?',
        choices: [
          'Proof the software is correct',
          'A bidirectional map from requirements to model elements to tests, showing nothing is unimplemented and nothing is untested',
          'Runtime performance data',
          'Code coverage numbers',
        ],
        answer: 1,
        explain:
          'Traceability answers completeness questions: every requirement is implemented and verified, and every model element exists because of a requirement.',
        b: 0.5,
        bloom: 'understand',
      },
      {
        id: 'slk04_q8',
        q: 'Why is HIL still required when SIL and PIL both pass?',
        choices: [
          'Because tools are unreliable',
          'Because hardware testing exercises real timing, interfaces, power and fault behaviour that no simulation of the plant can fully represent',
          'Because PIL cannot run control laws',
          'It is not; PIL supersedes HIL',
        ],
        answer: 1,
        explain:
          'Each level closes a different gap. HIL also validates the simulation itself by comparing against hardware behaviour.',
        b: 0.6,
        bloom: 'understand',
      },
    ],
    tags: ['simulink', 'gnc', 'realtime'],
    importance: 1.2,
  },

  /* ══ RUST ════════════════════════════════════════════════════════════════ */
  {
    id: 'cod_rs_01_basics',
    track: 'coding',
    tier: 5,
    title: 'Rust Fundamentals and Cargo',
    summary:
      "Rust is not a SpaceX hiring gate today and should never displace C++ hours. Learn it because sum types, exhaustive matching and a compiler-enforced aliasing model will make your C++ answers sharper, and because a small number of space startups do use it.",
    prereqs: ['cod_cpp_02_memory'],
    hours: 25,
    topics: [
      'rustup, toolchains, editions; cargo new, build, run, test, doc, clippy, fmt',
      'Cargo.toml, dev and release profiles, workspaces, semver and feature flags',
      'Variables, mut, shadowing; scalar and compound types',
      'Integer overflow: panics in debug, wraps in release; checked, wrapping and saturating operations',
      'String versus &str',
      'Control flow; loop, while let, for',
      'Pattern matching and match exhaustiveness',
      'struct, enum as real sum types, impl blocks',
      'Modules, pub, paths, use',
      'Slices and arrays; Vec, HashMap, BTreeMap',
      'Option and Result, the absence of null, and the ? operator',
      'Iterators and adapters and their zero-cost nature',
      'Closures: Fn, FnMut, FnOnce',
      'derive macros; cfg attributes; doc tests',
      'clippy as a teaching tool',
    ],
    objectives: [
      'Work through the Book chapters 1 to 13 and the matching Rustlings exercises.',
      'Port the Python unit-conversion library to Rust with tests and documentation.',
      'Explain what Option replaces and which defect class it eliminates.',
      'Describe integer-overflow behaviour in debug versus release and choose the right operation for flight code.',
      'Use match exhaustiveness to make an unhandled vehicle mode a compile error.',
    ],
    resources: [
      {
        title: 'The Rust Programming Language (The Book)',
        author: 'Steve Klabnik and Carol Nichols',
        kind: 'book',
        url: 'https://doc.rust-lang.org/book/',
        free: true,
        note: 'Free, official, and kept current with the language editions.',
      },
      {
        title: 'Rustlings',
        author: 'Rust community',
        kind: 'course',
        url: 'https://github.com/rust-lang/rustlings',
        free: true,
        note: 'Small compiler-driven exercises. Pair with the Book chapter by chapter.',
      },
      {
        title: 'Programming Rust, 2nd ed.',
        author: 'Jim Blandy, Jason Orendorff, Leonora Tindall',
        kind: 'book',
        free: false,
      },
      {
        title: 'Rust by Example',
        author: 'Rust project',
        kind: 'docs',
        url: 'https://doc.rust-lang.org/rust-by-example/',
        free: true,
      },
    ],
    exercises: [
      {
        id: 'rs01_ex1',
        title: 'Unit conversions with Result',
        prompt:
          'Write a module with ft_to_m, lbf_to_n, deg_to_rad and rankine_to_kelvin, plus a parse_and_convert(s: &str) -> Result<f64, ConvError> that accepts strings like "12.5 ft" and returns metres, with a ConvError enum distinguishing a bad number from an unknown unit. Include unit tests. Expected output when run on "12.5 ft": 3.81; on "10 xyz": an UnknownUnit error naming xyz.',
        kind: 'code',
        lang: 'rust',
        starter:
          'pub const FT_TO_M: f64 = 0.3048;\npub const LBF_TO_N: f64 = 4.448_221_615_260_5;\n\n#[derive(Debug, PartialEq)]\npub enum ConvError {\n    BadNumber(String),\n    UnknownUnit(String),\n}\n\npub fn parse_and_convert(s: &str) -> Result<f64, ConvError> {\n    todo!()\n}\n',
        solution:
          'pub const FT_TO_M: f64 = 0.3048;\npub const LBF_TO_N: f64 = 4.448_221_615_260_5;\n\n#[derive(Debug, PartialEq)]\npub enum ConvError {\n    BadNumber(String),\n    UnknownUnit(String),\n}\n\npub fn ft_to_m(ft: f64) -> f64 { ft * FT_TO_M }\npub fn lbf_to_n(lbf: f64) -> f64 { lbf * LBF_TO_N }\npub fn deg_to_rad(d: f64) -> f64 { d * std::f64::consts::PI / 180.0 }\npub fn rankine_to_kelvin(r: f64) -> f64 { r * 5.0 / 9.0 }\n\npub fn parse_and_convert(s: &str) -> Result<f64, ConvError> {\n    let mut parts = s.split_whitespace();\n    let value = parts.next().unwrap_or("");\n    let unit = parts.next().unwrap_or("");\n    let v: f64 = value\n        .parse()\n        .map_err(|_| ConvError::BadNumber(value.to_string()))?;\n    match unit {\n        "ft" => Ok(ft_to_m(v)),\n        "m" => Ok(v),\n        "lbf" => Ok(lbf_to_n(v)),\n        "deg" => Ok(deg_to_rad(v)),\n        "R" => Ok(rankine_to_kelvin(v)),\n        other => Err(ConvError::UnknownUnit(other.to_string())),\n    }\n}\n\n#[cfg(test)]\nmod tests {\n    use super::*;\n\n    #[test]\n    fn feet_convert_exactly() {\n        assert!((parse_and_convert("12.5 ft").unwrap() - 3.81).abs() < 1e-12);\n    }\n\n    #[test]\n    fn unknown_unit_is_reported() {\n        assert_eq!(\n            parse_and_convert("10 xyz"),\n            Err(ConvError::UnknownUnit("xyz".to_string()))\n        );\n    }\n\n    #[test]\n    fn bad_number_is_reported() {\n        assert!(matches!(parse_and_convert("abc ft"), Err(ConvError::BadNumber(_))));\n    }\n}\n',
        hours: 3,
      },
      {
        id: 'rs01_ex2',
        title: 'Exhaustive mode handling',
        prompt:
          'Define an enum FlightMode with nine variants covering prelaunch through landing burn, and a function guidance_gain(mode: FlightMode) -> f64 that matches on it with no wildcard arm. Add a tenth variant and show the compiler error that results. Write one paragraph comparing this with a C++ enum plus switch, including what -Wswitch does and does not guarantee. Expected: adding a variant produces a non-exhaustive-patterns error naming the missing variant.',
        kind: 'code',
        lang: 'rust',
        starter:
          '#[derive(Debug, Clone, Copy, PartialEq)]\npub enum FlightMode {\n    Prelaunch,\n    Liftoff,\n    // ...\n}\n\npub fn guidance_gain(mode: FlightMode) -> f64 {\n    todo!()\n}\n',
        solution:
          '#[derive(Debug, Clone, Copy, PartialEq)]\npub enum FlightMode {\n    Prelaunch,\n    Liftoff,\n    PitchOver,\n    GravityTurn,\n    Meco,\n    StageSep,\n    Coast,\n    EntryBurn,\n    LandingBurn,\n}\n\n// No wildcard arm: adding a variant is a compile error, not a silent default.\npub fn guidance_gain(mode: FlightMode) -> f64 {\n    match mode {\n        FlightMode::Prelaunch => 0.0,\n        FlightMode::Liftoff => 0.8,\n        FlightMode::PitchOver => 1.2,\n        FlightMode::GravityTurn => 1.0,\n        FlightMode::Meco => 0.4,\n        FlightMode::StageSep => 0.0,\n        FlightMode::Coast => 0.2,\n        FlightMode::EntryBurn => 1.4,\n        FlightMode::LandingBurn => 1.6,\n    }\n}\n\n// Adding FlightMode::Abort yields:\n//   error[E0004]: non-exhaustive patterns: `FlightMode::Abort` not covered\n//\n// C++ gives a -Wswitch warning for a missing enumerator in a switch over an\n// enum, but only when there is no default label, and it is a warning unless\n// the build uses -Werror. Rust makes it an error unconditionally.\n',
        hours: 2,
      },
    ],
    cards: [
      {
        id: 'rs01_c1',
        front: 'What does Option<T> replace and what does it eliminate?',
        back:
          'Null, sentinel values and uninitialised out-parameters. Because the absence is in the type, the compiler forces you to handle it, which removes the null-dereference class of defect rather than merely documenting it.',
      },
      {
        id: 'rs01_c2',
        front: 'Integer overflow in Rust: debug versus release',
        back:
          'Debug builds panic on overflow; release builds wrap by default. Flight code should not rely on either: use checked_, wrapping_ or saturating_ operations so the intent is explicit and identical in both profiles.',
      },
      {
        id: 'rs01_c3',
        front: 'What does the ? operator do?',
        back:
          'On a Result it returns the Ok value or returns early with the error converted via From; on an Option it returns the value or returns None. It makes error propagation one character instead of a block, without hiding it.',
      },
      {
        id: 'rs01_c4',
        front: 'Why is match exhaustiveness a safety feature?',
        back:
          'Adding a variant to an enum breaks every match that does not handle it, so a new vehicle mode cannot silently fall into a default branch. It turns a code-review responsibility into a compiler responsibility.',
      },
      {
        id: 'rs01_c5',
        front: 'String versus &str',
        back:
          'String owns a growable heap buffer; &str is a borrowed view of UTF-8 bytes. Function parameters should take &str so both a literal and an owned String work, which is the same reasoning as std::string_view in C++.',
      },
      {
        id: 'rs01_c6',
        front: 'Are Rust iterators actually zero cost?',
        back:
          'In practice yes: adapter chains monomorphise and inline into the same loop a hand-written version would produce, often with bounds checks eliminated. Verify with a benchmark or Compiler Explorer rather than taking it on faith.',
      },
      {
        id: 'rs01_c7',
        front: 'Fn, FnMut, FnOnce',
        back:
          'Three closure traits by how they capture: Fn borrows immutably and can be called repeatedly, FnMut borrows mutably, FnOnce consumes the captures and can be called once. The compiler infers the most permissive one that works.',
      },
      {
        id: 'rs01_c8',
        front: 'What does cargo clippy add over the compiler?',
        back:
          'Several hundred lints about idiom, correctness and performance, from needless clones to suspicious comparisons. For a learner it is the fastest feedback loop from writing C++-flavoured Rust to writing Rust.',
      },
      {
        id: 'rs01_c9',
        front: 'What is a Rust enum that a C++ enum is not?',
        back:
          'A tagged union: each variant can carry data of a different type, and the compiler enforces that you check the tag before touching the payload. It is std::variant with pattern matching and exhaustiveness built into the language.',
      },
      {
        id: 'rs01_c10',
        front: 'What is a doc test?',
        back:
          'A code example in a documentation comment that cargo test compiles and runs. It makes the documentation executable, so an example cannot silently rot as the API changes.',
      },
      {
        id: 'rs01_c11',
        front: 'What does Cargo do that make does not?',
        back:
          'Dependency resolution with semantic versioning and a lockfile, a standard project layout, integrated test, bench, doc and lint commands, and reproducible builds from a single manifest. It is package manager and build system in one.',
      },
      {
        id: 'rs01_c12',
        front: 'Why does Rust have no function overloading?',
        back:
          'To keep type inference and error messages tractable. Traits and generics cover most of what overloading would provide, and builder or option structs cover the rest, which is why Rust APIs look different from C++ ones.',
      },
    ],
    quiz: [
      {
        id: 'rs01_q1',
        q: 'What happens on `let x: u8 = 250; let y = x + 10;` in a release build?',
        choices: [
          'Compile error',
          'Panic at runtime',
          'Wraps to 4',
          'Promotes to u16',
        ],
        answer: 2,
        explain:
          'Release builds wrap by default while debug builds panic. Flight code should use checked_add or wrapping_add so the behaviour is explicit and identical in both.',
        b: 0.7,
        bloom: 'apply',
      },
      {
        id: 'rs01_q2',
        q: 'Which is the main safety benefit of Option<T> over a null pointer?',
        choices: [
          'It is faster',
          'The compiler forces the absence case to be handled before the value can be used',
          'It uses less memory',
          'It prevents integer overflow',
        ],
        answer: 1,
        explain:
          'Option is often the same size as a pointer thanks to niche optimisation, so the win is not memory: it is that the check cannot be forgotten.',
        b: 0.1,
        bloom: 'understand',
      },
      {
        id: 'rs01_q3',
        q: 'You add a tenth variant to an enum used in a match with no wildcard. What happens?',
        choices: [
          'A warning',
          'A compile error naming the uncovered variant',
          'The new variant silently takes the first arm',
          'Undefined behaviour',
        ],
        answer: 1,
        explain:
          'Non-exhaustive patterns is a hard error. This is the property that makes Rust enums attractive for mode logic.',
        b: 0.2,
        bloom: 'recall',
      },
      {
        id: 'rs01_q4',
        q: 'Which signature is the idiomatic way to accept a read-only string?',
        choices: ['fn f(s: String)', 'fn f(s: &str)', 'fn f(s: &String)', 'fn f(s: *const u8)'],
        answer: 1,
        explain:
          '&str accepts literals, slices and borrowed Strings alike. Taking String forces the caller to give up ownership; &String is strictly less general than &str.',
        b: 0.3,
        bloom: 'apply',
      },
      {
        id: 'rs01_q5',
        q: 'What is the honest positioning of Rust for a SpaceX application today?',
        choices: [
          'Required for flight software roles',
          'Accepted in at least one Starlink embedded posting alongside C, C++, Go and Python, but not a hiring gate and not on the vehicle flight-software path',
          'Banned',
          'Used for all new Starship flight control',
        ],
        answer: 1,
        explain:
          'The only verifiable evidence is a Starlink Embedded Software Engineer posting listing Rust among several acceptable languages. Claims that Starship flight control was rewritten in Rust have no primary source.',
        b: 0.5,
        bloom: 'recall',
      },
      {
        id: 'rs01_q6',
        q: 'Why do Rust iterator chains usually compile to the same code as a hand-written loop?',
        choices: [
          'They are interpreted',
          'Generics monomorphise and the adapters inline, so the abstraction disappears before optimisation',
          'The compiler special-cases them',
          'They use SIMD automatically',
        ],
        answer: 1,
        explain:
          'Monomorphisation plus inlining is the mechanism, which is the same reason C++ templates can be zero overhead.',
        b: 0.6,
        bloom: 'understand',
      },
    ],
    tags: ['rust'],
    importance: 0.9,
  },

  {
    id: 'cod_rs_02_ownership',
    track: 'coding',
    tier: 6,
    title: 'Ownership, Borrowing, Lifetimes and Traits',
    summary:
      "The part that makes you better at C++. Aliasing XOR mutability is the rule you are already supposed to obey manually in C++; here a compiler checks it, and the errors teach you what you were getting away with.",
    prereqs: ['cod_rs_01_basics'],
    hours: 25,
    topics: [
      'The three ownership rules; move by default and Copy types',
      'Borrowing: shared &T versus exclusive &mut T',
      'Aliasing XOR mutability and why it removes data races and iterator invalidation by construction',
      'Reading borrow-checker errors instead of fighting them',
      'Lifetimes: elision rules, explicit annotations, lifetimes in structs, static',
      'Interior mutability: Cell, RefCell and its runtime panics, Rc, Arc, Mutex, RwLock, OnceLock',
      'Send and Sync: thread safety as a type-system property',
      'Box and Pin (awareness); Drop as Rust RAII',
      'unsafe: the five superpowers, and the discipline of wrapping it in a safe abstraction with documented invariants',
      'Traits: definition, default methods, associated types versus generic parameters, where clauses, blanket impls, the orphan rule',
      'Static dispatch (impl Trait, generics) versus dynamic dispatch (dyn Trait, fat pointers)',
      'Operator traits, From/Into, TryFrom, Display, Debug, Default, Iterator, Deref',
      'Error handling: custom error enums, thiserror for libraries, anyhow for applications',
      'panic versus recoverable errors; unwrap and expect discipline; panic = abort',
      'Testing: #[test], integration tests, criterion benchmarks, proptest, cargo-fuzz, miri',
      'Mapping each concept back to its C++ equivalent',
    ],
    objectives: [
      'Resolve twenty borrow-checker errors without reaching for clone().',
      'Explain to a C++ engineer why pushing to a Vec while holding a reference will not compile.',
      'Write a function signature that genuinely needs an explicit lifetime and say why elision fails.',
      'Choose between static and dynamic dispatch for a sensor abstraction and measure the difference.',
      'Wrap an unsafe block in a safe API with its invariants documented.',
    ],
    resources: [
      {
        title: 'The Rust Programming Language, chapters 4, 10, 15 and 16',
        author: 'Steve Klabnik and Carol Nichols',
        kind: 'book',
        url: 'https://doc.rust-lang.org/book/ch04-00-understanding-ownership.html',
        free: true,
      },
      {
        title: 'Rust for Rustaceans',
        author: 'Jon Gjengset',
        kind: 'book',
        free: false,
        note: 'The step from writing Rust to writing idiomatic production Rust.',
      },
      {
        title: 'Rust Atomics and Locks',
        author: 'Mara Bos',
        kind: 'book',
        url: 'https://marabos.nl/atomics/',
        free: true,
      },
      {
        title: 'The Rustonomicon',
        author: 'Rust project',
        kind: 'docs',
        url: 'https://doc.rust-lang.org/nomicon/',
        free: true,
        note: 'What you must uphold when you write unsafe.',
      },
    ],
    exercises: [
      {
        id: 'rs02_ex1',
        title: 'A sensor trait, static and dynamic',
        prompt:
          'Define a trait Sensor with fn read(&mut self) -> Result<[f64; 3], SensorError>. Implement it for a simulated gyro and a simulated accelerometer. Write one function generic over S: Sensor (static dispatch) and one taking &mut dyn Sensor (dynamic dispatch), each reading N samples and returning the mean. Benchmark both. Expected: identical numerical results, and the generic version measurably faster because the call inlines.',
        kind: 'code',
        lang: 'rust',
        starter:
          '#[derive(Debug)]\npub enum SensorError {\n    Timeout,\n    OutOfRange,\n}\n\npub trait Sensor {\n    fn read(&mut self) -> Result<[f64; 3], SensorError>;\n}\n\n// TODO: two implementations, plus mean_static and mean_dynamic\n',
        solution:
          '#[derive(Debug)]\npub enum SensorError {\n    Timeout,\n    OutOfRange,\n}\n\npub trait Sensor {\n    fn read(&mut self) -> Result<[f64; 3], SensorError>;\n}\n\npub struct Gyro {\n    t: f64,\n    bias: [f64; 3],\n}\n\nimpl Sensor for Gyro {\n    fn read(&mut self) -> Result<[f64; 3], SensorError> {\n        self.t += 0.001;\n        Ok([\n            0.01 * self.t.sin() + self.bias[0],\n            0.01 * self.t.cos() + self.bias[1],\n            self.bias[2],\n        ])\n    }\n}\n\npub struct Accel {\n    t: f64,\n}\n\nimpl Sensor for Accel {\n    fn read(&mut self) -> Result<[f64; 3], SensorError> {\n        self.t += 0.001;\n        Ok([0.0, 0.0, -9.80665 + 0.001 * self.t])\n    }\n}\n\n// Static dispatch: monomorphised per S, so read() can inline.\npub fn mean_static<S: Sensor>(s: &mut S, n: usize) -> [f64; 3] {\n    let mut acc = [0.0f64; 3];\n    for _ in 0..n {\n        if let Ok(v) = s.read() {\n            for i in 0..3 {\n                acc[i] += v[i];\n            }\n        }\n    }\n    let k = n as f64;\n    [acc[0] / k, acc[1] / k, acc[2] / k]\n}\n\n// Dynamic dispatch: one copy of the code, an indirect call through a vtable.\npub fn mean_dynamic(s: &mut dyn Sensor, n: usize) -> [f64; 3] {\n    let mut acc = [0.0f64; 3];\n    for _ in 0..n {\n        if let Ok(v) = s.read() {\n            for i in 0..3 {\n                acc[i] += v[i];\n            }\n        }\n    }\n    let k = n as f64;\n    [acc[0] / k, acc[1] / k, acc[2] / k]\n}\n\n#[cfg(test)]\nmod tests {\n    use super::*;\n\n    #[test]\n    fn both_dispatches_agree() {\n        let mut a = Gyro { t: 0.0, bias: [1e-3, -2e-3, 5e-4] };\n        let mut b = Gyro { t: 0.0, bias: [1e-3, -2e-3, 5e-4] };\n        let s = mean_static(&mut a, 1000);\n        let d = mean_dynamic(&mut b, 1000);\n        for i in 0..3 {\n            assert!((s[i] - d[i]).abs() < 1e-15);\n        }\n    }\n}\n',
        hours: 4,
      },
      {
        id: 'rs02_ex2',
        title: 'Twenty borrow-checker errors',
        prompt:
          'Work through a file of twenty snippets that do not compile: a returned reference to a local, a push while a reference is held, two mutable borrows, a moved value used again, a struct holding a reference without a lifetime, and so on. Fix each without calling clone(), and for each write the equivalent C++ code and say whether the C++ compiler would have caught it. Expected: at least twelve of the twenty are silent undefined behaviour in C++ and are compile errors in Rust.',
        kind: 'analysis',
        hours: 4,
      },
    ],
    cards: [
      {
        id: 'rs02_c1',
        front: 'State the three ownership rules',
        back:
          'Every value has exactly one owner; there is only one owner at a time; when the owner goes out of scope the value is dropped. Moves transfer ownership, and the moved-from binding cannot be used again.',
      },
      {
        id: 'rs02_c2',
        front: 'Aliasing XOR mutability: what does it buy?',
        back:
          'At any moment a value has either many shared references or exactly one exclusive reference. That single rule eliminates data races, iterator invalidation and most use-after-free at compile time, because the dangerous patterns are simply not expressible.',
      },
      {
        id: 'rs02_c3',
        front: 'Why will `let r = &v[0]; v.push(x);` not compile?',
        back:
          'push needs a &mut borrow of v while r holds a shared borrow, which the borrow checker rejects. In C++ the same code compiles and r dangles after reallocation; this is the single most convincing demonstration of the model to a C++ engineer.',
      },
      {
        id: 'rs02_c4',
        front: 'What is a lifetime annotation actually saying?',
        back:
          'It relates the lifetimes of inputs and outputs so the compiler can check that a returned reference cannot outlive what it points into. It does not change how long anything lives; it only describes the relationship.',
      },
      {
        id: 'rs02_c5',
        front: 'When does lifetime elision fail?',
        back:
          'When a function has several reference parameters and returns a reference, so the compiler cannot infer which input the output borrows from. Then you must annotate, which is also a design prompt: often the answer is to return an owned value.',
      },
      {
        id: 'rs02_c6',
        front: 'RefCell: when is it appropriate and what does it cost?',
        back:
          'When the borrow pattern is correct but cannot be proved statically, typically a graph or a shared observer. It moves the check to runtime, so a violation is a panic instead of a compile error, and it adds a counter per cell. In flight code it is usually a design smell.',
      },
      {
        id: 'rs02_c7',
        front: 'Send and Sync in one line each',
        back:
          'Send means the type can be moved to another thread; Sync means &T can be shared across threads. Both are automatically derived, so thread safety is checked by the type system rather than by discipline.',
      },
      {
        id: 'rs02_c8',
        front: 'Why can Rust guarantee no data races at compile time?',
        back:
          'A data race needs aliasing plus mutation plus concurrency. The borrow rules forbid aliasing with mutation, and Send/Sync control what crosses threads, so the combination cannot be constructed in safe code.',
      },
      {
        id: 'rs02_c9',
        front: 'What are the five unsafe superpowers?',
        back:
          'Dereference a raw pointer, call an unsafe function or FFI, implement an unsafe trait, access or modify a mutable static, and access the fields of a union. unsafe does not turn off the borrow checker; it only enables those five operations.',
      },
      {
        id: 'rs02_c10',
        front: 'impl Trait versus dyn Trait: cost and capability',
        back:
          'impl Trait (or a generic parameter) is static dispatch: monomorphised, inlinable, one copy per type, and the concrete type is fixed at compile time. dyn Trait is a fat pointer with a vtable: one copy of the code, an indirect call, and heterogeneous collections become possible.',
      },
      {
        id: 'rs02_c11',
        front: 'thiserror versus anyhow',
        back:
          'thiserror derives a typed error enum for a library, so callers can match on the cases. anyhow provides a single boxed error with context for an application, where the caller only reports. Libraries use the first, binaries the second.',
      },
      {
        id: 'rs02_c12',
        front: 'Why does flight-style Rust set panic = abort?',
        back:
          'Unwinding requires runtime machinery and creates an unbounded control-flow path, exactly the objection to C++ exceptions. Aborting makes the failure immediate and analysable, and usually hands recovery to a watchdog.',
      },
      {
        id: 'rs02_c13',
        front: 'How does Drop compare to a C++ destructor?',
        back:
          'Same idea, run at scope exit in reverse declaration order. The differences: Drop cannot be called manually (you use drop()), a moved-from value is not dropped, and there is no need for the rule of five because moves are built into the language.',
      },
      {
        id: 'rs02_c14',
        front: 'What is miri for?',
        back:
          'An interpreter that detects undefined behaviour in unsafe code: out-of-bounds, misaligned access, invalid aliasing under Stacked Borrows, uninitialised reads. It is the Rust equivalent of running everything under a very strict sanitizer.',
      },
    ],
    quiz: [
      {
        id: 'rs02_q1',
        q: 'Which C++ bug class does aliasing XOR mutability eliminate by construction?',
        choices: [
          'Integer overflow',
          'Iterator invalidation and data races',
          'Stack overflow',
          'Floating-point rounding error',
        ],
        answer: 1,
        explain:
          'Both require simultaneous aliasing and mutation, which the borrow checker forbids. Overflow, stack depth and rounding are orthogonal concerns.',
        b: 0.4,
        bloom: 'understand',
      },
      {
        id: 'rs02_q2',
        q: 'A function takes two &str and returns a &str. Why does it need a lifetime annotation?',
        choices: [
          'Because &str is a slice',
          'Because the compiler cannot infer which input the returned reference borrows from',
          'Because of the orphan rule',
          'Because str is unsized',
        ],
        answer: 1,
        explain:
          'With more than one candidate input lifetime, elision has no rule to apply. Annotating states the relationship; returning String sidesteps it.',
        b: 0.8,
        bloom: 'understand',
      },
      {
        id: 'rs02_q3',
        q: 'For a 1 kHz control task with a known set of sensor types, which dispatch is preferable?',
        choices: [
          'dyn Trait, for flexibility',
          'Static dispatch via generics, so calls inline and no vtable indirection occurs',
          'Rc<RefCell<dyn Sensor>>',
          'Function pointers stored in a HashMap',
        ],
        answer: 1,
        explain:
          'Same reasoning as CRTP versus virtual in C++: with a closed set known at compile time, monomorphisation is free and predictable.',
        b: 0.5,
        bloom: 'apply',
      },
      {
        id: 'rs02_q4',
        q: 'What does unsafe actually change?',
        choices: [
          'It disables the borrow checker',
          'It enables five specific operations while all other rules still apply',
          'It removes bounds checking everywhere',
          'It allows data races',
        ],
        answer: 1,
        explain:
          'Borrow checking, type checking and lifetimes still apply inside an unsafe block. The programmer takes responsibility only for the five operations the compiler cannot verify.',
        b: 0.7,
        bloom: 'understand',
      },
      {
        id: 'rs02_q5',
        q: 'A library returns errors with anyhow::Error. What have its callers lost?',
        choices: [
          'Nothing',
          'The ability to match on specific error cases, because the type is erased',
          'Error messages',
          'The ? operator',
        ],
        answer: 1,
        explain:
          'That is why libraries expose a typed enum, often derived with thiserror, and leave anyhow to the application at the top of the stack.',
        b: 0.6,
        bloom: 'analyze',
      },
      {
        id: 'rs02_q6',
        q: 'Which statement best describes what learning Rust does for a C++ engineer?',
        choices: [
          'It replaces the need for C++',
          'It makes explicit, and compiler-checked, the aliasing and lifetime rules C++ already requires you to obey by hand',
          'It teaches faster algorithms',
          'It is only useful for web services',
        ],
        answer: 1,
        explain:
          'That transfer of understanding is the main reason to spend the hours, given Rust current aerospace footprint.',
        b: 0.3,
        bloom: 'understand',
      },
      {
        id: 'rs02_q7',
        q: 'RefCell is used in a hard real-time task. What is the risk?',
        choices: [
          'It allocates',
          'A borrow violation becomes a runtime panic, which in flight code means an abort, and the check itself is not free',
          'It is not Send',
          'It disables Drop',
        ],
        answer: 1,
        explain:
          'Moving a static guarantee to a runtime panic is exactly the wrong direction for flight software. Restructure the ownership instead.',
        b: 0.9,
        bloom: 'analyze',
      },
    ],
    tags: ['rust'],
    importance: 1.0,
  },

  {
    id: 'cod_rs_03_aerospace',
    track: 'coding',
    tier: 7,
    title: 'no_std Rust and its Real Aerospace Footprint',
    summary:
      "Embedded Rust without the standard library, nalgebra for fixed-size linear algebra, and an honest account of where Rust actually stands in space: real ESA-funded activity and a qualified toolchain, no evidence whatsoever for the viral claims about Starship.",
    prereqs: ['cod_rs_02_ownership'],
    hours: 25,
    topics: [
      'no_std and no_main; core versus alloc versus std',
      'Panic handlers; cortex-m and cortex-m-rt; the entry attribute, vector tables, memory.x',
      'embedded-hal 1.0 as the driver ecosystem contract; PACs from svd2rust; HAL crates',
      'Embassy as the async-first embedded framework family, and RTIC for static-priority hard real time',
      'Hubris (Oxide) and Tock as all-Rust microcontroller operating systems',
      'defmt logging, probe-rs, cargo-embed, rtt-target',
      'heapless collections: Vec, String and spsc::Queue with static capacity',
      'critical-section and static_assertions',
      'FFI both directions: extern C, no_mangle, bindgen, cbindgen, and Rust modules inside an existing C or C++ flight codebase',
      'nalgebra: type-level dimensions, SMatrix versus DMatrix, and when it allocates',
      'nalgebra geometry: UnitQuaternion, Rotation3, Isometry3, slerp; no_std support',
      'Neighbouring crates: ndarray, argmin, nyx-space, hifitime, micromath, libm',
      'Certification: DO-178C DAL levels, structural coverage, DO-330 tool qualification, ECSS-Q-ST-80C',
      'Ferrocene: the qualified Rust toolchain and exactly what its qualification covers',
      'ESA activity: cRustacea in Space (DLR), the armv7-rtems-eabihf target, ADCSS 2024',
      'What the evidence actually supports about Rust at SpaceX, and the fabricated claims to reject',
    ],
    objectives: [
      'Blink an LED and read an I2C IMU on a Cortex-M target in no_std Rust.',
      'Port a fixed-size filter to no_std plus nalgebra with no allocation and run it on the microcontroller.',
      'State precisely what Ferrocene is qualified for and what it is not.',
      'Name two verifiable ESA Rust activities and cite what they produced.',
      'Write a two-page memo arguing for or against introducing Rust into an existing C++ flight codebase, and defend it.',
    ],
    resources: [
      {
        title: 'The Embedded Rust Book',
        author: 'Rust Embedded Working Group',
        kind: 'book',
        url: 'https://docs.rust-embedded.org/book/',
        free: true,
      },
      {
        title: 'awesome-embedded-rust',
        author: 'Rust Embedded Working Group',
        kind: 'site',
        url: 'https://github.com/rust-embedded/awesome-embedded-rust',
        free: true,
      },
      {
        title: 'nalgebra documentation',
        author: 'Dimforge',
        kind: 'docs',
        url: 'https://nalgebra.rs/',
        free: true,
      },
      {
        title: 'Bringing Rust to Safety-Critical Systems in Space',
        author: 'Seidel et al., arXiv:2405.18135',
        kind: 'paper',
        url: 'https://arxiv.org/abs/2405.18135',
        free: true,
        note: 'Presented at ESA; the sober academic treatment, including why industrial uptake remains limited.',
      },
      {
        title: 'Ferrocene',
        author: 'Ferrous Systems',
        kind: 'tool',
        url: 'https://ferrocene.dev/',
        free: true,
        note: 'Open source and drop-in compatible with upstream rustc; the qualification scope is the part to read carefully.',
      },
    ],
    exercises: [
      {
        id: 'rs03_ex1',
        title: 'no_std fixed-size attitude propagation',
        prompt:
          'Write a no_std library that propagates a UnitQuaternion with nalgebra from a body rate over a fixed time step, using only SMatrix and SVector types so nothing allocates. Provide a heapless ring buffer for the last 64 outputs. Verify on the host with cargo test, then build for thumbv7em-none-eabihf and report the .text and .bss sizes. Expected: the quaternion norm stays within 1e-12 of one over 100000 steps, and the build links with no allocator.',
        kind: 'code',
        lang: 'rust',
        starter:
          '#![no_std]\n\nuse nalgebra::{UnitQuaternion, Vector3};\n\npub struct Attitude {\n    pub q: UnitQuaternion<f64>,\n}\n\nimpl Attitude {\n    pub fn propagate(&mut self, omega_body: Vector3<f64>, dt: f64) {\n        todo!()\n    }\n}\n',
        solution:
          '#![no_std]\n\nuse nalgebra::{UnitQuaternion, Vector3};\n\npub struct Attitude {\n    pub q: UnitQuaternion<f64>,\n}\n\nimpl Attitude {\n    pub fn new() -> Self {\n        Self { q: UnitQuaternion::identity() }\n    }\n\n    /// Propagate by the body rate over dt using the exponential map, which\n    /// keeps the result a unit quaternion by construction rather than\n    /// integrating and renormalising.\n    pub fn propagate(&mut self, omega_body: Vector3<f64>, dt: f64) {\n        let dtheta = omega_body * dt;\n        let dq = UnitQuaternion::from_scaled_axis(dtheta);\n        self.q = self.q * dq;\n    }\n}\n\nimpl Default for Attitude {\n    fn default() -> Self { Self::new() }\n}\n\n#[cfg(test)]\nmod tests {\n    use super::*;\n\n    #[test]\n    fn norm_is_preserved() {\n        let mut a = Attitude::new();\n        let w = Vector3::new(0.01, -0.02, 0.005);\n        for _ in 0..100_000 {\n            a.propagate(w, 0.001);\n        }\n        assert!((a.q.norm() - 1.0).abs() < 1e-12);\n    }\n\n    #[test]\n    fn full_turn_returns_to_start() {\n        let mut a = Attitude::new();\n        let w = Vector3::new(0.0, 0.0, core::f64::consts::TAU);\n        for _ in 0..1000 {\n            a.propagate(w, 0.001);\n        }\n        let ang = a.q.angle();\n        assert!(ang < 1e-9 || (core::f64::consts::TAU - ang) < 1e-9);\n    }\n}\n\n// All nalgebra types here are statically sized (UnitQuaternion<f64> and\n// Vector3<f64>), so no heap is touched and the crate links without an\n// allocator on thumbv7em-none-eabihf.\n',
        hours: 5,
      },
      {
        id: 'rs03_ex2',
        title: 'The Rust-in-flight-software memo',
        prompt:
          'Write a two-page technical memo recommending for or against introducing Rust into an existing C++ flight-software codebase. It must cite Ferrocene actual qualification scope, at least two verifiable ESA activities, the realistic interop path (Rust modules behind extern C inside the existing build), the certification cost, and the team-skills cost. It must also explicitly note that the widely circulated claims about Starship flight control being rewritten in Rust have no primary source. Deliverable: the memo plus a list of the three strongest objections to your own recommendation.',
        kind: 'analysis',
        hours: 5,
      },
    ],
    cards: [
      {
        id: 'rs03_c1',
        front: 'What do you lose with no_std, and what replaces it?',
        back:
          'Everything requiring an OS or an allocator: std collections, files, threads, networking, and the default panic handler. core remains for language fundamentals, alloc can be opted into with an allocator, and heapless provides fixed-capacity collections.',
      },
      {
        id: 'rs03_c2',
        front: 'Embassy versus RTIC: which for a hard real-time 1 kHz loop?',
        back:
          'RTIC. It is a static-priority, interrupt-driven framework whose resource access is proven at compile time and whose scheduling is analysable. Embassy async is excellent ergonomics for I/O-heavy firmware but its executor is harder to reason about for a hard deadline.',
      },
      {
        id: 'rs03_c3',
        front: 'What is embedded-hal?',
        back:
          'A set of traits defining what a digital pin, an SPI bus, an I2C bus or a delay does. Drivers are written against the traits, so one sensor driver works on every microcontroller whose HAL implements them; version 1.0 stabilised that contract.',
      },
      {
        id: 'rs03_c4',
        front: 'How do you call Rust from an existing C flight codebase?',
        back:
          'Expose functions as extern C with no_mangle, build a staticlib, generate a C header with cbindgen, and link it into the existing build. This incremental module-by-module path is the only realistic adoption route for a large legacy codebase.',
      },
      {
        id: 'rs03_c5',
        front: 'When does nalgebra allocate, and how do you guarantee it does not?',
        back:
          'Only for dynamically sized types (DMatrix, DVector). Use the statically sized SMatrix, SVector, Matrix3, Vector3 and UnitQuaternion families, and build for a no_std target with no allocator so an accidental dynamic type fails to link.',
      },
      {
        id: 'rs03_c6',
        front: 'SMatrix<f64,3,3> versus Eigen::Matrix3d: same and different',
        back:
          'Same: compile-time dimensions, stack storage, no allocation, dimension checking at compile time. Different: nalgebra dimensions are type-level parameters integrated with the trait system, it has no expression-template layer of Eigen sophistication, and its geometry types make the unit-quaternion invariant part of the type.',
      },
      {
        id: 'rs03_c7',
        front: 'What exactly is Ferrocene qualified for?',
        back:
          'A qualified Rust toolchain certified by TUV SUD for ISO 26262 up to ASIL D, IEC 61508 up to SIL 3 and IEC 62304 Class C, with support for customer qualification towards DO-178C DAL C. In December 2025 a certified subset of the core library reached IEC 61508 SIL 2 and ISO 26262 ASIL B. It is open source and drop-in compatible with upstream rustc.',
      },
      {
        id: 'rs03_c8',
        front: 'What is Ferrocene NOT?',
        back:
          'It is not a blanket DO-178C DAL A approval, it does not qualify the whole standard library, and it does not remove the need for your own verification evidence. A qualified compiler is a prerequisite, not a certification.',
      },
      {
        id: 'rs03_c9',
        front: 'Name two verifiable ESA Rust activities',
        back:
          'cRustacea in Space (DLR), which ported the Rust standard library to RTEMS and upstreamed the Tier-3 target armv7-rtems-eabihf, presented at ADCSS 2024; and ESA activity 4000140241, a Rust RTOS with a board support package and demo application on an ARM Cortex-M7 SAMV71.',
      },
      {
        id: 'rs03_c10',
        front: 'What is the actual evidence for Rust at SpaceX?',
        back:
          'One Starlink Embedded Software Engineer (Customer Hardware) posting listing development experience in C, C++, Golang, Python or Rust. That is the full extent. Rust is accepted for some embedded work, not required, and not on the vehicle flight-software path.',
      },
      {
        id: 'rs03_c11',
        front: 'Which widely circulated Rust-in-space claims should you reject?',
        back:
          'That SpaceX rewrote parts of Starship flight control in Rust running at 1000 Hz for thrust vector control, and that NASA Mars Sample Return runs Rust path planning. No primary source exists for either; both trace to AI-generated content farms. Repeating them in an interview is a credibility risk.',
      },
      {
        id: 'rs03_c12',
        front: 'Why is unsafe not a certification dealbreaker?',
        back:
          'Because certification cares about evidence, not about the absence of a keyword. unsafe blocks that are small, documented with their invariants, wrapped in safe APIs, reviewed and checked with miri are auditable, and the surrounding safe code still carries its guarantees.',
      },
      {
        id: 'rs03_c13',
        front: 'What does defmt solve on a microcontroller?',
        back:
          'Formatting strings on a device with kilobytes of RAM is expensive. defmt sends compact binary tokens and reconstructs the message on the host using the debug information, cutting both code size and link bandwidth dramatically.',
      },
      {
        id: 'rs03_c14',
        front: 'The honest one-line positioning of Rust for this career',
        back:
          'A 2027-2030 bet and an outstanding way to finally understand ownership, aliasing and lifetimes, which makes you better at C++. It should not displace C++ hours, and its interview value is the reasoning you can show, not the language itself.',
      },
    ],
    quiz: [
      {
        id: 'rs03_q1',
        q: 'Which claim about Rust at SpaceX is supported by evidence?',
        choices: [
          'Starship flight control was rewritten in Rust at 1000 Hz',
          'A Starlink embedded posting lists Rust among acceptable languages alongside C, C++, Golang and Python',
          'All new Dragon software is Rust',
          'SpaceX contributed the RTEMS Rust target',
        ],
        answer: 1,
        explain:
          'Only the job-posting evidence is verifiable. The Starship claim traces to AI-generated content farms, and the RTEMS target came from the DLR cRustacea in Space activity, not SpaceX.',
        b: 0.6,
        bloom: 'recall',
      },
      {
        id: 'rs03_q2',
        q: 'Ferrocene as of end-2025 is qualified for which set?',
        choices: [
          'DO-178C DAL A for the full standard library',
          'ISO 26262 up to ASIL D, IEC 61508 up to SIL 3 and IEC 62304 Class C, with support towards DO-178C DAL C, plus a certified subset of core at SIL 2 and ASIL B',
          'Nothing; it is an unqualified fork',
          'ECSS-Q-ST-80C at all levels',
        ],
        answer: 1,
        explain:
          'Knowing the precise scope, and its limits, is what separates a credible Rust argument from an enthusiastic one.',
        b: 1.0,
        bloom: 'recall',
      },
      {
        id: 'rs03_q3',
        q: 'For a hard real-time 1 kHz control loop on a Cortex-M, which framework fits best?',
        choices: [
          'Embassy, because async is efficient',
          'RTIC, because static priorities and compile-time-proven resource access make the scheduling analysable',
          'Tokio',
          'std threads',
        ],
        answer: 1,
        explain:
          'RTIC targets exactly the analytical hard-real-time niche. Embassy is the better default for I/O-driven firmware; Tokio and std threads need an operating system.',
        b: 0.8,
        bloom: 'apply',
      },
      {
        id: 'rs03_q4',
        q: 'How do you guarantee a nalgebra-based filter never allocates?',
        choices: [
          'Use DMatrix with a reserved capacity',
          'Use only statically sized types and build for a no_std target with no allocator, so a dynamic type fails to link',
          'Call shrink_to_fit',
          'Set panic = abort',
        ],
        answer: 1,
        explain:
          'Making the absence of an allocator a link-time property turns a review promise into a mechanical check, exactly like the Eigen malloc assertion.',
        b: 0.7,
        bloom: 'apply',
      },
      {
        id: 'rs03_q5',
        q: 'What is the realistic path for introducing Rust into an existing C++ flight codebase?',
        choices: [
          'Rewrite the codebase',
          'New modules compiled as a staticlib and called through extern C, with cbindgen-generated headers, inside the existing build and verification process',
          'Run Rust and C++ as separate processes',
          'Wait until Rust is DAL A qualified',
        ],
        answer: 1,
        explain:
          'Incremental module adoption behind a C ABI is how every successful introduction has been done, and it keeps the existing certification evidence intact.',
        b: 0.6,
        bloom: 'apply',
      },
      {
        id: 'rs03_q6',
        q: 'What do you lose in no_std?',
        choices: [
          'Pattern matching and traits',
          'The allocator-dependent and OS-dependent parts of std: collections like Vec and String, files, threads and the default panic handler',
          'The borrow checker',
          'Iterators',
        ],
        answer: 1,
        explain:
          'core keeps the language itself. What goes is everything needing an allocator or an operating system, which heapless and an explicit panic handler replace.',
        b: 0.4,
        bloom: 'understand',
      },
      {
        id: 'rs03_q7',
        q: 'Why is a small, documented unsafe block acceptable in safety-critical Rust?',
        choices: [
          'Because unsafe is ignored by certification',
          'Because certification is about auditable evidence: a bounded, reviewed, miri-checked block wrapped in a safe API with stated invariants is exactly that',
          'Because the borrow checker still validates raw pointers',
          'It is not acceptable under any circumstances',
        ],
        answer: 1,
        explain:
          'The argument is about the size and reviewability of the trusted computing base, not about the presence of a keyword.',
        b: 0.9,
        bloom: 'analyze',
      },
    ],
    tags: ['rust', 'realtime'],
    importance: 0.85,
  },

  /* ══ SQL ═════════════════════════════════════════════════════════════════ */
  {
    id: 'cod_sql_01_select',
    track: 'coding',
    tier: 0,
    title: 'The Relational Model and Single-Table Queries',
    summary:
      "SQL earns its place here because of one real posting: Data Engineer, Starlink GNC, building pipelines for the health and safety of more than six thousand on-orbit satellites. Start with the relational model, NULL semantics and the logical order of evaluation.",
    prereqs: [],
    hours: 12,
    topics: [
      'Relations, rows, columns and domains; primary and foreign keys',
      'NULL and three-valued logic; the = NULL trap; IS NULL and IS NOT NULL',
      'SELECT, FROM, WHERE; comparison, BETWEEN, IN, LIKE',
      'ORDER BY, LIMIT and OFFSET; DISTINCT',
      'Expressions and CASE WHEN',
      'Data types: INTEGER, NUMERIC versus REAL, and why timestamps and money never use floats',
      'TIMESTAMPTZ versus TIMESTAMP, intervals, and why aerospace stores UTC',
      'COALESCE, NULLIF, CAST',
      'Logical versus physical query order: FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY, LIMIT',
      'Reading a schema you did not write',
    ],
    objectives: [
      'Explain why WHERE col = NULL returns nothing and what to write instead.',
      'State the logical evaluation order of a query and use it to explain why a SELECT alias cannot be used in WHERE.',
      'Bucket a continuous measurement into status categories with CASE.',
      'Choose an appropriate column type for a telemetry timestamp and defend it.',
      'Write a single-table query against an unfamiliar schema without guessing.',
    ],
    resources: [
      {
        title: 'Learning SQL, 3rd ed.',
        author: 'Alan Beaulieu',
        kind: 'book',
        free: false,
        note: 'Includes newer chapters on analytic functions and SQL over big data.',
      },
      {
        title: 'PostgreSQL Tutorial (official documentation)',
        author: 'PostgreSQL Global Development Group',
        kind: 'docs',
        url: 'https://www.postgresql.org/docs/current/tutorial.html',
        free: true,
      },
      {
        title: 'SQLZoo',
        kind: 'course',
        url: 'https://sqlzoo.net/',
        free: true,
      },
      {
        title: 'Mode SQL Tutorial',
        author: 'Mode Analytics',
        kind: 'course',
        url: 'https://mode.com/sql-tutorial/',
        free: true,
      },
    ],
    exercises: [
      {
        id: 'sql01_ex1',
        title: 'Battery state-of-charge triage',
        prompt:
          'The telemetry table holds mixed channels and some NULL values. Create a view named `answer` with columns sat_id, ts, value and status, containing only BATT_SOC rows whose value is not NULL, ordered by value ascending. status is CRITICAL below 0.30, LOW below 0.70 and otherwise OK. Note that excluding NULL requires IS NOT NULL, not <> NULL.',
        kind: 'code',
        lang: 'sql',
        starter: `-- Schema and seed data (do not edit)
DROP TABLE IF EXISTS telemetry;
CREATE TABLE telemetry (
    sat_id  TEXT    NOT NULL,
    ts      TEXT    NOT NULL,
    channel TEXT    NOT NULL,
    value   REAL
);
INSERT INTO telemetry (sat_id, ts, channel, value) VALUES
  ('SAT-001','2026-03-01T00:00:00Z','BATT_SOC', 0.94),
  ('SAT-001','2026-03-01T00:01:00Z','BATT_SOC', 0.88),
  ('SAT-001','2026-03-01T00:02:00Z','BATT_SOC', 0.61),
  ('SAT-002','2026-03-01T00:00:00Z','BATT_SOC', 0.42),
  ('SAT-002','2026-03-01T00:01:00Z','BATT_SOC', NULL),
  ('SAT-002','2026-03-01T00:02:00Z','BATT_SOC', 0.19),
  ('SAT-003','2026-03-01T00:00:00Z','BUS_TEMP', 21.5),
  ('SAT-003','2026-03-01T00:01:00Z','BATT_SOC', 0.75);

-- YOUR QUERY: create a view named answer (sat_id, ts, value, status)
DROP VIEW IF EXISTS answer;
CREATE VIEW answer AS
SELECT sat_id, ts, value, 'TODO' AS status
FROM telemetry;
`,
        solution: `-- Schema and seed data (do not edit)
DROP TABLE IF EXISTS telemetry;
CREATE TABLE telemetry (
    sat_id  TEXT    NOT NULL,
    ts      TEXT    NOT NULL,
    channel TEXT    NOT NULL,
    value   REAL
);
INSERT INTO telemetry (sat_id, ts, channel, value) VALUES
  ('SAT-001','2026-03-01T00:00:00Z','BATT_SOC', 0.94),
  ('SAT-001','2026-03-01T00:01:00Z','BATT_SOC', 0.88),
  ('SAT-001','2026-03-01T00:02:00Z','BATT_SOC', 0.61),
  ('SAT-002','2026-03-01T00:00:00Z','BATT_SOC', 0.42),
  ('SAT-002','2026-03-01T00:01:00Z','BATT_SOC', NULL),
  ('SAT-002','2026-03-01T00:02:00Z','BATT_SOC', 0.19),
  ('SAT-003','2026-03-01T00:00:00Z','BUS_TEMP', 21.5),
  ('SAT-003','2026-03-01T00:01:00Z','BATT_SOC', 0.75);

DROP VIEW IF EXISTS answer;
CREATE VIEW answer AS
SELECT sat_id,
       ts,
       value,
       CASE WHEN value < 0.30 THEN 'CRITICAL'
            WHEN value < 0.70 THEN 'LOW'
            ELSE 'OK' END AS status
FROM telemetry
WHERE channel = 'BATT_SOC'
  AND value IS NOT NULL
ORDER BY value ASC;
`,
        tests: [
          {
            name: 'six non-null BATT_SOC rows',
            assert: `DROP TABLE IF EXISTS _chk;
CREATE TEMP TABLE _chk (ok INTEGER, CONSTRAINT answer_has_6_rows CHECK (ok = 1));
INSERT INTO _chk SELECT CASE WHEN (SELECT COUNT(*) FROM answer) = 6 THEN 1 ELSE 0 END;
DROP TABLE _chk;`,
          },
          {
            name: 'NULL values excluded',
            assert: `DROP TABLE IF EXISTS _chk;
CREATE TEMP TABLE _chk (ok INTEGER, CONSTRAINT null_values_excluded CHECK (ok = 1));
INSERT INTO _chk SELECT CASE WHEN (SELECT COUNT(*) FROM answer WHERE value IS NULL) = 0 THEN 1 ELSE 0 END;
DROP TABLE _chk;`,
          },
          {
            name: 'status buckets correct',
            assert: `DROP TABLE IF EXISTS _chk;
CREATE TEMP TABLE _chk (ok INTEGER, CONSTRAINT status_buckets_correct CHECK (ok = 1));
INSERT INTO _chk SELECT CASE WHEN
  (SELECT COUNT(*) FROM answer WHERE status = 'CRITICAL') = 1
  AND (SELECT COUNT(*) FROM answer WHERE status = 'LOW') = 2
  AND (SELECT COUNT(*) FROM answer WHERE status = 'OK') = 3
THEN 1 ELSE 0 END;
DROP TABLE _chk;`,
          },
          {
            name: 'other channels excluded',
            assert: `DROP TABLE IF EXISTS _chk;
CREATE TEMP TABLE _chk (ok INTEGER, CONSTRAINT other_channels_excluded CHECK (ok = 1));
INSERT INTO _chk SELECT CASE WHEN (SELECT COUNT(*) FROM answer WHERE value > 1.0) = 0 THEN 1 ELSE 0 END;
DROP TABLE _chk;`,
            hidden: true,
          },
        ],
        hours: 1.5,
      },
    ],
    cards: [
      {
        id: 'sql01_c1',
        front: 'Why does WHERE col = NULL return nothing?',
        back:
          'NULL means unknown, so any comparison with it evaluates to UNKNOWN rather than TRUE, and WHERE keeps only TRUE rows. Use IS NULL and IS NOT NULL, which test for the marker rather than comparing values.',
      },
      {
        id: 'sql01_c2',
        front: 'State the logical order of evaluation of a SELECT',
        back:
          'FROM (and joins), then WHERE, then GROUP BY, then HAVING, then SELECT, then DISTINCT, then ORDER BY, then LIMIT. It explains why a SELECT alias is usable in ORDER BY but not in WHERE.',
      },
      {
        id: 'sql01_c3',
        front: 'Why are telemetry timestamps never stored as floats?',
        back:
          'Binary floating point cannot represent decimal fractions of a second exactly and loses resolution as the epoch offset grows, so equality and joins break. Use a timestamp type, or an integer count of nanoseconds since a stated epoch.',
      },
      {
        id: 'sql01_c4',
        front: 'TIMESTAMPTZ versus TIMESTAMP',
        back:
          'TIMESTAMPTZ records an absolute instant and converts on input and output using a time zone; TIMESTAMP is a wall-clock reading with no zone, so the same value means different instants in different places. Aerospace stores UTC in a zone-aware type.',
      },
      {
        id: 'sql01_c5',
        front: 'What does COALESCE do, and where is it dangerous?',
        back:
          'It returns the first non-NULL argument, which is how you supply a default. It is dangerous when it silently converts a missing measurement into a plausible number, hiding a telemetry gap from every downstream aggregate.',
      },
      {
        id: 'sql01_c6',
        front: 'NUMERIC versus REAL',
        back:
          'NUMERIC (DECIMAL) is exact base-ten with declared precision and scale; REAL and DOUBLE PRECISION are binary floating point. Use NUMERIC where exactness is the requirement, floating point for physical measurements where it is not.',
      },
      {
        id: 'sql01_c7',
        front: 'Why does DISTINCT often indicate a bug rather than a fix?',
        back:
          'Unexpected duplicates usually come from a join fanning out one-to-many. DISTINCT hides the fan-out but leaves aggregates wrong; the correct fix is to aggregate before joining or to join on the right key.',
      },
      {
        id: 'sql01_c8',
        front: 'What does LIMIT without ORDER BY guarantee?',
        back:
          'Nothing about which rows you get. Without an ORDER BY the engine may return any rows in any order, and the answer can change between runs or after an index change.',
      },
      {
        id: 'sql01_c9',
        front: 'CASE WHEN: what is it for in telemetry work?',
        back:
          'Bucketing a continuous measurement into named states (nominal, caution, critical), conditional aggregation, and pivoting. It is evaluated top to bottom, so put the most restrictive condition first.',
      },
      {
        id: 'sql01_c10',
        front: 'What is a primary key actually promising?',
        back:
          'Uniqueness and non-nullability for that combination of columns, enforced by the database with a supporting index. It is the identity contract other tables reference, which is why choosing it is a modelling decision, not a formality.',
      },
      {
        id: 'sql01_c11',
        front: 'Why is LIKE with a leading wildcard a performance problem?',
        back:
          'A B-tree index is ordered by prefix, so a pattern starting with a wildcard cannot narrow the search and the engine scans. Full-text or trigram indexing exists precisely for that case.',
      },
      {
        id: 'sql01_c12',
        front: 'NOT IN with a subquery that can return NULL',
        back:
          'If any returned value is NULL the whole NOT IN is never TRUE, so the query silently returns zero rows. Use NOT EXISTS, which has no such trap.',
      },
    ],
    quiz: [
      {
        id: 'sql01_q1',
        q: 'Which clause is evaluated first logically?',
        choices: ['SELECT', 'WHERE', 'FROM', 'ORDER BY'],
        answer: 2,
        explain:
          'FROM and the joins produce the working set, then WHERE filters it. That is why a column alias defined in SELECT is not visible in WHERE.',
        b: -0.3,
        bloom: 'recall',
      },
      {
        id: 'sql01_q2',
        q: 'How do you select rows whose value column is unknown?',
        choices: [
          'WHERE value = NULL',
          'WHERE value IS NULL',
          'WHERE value <> value',
          'WHERE NOT value',
        ],
        answer: 1,
        explain:
          'Comparison with NULL yields UNKNOWN, which WHERE discards. IS NULL tests for the marker itself.',
        b: -0.8,
        bloom: 'recall',
      },
      {
        id: 'sql01_q3',
        q: 'A query returns 0 rows: SELECT * FROM sat WHERE sat_id NOT IN (SELECT sat_id FROM reading). What is the likely cause?',
        choices: [
          'The reading table is empty',
          'The subquery returns at least one NULL, so NOT IN is never TRUE',
          'A missing index',
          'sat_id is the wrong type',
        ],
        answer: 1,
        explain:
          'One NULL poisons the whole NOT IN. NOT EXISTS expresses the anti-join without the three-valued-logic trap.',
        b: 1.0,
        bloom: 'analyze',
      },
      {
        id: 'sql01_q4',
        q: 'Which column type should hold a downlink timestamp?',
        choices: [
          'REAL seconds since an unstated epoch',
          'TEXT in local time',
          'A zone-aware timestamp (TIMESTAMPTZ) in UTC, or an integer nanosecond count with a stated epoch',
          'INTEGER day number',
        ],
        answer: 2,
        explain:
          'You need an absolute instant with enough resolution and no zone ambiguity. Float seconds lose precision and unzoned local text is unrecoverable once the operator moves.',
        b: 0.4,
        bloom: 'apply',
      },
      {
        id: 'sql01_q5',
        q: 'What does LIMIT 10 without ORDER BY return?',
        choices: [
          'The first ten rows inserted',
          'The ten smallest values',
          'An arbitrary ten rows that may differ between runs',
          'An error',
        ],
        answer: 2,
        explain:
          'Row order is not defined without ORDER BY. A plan change, such as a new index, can silently change the answer.',
        b: 0.2,
        bloom: 'understand',
      },
      {
        id: 'sql01_q6',
        q: 'COALESCE(value, 0) is applied to a battery state-of-charge column before averaging. What has happened?',
        choices: [
          'Nothing; missing values are ignored',
          'Telemetry gaps now count as a state of charge of zero, biasing the mean downward and hiding the gap',
          'The average is unchanged',
          'The query will error',
        ],
        answer: 1,
        explain:
          'AVG already ignores NULL. Substituting a value converts missing data into a measurement, which is a real and common analysis error.',
        b: 0.8,
        bloom: 'analyze',
      },
      {
        id: 'sql01_q7',
        q: 'Why is DISTINCT often a smell in a report query?',
        choices: [
          'It is slow',
          'It usually masks duplicate rows produced by a one-to-many join, leaving any aggregate wrong',
          'It is not standard SQL',
          'It cannot be combined with ORDER BY',
        ],
        answer: 1,
        explain:
          'The duplicates are a symptom. Deduplicating rows does not undo a SUM that already counted the fan-out.',
        b: 0.7,
        bloom: 'analyze',
      },
    ],
    tags: ['sql', 'data'],
    importance: 1.0,
  },

  {
    id: 'cod_sql_02_joins',
    track: 'coding',
    tier: 1,
    title: 'Joins, Aggregation and Subqueries',
    summary:
      "Where most real telemetry questions live: combine a fleet table with a reading table, aggregate per satellite per day, and find the satellites that reported nothing at all, which is an anti-join and not a join.",
    prereqs: ['cod_sql_01_select'],
    hours: 15,
    topics: [
      'INNER, LEFT, RIGHT and FULL OUTER joins; CROSS join; self-joins',
      'ON versus USING; why NATURAL JOIN is a trap',
      'Join cardinality reasoning and the fan-out trap when aggregating after a one-to-many join',
      'GROUP BY and HAVING; the difference between WHERE and HAVING',
      'COUNT(*) versus COUNT(col); SUM, AVG, MIN, MAX',
      'STRING_AGG and ARRAY_AGG; PERCENTILE_CONT',
      'FILTER (WHERE ...) for conditional aggregation',
      'GROUPING SETS, ROLLUP and CUBE',
      'Scalar, row and table subqueries; correlated subqueries',
      'EXISTS versus IN versus JOIN, and their NULL semantics',
      'Common table expressions and chained CTEs for readability',
      'Recursive CTEs for hierarchies and for gap-filling a time series',
      'UNION, UNION ALL, INTERSECT and EXCEPT',
    ],
    objectives: [
      'Compute a per-satellite per-day aggregate from a joined fleet and reading table.',
      'Write an anti-join that finds satellites with no telemetry in a window, and explain why NOT IN is the wrong tool.',
      'Recognise and fix a fan-out that inflated a SUM.',
      'Explain when a LEFT JOIN followed by IS NOT NULL is really an inner join written badly.',
      'Restructure a nested subquery into readable chained CTEs without changing the result.',
    ],
    resources: [
      {
        title: 'PostgreSQL documentation: Queries and Table Expressions',
        author: 'PostgreSQL Global Development Group',
        kind: 'docs',
        url: 'https://www.postgresql.org/docs/current/queries.html',
        free: true,
      },
      {
        title: 'SQL Cookbook, 2nd ed.',
        author: 'Anthony Molinaro and Robert de Graaf',
        kind: 'book',
        free: false,
      },
      {
        title: 'Learning SQL, 3rd ed., chapters on joins and grouping',
        author: 'Alan Beaulieu',
        kind: 'book',
        free: false,
      },
    ],
    exercises: [
      {
        id: 'sql02_ex1',
        title: 'Per-satellite daily temperature summary',
        prompt:
          'Join the reading table to the satellite table and create a view named `answer` with columns name, day, mean_temp, max_temp and n: for the BUS_TEMP channel only, the mean, the maximum and the sample count per satellite name per calendar day, ordered by name then day. The day is the first ten characters of the ISO timestamp. Satellites with no readings must not appear.',
        kind: 'code',
        lang: 'sql',
        starter: `-- Schema and seed data (do not edit)
DROP TABLE IF EXISTS reading;
DROP TABLE IF EXISTS satellite;
CREATE TABLE satellite (
    sat_id     TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    plane      INTEGER NOT NULL,
    launched   TEXT NOT NULL
);
CREATE TABLE reading (
    sat_id  TEXT NOT NULL REFERENCES satellite(sat_id),
    ts      TEXT NOT NULL,
    channel TEXT NOT NULL,
    value   REAL NOT NULL
);
INSERT INTO satellite VALUES
  ('SAT-001','Aurora',1,'2025-06-01'),
  ('SAT-002','Borealis',1,'2025-06-01'),
  ('SAT-003','Cirrus',2,'2025-09-14'),
  ('SAT-004','Dorado',2,'2026-01-20');
INSERT INTO reading (sat_id, ts, channel, value) VALUES
  ('SAT-001','2026-03-01T00:00:00Z','BUS_TEMP', 20.0),
  ('SAT-001','2026-03-01T06:00:00Z','BUS_TEMP', 24.0),
  ('SAT-001','2026-03-02T01:00:00Z','BUS_TEMP', 30.0),
  ('SAT-002','2026-03-01T00:00:00Z','BUS_TEMP', 18.0),
  ('SAT-002','2026-03-01T12:00:00Z','BUS_TEMP', 22.0),
  ('SAT-003','2026-03-02T00:00:00Z','BUS_TEMP', 11.0);

-- YOUR QUERY: create a view named answer (name, day, mean_temp, max_temp, n)
DROP VIEW IF EXISTS answer;
CREATE VIEW answer AS
SELECT s.name AS name, substr(r.ts, 1, 10) AS day, r.value AS mean_temp,
       r.value AS max_temp, 1 AS n
FROM reading AS r JOIN satellite AS s ON s.sat_id = r.sat_id;
`,
        solution: `-- Schema and seed data (do not edit)
DROP TABLE IF EXISTS reading;
DROP TABLE IF EXISTS satellite;
CREATE TABLE satellite (
    sat_id     TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    plane      INTEGER NOT NULL,
    launched   TEXT NOT NULL
);
CREATE TABLE reading (
    sat_id  TEXT NOT NULL REFERENCES satellite(sat_id),
    ts      TEXT NOT NULL,
    channel TEXT NOT NULL,
    value   REAL NOT NULL
);
INSERT INTO satellite VALUES
  ('SAT-001','Aurora',1,'2025-06-01'),
  ('SAT-002','Borealis',1,'2025-06-01'),
  ('SAT-003','Cirrus',2,'2025-09-14'),
  ('SAT-004','Dorado',2,'2026-01-20');
INSERT INTO reading (sat_id, ts, channel, value) VALUES
  ('SAT-001','2026-03-01T00:00:00Z','BUS_TEMP', 20.0),
  ('SAT-001','2026-03-01T06:00:00Z','BUS_TEMP', 24.0),
  ('SAT-001','2026-03-02T01:00:00Z','BUS_TEMP', 30.0),
  ('SAT-002','2026-03-01T00:00:00Z','BUS_TEMP', 18.0),
  ('SAT-002','2026-03-01T12:00:00Z','BUS_TEMP', 22.0),
  ('SAT-003','2026-03-02T00:00:00Z','BUS_TEMP', 11.0);

DROP VIEW IF EXISTS answer;
CREATE VIEW answer AS
SELECT s.name AS name,
       substr(r.ts, 1, 10) AS day,
       AVG(r.value) AS mean_temp,
       MAX(r.value) AS max_temp,
       COUNT(*)     AS n
FROM reading AS r
JOIN satellite AS s ON s.sat_id = r.sat_id
WHERE r.channel = 'BUS_TEMP'
GROUP BY s.name, substr(r.ts, 1, 10)
ORDER BY s.name, day;
`,
        tests: [
          {
            name: 'four satellite-day groups',
            assert: `DROP TABLE IF EXISTS _chk;
CREATE TEMP TABLE _chk (ok INTEGER, CONSTRAINT answer_has_4_group_rows CHECK (ok = 1));
INSERT INTO _chk SELECT CASE WHEN (SELECT COUNT(*) FROM answer) = 4 THEN 1 ELSE 0 END;
DROP TABLE _chk;`,
          },
          {
            name: 'Aurora day one aggregates',
            assert: `DROP TABLE IF EXISTS _chk;
CREATE TEMP TABLE _chk (ok INTEGER, CONSTRAINT aurora_day1_mean_is_22 CHECK (ok = 1));
INSERT INTO _chk SELECT CASE WHEN
  (SELECT ABS(mean_temp - 22.0) < 1e-9 AND ABS(max_temp - 24.0) < 1e-9 AND n = 2
     FROM answer WHERE name = 'Aurora' AND day = '2026-03-01')
THEN 1 ELSE 0 END;
DROP TABLE _chk;`,
          },
          {
            name: 'silent satellite absent',
            assert: `DROP TABLE IF EXISTS _chk;
CREATE TEMP TABLE _chk (ok INTEGER, CONSTRAINT dorado_absent CHECK (ok = 1));
INSERT INTO _chk SELECT CASE WHEN (SELECT COUNT(*) FROM answer WHERE name = 'Dorado') = 0 THEN 1 ELSE 0 END;
DROP TABLE _chk;`,
            hidden: true,
          },
        ],
        hours: 2,
      },
      {
        id: 'sql02_ex2',
        title: 'Which satellites went silent',
        prompt:
          'Using the same schema, create a view named `answer` with columns sat_id and name listing every satellite that has no reading at or after 2026-03-02T00:00:00Z, ordered by sat_id. Use NOT EXISTS rather than NOT IN, and be ready to say why.',
        kind: 'code',
        lang: 'sql',
        starter: `-- Schema and seed data (do not edit)
DROP TABLE IF EXISTS reading;
DROP TABLE IF EXISTS satellite;
CREATE TABLE satellite (
    sat_id     TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    plane      INTEGER NOT NULL,
    launched   TEXT NOT NULL
);
CREATE TABLE reading (
    sat_id  TEXT NOT NULL REFERENCES satellite(sat_id),
    ts      TEXT NOT NULL,
    channel TEXT NOT NULL,
    value   REAL NOT NULL
);
INSERT INTO satellite VALUES
  ('SAT-001','Aurora',1,'2025-06-01'),
  ('SAT-002','Borealis',1,'2025-06-01'),
  ('SAT-003','Cirrus',2,'2025-09-14'),
  ('SAT-004','Dorado',2,'2026-01-20');
INSERT INTO reading (sat_id, ts, channel, value) VALUES
  ('SAT-001','2026-03-01T00:00:00Z','BUS_TEMP', 20.0),
  ('SAT-001','2026-03-01T06:00:00Z','BUS_TEMP', 24.0),
  ('SAT-001','2026-03-02T01:00:00Z','BUS_TEMP', 30.0),
  ('SAT-002','2026-03-01T00:00:00Z','BUS_TEMP', 18.0),
  ('SAT-002','2026-03-01T12:00:00Z','BUS_TEMP', 22.0),
  ('SAT-003','2026-03-02T00:00:00Z','BUS_TEMP', 11.0);

-- YOUR QUERY: create a view named answer (sat_id, name)
DROP VIEW IF EXISTS answer;
CREATE VIEW answer AS
SELECT sat_id, name FROM satellite;
`,
        solution: `-- Schema and seed data (do not edit)
DROP TABLE IF EXISTS reading;
DROP TABLE IF EXISTS satellite;
CREATE TABLE satellite (
    sat_id     TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    plane      INTEGER NOT NULL,
    launched   TEXT NOT NULL
);
CREATE TABLE reading (
    sat_id  TEXT NOT NULL REFERENCES satellite(sat_id),
    ts      TEXT NOT NULL,
    channel TEXT NOT NULL,
    value   REAL NOT NULL
);
INSERT INTO satellite VALUES
  ('SAT-001','Aurora',1,'2025-06-01'),
  ('SAT-002','Borealis',1,'2025-06-01'),
  ('SAT-003','Cirrus',2,'2025-09-14'),
  ('SAT-004','Dorado',2,'2026-01-20');
INSERT INTO reading (sat_id, ts, channel, value) VALUES
  ('SAT-001','2026-03-01T00:00:00Z','BUS_TEMP', 20.0),
  ('SAT-001','2026-03-01T06:00:00Z','BUS_TEMP', 24.0),
  ('SAT-001','2026-03-02T01:00:00Z','BUS_TEMP', 30.0),
  ('SAT-002','2026-03-01T00:00:00Z','BUS_TEMP', 18.0),
  ('SAT-002','2026-03-01T12:00:00Z','BUS_TEMP', 22.0),
  ('SAT-003','2026-03-02T00:00:00Z','BUS_TEMP', 11.0);

DROP VIEW IF EXISTS answer;
CREATE VIEW answer AS
SELECT s.sat_id, s.name
FROM satellite AS s
WHERE NOT EXISTS (
    SELECT 1 FROM reading AS r
    WHERE r.sat_id = s.sat_id
      AND r.ts >= '2026-03-02T00:00:00Z'
)
ORDER BY s.sat_id;
`,
        tests: [
          {
            name: 'two silent satellites',
            assert: `DROP TABLE IF EXISTS _chk;
CREATE TEMP TABLE _chk (ok INTEGER, CONSTRAINT two_silent_satellites CHECK (ok = 1));
INSERT INTO _chk SELECT CASE WHEN (SELECT COUNT(*) FROM answer) = 2 THEN 1 ELSE 0 END;
DROP TABLE _chk;`,
          },
          {
            name: 'the right two satellites',
            assert: `DROP TABLE IF EXISTS _chk;
CREATE TEMP TABLE _chk (ok INTEGER, CONSTRAINT correct_satellites_listed CHECK (ok = 1));
INSERT INTO _chk SELECT CASE WHEN
  (SELECT GROUP_CONCAT(sat_id, ',') FROM (SELECT sat_id FROM answer ORDER BY sat_id)) = 'SAT-002,SAT-004'
THEN 1 ELSE 0 END;
DROP TABLE _chk;`,
            hidden: true,
          },
        ],
        hours: 2,
      },
    ],
    cards: [
      {
        id: 'sql02_c1',
        front: 'LEFT JOIN then WHERE right.col IS NOT NULL: what did you write?',
        back:
          'An inner join, expressed confusingly. The WHERE clause discards exactly the rows the outer join added. Either write INNER JOIN, or move the condition into the ON clause if you meant to keep the unmatched rows.',
      },
      {
        id: 'sql02_c2',
        front: 'EXISTS versus IN with NULLs',
        back:
          'EXISTS is a pure existence test and is unaffected by NULL. IN is a comparison, so NOT IN against a set containing NULL is never TRUE and silently returns nothing. Prefer EXISTS and NOT EXISTS for anti-joins.',
      },
      {
        id: 'sql02_c3',
        front: 'What is join fan-out?',
        back:
          'Joining one row to many duplicates the one side, so a later SUM counts it once per match. Aggregate the many side first in a CTE, then join, or aggregate with a DISTINCT-safe expression. Adding DISTINCT afterwards does not repair the sum.',
      },
      {
        id: 'sql02_c4',
        front: 'WHERE versus HAVING',
        back:
          'WHERE filters rows before grouping and can use indexes; HAVING filters groups after aggregation and can reference aggregate results. Putting a non-aggregate condition in HAVING is legal and usually slower.',
      },
      {
        id: 'sql02_c5',
        front: 'COUNT(*) versus COUNT(col)',
        back:
          'COUNT(*) counts rows; COUNT(col) counts rows where col is not NULL. The difference between them is a one-line data-quality check for a channel with dropouts.',
      },
      {
        id: 'sql02_c6',
        front: 'Why avoid NATURAL JOIN?',
        back:
          'It joins on every column that happens to share a name, so adding an unrelated column called created_at to both tables silently changes the join condition and the result. Always state the join key.',
      },
      {
        id: 'sql02_c7',
        front: 'What is FILTER (WHERE ...) for?',
        back:
          'Conditional aggregation in one pass: count the critical rows and the total in the same query without a CASE inside SUM. It is clearer than the CASE idiom and lets the planner do one scan.',
      },
      {
        id: 'sql02_c8',
        front: 'When is a CTE better than a nested subquery?',
        back:
          'When the query has more than one logical step. Named steps read top to bottom and can be tested independently. Be aware that in some engines a CTE is an optimisation fence, so check the plan for hot queries.',
      },
      {
        id: 'sql02_c9',
        front: 'What is a recursive CTE good for in telemetry?',
        back:
          'Generating a dense series of time buckets to left-join against, so gaps appear as rows with NULL rather than as missing rows. Also hierarchies, such as a subsystem containment tree.',
      },
      {
        id: 'sql02_c10',
        front: 'UNION versus UNION ALL',
        back:
          'UNION removes duplicates, which requires a sort or hash over the whole result; UNION ALL just concatenates. Use ALL unless you specifically need deduplication, which on large telemetry sets is a large cost.',
      },
      {
        id: 'sql02_c11',
        front: 'Self-join: name one telemetry use',
        back:
          'Pairing each command with its acknowledgement from the same table, or comparing a reading with the previous one before window functions were available. A window function is usually the better modern answer.',
      },
      {
        id: 'sql02_c12',
        front: 'What does a correlated subquery cost?',
        back:
          'Logically it re-evaluates per outer row; planners often rewrite it as a join or a semi-join, but not always. If a correlated subquery is in a hot path, check the plan and consider rewriting it explicitly.',
      },
    ],
    quiz: [
      {
        id: 'sql02_q1',
        q: 'Which construct correctly finds satellites with no readings in a window?',
        choices: [
          'INNER JOIN with a WHERE on the timestamp',
          'NOT EXISTS with a correlated subquery on the reading table',
          'NOT IN over a subquery that can return NULL',
          'LEFT JOIN with WHERE reading.sat_id IS NOT NULL',
        ],
        answer: 1,
        explain:
          'NOT EXISTS is the anti-join and is NULL-safe. NOT IN can silently return nothing, the inner join finds the opposite set, and the last option is an inner join in disguise.',
        b: 0.5,
        bloom: 'apply',
      },
      {
        id: 'sql02_q2',
        q: 'A SUM of propellant used doubled after adding a join to a table of thruster firings. Why?',
        choices: [
          'The new table has bad data',
          'The join fanned out one row to many, so the summed column was counted once per match',
          'SUM ignores NULLs',
          'The join key is indexed',
        ],
        answer: 1,
        explain:
          'Classic fan-out. Aggregate the many side in a CTE first, then join the aggregate.',
        b: 0.8,
        bloom: 'analyze',
      },
      {
        id: 'sql02_q3',
        q: 'COUNT(*) returns 8640 and COUNT(value) returns 8102 for one channel and day. What does that mean?',
        choices: [
          'The query is wrong',
          '538 rows exist with a NULL value, i.e. recorded samples with no measurement',
          'The channel is sampled at 0.1 Hz',
          'There are 538 duplicate rows',
        ],
        answer: 1,
        explain:
          'COUNT(col) skips NULLs. The difference is a direct measure of missing measurements among present rows.',
        b: 0.4,
        bloom: 'analyze',
      },
      {
        id: 'sql02_q4',
        q: 'Where should a filter on a non-aggregated column go?',
        choices: ['HAVING', 'WHERE', 'Either, they are equivalent', 'ORDER BY'],
        answer: 1,
        explain:
          'WHERE filters before grouping, so fewer rows are aggregated and indexes can be used. HAVING is for conditions on aggregates.',
        b: 0.0,
        bloom: 'apply',
      },
      {
        id: 'sql02_q5',
        q: 'Why is NATURAL JOIN discouraged in production queries?',
        choices: [
          'It is slower',
          'It joins on all same-named columns, so a schema change can silently alter the join condition',
          'It is not supported by PostgreSQL',
          'It cannot use indexes',
        ],
        answer: 1,
        explain:
          'The join key becomes an implicit consequence of column naming, which no reviewer will notice when a column is added.',
        b: 0.6,
        bloom: 'understand',
      },
      {
        id: 'sql02_q6',
        q: 'Which is the best way to count critical and total rows in one pass?',
        choices: [
          'Two separate queries',
          'COUNT(*) FILTER (WHERE status = 3) alongside COUNT(*)',
          'A self-join',
          'A recursive CTE',
        ],
        answer: 1,
        explain:
          'Conditional aggregation with FILTER (or SUM(CASE ...)) computes both in a single scan.',
        b: 0.5,
        bloom: 'apply',
      },
      {
        id: 'sql02_q7',
        q: 'A telemetry report must show hours with no data as explicit zero rows. What produces the missing rows?',
        choices: [
          'COALESCE on the value column',
          'Generating a dense hour series (recursive CTE or generate_series) and LEFT JOINing the data onto it',
          'DISTINCT on the hour column',
          'A FULL OUTER JOIN of the table with itself',
        ],
        answer: 1,
        explain:
          'The rows do not exist in the data, so they must be generated. COALESCE can only fix NULLs in rows that are already present.',
        b: 0.9,
        bloom: 'apply',
      },
    ],
    tags: ['sql', 'data'],
    importance: 1.05,
  },

  {
    id: 'cod_sql_03_windows',
    track: 'coding',
    tier: 2,
    title: 'Window Functions for Telemetry Analytics',
    summary:
      "The single most useful SQL feature for flight data: LAG and LEAD for deltas and gap detection, moving statistics over time-based frames, and gaps-and-islands for finding contiguous runs where a limit was exceeded.",
    prereqs: ['cod_sql_02_joins'],
    hours: 12,
    topics: [
      'OVER (PARTITION BY ... ORDER BY ...) and how a window differs from a group',
      'Ranking: ROW_NUMBER, RANK, DENSE_RANK, NTILE, PERCENT_RANK',
      'Offsets: LAG and LEAD, FIRST_VALUE, LAST_VALUE, NTH_VALUE',
      'Aggregate windows: running totals and moving averages',
      'Frames: ROWS BETWEEN n PRECEDING AND CURRENT ROW versus RANGE BETWEEN an interval',
      'The default frame and the classic LAST_VALUE surprise',
      'Deduplication with ROW_NUMBER filtered to 1',
      'Gaps and islands: detecting contiguous runs',
      'Sessionisation of event streams',
      'DISTINCT ON in PostgreSQL for latest-per-key',
      'Downsampling and binning with date_trunc or time_bucket',
      'When a window function beats a self-join, and when it does not',
    ],
    objectives: [
      'Compute a per-satellite rate of change with LAG and explain the NULL on the first row.',
      'Find every contiguous interval where a limit was exceeded, with start, end and duration.',
      'Downsample a high-rate channel into one-minute buckets with min, max, mean and last.',
      'Explain why LAST_VALUE without an explicit frame returns the current row.',
      'Choose between a ROWS frame and a RANGE frame for irregularly sampled data.',
    ],
    resources: [
      {
        title: 'SQL for Data Analysis',
        author: 'Cathy Tanimura',
        kind: 'book',
        free: false,
        note: 'The strongest treatment of window functions and time-series patterns for exactly this use case.',
      },
      {
        title: 'PostgreSQL documentation: Window Functions',
        author: 'PostgreSQL Global Development Group',
        kind: 'docs',
        url: 'https://www.postgresql.org/docs/current/tutorial-window.html',
        free: true,
      },
      {
        title: 'SQL Cookbook, 2nd ed.',
        author: 'Anthony Molinaro and Robert de Graaf',
        kind: 'book',
        free: false,
      },
    ],
    exercises: [
      {
        id: 'sql03_ex1',
        title: 'Rate of change per satellite',
        prompt:
          'Create a view named `answer` with columns sat_id, ts, value and delta, where delta is the change in value since the previous sample for that same satellite, ordered by sat_id then ts. The first sample of each satellite must have a NULL delta, and deltas must never cross a satellite boundary.',
        kind: 'code',
        lang: 'sql',
        starter: `-- Schema and seed data (do not edit)
DROP TABLE IF EXISTS soc;
CREATE TABLE soc (
    sat_id TEXT NOT NULL,
    ts     TEXT NOT NULL,
    value  REAL NOT NULL
);
INSERT INTO soc VALUES
  ('SAT-001','2026-03-01T00:00:00Z',0.90),
  ('SAT-001','2026-03-01T00:10:00Z',0.85),
  ('SAT-001','2026-03-01T00:20:00Z',0.70),
  ('SAT-002','2026-03-01T00:00:00Z',0.50),
  ('SAT-002','2026-03-01T00:10:00Z',0.55),
  ('SAT-002','2026-03-01T00:20:00Z',0.60);

-- YOUR QUERY: create a view named answer (sat_id, ts, value, delta)
DROP VIEW IF EXISTS answer;
CREATE VIEW answer AS
SELECT sat_id, ts, value, NULL AS delta FROM soc;
`,
        solution: `-- Schema and seed data (do not edit)
DROP TABLE IF EXISTS soc;
CREATE TABLE soc (
    sat_id TEXT NOT NULL,
    ts     TEXT NOT NULL,
    value  REAL NOT NULL
);
INSERT INTO soc VALUES
  ('SAT-001','2026-03-01T00:00:00Z',0.90),
  ('SAT-001','2026-03-01T00:10:00Z',0.85),
  ('SAT-001','2026-03-01T00:20:00Z',0.70),
  ('SAT-002','2026-03-01T00:00:00Z',0.50),
  ('SAT-002','2026-03-01T00:10:00Z',0.55),
  ('SAT-002','2026-03-01T00:20:00Z',0.60);

DROP VIEW IF EXISTS answer;
CREATE VIEW answer AS
SELECT sat_id,
       ts,
       value,
       value - LAG(value) OVER (PARTITION BY sat_id ORDER BY ts) AS delta
FROM soc
ORDER BY sat_id, ts;
`,
        tests: [
          {
            name: 'first row per satellite has NULL delta',
            assert: `DROP TABLE IF EXISTS _chk;
CREATE TEMP TABLE _chk (ok INTEGER, CONSTRAINT first_row_per_sat_is_null CHECK (ok = 1));
INSERT INTO _chk SELECT CASE WHEN (SELECT COUNT(*) FROM answer WHERE delta IS NULL) = 2 THEN 1 ELSE 0 END;
DROP TABLE _chk;`,
          },
          {
            name: 'deltas are partitioned per satellite',
            assert: `DROP TABLE IF EXISTS _chk;
CREATE TEMP TABLE _chk (ok INTEGER, CONSTRAINT deltas_are_per_satellite CHECK (ok = 1));
INSERT INTO _chk SELECT CASE WHEN
  (SELECT ABS(delta + 0.15) < 1e-9 FROM answer WHERE sat_id='SAT-001' AND ts='2026-03-01T00:20:00Z')
  AND (SELECT ABS(delta - 0.05) < 1e-9 FROM answer WHERE sat_id='SAT-002' AND ts='2026-03-01T00:10:00Z')
THEN 1 ELSE 0 END;
DROP TABLE _chk;`,
          },
          {
            name: 'no rows dropped',
            assert: `DROP TABLE IF EXISTS _chk;
CREATE TEMP TABLE _chk (ok INTEGER, CONSTRAINT all_six_rows_present CHECK (ok = 1));
INSERT INTO _chk SELECT CASE WHEN (SELECT COUNT(*) FROM answer) = 6 THEN 1 ELSE 0 END;
DROP TABLE _chk;`,
            hidden: true,
          },
        ],
        hours: 2,
      },
      {
        id: 'sql03_ex2',
        title: 'Gaps and islands: reaction-wheel overspeed runs',
        prompt:
          'Find every contiguous run of samples where rpm exceeded 5000, per satellite, lasting at least 10 seconds. Create a view named `answer` with columns sat_id, t_start, t_end, duration_s and samples, ordered by sat_id then t_start. Use the classic difference-of-row-numbers technique to group consecutive rows, and make sure a run cannot span two satellites.',
        kind: 'code',
        lang: 'sql',
        starter: `-- Schema and seed data (do not edit)
DROP TABLE IF EXISTS wheel;
CREATE TABLE wheel (
    sat_id TEXT NOT NULL,
    t_s    INTEGER NOT NULL,
    rpm    REAL NOT NULL
);
INSERT INTO wheel VALUES
  ('SAT-001', 0, 1000),('SAT-001',10, 5200),('SAT-001',20, 5300),
  ('SAT-001',30, 5400),('SAT-001',40, 1200),('SAT-001',50, 5100),
  ('SAT-001',60, 5050),('SAT-001',70,  900),
  ('SAT-002', 0, 5500),('SAT-002',10, 5600),('SAT-002',20,  100);

-- YOUR QUERY: create a view named answer (sat_id, t_start, t_end, duration_s, samples)
DROP VIEW IF EXISTS answer;
CREATE VIEW answer AS
SELECT sat_id, MIN(t_s) AS t_start, MAX(t_s) AS t_end,
       MAX(t_s) - MIN(t_s) AS duration_s, COUNT(*) AS samples
FROM wheel
WHERE rpm > 5000
GROUP BY sat_id;
`,
        solution: `-- Schema and seed data (do not edit)
DROP TABLE IF EXISTS wheel;
CREATE TABLE wheel (
    sat_id TEXT NOT NULL,
    t_s    INTEGER NOT NULL,
    rpm    REAL NOT NULL
);
INSERT INTO wheel VALUES
  ('SAT-001', 0, 1000),('SAT-001',10, 5200),('SAT-001',20, 5300),
  ('SAT-001',30, 5400),('SAT-001',40, 1200),('SAT-001',50, 5100),
  ('SAT-001',60, 5050),('SAT-001',70,  900),
  ('SAT-002', 0, 5500),('SAT-002',10, 5600),('SAT-002',20,  100);

DROP VIEW IF EXISTS answer;
CREATE VIEW answer AS
WITH flagged AS (
    SELECT sat_id, t_s, rpm,
           CASE WHEN rpm > 5000 THEN 1 ELSE 0 END AS over
    FROM wheel
),
grouped AS (
    SELECT sat_id, t_s, over,
           ROW_NUMBER() OVER (PARTITION BY sat_id ORDER BY t_s)
         - ROW_NUMBER() OVER (PARTITION BY sat_id, over ORDER BY t_s) AS grp
    FROM flagged
)
SELECT sat_id,
       MIN(t_s) AS t_start,
       MAX(t_s) AS t_end,
       MAX(t_s) - MIN(t_s) AS duration_s,
       COUNT(*) AS samples
FROM grouped
WHERE over = 1
GROUP BY sat_id, grp
HAVING MAX(t_s) - MIN(t_s) >= 10
ORDER BY sat_id, t_start;
`,
        tests: [
          {
            name: 'three qualifying runs',
            assert: `DROP TABLE IF EXISTS _chk;
CREATE TEMP TABLE _chk (ok INTEGER, CONSTRAINT three_islands_found CHECK (ok = 1));
INSERT INTO _chk SELECT CASE WHEN (SELECT COUNT(*) FROM answer) = 3 THEN 1 ELSE 0 END;
DROP TABLE _chk;`,
          },
          {
            name: 'first run spans 10 to 30 seconds',
            assert: `DROP TABLE IF EXISTS _chk;
CREATE TEMP TABLE _chk (ok INTEGER, CONSTRAINT first_island_is_10_to_30 CHECK (ok = 1));
INSERT INTO _chk SELECT CASE WHEN
  (SELECT t_start = 10 AND t_end = 30 AND duration_s = 20 AND samples = 3
     FROM answer WHERE sat_id = 'SAT-001' ORDER BY t_start LIMIT 1)
THEN 1 ELSE 0 END;
DROP TABLE _chk;`,
          },
          {
            name: 'runs do not cross satellites',
            assert: `DROP TABLE IF EXISTS _chk;
CREATE TEMP TABLE _chk (ok INTEGER, CONSTRAINT runs_do_not_cross_satellites CHECK (ok = 1));
INSERT INTO _chk SELECT CASE WHEN
  (SELECT COUNT(*) FROM answer WHERE sat_id = 'SAT-002') = 1
  AND (SELECT t_start = 0 AND t_end = 10 FROM answer WHERE sat_id = 'SAT-002')
THEN 1 ELSE 0 END;
DROP TABLE _chk;`,
            hidden: true,
          },
        ],
        hours: 3,
      },
    ],
    cards: [
      {
        id: 'sql03_c1',
        front: 'Window function versus GROUP BY',
        back:
          'GROUP BY collapses rows into one per group; a window function computes across a set of rows while keeping every row. That is why you can show a sample and its running average side by side.',
      },
      {
        id: 'sql03_c2',
        front: 'What does LAG give you, and what is in the first row?',
        back:
          'The value from the previous row in the window ordering, or NULL when there is none. Partitioning by satellite means the first row of each satellite is NULL, which is correct and must be handled downstream.',
      },
      {
        id: 'sql03_c3',
        front: 'Why does LAST_VALUE without a frame return the current row?',
        back:
          'The default frame with ORDER BY is RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW, so the last row seen so far is the current one. Specify ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING to mean the last row of the partition.',
      },
      {
        id: 'sql03_c4',
        front: 'ROWS frame versus RANGE frame',
        back:
          'ROWS counts a fixed number of neighbouring rows; RANGE spans a value interval of the ORDER BY column, for example five minutes of time. For irregularly sampled telemetry, ROWS gives an inconsistent time window and RANGE gives a consistent one.',
      },
      {
        id: 'sql03_c5',
        front: 'Explain gaps and islands',
        back:
          'Finding contiguous runs of rows satisfying a condition. The classic trick is the difference between a row number over all rows and a row number over the flagged subset: within a run that difference is constant, so grouping by it isolates each island.',
      },
      {
        id: 'sql03_c6',
        front: 'Deduplicating with ROW_NUMBER',
        back:
          'Number rows within each key by a preference order, then keep the rows numbered 1. It is the standard way to take the latest reading per satellite per channel when duplicate downlinks exist.',
      },
      {
        id: 'sql03_c7',
        front: 'RANK versus DENSE_RANK versus ROW_NUMBER',
        back:
          'ROW_NUMBER is always distinct; RANK leaves gaps after ties (1,1,3); DENSE_RANK does not (1,1,2). For deduplication you want ROW_NUMBER, because ties must still resolve to one row.',
      },
      {
        id: 'sql03_c8',
        front: 'How do you detect a telemetry gap purely in SQL?',
        back:
          'Compute the time difference to the previous sample with LAG and flag rows whose gap exceeds a threshold, or left-join against a generated dense time series. The first finds gaps between present samples; the second also finds a leading or trailing absence.',
      },
      {
        id: 'sql03_c9',
        front: 'Downsampling 10 Hz data to one-minute buckets: what do you keep?',
        back:
          'Minimum, maximum, mean and the last value per bucket, not just the mean. Keeping the extremes is what stops a downsampled plot from hiding a transient excursion.',
      },
      {
        id: 'sql03_c10',
        front: 'What is DISTINCT ON in PostgreSQL?',
        back:
          'A shorthand for the first row per key under a given ORDER BY, which is the latest-per-satellite query in one clause. It is not standard SQL, so the window-function form is the portable equivalent.',
      },
      {
        id: 'sql03_c11',
        front: 'When does a window function beat a self-join?',
        back:
          'Nearly always for previous or next row, running totals and rankings: one pass over the ordered data instead of a join that may be quadratic. A self-join stays useful when the pairing rule is not an ordering.',
      },
      {
        id: 'sql03_c12',
        front: 'Can you use a window function in a WHERE clause?',
        back:
          'No: windows are evaluated after WHERE, in the SELECT stage. Compute it in a subquery or a CTE and filter on the result in the outer query, which is exactly the shape of the deduplication pattern.',
      },
    ],
    quiz: [
      {
        id: 'sql03_q1',
        q: 'Which expression gives each row minus the previous row, per satellite?',
        choices: [
          'value - LAG(value) OVER (ORDER BY ts)',
          'value - LAG(value) OVER (PARTITION BY sat_id ORDER BY ts)',
          'value - MIN(value) OVER (PARTITION BY sat_id)',
          'value - LEAD(value) OVER (PARTITION BY sat_id ORDER BY ts)',
        ],
        answer: 1,
        explain:
          'Without the partition, the delta crosses satellite boundaries. LEAD looks forward, which is the next sample, not the previous one.',
        b: 0.1,
        bloom: 'apply',
      },
      {
        id: 'sql03_q2',
        q: 'LAST_VALUE(v) OVER (PARTITION BY k ORDER BY t) returns the current row value. Why?',
        choices: [
          'A bug in the engine',
          'The default frame ends at the current row, so the last row seen is the current one',
          'LAST_VALUE requires DESC ordering',
          'The partition is wrong',
        ],
        answer: 1,
        explain:
          'Add ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING to reach the end of the partition. This is the most frequently reported window-function surprise.',
        b: 1.0,
        bloom: 'analyze',
      },
      {
        id: 'sql03_q3',
        q: 'For a five-minute moving average over irregularly sampled telemetry, which frame is correct?',
        choices: [
          'ROWS BETWEEN 300 PRECEDING AND CURRENT ROW',
          'RANGE BETWEEN INTERVAL 5 MINUTE PRECEDING AND CURRENT ROW',
          'ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW',
          'No frame is needed',
        ],
        answer: 1,
        explain:
          'A ROWS frame counts samples, so its time span varies with the sampling rate. A RANGE frame over the time column spans a fixed duration regardless of how many samples fall in it.',
        b: 0.9,
        bloom: 'apply',
      },
      {
        id: 'sql03_q4',
        q: 'Which technique isolates contiguous runs of a condition?',
        choices: [
          'GROUP BY the condition',
          'The difference between ROW_NUMBER over all rows and ROW_NUMBER over the flagged subset',
          'DISTINCT on the timestamp',
          'A recursive CTE over every row',
        ],
        answer: 1,
        explain:
          'Within a run both row numbers advance together, so their difference is constant and can be grouped on. This is the gaps-and-islands idiom.',
        b: 1.1,
        bloom: 'apply',
      },
      {
        id: 'sql03_q5',
        q: 'You need the latest reading per satellite per channel from a table with duplicate downlinks. Which is portable and correct?',
        choices: [
          'DISTINCT ON (sat_id, channel)',
          'ROW_NUMBER() OVER (PARTITION BY sat_id, channel ORDER BY ts DESC) in a CTE, filtered to 1',
          'GROUP BY sat_id, channel with MAX(value)',
          'SELECT DISTINCT sat_id, channel, value',
        ],
        answer: 1,
        explain:
          'MAX(value) gives the largest value, not the latest. DISTINCT ON is PostgreSQL-specific, and plain DISTINCT does not pick a row.',
        b: 0.7,
        bloom: 'apply',
      },
      {
        id: 'sql03_q6',
        q: 'Can a window function appear in WHERE?',
        choices: [
          'Yes',
          'No, because windows are computed after WHERE; wrap it in a CTE and filter outside',
          'Only with PARTITION BY',
          'Only in PostgreSQL',
        ],
        answer: 1,
        explain:
          'The logical evaluation order puts window computation in the SELECT stage, after filtering and grouping.',
        b: 0.6,
        bloom: 'understand',
      },
      {
        id: 'sql03_q7',
        q: 'Downsampling 10 Hz data to one-minute buckets, why keep min and max as well as the mean?',
        choices: [
          'To save storage',
          'Because averaging alone hides short excursions that are exactly what a reviewer is looking for',
          'Because mean is undefined for gaps',
          'To satisfy the frame clause',
        ],
        answer: 1,
        explain:
          'A one-second spike vanishes in a sixty-second mean. Min and max per bucket preserve the extremes at negligible extra cost.',
        b: 0.5,
        bloom: 'understand',
      },
    ],
    tags: ['sql', 'data'],
    importance: 1.1,
  },

  {
    id: 'cod_sql_04_schema',
    track: 'coding',
    tier: 3,
    title: 'Schema Design, Indexes and the Telemetry Data Lifecycle',
    summary:
      "Designing storage for six thousand satellites: keys and constraints, B-tree and BRIN indexes, SARGable predicates, EXPLAIN plans, time partitioning, and how the vehicle-to-report chain actually runs at a launch company.",
    prereqs: ['cod_sql_03_windows'],
    hours: 14,
    topics: [
      'Normalisation to third normal form and deliberate denormalisation for analytics',
      'Star and snowflake schemas; surrogate versus natural keys',
      'Constraints: NOT NULL, UNIQUE, CHECK, foreign keys with ON DELETE',
      'Transactions and ACID; isolation levels; deadlocks',
      'Index types: B-tree, hash, GIN and GiST, and BRIN for append-only time-ordered data',
      'Composite indexes and the left-prefix rule; covering indexes and index-only scans',
      'Partial indexes; why a low-cardinality index is usually useless',
      'Index maintenance cost on a write-heavy ingest path',
      'EXPLAIN and EXPLAIN ANALYZE: sequential versus index versus bitmap heap scan; nested loop versus hash versus merge join',
      'Estimated versus actual rows as the tell for stale statistics',
      'SARGability: why wrapping an indexed column in a function kills the index',
      'Range partitioning by time; clustering; materialised views and continuous aggregates',
      'Columnar storage and Parquet; batch versus streaming ingest',
      'Upserts and idempotent ingest for duplicated downlink frames',
      'The telemetry lifecycle: vehicle, downlink, decommutation, time-series store, analysis, report',
      'Time-series stores: InfluxDB, TimescaleDB, ClickHouse; the reported Starlink stack of Kafka, HBase, HDFS on Docker and Kubernetes',
      'Data quality: gap detection, out-of-order packets, vehicle-to-ground clock skew, duplicate frames',
      'Export control and retention for flight data; reproducibility of every published plot',
    ],
    objectives: [
      'Design a telemetry table with the right key, constraints and indexes for a stated query pattern.',
      'Decide which of three predicates a composite index can serve, using the left-prefix rule.',
      'Rewrite a non-SARGable predicate into an index-friendly half-open range.',
      'Read an EXPLAIN plan and identify a stale-statistics or missing-index problem.',
      'Sketch storage and partitioning for 10 Hz data from six thousand satellites over two years.',
    ],
    resources: [
      {
        title: 'Use The Index, Luke!',
        author: 'Markus Winand',
        kind: 'site',
        url: 'https://use-the-index-luke.com/',
        free: true,
        note: 'Free web edition of SQL Performance Explained; the clearest explanation of composite indexes and SARGability anywhere.',
      },
      {
        title: 'PostgreSQL documentation: Indexes and Using EXPLAIN',
        author: 'PostgreSQL Global Development Group',
        kind: 'docs',
        url: 'https://www.postgresql.org/docs/current/indexes.html',
        free: true,
      },
      {
        title: 'Database Design for Mere Mortals, 4th ed.',
        author: 'Michael J. Hernandez',
        kind: 'book',
        free: false,
      },
      {
        title: 'TimescaleDB documentation: hypertables and continuous aggregates',
        author: 'Timescale',
        kind: 'docs',
        url: 'https://docs.timescale.com/',
        free: true,
      },
    ],
    exercises: [
      {
        id: 'sql04_ex1',
        title: 'Design the packet table',
        prompt:
          'Create a table `packet` holding one measurement per satellite, timestamp and channel, such that: a repeated downlink of the same (sat_id, ts, channel) cannot create a duplicate row, quality is constrained to 0 through 3, and lookups by satellite over a time range are index-supported. Then demonstrate idempotent ingest by re-inserting an existing key with ON CONFLICT DO UPDATE so the row is replaced rather than duplicated.',
        kind: 'code',
        lang: 'sql',
        starter: `-- YOUR SCHEMA: create table packet with the right key, CHECK and indexes,
-- then insert two rows and re-ingest one of them idempotently.
DROP TABLE IF EXISTS packet;
CREATE TABLE packet (
    sat_id  TEXT NOT NULL,
    ts      TEXT NOT NULL,
    channel TEXT NOT NULL,
    value   REAL NOT NULL,
    quality INTEGER NOT NULL DEFAULT 0
);
`,
        solution: `DROP TABLE IF EXISTS packet;
CREATE TABLE packet (
    sat_id     TEXT    NOT NULL,
    ts         TEXT    NOT NULL,
    channel    TEXT    NOT NULL,
    value      REAL    NOT NULL,
    quality    INTEGER NOT NULL DEFAULT 0 CHECK (quality BETWEEN 0 AND 3),
    PRIMARY KEY (sat_id, ts, channel)
);
CREATE INDEX idx_packet_sat_ts ON packet (sat_id, ts);
CREATE INDEX idx_packet_channel_ts ON packet (channel, ts);

INSERT INTO packet (sat_id, ts, channel, value, quality) VALUES
  ('SAT-001','2026-03-01T00:00:00Z','BUS_TEMP', 20.0, 0),
  ('SAT-001','2026-03-01T00:01:00Z','BUS_TEMP', 20.5, 0);

-- Idempotent re-ingest of a duplicated downlink frame.
INSERT INTO packet (sat_id, ts, channel, value, quality) VALUES
  ('SAT-001','2026-03-01T00:00:00Z','BUS_TEMP', 99.0, 1)
ON CONFLICT (sat_id, ts, channel) DO UPDATE SET value = excluded.value, quality = excluded.quality;
`,
        tests: [
          {
            name: 'an index leads with sat_id',
            assert: `DROP TABLE IF EXISTS _chk;
CREATE TEMP TABLE _chk (ok INTEGER, CONSTRAINT composite_index_exists CHECK (ok = 1));
INSERT INTO _chk SELECT CASE WHEN (
  SELECT COUNT(*) FROM pragma_index_list('packet') AS il
  JOIN pragma_index_info(il.name) AS ii
  WHERE ii.seqno = 0 AND ii.name = 'sat_id'
) >= 1 THEN 1 ELSE 0 END;
DROP TABLE _chk;`,
          },
          {
            name: 're-ingest updates rather than duplicates',
            assert: `DROP TABLE IF EXISTS _chk;
CREATE TEMP TABLE _chk (ok INTEGER, CONSTRAINT upsert_deduplicated CHECK (ok = 1));
INSERT INTO _chk SELECT CASE WHEN
  (SELECT COUNT(*) FROM packet) = 2
  AND (SELECT ABS(value - 99.0) < 1e-9 FROM packet
        WHERE sat_id='SAT-001' AND ts='2026-03-01T00:00:00Z' AND channel='BUS_TEMP')
THEN 1 ELSE 0 END;
DROP TABLE _chk;`,
          },
          {
            name: 'quality is constrained',
            assert: `DROP TABLE IF EXISTS _chk;
CREATE TEMP TABLE _chk (ok INTEGER, CONSTRAINT quality_check_declared CHECK (ok = 1));
INSERT INTO _chk SELECT CASE WHEN
  (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='packet'
     AND sql LIKE '%CHECK%quality%') = 1
THEN 1 ELSE 0 END;
DROP TABLE _chk;`,
            hidden: true,
          },
        ],
        hours: 2.5,
      },
      {
        id: 'sql04_ex2',
        title: 'Make the predicate SARGable',
        prompt:
          'The event_log table has an index on (sat_id, ts). A colleague wrote WHERE sat_id = ... AND substr(ts,1,10) = 2026-03-02, which cannot use the index because the indexed column is wrapped in a function. Create a view named `answer` returning sat_id, ts and kind for SAT-001 on 2026-03-02 using a half-open range on ts instead, ordered by ts. The boundary at midnight on the second must be included and the boundary at midnight on the third must not.',
        kind: 'code',
        lang: 'sql',
        starter: `-- Schema and seed data (do not edit)
DROP TABLE IF EXISTS event_log;
CREATE TABLE event_log (
    sat_id TEXT NOT NULL,
    ts     TEXT NOT NULL,
    kind   TEXT NOT NULL
);
CREATE INDEX idx_event_sat_ts ON event_log (sat_id, ts);
INSERT INTO event_log VALUES
  ('SAT-001','2026-03-01T23:59:59Z','BURN'),
  ('SAT-001','2026-03-02T00:00:00Z','BURN'),
  ('SAT-001','2026-03-02T12:00:00Z','SAFE_MODE'),
  ('SAT-001','2026-03-02T23:59:59Z','BURN'),
  ('SAT-001','2026-03-03T00:00:00Z','BURN'),
  ('SAT-002','2026-03-02T05:00:00Z','BURN');

-- YOUR QUERY: create a view named answer (sat_id, ts, kind) using a range, not a function on ts
DROP VIEW IF EXISTS answer;
CREATE VIEW answer AS
SELECT sat_id, ts, kind FROM event_log
WHERE sat_id = 'SAT-001' AND substr(ts, 1, 10) = '2026-03-02';
`,
        solution: `-- Schema and seed data (do not edit)
DROP TABLE IF EXISTS event_log;
CREATE TABLE event_log (
    sat_id TEXT NOT NULL,
    ts     TEXT NOT NULL,
    kind   TEXT NOT NULL
);
CREATE INDEX idx_event_sat_ts ON event_log (sat_id, ts);
INSERT INTO event_log VALUES
  ('SAT-001','2026-03-01T23:59:59Z','BURN'),
  ('SAT-001','2026-03-02T00:00:00Z','BURN'),
  ('SAT-001','2026-03-02T12:00:00Z','SAFE_MODE'),
  ('SAT-001','2026-03-02T23:59:59Z','BURN'),
  ('SAT-001','2026-03-03T00:00:00Z','BURN'),
  ('SAT-002','2026-03-02T05:00:00Z','BURN');

DROP VIEW IF EXISTS answer;
CREATE VIEW answer AS
SELECT sat_id, ts, kind
FROM event_log
WHERE sat_id = 'SAT-001'
  AND ts >= '2026-03-02T00:00:00Z'
  AND ts <  '2026-03-03T00:00:00Z'
ORDER BY ts;
`,
        tests: [
          {
            name: 'three events on that day',
            assert: `DROP TABLE IF EXISTS _chk;
CREATE TEMP TABLE _chk (ok INTEGER, CONSTRAINT three_events_on_that_day CHECK (ok = 1));
INSERT INTO _chk SELECT CASE WHEN (SELECT COUNT(*) FROM answer) = 3 THEN 1 ELSE 0 END;
DROP TABLE _chk;`,
          },
          {
            name: 'half-open boundaries and satellite filter',
            assert: `DROP TABLE IF EXISTS _chk;
CREATE TEMP TABLE _chk (ok INTEGER, CONSTRAINT boundaries_half_open CHECK (ok = 1));
INSERT INTO _chk SELECT CASE WHEN
  (SELECT COUNT(*) FROM answer WHERE ts = '2026-03-02T00:00:00Z') = 1
  AND (SELECT COUNT(*) FROM answer WHERE ts = '2026-03-03T00:00:00Z') = 0
  AND (SELECT COUNT(*) FROM answer WHERE sat_id <> 'SAT-001') = 0
THEN 1 ELSE 0 END;
DROP TABLE _chk;`,
          },
          {
            name: 'the predicate is SARGable and the index survives',
            assert: `DROP TABLE IF EXISTS _chk;
CREATE TEMP TABLE _chk (ok INTEGER, CONSTRAINT predicate_is_sargable CHECK (ok = 1));
INSERT INTO _chk SELECT CASE WHEN
  (SELECT COUNT(*) FROM sqlite_master WHERE type = 'view' AND name = 'answer'
     AND sql NOT LIKE '%substr(%ts%' AND sql LIKE '%ts >=%' AND sql LIKE '%ts <%') = 1
  AND (SELECT COUNT(*) FROM pragma_index_list('event_log') WHERE name = 'idx_event_sat_ts') = 1
THEN 1 ELSE 0 END;
DROP TABLE _chk;`,
            hidden: true,
          },
        ],
        hours: 2,
      },
    ],
    cards: [
      {
        id: 'sql04_c1',
        front: 'The left-prefix rule',
        back:
          'A composite index on (a, b) can serve predicates on a, and on a plus b, but not on b alone, because the index is sorted by a first. Order the columns by how they are queried, with equality columns before range columns.',
      },
      {
        id: 'sql04_c2',
        front: 'Given INDEX(sat_id, ts), which predicates use it: ts > x, sat_id = 5, sat_id = 5 AND ts > x?',
        back:
          'sat_id = 5 uses it; sat_id = 5 AND ts > x uses it best, as an equality seek followed by a range scan; ts > x alone cannot use it as a seek, though an index-only scan may still be chosen for a narrow query.',
      },
      {
        id: 'sql04_c3',
        front: 'What is SARGability?',
        back:
          'Whether a predicate can be answered by seeking in an index. Wrapping the indexed column in a function or an arithmetic expression destroys it. Rewrite as a range on the raw column, or build an index on the expression.',
      },
      {
        id: 'sql04_c4',
        front: 'Why does adding an index slow ingest by 40 percent?',
        back:
          'Every insert must also maintain each index, which costs a page write, possible page splits and extra WAL. On a write-heavy telemetry path, indexes are paid for on every row and read back only sometimes.',
      },
      {
        id: 'sql04_c5',
        front: 'When is a BRIN index the right choice?',
        back:
          'On a large append-only table whose physical order correlates with the column, which is exactly time-ordered telemetry. It stores a summary per block range, so it is tiny compared with a B-tree and excellent for wide time-range scans.',
      },
      {
        id: 'sql04_c6',
        front: 'In EXPLAIN ANALYZE, what does a large gap between estimated and actual rows indicate?',
        back:
          'Stale or insufficient statistics, or a correlation the planner cannot see. It is the usual root cause of a bad join order or a nested loop chosen where a hash join was needed.',
      },
      {
        id: 'sql04_c7',
        front: 'Nested loop versus hash versus merge join',
        back:
          'Nested loop wins when the outer side is tiny and the inner side is indexed; hash join wins for large unsorted inputs with an equality condition; merge join wins when both inputs are already sorted on the key. The planner picks from its row estimates.',
      },
      {
        id: 'sql04_c8',
        front: 'Why is an index on a low-cardinality column usually useless?',
        back:
          'If a value matches a large fraction of the table, following the index costs more random I/O than simply scanning. Partial indexes on the rare value are the useful variant.',
      },
      {
        id: 'sql04_c9',
        front: 'How do you store 10 Hz data from 6000 satellites for two years?',
        back:
          'Roughly 3.8e12 samples, so: narrow rows or columnar storage, range partitioning by time (daily or weekly), compression on older partitions, continuous aggregates for the common queries, a short hot window in a row store and the archive in Parquet on object storage.',
      },
      {
        id: 'sql04_c10',
        front: 'What makes telemetry ingest idempotent?',
        back:
          'A natural key of satellite, timestamp and channel with a unique constraint plus an upsert. A duplicated downlink frame then updates rather than duplicating, which matters because replays and retransmissions are routine.',
      },
      {
        id: 'sql04_c11',
        front: 'What is a continuous aggregate or materialised view for?',
        back:
          'Precomputing the per-minute or per-hour rollups that dashboards ask for, so a query touches thousands of rows instead of billions. The cost is refresh logic and a lag window you must state on the dashboard.',
      },
      {
        id: 'sql04_c12',
        front: 'Name four telemetry data-quality problems SQL has to cope with',
        back:
          'Gaps from lost downlink, out-of-order packets, duplicate frames from retransmission, and clock skew between vehicle and ground. Each needs an explicit rule, and each is visible as a specific query.',
      },
      {
        id: 'sql04_c13',
        front: 'What is the reported Starlink telemetry stack?',
        back:
          'A .NET service layer with Kafka for ingest, HBase and HDFS for storage, running on Docker and Kubernetes. Related SpaceX data roles list PostgreSQL, CockroachDB, Hive and Delta Lake, with Grafana, Jupyter, Metabase and PowerBI for exploration.',
      },
      {
        id: 'sql04_c14',
        front: 'Why must every published plot be traceable to a query and a data version?',
        back:
          'Because an anomaly investigation may reopen the analysis years later and must be able to reproduce it exactly. A plot whose provenance is a notebook someone ran once is not evidence.',
      },
    ],
    quiz: [
      {
        id: 'sql04_q1',
        q: 'With INDEX(sat_id, ts), which predicate can the index seek on?',
        choices: [
          'WHERE ts > x',
          'WHERE sat_id = 5 AND ts > x',
          'WHERE substr(ts,1,10) = y',
          'WHERE value > 10',
        ],
        answer: 1,
        explain:
          'Equality on the leading column then a range on the second is the ideal composite-index access. A predicate on ts alone cannot seek, and wrapping ts in substr makes it non-SARGable.',
        b: 0.6,
        bloom: 'apply',
      },
      {
        id: 'sql04_q2',
        q: 'Rewriting WHERE date_trunc(day, ts) = DATE 2026-03-02 as a half-open range achieves what?',
        choices: [
          'A different result set',
          'The same rows, but the predicate becomes SARGable so the index on ts can be used',
          'Better precision',
          'Nothing; the planner rewrites it anyway',
        ],
        answer: 1,
        explain:
          'A function on the indexed column blocks a seek unless an expression index exists. The half-open range is equivalent and index-friendly.',
        b: 0.7,
        bloom: 'apply',
      },
      {
        id: 'sql04_q3',
        q: 'Ingest throughput dropped 40 percent after a new index. The best response is:',
        choices: [
          'Drop all indexes',
          'Decide whether the read pattern that index serves is worth the per-row write cost, and consider a partial or BRIN index instead',
          'Increase shared memory',
          'Switch to a NoSQL store',
        ],
        answer: 1,
        explain:
          'Indexes are a read-write trade. On append-only time-ordered data a BRIN index costs almost nothing to maintain and still serves range scans.',
        b: 0.8,
        bloom: 'analyze',
      },
      {
        id: 'sql04_q4',
        q: 'EXPLAIN ANALYZE shows estimated rows 12 and actual rows 2,400,000 on a nested loop. What is wrong?',
        choices: [
          'The index is corrupt',
          'The planner row estimate is badly wrong, so it chose a nested loop that now executes millions of inner lookups; refresh statistics or fix the correlation it cannot see',
          'The query needs a LIMIT',
          'Nested loops are always wrong',
        ],
        answer: 1,
        explain:
          'The estimate-versus-actual gap is the diagnostic. With a correct estimate the planner would have chosen a hash join.',
        b: 1.1,
        bloom: 'analyze',
      },
      {
        id: 'sql04_q5',
        q: 'Which storage approach fits 10 Hz telemetry from 6000 satellites over two years?',
        choices: [
          'One unpartitioned table with a B-tree on every column',
          'Time-range partitioning, compression on older partitions, continuous aggregates for dashboards and columnar archive files',
          'A single JSON document per satellite',
          'In-memory only',
        ],
        answer: 1,
        explain:
          'That is on the order of 4e12 samples. Partitioning makes retention and pruning cheap, aggregates make dashboards cheap, and columnar archives make the long tail affordable.',
        b: 0.9,
        bloom: 'apply',
      },
      {
        id: 'sql04_q6',
        q: 'How do you make ingest tolerate a retransmitted downlink frame?',
        choices: [
          'Deduplicate in the dashboard',
          'Declare a unique key on (sat_id, ts, channel) and upsert with ON CONFLICT DO UPDATE',
          'Use SELECT DISTINCT in every query',
          'Drop the primary key',
        ],
        answer: 1,
        explain:
          'Idempotency belongs at the write path. Pushing it to every reader is both slower and easy to forget.',
        b: 0.5,
        bloom: 'apply',
      },
      {
        id: 'sql04_q7',
        q: 'Why is TIMESTAMPTZ non-negotiable for flight data?',
        choices: [
          'It is faster to index',
          'It records an unambiguous absolute instant, so data from ground stations in different zones and across daylight-saving changes remains comparable',
          'It stores nanoseconds',
          'It is required by SQL standard',
        ],
        answer: 1,
        explain:
          'A zone-naive timestamp from a station that changed offset is unrecoverable. Storing UTC in a zone-aware type removes the ambiguity at the source.',
        b: 0.6,
        bloom: 'understand',
      },
      {
        id: 'sql04_q8',
        q: 'A dashboard query over two years of raw samples takes four minutes. What is the structural fix?',
        choices: [
          'Add more indexes on the raw table',
          'Precompute rollups as continuous aggregates or materialised views and query those, with a stated refresh lag',
          'Increase the statement timeout',
          'Move to a faster disk',
        ],
        answer: 1,
        explain:
          'No index makes scanning billions of rows interactive. Reducing how many rows the query touches is the only structural answer.',
        b: 0.7,
        bloom: 'analyze',
      },
    ],
    tags: ['sql', 'data'],
    importance: 1.0,
  },

  /* ══ CAD ═════════════════════════════════════════════════════════════════ */
  {
    id: 'cod_cad_01_drawings',
    track: 'coding',
    tier: 0,
    title: 'Engineering Drawing Literacy',
    summary:
      "CAD is not on the GNC critical path, and this track budgets it accordingly. Its value is cross-discipline literacy: reading a drawing, knowing why a gimbal tolerance matters to a control loop, and talking to structures engineers. Learn to read before you learn to draw.",
    prereqs: [],
    hours: 15,
    topics: [
      'Orthographic projection; third-angle (US) versus first-angle (ISO) and the symbol that identifies which',
      'Views: front, top, right, auxiliary, section (full, half, offset, broken-out), detail, isometric',
      'Line types: visible, hidden, centre, phantom, section; line weights',
      'Scales and their notation',
      'Title block, revision block, revision letters and change bars',
      'The drawing as the legal definition of the part',
      'Bills of material, item balloons and find numbers',
      'General notes and flag notes',
      'Surface finish symbols; weld symbols',
      'Tolerances: limit, plus/minus, bilateral and unilateral',
      'Tolerance stack-up: worst case versus root-sum-square',
      'Fits: clearance, transition, interference',
      'Fastener and thread callouts; materials and specifications',
      'ASME Y14.100 drawing practices, Y14.24 drawing types, Y14.41 model-based definition',
      'Export-control markings on aerospace drawings',
    ],
    objectives: [
      'Identify the projection convention, the datums and the tightest tolerance on an unfamiliar drawing.',
      'Explain what would cause a part to be rejected at inspection, from the drawing alone.',
      'Compute a worst-case and a root-sum-square stack-up for a four-part assembly.',
      'Explain why a revision letter matters for a flight part.',
      'Say what model-based definition changes about where the authoritative definition lives.',
    ],
    resources: [
      {
        title: 'Engineering Drawing and Design',
        author: 'David A. Madsen and David P. Madsen',
        kind: 'book',
        free: false,
      },
      {
        title: 'ASME Y14.100 Engineering Drawing Practices',
        author: 'ASME',
        kind: 'docs',
        url: 'https://www.asme.org/codes-standards',
        free: false,
        note: 'The umbrella US drawing standard; Y14.24 covers drawing types and Y14.41 covers model-based definition.',
      },
      {
        title: 'Machinery Handbook, 32nd ed.',
        author: 'Erik Oberg et al.',
        kind: 'book',
        free: false,
        note: 'A lookup reference for fits, threads and materials rather than a book to read.',
      },
    ],
    exercises: [
      {
        id: 'cad01_ex1',
        title: 'Read a real drawing cold',
        prompt:
          'Take a published aerospace bracket drawing you have not seen. Without help, write down: the projection convention and the symbol that told you; every view present and why it exists; the datum scheme; the three tightest dimensions; the material and finish specification; the revision letter and what the change bars indicate. Then state two things that would cause the part to be rejected at inspection.',
        kind: 'reading',
        hours: 3,
      },
      {
        id: 'cad01_ex2',
        title: 'Stack-up for a star-tracker mount',
        prompt:
          'A star tracker mounts through four stacked parts, each with a plus or minus tolerance on the dimension along the boresight and on the tilt. Compute the worst-case and the root-sum-square stack-up of the resulting boresight misalignment. Then state what that misalignment means for attitude-knowledge error, and which of the two numbers you would quote in a requirements document and why.',
        kind: 'derivation',
        hours: 3,
      },
    ],
    cards: [
      {
        id: 'cad01_c1',
        front: 'Third-angle versus first-angle projection',
        back:
          'Third angle (US practice) places each view on the side of the object you look from; first angle (ISO/European) places it on the opposite side. The truncated-cone symbol in the title block tells you which, and misreading it mirrors your understanding of the part.',
      },
      {
        id: 'cad01_c2',
        front: 'Why is the drawing the legal definition of the part?',
        back:
          'It is the controlled document that inspection, procurement and the supplier are contractually bound to. A CAD model that disagrees with the released drawing does not win; under model-based definition the annotated model becomes that controlled document instead.',
      },
      {
        id: 'cad01_c3',
        front: 'What does a revision letter mean for a flight part?',
        back:
          'That a specific configuration was released and built. Hardware is traceable to a revision, so as-designed, as-built and as-flown can differ, and an anomaly investigation starts by establishing which revision actually flew.',
      },
      {
        id: 'cad01_c4',
        front: 'Worst-case versus root-sum-square stack-up',
        back:
          'Worst case adds all tolerances assuming every part is at its extreme simultaneously: safe but often unbuildably tight. RSS takes the square root of the sum of squares, assuming independent, roughly normal variation: realistic for many parts, optimistic for few. Quote worst case for safety-critical interfaces.',
        formula: true,
      },
      {
        id: 'cad01_c5',
        front: 'Why does a GNC engineer care about tolerance stack-up?',
        back:
          'Because it sets alignment error budgets: thruster and gimbal misalignment becomes a disturbance torque and a control-authority loss, and star-tracker to body misalignment becomes attitude-knowledge error that no filter can remove.',
      },
      {
        id: 'cad01_c6',
        front: 'Hidden, centre and phantom lines',
        back:
          'Hidden (dashed) shows edges behind the surface; centre (long-short-long) marks axes and symmetry; phantom (long-short-short-long) shows alternate positions, adjacent parts or repeat features. Reading them wrong changes what you think the geometry is.',
      },
      {
        id: 'cad01_c7',
        front: 'What is a section view for, and what is a broken-out section?',
        back:
          'A cut through the part to show internal geometry, with the cut faces hatched. A broken-out section removes only a local region, which is how a drawing shows one internal feature without cutting the whole part.',
      },
      {
        id: 'cad01_c8',
        front: 'Clearance, transition and interference fit',
        back:
          'Clearance always leaves a gap; interference always requires force or thermal assembly; transition can be either depending on where within tolerance the two parts land. The fit class is a design decision about assembly and load transfer, not a leftover.',
      },
      {
        id: 'cad01_c9',
        front: 'What is model-based definition (ASME Y14.41)?',
        back:
          'The annotated 3D model, carrying product and manufacturing information, is the authoritative deliverable rather than a 2D drawing. Aerospace is moving this way, and it is why PMI annotation appears in NX and SolidWorks workflows.',
      },
      {
        id: 'cad01_c10',
        front: 'What do item balloons and find numbers do?',
        back:
          'They tie each component in an assembly view to a line in the bill of material, so procurement, the shop floor and the inspector all refer to the same item. It is the drawing equivalent of a stable identifier.',
      },
      {
        id: 'cad01_c11',
        front: 'Why do aerospace drawings carry export-control markings?',
        back:
          'Launch-vehicle and satellite hardware is controlled under ITAR or EAR, so the drawing itself is controlled technical data. Handling, storage and who may view it are legal obligations, not company preference.',
      },
      {
        id: 'cad01_c12',
        front: 'What does a surface finish symbol control and why might a control engineer care?',
        back:
          'Roughness and lay of the surface. It matters where friction, sealing, fatigue or contact stiffness matter, and a bearing or gimbal interface with the wrong finish changes friction and therefore the actuator model you are tuning against.',
      },
    ],
    quiz: [
      {
        id: 'cad01_q1',
        q: 'A drawing shows the right-side view placed to the left of the front view. Which convention is in use?',
        choices: ['Third angle', 'First angle', 'Isometric', 'Auxiliary'],
        answer: 1,
        explain:
          'First-angle projection places each view on the opposite side from the viewing direction. The title-block symbol is the definitive indicator.',
        b: 0.6,
        bloom: 'apply',
      },
      {
        id: 'cad01_q2',
        q: 'Four parts each carry a plus or minus 0.1 mm tolerance along one axis. Worst case and RSS stack-ups are:',
        choices: [
          '0.4 mm and 0.2 mm',
          '0.4 mm and 0.1 mm',
          '0.1 mm and 0.4 mm',
          '0.2 mm and 0.4 mm',
        ],
        answer: 0,
        explain:
          'Worst case sums the magnitudes: 4 times 0.1 = 0.4. RSS is the square root of 4 times 0.01, which is 0.2.',
        b: 0.7,
        bloom: 'apply',
      },
      {
        id: 'cad01_q3',
        q: 'Why does a control engineer ask for the mounting tolerance of a reaction wheel?',
        choices: [
          'To size the fasteners',
          'Because misalignment turns wheel torque into an off-axis disturbance and changes the effective inertia matrix used by the controller',
          'To choose a paint finish',
          'It is irrelevant to control',
        ],
        answer: 1,
        explain:
          'Mechanical misalignment appears in the control problem as cross-coupling and as a bias the filter cannot distinguish from a disturbance.',
        b: 0.5,
        bloom: 'understand',
      },
      {
        id: 'cad01_q4',
        q: 'What does ASME Y14.41 change?',
        choices: [
          'It adds new tolerance symbols',
          'It makes the annotated 3D model, rather than a 2D drawing, the authoritative product definition',
          'It defines weld symbols',
          'It governs export control',
        ],
        answer: 1,
        explain:
          'Model-based definition moves the controlled definition into the model with PMI, which is where much of aerospace is heading.',
        b: 0.8,
        bloom: 'recall',
      },
      {
        id: 'cad01_q5',
        q: 'Which statement about revisions is correct for flight hardware?',
        choices: [
          'Only the latest revision matters',
          'Hardware is traceable to the revision it was built to, so as-designed, as-built and as-flown configurations can differ and must be recorded',
          'Revisions apply only to drawings, not parts',
          'Revision letters are cosmetic',
        ],
        answer: 1,
        explain:
          'Configuration management is what lets an anomaly investigation determine exactly what flew.',
        b: 0.6,
        bloom: 'understand',
      },
      {
        id: 'cad01_q6',
        q: 'When should you quote a worst-case rather than an RSS stack-up?',
        choices: [
          'Never; RSS is always better',
          'When the interface is safety-critical, the number of contributors is small, or the tolerances are not independent',
          'Only for plastic parts',
          'Only when the tolerances are equal',
        ],
        answer: 1,
        explain:
          'RSS assumes many independent, roughly normal contributors. With few parts, correlated processes or a safety-critical consequence, that assumption does not earn you the margin it appears to give.',
        b: 0.9,
        bloom: 'analyze',
      },
    ],
    tags: ['cad'],
    importance: 0.8,
  },

  {
    id: 'cod_cad_02_gdt',
    track: 'coding',
    tier: 1,
    title: 'Geometric Dimensioning and Tolerancing (ASME Y14.5)',
    summary:
      "GD&T states function rather than coordinates: what the part must do, not just where its edges are. For a GNC engineer it is the language in which alignment error budgets are actually written.",
    prereqs: ['cod_cad_01_drawings'],
    hours: 20,
    topics: [
      'Why GD&T exists: coordinate tolerancing makes square zones and ambiguous setups',
      'Anatomy of a feature control frame',
      'Datums, datum features, the datum reference frame, the 3-2-1 rule and degrees of freedom',
      'Datum targets and datum precedence',
      'Form: flatness, straightness, circularity, cylindricity',
      'Orientation: perpendicularity, angularity, parallelism',
      'Location: position, concentricity, symmetry',
      'Profile of a line and profile of a surface, increasingly dominant in aerostructures',
      'Runout: circular and total',
      'Material condition modifiers MMC, LMC and RFS; bonus tolerance',
      'Virtual condition; composite position tolerance; projected tolerance zone',
      'Free-state variation for thin-wall aerospace parts',
      'Tolerance stack-up with geometric controls',
      'CMM inspection and how GD&T maps onto measurement',
      'PMI annotation in a model-based-definition workflow',
    ],
    objectives: [
      'Read a feature control frame aloud and say exactly what it permits.',
      'Apply a datum scheme and a position tolerance to a bolted bracket.',
      'Compute a bonus tolerance from a departure from maximum material condition.',
      'Explain why profile of a surface dominates in aerostructures.',
      'Trace an alignment requirement from a GNC error budget down to a feature control frame.',
    ],
    resources: [
      {
        title: 'ASME Y14.5-2018 Dimensioning and Tolerancing',
        author: 'ASME',
        kind: 'docs',
        url: 'https://www.asme.org/codes-standards',
        free: false,
        note: 'The standard itself. The 2018 revision is current.',
      },
      {
        title: 'GD&T Fundamentals learning path',
        author: 'ASME',
        kind: 'course',
        url: 'https://www.asme.org/learning-development',
        free: false,
        note: 'Three on-demand courses with a certificate at 80 percent; includes an electronic copy of GeoTol Pro by Scott and Al Neumann.',
      },
      {
        title: 'Fundamentals of Geometric Dimensioning and Tolerancing',
        author: 'Alex Krulikowski',
        kind: 'book',
        free: false,
      },
    ],
    exercises: [
      {
        id: 'cad02_ex1',
        title: 'Tolerance a bolted bracket',
        prompt:
          'Given an untoleranced bracket with a mounting face and four clearance holes, apply a complete datum scheme (primary planar, secondary and tertiary), a flatness control on the mounting face, and a position tolerance on the hole pattern at maximum material condition. State, in millimetres, the tolerance zone diameter available when a hole is produced at its least material condition, and show the bonus arithmetic.',
        kind: 'derivation',
        hours: 4,
      },
      {
        id: 'cad02_ex2',
        title: 'From error budget to feature control frame',
        prompt:
          'A GNC attitude-knowledge budget allocates 0.02 degrees to star-tracker to body misalignment. Convert that into a mechanical requirement on the tracker mounting interface: choose the controls (perpendicularity or angularity to a datum, position of the mounting holes, flatness of the seat), assign numbers, and show the geometry that connects the linear tolerance to the angular error. State the assumption you had to make and how you would verify it at inspection.',
        kind: 'derivation',
        hours: 4,
      },
    ],
    cards: [
      {
        id: 'cad02_c1',
        front: 'Why does GD&T exist at all?',
        back:
          'Plus-or-minus coordinate tolerancing creates square tolerance zones that do not match how a round feature actually functions, and leaves the inspection setup ambiguous. GD&T states the functional requirement and fixes the datum reference frame, so designer, machinist and inspector agree.',
      },
      {
        id: 'cad02_c2',
        front: 'Read the anatomy of a feature control frame',
        back:
          'Geometric characteristic symbol, then the tolerance zone shape and size (with a diameter symbol if cylindrical) and any material-condition modifier, then the datum references in order of precedence with their own modifiers.',
      },
      {
        id: 'cad02_c3',
        front: 'What does a position tolerance of diameter 0.2 at MMC referenced to A, B, C permit?',
        back:
          'The feature axis must lie within a cylindrical zone of 0.2 mm diameter located exactly at the basic dimensions in the datum reference frame A primary, B secondary, C tertiary, and that zone grows by the amount the feature departs from maximum material condition.',
      },
      {
        id: 'cad02_c4',
        front: 'Explain bonus tolerance with a number',
        back:
          'A hole with MMC diameter 10.0 and LMC 10.3 carrying position diameter 0.2 at MMC: produced at 10.0 you get 0.2; produced at 10.3 you get 0.2 plus 0.3, that is 0.5 of positional tolerance, because the extra clearance can absorb the same assembly error.',
        formula: true,
      },
      {
        id: 'cad02_c5',
        front: 'What is the 3-2-1 rule?',
        back:
          'A primary datum plane constrains three degrees of freedom by contacting at three points, the secondary constrains two more with two points, and the tertiary constrains the last with one point. It is how a part is fully located for both manufacture and inspection.',
      },
      {
        id: 'cad02_c6',
        front: 'Why does datum precedence matter?',
        back:
          'It determines the order in which the part is seated, and therefore which surface dominates. Swapping primary and secondary changes the measured result on the same physical part, which is why the order is part of the specification.',
      },
      {
        id: 'cad02_c7',
        front: 'Why does profile of a surface dominate in aerostructures?',
        back:
          'Because the features are complex curved surfaces rather than prismatic geometry, and profile controls form, orientation and location of the whole surface in one frame against the model. It also fits model-based definition naturally.',
      },
      {
        id: 'cad02_c8',
        front: 'MMC, LMC and RFS',
        back:
          'Maximum material condition is the size with the most material (largest shaft, smallest hole); LMC is the opposite; regardless of feature size means no bonus applies. MMC is used where assembly clearance is the function; LMC where wall thickness or minimum material matters.',
      },
      {
        id: 'cad02_c9',
        front: 'What is virtual condition?',
        back:
          'The worst-case boundary generated by the combination of the feature size at MMC and its geometric tolerance. It is the number a mating part or a functional gauge must clear, which is what makes MMC controls checkable with a hard gauge.',
      },
      {
        id: 'cad02_c10',
        front: 'What is a projected tolerance zone for?',
        back:
          'Threaded or press-fit holes, where the misalignment that matters is at the far end of the protruding fastener, not at the part surface. The zone is projected out to the mating part thickness so the assembly actually fits.',
      },
      {
        id: 'cad02_c11',
        front: 'Free-state variation: why does aerospace need it?',
        back:
          'Thin-wall and large lightweight parts deform under their own weight, so their unrestrained shape differs from the assembled shape. The note specifies which condition the tolerance applies in, and what restraint is allowed during inspection.',
      },
      {
        id: 'cad02_c12',
        front: 'How does GD&T reach a control loop?',
        back:
          'Through alignment error budgets. Perpendicularity of a thruster seat becomes a thrust-vector misalignment and a disturbance torque; angularity of a star-tracker mount becomes attitude-knowledge bias; position of a gimbal bearing becomes backlash and friction variation.',
      },
      {
        id: 'cad02_c13',
        front: 'Concentricity: why is it discouraged?',
        back:
          'It controls the distribution of median points, which is expensive to measure and rarely the actual function. Runout or position usually expresses the real requirement and is far cheaper to inspect, which is why Y14.5-2018 pushes designers away from it.',
      },
    ],
    quiz: [
      {
        id: 'cad02_q1',
        q: 'A hole has MMC 8.0, LMC 8.4, and position diameter 0.1 at MMC. Produced at 8.4, what positional tolerance is available?',
        choices: ['0.1', '0.4', '0.5', '0.3'],
        answer: 2,
        explain:
          'Bonus equals the departure from MMC: 8.4 minus 8.0 is 0.4, added to the stated 0.1, giving 0.5.',
        b: 0.8,
        bloom: 'apply',
      },
      {
        id: 'cad02_q2',
        q: 'Why does swapping the primary and secondary datum change the inspection result?',
        choices: [
          'It does not',
          'Because the part is seated differently, so a different surface dominates the constraint of degrees of freedom',
          'Because the tolerance value changes',
          'Because the CMM software requires it',
        ],
        answer: 1,
        explain:
          'The datum reference frame is a physical setup. Precedence is part of the specification, not an ordering convenience.',
        b: 0.9,
        bloom: 'understand',
      },
      {
        id: 'cad02_q3',
        q: 'Which control is most appropriate for a complex curved aerostructure skin?',
        choices: [
          'Plus or minus coordinate dimensions',
          'Profile of a surface referenced to a datum reference frame',
          'Concentricity',
          'Circular runout',
        ],
        answer: 1,
        explain:
          'Profile controls form, orientation and location of the whole surface against the model definition in a single frame.',
        b: 0.6,
        bloom: 'apply',
      },
      {
        id: 'cad02_q4',
        q: 'What is the practical meaning of a maximum material condition modifier?',
        choices: [
          'The tolerance is tighter',
          'The tolerance may grow as the feature departs from MMC, because the extra clearance absorbs the same assembly error',
          'The feature must be inspected with a CMM',
          'It forbids bonus tolerance',
        ],
        answer: 1,
        explain:
          'That is bonus tolerance, and it is also what allows a functional hard gauge to check the virtual condition.',
        b: 0.7,
        bloom: 'understand',
      },
      {
        id: 'cad02_q5',
        q: 'A GNC error budget allocates 0.02 degrees to sensor mounting misalignment. What does that become mechanically?',
        choices: [
          'A surface finish callout',
          'Angularity or perpendicularity of the mounting seat to a datum, plus position of the mounting holes, sized so the geometry yields at most 0.02 degrees',
          'A material specification',
          'A weld symbol',
        ],
        answer: 1,
        explain:
          'The angular error comes from the seat orientation and from hole position over the bolt-circle span. The conversion is geometry, and stating it is exactly the cross-discipline conversation this module trains.',
        b: 1.0,
        bloom: 'apply',
      },
      {
        id: 'cad02_q6',
        q: 'Why is a projected tolerance zone used on threaded holes?',
        choices: [
          'To make inspection cheaper',
          'Because the misalignment that matters is at the far end of the installed fastener, outside the part',
          'Because threads cannot be positioned',
          'To allow bonus tolerance',
        ],
        answer: 1,
        explain:
          'A fastener amplifies a small angular error over its protruding length. Projecting the zone puts the control where the interference actually occurs.',
        b: 0.9,
        bloom: 'understand',
      },
    ],
    tags: ['cad'],
    importance: 0.85,
  },

  {
    id: 'cod_cad_03_tools',
    track: 'coding',
    tier: 2,
    title: 'CAD Tools: 2D Drafting, 3D Modelling, and Where AutoCAD Actually Fits',
    summary:
      "SpaceX standardised on Siemens NX with Teamcenter, NX Nastran and Femap. AutoCAD is a 2D tool for facilities, ground support equipment and schematics, not the tool rockets are designed in. Learn both, and learn the difference.",
    prereqs: ['cod_cad_02_gdt'],
    hours: 30,
    topics: [
      'AutoCAD: the command line as the real interface; absolute, relative and polar coordinate entry',
      'Object snaps, ortho and polar tracking',
      'Draw and modify: line, polyline, arc, offset, trim, extend, fillet, array, stretch',
      'Layers as the core discipline: name, colour, linetype, lineweight, plot state, freeze versus off',
      'Blocks, attributes, dynamic blocks and external references',
      'Annotation: text styles, dimension styles, multileaders, annotative scaling',
      'Model space versus paper space; layouts, viewports and viewport scale; plot styles; sheet sets',
      'Templates, standards files, DWG versus DXF',
      'Where AutoCAD genuinely lives in aerospace: facility and site layouts, ground support equipment, test-stand drawings, electrical and harness schematics, P&IDs, tooling layouts',
      'Parametric feature-based modelling: sketches, constraints, fully defined sketches',
      'Features: extrude, revolve, sweep, loft, fillet, shell, rib, draft, hole wizard, patterns, configurations',
      'The feature tree, parent-child relationships, design intent, robust versus fragile modelling',
      'Assemblies: mates, sub-assemblies, in-context design and its dangers, interference detection',
      'Mass properties: where the mass, centre of gravity and inertia tensor for a 6-DOF simulation come from',
      'Drawings from models; PMI and model-based definition',
      'Sheet metal, weldments and surfacing (awareness); outer mould line',
      'Interchange formats: STEP, IGES, Parasolid, JT, and translation fidelity',
      'The landscape: NX plus Teamcenter at SpaceX; CATIA at Boeing and Airbus; Creo in defence; SolidWorks at suppliers and startups; Onshape and Fusion as cloud-native newcomers',
      'PLM concepts: part numbers, revisions versus versions, effectivity, ECO and ECR, as-designed versus as-built versus as-flown',
    ],
    objectives: [
      'Produce a fully dimensioned, title-blocked, plotted 2D drawing with correct layers and annotative dimensions.',
      'Model a bracket parametrically with a fully defined sketch and a feature tree that survives a dimension change.',
      'Extract an inertia tensor from an assembly and feed it into a 6-DOF simulation.',
      'Say which CAD system a given aerospace organisation uses and why, without guessing.',
      'Explain what Teamcenter does that NX does not.',
    ],
    resources: [
      {
        title: 'Onshape Learning Center',
        author: 'PTC Onshape',
        kind: 'course',
        url: 'https://learn.onshape.com/',
        free: true,
        note: 'Free hobby tier, browser-based, no install. The lowest-friction way to learn parametric modelling.',
      },
      {
        title: 'AutoCAD on-demand learning and certification prep',
        author: 'Autodesk',
        kind: 'course',
        url: 'https://www.autodesk.com/learn',
        free: true,
        note: 'Autodesk also offers a free one-year education licence. The Certified User credential is the beginner-appropriate one.',
      },
      {
        title: 'Siemens Xcelerator Academy: NX Basics and NX Basic Design',
        author: 'Siemens Digital Industries Software',
        kind: 'course',
        url: 'https://www.sw.siemens.com/en-US/training/',
        free: false,
        note: 'A free NX student edition exists; the Designer Certified Professional (NX) credential is the formal path.',
      },
      {
        title: 'Siemens case study: SpaceX',
        author: 'Siemens',
        kind: 'site',
        url: 'https://www.sw.siemens.com/en-US/customer-stories/',
        free: true,
        note: 'The published account of the NX and Teamcenter standardisation and the large-assembly load-time argument.',
      },
    ],
    exercises: [
      {
        id: 'cad03_ex1',
        title: 'One bracket, two ways',
        prompt:
          'Model a reaction-wheel mounting bracket parametrically (Onshape or SolidWorks) with every sketch fully defined, then produce a 2D drawing of it with GD&T applied from the previous module. Separately, draft the same part in AutoCAD as a pure 2D drawing with proper layers, annotative dimensions and a plotted layout. Write half a page on which workflow you would use for a flight part, for a test-stand layout, and for a harness schematic, and why.',
        kind: 'build',
        hours: 8,
      },
      {
        id: 'cad03_ex2',
        title: 'Inertia tensor into the simulator',
        prompt:
          'Build a small assembly with at least four parts and assigned materials, extract the mass, centre of gravity and full inertia tensor about the centre of mass in body axes, and feed them into the 6-DOF Python simulator. Then change one part material, re-extract, and report how the principal moments and the resulting attitude dynamics change. State what invalidates a CAD-derived inertia tensor for flight use.',
        kind: 'build',
        hours: 6,
      },
    ],
    cards: [
      {
        id: 'cad03_c1',
        front: 'Which CAD system does SpaceX use, and why?',
        back:
          'Siemens NX with Teamcenter for product data management, plus NX Nastran and Femap for analysis. They moved after roughly a year on a mid-range package whose Falcon 1 assemblies took over an hour to load; NX handles 25,000-plus part assemblies in five to ten minutes, and technicians use the models directly.',
      },
      {
        id: 'cad03_c2',
        front: 'Where does AutoCAD legitimately belong at a launch company?',
        back:
          'Two-dimensional work: facility and site layouts, ground support equipment, test-stand drawings, electrical and harness schematics, P&IDs and tooling layouts. It is not the tool the vehicle is designed in, and saying so correctly is itself a credibility signal.',
      },
      {
        id: 'cad03_c3',
        front: 'Who uses CATIA, NX, Creo and SolidWorks?',
        back:
          'CATIA at Boeing (adopted 1986, the 787 was designed in it) and Airbus; NX at SpaceX and much of automotive and aerospace; Creo heavily in defence; SolidWorks at suppliers, startups and student teams; Onshape and Fusion as cloud-native newcomers.',
      },
      {
        id: 'cad03_c4',
        front: 'What does Teamcenter do that NX does not?',
        back:
          'Product data and lifecycle management: revision control, workflow and approvals, bills of material, effectivity, change orders and traceability across every discipline. NX creates geometry; Teamcenter governs which version of it is real.',
      },
      {
        id: 'cad03_c5',
        front: 'What is design intent, concretely?',
        back:
          'The set of relationships that should survive a change: this hole stays concentric with that boss, this wall stays 2 mm thick, this flange follows the mounting pattern. A model with design intent updates correctly when a dimension changes; one without it breaks.',
      },
      {
        id: 'cad03_c6',
        front: 'Why must a sketch be fully defined?',
        back:
          'An under-defined sketch has unconstrained degrees of freedom, so geometry can move when an unrelated dimension changes or when the file is reopened. It is a latent defect, and most companies treat it as a review failure.',
      },
      {
        id: 'cad03_c7',
        front: 'Where does a GNC engineer get the inertia tensor, and what invalidates it?',
        back:
          'From the CAD assembly mass properties with real materials assigned. It is invalidated by placeholder materials and densities, missing harnesses, fluids and propellant, simplified or suppressed components, and any as-built deviation. Flight numbers get reconciled against measured mass properties.',
      },
      {
        id: 'cad03_c8',
        front: 'Model space versus paper space',
        back:
          'Model space holds the geometry at full scale; paper space is the sheet, holding viewports into the model at chosen scales plus the title block. Annotative scaling is what keeps a dimension the correct printed size in two viewports at different scales.',
      },
      {
        id: 'cad03_c9',
        front: 'Why are layers, not per-object colours, the professional standard?',
        back:
          'Layers let you control visibility, plotting, linetype and lineweight for a whole category at once, and they survive being shared with another firm whose standards map by layer name. Per-object overrides are invisible in the layer manager and unmanageable at scale.',
      },
      {
        id: 'cad03_c10',
        front: 'What is in-context design and why is it dangerous?',
        back:
          'Modelling one part by referencing geometry of another in the assembly. It captures real intent but creates external references, so changing the parent silently changes the child and circular dependencies can make a rebuild non-deterministic.',
      },
      {
        id: 'cad03_c11',
        front: 'STEP versus native format: what is lost?',
        back:
          'STEP and IGES carry geometry but not the feature tree, the parametric relationships or (for older practice) the PMI, so the model becomes dumb solid. That is why a supplier working from STEP cannot make a parametric change the way the originator can.',
      },
      {
        id: 'cad03_c12',
        front: 'Revision versus version, and effectivity',
        back:
          'A version is any saved state during development; a revision is a released, controlled configuration. Effectivity states from which serial number or date a revision applies, which is how a fleet can legitimately contain several configurations at once.',
      },
      {
        id: 'cad03_c13',
        front: 'As-designed, as-built, as-flown',
        back:
          'What the drawing specified, what the shop actually produced including approved deviations, and what was in the vehicle at the moment of flight. An anomaly investigation needs all three, and they are routinely different.',
      },
      {
        id: 'cad03_c14',
        front: 'How is CAD actually tested in a GNC interview?',
        back:
          'Almost never directly. It appears as: have you worked with mechanical teams, where did your inertia tensor come from, and can you read this drawing. One solid, specific answer is enough.',
      },
    ],
    quiz: [
      {
        id: 'cad03_q1',
        q: 'Which statement about SpaceX and CAD is correct?',
        choices: [
          'SpaceX designs its vehicles in AutoCAD',
          'SpaceX standardised on Siemens NX with Teamcenter, after large assemblies on a mid-range package took over an hour to load',
          'SpaceX uses CATIA exclusively',
          'SpaceX uses no PDM system',
        ],
        answer: 1,
        explain:
          'The Siemens case study documents the NX and Teamcenter standardisation and the large-assembly performance argument. Other packages appear in pockets, but NX is primary.',
        b: 0.5,
        bloom: 'recall',
      },
      {
        id: 'cad03_q2',
        q: 'Which task is AutoCAD genuinely the right tool for at a launch company?',
        choices: [
          'Designing a turbopump impeller',
          'A test-stand and facility layout drawing',
          'Outer-mould-line surfacing',
          'A 25,000-part vehicle assembly',
        ],
        answer: 1,
        explain:
          'AutoCAD 2D niche is facilities, GSE, schematics and tooling layouts. Complex 3D and large assemblies belong in NX, CATIA, Creo or SolidWorks.',
        b: 0.3,
        bloom: 'apply',
      },
      {
        id: 'cad03_q3',
        q: 'A sketch is left under-defined. What is the consequence?',
        choices: [
          'Nothing; the model still builds',
          'Geometry has free degrees of freedom, so it can shift when an unrelated change is made, which is a latent defect',
          'The file cannot be saved',
          'Mass properties become unavailable',
        ],
        answer: 1,
        explain:
          'It builds today and moves tomorrow. This is why fully defined sketches are a review criterion rather than a style preference.',
        b: 0.4,
        bloom: 'understand',
      },
      {
        id: 'cad03_q4',
        q: 'Your 6-DOF simulation needs an inertia tensor. Which source is authoritative, and what threatens it?',
        choices: [
          'A hand calculation from the outer dimensions',
          'CAD mass properties with real materials, threatened by placeholder densities, missing harness and fluids, and suppressed components',
          'The supplier data sheet',
          'A scaled value from a similar vehicle',
        ],
        answer: 1,
        explain:
          'CAD is the source, and the usual error is that the model is not complete or not materially correct. Flight programmes reconcile it against measured mass properties.',
        b: 0.7,
        bloom: 'analyze',
      },
      {
        id: 'cad03_q5',
        q: 'What does Teamcenter provide beyond NX?',
        choices: [
          'Better surfacing tools',
          'Product data and lifecycle management: revisions, workflow, BOM, effectivity and change orders',
          'Finite element analysis',
          'Faster rendering',
        ],
        answer: 1,
        explain:
          'NX is authoring, Teamcenter is governance. Analysis is NX Nastran and Femap in that same stack.',
        b: 0.6,
        bloom: 'recall',
      },
      {
        id: 'cad03_q6',
        q: 'A supplier receives a STEP file instead of the native model. What have they lost?',
        choices: [
          'Nothing important',
          'The feature tree and parametric relationships, so they cannot make a parametric change the way the originator can',
          'The units',
          'The geometry',
        ],
        answer: 1,
        explain:
          'Neutral formats carry geometry, not intent. That is exactly why PLM and native-format exchange matter in a supply chain.',
        b: 0.5,
        bloom: 'understand',
      },
      {
        id: 'cad03_q7',
        q: 'How much CAD depth does a GNC role actually require?',
        choices: [
          'Full CSWP-level modelling skill',
          'Enough to read a drawing, extract mass properties correctly and talk to mechanical engineers; it is cross-discipline literacy, not a core skill',
          'None at all',
          'NX certification',
        ],
        answer: 1,
        explain:
          'The research is explicit that CAD is peripheral to GNC. Budget the hours accordingly and spend the saved time on C++ and Python.',
        b: 0.2,
        bloom: 'understand',
      },
    ],
    tags: ['cad'],
    importance: 0.8,
  },

  /* ══ INTERVIEW PREPARATION ═══════════════════════════════════════════════ */
  {
    id: 'cod_int_01_algorithms',
    track: 'coding',
    tier: 7,
    title: 'Algorithmic Fluency for the SpaceX Screen',
    summary:
      "Calibrated honestly: medium-level problems in C++ or Python, with emphasis on real-world problem solving rather than exotic algorithms, plus the engineering variants SpaceX actually favours, such as decommutating a binary packet stream or implementing a ring buffer.",
    prereqs: ['cod_cpp_04_stl', 'cod_py_03_numpy'],
    hours: 40,
    topics: [
      'The honest calibration: medium level, not the main event, with real-world framing preferred',
      'Preparing in C++ if targeting flight software; Python for the take-home',
      'High-yield patterns: arrays and two pointers, sliding window, hash maps, binary search including on the answer',
      'Sorting and intervals; stacks and queues; linked lists',
      'Trees and BFS/DFS; graphs including topological sort; heaps; prefix sums; light dynamic programming; bit manipulation',
      'What to skip: exotic dynamic programming, advanced graph theory, segment trees',
      'Complexity analysis you can say out loud, including the space term',
      'The engineering variants: binary protocol decommutation, telemetry dropout detection, two-rate time alignment, ring buffer, PID with anti-windup, running median over a stream',
      'struct, endianness and checksums in Python; bit twiddling in C++',
      'Talking while solving: restate, clarify, state the approach and its complexity, then code',
      'Testing your own solution before saying you are done',
      'Roughly 120 to 150 problems is sufficient, grouped by pattern and timed',
    ],
    objectives: [
      'Solve a medium problem in 25 minutes while explaining your reasoning aloud.',
      'State time and space complexity for every solution without being asked.',
      'Implement the six engineering variants from memory: ring buffer, decommutator, dropout detector, time aligner, anti-windup PID and running median.',
      'Recognise which of the high-yield patterns a new problem belongs to within two minutes.',
      'Write your own test cases, including the empty and single-element cases, before declaring a solution finished.',
    ],
    resources: [
      {
        title: 'NeetCode 150',
        author: 'NeetCode',
        kind: 'site',
        url: 'https://neetcode.io/practice',
        free: true,
        note: 'Pattern-grouped sequencing; the free list is enough. Do them timed and out loud.',
      },
      {
        title: 'Cracking the Coding Interview, 6th ed.',
        author: 'Gayle Laakmann McDowell',
        kind: 'book',
        free: false,
        note: 'Use it for interview structure and behaviour, not as the problem set.',
      },
      {
        title: 'Python struct module documentation',
        author: 'Python Software Foundation',
        kind: 'docs',
        url: 'https://docs.python.org/3/library/struct.html',
        free: true,
        note: 'The take-home that asks you to parse a custom binary protocol is a real and repeated pattern.',
      },
      {
        title: 'Compiler Explorer',
        author: 'Matt Godbolt',
        kind: 'tool',
        url: 'https://godbolt.org/',
        free: true,
      },
    ],
    exercises: [
      {
        id: 'int01_ex1',
        title: 'Decommutate a binary telemetry stream',
        prompt:
          'A downlink blob contains fixed 12-byte frames: one byte of magic 0xA5, a little-endian uint16 channel id, a little-endian uint32 millisecond timestamp, a little-endian float32 value, and one checksum byte equal to the XOR of the preceding eleven bytes. The stream may contain leading garbage and corrupted frames. Implement decommutate(blob) returning a list of dicts with keys channel, t_ms and value, in order, skipping any frame whose magic or checksum does not match and resynchronising byte by byte.',
        kind: 'code',
        lang: 'python',
        starter:
          'import struct\n\nMAGIC = 0xA5\nFRAME_LEN = 12\n\n\ndef decommutate(blob):\n    """Parse 12-byte frames from bytes; skip bad frames and resynchronise."""\n    raise NotImplementedError\n',
        solution:
          'import struct\n\nMAGIC = 0xA5\nFRAME_LEN = 12\n\n\ndef decommutate(blob):\n    out = []\n    i = 0\n    n = len(blob)\n    while i + FRAME_LEN <= n:\n        if blob[i] != MAGIC:\n            i += 1\n            continue\n        frame = blob[i:i + FRAME_LEN]\n        chk = 0\n        for b in frame[:FRAME_LEN - 1]:\n            chk ^= b\n        if chk != frame[FRAME_LEN - 1]:\n            i += 1\n            continue\n        channel, t_ms = struct.unpack_from("<HI", frame, 1)\n        (value,) = struct.unpack_from("<f", frame, 7)\n        out.append({"channel": channel, "t_ms": t_ms, "value": value})\n        i += FRAME_LEN\n    return out\n',
        tests: [
          {
            name: 'three clean frames',
            assert:
              'import struct\n\n\ndef _frame(channel, t_ms, value, corrupt=False):\n    body = bytes([0xA5]) + struct.pack("<HI", channel, t_ms) + struct.pack("<f", value)\n    chk = 0\n    for b in body:\n        chk ^= b\n    if corrupt:\n        chk ^= 0xFF\n    return body + bytes([chk])\n\n\nblob = _frame(7, 1000, 1.5) + _frame(9, 2000, -2.25) + _frame(7, 3000, 3.0)\nr = decommutate(blob)\nassert len(r) == 3, f"expected 3 frames, got {len(r)}"\nassert r[0]["channel"] == 7 and r[0]["t_ms"] == 1000 and abs(r[0]["value"] - 1.5) < 1e-6\nassert r[1]["channel"] == 9 and abs(r[1]["value"] + 2.25) < 1e-6\n',
          },
          {
            name: 'corrupted frame is skipped',
            assert:
              'import struct\n\n\ndef _frame(channel, t_ms, value, corrupt=False):\n    body = bytes([0xA5]) + struct.pack("<HI", channel, t_ms) + struct.pack("<f", value)\n    chk = 0\n    for b in body:\n        chk ^= b\n    if corrupt:\n        chk ^= 0xFF\n    return body + bytes([chk])\n\n\nblob = _frame(1, 10, 0.5) + _frame(2, 20, 0.75, corrupt=True) + _frame(3, 30, 1.0)\nassert [f["channel"] for f in decommutate(blob)] == [1, 3], "bad checksum must be skipped"\n',
          },
          {
            name: 'resynchronises after leading garbage',
            assert:
              'import struct\n\n\ndef _frame(channel, t_ms, value):\n    body = bytes([0xA5]) + struct.pack("<HI", channel, t_ms) + struct.pack("<f", value)\n    chk = 0\n    for b in body:\n        chk ^= b\n    return body + bytes([chk])\n\n\nr = decommutate(b"\\x00\\x11\\x22" + _frame(5, 50, 2.0))\nassert len(r) == 1 and r[0]["channel"] == 5, "must resynchronise on the magic byte"\n',
          },
          {
            name: 'degenerate inputs',
            assert:
              'assert decommutate(b"") == []\nassert decommutate(b"\\xa5\\x00") == [], "a truncated frame must not be emitted"\n',
            hidden: true,
          },
        ],
        hours: 3,
      },
      {
        id: 'int01_ex2',
        title: 'Fixed-capacity ring buffer',
        prompt:
          'Implement RingBuffer(capacity) backed by a single pre-allocated list, with push(item) overwriting the oldest element when full, pop_oldest() returning None when empty, to_list() returning contents oldest first, __len__ and capacity(). Every operation must be O(1) except to_list, and no list may grow or shrink after construction. A capacity below 1 raises ValueError. This is the aerospace telemetry pattern and a common live-coding ask.',
        kind: 'code',
        lang: 'python',
        starter:
          'class RingBuffer:\n    """Fixed-capacity circular buffer that overwrites the oldest element."""\n\n    def __init__(self, capacity):\n        raise NotImplementedError\n\n    def push(self, item):\n        raise NotImplementedError\n\n    def pop_oldest(self):\n        raise NotImplementedError\n\n    def to_list(self):\n        raise NotImplementedError\n\n    def capacity(self):\n        raise NotImplementedError\n\n    def __len__(self):\n        raise NotImplementedError\n',
        solution:
          'class RingBuffer:\n    """Fixed-capacity circular buffer that overwrites the oldest element."""\n\n    def __init__(self, capacity):\n        if capacity < 1:\n            raise ValueError("capacity must be >= 1")\n        self._buf = [None] * capacity\n        self._cap = capacity\n        self._start = 0\n        self._len = 0\n\n    def push(self, item):\n        idx = (self._start + self._len) % self._cap\n        self._buf[idx] = item\n        if self._len == self._cap:\n            self._start = (self._start + 1) % self._cap\n        else:\n            self._len += 1\n\n    def pop_oldest(self):\n        if self._len == 0:\n            return None\n        v = self._buf[self._start]\n        self._start = (self._start + 1) % self._cap\n        self._len -= 1\n        return v\n\n    def to_list(self):\n        return [self._buf[(self._start + i) % self._cap] for i in range(self._len)]\n\n    def capacity(self):\n        return self._cap\n\n    def __len__(self):\n        return self._len\n',
        tests: [
          {
            name: 'fills then overwrites the oldest',
            assert:
              'rb = RingBuffer(3)\nassert len(rb) == 0 and rb.to_list() == [] and rb.capacity() == 3\nfor v in (1, 2, 3):\n    rb.push(v)\nassert rb.to_list() == [1, 2, 3] and len(rb) == 3\nrb.push(4)\nassert rb.to_list() == [2, 3, 4], "push on a full buffer must drop the oldest"\nassert len(rb) == 3\n',
          },
          {
            name: 'pop_oldest and empty behaviour',
            assert:
              'rb = RingBuffer(2)\nassert rb.pop_oldest() is None, "empty pop must return None, not raise"\nrb.push("a")\nrb.push("b")\nassert rb.pop_oldest() == "a"\nassert rb.to_list() == ["b"] and len(rb) == 1\nrb.push("c")\nrb.push("d")\nassert rb.to_list() == ["c", "d"]\n',
          },
          {
            name: 'storage never grows',
            assert:
              'rb = RingBuffer(1000)\nfor i in range(10000):\n    rb.push(i)\nassert len(rb) == 1000\nlst = rb.to_list()\nassert lst[0] == 9000 and lst[-1] == 9999\nassert len(rb._buf) == 1000, "the backing list must stay at the original capacity"\n',
            hidden: true,
          },
          {
            name: 'capacity validation',
            assert:
              'for bad in (0, -5):\n    try:\n        RingBuffer(bad)\n    except ValueError:\n        pass\n    else:\n        raise AssertionError(f"capacity {bad} must raise ValueError")\n',
          },
        ],
        hours: 2,
      },
      {
        id: 'int01_ex3',
        title: 'Sliding-window maximum in C++',
        prompt:
          'Implement std::vector<int> max_window(const std::vector<int>& v, int w) returning the maximum of every window of w consecutive elements, in O(n) using a monotonic deque. Return an empty vector when w is out of range. Expected output for v = {1,3,-1,-3,5,3,6,7} and w = 3: 3 3 5 5 6 7. State the complexity aloud before you write the code, as you would in the interview.',
        kind: 'code',
        lang: 'cpp',
        starter:
          '#include <deque>\n#include <vector>\n\nstd::vector<int> max_window(const std::vector<int>& v, int w) {\n    std::vector<int> out;\n    // TODO: monotonic deque of indices, values decreasing\n    return out;\n}\n',
        solution:
          '#include <cstdio>\n#include <deque>\n#include <vector>\n\n// O(n): each index is pushed once and popped at most once.\nstd::vector<int> max_window(const std::vector<int>& v, int w) {\n    std::vector<int> out;\n    const int n = static_cast<int>(v.size());\n    if (w < 1 || w > n) return out;\n    out.reserve(static_cast<std::size_t>(n - w + 1));\n\n    std::deque<int> dq;  // indices, values strictly decreasing\n    for (int i = 0; i < n; ++i) {\n        while (!dq.empty() && v[static_cast<std::size_t>(dq.back())] <= v[static_cast<std::size_t>(i)])\n            dq.pop_back();\n        dq.push_back(i);\n        if (dq.front() <= i - w) dq.pop_front();\n        if (i >= w - 1) out.push_back(v[static_cast<std::size_t>(dq.front())]);\n    }\n    return out;\n}\n\nint main() {\n    for (int x : max_window({1, 3, -1, -3, 5, 3, 6, 7}, 3)) std::printf("%d ", x);\n    std::printf("\\n");   // 3 3 5 5 6 7\n    return 0;\n}\n',
        hours: 2,
      },
    ],
    cards: [
      {
        id: 'int01_c1',
        front: 'How hard is the SpaceX coding bar, honestly?',
        back:
          'Reported as medium-level, with explicit emphasis on real-world problem solving and drawing on your own experience rather than exotic algorithms. Around 120 to 150 pattern-grouped problems is sufficient; 500 is not a better use of the hours.',
      },
      {
        id: 'int01_c2',
        front: 'Which language should you prepare in?',
        back:
          'C++ if you are targeting flight software, because the round will also probe pointers, memory and concurrency. Python is fine, and usually preferred, for the take-home data or protocol problem.',
      },
      {
        id: 'int01_c3',
        front: 'Name the engineering variants that come up instead of pure puzzles',
        back:
          'Decommutate a binary packet spec; find dropouts and compute statistics on noisy telemetry; align two time series at different rates; implement a ring buffer; implement a PID with anti-windup; compute a running median over a stream.',
      },
      {
        id: 'int01_c4',
        front: 'What should you say before writing any code?',
        back:
          'Restate the problem, state the input assumptions you are making, name the approach and its time and space complexity, and mention the edge cases you intend to handle. That sequence is most of what is being assessed.',
      },
      {
        id: 'int01_c5',
        front: 'Which patterns cover the majority of medium problems?',
        back:
          'Two pointers, sliding window, hash map counting, binary search (including on the answer), sorting plus intervals, stack/queue, tree and graph traversal, heap, prefix sums, and light dynamic programming.',
      },
      {
        id: 'int01_c6',
        front: 'What can you safely skip?',
        back:
          'Exotic dynamic programming, advanced graph theory, segment trees and heavy competitive-programming material. They are not what a medium-level, real-world-flavoured bar tests.',
      },
      {
        id: 'int01_c7',
        front: 'How do you get O(n) sliding-window maximum?',
        back:
          'A monotonic deque of indices whose values decrease. Each index enters once and leaves once, so the total work is linear despite the inner while loop, and the front is always the window maximum.',
      },
      {
        id: 'int01_c8',
        front: 'Running median over a stream: the standard approach',
        back:
          'Two heaps, a max-heap of the lower half and a min-heap of the upper half, rebalanced so their sizes differ by at most one. Insert is O(log n) and the median is the top of one heap or the mean of both tops.',
      },
      {
        id: 'int01_c9',
        front: 'What does binary search on the answer mean?',
        back:
          'When the answer is a number and feasibility is monotone in it, binary search the value and test feasibility, rather than searching an array. Minimum capacity, minimum rate and minimum time problems are all this pattern.',
      },
      {
        id: 'int01_c10',
        front: 'Which edge cases should you always test unprompted?',
        back:
          'Empty input, single element, all elements equal, the window or k equal to the input size, negative values, and an input that triggers the overwrite or wrap-around branch. Raising them yourself is worth more than the code.',
      },
      {
        id: 'int01_c11',
        front: 'Parsing a binary protocol: what do you have to get right?',
        back:
          'Endianness, field widths and the exact struct format string, resynchronisation after a corrupt frame, checksum verification, and refusing to emit a truncated trailing frame. Say all five aloud before coding.',
      },
      {
        id: 'int01_c12',
        front: 'Why does a ring buffer come up so often in this domain?',
        back:
          'It is the flight-software telemetry structure: fixed memory, O(1) push, never allocates, and naturally retains the most recent window for a post-fault snapshot. It also exercises modular arithmetic and off-by-one care in ten lines.',
      },
      {
        id: 'int01_c13',
        front: 'What does anti-windup do in a PID?',
        back:
          'It stops the integral term accumulating while the actuator is saturated, since that integral cannot produce any additional output and will overshoot badly on recovery. Common fixes are clamping the integrator, conditional integration, and back-calculation from the saturated output.',
      },
    ],
    quiz: [
      {
        id: 'int01_q1',
        q: 'Which best describes the reported SpaceX coding bar?',
        choices: [
          'Hard competitive-programming problems',
          'Medium-level problems with emphasis on real-world problem solving and your own experience',
          'No coding at all',
          'Only whiteboard system design',
        ],
        answer: 1,
        explain:
          'Multiple aggregated accounts describe medium level with real-world framing, alongside a practical take-home. Preparing for hard competitive problems misallocates your hours.',
        b: 0.1,
        bloom: 'recall',
      },
      {
        id: 'int01_q2',
        q: 'A take-home asks you to parse a custom binary protocol in Python. Which module is central?',
        choices: ['json', 'struct', 'pickle', 'csv'],
        answer: 1,
        explain:
          'struct handles fixed-width fields and endianness. The real difficulty is resynchronisation and checksum handling, not the unpacking itself.',
        b: -0.2,
        bloom: 'apply',
      },
      {
        id: 'int01_q3',
        q: 'What is the complexity of the monotonic-deque sliding-window maximum?',
        choices: ['O(n*w)', 'O(n log n)', 'O(n)', 'O(w log w)'],
        answer: 2,
        explain:
          'Each index is pushed once and popped at most once across the whole run, so the total deque work is linear despite the nested while loop.',
        b: 0.5,
        bloom: 'understand',
      },
      {
        id: 'int01_q4',
        q: 'A problem asks for the minimum downlink rate that clears a backlog within a deadline. Which pattern?',
        choices: [
          'Dynamic programming',
          'Binary search on the answer, with a linear feasibility check',
          'Topological sort',
          'Union-find',
        ],
        answer: 1,
        explain:
          'Feasibility is monotone in the rate, so binary search the rate and simulate to check. This pattern appears constantly in engineering-flavoured problems.',
        b: 0.7,
        bloom: 'apply',
      },
      {
        id: 'int01_q5',
        q: 'Which is the best use of the first two minutes of a coding round?',
        choices: [
          'Start typing immediately',
          'Restate the problem, confirm assumptions and edge cases, and state the approach with its complexity',
          'Ask which language is preferred and wait',
          'Write the test cases first, silently',
        ],
        answer: 1,
        explain:
          'The interviewer is assessing reasoning and communication as much as the code. Silence and immediate typing both lose information they need.',
        b: -0.4,
        bloom: 'apply',
      },
      {
        id: 'int01_q6',
        q: 'Running median over a stream is best done with:',
        choices: [
          'Sorting the window on every insertion',
          'Two heaps balanced around the median',
          'A hash map of counts',
          'A single sorted vector with binary insertion',
        ],
        answer: 1,
        explain:
          'Two heaps give O(log n) insertion and O(1) median. Re-sorting is O(n log n) per sample and binary insertion is O(n) per sample from the shifting.',
        b: 0.6,
        bloom: 'apply',
      },
      {
        id: 'int01_q7',
        q: 'Your decommutator emits a frame from the last eight bytes of the buffer. What is the defect?',
        choices: [
          'A checksum error',
          'It emitted a truncated frame; the loop must require a full frame length to remain before parsing',
          'The endianness is wrong',
          'The magic byte is wrong',
        ],
        answer: 1,
        explain:
          'A partial frame at the end of a buffer is normal when a stream is chunked. The parser must leave those bytes for the next chunk rather than inventing a value.',
        b: 0.8,
        bloom: 'analyze',
      },
      {
        id: 'int01_q8',
        q: 'Why does a flight-software interviewer like the ring-buffer question?',
        choices: [
          'It is easy to grade',
          'It is genuinely used for telemetry, exercises fixed-memory thinking and modular arithmetic, and has obvious edge cases to discuss',
          'It requires dynamic programming',
          'It tests template metaprogramming',
        ],
        answer: 1,
        explain:
          'It maps directly onto real flight-code structures while remaining a ten-minute problem, and the conversation about overwrite policy and allocation is the real content.',
        b: 0.3,
        bloom: 'understand',
      },
    ],
    tags: ['interview', 'spacex-core'],
    importance: 1.45,
  },

  {
    id: 'cod_int_02_onsite',
    track: 'coding',
    tier: 11,
    title: 'The SpaceX Onsite: Systems, Design, Presentation and Behavioural',
    summary:
      "Five to eight rounds over four to six weeks, with a presentation to the team whose question-and-answer runs longer than the talk, and behavioural content reported at 30 to 50 percent of onsite time. Prepare the stories and the system-design answers as deliberately as the code.",
    prereqs: ['cod_int_01_algorithms', 'cod_cpp_08_realtime', 'cod_py_07_integration', 'cod_slk_04_codegen'],
    hours: 40,
    topics: [
      'The reported process: recruiter screen, a two to four hour take-home or timed challenge, technical rounds, a day-long onsite of four to six rounds, behavioural throughout',
      'US person status under ITAR as a hard gate for essentially all roles',
      'Systems C++ round: pointers and memory, double delete, RAII, rule of five, unique_ptr versus shared_ptr, virtual destructors, vtable layout, move semantics, undefined behaviour, static and const and volatile, data races, cache effects',
      'Live debugging: here is code that crashes or leaks, find it',
      'Engineering system design: GNC simulation infrastructure for a constellation; a telemetry pipeline for six thousand satellites; how you would verify this flight software; how you would architect a fault-tolerant flight computer',
      'Knowing the SpaceX answer: three dual-core x86 flight strings, per-string core cross-check, PowerPC actuator controllers judging three commands',
      'Domain rounds for GNC roles: PD control, orbit determination, frequency domain, aerodynamic drag with real examples',
      'The technical presentation: about twelve minutes of slides and twenty-plus minutes of debate',
      'Behavioural themes: mission alignment, extreme ownership, operating with ambiguity and speed, intellectual honesty about failure',
      'Saying what you personally modelled, coded, analysed, tuned, tested or debugged versus what the team did',
      'Fermi and order-of-magnitude estimation out loud',
      'Building six to eight STAR stories from the capstones, each with a number in it',
      'Questions to ask that show you understand the work',
    ],
    objectives: [
      'Answer a systems C++ round on memory, ownership and concurrency without hesitation.',
      'Design a GNC simulation infrastructure aloud, covering interfaces, determinism, dispersion, HITL hooks, CI, storage and visualisation.',
      'Describe the SpaceX fault-tolerant flight-computer architecture accurately and say why it works.',
      'Deliver a twelve-slide technical talk on a capstone and survive twenty minutes of hostile questions.',
      'Tell six to eight STAR stories that each contain a number and a clear statement of what you personally did.',
    ],
    resources: [
      {
        title: 'Google Engineering Practices: Code Review Developer Guide',
        author: 'Google',
        kind: 'docs',
        url: 'https://google.github.io/eng-practices/review/',
        free: true,
        note: 'Useful preparation for the how-would-you-review-this half of a systems round.',
      },
      {
        title: 'The Craft of Scientific Presentations, 2nd ed.',
        author: 'Michael Alley',
        kind: 'book',
        free: false,
        note: 'Directly relevant: the onsite presentation is judged on the question-and-answer, not the slides.',
      },
      {
        title: 'C++ Core Guidelines',
        author: 'Bjarne Stroustrup and Herb Sutter',
        kind: 'docs',
        url: 'https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines',
        free: true,
      },
      {
        title: 'Building the software that helps build SpaceX',
        author: 'Stack Overflow Blog',
        kind: 'site',
        url: 'https://stackoverflow.blog/',
        free: true,
        note: 'Background on the internal and ground software stack; useful for asking informed questions.',
      },
    ],
    exercises: [
      {
        id: 'int02_ex1',
        title: 'Design the GNC simulation infrastructure, aloud',
        prompt:
          'In 25 minutes, design the simulation infrastructure for a satellite constellation GNC team. Cover: module boundaries and interfaces, determinism and seeded reproducibility, the dispersed Monte Carlo layer, hardware-in-the-loop hooks, the C++ core with a Python harness, continuous integration with tolerance-based regression, results storage and the visualisation layer. Record yourself, then critique the recording against the real Starlink GNC-Simulations job description.',
        kind: 'analysis',
        hours: 4,
      },
      {
        id: 'int02_ex2',
        title: 'Twelve slides and twenty minutes of fire',
        prompt:
          'Build a twelve-slide technical deck on your Monte Carlo ascent simulator or C++ GNC application: problem, model and its fidelity limits, method, verification, results with uncertainty, and the conclusion you will defend. Present it to someone instructed to interrupt and challenge every assumption. Success criteria: you never say it just works, you concede at least one real limitation unprompted, and every number on every slide has a stated source.',
        kind: 'build',
        hours: 6,
      },
      {
        id: 'int02_ex3',
        title: 'Eight STAR stories with numbers',
        prompt:
          'Write eight stories in situation, task, action, result form drawn from the capstones in this track. Each must contain at least one number, must state explicitly what you personally did versus what was a team or a library, and at least two must be about a failure you caused or missed and what you changed afterwards. Rehearse each to under two minutes.',
        kind: 'analysis',
        hours: 5,
      },
    ],
    cards: [
      {
        id: 'int02_c1',
        front: 'What does the SpaceX process look like end to end?',
        back:
          'Recruiter screen, a roughly two to four hour take-home or timed challenge, technical rounds with the hiring team, then a day-long onsite of four to six rounds including a presentation to the team. Commonly five to eight touchpoints over four to six weeks, and it can stop at any stage.',
      },
      {
        id: 'int02_c2',
        front: 'How much of the onsite is behavioural?',
        back:
          'Reported at 30 to 50 percent. The themes are mission alignment, ownership end to end, tolerance for ambiguity and pace, and honesty about failure. Treat it as half the interview, because it is.',
      },
      {
        id: 'int02_c3',
        front: 'What is the reported dynamic of the team presentation?',
        back:
          'About twelve minutes of slides and twenty or more minutes of debate. Optimise for defending your assumptions, not for slide polish, and know which numbers on each slide you can derive from first principles.',
      },
      {
        id: 'int02_c4',
        front: 'How would you architect a fault-tolerant flight computer, and what is the SpaceX answer?',
        back:
          'Redundancy with cross-checking rather than rad-hard parts: three dual-core x86 flight strings, each comparing its two cores and issuing no command on disagreement, and PowerPC microcontrollers at the actuators judging among the three commands they receive. Citing it shows you did the homework.',
      },
      {
        id: 'int02_c5',
        front: 'Design a telemetry pipeline for six thousand satellites: the skeleton answer',
        back:
          'Ingest through a streaming bus, decommutation and schema handling, a hot time-series store plus a columnar archive, partitioning by time, continuous aggregates for dashboards, gap and duplicate detection, retention and export-control handling, and a query path every plot can be traced to.',
      },
      {
        id: 'int02_c6',
        front: 'How would you verify this flight software?',
        back:
          'Unit tests with meaningful tolerances, then model-in-the-loop, software-in-the-loop, processor-in-the-loop and hardware-in-the-loop, with structural coverage including MC/DC, requirements traceability, Monte Carlo dispersion, fault injection and independent review.',
      },
      {
        id: 'int02_c7',
        front: 'Systems C++ round: the ten things to have ready',
        back:
          'What double delete does, RAII in three sentences, rule of five and when moves are suppressed, unique_ptr versus shared_ptr cost, virtual destructors, vtable layout, what std::move actually does, three examples of undefined behaviour, what a data race is, and why you would avoid new in a hot path.',
      },
      {
        id: 'int02_c8',
        front: 'What is the Katalyst sentence you must be able to answer?',
        back:
          'What was personally modelled, coded, analysed, tuned, tested or debugged by you versus completed by a team. Build the portfolio so that answer is specific and verifiable, and rehearse saying it without either inflating or deflating your contribution.',
      },
      {
        id: 'int02_c9',
        front: 'Which GNC domain topics were actually reported by candidates?',
        back:
          'PD control, orbit determination, the frequency domain, and aerodynamic drag with real-life examples from a senior GNC engineer. Glassdoor rates the GNC interview difficulty around 2.8 out of 5 with a large majority positive: hard but fair.',
      },
      {
        id: 'int02_c10',
        front: 'How do you handle a Fermi estimation question?',
        back:
          'Decompose out loud into quantities you can bound, state each assumption and its uncertainty, carry units throughout, compute to one significant figure, then sanity-check the magnitude against something you know. The reasoning is the answer.',
      },
      {
        id: 'int02_c11',
        front: 'What makes a STAR story land in this context?',
        back:
          'A number, a clear boundary between your work and the team work, a decision you made under uncertainty, and what you would do differently. Stories with no number and no personal ownership read as narration.',
      },
      {
        id: 'int02_c12',
        front: 'What is the ITAR gate?',
        back:
          'Essentially all SpaceX roles require US person status, meaning a citizen or lawful permanent resident, because the work is export-controlled. It is confirmed in the recruiter screen and it is not negotiable.',
      },
      {
        id: 'int02_c13',
        front: 'What questions should you ask them?',
        back:
          'Specific ones that show you read the work: how the sim team handles regression tolerances, where the boundary sits between generated and hand-written flight code, how dispersions are chosen and reported, how a HIL failure gets triaged. Generic culture questions waste the slot.',
      },
      {
        id: 'int02_c14',
        front: 'Being honest about failure: how far do you go?',
        back:
          'Name a real defect you caused or missed, what it cost, how it was found, and the specific process or test you changed so it cannot recur. Intellectual honesty is one of the four things being probed, and a scrubbed story is transparent.',
      },
    ],
    quiz: [
      {
        id: 'int02_q1',
        q: 'How much of a SpaceX onsite is reported to be behavioural?',
        choices: ['Under 10 percent', 'About 30 to 50 percent', 'Exactly one round of 30 minutes', 'None'],
        answer: 1,
        explain:
          'Aggregated accounts put it at 30 to 50 percent of onsite time, probing mission alignment, ownership, ambiguity tolerance and honesty about failure.',
        b: 0.2,
        bloom: 'recall',
      },
      {
        id: 'int02_q2',
        q: 'Asked to architect a fault-tolerant flight computer, the strongest answer includes:',
        choices: [
          'A single rad-hard processor',
          'Three self-checking dual-core strings that stay silent on internal disagreement, with actuator controllers judging among three received commands',
          'Triple-modular redundancy in the ground segment',
          'Running the control law twice on one core',
        ],
        answer: 1,
        explain:
          'That is the actual SpaceX Actor-Judge architecture, and it explains how commodity x86 parts can fly. Citing it demonstrates preparation as well as reasoning.',
        b: 0.7,
        bloom: 'apply',
      },
      {
        id: 'int02_q3',
        q: 'In the team presentation, what is the reported balance?',
        choices: [
          'Thirty minutes of slides, five minutes of questions',
          'Roughly twelve minutes of slides and twenty or more minutes of debate',
          'No questions permitted',
          'Slides submitted in advance and not presented',
        ],
        answer: 1,
        explain:
          'The question-and-answer runs longer than the talk, so preparation should target defending assumptions rather than slide count.',
        b: 0.4,
        bloom: 'recall',
      },
      {
        id: 'int02_q4',
        q: 'Which STAR story is strongest?',
        choices: [
          'Our team built a simulator and it worked well',
          'I found a 0.4 degree attitude bias by comparing my MEKF against a 500-case Monte Carlo, traced it to a scalar-first quaternion mix-up at the Python to C++ boundary, and added a round-trip property test to the CI suite',
          'I am passionate about space and work hard under pressure',
          'I used Python, C++ and MATLAB on several projects',
        ],
        answer: 1,
        explain:
          'It has a number, a specific technical cause, a clear statement of personal action, and a process change that prevents recurrence.',
        b: 0.3,
        bloom: 'analyze',
      },
      {
        id: 'int02_q5',
        q: 'Asked how you would verify flight software, which answer is complete?',
        choices: [
          'Write unit tests with high coverage',
          'Unit tests with justified tolerances, then MIL, SIL, PIL and HIL, with structural coverage including MC/DC, requirements traceability, Monte Carlo dispersion, fault injection and independent review',
          'Run it on the hardware and see',
          'Static analysis alone',
        ],
        answer: 1,
        explain:
          'Each level closes a different gap, and the traceability and coverage evidence is what makes the argument auditable rather than anecdotal.',
        b: 0.6,
        bloom: 'apply',
      },
      {
        id: 'int02_q6',
        q: 'A senior GNC engineer asks about aerodynamic drag with real examples. What are they probing?',
        choices: [
          'Memorisation of the drag equation',
          'Whether you can reason from first principles about dynamic pressure, coefficient variation with Mach, and what that means for loads and control authority in a real trajectory',
          'Your CAD skills',
          'Your knowledge of MATLAB syntax',
        ],
        answer: 1,
        explain:
          'Reported GNC rounds favour first-principles reasoning tied to real vehicle behaviour, which is also what the Katalyst posting asks for explicitly.',
        b: 0.5,
        bloom: 'understand',
      },
      {
        id: 'int02_q7',
        q: 'What is the correct expectation about ITAR for these roles?',
        choices: [
          'It applies only to hardware roles',
          'Essentially all roles require US person status, confirmed early in the process',
          'It can be waived for strong candidates',
          'It applies only after an offer',
        ],
        answer: 1,
        explain:
          'The work is export-controlled, so the status question comes in the recruiter screen and is not negotiable.',
        b: 0.0,
        bloom: 'recall',
      },
      {
        id: 'int02_q8',
        q: 'Which question would you ask at the end of a GNC simulation round?',
        choices: [
          'What is the company culture like?',
          'How do you choose regression tolerances for the sim suite, and how do you triage a nightly Monte Carlo that fails on two of a thousand cases?',
          'How many vacation days are there?',
          'Do you use Python?',
        ],
        answer: 1,
        explain:
          'It is specific, it shows you have actually run such a suite, and it starts a technical conversation rather than closing one.',
        b: 0.4,
        bloom: 'apply',
      },
    ],
    tags: ['interview', 'spacex-core'],
    importance: 1.5,
  },
]
