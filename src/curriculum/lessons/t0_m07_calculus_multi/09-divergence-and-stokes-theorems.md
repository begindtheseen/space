---
id: l09-divergence-and-stokes-theorems
title: The divergence theorem and Stokes' theorem
minutes: 24
covers:
  - divergence and Stokes theorems
---

Picture a school at the end of the day. To know how many students left, you could count people at the outside doors. Or you could ask every classroom how many students it lost and add those up. Both give the same number, because a student walking from a classroom into the hallway has not left the building. Only the outside doors matter. That idea is this whole lesson.

Lesson 7 computed the **flux** of a field through a surface (how strongly the field pierces it) and its **circulation** around a curve (how much it pushes you along the loop). Lesson 8 defined the **divergence** as flux per unit volume and the **curl** as circulation per unit area. This lesson connects the two pairs with two big results:

- the **divergence theorem**: the total flux out of a closed surface equals the divergence added up over the inside;
- **Stokes' theorem**: the circulation around a closed curve equals the curl added up over any surface that has the curve as its edge.

Each is the **[[fundamental theorem of calculus|ftc-bridge]]** again, one dimension up. Adding up a derivative over a region gives you something you can read off on the region's edge.

For a GNC engineer, the divergence theorem proves that a round planet pulls on a satellite exactly as if all its mass sat at its center. It gives the equation gravity obeys inside and outside matter, and it turns "mass is not created or destroyed" into the equation for propellant in a feed line. Stokes' theorem, in Lesson 10, proves that a curl-free force has a potential — the reason orbital energy stays constant.

## The divergence theorem

### Rooms and doorways

Go back to the school. Each classroom is a small box. Lesson 8 showed that for a small box of volume $\Delta V$ ("delta V"), the flux of a field $\mathbf{F}$ out through its six faces is about $(\nabla\cdot\mathbf{F})\,\Delta V$ — the divergence at the box times the box's volume.

Now fill a whole region $V$ with such boxes and add up their outward fluxes. Whatever flows *out* of one box through a shared wall flows *into* its neighbor, so the two amounts **[[cancel|cancelling-faces]]**. Every inside wall drops out. Only the outer skin is left.

That outer skin is a **closed surface** — a surface with no edge and no gaps, like a balloon — written $S = \partial V$. Read $\partial V$ as "the boundary of V". Letting the boxes shrink to nothing turns the sum into a volume integral, and you get the **divergence theorem** (also called **[[Gauss's theorem|gauss-name]]**):

$$
\iiint_V(\nabla\cdot\mathbf{F})\,dV = \oiint_S\mathbf{F}\cdot\hat{\mathbf{n}}\,dS, \qquad S = \partial V,\ \hat{\mathbf{n}}\text{ outward}.
$$

Read it as "the integral over V of div F equals the closed surface integral over S of F dot n-hat". The circle on the integral sign means the surface is closed. The **outward normal** $\hat{\mathbf{n}}$ is the length-one arrow standing straight out of the surface, pointing away from the inside.

In words: add up the field *created* inside (sources plus, sinks minus) and you get what flows out through the skin.

::: key
Divergence theorem: $\iiint_V(\nabla\cdot\mathbf{F})\,dV = \oiint_S\mathbf{F}\cdot\hat{\mathbf{n}}\,dS$ — the volume integral of the divergence equals the net flux through the closed bounding surface, with the normal outward.
:::

::: note Why it has to be true
Chop $V$ into small boxes $V_k$ with volumes $\Delta V_k$. For each box, Lesson 8 gives $\oiint_{\partial V_k}\mathbf{F}\cdot\hat{\mathbf{n}}\,dS \approx (\nabla\cdot\mathbf{F})_k\,\Delta V_k$, with an error that shrinks faster than $\Delta V_k$. Add over all boxes.

On the flux side, each inside face appears twice with opposite normals and cancels, leaving $\oiint_S\mathbf{F}\cdot\hat{\mathbf{n}}\,dS$. On the divergence side, $\sum_k(\nabla\cdot\mathbf{F})_k\,\Delta V_k$ becomes $\iiint_V(\nabla\cdot\mathbf{F})\,dV$ as the boxes shrink, and the small errors add up to nothing.
:::

The theorem works for any region of finite size with a surface made of smooth pieces, and any field with continuous partial derivatives there. Regions with holes, like a thick hollow shell, are allowed: on *every* part of the surface the normal points out of $V$ — on the inner surface, into the hole.

::: example Checking the theorem two ways
**A sphere.** Lesson 7 found the outward flux of $\mathbf{F} = \mathbf{r}$ through the sphere of radius $2$ directly: $32\pi$. Lesson 8 found $\nabla\cdot\mathbf{r} = 3$ everywhere. So the theorem says the flux is $3$ times the volume:

$$
\iiint_V 3\,dV = 3 \times \tfrac{4}{3}\pi\cdot 2^3 = 3 \times \tfrac{32\pi}{3} = 32\pi .
$$

Same answer, and we never touched the surface.

**A cube, with a divergence that changes.** Take $\mathbf{F} = [x^2, y^2, z^2]^\top$ on the unit cube, $0 \le x, y, z \le 1$ (written $[0, 1]^3$).

*Volume side.* The divergence is $\partial_x(x^2) + \partial_y(y^2) + \partial_z(z^2) = 2x + 2y + 2z = 2(x + y + z)$. Over the unit cube, $\iiint x\,dV = \int_0^1 x\,dx = \tfrac{1}{2}$ (the $y$ and $z$ integrals each give $1$), and the same for $y$ and $z$. So

$$
\iiint_V 2(x + y + z)\,dV = 2\left(\tfrac{1}{2} + \tfrac{1}{2} + \tfrac{1}{2}\right) = 3 .
$$

*Surface side.* On the face $x = 1$ the outward normal is $\hat{\mathbf{x}}$, so $\mathbf{F}\cdot\hat{\mathbf{n}} = F_1 = x^2 = 1$. The face has area $1$, so its flux is $1$. On the face $x = 0$ the normal is $-\hat{\mathbf{x}}$ and $F_1 = 0$, so its flux is $0$. The $y$ faces and the $z$ faces behave the same way. The total is $1 + 1 + 1 = 3$.

Six face integrals or one volume integral: pick the easier side.
:::

### Gauss's law for gravity

Now aim the theorem at gravity. Two-body gravity is $\mathbf{a} = -\mu\mathbf{r}/r^3$, where $\mu$ ("mu") is the body's gravitational parameter, $\mu = GM$. Lesson 8 showed its divergence is zero everywhere except at the mass itself, where the formula blows up. Let $S$ be any closed surface. There are two cases.

**$S$ does not enclose the mass.** Then $\nabla\cdot\mathbf{a} = 0$ everywhere inside $S$. The theorem gives $\oiint_S\mathbf{a}\cdot\hat{\mathbf{n}}\,dS = 0$. Whatever field goes in one side comes out the other.

**$S$ encloses the mass.** The divergence is undefined at the mass, so **[[carve out|carved-hole]]** a tiny sphere $S_\epsilon$ of radius $\epsilon$ ("epsilon", a small number) around the mass. In the region between $S_\epsilon$ and $S$ the divergence is zero, so the total outward flux through its two boundaries is zero.

On the inner boundary $S_\epsilon$, "outward from the region" means pointing *toward* the mass. Lesson 7 found that the flux through a sphere around the mass, with the normal pointing *away* from it, is $-4\pi\mu$. With the normal flipped, it is $+4\pi\mu$. So the flux through $S$ must be $-4\pi\mu$ to make the total zero:

$$
\oiint_S\mathbf{a}\cdot\hat{\mathbf{n}}\,dS = \begin{cases} -4\pi\mu = -4\pi G M & \text{if } S \text{ encloses the mass,} \\ 0 & \text{otherwise.} \end{cases}
$$

Lesson 7 found this for a centered sphere. Now it holds for a cube, an egg, or any lopsided closed surface around the mass.

The fields of several masses add, and so do their fluxes. For mass spread out with density $\rho$ ("rho", kilograms per cubic meter), you get

$$
\oiint_S\mathbf{a}\cdot\hat{\mathbf{n}}\,dS = -4\pi G\,M_{\text{enc}}, \qquad M_{\text{enc}} = \iiint_V\rho\,dV .
$$

This is **Gauss's law for gravity**. The flux out of any closed surface is $-4\pi G$ times the mass enclosed, $M_{\text{enc}}$ ("M enclosed"); mass outside adds nothing. For Earth, $-4\pi\mu = -5.009 \times 10^{15}\,\mathrm{m^3/s^2}$.

### The shell theorem

Now make the planet **spherically symmetric**: its density depends only on distance from the center, like an onion's layers — a good first model of a real planet.

By symmetry, the field at any point must point straight toward the center, and its size can depend only on $r$. Write it $\mathbf{a} = a_r(r)\,\hat{\mathbf{r}}$, where $a_r$ ("a sub r") is the radial part — negative, because gravity points inward. Choose $S$ to be the sphere of radius $r$. On that sphere, $\mathbf{a}\cdot\hat{\mathbf{n}} = a_r(r)$ is the same everywhere. So the flux is that constant times the area, $4\pi r^2 a_r(r)$. Gauss's law says this equals $-4\pi G M_{\text{enc}}(r)$. Divide both sides by $4\pi r^2$:

$$
a_r(r) = -\frac{G\,M_{\text{enc}}(r)}{r^2} .
$$

Outside the body, $M_{\text{enc}} = M$, and the field is exactly $-GM/r^2 = -\mu/r^2$. This is the **[[shell theorem|newton-shell]]**:

::: key
Shell theorem: a spherically symmetric body attracts an outside point exactly as if all its mass were at its center. Inside a hollow shell, $M_{\text{enc}} = 0$ and the shell's pull is zero.
:::

That is why the two-body problem, written for point masses, fits real planets so well — and why every correction to it, like $J_2$, comes from the planet not being perfectly round.

::: example Gravity inside a uniform Earth
Model Earth as a uniform ball of radius $R = 6371\,\mathrm{km}$ with surface gravity $g_{\text{surf}} = 9.82\,\mathrm{m/s^2}$.

**Field.** The mass inside radius $r$ grows with the volume, so $M_{\text{enc}}(r) = M(r/R)^3$. Put that into the shell-theorem formula:

$$
a_r(r) = -\frac{GM}{r^2}\left(\frac{r}{R}\right)^3 = -\frac{GM}{R^3}\,r = -g_{\text{surf}}\,\frac{r}{R} .
$$

The middle step cancels $r^2$ against $r^3$. The last step uses $g_{\text{surf}} = GM/R^2$. So inside, the **[[field grows in a straight line|inside-earth-graph]]** from zero at the center to $g_{\text{surf}}$ at the surface.

**At a depth of 3000 km.** Then $r = 6371 - 3000 = 3371\,\mathrm{km}$ and

$$
\lVert\mathbf{a}\rVert = 9.82 \times \frac{3371}{6371} = 5.20\,\mathrm{m/s^2} .
$$

The mass inside that radius is $(3371/6371)^3 = 0.148$, or $14.8\%$ of the total. Sanity check: we are a bit more than halfway out, so the pull should be a bit more than half of $9.82$ — and $5.20$ is.

(The real Earth's dense core keeps its field nearly constant through the mantle, so the straight line is only a rough guide. The method — Gauss's law with the enclosed mass — is exact for any density that depends only on radius.)

**Potential.** The potential $U$ satisfies $\mathbf{a} = -\nabla U$ and must match $-\mu/R$ at the surface. The inside formula that does both is

$$
U(r) = -\frac{\mu}{2R^3}\left(3R^2 - r^2\right).
$$

Check it: at $r = R$ it gives $-\frac{\mu}{2R^3}\cdot 2R^2 = -\mu/R$. Its slope is $dU/dr = \mu r/R^3$, so $a_r = -dU/dr = -\mu r/R^3$, as required. At the center, $U(0) = -1.5\,\mu/R = -93.8\,\mathrm{MJ/kg}$, against $-62.6\,\mathrm{MJ/kg}$ at the surface. The center is the bottom of the well.

**Laplacian.** Using $\nabla^2(r^2) = 6$ (Lesson 8), $\nabla^2 U = \frac{\mu}{2R^3}\cdot 6 = 3\mu/R^3 = 4.62 \times 10^{-6}\,\mathrm{s^{-2}}$. That is exactly $4\pi G\rho$ for the mean density — as the next section says it must be.
:::

### Poisson's equation

Gauss's law holds for every closed surface. Turn its left side into a volume integral with the divergence theorem:

$$
\iiint_V(\nabla\cdot\mathbf{a})\,dV = -4\pi G\iiint_V\rho\,dV \quad\text{for every region } V .
$$

If two smooth functions have the same integral over *every* region, however small, they are equal at every point — a tiny region around any spot where they differed would show it. So $\nabla\cdot\mathbf{a} = -4\pi G\rho$ at every point. Put in $\mathbf{a} = -\nabla U$, and the divergence of a gradient is the Laplacian:

$$
\nabla^2 U = 4\pi G\rho .
$$

This is **Poisson's equation**, which Lesson 8 stated. Where there is no matter, $\rho = 0$ and it becomes **Laplace's equation**, $\nabla^2 U = 0$. The divergence theorem turns the measured, big-picture law into the point-by-point equation that models of Earth's gravity are built on.

### The continuity equation

The same trick works for moving fluids. Let $\rho(\mathbf{r}, t)$ be the density of a fluid and $\mathbf{v}$ its velocity. Then $\rho\mathbf{v}$ is the **mass flux**: kilograms per second crossing each square meter. The mass inside a fixed region $V$ changes only by flowing across its skin, so

$$
\frac{d}{dt}\iiint_V\rho\,dV = -\oiint_S\rho\mathbf{v}\cdot\hat{\mathbf{n}}\,dS = -\iiint_V\nabla\cdot(\rho\mathbf{v})\,dV .
$$

The first step is bookkeeping; the second is the divergence theorem applied to $\rho\mathbf{v}$. The region was arbitrary, so the integrands match, as with Poisson:

$$
\frac{\partial\rho}{\partial t} + \nabla\cdot(\rho\mathbf{v}) = 0 .
$$

This is the **continuity equation**. In **steady flow** nothing changes with time, so $\nabla\cdot(\rho\mathbf{v}) = 0$. On a length of pipe, no flow crosses the walls, so what comes in one end goes out the other: the **mass flow rate** $\dot m = \rho v A$ ("m dot", kilograms per second; $A$ is the cross-section area) is the same through every cross-section.

A rocket example: at a nozzle exit the gas has density $0.05\,\mathrm{kg/m^3}$ and speed $3000\,\mathrm{m/s}$ over an area of $2\,\mathrm{m^2}$. The mass flow is

$$
\dot m = 0.05 \times 3000 \times 2 = 300\,\mathrm{kg/s} ,
$$

and the same $300\,\mathrm{kg/s}$ passes through the narrow throat and leaves the tanks.

Now follow one blob (a **parcel**) of fluid. Expand the divergence with the product rule: $\nabla\cdot(\rho\mathbf{v}) = \rho\,\nabla\cdot\mathbf{v} + \mathbf{v}\cdot\nabla\rho$. Then continuity becomes

$$
\underbrace{\frac{\partial\rho}{\partial t} + \mathbf{v}\cdot\nabla\rho}_{\text{change seen riding with the parcel}} = -\rho\,\nabla\cdot\mathbf{v} .
$$

The left side is the density change felt riding along: the change at a fixed point plus the change from drifting into denser or thinner fluid. Divide by $\rho$: the parcel's density falls at the fractional rate $\nabla\cdot\mathbf{v}$ — the reading Lesson 8's nozzle question used.

## Stokes' theorem

### Loops and shared edges

Now the curl. Picture a sheet of graph paper and a field of arrows over it. Lesson 8 showed that the circulation around one small square of area $\Delta S$, with unit normal $\hat{\mathbf{n}}$, is about $(\nabla\times\mathbf{F})\cdot\hat{\mathbf{n}}\,\Delta S$.

Walk around every little square of the paper in the same turning direction and add up all the circulations. Each inside edge belongs to two squares. You walk it one way for the first square and the opposite way for the second, so those two pieces cancel. Only the outer edge of the whole sheet survives. And the sheet need not be flat: any curved surface can be tiled with tiny, nearly flat patches, and the same cancelling happens.

That gives **Stokes' theorem**: for an oriented surface $S$ whose edge is the closed curve $C$,

$$
\oint_C\mathbf{F}\cdot d\mathbf{r} = \iint_S(\nabla\times\mathbf{F})\cdot\hat{\mathbf{n}}\,dS .
$$

The circulation of a field around a closed curve equals the flux of its curl through *any* surface that has that curve as its edge.

The direction of travel and the normal are tied by the **[[right-hand rule|right-hand-rule]]**. Curl the fingers of your right hand in the direction you walk around $C$; your thumb gives $\hat{\mathbf{n}}$. Reverse either one and both sides change sign.

::: key
Stokes' theorem: $\oint_C\mathbf{F}\cdot d\mathbf{r} = \iint_S(\nabla\times\mathbf{F})\cdot\hat{\mathbf{n}}\,dS$ for any surface $S$ bounded by $C$, oriented by the right-hand rule. The planar case is Green's theorem, $\oint_C(P\,dx + Q\,dy) = \iint_D(\partial_x Q - \partial_y P)\,dA$.
:::

### Green's theorem: the flat case

In the $xy$ plane, let $\mathbf{F} = [P(x, y), Q(x, y), 0]^\top$, and let $S$ be the flat region $D$ inside $C$, walked counterclockwise so the normal is $\hat{\mathbf{z}}$. The $z$ part of the curl is $\partial_x Q - \partial_y P$ (read "the partial of Q with respect to x"), and Stokes becomes **Green's theorem**, in the key above.

A neat use: choose $P = -y/2$ and $Q = x/2$. Then $\partial_x Q - \partial_y P = \tfrac{1}{2} + \tfrac{1}{2} = 1$, and the right side is the area. So

$$
\text{Area}(D) = \tfrac{1}{2}\oint_C(x\,dy - y\,dx) .
$$

So you can measure an area by walking its edge. Try the ellipse $x = a\cos t$, $y = b\sin t$ for $0 \le t \le 2\pi$. Then $dx = -a\sin t\,dt$ and $dy = b\cos t\,dt$, so

$$
\tfrac{1}{2}(x\,dy - y\,dx) = \tfrac{1}{2}\left(ab\cos^2 t + ab\sin^2 t\right)dt = \tfrac{ab}{2}\,dt .
$$

Integrating over $2\pi$ gives $\pi ab$ — for $a = 3$, $b = 2$, that is $6\pi = 18.85$. The **[[planimeter|planimeter]]**, and the formula computers use to find a polygon's area from its corner points, are Green's theorem in hardware and software.

::: example Circulation of a rigid rotation, both ways
**The small version.** Lesson 7 integrated $\mathbf{F} = [-y, x, 0]^\top$ directly around the circle of radius $2$ in the $xy$ plane and got $8\pi$. Lesson 8 found $\nabla\times\mathbf{F} = [0, 0, 2]^\top$. Take the flat disc as $S$, with $\hat{\mathbf{n}} = \hat{\mathbf{z}}$ (counterclockwise travel, right-hand rule). Then $(\nabla\times\mathbf{F})\cdot\hat{\mathbf{n}} = 2$ everywhere on the disc, and Stokes gives

$$
\iint_S 2\,dS = 2 \times \pi\cdot 2^2 = 8\pi .
$$

They agree.

**The Earth-sized version.** The ground moves with velocity $\mathbf{v} = \boldsymbol{\omega}_E\times\mathbf{r}$, where $\omega_E = 7.2921 \times 10^{-5}\,\mathrm{rad/s}$ is Earth's spin rate. Lesson 8 showed its curl is $2\boldsymbol{\omega}_E$. Take the circle of latitude $45^\circ$ on a sphere of radius $R_e = 6378.137\,\mathrm{km}$. Its radius is

$$
R_e\cos 45^\circ = 6378.137 \times 0.7071 = 4510\,\mathrm{km}.
$$

*Directly.* The ground speed along that circle is $\omega_E R_e\cos 45^\circ = 7.2921\times 10^{-5} \times 4.510\times 10^6 = 328.9\,\mathrm{m/s}$, the same all the way around and pointing along the circle. So the circulation is speed times length:

$$
328.9 \times 2\pi \times 4.510 \times 10^6 = 9.32 \times 10^{9}\,\mathrm{m^2/s} .
$$

*By Stokes.* It must equal the flux of $2\boldsymbol{\omega}_E$ through the polar cap bounded by that circle. The curl is the same everywhere and points along the axis, so its flux through the curved cap is the same as through the flat disc with the same rim. The disc's area is $\pi(4.510 \times 10^6)^2 = 6.39 \times 10^{13}\,\mathrm{m^2}$, and

$$
2\omega_E \times \text{area} = 1.4584 \times 10^{-4} \times 6.39 \times 10^{13} = 9.32 \times 10^{9}\,\mathrm{m^2/s} .
$$

The same number. The cap and the disc agree because they share an edge — the next point.
:::

### Two consequences

**The flux of a curl depends only on the edge.** Two surfaces with the same edge $C$ — a disc and a dome over it — get the same circulation from Stokes, so the same flux of $\nabla\times\mathbf{F}$. Glue them into a *closed* surface, flipping the disc's normal so both point outward, and the two fluxes cancel: the flux of a curl through any closed surface is zero. The divergence theorem plus Lesson 8's identity $\nabla\cdot(\nabla\times\mathbf{F}) = 0$ says the same. The theorems and identities fit together.

**Curl-free means circulation-free — on the right kind of region.** Suppose $\nabla\times\mathbf{F} = \mathbf{0}$ throughout a region, and $C$ is the edge of a surface $S$ lying *entirely inside* it. Then Stokes gives

$$
\oint_C\mathbf{F}\cdot d\mathbf{r} = \iint_S\mathbf{0}\cdot\hat{\mathbf{n}}\,dS = 0 .
$$

The surface must stay where the curl is zero. A region where every closed loop can be filled in like this — where you can shrink any loop to a point without leaving the region — is called **[[simply connected|simply-connected]]**. All of space, a ball, and the space outside a ball (around a planet) are simply connected. The plane with one point removed is not, and neither is space with a whole line removed: a loop around the hole cannot shrink without crossing it. Lesson 10 shows that on a simply connected region a curl-free field has a potential, and gives the classic field that fails on a region with a hole.

::: warning Closed or open, and which way the normal points
The divergence theorem needs a *closed* surface with the *outward* normal. Stokes' theorem needs a surface *with* an edge, and a normal matched to the direction of travel by the right-hand rule. Using the divergence theorem on a bowl without its lid, or Stokes with the normal flipped, gives an answer that is missing a piece or has the wrong sign. Draw the surface and mark the normal first.
:::

::: warning Gauss's law gives the flux, not the field
Gauss's law fixes the *flux* from the mass inside, not the *field at a point* — that step needs symmetry. For a flattened (oblate) Earth, the flux through any surface around it is still $-4\pi\mu$, but the field on a sphere of radius $r$ is not the same all over it. That unevenness is exactly why $J_2$ exists.
:::

## Check yourself

::: check
Use the divergence theorem to find the outward flux of $\mathbf{F} = [x + y^2,\ y - xz,\ z + 3]^\top$ through the closed cylinder $x^2 + y^2 \le 4$, $0 \le z \le 5$.
:::

::: answer
Find the divergence one term at a time: $\partial_x(x + y^2) = 1$, $\partial_y(y - xz) = 1$, $\partial_z(z + 3) = 1$. So $\nabla\cdot\mathbf{F} = 3$, a constant.

The flux is $3$ times the volume. The cylinder has radius $2$ and height $5$, so its volume is $\pi\cdot 2^2\cdot 5 = 20\pi$, and the flux is $3 \times 20\pi = 60\pi \approx 188.5$.

Directly, it would take three surface integrals, with the $y^2$ and $-xz$ terms making the curved side messy. The divergence drops those terms, since neither depends on the variable it is differentiated by.
:::

::: check
A spacecraft measures gravitational acceleration at many points on a closed surface around an [[asteroid|eros-mass]] and finds the total flux to be $-2.5 \times 10^{6}\,\mathrm{m^3/s^2}$. What is the asteroid's mass? Would the same survey around a lumpy, potato-shaped body need a different method?
:::

::: answer
Gauss's law says flux $= -4\pi G M$, so

$$
M = \frac{-\Phi}{4\pi G} = \frac{2.5 \times 10^6}{4\pi \times 6.6743 \times 10^{-11}} = 2.98 \times 10^{15}\,\mathrm{kg},
$$

where $\Phi$ ("phi") is the measured flux. Its gravitational parameter is $\mu = GM = 2.5\times 10^6/(4\pi) \approx 1.99 \times 10^{5}\,\mathrm{m^3/s^2}$.

No change is needed for a lumpy body: the flux through any closed surface around it is $-4\pi GM$, whatever its shape or inner layout. What *would* change is the field at single points, which is no longer $-\mu\hat{\mathbf{r}}/r^2$.
:::

::: check
Check Stokes' theorem for $\mathbf{F} = [-y, x, 0]^\top$ using, instead of the flat disc, the dome (upper half of the sphere) $x^2 + y^2 + z^2 = 4$, $z \ge 0$, which has the same circle of radius $2$ as its edge.
:::

::: answer
The curl is $[0, 0, 2]^\top$. On the dome the outward normal is $\hat{\mathbf{r}}$, whose $z$ part is $\cos\theta$, where $\theta$ is the angle down from the $z$ axis. So $(\nabla\times\mathbf{F})\cdot\hat{\mathbf{n}} = 2\cos\theta$.

On a sphere of radius $2$, a small patch has area $dS = 4\sin\theta\,d\theta\,d\varphi$. So the flux is

$$
\int_0^{2\pi}\!\!\int_0^{\pi/2} 2\cos\theta\cdot 4\sin\theta\,d\theta\,d\varphi = 2\pi \cdot 4\int_0^{\pi/2}\sin 2\theta\,d\theta = 8\pi\cdot 1 = 8\pi .
$$

(The middle step used $2\sin\theta\cos\theta = \sin 2\theta$, and $\int_0^{\pi/2}\sin 2\theta\,d\theta = 1$.) That matches the flat disc and the direct circulation.

The signs agree too. At the rim the outward normal points horizontally outward. Walking counterclockwise (seen from above) with your head along that normal, the dome is on your left — the right-hand-rule pairing.
:::

::: check
Why does the shell theorem fail for Earth's real gravity field, and what part of Gauss's law still holds?
:::

::: answer
The shell theorem needs spherical symmetry so that the field on a sphere of radius $r$ is radial and the same size everywhere, making the flux $4\pi r^2 a_r$. Earth is flattened and the field on a sphere changes with latitude (the $J_2$ part is about $10^{-3}$ of the main term), so $a_r$ cannot come out of the surface integral.

What survives is Gauss's law itself. The flux through any closed surface around Earth is still exactly $-4\pi\mu$, because it depends only on the mass inside and on $\nabla\cdot\mathbf{a} = 0$ outside it.
:::

::: check
Liquid oxygen flows steadily through a feed line whose diameter narrows from $0.30\,\mathrm{m}$ to $0.15\,\mathrm{m}$. If the speed in the wide part is $4\,\mathrm{m/s}$, what is it in the narrow part, and which theorem justifies the answer?
:::

::: answer
A liquid barely compresses, so $\rho$ is constant and steady continuity, $\nabla\cdot(\rho\mathbf{v}) = 0$, becomes $\nabla\cdot\mathbf{v} = 0$.

Apply the divergence theorem to the stretch of pipe between the two cross-sections. The divergence is zero inside, so the net flux out of that closed surface is zero. The walls add nothing, because the flow runs along them ($\mathbf{v}\cdot\hat{\mathbf{n}} = 0$). So the flow in through the wide end equals the flow out through the narrow end: $A_1 v_1 = A_2 v_2$.

Area goes with diameter squared, so

$$
v_2 = v_1\left(\frac{d_1}{d_2}\right)^2 = 4 \times \left(\frac{0.30}{0.15}\right)^2 = 4 \times 4 = 16\,\mathrm{m/s}.
$$

Check with volumes: the wide section's radius is $0.15\,\mathrm{m}$, so its flow is $\pi(0.15)^2 \times 4 = 0.283\,\mathrm{m^3/s}$. The narrow section's radius is $0.075\,\mathrm{m}$, and $\pi(0.075)^2 \times 16 = 0.283\,\mathrm{m^3/s}$ too. Half the width, four times the speed.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\iiint_V(\nabla\cdot\mathbf{F})\,dV = \oiint_S\mathbf{F}\cdot\hat{\mathbf{n}}\,dS$ | divergence theorem; closed surface, outward normal |
| $\oiint_S\mathbf{a}\cdot\hat{\mathbf{n}}\,dS = -4\pi G M_{\text{enc}}$ | Gauss's law for gravity; $-4\pi\mu = -5.01 \times 10^{15}\,\mathrm{m^3/s^2}$ for Earth |
| $a_r(r) = -G M_{\text{enc}}(r)/r^2$ | shell theorem: point-mass field outside a round body, zero inside a hollow shell |
| uniform sphere: $a_r = -g_{\text{surf}}\,r/R$ inside | $5.20\,\mathrm{m/s^2}$ at $3000\,\mathrm{km}$ depth in a uniform Earth |
| $\nabla\cdot\mathbf{a} = -4\pi G\rho$, $\nabla^2 U = 4\pi G\rho$ | Poisson's equation, from Gauss's law and the divergence theorem |
| $\partial\rho/\partial t + \nabla\cdot(\rho\mathbf{v}) = 0$; steady: $\dot m = \rho v A$ | continuity equation; mass flow is the same all along a duct |
| $\oint_C\mathbf{F}\cdot d\mathbf{r} = \iint_S(\nabla\times\mathbf{F})\cdot\hat{\mathbf{n}}\,dS$ | Stokes' theorem; right-hand rule ties $C$ to $\hat{\mathbf{n}}$ |
| $\oint_C(P\,dx + Q\,dy) = \iint_D(\partial_x Q - \partial_y P)\,dA$; Area $= \tfrac{1}{2}\oint(x\,dy - y\,dx)$ | Green's theorem and the area formula |
| flux of a curl through a closed surface is zero | matches $\nabla\cdot(\nabla\times\mathbf{F}) = 0$ |
| $\nabla\times\mathbf{F} = \mathbf{0}$ on a simply connected region $\Rightarrow \oint_C\mathbf{F}\cdot d\mathbf{r} = 0$ | the bridge to conservative fields |

Next, Lesson 10 builds conservative fields from Lessons 7 to 9: when a force has a potential, why its work then ignores the path, and how constant orbital energy and vis-viva follow for gravity.

::: context ftc-bridge The same theorem, three times
In single-variable calculus, $\int_a^b f'(x)\,dx = f(b) - f(a)$: add up a derivative over an interval, and you only need the function at the two ends. The ends are the interval's "boundary".

The divergence theorem says the same thing for a solid: add up a derivative (the divergence) over the inside, and you only need the field on the skin. Stokes' theorem says it for a surface: add up the curl over the sheet, and you only need the field along its edge. In each case the inside pieces cancel in pairs and only the boundary is left.
:::

::: context cancelling-faces Shared walls cancel
Two boxes share a wall. Field leaving the left box through that wall is field entering the right box, so the left box counts it as plus and the right box counts it as minus.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="40" y="30" width="140" height="80" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <rect x="180" y="30" width="140" height="80" fill="#f2b880" stroke="#1f2a44" stroke-width="2"/>
  <line x1="180" y1="30" x2="180" y2="110" stroke="#1f2a44" stroke-width="3"/>
  <line x1="150" y1="58" x2="200" y2="58" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="210,58 198,52 198,64" fill="#1d6fd1"/>
  <line x1="210" y1="84" x2="160" y2="84" stroke="#b4232c" stroke-width="3"/>
  <polygon points="150,84 162,78 162,90" fill="#b4232c"/>
  <text x="95" y="75" font-size="12" text-anchor="middle" fill="#1f2a44">box 1</text>
  <text x="275" y="75" font-size="12" text-anchor="middle" fill="#1f2a44">box 2</text>
  <text x="180" y="132" font-size="12" text-anchor="middle" fill="#1f2a44">box 1's outward normal and box 2's point opposite ways</text>
  <text x="180" y="20" font-size="12" text-anchor="middle" fill="#1f2a44">shared wall: +flux for box 1, −flux for box 2</text>
</svg>
```

Add the two and the shared wall contributes nothing. Only walls with no neighbor — the outer skin — are left in the total.
:::

::: context gauss-name Whose theorem?
It is named after the German mathematician Carl Friedrich Gauss, who used it in his work on gravitational attraction. The Russian mathematician Mikhail Ostrogradsky published a general proof in the 1820s, so in Russia it is usually called Ostrogradsky's theorem, and some books write "Gauss–Ostrogradsky". Whatever the name, the content is the same: sources inside equal flow out.
:::

::: context carved-hole Cutting the mass out
The divergence of gravity is zero everywhere except at the point mass itself. So we cut a tiny ball out around the mass and use the theorem on what is left: the region between the small sphere and the outer surface.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <ellipse cx="180" cy="110" rx="150" ry="85" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="180" cy="110" r="32" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="180" cy="110" r="4" fill="#1f2a44"/>
  <g stroke="#1d6fd1" stroke-width="2.5">
    <line x1="330" y1="110" x2="350" y2="110"/><line x1="30" y1="110" x2="10" y2="110"/>
    <line x1="180" y1="25" x2="180" y2="8"/><line x1="180" y1="195" x2="180" y2="212"/>
  </g>
  <g fill="#1d6fd1">
    <polygon points="356,110 346,105 346,115"/><polygon points="4,110 14,105 14,115"/>
    <polygon points="180,3 175,13 185,13"/><polygon points="180,217 175,207 185,207"/>
  </g>
  <g stroke="#b4232c" stroke-width="2.5">
    <line x1="212" y1="110" x2="198" y2="110"/><line x1="148" y1="110" x2="162" y2="110"/>
  </g>
  <g fill="#b4232c">
    <polygon points="192,110 200,106 200,114"/><polygon points="168,110 160,106 160,114"/>
  </g>
  <text x="180" y="160" font-size="12" text-anchor="middle" fill="#1f2a44">divergence zero in the shaded region</text>
  <text x="250" y="60" font-size="12" text-anchor="middle" fill="#1f2a44">outer surface S</text>
  <text x="180" y="72" font-size="11" text-anchor="middle" fill="#b4232c">normals point in</text>
</svg>
```

On the small sphere, "out of the shaded region" means inward, toward the mass (red arrows). That flipped normal is why its flux is $+4\pi\mu$, which forces the outer surface's flux to be $-4\pi\mu$.
:::

::: context newton-shell Newton's long problem
Isaac Newton proved the shell theorem with geometry in his *Principia* (1687). He needed it: his law of gravity was written for points, but the Moon and Earth are huge balls, and he had to show that treating them as points was fair. Using Gauss's law, the whole proof fits in three lines. Newton had no such tool, and his argument is famously long and careful.
:::

::: context inside-earth-graph Gravity from the center outward
For a uniform ball, gravity grows in a straight line from zero at the center to $g_{\text{surf}}$ at the surface, then falls off as $1/r^2$ outside.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="180" x2="330" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="180" x2="40" y2="30" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="130" y1="40" x2="130" y2="180" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <polyline points="40,180 130,50" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <polyline points="130.0,50.0 139.0,72.6 148.0,89.7 157.0,103.1 166.0,113.7 175.0,122.2 184.0,129.2 193.0,135.0 202.0,139.9 211.0,144.0 220.0,147.5 229.0,150.5 238.0,153.1 247.0,155.4 256.0,157.4 265.0,159.2 274.0,160.8 283.0,162.2 292.0,163.4 301.0,164.5 310.0,165.6" fill="none" stroke="#b4232c" stroke-width="3"/>
  <circle cx="87.6" cy="111.2" r="4" fill="#1f2a44"/>
  <text x="95" y="108" font-size="11" fill="#1f2a44">5.20 at 3000 km deep</text>
  <text x="44" y="42" font-size="11" fill="#1f2a44">9.82 m/s²</text>
  <text x="40" y="196" font-size="11" text-anchor="middle" fill="#1f2a44">0</text>
  <text x="130" y="196" font-size="11" text-anchor="middle" fill="#1f2a44">R</text>
  <text x="220" y="196" font-size="11" text-anchor="middle" fill="#1f2a44">2R</text>
  <text x="310" y="196" font-size="11" text-anchor="middle" fill="#1f2a44">3R</text>
  <text x="240" y="120" font-size="11" fill="#b4232c">outside: 1/r²</text>
  <text x="62" y="160" font-size="11" fill="#1d6fd1">inside</text>
</svg>
```

The two curves meet at the surface, $r = R$. At $2R$ the pull is a quarter of the surface value, and at $3R$ a ninth.
:::

::: context right-hand-rule Fingers and thumb
Curl the fingers of your right hand the way you walk around the loop. Your thumb points along the normal that Stokes' theorem wants. The same rim can hold a flat disc or a dome, and both get the same flux of curl.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <path d="M40,130 A80,80 0 0,1 200,130" fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <ellipse cx="120" cy="130" rx="80" ry="26" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <line x1="95" y1="156" x2="145" y2="156" stroke="#b4232c" stroke-width="3"/>
  <polygon points="155,156 143,150 143,162" fill="#b4232c"/>
  <line x1="120" y1="130" x2="120" y2="30" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="120,22 114,34 126,34" fill="#1d6fd1"/>
  <text x="130" y="30" font-size="12" fill="#1d6fd1">n̂ (thumb)</text>
  <text x="215" y="160" font-size="12" fill="#b4232c">direction of travel</text>
  <text x="215" y="176" font-size="12" fill="#b4232c">(fingers)</text>
  <text x="215" y="90" font-size="12" fill="#6c7a93">dome with the same rim</text>
</svg>
```

Seen from above, the travel is counterclockwise, and the normal points up. Seen from below, the same travel looks clockwise — which is why the normal and the direction must be chosen together.
:::

::: context planimeter Measuring area by tracing the edge
A **planimeter** is a mechanical instrument with a hinged arm and a small measuring wheel. You trace the outline of a shape on a map or drawing with its pointer, and the wheel's reading gives the area inside. Engineers and surveyors used them for over a century to measure areas on plans and charts. It works because of Green's theorem: the wheel adds up a line integral around the edge, and that equals the area.

The computer version is the "shoelace formula": for a polygon with corners $(x_k, y_k)$, the area is $\tfrac{1}{2}\left|\sum_k (x_k y_{k+1} - x_{k+1} y_k)\right|$, which is $\tfrac{1}{2}\oint(x\,dy - y\,dx)$ worked out along straight sides.
:::

::: context simply-connected The rubber band test
Stretch a rubber band into any loop inside a region. If you can always slide it down to a single point without it leaving the region, the region is **simply connected**.

Around a planet, the space outside a ball passes: a loop can slide over the planet like a band slipping off a ball. A room with a pole running from floor to ceiling fails: a band looped around the pole cannot come off. This is the "hole" Lesson 10 meets, and it is the only thing that can stop a curl-free field from having a potential.
:::

::: context eros-mass Weighing a real asteroid
Spacecraft really do weigh asteroids by their gravity, though in practice by tracking how the asteroid bends the spacecraft's path rather than by sampling a whole surface. NASA's NEAR Shoemaker orbited the asteroid Eros in 2000 and found its mass to be about $6.7 \times 10^{15}\,\mathrm{kg}$ — similar in size to the check question's asteroid. Gauss's law is why the total mass is the easy part: the shape does not matter for it. The lumpy shape shows up only in the finer details of the field.
:::
