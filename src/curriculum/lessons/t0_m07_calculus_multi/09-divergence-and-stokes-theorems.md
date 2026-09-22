---
id: l09-divergence-and-stokes-theorems
title: The divergence theorem and Stokes' theorem
minutes: 25
covers:
  - divergence and Stokes theorems
---

Lesson 7 computed the flux of a field through a surface and its circulation around a curve. Lesson 8 defined the divergence as flux per unit volume and the curl as circulation per unit area. The two integral theorems of this lesson close the loop: the total flux out of a closed surface is the volume integral of the divergence inside it, and the circulation around a closed curve is the surface integral of the curl across any surface it bounds. Each theorem is the fundamental theorem of calculus in a higher dimension — the integral of a derivative over a region equals the value of the function on the region's boundary — and each has a two-line proof once you see that the boundary contributions of adjacent small pieces cancel.

For a GNC engineer the divergence theorem is the route from Newton's inverse-square law to two facts used daily without comment: that a spherically symmetric planet attracts exactly as a point mass at its centre, and that the gravitational potential obeys Poisson's equation inside matter and Laplace's outside. It is also the basis of the continuity equation that governs propellant flow. Stokes' theorem connects the curl to circulation and, in Lesson 10, supplies the proof that a curl-free force field has a potential, which is the whole reason orbital energy is conserved.

## The divergence theorem

### Small boxes and cancelling faces

Lesson 8 showed that for a small box of volume $\Delta V$, the outward flux of $\mathbf{F}$ through its six faces is $(\nabla\cdot\mathbf{F})\,\Delta V$ to first order. Now fill a finite region $V$ with such boxes and add up their fluxes. Every interior face is shared by two neighbouring boxes, and the outward normal of one is the inward normal of the other, so the flux leaving one box through that face is exactly the flux entering the other: the two contributions cancel. The only faces that survive the sum are those on the outer boundary of $V$, which together make up the closed surface $S = \partial V$. Hence

$$
\sum_{\text{boxes}}(\nabla\cdot\mathbf{F})\,\Delta V = \oiint_S\mathbf{F}\cdot\hat{\mathbf{n}}\,dS,
$$

and letting the boxes shrink turns the left side into a volume integral. This is the **divergence theorem** (also called Gauss's theorem):

$$
\iiint_V(\nabla\cdot\mathbf{F})\,dV = \oiint_S\mathbf{F}\cdot\hat{\mathbf{n}}\,dS, \qquad S = \partial V,\ \hat{\mathbf{n}}\text{ outward}.
$$

In words: the net amount of field created inside a region (the sources minus the sinks, summed) equals the net amount flowing out through its boundary. The theorem holds for any bounded region with a piecewise smooth boundary and any field continuously differentiable on it; regions with holes are allowed, provided every boundary surface is counted with its normal pointing out of $V$ — which, for an inner boundary, points toward the hole.

::: key
Divergence theorem: $\iiint_V(\nabla\cdot\mathbf{F})\,dV = \oiint_S\mathbf{F}\cdot\hat{\mathbf{n}}\,dS$ — the volume integral of the divergence equals the net flux through the closed bounding surface, with the normal outward.
:::

::: example Checking the theorem two ways
Lesson 7 found the outward flux of $\mathbf{F} = \mathbf{r}$ through the sphere of radius $2$ to be $32\pi$ directly. With $\nabla\cdot\mathbf{r} = 3$ the theorem gives $\iiint_V 3\,dV = 3 \times \tfrac{4}{3}\pi\cdot 8 = 32\pi$. For a field whose divergence varies, take $\mathbf{F} = [x^2, y^2, z^2]^\top$ on the unit cube $[0, 1]^3$. The divergence is $2(x + y + z)$ and its integral is $2\left(\tfrac{1}{2} + \tfrac{1}{2} + \tfrac{1}{2}\right) = 3$, since each of $x$, $y$, $z$ integrates to $\tfrac{1}{2}$ over the cube. Directly: on the face $x = 1$, $\mathbf{F}\cdot\hat{\mathbf{n}} = F_1 = 1$ and the flux is $1$; on the face $x = 0$, $F_1 = 0$ and the flux is $0$; the other two pairs of faces behave the same way, for a total of $1 + 1 + 1 = 3$. Six face integrals or one volume integral — the theorem lets you choose whichever is easier, and for a closed surface it is very often the volume side.
:::

### Gauss's law for gravity

Apply the theorem to two-body gravity, $\mathbf{a} = -\mu\mathbf{r}/r^3$, whose divergence Lesson 8 showed to be zero everywhere except at the mass. Let $S$ be any closed surface. Two cases:

**$S$ does not enclose the mass.** Then $\nabla\cdot\mathbf{a} = 0$ throughout the interior, and the theorem gives $\oiint_S\mathbf{a}\cdot\hat{\mathbf{n}}\,dS = 0$. Whatever field enters, leaves.

**$S$ encloses the mass.** The divergence is undefined at the mass itself, so remove it: carve out a small sphere $S_\epsilon$ of radius $\epsilon$ around the mass, and apply the theorem to the region between $S_\epsilon$ and $S$. The divergence is zero in that region, so the total outward flux through its two boundaries is zero. The outward normal of the region on the inner boundary points *toward* the mass, so the flux through $S_\epsilon$ with that normal is $+4\pi\mu$ (the negative of Lesson 7's $-4\pi\mu$, which used the normal pointing away from the mass). Therefore the flux through $S$ is $-4\pi\mu$:

$$
\oiint_S\mathbf{a}\cdot\hat{\mathbf{n}}\,dS = \begin{cases} -4\pi\mu = -4\pi G M & \text{if } S \text{ encloses the mass,} \\ 0 & \text{otherwise.} \end{cases}
$$

The result Lesson 7 found for a centred sphere holds for a cube, an ellipsoid, or any lopsided closed surface whatever, as long as it encloses the mass. Since fields of several masses add, so do their fluxes, and for a continuous distribution of density $\rho$,

$$
\oiint_S\mathbf{a}\cdot\hat{\mathbf{n}}\,dS = -4\pi G\,M_{\text{enc}}, \qquad M_{\text{enc}} = \iiint_V\rho\,dV,
$$

**Gauss's law for gravity**: the flux of gravitational acceleration out of any closed surface is $-4\pi G$ times the mass inside it, and the mass outside contributes nothing to the flux. Numerically, for Earth, $-4\pi\mu = -5.009 \times 10^{15}\,\mathrm{m^3/s^2}$.

### The shell theorem

Now let the mass distribution be **spherically symmetric** — density depending only on distance from the centre, which is a good first model of a planet. By symmetry the field at any point must be radial and its magnitude can depend only on $r$: $\mathbf{a} = a_r(r)\,\hat{\mathbf{r}}$. Take $S$ to be the sphere of radius $r$. Then $\mathbf{a}\cdot\hat{\mathbf{n}} = a_r(r)$ is constant on $S$, the flux is $4\pi r^2 a_r(r)$, and Gauss's law gives

$$
a_r(r) = -\frac{G\,M_{\text{enc}}(r)}{r^2} .
$$

Outside the body, $M_{\text{enc}} = M$ and the field is exactly $-GM/r^2 = -\mu/r^2$: **a spherically symmetric body attracts an external point as if all its mass were at its centre.** That is why the two-body problem, formulated for point masses, describes real planets so well, and why Earth's departures from point-mass gravity are entirely a matter of its departures from spherical symmetry — the $J_2$ and higher terms. Inside a hollow shell, $M_{\text{enc}} = 0$ and the field vanishes.

::: example Gravity inside a uniform Earth
Model Earth as a uniform sphere of radius $R = 6371\,\mathrm{km}$ with surface gravity $g_{\text{surf}} = 9.82\,\mathrm{m/s^2}$. Inside, $M_{\text{enc}}(r) = M(r/R)^3$, so

$$
a_r(r) = -\frac{GM}{r^2}\left(\frac{r}{R}\right)^3 = -\frac{GM}{R^3}\,r = -g_{\text{surf}}\,\frac{r}{R} .
$$

The field grows linearly from zero at the centre to $g_{\text{surf}}$ at the surface. At a depth of $3000\,\mathrm{km}$, $r = 3371\,\mathrm{km}$ and $\lVert\mathbf{a}\rVert = 9.82 \times 3371/6371 = 5.20\,\mathrm{m/s^2}$; the mass within that radius is $(3371/6371)^3 = 14.8\%$ of the total. (The real Earth's dense core makes the field nearly constant through the mantle and the linear law a rough guide, but the method — Gauss's law with the enclosed mass — is exact for any spherically symmetric density profile.) The corresponding potential, from $\mathbf{a} = -\nabla U$ with $U$ continuous at the surface, is $U = -\tfrac{\mu}{2R^3}(3R^2 - r^2)$ inside, so $U(0) = -1.5\,\mu/R = -93.8\,\mathrm{MJ/kg}$ against $-62.6\,\mathrm{MJ/kg}$ at the surface. Its Laplacian, by $\nabla^2(r^2) = 6$, is $3\mu/R^3 = 4.62 \times 10^{-6}\,\mathrm{s^{-2}}$ — exactly $4\pi G\rho$ for the mean density, as the next paragraph requires.
:::

### Poisson's equation

Gauss's law holds for every closed surface. Convert its left side with the divergence theorem:

$$
\iiint_V(\nabla\cdot\mathbf{a})\,dV = -4\pi G\iiint_V\rho\,dV \quad\text{for every region } V .
$$

Two continuous functions whose integrals agree over every region are equal, so $\nabla\cdot\mathbf{a} = -4\pi G\rho$ pointwise. With $\mathbf{a} = -\nabla U$ this is

$$
\nabla^2 U = 4\pi G\rho ,
$$

**Poisson's equation**, which Lesson 8 stated. Where there is no matter it reduces to Laplace's equation $\nabla^2 U = 0$. The divergence theorem is what connects the global, experimental statement (inverse-square attraction, flux proportional to enclosed mass) to the local, differential one that governs the spherical-harmonic expansion of the geopotential.

### The continuity equation

The same theorem turns "mass is conserved" into a differential equation. Let $\rho(\mathbf{r}, t)$ be the density of a fluid and $\mathbf{v}$ its velocity, so that $\rho\mathbf{v}$ is the mass flux (mass per second per square metre). The mass inside a fixed region $V$ changes only because mass flows across its boundary:

$$
\frac{d}{dt}\iiint_V\rho\,dV = -\oiint_S\rho\mathbf{v}\cdot\hat{\mathbf{n}}\,dS = -\iiint_V\nabla\cdot(\rho\mathbf{v})\,dV .
$$

Since $V$ is arbitrary, the integrands agree: $\partial\rho/\partial t + \nabla\cdot(\rho\mathbf{v}) = 0$, the **continuity equation**. For steady flow, $\nabla\cdot(\rho\mathbf{v}) = 0$: the mass flow rate $\dot m = \rho v A$ through every cross-section of a duct is the same. At a nozzle exit where the gas has density $0.05\,\mathrm{kg/m^3}$ and speed $3000\,\mathrm{m/s}$ over an area of $2\,\mathrm{m^2}$, the mass flow is $\dot m = 0.05 \times 3000 \times 2 = 300\,\mathrm{kg/s}$, and the same $300\,\mathrm{kg/s}$ passes the throat and leaves the tanks. Expanding the divergence, $\nabla\cdot(\rho\mathbf{v}) = \rho\,\nabla\cdot\mathbf{v} + \mathbf{v}\cdot\nabla\rho$, and the equation says that a parcel's density falls at the fractional rate $\nabla\cdot\mathbf{v}$, which is the interpretation used in Lesson 8's nozzle question.

## Stokes' theorem

### Small loops and cancelling edges

Lesson 8 showed that the circulation of $\mathbf{F}$ around a small planar loop of area $\Delta S$ with unit normal $\hat{\mathbf{n}}$ is $(\nabla\times\mathbf{F})\cdot\hat{\mathbf{n}}\,\Delta S$ to first order. Now take an oriented surface $S$ — not necessarily flat — with boundary curve $C$, and tile it with small patches, each traversed in the sense given by the right-hand rule about the surface normal. Every interior edge is shared by two patches, which traverse it in opposite directions, so their contributions cancel. Only the edges on $C$ survive:

$$
\oint_C\mathbf{F}\cdot d\mathbf{r} = \iint_S(\nabla\times\mathbf{F})\cdot\hat{\mathbf{n}}\,dS .
$$

This is **Stokes' theorem**: the circulation of a field around a closed curve equals the flux of its curl through any surface bounded by the curve. The orientation convention is the right-hand rule: with the fingers curling in the direction of travel around $C$, the thumb gives $\hat{\mathbf{n}}$. Reversing either reverses the sign of both sides.

::: key
Stokes' theorem: $\oint_C\mathbf{F}\cdot d\mathbf{r} = \iint_S(\nabla\times\mathbf{F})\cdot\hat{\mathbf{n}}\,dS$ for any surface $S$ bounded by $C$, oriented by the right-hand rule. The planar case is Green's theorem, $\oint_C(P\,dx + Q\,dy) = \iint_D(\partial_x Q - \partial_y P)\,dA$.
:::

In the plane, with $\mathbf{F} = [P(x, y), Q(x, y), 0]^\top$ and $S$ the flat region $D$ inside $C$ traversed counter-clockwise, the curl's $z$ component is $\partial_x Q - \partial_y P$ and the theorem is **Green's theorem**. Choosing $P = -y/2$, $Q = x/2$ gives $\partial_x Q - \partial_y P = 1$ and the useful formula $\text{Area}(D) = \tfrac{1}{2}\oint_C(x\,dy - y\,dx)$: for the ellipse $x = a\cos t$, $y = b\sin t$, the integrand is $\tfrac{1}{2}(ab\cos^2 t + ab\sin^2 t) = ab/2$, and the area is $\pi ab$ — $18.85$ for $a = 3$, $b = 2$. Planimeters, and the algorithm that computes the area of a polygon from its vertices, are Green's theorem in hardware and software.

::: example Circulation of a rigid rotation, both ways
Lesson 7 integrated $\mathbf{F} = [-y, x, 0]^\top$ directly around the circle of radius $2$ in the $xy$ plane and found $8\pi$. Lesson 8 found $\nabla\times\mathbf{F} = [0, 0, 2]^\top$. With the disc as $S$ and $\hat{\mathbf{n}} = \hat{\mathbf{z}}$ (counter-clockwise traversal, right-hand rule), Stokes gives $\iint_S 2\,dS = 2 \times 4\pi = 8\pi$. Agreement.

Scale it to Earth. The velocity of the ground is $\mathbf{v} = \boldsymbol{\omega}_E\times\mathbf{r}$ with curl $2\boldsymbol{\omega}_E$. Around the circle of latitude $45^\circ$, of radius $R_e\cos 45^\circ = 4510\,\mathrm{km}$, the ground speed is $\omega_E R_e\cos 45^\circ = 328.9\,\mathrm{m/s}$ everywhere along the circle, and it is tangent to it, so the circulation is $328.9 \times 2\pi \times 4.510 \times 10^6 = 9.32 \times 10^{9}\,\mathrm{m^2/s}$. By Stokes, this must equal the flux of $2\boldsymbol{\omega}_E$ through the polar cap bounded by that circle. The curl is uniform and along the axis, so its flux through the curved cap equals its flux through the flat disc of the same boundary — $2\omega_E$ times the disc area $\pi(4.510 \times 10^6)^2 = 6.39 \times 10^{13}\,\mathrm{m^2}$ — which is $1.4584 \times 10^{-4} \times 6.39 \times 10^{13} = 9.32 \times 10^{9}\,\mathrm{m^2/s}$. The cap and the disc give the same answer because they share a boundary, which is the point of the next paragraph.
:::

### Two consequences

**The flux of a curl depends only on the boundary.** If $S_1$ and $S_2$ are two surfaces with the same boundary curve $C$, Stokes gives the same circulation for both, so $\iint_{S_1}(\nabla\times\mathbf{F})\cdot\hat{\mathbf{n}}\,dS = \iint_{S_2}(\nabla\times\mathbf{F})\cdot\hat{\mathbf{n}}\,dS$. Equivalently, the flux of a curl through any *closed* surface is zero — which is the divergence theorem applied to $\nabla\cdot(\nabla\times\mathbf{F}) = 0$ from Lesson 8. The two theorems and the two identities are one consistent system.

**Curl-free means circulation-free, on the right kind of domain.** If $\nabla\times\mathbf{F} = \mathbf{0}$ throughout a region, then for any closed curve $C$ in the region that bounds some surface $S$ lying in the region, Stokes gives $\oint_C\mathbf{F}\cdot d\mathbf{r} = 0$. The proviso matters: $C$ must be the boundary of a surface that stays inside the region where the curl vanishes. A region in which every closed curve can be filled in this way — shrunk to a point without leaving the region — is called **simply connected**. All of space, a ball, and the exterior of a ball (the space outside a planet) are simply connected. The plane with the origin removed, or space with an infinite line removed, is not: a loop around the hole cannot be shrunk without crossing it. Lesson 10 shows that on a simply connected domain a curl-free field has a potential, and gives the classic counterexample on a domain with a hole.

::: warning
The divergence theorem needs a *closed* surface and an *outward* normal; Stokes' theorem needs a surface *with* a boundary and a normal matched to the direction of travel by the right-hand rule. Applying the divergence theorem to a hemisphere without its base, or Stokes with the normal flipped relative to the traversal, gives answers wrong by a missing term or a sign. Draw the surface and mark the normal before writing either side.
:::

::: warning
Gauss's law makes the *flux* through a surface depend only on the enclosed mass. It does not make the *field* at a point depend only on the enclosed mass — that step needs symmetry. For an oblate Earth the flux through any surface around it is still $-4\pi\mu$, but the field on a sphere of radius $r$ is not uniform over it, which is exactly why $J_2$ exists.
:::

## Check yourself

::: check
Use the divergence theorem to find the outward flux of $\mathbf{F} = [x + y^2,\ y - xz,\ z + 3]^\top$ through the closed cylinder $x^2 + y^2 \le 4$, $0 \le z \le 5$.
:::

::: answer
$\nabla\cdot\mathbf{F} = 1 + 1 + 1 = 3$, a constant, so the flux is $3 \times$ volume $= 3 \times \pi\cdot 4\cdot 5 = 60\pi = 188.5$. Computing it directly would need three surface integrals (top, bottom, curved side) with the $y^2$ and $-xz$ terms contributing non-trivially to the side; the theorem reduces it to a volume. Note that the divergence discards all the terms whose derivative with respect to their own variable is zero.
:::

::: check
A spacecraft measures the gravitational acceleration at many points on a closed surface around an asteroid and finds the flux integral to be $-2.5 \times 10^{6}\,\mathrm{m^3/s^2}$. What is the asteroid's mass? Would flying the same survey around an irregular potato-shaped body require any change to the method?
:::

::: answer
Gauss's law gives $M = -\Phi/(4\pi G) = 2.5 \times 10^6/(4\pi \times 6.6743 \times 10^{-11}) = 2.98 \times 10^{15}\,\mathrm{kg}$ (about $\mu = 199\,\mathrm{m^3/s^2}$). No change is needed for an irregular body: the flux through any closed surface enclosing it is $-4\pi G M$ regardless of shape or density distribution. What *would* change is the field at individual points, which for an irregular body is not $-\mu\hat{\mathbf{r}}/r^2$; only the total flux is shape-independent.
:::

::: check
Verify Stokes' theorem for $\mathbf{F} = [-y, x, 0]^\top$ using, instead of the flat disc, the hemisphere $x^2 + y^2 + z^2 = 4$, $z \ge 0$, bounded by the same circle of radius $2$.
:::

::: answer
The curl is $[0, 0, 2]^\top$ and the outward normal of the hemisphere is $\hat{\mathbf{r}}$, so $(\nabla\times\mathbf{F})\cdot\hat{\mathbf{n}} = 2\cos\theta$ where $\theta$ is the polar angle. With $dS = 4\sin\theta\,d\theta\,d\varphi$, the flux is $\int_0^{2\pi}\!\int_0^{\pi/2} 2\cos\theta\cdot 4\sin\theta\,d\theta\,d\varphi = 8\pi\int_0^{\pi/2}\sin 2\theta\,d\theta = 8\pi\cdot 1 = 8\pi$, the same as through the disc and the same as the direct circulation. The outward normal at the rim points horizontally, and the counter-clockwise traversal seen from above is right-handed about it, so the sign is consistent.
:::

::: check
Why does the shell theorem fail for Earth's real gravity field, and what property of Gauss's law survives?
:::

::: answer
The shell theorem needs spherical symmetry to conclude that the field on a sphere of radius $r$ is radial and uniform, so that flux $= 4\pi r^2 a_r$. Earth is oblate, its density is not a function of radius alone, and the field on a sphere varies with latitude (the $J_2$ term is about $10^{-3}$ of the main term), so $a_r$ cannot be pulled out of the surface integral. What survives is Gauss's law itself: the flux through any closed surface enclosing Earth is still exactly $-4\pi\mu$, because that depends only on the enclosed mass and on $\nabla\cdot\mathbf{a} = 0$ outside it.
:::

::: check
Liquid oxygen flows steadily through a feed line whose diameter narrows from $0.30\,\mathrm{m}$ to $0.15\,\mathrm{m}$. If the speed in the wide section is $4\,\mathrm{m/s}$, what is it in the narrow section, and which theorem justifies the answer?
:::

::: answer
The liquid is incompressible ($\rho$ constant), so the steady continuity equation $\nabla\cdot(\rho\mathbf{v}) = 0$ becomes $\nabla\cdot\mathbf{v} = 0$, and integrating it over the section of pipe between the two cross-sections with the divergence theorem gives zero net flux through the closed surface: the flow in through the wide end equals the flow out through the narrow end (the walls contribute nothing since $\mathbf{v}\cdot\hat{\mathbf{n}} = 0$ there). So $A_1 v_1 = A_2 v_2$, and since the area scales with diameter squared, $v_2 = 4 \times (0.30/0.15)^2 = 16\,\mathrm{m/s}$. The volumetric flow is $\pi(0.15)^2 \times 4 = 0.283\,\mathrm{m^3/s}$ in both sections.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\iiint_V(\nabla\cdot\mathbf{F})\,dV = \oiint_S\mathbf{F}\cdot\hat{\mathbf{n}}\,dS$ | divergence theorem; closed surface, outward normal |
| $\oiint_S\mathbf{a}\cdot\hat{\mathbf{n}}\,dS = -4\pi G M_{\text{enc}}$ | Gauss's law for gravity; $-4\pi\mu = -5.01 \times 10^{15}\,\mathrm{m^3/s^2}$ for Earth |
| $a_r(r) = -G M_{\text{enc}}(r)/r^2$ | shell theorem for spherically symmetric bodies: point-mass field outside, zero inside a shell |
| uniform sphere: $a_r = -g_{\text{surf}}\,r/R$ inside | $5.20\,\mathrm{m/s^2}$ at $3000\,\mathrm{km}$ depth in a uniform Earth |
| $\nabla\cdot\mathbf{a} = -4\pi G\rho$, $\nabla^2 U = 4\pi G\rho$ | Poisson's equation, from Gauss's law and the divergence theorem |
| $\partial\rho/\partial t + \nabla\cdot(\rho\mathbf{v}) = 0$; steady: $\rho v A = \dot m$ | continuity equation; mass flow constant along a duct |
| $\oint_C\mathbf{F}\cdot d\mathbf{r} = \iint_S(\nabla\times\mathbf{F})\cdot\hat{\mathbf{n}}\,dS$ | Stokes' theorem; right-hand rule relates $C$ and $\hat{\mathbf{n}}$ |
| $\oint_C(P\,dx + Q\,dy) = \iint_D(\partial_x Q - \partial_y P)\,dA$; Area $= \tfrac{1}{2}\oint(x\,dy - y\,dx)$ | Green's theorem and the area formula |
| flux of a curl through a closed surface is zero | consistency of the two theorems with $\nabla\cdot(\nabla\times\mathbf{F}) = 0$ |
| $\nabla\times\mathbf{F} = \mathbf{0}$ on a simply connected region $\Rightarrow \oint_C\mathbf{F}\cdot d\mathbf{r} = 0$ | the bridge to conservative fields |

The final lesson assembles the results of Lessons 7 to 9 into the theory of conservative fields: when a force has a potential, why that makes its work path-independent, and how the conservation of specific orbital energy — and the vis-viva equation — follow for gravity.
