---
id: l06-colour
title: Color that carries meaning
minutes: 22
covers:
  - 'Color: colourblind-safe cycles, sequential vs diverging, when color carries data'
---

A traffic light is red on top, yellow in the middle and green at the bottom. Always in that order. That order is not decoration. About one man in twelve cannot tell red from green easily, and he still drives safely, because he reads the *position* of the lit lamp. The designers made sure the message did not depend on color alone.

A subway map does something similar. Each line has a color, but it also has a name or a number printed on it, so you can find your train even in a photocopy of the map or under dim yellow lights.

A plot is the same kind of object. **Color** is one of the channels it can use to carry information, and it is a powerful one. It is also the channel most likely to fail: a colleague with color-blind eyes, a greyscale printout of a design review, a washed-out projector in a bright room. This lesson is about using color on purpose. You will learn the three jobs color can do in a plot, how to pick colors that survive color-blind eyes and greyscale printing, how to choose between **sequential** and **diverging** color maps, and when color should not carry the data at all.

## Three jobs color can do

Before choosing any colors, ask what the color is *for*. In an engineering plot it does one of three jobs.

- **Tell things apart.** Thruster 1, thruster 2, thruster 3. The colors only need to look different; none is "more" than another. This is **categorical** or **qualitative** color, and the list of colors used in turn is the **color cycle**.
- **Show how much.** Heat flux over a heat shield, from low to high. Here the color must have an order that the eye reads without a legend: darker is less, lighter is more, or the reverse. This is a **sequential** color map.
- **Show above or below a center.** Landing miss distance east or west of the target, or an error that is positive or negative. Two hues, fading to a neutral color at the center value. This is a **diverging** color map.

A **color map** (Matplotlib says **colormap**) is a function from a number between 0 and 1 to a color. `imshow`, `pcolormesh`, `contourf` and `scatter` with `c=` all use one. A **norm** first squeezes your data into the 0 to 1 range, and the colormap then paints it.

Mixing up these jobs is the root of most bad color. A rainbow on a categorical plot suggests an order that is not there. A categorical palette on a heat map hides which regions are hot.

::: key
Categorical color tells things apart (a cycle such as `tab10`). Sequential color shows magnitude with lightness that changes in one direction (`viridis`, `cividis`). Diverging color shows departure from a meaningful center, with a neutral middle (`RdBu_r`, `coolwarm`).
:::

## Who cannot see your colors

The eye has three kinds of color sensors, called **[[cones|cone-cells]]**. In about 8 percent of men and about half a percent of women of Northern European descent, the red-sensing or green-sensing cones work differently or not at all. This is **color vision deficiency**, often called color blindness, and the red-green kinds are by far the most common. On a team of twenty engineers, there is a good chance at least one reads your plots this way.

The red-green kinds squash red and green toward the same muddy olive. That is why the classic pair "red for failed, green for passed" is a trap.

Greyscale is the second audience. Design review packages still get printed on monochrome printers and photocopied. In greyscale, only the **lightness** of each color survives: how bright it looks, from black to white. Two colors with the same lightness become the same gray.

A common way to estimate the gray a printer produces from a color with red, green and blue parts $R$, $G$, $B$ (each from 0 to 1) is

$$
Y = 0.299\,R + 0.587\,G + 0.114\,B.
$$

$Y$ is called **[[luma|luma-weights]]**. Green gets the biggest weight because the eye is most sensitive to it.

::: example Which color pairs survive?
Compute the greyscale value of some familiar pairs, on a scale of 0 (black) to 255 (white).

```python
import numpy as np
from matplotlib.colors import to_rgb

def grey(c):
    """Greyscale brightness 0 (black) to 255 (white), as most printers see it."""
    r, g, b = to_rgb(c)
    return round(255 * (0.299 * r + 0.587 * g + 0.114 * b))

pairs = {
    "red vs green": ("tab:red", "tab:green"),
    "blue vs orange": ("tab:blue", "tab:orange"),
    "Okabe-Ito blue vs orange": ("#0072B2", "#E69F00"),
}
for name, (a, b) in pairs.items():
    print(f"{name:26s} {grey(a):3d} {grey(b):3d}  diff {abs(grey(a) - grey(b))}")
# red vs green                91 112  diff 21
# blue vs orange             100 152  diff 52
# Okabe-Ito blue vs orange    87 162  diff 75
```

**Step 1.** `to_rgb` turns any Matplotlib color name or hex code into three numbers from 0 to 1. `"tab:red"` is the red of Matplotlib's default cycle, hex `#d62728`.

**Step 2.** The weighted sum gives the gray. For `tab:red`: $0.299 \times 0.839 + 0.587 \times 0.153 + 0.114 \times 0.157 \approx 0.3586$, and $0.3586 \times 255 \approx 91.4$, which rounds to 91.

**Step 3, compare.** The default red and green land at 91 and 112, only 21 steps apart out of 255, about 8 percent of the range. On paper they look like two nearly identical mid-grays. Matplotlib's default blue and orange are 52 apart. The blue and orange of the **[[Okabe-Ito|okabe-ito]]** palette, a palette built for color-blind readers, are 75 apart: a dark gray and a light gray.

**Sanity check.** Orange looks lighter than blue to most people, and it comes out lighter here. The numbers agree with your eyes.
:::

You can also estimate what a color-blind reader sees. Published models turn each color into its appearance for a given deficiency. The one below is a standard model for **deuteranopia**, the form with no working green cones. You do not need to memorize its numbers; what matters is what it shows.

```python
import numpy as np
from matplotlib.colors import to_rgb, to_hex

# Deuteranopia (no working green cones), from Machado, Oliveira and Fernandes (2009).
# It acts on linear light, so undo the sRGB gamma first and redo it after.
M = np.array([[0.367322, 0.860646, -0.227968],
              [0.280085, 0.672501, 0.047413],
              [-0.011820, 0.042940, 0.968881]])

def to_linear(c):
    c = np.asarray(c)
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)

def to_srgb(c):
    c = np.clip(c, 0.0, 1.0)
    return np.where(c <= 0.0031308, 12.92 * c, 1.055 * c ** (1 / 2.4) - 0.055)

def deutan(color):
    return to_hex(to_srgb(M @ to_linear(to_rgb(color))))

for c in ["tab:red", "tab:green", "#0072B2", "#E69F00"]:
    print(f"{c:10s} {to_hex(c)} -> {deutan(c)}")
# tab:red    #d62728 -> #8b7c1f
# tab:green  #2ca02c -> #968838
# #0072B2    #0072b2 -> #3b67b1
# #E69F00    #e69f00 -> #cab411
```

The red and the green both become a dark olive, `#8b7c1f` and `#968838`, close enough to confuse. The blue stays blue and the orange becomes a light yellow: still easy to tell apart. The step called **[[gamma|gamma-linear]]** at the start and end is there because screen colors are stored on a curved brightness scale, and the model works on true light intensity.

::: key
Color may encode a category, never a critical distinction on its own: use line style or markers as well, keep to a colorblind-safe cycle, and check the figure in greyscale. Two signals distinguished only by red versus green is a defect.
:::

## Colorblind-safe cycles, doubled up with line styles

Matplotlib's default cycle is `tab10`, ten colors from the Tableau software palette. Its first two, blue and orange, are a good pair. Its third and fourth, green and red, are the bad pair from the example.

Two safer starting points:

- the built-in style `plt.style.use("tableau-colorblind10")`, whose colors were chosen for color-blind readers;
- the Okabe-Ito palette, eight colors from vision research, widely used in scientific figures: blue `#0072B2`, orange `#E69F00`, bluish green `#009E73`, vermillion `#D55E00`, reddish purple `#CC79A7`, sky blue `#56B4E9`, yellow `#F0E442` and black.

Even a safe palette is not safe enough on its own. Some Okabe-Ito pairs, such as vermillion and bluish green, come out close in greyscale. So the rule is to change **two** things at once for each line: its color *and* its line style (or its marker). Matplotlib does this with a **cycler**, an object from the `cycler` package that lists the properties to step through. Adding two cyclers with `+` pairs them up entry by entry: first color with first style, second with second.

::: example A cycle that survives any printer
Four thruster traces, each distinguished two ways.

```python
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from cycler import cycler

okabe_ito = ["#0072B2", "#E69F00", "#009E73", "#D55E00", "#CC79A7", "#56B4E9"]
styles = ["-", "--", ":", "-.", (0, (5, 1, 1, 1)), (0, (1, 1))]
safe_cycle = cycler(color=okabe_ito) + cycler(linestyle=styles)

t = np.linspace(0.0, 5.0, 201)        # s
fig, ax = plt.subplots(figsize=(6, 3), layout="constrained")
ax.set_prop_cycle(safe_cycle)
for k in range(4):
    ax.plot(t, np.exp(-t) * np.cos(3 * t + k), label=f"thruster {k + 1}")
ax.set_xlabel("Time since firing (s)")
ax.set_ylabel("Chamber pressure error (bar)")
ax.legend(loc="upper left", bbox_to_anchor=(1.02, 1.0))

fig.canvas.draw()
rgba = np.asarray(fig.canvas.buffer_rgba())                 # height x width x 4
grey = rgba[:, :, :3] @ np.array([0.299, 0.587, 0.114])     # what a mono printer sees
print(rgba.shape, grey.shape)
print(len(safe_cycle))
# (300, 600, 4) (300, 600)
# 6
```

**Step 1, build the cycle.** Six colors plus six line styles, added, give a cycle of length 6. A dash pattern like `(0, (5, 1, 1, 1))` means "start at offset 0, then 5 points on, 1 off, 1 on, 1 off", a dash-dot with tight gaps.

**Step 2, use it.** `ax.set_prop_cycle(safe_cycle)` gives this axes the new cycle. Each `ax.plot` call takes the next color *and* the next style.

**Step 3, see it in gray.** `fig.canvas.draw()` renders the figure in memory. `buffer_rgba()` hands back the pixels: $300 \times 600$ because the figure is $6 \times 3$ inches at Matplotlib's default 100 dots per inch. The `@` with the luma weights turns every pixel into its gray value, which you can save with `plt.imsave("grey.png", grey, cmap="gray")` and look at.

**Sanity check.** In the gray version, the four traces are still solid, dashed, dotted and dash-dot. Even if two colors became the same gray, the reader can still match every line to its legend entry.
:::

To use a cycle for every plot in a script, set it once: `plt.rcParams["axes.prop_cycle"] = safe_cycle`. That changes the default, the same thing a style file does.

::: warning The greyscale check is not optional
Looking at your figure on your own screen tells you nothing about how it prints. Render it to gray, with the few lines above or by printing one page, before it goes into a review package. If two lines merge, fix the style, not the colors alone.
:::

## Sequential maps: lightness must climb

For a quantity with an order, such as temperature or heat flux, a reader's eye judges "more" and "less" by lightness far more than by hue. So a good sequential colormap has lightness that changes in *one* direction the whole way: dark to light, with no bumps. A map built so that equal steps in data look like equal steps in color is called **[[perceptually uniform|perceptual-uniformity]]**.

`viridis`, Matplotlib's default colormap, is built this way. `cividis` goes further and was designed to look almost the same to people with red-green deficiency. The old default, **[[jet|jet-history]]**, a rainbow from dark blue through cyan, yellow and red, is not.

::: example Lightness along two colormaps
Sample each map at nine evenly spaced points and compute the gray value of each color.

```python
import numpy as np
import matplotlib

def grey_ramp(name, n=9):
    cmap = matplotlib.colormaps[name]
    rgb = cmap(np.linspace(0.0, 1.0, n))[:, :3]          # drop the alpha column
    return np.round(255 * rgb @ [0.299, 0.587, 0.114]).astype(int)

for name in ["viridis", "jet"]:
    print(f"{name:8s}", grey_ramp(name))
# viridis  [ 31  62  82  97 111 129 157 187 216]
# jet      [ 15  29 104 182 201 220 163  94  38]
```

**Step 1.** `matplotlib.colormaps["viridis"]` fetches the colormap. Calling it on nine numbers from 0 to 1 returns nine RGBA colors; `[:, :3]` keeps the red, green and blue columns.

**Step 2.** Multiplying by the luma weights gives nine grays.

**Step 3, read.** `viridis` climbs every step, 31 to 216: in greyscale it is a clean dark-to-light ramp, so "lighter means more" still works on paper. `jet` climbs to 220 at three quarters of the way and then falls back to 38 at the top. In greyscale its highest value looks almost as dark as its lowest.

**What it does to a reader.** On screen, the bright yellow band in the upper middle of `jet` jumps out and reads as a feature, a hot spot or a boundary, even where the data is smooth. That false band is an artifact of the colormap, not of the data.
:::

Every color plot needs a **colorbar**, the key that turns colors back into numbers, and it needs a unit: `fig.colorbar(im, ax=ax, label="Heat flux (kW/m²)")`. A colorbar without a unit is an axis without a label.

## Diverging maps: pin the center

Some quantities have a meaningful middle. A landing miss is east or west of the target, and zero means on target. A temperature is above or below its qualification limit. For these, a **diverging** colormap uses two hues, such as blue for negative and red for positive, fading to white or light gray at the **center**. `RdBu_r` ("red-blue, reversed", so that red is high) and `coolwarm` are common choices.

The colormap alone does not know where your center is. The **norm** decides which data value lands on the white middle of the map. Matplotlib's default norm stretches your smallest value to 0 and your largest to 1, and puts whatever falls halfway at the white middle. If your data runs from $-2$ to $+6$, that middle is $+2$, not zero.

There are two fixes.

- Make the limits symmetric: `vmin=-6, vmax=6`. Zero lands at the middle, and the negative colors are less saturated because the data does not reach $-6$.
- Use `TwoSlopeNorm(vmin=-2, vcenter=0, vmax=6)`, which stretches each side separately so that zero lands exactly at the middle.

```python
import numpy as np
from matplotlib.colors import Normalize, TwoSlopeNorm

err = np.array([-2.0, -1.0, 0.0, 3.0, 6.0])      # m, cross-range miss

plain = Normalize(vmin=err.min(), vmax=err.max())
centered = TwoSlopeNorm(vmin=-2.0, vcenter=0.0, vmax=6.0)
print(np.round(plain(err), 3))
print(np.round(centered(err), 3))
# [0.    0.125 0.25  0.625 1.   ]
# [0.   0.25 0.5  0.75 1.  ]
```

With the plain norm, a miss of exactly $0\,\mathrm{m}$ maps to $0.25$, a fairly strong blue: the reader sees "west of target" where the vehicle landed dead on. With `TwoSlopeNorm`, zero maps to $0.5$, the white center. Pass the norm to the plot with `norm=centered` and the colormap with `cmap="RdBu_r"`.

::: key
Sequential maps are for magnitude with no special middle. Diverging maps are for signed data around a meaningful center, and the center must be pinned with symmetric `vmin`/`vmax` or `TwoSlopeNorm(vcenter=...)`.
:::

::: warning A diverging map on one-sided data
Using `RdBu_r` for a quantity that is always positive, such as heat flux, puts white in the middle of your range and tells the reader the middle value is special. It is not. One-sided data takes a sequential map.
:::

## When color should, and should not, carry the data

Color is at its best when it separates a few things or points at one. It is at its worst when it is asked to carry the key fact alone.

A strong pattern in flight reviews is **[[emphasis by color|grey-context]]**: draw most of the data in light gray and one thing in a strong color. Hundreds of Monte Carlo runs go in pale gray; the three runs that broke a requirement go in a saturated color, drawn thicker and with markers. The reader's eye lands on the violators first, which is exactly where the review should start.

Some habits keep color honest:

- **Use as few colors as the message needs.** Four lines need four colors. Eight overlapping lines usually need a different plot, such as small multiples (one small panel per line).
- **Keep a color's meaning fixed across a figure set.** If thruster 2 is orange on page 3, it is orange on page 30. Set the cycle once, in a style or in `rcParams`, not by hand in each script.
- **Never let color be the only channel for pass and fail.** Add a marker, a text label or a line style.
- **Red means danger to most readers.** Save it for violations and limits.

## Check yourself

::: check
A reviewer prints your four-line plot in greyscale and cannot tell "nominal" from "backup", drawn in `tab:green` and `tab:red`. What went wrong, and what is the fix that works for every reader?
:::

::: answer
The two colors have almost the same lightness: their greyscale values are about 112 and 91 out of 255, too close to tell apart on paper. The same pair also collapses for red-green color-blind readers. The fix is to distinguish the lines a second way: give each its own line style or marker, with a cycler that pairs a colorblind-safe color list with a style list, `cycler(color=[...]) + cycler(linestyle=[...])`. Then check the figure in greyscale again before sending it.
:::

::: check
Compute the greyscale value (0 to 255) of pure red `#FF0000` and pure green `#00FF00`. Are they distinguishable in greyscale? Would they be distinguishable for a deuteranope?
:::

::: answer
Pure red: $255 \times 0.299 \approx 76$. Pure green: $255 \times 0.587 \approx 150$. They differ by about 74, so a greyscale printout does tell them apart. But the greyscale test only protects against greyscale. A deuteranope sees both as olive-yellow shades, and the lightness difference alone is a weak cue to rely on. So you still add a line style or marker. Passing one test does not mean passing the other.
:::

::: check
You are plotting the temperature of a heat shield, from $300\,\mathrm{K}$ to $1900\,\mathrm{K}$, as a colored image. Which kind of colormap, which specific map, and what goes on the colorbar?
:::

::: answer
Temperature here is one-sided magnitude with no special middle, so a sequential map: `viridis` (or `cividis` for the best color-blind behavior, or `inferno`, which also has steadily rising lightness). Not `jet`, whose lightness rises and falls and invents bands, and not a diverging map, which would suggest $1100\,\mathrm{K}$ is special. The colorbar gets a label with the unit: `fig.colorbar(im, ax=ax, label="Temperature (K)")`.
:::

::: check
An attitude error map runs from $-0.5^\circ$ to $+2.0^\circ$. With `cmap="RdBu_r"` and no norm, what color does an error of exactly zero get, and how do you fix it?
:::

::: answer
The default norm maps $-0.5$ to 0 and $+2.0$ to 1, so zero maps to $(0 - (-0.5))/(2.0 - (-0.5)) = 0.5/2.5 = 0.2$. That is on the blue side, well away from the white center, so a perfect attitude looks like a negative error. Fix it with `norm=TwoSlopeNorm(vmin=-0.5, vcenter=0.0, vmax=2.0)`, which maps zero to exactly $0.5$, or with symmetric limits `vmin=-2.0, vmax=2.0`.
:::

::: check
You must show 500 Monte Carlo trajectories and the 4 that violate the altitude floor. Describe a color scheme that makes the violators obvious and still works in greyscale.
:::

::: answer
Draw the 500 runs in a light gray, thin, perhaps partly transparent, so together they read as a cloud. Draw the 4 violators in one strong color such as vermillion `#D55E00`, thicker, with a marker at the point where each crosses the floor. Draw the altitude floor as a dashed dark line, labeled. In greyscale the violators are dark, thick and marked against a pale cloud, so they still stand out: the emphasis never depended on hue alone.
:::

## Summary

| Idea | Meaning | Code or fact |
|---|---|---|
| Categorical color | tells things apart, no order | a cycle: `tab10`, Okabe-Ito |
| Sequential colormap | magnitude, lightness rising one way | `viridis`, `cividis` |
| Diverging colormap | signed data around a center | `RdBu_r`, `coolwarm` with a pinned center |
| Pinning the center | zero lands on the neutral middle | `TwoSlopeNorm(vcenter=0)` or symmetric `vmin`/`vmax` |
| Luma | greyscale brightness of a color | $Y = 0.299R + 0.587G + 0.114B$ |
| Red-green deficiency | about 8% of men, 0.5% of women | never rely on red versus green alone |
| Double encoding | color plus line style or marker | `cycler(color=...) + cycler(linestyle=...)` |
| Greyscale check | render and convert to gray | `buffer_rgba()` then luma weights |
| Colorbar | the key back to numbers | `fig.colorbar(im, label="Quantity (unit)")` |

The greyscale check looked at the figure in memory. The next lesson is about getting it out of memory and onto the page: vector and raster formats, dpi, fonts, and the right figure size for a slide versus a report.

::: context cone-cells The three color sensors in your eye
Your retina has three kinds of cone cells, each most sensitive to a different band of light: long wavelengths (reddish), medium (greenish) and short (bluish). Every color you see is your brain comparing the three signals. The long and medium cones respond to heavily overlapping bands, and the genes for both sit on the X chromosome. Men have one X chromosome, so one altered gene is enough to change their color vision; women have two, and usually one working copy covers for the other. That is why red-green deficiency is so much more common in men.
:::

::: context luma-weights Why green counts most
The three weights say how much each primary contributes to how bright a color looks. They add to 1, so white ($R = G = B = 1$) gives $Y = 1$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="120" x2="330" y2="120" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="60" y="60.2" width="60" height="59.8" fill="#b4232c"/>
  <rect x="150" y="2.6" width="60" height="117.4" fill="#2f8f4e"/>
  <rect x="240" y="97.2" width="60" height="22.8" fill="#1d6fd1"/>
  <text x="90" y="54" font-size="12" text-anchor="middle" fill="#1f2a44">0.299</text>
  <text x="180" y="18" font-size="12" text-anchor="middle" fill="#ffffff">0.587</text>
  <text x="270" y="91" font-size="12" text-anchor="middle" fill="#1f2a44">0.114</text>
  <text x="90" y="138" font-size="12" text-anchor="middle" fill="#1f2a44">R</text>
  <text x="180" y="138" font-size="12" text-anchor="middle" fill="#1f2a44">G</text>
  <text x="270" y="138" font-size="12" text-anchor="middle" fill="#1f2a44">B</text>
</svg>
```

These particular numbers come from an old television standard. Newer standards use slightly different weights, and careful work uses a lightness measure called CIE L*, but all agree on the shape: green dominates, blue barely counts.
:::

::: context okabe-ito A palette from vision research
Masataka Okabe and Kei Ito, two Japanese biologists, published their eight-color set as part of their "Color Universal Design" guidance around 2002. They chose colors that keep distinct hues for the common forms of color vision deficiency, avoiding the pure red and pure green that collapse together. Many journals now point authors to it. It is a strong default for up to about seven lines, as long as you still pair it with line styles.
:::

::: context gamma-linear Screen numbers are not light
A pixel value of 128 is not half the light of 255; it is closer to a fifth. Screens store colors on a curved scale, called gamma encoding, because the eye is more sensitive to differences between dark shades, so it spends more of the available numbers there. Anything that models physical light, such as mixing cone responses, has to undo that curve first, work on the true intensities, and then reapply it. That is what `to_linear` and `to_srgb` do in the simulation code.
:::

::: context perceptual-uniformity Equal steps that look equal
In a perceptually uniform colormap, going from 0.1 to 0.2 looks like the same size of change as going from 0.8 to 0.9. Designers build these maps in a color space where distances match what people perceive, and keep the lightness rising at a steady rate.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="140" x2="340" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="20" x2="40" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline points="40,125.4 77.5,110.8 115,101.4 152.5,94.4 190,87.8 227.5,79.3 265,66.1 302.5,52 340,38.4" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <polyline points="40,132.9 77.5,126.4 115,91 152.5,54.4 190,45.4 227.5,36.5 265,63.3 302.5,95.8 340,122.1" fill="none" stroke="#b4232c" stroke-width="2.5" stroke-dasharray="6 3"/>
  <text x="300" y="34" font-size="12" text-anchor="end" fill="#1d6fd1">viridis</text>
  <text x="228" y="28" font-size="12" text-anchor="middle" fill="#b4232c">jet</text>
  <text x="190" y="160" font-size="11" text-anchor="middle" fill="#1f2a44">position along the colormap, 0 to 1</text>
  <text x="46" y="16" font-size="11" fill="#1f2a44">grey value</text>
</svg>
```

The curves are the gray values from the lesson's example: `viridis` climbs steadily, `jet` rises and falls.
:::

::: context jet-history Why the rainbow was retired
`jet` came to Matplotlib from MATLAB, where it was the default for years, and it was Matplotlib's default colormap too until version 2.0 in 2017. Studies of how people read rainbow maps found that they invent boundaries at the bright cyan and yellow bands and hide real gradients inside the broad blue and red regions. Matplotlib's developers designed `viridis` as its replacement: perceptually uniform, readable in greyscale, and usable with the common color vision deficiencies.
:::

::: context grey-context Gray as a design tool
Gray is the most useful color in an engineering figure. Anything that is context, such as the bulk of an ensemble, the previous flight, or grid lines, goes in gray, so the one thing the figure is about can take the only strong color. The same move works for a previous flight overlaid on today's, or for grid and reference lines: whatever the reader should look past goes gray, and whatever the reader should look at gets the color.
:::
