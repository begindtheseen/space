---
id: l05-ticks-labels-and-legends
title: Ticks, labels, annotations and legends
minutes: 20
covers:
  - Ticks, locators, formatters, datetime axes
  - Text, annotation, legends outside axes, units in every axis label
---

Look at a school ruler. It has long marks with numbers every centimeter and short unnumbered marks every millimeter. Somewhere it says "cm". Now look at a road map. It has a scale bar, a box in the corner that says which line is a highway and which is a railroad, and a few names written right next to the towns they belong to. None of this is the data. All of it is how you read the data.

A plot needs the same things. The marks along each axis are **ticks**. The words along each axis are **axis labels**, and they must carry the unit. The box that says which line is which is the **legend**. Words and arrows placed on the plot itself are **annotations**. Get these right and a reviewer understands the figure in five seconds. Get them wrong and the reviewer either asks you, which costs a meeting, or guesses, which can cost much more.

This lesson shows how Matplotlib decides where ticks go and what they say, how to put real clock times on an axis, how to point at the one thing that matters with text and arrows, how to move a legend out of the way of the data, and why every axis label in aerospace carries its unit.

## Where ticks go and what they say

Every axis has two kinds of tick. **Major ticks** are the long ones, usually with a number. **Minor ticks** are the short ones in between, usually without. Each kind is controlled by two separate objects:

- a **locator** decides *where* the ticks go;
- a **formatter** decides *what text* is written at each tick.

Keeping the two apart is the whole trick. You can say "a tick every 30 seconds" without caring how it is written, and "write times as minutes and seconds" without caring where the ticks are. You attach them to an axis with `ax.xaxis.set_major_locator(...)`, `ax.xaxis.set_minor_locator(...)` and `ax.xaxis.set_major_formatter(...)`. The vertical axis is `ax.yaxis`.

The **[[anatomy of an axis|axis-anatomy]]** has more parts than people expect, but these two objects do most of the work.

### The locators you will use

All of these live in `matplotlib.ticker`.

- `MultipleLocator(30)` puts a tick at every multiple of 30. Good for time in seconds, angles in degrees, anything with a natural step.
- `MaxNLocator(nbins=5)` picks "nice" numbers so there are at most about five intervals. This is close to what Matplotlib does by default. Add `integer=True` for counts, like a run number, so you never see a tick at 2.5.
- `AutoMinorLocator(n)` splits each major gap into `n` equal minor gaps.
- `FixedLocator([...])` puts ticks exactly where you list them, such as at staging times.
- `LogLocator` places ticks on log axes; you met its work in the last lesson.

### The formatters you will use

- `StrMethodFormatter("{x:.2f}")` writes each value with a Python format string. The value is always called `x` inside the braces.
- `FuncFormatter(f)` calls your own function `f(x, pos)`, where `x` is the tick value and `pos` its position number, and writes whatever string it returns.
- `EngFormatter(unit="Hz")` writes engineering prefixes, so 2500 becomes "2.5 kHz".
- `PercentFormatter(xmax=1.0)` writes $0.25$ as "25%".

```python
from matplotlib.ticker import EngFormatter, StrMethodFormatter

eng = EngFormatter(unit="Hz")
print(eng(2500.0), "|", eng(0.004))
two_dp = StrMethodFormatter("{x:.2f}")
print(two_dp(3.14159))
# 2.5 kHz | 4 mHz
# 3.14
```

A formatter is an object you can call with a number, so you can test it on its own like this before putting it on a plot.

::: key
A locator decides where ticks go; a formatter decides what each tick says. Set them per axis with `ax.xaxis.set_major_locator`, `set_minor_locator` and `set_major_formatter`.
:::

::: example Ticks every 30 seconds, written as mission time
A launch review wants time written the way the countdown clock writes it: **[[T-plus|t-plus]]** minutes and seconds. The data is in seconds since liftoff, from $0$ to $200\,\mathrm{s}$.

```python
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from matplotlib.ticker import MultipleLocator, AutoMinorLocator, FuncFormatter

t = np.linspace(0.0, 200.0, 2001)                 # s since liftoff
q = 35.0 * np.exp(-((t - 72.0) / 30.0) ** 2)      # kPa, a dynamic-pressure hump

fig, ax = plt.subplots(figsize=(6, 3), layout="constrained")
ax.plot(t, q)
ax.set_xlim(0.0, 200.0)

ax.xaxis.set_major_locator(MultipleLocator(30.0))   # a major tick every 30 s
ax.xaxis.set_minor_locator(AutoMinorLocator(3))     # 3 minor gaps per major gap

def t_plus(x, pos):
    m, s = divmod(int(round(x)), 60)
    return f"T+{m:02d}:{s:02d}"

ax.xaxis.set_major_formatter(FuncFormatter(t_plus))
ax.set_xlabel("Time since liftoff (min:s)")
ax.set_ylabel("Dynamic pressure (kPa)")

ticks = [float(x) for x in ax.get_xticks() if 0.0 <= x <= 200.0]
print(ticks)
print([t_plus(x, None) for x in ticks])
fig.savefig("tplus.png", dpi=100)
# [0.0, 30.0, 60.0, 90.0, 120.0, 150.0, 180.0]
# ['T+00:00', 'T+00:30', 'T+01:00', 'T+01:30', 'T+02:00', 'T+02:30', 'T+03:00']
```

**Step 1, where.** `MultipleLocator(30.0)` asks for every multiple of 30 inside the view: $0, 30, 60, \dots, 180$. The next multiple, 210, is past the $200\,\mathrm{s}$ limit.

**Step 2, minor ticks.** `AutoMinorLocator(3)` cuts each 30-second gap into 3 pieces, so there is a short tick every 10 seconds.

**Step 3, what.** `divmod(n, 60)` returns the whole minutes and the leftover seconds. For $90$ that is $(1, 30)$, written "T+01:30". The `:02d` pads each number to two digits.

**Sanity check.** Seven labels for a 200-second window, each 30 seconds apart: $180/30 + 1 = 7$. The label at $90\,\mathrm{s}$ reads one and a half minutes, as it should.

The axis label still says what the numbers mean: "Time since liftoff (min:s)". A formatter changes how the numbers look, not what they are.
:::

::: warning Ticks outside the view
`ax.get_xticks()` can return ticks that fall slightly outside the axis limits; Matplotlib computes a few extra and does not draw them. That is why the example filters to the range $0$ to $200$ before printing. If your formatter must handle negative values (a countdown before liftoff), write it so it can.
:::

## Clock time on an axis

Telemetry arrives stamped with real dates and times. Matplotlib can plot NumPy `datetime64` values and pandas timestamps directly. Behind the scenes it turns each time into a plain number: a **[[date number|date-number]]**, the count of days since midnight on 1 January 1970. Then the tick machinery works on those numbers, with locators and formatters from `matplotlib.dates`.

- `mdates.AutoDateLocator()` picks sensible steps: seconds, minutes, hours or days, depending on the span.
- `mdates.MinuteLocator(byminute=range(0, 60, 2))` puts a tick every two minutes, on the even minutes.
- `mdates.DateFormatter("%H:%M:%S")` writes times with the same codes as Python's `strftime`: `%H` hours, `%M` minutes, `%S` seconds, `%Y-%m-%d` a date.
- `mdates.ConciseDateFormatter(locator)` writes the shortest labels that are still clear, and puts the date once at the edge instead of on every tick.

::: example A ground-station pass in UTC
A ground antenna tracks a satellite for ten minutes, sampling its elevation once a second.

```python
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import numpy as np

start = np.datetime64("2026-03-14T06:12:00")
t = start + np.arange(0, 600, 1).astype("timedelta64[s]")   # 10 min at 1 Hz
elev = 80.0 * np.sin(np.pi * np.arange(600) / 600.0)        # deg, a ground-station pass

fig, ax = plt.subplots(figsize=(6, 3), layout="constrained")
ax.plot(t, elev)
locator = mdates.MinuteLocator(byminute=range(0, 60, 2))    # every 2 minutes
ax.xaxis.set_major_locator(locator)
ax.xaxis.set_major_formatter(mdates.DateFormatter("%H:%M"))
ax.set_xlabel("Time (UTC, 2026-03-14)")
ax.set_ylabel("Elevation above horizon (deg)")

fig.canvas.draw()
print([lab.get_text() for lab in ax.get_xticklabels()])
print(round(ax.get_xlim()[0], 4))
# ['06:12', '06:14', '06:16', '06:18', '06:20', '06:22']
# 20526.258
```

**Step 1.** `start + np.arange(...)` builds 600 timestamps one second apart, from 06:12:00 to 06:21:59.

**Step 2.** The locator ticks every even minute. The pass starts at 06:12 and the view stretches a little past the end, so the ticks land at 06:12, 06:14, … 06:22.

**Step 3.** `fig.canvas.draw()` makes Matplotlib lay out the figure, so the tick labels exist and can be read back.

**Step 4, the hidden number.** The left edge of the view is about $20526.258$. That is days since 1970: day 20526 is 14 March 2026, and $0.258$ of a day is $0.258 \times 24 \approx 6.2$ hours, which is 06:12. The dates became ordinary numbers, and the formatter turned them back into clock times.
:::

::: warning Say which clock
A time axis without a time zone is ambiguous. Ground systems usually log in UTC, but vehicles often count GPS time or mission elapsed time, and these differ. Write the time scale in the label, "Time (UTC)" or "Time since liftoff (s)", and never let a local-time conversion sneak in. NumPy `datetime64` values carry no time zone at all, so the label is the only place the reader can learn it.
:::

## Text and annotation

A figure should show three things: the measured quantity, the limit or prediction it is judged against, and the gap between them. Without the limit, the reader has to remember the requirement to know whether the curve is good.

::: key
An engineering figure shows the measured quantity, the requirement or predicted envelope, and the margin between them. A plot that shows data but hides the requirement is missing the limit line; otherwise the reader has to remember the spec to interpret the picture.
:::

Matplotlib gives you three tools for words on a plot.

- `ax.axhline(y)` and `ax.axvline(x)` draw a line all the way across at one value. Use them for limits, requirements and events such as staging.
- `ax.text(x, y, "words")` writes text at a position.
- `ax.annotate("words", xy=..., xytext=..., arrowprops=...)` writes text and draws an arrow from the text to a point.

The subtle part is *which coordinates* a position is measured in. The **[[coordinate systems|coordinate-systems]]** you need are three.

- **Data coordinates**, the default: $(72, 35)$ means time 72, value 35. Text placed this way sticks to the data.
- **Axes coordinates**, with `transform=ax.transAxes`: $(0, 0)$ is the bottom left corner of the axes and $(1, 1)$ the top right. Text placed this way stays in the corner however the data changes.
- **Offset points**, with `textcoords="offset points"` in `annotate`: the text sits a fixed distance from the point, measured in points (1 point is $1/72$ inch). The label keeps the same small gap from its target at any zoom.

::: example Max-Q against its limit
The **[[max-Q|max-q]]** moment, when aerodynamic load on a climbing rocket peaks, is a classic thing to annotate. The structural limit here is $40\,\mathrm{kPa}$.

```python
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

t = np.linspace(0.0, 200.0, 2001)                 # s since liftoff
q = 35.0 * np.exp(-((t - 72.0) / 30.0) ** 2)      # kPa
q_limit = 40.0                                    # kPa, the structural limit

i = np.argmax(q)
t_max, q_max = t[i], q[i]
margin = q_limit - q_max
print(f"max-Q {q_max:.1f} kPa at T+{t_max:.1f} s, margin {margin:.1f} kPa")
# max-Q 35.0 kPa at T+72.0 s, margin 5.0 kPa

fig, ax = plt.subplots(figsize=(6, 3), layout="constrained")
ax.plot(t, q, label="Flight 7 (measured)")
ax.axhline(q_limit, color="C3", ls="--", label="Structural limit")
ax.annotate(f"max-Q {q_max:.1f} kPa",
            xy=(t_max, q_max),                 # the point, in data coordinates
            xytext=(40, -30), textcoords="offset points",
            arrowprops=dict(arrowstyle="->"))
ax.annotate("", xy=(t_max, q_limit), xytext=(t_max, q_max),
            arrowprops=dict(arrowstyle="<->", color="0.4"))
ax.text(t_max + 3, 0.5 * (q_max + q_limit), f"margin {margin:.1f} kPa",
        va="center", fontsize=9)
ax.text(0.98, 0.05, "Nominal trajectory, no winds", transform=ax.transAxes,
        ha="right", va="bottom", fontsize=9)
ax.set_ylim(0.0, 45.0)
ax.set_xlabel("Time since liftoff (s)")
ax.set_ylabel("Dynamic pressure (kPa)")
ax.legend(loc="upper left", bbox_to_anchor=(1.02, 1.0), borderaxespad=0.0)
fig.savefig("maxq.png", dpi=100)
```

**Step 1, find the point.** `np.argmax(q)` gives the index of the largest value. The peak is $35.0\,\mathrm{kPa}$ at $72.0\,\mathrm{s}$.

**Step 2, the margin.** $40.0 - 35.0 = 5.0\,\mathrm{kPa}$, which is $12.5$ percent of the limit.

**Step 3, draw.** The limit is a dashed `axhline`. The first `annotate` points an arrow at the peak from 40 points right and 30 points down. The second draws a two-headed arrow from the peak up to the limit, the margin made visible. A `text` in data coordinates writes the number beside it. A second `text` in axes coordinates labels the case in the bottom right corner, where it stays whatever the data does.

**Sanity check.** The peak sits below the dashed line, the arrow spans the gap, and the text agrees with the printout. A reviewer reads "5 kPa of margin at max-Q" without opening a spreadsheet.
:::

`ha` and `va` set the horizontal and vertical alignment of text relative to its anchor point: `ha="right"` means the text *ends* at the anchor, which is what you want in a right-hand corner.

## Legends, and getting them out of the way

Give each line a `label="..."` when you plot it, then call `ax.legend()`. With no arguments Matplotlib looks for the corner that covers the fewest data points. That search is a guess, and with dense telemetry every corner has data in it.

Two arguments control placement:

- `loc` names which point *of the legend box* is being placed: `"upper left"`, `"lower right"`, `"center"` and so on.
- `bbox_to_anchor=(x, y)` says where that point goes, in axes coordinates.

So `ax.legend(loc="upper left", bbox_to_anchor=(1.02, 1.0))` means "put the legend's upper left corner a little to the right of the axes, level with its top": outside the plot, on the right. The max-Q example does this. With `layout="constrained"` from the layouts lesson, the figure shrinks the axes to make room, so the legend is not cut off.

For a stack of panels that share the same lines, one legend for the whole figure is cleaner than one per panel. `fig.legend(..., loc="outside upper center")` places it above all the panels, and constrained layout makes room for it:

```python
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

t = np.linspace(0.0, 10.0, 501)       # s
fig, axs = plt.subplots(3, 1, sharex=True, figsize=(6, 5), layout="constrained")
names = ["roll", "pitch", "yaw"]
for ax, name, k in zip(axs, names, [1.0, 0.6, 0.3]):
    ax.plot(t, k * np.sin(t), label="commanded")
    ax.plot(t, k * np.sin(t - 0.2), ls="--", label="measured")
    ax.set_ylabel(f"{name.capitalize()} rate (deg/s)")
axs[-1].set_xlabel("Time since engine start (s)")

handles, labels = axs[0].get_legend_handles_labels()
fig.legend(handles, labels, loc="outside upper center", ncols=2)
print(labels)
# ['commanded', 'measured']
fig.savefig("figlegend.png", dpi=100)
```

`get_legend_handles_labels()` collects the line objects and their labels from one axes, and `fig.legend` draws them once. `ncols=2` lays the entries side by side, so the legend is one short row.

Sometimes the best legend is no legend. With two or three lines, writing each name at the end of its line, **[[direct labeling|direct-labels]]**, saves the reader's eye a trip to the box and back.

::: warning A legend that covers the data
The default `ax.legend()` may land on top of the exact spike the reviewer needs. Worse, the next dataset may move it somewhere else, so the same script makes a good figure one day and a bad one the next. For review figures, place legends on purpose: outside the axes, or at a fixed `loc` you have checked.
:::

## Units in every axis label

An axis label has one job: tell the reader what a number on that axis means. That takes three parts.

1. **The quantity**, in words: "Pitch rate", not "q" or "wy".
2. **The unit**, in parentheses: "(deg/s)".
3. **The reference**, when the quantity could be measured more than one way: "Heading (deg, true north)" is different from magnetic heading; "Velocity (m/s, Earth-fixed frame)" is different from velocity relative to the air.

The pattern "Quantity (unit)" is so standard that reviewers read it without thinking. Matplotlib's built-in math text lets you write powers: `ax.set_ylabel(r"Acceleration (m/s$^2$)")`. The `r` in front makes a raw string, so the backslashes and dollar signs reach Matplotlib untouched.

Why be strict? Because from the numbers alone you cannot tell meters from feet or radians from degrees, and aerospace has lost vehicles to exactly that. The **[[Mars Climate Orbiter|mars-climate-orbiter]]** is the famous case. Your label costs one line of code. It is the one piece of the figure every reader, in every future meeting, is guaranteed to look at.

::: key
Label axes with units, always: the reader cannot tell meters from feet or radians from degrees from the numbers, and in aerospace that ambiguity has destroyed vehicles. The axis label is the cheapest **[[interface control document|icd]]** in the business.
:::

::: warning Units that silently change
A label that says "(deg)" on data that is in radians is worse than no label. It happens when a script converts in one branch and not another, or when a library returns radians (NumPy and SciPy almost always do). Put the conversion and the label on neighboring lines of code, so a reader of the code sees both at once.
:::

## Check yourself

::: check
You want a major tick at every whole number of Monte Carlo run, 0 to 40, and never a tick at a fraction. Which locator, and what argument?
:::

::: answer
`MaxNLocator(integer=True)` keeps the automatic choice of spacing but only allows whole-number ticks; set it with `ax.xaxis.set_major_locator(MaxNLocator(integer=True))`. If you want a fixed step, `MultipleLocator(5)` gives ticks at $0, 5, 10, \dots, 40$, also whole numbers. The locator is the right tool, not the formatter: a formatter that rounds $2.5$ to "2" would print a wrong label at a real tick.
:::

::: check
Write a formatter that turns a tick at $0.0035$ radians into the text "0.20°". Give the conversion, the format string and the Matplotlib call.
:::

::: answer
Degrees are radians times $180/\pi$, so $0.0035 \times 57.296 \approx 0.2005$, which rounds to $0.20$. One way: `ax.yaxis.set_major_formatter(FuncFormatter(lambda x, pos: f"{np.degrees(x):.2f}°"))`. But the cleaner fix is usually to convert the data to degrees before plotting, set a plain `StrMethodFormatter("{x:.2f}")`, and write "(deg)" in the label. Then the tick values and the label agree without any hidden conversion in the formatter.
:::

::: check
A plot of a satellite's temperature uses `datetime64` times, and `ax.get_xlim()` returns $(20500.5, 20501.5)$. What stretch of time does the axis show?
:::

::: answer
Matplotlib date numbers count days since midnight UTC on 1 January 1970. The view spans $20501.5 - 20500.5 = 1$ day. It starts at day 20500 plus half a day, which is noon (12:00) on 16 February 2026, and ends at noon the next day. The label should say which time scale that is, for example "Time (UTC)".
:::

::: check
You call `ax.text(0.5, 0.9, "Case 42")` and the text does not appear. The data spans times $0$ to $600\,\mathrm{s}$ and values $0$ to $3000\,\mathrm{m}$. Why, and what is the fix?
:::

::: answer
Without a `transform`, text is placed in data coordinates, so it went to time $0.5\,\mathrm{s}$ and altitude $0.9\,\mathrm{m}$: at the very bottom left corner, hidden under the axis or the line. You meant "halfway across, 90 percent of the way up the axes". Pass `transform=ax.transAxes`: `ax.text(0.5, 0.9, "Case 42", transform=ax.transAxes, ha="center")`.
:::

::: check
A six-panel figure shows nominal, dispersed and requirement lines in every panel. Where should the legend go, and how do you make sure it is not cut off?
:::

::: answer
One legend for the whole figure, above or beside the panels, because every panel uses the same three line styles. Collect the handles and labels from one panel with `get_legend_handles_labels()` and call `fig.legend(handles, labels, loc="outside upper center", ncols=3)`. Make the figure with `layout="constrained"`, which reserves room for an "outside" legend so nothing is clipped when you save it.
:::

## Summary

| Idea | Meaning | Code |
|---|---|---|
| Major and minor ticks | long numbered marks and short marks between | per axis: `ax.xaxis`, `ax.yaxis` |
| Locator | where ticks go | `MultipleLocator`, `MaxNLocator`, `AutoMinorLocator` |
| Formatter | what each tick says | `StrMethodFormatter`, `FuncFormatter`, `EngFormatter` |
| Datetime axis | times stored as days since 1970 | `mdates.MinuteLocator`, `DateFormatter("%H:%M")` |
| Data coordinates | position in the data's own units | the default for `text` and `annotate` |
| Axes coordinates | $(0,0)$ bottom left to $(1,1)$ top right | `transform=ax.transAxes` |
| Annotation | text plus arrow to a point | `ax.annotate(s, xy=, xytext=, arrowprops=)` |
| Limit line | the requirement drawn on the plot | `ax.axhline(limit, ls="--")` |
| Legend outside | box placed off the data | `loc="upper left", bbox_to_anchor=(1.02, 1)` |
| Axis label | quantity, unit, reference | "Pitch rate (deg/s)" |

Labels and legends tell the reader what each line is. The next lesson is about color, the other way a figure tells lines apart, and why color on its own is never enough.

::: context axis-anatomy The parts of one axis
One axis carries more than a line with numbers. Each part below is its own object you can change.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="40" x2="330" y2="40" stroke="#1f2a44" stroke-width="2"/>
  <g stroke="#1f2a44" stroke-width="2">
    <line x1="30" y1="40" x2="30" y2="52"/><line x1="130" y1="40" x2="130" y2="52"/>
    <line x1="230" y1="40" x2="230" y2="52"/><line x1="330" y1="40" x2="330" y2="52"/>
  </g>
  <g stroke="#6c7a93" stroke-width="1.5">
    <line x1="63.3" y1="40" x2="63.3" y2="46"/><line x1="96.7" y1="40" x2="96.7" y2="46"/>
    <line x1="163.3" y1="40" x2="163.3" y2="46"/><line x1="196.7" y1="40" x2="196.7" y2="46"/>
    <line x1="263.3" y1="40" x2="263.3" y2="46"/><line x1="296.7" y1="40" x2="296.7" y2="46"/>
  </g>
  <text x="30" y="68" font-size="12" text-anchor="middle" fill="#1f2a44">0</text>
  <text x="130" y="68" font-size="12" text-anchor="middle" fill="#1f2a44">30</text>
  <text x="230" y="68" font-size="12" text-anchor="middle" fill="#1f2a44">60</text>
  <text x="330" y="68" font-size="12" text-anchor="middle" fill="#1f2a44">90</text>
  <text x="180" y="96" font-size="13" text-anchor="middle" fill="#1f2a44">Time since liftoff (s)</text>
  <text x="130" y="22" font-size="11" text-anchor="middle" fill="#1d6fd1">major tick</text>
  <line x1="130" y1="26" x2="130" y2="36" stroke="#1d6fd1" stroke-width="1"/>
  <text x="196.7" y="22" font-size="11" text-anchor="middle" fill="#6c7a93">minor tick</text>
  <line x1="196.7" y1="26" x2="196.7" y2="36" stroke="#6c7a93" stroke-width="1"/>
  <text x="290" y="84" font-size="11" text-anchor="middle" fill="#b4232c">tick label</text>
  <text x="180" y="118" font-size="11" text-anchor="middle" fill="#b4232c">axis label (with unit)</text>
</svg>
```

The locator places the major and minor ticks; the formatter writes the tick labels; `set_xlabel` writes the axis label.
:::

::: context t-plus Counting from zero at liftoff
Launch teams count time from one instant, "T-zero", usually liftoff. Before it, time is "T-minus" and counts down; after it, "T-plus" counts up. Engineers call the count after liftoff **mission elapsed time**.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 100" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="50" x2="340" y2="50" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="340,50 330,45 330,55" fill="#1f2a44"/>
  <line x1="140" y1="36" x2="140" y2="64" stroke="#b4232c" stroke-width="3"/>
  <text x="140" y="28" font-size="12" text-anchor="middle" fill="#b4232c">T-zero: liftoff</text>
  <text x="80" y="80" font-size="12" text-anchor="middle" fill="#6c7a93">T−00:30 … counting down</text>
  <text x="250" y="80" font-size="12" text-anchor="middle" fill="#1d6fd1">T+01:12 … counting up</text>
  <circle cx="212" cy="50" r="4" fill="#1d6fd1"/>
  <text x="212" y="40" font-size="11" text-anchor="middle" fill="#1d6fd1">max-Q</text>
</svg>
```
 Putting flight events on a T-plus axis lets two flights with different launch dates be overlaid and compared event for event: max-Q, staging and engine cutoff line up if the flights behaved alike.
:::

::: context date-number How Matplotlib stores a date
Matplotlib converts each time to a floating-point count of days since its **epoch**, the moment it counts from. Since Matplotlib 3.3 that epoch is 1970-01-01 00:00 UTC, the same one Unix computers use; older versions used year 1. A 64-bit float keeps these numbers to better than a microsecond for present-day dates, which is plenty for plotting. When you need finer timing, such as a 1 kHz sensor, plot seconds since an event instead and say so in the label.
:::

::: context coordinate-systems Three ways to say where
The same spot on a figure can be named three ways. Data coordinates follow the numbers on the axes. Axes coordinates run from 0 to 1 across the axes box. Offset points are a fixed nudge from some other point.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="60" y="20" width="260" height="140" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline points="60,150 120,120 170,60 220,110 320,140" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="170" cy="60" r="4" fill="#b4232c"/>
  <text x="178" y="56" font-size="11" fill="#b4232c">data (72, 35)</text>
  <line x1="170" y1="60" x2="200" y2="82" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 2"/>
  <text x="204" y="90" font-size="11" fill="#6c7a93">offset (+30, −22) pt</text>
  <text x="64" y="176" font-size="11" fill="#1f2a44">(0, 0) axes</text>
  <text x="320" y="14" font-size="11" text-anchor="end" fill="#1f2a44">(1, 1) axes</text>
  <text x="310" y="152" font-size="11" text-anchor="end" fill="#1f2a44">(0.98, 0.05)</text>
</svg>
```

Data-coordinate text moves when you rescale; axes-coordinate text stays put in its corner.
:::

::: context max-q Where the air pushes hardest
Dynamic pressure is $q = \tfrac{1}{2}\rho v^2$, where $\rho$ is air density and $v$ is speed. Right after liftoff the rocket is slow; high up the air is thin. In between, $q$ rises to a peak, "max-Q", often about a minute into flight and typically a few tens of kilopascals. Many rockets throttle down through max-Q to keep structural loads inside their limits, so it is one of the most annotated moments on any launch plot.
:::

::: context direct-labels Names where the eye already is
A legend makes the reader match a color swatch in a box to a line elsewhere, often several times. Writing "commanded" and "measured" in small text next to the right end of each line removes that trip. It works best with a handful of lines that end in separate places. With many overlapping lines, a legend, or better a figure with fewer lines, is the answer.
:::

::: context mars-climate-orbiter A spacecraft lost to a missing unit
In September 1999 NASA's Mars Climate Orbiter was lost as it arrived at Mars. Ground software supplied by one team reported thruster impulse in pound-force seconds; the navigation software that used it expected newton seconds, a factor of about $4.45$ smaller. Small errors in each trajectory estimate built up over months, and the orbiter passed far lower through the Martian atmosphere than planned. The investigation board named the unit mismatch as the root cause. It was a data-interface failure, the very thing a unit in every label and every file header guards against.
:::

::: context icd The document that says what every number means
An **interface control document**, or ICD, is the agreement between two teams about the data they exchange: every field's name, meaning, unit, frame, rate and sign convention. Large programs keep thousands of pages of them. An axis label does the same job in one line for one plot: it tells a reader from another team what the number means, without a meeting.
:::
