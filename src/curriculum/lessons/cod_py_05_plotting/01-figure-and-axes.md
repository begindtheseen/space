---
id: l01-figure-and-axes
title: Figures and Axes, and why you name them
minutes: 17
covers:
  - Figure and Axes object API versus the pyplot state machine
---

Picture a kitchen with three pots on the stove: soup, pasta and sauce. Someone calls out "stir it!" Which one? If the rule is "stir whichever pot you touched last", you will usually get it right. But the day you reach past the soup to grab a spoon, the sauce burns. Now picture the same kitchen where every instruction names its pot: "stir the soup". Nothing depends on what you touched last, so nothing goes wrong when the order of jobs changes.

Matplotlib, the plotting library almost every Python engineer uses, lets you talk to it both ways. The first way, called the **pyplot state machine**, remembers which plot you touched last and sends every command there. The second way, the **object API**, hands you a named object for every plot and you call methods on the one you mean. This lesson shows how both work, why the second one is the grown-up habit, and how to write plotting functions you can reuse in any figure.

This matters because plots are the thing a guidance, navigation and control engineer is judged on. After every test and every launch there is a **[[flight review|flight-review]]**, and the evidence on the screen is a stack of figures: altitude, speed, dynamic pressure, attitude errors, engine gimbal angles. Those figures are built by scripts that run every night on hundreds of simulated flights. A script that draws a limit line on the wrong panel does not crash. It quietly tells a room full of people something false.

## What a figure is made of

Before choosing a way to talk to matplotlib, learn the names of the things it draws. There are four, nested inside each other like boxes.

- The **Figure** is the whole sheet of paper or the whole window. It has a size in inches and a resolution. It holds everything else.
- An **Axes** is one plotting area inside the figure: a rectangle with its own coordinate system, its own data, its own title and labels. A figure with six stacked panels has six Axes. The word is singular even though it ends in "s", and it is not the same as "axis" — the naming trips up everyone, so there is a note on **[[Axes versus axis|axes-anatomy]]**.
- An **Axis** is one ruler on an Axes: the x-axis along the bottom, the y-axis up the side. It owns the tick marks, the tick labels and the axis label.
- An **[[Artist|artist]]** is anything that gets drawn: a line, a text label, a shaded band, a tick mark. The Figure, the Axes and the Axis are Artists too.

Here is how to make the two outer boxes and look inside them. The line `matplotlib.use("Agg")` tells matplotlib to draw into memory rather than open a window; the last section of this lesson says why scripts do that.

```python
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

fig, ax = plt.subplots()
print(type(fig).__name__, type(ax).__name__)    # Figure Axes
print(fig.axes == [ax])                          # True
print(type(ax.xaxis).__name__)                   # XAxis
print(fig.get_size_inches(), fig.dpi)            # [6.4 4.8] 100.0
```

`plt.subplots()` makes a Figure with one Axes in it and hands both back. The figure keeps a list of its Axes in `fig.axes`. Each Axes keeps its two rulers in `ax.xaxis` and `ax.yaxis`. The default figure is $6.4$ by $4.8$ inches at $100$ **dots per inch** (dpi, the number of pixels per inch of paper), so on screen it is $640$ by $480$ pixels.

::: key
A Figure holds one or more Axes. An Axes is one plotting area with its own coordinates; an Axis is one of its rulers. Everything drawn is an Artist.
:::

## The pyplot state machine

The first way to plot, and the one most tutorials start with, looks like this:

```python
t = np.linspace(0.0, 80.0, 801)          # s
h = 5.0 * t**2                            # m
plt.plot(t, h)
plt.xlabel("Time (s)")
plt.ylabel("Altitude (m)")
```

Where is the Axes? You never named one. `pyplot` keeps two hidden pointers: the **current figure** and the **current axes** — the figure and Axes it will draw on next if you do not say otherwise. Every `plt.something(...)` call goes to them. `plt.gcf()` ("get current figure") and `plt.gca()` ("get current axes") return them. If no figure exists yet, the first `plt.plot` quietly makes one.

A system that behaves differently depending on what happened before is called a **[[state machine|state-machine]]**. The "state" here is those two pointers. They move whenever you create a new figure or a new Axes: the newest one becomes current. Calling `plt.plot(...)` is the same as calling `plt.gca().plot(...)`.

For a quick look at one curve in an interactive session, this is fine. It is short, and there is only one pot on the stove. The trouble starts when there are several Axes and the code that draws on them is spread across functions.

::: example The limit line that landed on the wrong panel
Take a toy ascent. A rocket climbs straight up with a steady $a = 10\,\mathrm{m/s^2}$, so its speed is $v = at$ and its height is $h = \tfrac{1}{2}at^2$. The air thins with height as $\rho = 1.225\,e^{-h/8500}\,\mathrm{kg/m^3}$ (read $\rho$ as "rho", the air density). The **[[dynamic pressure|dynamic-pressure]]** — the push of the oncoming air on the vehicle — is $q = \tfrac{1}{2}\rho v^2$. Say the structure is rated for $35\,\mathrm{kPa}$.

An engineer builds a two-panel figure, $q$ on top and altitude below, and has a helper that draws the limit:

```python
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

t = np.linspace(0.0, 80.0, 801)          # s, every 0.1 s
a = 10.0                                  # m/s^2
v = a * t                                 # m/s
h = 0.5 * a * t**2                        # m
rho = 1.225 * np.exp(-h / 8500.0)         # kg/m^3
q = 0.5 * rho * v**2 / 1000.0             # kPa

i = np.argmax(q)
print(round(t[i], 1), round(q[i], 1), round(v[i]))   # 41.2 38.3 412

def add_limit():
    plt.axhline(35.0, color="red")        # horizontal line at 35 kPa

fig, (ax_q, ax_h) = plt.subplots(2, 1)
ax_q.plot(t, q)
ax_h.plot(t, h / 1000.0)
add_limit()
print(len(ax_q.lines), len(ax_h.lines))   # 1 2
print(plt.gca() is ax_h)                  # True
```

Walk through it. The peak is $38.3\,\mathrm{kPa}$ at $t = 41.2\,\mathrm{s}$, when the rocket is moving at $412\,\mathrm{m/s}$. That is above the $35\,\mathrm{kPa}$ rating, so the limit line is the most important thing on the page.

`plt.subplots(2, 1)` made two Axes, top then bottom. The bottom one was made last, so it became the current axes. Plotting with `ax_q.plot` and `ax_h.plot` does not move the pointer. So when `add_limit` calls `plt.axhline`, the red line lands on the altitude panel, where $35$ means $35\,\mathrm{km}$ — a meaningless line across the altitude curve. The $q$ panel has one line (the data) and no limit. The altitude panel has two.

Nothing raised an error. The figure looks tidy. Someone glancing at the top panel sees a curve peaking near $38$ and no red line, and might never notice the exceedance at all.
:::

::: warning Mixing the two styles
The most common version of this bug is not a helper function. It is one stray `plt.title("...")` or `plt.ylabel("...")` at the bottom of a script that otherwise uses named Axes. That call goes to whichever Axes was created last, which is usually the bottom panel, and it overwrites that panel's label. Pick one style per figure. For anything with more than one Axes, pick the object style.
:::

## The object API: name the pot

The fix is to hold on to the objects and call their methods. `plt.subplots` already gives them to you; the object style keeps using them.

```python
fig, ax = plt.subplots()
ax.plot(t, q)
ax.set_xlabel("Time since liftoff (s)")
ax.set_ylabel("Dynamic pressure (kPa)")
ax.set_title("Toy ascent")
ax.axhline(35.0, color="red", linestyle="--")
```

Every command now says which Axes it means. Nothing depends on order. Most pyplot functions have an Axes method with the same job, but the "setter" ones gain a `set_` prefix:

| pyplot state machine | Object API |
|---|---|
| `plt.plot(x, y)` | `ax.plot(x, y)` |
| `plt.xlabel("...")` | `ax.set_xlabel("...")` |
| `plt.title("...")` | `ax.set_title("...")` |
| `plt.xlim(0, 80)` | `ax.set_xlim(0, 80)` |
| `plt.legend()` | `ax.legend()` |
| `plt.savefig("f.pdf")` | `fig.savefig("f.pdf")` |

There is also a shortcut, `ax.set(...)`, that takes several settings at once: `ax.set(xlabel="Time (s)", ylabel="q (kPa)", xlim=(0, 80))`.

Drawing methods hand back the Artists they made. `ax.plot` returns a *list* of lines, one per curve, because one call can draw several. The usual way to catch a single line is to unpack it with a trailing comma: `line, = ax.plot(t, q)`. Keeping that `line` lets you change it later — its color, its label, or its data with `line.set_ydata(...)`, which is how the animation lesson later in this module moves a curve without redrawing the whole figure.

::: key
Prefer `fig, ax = plt.subplots()` over `plt.plot()`: it gives you explicit Figure and Axes objects instead of relying on a hidden current-axes state. Functions that take an `ax` argument compose into multi-panel figures; functions that call `plt.plot` do not.
:::

## Plotting functions that take an ax

Once you think in objects, a good habit follows. A function that draws something should not decide *where* to draw it. It should take the Axes as its first argument and draw there. The caller decides the layout; the function decides the content.

This is what makes plotting code **[[compose|compose-word]]**: small pieces that fit together into bigger ones without changing. The same `plot_q` can fill a single slide, the top panel of a review figure, or one cell of a grid of twenty Monte Carlo cases.

::: example One function, two figures
Rewrite the helper so it takes an Axes, then use it twice: once on its own for a slide, and once as the top of a two-panel review.

```python
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

t = np.linspace(0.0, 80.0, 801)
h = 5.0 * t**2
q = 0.5 * 1.225 * np.exp(-h / 8500.0) * (10.0 * t)**2 / 1000.0

def plot_q(ax, t, q, limit):
    """Draw dynamic pressure and its limit on the Axes you pass in."""
    line, = ax.plot(t, q, label="q")
    ax.axhline(limit, color="red", linestyle="--", label="limit")
    ax.set_xlabel("Time since liftoff (s)")
    ax.set_ylabel("Dynamic pressure (kPa)")
    return line

# Use 1: a single panel for a slide
fig1, ax1 = plt.subplots(figsize=(6.4, 3.6))
plot_q(ax1, t, q, 35.0)

# Use 2: the top panel of a two-panel review
fig2, (ax_top, ax_bot) = plt.subplots(2, 1, figsize=(6.4, 6.0))
line = plot_q(ax_top, t, q, 35.0)
ax_bot.plot(t, h / 1000.0)
ax_bot.set_ylabel("Altitude (km)")

print(len(ax1.lines), len(ax_top.lines), len(ax_bot.lines))   # 2 2 1
print(round(line.get_ydata().max(), 1))                        # 38.3
over = q > 35.0
print(round(t[over][0], 1), round(t[over][-1], 1))             # 32.9 50.2
```

Read the counts. The slide Axes has two lines (the data and the limit). The review's top Axes also has two. The bottom one has one. Every line went where it was sent, and the order of the calls did not matter.

The returned `line` lets you check the figure against the numbers: its highest point is $38.3\,\mathrm{kPa}$, the same peak as before. And the mask `q > 35.0` says the toy vehicle is over its limit from $32.9\,\mathrm{s}$ to $50.2\,\mathrm{s}$ — about $17\,\mathrm{s}$. With the limit line on the right panel, a reviewer sees that at a glance. A real rocket avoids this by throttling its engines down through the max-q region.

`figsize=(6.4, 3.6)` is width and height in inches. At `dpi=150` it saves as $960$ by $540$ pixels, a 16:9 slide shape.
:::

A common extra touch is to let the Axes be optional, for quick interactive use:

```python
def plot_q(ax, t, q, limit):
    if ax is None:
        ax = plt.gca()
    ...
```

That keeps one small door open to the state machine, and only when the caller asks for it by passing `None`.

::: warning Do not create the figure inside the helper
A helper that starts with `fig, ax = plt.subplots()` cannot be placed in someone else's layout; it always makes its own page. Return the Artists you drew, take the Axes as an argument, and leave figure creation to the caller. The one function that should make a figure is the top-level one that decides the whole page.
:::

## Figures in scripts, not windows

Most flight figures are never shown on a screen by the program that makes them. A nightly job runs a few hundred simulated flights on a server, draws a figure per case, and writes them to files for the review package. Two habits keep that job healthy.

First, choose a **[[backend|backend]]** that does not need a screen. A backend is the part of matplotlib that turns Artists into pixels or vector drawing commands. `"Agg"` draws into memory and can save PNG files; `savefig` switches to the right writer for PDF or SVG by the file extension. Call `matplotlib.use("Agg")` before importing pyplot, or set the `MPLBACKEND=Agg` environment variable, and the script runs happily on a machine with no display.

Second, close what you open. pyplot keeps a reference to every figure it made, so that it can show them later. In a loop that makes a figure per case, memory grows with every pass until you call `plt.close(fig)`. Matplotlib warns you once more than $20$ figures are open at the same time, because that is almost always this **[[leak|figure-leak]]**.

```python
for case in range(3):                     # 300 in the real job
    fig, ax = plt.subplots()
    ax.plot(t, q)
    fig.savefig(f"case_{case:03d}.png", dpi=150)
    plt.close(fig)
```

Notice that the loop never needs the state machine. The figure is named, saved by name, and closed by name.

::: note Why the pyplot style exists at all
Matplotlib was first written to feel like MATLAB, where `plot`, `xlabel` and `title` work on a hidden current plot. That made it easy for people moving from MATLAB, and it is still the fastest way to glance at one array. The object API was always underneath: every pyplot call looks up the current Figure or Axes and calls a method on it. When you use the object API you are skipping the lookup, not using a different library.
:::

## Check yourself

::: check
In one sentence each, what is a Figure, an Axes and an Axis?
:::

::: answer
A Figure is the whole page or window that holds everything. An Axes is one plotting area inside it, with its own data, coordinates, title and labels. An Axis is one of an Axes' rulers (x or y), which owns the ticks, tick labels and axis label. A six-panel figure is one Figure, six Axes and twelve Axis objects.
:::

::: check
A script runs `fig, (a1, a2, a3) = plt.subplots(3, 1)`, then `a1.plot(t, x)`, then `plt.ylabel("Speed (m/s)")`. Which panel gets the label, and why?
:::

::: answer
The bottom panel, `a3`. `plt.subplots` created the three Axes in order and the last one created became the current axes. `a1.plot` drew on `a1` but did not move the current-axes pointer, so `plt.ylabel` went to `a3`. The fix is `a1.set_ylabel("Speed (m/s)")`.
:::

::: check
Rewrite this helper in the object style so it can draw on any panel: `def mark_meco(): plt.axvline(162.0, color="grey")`.
:::

::: answer
Take the Axes as an argument, draw on it, and return the Artist:

```python
def mark_meco(ax, t_meco=162.0):
    return ax.axvline(t_meco, color="grey", linestyle=":")
```

Now `mark_meco(ax_alt)` and `mark_meco(ax_q)` put the line exactly where the caller says, whatever order the panels were made in.
:::

::: check
Why does `line, = ax.plot(t, q)` have a comma after `line`, and what is the returned object good for?
:::

::: answer
`ax.plot` returns a list of lines, because one call can draw several curves. The trailing comma unpacks a one-item list into its single item. The result is a `Line2D` Artist. You can change its color or label, read its data back with `line.get_ydata()`, or replace the data with `line.set_ydata(...)` to update a plot without rebuilding it.
:::

::: check
A batch job makes 500 figures in a loop and eventually runs out of memory on the server. What is the likely cause and the fix?
:::

::: answer
pyplot keeps every figure it created alive until it is closed, so 500 figures pile up in memory. Call `plt.close(fig)` after `fig.savefig(...)` inside the loop. Also make sure the script uses a non-interactive backend such as Agg, since the server has no screen.
:::

## Summary

| Idea | Meaning | In code |
|---|---|---|
| Figure | The whole page; holds all Axes | `fig`, `fig.axes`, `fig.savefig(...)` |
| Axes | One plotting area with its own coordinates | `ax.plot(...)`, `ax.set_xlabel(...)` |
| Axis | One ruler (x or y) of an Axes | `ax.xaxis`, `ax.yaxis` |
| Artist | Anything drawn | `line, = ax.plot(...)` |
| State machine | pyplot draws on the current figure and axes | `plt.gcf()`, `plt.gca()` |
| Object API | You call methods on the object you mean | `fig, ax = plt.subplots()` |
| Composable helper | Takes an Axes, draws, returns Artists | `def f(ax, ...)` |
| Scripts | Headless backend, close each figure | `matplotlib.use("Agg")`, `plt.close(fig)` |

The next lesson puts many Axes on one page: grids of subplots, panels that share a time axis, a second y-axis on the same panel, uneven grids, and the layout engine that stops labels from colliding.

::: context flight-review What a flight review looks like
After a launch, a static fire or a big simulation campaign, the team sits down and walks through the data. Each discipline brings figures: propulsion shows chamber pressure, structures shows loads, GNC shows attitude errors, gimbal commands, navigation errors and their predicted bounds. The question for every figure is "did the vehicle do what we predicted, and by how much margin?" Those figures are usually made by the same scripts every time, so a bug in the plotting code repeats in every review until someone catches it.
:::

::: context axes-anatomy Axes is one panel; axis is one ruler
The names come from maths, where a graph has an x-axis and a y-axis — together, its axes. Matplotlib borrowed the plural for the whole plotting box, and kept the singular for one ruler. So one Axes has two Axis objects.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="6" y="6" width="348" height="188" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="16" y="24" font-size="12" fill="#1f2a44">Figure</text>
  <rect x="60" y="36" width="270" height="56" fill="#fff" stroke="#1d6fd1" stroke-width="2"/>
  <text x="68" y="52" font-size="12" fill="#1d6fd1">Axes 1</text>
  <polyline points="60,84 120,70 180,60 240,66 330,48" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <rect x="60" y="110" width="270" height="56" fill="#fff" stroke="#1d6fd1" stroke-width="2"/>
  <text x="68" y="126" font-size="12" fill="#1d6fd1">Axes 2</text>
  <polyline points="60,160 120,152 180,140 240,128 330,118" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="60" y1="166" x2="330" y2="166" stroke="#b4232c" stroke-width="3"/>
  <line x1="114" y1="166" x2="114" y2="172" stroke="#b4232c" stroke-width="2"/>
  <line x1="168" y1="166" x2="168" y2="172" stroke="#b4232c" stroke-width="2"/>
  <line x1="222" y1="166" x2="222" y2="172" stroke="#b4232c" stroke-width="2"/>
  <line x1="276" y1="166" x2="276" y2="172" stroke="#b4232c" stroke-width="2"/>
  <text x="195" y="188" font-size="12" text-anchor="middle" fill="#b4232c">x Axis of Axes 2</text>
  <line x1="60" y1="110" x2="60" y2="166" stroke="#b4232c" stroke-width="3"/>
  <text x="52" y="142" font-size="12" text-anchor="end" fill="#b4232c">y Axis</text>
</svg>
```
:::

::: context artist Why everything is called an Artist
Matplotlib's drawing model is a painter and a canvas. The canvas is the backend's surface. Each Artist knows how to paint itself onto it: a line paints a path, a text paints glyphs. When you save a figure, matplotlib asks the Figure to draw, the Figure asks each Axes, each Axes asks its lines, patches, texts and Axis objects, and so on down the tree. That tree is why changing one object, like `ax.set_ylabel`, changes exactly one thing on the page.
:::

::: context state-machine A pointer that moves by itself
A state machine is anything whose response depends on what happened before, like a turnstile that is locked or unlocked. pyplot's state is a pointer to the current Axes. Each new Axes grabs it; drawing on a named Axes does not.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="20" width="200" height="44" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="120" y="47" font-size="12" text-anchor="middle" fill="#1f2a44">ax_q (made first)</text>
  <rect x="20" y="86" width="200" height="44" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <text x="120" y="113" font-size="12" text-anchor="middle" fill="#1f2a44">ax_h (made last)</text>
  <line x1="320" y1="108" x2="232" y2="108" stroke="#b4232c" stroke-width="3"/>
  <polygon points="222,108 234,102 234,114" fill="#b4232c"/>
  <text x="330" y="96" font-size="12" text-anchor="end" fill="#b4232c">plt.gca()</text>
  <text x="330" y="130" font-size="11" text-anchor="end" fill="#6c7a93">plt.axhline</text>
  <text x="330" y="143" font-size="11" text-anchor="end" fill="#6c7a93">goes here</text>
</svg>
```
:::

::: context dynamic-pressure Why max-q comes where it does
Dynamic pressure $q = \tfrac{1}{2}\rho v^2$ grows with speed squared but shrinks as the air thins. Early in flight speed wins; later the thin air wins, so $q$ rises to a peak called **max-q** and falls. For the toy ascent, $v = at$ and $h = \tfrac{1}{2}at^2$, so $v^2 = 2ah$ and

$$
q = \tfrac{1}{2}(1.225)\,e^{-h/H}\,(2ah) \propto h\,e^{-h/H},
$$

which peaks exactly at $h = H = 8.5\,\mathrm{km}$, the atmosphere's scale height. The dashed line is the $35\,\mathrm{kPa}$ rating.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="170" x2="40" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="38.8" x2="340" y2="38.8" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="6 4"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40.0,170.0 47.5,169.1 55.0,166.4 62.5,161.9 70.0,155.8 77.5,148.3 85.0,139.6 92.5,129.9 100.0,119.4 107.5,108.5 115.0,97.4 122.5,86.4 130.0,75.7 137.5,65.7 145.0,56.5 152.5,48.3 160.0,41.2 167.5,35.5 175.0,31.1 182.5,28.2 190.0,26.6 197.5,26.5 205.0,27.6 212.5,30.0 220.0,33.5 227.5,38.1 235.0,43.4 242.5,49.5 250.0,56.1 257.5,63.2 265.0,70.5 272.5,78.0 280.0,85.5 287.5,92.8 295.0,100.0 302.5,107.0 310.0,113.6 317.5,119.8 325.0,125.6 332.5,131.0 340.0,135.9"/>
  <text x="40" y="186" font-size="11" text-anchor="middle" fill="#1f2a44">0</text>
  <text x="194.5" y="186" font-size="11" text-anchor="middle" fill="#1f2a44">41 s</text>
  <text x="340" y="186" font-size="11" text-anchor="middle" fill="#1f2a44">80 s</text>
  <text x="336" y="32" font-size="11" text-anchor="end" fill="#b4232c">35 kPa</text>
  <text x="194.5" y="18" font-size="11" text-anchor="middle" fill="#1d6fd1">38.3 kPa</text>
</svg>
```
:::

::: context compose-word Composing, like building blocks
To compose is to build something from parts that keep working when you combine them. A plotting function that takes an Axes is one such part: it does not care whether it is the only panel or one of six. In the next lesson `plt.subplots(6, 1, sharex=True)` hands back six Axes, and the six-panel flight review becomes six calls to six small functions, one per panel, each tested on its own.
:::

::: context backend The Agg in matplotlib.use
Agg is short for Anti-Grain Geometry, a C++ drawing library matplotlib uses to turn paths into smooth anti-aliased pixels. The interactive backends (for a window on your desktop, or a notebook) draw with Agg too and then show the result on screen. On a build server or a cluster node there is no screen, so a script that asks for a window fails or hangs. Choosing Agg says "draw into memory only", which is all a script that saves files needs.
:::

::: context figure-leak Why pyplot keeps figures alive
pyplot remembers every figure it creates so that `plt.show()` can display them all at the end of an interactive session. That memory is the price of the convenience. A figure with a few long telemetry traces can hold tens of megabytes of arrays and rendering buffers, so a loop over a few hundred cases fills a server's memory surprisingly fast. The setting behind the warning is `figure.max_open_warning`, which defaults to 20.
:::
