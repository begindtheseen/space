---
id: l07-phasing-rendezvous
title: Phasing manoeuvres and rendezvous phasing
minutes: 19
covers:
  - phasing manoeuvres and rendezvous phasing
---

Every maneuver so far in this module has changed *where* an orbit is – its size, its shape, its plane, its apse line. This lesson changes *when* a spacecraft is somewhere in an orbit it already, in essence, has. A chaser vehicle approaching the ISS, a servicing spacecraft closing on a client satellite, a newly launched constellation member finding its assigned slot – all three start in roughly the right orbit but at the wrong point along it, separated from a target by a phase angle that a single burn cannot close without also ruining everything else about the orbit.

The trick is one you have already used twice in this module without naming it: change the orbital period slightly, wait, and change it back. A shorter period means more revolutions per unit time, so the vehicle gains angle on anything moving at the original rate; a longer period loses angle. Get the timing and the period offset right, and the vehicle arrives back at its original orbit exactly when the target is there too.

## Setting up the phasing problem

Take a chaser and a target in the *same* circular orbit, radius $r$, period $T = 2\pi\sqrt{r^3/\mu}$, but separated by a phase angle $\alpha$ – the target leads the chaser by $\alpha$, measured in the direction of motion. Left alone, the gap never closes; both move at the same angular rate $n=2\pi/T$ forever.

The standard technique: burn the chaser onto a nearby circular *phasing orbit*, radius $r_2 = r+\delta r$, using a small two-impulse mini-Hohmann exactly like the Hohmann transfers of lesson 2, just with a much smaller radius change. If $\delta r<0$ the phasing orbit is lower and faster (shorter period), so the chaser gains angle on the target; if $\delta r>0$ it is higher and slower, so the chaser falls back and the target gains on it instead. Either way, the chaser waits on the phasing orbit until exactly the needed angle has been gained or lost, then transfers back to the original orbit with the reverse burns, arriving at the rendezvous point at the same moment the target does.

The phasing orbit's period, from Kepler's third law, is $T_2 = 2\pi\sqrt{r_2^3/\mu}$, and the rate at which the chaser gains angle on the target is the difference in angular rates,
$$
\dot{\alpha}_{\text{closed}} = 2\pi\left(\frac{1}{T_2}-\frac{1}{T}\right),
$$
positive when $r_2<r$ (gaining) and negative when $r_2>r$ (falling behind). The time needed on the phasing orbit to close a gap $\alpha$ is simply
$$
t_{\text{wait}} = \frac{\alpha}{\dot{\alpha}_{\text{closed}}},
$$
and the total Δv is twice the mini-Hohmann cost (once down or up to the phasing orbit, once back):
$$
\Delta v_{\text{total}} = 2\big(|\Delta v_1| + |\Delta v_2|\big).
$$

::: key Co-orbital phasing
Drop (or raise) to a nearby circular phasing orbit via a small mini-Hohmann, wait for the period difference to close the phase gap $\alpha$ at rate $\dot{\alpha}_{\text{closed}} = 2\pi(1/T_2-1/T)$, then return with the reverse burns. Smaller $|\delta r|$ costs less Δv but takes longer to close the same gap.
:::

::: example Closing a 30° gap in low orbit
Chaser and target share a $6678\,\mathrm{km}$ circular orbit, $v_c = 7.7258\,\mathrm{km/s}$, $T = 5431.0\,\mathrm{s} = 90.52\,\mathrm{min}$; the target leads by $\alpha=30^\circ$. Drop the chaser to a phasing orbit $25\,\mathrm{km}$ lower, $r_2=6653\,\mathrm{km}$: the mini-Hohmann burns are $\Delta v_1 = -7.248\,\mathrm{m/s}$ and $\Delta v_2=-7.254\,\mathrm{m/s}$ (both retrograde, as any orbit-lowering pair of burns must be), and the phasing orbit's period is $T_2 = 5400.5\,\mathrm{s}$, giving a closure rate of $\dot{\alpha}_{\text{closed}} = 32.31^\circ/\mathrm{day}$. Closing $30^\circ$ takes $t_{\text{wait}} = 30/32.31 = 0.929\,\mathrm{days} = 22.3\,\mathrm{h}$. Total Δv for both mini-Hohmann legs (down and back up) is $2(7.248+7.254) = 29.00\,\mathrm{m/s}$ – a modest, realistic phasing budget for a same-day rendezvous.
:::

::: example The same gap, closed twice as fast
Double the offset, $\delta r = -50\,\mathrm{km}$, $r_2=6628\,\mathrm{km}$: burns of $\Delta v_1=-14.529\,\mathrm{m/s}$, $\Delta v_2=-14.557\,\mathrm{m/s}$, closure rate $64.93^\circ/\mathrm{day}$, wait time $0.462\,\mathrm{days}=11.1\,\mathrm{h}$ – almost exactly half the previous wait. Total Δv is $2(14.529+14.557)=58.17\,\mathrm{m/s}$ – almost exactly double. Halving the transit time doubled the propellant, the same Δv-for-time exchange rate you have now met for the bi-elliptic transfer (lesson 3, time bought with Δv given up) and the one-tangent transfer (lesson 4, Δv spent to buy time back): it is the same underlying trade surfacing a third time, here parameterised by how aggressively you offset the phasing orbit.
:::

## Choosing which way to phase

The sign of $\delta r$ is not a free choice once you know which way the target leads – it is determined by whether the chaser needs to gain angle (target ahead, chaser must catch up: go lower, faster) or lose it (target behind, chaser must wait: go higher, slower). Going the "wrong way" does not simply fail gracefully; it moves the chaser further from rendezvous; always check the sign of $\dot{\alpha}_{\text{closed}}$ against the sign of the gap you actually need to close before committing to a burn.

A second, practical constraint bounds how large $|\delta r|$ can be: dropping too far lowers the *transfer* ellipse's periapsis as well as the phasing orbit itself, and an aggressive single-loop phasing scheme (returning to the rendezvous point after just one revolution rather than gently offsetting a full circular orbit) can drive that periapsis into the atmosphere long before the Δv savings look attractive. The gentle, two-mini-Hohmann approach used in both examples above keeps the lowest point of the whole trajectory only tens of kilometres below the original orbit, which is why it is the version flown operationally.

::: warning Phasing gets you to the same point at the same time, not docked
Closing a phase angle brings the chaser and target to the same orbit, at the same place, at the same time – co-located, in the two-body sense used throughout this module. It says nothing about the final few hundred metres of relative approach, closing rate control, or collision avoidance, which need the relative-motion equations of a later module (relative motion and rendezvous proximity operations) built for exactly that regime. Phasing is the first, coarse step of a rendezvous, not the whole of it.
:::

::: warning A phasing orbit is still a full orbit
It is tempting to think of the phasing orbit as a brief detour, but the chaser genuinely coasts on it for the full wait time, sometimes many revolutions for a small $|\delta r|$ and a large gap to close. Station-keeping, tracking, and any other operational overhead on the chaser continue to apply throughout, not just during the two short burns.
:::

## Check yourself

::: check
A target leads a chaser by $10^\circ$ in a shared circular orbit. Which way should the chaser's phasing orbit be offset, and why?
:::

::: answer
Lower and faster (shorter period). The chaser needs to gain $10^\circ$ on the target, which means moving at a higher angular rate than the target for a while; a lower circular orbit has a shorter period and therefore a higher angular rate, by Kepler's third law, so the chaser closes the gap while on it.
:::

::: check
Explain why doubling the magnitude of the phasing-orbit radius offset roughly halved the wait time but roughly doubled the total Δv in this lesson's two worked examples, rather than leaving one of the two unaffected.
:::

::: answer
The closure rate $\dot\alpha_{\text{closed}} = 2\pi(1/T_2-1/T)$ grows roughly linearly with $|\delta r|$ for small offsets (a larger period difference closes the gap faster), so the wait time $t_{\text{wait}}=\alpha/\dot\alpha_{\text{closed}}$ falls roughly in inverse proportion — doubling the offset roughly halves the wait. Separately, each mini-Hohmann burn's Δv also grows roughly linearly with $|\delta r|$ for a small radius change (vis-viva is smooth, so a small perturbation produces a proportionally small speed change), so doubling the offset roughly doubles each burn, and therefore the total. Both effects are consequences of the same underlying offset, moving in the directions that make the Δv-for-time trade explicit.
:::

::: check
A chaser needs to close a $45^\circ$ gap and has at most 12 hours available. Using the $\delta r=-50\,\mathrm{km}$ result from this lesson's second example (closure rate $64.93^\circ/\mathrm{day}$ at that offset, on a $6678\,\mathrm{km}$ orbit) as a reference point, is a $-50\,\mathrm{km}$ offset enough, and if not, what has to change?
:::

::: answer
At $64.93^\circ/\mathrm{day}$, closing $45^\circ$ takes $45/64.93 = 0.693\,\mathrm{days} = 16.6\,\mathrm{h}$ — more than the 12 hours available, so $-50\,\mathrm{km}$ is not enough. A larger $|\delta r|$ is needed to raise the closure rate; since closure rate grows roughly linearly with $|\delta r|$ near this regime, closing $45^\circ$ in 12 hours needs a closure rate of roughly $45/0.5=90^\circ/\mathrm{day}$, suggesting an offset on the order of $-70\,\mathrm{km}$ or so (exact value would need recomputing the mini-Hohmann and period at that new radius) — at the cost of a correspondingly larger Δv than the $58\,\mathrm{m/s}$ the $-50\,\mathrm{km}$ case required.
:::

::: check
Why does the total Δv for a phasing maneuver come from *two* mini-Hohmann transfers rather than one?
:::

::: answer
The chaser must both leave the original orbit (burn down or up onto the phasing orbit) and return to it (burn back to match the target's orbit again) so that it is co-located with the target on the *same* orbit at the end, not just passing through the target's radius at some arbitrary velocity. Each of those two transitions is itself a small Hohmann-style transfer with its own two impulses, giving four burns in total — but because the phasing orbit is circular and the offset is symmetric, the "there" pair and the "back" pair have equal magnitude, which is why the total is written as $2(|\Delta v_1|+|\Delta v_2|)$ rather than as four independent numbers.
:::

::: check
A mission designer proposes phasing by raising the chaser's orbit instead of lowering it, even though the target is ahead and the chaser needs to catch up. Under what circumstance could this still be the right call?
:::

::: answer
If the chaser needs to gain a phase angle close to a full revolution's worth (say, closing what looks like a small deficit but is actually $350^\circ$ of catching up once wraparound is accounted for), it may be cheaper to instead let the target "catch up" to the chaser by falling behind $10^\circ$ (raising the chaser's orbit) than to gain the full $350^\circ$ by lowering it — the two strategies reach the same rendezvous configuration modulo $360^\circ$, and comparing their Δv and wait-time costs (rather than assuming "catch up" always means "go lower") is exactly the kind of check this lesson's machinery lets you make directly.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\alpha$ | Phase angle by which the target leads the chaser in a shared circular orbit |
| $r_2 = r+\delta r$ | Phasing orbit radius; lower to gain phase, higher to lose it |
| $\dot\alpha_{\text{closed}} = 2\pi(1/T_2-1/T)$ | Rate the phase gap closes while on the phasing orbit |
| $t_{\text{wait}} = \alpha/\dot\alpha_{\text{closed}}$ | Time needed on the phasing orbit |
| $\Delta v_{\text{total}} = 2(\lvert\Delta v_1\rvert+\lvert\Delta v_2\rvert)$ | Two mini-Hohmann legs: onto the phasing orbit and back |
| $\delta r=-25\,\mathrm{km}$ example | 29.0 m/s total, closes 30° in 22.3 h |
| $\delta r=-50\,\mathrm{km}$ example | 58.2 m/s total, closes 30° in 11.1 h — same trade as bi-elliptic and one-tangent transfers |
| Scope | Brings chaser and target to the same point at the same time; final approach needs relative-motion targeting |

The next lesson turns from the idealised instantaneous burns of lessons 1 through 7 to what a burn actually costs when it cannot be treated as instantaneous at all — the finite-burn losses this module has been setting aside since lesson 1's first rough estimate.
