---
id: l06-euler-equations-and-clohessy-wiltshire
title: "Euler's equations and the Clohessy-Wiltshire equations, derived cold"
minutes: 24
covers:
  - "Whiteboard derivations under time pressure: the rocket equation, rigid-body equations of motion under thrust, the Kalman filter update, proportional navigation, Euler equations, the Clohessy-Wiltshire equations"
---

Grab a book with a rubber band around it so it stays shut. Toss it up spinning about its long edge, and it spins neatly. Toss it spinning flat, like a pizza, and it spins neatly too. Now toss it spinning about the third direction — end over end, flipping the way a pancake flips. Almost every time, it wobbles and turns over in the air, no matter how carefully you throw it. Nothing pushed it.

Now picture two runners on a circular track, side by side. One steps into a lane slightly farther out. Around a curve, the outside runner falls behind, even running at the same speed, because the outside lane is longer. Two spacecraft near each other in orbit play a stranger version of this game: the one that is slightly higher is also slower, so it drifts backward steadily.

These are the last two of the six core whiteboard derivations. **Euler's equations** say how a spinning solid body's spin changes, and they explain the book. The **Clohessy-Wiltshire equations** (often shortened to CW) say how one spacecraft moves relative to another nearby, and they explain the drifting runner. Both derivations have the same shape. Start from an exact equation that is hard to solve. Assume the motion stays close to a simple reference motion. Keep only the biggest pieces of the difference. Then read off the answer — stable or unstable, drifting or not — from the sign or size of a single number. Between them, they cover much of what a dynamics round probes.

## Euler's equations, from the transport theorem

Start with a few words you will need.

- The **angular velocity** $\boldsymbol{\omega}$ (read "omega", in bold because it is a vector) is how fast the body spins and about which axis, in radians per second.
- The **inertia tensor** $\mathbf{I}$ is a $3\times3$ matrix that says how hard the body is to spin about each direction. Mass far from an axis makes spinning about that axis harder.
- The **angular momentum** $\mathbf{H} = \mathbf{I}\boldsymbol{\omega}$ is the "amount of spin" the body carries.
- A **moment** $\mathbf{M}$, or torque, is a twisting push.

Newton's second law for turning says the rate of change of angular momentum equals the moment:

$$
\left.\frac{d\mathbf{H}}{dt}\right|_{\text{inertial}} = \mathbf{M}.
$$

"Inertial" means "measured by an observer who is not spinning". Here is the obstacle. To that observer, a tumbling body's mass keeps moving around, so $\mathbf{I}$ keeps changing. In axes glued to the body, though, the mass never moves, so $\mathbf{I}$ is constant. We want to work in the body's axes.

The tool that lets us is the **[[transport theorem|transport-theorem]]**, derived in full in the rotating-frames module. For any vector $\mathbf{A}$ it says

$$
\left.\frac{d\mathbf{A}}{dt}\right|_{\text{inertial}} = \left.\frac{d\mathbf{A}}{dt}\right|_{\text{body}} + \boldsymbol{\omega}\times\mathbf{A}.
$$

In words: the change you see from outside is the change you see riding along, plus the change caused by the riding frame itself turning. Apply it with $\mathbf{A} = \mathbf{H} = \mathbf{I}\boldsymbol{\omega}$. In body axes $\mathbf{I}$ is constant, so the body-frame derivative of $\mathbf{I}\boldsymbol{\omega}$ is $\mathbf{I}\dot{\boldsymbol{\omega}}$. Read $\dot{\boldsymbol{\omega}}$ as "omega dot": the rate of change of the spin. That gives

$$
\mathbf{I}\dot{\boldsymbol{\omega}} + \boldsymbol{\omega}\times(\mathbf{I}\boldsymbol{\omega}) = \mathbf{M}.
$$

Every rigid body has three special directions called **[[principal axes|principal-axes]]**. Along them, $\mathbf{I}$ becomes diagonal: $\mathbf{I} = \mathrm{diag}(I_1, I_2, I_3)$, three numbers called the **principal moments of inertia**. Choose the body axes to be these. Then $\mathbf{I}\boldsymbol{\omega} = (I_1\omega_1, I_2\omega_2, I_3\omega_3)$.

Now expand the cross product one component at a time. For any vectors, the first component of $\mathbf{a}\times\mathbf{b}$ is $a_2 b_3 - a_3 b_2$. With $\mathbf{a} = \boldsymbol{\omega}$ and $\mathbf{b} = \mathbf{I}\boldsymbol{\omega}$:

$$
\left[\boldsymbol{\omega}\times(\mathbf{I}\boldsymbol{\omega})\right]_1 = \omega_2 (I_3\omega_3) - \omega_3 (I_2\omega_2) = (I_3 - I_2)\,\omega_2\omega_3.
$$

Move it to the right side and the sign flips, giving $(I_2 - I_3)\omega_2\omega_3$. Do the same for the other two components and you get **Euler's equations**:

$$
I_1\dot\omega_1 = (I_2-I_3)\omega_2\omega_3 + M_1, \qquad I_2\dot\omega_2 = (I_3-I_1)\omega_3\omega_1 + M_2, \qquad I_3\dot\omega_3 = (I_1-I_2)\omega_1\omega_2 + M_3.
$$

Remember the first; the others follow by the **cyclic** swap $1\to2\to3\to1$: replace every 1 with 2, every 2 with 3, and every 3 with 1.

Look at what the extra term on each axis contains: the difference between the *other two* inertias. A uniform sphere has $I_1=I_2=I_3$, so every coupling term is zero. Set a sphere spinning about any axis and, with no torque, it keeps spinning about that axis forever. A book is not a sphere, and that is where the trouble starts.

::: key
$\mathbf{I}\dot{\boldsymbol{\omega}} + \boldsymbol{\omega}\times(\mathbf{I}\boldsymbol{\omega}) = \mathbf{M}$. In principal axes: $I_1\dot\omega_1 = (I_2-I_3)\omega_2\omega_3 + M_1$, cyclic. The cross-coupling terms are what makes rotation about the intermediate principal axis unstable.
:::

### Torque-free stability: why the intermediate axis is unstable

Once the book leaves your hand, nothing twists it, so $\mathbf{M}=0$. Suppose it spins almost exactly about axis 1 at a steady rate $\Omega$ (read "capital omega"), with small leftover wobbles $\omega_2$ and $\omega_3$ about the other two axes. Does the wobble die away, stay small, or grow?

**Step 1: axis 1 barely changes.** Its equation is $I_1\dot\omega_1 = (I_2-I_3)\omega_2\omega_3$. The right side is a small number times a small number, which is **[[second order|second-order-small]]** — tiny compared with everything else. So to a first approximation $\dot\omega_1 = 0$ and $\omega_1$ stays at $\Omega$.

**Step 2: the other two equations become linear.** Put $\omega_1 = \Omega$ into them and divide by the inertia on the left:

$$
\dot\omega_2 = \frac{I_3-I_1}{I_2}\Omega\,\omega_3, \qquad \dot\omega_3 = \frac{I_1-I_2}{I_3}\Omega\,\omega_2.
$$

Each has one big factor ($\Omega$) times one small one, so these terms survive. Replacing a hard equation by one that is **linear** in the small quantities — no products of small things — is called **linearizing**.

**Step 3: combine them into one equation.** Take the time derivative of the first equation. Then replace $\dot\omega_3$ using the second:

$$
\ddot\omega_2 = \frac{I_3-I_1}{I_2}\Omega\,\dot\omega_3 = \underbrace{\Omega^2\,\frac{(I_3-I_1)(I_1-I_2)}{I_2 I_3}}_{K}\,\omega_2.
$$

Read $\ddot\omega_2$ as "omega two double dot". The whole question now rests on one number, $K$.

**Step 4: read off the sign.** If $K<0$, the equation says "the more you are off, the harder you are pulled back" — a spring. That is **[[simple harmonic motion|harmonic-vs-growth]]**: the wobble swings back and forth but stays small. **Stable.** If $K>0$, it says "the more you are off, the harder you are pushed further off". The wobble grows exponentially. **Unstable.**

**Step 5: find out when each happens.** $\Omega^2$ is positive and so is $I_2 I_3$. So the sign of $K$ is the sign of $(I_3-I_1)(I_1-I_2)$. Try the three cases.

- $I_1$ is the **largest**: $I_3 - I_1 < 0$ and $I_1 - I_2 > 0$. Opposite signs, product negative, $K<0$. Stable.
- $I_1$ is the **smallest**: $I_3 - I_1 > 0$ and $I_1 - I_2 < 0$. Opposite signs again, $K<0$. Stable.
- $I_1$ is the **middle** one: both factors have the same sign, the product is positive, $K>0$. Unstable.

Nothing depended on calling the spin axis "1", so for any body: spin about the axis of largest or smallest inertia is stable, and spin about the intermediate axis is not. This is the **intermediate-axis theorem**, also called the **tennis racket theorem** — try it with a racket or a phone. It is the effect behind the **[[Dzhanibekov flip|dzhanibekov]]** that astronauts film on the ISS.

::: note An honest caveat about "grows exponentially"
The linear analysis says the wobble grows without limit. The real motion cannot, because a torque-free body conserves both its kinetic energy and the size of its angular momentum, and those two fences hem the motion in. What you actually see is a periodic **flip**: the body turns end over end, comes back near the intermediate axis, and flips again, over and over. The linear result correctly finds the instability. It does not describe the bounded motion the instability leads to. Saying this unprompted at the board tells the panel you know exactly what linearizing bought you.
:::

::: warning
"Smallest and largest are both stable" is true only for a perfectly rigid body. A real spacecraft flexes and sloshes, and that turns a little spin energy into heat. With energy slowly leaking out, only spin about the **largest**-inertia axis is truly stable. This is the **[[major-axis rule|explorer-one]]**, and if you state the rigid-body result in an interview, add this sentence or expect the follow-up.
:::

::: example Intermediate-axis instability, checked numerically
Take $I_1=1$, $I_2=2$, $I_3=3\,\mathrm{kg\,m^2}$. Spin at $\Omega=5\,\mathrm{rad/s}$ about each axis in turn, with a wobble of $0.001\,\mathrm{rad/s}$ on each of the other two. Integrate the full nonlinear Euler equations — not the linearized ones — for 40 seconds:

```python
from scipy.integrate import solve_ivp
import numpy as np

def euler_rhs(t, w, I1, I2, I3):
    w1, w2, w3 = w
    return [(I2-I3)*w2*w3/I1, (I3-I1)*w3*w1/I2, (I1-I2)*w1*w2/I3]

I = np.array([1.0, 2.0, 3.0])
t = np.linspace(0, 40, 40001)
for k in range(3):                       # spin about axis 1, then 2, then 3
    w0 = [1e-3, 1e-3, 1e-3]
    w0[k] = 5.0
    sol = solve_ivp(euler_rhs, [0, 40], w0, args=tuple(I),
                    rtol=1e-10, atol=1e-12, dense_output=True)
    w = sol.sol(t)
    others = [i for i in range(3) if i != k]
    wobble = np.hypot(w[others[0]], w[others[1]])
    E = 0.5 * (I[:, None] * w**2).sum(axis=0)          # kinetic energy
    print(k + 1, round(wobble.max() / wobble[0], 1),   # biggest wobble / starting wobble
          f"{np.ptp(E) / E[0]:.0e}")                   # relative change in energy
# 1 1.4 2e-14
# 2 4082.5 3e-09
# 3 1.0 1e-14
```

**Read the output.** About the smallest axis ($I_1$), the wobble never gets bigger than $1.4$ times its starting size. About the largest ($I_3$), it stays essentially at $1.0$. About the **intermediate** axis ($I_2$), it grows by a factor of about $4100$: from $0.0014\,\mathrm{rad/s}$ to about $5.8\,\mathrm{rad/s}$, as big as the spin itself. The body has flipped. By $t \approx 2.5\,\mathrm{s}$ the wobble already passes $0.5\,\mathrm{rad/s}$.

**Check it is real, not a numerical glitch.** Energy stays constant to better than a few parts in $10^9$ in all three runs, and so does the size of the angular momentum. The solver is not leaking.

**Compare with the linear prediction.** For spin about axis 2 the same steps give $K = \Omega^2(I_2-I_3)(I_1-I_2)/(I_1I_3) = 25 \times (-1)(-1)/3 \approx 8.33\,\mathrm{s^{-2}}$. The wobble grows like $e^{\sqrt{K}\,t}$, so it multiplies by $e \approx 2.718$ every $1/\sqrt{K} \approx 0.35\,\mathrm{s}$ — the **e-folding time**. Growing from $0.0014$ to about $5$ is a factor of about $3500$, which is $\ln 3500 \approx 8.2$ e-foldings, or about $2.8\,\mathrm{s}$. That matches the flip showing up at around $2.5\,\mathrm{s}$. The linear number predicts *when* the flip happens; the nonlinear run shows *what* happens.
:::

## The Clohessy-Wiltshire equations, from a rotating frame

Now the two spacecraft. Call the one we measure from the **target** (a space station, say) and the one moving around it the **chaser**. The target flies a circular orbit of radius $r_0$. It goes around at a steady angular rate

$$
n = \sqrt{\frac{\mu}{r_0^3}},
$$

called the **[[mean motion|mean-motion]]**. Here $\mu$ ("mu") is Earth's gravitational parameter, $3.986\times10^{14}\,\mathrm{m^3/s^2}$.

Ride along with the target. Set up a **[[frame that turns with it|hill-frame]]**:

- $\hat{\mathbf{x}}$ ("x hat", a unit arrow) points **radially** outward, straight up away from Earth;
- $\hat{\mathbf{y}}$ points **along-track**, the direction the target is flying;
- $\hat{\mathbf{z}}$ points **orbit-normal**, at right angles to the orbit plane.

This frame turns once per orbit, at the constant rate $\boldsymbol{\omega} = n\hat{\mathbf{z}}$. The chaser's position relative to the target is $\boldsymbol{\rho} = x\hat{\mathbf{x}} + y\hat{\mathbf{y}} + z\hat{\mathbf{z}}$ ("rho"). It is small compared with $r_0$: tens of meters to a few kilometers, against thousands of kilometers.

### The acceleration, two ways

The plan: write the chaser's acceleration once from geometry (how motion looks in a turning frame), once from physics (what gravity does), and set them equal.

**From geometry.** Applying the transport theorem twice, for a frame turning at a constant rate, gives

$$
\mathbf{a}_{\text{inertial}} = \ddot{\boldsymbol\rho}\big|_{\text{rel}} + 2\boldsymbol\omega\times\dot{\boldsymbol\rho}\big|_{\text{rel}} + \boldsymbol\omega\times(\boldsymbol\omega\times\boldsymbol\rho) + \mathbf{a}_{\text{target}}.
$$

The first term is the acceleration you see riding along. The second is the **[[Coriolis|coriolis]]** term, and the third is the **centrifugal** term — both are there only because your frame is turning. The last is the target's own acceleration.

**From physics.** The only force is gravity, so $\mathbf{a}_{\text{inertial}} = -\mu\mathbf{R}/|\mathbf{R}|^3$. Here $\mathbf{R} = (r_0+x)\hat{\mathbf{x}} + y\hat{\mathbf{y}} + z\hat{\mathbf{z}}$ is the chaser's position from Earth's center. Because $x$, $y$ and $z$ are tiny compared with $r_0$, expand $|\mathbf{R}|^{-3}$ with a **[[binomial expansion|binomial]]** and drop everything second order or smaller. Using $n^2 = \mu/r_0^3$:

$$
-\frac{\mu\mathbf{R}}{|\mathbf{R}|^3} \approx -n^2 r_0\hat{\mathbf{x}} + n^2\big(2x\,\hat{\mathbf{x}} - y\,\hat{\mathbf{y}} - z\,\hat{\mathbf{z}}\big).
$$

Look at the first term, $-n^2 r_0\hat{\mathbf{x}}$. That is exactly the target's own acceleration, $\mathbf{a}_{\text{target}}$, pulling it toward Earth to keep it on its circle. It sits on both sides, so it cancels. That is why we ride on a reference orbit: the huge circular motion drops out, leaving only the small relative motion.

### Collecting the pieces

Evaluate the two turning-frame terms with $\boldsymbol\omega = n\hat{\mathbf{z}}$, using $\hat{\mathbf{z}}\times\hat{\mathbf{x}}=\hat{\mathbf{y}}$ and $\hat{\mathbf{z}}\times\hat{\mathbf{y}}=-\hat{\mathbf{x}}$:

$$
2\boldsymbol\omega\times\dot{\boldsymbol\rho} = 2n\left(\dot x\,\hat{\mathbf{y}} - \dot y\,\hat{\mathbf{x}}\right), \qquad \boldsymbol\omega\times(\boldsymbol\omega\times\boldsymbol\rho) = -n^2\left(x\,\hat{\mathbf{x}} + y\,\hat{\mathbf{y}}\right).
$$

Now set geometry equal to physics, one direction at a time.

- **Radial** ($\hat{\mathbf{x}}$): $\ddot x - 2n\dot y - n^2 x = 2n^2 x$. Move $2n^2x$ to the left.
- **Along-track** ($\hat{\mathbf{y}}$): $\ddot y + 2n\dot x - n^2 y = -n^2 y$. The $n^2 y$ terms cancel.
- **Cross-track** ($\hat{\mathbf{z}}$): $\ddot z = -n^2 z$.

The result is the **Clohessy-Wiltshire equations**:

$$
\ddot x - 2n\dot y - 3n^2 x = 0, \qquad \ddot y + 2n\dot x = 0, \qquad \ddot z + n^2 z = 0.
$$

The cross-track equation stands alone. It says $\ddot z = -n^2 z$ — a spring again — so an out-of-plane offset swings back and forth once per orbit and never drifts. The radial and along-track equations are tied together through the Coriolis terms. That pair is where all the surprising behavior lives.

::: key
$\ddot x - 2n\dot y - 3n^2x = 0$, $\ddot y + 2n\dot x = 0$, $\ddot z + n^2 z = 0$, from linearizing gravity to first order about a circular reference orbit in a frame rotating at $n = \sqrt{\mu/r_0^3}$. The reference orbit's own centripetal term cancels exactly, leaving only the relative dynamics.
:::

### One constant that decides everything

One short move unlocks every result here. The along-track equation, $\ddot y + 2n\dot x = 0$, is the time derivative of $\dot y + 2n x$. So that quantity never changes:

$$
\dot y + 2n x = C, \qquad C = \dot y_0 + 2n x_0.
$$

(A subscript 0 means "at the start".) Use it to replace $\dot y = C - 2nx$ in the radial equation:

$$
\ddot x - 2n(C - 2nx) - 3n^2 x = 0 \quad\Longrightarrow\quad \ddot x + n^2 x = 2nC.
$$

That is a spring with a shifted resting point. So $x$ swings once per orbit about the center $2C/n$. Put that back into $\dot y = C - 2nx$. The swinging part of $x$ makes $y$ swing too, and the steady part leaves

$$
\text{average along-track drift rate} = C - 2n\cdot\frac{2C}{n} = -3C.
$$

Everything now comes from the one number $C$. Three cases carry all the intuition.

**Case 1: a pure forward burn.** Start on top of the target, $x_0 = y_0 = 0$, $\dot x_0 = 0$, and fire the engine forward, giving a small **prograde** (along the direction of motion) velocity $\dot y_0 > 0$. Then $C = \dot y_0$. Solving the spring equation with these starting values gives

$$
x(t) = \frac{2\dot y_0}{n}(1-\cos nt), \qquad \dot y(t) = (4\cos nt - 3)\,\dot y_0.
$$

Since $1 - \cos nt$ is never negative, $x$ never goes below zero: the burn **raises** the orbit. And $\dot y$ averages $-3\dot y_0$ over an orbit, because $\cos nt$ averages to zero. So the chaser **falls behind**. A forward burn raises you and makes you fall behind — the most counterintuitive fact in **[[proximity operations|gemini-four]]**. It is why closing on a target is not a matter of pointing at it and burning forward.

**Case 2: a steady radial offset.** Start $x_0$ above the target with $\dot x_0 = 0$ and $\dot y_0 = -\tfrac{3}{2}n x_0$. Then $C = -\tfrac{3}{2}nx_0 + 2nx_0 = \tfrac{1}{2}nx_0$. The center of the swing is $2C/n = x_0$, exactly where $x$ started, and $\dot x_0 = 0$, so there is no swing at all: $x(t) = x_0$ forever. The drift rate is $-3C = -\tfrac{3}{2}nx_0$, so $y(t) = -\tfrac{3}{2}n x_0\,t$, a straight line. This is a chaser on its own circular orbit of radius $r_0 + x_0$, moving at the speed such an orbit needs. Two circular orbits of slightly different radius do not wobble relative to each other. The higher one is slower and slides steadily backward at $\tfrac{3}{2}n$ per meter of height difference. That is the number to know cold.

**Case 3: the closed ellipse.** Choose the starting speed so that $C = 0$, that is, $\dot y_0 = -2n x_0$. Now the drift rate $-3C$ is zero. $x$ swings about zero with some size $A$, and since $\dot y = -2nx$, $y$ swings with size $2A$. The chaser traces a **[[closed 2-by-1 ellipse|relative-ellipse]]** around a fixed point, twice as long along-track as it is tall radially, once per orbit. It is on an orbit with the same period as the target's, only slightly stretched from a circle into an ellipse.

::: key Clohessy-Wiltshire behavior, in words
Linearized relative motion about a circular orbit. A radial offset produces along-track drift at $\tfrac{3}{2}n$ per unit offset; a properly phased radial and along-track pair ($\dot y_0 = -2nx_0$) produces a closed 2-by-1 ellipse. The counterintuitive result: thrusting forward raises you and makes you fall behind.
:::

::: example Drift-only starting condition, checked numerically
Take $n = 1.1\times10^{-3}\,\mathrm{rad/s}$, about right for a $500\,\mathrm{km}$ orbit (the exact value there is $1.107\times10^{-3}$). Start $x_0 = 40\,\mathrm{m}$ above the target.

**Step 1: the matching along-track speed.** $\dot y_0 = -\tfrac{3}{2}n x_0 = -1.5 \times 0.0011 \times 40 = -0.066\,\mathrm{m/s}$.

**Step 2: integrate.** Running the CW equations numerically for $20{,}000\,\mathrm{s}$ — about $3.5$ orbits, since one orbit is $2\pi/n \approx 5712\,\mathrm{s}$ — gives $x(t) = 40.000\,\mathrm{m}$ the whole time. A straight-line fit to $y(t)$ has slope $-0.066000\,\mathrm{m/s}$, with no wobble at all.

**Step 3: sanity check.** Over those $20{,}000\,\mathrm{s}$ the chaser slides $0.066 \times 20{,}000 = 1320\,\mathrm{m}$ behind. Slow, but it never stops. Any *other* along-track speed with the same $x_0$ gives the same kind of drift plus a swing on top. This one choice removes the swing.
:::

::: example A 0.1 m/s forward burn
The chaser sits right at the target and fires forward, $\dot y_0 = 0.1\,\mathrm{m/s}$, with $n = 1.1\times10^{-3}\,\mathrm{rad/s}$.

**How high does it go?** $x(t) = (2\dot y_0/n)(1 - \cos nt)$ is largest when $\cos nt = -1$, half an orbit later: $x_{\max} = 4\dot y_0/n = 4 \times 0.1/0.0011 \approx 364\,\mathrm{m}$ above the target.

**Where is it after one orbit?** Integrating $\dot y$ gives $y(t) = (\dot y_0/n)(4\sin nt - 3nt)$. After one orbit, $nt = 2\pi$ and $\sin 2\pi = 0$, so $y = -3 \times 2\pi \times 0.1/0.0011 \approx -1714\,\mathrm{m}$.

**Sanity check.** A burn "toward the front" left the chaser $1.7\,\mathrm{km}$ *behind* where it started, and back at $x = 0$ — exactly the result from Case 1. The average speed was $-3 \times 0.1 = -0.3\,\mathrm{m/s}$, and $0.3 \times 5712 \approx 1714\,\mathrm{m}$. The two routes agree.
:::

::: warning
Do not blend the "$\tfrac{3}{2}n$ drift" fact and the "forward burn raises and lags" fact into one starting condition. The first comes from a *position* offset paired with the matching circular-orbit speed. The second comes from a pure *velocity* kick at zero offset. They are two different, equally real consequences of the same equations. Keeping the starting conditions straight under pressure is the actual test — and the constant $C = \dot y_0 + 2nx_0$ is the fastest way to keep them straight.
:::

## Check yourself

::: check
In Euler's equations, why does the equation for $\dot\omega_1$ drop out to first order when the body spins nearly about axis 1, while the equations for $\dot\omega_2$ and $\dot\omega_3$ do not?
:::

::: answer
The first equation is $I_1\dot\omega_1 = (I_2-I_3)\omega_2\omega_3$. Both $\omega_2$ and $\omega_3$ are small wobbles by assumption, so their product is second order — small times small — and vanishes to first order. So $\omega_1$ stays at $\Omega$ to leading order.

The other two are $I_2\dot\omega_2 = (I_3-I_1)\omega_3\Omega$ and $I_3\dot\omega_3 = (I_1-I_2)\Omega\omega_2$. Each is the *large* spin rate $\Omega$ times one small wobble, which is first order. Those terms survive linearization, and they are the ones that decide stability.
:::

::: check
A body has $I_1 = 2$, $I_2 = 5$, $I_3 = 9\,\mathrm{kg\,m^2}$ and spins at $\Omega = 3\,\mathrm{rad/s}$ nominally about axis 2. Compute the linearized growth coefficient $K$ and say whether the spin is stable.
:::

::: answer
Since $I_1 < I_2 < I_3$, axis 2 is the intermediate axis, so expect instability.

With the big spin on axis 2, the wobble equations are $\dot\omega_1 = [(I_2-I_3)/I_1]\,\Omega\,\omega_3$ and $\dot\omega_3 = [(I_1-I_2)/I_3]\,\Omega\,\omega_1$ — the same move as in the lesson, with the axes relabeled. Differentiate the first and substitute the second: $K = \Omega^2(I_2-I_3)(I_1-I_2)/(I_1I_3)$.

Put in the numbers: $K = 9\times(5-9)\times(2-5)/(2\times9) = 9\times(-4)\times(-3)/18 = 108/18 = 6\,\mathrm{s^{-2}}$. Positive, so unstable, as the largest-smallest-intermediate rule predicted. The rule is the fast whiteboard check. The coefficient confirms it and gives the e-folding time, $1/\sqrt{6} \approx 0.41\,\mathrm{s}$.
:::

::: check
Why does the reference orbit's own centripetal acceleration, $-n^2 r_0\hat{\mathbf{x}}$, cancel exactly out of the Clohessy-Wiltshire derivation, and why does that matter?
:::

::: answer
It shows up on both sides. On the geometry side it is $\mathbf{a}_{\text{target}}$, the target's own acceleration, which appears when you write the chaser's acceleration relative to the target. On the gravity side it is the leading, zeroth-order term of the expansion of $-\mu\mathbf{R}/|\mathbf{R}|^3$ about $r_0$.

It matters because it is by far the biggest term in the problem — the full circular-orbit acceleration, of size $n^2 r_0$. Its exact cancellation is what leaves a clean linear system in the small relative coordinates $x, y, z$ alone, instead of one still dominated by the large reference motion.
:::

::: check
An interviewer asks: "If I do a forward burn to catch up with a target ahead of me on the same orbit, what happens?" Answer using the CW equations, and explain why the intuitive answer is wrong.
:::

::: answer
A forward (prograde, $+\dot y_0$) burn raises the orbit: $x(t) = (2/n)(1-\cos nt)\dot y_0 \geq 0$ always. A higher orbit is slower, so the along-track velocity picks up a steady negative part, averaging $-3\dot y_0$ over an orbit. The chaser falls further behind instead of catching up.

The intuitive answer — "burn toward the target to close the gap" — treats the problem as straight-line driving. In orbit, adding along-track speed adds energy, energy raises the orbit, and a higher orbit is slower. The short-term feeling ("I sped up, so I'm gaining") is overtaken within a fraction of an orbit by the orbital fact ("I'm on a slower orbit now and falling behind").
:::

::: check
Both derivations in this lesson linearize a nonlinear equation about a reference state and read stability, or drift, from a resulting coefficient. What is the general move, and why is it worth seeing as one pattern rather than memorizing each result on its own?
:::

::: answer
The move is: write the exact nonlinear equation; put in a reference solution plus a small disturbance; keep only first-order terms in the disturbance; then read the qualitative behavior from the resulting linear system's coefficients. In Euler's equations that is the sign of $K$. In Clohessy-Wiltshire it is the particular speed that makes the drift or the swing vanish.

Seen as one technique, either result can be rebuilt under pressure from the equation and the procedure, instead of hoping you recall the answer. It is also the same technique used throughout the controls curriculum whenever a nonlinear plant is linearized about an operating point for stability analysis.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Euler's equations | $\mathbf{I}\dot{\boldsymbol\omega} + \boldsymbol\omega\times(\mathbf{I}\boldsymbol\omega) = \mathbf{M}$, from the transport theorem applied to $\mathbf{H}=\mathbf{I}\boldsymbol\omega$; in principal axes $I_1\dot\omega_1 = (I_2-I_3)\omega_2\omega_3 + M_1$, cyclic |
| Intermediate-axis instability | Spin about the largest or smallest principal axis is stable (rigid body); about the intermediate axis, unstable — bounded in reality by conservation, giving a periodic flip rather than runaway growth |
| Major-axis rule | With energy loss from flexing or slosh, only the largest-inertia axis is truly stable |
| Clohessy-Wiltshire equations | $\ddot x - 2n\dot y - 3n^2x=0$, $\ddot y+2n\dot x=0$, $\ddot z+n^2z=0$, from linearizing gravity to first order about a circular reference orbit |
| The deciding constant | $C = \dot y_0 + 2nx_0$ stays fixed; average along-track drift is $-3C$ |
| Forward-burn drift | A prograde velocity kick raises the orbit and gives an average $-3\dot y_0$ along-track drift — it raises you, and you fall behind |
| Radial-offset drift | $\dot y_0 = -\tfrac{3}{2}n x_0$ gives pure linear drift at $\tfrac{3}{2}n$ per unit offset, with no swing — two circular orbits of slightly different radius |
| Closed ellipse | $\dot y_0 = -2nx_0$ gives zero drift: a 2-by-1 ellipse, twice as long along-track as radially |

The next lesson steps back from specific derivations to the skill that makes any of them survivable under real interview pressure: narrating a derivation out loud as you build it, and recovering visibly when part of it goes wrong.

::: context transport-theorem Riding the merry-go-round
Stand on a spinning merry-go-round holding a stick that points straight out from the center. To you, the stick is not moving. To a friend on the ground, its tip sweeps around a circle. Both are right. The transport theorem is the exact bookkeeping between the two views: what the friend sees ($d\mathbf{A}/dt$ inertial) equals what you see ($d\mathbf{A}/dt$ body) plus the sweep caused by the platform turning ($\boldsymbol{\omega}\times\mathbf{A}$). This lesson uses it once for Euler's equations and twice in a row for the Clohessy-Wiltshire acceleration.
:::

::: context principal-axes The three special axes of a book
Every rigid body has three perpendicular axes about which a pure spin needs no twisting to keep going. For a book, they run along its length, across its width, and straight through its cover. Mass sits closest to the long axis, so that inertia is smallest. It sits farthest from the axis through the cover, so that inertia is largest. The across-the-width axis is in the middle — and that is the flip axis.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <polygon points="90,60 102,50 282,50 270,60" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="270,60 282,50 282,150 270,160" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="90" y="60" width="180" height="100" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="110" x2="318" y2="110" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="326,110 316,105 316,115" fill="#1d6fd1"/>
  <text x="12" y="100" font-size="11" fill="#1d6fd1">1: smallest I</text>
  <line x1="180" y1="196" x2="180" y2="30" stroke="#b4232c" stroke-width="2"/>
  <polygon points="180,22 175,32 185,32" fill="#b4232c"/>
  <text x="188" y="30" font-size="11" fill="#b4232c">2: middle I (flips)</text>
  <circle cx="180" cy="110" r="7" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="180" cy="110" r="2.5" fill="#1f2a44"/>
  <text x="192" y="136" font-size="11" fill="#1f2a44">3: largest I (out of cover)</text>
  <text x="12" y="200" font-size="11" fill="#6c7a93">length &gt; width &gt; thickness</text>
</svg>
```
:::

::: context second-order-small Why small times small disappears
If each wobble is $0.001\,\mathrm{rad/s}$, their product is $0.000001$ — a thousand times smaller again. Meanwhile a term like $\Omega\,\omega_3$ with $\Omega = 5$ is $0.005$. Keeping only terms with one small factor is called working "to first order". It is accurate while the wobbles stay small, and it stops being accurate once they grow, which is exactly why the linear analysis can find the instability but not describe the flip.
:::

::: context harmonic-vs-growth Two very different equations
$\ddot\omega_2 = K\omega_2$ looks like one equation, but its sign changes everything. With $K<0$ the answer is a cosine that swings forever at the same size. With $K>0$ it is an exponential, $e^{\sqrt{K}t}$, that keeps multiplying.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="70" x2="170" y2="70" stroke="#6c7a93" stroke-width="1"/>
  <path d="M25.0,42.0 L28.5,43.4 L32.0,47.3 L35.5,53.5 L39.0,61.3 L42.5,70.0 L46.0,78.7 L49.5,86.5 L53.0,92.7 L56.5,96.6 L60.0,98.0 L63.5,96.6 L67.0,92.7 L70.5,86.5 L74.0,78.7 L77.5,70.0 L81.0,61.3 L84.5,53.5 L88.0,47.3 L91.5,43.4 L95.0,42.0 L98.5,43.4 L102.0,47.3 L105.5,53.5 L109.0,61.3 L112.5,70.0 L116.0,78.7 L119.5,86.5 L123.0,92.7 L126.5,96.6 L130.0,98.0 L133.5,96.6 L137.0,92.7 L140.5,86.5 L144.0,78.7 L147.5,70.0 L151.0,61.3 L154.5,53.5 L158.0,47.3 L161.5,43.4 L165.0,42.0" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <text x="95" y="124" font-size="12" text-anchor="middle" fill="#1f2a44">K &lt; 0: swings, stays small</text>
  <line x1="190" y1="110" x2="340" y2="110" stroke="#6c7a93" stroke-width="1"/>
  <path d="M195.0,107.0 L202.0,106.4 L209.0,105.8 L216.0,105.0 L223.0,104.1 L230.0,103.0 L237.0,101.7 L244.0,100.1 L251.0,98.3 L258.0,96.1 L265.0,93.6 L272.0,90.5 L279.0,86.9 L286.0,82.6 L293.0,77.6 L300.0,71.5 L307.0,64.4 L314.0,56.0 L321.0,45.9 L328.0,34.1 L335.0,20.0" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="265" y="130" font-size="12" text-anchor="middle" fill="#1f2a44">K &gt; 0: grows and grows</text>
  <text x="180" y="146" font-size="11" text-anchor="middle" fill="#6c7a93">time runs left to right in each panel</text>
</svg>
```
:::

::: context dzhanibekov A wing nut in orbit
In 1985, on the Soyuz T-13 mission to the Salyut 7 station, cosmonaut Vladimir Dzhanibekov spun a wing nut off a bolt and watched it fly across the cabin, flipping over again and again as it drifted. With no gravity and no table to land on, the flip repeats cleanly for as long as you watch. The same thing happens to a phone or a tennis racket tossed about its middle axis on Earth; it is only harder to see before it lands. It is the torque-free intermediate-axis instability, and nothing more mysterious.
:::

::: context explorer-one The satellite that taught the major-axis rule
Explorer 1, the first US satellite (1958), was a long, thin cylinder spun about its long axis — the axis of *smallest* inertia, stable for a rigid body. It carried flexible whip antennas. As they flexed, they turned a little spin energy into heat. With angular momentum fixed and energy draining, the lowest-energy way to carry that momentum is spin about the *largest*-inertia axis, and the satellite drifted toward a flat, end-over-end spin. Ever since, spin-stabilized spacecraft designers either spin about the major axis or add active control.
:::

::: context mean-motion How fast is n
The **mean motion** $n$ is the orbit's average angular rate, in radians per second. One orbit is $2\pi$ radians, so the period is $2\pi/n$. For the International Space Station at about $420\,\mathrm{km}$ altitude, $n \approx 1.13\times10^{-3}\,\mathrm{rad/s}$, giving a period of about $93$ minutes. Because the CW equations are written in $n$ and nothing else, one set of results works for any circular orbit: only the clock speed changes.
:::

::: context hill-frame The frame that rides on the target
This frame goes by several names: the **Hill frame**, after George William Hill, who used rotating coordinates to study the Moon's motion in 1878; **LVLH**, "local vertical, local horizontal"; or RSW. W. H. Clohessy and R. S. Wiltshire wrote the linear equations down for satellite rendezvous in 1960, and the equations carry both names in textbooks.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <circle cx="180" cy="330" r="200" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="180" font-size="12" text-anchor="middle" fill="#1f2a44">Earth</text>
  <circle cx="180" cy="330" r="280" fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="6,4"/>
  <text x="40" y="92" font-size="11" fill="#6c7a93">circular orbit</text>
  <line x1="180" y1="50" x2="180" y2="18" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="180,10 175,20 185,20" fill="#1d6fd1"/>
  <text x="188" y="20" font-size="11" fill="#1d6fd1">x: radial, up</text>
  <line x1="180" y1="50" x2="244" y2="50" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="252,50 242,45 242,55" fill="#b4232c"/>
  <text x="258" y="54" font-size="11" fill="#b4232c">y: along-track</text>
  <circle cx="180" cy="50" r="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="176" y1="46" x2="184" y2="54" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="184" y1="46" x2="176" y2="54" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="120" y="70" font-size="11" fill="#1f2a44">target; z into page</text>
  <circle cx="222" cy="34" r="4" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <text x="228" y="30" font-size="11" fill="#1f2a44">chaser</text>
</svg>
```
:::

::: context coriolis The sideways push of a turning frame
Roll a ball straight across a spinning merry-go-round. Seen from the ground it goes in a straight line; seen from the platform it curves sideways. That apparent sideways push, $-2\boldsymbol\omega\times\dot{\boldsymbol\rho}$, is the Coriolis effect. In the CW equations it is the $2n\dot y$ and $2n\dot x$ coupling: moving along-track pushes you radially, and moving radially pushes you along-track. It is the reason a forward burn turns into a climb.
:::

::: context binomial The one approximation that does the work
For a small number $\varepsilon$, $(1+\varepsilon)^k \approx 1 + k\varepsilon$. Here $|\mathbf{R}|^2 = r_0^2(1 + 2x/r_0 + \text{tiny})$, so $|\mathbf{R}|^{-3} = r_0^{-3}(1 + 2x/r_0)^{-3/2} \approx r_0^{-3}(1 - 3x/r_0)$. Multiply by $-\mu\mathbf{R}$ and the radial part becomes $-n^2(r_0 + x)(1 - 3x/r_0) \approx -n^2 r_0 + 2n^2 x$. That $+2n^2x$ is where the "gravity gets weaker as you climb" effect enters.
:::

::: context gemini-four The rendezvous that went the wrong way
In June 1965, Gemini 4 tried to fly formation with the spent upper stage of its own launcher. The crew pointed at it and thrusted toward it — and it kept getting farther away. They spent a large share of their maneuvering propellant and gave up. Nobody had yet trained pilots in orbital relative motion. Buzz Aldrin had written his 1963 MIT doctoral thesis on crewed orbital rendezvous, and he was among those who helped turn these lessons into the rendezvous techniques used on later Gemini flights and Apollo.
:::

::: context relative-ellipse The 2-by-1 ellipse
Seen from the target, a chaser with $\dot y_0 = -2nx_0$ loops around a fixed point once per orbit (drawn here centered on the target). When it is above the target (higher, so slower) it moves backward; when it is below (lower, faster) it moves forward. The loop is twice as wide along-track as it is tall radially.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="90" x2="330" y2="90" stroke="#6c7a93" stroke-width="1"/>
  <line x1="180" y1="15" x2="180" y2="165" stroke="#6c7a93" stroke-width="1"/>
  <text x="332" y="104" font-size="11" text-anchor="end" fill="#6c7a93">y along-track</text>
  <text x="186" y="22" font-size="11" fill="#6c7a93">x radial</text>
  <ellipse cx="180" cy="90" rx="120" ry="60" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="168,30 180,24 180,36" fill="#1d6fd1"/>
  <polygon points="192,150 180,144 180,156" fill="#1d6fd1"/>
  <circle cx="180" cy="90" r="4" fill="#1f2a44"/>
  <text x="186" y="84" font-size="11" fill="#1f2a44">target</text>
  <text x="120" y="118" font-size="11" text-anchor="middle" fill="#b4232c">2A</text>
  <line x1="60" y1="108" x2="180" y2="108" stroke="#b4232c" stroke-width="1.2"/>
  <text x="206" y="62" font-size="11" fill="#b4232c">A</text>
  <line x1="200" y1="90" x2="200" y2="30" stroke="#b4232c" stroke-width="1.2"/>
</svg>
```

Rendezvous planners use this loop to park a chaser safely near a station: it circles without drifting away.
:::
