---
id: l14-vim-survival
title: vim survival
minutes: 21
covers:
  - 'vim survival: modes, motions, :wq'
---

You will end up in `vim` whether you choose it or not. Some version of **[[vi|vi-history]]** is on nearly every Linux machine ever shipped. `git` opens an editor for a commit message; `crontab -e`, `systemctl edit` and `visudo` open one too. They pick it from `EDITOR` or `VISUAL` (lesson 10), and on many machines the fallback is `vi` or `vim`. On a freshly built compute node it may be the only editor installed. Not knowing it means learning it at a bad moment, or being unable to fix a one-character typo on a machine that has nothing else.

This lesson is not a course in `vim`. It is the twenty-odd commands that let you open a configuration file, change a line, save it and get out — plus the three messages that trap people who never learned them.

All screens below were captured from `vim` 9.1 on Ubuntu 24.04.4, in a terminal 78 columns wide and 14 rows tall. Yours will be a different size, so the bottom line sits somewhere else, but every character shown is what `vim` drew. The file is a small campaign configuration.

## The idea: modes

Think of the keyboard on your phone. Tap the `123` key and the same keys stop making letters and make digits instead. Nothing about the keys changed; the layer did.

`vim` works like that. Every other editor you have used is always in "type letters" mode. `vim` is not. It starts in **normal mode**, where letter keys are *commands*: `x` deletes a character, `j` moves down, `d` starts a delete. To type text you deliberately switch to **insert mode**. That is the whole source of the confusion, and the whole point: in normal mode, the entire keyboard is free for editing actions.

Four **[[modes|modes-map]]** matter:

| Mode | Entered by | What keys do |
| --- | --- | --- |
| normal | `Esc` (from anywhere) | commands: move, delete, copy, paste |
| insert | `i`, `a`, `o`, `O`, `c` | type text |
| visual | `v`, `V`, `Ctrl-v` | select, then act on the selection |
| command-line | `:`, `/`, `?` | a line at the bottom: `:w`, `/pattern` |

**`Esc` returns to normal mode from all of them.** When you are lost, press `Esc` twice. You are now in normal mode, and nothing else is needed to recover.

`vim` shows you when you are *not* in normal mode. Press `i` and the bottom line changes:

```text
~
-- INSERT --                                                1,1           All
```

`-- INSERT --` on the left is the mode. `1,1` is line 1, column 1. `All` means the whole file fits on screen; otherwise it reads `Top`, `Bot` or a percentage. If the bottom left is blank, you are in normal mode.

## Opening, and the first screen

```bash
vim sweep.yaml
```

```text
vehicle: falcon9-s1
profile: entry-burn
dt: 0.002
horizon_s: 18.0
seed_base: 100000
~
~
~
~
~
~
~
~
"sweep.yaml" 5L, 84B                                        1,1           All
```

The **[[`~` lines|tilde-lines]]** (read "tilde") are *past the end of the file*, not blank lines. A file of five lines looks the same as five lines followed by eight empty ones — until you notice the tildes. The bottom line gives the file's name, its length, `5L` (five lines), and its size, `84B` (84 bytes). Check: the lines are 20, 20, 10, 16 and 18 characters long counting each line's invisible newline, and $20 + 20 + 10 + 16 + 18 = 84$.

## Getting out — read this part twice

Four commands, typed in normal mode. Each starts with `:` (which opens the command line at the bottom) and ends with `Enter`:

| Command | Does |
| --- | --- |
| `:q` | quit — **refuses if there are unsaved changes** |
| `:q!` | quit, throwing changes away |
| `:w` | write (save) and stay |
| `:wq` or `:x` | write and quit (`:x` writes only if something changed) |

Two shortcuts need no colon: `ZZ` in normal mode is the same as `:x`, and `ZQ` is `:q!`.

Try to leave with unsaved changes and `vim` stops you:

```text
E37: No write since last change (add ! to override)
Press ENTER or type command to continue
```

That message traps people, because it looks like a refusal. It is really a question with two answers: `:wq` to keep your work, `:q!` to throw it away. Decide which, and type it. The second line only means `vim` is waiting for a key; you can type the next `:` command straight away.

::: warning If you are stuck
When you do not know what state you are in:

1. `Esc` — twice, to be sure — to leave insert or visual mode;
2. `:q!` then `Enter` — quit without saving anything.

That is always safe for a file you did not mean to change, and always right when you opened something by accident. If `Enter` seems to do nothing, you may be at a `--More--` prompt from a long message: press `q` or `Esc`, then `:q!` again.

Avoid `Ctrl-s`. On many terminals it **[[freezes the output|xoff]]**, so `vim` looks crashed; `Ctrl-q` unfreezes it. And `Ctrl-z` suspends `vim` into the background — lesson 04's job control — so type `fg` to bring it back rather than opening the file a second time.
:::

## Moving

In normal mode:

- **`h` `j` `k` `l`** — left, down, up, right. The arrow keys work too; **[[`hjkl`|hjkl-keys]]** exist because they sit under your fingers.
- **`w`** next word, **`b`** back a word, **`e`** end of the word.
- **`0`** start of the line, **`^`** first non-blank character, **`$`** end of the line.
- **`gg`** top of the file, **`G`** bottom, **`42G`** line 42 (or `:42`).
- **`Ctrl-d`** and **`Ctrl-u`** half a screen down and up; **`Ctrl-f`** and **`Ctrl-b`** a full screen.
- **`{`** and **`}`** back and forward a paragraph.

Most commands take a **count** in front: `5j` moves down five lines, `3w` forward three words.

Line numbers make everything easier to talk about. Type `:set number`:

```text
  1 vehicle: falcon9-s1
  2 profile: entry-burn
  3 dt: 0.002
  4 horizon_s: 18.0
  5 seed_base: 100000
~
~
~
~
~
~
~
~
:set number                                                 1,1           All
```

The command you typed stays visible at the bottom. `:set nonumber` turns the numbers off again.

## Changing text

**Entering insert mode.** The key you choose decides *where* you start typing:

- `i` before the cursor, `a` after it;
- `I` at the first non-blank character of the line, `A` at the end of the line;
- `o` opens a new line below, `O` above.

In a configuration file you will mostly use two: `A` to add to the end of a line, `o` to add a new line.

**Deleting and changing**, in normal mode:

- `x` one character; `dd` the whole line; `dw` to the start of the next word; `D` to the end of the line;
- `cw` change a word (delete it and enter insert mode), `cc` change the whole line;
- `r` followed by a character replaces one character without leaving normal mode — the fastest way to fix one wrong digit.

`d`, `c` and `y` are **operators**, and they wait for a **motion** — any of the moves above — to say how far to act. That is the **[[grammar|operator-grammar]]** of `vim`: `dw` is "delete, to next word", `d$` is "delete, to end of line".

**Copy and paste.** `yy` **yanks** (copies) a line. `p` puts it after the cursor, `P` before. `dd` also cuts, so `dd` then `p` moves a line down.

**Undo.** `u` undoes and `Ctrl-r` redoes. `vim` remembers a long history of changes — far more than you will ever need to step back through — and says what it did. After `dd` removed line 3 and `u` put it back:

```text
~
~
1 more line; before #2  1 second ago                        3,1           All
```

::: example Adding a line to a configuration file, start to finish
The task: add `margin_m: 25.0` at the end of `sweep.yaml`.

```bash
vim sweep.yaml
```

Step 1: `G` jumps to the last line. Step 2: `o` opens a new line below it and switches to insert mode. Step 3: type `margin_m: 25.0`. Step 4: `Esc` back to normal mode. With `:set number` on, the screen now reads:

```text
  1 vehicle: falcon9-s1
  2 profile: entry-burn
  3 dt: 0.002
  4 horizon_s: 18.0
  5 seed_base: 100000
  6 margin_m: 25.0
~
~
~
~
~
~
~
                                                            6,14          All
```

Line 6 exists, and the blank bottom left says normal mode. The cursor is on line 6, column 14 — the last character of the 14-character line you typed. Now, out of habit, `:q`:

```text
E37: No write since last change (add ! to override)
Press ENTER or type command to continue
```

Of course: the change is not saved. Type `:wq` instead, and you are back at the shell. Check from outside — a good habit with any editor:

```bash
cat sweep.yaml
```

```text
vehicle: falcon9-s1
profile: entry-burn
dt: 0.002
horizon_s: 18.0
seed_base: 100000
margin_m: 25.0
```

Six lines, and the change is on disk. The whole sequence was `G o <text> Esc : w q Enter`.
:::

## Searching and substituting

`/pattern` searches forward and `?pattern` backward. `n` repeats the search in the same direction, `N` in the opposite one. The pattern is a regular expression, close to the `grep` syntax of lesson 06. With the cursor on a word, `*` jumps to the next place that word appears.

Substitution is the `:s` command. Its shape is worth learning by heart, because **[[`sed` uses the same one|ed-family]]**:

```text
:%s/old/new/g
```

Read it piece by piece:

- `%` — every line. Leave it out for the current line only; write `1,20` for a range; `'<,'>` appears by itself after a visual selection.
- `s` — substitute.
- `/old/new/` — the pattern to find and the text to put in its place.
- `g` — every match on each line, not only the first.
- add `c` to confirm each change: `:%s/old/new/gc`.

Running it shows the command at the bottom and the result above:

```text
vehicle: falcon9-s1
profile: entry-burn
dt: 0.001
horizon_s: 18.0
seed_base: 100000
~
~
~
~
~
~
~
~
:%s/0.002/0.001/g                                           3,1           All
```

The time step changed from 0.002 to 0.001 everywhere in the file. One catch: `.` is a regular-expression wildcard that matches any character, so the pattern `0.002` would also match `0x002`. Write `0\.002` when you mean a real dot.

::: example The swap file, and what to do about it
While you edit, `vim` keeps a hidden **[[swap file|swap-file]]** beside your file, so an interrupted session can be recovered. Open a file that another `vim` already has open and you get this:

```text
E325: ATTENTION
Found a swap file by the name ".sweep.yaml.swp"
          owned by: eng   dated: Tue Sep 22 21:12:06 2026
         file name: ~eng/sweep.yaml
          modified: YES
         user name: eng   host name: vm
        process ID: 20740 (STILL RUNNING)
While opening file "sweep.yaml"
             dated: Tue Sep 22 21:12:03 2026

(1) Another program may be editing the same file.  If this is the case,
    be careful not to end up with two different instances of the same
    file when making changes.  Quit, or continue with caution.
(2) An edit session for this file crashed.
    If this is the case, use ":recover" or "vim -r sweep.yaml"
    to recover the changes (see ":help recovery").
    If you did this already, delete the swap file ".sweep.yaml.swp"
    to avoid this message.

Swap file ".sweep.yaml.swp" already exists!
[O]pen Read-Only, (E)dit anyway, (R)ecover, (Q)uit, (A)bort:
```

It is long and it is alarming. The one phrase that decides what to do is **`process ID: 20740 (STILL RUNNING)`**. Another `vim` really is editing this file right now — probably yours, in another tmux window. Press `q` to quit this copy, find the other session, and finish there. Two editors on one file means whichever saves last silently wins.

If the process is *not* running, the line has no "(STILL RUNNING)" and the menu adds `(D)elete it`. The previous session died — a dropped connection, a reboot, an out-of-memory kill — and the swap file holds edits never written to disk. Quit, then run `vim -r sweep.yaml` to recover them. Compare with the file on disk, save if it is better, and then delete the `.swp` file, because `vim` warns every time until you do.

The swap file's name starts with a dot, so plain `ls` hides it:

```bash
ls -a | grep swp
```

```text
.sweep.yaml.swp
```

That is also how you find stale ones left behind on a machine that keeps crashing.
:::

## Six more things worth knowing

- **`:set paste`** before pasting into insert mode from your terminal, `:set nopaste` after. Without it, `vim`'s automatic indenting acts on every pasted line and a twenty-line block arrives as a staircase. (Modern `vim` in a terminal with **[[bracketed paste|bracketed-paste]]** often handles this itself; the option is still the sure fix.)
- **`vim -R file`** or **`view file`** opens read-only — right for a log or a colleague's configuration. For something large, `less` is still better.
- **`:e!`** throws away your changes and reloads the file from disk — like `:q!` and reopening, without leaving.
- **`:set list`** shows tabs as `^I` and line ends as `$`, exactly like `cat -A` from lesson 02. It finds the tab a `Makefile` needs or the trailing space a parser hates.
- **`Ctrl-g`** prints the file name, the line count and where you are.
- **`vimtutor`** is a thirty-minute interactive lesson that comes with `vim`. Run it once; it makes all of this stick.

::: key
`vim` starts in normal mode, where letters are commands; `Esc` always returns there. Get out with `:wq` to save, `:q!` to discard; `E37: No write since last change` is asking you to choose between them. `i`/`a`/`o` enter insert mode, `dd`/`yy`/`p` cut, copy and paste lines, `u` undoes, `/pattern` searches and `:%s/old/new/g` substitutes throughout.
:::

## Check yourself

::: check
You are somewhere in `vim`, you do not know what mode you are in, and you want to leave without changing the file. Give the exact keystrokes, and say why each one is there.
:::

::: answer
`Esc`, `Esc`, then `:`, `q`, `!`, `Enter`.

The first `Esc` leaves insert or visual mode. The second is insurance: `Esc` in normal mode is harmless (at worst a beep), and one `Esc` may have been swallowed by a half-typed command or a pop-up. Now you are certainly in normal mode.

`:` opens the command line, `q!` means quit and discard, and `Enter` runs it. The `!` matters: plain `:q` refuses with `E37` if anything changed, and if you did not mean to change the file you do not want to be asked.

If `Enter` seems to do nothing, you are probably at a `--More--` prompt: press `q`, then repeat. If the whole terminal seems frozen, you may have pressed `Ctrl-s`; `Ctrl-q` releases it.
:::

::: check
Explain why `dw` deletes a word but typing `dw` in insert mode inserts the letters `d` and `w`, and what this tells you about the design.
:::

::: answer
In normal mode every key is a command; in insert mode every key is a character. In normal mode, `d` is the *delete operator*, which waits for a motion saying how much to delete, and `w` is the motion "to the start of the next word". Together: delete from here to the next word. Insert mode has no operators at all, so `d` is the letter d.

The design lesson is that commands *combine*. The operators (`d` delete, `c` change, `y` yank) pair with any motion (`w`, `G`, `}`, `0`), so learning five operators and eight motions gives you $5 \times 8 = 40$ commands, not forty things to memorize: `c}` changes to the end of the paragraph, `y42G` yanks through line 42, `d0` deletes back to the start of the line. Counts multiply in: `3dw` deletes three words.

That is also why the mode indicator matters. The same keystrokes do completely different things, and `-- INSERT --` at the bottom left is the only thing telling them apart.
:::

::: check
`vim` refuses to open a file and prints `E325: ATTENTION` with `process ID: 4471 (STILL RUNNING)`. What is the situation, and what should you do — and how does the advice change if it does not say "STILL RUNNING"?
:::

::: answer
A swap file exists and the process that made it is alive, so another `vim` is editing that file right now — often your own, in another tmux window or a forgotten SSH session. Do not open a second copy: with two editors, whichever writes last silently wipes out the other's changes. Press `q`, find the other session — `tmux ls`, or `ps -fp 4471` to see whose it is and where — and make the change there.

If it does *not* say "STILL RUNNING", the earlier session died — a dropped connection, a reboot, an out-of-memory kill — and the swap file holds edits that never reached disk. `vim -r file` recovers them. Compare with what is on disk (`:w recovered.yaml`, then `diff`), keep whichever is right, and then **delete the `.swp` file**, or the warning returns every time.

Either way, do not reflexively press `d` (delete the swap file) at the prompt. That is right only once you know the edits in it are worthless.
:::

::: check
You need to change every `0.002` to `0.001`, but only on lines 10 to 40, and you want to see each change before it happens. Write the command and explain each part.
:::

::: answer
`:10,40s/0\.002/0\.001/gc`

`:` opens the command line. `10,40` is the line range — without it `s` acts on the current line only, and `%` would mean every line. `s` is substitute. Then come the pattern, the replacement and the flags, separated by `/`.

`0\.002` escapes the dot, because an unescaped `.` matches any character, so `0.002` would also match `0x002` or `0-002`. The replacement side is plain text, so the backslash there is unnecessary but harmless.

`g` changes every match on each line, not just the first — without it, `dt: 0.002 # was 0.002` would only get its first one changed. `c` asks at each match, offering `y` yes, `n` no, `a` all the rest, `q` quit, and `l` this one and then stop.

If nothing matches, `vim` says `E486: Pattern not found: 0\.002` — a useful check that your pattern means what you think.
:::

::: check
Why does pasting a block of indented text into `vim` with your terminal's paste often produce a widening staircase, and what is the fix?
:::

::: answer
The terminal sends pasted characters as if you were typing them, one by one, and `vim`, in insert mode, applies its formatting to each. With `autoindent`, or a file type's smart indenting, `vim` indents each new line to match the one before — and then the pasted line's *own* leading spaces are added on top. The indentation grows by one level per line.

The fix is `:set paste` before pasting and `:set nopaste` afterward. `paste` switches off auto-indent and the other typing-time changes, so the text arrives exactly as sent. Many people bind it to a key: `:set pastetoggle=<F2>`.

Two better options where they apply. Modern `vim` in a terminal with bracketed paste recognizes a paste and suspends the changes itself, so the problem is rarer than it was. And if the text is already in a file on the machine, `:r filename` reads it straight in, with no typing-time processing at all — exact, and the right choice for anything large.
:::

## Summary

| Key or command | Does |
| --- | --- |
| normal / insert / visual / command-line | the four modes; `Esc` always returns to normal |
| `-- INSERT --` bottom left | insert mode; blank there means normal mode |
| `:w` `:q` `:wq` `:x` `:q!` | write, quit, both, both-if-changed, discard; `ZZ` = `:x`, `ZQ` = `:q!` |
| `E37: No write since last change` | `:q` with unsaved changes: choose `:wq` or `:q!` |
| `h j k l`, `w b e`, `0 ^ $` | character, word and line motions |
| `gg` `G` `42G` `:42` | top, bottom, a line number; counts go in front |
| `Ctrl-d` `Ctrl-u` `Ctrl-f` `Ctrl-b` `Ctrl-g` | half and full screens; where am I |
| `i a I A o O` | insert before/after, line start/end, new line below/above |
| `x dd dw D cw cc r` | delete char, line, word, to line end; change; replace one char |
| `yy p P`, `u` `Ctrl-r` | yank, put after/before; undo, redo |
| `/pat` `?pat` `n` `N` `*` | search forward, back, again, reverse, word under cursor |
| `:%s/old/new/gc` | substitute: range, pattern, flags; `\.` for a real dot |
| `:set number` / `list` / `paste` | line numbers / show tabs and line ends / paste exactly |
| `vim -R`, `view`, `:e!`, `:r file` | read-only, reload, read a file in |
| `E325: ATTENTION`, `.file.swp`, `vim -r` | swap file: "STILL RUNNING" means another editor; else recover, then delete the `.swp` |
| `vimtutor` | thirty-minute interactive lesson |

That is the module. You can now find your way around a machine you have never seen, read and filter its files, control its processes, move data on and off it, keep a long job alive across a dropped connection, work out why something broke, and edit a file on a box that has nothing but `vim`. The next module builds on all of it: **[[shell scripting|next-scripting]]**, where these commands stop being things you type and become programs that run a campaign for you.

::: context vi-history Where vi and vim came from
Bill Joy wrote `vi` in 1976 at the University of California, Berkeley, and it spread with Berkeley's version of Unix. Because nearly every Unix system then carried it, the POSIX standard later described `vi`, which is why some version of it is still almost everywhere. Bram Moolenaar released **Vim**, "Vi IMproved", in 1991 and looked after it for more than thirty years. On Ubuntu, typing `vi` runs a build of Vim.
:::

::: context modes-map How the four modes connect
Normal mode is the hub. Every other mode is one key away from it, and `Esc` always brings you back.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="130" y="80" width="100" height="40" rx="8" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <text x="180" y="105" font-size="13" text-anchor="middle" fill="#1f2a44" font-weight="700">normal</text>
  <rect x="130" y="10" width="100" height="34" rx="8" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="32" font-size="12" text-anchor="middle" fill="#1f2a44">insert</text>
  <rect x="10" y="83" width="90" height="34" rx="8" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="55" y="105" font-size="12" text-anchor="middle" fill="#1f2a44">visual</text>
  <rect x="260" y="83" width="90" height="34" rx="8" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="305" y="105" font-size="12" text-anchor="middle" fill="#1f2a44">command-line</text>
  <line x1="165" y1="80" x2="165" y2="48" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="165,44 160,54 170,54" fill="#1d6fd1"/>
  <text x="158" y="66" font-size="11" text-anchor="end" fill="#1d6fd1">i a o</text>
  <line x1="195" y1="44" x2="195" y2="76" stroke="#b4232c" stroke-width="2"/>
  <polygon points="195,80 190,70 200,70" fill="#b4232c"/>
  <text x="202" y="66" font-size="11" fill="#b4232c">Esc</text>
  <line x1="130" y1="93" x2="104" y2="93" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="100,93 110,88 110,98" fill="#1d6fd1"/>
  <text x="115" y="84" font-size="11" text-anchor="middle" fill="#1d6fd1">v</text>
  <line x1="100" y1="108" x2="126" y2="108" stroke="#b4232c" stroke-width="2"/>
  <polygon points="130,108 120,103 120,113" fill="#b4232c"/>
  <text x="115" y="128" font-size="11" text-anchor="middle" fill="#b4232c">Esc</text>
  <line x1="230" y1="93" x2="256" y2="93" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="260,93 250,88 250,98" fill="#1d6fd1"/>
  <text x="245" y="84" font-size="11" text-anchor="middle" fill="#1d6fd1">: / ?</text>
  <line x1="260" y1="108" x2="234" y2="108" stroke="#b4232c" stroke-width="2"/>
  <polygon points="230,108 240,103 240,113" fill="#b4232c"/>
  <text x="245" y="128" font-size="11" text-anchor="middle" fill="#b4232c">Esc</text>
  <text x="180" y="160" font-size="11" text-anchor="middle" fill="#6c7a93">blue: go into a mode · red: come back</text>
  <text x="180" y="180" font-size="11" text-anchor="middle" fill="#6c7a93">Enter also leaves command-line mode, running the command</text>
</svg>
```
:::

::: context tilde-lines Why tildes and not blank lines
A blank line is real content: it has a newline and it counts in the line total. `vim` needs a way to show "there is nothing here at all", so it fills the rest of the screen with a `~` in the first column. Note that the tilde here has nothing to do with the `~` that means your home folder in the shell — same symbol, different job.
:::

::: context xoff Why Ctrl-s freezes the terminal
Old terminals and teleprinters could receive text faster than they could print it. So two control characters were set aside for **flow control**: `Ctrl-s` (called XOFF) means "stop sending", and `Ctrl-q` (XON) means "carry on". Terminals on Linux still honor them by default. Pressing `Ctrl-s` out of habit — it saves in most other programs — pauses all output, and the program looks dead though it is running normally. `stty -ixon` turns the feature off in your shell.
:::

::: context hjkl-keys Why h, j, k and l
When Bill Joy wrote `vi`, he used a Lear Siegler ADM-3A terminal. Its keyboard had no separate arrow keys; the arrows were printed on the H, J, K and L keys. On that keyboard the Esc key also sat where Tab is on yours, which is why reaching for it felt natural then.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5" fill="#fff">
    <rect x="60" y="20" width="56" height="56" rx="6"/>
    <rect x="124" y="20" width="56" height="56" rx="6"/>
    <rect x="188" y="20" width="56" height="56" rx="6"/>
    <rect x="252" y="20" width="56" height="56" rx="6"/>
  </g>
  <g font-size="16" font-weight="700" fill="#1f2a44" text-anchor="middle">
    <text x="88" y="44">h</text><text x="152" y="44">j</text><text x="216" y="44">k</text><text x="280" y="44">l</text>
  </g>
  <g font-size="13" fill="#1d6fd1" text-anchor="middle">
    <text x="88" y="66">←</text><text x="152" y="66">↓</text><text x="216" y="66">↑</text><text x="280" y="66">→</text>
  </g>
  <text x="184" y="98" font-size="11" text-anchor="middle" fill="#6c7a93">home row, right hand: left, down, up, right</text>
</svg>
```
:::

::: context operator-grammar Operators are verbs, motions are nouns
Think of a command as a tiny sentence: a **verb** (the operator) and **where to** (the motion). Any verb works with any motion, so a few of each give you many commands.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="120" y="22">w</text><text x="180" y="22">$</text><text x="240" y="22">G</text><text x="300" y="22">}</text>
    <text x="40" y="56">d delete</text><text x="40" y="92">c change</text><text x="40" y="128">y yank</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1" fill="#fff">
    <rect x="92" y="36" width="56" height="30"/><rect x="152" y="36" width="56" height="30"/><rect x="212" y="36" width="56" height="30"/><rect x="272" y="36" width="56" height="30"/>
    <rect x="92" y="72" width="56" height="30"/><rect x="152" y="72" width="56" height="30"/><rect x="212" y="72" width="56" height="30"/><rect x="272" y="72" width="56" height="30"/>
    <rect x="92" y="108" width="56" height="30"/><rect x="152" y="108" width="56" height="30"/><rect x="212" y="108" width="56" height="30"/><rect x="272" y="108" width="56" height="30"/>
  </g>
  <g font-size="13" fill="#1d6fd1" text-anchor="middle">
    <text x="120" y="56">dw</text><text x="180" y="56">d$</text><text x="240" y="56">dG</text><text x="300" y="56">d}</text>
    <text x="120" y="92">cw</text><text x="180" y="92">c$</text><text x="240" y="92">cG</text><text x="300" y="92">c}</text>
    <text x="120" y="128">yw</text><text x="180" y="128">y$</text><text x="240" y="128">yG</text><text x="300" y="128">y}</text>
  </g>
</svg>
```

Three verbs and four motions make $3 \times 4 = 12$ commands. Doubling a verb (`dd`, `cc`, `yy`) means "this whole line".
:::

::: context ed-family One family of editors
`vim`'s `:s` command, `sed` and even `grep` all descend from `ed`, the line editor Ken Thompson wrote for the first versions of Unix around 1970. In `ed` you edited by typing commands such as `s/old/new/`. `sed`, the "stream editor", runs those same commands over a stream of text. And `grep` is named after the `ed` command `g/re/p`: globally search for a regular expression and print the matching lines. Learn the `s/old/new/g` shape once and it works in all of them.
:::

::: context swap-file What the swap file is for
`vim` does not wait for you to save before protecting your work. By default it writes your changes to the swap file after every 200 characters you type, or when you pause for 4 seconds. If the connection drops or the machine crashes, the swap file still holds nearly everything, and `vim -r` rebuilds your edits from it. On a clean exit `vim` deletes the swap file itself, so one left lying around means a session ended badly — or is still open somewhere.
:::

::: context bracketed-paste How a terminal marks a paste
With **bracketed paste**, the terminal wraps pasted text in two special character sequences, one before and one after. A program that asked for this, like modern `vim`, sees the start marker and knows the next characters were pasted, not typed, so it turns off auto-indent until the end marker arrives. Older terminals, or connections through some tools, do not send the markers, and then `:set paste` is still needed.
:::

::: context next-scripting Where this goes next
Everything in this module was typed by hand, one command at a time. Shell scripting puts the same commands in a file, adds variables, loops and tests on exit status, and lets one script launch five hundred Monte Carlo cases, check each result and gather the numbers while you sleep. The exit-status rules, the pipelines and `strace` from these lessons are exactly what you will lean on when a script misbehaves.
:::
