---
id: l14-vim-survival
title: vim survival
minutes: 21
covers:
  - 'vim survival: modes, motions, :wq'
---

You will end up in `vim` whether you choose it or not. It is on every Linux machine ever shipped; `git` opens it for a commit message; `crontab -e`, `systemctl edit` and `visudo` all open it; and on a freshly imaged build node it may be the only editor installed. Not knowing it means either learning it at a bad moment or being unable to fix a one-character typo on a machine that has nothing else.

This lesson is not a course in `vim`. It is the twenty commands that let you open a configuration file, change a line, save it, and get out — plus the three error messages that trap people who never learned the twenty. Twenty minutes here will save you an afternoon at some point in the next year.

Everything below was produced on this machine and pasted verbatim, with `vim` 9.1 on Ubuntu 24.04.4. The screens were captured from a real terminal (78 columns by 14 rows); yours will be a different size and the status line will therefore sit at a different place, but every character shown is what `vim` drew. The file being edited is a small campaign configuration.

## The idea: modes

Every editor you have used is always in insert mode: a letter key inserts that letter. `vim` is not. It starts in **normal mode**, where letter keys are *commands* — `d` deletes, `x` cuts a character, `j` moves down — and you enter **insert mode** deliberately to type text.

That is the whole source of the confusion, and also the whole point: in normal mode, the entire keyboard is available for editing operations instead of for producing letters.

Four modes matter:

| Mode | Entered by | What keys do |
| --- | --- | --- |
| normal | `Esc` (from anywhere) | commands: move, delete, copy, paste |
| insert | `i`, `a`, `o`, `O`, `c` | type text |
| visual | `v`, `V`, `Ctrl-v` | select, then operate on the selection |
| command-line | `:`, `/`, `?` | a line at the bottom: `:w`, `/pattern` |

**`Esc` returns to normal mode from all of them.** When you are lost, press `Esc` twice and you are in normal mode; nothing else is needed to recover.

`vim` tells you when you are not in normal mode. Press `i`, and the bottom line changes:

```text
~
~
-- INSERT --                                                1,1           All
```

`-- INSERT --` on the left; `1,1` is line 1, column 1; `All` means the whole file fits on screen (otherwise `Top`, `Bot` or a percentage). If the bottom-left is blank, you are in normal mode.

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
"sweep.yaml" 5 lines, 84 bytes
```

The `~` lines are *past the end of the file*, not blank lines — a distinction worth having, because a file of five lines looks identical to a file of five lines followed by eight empty ones until you notice the tildes. The bottom line is the file, its length in lines and its size in bytes.

## Getting out — read this part twice

Four commands, all typed in normal mode, all starting with `:` and ending with `Enter`:

| Command | Does |
| --- | --- |
| `:q` | quit — **refuses if there are unsaved changes** |
| `:q!` | quit, discarding changes |
| `:w` | write (save) and stay |
| `:wq` or `:x` | write and quit (`:x` writes only if changed) |

`ZZ` in normal mode is `:wq` without the colon, and `ZQ` is `:q!`.

Try to leave with unsaved changes and `vim` stops you:

```text
E37: No write since last change (add ! to override)
```

That message is the one that traps people, because it looks like a refusal rather than a question. It is telling you the two ways out: `:wq` to keep your work, `:q!` to throw it away. Decide which, and type it.

::: warning
If you are stuck and do not know what state you are in, the recovery sequence is:

1. `Esc` — twice, to be sure, leaving insert or visual mode;
2. `:q!` then `Enter` — quit without saving anything.

That is always safe for a file you have not changed, and it is the right answer whenever you opened something by accident. If `Enter` does nothing, you may be inside a `--More--` prompt or a search — `Esc` again, then `:q!`.

The one keystroke to avoid is `Ctrl-s`, which on many terminals freezes output (XOFF) and makes `vim` look crashed. `Ctrl-q` unfreezes it. And `Ctrl-z` suspends `vim` to the background — lesson 04's job control — so `fg` brings it back rather than reopening the file.
:::

## Moving

In normal mode:

- **`h` `j` `k` `l`** — left, down, up, right. The arrow keys work too; `hjkl` exists because they are under your fingers.
- **`w`** next word, **`b`** back a word, **`e`** end of word.
- **`0`** start of line, **`^`** first non-blank, **`$`** end of line.
- **`gg`** top of file, **`G`** bottom, **`42G`** line 42 (or `:42`).
- **`Ctrl-d`** and **`Ctrl-u`** half a screen down and up; **`Ctrl-f`** and **`Ctrl-b`** a full screen.
- **`{`** and **`}`** paragraph back and forward.

Most commands take a count: `5j` moves down five lines, `3w` forward three words.

Turning on line numbers makes everything easier to talk about:

```text
      1 vehicle: falcon9-s1
      2 profile: entry-burn
      3 dt: 0.002
      4 horizon_s: 18.0
      5 seed_base: 100000
~
~
:set number
```

The command you typed stays visible at the bottom. `:set nonumber` turns it off again.

## Changing text

**Entering insert mode** — the choice determines *where* you start typing:

- `i` before the cursor, `a` after it;
- `I` at the first non-blank of the line, `A` at the end of the line;
- `o` opens a new line below, `O` above.

`A` and `o` are the two you will use most in a configuration file: `A` to append to a line, `o` to add one.

**Deleting and changing**, in normal mode:

- `x` one character; `dd` the whole line; `dw` to the end of the word; `D` to the end of the line;
- `cw` change a word (delete it and enter insert mode), `cc` the whole line;
- `r<char>` replace one character without changing mode — the fastest way to fix a single wrong digit.

**Copy and paste**: `yy` yanks a line, `p` puts it after the cursor and `P` before. `dd` also *cuts*, so `dd` then `p` moves a line.

**Undo**: `u` undoes, `Ctrl-r` redoes. `vim`'s undo is effectively unlimited, and it reports what it did:

```text
vehicle: falcon9-s1
profile: entry-burn
dt: 0.001
horizon_s: 18.0
seed_base: 100000
~
1 more line; before #2  1 second ago                        3,1           All
```

That is the status line after `u` restored a line that `dd` had removed.

::: example Adding a line to a configuration file, start to finish
The task: append `margin_m: 25.0` to `sweep.yaml`. Five keystrokes and a command.

```bash
vim sweep.yaml
```

`G` moves to the last line. `o` opens a new line below it and enters insert mode. Type `margin_m: 25.0`, then `Esc`:

```text
      1 vehicle: falcon9-s1
      2 profile: entry-burn
      3 dt: 0.002
      4 horizon_s: 18.0
      5 seed_base: 100000
      6 margin_m: 25.0
~
~
```

Line 6 exists and the cursor is back in normal mode. Now `:q` — because habit says quit:

```text
E37: No write since last change (add ! to override)
```

`:wq` instead, and you are back at the shell. Verify from outside, which is a good habit whatever editor you use:

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

Six lines, the change is on disk. The whole sequence is `G o <text> Esc : w q Enter`.
:::

## Searching and substituting

`/pattern` searches forward, `?pattern` backward; `n` repeats in the same direction, `N` in the opposite. The pattern is a regular expression, close to the `grep` syntax from lesson 06. `*` with the cursor on a word searches for the next occurrence of that word.

Substitution is the `:s` command, and its shape is worth memorising because `sed` uses the same one:

```text
:%s/old/new/g
```

- `%` means every line (leave it out for the current line; `1,20` for a range; `'<,'>` appears automatically after a visual selection);
- `s` substitute;
- `g` every occurrence on each line, not just the first;
- add `c` to confirm each one interactively — `:%s/old/new/gc`.

Running it shows the command on the status line and the result above:

```text
vehicle: falcon9-s1
profile: entry-burn
dt: 0.001
horizon_s: 18.0
seed_base: 100000
~
:%s/0.002/0.001/g                                           3,1           All
```

The timestep changed from 0.002 to 0.001 everywhere in the file. Note that `.` is a regular-expression metacharacter here too, so `0.002` would also match `0x002`; write `0\.002` when you mean a literal dot.

::: example The swap file, and what to do about it
`vim` writes a hidden swap file beside the file you are editing, so that an interrupted session can be recovered. Open a file that is already open elsewhere and you get this, in full:

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
```

It is long and it is frightening, and the one phrase that decides what to do is **`process ID: 20740 (STILL RUNNING)`**. That means another `vim` really is editing this file right now — probably yours, in another tmux window. Quit this one (`q` at the prompt, then `:q`), find the other session, and finish there. Two editors on one file means whichever saves last silently wins.

If instead it says the process is *not* running, the previous session died — a dropped connection, a reboot, an OOM kill. Then `vim -r sweep.yaml` recovers the unsaved changes; compare the result with the file on disk, save if it is better, and delete the `.swp` file afterwards, because `vim` will keep asking until you do.

The swap file is hidden, so `ls` will not show it:

```bash
ls -a | grep swp
```

```text
.sweep.yaml.swp
```

That is also how you find the stale ones left behind on a machine that has been rebooting badly.
:::

## Six more things worth knowing

- **`:set paste`** before pasting into insert mode from your terminal, and `:set nopaste` afterwards. Without it, `vim`'s auto-indent applies to every pasted line and a twenty-line block arrives as a staircase. (Modern `vim` with bracketed paste often gets this right by itself; the option is still the reliable fix.)
- **`vim -R file`** or **`view file`** opens read-only, which is what you want for a log or a colleague's configuration. `less` is still better for reading something large.
- **`:e!`** discards all your changes and re-reads the file from disk — the in-editor equivalent of `:q!` followed by reopening.
- **`:set list`** shows tabs as `^I` and line ends as `$`, exactly like `cat -A` from lesson 02. This is how you find the tab that a `Makefile` needs, or the trailing space a parser objects to.
- **`Ctrl-g`** prints the filename, the line count and where you are — useful when the status line is not telling you enough.
- **`vimtutor`** is a thirty-minute interactive tutorial that ships with `vim` and is the best way to make any of this stick. Run it once.

::: key
`vim` starts in normal mode, where letters are commands; `Esc` always returns there. Get out with `:wq` to save, `:q!` to discard; `E37: No write since last change` is asking you to choose between them. `i`/`a`/`o` enter insert mode, `dd`/`yy`/`p` cut, copy and paste lines, `u` undoes, `/pattern` searches and `:%s/old/new/g` substitutes throughout.
:::

## Check yourself

::: check
You are somewhere in `vim`, you do not know what mode you are in, and you want to leave without changing the file. Give the exact keystrokes, and say why each one is there.
:::

::: answer
`Esc`, `Esc`, then `:`, `q`, `!`, `Enter`.

The first `Esc` leaves insert or visual mode; the second is insurance, because pressing `Esc` in normal mode is harmless (it beeps or flashes at worst) and because one `Esc` may have been consumed by a pending command or a completion popup. You are now certainly in normal mode.

`:` opens the command line, `q!` is quit-and-discard, and `Enter` runs it. The `!` matters: plain `:q` refuses with `E37: No write since last change` if you have touched anything, and if you did not intend to change the file you also do not want to be asked.

If `Enter` appears to do nothing, you are probably at a `--More--` prompt from a long message — press `q` to dismiss it, then repeat. And if the terminal seems frozen rather than `vim`, you may have pressed `Ctrl-s`; `Ctrl-q` releases it.
:::

::: check
Explain why `dw` deletes a word but typing `dw` while in insert mode inserts the letters `d` and `w`, and what this tells you about the design.
:::

::: answer
Because in normal mode every key is a command, and in insert mode every key is a character. `d` in normal mode is the *delete operator*, which then waits for a motion to tell it how much to delete; `w` is the motion "to the start of the next word". Together they mean "delete from here to the next word". In insert mode there is no operator layer at all: `d` means the letter d.

What it tells you about the design is that `vim`'s commands compose. The operators (`d` delete, `c` change, `y` yank) combine with any motion (`w`, `G`, `}`, `0`), so learning five operators and eight motions gives you forty commands rather than forty things to memorise — `c}` changes to the end of the paragraph, `y42G` yanks to line 42, `d0` deletes back to the start of the line. Counts multiply in: `3dw` deletes three words.

This is also why the mode indicator matters. The same keystrokes do entirely different things, and `-- INSERT --` at the bottom left is the only thing distinguishing them.
:::

::: check
`vim` refuses to open a file and prints `E325: ATTENTION` with `process ID: 4471 (STILL RUNNING)`. What is the situation, and what should you do — and how does the advice change if it does not say "STILL RUNNING"?
:::

::: answer
A swap file exists and the process that created it is alive, so another `vim` is genuinely editing that file right now — very often your own, in another tmux window or another SSH session you forgot about. Do not open a second copy: two editors on one file means whichever writes last wins, silently discarding the other's changes. Quit this one, find the other session — `tmux ls`, or `ps -fp 4471` to see whose it is and where — and make the change there.

If it does *not* say "STILL RUNNING", the previous session died: a dropped connection, a machine reboot, an OOM kill. The swap file then holds edits that were never written to disk. `vim -r file` recovers them into a buffer; compare it with what is on disk (`:w recovered.yaml` and then `diff`), keep whichever is right, and then **delete the `.swp` file**, because `vim` will show the same warning every time until you do.

Either way, do not reflexively press `d` (delete the swap file) at the prompt. That is the right answer only once you know the edits in it are worthless.
:::

::: check
You need to change every occurrence of `0.002` to `0.001` in a file, but only on lines 10 to 40, and you want to see each change before it happens. Write the command and explain each part.
:::

::: answer
`:10,40s/0\.002/0\.001/gc`

`:` opens the command line. `10,40` is the line range — without it, `s` acts on the current line only, and `%` would mean every line. `s` is substitute. Then the pattern, the replacement and the flags, separated by `/`.

`0\.002` escapes the dot, because `.` in a regular expression matches any character: unescaped, `0.002` would also match `0x002` or `0-002`. The replacement side is literal text, so the backslash there is unnecessary but harmless.

`g` means every occurrence on each line rather than only the first — without it, a line containing `dt: 0.002 # was 0.002` would only have its first one changed. `c` asks for confirmation at each match, and `vim` then offers `y` yes, `n` no, `a` all remaining, `q` quit, `l` this one and stop.

If the substitution finds nothing, `vim` says `E486: Pattern not found: 0\.002`, which is a useful check that your pattern is what you think it is.
:::

::: check
Why does pasting a block of indented text into `vim` with your terminal's paste often produce a widening staircase, and what is the fix?
:::

::: answer
Because the terminal sends the pasted characters as if you had typed them, one at a time, and `vim` is in insert mode applying its own formatting to each. With `autoindent` — or a filetype plugin's smart indent — `vim` indents each new line to match the previous one, and then the pasted line's *own* leading spaces are added on top. The indentation therefore accumulates, one level per line.

The fix is `:set paste` before pasting and `:set nopaste` afterwards. `paste` temporarily disables auto-indent, abbreviations, and the other input-time transformations, so the text arrives byte for byte. Many people bind it: `:set pastetoggle=<F2>`.

Two better alternatives where they apply. Modern `vim` in a terminal that supports *bracketed paste* detects the paste and suspends the transformations by itself, so the problem is less common than it was. And if the text is already in a file on the machine, `:r filename` reads it in directly, with no input processing at all — which is exact, and is what you should use for anything large.
:::

## Summary

| Key or command | Does | Note |
| --- | --- | --- |
| normal / insert / visual / command-line | the four modes | `Esc` always returns to normal |
| `-- INSERT --` bottom left | you are in insert mode | blank there means normal mode |
| `:w` `:q` `:wq` `:x` `:q!` | write, quit, both, both-if-changed, discard | `ZZ` = `:wq`, `ZQ` = `:q!` |
| `E37: No write since last change` | `:q` with unsaved changes | choose `:wq` or `:q!` |
| `h j k l`, `w b e`, `0 ^ $` | character, word, line motions | arrow keys work too |
| `gg` `G` `42G` `:42` | top, bottom, a line number | counts prefix most commands |
| `Ctrl-d` `Ctrl-u` `Ctrl-f` `Ctrl-b` | half and full screens | `Ctrl-g` shows where you are |
| `i a I A o O` | insert before/after, line start/end, new line below/above | `A` and `o` are the workhorses |
| `x dd dw D cw cc r` | delete char, line, word, to end of line; change; replace one char | operators compose with motions |
| `yy p P` | yank a line, put after, put before | `dd` then `p` moves a line |
| `u` `Ctrl-r` | undo, redo | effectively unlimited |
| `/pat` `?pat` `n` `N` `*` | search forward, back, repeat, reverse, word under cursor | regular expressions, as in `grep` |
| `:%s/old/new/gc` | substitute: range, pattern, flags | `\.` for a literal dot; `c` to confirm |
| `:set number` / `list` / `paste` | line numbers / show tabs and line ends / paste without auto-indent | `list` is `cat -A` inside the editor |
| `vim -R`, `view`, `:e!`, `:r file` | read-only, reload from disk, insert a file | `:r` pastes exactly |
| `E325: ATTENTION`, `.file.swp` | a swap file exists | "STILL RUNNING" means another editor is open |
| `vim -r file` | recover after a crash | delete the `.swp` afterwards |
| `vimtutor` | thirty-minute interactive tutorial | run it once |

That is the module. You can now navigate a machine you have never seen, read and filter its files, control its processes, move data on and off it, keep a long job alive across a dropped connection, work out why something is broken, and edit a file on a box that has nothing but `vim`. The next module builds on all of it: shell scripting, where these commands stop being things you type and become programs that run a campaign for you.
