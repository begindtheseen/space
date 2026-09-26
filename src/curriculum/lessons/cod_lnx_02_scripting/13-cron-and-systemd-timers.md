---
id: l13-cron-and-systemd-timers
title: cron and systemd timers
minutes: 22
covers:
  - cron and systemd timers
---

Think of an alarm clock. You set it once, go to sleep, and it rings at 6:30 every morning without you touching it again. A **scheduler** is an alarm clock for commands: you tell it "run this script at 02:30 every night", and it does, whether or not anyone is logged in.

A script that runs only when you type it is a tool. A script that runs at 02:30, collects the day's telemetry from a ground station and leaves a report for the team in the morning is **infrastructure** — something other people depend on without thinking about it. Linux has two schedulers. `cron` has been on Unix machines since the 1970s and is on nearly every machine today. **systemd timers** are newer, can do more, and are what the Linux distributions now use for their own housekeeping.

One trap is the same for both, and it is the previous module's lesson 10 showing up in practice: a scheduled job runs in an environment that is nothing like your shell. A different `PATH`, no `~/.bashrc`, a different working folder, no terminal. When someone says "it works when I run it and not from cron", this is the reason almost every time.

All output below was produced on this machine and pasted verbatim, with **[[cron 3.0pl1|vixie-cron]]** and systemd 255 on Ubuntu 24.04.4, inside a container running its own `systemd`. Times shown are from the moment of capture.

## cron: one line per job

cron is a **[[daemon|daemon-word]]** — a program that runs in the background all the time, with no window and no keyboard. It wakes once a minute, looks at every user's list of jobs, and starts the ones that are due.

That list is called a **crontab** ("cron table"). Each user has one. Four commands manage it:

- `crontab -e` opens it in an editor;
- `crontab -l` lists it;
- `crontab file` replaces it with the contents of `file`;
- `crontab -r` removes it.

Here is a real one:

```bash
crontab -l
```

```text
# m h  dom mon dow  command
SHELL=/bin/bash
PATH=/usr/local/bin:/usr/bin:/bin
MAILTO=""

# every night at 02:30 UTC
30 2 * * * /srv/campaign/bin/nightly.sh >> /srv/campaign/out/cron.log 2>&1

# every 15 minutes, weekdays only
*/15 * * * 1-5 /srv/campaign/bin/nightly.sh >/dev/null 2>&1
```

Lines starting with `#` are comments. Each job line has **[[five time fields|five-fields]]**, then the command:

| Field | Range |
| --- | --- |
| minute | 0–59 |
| hour | 0–23 |
| day of month | 1–31 |
| month | 1–12 or `jan`–`dec` |
| day of week | 0–7 or `sun`–`sat`, where both 0 and 7 are Sunday |

So `30 2 * * *` reads "minute 30, hour 2, any day of the month, any month, any day of the week" — 02:30 every day. The hour is on the machine's own clock, which is **[[UTC here|local-time]]**.

Four ways to write a field:

- `*`, read "star", means every value;
- `*/15`, read "star slash fifteen", means every fifteenth value — minutes 0, 15, 30 and 45;
- `1-5` is a range, Monday through Friday in the day-of-week field;
- `1,15` is a list — the 1st and the 15th.

::: warning The two day fields combine with "or"
The other fields combine with "and": minute 30 **and** hour 2. But if **both** day-of-month and day-of-week are restricted — neither is `*` — cron runs when **either** one matches. So `0 0 13 * 5` means "every 13th, **and** every Friday", not "Friday the 13th".
:::

Six shorthands replace all five fields: `@yearly`, `@monthly`, `@weekly`, `@daily`, `@hourly`, and `@reboot` (once, when the machine starts).

Lines like `NAME=value` before the jobs configure cron: `SHELL` picks the program that runs each command, `PATH` where commands are looked up, and `MAILTO` who is mailed the output — `MAILTO=""` means nobody.

::: warning A cron job's environment is small, and it is not yours
Here is the same script run once by cron and once by `systemd`, each time printing its own `PATH`:

```text
2026-09-22T22:00:01Z nightly sweep ran, PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:/snap/bin
2026-09-22T22:00:02Z nightly sweep ran, PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin
```

Two different paths, and neither is the one in your login shell. Nothing under `/opt`, nothing from a virtual environment, nothing your `~/.bashrc` adds. cron starts a non-interactive, non-login shell, and that kind of shell reads neither `.bashrc` nor `.bash_profile`.

So: use absolute paths in the crontab line, set `PATH` at the top of the crontab or inside the script, and never assume a working folder — cron starts the job in your home folder. The reliable shape is a wrapper script that sets everything it needs itself and is called by its absolute path.

The second trap is **`%`**, the percent sign. In a crontab line, a bare `%` ends the command, and everything after it is fed to the job as standard input. So a `date +%F` in a job line cuts the command short. Write each one as `\%`, read "backslash percent":

```text
* * * * * date -u +\%FT\%TZ >> /srv/campaign/out/pct.log
```

`crontab -l` shows the backslashes, because they are stored. Calling a script instead avoids the question entirely — the better habit anyway.
:::

### Where the output goes

By default, anything a cron job prints — to standard output or standard error — is **mailed** to the user. On a machine with no **[[mail system|mail-transport]]** set up, it is thrown away without a word. That is why a failing cron job is so often invisible.

So redirect it yourself. `>> /path/to/log 2>&1` keeps everything: `>>`, read "append to", adds to the end of the log, and `2>&1`, read "two to one", sends error output to the same place. That is what the first job above does. `>/dev/null 2>&1` throws everything away on purpose. That is honest, but it discards your only clue when something breaks. Better still, have the script write its own log, and keep the crontab redirect for the unexpected.

The daemon also logs each job it starts, which tells "did not run" apart from "ran and failed":

```bash
journalctl -u cron --no-pager -n 3
```

```text
Sep 22 22:00:01 vm CRON[941]: pam_unix(cron:session): session opened for user root(uid=0) by root(uid=0)
Sep 22 22:00:01 vm CRON[942]: (root) CMD (/srv/campaign/bin/nightly.sh)
Sep 22 22:00:01 vm CRON[941]: pam_unix(cron:session): session closed for user root
```

`(root) CMD (…)` is cron's record that it started the command as user `root`. If that line is missing, the schedule is wrong. If it is there and nothing happened, the job itself is at fault.

::: example Installing a cron job and proving it fired
Here is the whole cycle, with a once-a-minute job so you can watch it.

**Step 1: install.** `crontab -` (with a dash) reads the new crontab from standard input. That is the form for scripts; `crontab -e` opens an editor and is for people.

```bash
printf '* * * * * /srv/campaign/bin/nightly.sh\n' | crontab -
crontab -l
```

```text
* * * * * /srv/campaign/bin/nightly.sh
```

**Step 2: wait for the next minute, then read the script's own log.**

```bash
cat /srv/campaign/out/nightly.log
```

```text
2026-09-22T22:00:01Z nightly sweep ran, PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:/snap/bin
```

It fired at 22:00:01 — cron starts jobs a second or so after the minute, so `:01` is normal. Sanity check: the `PATH` is cron's, not the login shell's — the environment trap in action.

**Step 3: confirm from the daemon's side**, which does not depend on anything the script does:

```bash
journalctl -u cron --no-pager -n 3
```

```text
Sep 22 22:00:01 vm CRON[941]: pam_unix(cron:session): session opened for user root(uid=0) by root(uid=0)
Sep 22 22:00:01 vm CRON[942]: (root) CMD (/srv/campaign/bin/nightly.sh)
Sep 22 22:00:01 vm CRON[941]: pam_unix(cron:session): session closed for user root
```

Search for that `(root) CMD (...)` line when a job "did not run".

**Step 4: remove it.** There is **no confirmation**:

```bash
crontab -r
crontab -l
```

```text
no crontab for root
```

`crontab -l` exits with status 1 when there is no crontab. The `r` key sits right next to the `e` key, and `crontab -r` typed for `crontab -e` has destroyed many a carefully built schedule. Two habits prevent it: `crontab -l > crontab.bak` before editing, and keeping the crontab in version control, installed with `crontab file`.
:::

### System crontabs

`/etc/crontab` and the files in `/etc/cron.d/` use the same format with **one extra field**: the user to run as, placed between day-of-week and the command.

The folders `/etc/cron.hourly`, `/etc/cron.daily`, `/etc/cron.weekly` and `/etc/cron.monthly` hold ordinary executable scripts that run on that schedule. There is no crontab syntax at all — you drop in a script. It is the simplest way for a package to install a periodic job, though it has **[[one naming catch|run-parts-names]]**.

## systemd timers: the clock and the job are separate

With cron, the clock and the job share one line. systemd splits them into two **units** — the configuration files systemd manages, which you met in the previous module's lesson 12:

- a **`.service`** unit, which says *what* to run;
- a **`.timer`** unit, which says *when*.

They must **[[share a name|timer-activates-service]]** (`sim-nightly.timer` starts `sim-nightly.service`), or the timer must name its service with `Unit=`.

```bash
systemctl cat sim-nightly.timer
```

```text
# /run/systemd/system/sim-nightly.timer
[Unit]
Description=Run the nightly campaign sweep

[Timer]
OnCalendar=*-*-* 02:30:00
Persistent=true
RandomizedDelaySec=10min
AccuracySec=1min

[Install]
WantedBy=timers.target
```

The service is an ordinary `Type=oneshot` unit — one that runs a command to completion and stops:

```text
[Unit]
Description=Nightly campaign sweep

[Service]
Type=oneshot
ExecStart=/srv/campaign/bin/nightly.sh
```

The `[Timer]` settings worth knowing:

| Directive | Meaning |
| --- | --- |
| `OnCalendar=` | a wall-clock schedule, like cron's five fields |
| `OnBootSec=`, `OnStartupSec=` | relative to boot, or to systemd starting |
| `OnUnitActiveSec=`, `OnUnitInactiveSec=` | relative to the service's last run — a true interval |
| `Persistent=true` | if a run was missed because the machine was off, run it at next boot |
| `RandomizedDelaySec=` | a random delay added to each start, so a fleet does not all start at once |
| `AccuracySec=` | how much the timer may be bunched with others; default 1 minute |

`Persistent=` and `RandomizedDelaySec=` are the two things cron does not have that matter most in practice. The first stops a nightly job from being skipped because the machine was down at 02:30. The second stops two hundred computers hammering one shared disk at exactly 02:30 — a pile-up called a **[[thundering herd|thundering-herd]]**. By default a fresh random delay is drawn for each run; `FixedRandomDelay=true` keeps the same delay for that timer on that machine every time.

### Writing and checking a calendar

`OnCalendar` is written `DayOfWeek Year-Month-Day Hour:Minute:Second`, with `*` for "any". So `*-*-* 02:30:00` reads "any year, any month, any day, at 02:30:00". In `Mon..Fri`, the two dots mean "through".

You can check an expression *before* you install it with `systemd-analyze calendar`:

```bash
systemd-analyze calendar "*-*-* 02:30:00"
```

```text
Normalized form: *-*-* 02:30:00
    Next elapse: Wed 2026-09-23 02:30:00 UTC
       From now: 4h 29min left
```

"Next elapse" is the next time it will fire. Sanity check: the capture was at about 22:00, and 22:00 plus 4 hours 29 minutes is 02:29, one minute short of 02:30 — the rest is seconds rounded away.

```bash
systemd-analyze calendar "Mon..Fri 08:00"
```

```text
  Original form: Mon..Fri 08:00
Normalized form: Mon..Fri *-*-* 08:00:00
    Next elapse: Wed 2026-09-23 08:00:00 UTC
       From now: 9h left
```

The words `hourly`, `daily`, `weekly` and `monthly` are shorthands, and they expand to full expressions too (`daily` becomes `*-*-* 00:00:00`). An impossible time is rejected instead of being accepted and never firing:

```bash
systemd-analyze calendar "*-*-* 25:00:00"
```

```text
Failed to parse calendar specification '*-*-* 25:00:00': Invalid argument
```

The exit status is 1, so a script can check it. cron has no equivalent check for a crontab line.

::: example Installing, testing and watching a timer
**Step 1: load and check.** After writing both unit files, tell systemd to reread them, then check the timer file:

```bash
systemctl daemon-reload
systemd-analyze verify /run/systemd/system/sim-nightly.timer; echo "verify exit=$?"
```

```text
verify exit=0
```

**Step 2: run the work by hand, before arming the clock.** This is the most useful habit with timers, and cron has nothing like it:

```bash
systemctl start sim-nightly.service
systemctl status sim-nightly.service --no-pager | head -6
```

```text
○ sim-nightly.service - Nightly campaign sweep
     Loaded: loaded (/run/systemd/system/sim-nightly.service; static)
     Active: inactive (dead)

Sep 22 22:00:02 vm systemd[1]: Starting sim-nightly.service - Nightly campaign sweep...
Sep 22 22:00:02 vm systemd[1]: sim-nightly.service: Deactivated successfully.
```

For a `Type=oneshot` service, `inactive (dead)` after a run means **success**: it ran and finished. The hollow circle `○` and "Deactivated successfully" say so; a failure shows `×` and a non-zero `status=`.

**Step 3: arm the timer and read the schedule back:**

```bash
systemctl start sim-nightly.timer
systemctl list-timers --no-pager sim-nightly.timer
```

```text
NEXT                            LEFT LAST PASSED UNIT              ACTIVATES
Wed 2026-09-23 02:34:48 UTC 4h 34min -         - sim-nightly.timer sim-nightly.service
```

The next run is `02:34:48`, not `02:30:00`. That is `RandomizedDelaySec=10min` at work: a random 4 minutes 48 seconds was added, which is inside the 10-minute window, as it should be. `LAST` and `PASSED` show `-` because it has never run from the timer yet.

`systemctl list-timers` with no unit name answers "what is scheduled on this machine?"; `--all` adds timers that are not armed. `systemctl list-unit-files --type=timer` shows which are enabled at boot. `start` arms a timer now; `enable` arms it at every boot. Both apply to the **timer**, not the service.

**Step 4: read what the job printed.** Everything lands in the journal under the *service* name:

```bash
journalctl -u sim-nightly.service --no-pager -n 6
```

```text
Sep 22 22:00:02 vm systemd[1]: Starting sim-nightly.service - Nightly campaign sweep...
Sep 22 22:00:02 vm systemd[1]: sim-nightly.service: Deactivated successfully.
Sep 22 22:00:02 vm systemd[1]: Finished sim-nightly.service - Nightly campaign sweep.
Sep 22 22:00:03 vm systemd[1]: Starting sim-nightly.service - Nightly campaign sweep...
Sep 22 22:00:03 vm systemd[1]: sim-nightly.service: Deactivated successfully.
Sep 22 22:00:03 vm systemd[1]: Finished sim-nightly.service - Nightly campaign sweep.
```

Each run leaves three lines: Starting, Deactivated successfully, Finished. Two runs are shown here. No redirect, no mail: the output is there, timestamped and searchable.
:::

## Choosing between them

| | cron | systemd timer |
| --- | --- | --- |
| present on | everything, including containers and BSD | any systemd Linux |
| definition | one line | two unit files |
| syntax check | none | `systemd-analyze calendar` and `verify` |
| run it now, by hand | copy the line and paste it | `systemctl start NAME.service` |
| output | mailed, or lost | the journal, automatically |
| missed while off | skipped | `Persistent=true` catches up |
| jitter | none | `RandomizedDelaySec=` |
| resource limits, sandboxing | none | every `[Service]` directive |
| depends on another unit | no | `After=`, `Requires=` |

Use **cron** for something small on a machine you do not control, or where one line is worth more than the features. Use a **timer** for your own infrastructure: running the service by hand, automatic logging and `Persistent=` remove the three commonest ways a scheduled job fails silently.

One thing neither gives you. Both start the job whether or not the last run has finished. The lock from lesson 07 stops two copies running at once:

```bash
exec 9>lock; flock -n 9 || exit 0
```

That opens a file on descriptor 9 and asks the kernel for a lock on it. `-n` means "do not wait": if another copy holds the lock, this one exits quietly.

::: key cron and systemd timers
Both schedulers run jobs in a minimal, non-interactive environment with a `PATH` that is not yours: use absolute paths and set what you need explicitly. In a crontab, `%` must be escaped and output is mailed or lost, so redirect it. A systemd timer is a `.timer` plus a `.service`: check `OnCalendar` with `systemd-analyze calendar`, test the work with `systemctl start NAME.service`, watch it with `journalctl -u NAME.service`, and use `Persistent=true` and `RandomizedDelaySec=` for anything on a fleet.
:::

## Check yourself

::: check
A nightly job works when you run it by hand and fails from cron with "command not found". Give the mechanism and three fixes.
:::

::: answer
**The mechanism.** cron runs the command in a non-interactive, non-login shell, so neither `~/.bash_profile` nor `~/.bashrc` is read at all. The `PATH` is cron's own — often `/usr/bin:/bin` or the distribution's default. It has nothing from `/opt`, nothing from a conda or virtual environment, and nothing your login adds.

**Three fixes**, from quickest to sturdiest:

1. Set `PATH=` at the top of the crontab. cron applies it to every job below it.
2. Use the absolute path in the job line — `/opt/simtools/bin/simrun` — so nothing has to be looked up.
3. Best: call a wrapper script that begins `#!/usr/bin/env bash` and `set -euo pipefail`, then sets `PATH`, `LD_LIBRARY_PATH` and any tool settings itself. Now the job's environment is written down in one file you can read and test.

To reproduce the failure without waiting for 02:30, run `env -i /bin/sh -c '/path/to/job.sh'`. `env -i` starts with an empty environment. The shell then fills in only a short default `PATH` — on this machine `/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin`, with nothing from `/opt`. If the job fails there, it will fail from cron.
:::

::: check
Why does a systemd timer let you test the work without waiting, and what does `systemctl start NAME.timer` do differently from `systemctl start NAME.service`?
:::

::: answer
Because the schedule and the work are separate units. The `.service` is an ordinary unit that can be started at any time. The `.timer` only decides when systemd starts it. So `systemctl start NAME.service` runs the job **now**, as the same user, in the same environment and working folder the scheduled run will use. That is a true rehearsal.

`systemctl start NAME.timer` does not run the job. It **arms** the timer: the schedule is active from now until the timer is stopped or the machine reboots. `systemctl enable NAME.timer` hooks it into `timers.target`, so it is armed at every boot.

Enabling always applies to the timer. The service has no `[Install]` section — its status says `static` — so there is nothing to enable, which is right: the job should start when the clock says, not at boot.
:::

::: check
`0 0 13 * 5 /srv/bin/check.sh` was meant to run on Friday the 13th. When does it actually run, and how do you get what was meant?
:::

::: answer
It runs at midnight on every 13th of the month **and** at midnight on every Friday. Both day fields are restricted, so cron takes the **union** — either one matching is enough. That is about five runs a month (one 13th plus four or five Fridays) instead of one or two a year.

With cron you have to test inside the job. Schedule `0 0 13 * *` and start the script with `[[ $(date +%u) -eq 5 ]] || exit 0`. (`date +%u` prints the day of the week as 1 for Monday through 7 for Sunday, so 5 is Friday. Inside a script the `%` needs no backslash.)

A systemd timer says it directly: `OnCalendar=Fri *-*-13 00:00:00`. Check it first with `systemd-analyze calendar "Fri *-*-13 00:00:00"`, which shows the next Friday the 13th before you install anything.
:::

::: check
A fleet of two hundred computers runs the same nightly sync at 02:30, and the shared file server falls over. Which two timer settings fix it, and what does neither of them fix?
:::

::: answer
`RandomizedDelaySec=30min` spreads the starts over half an hour, so the load is flat instead of one spike. Add `FixedRandomDelay=true` if you want each computer to keep the same offset every night. `AccuracySec=` controls how much systemd may bunch the timer together with others to save wake-ups; loosening it to a few minutes also helps and costs nothing when the exact minute does not matter.

Neither fixes a run that **overruns**. If the sync takes longer than the interval, a second copy starts while the first is still going — on a shared file server, worse than the original problem. The fix is the lock from lesson 07 at the top of the script:

`exec 9>/var/lock/sync.lock; flock -n 9 || exit 0`

A second copy then exits at once. `flock -w 300 9` waits up to 300 seconds instead, for when queueing is better than skipping.

And neither asks whether two hundred computers should read one file server at all. Staggering is a patch; a local cache or a mirror is a fix.
:::

::: check
How do you find out whether a scheduled job ran at all — with cron, and with a systemd timer?
:::

::: answer
**cron.** Look for the daemon's own record: `journalctl -u cron --since yesterday`, or `/var/log/syslog` on systems without a journal. Each start logs a line of the form `(user) CMD (the command)`.

- No such line: the schedule is wrong or the daemon is down. Check `systemctl is-active cron` and `crontab -l`.
- The line is there but nothing happened: the job ran and failed, and you need its output — mailed or lost unless you redirected it to a log.

**Timer.** `systemctl list-timers` shows `LAST` and `PASSED` for the last run, answering "did it fire?" directly. `systemctl status NAME.timer` shows whether the timer is armed. `systemctl status NAME.service` shows how the last run ended, including its exit status. `journalctl -u NAME.service` holds everything the job printed, with no setup.

That is the main practical argument for timers: with cron you arrange the evidence in advance; with a timer it is there by default.
:::

## Summary

| Thing | Meaning | Note |
| --- | --- | --- |
| `crontab -l` / `-e` / `-r` / `crontab f` | list, edit, remove, install from a file | per user; `-r` has no confirmation |
| `m h dom mon dow cmd` | five time fields | `*/15`, `1-5`, `1,15`; `@daily`, `@reboot` |
| restricted dom **and** dow | cron takes the **union** | `0 0 13 * 5` is not Friday the 13th |
| `SHELL=`, `PATH=`, `MAILTO=` | crontab-level settings | cron's `PATH` is not yours |
| `%` in a crontab | ends the command; rest becomes stdin | escape as `\%`, or use a script |
| output | mailed, or discarded | `>> log 2>&1` explicitly |
| `journalctl -u cron` | `(user) CMD (...)` per start | absent = did not fire |
| `/etc/cron.d`, `/etc/crontab` | system crontabs with a **user** field | `/etc/cron.daily/` takes plain scripts |
| `.timer` + `.service` | schedule and work, as separate units | same name, or `Unit=` |
| `OnCalendar=` | `DoW Y-M-D H:M:S`, `*` for any | `systemd-analyze calendar` checks it |
| `OnBootSec=`, `OnUnitActiveSec=` | relative schedules | a true interval between runs |
| `Persistent=true` | catch up a run missed while off | cron skips it |
| `RandomizedDelaySec=`, `AccuracySec=` | jitter and bunching | `FixedRandomDelay=true` keeps one offset |
| `systemctl start NAME.service` | run the work now, in its real environment | the rehearsal cron does not have |
| `systemctl list-timers [--all]` | `NEXT`, `LEFT`, `LAST`, `PASSED` | enable/disable the **timer** |
| `journalctl -u NAME.service` | everything the job printed | no redirect needed |
| `flock -n 9` | stop overlapping runs | neither scheduler does this for you |

Lesson 14 closes the module with the judgment that keeps all of this maintainable: how to tell when a shell script has outgrown the shell, and what to move it to.

::: context vixie-cron Which cron this is
There are several programs called cron. Most Linux systems run one written by Paul Vixie in the late 1980s, usually called **Vixie cron**. The version string `3.0pl1` in this lesson means Vixie cron 3.0, patch level 1, which Debian and Ubuntu have maintained, with their own fixes, ever since. Other systems use relatives of it, such as `cronie` on Fedora and Red Hat. The five-field format is the same in all of them.
:::

::: context daemon-word Why background programs are called daemons
A **daemon** is a program that starts when the machine boots and keeps running in the background, waiting for work. `cron`, `sshd` and `systemd-journald` are all daemons. Many of their names end in `d` for that reason.

The word comes from the Greek *daimon*, a spirit — not necessarily an evil one. The programmers of MIT's Project MAC in the 1960s said they borrowed it from "Maxwell's demon", a thought-experiment creature in physics that sorts molecules tirelessly without being seen. A background program that does its job without anyone watching seemed like the same kind of helper.
:::

::: context five-fields Reading a cron line
Read the five fields left to right, from the smallest unit of time to the largest, then day of the week last. Here is the nightly job from the crontab above:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g font-size="20" fill="#1f2a44" text-anchor="middle" font-family="monospace">
    <text x="40" y="40">30</text><text x="95" y="40">2</text><text x="150" y="40">*</text><text x="205" y="40">*</text><text x="260" y="40">*</text>
  </g>
  <text x="318" y="40" font-size="13" fill="#6c7a93" text-anchor="middle">cmd</text>
  <g stroke="#1d6fd1" stroke-width="1.5">
    <line x1="40" y1="48" x2="40" y2="70"/><line x1="95" y1="48" x2="95" y2="70"/><line x1="150" y1="48" x2="150" y2="70"/><line x1="205" y1="48" x2="205" y2="70"/><line x1="260" y1="48" x2="260" y2="70"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="86">minute</text><text x="95" y="86">hour</text><text x="150" y="86">day of</text><text x="150" y="100">month</text><text x="205" y="86">month</text><text x="260" y="86">day of</text><text x="260" y="100">week</text>
  </g>
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="40" y="118">0–59</text><text x="95" y="118">0–23</text><text x="150" y="118">1–31</text><text x="205" y="118">1–12</text><text x="260" y="118">0–7</text>
  </g>
  <text x="180" y="142" font-size="12" fill="#b4232c" text-anchor="middle">= 02:30, every day</text>
</svg>
```

A trick for remembering the order: the first two fields are the time on a clock, minute before hour, the opposite of how you say it aloud.
:::

::: context local-time Whose clock does cron read?
cron and `OnCalendar` both use the machine's own time zone unless told otherwise. The machine in this lesson is set to UTC — Coordinated Universal Time, the world's reference clock — so 02:30 means 02:30 UTC.

On a machine set to a local zone with daylight saving time, 02:30 may not happen on the night the clocks jump forward, and may happen twice on the night they fall back. Schedulers handle those nights in different ways. That is one reason servers — and ground stations, which log satellite passes by UTC — are usually left on UTC all year.
:::

::: context mail-transport Mail that goes nowhere
cron mails output by handing it to a local **mail transfer agent**, a program such as Postfix or Exim that delivers email. Old Unix machines always had one, and a user read their mail on the machine itself.

Most servers and containers today have none installed. cron may then have nowhere to hand the message, and the output is dropped. Nobody receives an error, because the error message was itself the thing being mailed.
:::

::: context run-parts-names The dot rule in cron.daily
On Debian and Ubuntu, the scripts in `/etc/cron.daily` and its siblings are started by a program called `run-parts`. By default it runs only files whose names use letters, digits, underscores and dashes.

A file named `backup.sh` has a dot in it, so it is **silently skipped**. Name it `backup` instead. You can list what would really run with `run-parts --test /etc/cron.daily`.
:::

::: context timer-activates-service Two units, one job
The timer holds the clock. When it goes off, it starts the service with the same name. The service runs the work and writes everything it prints into the journal.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="30" width="100" height="50" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="60" y="52" font-size="12" text-anchor="middle" fill="#1f2a44">sim-nightly</text>
  <text x="60" y="68" font-size="12" text-anchor="middle" fill="#1f2a44">.timer</text>
  <text x="60" y="100" font-size="11" text-anchor="middle" fill="#6c7a93">when</text>
  <line x1="110" y1="55" x2="140" y2="55" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="148,55 138,50 138,60" fill="#1f2a44"/>
  <text x="129" y="44" font-size="11" text-anchor="middle" fill="#1f2a44">starts</text>
  <rect x="150" y="30" width="100" height="50" rx="6" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="200" y="52" font-size="12" text-anchor="middle" fill="#1f2a44">sim-nightly</text>
  <text x="200" y="68" font-size="12" text-anchor="middle" fill="#1f2a44">.service</text>
  <text x="200" y="100" font-size="11" text-anchor="middle" fill="#6c7a93">what</text>
  <line x1="250" y1="55" x2="280" y2="55" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="288,55 278,50 278,60" fill="#1f2a44"/>
  <rect x="290" y="30" width="62" height="50" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="321" y="59" font-size="12" text-anchor="middle" fill="#1f2a44">journal</text>
  <text x="200" y="122" font-size="11" text-anchor="middle" fill="#1d6fd1">systemctl start sim-nightly.service skips the timer</text>
</svg>
```

Because the service is a unit of its own, you can start it by hand at any time and skip the clock entirely.
:::

::: context thundering-herd Two hundred alarms at once
Picture a school where every class is let out to lunch at exactly the same second: the hallway jams. A **thundering herd** is the computer version — many machines, or many programs, waking at the same instant and all asking one server for the same thing.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="60" x2="160" y2="60" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="84" y="12" width="12" height="48" fill="#b4232c"/>
  <text x="90" y="78" font-size="11" text-anchor="middle" fill="#1f2a44">02:30</text>
  <text x="90" y="98" font-size="12" text-anchor="middle" fill="#b4232c">all 200 at once</text>
  <line x1="200" y1="60" x2="340" y2="60" stroke="#1f2a44" stroke-width="1.5"/>
  <g fill="#1d6fd1">
    <rect x="206" y="48" width="12" height="12"/><rect x="220" y="48" width="12" height="12"/><rect x="234" y="48" width="12" height="12"/>
    <rect x="248" y="48" width="12" height="12"/><rect x="262" y="48" width="12" height="12"/><rect x="276" y="48" width="12" height="12"/>
    <rect x="290" y="48" width="12" height="12"/><rect x="304" y="48" width="12" height="12"/><rect x="318" y="48" width="12" height="12"/>
  </g>
  <text x="206" y="78" font-size="11" fill="#1f2a44">02:30</text>
  <text x="334" y="78" font-size="11" text-anchor="end" fill="#1f2a44">03:00</text>
  <text x="270" y="98" font-size="12" text-anchor="middle" fill="#1d6fd1">spread over 30 min</text>
  <text x="180" y="132" font-size="11" text-anchor="middle" fill="#6c7a93">same total work, much lower peak</text>
</svg>
```

`RandomizedDelaySec=` turns the tall spike on the left into the low, even spread on the right. The total amount of work is the same; only the peak changes.
:::
