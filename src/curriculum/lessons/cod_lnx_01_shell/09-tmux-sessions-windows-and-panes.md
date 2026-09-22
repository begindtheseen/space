---
id: l09-tmux-sessions-windows-and-panes
title: tmux — sessions, windows and panes
minutes: 19
covers:
  - tmux sessions, windows, panes, detach/attach
---

Lesson 04 ended with a job that died because a terminal went away. `nohup` and `setsid` keep the process alive but give you nothing back: no scrollback, no way to type into it, no way to see what it is doing now. `tmux` solves the whole problem instead of half of it. The job runs in a session owned by a server process on the remote machine; your terminal is a *client* that draws that session. Disconnect and the session carries on; reconnect from anywhere and you are looking at the same screen, scrollback and all.

If you take one habit away from this module, take this one: **the first thing you type after `ssh` is `tmux`.** A six-hour Monte Carlo, a `make -j16`, a long `rsync` — all of them belong inside a session that does not care about your network.

All output below was produced on this machine and pasted verbatim with tmux 3.4 on Ubuntu 24.04.4, running as an ordinary user `eng`. The demonstration job, `sweep.sh`, prints one line per second so that the panes have something to show. PIDs, timestamps and the pane dimensions are specific to this capture.

## The model: server, session, window, pane

Four nouns, and they nest:

- The **server** is one background process per user per machine. It owns everything and starts itself the first time you run `tmux`.
- A **session** is a named workspace — normally one per task. `campaign`, `flightsw`, `notes`.
- A **window** is a full-screen tab inside a session, numbered from 0.
- A **pane** is a rectangle inside a window; splitting a window gives you two, each running its own shell.

A **client** is your terminal, attached to one session. Detaching leaves everything running and exits the client. That is the whole idea: the processes belong to the server, not to your terminal.

```bash
tmux -V
tmux ls
```

```text
tmux 3.4
```

```text
error connecting to /tmp/tmux-1500/default (No such file or directory)
```

Exit status 1 — there is no server yet, so there is nothing to list. The path is the server's control socket, under a directory named for your uid. Start a session and it appears:

```bash
tmux new-session -d -s campaign
tmux ls
```

```text
campaign: 1 windows (created Tue Sep 22 20:51:53 2026)
```

`-d` means "create it but do not attach", which is how a script starts a session; interactively you write `tmux new -s campaign` and land inside it.

## Detach and attach

Inside a session, every tmux command starts with the **prefix key**, `Ctrl-b` by default. Press and release the prefix, then press the command key. Detach is `Ctrl-b` then `d`:

```text
[detached (from session campaign)]
```

Your shell prompt comes back. Nothing in the session stopped. `tmux ls` still shows it, and `tmux attach -t campaign` — `tmux a -t campaign` for short — puts you back exactly where you were, mid-scrollback, with the job still printing.

The line across the bottom of an attached client is the status bar, and it is worth reading:

```text
[campaign]0:tail*                                           "vm" 20:52 22-Sep-26
```

Session name in brackets; then the windows, here just window 0 running `tail`, with `*` marking the active one; then the hostname, the time and the date. When you have four sessions on three machines, that bracket is how you know which one you are typing into.

::: example The job outlives the client, and here is the proof
A session is created, a sweep is started in it, and the session is then examined from outside.

```bash
tmux new-session -d -s campaign
tmux send-keys -t campaign './sweep.sh | tee sweep.log' Enter
pgrep -a -f "bash ./sweep.sh"
```

```text
2185 /bin/bash ./sweep.sh
```

```bash
tmux ls
```

```text
campaign: 1 windows (created Tue Sep 22 20:53:07 2026)
```

The sweep is running, and its parent is a shell owned by the tmux server — not by the terminal that ran `tmux new-session`, which had already returned to a prompt because of `-d`. Closing that terminal, or dropping the SSH connection that carried it, changes nothing about process 2185.

What *does* stop it is killing the session:

```bash
tmux kill-session -t campaign
pgrep -a -f sweep.sh
```

```text
2185 [sweep.sh] <defunct>
```

`tmux` sent the pane's processes `SIGHUP` when the session went away, and the sweep is now a zombie waiting to be reaped — the state from lesson 04. So `kill-session` is a real kill: detach when you want to leave, and only kill when you mean to stop the work.
:::

## Windows

`Ctrl-b c` creates a window, `Ctrl-b ,` renames it, `Ctrl-b n` and `Ctrl-b p` move next and previous, and `Ctrl-b <digit>` jumps straight to a number. `Ctrl-b w` gives an interactive list of every window in every session.

```bash
tmux list-windows -t campaign
```

```text
0: watch- (2 panes) [100x20] [layout 6309,100x20,0,0{50x20,0,0,0,49x20,51,0,1}] @0
1: plots* (1 panes) [100x20] [layout a67f,100x20,0,0,2] @1 (active)
```

Window 0 is named `watch` and holds two panes; window 1 is named `plots` and is active, which is what the `*` means. tmux names a window after the program running in it unless you rename it — and renaming is worth the two keystrokes, because `0:bash 1:bash 2:bash` tells you nothing at four in the afternoon.

The layout strings and `@0`/`@1` identifiers are tmux's internal bookkeeping. You never type them; they are useful only in that `tmux list-windows` is a machine-readable way for a script to find out what exists.

## Panes

`Ctrl-b %` splits the current pane left and right; `Ctrl-b "` splits it top and bottom. `Ctrl-b` then an arrow key moves between panes, `Ctrl-b o` cycles, `Ctrl-b z` zooms the current pane to fill the window (press again to unzoom), `Ctrl-b x` kills it, and `Ctrl-b space` cycles through the preset layouts. Holding the prefix and pressing an arrow repeatedly resizes.

::: example The layout you will actually use
One window, split top and bottom: the sweep running above, a shell below to poke at its output while it runs.

```text
--- pane 0 ---
20:53:09 case 0002 done
20:53:10 case 0003 done
20:53:11 case 0004 done
20:53:12 case 0005 done
20:53:13 case 0006 done
20:53:14 case 0007 done
20:53:15 case 0008 done
--- pane 1 ---
$ grep -c done sweep.log
5
$ tail -n 2 sweep.log
20:53:12 case 0005 done
20:53:13 case 0006 done
$
```

```bash
tmux list-panes -t campaign
```

```text
0: [90x8] [history 2/2000, 7301 bytes] %0
1: [90x7] [history 0/2000, 3447 bytes] %1 (active)
```

Ninety columns by eight rows and by seven, with 2 lines of scrollback in the first and none yet in the second. Note the arithmetic: 8 + 7 = 15, one short of the window's 16 rows, because the divider takes a line.

This is the whole ergonomic argument for panes. The top pane is the authoritative live output; the bottom is where you count what has completed, check a config, or start the analysis on the cases that have already finished — without stopping the job, without a second SSH connection, and without losing either view.
:::

## Scrollback and copy mode

The pane's scrollback is tmux's, not your terminal's, which is why your mouse wheel may do nothing useful by default. `Ctrl-b [` enters **copy mode**, and then:

- arrow keys, `PageUp`/`PageDown`, `Ctrl-u`/`Ctrl-d` scroll;
- `/` searches forward and `?` backward, `n` and `N` repeat — the same keys as `less`;
- `g` and `G` go to the top and the bottom;
- `space` starts a selection, `Enter` copies it, `Ctrl-b ]` pastes it into the current pane;
- `q` leaves copy mode.

`[history 2/2000, ...]` in the `list-panes` output above is the scrollback: 2 lines retained of a 2000-line limit. Two thousand is the default and it is far too small for a job that prints a line per case. Raise it.

`tmux capture-pane -p -t campaign.0` prints a pane's visible contents to standard output, and with `-S -3000` it prints the scrollback too. That is how you get a session's output into a file from a script — and how every pane in this lesson was captured.

## Configuration worth having

`~/.tmux.conf` is read when the server starts. Four lines earn their place:

```text
set -g history-limit 100000
set -g mouse on
setw -g mode-keys vi
set -g base-index 1
```

`history-limit` is the scrollback, per pane, in lines — the default 2000 is about half an hour of a chatty simulation. `mouse on` makes the wheel scroll, and clicking select panes and drag resize them; it is the single change that makes tmux feel less hostile. `mode-keys vi` gives copy mode `vi` motions. `base-index 1` numbers windows from 1 so they match the number keys on the keyboard.

Many people also remap the prefix — `set -g prefix C-a` — because `Ctrl-b` collides with the `vi`/`less` page-up binding. Do it if you like, but remember that on someone else's machine the prefix is `Ctrl-b`.

After editing the file, `tmux source-file ~/.tmux.conf` applies it to the running server; `Ctrl-b ?` lists every key binding in effect.

::: note
`screen` is the older program that does the same job. It is still installed on machines that have nothing else, its prefix is `Ctrl-a`, `Ctrl-a d` detaches and `screen -r` reattaches. If you find yourself on a host with no tmux, those three facts are enough. Everything else here is tmux-specific.
:::

## The working pattern

Put together, the routine for a long run on a remote machine is four steps:

1. `ssh sim01`
2. `tmux new -s campaign` — or `tmux a -t campaign` if it is already there
3. start the job; split a pane for watching it
4. `Ctrl-b d`, and close the laptop

Come back tomorrow: `ssh sim01`, `tmux a -t campaign`, and the scrollback is still there. If the job finished overnight, its final output is on the screen where it stopped, which is exactly what `nohup` cannot give you.

Two habits that go with it. Name sessions after the work, not after the day — `campaign`, not `tuesday` — because you will attach to them by name for a week. And run `tmux ls` when you log in, before you start anything: it is common to find a session you had forgotten, still holding the output you are about to regenerate.

::: key
tmux runs a server on the remote machine; sessions, windows and panes belong to it, not to your terminal. `Ctrl-b d` detaches and leaves everything running; `tmux a -t name` reattaches with the scrollback intact. `tmux kill-session` really does kill — it hangs up the panes' processes. Raise `history-limit`; 2000 lines is not enough.
:::

## Check yourself

::: check
You run `tmux new -s campaign`, start a six-hour Monte Carlo, and press `Ctrl-b` then `x`. What happened, and what should you have pressed?
:::

::: answer
`Ctrl-b x` kills the current *pane*. Since the session had one window with one pane, tmux prompted to confirm and then destroyed the pane, the window and the session with it, hanging up the Monte Carlo. Six hours of work, if it had been running that long, are gone.

The key you wanted was `Ctrl-b d` — detach. It exits the client and leaves the server, the session and every process in it untouched. The mnemonic that keeps them apart: `d` for detach is about *you* leaving; `x` and `kill-session` are about the *work* stopping. If you are ever unsure, just close your terminal window — tmux treats that exactly like a detach.
:::

::: check
Explain why a job started inside tmux survives an SSH disconnection, in terms of what lesson 04 said about `SIGHUP` and process groups.
:::

::: answer
When the SSH connection drops, the server tears down the pseudo-terminal, and the kernel sends `SIGHUP` to the process group attached to it. Inside a plain SSH session that group contains your shell and its jobs, so they are terminated.

With tmux, that group contains only the tmux *client*. The client dies, and nothing else does, because the job's terminal is a pseudo-terminal created by the tmux **server**, which is a separate process in its own session with no controlling terminal and no connection to your SSH session at all. The server was started by you but is not a child of your shell in any way that matters: nothing about your connection's teardown reaches it.

That is also exactly why `tmux kill-session` does stop the job — it makes the server destroy the pane's pseudo-terminal, and *that* hangup does reach the processes inside.
:::

::: check
You reattach to a session the next morning and want the line where a particular case first printed `WARN`, which was about 40,000 lines ago. Two things could stop you finding it. What are they, and what should you have set up in advance?
:::

::: answer
First, the default `history-limit` of 2000 lines per pane. Forty thousand lines ago is long gone; tmux discarded it as new output arrived, and no key will bring it back. Second, even within the retained history, scrolling by hand is hopeless — you need `Ctrl-b [` to enter copy mode and then `/WARN` and `n` to search, which is the same key set as `less`.

In advance: `set -g history-limit 100000` in `~/.tmux.conf`, so a day of output is retained. Better still, do not rely on scrollback at all for anything you might need — pipe the job through `tee` to a log file, as in `./sweep.sh 2>&1 | tee sweep.log`. Scrollback is a convenience that a pane resize or a server restart can lose; a file on disk is the record. Then the question becomes `grep -n WARN sweep.log`, which needs no tmux at all.
:::

::: check
Your colleague's tmux does not respond to `Ctrl-b c` on his machine, and the status bar is green rather than the default. What is the likeliest explanation, and how do you find the answer without asking him?
:::

::: answer
He has a `~/.tmux.conf` that remaps the prefix — `set -g prefix C-a` is by far the commonest change, usually together with `unbind C-b` — and has also restyled the status bar. So `Ctrl-b` does nothing because it is no longer the prefix; the binding for `c` is intact, you just cannot reach it.

You find out from inside the session. `Ctrl-b ?` lists the key bindings, but of course that needs the prefix too. The reliable route is a command prompt or the shell: `tmux show-options -g prefix` prints the current prefix key, and `tmux list-keys` prints every binding. Both are ordinary commands you can type at a shell inside a pane, no prefix required. That is generally true of tmux: everything the prefix does is also a command you can run, which is what makes it scriptable.
:::

::: check
Give the commands to start a detached session called `sweep`, run `./run_campaign.sh` in it with its output also going to a file, and check from a script whether that session still exists.
:::

::: answer
```bash
tmux new-session -d -s sweep './run_campaign.sh 2>&1 | tee campaign.log'
tmux has-session -t sweep
```

`-d` creates the session without attaching, so the command returns immediately and the calling script carries on. Giving the shell command as the last argument makes it the pane's process rather than an interactive shell — note that when it exits, the pane and the session close, so redirect to a file if you want the output afterwards. `2>&1 | tee` captures both streams, in the order from lesson 05.

`tmux has-session -t sweep` is the scriptable check: exit status 0 if it exists, 1 if not, with a message on stderr, so `if tmux has-session -t sweep 2>/dev/null; then ...` is the idiom. `tmux ls` works too but you would have to parse it. If you want the session to stay open after the job ends so you can read the last screen, use `tmux new-session -d -s sweep` followed by `tmux send-keys -t sweep './run_campaign.sh 2>&1 | tee campaign.log' Enter`, which runs it inside an interactive shell that survives the command.
:::

## Summary

| Command or key | Does | Note |
| --- | --- | --- |
| `tmux new -s NAME` / `-d` | create a session, attached / detached | `-d` is the scriptable form |
| `tmux ls` | list sessions | exit 1 and a socket-path error when no server runs |
| `tmux a -t NAME` | attach | scrollback and running jobs intact |
| `tmux has-session -t NAME` | exit 0 if it exists | the check a script should use |
| `Ctrl-b` | the prefix key | released before the command key |
| `Ctrl-b d` | detach | leaves everything running |
| `tmux kill-session -t NAME` | destroy it | hangs up the panes' processes — a real kill |
| `Ctrl-b c` / `,` / `n` `p` / digit / `w` | new window / rename / move / jump / list | name them after the work |
| `Ctrl-b %` / `"` / arrows / `o` / `z` / `x` | split vertical / horizontal / move / cycle / zoom / kill pane | `z` un-zooms on a second press |
| `Ctrl-b [`, `/`, `n`, `q` | copy mode, search, repeat, leave | the same keys as `less` |
| `tmux capture-pane -p [-S -3000]` | print a pane, optionally with scrollback | how a script reads a session's output |
| `history-limit`, `mouse on`, `mode-keys vi`, `base-index 1` | the four lines of `~/.tmux.conf` | 2000 lines of scrollback is not enough |
| `tmux source-file ~/.tmux.conf`, `Ctrl-b ?` | reload config, list bindings | `tmux list-keys` does the same from a shell |
| `screen`, `Ctrl-a d`, `screen -r` | the older equivalent | for machines with no tmux |

Lesson 10 turns to the shell you find waiting inside each of those panes: environment variables, `PATH`, and the difference between `.bashrc` and `.bash_profile` that decides which of your settings a remote command actually sees.
