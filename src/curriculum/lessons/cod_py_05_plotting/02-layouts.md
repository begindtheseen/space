---
id: l02-layouts
title: Many panels on one page
minutes: 18
covers:
  - subplots, shared axes, twin axes, gridspec, constrained layout
---

Think of a car's dashboard. The speedometer, the fuel gauge, the engine temperature and the clock sit side by side, each with its own scale, and you read them together in one glance. Nobody would put all four on the same dial. And nobody would put them in four different rooms either. The whole point is that they share one moment: *right now* the speed is this, the fuel is that.

A flight-review figure is a dashboard for a whole flight. Altitude, Mach number, dynamic pressure, angle of attack, engine gimbal angle and body rates each get a panel, and all six share one time axis, so a reviewer can put a finger on $t = 72\,\mathrm{s}$ and read every quantity at that instant. Getting that layout right — panels aligned, labels readable, nothing overlapping — is most of what separates a figure people trust from one they squint at.

The last lesson showed that a figure is a Figure holding Axes, and that you should call methods on named Axes. This lesson is about arranging many Axes on one page: grids of subplots, axes that share a scale, a second y-axis on the same panel, uneven grids, and the layout engine that keeps it all tidy.

## A grid of panels with subplots

`plt.subplots(nrows, ncols)` makes a Figure and a regular grid of Axes in one call. With more than one panel, the Axes come back in a **NumPy array** shaped like the grid, so you index them the way you index any array.

```python
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

fig, axs = plt.subplots(2, 3)
print(type(axs).__name__, axs.shape)     # ndarray (2, 3)
fig, axs = plt.subplots(3, 1)
print(axs.shape)                          # (3,)
fig, ax = plt.subplots(1, 1)
print(type(ax).__name__)                  # Axes
fig, axs = plt.subplots(1, 1, squeeze=False)
print(axs.shape)                          # (1, 1)
```

Read the shapes carefully, because they change with the grid.

- A 2-by-3 grid gives a 2-D array. `axs[0, 2]` is the top row, right column.
- A single column or single row gives a 1-D array. `axs[0]` is the top panel of a stack.
- A 1-by-1 grid gives the bare Axes, not an array at all.

That squeezing of shapes is convenient for hand-written figures and annoying for code that builds a grid of any size. Passing `squeeze=False` always returns a 2-D array, even for one panel, so the same loop works for every case. To visit every panel in any grid, loop over `axs.flat`, which walks the array row by row.

The other argument you will use every time is `figsize=(width, height)` in **[[inches|figure-inches]]**. A tall stack of panels needs a tall figure. Six panels in the default $6.4$ by $4.8$ inch figure leave each panel well under an inch high, which is too squashed to read.

## Shared axes: one time scale for every panel

When panels are stacked in time, they must line up. If the top panel runs from $0$ to $160\,\mathrm{s}$ and the one below from $0$ to $155\,\mathrm{s}$, then $72\,\mathrm{s}$ sits at a different spot on each, and a finger moved straight down the page lies.

`sharex=True` fixes this. It **[[links|shared-axes]]** the x-axis of every panel, so they always show the same range. It does three things at once:

1. The x-limits are the same on every panel, and changing one changes all. Zoom into $60$ to $90\,\mathrm{s}$ on any panel and the whole stack zooms with it.
2. The tick marks sit at the same times on every panel.
3. The tick *labels* (the numbers) are hidden on all but the bottom panel, where the x-axis label also goes. Repeating "0 20 40 60 …" six times would waste space and say nothing new.

`sharey` works the same way for the vertical axis. Both also accept `"col"` (share within each column) and `"row"` (share within each row), which is what you want in a grid where each column is one quantity and each row is one test case.

::: key
`sharex=True` gives every panel the same x-limits and ticks, links zooming, and keeps tick labels only on the bottom panel. Stacked time-history panels should always share the time axis.
:::

::: example The skeleton of a six-panel flight review
Build the empty frame for a six-panel review: one quantity per panel, every y-axis labeled with its unit, a shared time axis, and two event lines on every panel — **[[main-engine cutoff (MECO) and stage separation|meco-staging]]** — for a made-up vehicle at $145\,\mathrm{s}$ and $148\,\mathrm{s}$.

```python
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

labels = ["Altitude (km)", "Mach (-)", "Dynamic pressure (kPa)",
          "Angle of attack (deg)", "Gimbal angle (deg)", "Body rate (deg/s)"]
events = {"MECO": 145.0, "Stage sep": 148.0}      # s, a made-up vehicle

fig, axs = plt.subplots(6, 1, sharex=True, figsize=(7.0, 10.0),
                        layout="constrained")
for ax, label in zip(axs, labels):
    ax.set_ylabel(label)
    for name, te in events.items():
        ax.axvline(te, color="grey", linestyle=":")
axs[-1].set_xlabel("Time since liftoff (s)")
axs[0].set_xlim(0.0, 160.0)

fig.canvas.draw()                                  # run the layout now
h_in = [ax.get_position().height * 10.0 for ax in axs]
print(round(min(h_in), 2), round(max(h_in), 2))   # 1.39 1.39
print([ax.xaxis.get_tick_params()["labelbottom"] for ax in axs])
# [False, False, False, False, False, True]
print(tuple(float(x) for x in axs[3].get_xlim()))  # (0.0, 160.0)
print(sum(len(ax.lines) for ax in axs))            # 12
```

Step by step:

- `zip(axs, labels)` pairs each panel with its label, so one loop labels all six. The loop also draws the two event lines on each panel with `axvline`, a vertical line across the full height of that Axes.
- Only the bottom panel, `axs[-1]`, gets the x-label. The others hide their time numbers.
- The x-limit was set on the *top* panel only, yet panel 4 reports $(0, 160)$. That is the sharing at work.
- There are $6 \times 2 = 12$ event lines, two per panel.
- `get_position()` gives each panel's box as a fraction of the figure. The layout engine had to run first, which `fig.canvas.draw()` forces. Each panel is $0.139$ of the $10$-inch height, about $1.39\,\mathrm{in}$ tall, and all six are equal. That is tall enough for a readable trace with room for the labels between panels.

The dataset is empty so far. In the next lesson each panel gets its lines, steps and shaded three-sigma bands; the frame does not change.
:::

::: warning Sharing an axis between different quantities
`sharey=True` on a stack of altitude, Mach and gimbal angle would force all three onto one vertical range, and at least two of them would be flat lines at the bottom of their panels. Share an axis only when the panels show the same quantity in the same unit: time across a stack, or the same attitude error across a grid of Monte Carlo cases.
:::

If you made the Axes some other way, you can still link them afterwards with `ax2.sharex(ax1)`, and hide redundant labels with `ax.label_outer()`, which keeps tick labels only on the outer edge of a grid.

## Twin axes: two scales on one panel

Sometimes you want two quantities on the *same* panel, over the same time, but they have different units. Altitude in kilometers and Mach number (a pure ratio) are the classic pair. `ax.twinx()` makes a second Axes that shares the first one's x-axis and puts a new y-axis on the right-hand side.

::: example Altitude and Mach on one panel
Take the toy ascent from the last lesson: steady $10\,\mathrm{m/s^2}$, so $v = 10t$ and $h = 5t^2$. The **[[Mach number|mach-number]]** is speed divided by the local speed of sound, $M = v/a$, where $a = \sqrt{\gamma R T}$ depends on the air temperature $T$. (Read $\gamma$ as "gamma"; it is $1.4$ for air, and $R = 287.05\,\mathrm{J/(kg\,K)}$.) Temperature falls by $6.5\,\mathrm{K}$ per kilometer up to $11\,\mathrm{km}$ and then holds at $216.65\,\mathrm{K}$.

```python
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

t = np.linspace(0.0, 120.0, 1201)          # s
v = 10.0 * t                                # m/s
h = 5.0 * t**2                              # m
T = np.where(h < 11000.0, 288.15 - 0.0065 * h, 216.65)   # K
a_snd = np.sqrt(1.4 * 287.05 * T)           # m/s
mach = v / a_snd
print(round(h[-1] / 1000.0, 1), round(mach[-1], 2))      # 72.0 4.07

fig, ax_h = plt.subplots(layout="constrained")
ax_m = ax_h.twinx()                          # same x, new y on the right
lh, = ax_h.plot(t, h / 1000.0, color="C0", label="Altitude")
lm, = ax_m.plot(t, mach, color="C1", linestyle="--", label="Mach")
ax_h.set_xlabel("Time since liftoff (s)")
ax_h.set_ylabel("Altitude (km)")
ax_m.set_ylabel("Mach (-)")
ax_h.legend(handles=[lh, lm], loc="upper left")
print(ax_m.get_shared_x_axes().joined(ax_h, ax_m))       # True
```

After $120\,\mathrm{s}$ the toy is at $72.0\,\mathrm{km}$ and Mach $4.07$. At the end, the $1200\,\mathrm{m/s}$ speed divided by about $295\,\mathrm{m/s}$ in the cold upper air gives about $4.07$, so the number makes sense.

Three details matter. The twin is a separate Axes, so each curve is plotted on the Axes whose scale it uses. Each Axes gets its own y-label with its own unit. And each Axes keeps its own legend, so to get one legend with both entries, pass both line handles to one `legend` call. The two curves also differ in line style, not only color, so they stay apart when printed in grey.
:::

Twin axes are powerful and easy to abuse. On a twin-axis panel, **[[where two curves cross|twin-crossing]]** is decided entirely by the two sets of y-limits you picked. Nothing physical happens at that point.

Here is the proof, with the same toy data. A curve's height on the page is its value divided by the top of its axis (both axes start at zero here). Find where the two heights are equal for three choices of the Mach axis:

```python
def crossing_times(h_top, m_top):
    """Times where the two curves cross on the page, for given axis tops."""
    gap = (h / 1000.0) / h_top - mach / m_top     # difference in page height
    k = np.nonzero(np.diff(np.sign(gap[1:])))[0]  # skip t = 0, where both are 0
    return [round(float(x), 1) for x in t[1:][k]]

print(crossing_times(80.0, 5.0))   # [108.4]
print(crossing_times(80.0, 8.0))   # [67.7]
print(crossing_times(80.0, 4.0))   # []
```

Same data, same altitude axis. With the Mach axis topping out at $5$, the curves cross at $108\,\mathrm{s}$. At $8$, they cross at $68\,\mathrm{s}$. At $4$, they never cross. A reader who sees "altitude catches up with Mach at $68\,\mathrm{s}$" is reading a choice of axis limits, not a fact about the flight. Readers do this without meaning to; the eye treats a crossing, or two curves rising together, as a relationship.

::: key
Twin axes are right when two quantities share a time base and genuinely need different units, for example altitude and Mach. They are a trap when the two vertical scales are chosen so the curves appear to correlate; readers infer a relationship from crossings that mean nothing.
:::

::: warning When to prefer two panels
If the two quantities are both important, or if anyone might compare their heights, give each its own panel with `sharex=True`. A twin axis saves one panel of space and costs clarity. It is worth it for a secondary scale that helps read the main one — for example, a Mach axis next to an airspeed curve — and rarely for two independent stories.
:::

## Uneven grids with gridspec and mosaics

Not every page is a regular grid. A common review page has one wide panel on top (the trajectory) and smaller panels below. The tool for that is a **GridSpec** — a **[[grid specification|gridspec-grid]]** that splits the figure into rows and columns, and then lets each Axes take one cell or a block of cells.

```python
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

fig = plt.figure(figsize=(8.0, 6.0), layout="constrained")
gs = fig.add_gridspec(3, 2, height_ratios=[2, 1, 1])
ax_traj = fig.add_subplot(gs[0, :])            # top row, both columns
ax_q = fig.add_subplot(gs[1, 0])
ax_mach = fig.add_subplot(gs[1, 1], sharex=ax_q)
ax_att = fig.add_subplot(gs[2, :], sharex=ax_q)

fig.canvas.draw()
print([float(round(ax.get_position().width * 8.0, 2))
       for ax in (ax_traj, ax_q, ax_mach, ax_att)])   # [7.4, 3.4, 3.4, 7.4]
print([float(round(ax.get_position().height * 6.0, 2))
       for ax in (ax_traj, ax_q, ax_att)])             # [2.44, 1.22, 1.22]
```

The indexing is NumPy slicing on the grid. `gs[0, :]` means "row 0, every column", so the trajectory panel spans the full width. `gs[1, 0]` is one cell. `height_ratios=[2, 1, 1]` makes the top row twice as tall as each of the others, and the printed heights show exactly that: $2.44$ is twice $1.22$. (`width_ratios` does the same for columns.) Sharing still works: pass `sharex=` when you add each panel.

For layouts you can sketch in text, `plt.subplot_mosaic` is often clearer. You draw the grid as a list of rows, using the same name in several cells to merge them, and get back a dictionary of Axes keyed by name:

```python
fig, axd = plt.subplot_mosaic([["alt", "alt"],
                               ["q",   "mach"]], layout="constrained")
print(sorted(axd))                                # ['alt', 'mach', 'q']
axd["q"].set_ylabel("Dynamic pressure (kPa)")
```

Naming panels `axd["q"]` instead of `axs[1, 0]` makes the code read like the figure, and it survives someone rearranging the grid.

## Constrained layout: stop the labels colliding

Each Axes is a box, but its tick labels, axis label and title hang *outside* the box. With the default placement, matplotlib positions the boxes at fixed fractions of the figure without looking at those decorations. In a tall stack, a long tick label, a y-label or a title can spill over the edge of the figure or into the panel next to it.

**Constrained layout** fixes this. Before drawing, it measures every label, title, legend and colorbar, and moves and shrinks the Axes boxes until nothing overlaps and the spacing is even. It is a small **[[constraint solver|constraint-solver]]** that runs every time the figure is drawn or resized. Turn it on when you make the figure:

```python
fig, axs = plt.subplots(6, 1, sharex=True, figsize=(7.0, 10.0),
                        layout="constrained")
```

There is an older tool, `fig.tight_layout()`, which adjusts the spacing once when you call it. It works for simple grids, but it does not know about figure-level legends or colorbars and has to be called again after every change. Prefer `layout="constrained"` for new code. It also makes figure-level titles (`fig.suptitle`) and shared labels (`fig.supxlabel`, `fig.supylabel`) fit, and it is what lets a legend sit outside the Axes, which a later lesson on legends uses.

::: note Why constrained layout needs a draw
Text only has a size once the font is loaded and the string is laid out, and that happens at draw time. So the layout engine cannot finish when you create the figure; it runs when the figure is drawn, saved, or shown. That is why the examples above call `fig.canvas.draw()` before asking for panel positions, and why saving with `fig.savefig(...)` always gives the final layout.
:::

## Check yourself

::: check
What does `plt.subplots(4, 1)` return for the Axes, and how do you get the bottom panel? What changes with `plt.subplots(2, 2)`?
:::

::: answer
A 1-D NumPy array of four Axes, shape `(4,)`. The bottom panel is `axs[3]` or `axs[-1]`. With `plt.subplots(2, 2)` the array is 2-D, shape `(2, 2)`, so the bottom-right panel is `axs[1, 1]`. To loop over any grid, use `for ax in axs.flat:`. If the code must handle any grid size including 1-by-1, pass `squeeze=False` so the result is always 2-D.
:::

::: check
You make a stack of five panels with `sharex=True` and call `axs[2].set_xlim(30, 60)`. What do the other four panels show, and which panels have time numbers under them?
:::

::: answer
All five panels show $30$ to $60\,\mathrm{s}$, because the x-axes are linked and a limit set on one applies to all. Only the bottom panel shows the tick labels (the time numbers); the upper four hide them, since they would repeat the same values.
:::

::: check
A colleague's slide has thrust (kN) on the left axis and chamber pressure (MPa) on a twin right axis, with the limits picked so the two curves lie exactly on top of each other. The title says "thrust tracks chamber pressure". What is wrong, and what would you show instead?
:::

::: answer
On a twin-axis panel the vertical position of each curve is set by its own axis limits, so lining two curves up is a choice, not evidence. The overlap may still be true (thrust really is close to proportional to chamber pressure), but the picture does not prove it. Plot them on two panels with `sharex=True`, or plot one against the other in a scatter, or plot their ratio over time. Any of those shows the relationship without depending on hand-picked limits.
:::

::: check
Write the GridSpec lines for a figure with a tall left panel covering both rows, and two stacked panels on the right, the right column half as wide as the left.
:::

::: answer
Two rows, two columns, with width ratios $2{:}1$:

```python
fig = plt.figure(figsize=(9.0, 5.0), layout="constrained")
gs = fig.add_gridspec(2, 2, width_ratios=[2, 1])
ax_big = fig.add_subplot(gs[:, 0])        # every row, left column
ax_top = fig.add_subplot(gs[0, 1])
ax_bot = fig.add_subplot(gs[1, 1], sharex=ax_top)
```

`gs[:, 0]` spans all rows of column 0. The two right panels share their x-axis because they show the same time range.
:::

::: check
A six-panel figure saved without any layout setting has the y-label of each panel cut off at the left edge and titles overlapping the panel above. What one change fixes both, and why does it work?
:::

::: answer
Create the figure with `layout="constrained"`. Constrained layout measures the tick labels, axis labels and titles that hang outside each Axes box and moves and resizes the boxes so that every decoration fits inside the figure and nothing overlaps. It runs whenever the figure is drawn or saved, so the saved file has the corrected layout.
:::

## Summary

| Tool | What it does | Code |
|---|---|---|
| Grid of Axes | Regular rows by columns | `fig, axs = plt.subplots(r, c)` |
| Array shape | 2-D grid, 1-D row or column, bare Axes for 1-by-1 | `squeeze=False` keeps it 2-D |
| Shared axes | Same limits and ticks, linked zoom, inner labels hidden | `sharex=True`, `"col"`, `"row"` |
| Twin axes | Second y-scale on the same panel | `ax2 = ax.twinx()` |
| GridSpec | Uneven grids, spanning cells, size ratios | `fig.add_gridspec(...)`, `gs[0, :]` |
| Mosaic | Named panels from a text sketch | `plt.subplot_mosaic([...])` |
| Constrained layout | Resizes panels so labels never overlap | `layout="constrained"` |

The next lesson fills these panels: lines, scatters, steps for sampled commands, stems, error bars, and the shaded three-sigma and percentile bands that turn a Monte Carlo ensemble into one readable picture.

::: context figure-inches Why figure sizes are in inches
Matplotlib grew up around printing, and print is measured in inches and points. A point is $1/72$ of an inch, so a $10\,\mathrm{pt}$ font is about $3.5\,\mathrm{mm}$ tall whatever the screen. Fixing the figure size in inches is what lets you promise that the text will be $10\,\mathrm{pt}$ on the printed page. One inch is exactly $2.54\,\mathrm{cm}$, so a $7 \times 10$ inch figure is about $17.8 \times 25.4\,\mathrm{cm}$ — close to a portrait page with margins.
:::

::: context shared-axes One time axis runs down the whole stack
With a shared time axis, a vertical line at any instant cuts every panel at the same moment. That is what makes a stacked review readable: you follow a line down and read off every quantity at, say, MECO.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <rect x="50" y="10" width="290" height="44" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="50" y="62" width="290" height="44" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="50" y="114" width="290" height="44" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline points="50,52 110,48 170,38 230,26 290,16 340,13" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <polyline points="50,104 110,96 170,76 230,70 290,82 340,100" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <polyline points="50,136 110,130 170,142 230,128 290,138 340,136" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="290" y1="10" x2="290" y2="158" stroke="#b4232c" stroke-width="2" stroke-dasharray="4 3"/>
  <text x="290" y="184" font-size="11" text-anchor="middle" fill="#b4232c">MECO</text>
  <text x="44" y="36" font-size="11" text-anchor="end" fill="#1f2a44">h</text>
  <text x="44" y="88" font-size="11" text-anchor="end" fill="#1f2a44">q</text>
  <text x="44" y="140" font-size="11" text-anchor="end" fill="#1f2a44">α</text>
  <text x="50" y="172" font-size="11" text-anchor="middle" fill="#6c7a93">0</text>
  <text x="195" y="172" font-size="11" text-anchor="middle" fill="#6c7a93">80</text>
  <text x="340" y="172" font-size="11" text-anchor="middle" fill="#6c7a93">160 s</text>
</svg>
```

Only the bottom panel carries the time numbers; the others would repeat them.
:::

::: context meco-staging The two events every ascent plot marks
**MECO** is main-engine cutoff: the first stage's engines shut down because the planned burn is done. A few seconds later comes **stage separation**, when the spent first stage is pushed away from the second stage. On a two-stage rocket like Falcon 9 these happen roughly two and a half minutes after liftoff. Between them almost nothing pushes the vehicle, so acceleration drops to near zero, attitude control changes hands, and many GNC quantities jump. Vertical lines at those times let the reviewer explain every jump at a glance.
:::

::: context mach-number Mach number and the speed of sound
The Mach number $M = v/a$ compares speed $v$ with the local speed of sound $a$. It is a ratio, so it has no unit, which is why its axis label says "(-)". The speed of sound depends on temperature: $a = \sqrt{\gamma R T}$ is about $340\,\mathrm{m/s}$ at sea level ($288\,\mathrm{K}$) and about $295\,\mathrm{m/s}$ in the $217\,\mathrm{K}$ air above $11\,\mathrm{km}$. The same speed is therefore a higher Mach number up high. Airflow changes character near $M = 1$, which is why ascent loads and aerodynamic coefficients are tabulated against Mach rather than speed.
:::

::: context twin-crossing The crossing moves when you change one limit
The same altitude and Mach data drawn twice, differing only in the top of the Mach axis. On the left the Mach axis goes to $5$ and the curves cross near $108\,\mathrm{s}$; on the right it goes to $8$ and they cross near $68\,\mathrm{s}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="20" width="145" height="110" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="195" y="20" width="145" height="110" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="20.0,130.0 26.0,129.8 32.1,129.3 38.1,128.5 44.2,127.2 50.2,125.7 56.2,123.8 62.3,121.6 68.3,119.0 74.4,116.1 80.4,112.8 86.5,109.2 92.5,105.2 98.5,101.0 104.6,96.3 110.6,91.3 116.7,86.0 122.7,80.3 128.8,74.3 134.8,68.0 140.8,61.2 146.9,54.2 152.9,46.8 159.0,39.1 165.0,31.0"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 3" points="20.0,130.0 26.0,126.8 32.1,123.5 38.1,120.2 44.2,116.8 50.2,113.2 56.2,109.5 62.3,105.6 68.3,101.4 74.4,96.9 80.4,92.7 86.5,89.0 92.5,85.3 98.5,81.5 104.6,77.8 110.6,74.1 116.7,70.4 122.7,66.6 128.8,62.9 134.8,59.2 140.8,55.4 146.9,51.7 152.9,48.0 159.0,44.3 165.0,40.5"/>
  <circle cx="151.0" cy="49.2" r="4" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="195.0,130.0 201.0,129.8 207.1,129.3 213.1,128.5 219.2,127.2 225.2,125.7 231.2,123.8 237.3,121.6 243.3,119.0 249.4,116.1 255.4,112.8 261.5,109.2 267.5,105.2 273.5,101.0 279.6,96.3 285.6,91.3 291.7,86.0 297.7,80.3 303.8,74.3 309.8,68.0 315.8,61.2 321.9,54.2 327.9,46.8 334.0,39.1 340.0,31.0"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 3" points="195.0,130.0 201.0,128.0 207.1,125.9 213.1,123.9 219.2,121.7 225.2,119.5 231.2,117.2 237.3,114.8 243.3,112.1 249.4,109.3 255.4,106.7 261.5,104.4 267.5,102.0 273.5,99.7 279.6,97.4 285.6,95.1 291.7,92.7 297.7,90.4 303.8,88.1 309.8,85.7 315.8,83.4 321.9,81.1 327.9,78.7 334.0,76.4 340.0,74.1"/>
  <circle cx="276.8" cy="98.5" r="4" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="92.5" y="148" font-size="11" text-anchor="middle" fill="#1f2a44">Mach axis 0 to 5</text>
  <text x="267.5" y="148" font-size="11" text-anchor="middle" fill="#1f2a44">Mach axis 0 to 8</text>
  <text x="92.5" y="163" font-size="11" text-anchor="middle" fill="#6c7a93">solid altitude, dashed Mach</text>
  <text x="267.5" y="163" font-size="11" text-anchor="middle" fill="#6c7a93">same data</text>
</svg>
```
:::

::: context gridspec-grid A grid you can merge cells in
A GridSpec is like a spreadsheet where you can merge cells. You say how many rows and columns there are and how big each is relative to the others, then each panel claims a block. This one is `add_gridspec(3, 2, height_ratios=[2, 1, 1])` with the top and bottom rows merged across both columns.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="10" width="320" height="80" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="54" font-size="12" text-anchor="middle" fill="#1f2a44">gs[0, :]  trajectory  (ratio 2)</text>
  <rect x="20" y="98" width="156" height="36" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="98" y="120" font-size="12" text-anchor="middle" fill="#1f2a44">gs[1, 0]  q</text>
  <rect x="184" y="98" width="156" height="36" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="262" y="120" font-size="12" text-anchor="middle" fill="#1f2a44">gs[1, 1]  Mach</text>
  <rect x="20" y="142" width="320" height="36" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="164" font-size="12" text-anchor="middle" fill="#1f2a44">gs[2, :]  attitude  (ratio 1)</text>
</svg>
```
:::

::: context constraint-solver How the layout engine decides
Constrained layout writes the page as a set of rules: every panel's decorations must fit inside the figure, gaps between panels should be equal, panels in a row should line up, and so on. Then a solver finds box sizes that satisfy all of them at once. Matplotlib uses the kiwisolver package, an implementation of the Cassowary algorithm that was designed for laying out user interfaces, which is why it is fast enough to run on every redraw.
:::
