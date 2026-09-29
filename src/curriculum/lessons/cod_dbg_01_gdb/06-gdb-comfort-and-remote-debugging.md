---
id: l06-gdb-comfort-and-remote-debugging
title: Making gdb comfortable, debugging remotely, and running backwards
minutes: 23
covers:
  - TUI mode, .gdbinit, pretty-printers for STL and Eigen
  - gdbserver and remote/embedded debugging; rr for reverse debugging
---

Think about the difference between cooking in your own kitchen and cooking in a friend's. The recipe is the same, but at home the knives are where your hand expects them, the spices are labeled in your handwriting, and the timer is already on the counter. You cook faster and make fewer mistakes, not because you know more, but because the room is set up for you.

gdb is the same. Out of the box it shows one line of source at a time, forgets your settings every time it starts, and can print a `std::vector` as a pile of internal pointers. The first half of this lesson sets up the kitchen: a screen that shows the source around you, a startup file that remembers your settings, and **pretty-printers** that show containers and matrices the way you think of them.

The second half goes where the program is not on your desk. Flight software runs on a flight computer, a board in a rack or a vehicle, often with a different processor from your laptop's. **gdbserver** lets gdb on your laptop control a program on that other computer. And some bugs happen once and then hide; **reverse debugging** records a run so you can go backwards through it and watch the moment a value went bad.

## TUI mode: see the source while you step

Plain gdb prints one source line per stop. That is fine for scripts and logs, but when you are stepping, you want to see where you are in the file. gdb has a built-in full-screen mode for that, the **TUI** (text user interface).

- Start it with `gdb -tui ./climb`, or press **Ctrl-x** then **a** inside a running gdb. The same keys switch it off again.
- The screen splits in two. The top **source window** shows the file with the current line highlighted and breakpoints marked in the margin. The bottom **command window** is the ordinary `(gdb)` prompt.
- `layout src` shows source; `layout asm` shows machine instructions; `layout split` shows both; `layout regs` adds a window of registers above the others, with the ones that just changed highlighted.
- The arrow keys scroll whichever window has the **focus**. `focus cmd` gives them back to the command window, so Up recalls your previous command again; `focus src` gives them to the source.
- If the program prints something and scrambles the screen, **Ctrl-l** redraws it.

The TUI is built into gdb and uses a [[terminal drawing library|tui-screen]], so it works over SSH on a bench computer with no graphics at all.

## .gdbinit: a startup file that remembers you

Every time gdb starts, it reads commands from startup files, as if you had typed them yourself. There are two kinds.

- Your **personal** file, `~/.gdbinit` (or `~/.config/gdb/gdbinit` on newer setups). Settings you want everywhere go here.
- A **project** file, `.gdbinit` in the folder where you start gdb. Settings for one program go here, and you can commit it to the repository so the whole team gets them.

Here is a project file for the program we will use below:

```text
# .gdbinit for the attitude tools (project folder)
set pagination off
set print pretty on
set history save on
source mat3_printer.py

define state
  info locals
  print R
end
document state
Print every local, then the rotation matrix R.
end

break 18
```

Line by line: `set pagination off` stops gdb from pausing long output with a "press Enter for more" prompt. `set print pretty on` prints structs with one field per line. `set history save on` keeps your command history between sessions, so the Up arrow remembers yesterday. `source mat3_printer.py` loads a Python file, the pretty-printer you will write below. `define state` makes a new command called `state` out of other commands, and `document` gives it a help text, so `help state` works. `break 18` sets the breakpoint you always want.

There is a catch. A project `.gdbinit` runs commands, and a Python file it loads can run anything at all. If gdb ran every `.gdbinit` it found, then cloning a stranger's repository and starting gdb in it would run the stranger's code. So gdb refuses, and says so:

```text
warning: File ".../proj/.gdbinit" auto-loading has been declined by your
`auto-load safe-path' set to "$debugdir:$datadir/auto-load".
To enable execution of this file add
	add-auto-load-safe-path .../proj/.gdbinit
line to your configuration file ".../.config/gdb/gdbinit".
```

The fix is in the message: add that `add-auto-load-safe-path` line to your *personal* file, naming the folder or file you trust. Once it is there, gdb runs the project file on every start:

```text
$ gdb -q -batch -ex run -ex state ./attitude
Breakpoint 1 at 0x1558: file attitude.cpp, line 18.

Breakpoint 1, main () at attitude.cpp:18
18	    std::printf("%zu samples, mode %s, R(1,0) = %.1f\n",
gyro_z = std::vector of length 4, capacity 4 = {0.01, 0.012, 0.010999999999999999, 0.012999999999999999}
mode = "SAFE_HOLD"
R = Mat3 [0, -1, 0] [1, 0, 0] [0, 0, 1]
$1 = Mat3 [0, -1, 0] [1, 0, 0] [0, 0, 1]
```

Two switches go with this. `gdb -nx` skips all startup files, useful when one of them is confusing you. `gdb -x cmds.gdb` runs an extra command file, a repeatable session for a bug report; `-batch` makes gdb exit when the commands are done.

## Pretty-printers: containers the way you think of them

A `std::vector<double>` is, inside, three pointers: where the data starts, where it ends, and where the reserved space ends. A `std::string` is a pointer, a length, and a small buffer. That is what the memory really holds, and it is almost never what you want to see. A **pretty-printer** is a small program, written in Python, that tells gdb how to display one type.

Here is the program the sessions below use:

```cpp
#include <cstdio>
#include <string>
#include <vector>

// A tiny Eigen-like 3x3 matrix: nine doubles, stored column by column.
struct Mat3 {
    double data[9];
    double& operator()(int r, int c) { return data[c * 3 + r]; }
};

int main() {
    std::vector<double> gyro_z = {0.010, 0.012, 0.011, 0.013};   // rad/s
    std::string mode = "SAFE_HOLD";
    Mat3 R{};                     // rotation: 90 degrees about z
    R(0, 1) = -1.0;
    R(1, 0) = 1.0;
    R(2, 2) = 1.0;
    std::printf("%zu samples, mode %s, R(1,0) = %.1f\n",
                gyro_z.size(), mode.c_str(), R(1, 0));
    return 0;
}
```

It prints `4 samples, mode SAFE_HOLD, R(1,0) = 1.0`. Stopped on line 18, with gdb's defaults:

```text
(gdb) print gyro_z
$1 = std::vector of length 4, capacity 4 = {0.01, 0.012, 0.010999999999999999,
  0.012999999999999999}
(gdb) print mode
$2 = "SAFE_HOLD"
(gdb) print gyro_z[2]
$3 = 0.010999999999999999
```

That is already pretty-printed. The GNU C++ library, libstdc++, ships Python pretty-printers for its containers, and gdb loads them by itself when the program uses that library. The command `info pretty-printer` lists what is loaded; here it shows a group called `libstdc++-v6` attached to `libstdc++.so.6`.

To see what gdb would show without them, add `/r`, for "raw":

```text
(gdb) print/r gyro_z
$4 = {<std::_Vector_base<double, std::allocator<double> >> = {
    _M_impl = {<std::allocator<double>> = {<std::__new_allocator<double>> = {<No data fields>}, <No data fields>}, <std::_Vector_base<double, std::allocator<double> >::_Vector_impl_data> = {
        _M_start = 0x55555556c2b0, _M_finish = 0x55555556c2d0,
        _M_end_of_storage = 0x55555556c2d0}, <No data fields>}}, <No data fields>}
```

The numbers are all in there: `_M_start` is where the data begins, and `_M_finish` minus `_M_start` is `0x20`, which is 32 bytes, or four 8-byte doubles. Raw output is still worth knowing: when a vector is corrupted, the pretty-printer may show nonsense, and the raw pointers tell you why.

::: key
Pretty-printers are Python code that gdb runs to display a type. libstdc++'s printers for vector, string, map and the rest load automatically; `print/r` shows the raw layout; `info pretty-printer` lists what is loaded.
:::

## Writing a pretty-printer for your own type

Math libraries have the same problem, only worse. **[[Eigen|eigen]]**, the C++ matrix library much GNC code uses, stores a matrix as a flat array inside several layers of templates. Printed raw, a 3×3 rotation matrix is nested braces ending in nine numbers, in an order that is not the one you write matrices in.

Our `Mat3` shows the order problem in miniature. Without help:

```text
(gdb) print R
$1 = {data = {0, 1, 0, -1, 0, 0, 0, 0, 1}}
```

Those nine numbers are stored **[[column by column|column-major]]**, the way Eigen stores matrices by default: first the whole first column, then the second, then the third. Read as rows, they give the wrong matrix. So we write a printer that rearranges them. Save this as `mat3_printer.py`:

```python
import gdb
import gdb.printing


class Mat3Printer:
    """Show a Mat3 as three rows instead of nine raw doubles."""

    def __init__(self, val):
        self.val = val

    def to_string(self):
        d = self.val["data"]
        rows = []
        for r in range(3):
            # storage is column by column: element (r, c) is data[c*3 + r]
            row = [float(d[c * 3 + r]) for c in range(3)]
            rows.append("[" + ", ".join(f"{x:g}" for x in row) + "]")
        return "Mat3 " + " ".join(rows)


def build():
    pp = gdb.printing.RegexpCollectionPrettyPrinter("orbit")
    pp.add_printer("Mat3", "^Mat3$", Mat3Printer)
    return pp


gdb.printing.register_pretty_printer(gdb.current_objfile(), build())
```

How it works, piece by piece:

- gdb gives the printer the value as a `gdb.Value`, and `self.val["data"]` reaches into the struct's field, the way `R.data` would in C++. Indexing it with `d[5]` reads one element, and `float(...)` turns it into a Python number.
- `to_string` returns the text gdb prints. For element $(r, c)$, read "row r, column c", the storage position is $3c + r$, the same formula as `operator()` in the C++.
- `RegexpCollectionPrettyPrinter("orbit")` is a named group of printers. `add_printer` says "use `Mat3Printer` for any type whose name matches the pattern `^Mat3$`". The `^` and `$` mean "the whole name, nothing before or after".
- `register_pretty_printer` switches the group on. `gdb.current_objfile()` is empty when you load the file by hand, so the printers apply everywhere.

Load it and print again:

```text
(gdb) source mat3_printer.py
(gdb) print R
$2 = Mat3 [0, -1, 0] [1, 0, 0] [0, 0, 1]
(gdb) print/r R
$3 = {data = {0, 1, 0, -1, 0, 0, 0, 0, 1}}
(gdb) disable pretty-printer global orbit
1 printer disabled
2 of 3 printers enabled
```

::: example Checking the printer against the code
The code set three elements: `R(0, 1) = -1`, `R(1, 0) = 1` and `R(2, 2) = 1`. Is the printed matrix the one the code built?

Work out where each lands in storage with position $= 3c + r$. For $(0, 1)$: $3 \times 1 + 0 = 3$, so `data[3]` is $-1$. For $(1, 0)$: $3 \times 0 + 1 = 1$, so `data[1]` is $1$. For $(2, 2)$: $3 \times 2 + 2 = 8$, so `data[8]` is $1$. Every other element is $0$.

The raw print `{0, 1, 0, -1, 0, 0, 0, 0, 1}` has exactly $1$ at index 1, $-1$ at index 3, and $1$ at index 8. The storage is right.

The printer shows row 0 as `[0, -1, 0]`, row 1 as `[1, 0, 0]` and row 2 as `[0, 0, 1]`. That is

$$
R = \begin{bmatrix} 0 & -1 & 0 \\ 1 & 0 & 0 \\ 0 & 0 & 1 \end{bmatrix},
$$

the standard rotation by $90°$ about the $z$ axis. Sanity check: it should turn the $x$ axis into the $y$ axis. Multiply $R$ by $(1, 0, 0)$ and you get its first column, $(0, 1, 0)$, which is the $y$ axis. Had we read the raw storage as rows, we would have seen the transpose, a rotation of $-90°$, exactly the kind of sign error that sends an attitude controller the wrong way.
:::

For the real Eigen, you do not have to write this yourself. The Eigen source tree includes a ready-made printer file, `debug/gdb/printers.py`. You register it from your personal `.gdbinit` with a short block of Python that adds that folder to Python's search path, imports `register_eigen_printers`, and calls it:

```text
python
import sys
sys.path.insert(0, '/path/to/eigen/debug/gdb')
from printers import register_eigen_printers
register_eigen_printers(None)
end
```

Everything between `python` and `end` runs as Python inside gdb.

::: warning A printer can lie
A pretty-printer shows what its author thought the memory means. If the memory is corrupted, or the printer has a bug, you see a tidy, believable, wrong answer, or an error in place of the value. When a value looks impossible, check it with `print/r`, or turn printers off with `disable pretty-printer`, before you believe it. A printer run on an object whose constructor has not run yet also shows garbage.
:::

## gdbserver: debugging a program on another computer

Picture a remote-control car. The car does the driving, out in the yard. You hold the controller, with all the buttons and the screen, on the porch. The two talk over radio.

**gdbserver** is the car's end. It is a small program that runs on the **target**, the computer where the program under test runs, such as a flight computer on a bench. It starts or attaches to the program and waits for a connection. The full gdb runs on the **host**, your workstation, and is the controller. It has the unstripped binary and the source files. The target needs neither; it only has to run the program and gdbserver. The two talk over a network connection or a serial line with gdb's [[remote protocol|remote-protocol]].

On the target:

```text
target$ gdbserver :2345 ./nav_app
```

This starts `nav_app`, stops it before its first instruction, and listens on TCP port 2345. To attach to an already-running process instead, use `gdbserver --attach :2345 PID`.

On the host:

```text
host$ gdb ./nav_app
(gdb) target remote 192.168.1.50:2345
(gdb) break guidance_step
(gdb) continue
```

`./nav_app` on the host is the same build as on the target, but with its debug information. `target remote` connects to the target's address and port. From then on, every command in this module works, with the host doing the thinking and the target doing the running. `target extended-remote` is a variant that keeps gdbserver alive between runs, so you can `run` the program again without restarting gdbserver.

When the target has a different processor from the host (an ARM flight computer and an x86 laptop, say), the host needs a gdb that understands that processor: either the gdb that ships with the ARM cross-compiler toolchain, or `gdb-multiarch`, a build of gdb that knows many processors. It also needs copies of the target's shared libraries, pointed to with `set sysroot`, so it can make sense of calls into them.

For a small microcontroller with no operating system at all, there is nowhere to run gdbserver. Instead a hardware **debug probe** plugs into the board's [[JTAG or SWD|jtag-swd]] pins, and a program on the host, such as OpenOCD, drives the probe and offers a gdb server to your gdb (OpenOCD listens on port 3333 by default). Then `target extended-remote :3333` connects, `monitor reset halt` passes a command straight to OpenOCD, and `load` writes the program into the chip's flash memory. Everything after that is ordinary gdb.

::: key
To debug a process on a flight computer you cannot rebuild: run gdbserver on the target, connect a local gdb that has the matching unstripped binary and source (`target remote host:port`), or capture a core dump and analyze it offline against the same build artifacts. That is why build artifacts and symbol files are archived per release.
:::

::: warning gdbserver trusts whoever connects
gdbserver has no password. Anyone who can reach its port can read and change the program's memory, and so run any code they like as that program's user. Use it on an isolated bench network, or reach it through an [[SSH tunnel|ssh-tunnel]]. Never leave it listening on a network other people share, and never leave it running on a vehicle.
:::

## Reverse debugging: running the program backwards

Some bugs are cruel. A value goes wrong at cycle 3, and nothing notices until cycle 5. You stop at the bad output, and the moment that matters is in the past. With ordinary gdb, you set a watchpoint and rerun, hoping the bug happens the same way again. For an intermittent bug, it may not.

**Reverse debugging** records the run as it happens, so you can move backwards through it. The commands mirror the ones from lesson 04:

- `reverse-step` and `reverse-next` go back one line;
- `reverse-finish` goes back to where the current function was called;
- `reverse-continue` runs backwards until a breakpoint or watchpoint triggers.

The last one is the powerful one. Stopped after the damage, you set a watchpoint on the damaged value and `reverse-continue`. gdb runs backwards and stops at the last line that changed it: the culprit.

gdb has a recorder built in, started with the command `record`. It saves the effect of every machine instruction, so it is slow, and by default it keeps only the last 200,000 instructions. That is enough for a short stretch of code, like the example below.

::: example Finding who flipped the gain, backwards
A controller gain should stay at $0.8$, but at the end of the run it is $-0.8$. Here is the program:

```cpp
#include <cstdio>

double gain = 0.8;              // controller gain, should never change

void scale_all(double* x, int n, double k) {
    for (int i = 0; i < n; i++) x[i] *= k;
}

void update(int cycle) {
    if (cycle == 3) gain = -gain;   // the bug, hidden in a rarely used branch
}

int main() {
    double cmd[4] = {1.0, 2.0, 3.0, 4.0};
    for (int cycle = 0; cycle < 5; cycle++) {
        update(cycle);
        scale_all(cmd, 4, gain);
    }
    std::printf("gain at end: %.2f, cmd[0] = %.4f\n", gain, cmd[0]);
    return 0;
}
```

Record from the start of `main`, run to the `printf` on line 19, then go backwards (a few lines of gdb chatter trimmed):

```text
(gdb) break main
(gdb) run
Breakpoint 1, main () at gain.cpp:13
(gdb) record
(gdb) break 19
(gdb) continue
Breakpoint 2, main () at gain.cpp:19
19	    std::printf("gain at end: %.2f, cmd[0] = %.4f\n", gain, cmd[0]);
(gdb) print gain
$1 = -0.80000000000000004
(gdb) watch gain
Hardware watchpoint 3: gain
(gdb) reverse-continue
Continuing.

Hardware watchpoint 3: gain

Old value = -0.80000000000000004
New value = 0.80000000000000004
0x00005555555551f0 in update (cycle=3) at gain.cpp:10
10	    if (cycle == 3) gain = -gain;   // the bug, hidden in a rarely used branch
(gdb) print cycle
$2 = 3
(gdb) record stop
Process record is stopped and all execution logs are deleted.
```

One `reverse-continue` went straight to the guilty line, in `update`, during cycle 3. Notice the watchpoint report reads backwards too. Traveling back in time, the "old" value is the later one you came from, $-0.8$, and the "new" value is the earlier one, $0.8$.

Now check the output makes sense. Cycles 0, 1 and 2 multiply each command by $0.8$; cycles 3 and 4 by $-0.8$. So `cmd[0]` ends as $1 \times 0.8^3 \times (-0.8)^2 = 0.8^5 = 0.32768$, and the program printed `cmd[0] = 0.3277`. The two minus signs canceled, so the command looked healthy while the gain was wrong. This is why checking only the output would never have found this bug.
:::

**rr**, a tool first built at Mozilla for debugging Firefox, takes the same idea much further. `rr record ./gain` runs the program with modest slowdown and saves everything needed to repeat the run exactly: every system call result, every signal, the order the threads ran in. `rr replay` then opens gdb on that recording, with every command from this module, reverse ones included. Every replay has the same addresses, the same thread order and the same bug.

That makes rr the tool of choice for an **[[intermittent bug|heisenbug]]**: record in a loop until one run fails, then keep that one recording and study it at leisure. rr runs on Linux, on x86-64 processors (recent Intel, and AMD with some extra setup) and on some 64-bit ARM ones. It needs the processor's hardware performance counters, which many virtual machines and containers do not expose, so it is usually run on a real workstation.

::: key
Reverse debugging: record a run, then reverse-step, reverse-next, reverse-finish and reverse-continue move backwards. A watchpoint plus reverse-continue finds the last write to a value. gdb's `record` suits short stretches; rr records whole runs cheaply and replays them identically.
:::

## Check yourself

::: check
You clone a teammate's repository, which contains a `.gdbinit`, and start gdb in it. gdb prints a warning that auto-loading was declined, and none of the settings take effect. Why does gdb do this, and what is the safe way to fix it?
:::

::: answer
A `.gdbinit` can run any command, including Python code, so running every one it finds would let any downloaded repository run code on your machine. gdb only auto-loads files inside its "safe path". The fix is to add `add-auto-load-safe-path /path/to/that/repo` to your personal startup file (`~/.gdbinit` or `~/.config/gdb/gdbinit`), for a repository you trust, rather than switching the protection off for everything.
:::

::: check
`print samples` shows `std::vector of length 3, capacity 3 = {1.5, 2.5, 3.5}`, but you suspect memory corruption. What would you type to see what is really stored, and what would you look for?
:::

::: answer
`print/r samples` shows the raw structure without the pretty-printer. Look at `_M_start`, `_M_finish` and `_M_end_of_storage`. For 3 doubles, the two addresses printed for `_M_finish` and `_M_start` should differ by $3 \times 8 = 24$ bytes (`0x18`), and the end of storage should not be before the finish. Then `print *samples._M_impl._M_start@3` (from lesson 03) reads the elements from memory directly.
:::

::: check
A 4×4 matrix is stored column by column in `double m[16]`. In your pretty-printer, which index holds row 2, column 3 (counting from 0)? And which would it be if the storage were row by row?
:::

::: answer
Column by column: index $= 4c + r = 4 \times 3 + 2 = 14$. Row by row: index $= 4r + c = 4 \times 2 + 3 = 11$. Mixing up the two formulas shows the transpose of the matrix, which for a rotation matrix is the opposite rotation.
:::

::: check
The flight computer is an ARM board on the bench network at 10.0.0.7; your workstation is x86. The flight binary on the board is stripped. List what runs where, and the host command that connects.
:::

::: answer
On the board: `gdbserver :2345 ./flight_app`, or `gdbserver --attach :2345 PID` for a running process. On the workstation: a gdb that understands ARM (the cross toolchain's gdb, or `gdb-multiarch`), given the unstripped binary of the same build (or the stripped one plus its debug file), with `set sysroot` pointing at copies of the board's libraries. Then `target remote 10.0.0.7:2345`. The board never needs the symbols or the source.
:::

::: check
A simulation variable `q_norm` is wrong at the end of a 20-minute run, and the bug appears in about one run in fifty. Why is rr a better fit than rerunning with a watchpoint, and what would you do inside `rr replay`?
:::

::: answer
A rerun with a watchpoint probably will not hit the bug, since it appears only once in fifty runs, and 20 minutes under a software recorder like gdb's `record` would be far too slow. With rr, you record runs in a loop until one fails, then replay that exact run as often as needed. Inside `rr replay`: run to the end (`continue`, or a breakpoint where `q_norm` is checked), `watch q_norm`, then `reverse-continue` to land on the last line that wrote it. Repeat `reverse-continue` to walk back through earlier writes.
:::

## Summary

| Tool or command | What it does | Remember |
|---|---|---|
| `gdb -tui`, Ctrl-x a | source window above the prompt | `layout src/asm/split/regs`, `focus cmd` |
| `~/.gdbinit`, `./.gdbinit` | commands run at startup | project files need `add-auto-load-safe-path` |
| `define NAME ... end` | make your own command | `document` gives it help text |
| pretty-printer | Python that displays a type | libstdc++ ones load automatically |
| `print/r` | raw layout, printers bypassed | when a printed value looks impossible |
| `source file.py` | load Python into gdb | `register_pretty_printer` switches it on |
| `gdbserver :PORT ./app` | runs on the target | no password: bench networks only |
| `target remote HOST:PORT` | host gdb connects | host keeps symbols and source |
| `record`, `reverse-continue` | built-in reverse debugging | slow, short stretches |
| `rr record`, `rr replay` | record a whole run, replay it exactly | ideal for intermittent bugs |

gdb can now go to the bug wherever it happens: in a program you start, one that is running, one that crashed, one on another computer, and one whose moment has passed. The next lesson brings the same habits to Python: `pdb`, `breakpoint()`, and `py-spy` for looking inside a live Python process.

::: context tui-screen How a text program draws a screen
The TUI is drawn with curses, a library that moves the cursor around a text terminal and paints characters at chosen spots, so a program can draw boxes and windows with nothing but letters. Editors like `vim` and tools like `top` work the same way. Because it is only text, it works over an SSH connection and inside a plain console.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="10" width="320" height="120" fill="#ffffff" stroke="#1f2a44"/>
  <text x="30" y="28" font-size="11" fill="#6c7a93">source window (layout src)</text>
  <text x="30" y="50" font-size="11" fill="#1f2a44">19   for (int i = 0; i &lt; steps; i++) {</text>
  <rect x="22" y="58" width="316" height="18" fill="#8fb8f0"/>
  <text x="30" y="71" font-size="11" fill="#1f2a44">20   double a = accel(v, 20.0);</text>
  <text x="26" y="71" font-size="11" fill="#b4232c" text-anchor="end">B</text>
  <text x="30" y="92" font-size="11" fill="#1f2a44">21   v = v + a * dt;</text>
  <text x="30" y="112" font-size="11" fill="#1f2a44">22   h = h + v * dt;</text>
  <rect x="20" y="136" width="320" height="54" fill="#ffffff" stroke="#1f2a44"/>
  <text x="30" y="154" font-size="11" fill="#6c7a93">command window</text>
  <text x="30" y="176" font-size="11" fill="#1f2a44">(gdb) next</text>
  <text x="200" y="176" font-size="11" fill="#1d6fd1">current line highlighted</text>
</svg>
```
:::

::: context eigen The matrix library in a lot of GNC code
Eigen is a free, header-only C++ library for vectors, matrices and the linear algebra on them: products, inverses, decompositions, quaternions. Many robotics and GNC codebases use it for their state vectors, covariance matrices and rotations. It gets its speed from templates that the compiler unrolls at build time, which is also why its types have long names and deep internal layers, and why a pretty-printer makes such a difference when debugging it. Its templates come back in the C++ templates module, where you will see why they make it fast.
:::

::: context column-major Two ways to lay a grid in a line
Memory is one long row of boxes, so a two-dimensional matrix has to be flattened. Row-major order (C arrays, NumPy's default) writes row 0, then row 1, then row 2. Column-major order (Eigen's default, Fortran, MATLAB) writes column 0, then column 1, then column 2. Neither is better; they are conventions. Bugs come from mixing them: reading one layout as the other gives the transpose of the matrix, and the transpose of a rotation is the same rotation the other way.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <rect x="20" y="20" width="30" height="24" fill="#8fb8f0" stroke="#1f2a44"/><text x="35" y="37">0</text>
    <rect x="50" y="20" width="30" height="24" fill="#f2b880" stroke="#1f2a44"/><text x="65" y="37">3</text>
    <rect x="80" y="20" width="30" height="24" fill="#ffffff" stroke="#1f2a44"/><text x="95" y="37">6</text>
    <rect x="20" y="44" width="30" height="24" fill="#8fb8f0" stroke="#1f2a44"/><text x="35" y="61">1</text>
    <rect x="50" y="44" width="30" height="24" fill="#f2b880" stroke="#1f2a44"/><text x="65" y="61">4</text>
    <rect x="80" y="44" width="30" height="24" fill="#ffffff" stroke="#1f2a44"/><text x="95" y="61">7</text>
    <rect x="20" y="68" width="30" height="24" fill="#8fb8f0" stroke="#1f2a44"/><text x="35" y="85">2</text>
    <rect x="50" y="68" width="30" height="24" fill="#f2b880" stroke="#1f2a44"/><text x="65" y="85">5</text>
    <rect x="80" y="68" width="30" height="24" fill="#ffffff" stroke="#1f2a44"/><text x="95" y="85">8</text>
  </g>
  <text x="65" y="112" font-size="11" fill="#6c7a93" text-anchor="middle">storage index of each (r, c)</text>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <rect x="140" y="44" width="22" height="24" fill="#8fb8f0" stroke="#1f2a44"/><text x="151" y="61">0</text>
    <rect x="162" y="44" width="22" height="24" fill="#8fb8f0" stroke="#1f2a44"/><text x="173" y="61">1</text>
    <rect x="184" y="44" width="22" height="24" fill="#8fb8f0" stroke="#1f2a44"/><text x="195" y="61">2</text>
    <rect x="206" y="44" width="22" height="24" fill="#f2b880" stroke="#1f2a44"/><text x="217" y="61">3</text>
    <rect x="228" y="44" width="22" height="24" fill="#f2b880" stroke="#1f2a44"/><text x="239" y="61">4</text>
    <rect x="250" y="44" width="22" height="24" fill="#f2b880" stroke="#1f2a44"/><text x="261" y="61">5</text>
    <rect x="272" y="44" width="22" height="24" fill="#ffffff" stroke="#1f2a44"/><text x="283" y="61">6</text>
    <rect x="294" y="44" width="22" height="24" fill="#ffffff" stroke="#1f2a44"/><text x="305" y="61">7</text>
    <rect x="316" y="44" width="22" height="24" fill="#ffffff" stroke="#1f2a44"/><text x="327" y="61">8</text>
  </g>
  <text x="240" y="90" font-size="11" fill="#6c7a93" text-anchor="middle">memory: column 0, then 1, then 2</text>
  <text x="240" y="130" font-size="11" fill="#1f2a44" text-anchor="middle">index = 3c + r</text>
</svg>
```
:::

::: context remote-protocol The language gdb speaks over the wire
gdb's remote serial protocol is a simple text protocol: short packets such as "read these registers", "read 64 bytes at this address", "write this byte", "continue", each with a checksum. Because it is so simple, many things speak it besides gdbserver: hardware debug probes, processor simulators such as QEMU (started with its `-s` option, it waits for gdb on port 1234), and emulators for spacecraft processors. Learn gdb once, and it connects to all of them.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="30" width="130" height="80" rx="6" fill="#ffffff" stroke="#1f2a44"/>
  <text x="75" y="50" font-size="12" fill="#1f2a44" text-anchor="middle" font-weight="700">host</text>
  <text x="75" y="70" font-size="11" fill="#1f2a44" text-anchor="middle">gdb</text>
  <text x="75" y="86" font-size="11" fill="#1f2a44" text-anchor="middle">+ unstripped binary</text>
  <text x="75" y="102" font-size="11" fill="#1f2a44" text-anchor="middle">+ source</text>
  <rect x="220" y="30" width="130" height="80" rx="6" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="285" y="50" font-size="12" fill="#1f2a44" text-anchor="middle" font-weight="700">target</text>
  <text x="285" y="70" font-size="11" fill="#1f2a44" text-anchor="middle">gdbserver</text>
  <text x="285" y="86" font-size="11" fill="#1f2a44" text-anchor="middle">+ running program</text>
  <text x="285" y="102" font-size="11" fill="#1f2a44" text-anchor="middle">(may be stripped)</text>
  <line x1="140" y1="62" x2="220" y2="62" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="220,62 212,57 212,67" fill="#1d6fd1"/>
  <line x1="220" y1="80" x2="140" y2="80" stroke="#b4232c" stroke-width="2"/>
  <polygon points="140,80 148,75 148,85" fill="#b4232c"/>
  <text x="180" y="54" font-size="11" fill="#1d6fd1" text-anchor="middle">commands</text>
  <text x="180" y="98" font-size="11" fill="#b4232c" text-anchor="middle">memory, registers</text>
  <text x="180" y="130" font-size="11" fill="#6c7a93" text-anchor="middle">TCP port or serial line</text>
</svg>
```
:::

::: context jtag-swd Debug pins on the circuit board
JTAG began as a standard way to test circuit boards: a handful of pins that let an outside device read and drive the chip's internals. Processor makers built debugging on top of it, so a probe can halt the processor, read its registers and write its flash, even when no software is running. SWD (Serial Wire Debug) is ARM's two-signal version of the same idea. Flight computer boards usually keep a debug header for use on the bench, and flight builds often lock or disable it.
:::

::: context ssh-tunnel Reaching a port safely
An SSH tunnel carries a network connection inside an encrypted, logged-in SSH session. With gdbserver started on the target as `gdbserver localhost:2345 ./nav_app`, it accepts connections only from the target itself. On the host, `ssh -L 2345:localhost:2345 user@target` then makes port 2345 on your own machine lead to port 2345 on the target, and `target remote localhost:2345` connects through it. Only someone who can log in to the target can reach the debugger.
:::

::: context heisenbug A bug that hides when you look
Programmers call a bug that changes or disappears when you try to observe it a heisenbug, a pun on the physicist Werner Heisenberg. Adding a print statement or running under a debugger changes the timing, and a race between threads may stop happening. A recording tool like rr helps because it captures one real failing run, and then all the looking happens on the recording, which cannot change.
:::
