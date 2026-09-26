---
id: l09-tmux-sessions-windows-and-panes
title: tmux — sessions, windows and panes
minutes: 21
covers:
  - tmux sessions, windows, panes, detach/attach
---

Think of a TV show you are streaming. Your phone is only a screen. Turn the phone off, and the show is still there on the service's computers; pick up your tablet, and you can carry on from the same spot. **tmux** does that for work in a terminal. Your job runs on the remote machine, inside a session that tmux keeps alive. Your terminal is only a screen showing it. Close the screen, lose the network, and the job carries on. Reconnect from anywhere and you see the same screen, with everything it printed still there.

Lesson 04 ended with a job that died because a terminal went away. `nohup` and `setsid` keep the process alive but give you nothing back: no **scrollback** (the earlier output you can scroll up to), no way to type into it, no way to see what it is doing now. tmux solves the whole problem instead of half of it.

If you take one habit from this module, take this one: **the first thing you type after `ssh` is `tmux`.** A six-hour Monte Carlo campaign, a sixteen-way parallel build, a long `rsync` — all of them belong in a session that does not care about your network.

All output below is real, pasted as it came out, from tmux 3.4 on Ubuntu 24.04, run by an ordinary user `eng`. The demonstration job, `sweep.sh`, prints one line per second so the panes have something to show. Process numbers, times and pane sizes will differ on yours.

## The model: server, session, window, pane

tmux has four nouns, and they fit inside each other like boxes in boxes — a **[[nesting picture|tmux-nesting]]** worth keeping in your head:

- The **server** is one background program per user per machine. It owns everything, and it starts itself the first time you run `tmux`.
- A **session** is a named workspace, normally one per task: `campaign`, `flightsw`, `notes`.
- A **window** is a full-screen tab inside a session, numbered from 0.
- A **pane** is a rectangle inside a window. Splitting a window gives you two panes, each running its own shell.

A **client** is your terminal, attached to one session. **Detaching** closes the client and leaves everything else running. That is the whole idea: the programs belong to the server, not to your terminal.

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

`tmux ls` ("list sessions") exits with status 1: there is no server yet, so there is nothing to list. The path is the server's **[[control socket|tmux-socket]]**, in a folder named after your user number. (If the folder exists but no server is running, the message reads `no server running on ...` instead.) Start a session and it appears:

```bash
tmux new-session -d -s campaign
tmux ls
```

```text
campaign: 1 windows (created Tue Sep 22 20:51:53 2026)
```

`-s campaign` names the session. `-d` means "create it but do not attach", which is how a script starts one. Typing at the keyboard, you would write `tmux new -s campaign` and land inside it.

## Detach and attach

Inside a session, every tmux command starts with the **[[prefix key|why-a-prefix]]**: `Ctrl-b` by default. Hold `Ctrl`, tap `b`, let go of both, *then* press the command key. Detach is `Ctrl-b` then `d`:

```text
[detached (from session campaign)]
```

Your shell prompt comes back, and nothing in the session stopped. `tmux ls` still lists it. `tmux attach -t campaign` — `tmux a -t campaign` for short, where `-t` means "target" — puts you back exactly where you were, mid-scrollback, with the job still printing.

The line across the bottom of an attached screen is the **status bar**, and it is worth reading:

```text
[campaign]0:tail*                                           "vm" 20:52 22-Sep-26
```

Left to right: the session name in brackets; then the windows, here only window 0, running `tail`, with `*` marking the active one; then the machine's name, the time and the date. With four sessions on three machines, that bracket is how you know which one you are typing into.

::: example The job outlives the client, and here is the proof
Create a session, start a sweep in it, then look at it from outside. `send-keys` types text into a pane as if you had typed it, and `Enter` presses the Enter key.

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

The sweep is running as process 2185. Its parent is a shell that belongs to the tmux server — not to the terminal that ran `tmux new-session`, which had already gone back to its prompt because of `-d`. So closing that terminal, or dropping the SSH connection that carried it, changes nothing for process 2185.

What *does* stop it is killing the session:

```bash
tmux kill-session -t campaign
pgrep -a -f sweep.sh
```

```text
2185 [sweep.sh] <defunct>
```

When the session went away, tmux sent `SIGHUP` ("hang up") to the programs in its panes. The sweep ended, and in this snapshot it is a **[[zombie|zombie-bridge]]** — finished, waiting for its exit status to be collected — the state from lesson 04. Sanity check on the lesson: `kill-session` is a real kill. Detach when you want to leave; kill only when you mean to stop the work.
:::

## Windows

Windows are like browser tabs. The keys, each after `Ctrl-b`:

- `c` **c**reates a window;
- `,` renames the current one;
- `n` and `p` move to the **n**ext and **p**revious;
- a digit, `0` to `9`, jumps straight to that number;
- `w` shows an interactive list of every window in every session.

```bash
tmux list-windows -t campaign
```

```text
0: watch- (2 panes) [100x20] [layout 6309,100x20,0,0{50x20,0,0,0,49x20,51,0,1}] @0
1: plots* (1 panes) [100x20] [layout a67f,100x20,0,0,2] @1 (active)
```

Window 0 is named `watch` and holds two panes. Window 1 is named `plots` and is active — that is what the `*` means. The `-` after `watch` marks the *previous* window, the one `Ctrl-b l` ("last") would jump back to.

tmux names a window after the program running in it unless you rename it. Renaming is worth the two keystrokes, because `0:bash 1:bash 2:bash` tells you nothing at four in the afternoon.

The `[layout ...]` strings and `@0`/`@1` labels are tmux's own bookkeeping. You never type them. They matter only because `tmux list-windows` gives a script a reliable way to find out what exists.

## Panes

Panes split one window into parts, like dividing a sheet of paper with a ruler. The keys, each after `Ctrl-b`:

- `%` splits the current pane into left and right halves; `"` splits it into top and bottom — see the **[[split picture|pane-splits]]**;
- an arrow key moves to the pane in that direction, and `o` cycles through them;
- `z` **z**ooms the current pane to fill the window, and a second `z` puts it back;
- `x` kills the current pane, after asking `kill-pane 0? (y/n)`;
- `space` cycles through the preset layouts;
- `Ctrl`+arrow (that is, `Ctrl-b` then `Ctrl-Up`, and so on) resizes by one cell. For a short moment afterwards you can tap more `Ctrl`+arrows without pressing the prefix again.

::: example The layout you will actually use
One window, split top and bottom: the sweep running above, and a shell below to look at its output while it runs.

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

Read the sizes as columns by rows: pane 0 is 90 columns wide and 8 rows tall, pane 1 is 90 by 7. The `history 2/2000` says pane 0 keeps 2 lines of scrollback out of a limit of 2000, and pane 1 none yet.

Check the arithmetic: $8 + 7 = 15$ rows, one short of the window's 16, because the dividing line between the panes takes a row of its own.

This is the whole case for panes. The top pane is the live, trusted output. The bottom is where you count what has finished, check a config, or start analyzing the cases already done — without stopping the job, without a second SSH connection, and without losing either view.
:::

## Scrollback and copy mode

The scrollback belongs to tmux, not to your terminal program, which is why your mouse wheel may do nothing useful at first. `Ctrl-b [` enters **copy mode**, a way to move around in the pane's history.

tmux has two sets of copy-mode keys, one modeled on the Emacs editor and one on vi, and it uses the **[[Emacs set unless told otherwise|emacs-or-vi-keys]]**. In both, `PageUp` and `PageDown` scroll, `n` and `N` repeat a search, and `q` leaves copy mode. The rest differ:

| Job | default (Emacs) keys | vi keys |
| --- | --- | --- |
| search down / up | `Ctrl-s` / `Ctrl-r` | `/` / `?` — the same keys as `less` |
| half a page up / down | `Alt-Up` / `Alt-Down` | `Ctrl-u` / `Ctrl-d` |
| top / bottom of history | `Alt-<` / `Alt->` | `g` / `G` |
| start a selection | `Ctrl-Space` | `Space` |
| copy the selection | `Alt-w` | `Enter` |

Whichever set you use, `Ctrl-b ]` pastes what you copied into the current pane. The next section switches on the vi set with one line.

`[history 2/2000, ...]` in the `list-panes` output above is the scrollback: 2 lines kept, out of a 2000-line limit. Two thousand is the default, and it is far too small for a job that prints a line per case. Raise it.

`tmux capture-pane -p -t campaign.0` prints what pane 0 of `campaign` is showing (`-p` means print to standard output). Add `-S -3000` to start 3000 lines back in the scrollback. That is how a script gets a session's output into a file — and how every pane in this lesson was captured.

## Configuration worth having

`~/.tmux.conf` is read when the server starts. Four lines earn their place:

```text
set -g history-limit 100000
set -g mouse on
setw -g mode-keys vi
set -g base-index 1
```

Line by line (`-g` means "global", for every session):

- `history-limit` is the scrollback per pane, in lines. The default 2000 is about half an hour of a chatty simulation.
- `mouse on` makes the wheel scroll, lets you click to choose a pane, and lets you drag the dividers to resize. It is the single change that makes tmux feel friendly.
- `mode-keys vi` gives copy mode the vi keys from the table above.
- `base-index 1` numbers windows from 1, so they match the order of the number keys along the keyboard.

Many people also change the prefix — `set -g prefix C-a` — because `Ctrl-b` also means "page back" in `vi` and `less`. Do it if you like, but remember that on someone else's machine the prefix is `Ctrl-b`.

After editing the file, `tmux source-file ~/.tmux.conf` applies it to the running server. `Ctrl-b ?` lists every key binding in effect.

::: note The older cousin: screen
`screen` is the older program that does the same job, and it is still installed on machines that have nothing else. Its prefix is `Ctrl-a`; `Ctrl-a d` detaches, and `screen -r` reattaches. If you land on a host with no tmux, those three facts are enough. Everything else in this lesson is tmux-specific.
:::

## The working pattern

Put together, a long run on a remote machine is four steps:

1. `ssh sim01`
2. `tmux new -s campaign` — or `tmux a -t campaign` if it already exists
3. start the job, and split a pane for watching it
4. `Ctrl-b d`, and close the laptop

Come back tomorrow: `ssh sim01`, `tmux a -t campaign`, and the scrollback is still there. If the job finished overnight, its last output is on the screen where it stopped — exactly what `nohup` cannot give you.

Two habits go with it. Name sessions after the work, not the day — `campaign`, not `tuesday` — because you will attach to them by name for a week. And run `tmux ls` when you log in, before you start anything. It is common to find a forgotten session still holding the output you were about to regenerate.

::: key tmux in one breath
tmux runs a server on the remote machine; sessions, windows and panes belong to it, not to your terminal. `Ctrl-b d` detaches and leaves everything running; `tmux a -t name` reattaches with the scrollback intact. `tmux kill-session` really does kill — it hangs up the panes' processes. Raise `history-limit`; 2000 lines is not enough.
:::

## Check yourself

::: check
You run `tmux new -s campaign`, start a six-hour Monte Carlo, then press `Ctrl-b` then `x`, and answer `y` to the question at the bottom of the screen. What happened, and what should you have pressed?
:::

::: answer
`Ctrl-b x` kills the current *pane*. tmux asked `kill-pane 0? (y/n)`, and you said yes. The session had one window with one pane, so tmux destroyed the pane, then the empty window, then the empty session — and hung up the Monte Carlo inside it. Whatever it had computed so far is gone.

The key you wanted was `Ctrl-b d` — detach. It closes the client and leaves the server, the session and every program in it untouched.

A way to keep them apart: `d` for detach is about *you* leaving; `x` and `kill-session` are about the *work* stopping. If you are ever unsure, close the terminal window instead — tmux treats that exactly like a detach.
:::

::: check
Explain why a job started inside tmux survives an SSH disconnection, using what lesson 04 said about `SIGHUP` and process groups.
:::

::: answer
When the SSH connection drops, the server side tears down your **pseudo-terminal** (the software stand-in for a terminal that SSH gave your login). The kernel sends `SIGHUP` to the programs attached to that terminal, and your shell passes it on to its jobs. In a plain SSH session that includes the job, so it dies.

With tmux, the only program attached to the SSH terminal is the tmux *client*. The client gets the hang-up and exits, and nothing else is touched. The job's terminal is a different pseudo-terminal, created by the tmux **server** — a separate process that runs in its own session with no terminal of its own, and no link to your SSH login. Nothing about your connection's teardown reaches it.

That is also exactly why `tmux kill-session` *does* stop the job: the server destroys the pane's pseudo-terminal itself, and *that* hang-up reaches the programs inside.
:::

::: check
You reattach the next morning and want the line where one case first printed `WARN`, about 40,000 lines ago. Two things could stop you finding it. What are they, and what should you have set up in advance?
:::

::: answer
First, the default `history-limit` of 2000 lines per pane. Forty thousand lines back is long gone; tmux threw it away as new output arrived, and no key brings it back.

Second, even inside the history it keeps, scrolling by hand through thousands of lines is hopeless. You need to search: `Ctrl-b [` to enter copy mode, then `Ctrl-r` and type `WARN` with the default keys — or, with `mode-keys vi`, `?WARN` to search upward and `n` to repeat, the same keys as `less`.

In advance: put `set -g history-limit 100000` in `~/.tmux.conf`, so a day of output is kept. Better still, do not rely on scrollback for anything you might need. Send the job's output through `tee` to a file: `./sweep.sh 2>&1 | tee sweep.log`. Scrollback is a convenience that a server restart can lose; a file on disk is the record. Then the question becomes `grep -n WARN sweep.log`, which needs no tmux at all.
:::

::: check
On a colleague's machine, `Ctrl-b c` does nothing, and the status bar is green instead of the usual color. What is the likeliest explanation, and how can you find out without asking him?
:::

::: answer
He has a `~/.tmux.conf` that changes the prefix — `set -g prefix C-a`, usually with `unbind C-b`, is by far the most common change — and he has also restyled the status bar. So `Ctrl-b` does nothing because it is no longer the prefix. The `c` binding is still there; you cannot reach it.

Find out from inside the session. `Ctrl-b ?` would list the bindings, but it needs the prefix too. The reliable route is the shell in any pane: `tmux show-options -g prefix` prints the current prefix key, and `tmux list-keys` prints every binding. Both are ordinary commands and need no prefix. That is true of tmux in general: everything a key does is also a command you can type, which is what makes it scriptable.
:::

::: check
Give the commands to start a detached session called `sweep`, run `./run_campaign.sh` in it with its output also going to a file, and check from a script whether that session still exists.
:::

::: answer
```bash
tmux new-session -d -s sweep './run_campaign.sh 2>&1 | tee campaign.log'
tmux has-session -t sweep
```

`-d` creates the session without attaching, so the command returns at once and the script carries on. Putting the shell command last makes it the pane's program instead of an interactive shell. The catch: when the command ends, the pane and the session close with it, so the file is where the output survives. `2>&1 | tee` captures both output streams, in the order lesson 05 taught.

`tmux has-session -t sweep` is the check for scripts: exit status 0 if the session exists, 1 if not (with a message on standard error). So the usual form is `if tmux has-session -t sweep 2>/dev/null; then ...`. `tmux ls` works too, but you would have to pick apart its output.

If you want the session to stay open after the job ends, so you can read its last screen, start an ordinary session and type the command into it: `tmux new-session -d -s sweep`, then `tmux send-keys -t sweep './run_campaign.sh 2>&1 | tee campaign.log' Enter`. The job then runs inside an interactive shell that outlives it.
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
| `Ctrl-b %` / `"` / arrows / `o` / `z` / `x` | split left-right / top-bottom / move / cycle / zoom / kill pane | `z` un-zooms on a second press; `x` asks first |
| `Ctrl-b [`, then `q` | enter and leave copy mode | search `Ctrl-r`/`Ctrl-s`, or `/` `?` `n` with vi keys |
| `tmux capture-pane -p [-S -3000]` | print a pane, optionally with scrollback | how a script reads a session's output |
| `history-limit`, `mouse on`, `mode-keys vi`, `base-index 1` | the four lines of `~/.tmux.conf` | 2000 lines of scrollback is not enough |
| `tmux source-file ~/.tmux.conf`, `Ctrl-b ?` | reload config, list bindings | `tmux list-keys` does the same from a shell |
| `screen`, `Ctrl-a d`, `screen -r` | the older equivalent | for machines with no tmux |

Lesson 10 turns to the shell waiting inside each of those panes: environment variables, `PATH`, and the difference between `.bashrc` and `.bash_profile` that decides which of your settings a remote command actually sees.

::: context tmux-nesting Boxes inside boxes
One server holds any number of sessions; each session holds windows; each window holds panes; each pane runs one program, usually a shell. Your terminal (the client) looks at one window of one session at a time. The name *tmux* is short for **terminal multiplexer** — one connection, many terminals.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="8" y="8" width="344" height="184" rx="8" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="18" y="26" font-size="12" fill="#1f2a44" font-weight="700">server</text>
  <rect x="20" y="36" width="210" height="146" rx="6" fill="#fff" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="30" y="53" font-size="12" fill="#1d6fd1">session: campaign</text>
  <rect x="30" y="62" width="120" height="110" rx="4" fill="#fff" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="38" y="78" font-size="11" fill="#1f2a44">window 0: watch</text>
  <rect x="38" y="86" width="104" height="38" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="90" y="109" font-size="11" text-anchor="middle" fill="#1f2a44">pane 0</text>
  <rect x="38" y="126" width="104" height="38" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="90" y="149" font-size="11" text-anchor="middle" fill="#1f2a44">pane 1</text>
  <rect x="158" y="62" width="64" height="110" rx="4" fill="#fff" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="190" y="78" font-size="11" text-anchor="middle" fill="#1f2a44">window 1</text>
  <rect x="166" y="86" width="48" height="78" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="190" y="129" font-size="11" text-anchor="middle" fill="#1f2a44">pane</text>
  <rect x="242" y="36" width="100" height="146" rx="6" fill="#fff" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="292" y="53" font-size="12" text-anchor="middle" fill="#1d6fd1">session: notes</text>
  <text x="292" y="115" font-size="11" text-anchor="middle" fill="#6c7a93">its own windows</text>
</svg>
```
:::

::: context tmux-socket Where the server lives
The server and its clients talk through a Unix socket — a special file that works like a hatch between two programs on one machine. By default it is `/tmp/tmux-UID/default`, where UID is your numeric user id (`id -u` prints it; 1500 in the transcript). Every `tmux` command you type finds the server through that file. That is why the error names the path: no file there means no server to talk to.
:::

::: context why-a-prefix Why tmux needs a prefix key
Almost every key you press inside tmux must go straight through to the program in the pane — your shell, an editor, a running simulation. tmux needs one key that means "the next key is for me, not for the program". That is the prefix. `Ctrl-b` was picked because few programs need it; `screen`, the older tool, used `Ctrl-a`, which clashes with "go to start of line" in the shell. To send a real `Ctrl-b` to the program, press it twice.
:::

::: context zombie-bridge Why a zombie, and not gone at once
A finished process leaves behind a tiny record holding its exit status, and it stays a zombie until its parent collects that record. Here the sweep's parent shell was hung up at the same moment, so the sweep was handed to the system's first process, whose job is to collect such orphans. On a normal Linux machine that happens almost at once and the zombie vanishes; the capture happened to catch it in between. A zombie uses no CPU and no memory beyond that small record.
:::

::: context pane-splits Which key splits which way
The symbols are easy to muddle. Think of `%` as a slash drawn down the middle — a vertical divider, so the halves sit left and right. Think of `"` as two marks one above the other — a horizontal divider, so the halves are stacked. The divider takes one row or column itself, which is why a 16-row window split top and bottom gives $8 + 7 = 15$ rows of panes.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="24" width="140" height="90" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="90" y1="24" x2="90" y2="114" stroke="#1f2a44" stroke-width="3"/>
  <text x="55" y="73" font-size="12" text-anchor="middle" fill="#1f2a44">pane 0</text>
  <text x="125" y="73" font-size="12" text-anchor="middle" fill="#1f2a44">pane 1</text>
  <text x="90" y="16" font-size="12" text-anchor="middle" fill="#1f2a44">Ctrl-b %</text>
  <text x="90" y="132" font-size="11" text-anchor="middle" fill="#6c7a93">left and right</text>
  <rect x="200" y="24" width="140" height="90" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="200" y1="69" x2="340" y2="69" stroke="#1f2a44" stroke-width="3"/>
  <text x="270" y="51" font-size="12" text-anchor="middle" fill="#1f2a44">pane 0</text>
  <text x="270" y="96" font-size="12" text-anchor="middle" fill="#1f2a44">pane 1</text>
  <text x="270" y="16" font-size="12" text-anchor="middle" fill="#1f2a44">Ctrl-b "</text>
  <text x="270" y="132" font-size="11" text-anchor="middle" fill="#6c7a93">top and bottom</text>
</svg>
```
:::

::: context emacs-or-vi-keys Two families of keys
Emacs and vi are two old, much-loved text editors with very different key habits, and many terminal tools copy one or the other. tmux's copy mode uses the Emacs-style keys by default, but switches to vi-style by itself if your `EDITOR` or `VISUAL` setting contains "vi". `tmux show-window-options -g mode-keys` tells you which you have. The vi keys are worth learning because `less`, `man` and vim (lesson 14) share them.
:::
