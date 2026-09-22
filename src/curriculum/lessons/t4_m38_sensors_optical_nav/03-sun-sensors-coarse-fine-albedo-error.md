---
id: l03-sun-sensors-coarse-fine-albedo-error
title: 'Sun sensors: coarse and fine, and the Earth-albedo error'
minutes: 27
covers:
  - 'Sun sensors: coarse analog and fine digital, field of view, albedo error'
---

A star tracker spends its whole effort finding faint points of light and working out which ones they are. A sun sensor has the opposite problem: exactly one object matters, its identity is never in doubt, and most of the time it delivers by far the brightest signal any optical sensor on the spacecraft will ever see. That should make sun sensing the easy problem in this module. It very nearly is — until the vehicle passes over a sunlit ocean or a bank of cloud, and a second, unbidden signal starts arriving from entirely the wrong direction.

This lesson builds both kinds of sun sensor a spacecraft actually carries. A coarse analog sensor is a handful of photodiodes obeying a cosine law: cheap, radiation-tolerant, and accurate to a few degrees, exactly the instrument this lesson derives a least-squares solution for. A fine digital sensor trades field of view for precision, reading the Sun's angle directly off a coded mask instead of fitting anything at all. Between them they cover the two jobs a mission actually needs from Sun sensing: find it from nothing, and then know its direction to a fraction of a degree once it has been found.

The harder half of this lesson is an error neither sensor's own geometry can remove. Earth reflects roughly three-tenths of the sunlight that reaches it, and a sensor with any view of the planet below picks up that reflected light as though it were a second, dimmer Sun sitting in entirely the wrong place. This lesson derives that error from orbital geometry, quantifies it with real numbers across a full range of beta angles, and tests — rather than assumes — two different ways of living with it, including one tempting fix that turns out not to work.

## Coarse analog sun sensors: the cosine law and a linear solve

A coarse sun sensor is close to the simplest optical instrument a spacecraft carries: a photodiode behind a flat window, its output current proportional to the component of incident sunlight along the diode's own surface normal $\hat{\mathbf{n}}$, and zero once the Sun passes behind the plane of the diode entirely:

$$
I = I_0\max\!\big(0,\ \hat{\mathbf{n}}\cdot\hat{\mathbf{s}}\big),
$$

where $\hat{\mathbf{s}}$ is the unknown sun direction and $I_0$ is the current a normally incident, unattenuated Sun produces — a constant of the diode and its calibration, independent of $\hat{\mathbf{s}}$ as long as the Sun is not eclipsed or filtered. One diode measures one number and constrains $\hat{\mathbf{s}}$ to a cone; mount several on different faces of the spacecraft, each with a known normal $\hat{\mathbf{n}}_j$ and a clear view over some wide cone — roughly $\pm60^\circ$ to $\pm90^\circ$ from its own normal is typical — and their currents jointly constrain the sun direction to a point.

Every relation $I_j = I_0(\hat{\mathbf{n}}_j\cdot\hat{\mathbf{s}})$ for a sensor still catching sunlight is linear in the unknown vector $\mathbf{x}=I_0\hat{\mathbf{s}}$ — not merely linearizable, actually linear, since neither $\hat{\mathbf{n}}_j$ nor the relationship itself depends on where $\hat{\mathbf{s}}$ already is. That is exactly the setup the least-squares module opened with, in its lesson on the linear least squares problem: stack the illuminated sensors' normals into rows of a matrix $\mathbf{N}$ and their currents into $\mathbf{I}$, solve $\mathbf{x}=(\mathbf{N}^\mathsf{T}\mathbf{N})^{-1}\mathbf{N}^\mathsf{T}\mathbf{I}$, and normalize $\hat{\mathbf{s}}=\mathbf{x}/\lVert\mathbf{x}\rVert$ to discard the usually uncalibrated magnitude $I_0$ along with it. The one piece of bookkeeping this problem adds is deciding which sensors to include: a sensor reading exactly zero carries no information about $\hat{\mathbf{s}}$ beyond "the Sun is not in my forward hemisphere," so only the illuminated set enters $\mathbf{N}$ — and, the same conditioning lesson the least-squares module made repeatedly, that set needs at least three sensors whose normals are not coplanar, or the solve is rank-deficient no matter how many diodes are mounted.

::: example A cube of six coarse sensors, and what one illuminated axis cannot tell you
Six sensors, normals along $\pm\hat{\mathbf{x}},\pm\hat{\mathbf{y}},\pm\hat{\mathbf{z}}$ of the vehicle body:

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

s_axis = np.array([1.0, 0.0, 0.0])              # the Sun sits exactly on one sensor's normal
print("axis-aligned currents:", currents(s_axis), " lit sensors:", int((currents(s_axis) > 0).sum()))
# currents: [0.5005 0.     0.     0.3003 0.812  0.    ]
# lit sensors: 3  recovered: [ 0.500489 -0.300294  0.811994]  error (deg): 0.0
# axis-aligned currents: [1. 0. 0. 0. 0. 0.]  lit sensors: 1
```

A generic sun direction lights exactly three faces of the cube, and the least-squares solve recovers it to machine precision — unsurprising, since three independent linear equations exactly determine three unknowns once $I_0$ cancels out in the normalization. The second case is the reason "at least three, non-coplanar" is not a formality: with the Sun sitting exactly on one sensor's own normal, that sensor alone is lit, one equation for three unknowns, and the solve is free to return any $\hat{\mathbf{s}}$ consistent with that single number. A real sensor layout staggers its normals so this configuration is rare and brief, but a coarse sun sensor's specification always states a minimum illuminated-sensor count for exactly this reason.
:::

::: key Coarse sun sensor model
$$
I_j = I_0\max\!\big(0,\ \hat{\mathbf{n}}_j\cdot\hat{\mathbf{s}}\big),
$$
current proportional to the cosine of the angle from each sensor's normal, clipped at zero. Several sensors on different faces give the sun vector by an ordinary linear least-squares solve over the illuminated set; accuracy is a few degrees, dominated in practice by Earth albedo rather than by sensor noise.
:::

## Fine digital sun sensors: reading the angle instead of fitting it

A coarse sensor's few-degree accuracy suits safe mode and coarse acquisition, but a mission that points solar arrays precisely, or that needs a tight fine-pointing reference when other sensors are unavailable, needs an order of magnitude or more finer resolution. A fine digital sun sensor gets there with a different mechanism entirely: rather than fitting several continuous currents, it reads the Sun's angle directly off a coded mask.

The classic implementation places a reticle — an opaque plate etched with a sequence of transparent and opaque bands, one band per bit, arranged in a Gray code so adjacent angular cells differ in only one bit — a fixed standoff above a linear array of photodetectors. Sunlight passing through the reticle at angle $\theta$ from the boresight casts a shifted shadow pattern onto the array; each detector behind a transparent band reads "sun," each behind an opaque band reads "dark," and the resulting binary word is, by construction, the angular cell the Sun currently occupies — no centroiding, no least-squares solve, the angle is read directly off the pattern. A second, orthogonal reticle over a second array gives the other axis, so two coded masks fix a full two-dimensional sun angle.

The resolution such a device delivers follows directly from how many bits its reticle carries and how wide a field it covers: with $2^{\text{bits}}$ distinguishable cells spanning the field of view, the resolution is $\mathrm{FOV}/2^{\text{bits}}$.

::: example How many bits a fine sensor needs for sub-degree resolution
A typical fine digital sun sensor covers a total field of view of about $128^\circ$ ($\pm64^\circ$) — narrower than a coarse sensor's near-hemispherical coverage, one of the costs of the added precision.

```python
fov = 128.0
for bits in (6, 8, 10):
    print(bits, "bits ->", fov / 2**bits, "deg =", fov / 2**bits * 60, "arcmin resolution")
# 6 bits -> 2.0 deg = 120.0 arcmin resolution
# 8 bits -> 0.5 deg = 30.0 arcmin resolution
# 10 bits -> 0.125 deg = 7.5 arcmin resolution
```

Eight bits of reticle already beats a coarse sensor's few-degree accuracy by an order of magnitude, and a real fine sensor commonly adds an analog interpolation stage within the finest Gray-code cell — reading the partial illumination of a boundary element rather than only its on/off state — to reach the arcminute-level accuracy these instruments are built for. The trade against the coarse sensor is direct: covering a narrower field with a fixed detector count buys resolution, which is why a mission that carries a fine sensor almost always carries a coarse one too, to acquire the Sun across the field the fine sensor cannot see at all.
:::

## Earth albedo: the error neither sensor's geometry can remove

Every derivation above assumed the only light arriving is the Sun's, along $\hat{\mathbf{s}}$. In low Earth orbit that assumption fails for a sizeable fraction of every orbit: any sensor with a partial view of the sunlit Earth below picks up reflected sunlight as a second source, and neither the coarse cosine-law solve nor the fine sensor's coded mask has any way to tell that light apart from the real Sun.

Earth's bond albedo — the fraction of incident sunlight it reflects, averaged over the illuminated disk — is about $a_E\approx0.30$. Treating the illuminated Earth as a diffuse reflector, the reflected light a sensor of normal $\hat{\mathbf{n}}_j$ receives depends on two angles: how directly the patch of Earth below the spacecraft is itself lit, and how directly the sensor faces that patch. Writing $\hat{\mathbf{r}}$ for the spacecraft's unit position vector from Earth's centre, so $-\hat{\mathbf{r}}$ is the nadir direction, a serviceable engineering approximation for the albedo irradiance is

$$
\alpha = a_E\max\!\big(0,\ -\hat{\mathbf{r}}\cdot\hat{\mathbf{s}}\big), \qquad I_j^{\text{albedo}} = \alpha\max\!\big(0,\ \hat{\mathbf{n}}_j\cdot(-\hat{\mathbf{r}})\big),
$$

the first factor scoring how well-lit the ground track below is — zero when the sub-satellite point sits on Earth's night side, maximal when the satellite is directly over the sub-solar point — the second the same cosine law as before, measured against nadir rather than against the Sun. It is a simplification: real Earth is not a uniform Lambertian sphere, and bright cloud or ice reflects considerably more than $30\%$ while ocean reflects less, which is exactly why the module's own card ties albedo error to bright terrain and cloud specifically. What this model does capture correctly is the shape of the problem: a nadir-facing sensor picks up the largest false signal, and that signal vanishes as the ground track crosses onto Earth's night side, regardless of whether the spacecraft itself is still sunlit.

Two more pieces of orbital geometry are needed to see how this plays out over an orbit. The **beta angle** $\beta$ is the angle between the sun direction and the orbital plane — $\beta=0$ puts the Sun exactly in the plane, $\beta=90^\circ$ puts it exactly along the orbit normal — and it governs how much of each orbit is spent in Earth's shadow. A satellite is eclipsed when it is on Earth's night side, $\hat{\mathbf{r}}\cdot\hat{\mathbf{s}}<0$, and close enough to the Sun-Earth line that Earth's disk actually blocks the Sun; the simplest useful test treats Earth's shadow as a cylinder of radius $R_\oplus$ trailing away from the Sun, so the spacecraft is eclipsed when additionally $\lVert\mathbf{r}\rVert\sqrt{1-(\hat{\mathbf{r}}\cdot\hat{\mathbf{s}})^2} < R_\oplus$, its perpendicular distance from that line. Neither refinement this ignores — the Sun's own half-degree angular size, or the atmosphere, both of which would round the shadow's edge into a penumbra — changes the picture this lesson needs.

::: example A nadir-pointing cube through a full orbit, six beta angles
Put the same six-sensor cube on a nadir-pointing spacecraft in a $500\,\mathrm{km}$ circular orbit — body $+\hat{\mathbf{z}}$ always nadir, body $+\hat{\mathbf{x}}$ along the velocity direction, the standard local-vertical, local-horizontal attitude many Earth-observation and safe-mode-default vehicles fly. Sweep the orbital phase $u$ over a full revolution, at each phase test for eclipse, compute the direct-plus-albedo current on every face, solve for the sun vector exactly as the first example did, and compare it against the true $\hat{\mathbf{s}}$:

```python
import numpy as np

Re, h_alt, a_E = 6378.0, 500.0, 0.30
r_mag = Re + h_alt
normals = np.array([[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]], float)

def lvlh_axes(u):
    r_hat = np.array([np.cos(u), np.sin(u), 0.0])
    z_b, y_b = -r_hat, np.array([0.0, 0.0, -1.0])
    return r_hat, np.array([np.cross(y_b, z_b), y_b, z_b])   # rows: x_b, y_b, z_b

def in_eclipse(r_hat, s_hat):
    if np.dot(r_hat, s_hat) >= 0:
        return False
    return r_mag * np.sqrt(max(0.0, 1 - np.dot(r_hat, s_hat) ** 2)) < Re

def solve_sun_vector(I, N):
    lit = I > 0
    x, *_ = np.linalg.lstsq(N[lit], I[lit], rcond=None)
    return x / np.linalg.norm(x)

def orbit_errors(beta_deg, n_u=720):
    s_hat = np.array([np.cos(np.radians(beta_deg)), 0.0, np.sin(np.radians(beta_deg))])
    err = np.full(n_u, np.nan)
    for k, u in enumerate(np.linspace(0, 2*np.pi, n_u, endpoint=False)):
        r_hat, B = lvlh_axes(u)
        if in_eclipse(r_hat, s_hat):
            continue
        N = normals @ B
        direct = np.maximum(0.0, N @ s_hat)
        alpha = a_E * max(0.0, np.dot(-r_hat, s_hat))
        obs = direct + alpha * np.maximum(0.0, N @ (-r_hat))
        if (direct > 0).sum() < 3 or (obs > 0).sum() < 3:
            continue
        s_est = solve_sun_vector(obs, N)
        err[k] = np.degrees(np.arccos(np.clip(s_est @ s_hat, -1, 1)))
    return err

for beta_deg in (15, 23.4, 35, 45, 60, 75):
    e = orbit_errors(beta_deg)
    print(f"beta={beta_deg:5.1f} deg: max error={np.nanmax(e):6.3f} deg   mean={np.nanmean(e):.3f} deg")
# beta= 15.0 deg: max error=24.244 deg   mean=2.326 deg
# beta= 23.4 deg: max error=23.763 deg   mean=2.640 deg
# beta= 35.0 deg: max error=21.680 deg   mean=2.780 deg
# beta= 45.0 deg: max error=18.901 deg   mean=2.897 deg
# beta= 60.0 deg: max error=13.897 deg   mean=2.934 deg
# beta= 75.0 deg: max error= 7.368 deg   mean=2.205 deg
```

With no albedo term the same solver recovers $\hat{\mathbf{s}}$ to machine precision at every phase, so this entire error is Earth's reflected light and nothing else. The worst single-frame error runs from $24^\circ$ at low beta down to $7^\circ$ near $\beta=75^\circ$, and the mean sits in the two-to-three-degree range the module's own card quotes — validating that figure against orbital geometry the card itself does not derive.

The worst point is not scattered randomly through the orbit. At $\beta=15^\circ$ it lands at $u=112.5^\circ$, exactly the phase where the satellite crosses into eclipse: the nadir-facing sensor's direct and albedo currents run $(0.933,\,0.075)$ at $u=105^\circ$, $(0.908,\,0.099)$ at $u=110^\circ$, and $(0.892,\,0.111)$ right at $u=112.5^\circ$, one step before eclipse begins. The ground track below is still fully lit even as the spacecraft's own direct sunlight is about to end, so the false signal is, at that exact moment, at its largest fraction of the true one — nearly a third, on the sensor that matters most. Move either direction away from the shadow boundary and the direct signal recovers faster than the albedo signal grows, so the contamination fraction, and the resulting sun-vector error, falls off on both sides of it.

The critical case is worth a closed form. Over one orbit $\hat{\mathbf{r}}$ sweeps a full circle in the orbital plane while $\hat{\mathbf{s}}$ stays fixed, and — measuring the orbital phase $u$ from the point where $\hat{\mathbf{r}}$ passes closest to $\hat{\mathbf{s}}$'s in-plane component — $\hat{\mathbf{r}}\cdot\hat{\mathbf{s}}=\cos\beta\cos u$. The deepest point on the night side, $u=180^\circ$, is also the point of closest approach to the Sun-Earth line, where the perpendicular distance from that line is $\lVert\mathbf{r}\rVert\sqrt{1-\cos^2\beta}=\lVert\mathbf{r}\rVert\sin\beta$. An orbit eclipses at all only if that minimum distance still falls inside Earth's shadow radius, $\lVert\mathbf{r}\rVert\sin\beta < R_\oplus$, so

$$
\beta_{\text{crit}} = \arcsin\!\left(\frac{R_\oplus}{\lVert\mathbf{r}\rVert}\right)
$$

is the beta angle beyond which an orbit never eclipses. For the $500\,\mathrm{km}$ orbit used throughout, $\lVert\mathbf{r}\rVert=6878\,\mathrm{km}$ and $\beta_{\text{crit}}=\arcsin(6378/6878)=68.0^\circ$ — below the $\beta=60^\circ$ case above, which does eclipse, and below the $\beta=75^\circ$ case, which the simulation found never does.
:::

## Living with albedo: two mitigations, tested

The exercise this lesson feeds asks for two mitigations, and it is worth testing both rather than assuming either works as advertised — including a third, tempting one that does not.

::: example Two mitigations tested, against a tempting third that fails
Discarding the sensor most exposed to albedo — the nadir-facing one — sounds like the tempting fix. Tested against the same orbit sweep at three beta angles, it is not: max and mean error at $\beta=15^\circ$ move from $24.244^\circ/2.326^\circ$ to $25.605^\circ/2.186^\circ$; at $\beta=23.4^\circ$ from $23.763^\circ/2.640^\circ$ to $28.142^\circ/2.733^\circ$; at $\beta=45^\circ$ from $18.901^\circ/2.897^\circ$ to $27.513^\circ/3.331^\circ$ — worse on both counts at every beta but one, where the mean alone improves marginally while the worst case still gets worse. Removing the sensor most contaminated by albedo also removes real information it carries about the true sun direction whenever it is *not* badly contaminated, which is most of the orbit, and losing a measurement degrades the geometry of an already only-just-determined solve by more than the occasional contamination was costing it. A per-sensor fix aimed at the symptom, applied permanently, is worse than doing nothing.

The exercise's two actual proposals fare better, and differently.

**Eclipse and terminator masking** — discarding the sun-vector solution for some buffer of orbital phase around each predicted eclipse entry and exit, using the same orbit geometry that predicts the eclipse itself, not the sensor readings — clears the error completely at low beta, but the buffer it needs grows with beta: a $30^\circ$ buffer (about eight minutes, for a $90$-minute period) suffices through $\beta=35^\circ$, growing to $40^\circ$ at $\beta=45^\circ$ and $50^\circ$ at $\beta=60^\circ$; by $\beta=75^\circ$, where this orbit never enters shadow at all, there is no eclipse transition left to anchor a buffer to, and the technique has nothing to act on. Even where it works, it costs data — keeping only points outside the buffer discards close to half the orbit.

**Modelling the albedo and subtracting it** throws nothing away. Estimate $\hat{\mathbf{s}}$ once, use that estimate together with the known $\hat{\mathbf{r}}$ to predict $\alpha$ and each sensor's albedo contribution from the model above, subtract it from the raw currents, and re-solve — two or three fixed-point iterations settle it:

```python
def model_corrected(beta_deg, n_u=720, iters=3):
    s_hat = np.array([np.cos(np.radians(beta_deg)), 0.0, np.sin(np.radians(beta_deg))])
    err = np.full(n_u, np.nan)
    for k, u in enumerate(np.linspace(0, 2*np.pi, n_u, endpoint=False)):
        r_hat, B = lvlh_axes(u)
        if in_eclipse(r_hat, s_hat):
            continue
        N = normals @ B
        direct = np.maximum(0.0, N @ s_hat)
        alpha = a_E * max(0.0, np.dot(-r_hat, s_hat))
        obs = direct + alpha * np.maximum(0.0, N @ (-r_hat))
        if (obs > 0).sum() < 3:
            continue
        s_est = solve_sun_vector(obs, N)
        for _ in range(iters):
            a_hat = a_E * max(0.0, np.dot(-r_hat, s_est))
            corr = np.clip(obs - a_hat * np.maximum(0.0, N @ (-r_hat)), 0.0, None)
            corr[obs == 0] = 0.0
            if (corr > 0).sum() < 3:
                break
            s_est = solve_sun_vector(corr, N)
        err[k] = np.degrees(np.arccos(np.clip(s_est @ s_hat, -1, 1)))
    return err

for beta_deg in (15, 23.4, 35, 45, 60, 75):
    e = model_corrected(beta_deg)
    print(f"beta={beta_deg:5.1f} deg: max error={np.nanmax(e):6.3f} deg   mean={np.nanmean(e):.3f} deg")
# beta= 15.0 deg: max error= 3.905 deg   mean=0.304 deg
# beta= 23.4 deg: max error= 3.116 deg   mean=0.253 deg
# beta= 35.0 deg: max error= 2.011 deg   mean=0.167 deg
# beta= 45.0 deg: max error= 1.231 deg   mean=0.122 deg
# beta= 60.0 deg: max error= 0.463 deg   mean=0.075 deg
# beta= 75.0 deg: max error= 0.119 deg   mean=0.039 deg
```

An order of magnitude better on the mean at every beta angle tested, and it uses every sensor at every phase — no data discarded, and it keeps working exactly where masking runs out, at high beta with no eclipse to anchor to. Its ceiling is set by how well the model matches reality: real Earth is not a uniform $30\%$ reflector, so a flight implementation still carries residual error from cloud and terrain variation that this idealised correction — tested here against the very model that generated its own error — cannot show.
:::

::: warning Eclipse is silence, not noise
During eclipse every sun sensor, coarse or fine, reports nothing at all — not a noisy answer, no answer. A sun-sensor-only attitude mode has no fallback for a substantial fraction of every low-beta orbit, which is why a sun sensor is never a spacecraft's only attitude reference: a magnetometer, gyro propagation, or both have to carry attitude knowledge through every eclipse a mission will ever fly.
:::

## Check yourself

::: check
Two coarse sensors, normals $\hat{\mathbf{n}}_1,\hat{\mathbf{n}}_2$, are both illuminated. Explain why their two currents cannot, by themselves, determine a unique three-component $\hat{\mathbf{s}}$, and what a third, non-coplanar sensor's current adds that the first two could not supply.
:::

::: answer
Each current $I_j=I_0(\hat{\mathbf{n}}_j\cdot\hat{\mathbf{s}})$ is one linear equation in the three unknown components of $\mathbf{x}=I_0\hat{\mathbf{s}}$; two such equations define two planes in that three-dimensional space, and their intersection is generically a line, not a point — a one-parameter family of vectors all consistent with both measurements. A third sensor, whose normal is not a linear combination of the first two (not coplanar with them), adds a third independent plane; three independent planes intersect at a single point, which is why three non-coplanar illuminated normals are the minimum for a unique solve, and why the cube example above found the axis-aligned, single-sensor case completely undetermined.
:::

::: check
A fine digital sun sensor must resolve $0.1^\circ$ over a $100^\circ$ total field of view. How many bits does its reticle need?
:::

::: answer
The resolution is $\mathrm{FOV}/2^{\text{bits}}$, so the number of bits needed satisfies $2^{\text{bits}}\ge\mathrm{FOV}/\text{resolution}=100/0.1=1000$, giving $\text{bits}\ge\log_2(1000)=9.97$. Since bits must be a whole number, the reticle needs $10$ bits, giving an actual resolution of $100/2^{10}=0.098^\circ$, slightly finer than required.
:::

::: check
The worked orbit sweep found the worst sun-vector error right at the eclipse boundary, not at the sub-solar overpass where the albedo signal is largest in absolute terms. Explain why, in terms of the *direct* signal rather than the albedo signal.
:::

::: answer
At the sub-solar overpass the direct sun signal on every illuminated face is close to its maximum, so even a large absolute albedo contribution is a small fraction of the total and barely perturbs the least-squares solve. Approaching the eclipse boundary, the direct signal on the nadir-facing sensor shrinks toward zero as the Sun grazes the horizon, while the ground track below is still fully lit and the albedo contribution stays substantial — so the fraction of that sensor's current that is spurious, not the absolute size of the false signal, is what peaks right at the boundary, and it is that fraction the least-squares solve cannot tell from real signal.
:::

::: check
Using $\beta_{\text{crit}}=\arcsin(R_\oplus/\lVert\mathbf{r}\rVert)$, find the critical beta angle for a $1200\,\mathrm{km}$ circular orbit, and state whether it is higher or lower than the $500\,\mathrm{km}$ orbit's $68.0^\circ$, with a physical reason.
:::

::: answer
With $\lVert\mathbf{r}\rVert=6378+1200=7578\,\mathrm{km}$, $\beta_{\text{crit}}=\arcsin(6378/7578)=57.3^\circ$, lower than the $500\,\mathrm{km}$ orbit's $68.0^\circ$. A higher orbit is farther from Earth's centre, so $R_\oplus/\lVert\mathbf{r}\rVert$ is smaller and Earth subtends a narrower shadow cone as seen from the spacecraft's distance; a smaller beta angle is enough to carry the orbit's closest approach to the shadow line outside that narrower cone, so higher orbits need less inclination of the Sun out of the orbital plane to avoid eclipse altogether.
:::

::: check
Why did discarding the nadir-facing sensor fail to fix the accuracy problem, even though it is the sensor most exposed to albedo contamination?
:::

::: answer
The nadir-facing sensor is contaminated only during part of the orbit, but it carries genuine information about the true sun direction the rest of the time; removing it permanently throws away that real information at every phase, not only the phases where albedo was a problem. With the solve already resting on the minimum of three non-coplanar illuminated sensors for much of the orbit, losing one measurement worsens the geometry of the remaining solve by more, on average, than the occasional contamination was costing — a general illustration that a fix aimed at a symptom present only some of the time should not be applied unconditionally for all of the time.
:::

::: check
A mission flies at $\beta=75^\circ$ for this lesson's $500\,\mathrm{km}$ orbit and wants to reduce its albedo-driven sun-vector error. Which of this lesson's two mitigations should it use, and why would the other contribute nothing at all?
:::

::: answer
It should use the albedo model correction. Eclipse and terminator masking works by excluding orbital phase near a predicted eclipse transition, and at $\beta=75^\circ$ — above the $68.0^\circ$ critical angle for this orbit — there is no eclipse at any phase, so there is no transition to anchor a buffer to and nothing for the technique to exclude. The model-based correction does not depend on eclipse geometry at all; it estimates and subtracts the albedo contribution from the orbital geometry and the sensor currents themselves, which this lesson's own numbers showed working at every beta angle tested, including the one with no eclipse whatsoever.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $I_j=I_0\max(0,\hat{\mathbf{n}}_j\cdot\hat{\mathbf{s}})$ | Coarse sensor cosine law; linear in $I_0\hat{\mathbf{s}}$, solved by ordinary least squares over illuminated sensors |
| $\ge 3$ non-coplanar illuminated normals | Minimum for a determined sun-vector solve; fewer leaves a line or plane of solutions |
| Gray-code reticle, resolution $=\mathrm{FOV}/2^{\text{bits}}$ | Fine digital sensor: angle read directly from a bit pattern, no fitting; $8$ bits over $128^\circ$ gives $0.5^\circ$ |
| $\alpha=a_E\max(0,-\hat{\mathbf{r}}\cdot\hat{\mathbf{s}})$, $I_j^{\text{albedo}}=\alpha\max(0,\hat{\mathbf{n}}_j\cdot(-\hat{\mathbf{r}}))$ | Simplified Earth-albedo model, $a_E\approx0.30$; peaks for a nadir-facing sensor over a sunlit ground track |
| Eclipse: $\hat{\mathbf{r}}\cdot\hat{\mathbf{s}}<0$ and $\lVert\mathbf{r}\rVert\sqrt{1-(\hat{\mathbf{r}}\cdot\hat{\mathbf{s}})^2}<R_\oplus$ | Cylindrical-shadow eclipse test |
| $\beta_{\text{crit}}=\arcsin(R_\oplus/\lVert\mathbf{r}\rVert)$ | Beta angle above which an orbit never eclipses; $68.0^\circ$ at $500\,\mathrm{km}$ |
| Albedo error: $24^\circ$ (low $\beta$) down to $7^\circ$ ($\beta=75^\circ$), worst near the eclipse boundary | This lesson's own simulation, validating the module's "a few degrees" card |
| Terminator masking | Removes the error completely at low-to-moderate $\beta$, at the cost of roughly half the orbit's data; fails entirely once an orbit stops eclipsing |
| Model-based subtraction | An order of magnitude better on the mean at every $\beta$ tested, discards no data, but is only as good as its albedo model |

A sun sensor's accuracy problem, in the end, is not the sensor at all — it is Earth, sitting exactly where the sensor cannot help looking. The next lesson turns to an instrument with a different, quieter failure mode: the geomagnetic field it depends on is not a data sheet number but a model, correct to a few hundred nanotesla at best, and wrong in a way no amount of averaging can fix.
