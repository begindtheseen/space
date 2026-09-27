---
id: l14-plotting-and-timetables
title: Plotting flight data and lining up time
minutes: 24
covers:
  - 'Plotting: plot, tiledlayout, yyaxis, semilogx, exportgraphics'
  - timetable, synchronize and retime as the merge_asof equivalent
---

Look at a car's dashboard. Speed, engine revs, fuel and temperature sit side by side, and every gauge shows the *same moment*. You glance once and see the whole story: "the engine is revving hard but the speed is not rising — something is slipping". If each gauge showed a different moment, the dashboard would be useless.

A flight-test **[[quick-look|quick-look]]** figure is a dashboard drawn after the fact: six panels stacked on one shared time axis, with the interesting stretch of the flight shaded. This lesson builds that figure. First the drawing tools: `plot`, `tiledlayout`, `linkaxes`, `yyaxis`, logarithmic axes, shaded bands and `exportgraphics`. Then the other half of the dashboard rule, *every gauge shows the same moment*: **timetables**, and `retime` and `synchronize`, which line up sensors that record at different rates.

Lesson 13 made scripts fast enough to produce plenty of results. Now you show them.

## plot: one line on one set of axes

`plot(x, y)` draws `y` against `x` as a connected line. MATLAB puts it in the current **figure** (the window) on the current **axes** (the box with the tick marks), creating both if needed. If you know Python's [[matplotlib|matplotlib]], the commands will feel familiar.

```matlab
t = 0:0.1:80;                    % s
v = 20*t;                        % m/s, the toy ascent from lesson 13
h = 10*t.^2;                     % m

figure
plot(t, h/1000, 'b-', 'LineWidth', 1.5)
hold on
plot(t, v/100, 'r--')
hold off
xlabel('Time (s)')
ylabel('Value')
legend('Altitude (km)', 'Speed (100 m/s)')
grid on
xlim([0 60])
```

The third input, `'b-'`, is a **line spec**: a short code for color and style. `b` is blue, `r` red, `k` black; `-` is solid, `--` dashed, `:` dotted, and a marker letter such as `o` adds circles. After it come **name-value pairs**, such as `'LineWidth', 1.5`. Normally each `plot` replaces what the axes held. `hold on` tells MATLAB to keep what is there and add to it, and `hold off` goes back to replacing.

Every plotting call can hand back the object it drew: `p = plot(t, h)` gives you the line, and `ax = gca` ("get current axes") gives you the axes. You change an object's settings, its **properties**, with a dot: `p.LineWidth = 2`. MATLAB calls this system [[handle graphics|handle-graphics]].

## Many panels: tiledlayout and nexttile

A quick-look needs several axes in one figure. `tiledlayout(m, n)` divides the figure into a grid of $m$ rows and $n$ columns of **tiles**. `nexttile` then creates axes in the next empty tile and makes them current, so the next `plot` lands there. Tiles are [[numbered across the rows|tile-numbering]]: in a 3-by-2 layout, tiles 1 and 2 are the top row, 3 and 4 the middle, 5 and 6 the bottom.

```matlab
tl = tiledlayout(3, 2, 'TileSpacing', 'compact', 'Padding', 'compact');
nexttile
plot(t, h/1000)
nexttile
plot(t, v)
xlabel(tl, 'Time (s)')          % one label for the whole layout
title(tl, 'Toy ascent')         % one title for the whole layout
```

The layout object `tl` is what makes this tidy:

- `'TileSpacing'` sets the gap between tiles and `'Padding'` the margin around the grid. `'compact'` squeezes both; since R2021a, `'tight'` squeezes further still.
- `xlabel(tl, ...)`, `ylabel(tl, ...)` and `title(tl, ...)` put **one** shared label on the whole grid, instead of six copies of "Time (s)".
- `nexttile(5)` jumps to tile 5. `nexttile([1 2])` makes one set of axes that spans one row and two columns — a wide panel.

`tiledlayout` arrived in R2019b. The older tool is `subplot(m, n, k)`, which makes axes in position `k` of an $m$-by-$n$ grid, counting the same way. It still works, and you will see it everywhere in older code.

::: key
tiledlayout versus subplot: tiledlayout manages spacing and shared labels, supports tight padding and lets you add tiles without recomputing indices. subplot still works but wastes space and needs manual position fiddling for publication figures.
:::

## One time axis for all: linkaxes

When you zoom into one panel to inspect a glitch, you want the other five to zoom with it, like dashboard gauges all showing one moment. `linkaxes(ax, 'x')` does that. It takes an array of axes and ties their x-limits together: change the limits on one, by zooming or with `xlim`, and every linked axes follows. `'y'` links the y-limits instead, and `'xy'` both. To use it, keep each axes that `nexttile` returns:

```matlab
ax = gobjects(1, 6);             % an empty array to hold 6 graphics objects
for k = 1:6
    ax(k) = nexttile(tl);
    % ... plot into ax(k) ...
end
linkaxes(ax, 'x')
xlim(ax(1), [20 40])             % all six panels now show 20 s to 40 s
```

`gobjects` preallocates an array for graphics objects, the way `zeros` does for numbers (lesson 13's habit again). With a shared time axis the tick labels on the upper rows are repeats, so a quick-look usually hides them: `set(ax(1:4), 'XTickLabel', [])` blanks tiles 1 to 4 and leaves labels only on the bottom row.

## Two quantities, one axes: yyaxis

Sometimes two quantities belong in one panel — you want to see *when* one peaks relative to the other — but their sizes differ. Dynamic pressure runs up to about 77,000 Pa, altitude up to 64 km; on one y-axis, one of them would be squashed flat.

`yyaxis` gives an axes two y-axes, one on each side. `yyaxis left` makes the left one active, so the next `plot` and `ylabel` apply to it. `yyaxis right` switches to the right one.

```matlab
rho = 1.225*exp(-h/8500);        % kg/m^3
q   = 0.5*rho.*v.^2;             % Pa

yyaxis left
plot(t, q/1000)
ylabel('q (kPa)')
yyaxis right
plot(t, h/1000)
ylabel('Altitude (km)')
```

::: warning Two y-axes can mislead
Where two curves cross on a `yyaxis` plot means nothing: each side has its own scale, and moving one scale moves the crossing. Use `yyaxis` to compare *timing* — "q peaks before altitude reaches 10 km" — never to compare sizes. And label both sides, always.
:::

## Logarithmic axes: semilogx, semilogy, loglog

Some quantities span many powers of ten. Air density falls by a factor of almost 2,000 over our toy ascent. A sensor's response is studied from 0.1 Hz to 1,000 Hz, four **decades** (a decade is a factor of 10). On an ordinary axis, everything below the top decade is crushed against zero.

A **[[logarithmic axis|log-axis]]** spaces the ticks by factors instead of by steps: 0.1, 1, 10, 100 and 1,000 are evenly spaced. Three functions make one:

- `semilogx(x, y)` — logarithmic x, ordinary y. The standard for anything plotted against frequency.
- `semilogy(x, y)` — ordinary x, logarithmic y. Good for density against time, or an error that shrinks by factors.
- `loglog(x, y)` — both logarithmic.

`logspace(a, b, n)` makes $n$ points from $10^a$ to $10^b$, evenly spread on a log axis.

::: example The response of a sensor filter
An accelerometer's signal passes through a first-order low-pass filter with a **cutoff frequency** $f_c = 10$ Hz, which lets slow motion through and weakens fast vibration. Its gain at frequency $f$ is $|H| = 1/\sqrt{1 + (f/f_c)^2}$, and engineers quote gain in **[[decibels|decibels]]**: $20\log_{10}|H|$. Plot it from 0.1 Hz to 1 kHz.

```matlab
fc = 10;                                  % Hz
f  = logspace(-1, 3, 401);                % 0.1 Hz to 1000 Hz
magdB = 20*log10(1 ./ sqrt(1 + (f/fc).^2));

semilogx(f, magdB)
grid on
xlabel('Frequency (Hz)')
ylabel('Gain (dB)')

k = [201 301 401];
fprintf('%6.0f Hz  %7.2f dB\n', [f(k); magdB(k)])
%     10 Hz    -3.01 dB
%    100 Hz   -20.04 dB
%   1000 Hz   -40.00 dB
```

Step by step. `logspace(-1, 3, 401)` puts 100 points in each of the four decades, so point 201 lands on $10^1 = 10$ Hz and point 301 on $10^2 = 100$ Hz. At the cutoff, $|H| = 1/\sqrt{1+1} = 0.7071$, and $20\log_{10}(0.7071) = -3.01$ dB. At 100 Hz, $|H| = 1/\sqrt{1 + 100} = 0.0995$, which is $-20.04$ dB.

Sanity check: well above the cutoff, $|H|$ is close to $f_c/f$, so each factor of 10 in frequency cuts the gain by 10, which is $-20$ dB. From 100 Hz to 1,000 Hz the gain went from $-20.0$ to $-40.0$ dB: exactly one such step. On the `semilogx` plot that part is a straight line sloping down, the shape every controls engineer learns to read.
:::

::: warning A log axis cannot show zero
The logarithm of zero or a negative number does not exist, so those points are left off a log axis. Start a frequency vector with `logspace`, never with `0:...`. And set the scale before you add to the plot: call `semilogx` first and `hold on` after, or set it outright with `ax.XScale = 'log'`.
:::

## Shading a band

A shaded band marks a stretch of the flight — the engine burn, or the time when dynamic pressure is above a limit — so the eye goes straight there on every panel.

Since R2023a, `xregion(x1, x2)` shades the vertical strip between $x_1$ and $x_2$ across the full height of the axes, and `xregion(ax, x1, x2)` does it on a chosen axes. Its partner `yregion` shades a horizontal strip, which suits a limit band such as "within $\pm 2$ degrees". For a single moment instead of a stretch, `xline(29.2, '--', 'max q')` draws a labeled vertical line (R2018b and later).

On an older release, draw the band yourself as a filled rectangle with `patch`. It takes the x- and y-coordinates of the corners, in order around the shape, and a color:

```matlab
yl = ylim(ax(k));                               % current y-limits
patch(ax(k), [t1 t2 t2 t1], [yl(1) yl(1) yl(2) yl(2)], [1 0.8 0.5], ...
      'EdgeColor', 'none', 'FaceAlpha', 0.3);
ylim(ax(k), yl)                                 % keep the limits fixed
```

`'FaceAlpha', 0.3` makes the fill 30% opaque, so the data lines show through it. `'EdgeColor', 'none'` removes the outline.

A band can also follow the data. To shade the region between a lower curve `lo` and an upper curve `hi` — a $\pm 3\sigma$ envelope from a Monte Carlo run, say — walk along the bottom curve and back along the top one: `fill([t fliplr(t)], [lo fliplr(hi)], [0.7 0.8 1], 'EdgeColor', 'none')` for row vectors. `fliplr` reverses a row, so the outline comes back the way it went.

## Saving the figure: exportgraphics

`exportgraphics` (R2020a and later) writes a figure, or a single axes, to a file, trimmed tight around the content with no wasted border:

```matlab
exportgraphics(f, 'ascent_quicklook.png', 'Resolution', 300)
exportgraphics(f, 'ascent_quicklook.pdf', 'ContentType', 'vector')
```

The file extension picks the format. A PNG is a **[[raster|raster-vector]]** image, a grid of pixels, and `'Resolution'` sets how many pixels per inch — 300 is print quality. A PDF with `'ContentType', 'vector'` stores the lines and text as shapes, so it stays sharp at any zoom, which is what you want in a design-review report. Older code uses `saveas` or `print`, which leave more blank margin.

::: example The six-panel quick-look
Build the full figure for the toy ascent: six panels on a shared time axis, with the stretch where $q \ge 30$ kPa shaded on every panel. For Mach number, the speed of sound $a = \sqrt{\gamma R T}$ (with $\gamma = 1.4$ and $R = 287.05\,\mathrm{J/(kg\,K)}$ for air) uses the standard-atmosphere temperature, which falls $6.5$ K per km from $288.15$ K up to 11 km; above that we hold it at $216.65$ K, a simplification.

```matlab
t   = (0:0.1:80)';                        % s, 801 samples
v   = 20*t;                               % m/s
h   = 10*t.^2;                            % m
rho = 1.225*exp(-h/8500);                 % kg/m^3
q   = 0.5*rho.*v.^2;                      % Pa
T   = max(288.15 - 0.0065*h, 216.65);     % K
M   = v ./ sqrt(1.4*287.05*T);            % Mach number
n   = (20 + 9.80665)/9.80665 * ones(size(t));   % load factor, g

inBand = q >= 30e3;
tb = [t(find(inBand, 1, 'first')), t(find(inBand, 1, 'last'))];
fprintf('band %.1f s to %.1f s\n', tb)
%   band 12.1 s to 50.9 s

f  = figure;
tl = tiledlayout(f, 3, 2, 'TileSpacing', 'compact', 'Padding', 'compact');
ax = gobjects(1, 6);

ax(1) = nexttile(tl);  plot(t, h/1000);   ylabel('Altitude (km)')
ax(2) = nexttile(tl);  plot(t, v);        ylabel('Speed (m/s)')
ax(3) = nexttile(tl);  plot(t, M);        ylabel('Mach')
ax(4) = nexttile(tl);  plot(t, n);        ylabel('Load factor (g)')
ax(5) = nexttile(tl);  semilogy(t, rho);  ylabel('Density (kg/m^3)')
ax(6) = nexttile(tl);  plot(t, q/1000);   ylabel('q (kPa)')

linkaxes(ax, 'x')
xlim(ax(1), [0 80])
set(ax(1:4), 'XTickLabel', [])
for k = 1:6
    grid(ax(k), 'on')
    xregion(ax(k), tb(1), tb(2));         % R2023a+; use the patch recipe before that
end
xlabel(tl, 'Time (s)')
title(tl, 'Toy ascent: shaded where q \geq 30 kPa')

exportgraphics(f, 'ascent_quicklook.png', 'Resolution', 300)
```

Step by step. The first block computes six channels, all element-wise (lesson 4). `find(inBand, 1, 'first')` and `find(inBand, 1, 'last')` return the first and last samples where $q \ge 30$ kPa: the band's edges, 12.1 s and 50.9 s. The six `nexttile` calls fill the grid row by row, keeping each axes in `ax`. Tile 5 uses `semilogy`, because density falls from $1.225$ to about $0.00066\,\mathrm{kg/m^3}$, a factor of about 1,860. `linkaxes` ties all six time axes, one `xlim` sets them all, and the loop adds a grid and the band to each panel. The labels use MATLAB's **[[TeX markup|tex-markup]]**: `^3` becomes a superscript and `\geq` becomes $\geq$.

Sanity check: lesson 13 found the peak of $q$ at $\sqrt{850} \approx 29.15$ s; on this 0.1 s grid it is $76.6$ kPa at 29.2 s, inside the band, as it must be. There, Mach is about 1.91 and altitude $10 \times 29.2^2 \approx 8{,}530$ m. The load factor panel reads a steady $(20 + 9.81)/9.81 \approx 3.04$ g, as a constant $20\,\mathrm{m/s^2}$ climb against gravity should.
:::

## Timetables: data with a clock

Picture two friends keeping diaries of the same trip. One writes every hour on the hour. The other writes whenever something happens. To compare what each of them said at 3:15, you first have to decide how to line the diaries up: take each one's latest entry before 3:15? The closest one? Something in between?

Flight data has the same problem. A vehicle's sensors run at [[different rates|multirate]] — an inertial unit at hundreds of samples per second, a GPS receiver at one to ten — and their time stamps almost never coincide.

A **timetable** is a table (lesson 7) whose rows each carry a time stamp. The time stamps, called the **row times**, are `duration` values (elapsed time, such as seconds since launch) or `datetime` values (calendar dates and clock times). They are not an ordinary variable: they label the rows, and every time-aware function uses them.

```matlab
baro = timetable(seconds([0 0.25 0.5 0.75 1.0]'), [0.0 1.9 5.2 9.8 15.1]', ...
                 'VariableNames', {'alt_baro'});
gps  = timetable(seconds([0.1 0.6 1.1]'), [0.4 6.1 17.2]', ...
                 'VariableNames', {'alt_gps'});
```

`seconds(x)` turns plain numbers into durations. The first input to `timetable` is the row times; the data columns follow. The row times are `baro.Time`, and `seconds(baro.Time)` turns them back into plain numbers. `table2timetable(T)` converts a table with a time column, and `readtimetable('log.csv')` reads a CSV file straight into a timetable. You can select a stretch of time with `TT(timerange(seconds(10), seconds(20)), :)`, which keeps rows from 10 s up to, but not including, 20 s. And `stackedplot(TT)` draws every variable in its own panel on one shared time axis: a one-line quick-look.

### retime: one timetable onto new times

`retime` resamples one timetable onto the times you choose, with a **method** that says how to fill each new row:

- `'previous'` — the latest sample at or before the new time (a sample-and-hold);
- `'nearest'` — the sample closest in time;
- `'linear'` — straight-line interpolation between the two neighbors;
- `'mean'` (and `'sum'`, `'max'`, and so on) — gather the samples that fall in each new time step and combine them. `retime(imu, 'secondly', 'mean')` turns a 100 Hz inertial log into one averaged row per second.

```matlab
baro5 = retime(baro, seconds(0:0.2:1)', 'linear');
```

This puts the barometer on a 5 Hz grid. The row at 0.2 s lies four-fifths of the way from the 0 s sample to the 0.25 s one, so it gets $0 + 0.8 \times 1.9 = 1.52$ m. The rows come out as 0, 1.52, 3.88, 7.04, 10.86 and 15.1 m.

### synchronize: many timetables onto one time base

`synchronize` does what `retime` does, for several timetables at once, and joins the results side by side in one timetable. You say which **time base** to use — `'first'` (the first timetable's times), `'union'` (every time stamp from all of them, the default), `'intersection'`, or a vector of times — and the method, from the same list.

::: key
What is synchronize on a timetable for? Aligning two time-stamped series onto a common time base with a chosen method (nearest, linear, previous), which is the MATLAB equivalent of pandas merge_asof for multi-rate telemetry.
:::

The Python match is close. pandas' [[merge_asof|merge-asof]] takes each row of the left table and attaches the right table's row with the nearest key, by default the latest one at or before it. That is `synchronize(left, right, 'first', 'previous')`. `merge_asof(..., direction='nearest')` is the `'nearest'` method. And `'linear'` goes a step further than `merge_asof` can, by interpolating between neighbors.

::: example Barometer meets GPS
Put the GPS altitude onto the barometer's time stamps, first with `'previous'`, then with `'nearest'`.

```matlab
bp = synchronize(baro, gps, 'first', 'previous');
bn = synchronize(baro, gps, 'first', 'nearest');
```

Both keep the barometer's five row times and add an `alt_gps` column. Worked by hand (GPS samples at 0.1, 0.6 and 1.1 s):

| Time (s) | alt_baro (m) | alt_gps, previous (m) | alt_gps, nearest (m) |
| --- | --- | --- | --- |
| 0 | 0.0 | NaN | 0.4 |
| 0.25 | 1.9 | 0.4 | 0.4 |
| 0.5 | 5.2 | 0.4 | 6.1 |
| 0.75 | 9.8 | 6.1 | 6.1 |
| 1.0 | 15.1 | 6.1 | 17.2 |

With `'previous'`, the row at 0.5 s takes the GPS sample from 0.1 s, the latest one at or before 0.5; the 0.6 s sample is in the future. At 0 s there is no earlier GPS sample at all, so the row is missing: `NaN`. With `'nearest'`, 0.5 s is 0.1 s from the 0.6 s sample and 0.4 s from the 0.1 s one, so it takes 6.1. At 1.0 s, the sample at 1.1 s is 0.1 s away and the one at 0.6 s is 0.4 s away, so it takes 17.2.

Sanity check: at 0.75 s the barometer says 9.8 m and the `'previous'` GPS says 6.1 m. That 3.7 m gap is not the sensors disagreeing. The GPS value is 0.15 s old, and the vehicle was climbing at roughly 20 m/s, so staleness alone explains about 3 m of it. With `'linear'`, the GPS value at 0.75 s would be $6.1 + 0.3 \times 11.1 \approx 9.43$ m — much closer.
:::

::: warning previous hides lag; nearest peeks at the future
`'previous'` uses only data that existed at that moment, which is what an onboard computer really had, so it is right for replaying what the flight software saw. But the values are [[stale|stale-data]], and on a fast-changing signal the staleness looks like an error. `'nearest'` and `'linear'` may use a sample from slightly *after* the row time, which is fine for analysis afterwards but impossible in real time. Choose the method on purpose, and write down which you chose.
:::

## Check yourself

::: check
Old code makes a panel with `subplot(3, 2, 5)`. Where on the figure is that panel, and how would you reach the same tile in a `tiledlayout(3, 2)`?
:::

::: answer
Both count across the rows: 1 and 2 are the top row, 3 and 4 the middle, 5 and 6 the bottom. So position 5 is the bottom-left panel. With a tiled layout, `nexttile(5)` makes (or selects) the axes in that same tile. If you are filling the tiles in order, the fifth call to `nexttile` lands there too.
:::

::: check
You plot a gain curve from 1 Hz to 10,000 Hz with `semilogx`. Where along the x-axis does 100 Hz sit, and where would it sit on an ordinary linear axis?
:::

::: answer
The range covers four decades: 1 to 10, 10 to 100, 100 to 1,000 and 1,000 to 10,000. On a log axis each decade gets equal width, and 100 Hz is two decades in, so it sits exactly halfway across. On a linear axis it would sit at $(100 - 1)/(10{,}000 - 1) \approx 1\%$ of the way across, jammed against the left edge along with everything below it.
:::

::: check
You built a six-panel figure, kept its axes in `ax`, and called `linkaxes(ax, 'x')`. Then you zoom into tile 3 to look at 30 s to 35 s. What happens to the other panels, and what would `linkaxes(ax, 'xy')` have done differently?
:::

::: answer
All six panels change their x-limits to 30 s to 35 s, because linked axes share their x-limits: changing them on one changes them on all. Each panel keeps its own y-limits, which is right, since altitude and Mach have different units. With `'xy'`, the y-limits would be linked too, so every panel would be forced onto the same y-range — useless for channels in different units, and only sensible when every panel plots the same kind of quantity.
:::

::: check
An inertial unit logs at 100 Hz and a star tracker at 4 Hz. You want one timetable at the star tracker's times, with the inertial data averaged over each star-tracker interval. A teammate suggests `synchronize(imu, st, 'first', 'nearest')`. What is wrong, and roughly what should you use?
:::

::: answer
Two things. `'first'` puts the result on the *inertial* unit's times, because `imu` is the first input, so you would get 100 rows per second, not 4. And `'nearest'` picks one inertial sample per row instead of averaging the 25 samples ($100/4$) in each quarter-second. Put the star tracker first so its times are the base, and use an aggregating method: `synchronize(st, imu, 'first', 'mean')`. Each row then carries the star-tracker reading and the average of the inertial samples in that time step.
:::

::: check
You must send a quick-look figure (a) for a slide shown on a projector and (b) for a printed design-review report where readers will zoom into the PDF. Write the `exportgraphics` call for each.
:::

::: answer
(a) A raster image is fine for a slide: `exportgraphics(f, 'quicklook.png', 'Resolution', 300)`. 300 pixels per inch is plenty for a projector. (b) For the report, vector output keeps every line and label sharp at any zoom: `exportgraphics(f, 'quicklook.pdf', 'ContentType', 'vector')`. Both crop tight around the content, so the figure drops into the document with no extra margin.
:::

## Summary

| Tool | What it does | Example |
| --- | --- | --- |
| `plot`, `hold on` | line plot; add to the axes | `plot(t, h, 'b-', 'LineWidth', 1.5)` |
| `tiledlayout`, `nexttile` | grid of axes, filled row by row | `tl = tiledlayout(3, 2, 'TileSpacing', 'compact')` |
| shared labels | one label for the grid | `xlabel(tl, 'Time (s)')` |
| `linkaxes` | ties axes limits together | `linkaxes(ax, 'x')` |
| `yyaxis` | two y-axes on one axes | `yyaxis left`, `yyaxis right` |
| `semilogx`, `semilogy`, `loglog` | logarithmic axes | `semilogx(logspace(-1, 3, 401), magdB)` |
| `xregion`, `patch`, `fill` | shaded band or envelope | `xregion(ax(k), 12.1, 50.9)` (R2023a) |
| `exportgraphics` | saves a tight PNG or vector PDF | `'Resolution', 300` or `'ContentType', 'vector'` |
| `timetable` | table with row times | `timetable(seconds(t), alt)` |
| `retime` | one timetable onto new times | `retime(TT, newTimes, 'linear')` |
| `synchronize` | several timetables onto one time base | `synchronize(A, B, 'first', 'previous')` |

That completes the core language: you can compute, organize, speed up and show flight data. The next module, on MATLAB's GNC toolboxes, starts with models of dynamic systems whose step and frequency responses you will plot with exactly these tools.

::: context quick-look The first look after every test
After a test firing or a flight, the team wants answers within minutes: did it do what we expected, and is anything alarming? The quick-look is a standard set of plots, produced by a script that runs on every data file, so that everyone reads the same figures in the same layout every time. Detailed analysis comes later. Because the script runs on every test, the effort you put into making it clear pays back hundreds of times.
:::

::: context matplotlib Python's plotting borrowed from MATLAB
John Hunter started matplotlib around 2003 to give Python a plotting tool that worked like MATLAB's, and its `pyplot` interface copies many MATLAB habits: `plot`, `xlabel`, `hold`-like layering, and even line specs such as `'r--'`. So moving between them is mostly spelling. The biggest difference is that matplotlib code today usually works with figure and axes objects directly, which is the same style as passing `ax` to MATLAB functions.
:::

::: context handle-graphics Everything on screen is an object
A MATLAB figure is a tree of objects. The figure holds a layout, the layout holds axes, and each axes holds lines, text and patches. Each object has properties you can read and set with dot notation. Passing an axes as the first input, as in `plot(ax(3), t, v)` or `grid(ax(k), 'on')`, tells a function exactly where to draw, which is safer in a long script than trusting whichever axes happens to be current.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <rect x="130" y="10" width="100" height="26" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="180" y="28" font-size="12" fill="#1f2a44" text-anchor="middle">Figure</text>
  <rect x="120" y="56" width="120" height="26" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="180" y="74" font-size="12" fill="#1f2a44" text-anchor="middle">TiledChartLayout</text>
  <rect x="50" y="102" width="80" height="26" fill="#ffffff" stroke="#1f2a44"/>
  <text x="90" y="120" font-size="12" fill="#1f2a44" text-anchor="middle">Axes 1</text>
  <rect x="230" y="102" width="80" height="26" fill="#ffffff" stroke="#1f2a44"/>
  <text x="270" y="120" font-size="12" fill="#1f2a44" text-anchor="middle">Axes 6</text>
  <text x="180" y="120" font-size="12" fill="#6c7a93" text-anchor="middle">...</text>
  <line x1="180" y1="36" x2="180" y2="56" stroke="#1f2a44"/>
  <line x1="160" y1="82" x2="90" y2="102" stroke="#1f2a44"/>
  <line x1="200" y1="82" x2="270" y2="102" stroke="#1f2a44"/>
  <text x="90" y="150" font-size="11" fill="#b4232c" text-anchor="middle">Line, Region</text>
  <text x="270" y="150" font-size="11" fill="#b4232c" text-anchor="middle">Line, Region</text>
  <line x1="90" y1="128" x2="90" y2="138" stroke="#1f2a44"/>
  <line x1="270" y1="128" x2="270" y2="138" stroke="#1f2a44"/>
</svg>
```
:::

::: context tile-numbering Counting the tiles
Tiles and subplot positions are numbered along each row, left to right, then down to the next row, like reading a page. In a 3-by-2 layout that gives this map. It is the opposite of the column-by-column order MATLAB uses for the elements of a matrix, so do not mix up the two.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g fill="#ffffff" stroke="#1f2a44" stroke-width="1.5">
    <rect x="100" y="10" width="80" height="40"/><rect x="180" y="10" width="80" height="40"/>
    <rect x="100" y="50" width="80" height="40"/><rect x="180" y="50" width="80" height="40"/>
    <rect x="100" y="90" width="80" height="40" fill="#f2b880"/><rect x="180" y="90" width="80" height="40"/>
  </g>
  <g font-size="14" fill="#1f2a44" text-anchor="middle">
    <text x="140" y="35">1</text><text x="220" y="35">2</text>
    <text x="140" y="75">3</text><text x="220" y="75">4</text>
    <text x="140" y="115">5</text><text x="220" y="115">6</text>
  </g>
  <text x="180" y="146" font-size="11" fill="#6c7a93" text-anchor="middle">tiledlayout(3, 2): tile 5 is bottom left</text>
</svg>
```
:::

::: context log-axis Equal steps are equal factors
On an ordinary axis, equal distances mean equal differences: 0 to 10 is as wide as 10 to 20. On a logarithmic axis, equal distances mean equal ratios: 1 to 10 is as wide as 10 to 100. The axis really plots $\log_{10} x$ but labels it with $x$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="40" x2="330" y2="40" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="30" y1="34" x2="30" y2="46"/><line x1="105" y1="34" x2="105" y2="46"/>
    <line x1="180" y1="34" x2="180" y2="46"/><line x1="255" y1="34" x2="255" y2="46"/>
    <line x1="330" y1="34" x2="330" y2="46"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="30" y="62">0.1</text><text x="105" y="62">1</text><text x="180" y="62">10</text>
    <text x="255" y="62">100</text><text x="330" y="62">1000</text>
  </g>
  <g stroke="#1d6fd1" stroke-width="1">
    <line x1="127.6" y1="36" x2="127.6" y2="44"/><line x1="140.8" y1="36" x2="140.8" y2="44"/>
    <line x1="150.2" y1="36" x2="150.2" y2="44"/><line x1="157.4" y1="36" x2="157.4" y2="44"/>
  </g>
  <text x="142" y="24" font-size="11" fill="#1d6fd1" text-anchor="middle">2, 3, 4, 5</text>
  <text x="180" y="94" font-size="11" fill="#6c7a93" text-anchor="middle">each decade gets the same width</text>
</svg>
```
:::

::: context decibels Gains as sums instead of products
The decibel turns a gain into $20\log_{10}$ of it. Two filters in a row multiply their gains, but their decibels add, which is easier to do in your head. Landmarks worth remembering: a gain of 1 is 0 dB, $1/\sqrt{2} \approx 0.707$ is $-3$ dB (the usual definition of a cutoff), 0.1 is $-20$ dB and 0.01 is $-40$ dB. The Bode plots of the GNC toolboxes module are gain in decibels against frequency on exactly this kind of `semilogx` axis.
:::

::: context raster-vector Pixels or shapes
A raster image stores a grid of colored pixels; zoom in and the edges turn to steps. A vector file stores instructions — "a line from here to there, the text 'q (kPa)' in this font" — so the viewer redraws it sharply at any size, and the text stays searchable. Line plots are small as vectors. A plot with millions of points or a filled image can be smaller as a raster, which is why `exportgraphics` lets you choose.
:::

::: context tex-markup Labels with math in them
By default MATLAB reads text labels with a small subset of TeX, the typesetting language behind most scientific papers. `^` makes a superscript and `_` a subscript, with braces for more than one character (`m^{-3}`), and backslash names give Greek letters and symbols: `\alpha`, `\rho`, `\geq`. Set `'Interpreter', 'none'` on a label whose underscores should print as underscores, such as a file name like `hop_run_007`.
:::

::: context multirate Why sensors tick at different speeds
Each sensor runs at the rate its physics and its job need. Gyros and accelerometers sample hundreds of times per second, because attitude control reacts within milliseconds. A barometric altimeter is slower and noisier. A GPS receiver computes a fix a few times per second at most, and a star tracker needs time to take and process each image. Flight software and ground analysis must both merge these streams, and the choice of how to line them up is a real design decision.
:::

::: context merge-asof The pandas function it matches
`pandas.merge_asof(left, right, on='t')` needs both tables sorted by `t`. For each left row it attaches the right row whose key is the latest at or before it (`direction='backward'`, the default), or the earliest at or after it (`'forward'`), or the closest (`'nearest'`). Its `tolerance` option rejects matches that are too far away. `synchronize` has no option with that name, so if you need such a limit in MATLAB, check the time gaps yourself.
:::

::: context stale-data Old news that looks like an error
A stale value is one that was true when it was measured but has not been updated since. The onboard computer lives with stale data all the time: the navigation filter knows how old each GPS fix is and pushes it forward in time before using it. In ground analysis, forgetting about staleness makes a working sensor look faulty, which is why the time stamp matters as much as the value.
:::
