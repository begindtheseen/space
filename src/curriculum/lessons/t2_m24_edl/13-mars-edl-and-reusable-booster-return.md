---
id: l13-mars-edl-and-reusable-booster-return
title: Mars EDL and reusable booster return modes
minutes: 16
covers:
  - "Mars EDL: thin atmosphere, supersonic parachutes, sky crane"
  - "reusable booster return modes: RTLS vs droneship, boostback burns"
---

This module closes with two real systems that push everything derived so far to its limits, in opposite directions. A Mars lander flies through an atmosphere so thin that aerodynamics alone — the tool this whole module has leaned on — cannot finish the job, forcing a mix of supersonic parachutes and powered descent lesson 12's hoverslam machinery only hints at. A reusable Earth booster flies through an atmosphere thick enough to do all the aerodynamic work lessons 2 through 10 describe, and instead faces a pure propellant-accounting choice: fly all the way home, or land downrange. Every constant in this lesson's Mars section is Mars-specific and stated explicitly; none of it — density, scale height, gravity — is interchangeable with the Earth numbers used everywhere else in this module.

## Mars's atmosphere, stated explicitly

Mars's gravitational parameter and radius were already fixed in t2_m19's table: $\mu_{\mathrm{Mars}} = 42{,}828\ \mathrm{km^3/s^2}$, $R_{\mathrm{Mars}} = 3396.2\ \mathrm{km}$, giving surface gravity

$$
g_{\mathrm{Mars}} = \frac{\mu_{\mathrm{Mars}}}{R_{\mathrm{Mars}}^2} = 3.713\ \mathrm{m/s^2},
$$

$38\ \mathrm{percent}$ of Earth's. Mars's atmosphere is almost entirely carbon dioxide; taking a representative mean surface pressure $p_0 = 610\ \mathrm{Pa}$ and mean temperature $T_0 = 210\ \mathrm{K}$ (both vary substantially with season, elevation, and time of day — these are round, representative values, not a specific mission's measured conditions), the ideal gas law with $\mathrm{CO_2}$'s specific gas constant $R_{\mathrm{CO_2}} = 8314/44.01 = 188.9\ \mathrm{J/(kg\cdot K)}$ gives

$$
\rho_{0,\mathrm{Mars}} = \frac{p_0}{R_{\mathrm{CO_2}}T_0} = \frac{610}{188.9\times210} = 0.01538\ \mathrm{kg/m^3},
$$

and an exponential-atmosphere scale height (the same $H = RT/g$ relation t1_m18 derived for Earth, applied here with Mars's own gas constant and gravity)

$$
H_{\mathrm{Mars}} = \frac{R_{\mathrm{CO_2}}T_0}{g_{\mathrm{Mars}}} = \frac{188.9\times210}{3.713} = 10{,}684\ \mathrm{m} \approx 10.7\ \mathrm{km}.
$$

::: warning Mars constants stay in this lesson
$\rho_{0,\mathrm{Mars}} = 0.01538\ \mathrm{kg/m^3}$ and $H_{\mathrm{Mars}} = 10.68\ \mathrm{km}$ replace, never supplement, Earth's $\rho_0 = 1.225\ \mathrm{kg/m^3}$ and $H = 7.2\ \mathrm{km}$ used everywhere else in this module. The Allen-Eggers, Sutton-Graves, and corridor formulas of earlier lessons all still apply on Mars in form — they are planet-agnostic mathematics — but every constant inside them must be swapped for the planet actually being flown to, never mixed.
:::

## Why the thin atmosphere is the whole problem

Mars's surface density is $0.01538/1.225 = 1.26\ \mathrm{percent}$ of Earth's — the atmosphere is about $79$ times thinner. Gravity is also weaker, by a factor of $2.64$, which by itself would make deceleration easier, not harder. The two effects do not cancel; density dominates, and the result is that a vehicle with an Earth-capsule-class ballistic coefficient never gets close to a safe landing speed from aerodynamics alone.

::: example Terminal velocity, same vehicle, two planets
Using t1_m18's terminal-velocity relation $v_t = \sqrt{2\beta g/\rho}$ for a representative Mars entry capsule with $\beta = 150\ \mathrm{kg/m^2}$:

$$
v_{t,\mathrm{Earth}} = \sqrt{\frac{2\times150\times9.807}{1.225}} = 49.0\ \mathrm{m/s}, \qquad
v_{t,\mathrm{Mars}} = \sqrt{\frac{2\times150\times3.713}{0.01538}} = 269\ \mathrm{m/s}.
$$

Despite $62\ \mathrm{percent}$ lower gravity working in its favour, the same vehicle's Mars terminal velocity is $5.5$ times *higher* than its Earth terminal velocity — $269\ \mathrm{m/s}$, itself still $\mathrm{Mach}\ 1.2$ at the local speed of sound of about $226\ \mathrm{m/s}$ (from $a = \sqrt{\gamma R_{\mathrm{CO_2}} T_0} = \sqrt{1.29\times188.9\times210}$). And this is the vehicle's speed at full equilibrium with the ground-level atmosphere — a real entry, still decelerating rather than fully equilibrated, reaches this altitude *faster* than its terminal velocity, not at it. Aerodynamic drag through Mars's atmosphere, on its own, cannot deliver this vehicle to the ground at a safe landing speed; something else has to finish the job.
:::

## Supersonic parachutes and the reason for them

On Earth, a capsule's parachute system typically waits for subsonic conditions before deploying a main canopy, because a canopy opening into supersonic flow faces enormous, poorly understood loads and flow instabilities most parachute designs are never qualified for. Mars's thin atmosphere removes that option: the terminal-velocity result above shows the vehicle is still comfortably supersonic at altitudes and speeds where an Earth mission would already be well into its subsonic descent. A Mars mission has no altitude margin to spare waiting for subsonic conditions that a purely aerodynamic deceleration, given how thin the air is, may never actually reach before the ground does. The practical answer, used by every successful large Mars lander to date, is to deploy the parachute **supersonically** — commonly in the rough range of Mach $1.7$ to $2.2$ — accepting the harsher, less-forgiving supersonic deployment loads because waiting longer is not an option the atmosphere allows.

::: key Why Mars forces supersonic parachute deployment
Mars's surface density is about $1.3\ \mathrm{percent}$ of Earth's; even a favourable, low-$\beta$ entry vehicle remains supersonic far closer to the ground than an equivalent Earth entry would. Waiting for subsonic conditions, standard practice on Earth, is not available within Mars's altitude margin — the parachute must open into a supersonic flow it was specifically qualified to survive.
:::

Even a supersonic parachute cannot fully finish the job for a vehicle of any significant mass: after chute deployment and staging away the heat shield, the remaining descent speed is still tens of metres per second, and the parachute (sized to be deployable supersonically in the first place, which limits how large and how effective it can be in this thin air) cannot practically shed the rest. A final **powered descent** phase — the same throttled-rocket problem lesson 12 built from first principles, now flown at Mars's own $g_{\mathrm{Mars}} = 3.713\ \mathrm{m/s^2}$ rather than Earth's — closes the remaining gap.

## Sky crane: why a rover does not land on its own legs

For a payload with wheels and delicate instruments — Curiosity- and Perseverance-class rovers — landing the whole descent stage, engines and all, directly on legs next to the rover creates two problems at once: rocket exhaust and dust thrown up close to the ground can damage the rover's own instruments, and the rover itself would need a dedicated shock-absorbing landing structure it does not otherwise carry. The **sky crane** solves both by separating the two jobs. The powered-descent stage, flying at a thrust-to-weight ratio close to one — genuinely achievable at Mars's low gravity in a way lesson 12 showed is *not* achievable for an equivalent Earth booster, where the throttle floor typically sits well above Earth's higher $g_0$ — holds a slow, nearly constant descent rate well above the surface, then lowers the rover beneath it on tethers to touch down gently on its own wheels, which double as landing gear. Once touchdown is sensed, the tethers are cut and the descent stage flies itself away to crash at a safe distance, keeping its exhaust and any impact debris away from the rover it just delivered.

::: warning Sky crane needs low gravity to work at all
The entire manoeuvre depends on being able to sustain thrust close to weight for a controlled, non-hoverslam descent — exactly the condition lesson 12 showed an Earth-scale booster's throttle range typically cannot reach, because $a_{T,\min}$ there exceeded $g_0$. At Mars's $g_{\mathrm{Mars}} = 3.713\ \mathrm{m/s^2}$, a comparable engine's throttle range can plausibly straddle the needed thrust-to-weight ratio, which is precisely why this technique is a Mars solution and not, in its current form, an Earth one.
:::

## Reusable booster return: RTLS versus droneship

Switch back to Earth, and to a problem this module has not yet framed explicitly: once a booster's aerodynamic descent (lesson 10) has it on approach, where does it land? A **return-to-launch-site (RTLS)** profile flies the stage back to a pad near where it lifted off, requiring a **boostback burn** early in the flight to reverse its substantial downrange velocity before the entry and landing burns lesson 10 and 12 already covered. A **droneship** profile instead lands on a vessel positioned downrange, along the stage's existing trajectory, needing no boostback at all.

::: example What the boostback burn costs, in propellant
Using the same engine parameters as lesson 12 ($I_{sp} = 283\ \mathrm{s}$, $v_e = 2775.3\ \mathrm{m/s}$), take stated, representative order-of-magnitude figures for each burn's cost: a boostback burn of about $1000\ \mathrm{m/s}$ to reverse downrange velocity, an entry burn of about $300\ \mathrm{m/s}$, and a landing burn of about $200\ \mathrm{m/s}$ (these are illustrative planning-level figures, not a measured flight's numbers). An RTLS profile flies all three, $\Delta v_{\mathrm{RTLS}} = 1500\ \mathrm{m/s}$; a droneship profile skips the boostback, $\Delta v_{\mathrm{droneship}} = 500\ \mathrm{m/s}$. The Tsiolkovsky propellant mass fraction, $1 - e^{-\Delta v/v_e}$, each burn set demands (of the stage's mass at the start of these burns) is

$$
\text{RTLS: } 1 - e^{-1500/2775.3} = 41.7\ \mathrm{percent}, \qquad
\text{droneship: } 1 - e^{-500/2775.3} = 16.5\ \mathrm{percent}.
$$

RTLS costs roughly $25$ percentage points more of the stage's mass in propellant than droneship recovery, for these stated assumptions — mass that, on an expendable flight, would have gone to payload instead. This is the central trade a reuse-capable launch provider makes on every mission: RTLS avoids the cost, complexity, and weather sensitivity of a recovery vessel at sea, while droneship recovery preserves more payload capacity by paying only the entry and landing burns, at the cost of operating and positioning a ship downrange, on a moving deck, for every landing.
:::

::: key RTLS vs droneship is a Δv-and-payload trade, not an aerodynamics one
Once separated, both profiles fly the same entry-burn and landing-burn physics this module has already derived. The difference is entirely upstream: RTLS adds a boostback burn to cancel downrange velocity that a droneship, sitting downrange to meet the stage where it is already headed, does not need to cancel at all — and that one additional burn is the single largest line item in the propellant, and therefore payload, cost of choosing to fly home.
:::

## Check yourself

::: check
Compute the ratio of Mars's to Earth's surface atmospheric density used in this lesson, and state which of Mars's two departures from Earth — lower gravity or thinner atmosphere — dominates the terminal-velocity comparison.
:::

::: answer
$\rho_{0,\mathrm{Mars}}/\rho_{0,\mathrm{Earth}} = 0.01538/1.225 = 0.01256$, about $1.3\ \mathrm{percent}$ — roughly a $79$-fold thinner atmosphere. Even though Mars's gravity is also lower (a factor that would, on its own, reduce terminal velocity), the density effect dominates by a wide margin, which is why the worked example found Mars terminal velocity $5.5$ times *higher* than Earth's for the same vehicle despite the lower gravity.
:::

::: check
Why must a Mars mission deploy its parachute supersonically, when an equivalent Earth mission typically waits for subsonic conditions?
:::

::: answer
Mars's atmosphere is so thin that even a well-designed (low-$\beta$) entry vehicle remains supersonic at altitudes and descent speeds where an Earth vehicle would already be comfortably subsonic — the terminal-velocity example showed a representative capsule still at roughly Mach $1.2$ even fully equilibrated at ground level. Waiting for subsonic conditions before deploying, standard Earth practice, would mean waiting past the point the ground is reached; Mars missions instead qualify their parachutes to open directly into supersonic flow, typically around Mach $1.7$–$2.2$, because the atmosphere gives no margin to wait longer.
:::

::: check
Explain why a sky-crane-style hovering descent is feasible at Mars but is not how an equivalent Earth booster's landing burn is flown, referring back to lesson 12's hoverslam result.
:::

::: answer
Lesson 12 showed an Earth-scale landing stage's minimum-throttle thrust acceleration, $14.4\ \mathrm{m/s^2}$, exceeding Earth's $g_0 = 9.807\ \mathrm{m/s^2}$, which forces a single-shot hoverslam with no hovering option. Mars's surface gravity is only $3.713\ \mathrm{m/s^2}$, well below a comparable engine's throttle range, so a Mars descent stage can sustain thrust close to its own weight and hold a slow, controlled, non-hoverslam descent rate — the condition a sky-crane manoeuvre depends on — in a regime an Earth-gravity vehicle with the same relative throttle range simply cannot reach.
:::

::: check
A launch provider is deciding between RTLS and droneship recovery for a mission that needs to preserve as much payload mass as possible. Based on this lesson's worked example, which mode should it choose, and what does it give up by choosing it?
:::

::: answer
Droneship recovery, since it demands roughly $25$ percentage points less of the stage's mass in propellant for the stated illustrative burn costs, leaving correspondingly more mass available for payload on an expendable-equivalent basis. What it gives up is the boostback burn's convenience: droneship recovery requires positioning and operating a recovery vessel downrange, on a moving deck, subject to weather and sea-state constraints that a fixed landing pad near the launch site does not have.
:::

::: check
This module used $H = 7200\ \mathrm{m}$ for every Earth exponential-atmosphere calculation. Explain why using that same number for a Mars entry calculation would be a serious error, referencing how $H$ is derived.
:::

::: answer
Scale height is $H = RT/g$ (t1_m18's derivation, reused here for Mars), and every term in it differs between the two planets: the specific gas constant depends on atmospheric composition ($R_{\mathrm{CO_2}} = 188.9\ \mathrm{J/(kg\cdot K)}$ for Mars's carbon-dioxide atmosphere versus $287.1\ \mathrm{J/(kg\cdot K)}$ for Earth's nitrogen-oxygen mixture), the representative temperature differs (Mars is far colder), and gravity differs (Mars's is $38\ \mathrm{percent}$ of Earth's). Mars's scale height, $10.68\ \mathrm{km}$, is about $48\ \mathrm{percent}$ larger than Earth's $7.2\ \mathrm{km}$ despite the colder temperature, because the much lower gravity in the denominator outweighs the lower temperature in the numerator — using Earth's $H$ on Mars would get the direction as well as the magnitude of the atmosphere's structure wrong.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| $g_{\mathrm{Mars}} = \mu_{\mathrm{Mars}}/R_{\mathrm{Mars}}^2$ | $3.713\ \mathrm{m/s^2}$, $38\%$ of Earth's, from $\mu_{\mathrm{Mars}}=42{,}828\ \mathrm{km^3/s^2}$, $R_{\mathrm{Mars}}=3396.2\ \mathrm{km}$ (t2_m19) |
| $\rho_{0,\mathrm{Mars}} = p_0/(R_{\mathrm{CO_2}}T_0)$ | $0.01538\ \mathrm{kg/m^3}$, about $1.3\%$ of Earth's, from $p_0=610\ \mathrm{Pa}$, $T_0=210\ \mathrm{K}$ |
| $H_{\mathrm{Mars}} = R_{\mathrm{CO_2}}T_0/g_{\mathrm{Mars}}$ | $10.68\ \mathrm{km}$, larger than Earth's $7.2\ \mathrm{km}$ despite the cold, because gravity is so much lower |
| Terminal velocity, $\beta=150\ \mathrm{kg/m^2}$ | $49.0\ \mathrm{m/s}$ (Earth) vs. $269\ \mathrm{m/s} \approx \mathrm{Mach}\ 1.2$ (Mars) — thinner air dominates lower gravity |
| Supersonic parachute deployment | Roughly Mach $1.7$–$2.2$ on Mars; forced by the atmosphere never getting the vehicle comfortably subsonic in time |
| Sky crane | Hover-like powered descent (feasible because $g_{\mathrm{Mars}} \ll$ Earth's throttle floor) lowers the rover on tethers, isolating it from exhaust and touchdown loads |
| RTLS vs droneship, illustrative $\Delta v$ | $1500\ \mathrm{m/s}$ (boostback + entry + landing) vs. $500\ \mathrm{m/s}$ (entry + landing); $41.7\%$ vs. $16.5\%$ propellant mass fraction |

This closes the module. From the entry interface through the Allen-Eggers solution, the corridor, guided and lifting entry, hypersonic aerodynamics, and every phase of a propulsive landing, the thread has been the same one this final lesson makes explicit: the same handful of equations, carried carefully from planet to planet and vehicle to vehicle without letting a single constant leak across that boundary.
