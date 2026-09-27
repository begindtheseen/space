---
id: l03-sun-sensors-coarse-fine-albedo-error
title: 'Sun sensors: coarse and fine, and the Earth-albedo error'
minutes: 24
covers:
  - 'Sun sensors: coarse analog and fine digital, field of view, albedo error'
---

Close your eyes on a sunny day and slowly turn your face. The warmth is strongest when you face the Sun. It fades as you turn away. When the Sun is behind you, it is gone. With your eyes shut, you could still point at the Sun.

A **sun sensor** does exactly that for a spacecraft: it reports the direction to the Sun. A star tracker hunts faint dots and must work out which is which. A sun sensor has the opposite job: there is one source, its identity is never in doubt, and it is by far the brightest thing in the sky. That should make it the easy problem of this module. It very nearly is — until the spacecraft passes over sunlit clouds, and a second, dimmer "sun" starts shining up from below.

This lesson builds both kinds of sun sensor spacecraft carry. A **coarse** sensor is a few light cells following a cosine law: cheap, tough, good to a few degrees. A **fine** sensor reads the Sun's angle off a coded mask, to a fraction of a degree, over a narrower view. Then we tackle the error neither can remove on its own: sunlight reflected off Earth, called **[[albedo|albedo-word]]**.

## Coarse sun sensors: the cosine law

A coarse sun sensor is a **[[photodiode|photodiode]]** — a light cell whose electric current grows with the light on it — behind a flat window. Call the direction the cell faces its **normal** $\hat{\mathbf{n}}$ ("n hat"), and the unknown direction to the Sun $\hat{\mathbf{s}}$ ("s hat"). Sunlight hitting the cell at an angle is spread over more area, so the cell collects light in proportion to the **[[cosine|cosine-law]]** of the angle between $\hat{\mathbf{n}}$ and $\hat{\mathbf{s}}$. That cosine is the dot product $\hat{\mathbf{n}}\cdot\hat{\mathbf{s}}$. Once the Sun passes behind the cell's plane, the current is zero:

$$
I = I_0\max\!\big(0,\ \hat{\mathbf{n}}\cdot\hat{\mathbf{s}}\big).
$$

Here $I_0$ is the current when the Sun shines straight on. "max(0, …)" means "take the bigger of zero and this": the formula's cosine goes negative behind the cell, but a real current cannot.

One cell gives one number, which only says the Sun lies somewhere on a cone around $\hat{\mathbf{n}}$. So spacecraft mount several cells on different faces, each with a known normal $\hat{\mathbf{n}}_j$. Each sees a wide patch of sky, typically $\pm60^\circ$ to $\pm90^\circ$ from its normal. Together their currents pin down the direction.

### Solving for the Sun

For every cell the Sun is reaching, $I_j = I_0(\hat{\mathbf{n}}_j\cdot\hat{\mathbf{s}})$. Put the unknown as one vector, $\mathbf{x} = I_0\hat{\mathbf{s}}$. Then each equation reads $\hat{\mathbf{n}}_j\cdot\mathbf{x} = I_j$: truly **linear** in $\mathbf{x}$, not just approximately. That is the least-squares module's opening problem. Stack the lit cells' normals as the rows of a matrix $\mathbf{N}$ and their currents as a column $\mathbf{I}$, then solve

$$
\mathbf{x}=(\mathbf{N}^\mathsf{T}\mathbf{N})^{-1}\mathbf{N}^\mathsf{T}\mathbf{I}, \qquad \hat{\mathbf{s}}=\frac{\mathbf{x}}{\lVert\mathbf{x}\rVert}.
$$

Dividing by the length throws away $I_0$, which is handy, because it is usually not well calibrated.

Only the lit cells go into $\mathbf{N}$. A cell reading zero says only "the Sun is not in front of me". And the lit set needs at least three cells whose normals do not all lie in one plane (**non-coplanar**). Otherwise the equations cannot fix all three components, however many cells are fitted.

::: example A cube of six coarse sensors
Put six cells on a cube, normals along $\pm\hat{\mathbf{x}},\pm\hat{\mathbf{y}},\pm\hat{\mathbf{z}}$ of the spacecraft body.

```python
import numpy as np

normals = np.array([[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]], float)

def currents(s_hat, I0=1.0):
    return I0 * np.maximum(0.0, normals @ s_hat)

def solve_sun_vector(I):
    lit = I > 0
    x, *_ = np.linalg.lstsq(normals[lit], I[lit], rcond=None)
    return x / np.linalg.norm(x), lit.sum()

s_true = np.array([0.5, -0.3, 0.8112]); s_true /= np.linalg.norm(s_true)
I = currents(s_true)
s_est, n_lit = solve_sun_vector(I)
print("currents:", np.round(I, 4))
print("lit sensors:", n_lit, " recovered:", np.round(s_est, 6),
      " error (deg):", np.degrees(np.arccos(np.clip(s_est @ s_true, -1, 1))))
print("opposite-face differences:", np.round([I[0] - I[1], I[2] - I[3], I[4] - I[5]], 4))

s_axis = np.array([1.0, 0.0, 0.0])              # the Sun sits exactly on one sensor's normal
print("axis-aligned currents:", currents(s_axis), " lit sensors:", int((currents(s_axis) > 0).sum()))
# currents: [0.5005 0.     0.     0.3003 0.812  0.    ]
# lit sensors: 3  recovered: [ 0.500489 -0.300294  0.811994]  error (deg): 0.0
# opposite-face differences: [ 0.5005 -0.3003  0.812 ]
# axis-aligned currents: [1. 0. 0. 0. 0. 0.]  lit sensors: 1
```

**A typical Sun.** Three faces are lit: $+x$, $-y$ and $+z$. Three equations, three unknowns, and the solve recovers $\hat{\mathbf{s}}$ exactly.

**The Sun on one face's normal.** Only the $+x$ face is lit: one equation for three unknowns. The lit-set solve cannot fix the direction from that alone. That is why a sensor layout tilts its faces so this case is rare, and why a specification states a minimum number of lit cells.
:::

### Opposite faces: a neater trick

Look at the "opposite-face differences" line: $I_{+x} - I_{-x}$ and the rest give $(0.5005, -0.3003, 0.8120)$, exactly $I_0\hat{\mathbf{s}}$. That is no accident. For any number $c$,

$$
\max(0,\ c) - \max(0,\ -c) = c,
$$

because one of the two terms is always zero. Apply it with $c = \hat{\mathbf{x}}\cdot\hat{\mathbf{s}}$: the $+x$ face reads $I_0\max(0, c)$ and the $-x$ face reads $I_0\max(0, -c)$, so their difference is $I_0 s_x$ exactly. On a cube, the three differences *are* the sun vector. No lit-set bookkeeping, and the zero readings are used too: in the axis-aligned case the differences give $(1, 0, 0)$, exactly right.

::: key Coarse sun sensor model
Current is proportional to $\cos$(angle between the sun vector and the cell normal), clipped at zero: $I_j = I_0\max\!\big(0,\ \hat{\mathbf{n}}_j\cdot\hat{\mathbf{s}}\big)$. Several cells on different faces give a least-squares sun vector; accuracy is degrees, dominated by Earth albedo.
:::

::: warning A cell lit only by stray light breaks the lit-set fit
The lit-set solve trusts the model $I_j = \hat{\mathbf{n}}_j\cdot\mathbf{x}$ for every cell with a nonzero current. A cell that faces *away* from the Sun but catches a trace of reflected light joins the fit anyway, and the fit then averages it against its opposite face — roughly halving that axis of the answer. Swap the lit-set solve into this lesson's orbit simulation, and at one step reflected currents below a thousandth of the direct Sun did exactly this, throwing the answer $17.6^\circ$ off. Use opposite-face differences, or only admit cells above a sensible threshold.
:::

## Fine digital sun sensors: reading the angle

A few degrees is fine for finding the Sun in an emergency (**safe mode**) or pointing solar panels roughly. Precise panel pointing, or a backup fine attitude reference, needs ten times better or more. A **fine digital sun sensor** gets there differently. It does not fit anything. It *reads* the angle.

Above a row of light detectors sits a **reticle**: a plate etched with clear and dark bands. Sunlight coming in at angle $\theta$ from straight on casts the band pattern onto the detectors, shifted by an amount that depends on $\theta$. Each detector under a clear band reads "1", each under a dark band reads "0". The bands are laid out as a **[[Gray code|gray-code]]**, a binary numbering in which neighbouring values differ in only one bit. So the string of 1s and 0s *is* the number of the angle cell the Sun is in. A second, crossed reticle gives the other axis.

If the reticle carries some number of bits, it splits the field into $2^{\text{bits}}$ cells, so

$$
\text{resolution} = \frac{\mathrm{FOV}}{2^{\text{bits}}}.
$$

::: example How many bits for sub-degree resolution?
A typical fine sun sensor covers about $128^\circ$ in total ($\pm64^\circ$), narrower than a coarse cell's view.

```python
fov = 128.0
for bits in (6, 8, 10):
    print(bits, "bits ->", fov / 2**bits, "deg =", fov / 2**bits * 60, "arcmin resolution")
# 6 bits -> 2.0 deg = 120.0 arcmin resolution
# 8 bits -> 0.5 deg = 30.0 arcmin resolution
# 10 bits -> 0.125 deg = 7.5 arcmin resolution
```

**Eight bits:** $128/2^8 = 128/256 = 0.5^\circ$, already several times better than a coarse sensor. Real fine sensors add an analog step inside the finest cell, reading how partly lit the edge detector is, to reach arcminute-level accuracy (an **arcminute** is $1/60$ of a degree).

The trade is direct: a fixed number of detectors spread over a narrower field buys resolution. So a mission with a fine sensor almost always carries coarse ones too, to find the Sun anywhere in the sky first.
:::

## Earth albedo: a second, false sun

Everything so far assumed the only light is the Sun's. In low Earth orbit that is false for much of every orbit. Any cell that can see the sunlit Earth below picks up reflected sunlight, and neither kind of sensor can tell it apart from the real Sun.

Earth reflects about $30\%$ of the sunlight that reaches it. That fraction is its **bond albedo**, $a_E \approx 0.30$. Model Earth as a **[[matte|lambertian]]** ball: each sunlit patch glows in proportion to how squarely the Sun hits it, and sends that glow out evenly in all directions. A cell then receives the sum of the glow from every patch it can see, weighted by how squarely the cell faces each one.

One number checks the model. Directly under the Sun, a cell facing straight down sees the whole visible Earth lit from overhead, and receives $a_E(R_\oplus/r)^2$ of full sunlight. Here $R_\oplus$ ("R earth") is Earth's radius, $6378\,\mathrm{km}$, and $r$ is the distance from Earth's centre. At $500\,\mathrm{km}$ altitude that is $0.30 \times (6378/6878)^2 = 0.258$. A quarter of a Sun, shining from exactly the wrong direction.

::: key Albedo error
Earth reflects roughly $30\%$ of incident sunlight, so a nadir-facing coarse sun sensor sees a large false signal. It peaks over bright terrain and cloud near the terminator and can cost several degrees of sun-vector accuracy.
:::

### Beta angle and eclipse

Two pieces of orbit geometry decide how this plays out. The **[[beta angle|beta-angle]]** $\beta$ is the angle between the Sun direction and the orbit's plane. At $\beta = 0$ the Sun lies in the plane; at $\beta = 90^\circ$ it shines straight along the orbit's axis. The **terminator** is the line on Earth between day and night.

Beta decides how long each orbit spends in Earth's shadow. Write $\hat{\mathbf{r}}$ for the spacecraft's direction from Earth's centre, so $-\hat{\mathbf{r}}$ points straight down (**nadir**). The simplest shadow test treats Earth's shadow as a **[[cylinder|shadow-shape]]** of radius $R_\oplus$ stretching away from the Sun. The spacecraft is in **eclipse** when it is on the night side, $\hat{\mathbf{r}}\cdot\hat{\mathbf{s}}<0$, and its distance from the Sun–Earth line is less than $R_\oplus$:

$$
\lVert\mathbf{r}\rVert\sqrt{1-(\hat{\mathbf{r}}\cdot\hat{\mathbf{s}})^2} < R_\oplus .
$$

(The square root is the sine of the angle between $\hat{\mathbf{r}}$ and $\hat{\mathbf{s}}$, and distance times sine is the distance from the line.)

Over one orbit $\hat{\mathbf{r}}$ sweeps round the orbit plane while $\hat{\mathbf{s}}$ stays fixed. Measure the orbit position $u$ from the point nearest the Sun, and $\hat{\mathbf{r}}\cdot\hat{\mathbf{s}} = \cos\beta\cos u$. The deepest point of the night side, $u = 180^\circ$, is also where the orbit passes closest to the Sun–Earth line, at distance $\lVert\mathbf{r}\rVert\sqrt{1-\cos^2\beta} = \lVert\mathbf{r}\rVert\sin\beta$. The orbit sees any eclipse only if that closest distance is inside the shadow, $\lVert\mathbf{r}\rVert\sin\beta < R_\oplus$. So

$$
\beta_{\text{crit}} = \arcsin\!\left(\frac{R_\oplus}{\lVert\mathbf{r}\rVert}\right)
$$

is the beta angle above which an orbit is never eclipsed. For $500\,\mathrm{km}$, $\lVert\mathbf{r}\rVert = 6878\,\mathrm{km}$ and $\beta_{\text{crit}} = \arcsin(6378/6878) = 68.0^\circ$.

::: example A nadir-pointing cube around a whole orbit
Put the six-cell cube on a spacecraft in a $500\,\mathrm{km}$ circular orbit, flying the common **[[nadir-pointing|lvlh]]** attitude: body $+z$ always straight down, body $+x$ along the direction of travel. Step round the orbit one degree at a time. At each step, skip eclipse, add the albedo from every visible sunlit patch to each face's direct current, solve with opposite-face differences, and compare with the true $\hat{\mathbf{s}}$.

```python
import numpy as np

Re, r_mag = 6378.0, 6378.0 + 500.0              # km: Earth radius, orbit radius
normals = np.array([[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]], float)

# a grid of patches over the part of Earth the spacecraft can see (a cap around the point below it)
lam = np.arccos(Re / r_mag)                     # cap half-angle at Earth's centre, 22 deg here
th, ph = np.meshgrid((np.arange(40) + 0.5) * lam / 40, (np.arange(72) + 0.5) * 2 * np.pi / 72, indexing="ij")
dA = Re**2 * np.sin(th) * (lam / 40) * (2 * np.pi / 72)     # patch areas, km^2

def lvlh_axes(u):
    """Position direction, and body axes (rows) for a nadir-pointing craft at orbit phase u."""
    r_hat = np.array([np.cos(u), np.sin(u), 0.0])
    z_b, y_b = -r_hat, np.array([0.0, 0.0, -1.0])
    return r_hat, np.array([np.cross(y_b, z_b), y_b, z_b])

def in_eclipse(r_hat, s_hat):
    c = r_hat @ s_hat
    return c < 0 and r_mag * np.sqrt(1 - c**2) < Re

def albedo(r_hat, s_hat, N, a_E):
    """Reflected-light current on each face (normals N), in units of the direct-Sun current I0."""
    e1 = np.cross(r_hat, [0.0, 0.0, 1.0]); e1 /= np.linalg.norm(e1); e2 = np.cross(r_hat, e1)
    p = (np.cos(th)[..., None] * r_hat
         + np.sin(th)[..., None] * (np.cos(ph)[..., None] * e1 + np.sin(ph)[..., None] * e2))
    d = Re * p - r_mag * r_hat                  # from the craft to each patch
    dist = np.linalg.norm(d, axis=-1); d_hat = d / dist[..., None]
    sunlit = np.maximum(0.0, p @ s_hat)         # how squarely the Sun hits the patch
    facing = np.maximum(0.0, -(p * d_hat).sum(-1))   # how squarely the patch faces the craft
    w = a_E / np.pi * sunlit * facing * dA / dist**2
    return np.array([(w * np.maximum(0.0, d_hat @ n)).sum() for n in N])

def cube_sun(I):
    """Opposite faces: I(+x) - I(-x) = I0 s_x exactly, whatever the sign of s_x."""
    x = np.array([I[0] - I[1], I[2] - I[3], I[4] - I[5]])
    return x / np.linalg.norm(x)

def orbit_errors(beta_deg, a_true=0.30, a_model=None, drop_nadir=False):
    b = np.radians(beta_deg)
    s_hat = np.array([np.cos(b), 0.0, np.sin(b)])
    err = []
    for u in np.radians(np.arange(0, 360, 1.0)):
        r_hat, B = lvlh_axes(u)
        if in_eclipse(r_hat, s_hat):
            continue
        N = normals @ B                         # face normals in inertial axes
        I = np.maximum(0.0, N @ s_hat) + albedo(r_hat, s_hat, N, a_true)
        if drop_nadir:
            I[4] = 0.0                          # face 4 (+z body) looks straight down
        s_est = B.T @ cube_sun(I)
        for _ in range(3 if a_model else 0):    # predict the albedo from the estimate, subtract, repeat
            s_est = B.T @ cube_sun(I - albedo(r_hat, s_est, N, a_model))
        err.append((np.degrees(u), np.degrees(np.arccos(np.clip(s_est @ s_hat, -1, 1)))))
    return np.array(err)

for beta in (15, 45, 75):
    e = orbit_errors(beta)
    k = np.argmax(e[:, 1])
    print(f"beta={beta}: sunlit {len(e)} deg of 360, max {e[k,1]:.1f} deg at u={e[k,0]:.0f}, mean {e[:,1].mean():.1f} deg")
# beta=15: sunlit 225 deg of 360, max 8.9 deg at u=38, mean 5.0 deg
# beta=45: sunlit 243 deg of 360, max 8.8 deg at u=0, mean 4.6 deg
# beta=75: sunlit 360 deg of 360, max 3.9 deg at u=0, mean 1.3 deg
```

**Is it really albedo?** The next block runs the same sweep with $a_E = 0$ and gets $0.000^\circ$ everywhere. Every degree here is reflected light.

**How big?** The average error is $5.0^\circ$, $4.6^\circ$ and $1.3^\circ$ at $\beta = 15^\circ$, $45^\circ$ and $75^\circ$, with single-step worsts near $9^\circ$. "Several degrees", as the key says.

**Where?** In this uniform-Earth model the worst error sits over the brightly lit day side: at $\beta = 15^\circ$ it is at $u = 38^\circ$, where the Sun is $40^\circ$ from straight overhead. It fades to zero at the terminator, once the ground below goes dark. The key's warning about bright cloud and the terminator points at what this model leaves out. Real cloud and ice are far brighter than $0.30$. And a solver that falls into the lit-set trap spikes just past the terminator: the $17.6^\circ$ case in the warning above happened at $\beta = 45^\circ$, $u = 111^\circ$.

**Eclipse.** At $\beta = 75^\circ$, above the $68.0^\circ$ critical angle, all $360$ steps are sunlit: no eclipse at all, as the formula predicts.
:::

## Living with albedo: three fixes, tested

The module's exercise asks you to propose and test mitigations. Here are three, run through the same sweep. Each result is max / mean error in degrees. Run this block after the previous one.

::: example Three fixes, one of which backfires
```python
for beta in (15, 45, 75):
    none = orbit_errors(beta, a_true=0.0)                  # no albedo at all
    raw = orbit_errors(beta)                               # albedo 0.30, no fix
    drop = orbit_errors(beta, drop_nadir=True)             # fix 1: ignore the nadir face
    sun_zen = np.degrees(np.arccos(np.cos(np.radians(beta)) * np.cos(np.radians(raw[:, 0]))))
    kept = raw[np.abs(sun_zen - 90) >= 20]                 # fix 2: mask 20 deg either side of the terminator
    mask = f"{kept[:,1].max():.1f}/{kept[:,1].mean():.1f}" if len(kept) else "nothing left"
    good = orbit_errors(beta, a_model=0.30)                # fix 3: subtract a model that is right
    off = orbit_errors(beta, a_true=0.40, a_model=0.30)    # fix 3 when the real Earth is brighter
    print(f"beta={beta}: none {none[:,1].max():.3f} | raw {raw[:,1].max():.1f}/{raw[:,1].mean():.1f}"
          f" | drop nadir {drop[:,1].max():.1f}/{drop[:,1].mean():.1f}"
          f" | mask {mask} ({len(kept)} of {len(raw)} kept)"
          f" | model {good[:,1].max():.2f}/{good[:,1].mean():.2f}"
          f" | model, Earth 0.40 {off[:,1].max():.1f}/{off[:,1].mean():.1f}")
# beta=15: none 0.000 | raw 8.9/5.0 | drop nadir 21.2/2.4 | mask 8.9/7.1 (143 of 225 kept) | model 0.06/0.02 | model, Earth 0.40 3.2/1.8
# beta=45: none 0.000 | raw 8.8/4.6 | drop nadir 21.4/3.1 | mask 8.8/7.4 (129 of 243 kept) | model 0.06/0.03 | model, Earth 0.40 3.2/1.8
# beta=75: none 0.000 | raw 3.9/1.3 | drop nadir 15.0/4.8 | mask nothing left (0 of 360 kept) | model 0.05/0.02 | model, Earth 0.40 1.8/0.6
```

**Fix 1: ignore the downward face.** It sounds obvious: that face sees the most albedo. The mean does fall at low beta, but the worst case jumps to $21^\circ$, and at $\beta = 75^\circ$ both numbers get worse. The downward face is also the only one that sees the Sun when it is below the local horizon but the spacecraft is still sunlit — near $u = 248^\circ$ at $\beta = 15^\circ$. Throw it away and the up-down part of the answer is lost there.

**Fix 2: mask around the terminator and eclipse.** Using orbit geometry alone, discard answers when the Sun is within $20^\circ$ of the horizon below. Here it keeps only $143$ of $225$ sunlit steps at $\beta = 15^\circ$ and makes the mean *worse*, $7.1^\circ$, because in this model the error lives on the day side, which masking keeps. It does remove terminator spikes, like the lit-set one. At $\beta = 75^\circ$ the whole orbit hugs the terminator and nothing is left. Masking only helps where the error really is — so find where it peaks first.

**Fix 3: model the albedo and subtract it.** Estimate $\hat{\mathbf{s}}$, predict each face's albedo from the model, subtract, re-solve; three rounds settle it. With a correct model the error falls to about $0.06^\circ$, and no data is thrown away. That result is flattering: it tests the model against itself. If the real Earth reflects $0.40$ while the model assumes $0.30$, the worst error is $3.2^\circ$ and the mean $1.8^\circ$ — still better than doing nothing, and a fair picture of the limit set by clouds the model cannot know.
:::

::: warning Eclipse is silence, not noise
In eclipse every sun sensor, coarse or fine, reports nothing — not a noisy answer, no answer. A sun-sensor-only mode has no fallback for a big slice of every low-beta orbit. That is why a sun sensor is never a spacecraft's only attitude reference: a **[[magnetometer, gyro propagation, or both|eclipse-partners]]** must carry attitude through every eclipse.
:::

## Check yourself

::: check
Two coarse cells, normals $\hat{\mathbf{n}}_1$ and $\hat{\mathbf{n}}_2$, are both lit. Why can their two currents not fix a unique $\hat{\mathbf{s}}$, and what does a third, non-coplanar cell add?
:::

::: answer
Each current $I_j=I_0(\hat{\mathbf{n}}_j\cdot\hat{\mathbf{s}})$ is one linear equation in the three unknown components of $\mathbf{x}=I_0\hat{\mathbf{s}}$. Each equation is a plane in three-dimensional space; two planes meet in a line, a whole family of answers that fit both readings. A third cell whose normal is not in the plane of the first two adds a third, independent plane, and three such planes meet at a single point. That is why three non-coplanar lit cells are the minimum for the lit-set solve.
:::

::: check
A fine digital sun sensor must resolve $0.1^\circ$ over a $100^\circ$ field of view. How many bits does its reticle need?
:::

::: answer
The resolution is $\mathrm{FOV}/2^{\text{bits}}$, so we need $2^{\text{bits}}\ge 100/0.1 = 1000$. That means $\text{bits}\ge\log_2(1000) = 9.97$. Bits come in whole numbers, so $10$ bits, giving $100/2^{10} = 0.098^\circ$, slightly finer than required.
:::

::: check
Show that $I_{+x} - I_{-x} = I_0 s_x$ for a pair of opposite cosine-law cells, whichever side the Sun is on. Why does this make the cube's solution immune to the lit-set trap?
:::

::: answer
Let $c = \hat{\mathbf{x}}\cdot\hat{\mathbf{s}} = s_x$. The $+x$ cell reads $I_0\max(0, c)$ and the $-x$ cell, whose normal is $-\hat{\mathbf{x}}$, reads $I_0\max(0, -c)$. If $c \ge 0$ the difference is $I_0 c - 0$; if $c < 0$ it is $0 - I_0(-c) = I_0 c$. Either way it is $I_0 s_x$.

The difference uses both cells' readings through one formula that is exactly right for any Sun direction, so there is no choice about which cells to include. A tiny stray current on the back face shifts the answer only by that tiny amount, instead of flipping a cell into a fit whose model is wrong for it.
:::

::: check
Using $\beta_{\text{crit}}=\arcsin(R_\oplus/\lVert\mathbf{r}\rVert)$, find the critical beta angle for a $1200\,\mathrm{km}$ circular orbit. Is it higher or lower than the $500\,\mathrm{km}$ orbit's $68.0^\circ$, and why?
:::

::: answer
$\lVert\mathbf{r}\rVert=6378+1200=7578\,\mathrm{km}$, so $\beta_{\text{crit}}=\arcsin(6378/7578)=57.3^\circ$ — lower than $68.0^\circ$.

In the cylinder model the shadow's radius is always $R_\oplus$. The orbit's closest approach to the Sun–Earth line is $\lVert\mathbf{r}\rVert\sin\beta$. A bigger orbit radius makes that distance larger for the same $\beta$, so a smaller tilt of the Sun out of the orbit plane is enough to keep the whole orbit clear of the shadow.
:::

::: check
Why did ignoring the downward-facing cell make the worst-case error worse, even though that cell sees the most albedo?
:::

::: answer
Albedo reaches the downward cell only while the ground below is sunlit. But when the Sun is below the local horizon and the spacecraft is still in sunlight, that cell is the one the Sun shines on directly. Ignoring it sets the up-down difference to the upward cell's reading, which is zero there, so the up-down part of the sun vector is lost and the error reaches $21^\circ$. A fix aimed at a problem that exists part of the time should not be applied all of the time.
:::

::: check
A mission flies this lesson's $500\,\mathrm{km}$ orbit at $\beta=75^\circ$ and wants less albedo error. Which fix should it use, and why do the other two fail there?
:::

::: answer
Model-based subtraction. At $\beta = 75^\circ$ it brought the error to about $0.05^\circ$ with a correct model, and $1.8^\circ$ worst case with a model that underestimates Earth's brightness — both better than the $3.9^\circ$ worst case with no fix.

Masking fails because at this beta the Sun never gets more than $15^\circ$ from the horizon below, so a $20^\circ$ mask discards the entire orbit. And the orbit never enters eclipse (it is above the $68.0^\circ$ critical angle), so there is no eclipse edge to mask around anyway. Dropping the downward cell made both the worst and mean errors worse at this beta: $15.0^\circ$ and $4.8^\circ$.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $I_j=I_0\max(0,\hat{\mathbf{n}}_j\cdot\hat{\mathbf{s}})$ | Coarse sensor cosine law; linear in $I_0\hat{\mathbf{s}}$ over the lit cells |
| $\mathbf{x}=(\mathbf{N}^\mathsf{T}\mathbf{N})^{-1}\mathbf{N}^\mathsf{T}\mathbf{I}$, $\hat{\mathbf{s}}=\mathbf{x}/\lVert\mathbf{x}\rVert$ | Least-squares sun vector; needs $\ge 3$ non-coplanar lit cells |
| $I_{+x}-I_{-x}=I_0 s_x$ | Opposite faces give the sun vector exactly, zero readings included |
| Resolution $=\mathrm{FOV}/2^{\text{bits}}$ | Fine digital sensor with a Gray-code reticle; $8$ bits over $128^\circ$ gives $0.5^\circ$ |
| $a_E\approx0.30$; $a_E(R_\oplus/r)^2 = 0.258$ at $500\,\mathrm{km}$ | Earth's albedo; the false signal on a downward cell under the Sun |
| Eclipse: $\hat{\mathbf{r}}\cdot\hat{\mathbf{s}}<0$ and $\lVert\mathbf{r}\rVert\sqrt{1-(\hat{\mathbf{r}}\cdot\hat{\mathbf{s}})^2}<R_\oplus$ | Cylindrical-shadow eclipse test |
| $\beta_{\text{crit}}=\arcsin(R_\oplus/\lVert\mathbf{r}\rVert)$ | Beta angle above which an orbit never eclipses; $68.0^\circ$ at $500\,\mathrm{km}$ |
| Albedo error: mean $5.0^\circ$ at $\beta=15^\circ$ to $1.3^\circ$ at $\beta=75^\circ$ | This lesson's uniform-Earth simulation; "several degrees" |
| Drop the downward cell | Backfires: worst case up to $21^\circ$ |
| Terminator masking | Helps only if the error lives near the terminator; nothing left at high beta |
| Model-based subtraction | Best: about $0.06^\circ$ with a right model, $3.2^\circ$ worst if Earth is brighter than assumed |

A sun sensor's accuracy problem is not really the sensor. It is Earth, sitting where the sensor cannot help looking. The next lesson turns to the magnetometer, whose trouble is quieter: the magnetic field it compares against is a model, good to a few hundred nanotesla at best.

::: context albedo-word Whiteness
"Albedo" comes from the Latin *albus*, white. It is the fraction of incoming light a surface reflects. Fresh snow reflects around $80\%$ or more, thick cloud up to about the same, open ocean only about $6\%$. Averaged over the whole planet and all its weather, Earth reflects about $30\%$. The Moon, which looks bright at night, reflects only about $12\%$ — it just has nothing brighter around it.
:::

::: context photodiode A light cell
A photodiode is a small piece of silicon built so that each absorbed photon frees an electron that can flow as current. More light, more current, in close proportion. A solar panel is the same idea, made large to collect power. Some spacecraft even use the current from their solar panels as crude sun sensors, since each panel follows the same cosine law.
:::

::: context cosine-law Why the cosine
A beam of sunlight has a fixed width. Face it squarely and it covers the least area; tilt the cell and the same beam spreads over a longer strip, so each bit of cell gets less. Tilted by angle $\theta$, the cell catches a fraction $\cos\theta$ of the face-on light.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <g stroke="#f2b880" stroke-width="2.5">
    <line x1="40" y1="20" x2="40" y2="100"/><line x1="55" y1="20" x2="55" y2="100"/><line x1="70" y1="20" x2="70" y2="100"/><line x1="85" y1="20" x2="85" y2="100"/>
    <line x1="240" y1="20" x2="240" y2="117.3"/><line x1="255" y1="20" x2="255" y2="91.4"/>
    <line x1="225" y1="20" x2="225" y2="140"/><line x1="270" y1="20" x2="270" y2="140"/>
  </g>
  <line x1="35" y1="100" x2="90" y2="100" stroke="#1d6fd1" stroke-width="5"/>
  <line x1="236.25" y1="123.8" x2="263.75" y2="76.2" stroke="#1d6fd1" stroke-width="5"/>
  <text x="20" y="130" font-size="12" fill="#1f2a44">face-on: 4 rays</text>
  <text x="150" y="152" font-size="12" fill="#1f2a44">tilted 60°: 2 rays, cos 60° = 0.5</text>
</svg>
```
:::

::: context gray-code Counting one bit at a time
In ordinary binary, $3$ is 011 and $4$ is 100: all three bits flip at once. If the Sun sits right on that boundary, a reading caught mid-flip could come out as anything. In a Gray code neighbours differ in exactly one bit, so a boundary reading is off by at most one cell. Here is a 3-bit reticle, one row per bit, dark meaning 1.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g stroke="#6c7a93" stroke-width="1">
    <rect x="40" y="20" width="36" height="24" fill="#ffffff"/><rect x="76" y="20" width="36" height="24" fill="#ffffff"/><rect x="112" y="20" width="36" height="24" fill="#ffffff"/><rect x="148" y="20" width="36" height="24" fill="#ffffff"/>
    <rect x="184" y="20" width="36" height="24" fill="#1f2a44"/><rect x="220" y="20" width="36" height="24" fill="#1f2a44"/><rect x="256" y="20" width="36" height="24" fill="#1f2a44"/><rect x="292" y="20" width="36" height="24" fill="#1f2a44"/>
    <rect x="40" y="44" width="36" height="24" fill="#ffffff"/><rect x="76" y="44" width="36" height="24" fill="#ffffff"/><rect x="112" y="44" width="36" height="24" fill="#1f2a44"/><rect x="148" y="44" width="36" height="24" fill="#1f2a44"/>
    <rect x="184" y="44" width="36" height="24" fill="#1f2a44"/><rect x="220" y="44" width="36" height="24" fill="#1f2a44"/><rect x="256" y="44" width="36" height="24" fill="#ffffff"/><rect x="292" y="44" width="36" height="24" fill="#ffffff"/>
    <rect x="40" y="68" width="36" height="24" fill="#ffffff"/><rect x="76" y="68" width="36" height="24" fill="#1f2a44"/><rect x="112" y="68" width="36" height="24" fill="#1f2a44"/><rect x="148" y="68" width="36" height="24" fill="#ffffff"/>
    <rect x="184" y="68" width="36" height="24" fill="#ffffff"/><rect x="220" y="68" width="36" height="24" fill="#1f2a44"/><rect x="256" y="68" width="36" height="24" fill="#1f2a44"/><rect x="292" y="68" width="36" height="24" fill="#ffffff"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="58" y="110">000</text><text x="94" y="110">001</text><text x="130" y="110">011</text><text x="166" y="110">010</text>
    <text x="202" y="110">110</text><text x="238" y="110">111</text><text x="274" y="110">101</text><text x="310" y="110">100</text>
  </g>
  <text x="40" y="136" font-size="12" fill="#1d6fd1">neighbouring cells differ in one bit</text>
</svg>
```
:::

::: context lambertian A perfectly matte surface
Chalk, paper and cloud tops look about equally bright from any direction; a mirror or calm water does not. A surface that scatters light evenly in all directions is called Lambertian, after Johann Heinrich Lambert, who described it in 1760. The $1/\pi$ in the lesson's code comes from spreading the reflected light evenly over a hemisphere. Real Earth is not perfectly Lambertian: sunlight glinting off the ocean is a bright, mirror-like exception.
:::

::: context beta-angle The Sun's tilt out of the orbit plane
Seen edge-on, the orbit plane is a line through Earth. The beta angle is how far the Sun's direction tilts out of that plane.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="110" x2="260" y2="110" stroke="#6c7a93" stroke-width="2" stroke-dasharray="6 4"/>
  <text x="200" y="130" font-size="12" fill="#6c7a93">orbit plane, edge-on</text>
  <circle cx="120" cy="110" r="30" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="120" y1="110" x2="120" y2="22" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="120,16 115,26 125,26" fill="#1f2a44"/>
  <text x="128" y="26" font-size="12" fill="#1f2a44">orbit axis</text>
  <line x1="120" y1="110" x2="215.3" y2="55" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="220.5,52 208,52.8 213.5,61.5" fill="#b4232c"/>
  <text x="226" y="52" font-size="12" fill="#b4232c">to the Sun</text>
  <path d="M 175 110 A 55 55 0 0 0 167.6 82.5" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="100" font-size="13" fill="#1f2a44">β</text>
  <text x="20" y="160" font-size="11" fill="#1f2a44">β = 0: Sun in the plane; β = 90°: Sun along the axis</text>
</svg>
```
:::

::: context shadow-shape Cylinder, cone and fuzzy edge
The Sun is not a point: from Earth it is about half a degree wide. So Earth's real shadow is a long cone narrowing away from the Sun, with a fuzzy edge, the penumbra, where only part of the Sun is hidden. Earth's atmosphere also bends and reddens light into the shadow. For a satellite a few hundred kilometres up, a cylinder of Earth's radius is within a few percent of the true shadow, which is why the simple test is used so widely.
:::

::: context lvlh Local vertical, local horizontal
Many Earth-watching satellites keep one face pointed straight down and one face forward along the orbit, turning once per orbit to stay that way. Engineers call this frame LVLH, "local vertical, local horizontal". It is also a common default for safe mode, because it keeps cameras and antennas aimed at Earth. For a sun sensor it means the Sun sweeps across the faces once per orbit, while Earth stays fixed below.
:::

::: context eclipse-partners Who carries attitude in the dark
A magnetometer measures Earth's magnetic field direction, which is there day and night; the next lesson covers it. Paired with a sun sensor it gives two directions, enough for full attitude in daylight. In eclipse, gyros carry the attitude forward from the last good fix, and the magnetometer keeps a partial check on it. Later lessons in this module show how a filter blends all three.
:::
