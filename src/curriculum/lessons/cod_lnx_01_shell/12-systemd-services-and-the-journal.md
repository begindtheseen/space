---
id: l12-systemd-services-and-the-journal
title: systemd services and the journal
minutes: 21
covers:
  - 'systemd: systemctl, journalctl'
---

Picture the manager of a big building at night. Nobody else is around, yet the heating must run, the doors must lock at ten, and if the elevator breaks down someone has to restart it. The manager keeps a card for each job — what to start, when, what to do if it fails — and writes everything that happens in a logbook.

A Linux machine has a manager like that. Some programs must run with nobody logged in: the license server, the job scheduler, the telemetry ingest that watches a folder for new files, the SSH server you connect with. Programs like these, running in the background with no terminal, are called **services** (or **[[daemons|daemon-word]]**). On every modern Linux distribution the manager that starts them, restarts them when they crash, and collects their output is **systemd**, the **[[first process the system runs|pid-1]]**. You talk to it with two commands: **`systemctl`** for the state of things, and **`journalctl`** for what they said — its logbook.

You will use this most in one situation: something that should be running is not, and you have five minutes to find out why. The answer is nearly always in `systemctl status` and the twenty lines of log it prints underneath. This lesson makes those twenty lines readable.

The transcripts come from a real systemd 255 running in a container whose hostname is `vm`, with the demonstration units written to `/run/systemd/system/`. Timestamps and process numbers belong to that capture. The units `sim-sweep` and `sim-bad` were written for the lesson; `ssh.service`, `docker.service` and the rest are genuinely on that machine.

## Units: systemd's job cards

systemd manages **units** — one small text file per job, like the manager's cards. The ending of the name tells you the kind:

- `.service` — a program to run. This is the one you will touch.
- `.socket` — a network port to listen on, starting its service when the first connection arrives.
- `.timer` — a schedule, the modern replacement for a `cron` entry.
- `.mount`, `.target`, `.device`, `.path` — filesystems, **[[groups of units|target]]**, hardware, and folder watches.

Unit files live in three places, and *which* one matters. When two folders hold a file with the same name, the **[[higher one in this list wins|unit-precedence]]**:

| Directory | Owned by | Survives |
| --- | --- | --- |
| `/etc/systemd/system/` | you, the administrator | highest priority; this is where you write |
| `/run/systemd/system/` | runtime, temporary | lost on reboot |
| `/usr/lib/systemd/system/` | the package manager | overwritten on upgrade |

So a unit in `/etc` hides one of the same name in `/usr/lib`. That is how you override a packaged service without editing a file `apt` will replace.

Here is a service about as small as a real one gets:

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

`systemctl cat` is the right way to read a unit. It prints the file *and its path*, and appends any **drop-ins** — small override files — so you see what systemd actually assembled rather than what you hope is there.

The fields, one at a time:

- `Description` is the human name shown in `status` and in log lines about the unit.
- `After=` is **ordering**, not dependency: "if both are starting, start me second". `Requires=` is the dependency.
- `Type=simple` means the `ExecStart` program *is* the service, and systemd counts it as started as soon as it launches it. `Type=forking` is for old-style programs that move themselves into the background, `Type=oneshot` for a command that runs and exits, and `Type=notify` for programs that tell systemd when they are ready.
- `ExecStart` is the command. Give it an **absolute path** (one starting with `/`). It is **not run through a shell**: no pipes, no redirection, no wildcards, no `~`. (Newer systemd accepts a bare name, but looks it up in a fixed list of system folders, never your `PATH`; and `$NAME` is filled in by systemd from the unit's own `Environment=` settings, not from your shell.) If you need a shell, call one: `ExecStart=/bin/bash -c '...'`.
- `Restart=on-failure` with `RestartSec=5` restarts the service five seconds after it exits with an error. `Restart=always` restarts it even after a clean exit.
- `WantedBy=multi-user.target` is what `systemctl enable` acts on: it names the target that should pull this unit in at boot.

You can check a unit file before loading it:

```bash
systemd-analyze verify /run/systemd/system/sim-sweep.service; echo "verify exit=$?"
```

```text
Binding to IPv6 address not available since kernel does not support IPv6.
verify exit=0
```

Read the *messages*, not only the exit status. The IPv6 line is about this container's kernel, not the unit. And a typo does not always change the exit status: a copy of this file with `RestartSecs=5` (one letter too many) also exited 0, printing only

```text
.../sim-sweep.service:10: Unknown key name 'RestartSecs' in section 'Service', ignoring.
```

The word "ignoring" is the trap. systemd skips the line it does not understand, so the service would run with the default restart delay and nobody would notice.

After adding or editing a unit file, run **`systemctl daemon-reload`**. systemd keeps the parsed units in memory and keeps using the old text until you tell it to re-read. Forgetting this is the most common systemd confusion: the file on disk is right, and the behavior is the old one.

## The lifecycle: now, and at boot

```bash
systemctl is-active sim-sweep; systemctl is-enabled sim-sweep
```

```text
inactive
disabled
```

Those are two separate facts. Think of an alarm clock. Whether you are awake *right now* is one question; whether the alarm is set for tomorrow morning is another. **`start`/`stop` are about now. `enable`/`disable` are about boot.** A service can be running and not enabled (it will not come back after a reboot), or enabled and not running (it failed, or someone stopped it).

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

(`--no-pager` prints straight to the terminal instead of opening a scrolling viewer.) Read it top to bottom, because every line answers a question you were about to ask:

- The **dot** at the start is a status mark: `●` running, `○` stopped, `×` failed.
- **`Loaded:`** — which file, and whether it is enabled. `not-found` here means you misspelled the name or forgot `daemon-reload`.
- **`Active:`** — the state, and *how long* it has been in it. "running since 3s ago" on a service you did not just start means it keeps crashing and being restarted.
- **`Main PID:`** — the process ID, the number you would hand to `ps` or `strace`.
- **`CGroup:`** — every process the service owns, as a tree. This is systemd's real advantage over older start-up scripts. The service lives in a **[[control group|cgroup]]**, so a child process that wanders off is still tracked, and `systemctl stop` stops all of it.
- Then the **unit's latest log lines**, mixed from systemd itself (`systemd[1]`) and from the program's own output (`run_sweep.sh[492]`). Anything the program prints is captured automatically — no redirection, no log file to set up.

`systemctl restart` stops and starts. `systemctl reload` asks a service to re-read its configuration without stopping — but only if the unit defines an `ExecReload=` command. Stopping is quiet:

```bash
systemctl stop sim-sweep; systemctl is-active sim-sweep; echo "is-active exit=$?"
```

```text
inactive
is-active exit=3
```

Exit status 3 means "not active". That makes it scriptable: `if systemctl is-active --quiet sim-sweep; then ...` runs the `then` part only when the service is up.

`systemctl enable` makes a **symbolic link** — a pointer file (lesson 01) — and says exactly what it did:

```bash
systemctl enable sim-sweep
```

```text
Created symlink /etc/systemd/system/multi-user.target.wants/sim-sweep.service → /run/systemd/system/sim-sweep.service.
```

That link is the whole of **[["enabled"|enable-symlink]]**: a symlink in the `.wants` folder of the target named by `WantedBy`. `systemctl disable` removes it. So "will this come back after a reboot?" can be answered by listing a folder.

::: example A service that fails, and the four lines that explain it
`sim-bad` runs a script that reads a configuration file that is not there. Step one: start it. Notice that `start` itself *succeeds* — it launched the process; what the process did next is a separate question.

```bash
systemctl start sim-bad; echo "start exit=$?"
```

```text
start exit=0
```

Step two: ask for its status.

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

Step three: read the four clues.

1. The mark is `×` and the state is `failed (Result: exit-code)`. systemd records *how* it failed. The other results you will meet are `signal` (killed by a signal), `timeout` (did not start in time) and `oom-kill` (killed for using too much memory).
2. `Duration: 4ms` says it died at once, which rules out anything that happens only under load.
3. `code=exited, status=1/FAILURE` means the program chose to exit with status 1 (lesson 04). A process killed by a signal would instead show `code=killed, signal=KILL` or similar.
4. The actual cause is the third log line, printed by the program itself: `No such file or directory`, on a path you can now go and look at.

Sanity check: the log's process number, 525, matches `Main PID`. (The `cat` line shows 527 because the script ran `cat` as a child.)

The unit stays failed until something clears it:

```bash
systemctl --failed --no-pager
```

```text
  UNIT            LOAD   ACTIVE SUB    DESCRIPTION
● sim-bad.service loaded failed failed Sweep driver with a missing configuration file
```

On a machine you have just been handed, `systemctl --failed` is the single most informative command there is: it lists everything that is supposed to work and does not. `systemctl reset-failed` clears the state once you have fixed the cause, and `systemctl is-failed sim-bad` exits 0 when it *is* failed — the scriptable check.
:::

## `journalctl`: reading the logbook

The **journal** is one indexed store for everything: the kernel, systemd, and every service's standard output and standard error. Instead of hunting for the right log file, you *select* from it.

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

- `-u NAME` picks one unit; `-n N` shows the last N lines; `-f` follows new lines as they arrive, exactly like `tail -f`.
- `--since` and `--until` take absolute or relative times: `--since "2026-09-22 21:00"`, `--since "-10 min"`, `--since yesterday`.
- `-p err` filters by **[[priority|log-priority]]**, from most to least severe `emerg alert crit err warning notice info debug`. Naming one includes everything more severe.
- `-b` means this boot, and `-b -1` the previous one. This is how you read what happened before a machine rebooted itself.
- `-k` shows kernel messages only — the same stream `dmesg` shows.
- `-o json` or `-o short-iso` change the format; `-x` adds systemd's explanations to its own messages.
- `--disk-usage` and `--vacuum-time=7d` report and trim the store:

```bash
journalctl --disk-usage
```

```text
Archived and active journals take up 8.0M in the file system.
```

In practice you will lean on two: `journalctl -u sim-sweep -f` while deploying, and `journalctl -u sim-sweep --since "-1 h" -p warning` afterward.

::: warning The journal may vanish at reboot
The journal is not always kept on disk. If `/var/log/journal/` does not exist, systemd keeps the journal under `/run`, which lives in memory (a **[[tmpfs|tmpfs]]**), and **everything is lost on reboot**. So the logs explaining why the machine rebooted are gone — exactly when you wanted them. The symptom is `journalctl -b -1` answering

```text
No journal boot entry found from the specified boot offset (-1).
```

with exit status 1. The fix is `mkdir -p /var/log/journal` and `systemctl restart systemd-journald`, or `Storage=persistent` in `/etc/systemd/journald.conf`. Check this on any machine you care about *before* you need it.
:::

::: example Finding what is broken on a machine you were just given
Four commands, in order, and you have almost always found it. Step one: ask for the overall state.

```bash
systemctl is-system-running
```

```text
running
```

`running` means everything systemd was asked to start did start. The other answers are the interesting ones: `degraded` means at least one unit failed, `starting` means boot has not finished, and `maintenance` means the machine is in emergency mode. On `degraded`, go straight to `systemctl --failed`.

Step two: see what the machine is *for*.

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

That is the machine's job description on one screen. Step three: `systemctl status NAME` on whatever looks relevant, and `journalctl -u NAME -n 50` for its recent output. Step four: errors from anything, including the kernel:

```bash
journalctl --no-pager -n 3 -p err
```

```text
Sep 22 20:05:47 vm systemd[1]: Failed to create symlink /sys/fs/cgroup/cpu: File exists
Sep 22 20:05:47 vm systemd[1]: Failed to create symlink /sys/fs/cgroup/cpuacct: File exists
Sep 22 20:07:17 vm systemd[1]: Timed out waiting for device dev-ttyS0.device - /dev/ttyS0.
```

Sanity check before you panic: all three come from running systemd inside a container — a control-group layout it did not create, and a serial port that does not exist — and none of them stopped anything. That is the last skill in this lesson. A machine's error log always has entries in it. What matters is whether one lines up *in time* with the thing that is actually broken.
:::

::: key systemctl and journalctl
`systemctl status NAME` answers most questions: the mark (`●` running, `○` stopped, `×` failed), `Loaded:` which file, `Active:` state and for how long, `Main PID:`, the `CGroup:` tree, and the unit's recent journal. `start`/`stop` are about now; `enable`/`disable` are about boot. Edit a unit, then `systemctl daemon-reload`. `journalctl -u NAME -f` follows a service; `-b -1` reads the previous boot, if the journal is persistent.
:::

## Check yourself

::: check
You edit `/etc/systemd/system/telemetry.service` to change `ExecStart`, run `systemctl restart telemetry`, and the old command line still appears in `systemctl status`. What did you forget?
:::

::: answer
`systemctl daemon-reload`. systemd reads unit files once and keeps them in memory. `restart` stops and starts the unit *as systemd currently understands it* — the version from before your edit. The file on disk and the running configuration have drifted apart.

The sequence is always: edit the file, `systemctl daemon-reload`, then `systemctl restart NAME`. Do not count on a reminder. Some versions print a "changed on disk" warning, but in the capture used for this lesson, editing a unit and then running `status` and `restart` printed nothing, and the service came back with the old command. `systemctl cat NAME` reads the file from disk, so it shows your edit either way — a poor check for whether the reload happened, and a good check for what the file now says.

Related: to change a packaged unit, prefer `systemctl edit NAME`. It creates a drop-in at `/etc/systemd/system/NAME.d/override.conf` holding only your changes, reloads for you, and survives package upgrades. It is interactive on purpose — run without a terminal it refuses with `Cannot edit units if not on a tty.` — so a setup script writes the drop-in file itself and then calls `systemctl daemon-reload`.
:::

::: check
`systemctl status ingest` shows `Active: active (running) since 4s ago` every time you look, on a service nobody is restarting. What is happening and where do you look?
:::

::: answer
It is **crash-looping**. The unit has `Restart=always` or `Restart=on-failure`, the program dies shortly after starting, and systemd starts it again — so whenever you look, it has "just started". The `since` time is the tell: a healthy long-running service shows hours or days there.

Look at the unit's journal rather than `status`, because `status` shows only the last few lines and you need the pattern. `journalctl -u ingest -n 100` shows repeated `Started` / `Main process exited` / `Scheduled restart job` cycles, and between them the program's own last words, which are the real cause.

systemd has a **[[rate limiter|restart-limit]]** for exactly this. `systemctl show NAME -p StartLimitIntervalUSec -p StartLimitBurst` reports the defaults — `10s` and `5` on systemd 255. Once that many starts happen inside that window, it gives up and leaves the unit failed, and the journal says so:

```text
Sep 22 21:06:12 vm systemd[1]: sim-loop.service: Scheduled restart job, restart counter is at 5.
Sep 22 21:06:12 vm systemd[1]: sim-loop.service: Start request repeated too quickly.
Sep 22 21:06:12 vm systemd[1]: Failed to start sim-loop.service - Crash-looping sweep.
```

The `restart counter` line tells you how many times it has already tried. After that, `systemctl reset-failed ingest` is needed before it will start again.
:::

::: check
One colleague says a service is "enabled but not running"; another says one is "running but not enabled". Explain what each means, and which is the more dangerous state for a license server that simulations depend on.
:::

::: answer
"Enabled but not running": the symlink exists in a target's `.wants` folder, so it will start at the next boot, but right now it is stopped or failed. "Running but not enabled": it works now, but there is no symlink, so after the next reboot it will not come back.

For a license server the second is far more dangerous, because nothing is wrong today. Months later the machine reboots — an upgrade, a power cut — and every simulation on the cluster fails to get a license, with no recent change to point at and the person who started it by hand long gone. The first state is loud and immediate; the second is a trap with a long fuse.

`systemctl is-enabled NAME` and `systemctl is-active NAME` answer the two questions separately, and `systemctl status` shows both: `enabled` or `disabled` on the `Loaded:` line, the running state on the `Active:` line.
:::

::: check
Why does `ExecStart=/srv/campaign/run_sweep.sh > /var/log/sweep.log` not do what it looks like, and what are the two correct approaches?
:::

::: answer
Because `ExecStart` is not handed to a shell. systemd splits the line into words itself, so `>` and `/var/log/sweep.log` reach `run_sweep.sh` as two ordinary arguments, and no redirection happens. The same goes for `|`, `*`, `&&` and `~` — none of them mean anything there, and there is no `PATH` search from your shell either.

Approach one, usually the right one: do not redirect at all. systemd already sends a service's standard output and standard error to the journal (that is the default `StandardOutput=journal`), and `journalctl -u sweep` gives you the log with timestamps, unit name and process ID attached.

Approach two, when you truly need a file: run a shell on purpose — `ExecStart=/bin/bash -c '/srv/campaign/run_sweep.sh > /var/log/sweep.log 2>&1'` — or, cleaner, set `StandardOutput=append:/var/log/sweep.log` in the `[Service]` section, which systemd handles without starting a shell.
:::

::: check
A machine rebooted overnight. `journalctl -b -1` says there is no such boot. What happened, and what do you change so it does not happen again?
:::

::: answer
The journal is not persistent on that machine. When `/var/log/journal/` does not exist, `systemd-journald` stores the journal under `/run/log/journal/`, which is in memory — so it starts empty at every boot, and the previous boot's record is gone. `-b -1` has nothing to read.

The fix: `mkdir -p /var/log/journal`, then `systemctl restart systemd-journald` (or wait for the next boot). From then on `-b -1`, `-b -2` and so on work. Setting `Storage=persistent` in `/etc/systemd/journald.conf` makes the choice explicit instead of depending on whether a folder exists.

Put a cap on it while you are there, or a chatty service will fill the disk: `SystemMaxUse=2G` in the same file, or `journalctl --vacuum-time=30d` and `--vacuum-size=2G` to trim what is already stored. Run `journalctl --disk-usage` on any machine you have just been given.
:::

## Summary

| Command | Does | Note |
| --- | --- | --- |
| `systemctl status NAME` | state, PID, cgroup, recent journal | `●` running, `○` stopped, `×` failed |
| `Active: ... since Xs ago` | how long in this state | a few seconds, every time, means crash-looping |
| `systemctl start` / `stop` / `restart` / `reload` | now | `reload` needs `ExecReload=` |
| `systemctl enable` / `disable` | at boot — a symlink in a target's `.wants` | separate from running now |
| `systemctl is-active` / `is-enabled` / `is-failed` | scriptable, by exit status | `is-active` exits 3 when inactive |
| `systemctl --failed` | everything broken, in one list | first command on an unfamiliar machine |
| `systemctl is-system-running` | `running`, `degraded`, `starting`, `maintenance` | `degraded` sends you to `--failed` |
| `systemctl cat NAME` | the unit file, its path and drop-ins | what systemd assembled |
| `systemctl daemon-reload` | re-read unit files | after every edit |
| `systemctl edit NAME` | a drop-in override under `/etc` | survives package upgrades |
| `systemd-analyze verify FILE` | check a unit before loading it | read the messages: "ignoring" still exits 0 |
| `ExecStart=` | absolute path, no shell | no `>`, no `\|`, no wildcards, no `~` |
| `Type=simple/forking/oneshot/notify` | how systemd decides it started | `simple` unless the program backgrounds itself |
| `Restart=on-failure`, `RestartSec` | restart policy | `StartLimitBurst` stops a fast loop |
| `journalctl -u NAME -f -n N` | one unit, follow, last N | the service's output is captured automatically |
| `journalctl --since "-10 min" -p err -b -1 -k` | time, priority, boot, kernel | `-b -1` needs a persistent journal |
| `journalctl --disk-usage`, `--vacuum-time=30d` | size, and trim it | an in-memory journal dies with the reboot |

Lesson 13 is the rest of the diagnosis kit — `df`, `du`, `lsblk`, `ip`, `ss`, `curl`, `strace`, `lsof` and `dmesg` — for the half of the problems that are not a service at all.

::: context daemon-word Why background programs are called daemons
A **daemon** is a program that runs in the background with no terminal. Fernando Corbató, whose team at MIT used the word in the 1960s, said it was inspired by "Maxwell's demon", an imaginary helper in a physics thought experiment that works tirelessly out of sight. That is why so many service names end in `d`: `sshd` is the SSH daemon, `journald` the journal daemon, `systemd` the system daemon.
:::

::: context pid-1 The process with ID 1
When Linux finishes starting, it runs exactly one program, and that program gets process ID 1. Every other process on the machine descends from it. On nearly all current distributions, including Ubuntu, Debian, Fedora and Red Hat Enterprise Linux, PID 1 is systemd. Because it is the ancestor of everything, it is in the right position to start services in order, watch them, and restart them when they die.
:::

::: context target A target is a milestone
A **target** is a unit that does nothing itself; it groups other units into a milestone. `multi-user.target` means "the normal system is up, with networking and services, ready for logins" — the usual goal for a server. `graphical.target` is that plus a desktop. `network-online.target` means the network is actually configured. Saying `WantedBy=multi-user.target` puts your service on the list for that milestone.
:::

::: context unit-precedence Which copy of a unit wins
If the same unit name exists in more than one folder, systemd uses the copy from the highest folder and ignores the rest. Drop-in folders like `NAME.d/` are different: their settings are *added on top* of whichever file won.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="15" width="230" height="36" rx="5" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="135" y="38" font-size="12" text-anchor="middle" fill="#1f2a44">/etc/systemd/system</text>
  <rect x="20" y="62" width="230" height="36" rx="5" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="135" y="85" font-size="12" text-anchor="middle" fill="#1f2a44">/run/systemd/system</text>
  <rect x="20" y="109" width="230" height="36" rx="5" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="135" y="132" font-size="12" text-anchor="middle" fill="#1f2a44">/usr/lib/systemd/system</text>
  <line x1="290" y1="140" x2="290" y2="28" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="290,18 284,30 296,30" fill="#1d6fd1"/>
  <text x="305" y="60" font-size="11" fill="#1d6fd1">wins</text>
  <text x="305" y="132" font-size="11" fill="#6c7a93">loses</text>
</svg>
```
:::

::: context cgroup A fence around a service
A **control group** (cgroup) is a kernel feature that puts a set of processes in one labeled group, whose members can be counted, limited and stopped together. Every child a process starts joins the same group automatically, and forking or backgrounding itself does not get it out. That is how systemd knows that `sleep 1` belongs to `sim-sweep` even though the service never mentioned it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="15" y="15" width="330" height="120" rx="10" fill="#fff" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="6 4"/>
  <text x="25" y="34" font-size="12" fill="#1d6fd1">/system.slice/sim-sweep.service</text>
  <rect x="40" y="50" width="200" height="30" rx="5" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="140" y="70" font-size="12" text-anchor="middle" fill="#1f2a44">492 run_sweep.sh (main)</text>
  <line x1="80" y1="80" x2="80" y2="110" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="80" y1="110" x2="120" y2="110" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="120" y="96" width="120" height="28" rx="5" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="115" font-size="12" text-anchor="middle" fill="#1f2a44">499 sleep 1</text>
  <text x="300" y="112" font-size="11" text-anchor="middle" fill="#6c7a93">stop ends all</text>
</svg>
```
:::

::: context enable-symlink What enable actually changes
Enabling writes one symbolic link; disabling deletes it. At boot, systemd walks toward `multi-user.target`, looks in its `.wants` folder, and starts every unit it finds linked there.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="15" width="200" height="50" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="110" y="35" font-size="11" text-anchor="middle" fill="#1f2a44">multi-user.target.wants/</text>
  <text x="110" y="54" font-size="12" text-anchor="middle" fill="#1d6fd1">sim-sweep.service (link)</text>
  <line x1="210" y1="50" x2="248" y2="80" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="5 3"/>
  <polygon points="255,86 243,83 250,74" fill="#1d6fd1"/>
  <rect x="185" y="86" width="165" height="34" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="267" y="107" font-size="11" text-anchor="middle" fill="#1f2a44">sim-sweep.service (file)</text>
  <text x="10" y="100" font-size="11" fill="#6c7a93">enable adds the link</text>
  <text x="10" y="116" font-size="11" fill="#6c7a93">disable removes it</text>
</svg>
```
:::

::: context log-priority Eight levels of bad news
The priorities are numbered, a scheme borrowed from the older syslog system: 0 emerg, 1 alert, 2 crit, 3 err, 4 warning, 5 notice, 6 info, 7 debug. A smaller number is more urgent. `-p err` means "priority 3 or more urgent", so it shows levels 0 through 3.
:::

::: context restart-limit When the rate limiter never trips
The limiter counts *starts* inside a sliding window: with the defaults, five starts within 10 seconds. The default `RestartSec` is only 100 milliseconds, so a program that dies instantly reaches five starts in well under a second and gets stopped. But with `RestartSec=5`, starts come at most every 5 seconds, so at most three fit in any 10-second window. The limit is never reached, and the service can loop forever — which is exactly why the `since 4s ago` clue matters.
:::

::: context tmpfs A filesystem made of memory
A **tmpfs** is a filesystem that lives in RAM instead of on a disk. It is fast and needs no cleanup, because it starts empty at every boot. Linux puts `/run` on a tmpfs for exactly that reason: it holds things that only make sense while the machine is up, like process ID files and sockets. A log kept there has the same lifetime — until the power goes.
:::
