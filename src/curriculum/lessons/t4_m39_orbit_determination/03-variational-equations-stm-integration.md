---
id: l03-variational-equations-stm-integration
title: The variational equations and computing the STM by integration
minutes: 20
covers:
  - The variational equations and computing the STM by integration
---

Drop two paper boats into a stream, side by side, a hand's width apart. Watch the gap between them. Where the current is even, the gap stays the same. Where one boat sits in faster water, the gap stretches. Around a rock, it may twist. You do not need to track the whole stream to know what happens to the gap: you only need to know how the current *changes* from one boat to the other, right where they are.

That is the idea of this lesson. The previous lesson used the state transition matrix $\boldsymbol\Phi(t,t_0)$ as a black box: it says how a small nudge to the starting state grows into a nudge later on. Here we open the box. The nudge is the gap between two boats, and the equation that tells the gap how to grow is called the **variational equations**.

For a pure two-body orbit, $\boldsymbol\Phi$ can be written down in closed form from the Lagrange coefficients. But the moment a real force enters — Earth's bulge, air drag, the Moon's pull — there is no closed form to fall back on. Every orbit determination system in operational use gets $\boldsymbol\Phi$ the general way: by integrating a differential equation for it, right alongside the trajectory, with whatever force model the mission needs.

## Differentiating the flow

Write the equations of motion as one first-order system,

$$
\dot{\mathbf x}=\mathbf f(\mathbf x,t),
$$

where $\mathbf x=(\mathbf r,\mathbf v)$ holds position and velocity, six numbers. Read $\dot{\mathbf x}$ as "x dot", the rate of change of $\mathbf x$. The function $\mathbf f$ is the force model: it says how fast each number is changing right now.

A solution depends on two things: the time $t$, and where it started, $\mathbf x_0$. Write it $\mathbf x(t;\mathbf x_0)$. Then $\boldsymbol\Phi$ is, by definition, the **[[Jacobian|jacobian]]** of that solution with respect to its starting point — the table of "how much does each number at time $t$ move, per unit nudge of each starting number":

$$
\boldsymbol\Phi(t,t_0) \equiv \frac{\partial\mathbf x(t;\mathbf x_0)}{\partial\mathbf x_0}.
$$

Now differentiate the equation of motion itself with respect to $\mathbf x_0$. Swap the order of the time derivative and the $\mathbf x_0$ derivative (allowed wherever $\mathbf f$ is smooth, which every force model in this module is). Then use the chain rule on $\mathbf f$, which depends on $\mathbf x_0$ only through $\mathbf x$:

$$
\frac{d}{dt}\left(\frac{\partial\mathbf x}{\partial\mathbf x_0}\right) = \frac{\partial\dot{\mathbf x}}{\partial\mathbf x_0} = \frac{\partial\mathbf f}{\partial\mathbf x_0} = \frac{\partial\mathbf f}{\partial\mathbf x}\,\frac{\partial\mathbf x}{\partial\mathbf x_0} .
$$

Name the middle piece $\mathbf A(t) \equiv \partial\mathbf f/\partial\mathbf x$, the Jacobian of the force model, evaluated on the reference trajectory. Then the line above says:

$$
\dot{\boldsymbol\Phi}(t,t_0) = \mathbf A(t)\,\boldsymbol\Phi(t,t_0), \qquad \boldsymbol\Phi(t_0,t_0)=\mathbf I .
$$

These are the variational equations. The starting value comes straight from the definition: at $t=t_0$ the solution *is* its starting point, $\mathbf x(t_0;\mathbf x_0)=\mathbf x_0$, and the Jacobian of $\mathbf x_0$ with respect to itself is the identity matrix $\mathbf I$.

Notice something useful. The orbit equations are nonlinear in $\mathbf x$ — gravity goes like one over distance squared. But the equation for $\boldsymbol\Phi$ is **linear** in $\boldsymbol\Phi$: a matrix times $\boldsymbol\Phi$. It is linear because it describes *small* nudges, and small nudges add. The matrix $\mathbf A(t)$ changes with time, because it is evaluated wherever the reference orbit happens to be.

::: key State transition matrix
$\boldsymbol\Phi(t,t_0)$ maps a state perturbation at $t_0$ to one at $t$: $\delta\mathbf x(t)=\boldsymbol\Phi(t,t_0)\,\delta\mathbf x_0$. It is obtained by integrating the variational equations $\dot{\boldsymbol\Phi}=\mathbf A(t)\boldsymbol\Phi$ with $\boldsymbol\Phi(t_0,t_0)=\mathbf I$, alongside the trajectory, where $\mathbf A=\partial\mathbf f/\partial\mathbf x$ is the Jacobian of the force model along the reference trajectory.
:::

## The two-body A, derived in full

For pure two-body motion, $\mathbf f(\mathbf x)=(\mathbf v,\ -\mu\mathbf r/r^3)$: position changes at the rate $\mathbf v$, and velocity changes at the rate of gravity's pull. Split $\mathbf A$ into four $3\times3$ blocks — how each half of $\dot{\mathbf x}$ depends on each half of $\mathbf x$:

$$
\mathbf A = \begin{pmatrix} \partial\dot{\mathbf r}/\partial\mathbf r & \partial\dot{\mathbf r}/\partial\mathbf v \\ \partial\dot{\mathbf v}/\partial\mathbf r & \partial\dot{\mathbf v}/\partial\mathbf v \end{pmatrix}
= \begin{pmatrix} \mathbf 0 & \mathbf I \\ \mathbf G(\mathbf r) & \mathbf 0 \end{pmatrix}.
$$

Take the blocks one at a time:

- **Top row.** $\dot{\mathbf r}=\mathbf v$. It does not depend on $\mathbf r$ (zero block) and depends on $\mathbf v$ one-for-one (identity block).
- **Bottom right.** Gravity $-\mu\mathbf r/r^3$ does not care how fast you are going, so this block is zero.
- **Bottom left.** The only real work: how gravity changes when you move a little. This is $\mathbf G=\partial\dot{\mathbf v}/\partial\mathbf r$, the **[[gravity-gradient tensor|gravity-gradient]]**.

To find $\mathbf G$, differentiate component $i$ of the acceleration with respect to component $j$ of position. Two facts do it. First, $\partial r_i/\partial r_j$ is $1$ when $i=j$ and $0$ otherwise; that pattern is written $\delta_{ij}$ (the **[[Kronecker delta|kronecker-delta]]**). Second, since $r^2=r_1^2+r_2^2+r_3^2$, we get $\partial r/\partial r_j = r_j/r$, so $\partial(r^{-3})/\partial r_j = -3r^{-4}\cdot r_j/r = -3r_j/r^5$. With the product rule:

$$
\frac{\partial}{\partial r_j}\left(-\frac{\mu r_i}{r^3}\right) = -\mu\left(\frac{\delta_{ij}}{r^3} - \frac{3r_ir_j}{r^5}\right) = \frac{\mu}{r^3}\left(\frac{3r_ir_j}{r^2}-\delta_{ij}\right).
$$

In matrix form, with $\hat{\mathbf r}=\mathbf r/r$ the unit vector toward the satellite:

$$
\mathbf G(\mathbf r) = \frac{\mu}{r^3}\left(3\hat{\mathbf r}\hat{\mathbf r}^\mathsf T - \mathbf I\right).
$$

Read what it says. Move a little *outward* along $\hat{\mathbf r}$ and the matrix gives $\frac{\mu}{r^3}(3-1)=2\mu/r^3$ times your move, pointing outward: gravity weakens, so the pull back relaxes by twice the fractional move. Move a little *sideways* and it gives $-\mu/r^3$ times your move: the pull tilts to point back toward the center line. That stretch-along, squeeze-across pattern is the same one that raises tides.

Two properties are worth checking every time:

- **Its trace is zero.** Summing the diagonal gives $\frac{\mu}{r^3}(3-3)=0$. That is [[Laplace's equation|laplace-equation]] — what the second derivatives of gravity's potential must satisfy in empty space.
- **It is symmetric.** $\mathbf G$ is the matrix of second derivatives of the potential energy per unit mass, $-\mu/r$, and mixed second derivatives do not care about order.

::: key The variational equations and the two-body Jacobian
$\dot{\boldsymbol\Phi}=\mathbf A(t)\boldsymbol\Phi$, $\boldsymbol\Phi(t_0,t_0)=\mathbf I$, with $\mathbf A=\partial\mathbf f/\partial\mathbf x$ along the reference trajectory. For two-body motion, $\mathbf A=\begin{pmatrix}\mathbf 0&\mathbf I\\ \mu r^{-3}(3\hat{\mathbf r}\hat{\mathbf r}^\mathsf T-\mathbf I)&\mathbf 0\end{pmatrix}$: velocity feeds position directly, and the gravity-gradient tensor turns position error into velocity error. It has zero trace and does not depend on velocity.
:::

::: example Checking G two ways
Take the $420\,\mathrm{km}$ orbit of the previous lesson at its epoch position, $\mathbf r_0=(3149.693,\ 4949.506,\ 3421.126)\,\mathrm{km}$. Compute $\mathbf G$ from the formula, and again by nudging the position $\pm h$ along each axis and differencing the raw acceleration:

```python
import numpy as np
MU = 398600.4418   # km^3/s^2

def accel(r):
    return -MU*r/np.linalg.norm(r)**3

def G_analytic(r):
    rn = np.linalg.norm(r)
    rhat = r/rn
    return MU/rn**3 * (3*np.outer(rhat, rhat) - np.eye(3))

r0 = np.array([3149.693, 4949.506, 3421.126])   # km
G_a = G_analytic(r0)
h = 1e-4                                        # km
G_fd = np.column_stack([(accel(r0 + h*e) - accel(r0 - h*e))/(2*h) for e in np.eye(3)])
print("largest entry of G:", np.max(np.abs(G_a)))
print("max |G_analytic - G_fd| =", np.max(np.abs(G_a - G_fd)))
print("trace(G) =", np.trace(G_a))
# largest entry of G: 1.4e-06
# max |G_analytic - G_fd| = 7.5e-15
# trace(G) = -3.2e-22
```

The entries of $\mathbf G$ are about $10^{-6}\,\mathrm{s^{-2}}$. The two methods agree to $7.5\times10^{-15}\,\mathrm{s^{-2}}$, about eight digits below the entries themselves. The trace is $-3\times10^{-22}\,\mathrm{s^{-2}}$: zero, up to round-off. Sanity check on the size: $\mu/r^3$ at $r=6791\,\mathrm{km}$ is $1.27\times10^{-6}\,\mathrm{s^{-2}}$, and the biggest entry should be up to twice that. It is.
:::

## Integrating Φ alongside the trajectory

The equation for $\boldsymbol\Phi$ has $36$ numbers in it. It cannot be integrated on its own, because $\mathbf A(t)$ needs the current position $\mathbf r(t)$ at every step. So the standard trick is to stack everything into one long state: the $6$ numbers of $\mathbf x$ and the $36$ of $\boldsymbol\Phi$, a $42$-number vector. Its derivative is $\mathbf f(\mathbf x,t)$ for the first six and $\mathbf A(t)\boldsymbol\Phi$ for the rest. Integrate it as one system, starting from $\boldsymbol\Phi=\mathbf I$, with the same integrator you would use for any orbit. One integration gives both the trajectory and its exact sensitivity to the epoch.

```python
import numpy as np
from scipy.integrate import solve_ivp
MU = 398600.4418                          # km^3/s^2

def G(r):                                 # gravity-gradient tensor
    rn = np.linalg.norm(r); rh = r/rn
    return MU/rn**3 * (3*np.outer(rh, rh) - np.eye(3))

def A_of(r):                              # two-body Jacobian A = df/dx
    A = np.zeros((6, 6)); A[:3, 3:] = np.eye(3); A[3:, :3] = G(r)
    return A

def f42(t, y):                            # state (6) and Phi (36), stacked
    r, v, Phi = y[:3], y[3:6], y[6:].reshape(6, 6)
    return np.concatenate([v, -MU*r/np.linalg.norm(r)**3, (A_of(r) @ Phi).ravel()])

x0 = np.array([3149.693, 4949.506, 3421.126, -6.090430, 0.695089, 4.601595])  # km, km/s
sol = solve_ivp(f42, (0, 3600), np.concatenate([x0, np.eye(6).ravel()]),
                method="DOP853", rtol=1e-13, atol=1e-13, dense_output=True)
Phi = sol.y[6:, -1].reshape(6, 6)
print("det Phi(1 h) =", np.linalg.det(Phi))

# does the integrated Phi obey its own equation?  d(Phi)/dt vs A Phi at t = 1800 s
P1, P2 = (sol.sol(t)[6:].reshape(6, 6) for t in (1799.0, 1801.0))
y_mid = sol.sol(1800.0)
dPhi_dt = (P2 - P1)/2.0
print("max |dPhi/dt - A Phi| =", np.max(np.abs(dPhi_dt - A_of(y_mid[:3]) @ y_mid[6:].reshape(6, 6))))
# det Phi(1 h) = 1.0000000000000009
# max |dPhi/dt - A Phi| = 1.3e-06
```

The last check estimates $\dot{\boldsymbol\Phi}$ by differencing $\boldsymbol\Phi$ one second either side of $t=1800\,\mathrm s$ and compares it with $\mathbf A\boldsymbol\Phi$. They agree to $1.3\times10^{-6}$, on entries as large as $3.5$ — and that small gap is the error of the one-second difference itself. So the integrated $\boldsymbol\Phi$ really does satisfy its own defining equation, which is a stronger statement than "the code ran".

### Why not just nudge and re-fly?

There is an obvious alternative: nudge $\mathbf x_0$ by a small step $h$ in one direction, integrate the orbit twice (once $+h$, once $-h$), subtract and divide by $2h$. That is a **[[finite difference|finite-difference]]**, and it gives one column of $\boldsymbol\Phi$. It works, but its accuracy depends on $h$, and choosing $h$ is a trade between two errors.

::: example How well does a finite difference do?
Nudge only the $x$ position by $\pm h$, fly one hour, and compare the resulting column with the one from the variational equations:

```python
# h (km)     largest error in the finite-difference column
#  1e+00        4.0e-07
#  1e-01        4.2e-09
#  1e-02        8.8e-10   <- best for this case
#  1e-03        1.9e-09
#  1e-04        8.9e-08
#  1e-05        1.4e-06
#  1e-06        2.7e-05
#  1e-07        3.0e-05
```

Read it from the top. A big $h$ ($1\,\mathrm{km}$) leaves **truncation error**: the finite difference assumes the response is a straight line, and over a kilometer it bends. As $h$ shrinks, that error falls fast — about a hundred times for every factor of ten. But below about $h=10^{-2}\,\mathrm{km}$ (ten meters) the error climbs again. Now the two flown orbits are nearly identical, and subtracting them wipes out digits — the same cancellation that hurt Gibbs' method in lesson 1.

The best $h$ here is about ten meters, and it shifts with the flight time, the orbit, and which component you nudge. There is no single right $h$. Integrating the variational equations avoids the trade entirely, and costs one integration instead of twelve.
:::

## A free correctness check: the determinant of Φ

Here is a check that costs one line. The **determinant** of $\boldsymbol\Phi$ measures how a small blob of starting states changes its six-dimensional volume as it flies. It obeys a neat rule, **[[Liouville's formula|liouville]]**:

$$
\det\boldsymbol\Phi(t,t_0) = \exp\!\left(\int_{t_0}^{t}\operatorname{tr}\mathbf A(s)\,ds\right),
$$

where $\operatorname{tr}$ ("trace") is the sum of the diagonal entries. Look at the block form of $\mathbf A$: its diagonal blocks are $\partial\dot{\mathbf r}/\partial\mathbf r = \mathbf 0$ and $\partial\dot{\mathbf v}/\partial\mathbf v$. So

$$
\operatorname{tr}\mathbf A = \operatorname{tr}\left(\frac{\partial\dot{\mathbf v}}{\partial\mathbf v}\right).
$$

For two-body gravity, Earth's bulge (J2), the Moon's and Sun's pull — any force that depends only on *where* you are, not on how fast you are going — that block is zero. The trace is zero, the integral is zero, and $\det\boldsymbol\Phi=1$ at every time. The code above printed exactly that. So checking $\det\boldsymbol\Phi$ costs one `np.linalg.det` call on a matrix you already have.

::: note Why it has to be true: the determinant grows at the rate of the trace
For a matrix that changes in time, the determinant changes at the rate $\frac{d}{dt}\det\boldsymbol\Phi = \det\boldsymbol\Phi\cdot\operatorname{tr}\big(\boldsymbol\Phi^{-1}\dot{\boldsymbol\Phi}\big)$ (Jacobi's formula). Put in $\dot{\boldsymbol\Phi}=\mathbf A\boldsymbol\Phi$: the trace becomes $\operatorname{tr}(\boldsymbol\Phi^{-1}\mathbf A\boldsymbol\Phi)$, and a trace does not change when you sandwich a matrix like that, so it is $\operatorname{tr}\mathbf A$. That gives $\frac{d}{dt}\det\boldsymbol\Phi = \operatorname{tr}\mathbf A\cdot\det\boldsymbol\Phi$ — the equation of exponential growth at rate $\operatorname{tr}\mathbf A$. Starting from $\det\mathbf I=1$, its solution is the exponential of the integral.

For forces that come from a potential, this is Liouville's theorem of mechanics: the flow keeps phase-space volume. The trace argument shows a little more — any velocity-independent force keeps it, including solar radiation pressure.
:::

On the $420\,\mathrm{km}$ orbit, integrated with tight tolerances: two-body gravity for one full period gives $\det\boldsymbol\Phi=1.0000000000$. Adding J2 and flying five periods still gives $1.0000000000$. Now add atmospheric drag. Drag *does* depend on velocity, so its trace is not zero, and the determinant drifts below $1$ on purpose. That drift is not integration error. It is the correct signature of a force that removes energy — and a $\boldsymbol\Phi$ that stayed at exactly $1$ with drag switched on would be the one to distrust.

::: warning A determinant of 1 is necessary, not sufficient
Under two-body or J2 dynamics, $\det\boldsymbol\Phi=1$ is strong evidence the integration is healthy. But it is one number summarizing $36$. Plenty of wrong matrices have determinant $1$ — swap two columns and flip the sign of one, for instance. Use it as a quick check on every run, not as a replacement for the $\dot{\boldsymbol\Phi}=\mathbf A\boldsymbol\Phi$ check or a finite-difference cross-check when a new force model is first brought into service.
:::

## Extending to a real force model

Nothing about the machinery changes when the dynamics gain the perturbations from the perturbations module — J2, drag, third-body gravity, solar radiation pressure. Only $\mathbf A(t)$ grows extra terms:

- The top-right block stays $\mathbf I$. Velocity always feeds position the same way.
- For any perturbation that depends only on position (J2, a smooth third-body term), the bottom-right block stays zero. Only $\mathbf G$ picks up extra terms, and it stays symmetric, because those forces also come from potentials.
- **Drag is different.** It depends on the velocity relative to the air, which turns with Earth. So $\partial\dot{\mathbf v}/\partial\mathbf v$ is no longer zero, and the bottom-right block of $\mathbf A$ comes alive for the first time.

For drag acceleration $\mathbf a_D = -\tfrac12 B\rho\,|\mathbf v_r|\,\mathbf v_r$, with $B = C_DA/m$, air density $\rho$ and velocity relative to the air $\mathbf v_r$, the product rule gives

$$
\frac{\partial\mathbf a_D}{\partial\mathbf v} = -\tfrac12 B\rho\left(|\mathbf v_r|\,\mathbf I + \frac{\mathbf v_r\mathbf v_r^\mathsf T}{|\mathbf v_r|}\right),
\qquad
\operatorname{tr}\frac{\partial\mathbf a_D}{\partial\mathbf v} = -2B\rho\,|\mathbf v_r| .
$$

(The trace: $\operatorname{tr}\mathbf I = 3$, and $\operatorname{tr}(\mathbf v_r\mathbf v_r^\mathsf T) = |\mathbf v_r|^2$, so the bracket's trace is $4|\mathbf v_r|$.)

You can get each extra piece of $\mathbf A$ by extending the analytic derivation, or by a local finite difference of just that one force term. Either is fine; the variational equations, the $42$-number integration and the checks are unchanged. This is also exactly the $\boldsymbol\Phi$ that a **[[Cowell|cowell]]** propagator — one that numerically integrates the full equations of motion — produces alongside its trajectory. That is why Cowell integration and batch orbit determination pair so naturally.

::: example Drag shrinks the determinant, by a predictable amount
Use the same orbit with drag: $B = C_DA/m = 2.2\times0.01 = 0.022\,\mathrm{m^2/kg}$, air density $3.0\times10^{-12}\,\mathrm{kg/m^3}$ near $420\,\mathrm{km}$ (falling off with a $60\,\mathrm{km}$ scale height), and an atmosphere turning with Earth. The speed relative to the air is $|\mathbf v_r| \approx 7363\,\mathrm{m/s}$.

**Estimate first.** The trace of $\mathbf A$ is

$$
-2 \times 0.022 \times 3.0\times10^{-12} \times 7363 = -9.72\times10^{-10}\,\mathrm{s^{-1}}.
$$

Over one period of $5578\,\mathrm s$, the integral is about $-9.72\times10^{-10}\times5578 = -5.42\times10^{-6}$, so

$$
\det\boldsymbol\Phi \approx e^{-5.42\times10^{-6}} \approx 0.9999946 .
$$

**Now integrate.** Flying the $42$-number system with drag for one period gives $\det\boldsymbol\Phi=0.9999945665$. Integrating $\operatorname{tr}\mathbf A$ along the same orbit and taking the exponential gives $0.9999945665$ too, to every digit shown. The rough estimate was close as well, since density barely changes around a near-circular orbit.

So the drop below $1$ is real physics, exactly the size the trace predicts. A velocity error changes the relative wind, and so the drag, in the same instant. Two-body gravity and J2 have no such path: a velocity error there matters only after it has had time to move the position.
:::

## Check yourself

::: check
Derive the starting value $\boldsymbol\Phi(t_0,t_0)=\mathbf I$ directly from the definition $\boldsymbol\Phi(t,t_0)=\partial\mathbf x(t;\mathbf x_0)/\partial\mathbf x_0$, without saying "nothing has happened yet."
:::

::: answer
At $t=t_0$, the solution of an initial-value problem equals its starting point, for every starting point: $\mathbf x(t_0;\mathbf x_0)=\mathbf x_0$. Differentiate both sides of that identity with respect to $\mathbf x_0$: the left side is $\partial\mathbf x(t_0;\mathbf x_0)/\partial\mathbf x_0=\boldsymbol\Phi(t_0,t_0)$, and the right side is $\partial\mathbf x_0/\partial\mathbf x_0=\mathbf I$. So $\boldsymbol\Phi(t_0,t_0)=\mathbf I$.
:::

::: check
Why is $\mathbf G=\partial\dot{\mathbf v}/\partial\mathbf r$ symmetric for two-body motion, and does that stay true when J2 is added?
:::

::: answer
The two-body acceleration $-\mu\mathbf r/r^3$ is the downhill slope (negative gradient) of the potential energy per unit mass, $-\mu/r$. So $\mathbf G$ is minus the matrix of second derivatives of that potential, and mixed second derivatives of a smooth function are equal whichever order you take them in. J2's acceleration is also the slope of a potential (Earth's oblateness term), so its contribution to $\mathbf G$ is symmetric too, and the sum of two symmetric matrices is symmetric. $\mathbf G$ would stop being symmetric only if a position-dependent force were added that cannot be written as the slope of a potential.
:::

::: check
A finite-difference STM made with $h=10^{-6}\,\mathrm{km}$ is less accurate than one made with $h=10^{-2}\,\mathrm{km}$ on the same flight. Explain why smaller is not automatically better, using the two error sources from the lesson.
:::

::: answer
Truncation error comes from treating a curved response as a straight line over the step; for a central difference it shrinks like $h^2$, so it favors small $h$. Cancellation error comes from subtracting two flown states that become nearly identical as $h$ shrinks, then dividing by the tiny $2h$; it grows like (machine precision)$/h$, so it favors large $h$. At $h=10^{-6}\,\mathrm{km}$ the cancellation term already dominates — the table shows $2.7\times10^{-5}$ against $8.8\times10^{-10}$ at $h=10^{-2}\,\mathrm{km}$, where the two errors are roughly balanced.
:::

::: check
Flying a drag-perturbed orbit for one period gives $\det\boldsymbol\Phi=0.9999945665$. Is that evidence of a bug in the integrator?
:::

::: answer
No. By Liouville's formula, $\det\boldsymbol\Phi=\exp(\int\operatorname{tr}\mathbf A\,dt)$, and $\operatorname{tr}\mathbf A=\operatorname{tr}(\partial\dot{\mathbf v}/\partial\mathbf v)$. Gravity (two-body or J2) does not depend on velocity, so its trace is zero and the determinant stays $1$. Drag does depend on velocity, with trace $-2B\rho|\mathbf v_r|<0$, so the determinant must fall below $1$, and by an amount you can predict from the density and speed. It would be a worry only if the same shrinkage appeared with pure two-body or J2 dynamics, where nothing can cause it.
:::

::: check
Solar radiation pressure pushes a satellite away from the Sun with a force that depends on the satellite's position (through its distance from the Sun and whether it is in Earth's shadow) but not on its velocity. With Earth's shadow switching it on and off, it is not the slope of any potential. Would you expect $\det\boldsymbol\Phi=1$ with it switched on?
:::

::: answer
Yes. The determinant depends only on $\operatorname{tr}\mathbf A=\operatorname{tr}(\partial\dot{\mathbf v}/\partial\mathbf v)$. A force that does not depend on velocity adds nothing to that block, so the trace stays zero and $\det\boldsymbol\Phi$ stays $1$, whether or not the force comes from a potential. What such a force *can* change is the symmetry of $\mathbf G$, which is guaranteed only for forces that are slopes of a potential.
:::

## Summary

| Symbol or idea | Meaning |
| --- | --- |
| $\boldsymbol\Phi(t,t_0)=\partial\mathbf x(t)/\partial\mathbf x_0$ | Jacobian of the flow with respect to the epoch state |
| $\dot{\boldsymbol\Phi}=\mathbf A(t)\boldsymbol\Phi$, $\boldsymbol\Phi(t_0,t_0)=\mathbf I$ | The variational equations; $\mathbf A=\partial\mathbf f/\partial\mathbf x$ along the reference trajectory |
| $\mathbf A=\begin{pmatrix}\mathbf 0&\mathbf I\\ \mathbf G&\mathbf 0\end{pmatrix}$, $\mathbf G=\frac{\mu}{r^3}(3\hat{\mathbf r}\hat{\mathbf r}^\mathsf T-\mathbf I)$ | Two-body Jacobian; $\mathbf G$ symmetric with zero trace |
| 42-number integration | Stack $\mathbf x$ and $\boldsymbol\Phi$, integrate once; no finite-difference step to tune |
| $\det\boldsymbol\Phi=\exp(\int\operatorname{tr}\mathbf A\,dt)$ | Equals $1$ for any velocity-independent force; below $1$ with drag |
| Drag's extra block | $\partial\dot{\mathbf v}/\partial\mathbf v\neq\mathbf 0$, trace $-2B\rho\lvert\mathbf v_r\rvert$ |

With $\boldsymbol\Phi$ fully in hand — what it means, its equation, and how to get it for any force model — the next lesson leaves the batch method behind. It processes observations one at a time instead of all at once, using the sequential filters of the nonlinear-filters module applied to orbits.

::: context jacobian A table of sensitivities
A Jacobian is a grid of rates. Row $i$, column $j$ answers one question: if input $j$ goes up a little, how fast does output $i$ change? For $\boldsymbol\Phi$ there are six inputs (the starting position and velocity) and six outputs (the position and velocity at time $t$), so $36$ answers in a $6\times6$ table. The name honors Carl Jacobi, a nineteenth-century German mathematician. You met the same object in the least-squares module as the matrix $\mathbf H$, the sensitivity of each measurement to each unknown.
:::

::: context gravity-gradient The same stretch that makes tides
Gravity is a little stronger on the side of an object nearer Earth and a little weaker on the far side. The difference stretches things along the line to Earth and squeezes them across it — exactly the $2$ and $-1$ pattern in $\mathbf G$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <circle cx="40" cy="75" r="26" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="40" y="79" font-size="11" text-anchor="middle" fill="#1f2a44">Earth</text>
  <line x1="66" y1="75" x2="330" y2="75" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 4"/>
  <circle cx="220" cy="75" r="6" fill="#1f2a44"/>
  <line x1="226" y1="75" x2="278" y2="75" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="286,75 276,70 276,80" fill="#b4232c"/>
  <line x1="214" y1="75" x2="162" y2="75" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="154,75 164,70 164,80" fill="#b4232c"/>
  <line x1="220" y1="39" x2="220" y2="61" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="220,69 215,59 225,59" fill="#1d6fd1"/>
  <line x1="220" y1="111" x2="220" y2="89" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="220,81 215,91 225,91" fill="#1d6fd1"/>
  <text x="250" y="64" font-size="12" fill="#b4232c">stretch: +2μ/r³</text>
  <text x="228" y="124" font-size="12" fill="#1d6fd1">squeeze: −μ/r³</text>
  <text x="20" y="144" font-size="11" fill="#1f2a44">arrows: change in pull, relative to the center point</text>
</svg>
```

The stretch arrows are twice as long as the squeeze arrows, and one stretch direction minus two squeeze directions gives the zero trace. Spacecraft feel this too: it slowly swings a long boom to point at Earth, a trick called gravity-gradient stabilization.
:::

::: context kronecker-delta A tiny identity matrix in symbols
$\delta_{ij}$ is shorthand for "one if the two labels match, zero if they don't". So $\delta_{11}=1$ and $\delta_{12}=0$. Laid out as a $3\times3$ grid, the $\delta_{ij}$ are exactly the identity matrix $\mathbf I$ — which is why the $\delta_{ij}$ in the component formula becomes $\mathbf I$ in the matrix formula. It is named after Leopold Kronecker. It is the same Greek letter as the $\delta$ in $\delta\mathbf x$, but it means something different: that one is "a small change in".
:::

::: context laplace-equation Gravity spreads out, it does not pile up
Laplace's equation says the three "curvatures" of the gravity potential, along $x$, $y$ and $z$, add to zero wherever there is no mass. In words: gravity's field lines spread out through empty space without starting or stopping. So if the pull strengthens along one direction as you move, it must weaken along the others to compensate — here, $+2$ along the radius and $-1$ in each of the two sideways directions. The same equation governs electric fields in empty space and the steady flow of heat. It becomes a working check: any gravity model you code, including J2 or a full spherical-harmonic field, should give a $\mathbf G$ with zero trace outside Earth.
:::

::: context finite-difference Slope from two nearby points
A finite difference estimates a slope the way you would on a hill: stand at two nearby spots, measure the height of each, and divide the difference by the distance between them. Too far apart and the hill curves between them. Too close and your two height readings are nearly the same, so small reading errors swamp the difference. The central difference used here, $(f(x+h)-f(x-h))/(2h)$, puts the two spots symmetrically either side, which cancels the first curvature error and makes truncation shrink like $h^2$.
:::

::: context liouville A blob of starting states
Picture a small cloud of possible starting states around $\mathbf x_0$ — a blob in the six-dimensional space of positions and velocities. As time runs, every point in the blob flies its own orbit, and the blob stretches and shears into a long thin shape. For gravity alone, the blob's volume never changes: whatever it gains in length, it loses in width.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <circle cx="60" cy="65" r="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="60" y="115" font-size="11" text-anchor="middle" fill="#1f2a44">at the epoch</text>
  <line x1="100" y1="65" x2="160" y2="65" stroke="#6c7a93" stroke-width="1.5"/>
  <polygon points="168,65 158,60 158,70" fill="#6c7a93"/>
  <ellipse cx="260" cy="65" rx="90" ry="10" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5" transform="rotate(-12 260 65)"/>
  <text x="260" y="115" font-size="11" text-anchor="middle" fill="#1f2a44">later: longer, thinner, same area</text>
</svg>
```

The circle has radius $30$, area $900\pi$; the ellipse has semi-axes $90$ and $10$, area $900\pi$ as well. Drag lets the blob shrink a little, because it drains energy out of every orbit in it.
:::

::: context cowell Philip Cowell's brute force
In 1908, Philip Cowell and Andrew Crommelin predicted the return of Halley's Comet by integrating its equations of motion step by step, planets and all, instead of using clever analytic formulas. The prediction was off by only about three days. The name stuck: a **Cowell** propagator integrates the full, unsimplified acceleration directly in Cartesian coordinates. It is simple and handles any force you can write down — which is exactly what the variational equations need, since they want $\mathbf A$ for whatever forces are in the model.
:::
