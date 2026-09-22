---
id: l12-systemd-services-and-the-journal
title: systemd services and the journal
minutes: 20
covers:
  - 'systemd: systemctl, journalctl'
---

Some things on a simulation machine must run without anyone logged in: the licence daemon, the job scheduler, the telemetry ingest that watches a directory, the SSH server you connect with. On every modern Linux distribution the program that starts them, restarts them when they crash, and collects their output is `systemd`, and you talk to it with two commands — `systemctl` for the state of things and `journalctl` for what they said.

You will use this most often in one specific situation: something that is supposed to be running is not, and you have five minutes to find out why. The answer is almost always in `systemctl status` and the twenty lines of journal it prints underneath. This lesson makes those twenty lines readable.

All output below was produced on this machine and pasted verbatim, against a real systemd 255 (255.4-1ubuntu8.14) instance running in a container, with the demonstration units written to `/run/systemd/system/`. Timestamps, PIDs and the hostname `vm` are specific to this capture. The unit names `sim-sweep` and `sim-bad` are invented for the lesson; everything else — `ssh.service`, `docker.service` — is genuinely on this machine.

## Units

systemd manages **units**, and the suffix tells you the kind:

- `.service` — a process to run. This is the one you will touch.
- `.socket` — a port to listen on, starting the service on the first connection.
- `.timer` — a schedule, the modern replacement for a `cron` entry.
- `.mount`, `.target`, `.device`, `.path` — filesystems, groups of units, hardware, directory watches.

Unit files live in three places, and *which* one matters:

| Directory | Owned by | Survives |
| --- | --- | --- |
| `/usr/lib/systemd/system/` | the package manager | overwritten on upgrade |
| `/etc/systemd/system/` | you, the administrator | takes precedence; this is where you write |
| `/run/systemd/system/` | runtime, transient | lost on reboot |

A unit in `/etc` shadows one of the same name in `/usr/lib`, which is how you override a packaged service without editing a file `apt` will replace.

Here is a service, and it is about as small as a real one gets:

```bash
systemctl cat sim-sweep.service
```

```text
# /run/systemd/system/sim-sweep.service
[Unit]
Description=Monte Carlo sweep driver
After=network-online.target

[Service]
Type=simple
ExecStart=/srv/campaign/run_sweep.sh
WorkingDirectory=/srv/campaign
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

`systemctl cat` is the right way to read a unit: it prints the file *and its path*, and appends any drop-in overrides, so you see what systemd actually assembled rather than what you hope is there.

The fields:

- `Description` is what appears in `status` and every log line about the unit.
- `After=` is ordering, not dependency — "if both are starting, start me second". `Requires=` is the dependency.
- `Type=simple` means `ExecStart` *is* the service; systemd considers it started as soon as it forks. `Type=forking` is for daemons that background themselves, `Type=oneshot` for a command that runs and exits, and `Type=notify` for programs that tell systemd when they are ready.
- `ExecStart` must be an **absolute path**, and it is not run through a shell — no pipes, no globs, no `$HOME`. If you need a shell, call one: `ExecStart=/bin/bash -c '...'`.
- `Restart=on-failure` with `RestartSec=5` restarts the service five seconds after a non-zero exit. `Restart=always` restarts it even after a clean exit.
- `WantedBy=multi-user.target` is what `systemctl enable` acts on — it says which target should pull this unit in at boot.

Check a unit file before loading it:

```bash
systemd-analyze verify /run/systemd/system/sim-sweep.service; echo "verify exit=$?"
```

```text
Binding to IPv6 address not available since kernel does not support IPv6.
verify exit=0
```

Exit 0: the file parses and its directives are known. The IPv6 line is this container's kernel, not a problem with the unit — a good illustration that `verify` reports what it notices while checking, not only what is wrong with your file.

After adding or editing a unit file, **`systemctl daemon-reload`**. systemd caches the parsed units and will keep using the old text until you tell it not to. Forgetting this is the commonest confusion with systemd: the file on disk is right, the behaviour is the old one.

## The lifecycle

```bash
systemctl is-active sim-sweep; systemctl is-enabled sim-sweep
```

```text
inactive
disabled
```

Two independent facts, and the distinction is worth stating plainly: **`start`/`stop` are about now, `enable`/`disable` are about boot.** A service can be running and not enabled (it will not come back after a reboot), or enabled and not running (it failed, or someone stopped it).

```bash
systemctl start sim-sweep
systemctl status sim-sweep --no-pager
```

```text
● sim-sweep.service - Monte Carlo sweep driver
     Loaded: loaded (/run/systemd/system/sim-sweep.service; disabled; preset: enabled)
     Active: active (running) since Tue 2026-09-22 21:03:39 UTC; 3s ago
   Main PID: 492 (run_sweep.sh)
      Tasks: 2 (limit: 19293)
     Memory: 968.0K ()
     CGroup: /system.slice/sim-sweep.service
             ├─492 /bin/bash /srv/campaign/run_sweep.sh
             └─499 sleep 1

Sep 22 21:03:39 vm systemd[1]: Started sim-sweep.service - Monte Carlo sweep driver.
Sep 22 21:03:39 vm run_sweep.sh[492]: case 0001 done
Sep 22 21:03:40 vm run_sweep.sh[492]: case 0002 done
Sep 22 21:03:41 vm run_sweep.sh[492]: case 0003 done
```

Read it top to bottom, because every line answers a question you were about to ask:

- the **bullet** is a status glyph: `●` running, `○` stopped, `×` failed.
- **`Loaded:`** — which file, and whether it is enabled. `not-found` here means you misspelled the unit name or forgot `daemon-reload`.
- **`Active:`** — the state and *how long* it has been in it. "active (running) since 3s ago" on a service you did not just start means it has been restarting in a loop.
- **`Main PID:`** — the process, by number and name. This is the pid you would pass to `ps` or `strace`.
- **`CGroup:`** — every process the service owns, as a tree. This is systemd's real advantage over an init script: the service is a *cgroup*, so a child that daemonises away from its parent is still tracked, and `systemctl stop` kills all of it.
- then the **last journal lines for this unit**, interleaved from systemd itself (`systemd[1]`) and from the service's own standard output (`run_sweep.sh[492]`). Anything the program prints is captured automatically — no redirection, no log file to configure.

`systemctl restart` stops and starts; `systemctl reload` asks a service to re-read its configuration without dropping connections, if the unit defines `ExecReload`. Stopping is uneventful:

```bash
systemctl stop sim-sweep; systemctl is-active sim-sweep; echo "is-active exit=$?"
```

```text
inactive
is-active exit=3
```

Exit status 3 for "not active" — the scriptable form, so `if systemctl is-active --quiet sim-sweep; then ...` works.

`systemctl enable` is a symlink operation and says exactly what it did:

```bash
systemctl enable sim-sweep
```

```text
Created symlink /etc/systemd/system/multi-user.target.wants/sim-sweep.service → /run/systemd/system/sim-sweep.service.
```

That is the whole of "enabled": a symlink in the wants-directory of the target named by `WantedBy`. `systemctl disable` removes it. Knowing this means you can answer "will this come back after the reboot?" by listing a directory.

::: example A service that fails, and the four lines that explain it
`sim-bad` runs a script that reads a configuration file which is not there. Note that `start` itself *succeeds* — it started the process; what the process then did is a separate question:

```bash
systemctl start sim-bad; echo "start exit=$?"
```

```text
start exit=0
```

```bash
systemctl status sim-bad --no-pager
```

```text
× sim-bad.service - Sweep driver with a missing configuration file
     Loaded: loaded (/run/systemd/system/sim-bad.service; static)
     Active: failed (Result: exit-code) since Tue 2026-09-22 21:03:54 UTC; 1s ago
   Duration: 4ms
    Process: 525 ExecStart=/srv/campaign/bad_sweep.sh (code=exited, status=1/FAILURE)
   Main PID: 525 (code=exited, status=1/FAILURE)

Sep 22 21:03:54 vm systemd[1]: Started sim-bad.service - Sweep driver with a missing configuration file.
Sep 22 21:03:54 vm bad_sweep.sh[525]: reading configuration
Sep 22 21:03:54 vm bad_sweep.sh[527]: cat: /srv/campaign/missing.yaml: No such file or directory
Sep 22 21:03:54 vm systemd[1]: sim-bad.service: Failed with result 'exit-code'.
```

Four things to take from it. The glyph is `×` and the state is `failed (Result: exit-code)` — systemd distinguishes *how* it failed, and the other values you will meet are `signal` (killed), `timeout` (did not start in time) and `oom-kill`. `Duration: 4ms` says it died immediately, which rules out anything that happens under load. `status=1/FAILURE` is the exit code, in lesson 04's numbering — a `status=137/KILL` there would have been the OOM killer. And the actual cause is the third journal line, printed by the program itself: `No such file or directory` on a path you can now go and look at.

The unit stays in the failed state until something clears it:

```bash
systemctl --failed --no-pager
```

```text
  UNIT            LOAD   ACTIVE SUB    DESCRIPTION
● sim-bad.service loaded failed failed Sweep driver with a missing configuration file
```

`systemctl --failed` on a machine you have just been handed is the single most informative command there is: it lists everything that is supposed to be working and is not. `systemctl reset-failed` clears the state once you have fixed the cause, and `systemctl is-failed sim-bad` exits 0 when it is failed, which is the scriptable check.
:::

## `journalctl`

The journal is one indexed store for everything: the kernel, systemd, and every service's standard output and standard error. You select from it rather than choosing a file.

```bash
journalctl -u sim-bad --no-pager -n 10
```

```text
Sep 22 21:03:54 vm systemd[1]: Started sim-bad.service - Sweep driver with a missing configuration file.
Sep 22 21:03:54 vm bad_sweep.sh[525]: reading configuration
Sep 22 21:03:54 vm bad_sweep.sh[527]: cat: /srv/campaign/missing.yaml: No such file or directory
Sep 22 21:03:54 vm systemd[1]: sim-bad.service: Main process exited, code=exited, status=1/FAILURE
Sep 22 21:03:54 vm systemd[1]: sim-bad.service: Failed with result 'exit-code'.
```

The selectors that matter:

- `-u NAME` one unit; `-n N` the last N lines; `-f` follow, exactly like `tail -f`.
- `--since` and `--until` take both absolute and relative times: `--since "2026-09-22 21:00"`, `--since "-10 min"`, `--since yesterday`.
- `-p err` filters by priority — `emerg alert crit err warning notice info debug`, and naming one includes everything more severe.
- `-b` is this boot, `-b -1` the previous one. This is how you read what happened before a machine rebooted itself.
- `-k` is kernel messages only, which is the same stream `dmesg` shows.
- `-o json` or `-o short-iso` change the format; `-x` adds systemd's own explanatory text to its messages.
- `--disk-usage` and `--vacuum-time=7d` report and bound the store:

```bash
journalctl --disk-usage
```

```text
Archived and active journals take up 8.0M in the file system.
```

Most useful in practice is `journalctl -u sim-sweep -f` during a deployment, and `journalctl -u sim-sweep --since "-1 h" -p warning` afterwards.

::: warning
The journal is not necessarily persistent. If `/var/log/journal/` does not exist, systemd keeps the journal in `/run`, a tmpfs, and **everything is lost on reboot** — so the logs explaining why the machine rebooted are gone, which is exactly when you wanted them. `journalctl -b -1` returning "Specified boot ID or offset does not exist" is the symptom. The fix is `mkdir -p /var/log/journal` and `systemctl restart systemd-journald`, or `Storage=persistent` in `/etc/systemd/journald.conf`. Check it on any machine you care about *before* you need it.
:::

::: example Finding what is broken on a machine you were just given
Four commands, in order, and you have almost always found it.

```bash
systemctl is-system-running
```

```text
running
```

`running` means everything systemd was asked to start did start. The other answers are the interesting ones: `degraded` means at least one unit failed, `starting` means boot has not finished, and `maintenance` means it is in emergency mode. On `degraded`, go straight to `systemctl --failed`.

```bash
systemctl list-units --type=service --state=running --no-pager | head -8
```

```text
  UNIT                       LOAD   ACTIVE SUB     DESCRIPTION
  containerd.service         loaded active running containerd container runtime
  dbus.service               loaded active running D-Bus System Message Bus
  docker.service             loaded active running Docker Application Container Engine
  getty@tty1.service         loaded active running Getty on tty1
  postgresql@16-main.service loaded active running PostgreSQL Cluster 16-main
  redis-server.service       loaded active running Advanced key-value store
  ssh.service                loaded active running OpenBSD Secure Shell server
```

That is the machine's job description in one screen. Then `systemctl status NAME` on whatever looks relevant, and `journalctl -u NAME -n 50` for its recent output. Errors from anything, including the kernel:

```bash
journalctl --no-pager -n 3 -p err
```

```text
Sep 22 20:05:47 vm systemd[1]: Failed to create symlink /sys/fs/cgroup/cpu: File exists
Sep 22 20:05:47 vm systemd[1]: Failed to create symlink /sys/fs/cgroup/cpuacct: File exists
Sep 22 20:07:17 vm systemd[1]: Timed out waiting for device dev-ttyS0.device - /dev/ttyS0.
```

All three are artefacts of running systemd inside a container — a cgroup layout it did not create and a serial device that does not exist — and none of them stopped anything. That is the last skill in this lesson: a machine's error log always has entries in it. What matters is whether one of them lines up in time with the thing that is actually broken.
:::

::: key
`systemctl status NAME` answers most questions: the glyph (`●` running, `○` stopped, `×` failed), `Loaded:` which file, `Active:` state and for how long, `Main PID:`, the `CGroup:` tree, and the unit's recent journal. `start`/`stop` are about now; `enable`/`disable` are about boot. Edit a unit, then `systemctl daemon-reload`. `journalctl -u NAME -f` follows a service; `-b -1` reads the previous boot, if the journal is persistent.
:::

## Check yourself

::: check
You edit `/etc/systemd/system/telemetry.service` to change `ExecStart`, run `systemctl restart telemetry`, and the old command line still appears in `systemctl status`. What did you forget?
:::

::: answer
`systemctl daemon-reload`. systemd parses unit files once and keeps them in memory; `restart` stops and starts the unit *as systemd currently understands it*, which is the version from before your edit. The file on disk and the running configuration have simply diverged.

The sequence is always: edit the file, `systemctl daemon-reload`, then `systemctl restart NAME`. `systemctl cat NAME` afterwards shows what systemd now has, including any drop-in files, and is the way to confirm the change landed. Newer systemd versions notice and print a warning — "Warning: The unit file, source configuration file or drop-ins of NAME changed on disk. Run 'systemctl daemon-reload'" — but do not rely on seeing it.

Related: prefer `systemctl edit NAME` for changing a packaged unit. It creates a drop-in under `/etc/systemd/system/NAME.d/override.conf` containing only your changes, runs the reload for you, and survives the package being upgraded.
:::

::: check
`systemctl status ingest` shows `Active: active (running) since 4s ago` every time you look, on a service nobody is restarting. What is happening and where do you look?
:::

::: answer
It is crash-looping. The unit has `Restart=always` or `Restart=on-failure`, the process dies shortly after starting, and systemd starts it again — so every time you look, it has "just started". The `since` time is the tell: a healthy long-running service shows hours or days there.

Look at the journal for the unit rather than at `status`, because `status` shows only the last few lines and you need the pattern: `journalctl -u ingest -n 100` will show repeated `Started` / `Main process exited` / `Scheduled restart job` cycles, and between each pair the program's own last words, which are the actual cause.

systemd has a rate limiter for exactly this: `StartLimitIntervalSec` and `StartLimitBurst` (by default 5 starts in 10 seconds) after which it gives up with "start request repeated too quickly" and leaves the unit failed. Seeing that message means the loop has been running long enough to be stopped, and `systemctl reset-failed ingest` is needed before it will start again.
:::

::: check
A colleague says a service is "enabled but not running" and another says it is "running but not enabled". Explain what each means and which is the more dangerous state for a licence daemon that simulations depend on.
:::

::: answer
"Enabled but not running" means the symlink exists in a target's `wants` directory, so it will start at the next boot, but right now it is stopped or failed — someone stopped it, or it crashed. "Running but not enabled" means it is working now, but the symlink does not exist, so after the next reboot it will not come back.

For a licence daemon the second is far more dangerous, because nothing is wrong today. The machine reboots months later, during an upgrade window or after a power event, and every simulation on the cluster fails to acquire a licence — with no recent change to point at, and the person who started it by hand long gone. The first state is loud and immediate; the second is a trap with a long fuse.

`systemctl is-enabled NAME` and `systemctl is-active NAME` answer the two questions separately, and `systemctl status` shows both: the `Loaded:` line carries `enabled` or `disabled`, and the `Active:` line carries the running state.
:::

::: check
Why does `ExecStart=/srv/campaign/run_sweep.sh > /var/log/sweep.log` not do what it looks like, and what are the two correct approaches?
:::

::: answer
Because `ExecStart` is not passed to a shell. systemd splits the line into an argument vector itself, so `>` and `/var/log/sweep.log` are handed to `run_sweep.sh` as two ordinary arguments; no redirection happens. The same applies to `|`, `*`, `&&`, `$HOME` and `~` — none of them mean anything there. The related rule is that the first word must be an absolute path, because there is no `PATH` search either.

Approach one, and usually the right one: do not redirect at all. systemd captures a service's standard output and standard error into the journal automatically, which is what `StandardOutput=journal` means by default, and `journalctl -u sweep` then gives you the log with timestamps, the unit name and the PID already attached.

Approach two, when you genuinely need a file: run a shell explicitly — `ExecStart=/bin/bash -c '/srv/campaign/run_sweep.sh > /var/log/sweep.log 2>&1'` — or set `StandardOutput=append:/var/log/sweep.log` in the `[Service]` section, which systemd handles directly and is cleaner than spawning a shell.
:::

::: check
A machine rebooted overnight. `journalctl -b -1` says the boot ID does not exist. What happened, and what do you change so it does not happen again?
:::

::: answer
The journal is not persistent on that machine. When `/var/log/journal/` does not exist, `systemd-journald` stores the journal under `/run/log/journal/`, which is on a tmpfs — so it is created empty at every boot and everything from the previous boot is gone. `-b -1` has nothing to read because no record of that boot survived the reboot.

The fix is to create the directory and restart the daemon: `mkdir -p /var/log/journal`, `systemd-journald` picks it up on `systemctl restart systemd-journald` (or at the next boot), and from then on `-b -1`, `-b -2` and so on work. Setting `Storage=persistent` in `/etc/systemd/journald.conf` makes it explicit rather than inferred from the directory's existence.

Bound it while you are there, or a chatty service will fill the disk: `SystemMaxUse=2G` in the same file, or `journalctl --vacuum-time=30d` and `--vacuum-size=2G` to trim what is already stored. Check `journalctl --disk-usage` on any machine you have just been given.
:::

## Summary

| Command | Does | Note |
| --- | --- | --- |
| `systemctl status NAME` | state, PID, cgroup, recent journal | `●` running, `○` stopped, `×` failed |
| `Active: ... since Xs ago` | how long in this state | a few seconds, repeatedly, means crash-looping |
| `systemctl start` / `stop` / `restart` / `reload` | now | `reload` needs `ExecReload` in the unit |
| `systemctl enable` / `disable` | at boot — a symlink in a target's `wants` | orthogonal to running now |
| `systemctl is-active` / `is-enabled` / `is-failed` | scriptable, by exit status | `is-active` exits 3 when inactive |
| `systemctl --failed` | everything broken, in one list | the first command on an unfamiliar machine |
| `systemctl is-system-running` | `running`, `degraded`, `starting`, `maintenance` | `degraded` sends you to `--failed` |
| `systemctl cat NAME` | the unit file, its path and its drop-ins | what systemd actually assembled |
| `systemctl daemon-reload` | re-read unit files | required after every edit |
| `systemctl edit NAME` | a drop-in override under `/etc` | survives package upgrades |
| `systemd-analyze verify FILE` | parse and check a unit before loading it | exit 0 means it is well formed |
| `ExecStart=` | absolute path, no shell | no `>`, no `\|`, no globs, no `$HOME` |
| `Type=simple/forking/oneshot/notify` | how systemd decides it started | `simple` unless the program backgrounds itself |
| `Restart=on-failure`, `RestartSec` | restart policy | with `StartLimitBurst` to stop a loop |
| `journalctl -u NAME -f -n N` | one unit, follow, last N | the service's stdout is captured automatically |
| `journalctl --since "-10 min" -p err -b -1 -k` | time, priority, boot, kernel | `-b -1` needs a persistent journal |
| `journalctl --disk-usage`, `--vacuum-time=30d` | size, and bound it | tmpfs journal means logs die with the reboot |

Lesson 13 is the rest of the diagnosis kit — `df`, `du`, `lsblk`, `ip`, `ss`, `curl`, `strace`, `lsof` and `dmesg` — the commands for the half of the problems that are not a service at all.
