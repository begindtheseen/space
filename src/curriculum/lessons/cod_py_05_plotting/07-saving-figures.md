---
id: l07-saving-figures
title: Saving figures that survive the trip
minutes: 22
covers:
  - 'Saving: vector formats, dpi, font embedding, figure size for a slide vs a report'
---

Think about two ways to send a friend a picture of a circle. You could take a photo of it: a grid of tiny colored squares. Or you could write a note that says "draw a circle 5 cm across, 1 mm thick line, center here". The photo looks fine at the size you took it. Blow it up to poster size and the edge turns into a staircase of squares. The note never goes blurry, because whoever reads it draws the circle fresh at whatever size they want.

Saving a figure is the same choice. A matplotlib figure lives in memory as a tree of objects — lines, text, shaded bands. When you call `fig.savefig`, you pick whether to write it down as a photo (a grid of pixels) or as drawing instructions. You also pick how big it is, how sharp the photo is, and whether the fonts travel inside the file. Get these wrong and the figure that looked perfect on your laptop turns up in the review package with 5-point labels, fuzzy lines, or a font swapped for something the reader's computer happened to have.

This matters because the saved file is the deliverable. Nobody in a design review sees your Python session. They see a PDF on a projector, a page in a printed report, or a slide someone zooms into while asking about one tiny corner of a Bode plot. This lesson covers the two kinds of file, the size a figure should be made at, what dpi really means, how fonts get into a file, and how to check the result before it leaves your hands.

## Pixels or drawing instructions

A **raster** image is a grid of **[[pixels|raster-vs-vector]]** — tiny squares, each one a single color. PNG and JPEG are raster formats. A **vector** image stores shapes instead: "a line from here to here, 1.5 points thick, this blue", "the text *Altitude (km)* in this font at this position". PDF, SVG and EPS are vector formats.

The difference shows up the moment someone zooms in. A vector line gets redrawn at the new size and stays crisp. Text in a vector file is still text, so you can select it, copy it and search for it. A raster line was already turned into squares when you saved it, so zooming only makes the squares bigger.

Matplotlib picks the format from the file name:

```python
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import os

t = np.linspace(0.0, 10.0, 1001)
fig, ax = plt.subplots(figsize=(6.4, 4.8))
ax.plot(t, np.sin(t))
ax.set_xlabel("Time (s)")
for ext in ["png", "pdf", "svg"]:
    fig.savefig(f"sine.{ext}")
    print(ext, os.path.getsize(f"sine.{ext}"))
# png 27779
# pdf 10865
# svg 20818
```

Three files, same figure. Here the PDF is even the smallest, because one line of $1001$ points is a short list of instructions. That is not always so, as you will see below. (Your byte counts may differ a little with the matplotlib version.)

Which one goes where?

- **PDF** is the workhorse for reports and review packages. It embeds fonts, prints perfectly, and drops straight into documents written in LaTeX, the typesetting system most technical papers use.
- **SVG** is vector for the web and for editing in a drawing program.
- **PNG** is the raster format to use when you need pixels: a web page, a chat message, or a figure that is so heavy with points that vector would be enormous. PNG compresses without losing anything, so thin lines and text stay clean.
- **JPEG** is for photographs. Its compression smears sharp edges, so it makes plots look dirty. Avoid it for figures.

::: key
For a report, use a vector format (PDF or SVG) so text stays selectable and lines stay sharp at any zoom. Use raster (PNG at 200+ dpi) only when the figure has a huge number of elements or an image layer.
:::

::: warning The screen lies about sharpness
A PNG and a PDF of the same figure look identical on your screen at 100% zoom. The difference only appears when a reviewer zooms into a crossover region or prints the page. Judge a figure by opening the saved file and zooming to 400%, not by looking at the window you drew it in.
:::

## Size is set in inches, text in points

Every figure has a physical size. `figsize=(6.4, 4.8)` means $6.4$ inches wide and $4.8$ inches tall — matplotlib's default. Text size is also physical. It is measured in **[[points|points-unit]]**, a printer's unit: one point is $\tfrac{1}{72}$ of an inch, about $0.35\,\mathrm{mm}$. Matplotlib's default text is $10$ points, and its default line width is $1.5$ points.

Here is the idea that catches almost everyone. The text is $10$ points *relative to a figure that is $6.4$ inches wide*. If the figure gets shrunk to fit a smaller space, the text shrinks with it. If it gets stretched, the text grows. A word processor or a slide program scales your figure to fit the box you drop it in, and it does not ask.

So the rule is: **make the figure at the size it will be shown.** Then nothing gets scaled, and $8$-point text prints at $8$ points. The scale factor when a figure is squeezed into a space is

$$
s = \frac{\text{width it is shown at}}{\text{width it was made at}},
$$

and every font size and line width gets multiplied by $s$.

::: example The figure that shrank
You make a plot at the default $6.4 \times 4.8$ inches with default $10$-point labels. It goes into a two-column technical paper, where one **[[column|column-width]]** is about $3.5$ inches wide.

**Scale factor.** $s = 3.5 / 6.4 \approx 0.547$. The figure is squeezed to a bit more than half its size.

**Text.** $10 \times 0.547 \approx 5.5$ points. Most journals ask for at least $7$ or $8$ points, and at $5.5$ the tick labels are a squint.

**Lines.** $1.5 \times 0.547 \approx 0.82$ points. Still visible, but thin and faint when printed.

**The fix.** Make it at the column size in the first place, and choose the font for that size:

```python
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

plt.rcParams["font.size"] = 8
t = np.linspace(0.0, 120.0, 1201)                  # s
fig, ax = plt.subplots(figsize=(3.5, 2.4), layout="constrained")
ax.plot(t, 0.5 * t**1.5 / 1000.0)
ax.set_xlabel("Time since liftoff (s)")
ax.set_ylabel("Altitude (km)")
fig.savefig("ascent_column.pdf")
fig.savefig("ascent_column.png", dpi=300)
from PIL import Image
print(Image.open("ascent_column.png").size)        # (1050, 720)
```

Now $s = 1$ and the $8$-point labels print at $8$ points. The PNG is $3.5 \times 300 = 1050$ pixels wide and $2.4 \times 300 = 720$ tall. The **constrained layout** from the layouts lesson makes the labels fit inside the small page instead of spilling off the edge.

Sanity check: $8$ points is about $2.8\,\mathrm{mm}$ tall, the size of the small print in a textbook. Readable, as it should be.
:::

::: key
Make every figure at the physical size it will be shown, in inches, and pick font sizes in points for that size. A figure scaled after saving scales all its text and lines with it.
:::

## dpi: how many pixels per inch

**dpi** stands for **[[dots per inch|dpi-word]]**. For a raster file, it says how many pixels go into each inch of the figure:

$$
\text{pixels} = \text{inches} \times \text{dpi}.
$$

So dpi does not change how big the text looks relative to the plot. It changes how *finely* the same picture is chopped into squares. A $6.4$-inch-wide figure at $100$ dpi is $640$ pixels wide; at $300$ dpi it is $1920$ pixels wide and looks much smoother when printed or zoomed.

You set it when saving: `fig.savefig("f.png", dpi=300)`. Without it, matplotlib uses the `savefig.dpi` setting, which by default means "the same as the figure", $100$ dpi. That is low for anything but a quick look.

Rough targets:

- $150$ to $200$ dpi for screens and slides;
- $300$ dpi for print;
- $600$ dpi for fine line art that will be printed large.

For a vector file, dpi mostly does not matter. Lines and text are shapes with no pixels at all. It only matters for the parts of a vector file that are pictures inside it, which comes up in the next section.

::: example Pixels for a slide
A standard widescreen slide is $13.33 \times 7.5$ inches, and it is usually shown on a screen $1920$ pixels wide. How many pixels does a figure need to look sharp there?

**Pixels per inch on the screen.** $1920 / 13.33 \approx 144$. So each inch of slide becomes $144$ screen pixels.

**The figure.** Say the plot fills a $12 \times 5.5$-inch box under the slide title. At $144$ dpi that is $12 \times 144 = 1728$ pixels wide and $5.5 \times 144 = 792$ tall. Any PNG with at least that many pixels uses every pixel the projector has. Saving at `dpi=200` gives $2400 \times 1100$, a little extra so it still looks good if someone zooms.

**The text.** A slide is read from across a room, so slide text is big. Most slide templates use body text of $18$ points or more. At $144$ pixels per inch, $18$ points is $\tfrac{18}{72} = 0.25$ inches, which is $36$ pixels tall on the screen. Default $10$-point tick labels would be $20$ pixels — fine on your laptop, unreadable from the back row.

So a slide figure is made like this: `figsize=(12, 5.5)` with `plt.rcParams["font.size"] = 18`, lines about $2.5$ points thick, and saved as PDF (or PNG at $200$ dpi if the slide program handles PDFs badly). A report figure is small with small fonts; a slide figure is big with big fonts. They are two different figures from the same data, and a good plotting function (one that takes an `ax`, as in the first lesson) makes producing both painless.
:::

::: warning Tight bounding boxes change the size
`fig.savefig("f.png", bbox_inches="tight")` crops the file to whatever is drawn, plus a small margin. That is handy for trimming white space, but the saved file is no longer the size you asked for. The $3.5 \times 2.4$-inch figure above saves at $1084 \times 754$ pixels at $300$ dpi instead of $1050 \times 720$ — about $3.6$ inches wide, now too wide for the column and scaled down again. If the size matters, use `layout="constrained"` to fit the labels inside the figure and leave `bbox_inches` alone.
:::

## When vector gets too heavy

A vector file stores every shape you drew. One smooth line is a few thousand numbers. But a scatter plot of a large **Monte Carlo** run — many simulated flights with randomly varied inputs — can hold hundreds of thousands of dots, and each dot is its own little shape in the file. The PDF balloons, and the reader's viewer crawls as it redraws every dot at every zoom.

The fix is a **[[mixed file|rasterized-layer]]**: keep the axes, ticks, labels and any thin annotation lines as vector, and turn only the heavy layer into a picture inside the PDF. Matplotlib does this when you pass `rasterized=True` to the heavy Artist. The `dpi` you give `savefig` then sets the resolution of that one picture.

::: example A landing-dispersion cloud
A lander's touchdown point is simulated $200{,}000$ times. The misses are spread about $50\,\mathrm{m}$ downrange and $30\,\mathrm{m}$ crossrange (one standard deviation each). Plot them on a $3.5$-inch square both ways:

```python
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import os

rng = np.random.default_rng(0)
n = 200_000
x = rng.normal(0.0, 50.0, n)      # m, downrange miss
y = rng.normal(0.0, 30.0, n)      # m, crossrange miss

fig, ax = plt.subplots(figsize=(3.5, 3.5))
ax.scatter(x, y, s=1)
fig.savefig("cloud_vector.pdf")

fig2, ax2 = plt.subplots(figsize=(3.5, 3.5))
ax2.scatter(x, y, s=1, rasterized=True)
fig2.savefig("cloud_mixed.pdf", dpi=300)

a = os.path.getsize("cloud_vector.pdf")
b = os.path.getsize("cloud_mixed.pdf")
print(round(a / 1e6, 1), round(b / 1e3), round(a / b))   # 3.0 49 61
```

**All vector:** about $3.0\,\mathrm{MB}$, because the PDF lists all $200{,}000$ dots one by one.

**Mixed:** about $49\,\mathrm{kB}$, about $61$ times smaller. The dot cloud is now one $300$-dpi picture ($3.5 \times 300 = 1050$ pixels on a side at most). The axes, ticks and labels are still vector and still sharp.

Does anything get lost? Each dot is smaller than a pixel at this size anyway, so the reader could never see individual dots. The picture keeps exactly what the eye could see. Sanity check passed.
:::

The same trick applies to an **image layer**: a terrain map under a trajectory, a camera frame under a star-tracker overlay, or a big heat map drawn with `imshow` or `pcolormesh`. Those are pictures by nature, so they go into the file as pictures while the annotations on top stay vector.

## Fonts travel with the file, or not

A vector file says "draw the text *Altitude (km)* in DejaVu Sans, 8 points". What happens if the reader's computer does not have DejaVu Sans? Either the font was packed into the file — **font embedding** — or the viewer quietly swaps in a different one, and your carefully sized labels change width and collide.

Matplotlib's PDFs embed their fonts, but by default in an old format called **[[Type 3|font-types]]**. Type 3 fonts display fine, but some publishers' checking tools reject them, and editing or searching the text in other programs can go badly. The better choice is **Type 42**, which embeds the real TrueType font. For SVG, the default turns every letter into drawn outlines, which always look right but are no longer text; you can switch to keeping real text instead.

Set these once, at the top of your plotting module, and every file you save follows them:

```python
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

plt.rcParams["pdf.fonttype"] = 42      # embed TrueType, not Type 3
plt.rcParams["ps.fonttype"] = 42       # same for EPS
plt.rcParams["svg.fonttype"] = "none"  # keep SVG text as real text

fig, ax = plt.subplots()
ax.set_xlabel("Time (s)")
fig.savefig("fonts.pdf")
data = open("fonts.pdf", "rb").read()
print(b"/Type3" in data, b"FontFile2" in data)   # False True
```

The last line peeks inside the file. `FontFile2` is how a PDF marks an embedded TrueType font program, and there is no Type 3 font left. With the default setting (`pdf.fonttype = 3`) the same test prints `True False`.

`svg.fonttype = "none"` keeps SVG text editable, but the SVG then relies on the reader having the font. That is a good trade for figures you will edit in a drawing program, and a bad one for figures you will email.

::: key
Set `pdf.fonttype = 42` so PDF text is embedded as a real TrueType font: selectable, searchable and accepted by publishers. `svg.fonttype = "none"` keeps SVG text as text, at the cost of needing the font installed.
:::

## Check the file, not the window

The last step is to look at what you actually saved, the way the reader will. Three checks catch most problems:

1. **Open the file and zoom to 400%.** Look for fuzzy lines (you saved PNG at low dpi) and tiny text (the figure was made too big and will be scaled down).
2. **Place it at its real size.** Drop it into the actual report template or slide, and look at it at 100%.
3. **Look at it in grey.** Many reports still get printed in black and white, and some readers do not see all colors. The colour lesson covers choosing colors; here is how to preview the result from a saved PNG.

```python
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from PIL import Image

t = np.linspace(0.0, 10.0, 501)
fig, ax = plt.subplots(figsize=(3.5, 2.4), layout="constrained")
ax.plot(t, np.sin(t), color="C0", label="commanded")
ax.plot(t, np.sin(t - 0.3), color="C3", label="actual")
ax.legend()
fig.savefig("pair.png", dpi=200)
Image.open("pair.png").convert("L").save("pair_grey.png")

for name, c in [("C0 blue", "#1f77b4"), ("C3 red", "#d62728")]:
    print(name, Image.new("RGB", (1, 1), c).convert("L").getpixel((0, 0)))
# C0 blue 100
# C3 red 91
```

`convert("L")` turns the image into **[[greyscale|luminance]]**: one brightness number per pixel, from $0$ (black) to $255$ (white). The printout shows why the preview matters. Matplotlib's default blue and red, which look nothing alike in color, come out as greys of $100$ and $91$ — almost the same. In a black-and-white printout, "commanded" and "actual" become two identical lines. The fix is a solid line for one and a dashed line for the other, so the difference survives without color.

::: warning Every figure through one function
Scripts that save figures in ten different places end up with ten different sizes, dpis and font settings. Write one small `save_figure(fig, stem)` function that sets the dpi, writes both a PDF and a PNG, and is the only place `savefig` is called. When the review board asks for bigger fonts, you change one line.
:::

```python
def save_figure(fig, stem, formats=("pdf", "png"), dpi=200):
    """Write fig to stem.pdf, stem.png, ... and return the paths."""
    paths = []
    for ext in formats:
        path = f"{stem}.{ext}"
        fig.savefig(path, dpi=dpi, metadata={"Title": stem})
        paths.append(path)
    return paths
```

Called as `save_figure(fig, "ascent_review")`, it returns `['ascent_review.pdf', 'ascent_review.png']`. In a batch job, follow it with `plt.close(fig)`, as the first lesson explained.

## Check yourself

::: check
A figure made at `figsize=(8, 6)` with $12$-point labels is placed into a slide box $4$ inches wide. How big do the labels look, and what would you change?
:::

::: answer
The scale factor is $s = 4 / 8 = 0.5$, so the $12$-point labels become $6$ points — far too small for a slide, where body text is usually $18$ points or more. Make the figure at the size of the box, `figsize=(4, 3)`, and set the font size to what you want to see on the slide. Then nothing is scaled when it is placed.
:::

::: check
How many pixels wide is a PNG saved from a $7$-inch-wide figure at `dpi=300`? What happens to the size of the text relative to the plot if you save it again at `dpi=100`?
:::

::: answer
$7 \times 300 = 2100$ pixels wide. At `dpi=100` it would be $700$ pixels wide. The text keeps the same size *relative to the plot* — it is still the same number of points in a $7$-inch figure — but it is drawn with three times fewer pixels in each direction, so it looks blockier when zoomed or printed.
:::

::: check
You need to plot $500{,}000$ Monte Carlo miss points with a thin red requirement circle on top, for a PDF report. What do you pass to which call, and why?
:::

::: answer
Pass `rasterized=True` to the scatter call, and save the PDF with `dpi=300`. The half-million dots become a single $300$-dpi picture inside the PDF, so the file stays small and fast to open. The requirement circle, axes, ticks and labels are not rasterized, so they stay vector: sharp at any zoom and exactly placed. Rasterizing the whole figure (saving as PNG) would make the thin circle blurry when zoomed, which is the one thing the reviewer is checking.
:::

::: check
A publisher's checking tool rejects your PDF with "Type 3 fonts found". What one setting fixes it, and what does it change inside the file?
:::

::: answer
Set `plt.rcParams["pdf.fonttype"] = 42` before saving. Matplotlib then embeds the real TrueType font program (marked `FontFile2` inside the PDF) instead of building a Type 3 font out of glyph drawings. The text looks the same, but other programs can now select, search and edit it, and the checking tool accepts it.
:::

::: check
Two traces are drawn in two colors that look very different on screen. How can you tell, from the saved PNG, whether they will still be distinguishable in a black-and-white printout?
:::

::: answer
Convert the PNG to greyscale, for example with `Image.open("f.png").convert("L")` from Pillow, and look at it, or compare the grey level of each line color. Matplotlib's default blue and red come out at about $100$ and $91$ out of $255$, nearly identical. If the greys are close, give the traces different line styles (solid and dashed) or markers so the difference does not depend on color.
:::

## Summary

| Idea | Meaning | In code or numbers |
|---|---|---|
| Vector | Shapes and text stored as instructions | PDF, SVG; sharp at any zoom |
| Raster | A grid of pixels | PNG at 200+ dpi; never JPEG for plots |
| Figure size | Physical size, set when you make it | `figsize=(3.5, 2.4)` inches |
| Point | Unit for text and line widths | $1\,\mathrm{pt} = \tfrac{1}{72}\,\mathrm{in}$ |
| Scale factor | Placed size over made size | text and lines multiply by $s$ |
| dpi | Pixels per inch of figure | pixels $=$ inches $\times$ dpi |
| Report vs slide | Small with small fonts vs big with big fonts | 3.5 in at 8 pt; 12 in at 18 pt |
| Rasterized layer | One heavy Artist as a picture inside a PDF | `rasterized=True`, `savefig(..., dpi=300)` |
| Font embedding | Font packed into the file | `pdf.fonttype = 42` |
| Greyscale check | Preview how it prints in black and white | `Image.open(p).convert("L")` |

The next lesson moves from files that sit still to figures that move and respond: animations of a trajectory, callbacks that react when you zoom, and Plotly for poking around in telemetry with your mouse.

::: context raster-vs-vector Staircases and smooth edges
A pixel is one tiny square of a single color, the smallest thing a raster image can show. Zoom into a raster line and the squares appear as a staircase. A vector line is stored as its two end points and a thickness, so the viewer redraws it cleanly at every zoom.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="20" width="140" height="100" fill="#fff" stroke="#6c7a93" stroke-width="1"/>
  <g fill="#1d6fd1">
    <rect x="20" y="100" width="20" height="20"/>
    <rect x="40" y="100" width="20" height="20"/>
    <rect x="40" y="80" width="20" height="20"/>
    <rect x="60" y="80" width="20" height="20"/>
    <rect x="80" y="60" width="20" height="20"/>
    <rect x="100" y="60" width="20" height="20"/>
    <rect x="100" y="40" width="20" height="20"/>
    <rect x="120" y="40" width="20" height="20"/>
    <rect x="140" y="20" width="20" height="20"/>
  </g>
  <text x="90" y="140" font-size="12" text-anchor="middle" fill="#1f2a44">raster, zoomed in</text>
  <rect x="200" y="20" width="140" height="100" fill="#fff" stroke="#6c7a93" stroke-width="1"/>
  <line x1="200" y1="120" x2="340" y2="20" stroke="#1d6fd1" stroke-width="8"/>
  <text x="270" y="140" font-size="12" text-anchor="middle" fill="#1f2a44">vector, zoomed in</text>
</svg>
```
:::

::: context points-unit Where the point comes from
Printers measured type long before computers. Over the centuries the point varied from country to country, but desktop publishing in the 1980s fixed it at exactly $\tfrac{1}{72}$ of an inch, and that is the point every PDF and every font menu uses today. So $72$ points make an inch, $10$-point text is about $3.5\,\mathrm{mm}$ tall from the top of the tallest letter to the bottom of the lowest, and a $1.5$-point line is about half a millimeter thick.
:::

::: context column-width Why papers use narrow columns
Long lines of text are tiring to read: your eye loses its place jumping back to the start of the next line. So many technical journals and conference papers print two columns per page, each about $3.5$ inches ($89\,\mathrm{mm}$) wide. A figure can span one column or the full page width of about $7$ inches. Knowing which one you are aiming for, before you write any plotting code, decides the `figsize`.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="100" y="10" width="160" height="180" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#6c7a93" stroke-width="2">
    <line x1="112" y1="24" x2="174" y2="24"/><line x1="112" y1="32" x2="174" y2="32"/>
    <line x1="112" y1="40" x2="174" y2="40"/><line x1="112" y1="48" x2="174" y2="48"/>
    <line x1="112" y1="112" x2="174" y2="112"/><line x1="112" y1="120" x2="174" y2="120"/>
    <line x1="112" y1="128" x2="174" y2="128"/><line x1="112" y1="136" x2="174" y2="136"/>
    <line x1="186" y1="24" x2="248" y2="24"/><line x1="186" y1="32" x2="248" y2="32"/>
    <line x1="186" y1="40" x2="248" y2="40"/><line x1="186" y1="48" x2="248" y2="48"/>
    <line x1="186" y1="56" x2="248" y2="56"/><line x1="186" y1="64" x2="248" y2="64"/>
    <line x1="186" y1="72" x2="248" y2="72"/><line x1="186" y1="80" x2="248" y2="80"/>
  </g>
  <rect x="112" y="58" width="62" height="44" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="143" y="84" font-size="11" text-anchor="middle" fill="#1f2a44">figure</text>
  <rect x="112" y="146" width="136" height="36" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <text x="180" y="168" font-size="11" text-anchor="middle" fill="#1f2a44">full-width figure</text>
  <text x="92" y="84" font-size="11" text-anchor="end" fill="#1d6fd1">3.5 in</text>
  <text x="268" y="168" font-size="11" fill="#1f2a44">about 7 in</text>
</svg>
```
:::

::: context dpi-word Dots, pixels and printers
The name comes from printers, which lay down ink in tiny dots: a $600$-dpi laser printer puts $600$ dots in every inch. Screens have pixels instead, and the careful term for them is ppi, pixels per inch. Matplotlib uses dpi for both, and in `savefig` it always means the same thing: how many pixels of the saved image stand for one inch of the figure. The file itself does not get any bigger on paper; it gets more finely divided.
:::

::: context rasterized-layer A picture inside a drawing
A PDF can hold vector shapes and embedded images side by side, the way a magazine page holds text and photos. With `rasterized=True`, matplotlib draws that one Artist into an image at the save dpi and places the image in the PDF at the right spot. Everything else is still written as shapes.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <rect x="70" y="20" width="220" height="120" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <rect x="120" y="45" width="120" height="70" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="180" y="84" font-size="12" text-anchor="middle" fill="#1f2a44">dot cloud: image</text>
  <circle cx="180" cy="80" r="48" fill="none" stroke="#b4232c" stroke-width="2"/>
  <line x1="70" y1="140" x2="70" y2="146" stroke="#1f2a44" stroke-width="2"/>
  <line x1="180" y1="140" x2="180" y2="146" stroke="#1f2a44" stroke-width="2"/>
  <line x1="290" y1="140" x2="290" y2="146" stroke="#1f2a44" stroke-width="2"/>
  <text x="180" y="166" font-size="12" text-anchor="middle" fill="#1f2a44">axes, ticks, labels, red circle: vector</text>
</svg>
```

The dot cloud costs the same whether it holds a thousand dots or a million, because an image's size depends only on its pixel count.
:::

::: context font-types Type 3 and Type 42
Both names come from Adobe's PostScript language of the 1980s and 1990s. A Type 3 font is built from ordinary drawing commands, one little drawing per letter, which is flexible but loses the hints that help fonts render cleanly and confuses tools that try to read the text back. Type 42 is a wrapper that carries a real TrueType font inside PostScript or PDF. Its number is widely told to be a nod to *The Hitchhiker's Guide to the Galaxy*, where 42 is the answer to everything.
:::

::: context luminance How color becomes grey
A color pixel stores red, green and blue brightness, each from $0$ to $255$. To make one grey value, Pillow's `convert("L")` weights them the way the eye does, since we are far more sensitive to green than to blue:

$$
L = 0.299R + 0.587G + 0.114B.
$$

Matplotlib's default blue is $(31, 119, 180)$, giving $L \approx 100$. Its default red is $(214, 39, 40)$, giving $L \approx 91$. Two colors that shout "different" on screen whisper "the same" on a black-and-white page.
:::
