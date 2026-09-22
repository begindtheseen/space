---
id: l02-building-a-dispersion-set
title: Building a dispersion set
minutes: 19
covers:
  - 'Building a dispersion set: mass properties, aerodynamic coefficients, propulsion performance, winds, sensor and actuator errors, initial conditions, atmosphere'
---

A Monte Carlo campaign is only as good as the list of things it varies. The engine that runs the trajectories, the statistics that size the campaign, the regression that finds the drivers — every later lesson in this module assumes that list is already right, and none of them can repair it if it is not. A perfectly implemented six-degree-of-freedom simulation, run ten thousand times against a dispersion set that is missing a real source of uncertainty or understates one it does include, produces a confident, precise, and wrong answer, and nothing downstream of that campaign will reveal the mistake.

This lesson is about building that list: what categories of uncertainty belong in it, where a defensible distribution for each one actually comes from, and how independent contributors combine into a total. The list itself, once assembled, is usually written up as its own document — a dispersion-set specification — reviewed separately from the trajectories it will later be used to fly, because everything downstream depends on it being right before a single case is run.

## What belongs in the list

A launch vehicle's dispersion set is built from a handful of physical categories, and a real specification names every parameter in each one individually rather than leaving a category as a vague gesture.

**Mass properties.** Dry mass, propellant load, center of mass location, and the full inertia tensor, all of which vary from vehicle to vehicle due to manufacturing tolerance and from flight to flight due to loading accuracy, and all of which move together as propellant burns — a fact the next lesson returns to.

**Aerodynamic coefficients.** Axial force, normal force and moment coefficients, typically expressed as an uncertainty band around a wind-tunnel- or CFD-derived nominal curve, varying with Mach number and angle of attack, plus corrections for the gap between tunnel Reynolds number and flight Reynolds number.

**Propulsion performance.** Thrust and specific impulse, both at steady state and through their startup and shutdown transients, plus the timing of ignition and cutoff events themselves — a late ignition is a dispersion in its own right, independent of how the thrust curve behaves once it starts.

**Winds.** Represented as vertical profiles of speed and direction, drawn from historical or climatological data for the launch site and season, and sampled as whole correlated profiles rather than as independent values at each altitude, since a real atmosphere does not decorrelate from one altitude bin to the next.

**Sensor and actuator errors.** Bias, scale factor, noise and misalignment for every navigation sensor, and position or rate error, bandwidth and rate limits for every actuator — the same error models the inertial-navigation and sensor modules of this curriculum built, now feeding forward into a vehicle-level campaign instead of a filter's own performance analysis.

**Initial conditions.** Position, velocity and attitude at the start of the trajectory being flown, dispersed according to whatever determines them — a GNSS fix's accuracy, a pad survey's tolerance, the state handed off from a previous flight phase.

**Atmospheric density.** A profile that departs from the standard atmosphere with altitude, season and weather, usually represented as a percentage deviation from a reference model, with the deviation itself often modeled as multiplicative and strictly positive — a point that becomes important when this module later asks whether a three-sigma bound means what it appears to.

::: key
A dispersion set names, individually: mass properties and center of mass, inertia, aerodynamic coefficients, thrust and Isp and their transients, engine timing, winds as correlated profiles, atmospheric density, sensor and actuator errors, and initial conditions — each with its own distribution and a stated source.
:::

## Where a distribution comes from

Every entry in the dispersion set needs a distribution — a shape, a center, and a spread — and every one of those three needs a justification a reviewer can check. Three sources are legitimate, and a specification should say plainly which one backs each parameter.

**Test data** is the strongest source: a sample of measurements — acceptance test results across a production run, a series of hot-fire Isp measurements, a batch of IMU calibrations — fit to a distribution using the estimation techniques the probability and statistics module built. A parameter backed by test data carries a sample size, and the specification should say what it was, since a distribution fit to five measurements is a different kind of claim than one fit to five hundred.

**Heritage** draws on a similar system that has already flown: a new vehicle's engine, closely related to a prior design, may inherit that engine's demonstrated thrust dispersion, adjusted by engineering judgment for whatever is actually different between the two. Heritage is weaker than direct test data on the specific hardware, and a specification should name the heritage system and describe the adjustment, not merely assert the number.

**Engineering judgment** covers everything else: a parameter with no test campaign and no directly comparable heritage still needs a distribution, and the honest response is a stated, documented, and usually conservative bound — often a uniform distribution over a plausible range, or a Gaussian with a standard deviation chosen deliberately wide — with the reasoning written down so a reviewer can challenge it. What is never acceptable is leaving a parameter out of the dispersion set because no data exists for it yet; an undispersed parameter is not a parameter with zero uncertainty, it is a parameter whose uncertainty the analysis is silently claiming does not exist.

::: warning The absent parameter is not a small dispersion — it is an unrepresented failure mode
A campaign's confidence claim is only as good as its coverage of the actual failure mechanisms, and a parameter left out of the dispersion set because it is inconvenient, poorly understood, or forgotten is not conservatively treated as certain — it is silently treated as if no evidence about it existed at all, and the campaign's reliability number then says nothing whatsoever about that failure mode. When in doubt, disperse it wide and say why, rather than omit it and say nothing.
:::

## Combining independent contributors

A single output rarely depends on only one dispersed parameter. When several independent sources feed the same downstream quantity by addition, their variances — not their standard deviations — add, which is worth deriving rather than accepting on faith.

For independent random variables $X_1, \ldots, X_n$ with standard deviations $\sigma_1, \ldots, \sigma_n$, and $Y = X_1 + \cdots + X_n$,

$$
\operatorname{Var}(Y) = \operatorname{Var}(X_1) + \cdots + \operatorname{Var}(X_n) = \sigma_1^2 + \cdots + \sigma_n^2,
$$

because the cross terms in the expansion of $\operatorname{Var}(Y) = \mathbb{E}[(Y-\mathbb{E}Y)^2]$ are covariances between the $X_i$, and independence makes every one of them zero. The combined standard deviation is therefore the **root-sum-square**,

$$
\sigma_Y = \sqrt{\sigma_1^2 + \sigma_2^2 + \cdots + \sigma_n^2},
$$

which is always less than the naive sum $\sigma_1 + \sigma_2 + \cdots + \sigma_n$ whenever more than one term is nonzero — a fact worth internalizing early, because it is the single most common arithmetic mistake in a hand-built dispersion budget. Adding standard deviations directly, rather than combining them by root-sum-square, overstates the true spread and can make a design look like it is failing a requirement it actually meets.

::: example Total mass 1-sigma from three independent contributors
A vehicle's total mass uncertainty at liftoff comes from three sources, each independently justified: dry mass from as-built weighing and manufacturing tolerance, $\sigma_{\mathrm{dry}} = 145\,\mathrm{kg}$; propellant loading accuracy, $\sigma_{\mathrm{prop}} = 62\,\mathrm{kg}$; and payload mass, stated by the customer with its own uncertainty, $\sigma_{\mathrm{pay}} = 20\,\mathrm{kg}$.

The root-sum-square total is

$$
\sigma_{\mathrm{mass}} = \sqrt{145^2 + 62^2 + 20^2} = \sqrt{21\,025 + 3844 + 400} = \sqrt{25\,269} = 158.96\,\mathrm{kg},
$$

against a naive linear sum of $145 + 62 + 20 = 227\,\mathrm{kg}$ — forty-three percent larger than the correct figure. On a vehicle with a nominal liftoff mass of $24\,800\,\mathrm{kg}$, the correct one-sigma mass uncertainty is $0.641\%$ of the vehicle; the naive sum would have reported $0.915\%$, a large enough difference to change whether a downstream margin requirement appears to pass. Combining by root-sum-square is not a refinement to apply once the numbers are inconveniently large — it is the only correct way to add independent uncertainties, at any scale.
:::

::: example Propagating uncertainty through a physical formula: thrust from mass flow and Isp
Thrust, mass flow rate and specific impulse are related by $F = \dot{m}\,I_{sp}\,g_0$, with $g_0 = 9.80665\,\mathrm{m/s^2}$. Suppose acceptance testing gives an independent relative one-sigma uncertainty on mass flow rate of $0.012$ ($1.2\%$) and on Isp of $0.008$ ($0.8\%$), for an engine with nominal thrust $F = 934\,000\,\mathrm{N}$ and nominal $I_{sp} = 282\,\mathrm{s}$.

Taking logarithms turns the product into a sum, $\ln F = \ln\dot{m} + \ln I_{sp} + \ln g_0$, and differentiating gives the standard small-uncertainty propagation rule for a product: relative uncertainties combine exactly like independent contributors to a sum, by root-sum-square,

$$
\frac{\sigma_F}{F} = \sqrt{\left(\frac{\sigma_{\dot m}}{\dot m}\right)^{\!2} + \left(\frac{\sigma_{I_{sp}}}{I_{sp}}\right)^{\!2}} = \sqrt{0.012^2 + 0.008^2} = \sqrt{0.000144 + 0.000064} = 0.01442.
$$

The combined relative uncertainty on thrust is $1.442\%$, giving $\sigma_F = 0.01442 \times 934\,000 = 13\,470\,\mathrm{N}$, or about $13.5\,\mathrm{kN}$. Note what did not happen: the two relative uncertainties were not added outright to get $2.0\%$. A product's relative uncertainty combines exactly like a sum's absolute uncertainty, because the logarithm turns one into the other — the same root-sum-square rule, applied one algebraic step removed from where it looks like it should apply.
:::

The same rule extends the moment either component contributes: knowing $\sigma_F/F$ decomposes into a mass-flow piece and an Isp piece, a program that wants to tighten thrust uncertainty can see directly which of the two inputs is worth the engineering effort to improve, a preview of the sensitivity analysis a later lesson develops fully. Root-sum-square combination assumes independence, and the next lesson is entirely about what changes — and what does not — when that assumption fails.

## Check yourself

::: check
List the seven categories a launch-vehicle dispersion set should name individually, and for each, give one specific parameter that belongs in it.
:::

::: answer
Mass properties (dry mass, propellant load, center of mass, inertia); aerodynamic coefficients (axial force coefficient, normal force coefficient); propulsion performance (thrust, Isp, ignition timing); winds (a vertical speed and direction profile); sensor and actuator errors (IMU bias, TVC rate limit); initial conditions (initial position or attitude uncertainty); and atmospheric density (percentage deviation from the standard atmosphere at a given altitude).
:::

::: check
A parameter has no test data and no closely comparable heritage system. What is the correct treatment in the dispersion set, and what is not acceptable?
:::

::: answer
The correct treatment is engineering judgment: assign a distribution — often a wide uniform range or a conservatively large Gaussian standard deviation — and write down the reasoning so a reviewer can evaluate and challenge it. What is not acceptable is leaving the parameter out of the dispersion set; an absent parameter is not treated as low-uncertainty by the campaign, it is treated as if no uncertainty existed at all, silently removing an entire potential failure mode from the reliability claim the campaign later supports.
:::

::: check
Three independent contributors have one-sigma uncertainties of $8$, $6$ and $3$ units on a quantity that sums them. Compute the correct combined one-sigma uncertainty and compare it to the naive sum.
:::

::: answer
The root-sum-square combination is $\sqrt{8^2+6^2+3^2} = \sqrt{64+36+9} = \sqrt{109} = 10.44$ units, compared to the naive linear sum of $8+6+3=17$ units — the naive sum overstates the true one-sigma spread by about sixty percent. The correct combination is always at or below the naive sum, with equality only in the degenerate case of a single nonzero contributor.
:::

::: check
Explain, using the relation $F = \dot{m}I_{sp}g_0$, why relative uncertainties on a product combine by root-sum-square rather than by simple addition.
:::

::: answer
Taking the logarithm of both sides turns the product into a sum, $\ln F = \ln\dot m + \ln I_{sp} + \ln g_0$, and to first order a small relative uncertainty in a quantity equals the standard deviation of its logarithm. The logarithm of the product is therefore a sum of (to first order, independent) terms, and the earlier derivation for a sum of independent contributors applies directly: variances of the log-terms add, so the relative uncertainties — which are those log-term standard deviations — combine by root-sum-square, exactly as absolute uncertainties do for a literal sum.
:::

::: check
A dispersion-set specification lists atmospheric density as "varies by up to five percent, sign unspecified." Why is this an inadequate entry, and what should replace it?
:::

::: answer
"Varies by up to five percent" names neither a distribution shape nor a spread that a Monte Carlo sampler can draw from — a campaign needs an actual probability distribution, not a bound stated in words. The entry should instead specify the distribution family (commonly lognormal for a strictly positive, multiplicative quantity like a density ratio), its parameters (for instance, a one-sigma relative deviation of some stated percentage), and the source backing that choice — climatological density-profile statistics for the launch site and season, ideally, or a stated engineering judgment if the data is not available, exactly as the lesson's three-source rule requires for every entry in the set.
:::

## Summary

| Item | Statement |
| --- | --- |
| Dispersion-set categories | Mass properties and center of mass, inertia, aerodynamic coefficients, thrust/Isp and transients, engine timing, winds as correlated profiles, atmospheric density, sensor and actuator errors, initial conditions |
| Three sources for a distribution | Test data (fit to measurements), heritage (a flown system, adjusted), engineering judgment (a stated, documented bound) |
| The absent-parameter rule | An undispersed parameter is not treated as certain — it is treated as if no uncertainty about it existed; disperse wide rather than omit |
| Sum of independent contributors | $\operatorname{Var}(Y) = \sum_i \sigma_i^2$, so $\sigma_Y = \sqrt{\sum_i \sigma_i^2}$ — root-sum-square, always $\leq$ the naive linear sum |
| Product uncertainty | Relative uncertainties on a product combine by root-sum-square, by taking logarithms and applying the sum rule |

The list this lesson builds is only correct once its independence assumptions are examined honestly, and real dispersion sets are full of parameters that move together rather than separately — mass and propellant load, Isp and mixture ratio, wind speed at one altitude and the next. The next lesson takes up exactly that question: what a correlation actually does to a downstream variance, and why dropping one is not the conservative choice it looks like.
