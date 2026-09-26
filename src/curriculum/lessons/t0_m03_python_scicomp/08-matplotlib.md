---
id: l08-matplotlib
title: "matplotlib: figures a design review will accept"
minutes: 20
covers:
  - matplotlib and publication-grade plots
---

A trajectory analysis ends as a picture. The review board does not read your arrays. It reads a plot of altitude against time with a $3\sigma$ band, a ground track over a keep-out zone, an energy-drift curve that stays flat when the integrator is right.

Think of a figure as evidence in a courtroom. If an axis has no units, the reader has to guess whether the miss distance is meters or kilometers. If the title does not say which starting conditions made the curve, nobody can check it six months later. A plot missing these things is not wrong — but it is not evidence.

**matplotlib** is the plotting library of scientific Python. It is big, and its documentation shows a dozen ways to do everything. This lesson shows *one* way: build the figure with a function in a script, and save it to a file at a stated sharpness. Then it adds the small set of calls that turn a default plot into a publication-grade one. The module's build exercise asks for a 3D trajectory with its ground track and a stacked time-history panel, saved to PNG at 200 dpi from a script. Everything you need for that is here.

## Figures and axes

Picture a sheet of paper with one or more graphs drawn on it. In matplotlib the sheet is the **[[Figure|figure-anatomy]]** — the whole image that ends up in the file. Each graph on it is an **Axes**: one plot with its own x-axis, y-axis, title and legend. (Yes, "Axes" is singular here — one plot.) Every line, marker and piece of text you draw belongs to an Axes. Create both at once, then draw on the Axes:

```python
import numpy as np
import matplotlib.pyplot as plt

t = np.linspace(0.0, 14.42, 200)
z = 70.71 * t - 0.5 * 9.80665 * t**2          # altitude of a 100 m/s, 45 deg shot

fig, ax = plt.subplots(figsize=(6.0, 3.5))    # inches
ax.plot(t, z, label="drag-free")
ax.set_xlabel("time  [s]")
ax.set_ylabel("altitude  [m]")
ax.set_title("Ballistic arc, $v_0 = 100$ m/s, $\\theta_0 = 45^\\circ$")
ax.grid(True)
ax.legend()
fig.savefig("arc.png", dpi=200, bbox_inches="tight")
plt.show()
```

Line by line: `t` is 200 evenly spaced times; `z` is the height of a ball thrown upward at $70.71\,\mathrm{m/s}$ (the vertical part of $100\,\mathrm{m/s}$ at $45^\circ$). `plt.subplots` returns the figure and its axes. From then on you call methods on `ax` and `fig`, and the last lines label, save and show.

You will also see an older style — `plt.plot`, `plt.xlabel` — that draws on whichever axes is "current". It works for a one-line sketch and fails as soon as a figure has two panels, because "current" means whichever was touched last. Use `ax.` methods throughout, and the code says exactly which panel each command affects.

`figsize` is in inches, and text sizes are in **[[points|points-and-inches]]**, a printer's unit of $1/72$ of an inch. So the same plot with `figsize=(3, 2)` has text that looks twice as big, relative to the plot, as with `figsize=(6, 4)`. Decide the final width on the page first — a single column is about $3.5\,\mathrm{in}$, a full page width about $7\,\mathrm{in}$ — and set `figsize` to that. Then the fonts come out at their true size instead of being shrunk to unreadability when the figure is scaled to fit.

## What every axis needs

A quantity axis carries a label with the unit in brackets: `"altitude  [m]"`, `"speed  [m/s]"`, `"time since liftoff  [s]"`. The title, or a caption, states the case: starting conditions, model, tolerance, random seed. When several curves share an axis, each `ax.plot` call gets a `label=` and the axes gets `ax.legend()`. A grid, `ax.grid(True)`, lets the reader read values off the plot. These four calls are the difference between a sketch and a figure, and they take ten seconds.

::: key
Every axis in a reviewable figure carries: a label with the [[unit in brackets|units-matter]] (`ax.set_xlabel("time  [s]")`), a title or caption stating the case and its initial conditions, a legend when more than one curve is drawn, and a grid. Geometric plots use `ax.set_aspect("equal")`; quantities spanning decades use a log scale; the analytic value the curve should reach is drawn as a reference line.
:::

Next come the window and the scale:

- `ax.set_xlim(0, 15)` and `ax.set_ylim(bottom=0)` choose the window. matplotlib's automatic limits pad the data by $5\,\%$ — right for a time history, wrong for a plot that should start at zero.
- `ax.set_yscale("log")` is for anything spanning **decades** — several powers of ten, like an integrator's error against its tolerance. On a **[[log scale|log-scale]]** each equal step up the axis multiplies the value by ten.
- `ax.set_aspect("equal")` is for anything geometric: a ground track, an orbit, a landing footprint. It makes one meter the same length on both axes. [[A circle drawn on unequal axes is an ellipse|squashed-circle]], and an orbit that only *looks* eccentric because the axes are stretched has fooled more than one reviewer.

```python
ax.set_xlim(0.0, 15.0)
ax.set_ylim(bottom=0.0)
ax.set_aspect("equal")                       # for geometric plots only
ax.set_yscale("log")                         # for quantities spanning decades
ax.axhline(254.93, color="0.5", ls="--", lw=1.0, label="analytic apex")
ax.annotate("apex", xy=(7.21, 254.93), xytext=(9.0, 230.0),
            arrowprops=dict(arrowstyle="->"))
```

(This block shows the calls side by side; on a real plot you would pick the ones that fit.) `ax.axhline` and `ax.axvline` draw horizontal and vertical **reference lines** — an analytic value, a limit, an event time. `ax.annotate` points at a feature with an arrow. `color="0.5"` means mid-gray; `ls` and `lw` are line style and line width. Use reference lines generously. A curve drawn next to the value it should reach can be checked; a curve alone cannot.

## Line and marker styles

Each `ax.plot(x, y)` call draws in the next color of the default cycle, `"C0"` through `"C9"`: ten colors chosen to be told apart easily and reasonably safe for **[[color-blind readers|color-blindness]]**. Refer to them by name — `color="C1"` — so that "the second curve" is the same orange in every figure of a report.

Line styles `"-"`, `"--"`, `":"` and `"-."` (solid, dashed, dotted, dash-dot) tell curves apart when the figure is printed in black and white. Markers `"o"`, `"s"`, `"^"` (circle, square, triangle) mark individual samples. `ax.plot(t, y, "o-", ms=3)` combines a small marker (`ms` is marker size) with a line, showing both the samples and their trend.

Choose the plot type for the data:

- `ax.plot` for a continuous history.
- `ax.scatter(x, y, s=4, c=speed, cmap="viridis")` for a cloud of points colored by a third quantity. Add `fig.colorbar(mappable, ax=ax, label="speed  [m/s]")` so the color has a unit.
- `ax.hist(R, bins=60, density=True)` for Monte Carlo output. `density=True` scales the bars so a probability curve can sit on the same axes.
- `ax.fill_between(t, lo, hi, alpha=0.25)` for a $\pm 3\sigma$ band around a mean history. `alpha` is see-through-ness: $0$ invisible, $1$ solid.
- `ax.errorbar(x, y, yerr=sigma, fmt="o", capsize=2)` for measurements with uncertainties.
- `ax.step(t, mode, where="post")` for a signal that holds its value between updates, such as a guidance mode.

::: warning Do not plot a thousand curves
A Monte Carlo of $10^4$ trajectories drawn as $10^4$ lines is a solid smear that takes a minute to render. Plot the mean and the $\pm 3\sigma$ band with `fill_between`, add ten or twenty single runs as thin faint lines (`lw=0.5, alpha=0.3`) for texture, and put the final-state spread in a histogram. The figure should answer the question — how spread out is this? — not prove that you ran the cases.
:::

## Several panels

Related channels over time — altitude, speed, flight-path angle — belong in panels stacked like floors of a building, sharing one time axis, so a feature at $t = 40\,\mathrm{s}$ lines up in all of them:

```python
t = np.linspace(0.0, 14.42, 200)
vz = 70.71 - 9.80665 * t
alt = 70.71 * t - 0.5 * 9.80665 * t**2
speed = np.hypot(70.71, vz)
gamma = np.degrees(np.arctan2(vz, 70.71))

fig, axs = plt.subplots(3, 1, sharex=True, figsize=(6.5, 7.0), constrained_layout=True)
axs[0].plot(t, alt);    axs[0].set_ylabel("altitude  [m]")
axs[1].plot(t, speed);  axs[1].set_ylabel("speed  [m/s]")
axs[2].plot(t, gamma);  axs[2].set_ylabel("flight-path angle  [deg]")
axs[2].set_xlabel("time  [s]")
for ax in axs:
    ax.grid(True)
fig.suptitle("Ballistic arc, $v_0 = 100$ m/s, $\\theta_0 = 45^\\circ$, no drag")
```

The first lines compute the three channels for the same drag-free shot. The **flight-path angle** $\gamma$ ("gamma") is the angle of the velocity above the horizontal: `arctan2` of the vertical speed over the horizontal speed.

`plt.subplots(3, 1, ...)` returns an *array* of three axes. `sharex=True` ties their x-limits and zooming together and hides the repeated tick labels on the upper panels. `constrained_layout=True` (or `fig.tight_layout()` after drawing) stops labels from overlapping the next panel. Only the bottom panel needs the x-label. For a grid of panels — `plt.subplots(2, 2)` — `axs` is a 2D array indexed `axs[row, col]`, and `axs.flat` walks through all of them.

Avoid `ax.twinx()`, a second y-axis on the right, except for one quantity in two units (altitude in meters and feet). Two unrelated quantities on twin axes invite the reader to compare their slopes, which have no common scale. A second panel is almost always clearer.

## 3D trajectories

Three-dimensional axes come from the `projection="3d"` keyword. They take `plot`, `scatter` and `plot_surface` with three coordinate arrays. They need two things a 2D plot does not. The first is an equal aspect ratio in all three directions. The second is a shadow of the curve on the ground, so the eye can judge depth — the **ground track**, the path the vehicle passes over.

```python
x = np.linspace(0.0, 1015.8, 200)          # downrange
y = np.linspace(0.0, 88.9, 200)            # a little crossrange
z = 254.93 * (1.0 - (2.0 * x / 1015.8 - 1.0) ** 2)   # a parabolic arc

fig = plt.figure(figsize=(7.0, 6.0))
ax = fig.add_subplot(projection="3d")
ax.plot(x, y, z, color="C0", label="trajectory")
ax.plot(x, y, np.zeros_like(z), color="0.6", ls="--", label="ground track")   # projection on z = 0
ax.set_xlabel("x  [m]"); ax.set_ylabel("y  [m]"); ax.set_zlabel("z  [m]")
ax.set_box_aspect((1, 1, 1))                   # a cube, not a squashed box

span = max(np.ptp(x), np.ptp(y), np.ptp(z))    # ptp = max - min
mid = [(np.max(c) + np.min(c)) / 2 for c in (x, y, z)]
ax.set_xlim(mid[0] - span/2, mid[0] + span/2)
ax.set_ylim(mid[1] - span/2, mid[1] + span/2)
ax.set_zlim(mid[2] - span/2, mid[2] + span/2)
ax.view_init(elev=25, azim=-60)
ax.legend()
```

Here is what makes it "equal aspect". `set_box_aspect((1, 1, 1))` makes the drawing box a cube. Then all three limits get the same **span** — the biggest range of the three coordinates — centered on each coordinate's middle. Now a meter is the same length along every axis.

Without both steps, an arc $1000\,\mathrm{m}$ long and $250\,\mathrm{m}$ high gets stretched to fill a box, and its angle looks wrong. The ground track is the same $x, y$ with $z$ replaced by zeros: a dashed gray line that anchors the curve to the ground. `view_init` sets the camera's **elevation** (how high above the ground you look from) and **azimuth** (from which side), so the saved image always has the same chosen viewpoint.

## Saving, resolution and reproducibility

`fig.savefig(path, dpi=200, bbox_inches="tight")` writes the figure. The file type follows the extension:

- **PNG** is a **[[raster|raster-vector]]** image — a grid of colored dots, or pixels. Good for slides and web pages.
- **PDF** or **SVG** are **vector** images — stored as shapes and text, so they stay sharp at any zoom. Use them for anything printed or placed in a LaTeX document.

`dpi`, **dots per inch**, matters only for raster formats. $200$ dpi on a $6.5\,\mathrm{in}$ figure is $6.5 \times 200 = 1300$ pixels wide: sharp on a projector, modest on disk. `bbox_inches="tight"` trims the empty margins.

Settings that apply to a whole report live in `rcParams`, set once at the top of the script:

```python
plt.rcParams.update({
    "font.size": 10,
    "axes.labelsize": 10,
    "legend.fontsize": 9,
    "figure.dpi": 100,          # on-screen only; savefig sets its own dpi
    "savefig.dpi": 200,
    "axes.grid": True,
    "lines.linewidth": 1.5,
})
```

::: key
A publication-grade figure is produced by a function in a `.py` script, with `figsize` set to the final printed width in inches, saved with `fig.savefig(path, dpi=200, bbox_inches="tight")` — PNG for slides, PDF or SVG for print — and regenerated identically on every run.
:::

Two rules make the output reproducible — the same every time you run it.

First, the figure is made by a function in a `.py` file — `def make_trajectory_figure(sol) -> plt.Figure:` — that a script calls and saves. The workbench lesson explained why a notebook cell is not a record.

Second, the function draws only from its arguments, and any random seed is fixed. Running the script twice then gives the same picture — for PNG, the same file byte for byte. When a figure changes between commits, `git diff` on the script tells you why.

::: warning `plt.show()` in a script that also saves
`plt.show()` waits until you close the window. On a **[[headless|headless-agg]]** machine — a build server or remote cluster with no screen — there is no window to open. Save first, then show, and put the show behind a flag. Or pick the non-interactive backend with `matplotlib.use("Agg")` when making figures in batch. Also call `plt.close(fig)` after saving inside a loop: every open figure stays in memory until it is closed.
:::

::: example Trajectory and time-history figure
Take the ballistic arc from the last lesson, give it a small sideways velocity so it becomes three-dimensional, and build the figure the exercise asks for. The state is `(x, y, z, vx, vy, vz)`. The derived channels are altitude $z$, speed $|\mathbf{v}|$ and flight-path angle

$$
\gamma = \arctan\!\left(\frac{v_z}{\sqrt{v_x^2 + v_y^2}}\right),
$$

the climb angle of the velocity above the horizontal. First the integration, with a launch **heading** $\psi_0 = 5^\circ$ ("psi nought") off the $x$-axis:

```python
from scipy.integrate import solve_ivp
G0 = 9.80665
th, psi = np.radians(45.0), np.radians(5.0)
v0 = 100.0
y0 = [0.0, 0.0, 0.0,
      v0 * np.cos(th) * np.cos(psi), v0 * np.cos(th) * np.sin(psi), v0 * np.sin(th)]

def rhs(t, s):
    return [s[3], s[4], s[5], 0.0, 0.0, -G0]

def impact(t, s):
    return s[2]
impact.terminal, impact.direction = True, -1

sol = solve_ivp(rhs, (0.0, 60.0), y0, method="DOP853", rtol=1e-12, atol=1e-12,
                events=impact, t_eval=np.linspace(0.0, 14.4209, 400))
```

Then the figure function:

```python
def make_figure(sol):
    x, y, z, vx, vy, vz = sol.y
    t = sol.t
    speed = np.sqrt(vx**2 + vy**2 + vz**2)
    gamma = np.degrees(np.arctan2(vz, np.hypot(vx, vy)))

    fig = plt.figure(figsize=(12.0, 5.5), constrained_layout=True)
    ax3 = fig.add_subplot(1, 2, 1, projection="3d")
    ax3.plot(x, y, z, color="C0")
    ax3.plot(x, y, np.zeros_like(z), color="0.6", ls="--")
    ax3.set_xlabel("downrange x  [m]"); ax3.set_ylabel("crossrange y  [m]"); ax3.set_zlabel("altitude z  [m]")
    ax3.set_box_aspect((1, 1, 1))
    span = max(np.ptp(x), np.ptp(y), np.ptp(z))
    for setter, c in ((ax3.set_xlim, x), (ax3.set_ylim, y), (ax3.set_zlim, z)):
        m = (c.max() + c.min()) / 2
        setter(m - span / 2, m + span / 2)
    ax3.set_title("3-DOF ballistic trajectory")

    axs = [fig.add_subplot(3, 2, 2)]
    axs += [fig.add_subplot(3, 2, k, sharex=axs[0]) for k in (4, 6)]
    for ax, ch, lab in zip(axs, (z, speed, gamma),
                           ("altitude  [m]", "speed  [m/s]", "flight-path angle  [deg]")):
        ax.plot(t, ch, color="C0"); ax.set_ylabel(lab); ax.grid(True)
    for ax in axs[:-1]:
        ax.tick_params(labelbottom=False)         # time labels on the bottom panel only
    axs[0].axhline(254.93, color="0.5", ls="--", lw=1, label="analytic apex 254.9 m")
    axs[0].legend(loc="lower center")
    axs[2].axhline(0.0, color="0.5", lw=1)
    axs[2].set_xlabel("time  [s]")
    fig.suptitle(r"$v_0 = 100$ m/s, $\theta_0 = 45^\circ$, $\psi_0 = 5^\circ$, $g = 9.80665$ m/s$^2$, no drag")
    return fig

fig = make_figure(sol)
fig.savefig("trajectory.png", dpi=200, bbox_inches="tight")
```

The figure is split in two: the 3D view takes the left half (`add_subplot(1, 2, 1, ...)`), and three stacked panels fill the right half (positions 2, 4 and 6 of a 3-by-2 grid), all sharing the time axis of the first.

Now read the figure against the numbers you know:

- The altitude panel peaks at the dashed $254.9\,\mathrm{m}$ line, at $t = 7.21\,\mathrm{s}$.
- The flight-path angle starts at $+45^\circ$, crosses zero at the top, and ends at $-45^\circ$.
- The speed is symmetric about the top, with a minimum of $v_0\cos 45^\circ = 70.7\,\mathrm{m/s}$ — at the top only the horizontal speed is left.

That is three independent checks of the integration that a reviewer can make by eye. On the left, the dashed ground track is a straight line, as it must be with no sideways force. The equal-aspect box shows the arc four times longer than it is high ($1019.7 / 254.9 = 4.0$). Every axis has a unit, and the title carries the starting conditions.
:::

::: example Monte Carlo dispersion figure
The NumPy lesson fired $10^5$ shots at $30^\circ \pm 2^\circ$ and $100\,\mathrm{m/s}$. Their ranges `R` become a histogram, with a fitted bell curve and the $\pm 3\sigma$ limits:

```python
from scipy import stats

rng = np.random.default_rng(0)
R = 100.0**2 * np.sin(2 * np.radians(rng.normal(30.0, 2.0, 100_000))) / 9.80665

mu, sigma = R.mean(), R.std()
fig, ax = plt.subplots(figsize=(6.5, 4.0))
ax.hist(R, bins=80, density=True, color="C0", alpha=0.6, label=f"{len(R):,} samples")
grid = np.linspace(R.min(), R.max(), 400)
ax.plot(grid, stats.norm.pdf(grid, mu, sigma), color="C3", label="normal fit")
for k in (-3, 3):
    ax.axvline(mu + k * sigma, color="0.4", ls="--", lw=1)
ax.set_xlabel("range  [m]")
ax.set_ylabel("probability density  [1/m]")
ax.set_title(f"Range dispersion: mean {mu:.1f} m, 1σ {sigma:.1f} m, seed 0")
ax.legend()
fig.savefig("range_dispersion.png", dpi=200, bbox_inches="tight")
```

`density=True` scales the bars so their total area is one. That matches a **[[probability density|density-histogram]]** on the y-axis, whose unit is therefore $1/\mathrm{m}$.

The two dashed lines at $\mu \pm 3\sigma$ (mean plus or minus three sigmas) are the certification numbers. Here they sit near $881 \pm 107\,\mathrm{m}$: the sample $\sigma$ is about $35.7\,\mathrm{m}$, and $3 \times 35.7 \approx 107$. Sanity check: a small angle change $\delta\theta$ changes the range by about $(2v_0^2\cos 2\theta/g)\,\delta\theta$, which for $\delta\theta = 2^\circ = 0.0349\,\mathrm{rad}$ is about $35.6\,\mathrm{m}$ — a match. The mean sits a little below the $883.1\,\mathrm{m}$ of an exact $30^\circ$ shot, because the range curve bends over: a $2^\circ$ error either way loses a bit more on one side than it gains on the other.

The title records the statistics and the seed, so the figure can be rebuilt from its caption alone. If the histogram looked lopsided next to the bell curve, the plot would be telling you that a $3\sigma$ number based on a normal assumption is unsafe — which is exactly what the plot is for.
:::

::: warning Rainbow color maps
`"jet"` and its rainbow relatives have uneven brightness. A step in value looks large in yellow and invisible in green, and the map is unreadable to color-blind readers and in grayscale. Use `"viridis"` ([[the default|viridis]]), `"plasma"` or `"cividis"` for a quantity. Use a two-sided map such as `"RdBu"` only when the data has a meaningful zero in the middle.
:::

## Check yourself

::: check
A colleague builds a two-panel figure with `plt.plot`, `plt.xlabel` and `plt.title`, and the title keeps landing on the wrong panel. Explain why, and what to change.
:::

::: answer
The `plt.` functions act on the *current* axes — whichever was created or drawn on most recently. After any call that touches the second panel, `plt.title` labels that panel.

Switch to the object style: `fig, (ax1, ax2) = plt.subplots(2, 1, sharex=True)`, then `ax1.set_title(...)` and `ax2.plot(...)`. Each call names the axes it acts on, so there is no hidden state to get wrong.
:::

::: check
An orbit plotted in the $xy$-plane looks noticeably oval, although its eccentricity is only $0.001$. What is the most likely cause, and what one call fixes it?
:::

::: answer
The two axes have different scales. matplotlib stretches the data to fill the plot's rectangle, so a circle spanning $\pm 6778\,\mathrm{km}$ in a $6 \times 4\,\mathrm{in}$ axes is drawn about $1.5$ times wider than tall ($6/4 = 1.5$).

`ax.set_aspect("equal")` forces one data unit to the same length on both axes. For a 3D plot the equivalent is `ax.set_box_aspect((1, 1, 1))` together with equal spans on all three axes.
:::

::: check
You need one figure for a two-column paper, $3.4\,\mathrm{in}$ wide, and one for a slide, $10\,\mathrm{in}$ wide. What do you change between the two, and what do you leave alone?
:::

::: answer
Change `figsize` to the final printed width — `(3.4, 2.4)` and `(10, 5.6)` — so text keeps its true point size on the page instead of being scaled with the image. The slide version can also use a bigger `font.size` and `lines.linewidth` through `rcParams`.

Leave the data, labels, colors and reference lines alone: the two should be recognizably the same plot. Save the paper version as PDF (vector) and the slide as PNG at about 200 dpi. Make both from the same `make_figure` function, so any fix to the analysis reaches both.
:::

::: check
A histogram of miss distances drawn with `ax.hist(R, bins=50)` and a fitted `stats.norm.pdf` on the same axes look nothing alike — the curve is a flat line near zero. What went wrong?
:::

::: answer
Without `density=True`, `hist` plots *counts* — bar heights in the thousands. `pdf` returns a probability density, of order $1/\sigma \approx 0.003\,\mathrm{m^{-1}}$. They are on wildly different scales.

Pass `density=True` so the bar areas add up to one. The histogram is then itself a density estimate, the fitted curve lies right on it, and the y-axis label becomes "probability density [1/m]".
:::

::: check
Why should the script that makes a report's figures set the random seed, call `matplotlib.use("Agg")`, and save before it shows?
:::

::: answer
The seed makes the Monte Carlo — and therefore the figure — reproducible: a reviewer who reruns it gets the same picture.

`"Agg"` is a non-interactive backend that draws into memory and files only. So the script runs the same way on a laptop and on a headless build machine that cannot open a window.

Saving before showing guarantees the file exists even if the window is closed early or never opens. It pairs naturally with `plt.close(fig)`, so a loop over many cases does not pile up open figures.
:::

## Summary

| Task | Call |
| --- | --- |
| Create | `fig, ax = plt.subplots(figsize=(w_in, h_in))`; several: `plt.subplots(3, 1, sharex=True, constrained_layout=True)` |
| Draw | `ax.plot(x, y, label=...)`, `ax.scatter(x, y, c=z, cmap="viridis")`, `ax.hist(R, bins, density=True)`, `ax.fill_between(t, lo, hi, alpha=0.25)`, `ax.errorbar`, `ax.step` |
| Label | `ax.set_xlabel("time  [s]")`, `ax.set_ylabel(...)`, `ax.set_title(...)`, `fig.suptitle(...)`, `ax.legend()`, `ax.grid(True)` |
| Window | `ax.set_xlim`, `ax.set_ylim(bottom=0)`, `ax.set_yscale("log")`, `ax.set_aspect("equal")` |
| Reference | `ax.axhline(v, ls="--", color="0.5")`, `ax.axvline`, `ax.annotate(text, xy, xytext, arrowprops=...)` |
| Style | colors `"C0"`–`"C9"`; `ls`, `lw`, `ms`, `alpha`; `plt.rcParams.update({...})`; color maps `viridis`, `RdBu` |
| 3D | `fig.add_subplot(projection="3d")`, `ax.plot(x, y, z)`, ground track `ax.plot(x, y, 0*z)`, `ax.set_box_aspect((1,1,1))` + equal spans, `ax.view_init(elev, azim)` |
| Flight-path angle | $\gamma = \arctan\!\left(v_z / \sqrt{v_x^2 + v_y^2}\right)$: `np.arctan2(vz, np.hypot(vx, vy))` |
| Save | `fig.savefig("name.png", dpi=200, bbox_inches="tight")`; PDF/SVG for print; `plt.close(fig)` |
| Reproduce | a `make_figure(...)` function in a `.py` script, fixed seed, `matplotlib.use("Agg")` for batch |

The last lesson brings in the data these figures are usually made from — CSV and HDF5 telemetry files — and the pandas and h5py calls that read them, clean them and line their channels up in time.

::: context figure-anatomy The sheet and the graphs on it
The Figure is the whole image. Each Axes is one plot inside it, with its own axis lines, labels and legend. A figure with two stacked plots has one Figure and two Axes, and `fig.suptitle` writes above all of them.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="10" width="340" height="170" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="180" y="28" font-size="12" text-anchor="middle" fill="#1f2a44">Figure (fig) — suptitle here</text>
  <rect x="60" y="40" width="270" height="55" fill="#fff" stroke="#1d6fd1" stroke-width="2"/>
  <rect x="60" y="110" width="270" height="55" fill="#fff" stroke="#1d6fd1" stroke-width="2"/>
  <polyline points="60,90 120,80 200,76 330,88" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <polyline points="60,160 140,150 230,158 330,146" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <text x="195" y="62" font-size="12" text-anchor="middle" fill="#1d6fd1">axs[0]</text>
  <text x="195" y="132" font-size="12" text-anchor="middle" fill="#1d6fd1">axs[1]</text>
  <text x="35" y="70" font-size="11" text-anchor="middle" fill="#6c7a93">label</text>
  <text x="35" y="140" font-size="11" text-anchor="middle" fill="#6c7a93">label</text>
</svg>
```
:::

::: context points-and-inches A printer's unit
Type has been measured in points since the days of metal letters. Today one point is exactly $1/72$ of an inch, about $0.35\,\mathrm{mm}$. A 10-point label is therefore about $3.5\,\mathrm{mm}$ tall on paper — but only if the figure is printed at the size you drew it. Shrink a $10\,\mathrm{in}$ figure into a $3.5\,\mathrm{in}$ column and that label becomes about $3.5$ points: too small to read.
:::

::: context units-matter A lost spacecraft and a missing unit
In 1999 NASA lost the Mars Climate Orbiter. Ground software from one team reported thruster impulse in pound-force seconds; the navigation software expected newton-seconds, a factor of about $4.45$ apart. The small error in each firing added up until the spacecraft passed far too low over Mars and was lost. Units written next to every number are a cheap habit that guards against exactly this.
:::

::: context log-scale Equal steps mean times ten
On an ordinary axis each tick adds the same amount. On a log axis each tick *multiplies* by the same amount, usually ten. That lets a single plot show an error of $10^-3$ and one of $10^-12$ side by side, where a normal axis would squash the small one flat against zero.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 90" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="45" x2="330" y2="45" stroke="#1f2a44" stroke-width="2"/>
  <g stroke="#1f2a44" stroke-width="2">
    <line x1="40" y1="38" x2="40" y2="52"/><line x1="110" y1="38" x2="110" y2="52"/><line x1="180" y1="38" x2="180" y2="52"/>
    <line x1="250" y1="38" x2="250" y2="52"/><line x1="320" y1="38" x2="320" y2="52"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="70">1</text><text x="110" y="70">10</text><text x="180" y="70">100</text><text x="250" y="70">1000</text><text x="320" y="70">10000</text>
  </g>
  <text x="180" y="24" font-size="12" fill="#1d6fd1" text-anchor="middle">each equal step is × 10</text>
</svg>
```
:::

::: context squashed-circle The same circle, two boxes
Both shapes below are the same circle of data. On the left, one data unit has the same length across and up. On the right, the plot box is $1.5$ times wider than tall and the data was stretched to fill it, so the circle comes out $1.5$ times wider than tall.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="30" y="15" width="100" height="100" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="80" cy="65" r="40" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <rect x="180" y="15" width="150" height="100" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <ellipse cx="255" cy="65" rx="60" ry="40" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="80" y="136" font-size="12" text-anchor="middle" fill="#1f2a44">aspect equal</text>
  <text x="255" y="136" font-size="12" text-anchor="middle" fill="#1f2a44">stretched 6 × 4 box</text>
</svg>
```
:::

::: context color-blindness Not everyone sees red and green
About one man in twelve, and roughly one woman in two hundred, of Northern European descent has some red-green color vision deficiency. For them a red curve and a green curve can look almost the same. A report with a few dozen readers probably has one such reader. Pairing color with line style, and using color maps whose brightness changes steadily, keeps the figure readable for everyone — and on a black-and-white printout too.
:::

::: context raster-vector Dots versus drawing instructions
A raster file stores a grid of colored squares. Zoom in and a slanted line turns into a staircase. A vector file stores the instruction "draw a line from here to there", so the program redraws it sharply at any zoom.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="100" width="10" height="10" fill="#1d6fd1"/><rect x="30" y="100" width="10" height="10" fill="#1d6fd1"/><rect x="40" y="90" width="10" height="10" fill="#1d6fd1"/><rect x="50" y="90" width="10" height="10" fill="#1d6fd1"/><rect x="60" y="80" width="10" height="10" fill="#1d6fd1"/><rect x="70" y="80" width="10" height="10" fill="#1d6fd1"/><rect x="80" y="70" width="10" height="10" fill="#1d6fd1"/><rect x="90" y="70" width="10" height="10" fill="#1d6fd1"/><rect x="100" y="60" width="10" height="10" fill="#1d6fd1"/><rect x="110" y="60" width="10" height="10" fill="#1d6fd1"/><rect x="120" y="50" width="10" height="10" fill="#1d6fd1"/><rect x="130" y="50" width="10" height="10" fill="#1d6fd1"/>
  <line x1="200" y1="110" x2="320" y2="50" stroke="#1d6fd1" stroke-width="3"/>
  <text x="80" y="132" font-size="12" text-anchor="middle" fill="#1f2a44">raster (PNG), zoomed</text>
  <text x="260" y="132" font-size="12" text-anchor="middle" fill="#1f2a44">vector (PDF, SVG), zoomed</text>
</svg>
```
:::

::: context headless-agg Drawing with no screen
A headless computer has no monitor attached — most servers and build machines run this way. matplotlib's "backend" is the part that turns a figure into pixels or a window. "Agg" is named after Anti-Grain Geometry, the drawing library it is built on, and it only ever draws into memory and files, so it never needs a screen.
:::

::: context density-histogram Why the area has to be one
Probabilities of all possible outcomes add up to one, so the area under a probability density curve is one. For a histogram to sit on the same curve, its bars must also have total area one: each bar's height becomes (fraction of samples in the bar) ÷ (bar width). That division by a width in meters is why the y-axis unit is $1/\mathrm{m}$.
:::

::: context viridis A color map built on purpose
Viridis was designed in 2015 by Stéfan van der Walt and Nathaniel Smith for matplotlib. Its brightness rises evenly from dark purple through blue and green to yellow, so equal steps in value look like equal steps in color, even to most color-blind readers and in grayscale. It became matplotlib's default color map in version 2.0.
:::
