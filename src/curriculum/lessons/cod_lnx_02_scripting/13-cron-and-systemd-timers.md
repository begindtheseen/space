---
id: l13-cron-and-systemd-timers
title: cron and systemd timers
minutes: 19
covers:
  - cron and systemd timers
---

A script that only runs when you type it is a tool. A script that runs at 02:30 every night, collects the day's telemetry and leaves a report where the team finds it in the morning is infrastructure. The step between the two is a scheduler, and on Linux there are two: `cron`, which has been there since 1975 and is on every machine, and `systemd` timers, which are newer, more capable and now used by the distributions themselves.

The part that catches everyone is the same for both, and it is the previous module's lesson 10 arriving in practice: a scheduled job runs in an environment that is nothing like your shell. Different `PATH`, no `~/.bashrc`, a different working directory, no terminal. "It works when I run it and not from cron" is that, almost every time.

All output below was produced on this machine and pasted verbatim, with cron 3.0pl1 and systemd 255 on Ubuntu 24.04.4, inside a container running its own `systemd`. Times shown are from the moment of capture.

## `cron`

Each user has a crontab, edited with `crontab -e`, listed with `crontab -l`, replaced from a file with `crontab file`, and removed with `crontab -r`. It is read by the `cron` daemon, which wakes once a minute.

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

Five time fields then the command:

| Field | Range |
| --- | --- |
| minute | 0–59 |
| hour | 0–23 |
| day of month | 1–31 |
| month | 1–12 or `jan`–`dec` |
| day of week | 0–7 or `sun`–`sat`, where both 0 and 7 are Sunday |

`*` is every value, `*/15` every fifteenth, `1-5` a range, `1,15` a list. Note the trap in the day fields: if **both** day-of-month and day-of-week are restricted, cron runs when **either** matches, not both — so `0 0 13 * 5` is "every 13th *and* every Friday", not "Friday the 13th".

The shorthands `@yearly`, `@monthly`, `@weekly`, `@daily`, `@hourly` and `@reboot` replace all five fields.

Variable assignments before the entries configure the daemon rather than the shell: `SHELL` chooses the interpreter, `PATH` sets the search path, and `MAILTO` says where output is mailed — with `MAILTO=""` meaning "do not mail".

::: warning
**A cron job's environment is minimal, and it is not yours.** Here is the same script run by cron and then by `systemd`, printing its own `PATH`:

```text
2026-09-22T22:00:01Z nightly sweep ran, PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:/snap/bin
2026-09-22T22:00:02Z nightly sweep ran, PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin
```

Two different paths, neither of them the one in your login shell. Nothing under `/opt`, nothing from a virtual environment, nothing your `~/.bashrc` adds — because cron runs a non-interactive, non-login shell, which reads neither `.bashrc` nor `.bash_profile`.

So: use absolute paths in the crontab entry, set `PATH` at the top of the crontab or inside the script, and never assume a working directory — `cron` starts the job in the user's home. The reliable shape is a wrapper script that sets everything it needs explicitly and is called by absolute path.

The second trap is **`%`**. In a crontab, an unescaped `%` ends the command and everything after it becomes standard input for the job. A `date +%F` in an entry therefore truncates the command. It must be written `\%`:

```text
* * * * * date -u +\%FT\%TZ >> /srv/campaign/out/pct.log
```

`crontab -l` shows the backslashes, because they are part of the stored line. Putting the command in a script and calling the script avoids the question entirely, which is the better habit anyway.
:::

### Where the output goes

By default, anything a cron job writes to standard output or standard error is **mailed** to the user — and on a machine with no mail transport, silently discarded. That is why a failing cron job is so often invisible.

Redirect explicitly. `>> /path/to/log 2>&1` keeps everything and is what the first entry above does; `>/dev/null 2>&1` discards deliberately, which is honest but throws away your only diagnosis. Better still, have the script log where it belongs and keep the crontab redirect for the unexpected.

The daemon also logs each invocation, which is how you tell "did not run" from "ran and failed":

```bash
journalctl -u cron --no-pager -n 3
```

```text
Sep 22 22:00:01 vm CRON[941]: pam_unix(cron:session): session opened for user root(uid=0) by root(uid=0)
Sep 22 22:00:01 vm CRON[942]: (root) CMD (/srv/campaign/bin/nightly.sh)
Sep 22 22:00:01 vm CRON[941]: pam_unix(cron:session): session closed for user root
```

`(root) CMD (…)` is the record that cron started it. If that line is absent the schedule is wrong; if it is present and nothing happened, the job is at fault.

::: example Installing a cron job and proving it fired
The whole cycle, with a once-a-minute entry so it can be watched.

```bash
printf '* * * * * /srv/campaign/bin/nightly.sh\n' | crontab -
crontab -l
```

```text
* * * * * /srv/campaign/bin/nightly.sh
```

`crontab -` installs from standard input, which is the scriptable form — `crontab -e` opens an editor and is for humans. Then wait for the top of the next minute:

```bash
cat /srv/campaign/out/nightly.log
```

```text
2026-09-22T22:00:01Z nightly sweep ran, PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:/snap/bin
```

It fired at 22:00:01 — cron wakes once a minute and starts jobs a second or so after the minute boundary, which is why a timestamp of `:01` rather than `:00` is normal.

The daemon's own record confirms it independently of anything the script does:

```bash
journalctl -u cron --no-pager -n 3
```

```text
Sep 22 22:00:01 vm CRON[941]: pam_unix(cron:session): session opened for user root(uid=0) by root(uid=0)
Sep 22 22:00:01 vm CRON[942]: (root) CMD (/srv/campaign/bin/nightly.sh)
Sep 22 22:00:01 vm CRON[941]: pam_unix(cron:session): session closed for user root
```

That `(root) CMD (...)` line is the one to grep for when a job "did not run": if it is there, the schedule is right and the problem is inside the script.

Removing it is one command, and it is worth knowing that there is **no confirmation**:

```bash
crontab -r
crontab -l
```

```text
no crontab for root
```

Exit status 1 from `crontab -l` when there is none. `crontab -r` next to `crontab -e` on the keyboard has destroyed many a carefully built schedule; `crontab -l > crontab.bak` before editing, and keeping the crontab in version control and installing it with `crontab file`, are the two habits that prevent it.
:::

### System crontabs

`/etc/crontab` and the files in `/etc/cron.d/` have the same format with **one extra field**, the user to run as, between the day-of-week and the command. The directories `/etc/cron.hourly`, `/etc/cron.daily`, `/etc/cron.weekly` and `/etc/cron.monthly` hold executable scripts run on that cadence, with no crontab syntax at all — which is the simplest way to install a periodic job from a package.

## systemd timers

A timer is two units: a `.service` that does the work and a `.timer` that says when. They must share a name, or the timer must name its service with `Unit=`.

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

and the service, which is an ordinary `Type=oneshot` unit from lesson 12 of the previous module:

```text
[Unit]
Description=Nightly campaign sweep

[Service]
Type=oneshot
ExecStart=/srv/campaign/bin/nightly.sh
```

The `[Timer]` directives worth knowing:

| Directive | Meaning |
| --- | --- |
| `OnCalendar=` | a wall-clock schedule, like cron's five fields |
| `OnBootSec=`, `OnStartupSec=` | relative to boot, or to systemd starting |
| `OnUnitActiveSec=`, `OnUnitInactiveSec=` | relative to the service's last run — a true interval |
| `Persistent=true` | if a run was missed because the machine was off, run it at next boot |
| `RandomizedDelaySec=` | jitter, so a fleet does not all start at once |
| `AccuracySec=` | how much the timer may be coalesced with others; default 1 minute |

`Persistent=` and `RandomizedDelaySec=` are the two things cron does not have and that matter most in practice: the first stops a nightly job being skipped because the machine was down, and the second stops two hundred nodes hammering a shared filesystem at exactly 02:30.

`OnCalendar` syntax is `DayOfWeek Year-Month-Day Hour:Minute:Second`, with `*` for any, and `systemd-analyze calendar` checks an expression *before* you install it:

```bash
systemd-analyze calendar "*-*-* 02:30:00"
```

```text
Normalized form: *-*-* 02:30:00
    Next elapse: Wed 2026-09-23 02:30:00 UTC
       From now: 4h 29min left
```

```bash
systemd-analyze calendar "Mon..Fri 08:00"
```

```text
  Original form: Mon..Fri 08:00
Normalized form: Mon..Fri *-*-* 08:00:00
    Next elapse: Wed 2026-09-23 08:00:00 UTC
       From now: 9h left
```

The shorthands `hourly`, `daily`, `weekly`, `monthly` normalise to full expressions, and an impossible one is rejected rather than accepted and never fired:

```bash
systemd-analyze calendar "*-*-* 25:00:00"
```

```text
Failed to parse calendar specification '*-*-* 25:00:00': Invalid argument
```

Exit status 1. There is no equivalent check for a crontab line.

::: example Installing, testing and watching a timer
Write both unit files, then:

```bash
systemctl daemon-reload
systemd-analyze verify /run/systemd/system/sim-nightly.timer; echo "verify exit=$?"
```

```text
verify exit=0
```

**Test the service by hand before enabling the timer.** This is the single most useful habit with timers and has no cron equivalent — the schedule and the work are separate units, so you can run the work now:

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

`inactive (dead)` after a `Type=oneshot` run is success, not failure — the glyph `○` and "Deactivated successfully" say so. A failure would show `×` and a non-zero `status=`.

Then start the timer and look at the schedule as systemd understands it:

```bash
systemctl start sim-nightly.timer
systemctl list-timers --no-pager sim-nightly.timer
```

```text
NEXT                            LEFT LAST PASSED UNIT              ACTIVATES
Wed 2026-09-23 02:34:48 UTC 4h 34min -         - sim-nightly.timer sim-nightly.service
```

Note `02:34:48`, not `02:30:00` — that is `RandomizedDelaySec=10min` doing its job, and the jitter is stable per machine rather than re-rolled each time.

`systemctl list-timers` with no arguments is the "what is scheduled on this box" command, `--all` includes inactive ones, and `systemctl list-unit-files --type=timer` shows which are enabled at boot. `enable` and `disable` apply to the **timer**, not the service; starting a timer arms it now, `enable` arms it at every boot.

Everything the job prints lands in the journal under the *service* name:

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

Two runs, twenty seconds apart, from a second timer using `OnUnitActiveSec=20s`. No redirection was configured and nothing was mailed: the output is simply there, timestamped, greppable and subject to the journal's retention.
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

Use **cron** for something small on a machine you do not control, or where a single line in one place is worth more than the features. Use a **timer** for anything in your own infrastructure: the ability to run the service by hand, the automatic logging, and `Persistent=` between them remove the three most common ways a scheduled job fails silently.

Note the one thing neither gives you: they both start the job whether or not the previous run has finished. For a sweep that might overrun its interval, the lock from lesson 07 — `exec 9>lock; flock -n 9 || exit 0` — is what stops two of them running at once.

::: key
Both schedulers run jobs in a minimal, non-interactive environment with a `PATH` that is not yours: use absolute paths and set what you need explicitly. In a crontab, `%` must be escaped and output is mailed or lost, so redirect it. A systemd timer is a `.timer` plus a `.service`: check `OnCalendar` with `systemd-analyze calendar`, test the work with `systemctl start NAME.service`, watch it with `journalctl -u NAME.service`, and use `Persistent=true` and `RandomizedDelaySec=` for anything on a fleet.
:::

## Check yourself

::: check
A nightly job works when you run it by hand and fails from cron with "command not found". Give the mechanism and three fixes.
:::

::: answer
`cron` runs the command in a non-interactive, non-login shell, so neither `~/.bash_profile` nor `~/.bashrc` is read — and even the parts of `.bashrc` above the usual interactivity guard do not run, because the file is not sourced at all. The `PATH` is cron's own, typically `/usr/bin:/bin` or the distribution's default, and it contains nothing from `/opt`, nothing from a conda or virtual environment, and nothing your login adds.

Three fixes, in increasing order of robustness. Set `PATH=` at the top of the crontab, which cron honours for every entry below it. Use the absolute path in the entry — `/opt/simtools/bin/simrun` — so nothing has to be inherited. Best, call a wrapper script that begins `#!/usr/bin/env bash`, `set -euo pipefail`, and then sets `PATH`, `LD_LIBRARY_PATH` and any tool-specific variables explicitly; then the job's environment is written down in one file you can read and test.

The way to reproduce the failure without waiting for 02:30 is `env -i /bin/sh -c '/path/to/job.sh'`, which starts with an empty environment. If it fails there, it will fail from cron.
:::

::: check
Why does a systemd timer let you test the work without waiting, and what does `systemctl start NAME.timer` do differently from `systemctl start NAME.service`?
:::

::: answer
Because the schedule and the work are separate units. The `.service` is an ordinary unit that can be started at any time; the `.timer` is what decides when systemd starts it. So `systemctl start NAME.service` runs the job **now**, in exactly the environment, working directory and user that the scheduled run will use — which is the closest thing to a real dry run that either scheduler offers.

`systemctl start NAME.timer` arms the timer: it does not run the job, it makes the schedule active from now until the timer is stopped or the machine reboots. `systemctl enable NAME.timer` adds it to `timers.target` so it is armed at every boot. Enable and disable always apply to the timer, never to the service — enabling the service would try to start the job at boot, which is not what a scheduled job means.

With cron there is no equivalent: the crontab line is the only definition, so testing means copying the command out of it and running it by hand, in your own environment rather than cron's.
:::

::: check
`0 0 13 * 5 /srv/bin/check.sh` was meant to run on Friday the 13th. When does it actually run?
:::

::: answer
Every 13th of the month, **and** every Friday. When both the day-of-month and the day-of-week fields are restricted — neither is `*` — cron takes the union rather than the intersection. So the job runs roughly five times a month instead of once or twice a year.

This is documented behaviour and catches nearly everyone, because the other three fields combine with "and". The rule to remember: within the day fields, a restricted day-of-month `OR` a restricted day-of-week; everything else `AND`.

To get the intersection you have to test inside the job: schedule `0 0 13 * *` and begin the script with `[[ $(date +%u) -eq 5 ]] || exit 0`. A systemd timer expresses it directly — `OnCalendar=Fri *-*-13 00:00:00` — and `systemd-analyze calendar "Fri *-*-13 00:00:00"` shows you the next occurrence so you can confirm before installing it.
:::

::: check
A fleet of two hundred nodes runs the same nightly sync at 02:30 and the shared filesystem falls over. What two directives fix it, and what does neither of them address?
:::

::: answer
`RandomizedDelaySec=30min` spreads the starts over half an hour, with each node's offset stable rather than re-rolled, so the load is flat instead of a spike. `AccuracySec=` controls how much systemd may coalesce the timer with others to save wakeups; loosening it to a few minutes also helps and is cheap when the exact minute does not matter.

Neither addresses a run that overruns. If the sync takes longer than the interval, a second one starts while the first is still going, and on a shared filesystem that is worse than the original problem. The fix for that is the lock from lesson 07: `exec 9>/var/lock/sync.lock; flock -n 9 || exit 0` at the top of the script, so a second instance exits immediately. `flock -w 300 9` waits instead, when queueing is preferable to skipping.

Neither addresses the underlying question either, which is whether two hundred nodes should be reading the same filesystem at all. Staggering is a mitigation; a local cache, or a pull from a mirror, is a fix.
:::

::: check
How do you find out whether a scheduled job ran at all, for cron and for a systemd timer?
:::

::: answer
For **cron**, look for the daemon's own record: `journalctl -u cron --since yesterday`, or `/var/log/syslog` on systems without a journal. Each invocation logs a line of the form `(user) CMD (the command)`. If that line is absent, the schedule is wrong or the daemon is not running — check `systemctl is-active cron` and `crontab -l`. If it is present but nothing happened, the job ran and failed, and you need its output, which by default was mailed or discarded — hence the habit of redirecting to a log.

For a **timer**, `systemctl list-timers` shows `LAST` and `PASSED` for the last run and `NEXT`/`LEFT` for the next, which answers "did it fire" directly. `systemctl status NAME.timer` shows whether the timer is armed, and `systemctl status NAME.service` shows the result of the last run, including its exit status. `journalctl -u NAME.service` has everything the job printed, with no configuration needed.

The asymmetry is the main practical argument for timers: with cron you have to arrange for the evidence in advance, and with a timer it is there by default.
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
| `journalctl -u cron` | `(user) CMD (...)` per invocation | absent = did not fire |
| `/etc/cron.d`, `/etc/crontab` | system crontabs with a **user** field | `/etc/cron.daily/` takes plain scripts |
| `.timer` + `.service` | schedule and work, as separate units | same name, or `Unit=` |
| `OnCalendar=` | `DoW Y-M-D H:M:S`, `*` for any | `systemd-analyze calendar` checks it |
| `OnBootSec=`, `OnUnitActiveSec=` | relative schedules | a true interval between runs |
| `Persistent=true` | catch up a run missed while off | cron simply skips |
| `RandomizedDelaySec=`, `AccuracySec=` | jitter and coalescing | for a fleet hitting shared storage |
| `systemctl start NAME.service` | run the work now, in its real environment | the dry run cron does not have |
| `systemctl list-timers [--all]` | `NEXT`, `LEFT`, `LAST`, `PASSED` | enable/disable the **timer** |
| `journalctl -u NAME.service` | everything the job printed | no redirection needed |
| `flock -n 9` | stop overlapping runs | neither scheduler does this for you |

Lesson 14 closes the module with the judgement that keeps all of this maintainable: when a shell script has outgrown the shell, and what to move it to.
