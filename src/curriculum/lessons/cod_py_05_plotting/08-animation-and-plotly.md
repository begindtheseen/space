---
id: l08-animation-and-plotly
title: Moving pictures and plots you can poke
minutes: 23
covers:
  - 'Animation and interactive review; Plotly for exploratory telemetry'
---

Remember a flip book: a little pad of paper with a stick figure drawn on every page, each one slightly different. Flip the pages fast and the figure runs. No single page moves. Your eye stitches the still pictures into motion.

An **animation** in matplotlib is a flip book. It draws one still frame, changes a few things, draws the next, and saves the stack as a movie. That is the right tool when the story is *motion in space*: a lander drifting sideways as it descends, a rocket's nozzle swinging on its gimbal, a spacecraft slewing to point at a target. A time-history plot shows those as wiggly lines; a movie shows them as the thing actually moving, and people who did not write the code understand it at once.

The rest of this lesson is about a different kind of "live" figure: one you can poke. In a flight review someone always asks "what happened at 31.2 seconds?" If the figure is a static PDF, you go back to your desk. If it is **interactive** — you can zoom, pan and hover to read exact values — you answer on the spot. Matplotlib can do some of this; a second library, **Plotly**, is built for it. By the end you will know how to make a trajectory movie, how to make matplotlib react when someone zooms, and when to reach for Plotly instead.

## A flip book in code

Matplotlib's main animation tool is `FuncAnimation`. You give it three things:

- a **figure** with the Artists already created (an empty line, a marker, a text label);
- an **update function** that receives a frame number and changes those Artists — new data for the line, a new position for the marker, new text;
- the list of **frames** to step through.

`FuncAnimation` then calls the update function once per frame and records the result. Nothing is redrawn from scratch. The line you made at the start is the same line object in every frame; only its data changes. That is why the first lesson made a point of keeping the object that `ax.plot` returns: `line.set_data(x, y)` is how an animation moves a curve.

The number that controls how the movie feels is the **[[frame rate|frame-rate]]**: frames per second, or fps. Movies in a cinema run at $24$ fps; $20$ to $30$ fps looks smooth for a plot. Telemetry, though, is usually recorded much faster than that — $100$ or $200$ samples per second. So each frame of the movie shows the newest of many samples, and you have to decide how many samples to step per frame.

If the data rate is $r$ samples per second, you want the movie to play $k$ times faster than real time, and the movie runs at $f$ frames per second, then each frame advances

$$
\text{step} = \frac{r \, k}{f} \ \text{samples}.
$$

Read it like this: in one second of movie, $k$ seconds of flight go by, which is $r k$ samples, shared among $f$ frames.

::: example A lander descent movie
A lander's descent is logged at $r = 100\,\mathrm{Hz}$ ($100$ samples every second) for $60\,\mathrm{s}$, so there are $6000$ samples. It starts at $500\,\mathrm{m}$ and drifts up to $80\,\mathrm{m}$ sideways before landing. Play it $k = 5$ times faster than real time at $f = 20$ fps.

**Step.** $\text{step} = 100 \times 5 / 20 = 25$ samples per frame.

**Frame count.** $6000 / 25 = 240$ frames.

**Movie length.** $240 / 20 = 12\,\mathrm{s}$. Check another way: $60\,\mathrm{s}$ of flight played $5$ times faster is $12\,\mathrm{s}$. The two agree.

```python
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation, PillowWriter
import numpy as np

rate = 100                                   # Hz
t = np.arange(0.0, 60.0, 1.0 / rate)        # s
h = 500.0 * (1.0 - t / 60.0) ** 2            # m, altitude
x = 80.0 * np.sin(np.pi * t / 60.0)          # m, crossrange drift

speedup = 5                                   # play 5x faster than real time
fps = 20                                      # movie frames per second
step = rate * speedup // fps                  # samples per frame
frames = range(0, t.size, step)
print(step, len(frames), round(len(frames) / fps, 1))   # 25 240 12.0

fig, ax = plt.subplots(figsize=(4, 3), layout="constrained")
ax.set_xlim(-10, 90)
ax.set_ylim(0, 520)
ax.set_xlabel("Crossrange (m)")
ax.set_ylabel("Altitude (m)")
trail, = ax.plot([], [], color="C0")
dot, = ax.plot([], [], "o", color="C3")
label = ax.text(0.02, 0.95, "", transform=ax.transAxes, va="top")

def update(i):
    trail.set_data(x[: i + 1], h[: i + 1])
    dot.set_data([x[i]], [h[i]])
    label.set_text(f"t = {t[i]:.1f} s")
    return trail, dot, label

anim = FuncAnimation(fig, update, frames=frames, interval=1000 / fps, blit=True)
anim.save("descent.gif", writer=PillowWriter(fps=fps))
```

Walk through the pieces. The axis limits are fixed before anything moves, so the view does not jump around from frame to frame. `trail` and `dot` start empty. Each call to `update(i)` gives the trail every point up to sample `i`, puts the dot on sample `i`, and writes the time in the corner. `interval` is the delay between frames in milliseconds when shown on screen: $1000 / 20 = 50\,\mathrm{ms}$. The `PillowWriter` saves a **[[GIF|gif-format]]**, which plays in any browser or slide.

The `text` call uses `transform=ax.transAxes`, which means its position $(0.02, 0.95)$ is a fraction of the Axes box — top left corner — rather than data coordinates. So the label stays put while the data moves.
:::

Two settings are worth knowing. `blit=True` asks matplotlib to redraw only the Artists the update function returns, instead of the whole figure, which makes on-screen playback much faster; that is why `update` returns them. This trick is called **[[blitting|blitting]]**. And for an MP4 video instead of a GIF, use `writer="ffmpeg"` — this needs the free `ffmpeg` program installed on your computer. MP4 files are far smaller than GIFs for long movies.

::: key
`FuncAnimation(fig, update, frames=..., interval=...)` calls `update(frame)` once per frame; `update` changes existing Artists with `set_data` or `set_text` and returns them. Save with `anim.save(path, writer=...)`. Samples per frame $= r k / f$.
:::

::: warning Keep the animation in a variable
Write `anim = FuncAnimation(...)`, not a bare `FuncAnimation(...)` on its own. If nothing holds on to the animation object, Python may throw it away, and in an interactive window the movie freezes on its first frame with no error. The same goes for animations built inside a function: return the object.
:::

::: warning A movie is not a review figure
You cannot put a finger on frame 118 while looking at frame 190. When the question is "how big was the overshoot?", a movie is the worst possible answer. Use animation to show *what happened*, and a static time-history plot with limit lines to show *how close it came*. Most review packages have both.
:::

## Zoom, pan and hover in matplotlib

When you run matplotlib with an **interactive backend** — one that opens a real window, such as `QtAgg` or `TkAgg` on a desktop, or `%matplotlib widget` in a Jupyter notebook (with the `ipympl` package installed) — every figure comes with a toolbar. It has a magnifying glass for drawing a zoom box, a four-way arrow for panning, and a home button to go back. If your panels were made with `sharex=True`, as in the layouts lesson, zooming one panel zooms them all to the same time window. That alone makes a six-panel review figure a good exploration tool.

The scripts in this module use the `Agg` backend, which has no window. The zooming still exists underneath: a toolbar zoom does nothing more than call `ax.set_xlim` for you. So you can hook your own code onto it with a **[[callback|callback]]** — a function you hand to matplotlib and it calls back later, whenever a certain thing happens.

The Axes offers callbacks for `"xlim_changed"` and `"ylim_changed"`. The figure's canvas offers them for mouse and keyboard events: `fig.canvas.mpl_connect("button_press_event", on_click)` calls `on_click(event)` on each click, and `event.xdata` is the click's position in data coordinates — the time you clicked on.

::: example A zoom that reports what it sees
A pitch-rate trace is logged at $100\,\mathrm{Hz}$ for $60\,\mathrm{s}$. It wobbles by only $\pm 0.02\,\mathrm{deg/s}$, except for a $30\,\mathrm{ms}$ spike to $4\,\mathrm{deg/s}$ near $t = 31.2\,\mathrm{s}$. Attach a callback that prints the window width, the number of samples in view and the peak in view, every time the x-limits change:

```python
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

t = np.arange(0.0, 60.0, 0.01)                   # s, 100 Hz
rate = 0.02 * np.sin(t)                          # deg/s
rate[3121:3124] = 4.0                            # 30 ms spike at 31.21-31.23 s

fig, ax = plt.subplots()
ax.plot(t, rate)
ax.set_xlim(0, 60)

def report(ax):
    lo, hi = ax.get_xlim()
    inside = (t >= lo) & (t <= hi)
    print(f"window {hi - lo:.2f} s, {inside.sum()} samples, "
          f"peak {rate[inside].max():.2f} deg/s")

ax.callbacks.connect("xlim_changed", report)
ax.set_xlim(30, 33)    # what a zoom box around the spike does
ax.set_xlim(40, 50)    # what panning away does
# window 3.00 s, 301 samples, peak 4.00 deg/s
# window 10.00 s, 1001 samples, peak 0.02 deg/s
```

**Zoomed on the spike.** The window is $33 - 30 = 3\,\mathrm{s}$. At $100$ samples per second that is $300$ sample gaps, so $301$ samples counting both ends. The peak is the spike, $4.00\,\mathrm{deg/s}$.

**Panned away.** A $10\,\mathrm{s}$ window holds $1001$ samples, and the peak is only the wobble, $0.02\,\mathrm{deg/s}$. The spike is out of view, and the callback says so.

Why is this useful? In a real window, the same callback could redraw a statistics box in the corner of the plot, or reload a finer version of the data for only the zoomed range. That second idea is how people keep a plot of ten million points responsive, and the last lesson in this module teaches the thinning that makes it work.
:::

## Plotly: a figure that lives in a web page

Matplotlib draws finished pictures. **Plotly** takes a different approach. In Python you build a description of the figure — the data and the layout — and Plotly hands that description to a JavaScript library that draws it inside a web browser. Because the browser does the drawing, every Plotly figure can zoom, pan and show a **tooltip** (a small box with the exact values) wherever you hover, with no extra code.

You save a Plotly figure as a single HTML file. Anyone can open it in a browser, with no Python installed. That makes it a good way to share a quick look at a test with a colleague: "here, poke at it yourself".

Plotly has two layers:

- `plotly.graph_objects` (usually imported as `go`) is the full, explicit API. You create **traces** — Plotly's word for one data series, like one `ax.plot` line — and add them to a figure.
- `plotly.express` (usually `px`) is a quick shortcut that builds a whole figure in one call, such as `px.line(x=t, y=alt)`. It works especially well with the pandas tables of the next lesson.

Here is a two-panel telemetry browser built with `graph_objects`. `make_subplots` is Plotly's version of `plt.subplots`, and `shared_xaxes=True` links the zoom across panels the same way `sharex=True` does in matplotlib.

::: example A telemetry browser in one HTML file
```python
import os
import numpy as np
import plotly.graph_objects as go
from plotly.subplots import make_subplots

t = np.arange(0.0, 60.0, 0.01)                      # s, 100 Hz
alt = 500.0 * (1.0 - t / 60.0) ** 2                 # m
rate = 0.02 * np.sin(t)                             # deg/s
rate[3121:3124] = 4.0                               # a 30 ms spike

fig = make_subplots(rows=2, cols=1, shared_xaxes=True)
fig.add_trace(go.Scatter(x=t, y=alt, name="altitude"), row=1, col=1)
fig.add_trace(go.Scatter(x=t, y=rate, name="pitch rate"), row=2, col=1)
fig.update_yaxes(title_text="Altitude (m)", row=1, col=1)
fig.update_yaxes(title_text="Pitch rate (deg/s)", row=2, col=1)
fig.update_xaxes(title_text="Time since ignition (s)", row=2, col=1)
fig.update_layout(hovermode="x unified")
fig.write_html("review_full.html")
fig.write_html("review_cdn.html", include_plotlyjs="cdn")
print(len(fig.data), t.size)                        # 2 6000
print(round(os.path.getsize("review_full.html") / 1e6, 2),
      round(os.path.getsize("review_cdn.html") / 1e3))   # 5.11 291
```

`go.Scatter` draws lines by default, despite its name. `hovermode="x unified"` shows one tooltip listing every trace's value at the time under the mouse — so hovering at $31.22\,\mathrm{s}$ reads both the altitude and the spike. The axis titles carry units, exactly as in matplotlib.

**Why is the first file $5.11\,\mathrm{MB}$?** By default the HTML file carries the whole Plotly JavaScript library inside it, a bit under $5\,\mathrm{MB}$, so it works with no internet. `include_plotlyjs="cdn"` instead writes a link that makes the browser fetch the library from a **[[CDN|cdn]]** when the page opens. That file is only about $291\,\mathrm{kB}$.

**Where do the $291\,\mathrm{kB}$ come from?** The figure holds four arrays of $6000$ numbers: $x$ and $y$ for each of the two traces. Each number is a $64$-bit float, $8$ bytes. So the raw data is

$$
4 \times 6000 \times 8 = 192{,}000 \ \text{bytes}.
$$

Plotly writes the arrays as text using **[[base64|base64]]**, which takes $4$ characters for every $3$ bytes: $192{,}000 \times \tfrac{4}{3} = 256{,}000$ bytes, about $256\,\mathrm{kB}$. The file is about $35\,\mathrm{kB}$ bigger than that. About $26\,\mathrm{kB}$ of it is a small quirk: "/" is one of base64's characters, and the HTML writer spells each one as a six-character code. The last $8\,\mathrm{kB}$ or so is the layout and the page around the data. The estimate lands within about $12\%$ of the real file, which is close enough to plan with.
:::

That arithmetic tells you where Plotly stops being comfortable. A million points in one trace — about $83$ minutes of a single channel at $200\,\mathrm{Hz}$ — makes an HTML file of about $25\,\mathrm{MB}$ of data alone. The plain `go.Scatter` draws with SVG, where the browser keeps track of every mark on the page one by one, and it slows to a crawl long before that. `go.Scattergl` draws with **[[WebGL|webgl]]**, the browser's route to the graphics card, and stays responsive with hundreds of thousands of points or more. Past that, thin the data before plotting it, without losing the spikes — the subject of this module's last lesson.

::: key
Plotly builds a figure description in Python and draws it in the browser, so every figure can zoom, pan and hover with no extra code. Use `go.Scatter` for up to tens of thousands of points, `go.Scattergl` for more, `make_subplots(..., shared_xaxes=True)` for linked panels, and `write_html` to share.
:::

::: warning The "cdn" file needs the internet
A file saved with `include_plotlyjs="cdn"` shows a blank page on a computer with no internet access — and many test stands, secure labs and flight-software networks have none. For those, save the full self-contained file, or send a matplotlib PDF instead.
:::

## Which tool, when

Here is how the three fit together in real GNC work.

**Plotly for exploring.** Right after a test you do not yet know what matters. You want to scroll through every channel, zoom on anything odd, and read exact numbers off the curves. An interactive Plotly page, or a matplotlib window with linked zoom, is the fastest way to find the interesting two seconds in a ten-minute test.

**Matplotlib for the deliverable.** Once you know what matters, the review figure has to look the same for everyone, print, go into a report, and carry limit lines, sigma bands and annotations placed exactly where you want them. That is the job of the static matplotlib figure, saved as PDF the way the previous lesson describes. An HTML page cannot be printed reliably, will not go into a report, and depends on the reader's browser.

**Animation for explaining.** When the audience needs to *see* the motion — a landing, a docking approach, a slew — make a short movie. Put it next to the static plots, not in place of them.

A practical habit: write each panel as a function that takes an `ax`, as the first lesson taught, for the deliverable figure; and keep a small companion script that dumps the same channels into a Plotly HTML page for exploring. Both read the same data file, so they cannot disagree.

::: note Why interactive figures do not replace static ones
A static figure is a promise: every reader sees exactly the same thing, at exactly the same zoom, with exactly the annotations the author chose. That is what makes it possible to sign off on a review, archive it and compare it with the next flight's figure years later. An interactive page shows whatever the last person to touch it chose to look at. It is a tool for finding the story; the static figure is how you tell it.
:::

## Check yourself

::: check
Telemetry at $200\,\mathrm{Hz}$ covers a $90\,\mathrm{s}$ burn. You want a movie that plays $3$ times faster than real time at $25$ fps. How many samples per frame, how many frames, and how long is the movie?
:::

::: answer
Samples per frame: $\text{step} = 200 \times 3 / 25 = 24$.

The burn has $200 \times 90 = 18{,}000$ samples, so there are $18{,}000 / 24 = 750$ frames.

The movie lasts $750 / 25 = 30\,\mathrm{s}$. Check: $90\,\mathrm{s}$ of flight at $3$ times real speed is $90 / 3 = 30\,\mathrm{s}$. The two agree.
:::

::: check
Your update function builds a brand-new line with `ax.plot(...)` on every frame instead of calling `set_data` on one line made before the animation. What goes wrong?
:::

::: answer
Every frame adds another line to the Axes and none is ever removed, so the plot fills up with hundreds of overlapping lines, the old positions never disappear, and drawing gets slower frame by frame. The fix is to create the line once, empty, before the animation, and change only its data inside `update` with `line.set_data(...)`.
:::

::: check
A three-panel matplotlib figure uses `sharex=True`. You connect an `"xlim_changed"` callback to the top Axes only. Will it fire when a colleague zooms on the bottom panel? Explain.
:::

::: answer
Yes. With shared x-axes, zooming any panel changes the x-limits of all of them, because they share one set of limits. The top Axes' limits change too, so its `"xlim_changed"` callback runs. That is handy: one callback can watch the time window for the whole figure.
:::

::: check
A Plotly page with $3$ traces, each with $50{,}000$ points in $x$ and $y$, is saved with `include_plotlyjs="cdn"`. Estimate its size.
:::

::: answer
There are $3 \times 2 = 6$ arrays of $50{,}000$ numbers, each number $8$ bytes: $6 \times 50{,}000 \times 8 = 2{,}400{,}000$ bytes of raw data. Written as base64 that grows by $\tfrac{4}{3}$, to $3{,}200{,}000$ bytes, so plan on at least $3.2\,\mathrm{MB}$. The real file comes out a little bigger — a test file like this one measured about $3.7\,\mathrm{MB}$ — because of the escaped "/" characters and the layout. With the full library embedded, add about $5\,\mathrm{MB}$.
:::

::: check
After a hot-fire test you need two things: to find out why a valve chattered, and to present the result at next week's design review. Which tool do you use for each, and why?
:::

::: answer
For finding out, an interactive tool: a Plotly page (or a matplotlib window with linked zoom) with every relevant channel, so you can zoom into the chatter and hover to read the exact times and values. For presenting, a static matplotlib figure saved as PDF, zoomed to the right window, with the valve command, the valve position, the limits and annotations placed on purpose, so everyone in the room sees the same thing and it can be archived with the review.
:::

## Summary

| Idea | Meaning | In code or numbers |
|---|---|---|
| Animation | Still frames played in order | `FuncAnimation(fig, update, frames=..., interval=...)` |
| Update function | Changes existing Artists each frame | `line.set_data(x, y)`, returns Artists |
| Samples per frame | Data rate times speed-up over fps | $r k / f$ |
| Saving a movie | GIF anywhere, MP4 with ffmpeg | `anim.save("a.gif", writer=PillowWriter(fps=20))` |
| Blitting | Redraw only what changed | `blit=True` |
| Callback | Your function, called on an event | `ax.callbacks.connect("xlim_changed", f)` |
| Plotly trace | One data series | `go.Scatter`, `go.Scattergl` |
| Linked panels | Zoom one, zoom all | `make_subplots(..., shared_xaxes=True)` |
| Sharing | Self-contained HTML page | `fig.write_html(path)` |
| Which tool | Explore, deliver, explain | Plotly; matplotlib PDF; animation |

The next lesson switches from drawing data to holding it. pandas gives telemetry a proper home — tables with named columns and a real time index — and every remaining lesson in this module builds on it.

::: context frame-rate Frames and samples
A frame is one still picture of a movie; the frame rate is how many are shown each second. Telemetry is usually sampled much faster than any movie needs, so each frame skips ahead many samples. In the lander movie, every frame jumps $25$ samples, and only the sample at each jump is shown as the dot.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="70" x2="340" y2="70" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#8fb8f0" stroke-width="1">
    <line x1="30" y1="62" x2="30" y2="78"/><line x1="40" y1="62" x2="40" y2="78"/><line x1="50" y1="62" x2="50" y2="78"/><line x1="60" y1="62" x2="60" y2="78"/><line x1="70" y1="62" x2="70" y2="78"/><line x1="80" y1="62" x2="80" y2="78"/><line x1="90" y1="62" x2="90" y2="78"/><line x1="100" y1="62" x2="100" y2="78"/><line x1="110" y1="62" x2="110" y2="78"/><line x1="120" y1="62" x2="120" y2="78"/><line x1="130" y1="62" x2="130" y2="78"/><line x1="140" y1="62" x2="140" y2="78"/><line x1="150" y1="62" x2="150" y2="78"/><line x1="160" y1="62" x2="160" y2="78"/><line x1="170" y1="62" x2="170" y2="78"/><line x1="180" y1="62" x2="180" y2="78"/><line x1="190" y1="62" x2="190" y2="78"/><line x1="200" y1="62" x2="200" y2="78"/><line x1="210" y1="62" x2="210" y2="78"/><line x1="220" y1="62" x2="220" y2="78"/><line x1="230" y1="62" x2="230" y2="78"/><line x1="240" y1="62" x2="240" y2="78"/><line x1="250" y1="62" x2="250" y2="78"/><line x1="260" y1="62" x2="260" y2="78"/><line x1="270" y1="62" x2="270" y2="78"/><line x1="280" y1="62" x2="280" y2="78"/><line x1="290" y1="62" x2="290" y2="78"/><line x1="300" y1="62" x2="300" y2="78"/><line x1="310" y1="62" x2="310" y2="78"/><line x1="320" y1="62" x2="320" y2="78"/>
  </g>
  <g fill="#b4232c">
    <circle cx="30" cy="70" r="5"/><circle cx="130" cy="70" r="5"/><circle cx="230" cy="70" r="5"/><circle cx="330" cy="70" r="5"/>
  </g>
  <text x="180" y="40" font-size="12" text-anchor="middle" fill="#1f2a44">blue ticks: samples (every 10 ms)</text>
  <text x="180" y="104" font-size="12" text-anchor="middle" fill="#b4232c">red dots: frames (every 10th sample here)</text>
</svg>
```

The picture shows one frame every ten samples to keep it readable; the lander movie uses one every twenty-five.
:::

::: context gif-format The GIF format
GIF, the Graphics Interchange Format, dates from 1987. It can hold many frames in one file, which is why it became the web's format for little looping animations. Each frame can use at most $256$ colors, which is plenty for a plot with a few lines, and it plays in every browser, chat tool and slide program without a video player. For long or colorful movies, MP4 video is far smaller.
:::

::: context blitting Blitting: copy only what changed
The word comes from "bit block transfer", an old graphics trick for copying a rectangle of pixels in one go. In matplotlib, blitting means: draw the unchanging background (axes, ticks, labels) once and keep a copy of it, then for each frame paste the saved background and draw only the moving Artists on top. That is why the update function must return the Artists it changed — matplotlib needs to know which ones to redraw.
:::

::: context callback Callbacks: leave your number
A callback is like leaving your phone number at a shop and asking them to call you back when your order arrives. You do not stand at the counter waiting. In code, you give a library a function, and the library calls it when the event happens — a zoom, a click, a key press. Your code does not run in a loop checking for events; it sits quietly until it is called.
:::

::: context cdn Content delivery networks
A CDN, or content delivery network, is a set of servers spread around the world that keep copies of popular files, such as the Plotly JavaScript library. When a page asks for the file, the nearest server sends it, quickly. Your browser usually keeps a copy after the first download, so a folder of Plotly pages saved with the CDN option only fetches the library once. The catch is that it needs a working internet connection at least that first time.
:::

::: context base64 Why base64 costs four for three
An HTML page is text, but numbers are stored as raw bytes, and many byte values are not printable characters. Base64 turns bytes into text using only $64$ safe characters: letters, digits, "+" and "/". Each of the $64$ characters carries $6$ bits. Three bytes are $3 \times 8 = 24$ bits, which is exactly four $6$-bit characters.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="36" y="20" width="96" height="28" fill="#8fb8f0"/>
    <rect x="132" y="20" width="96" height="28" fill="#8fb8f0"/>
    <rect x="228" y="20" width="96" height="28" fill="#8fb8f0"/>
    <rect x="36" y="72" width="72" height="28" fill="#f2b880"/>
    <rect x="108" y="72" width="72" height="28" fill="#f2b880"/>
    <rect x="180" y="72" width="72" height="28" fill="#f2b880"/>
    <rect x="252" y="72" width="72" height="28" fill="#f2b880"/>
  </g>
  <g font-size="12" text-anchor="middle" fill="#1f2a44">
    <text x="84" y="39">byte: 8 bits</text><text x="180" y="39">8 bits</text><text x="276" y="39">8 bits</text>
    <text x="72" y="91">6 bits</text><text x="144" y="91">6 bits</text><text x="216" y="91">6 bits</text><text x="288" y="91">6 bits</text>
  </g>
  <text x="180" y="116" font-size="11" text-anchor="middle" fill="#6c7a93">3 bytes in, 4 characters out</text>
</svg>
```

So every $3$ bytes of data become $4$ bytes of text, a growth of one third.
:::

::: context webgl WebGL and the graphics card
Your computer has a graphics card built to draw millions of triangles per second for games. WebGL is the way a web page asks that card to draw. A normal Plotly scatter draws with SVG, so the browser keeps track of every mark in the page separately; `Scattergl` hands the whole array to the graphics card in one go. The cost is a few features that only the slower version supports, but for long telemetry traces the speed is worth it.
:::
