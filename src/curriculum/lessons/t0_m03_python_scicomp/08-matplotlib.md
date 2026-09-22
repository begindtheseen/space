---
id: l08-matplotlib
title: "matplotlib: figures a design review will accept"
minutes: 21
covers:
  - matplotlib and publication-grade plots
---

A trajectory analysis ends as a figure. The review board does not read your arrays; it reads a plot of altitude against time with a $3\sigma$ band, a ground track over a keep-out zone, an energy-drift curve that is flat when the propagator is right. If the axis has no units, the reader has to guess whether the miss distance is metres or kilometres. If the title does not say which initial conditions produced the curve, the figure cannot be checked six months later. A plot that lacks these things is not wrong, but it is not evidence.

matplotlib is the plotting library of scientific Python. It is large and its documentation shows a dozen ways to do everything; this lesson shows one way — the object-oriented interface, a figure built in a script by a function, saved to a file at a stated resolution — and the small set of calls that turn a default plot into a publication-grade one. The module's objective is to *produce publication-grade plots of trajectories and time histories*, and its build exercise asks for a 3D trajectory with its ground track and a stacked time-history panel, saved to PNG at 200 dpi from a script. Everything needed for that is here.

## Figures and axes

A matplotlib *Figure* is the canvas — the whole image that ends up in the file. An *Axes* is one plot inside it, with its own x- and y-axis, title and legend; a figure may hold several. Every line, marker, text and patch you draw is an *Artist* owned by an Axes. Create both at once and draw on the Axes:

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

`plt.subplots` returns the figure and its axes; from then on you call methods on `ax` and `fig`. You will also see the older *pyplot state-machine* style — `plt.plot`, `plt.xlabel` — which draws on whatever axes is "current". It works for a one-line sketch and fails as soon as a figure has two panels, because "current" is whichever was touched last. Use `ax.` methods throughout, and the code says exactly which panel each command affects.

`figsize` is in inches, and text sizes are in points, so the same figure with `figsize=(3, 2)` has proportionally larger-looking text than with `figsize=(6, 4)`. Decide the final width on the page — a single column is about $3.5\,\mathrm{in}$, a full width about $7\,\mathrm{in}$ — and set `figsize` to that, so the fonts come out at their nominal size in the document instead of being shrunk to unreadability by the layout tool.

## What every axis needs

A quantity axis carries a label with the unit in brackets: `"altitude  [m]"`, `"speed  [m/s]"`, `"time since liftoff  [s]"`. The title, or a caption, states the case: initial conditions, model, tolerance, seed. Where several curves share an axis, each `ax.plot` call gets a `label=` and the axes gets `ax.legend()`. A grid (`ax.grid(True)`, or `ax.grid(True, which="both")` on a log axis) lets the reader read values. These four calls are the difference between a sketch and a figure, and they take ten seconds.

::: key
Every axis in a reviewable figure carries: a label with the unit in brackets (`ax.set_xlabel("time  [s]")`), a title or caption stating the case and its initial conditions, a legend when more than one curve is drawn, and a grid. Geometric plots use `ax.set_aspect("equal")`; quantities spanning decades use a log scale; the analytic value the curve should reach is drawn as a reference line.
:::

Limits and scales come next. `ax.set_xlim(0, 15)` and `ax.set_ylim(bottom=0)` control the window; matplotlib's automatic limits pad the data by 5 %, which is right for a time history and wrong for a plot that should start at zero. `ax.set_yscale("log")` is for anything spanning decades — an integrator's error against its tolerance, a power spectral density — and `ax.set_aspect("equal")` for anything geometric: a ground track, an orbit in the plane, a landing footprint. A circle drawn on unequal axes is an ellipse, and an orbit that looks eccentric because the axes are not equal has misled more than one reviewer.

```python
ax.set_xlim(0.0, 15.0)
ax.set_ylim(bottom=0.0)
ax.set_aspect("equal")                       # for geometric plots only
ax.set_yscale("log")                         # for quantities spanning decades
ax.axhline(254.93, color="0.5", ls="--", lw=1.0, label="analytic apex")
ax.annotate("apex", xy=(7.21, 254.93), xytext=(9.0, 230.0),
            arrowprops=dict(arrowstyle="->"))
```

`ax.axhline` and `ax.axvline` draw reference lines — an analytic value, a constraint, an event time — and `ax.annotate` points at a feature with an arrow. `color="0.5"` is mid-grey; `ls` and `lw` are line style and width. Use reference lines generously: a curve compared against the value it should reach is checkable; a curve alone is not.

## Line and marker styles

Each `ax.plot(x, y)` call draws a line in the next colour of the default cycle, `"C0"` through `"C9"`, ten colours chosen to be distinguishable and reasonably safe for colour-blind readers. Refer to them by name — `color="C1"` — so that "the second curve" is the same orange in every figure of a report. Line styles `"-"`, `"--"`, `":"` and `"-."` distinguish curves when the figure may be printed in black and white; markers `"o"`, `"s"`, `"^"` mark discrete samples, and `ax.plot(t, y, "o-", ms=3)` combines a small marker with a line to show both the samples and their trend.

Choose the plot type for the data. `ax.plot` for a continuous history. `ax.scatter(x, y, s=4, c=speed, cmap="viridis")` for a point cloud coloured by a third variable — add `fig.colorbar(mappable, ax=ax, label="speed  [m/s]")` so the colour has a unit. `ax.hist(R, bins=60, density=True)` for a Monte Carlo output, with `density=True` so a probability density can be overlaid on the same scale. `ax.fill_between(t, lo, hi, alpha=0.25)` for a $\pm 3\sigma$ band around a mean history. `ax.errorbar(x, y, yerr=sigma, fmt="o", capsize=2)` for measurements with uncertainties. `ax.step(t, mode, where="post")` for a discrete signal such as a guidance mode that holds its value between updates.

::: warning Do not plot a thousand curves
A Monte Carlo of $10^4$ trajectories plotted as $10^4$ lines is an opaque smear that takes a minute to render. Plot the mean and the $\pm 3\sigma$ band with `fill_between`, add ten or twenty individual runs in a thin light line (`lw=0.5, alpha=0.3`) for texture, and put the final-state distribution in a histogram. The figure should answer the question — how dispersed is this — not prove that you ran the cases.
:::

## Several panels

Time histories of related channels — altitude, speed, flight-path angle — belong in stacked panels that share the time axis, so a feature at $t = 40\,\mathrm{s}$ lines up in all of them:

```python
fig, axs = plt.subplots(3, 1, sharex=True, figsize=(6.5, 7.0), constrained_layout=True)
axs[0].plot(t, alt);    axs[0].set_ylabel("altitude  [m]")
axs[1].plot(t, speed);  axs[1].set_ylabel("speed  [m/s]")
axs[2].plot(t, gamma);  axs[2].set_ylabel("flight-path angle  [deg]")
axs[2].set_xlabel("time  [s]")
for ax in axs:
    ax.grid(True)
fig.suptitle("Ballistic arc, $v_0 = 100$ m/s, $\\theta_0 = 45^\\circ$, no drag")
```

`plt.subplots(3, 1, ...)` returns an *array* of axes; `sharex=True` ties the x-limits and zooming together and hides the redundant tick labels on the upper panels. `constrained_layout=True` (or `fig.tight_layout()` after drawing) stops labels from overlapping neighbouring panels. Only the bottom panel needs the x-label. For a grid — `plt.subplots(2, 2)` — `axs` is a 2D array indexed `axs[row, col]`, and `axs.flat` iterates over all of them.

Resist `ax.twinx()`, the second y-axis on the right, for anything but a genuinely paired quantity (altitude in metres and feet). Two unrelated quantities on twin axes invite the reader to compare their slopes, which have no common scale; a second panel is almost always clearer.

## 3D trajectories

Three-dimensional axes come from the `projection="3d"` keyword. They accept `plot`, `scatter` and `plot_surface`, take three coordinate arrays, and need two things a 2D plot does not: an equal aspect ratio in all three directions, and a projection of the curve onto a plane so the eye can read depth.

```python
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

`set_box_aspect((1, 1, 1))` makes the drawing box a cube; setting all three limits to the same span then makes a metre the same length along every axis, which is what "equal aspect" means in 3D. Without both, a trajectory $1000\,\mathrm{m}$ long and $250\,\mathrm{m}$ high is stretched to fill a box and the flight-path angle looks wrong. The ground track is the same $x, y$ with $z$ replaced by zeros — a dashed grey line that anchors the curve to the ground plane. `view_init` sets the camera elevation and azimuth so that the saved image has a chosen, reproducible viewpoint rather than the default one.

## Saving, resolution and reproducibility

`fig.savefig(path, dpi=200, bbox_inches="tight")` writes the figure. The format follows the extension: PNG for slides and web pages, PDF or SVG for anything that will be printed or embedded in a LaTeX document, because vector output stays sharp at any zoom and its text remains text. `dpi` matters only for raster formats; 200 dpi on a $6.5\,\mathrm{in}$ figure is 1300 pixels wide, sharp on a projector and modest on disk. `bbox_inches="tight"` trims the margins to the artists.

Defaults that apply to a whole report live in `rcParams`, set once at the top of the script:

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

Two rules make the output reproducible. First, the figure is made by a function in a `.py` file — `def make_trajectory_figure(sol) -> plt.Figure:` — that a script calls and saves; the workbench lesson explained why a notebook cell is not a record. Second, the function draws only from its arguments and the seed is fixed, so running the script twice gives the same file byte for byte. When a figure changes between commits, `git diff` on the script tells you why.

::: warning `plt.show()` in a script that also saves
`plt.show()` blocks until the window is closed, and on a headless machine — a build server, a remote cluster — it has no window to open. Save first, then show, and guard the show behind a flag or run with the non-interactive backend `matplotlib.use("Agg")` when generating figures in batch. Also call `plt.close(fig)` after saving inside a loop; every open figure stays in memory until it is closed.
:::

::: example Trajectory and time-history figure
Take the `solve_ivp` result of the ballistic arc from the last lesson, extended to three dimensions with a small crossrange velocity, and build the figure the exercise asks for. The state is `(x, y, z, vx, vy, vz)`; the derived channels are altitude $z$, speed $|\mathbf{v}|$ and flight-path angle $\gamma = \arctan\!\left(v_z / \sqrt{v_x^2 + v_y^2}\right)$.

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

Read the figure against the numbers: the altitude panel peaks at the dashed $254.9\,\mathrm{m}$ line at $t = 7.21\,\mathrm{s}$, the flight-path angle starts at $+45^\circ$, crosses zero at the apex and ends at $-45^\circ$, and the speed is symmetric about the apex with a minimum of $v_0\cos 45^\circ = 70.7\,\mathrm{m/s}$ — three independent checks of the integration that the reviewer can make by eye. The left panel's dashed ground track is a straight line, as it should be with no lateral force, and the equal-aspect box shows the arc four times longer than it is high. Every axis has a unit, and the title carries the initial conditions.
:::

::: example Monte Carlo dispersion figure
The range samples `R` from the NumPy lesson, $10^5$ shots at $30^\circ \pm 2^\circ$, become a histogram with the fitted normal and the $\pm 3\sigma$ limits:

```python
from scipy import stats

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

`density=True` scales the bars so that their area is one, matching the probability density on the y-axis (whose unit is therefore $1/\mathrm{m}$). The two dashed lines at $\mu \pm 3\sigma$ — near $883 \pm 107\,\mathrm{m}$ for this case, since the linearised $1\sigma$ is about $35.6\,\mathrm{m}$ — are the certification numbers, drawn where the reader can see how much of the histogram lies beyond them. The title records the statistics and the seed, so the figure is reproducible from the caption alone. If the histogram is visibly skewed relative to the fitted curve, the plot has told you that the $3\sigma$ figure from a normal assumption is unsafe, which is what the plot is for.
:::

::: warning Rainbow colour maps
`"jet"` and its relatives have uneven brightness: a step in value looks large in yellow and invisible in green, and the map is unreadable to colour-blind readers and in greyscale. Use `"viridis"` (the default), `"plasma"` or `"cividis"` for a quantity, and a diverging map such as `"RdBu"` only when the data has a meaningful zero in the middle.
:::

## Check yourself

::: check
A colleague's script uses `plt.plot`, `plt.xlabel` and `plt.title` to build a two-panel figure and the title keeps landing on the wrong panel. Explain why, and what to change.
:::

::: answer
The pyplot functions act on the *current* axes, which is whichever axes was created or drawn on most recently. After `plt.subplot(2, 1, 2)` or any call that touches the second panel, `plt.title` labels that panel. Switch to the object-oriented interface: `fig, (ax1, ax2) = plt.subplots(2, 1, sharex=True)` and then `ax1.set_title(...)`, `ax2.plot(...)`. Each call names the axes it acts on, so there is no hidden state to get wrong.
:::

::: check
An orbit plotted in the $xy$-plane looks noticeably elliptical although the eccentricity is 0.001. What is the most likely cause, and what one call fixes it?
:::

::: answer
The axes have different scales — matplotlib stretches the data to fill the figure's rectangle, so a circle spanning $\pm 6778\,\mathrm{km}$ in a $6 \times 4\,\mathrm{in}$ axes is drawn 1.5 times wider than it is tall. `ax.set_aspect("equal")` forces one data unit to the same length on both axes. For a 3D plot the equivalent is `ax.set_box_aspect((1, 1, 1))` together with equal limit spans on all three axes.
:::

::: check
You need a figure for a two-column paper, $3.4\,\mathrm{in}$ wide, and another for a slide, $10\,\mathrm{in}$ wide. What do you change between the two, and what do you leave alone?
:::

::: answer
Change `figsize` to the final printed width — `(3.4, 2.4)` and `(10, 5.6)` — so text keeps its nominal point size on the page instead of being scaled with the image; the slide version can also use a larger `font.size` and `lines.linewidth` through `rcParams`. Leave the data, the labels, the colours and the reference lines unchanged: the two figures should be recognisably the same plot. Save the paper version as PDF (vector) and the slide as PNG at 200 dpi or so; both from the same `make_figure` function, so any correction to the analysis propagates to both.
:::

::: check
A histogram of miss distances drawn with `ax.hist(R, bins=50)` and a fitted `stats.norm.pdf` overlaid on the same axes look nothing alike — the curve is a flat line near zero. What went wrong?
:::

::: answer
Without `density=True`, `hist` plots counts — heights of thousands — while `pdf` returns a probability density of order $1/\sigma \approx 0.003\,\mathrm{m^{-1}}$. They are on different scales. Pass `density=True` so the bar areas sum to one and the histogram is itself a density estimate, and the fitted curve overlays it directly; label the y-axis "probability density [1/m]".
:::

::: check
Why should the script that produces a report's figures set the seed, call `matplotlib.use("Agg")` and save before it shows?
:::

::: answer
The seed makes the Monte Carlo — and therefore the figure — reproducible, so a reviewer regenerating it gets the same picture. `"Agg"` is a non-interactive backend that renders to memory and files only, so the script runs identically on a laptop and on a headless build machine where an interactive window cannot be opened. Saving before showing guarantees the file exists even if the interactive window is closed early or never opens, and pairs naturally with `plt.close(fig)` so a loop over many cases does not leak figures.
:::

## Summary

| Task | Call |
| --- | --- |
| Create | `fig, ax = plt.subplots(figsize=(w_in, h_in))`; several: `plt.subplots(3, 1, sharex=True, constrained_layout=True)` |
| Draw | `ax.plot(x, y, label=...)`, `ax.scatter(x, y, c=z, cmap="viridis")`, `ax.hist(R, bins, density=True)`, `ax.fill_between(t, lo, hi, alpha=0.25)`, `ax.errorbar`, `ax.step` |
| Label | `ax.set_xlabel("time  [s]")`, `ax.set_ylabel(...)`, `ax.set_title(...)`, `fig.suptitle(...)`, `ax.legend()`, `ax.grid(True)` |
| Window | `ax.set_xlim`, `ax.set_ylim(bottom=0)`, `ax.set_yscale("log")`, `ax.set_aspect("equal")` |
| Reference | `ax.axhline(v, ls="--", color="0.5")`, `ax.axvline`, `ax.annotate(text, xy, xytext, arrowprops=...)` |
| Style | colours `"C0"`–`"C9"`; `ls`, `lw`, `ms`, `alpha`; `plt.rcParams.update({...})`; colour maps `viridis`, `RdBu` |
| 3D | `fig.add_subplot(projection="3d")`, `ax.plot(x, y, z)`, ground track `ax.plot(x, y, 0*z)`, `ax.set_box_aspect((1,1,1))` + equal spans, `ax.view_init(elev, azim)` |
| Save | `fig.savefig("name.png", dpi=200, bbox_inches="tight")`; PDF/SVG for print; `plt.close(fig)` |
| Reproduce | a `make_figure(...)` function in a `.py` script, fixed seed, `matplotlib.use("Agg")` for batch |

The last lesson brings in the data these figures are usually made from — CSV and HDF5 telemetry files — and the pandas and h5py calls that read them, clean them and line their channels up in time.
