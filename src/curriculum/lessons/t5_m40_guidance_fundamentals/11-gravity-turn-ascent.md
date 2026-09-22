---
id: l11-gravity-turn-ascent
title: The gravity turn
minutes: 24
covers:
  - Gravity turn ascent and zero-lift trajectories; the pitch program and open-loop pitch kick
---

Every guidance law this module has derived so far reacts to something — a line-of-sight rate, a predicted miss, a time-to-go. A launch vehicle climbing through dense atmosphere cannot afford a law that reacts: an autopilot that corrects a sensed deviation by pitching the vehicle sideways into the airflow, right when dynamic pressure is highest, can overload the airframe before the correction ever helps. The gravity turn is the answer aerospace settled on long ago — a trajectory shape that needs no active steering at all through the worst of the atmosphere, and still ends up pointed the right way, because gravity itself does the turning.

## Zero angle of attack, and why it is the whole point

Angle of attack $\alpha$ is the angle between the vehicle's body axis (where thrust points) and its velocity vector. Flying at $\alpha=0$ — thrust exactly along the direction of travel — means the airflow meets the vehicle head-on, producing no aerodynamic *lift*, only drag along the direction of travel. No lift means no aerodynamic side force trying to bend the airframe, and the structural load that side force would produce, quantified by dynamic pressure times angle of attack,

$$
q\alpha = \tfrac12\rho v^2\,\alpha,
$$

stays at zero throughout a pure gravity turn, everywhere except the single brief instant a deliberate pitch kick introduces a nonzero $\alpha$ on purpose. This is the entire reason the trajectory shape is chosen the way it is: **a light, thin-walled vehicle can survive an ascent through maximum dynamic pressure specifically because it is not asked to carry aerodynamic bending loads while doing it.**

## The equations of motion, and the equilibrium that makes a kick necessary

With thrust along velocity and no lift, only three forces act on the vehicle's motion: thrust along velocity, drag opposing velocity, and gravity, which alone has a component *perpendicular* to velocity when the flight path is not exactly vertical or horizontal. Resolving Newton's second law along and perpendicular to the velocity vector, with flight path angle $\gamma$ measured from horizontal,

$$
\dot v = \frac{T}{m} - \frac{D}{m} - g\sin\gamma, \qquad \dot\gamma = -\frac{g\cos\gamma}{v},
$$

with $\dot h = v\sin\gamma$ for altitude. The second equation is the entire gravity-turn mechanism in one line: because there is no lift to counter it, gravity's perpendicular component $g\cos\gamma$ is what rotates the velocity vector, at no propellant cost at all — nothing in $\dot\gamma$ involves thrust.

That equation also explains why the turn needs a deliberate kick to begin. At $\gamma=90^\circ$ exactly — straight up — $\cos\gamma=0$, so $\dot\gamma=0$: vertical flight is an **equilibrium** of this equation, not a transient state that decays on its own. A vehicle launched perfectly vertical and left to fly $\alpha=0$ indefinitely would, in this idealized model, fly straight up forever; nothing in the physics of a zero-lift trajectory tips it over by itself. The **pitch kick** — a brief, deliberate deviation from zero angle of attack, applied once, early, while dynamic pressure is still low — is what displaces $\gamma$ off that equilibrium; once $\gamma<90^\circ$, $\cos\gamma>0$ and $\dot\gamma<0$ takes over on its own, self-sustaining for the rest of the flight with no further command.

::: key The pitch program
Rise vertically for a short period (clearing the pad, keeping the early dynamic-pressure buildup predictable), apply a brief pitch kick of a few degrees (the only moment of the flight with nonzero angle of attack), then hold zero angle of attack and let $\dot\gamma=-g\cos\gamma/v$ turn the vehicle the rest of the way — open-loop, in the strongest sense: no further steering command is issued at all.
:::

::: example How closely the simple vertical-loss formula holds
A $12\,\mathrm{s}$ vertical rise before the kick loses, integrating the true altitude-dependent $g(h)=\mu/(R_E+h)^2$ along the way,

$$
\int_0^{12} g(h(t))\,dt = 117.839\,\mathrm{m/s},
$$

against the constant-$g_0$ approximation $g_0\times12 = 117.680\,\mathrm{m/s}$ — a $0.14\%$ difference, because $g$ barely changes over the few hundred metres a $12\,\mathrm{s}$ vertical rise covers. A longer, illustrative vertical-only rise makes the same point more starkly: $30\,\mathrm{s}$ of pure vertical flight loses $g_0\times30 = 294.1995\,\mathrm{m/s}$ — already $3.78\%$ of the $7788.5\,\mathrm{m/s}$ circular speed at $200\,\mathrm{km}$ altitude, spent holding the vehicle up against gravity before a single metre of useful horizontal speed has been built. This is the concrete cost that makes an early pitch kick, not a long vertical climb, the efficient choice.
:::

## Flying it: a complete ascent and its loss budget

::: example A gravity-turn ascent to burnout, with a full delta-v accounting
A generic first stage: $m_0=5\times10^5\,\mathrm{kg}$, thrust $T=7\times10^6\,\mathrm{N}$ (liftoff $T/W=1.428$), $I_{sp}=300\,\mathrm{s}$, burning to a dry mass of $8\times10^4\,\mathrm{kg}$. Rise vertically for $12\,\mathrm{s}$, kick $2^\circ$ off vertical, then fly the zero-lift equations above (with a simple exponential atmosphere for drag) to burnout:

```python
# vertical phase (0-12s), then gravity-turn phase to burnout at t=176.5s
print(vf, np.degrees(gf), hf)
# 4269.63   3.03 deg   52423.5 m
```

Burnout at $v=4269.6\,\mathrm{m/s}$, flight path angle $\gamma=3.03^\circ$ — nearly horizontal, as a gravity turn is supposed to deliver by the time the stage separates — at $h=52.4\,\mathrm{km}$, having reached $54\%$ of the local circular speed with no active steering command anywhere after the kick.

The loss budget closes exactly:

$$
\underbrace{5391.5}_{\text{ideal }\Delta v,\ I_{sp}g_0\ln(m_0/m_f)} - \underbrace{4269.6}_{\text{actual }v_f} = 1121.8\,\mathrm{m/s} = \underbrace{927.9}_{\text{gravity loss}} + \underbrace{193.9}_{\text{drag loss}}
$$

to the last displayed digit — the ideal, propellant-only delta-v Tsiolkovsky's equation promises is not what the vehicle actually gets; gravity and drag account for every metre per second of the shortfall, with nothing left over and nothing missing. Of the $927.9\,\mathrm{m/s}$ gravity loss, only $117.8\,\mathrm{m/s}$ came from the brief vertical phase — the great majority is paid gradually through the long turn phase, while $\gamma$ is still large enough for $g\sin\gamma$ to matter.
:::

Maximum dynamic pressure during this ascent — $40.0\,\mathrm{kPa}$ — occurs neither at liftoff (density is highest there, but speed is still low) nor at burnout (speed is high, but density has fallen to nearly nothing): it happens partway through, at $h\approx16.5\,\mathrm{km}$, $v\approx676\,\mathrm{m/s}$, where the still-substantial density and the now-substantial speed both contribute. This is exactly max-Q, and it is exactly why the vehicle is flying at $\alpha=0$ at that instant rather than at any other: the one moment density and speed conspire to make $q$ largest is precisely the moment $\alpha$ carrying any value at all would be most costly.

::: warning A gravity turn is efficient because it gives something up
Nothing about $\dot\gamma=-g\cos\gamma/v$ can be steered once the kick is applied — the trajectory shape for the rest of powered ascent through the atmosphere is determined entirely by the vehicle's thrust, drag and the kick's own magnitude and timing. That is precisely the open-loop guidance this module's second lesson described: cheap, structurally safe, and blind to any dispersion — a stronger-than-expected headwind or an off-nominal kick angle is not corrected during the atmospheric phase at all. Whatever it costs is paid later, in the day-of-launch wind updates and closed-loop exoatmospheric guidance the ascent guidance module takes up once dynamic pressure has fallen enough that closing a loop is safe again.
:::

::: note Zero angle of attack is a choice, not a law of nature
Nothing forces $\alpha=0$ during ascent — a vehicle could fly with lift and shape its trajectory more freely, and some do, in exchange for accepting real aerodynamic side loads and the propellant cost of generating lift in the first place. The gravity turn is the specific, deliberate trade of trajectory freedom for structural and propellant economy, not the only trajectory physics permits.
:::

## Check yourself

::: check
Why is $\gamma=90^\circ$ an equilibrium of the zero-lift flight-path-angle equation, and what does that fact say about why a pitch kick is necessary?
:::

::: answer
$\dot\gamma=-g\cos\gamma/v$, and $\cos90^\circ=0$, so $\dot\gamma=0$ exactly at $\gamma=90^\circ$: a purely vertical trajectory has zero rate of change in flight path angle under this equation, meaning it would, in this idealized zero-lift model, continue flying straight up indefinitely rather than gradually tipping over on its own. Since nothing in the physics of a zero-angle-of-attack ascent displaces $\gamma$ away from vertical by itself, a deliberate, active pitch kick — the one moment of nonzero angle of attack in the whole flight — is what has to start the turn; after that, $\cos\gamma>0$ takes over and the turn is self-sustaining.
:::

::: check
Compute the gravity loss, using the constant-$g_0$ approximation, for a $\gamma=60^\circ$ flight path angle held for $8\,\mathrm{s}$.
:::

::: answer
$\int g_0\sin\gamma\,dt = g_0\sin60^\circ\times8 = 9.80665\times0.8660\times8 = 67.94\,\mathrm{m/s}$. Held at a shallower angle than vertical, the same duration loses less than the $78.5\,\mathrm{m/s}$ a fully vertical $8\,\mathrm{s}$ would ($g_0\times8$), exactly the $\sin\gamma$ factor's doing.
:::

::: check
Why does zero angle of attack drive $q\alpha$ to zero, when dynamic pressure $q=\tfrac12\rho v^2$ itself is not zero — indeed largest right in the middle of the flight?
:::

::: answer
$q\alpha$ is a product, and the structural load it represents comes specifically from an aerodynamic force acting at a nonzero angle to the vehicle, which needs *both* factors: dynamic pressure to give the airflow force any magnitude at all, and a nonzero angle of attack to give that force a component the airframe was not designed to carry along its own axis. Dynamic pressure being large is not itself a problem for a vehicle flying straight into its own airflow — plenty of axial drag, no side load — which is exactly the point of holding $\alpha=0$ precisely through the region where $q$ is largest, rather than needing $q$ itself to be small.
:::

::: check
A different ascent achieves an ideal delta-v of $6000\,\mathrm{m/s}$ and an actual burnout speed of $5100\,\mathrm{m/s}$, with a measured gravity loss of $700\,\mathrm{m/s}$. What must the drag loss have been?
:::

::: answer
The loss budget must close exactly: ideal $-$ actual $=$ gravity loss $+$ drag loss, so $6000-5100=900=700+\text{drag loss}$, giving a drag loss of $200\,\mathrm{m/s}$. Any accounting that does not close this way means a loss term was mismeasured or something outside gravity and drag (a steering loss, if $\alpha\ne0$ anywhere, or a nozzle back-pressure loss) is present and unaccounted for.
:::

::: check
Explain why maximum dynamic pressure occurs neither at liftoff nor at burnout, in terms of the two quantities that multiply to make it.
:::

::: answer
$q=\tfrac12\rho v^2$ is a product of atmospheric density, which is largest at liftoff and falls monotonically with altitude, and speed squared, which is smallest at liftoff and grows (net of gravity and drag losses) throughout the burn. Neither factor alone determines $q$: at liftoff $\rho$ is at its maximum but $v\approx0$ makes the product small; near burnout $v$ is large but $\rho$ has fallen to nearly nothing at altitude, again making the product small. The maximum occurs where the still-significant density and the by-then-significant speed both contribute meaningfully, which is necessarily somewhere in between, not at either endpoint.
:::

## Summary

| Quantity | Statement |
| --- | --- |
| Zero angle of attack | Thrust along velocity; no lift, so $q\alpha\approx0$ throughout except at the kick |
| Structural load indicator | $q\alpha = \tfrac12\rho v^2\alpha$ |
| Flight-path-angle equation | $\dot\gamma = -g\cos\gamma/v$; gravity alone rotates the velocity vector |
| Why a kick is needed | $\gamma=90^\circ$ is an equilibrium ($\cos90^\circ=0$); nothing tips a purely vertical ascent over on its own |
| Loss budget | Ideal $\Delta v$ (Tsiolkovsky) $-$ actual $v_f$ = gravity loss $+$ drag loss, exactly |
| Gravity loss | $\int g\sin\gamma\,dt$; dominates the loss budget on a typical ascent |
| Max-Q | Where $\rho$ (falling) and $v^2$ (rising) both still contribute — partway through the flight, not at either end |

The gravity turn buys its structural and propellant economy by giving up steering entirely through the densest part of the atmosphere. This module's final lesson takes up the question that leaves open — what guidance looks like once the vehicle is free to steer again, and what happens when the actuators it steers with turn out to have limits of their own.
