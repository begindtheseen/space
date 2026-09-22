---
id: l11-sgp4-tle
title: SGP4/SDP4 and why TLEs are theory-specific
minutes: 19
covers:
  - SGP4/SDP4 and why TLEs are theory-specific
---

Almost every publicly available piece of information about where a satellite is — the catalogue the U.S. Space Force publishes, the data amateur trackers use to predict a pass, the numbers a conjunction-screening service ingests for tens of thousands of objects — comes as a two-line element set, propagated by a specific, compact analytic theory called SGP4. This module has spent ten lessons building the physics of individual perturbations and two numerical special-perturbation methods that can, in principle, use any of them. SGP4 is neither of those: it is a general-perturbations theory, in the sense of the first lesson, purpose-built for exactly one job — take a TLE, and a time, and return a state, in microseconds, without integrating anything — and it can only do that job because its own "mean elements" are defined by, and only by, its own internal theory. This lesson explains what that means and why it makes TLEs incompatible with the Cowell and Encke propagators of the previous lesson unless you go through SGP4 itself first.

## What SGP4 is

SGP4 (Simplified General Perturbations, version 4) is an analytic propagation theory, descended from Kozai's and Brouwer's mean-element theories of the 1960s, that predicts a satellite's position from a compact set of mean orbital elements plus an epoch, using closed-form secular and periodic corrections rather than numerical integration. Its force model includes $J_2$'s secular nodal and apsidal effects (essentially the formulas derived earlier in this module), $J_3$ and $J_4$ terms, and an empirical atmospheric drag model driven by a single fitted parameter, $B^*$, rather than a physical density model with an independently known ballistic coefficient. SDP4 is the companion deep-space theory, automatically selected (in any modern implementation) for orbits with a period of $225\,\mathrm{minutes}$ or more, adding lunar and solar gravitational resonance terms and Earth's $12$-hour and $24$-hour tesseral resonances that matter for slow-moving orbits (geostationary, Molniya) but are negligible for a low orbit completing a revolution every hour and a half. In practice, "SGP4" is used as shorthand for both, since the switch between them is internal to the algorithm.

::: example Where the near-Earth / deep-space boundary sits in altitude
Kepler's third law converts the $225$-minute period boundary directly into a semi-major axis:
$$
a = \left(\frac{\mu T^2}{4\pi^2}\right)^{1/3} = \left(\frac{398\,600.4418\times(225\times60)^2}{4\pi^2}\right)^{1/3} = 12\,254.1\,\mathrm{km} ,
$$
an altitude of about $5876\,\mathrm{km}$ — well above a typical low orbit or even a GPS-altitude orbit ($\approx20\,200\,\mathrm{km}$ altitude, comfortably past the boundary into SDP4 territory) but below geostationary altitude, confirming that GPS, Molniya, and geostationary satellites all need the deep-space theory's extra resonance terms, while anything in low or medium Earth orbit below about $5900\,\mathrm{km}$ altitude does not.
:::

## The two-line element set

A TLE encodes an epoch and six mean orbital elements — inclination, right ascension of the ascending node, eccentricity, argument of perigee, mean anomaly, and mean motion — in a fixed-width text format, along with a NORAD catalogue number, an epoch-referenced first and second derivative of mean motion, and the $B^*$ drag term. What matters for this lesson is not the column layout (any SGP4 library parses that for you) but what those six numbers *are*: not the classical, instantaneous, osculating elements this module has computed from a state vector in every earlier lesson, but elements defined by, and meaningful only within, SGP4's own specific analytic theory.

::: example Sanity-checking a TLE's mean motion
A typical ISS-altitude TLE reports a mean motion around $15.50$ revolutions per day. Converting to $\mathrm{rad/s}$ and applying Kepler's third law:
$$
n = 15.50\times\frac{2\pi}{86\,400\,\mathrm{s}} = 1.1272\times10^{-3}\,\mathrm{rad/s}, \qquad a = \left(\frac{\mu}{n^2}\right)^{1/3} = 6794.9\,\mathrm{km} ,
$$
an altitude of about $416.7\,\mathrm{km}$ — squarely in the ISS's actual operating range, and exactly the kind of order-of-magnitude sanity check worth running on any element set before trusting it: a nonsensical mean motion (implying an altitude below Earth's surface, or absurdly high) is usually a parsing bug, not an exotic orbit.
:::

## Why "mean elements" here means something narrower than in the rest of this module

The mean-versus-osculating-elements lesson defined mean elements as "whatever a specific theory leaves after it removes the periodic terms it chooses to remove, to the order it carries the approximation" — and stressed that different theories do not agree with each other at the few-to-tens-of-kilometre level the short-period $J_2$ wobble itself occupies. SGP4's mean elements are one specific instance of that general warning, not an exception to it: they are defined by SGP4's own particular choice of which periodic terms to analytically strip out, using its own force model (not quite the same $J_2$–$J_4$ treatment this module derived, and a drag model that is empirically fitted rather than physically integrated), fitted to real tracking data by a specific least-squares process external to the theory itself. Two consequences follow directly.

First, feeding a TLE's six numbers into a Cowell or Encke propagator as if they were osculating elements — the natural thing to do, since every other propagator in this module expects an initial *state*, not a theory-specific mean element set — reintroduces exactly the short-period error the mean-vs-osculating lesson quantified: a real, immediate offset at epoch, of the same order as the $J_2$ short-period wobble already measured in this module (several to a few tens of kilometres in position, with a correspondingly wrong initial velocity), before a single second of propagation error has had a chance to accumulate on top of it. Unlike a pure position offset, a mismatched *velocity* does not stay bounded — it feeds a genuinely wrong trajectory from the first step onward, so the error does not merely start large and stay large; it grows.

Second, the reverse mistake is just as real: taking a numerically integrated Cowell trajectory's osculating elements, or even a carefully-derived Brouwer mean element set, and writing them into a TLE's fields for use with someone else's SGP4 implementation reintroduces the same mismatch from the other direction, because SGP4 will apply *its own* periodic corrections on top of elements that were never averaged the way SGP4 expects. The only combination guaranteed to be self-consistent is a TLE's own numbers, propagated by SGP4 itself.

::: key TLEs are theory-specific mean elements
A TLE's six elements are mean elements defined *inside* SGP4/SDP4's own analytic theory — not osculating elements, and not interchangeable with any other theory's mean elements. Propagate a TLE only with SGP4; if a Cartesian state is needed for a different propagator, get it by running SGP4 first and using its *output* state (which is osculating, like any state vector) as the new propagator's initial condition — never by feeding the TLE's raw element fields into a different theory directly.
:::

## B*: a drag parameter, not the ballistic coefficient from this module

$B^*$ looks superficially like the inverse ballistic coefficient of the drag lesson, and is often loosely called "the drag term," but it is a parameter *fitted to* SGP4's own internal, static reference atmosphere from the 1960s and 70s, scaled to units of inverse Earth radii, and re-estimated from tracking data at every new TLE epoch rather than computed from a physical $C_D$, $A$, and $m$. It absorbs not just genuine atmospheric drag but whatever the orbit-determination fit needed to reconcile SGP4's simplified force model with real tracking data — including some of the error from every *other* simplification SGP4 makes. Using $B^*$ as a drop-in replacement for $1/B$ in the drag lesson's own decay-rate formula, or expecting it to track a real, time-varying atmospheric density model the way that lesson's illustrative solar-min/max curves did, mixes two different, non-interchangeable definitions of "drag parameter" the same way mixing mean and osculating elements mixes two different definitions of "orbit."

## Why TLEs go stale

A TLE's $B^*$ and mean elements are fitted to tracking observations *up to* its epoch; SGP4 then extrapolates forward using that one, frozen snapshot of the satellite's recent drag behaviour. It has no way to know that a geomagnetic storm three days after epoch is about to change the actual atmospheric density by an order of magnitude — the same uncertainty the drag lesson quantified as the dominant term in any lifetime prediction. Operationally, this is why TLEs are reissued every few days for actively tracked low-orbit objects rather than trusted for weeks at a time: not because SGP4's algorithm degrades with propagation time in isolation, but because the real atmosphere keeps moving further from whatever it looked like at the fitted epoch, and SGP4 has no mechanism — by design, given its speed requirements — to update that picture on its own.

::: warning A TLE's epoch is not "now"
A TLE downloaded today may have an epoch several days old; propagating it "to now" with SGP4 is routine and expected, but propagating it weeks past its epoch, especially for a low, drag-affected orbit, compounds exactly the density uncertainty the drag lesson described, on top of $B^*$'s own status as a fitted rather than physical quantity. For anything precision-sensitive, prefer the freshest available TLE over a long propagation from an old one.
:::

## Check yourself

::: check
A colleague writes the six numbers from a TLE directly into a Cowell propagator's initial state vector, treating right ascension, inclination, and so on as ordinary osculating elements. What is wrong with this, and roughly how large is the resulting error at epoch?
:::

::: answer
TLE elements are mean elements defined inside SGP4's own theory, not osculating elements — treating them as osculating elements skips the periodic corrections SGP4 would otherwise apply, reintroducing an error of the same order as the short-period $J_2$ wobble this module quantified earlier: several to a few tens of kilometres in position at epoch, with a correspondingly wrong initial velocity that then grows the error further as the (already-wrong) trajectory is propagated forward.
:::

::: check
Why does SDP4 add lunar, solar, and Earth-resonance terms that SGP4 omits, rather than both theories using an identical force model?
:::

::: answer
Those resonance and third-body effects matter on the timescale a slow, high-altitude orbit (geostationary, Molniya, or anything with a period of $225$ minutes or more) actually experiences them over, while a fast low-Earth-orbit satellite completes many revolutions before such slow perturbations accumulate to a significant size — so SGP4 omits terms that would add computational cost without meaningfully improving accuracy for the orbits it targets, and SDP4 adds them back in specifically for the regime where they do matter.
:::

::: check
Explain why $B^*$ cannot be directly plugged into the ballistic-coefficient drag formula from the atmospheric drag lesson as $1/B$.
:::

::: answer
$B^*$ is fitted against SGP4's own internal, static reference atmosphere and absorbs whatever else the orbit-determination fit needed to reconcile SGP4's simplified force model with real tracking data; it is not a physically defined $m/(C_DA)$ referenced to an independent density model the way this module's drag lesson uses $B$. The two parameters describe superficially similar physics but are calibrated against different, non-interchangeable reference atmospheres and force models, so treating them as the same number silently mixes two incompatible theories.
:::

::: check
A satellite operator has a very precise numerically integrated (Cowell) ephemeris for their own spacecraft and wants to publish it as a TLE for public trackers to use with their own SGP4 implementations. Is directly copying the Cowell osculating elements into the TLE fields a sound approach?
:::

::: answer
No. SGP4 will apply its own periodic corrections to whatever elements it is given, on the assumption that they are already SGP4-theory mean elements; feeding it osculating elements from a different theory reintroduces the same theory-mismatch error this lesson describes, just in the opposite direction from the TLE-into-Cowell mistake. Publishing a usable TLE requires fitting SGP4's own mean-element theory to the trajectory (or to observations of it), not merely relabelling a different theory's elements.
:::

::: check
Why might a TLE that is two weeks old give noticeably worse predictions for a $400\,\mathrm{km}$ satellite than for a geostationary one, even though SGP4 itself runs identically for both?
:::

::: answer
The dominant source of staleness is not the algorithm but the atmosphere: a $400\,\mathrm{km}$ orbit's drag-driven decay depends on a density that can change by an order of magnitude within days around a geomagnetic event, and $B^*$ only reflects the drag behaviour observed up to the TLE's epoch. A geostationary satellite experiences essentially no drag, so the same two-week-old element set is not fighting an unpredictable, rapidly-changing force the way the low-orbit case is, and its predictions degrade far more slowly with age.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| SGP4 / SDP4 | Analytic, general-perturbations propagation theory; SDP4 adds lunar/solar/resonance terms for periods $\ge225\,\mathrm{min}$ |
| TLE | Epoch plus six mean elements plus $B^*$, in a fixed text format; the six elements are SGP4-theory mean elements, not osculating |
| $n=15.50$ rev/day $\Rightarrow a\approx6794.9\,\mathrm{km}$ | Kepler's third law as a quick TLE sanity check |
| Mixing theories | Feeding a TLE into a different propagator, or a different propagator's output into a TLE, produces an epoch error of the same order as the $J_2$ short-period wobble, then grows |
| $B^*$ | A fitted, SGP4-internal drag-like parameter, referenced to SGP4's own static atmosphere — not the physical ballistic coefficient $B=m/(C_DA)$ |
| TLE staleness | Driven mainly by real atmospheric change outpacing the epoch's fitted $B^*$, most severe for low, drag-affected orbits |
| Correct workflow | Propagate a TLE only with SGP4; use its output *state* (osculating) as input to any other propagator, never the raw TLE fields |

The final lesson of this module puts every perturbation together to answer a genuinely practical question: how long does an orbit last, and how does the uncertainty in each contributing perturbation propagate into that answer.
