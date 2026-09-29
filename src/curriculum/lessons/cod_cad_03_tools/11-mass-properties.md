---
id: l11-mass-properties
title: Mass properties for a 6-DOF simulation
minutes: 24
covers:
  - 'Mass properties: where the mass, center of gravity and inertia tensor for a 6-DOF simulation come from'
---

Pick up a broom by the very end of the handle and try to twirl it. Hard work. Now grab it near the brush, where it balances, and twirl it again. Much easier. The broom did not get lighter. What changed is where the mass sits compared with the point you spin it about.

Three numbers describe that. How heavy the thing is: its **mass**. Where it balances: its **center of gravity**. And how hard it is to spin about each direction: its **inertia**. Together they are called the **mass properties**.

A GNC engineer needs all three for every vehicle. A **[[6-DOF simulation|six-dof-sim]]** — the program that flies the vehicle in software, tracking three positions and three angles — cannot run without them. The mass sets how thrust turns into acceleration. The center of gravity sets the lever arm every force acts through. The inertia sets how torque turns into rotation. Last lesson you built an assembly. This lesson shows where these numbers come out of it, how to compute them yourself, and what quietly makes them wrong.

## Mass: density times volume

Every CAD solid knows its own **volume**, $V$ — how much space it fills, in cubic meters. Give the part a material and the material brings a **density**, $\rho$ (read "rho") — mass per unit volume, in $\mathrm{kg/m^3}$. Then

$$
m = \rho V.
$$

Aluminum is about $2700\,\mathrm{kg/m^3}$, titanium alloy about $4430$, steel about $7850$, carbon-fiber composite about $1600$. An assembly's mass is the sum of its parts' masses:

$$
M = \sum_i m_i,
$$

where the index $i$ runs over every part.

The CAD tool does this for you, but only as well as the density you gave it. If nobody assigned a material, many tools quietly use a **default density** — often water, $1000\,\mathrm{kg/m^3}$, or whatever the template says. The volume is right; the mass is a guess.

## Center of gravity: the balance point

Put two kids on a seesaw. If they weigh the same, the balance point is in the middle. If one is twice as heavy, the balance point moves towards that one, so that the lighter kid sits twice as far away. The balance point is a **[[weighted average|balance-point]]** of the positions, where each position counts in proportion to its mass.

The **center of gravity**, or **CG** (also called the center of mass), is exactly that:

$$
\mathbf{r}_{cg} = \frac{\sum_i m_i\, \mathbf{r}_i}{M}.
$$

Here $\mathbf{r}_i$ (read "r sub i", bold because it is a vector with x, y and z parts) is where part $i$'s own center sits, and $\mathbf{r}_{cg}$ is the assembly's CG. You compute it one direction at a time: add up mass times x for every part and divide by the total mass; then the same for y and z.

::: key Centre of gravity
Mass $m = \rho V$ for each part, $M = \sum m_i$ for the assembly, and the CG is the mass-weighted average position: $\mathbf{r}_{cg} = \sum m_i \mathbf{r}_i / M$.
:::

## The inertia tensor

Back to the broom. How hard something is to spin depends on how much mass there is and on how far that mass sits from the spin axis — and distance counts twice. Mass twice as far away is four times as hard to spin. The **moment of inertia** about an axis adds up every bit of mass times its distance from that axis, squared:

$$
I_{zz} = \int (x^2 + y^2)\, dm.
$$

Read the long S, $\int$, as "add up over every tiny bit of mass $dm$". For spin about the z axis, the distance of a bit at $(x, y, z)$ from the axis is $\sqrt{x^2 + y^2}$, and squaring it gives $x^2 + y^2$. The same idea gives $I_{xx} = \int (y^2 + z^2)\,dm$ and $I_{yy} = \int (x^2 + z^2)\,dm$. Units: $\mathrm{kg\,m^2}$.

A spacecraft does not only spin about neat axes, so three numbers are not enough. The full description is a $3 \times 3$ table called the **[[inertia tensor|tensor-word]]**:

$$
\mathbf{I} =
\begin{bmatrix}
I_{xx} & I_{xy} & I_{xz} \\
I_{xy} & I_{yy} & I_{yz} \\
I_{xz} & I_{yz} & I_{zz}
\end{bmatrix},
\qquad
I_{xy} = -\int x\,y\,dm, \quad I_{xz} = -\int x\,z\,dm, \quad I_{yz} = -\int y\,z\,dm.
$$

The three on the diagonal are the **moments of inertia**. The three off the diagonal are the **products of inertia**. A product of inertia measures how lopsided the mass is: it is zero when the mass is balanced across the axes, and non-zero when, say, extra mass sits where $x$ and $y$ are **[[both positive|products-picture]]**. A non-zero product means that spinning about one axis tries to twist the body about another too. The table is symmetric: the entry in row x, column y equals the one in row y, column x.

For a solid box of mass $m$ and side lengths $a$, $b$, $c$ along x, y, z, about its own center and its own edges' directions, the products are zero and

$$
I_{xx} = \frac{m}{12}(b^2 + c^2), \qquad I_{yy} = \frac{m}{12}(a^2 + c^2), \qquad I_{zz} = \frac{m}{12}(a^2 + b^2).
$$

::: warning Check the sign of the products
The minus signs in $I_{xy} = -\int xy\,dm$ are the **tensor** convention, the one that goes straight into the equations of motion. Some CAD tools and some reports list the products *without* the minus sign, as $+\int xy\,dm$, and call them "products of inertia" all the same. Before you copy a CAD report into a simulator, read the tool's documentation for its convention, or test it on a part whose answer you know. A flipped sign is not a small error: in this lesson's example it changes the principal moments by about 1 to 5%.
:::

## Which point, which axes

A tensor is only meaningful with two labels attached: **about which point** and **along which axes**.

The simulator wants the tensor **about the CG, in body axes**. **Body axes** are x, y, z directions fixed to the vehicle — for a rocket, x often along the length. The equations of rotation, Euler's equations, are written about the CG in body axes:

$$
\boldsymbol{\tau} = \mathbf{I}\,\dot{\boldsymbol{\omega}} + \boldsymbol{\omega} \times (\mathbf{I}\,\boldsymbol{\omega}),
$$

where $\boldsymbol{\tau}$ ("tau") is the torque, $\boldsymbol{\omega}$ ("omega") is the spin rate and $\dot{\boldsymbol{\omega}}$ ("omega dot") is how fast the spin rate changes.

CAD tools measure everything from an **output coordinate system** — by default the assembly's origin, which is wherever the modeler happened to start. Many tools report three versions: the tensor about the CG aligned with the output axes; the principal moments at the CG; and the tensor about the output origin itself. Only the first one is what the simulator wants, provided the output axes are set to the vehicle's body axes. Make a coordinate system that matches the body axes and ask for the properties relative to it.

### The parallel-axis theorem

If you have a tensor about one point and need it about another, you do not start over. The **parallel-axis theorem** shifts it. Let $\mathbf{d}$ be the vector from a point $O$ to the CG, with length $d = |\mathbf{d}|$. Then

$$
\mathbf{I}_O = \mathbf{I}_{cg} + m\left(d^2\,\mathbf{1} - \mathbf{d}\,\mathbf{d}^{\mathsf{T}}\right),
\qquad\text{so}\qquad
\mathbf{I}_{cg} = \mathbf{I}_O - m\left(d^2\,\mathbf{1} - \mathbf{d}\,\mathbf{d}^{\mathsf{T}}\right).
$$

Here $\mathbf{1}$ is the $3 \times 3$ **identity matrix** (ones on the diagonal, zeros elsewhere), and $\mathbf{d}\,\mathbf{d}^{\mathsf{T}}$ ("d d-transpose") is the $3 \times 3$ table whose row $j$, column $k$ entry is $d_j d_k$. For the $zz$ entry alone it reads $I_{zz,O} = I_{zz,cg} + m(d_x^2 + d_y^2)$: the familiar "add mass times distance squared".

::: key Parallel-axis theorem
$\mathbf{I}_{cg} = \mathbf{I}_O - m(d^2\,\mathbf{1} - \mathbf{d}\,\mathbf{d}^{\mathsf{T}})$, with $\mathbf{d}$ from $O$ to the CG. The tensor is smallest about the CG: moving the reference point away always adds to the moments. A 6-DOF simulator wants the tensor about the CG, in body axes.
:::

::: note Why it has to be true
Measure each bit of mass from the CG: its position from $O$ is $\mathbf{d} + \boldsymbol{\rho}$, where $\boldsymbol{\rho}$ is its position from the CG. Take the $zz$ entry: $I_{zz,O} = \int \left[(d_x + \rho_x)^2 + (d_y + \rho_y)^2\right] dm$. Multiply out the squares. You get three kinds of term: $\int (\rho_x^2 + \rho_y^2)\,dm$, which is $I_{zz,cg}$; $(d_x^2 + d_y^2)\int dm = m(d_x^2 + d_y^2)$; and cross terms like $2 d_x \int \rho_x\,dm$. But $\int \boldsymbol{\rho}\,dm = \mathbf{0}$, because that is what "measured from the CG" means — the mass-weighted average of $\boldsymbol{\rho}$ is zero. So the cross terms vanish. The products work the same way: $-\int (d_x + \rho_x)(d_y + \rho_y)\,dm = I_{xy,cg} - m\,d_x d_y$, which is the off-diagonal part of $-m\,\mathbf{d}\,\mathbf{d}^{\mathsf{T}}$.
:::

::: example Two blocks on a line, by hand
Part A is an aluminum block, $0.2 \times 0.1 \times 0.1\,\mathrm{m}$, centered at the origin. Part B is a steel cube, $0.1\,\mathrm{m}$ on each side, centered at $x = 0.15\,\mathrm{m}$. Find $I_{zz}$ about the assembly CG.

**Masses.** $m_A = 2700 \times 0.2 \times 0.1 \times 0.1 = 5.40\,\mathrm{kg}$. $m_B = 7850 \times 0.1^3 = 7.85\,\mathrm{kg}$. Total $M = 13.25\,\mathrm{kg}$.

**CG.** Both centers are on the x axis, so only $x$ matters: $x_{cg} = \dfrac{5.40 \times 0 + 7.85 \times 0.15}{13.25} = 0.0889\,\mathrm{m}$. Closer to the steel, as it should be.

**Each block about its own center.** $I_{zz,A} = \frac{5.40}{12}(0.2^2 + 0.1^2) = 0.0225\,\mathrm{kg\,m^2}$. $I_{zz,B} = \frac{7.85}{12}(0.1^2 + 0.1^2) = 0.0131\,\mathrm{kg\,m^2}$.

**Shift each to the CG.** A sits $0.0889\,\mathrm{m}$ from the CG: $5.40 \times 0.0889^2 = 0.0426$. B sits $0.15 - 0.0889 = 0.0611\,\mathrm{m}$ away: $7.85 \times 0.0611^2 = 0.0293$.

**Add.** $I_{zz,cg} = 0.0225 + 0.0131 + 0.0426 + 0.0293 = 0.108\,\mathrm{kg\,m^2}$.

**Check with the theorem the other way.** About the origin, A needs no shift and B shifts by $0.15$: $I_{zz,O} = 0.0225 + 0.0131 + 7.85 \times 0.15^2 = 0.2122$. Subtract $M x_{cg}^2 = 13.25 \times 0.08887^2 = 0.1046$ (using the CG to one more digit, $0.08887\,\mathrm{m}$): $0.2122 - 0.1046 = 0.1076$, which rounds to $0.108\,\mathrm{kg\,m^2}$. Same answer. (Keep a fourth digit in the middle of a subtraction like this; rounding both sides to three first gives $0.107$, a false mismatch.) Notice the tensor about the origin is about twice the one about the CG — hand the simulator the wrong one and the vehicle turns half as fast as it should.
:::

## Principal moments

Every rigid body, however lopsided, has three special directions at right angles where the products of inertia are all zero. Spin it about one of these and it spins cleanly, without wobbling onto another axis. These are the **principal axes**, and the moments about them are the **principal moments**.

Finding them is an **[[eigenvalue problem|eigen-word]]**: the principal moments are the eigenvalues of $\mathbf{I}$, and the principal axes are its eigenvectors. With NumPy it is one line, `np.linalg.eigvalsh(I)`, which is built for symmetric tables like this one.

Two quick checks catch most bad tensors. The sum of the three diagonal entries (the **trace**) equals the sum of the principal moments, whatever axes you use. And no principal moment can be bigger than the other two added together, so each must satisfy $I_1 \le I_2 + I_3$. A CAD export that breaks this rule has a typo or a sign error in it.

The order of the principal moments matters to GNC: a body spins stably about its largest and smallest axes, and **[[tumbles about the middle one|intermediate-axis]]**.

::: key Principal moments
The principal moments are the eigenvalues of the inertia tensor about the CG; the principal axes are its eigenvectors. Their sum equals the trace, and each one is at most the sum of the other two.
:::

## A four-part assembly in Python

Here is the whole pipeline, the one a CAD tool runs inside. Four box-shaped parts with real materials: an aluminum base plate, a battery pack with a measured effective density, a steel wheel block and a thin aluminum mast. Each box's edges line up with the body axes, so its own tensor is diagonal; the products come entirely from where the parts sit.

```python
import numpy as np

# name, density (kg/m^3), box size (x, y, z) in m, box centre (x, y, z) in m
parts = [
    ("base plate",  2700, (0.30, 0.30, 0.010), ( 0.00,  0.00, 0.005)),
    ("battery",     2200, (0.12, 0.08, 0.060), ( 0.07,  0.05, 0.040)),
    ("wheel block", 7850, (0.08, 0.08, 0.040), (-0.07,  0.06, 0.030)),
    ("mast",        2700, (0.02, 0.02, 0.400), (-0.10, -0.10, 0.210)),
]

def mass_properties(parts):
    m = np.array([rho * np.prod(size) for _, rho, size, _ in parts])
    c = np.array([centre for _, _, _, centre in parts])
    M = m.sum()                                  # total mass
    cg = (m[:, None] * c).sum(axis=0) / M        # mass-weighted average position
    I_cg = np.zeros((3, 3))
    for mi, (_, _, (a, b, h), _), ci in zip(m, parts, c):
        I_own = mi / 12 * np.diag([b*b + h*h, a*a + h*h, a*a + b*b])
        d = ci - cg                              # part centre measured from the CG
        I_cg += I_own + mi * ((d @ d) * np.eye(3) - np.outer(d, d))
    return M, cg, I_cg

np.set_printoptions(precision=5, suppress=True)
M, cg, I = mass_properties(parts)
print(f"mass {M:.3f} kg, CG {cg.round(4)} m")
print("inertia about CG, body axes (kg m^2):")
print(I)
P = np.linalg.eigvalsh(I)
print("principal moments:", P)

parts[3] = ("mast", 1600, (0.02, 0.02, 0.400), (-0.10, -0.10, 0.210))  # carbon fibre
M2, cg2, I2 = mass_properties(parts)
P2 = np.linalg.eigvalsh(I2)
print(f"CFRP mast: mass {M2:.3f} kg, CG {cg2.round(4)} m")
print("principal moments:", P2)
print("change (%):", (100 * (P2 - P) / P).round(1))
```

It prints:

```text
mass 6.139 kg, CG [-0.0155  0.0229  0.0348] m
inertia about CG, body axes (kg m^2):
[[ 0.05341 -0.0025   0.00643]
 [-0.0025   0.06166  0.00782]
 [ 0.00643  0.00782  0.07122]]
principal moments: [0.04918 0.06061 0.07649]
CFRP mast: mass 5.963 kg, CG [-0.013   0.0266  0.0297] m
principal moments: [0.04205 0.05171 0.06862]
change (%): [-14.5 -14.7 -10.3]
```

The line inside the loop is the parallel-axis theorem, used to move each part's own tensor to the assembly CG before adding. You can add tensors only when they are about the same point and along the same axes.

::: example Reading the output
**Mass.** The parts weigh $2.43$, $1.27$, $2.01$ and $0.432\,\mathrm{kg}$. For instance the wheel block is $7850 \times 0.08 \times 0.08 \times 0.04 = 2.01\,\mathrm{kg}$. The total is $6.139\,\mathrm{kg}$.

**CG, x part, by hand.** Mass times x: $2.43 \times 0 + 1.267 \times 0.07 + 2.01 \times (-0.07) + 0.432 \times (-0.10) = -0.0952\,\mathrm{kg\,m}$. Divide by $6.139$: $x_{cg} = -0.0155\,\mathrm{m}$. It matches the printout. The heavy steel block sits at negative x and outweighs the battery at positive x, so a small negative value makes sense.

**Checks on the tensor.** The trace is $0.05341 + 0.06166 + 0.07122 = 0.1863$, and the principal moments add to $0.04918 + 0.06061 + 0.07649 = 0.1863$. They match. The largest, $0.0765$, is less than $0.0492 + 0.0606 = 0.1098$. It passes.

**The material change.** Switching the mast from aluminum to carbon fiber takes its mass from $0.432$ to $0.256\,\mathrm{kg}$, a loss of $0.176\,\mathrm{kg}$ — under $3\%$ of the total. Yet two principal moments drop by more than $14\%$. The mast is long and far from the CG, and distance counts squared. A small part in the wrong place can matter more to attitude control than a big part near the middle.
:::

In a simulator, those smaller moments mean the same thruster torque spins the vehicle up about 17% faster about those axes, which changes controller gains and the rate at which a reaction wheel saturates. That is why a material change is a mass-properties change, and a mass-properties change is a GNC change.

::: warning Watch the units on export
CAD tools often report inertia in $\mathrm{g\,mm^2}$ or $\mathrm{kg\,mm^2}$, because parts are modeled in millimeters. $1\,\mathrm{kg\,m^2} = 10^6\,\mathrm{kg\,mm^2} = 10^9\,\mathrm{g\,mm^2}$. A factor of a million wrong is easy to spot; a factor of a thousand, from grams against kilograms, can slip through.
:::

## What makes a CAD tensor wrong

The mass properties are only as true as the model is complete and materially correct. The usual failures are not bugs in the software. They are things the model does not know.

- **Placeholder materials and densities.** A part left at the template default, or given "generic steel" when it is really titanium. An electronics box modeled as a solid block of aluminum when it is mostly air and circuit cards.
- **Missing mass.** Harnesses and cables, brackets added late, glue, paint, fasteners nobody modeled — and, on a rocket, the biggest one of all: **fluids and propellant**, whose mass, CG and inertia change throughout the flight as the tanks drain.
- **Simplified or suppressed components.** Envelope blocks, defeatured stand-ins and parts suppressed to make the assembly load faster. Last lesson warned about exactly this.
- **As-built deviation.** The shop made something slightly different from the model: a thicker wall, a different fastener, an approved substitute material.

::: key Where the inertia tensor comes from, and what invalidates it
A GNC engineer gets the inertia tensor from the CAD assembly mass properties with real materials assigned. It is invalidated by placeholder materials and densities, missing harnesses, fluids and propellant, simplified or suppressed components, and any as-built deviation. Flight numbers get reconciled against measured mass properties.
:::

### Reconciliation

Because of all that, flight programs do not stop at the CAD number. The hardware gets **[[weighed and swung|measuring]]**: weighed for mass, balanced on several load cells for the CG, and spun or swung on special fixtures for the moments of inertia. The measured values are compared with the CAD prediction. Where they disagree, someone finds out why, and either the model is fixed or the measured numbers take over. Programs also carry a **[[mass growth allowance|mass-margin]]** early on, because models almost always get heavier as they fill in.

For your simulation, that means one habit: every inertia tensor you use should come with a note of where it came from, about which point, in which axes, with what product sign convention, and whether it has been checked against measurement.

## Check yourself

::: check
A part is modeled correctly but has no material assigned, and the tool uses $1000\,\mathrm{kg/m^3}$. The real part is titanium at $4430\,\mathrm{kg/m^3}$. By what factor are its mass and its own moments of inertia wrong? Does its CG move?
:::

::: answer
Mass is $\rho V$, and every moment is a sum of mass times distance squared, so both scale with density. Both are too small by a factor of $4430 / 1000 = 4.43$. The part's own CG does not move, because it depends only on the shape when the density is uniform. But the *assembly's* CG moves towards this part once its real mass is used, and so does every tensor entry that involves it.
:::

::: check
Two identical $3\,\mathrm{kg}$ masses sit at $x = 0$ and $x = 0.4\,\mathrm{m}$. A third, $6\,\mathrm{kg}$, sits at $x = 0.1\,\mathrm{m}$. Where is the CG along x?
:::

::: answer
Total mass $3 + 3 + 6 = 12\,\mathrm{kg}$. Sum of mass times position: $3 \times 0 + 3 \times 0.4 + 6 \times 0.1 = 1.2 + 0.6 = 1.8\,\mathrm{kg\,m}$. Divide: $x_{cg} = 1.8 / 12 = 0.15\,\mathrm{m}$. It sits between the heavy mass at $0.1$ and the middle of the two light ones at $0.2$, pulled towards the heavy one. That makes sense.
:::

::: check
A CAD report gives $I_{zz} = 0.50\,\mathrm{kg\,m^2}$ about the assembly origin. The assembly is $20\,\mathrm{kg}$ and its CG sits at $x = 0.10\,\mathrm{m}$, $y = 0.05\,\mathrm{m}$ from the origin. What is $I_{zz}$ about the CG?
:::

::: answer
For the $zz$ entry, the parallel-axis theorem subtracts $m(d_x^2 + d_y^2)$: $20 \times (0.10^2 + 0.05^2) = 20 \times 0.0125 = 0.25\,\mathrm{kg\,m^2}$. So $I_{zz,cg} = 0.50 - 0.25 = 0.25\,\mathrm{kg\,m^2}$. It is smaller than the value about the origin, as it must be: the tensor is smallest about the CG.
:::

::: check
A colleague copies a CAD tensor into the simulator. The diagonal looks right, but the simulated vehicle drifts onto the wrong axis when it spins. Name two things to check in the export.
:::

::: answer
First, the sign convention of the products of inertia: if the tool reports $+\int xy\,dm$ and the simulator expects the tensor entry $-\int xy\,dm$, every off-diagonal entry has the wrong sign, which changes the principal axes and how spin couples between axes. Second, the point and axes: the simulator wants the tensor about the CG in body axes, not about the model origin and not in the CAD's arbitrary output axes. (Units are worth a glance too.)
:::

::: check
Your CAD mass properties say $412\,\mathrm{kg}$ and the vehicle weighs in at $431\,\mathrm{kg}$ on the scales. List three places the missing $19\,\mathrm{kg}$ might be hiding, and say which number goes into the flight simulation.
:::

::: answer
Candidates: harnesses and cables not modeled; parts left at placeholder densities (an electronics box as "generic" material); suppressed or simplified components; fasteners, adhesive and paint; residual fluids; and as-built deviations such as thicker walls or substitute materials. The measured mass is the truth for flight. The team reconciles: it finds and fixes the gap in the model where it can, and the measured mass properties take precedence where it cannot.
:::

## Summary

| Symbol or idea | Meaning | Formula or fact |
|---|---|---|
| $m = \rho V$ | Mass from density and volume | Only as good as the assigned material |
| $\mathbf{r}_{cg}$ | Center of gravity | $\sum m_i \mathbf{r}_i / M$ |
| $I_{xx}, I_{yy}, I_{zz}$ | Moments of inertia | Mass times distance from the axis, squared |
| $I_{xy}, I_{xz}, I_{yz}$ | Products of inertia | Tensor convention $-\int xy\,dm$; check the tool's sign |
| Box about its center | Solid block, sides a, b, c | $I_{zz} = \frac{m}{12}(a^2 + b^2)$ |
| Parallel-axis theorem | Shift the reference point | $\mathbf{I}_{cg} = \mathbf{I}_O - m(d^2\mathbf{1} - \mathbf{d}\mathbf{d}^{\mathsf{T}})$ |
| Principal moments | Eigenvalues of $\mathbf{I}$ | Sum equals trace; each at most the sum of the others |
| For the simulator | Which tensor | About the CG, in body axes |
| What invalidates it | Model not complete or not true to hardware | Placeholder densities, missing harness, fluids, propellant, suppressed parts, as-built deviation |

Next lesson turns the model back into instructions for the shop: drawings made from the model, and product manufacturing information carried in the model itself.

::: context six-dof-sim Six numbers for where, six for how fast
A 6-DOF simulation tracks a vehicle's three position coordinates and three attitude angles, plus how fast each is changing, by stepping Newton's laws forward in small time steps. Translation needs the mass. Rotation needs the inertia tensor. Every force applied away from the CG — thrust through a gimbaled engine, aerodynamic force at the center of pressure — also makes a torque, whose lever arm is measured from the CG. Get any of the three mass properties wrong and the simulated vehicle flies differently from the real one.
:::

::: context balance-point The seesaw rule
A seesaw balances when mass times distance on one side equals mass times distance on the other. A $40\,\mathrm{kg}$ kid $1.5\,\mathrm{m}$ from the pivot balances a $60\,\mathrm{kg}$ adult $1.0\,\mathrm{m}$ from it, because $40 \times 1.5 = 60 \times 1.0 = 60$. The CG formula is the same rule, solved for where the pivot must go.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="70" x2="330" y2="70" stroke="#1f2a44" stroke-width="4"/>
  <polygon points="210,72 196,105 224,105" fill="#6c7a93"/>
  <rect x="38" y="42" width="26" height="26" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="297" y="30" width="38" height="38" fill="#1d6fd1" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="51" y="30" font-size="11" text-anchor="middle" fill="#1f2a44">40 kg</text>
  <text x="316" y="22" font-size="11" text-anchor="middle" fill="#1f2a44">60 kg</text>
  <text x="130" y="92" font-size="11" text-anchor="middle" fill="#1f2a44">1.5 m</text>
  <text x="263" y="92" font-size="11" text-anchor="middle" fill="#1f2a44">1.0 m</text>
  <text x="210" y="122" font-size="11" text-anchor="middle" fill="#b4232c">balance point (CG)</text>
</svg>
```
:::

::: context tensor-word Why "tensor" and not "number"
A tensor is a quantity whose numbers depend on which axes you write it in, but in a predictable way. Turn your axes and the nine entries change, yet they still describe the same physical body. That is why a tensor must always come labeled with its axes and its reference point. The word comes from the Latin for "stretch", from its first use describing stress in materials.
:::

::: context products-picture Where a product of inertia comes from
Put two equal masses at $(+1, +1)$ and $(-1, -1)$ in the x-y plane. Each has $xy = +1$, so $\int xy\,dm$ is positive and the tensor entry $I_{xy}$ is negative. Move one of them to $(+1, -1)$ instead and the two $xy$ values cancel: the product is zero. Products measure mass lined up along a diagonal between the axes.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="80" x2="160" y2="80" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="90" y1="10" x2="90" y2="150" stroke="#6c7a93" stroke-width="1.5"/>
  <circle cx="130" cy="40" r="9" fill="#1d6fd1"/>
  <circle cx="50" cy="120" r="9" fill="#1d6fd1"/>
  <text x="90" y="158" font-size="11" text-anchor="middle" fill="#1f2a44">diagonal: product not zero</text>
  <line x1="200" y1="80" x2="340" y2="80" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="270" y1="10" x2="270" y2="150" stroke="#6c7a93" stroke-width="1.5"/>
  <circle cx="310" cy="40" r="9" fill="#1d6fd1"/>
  <circle cx="310" cy="120" r="9" fill="#1d6fd1"/>
  <text x="270" y="158" font-size="11" text-anchor="middle" fill="#1f2a44">mirrored: product zero</text>
  <text x="165" y="84" font-size="11" fill="#1f2a44">x</text>
  <text x="94" y="18" font-size="11" fill="#1f2a44">y</text>
</svg>
```
:::

::: context eigen-word The body's own axes
"Eigen" is German for "own". An eigenvector of a matrix is a direction the matrix does not turn, only stretches; the eigenvalue is how much it stretches. For an inertia tensor, spinning about an eigenvector gives angular momentum pointing the same way as the spin — which is why the body spins cleanly about it. Every symmetric $3 \times 3$ matrix has three such directions at right angles to each other, so every rigid body has three principal axes.
:::

::: context intermediate-axis The tumbling T-handle
Spin a book, a phone or a tennis racket in the air about each of its three axes. About the longest and shortest axes it spins steadily. About the middle one it flips over and over. Cosmonaut Vladimir Dzhanibekov noticed a wing nut doing exactly this aboard the Salyut 7 space station in 1985, so it is often called the Dzhanibekov effect. For a real spacecraft it means the ordering of the principal moments is a design fact that attitude control must respect, and energy loss from flexing parts or sloshing fluid makes even the minimum-moment spin drift over time.
:::

::: context measuring Weighing a balance point
To find the CG along a beam, rest it on two scales a known distance apart. If scales $1.0\,\mathrm{m}$ apart read $30\,\mathrm{kg}$ and $20\,\mathrm{kg}$, the CG is $1.0 \times 20 / (30 + 20) = 0.4\,\mathrm{m}$ from the first scale. Real mass-properties facilities do the same with three or more load cells, and measure moments of inertia by timing a swing or a twist on a calibrated fixture.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="50" y="40" width="260" height="16" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="40" y="58" width="40" height="22" fill="#6c7a93"/>
  <rect x="280" y="58" width="40" height="22" fill="#6c7a93"/>
  <text x="60" y="98" font-size="11" text-anchor="middle" fill="#1f2a44">30 kg</text>
  <text x="300" y="98" font-size="11" text-anchor="middle" fill="#1f2a44">20 kg</text>
  <line x1="156" y1="20" x2="156" y2="40" stroke="#b4232c" stroke-width="2"/>
  <polygon points="156,40 151,30 161,30" fill="#b4232c"/>
  <text x="156" y="15" font-size="11" text-anchor="middle" fill="#b4232c">CG</text>
  <text x="180" y="122" font-size="11" text-anchor="middle" fill="#1f2a44">scales 1.0 m apart; CG 0.4 m from the left scale</text>
</svg>
```
:::

::: context mass-margin Why models always get heavier
Early in a program the model is mostly outlines: no harness, few fasteners, placeholder boxes for electronics. As detail arrives, mass nearly always goes up. So mass-properties engineers carry a growth allowance on each item — larger for new, immature designs and smaller for flight-proven hardware — and the GNC team is told which numbers are predictions and which are measured.
:::
