---
id: l18-configuration-management-of-the-simulation
title: Configuration management of the simulation
minutes: 19
covers:
  - "Configuration management of the sim: models, parameters and scenarios versioned separately from the code"
---

Every lesson in this module has treated the simulation's code as fixed while something else varied: a mass value, a sensor noise level, an event altitude, a random seed. That something else — models, parameters and scenarios — is not the code, changes far more often than the code does, and needs its own discipline for exactly the reason the last three lessons gave it so much attention: a result is only reproducible, only comparable against a golden file, only explicable when a regression appears, if you know precisely what produced it. Code version alone does not answer that question. This lesson is about the other half of the answer.

## Three things that are not the code

**Models** are the choice of which implementation is active for a given physical effect — a single-scale-height atmosphere or the improved two-layer one from the golden-file lesson, a dipole magnetic field or a full spherical-harmonic one. **Parameters** are the numbers that feed a chosen model — a dry mass, a sensor noise standard deviation, a thruster's minimum impulse bit. **Scenarios** are everything that defines one specific run — initial conditions, which events are armed, a mission's timeline. All three change constantly through a programme's life, for reasons that have nothing to do with the simulation's own code being wrong: a vehicle's mass grows as its design matures, a sensor gets re-characterised on the bench, a new abort scenario gets added to the test matrix. None of that is a code change, and none of it should have to go through the same review a change to the integrator would.

## Why "same code" is not "same result"

Keeping models, parameters and scenarios in their own versioned files, separate from the simulation's source, is what lets a result be specified completely: code version, configuration version, scenario, and seed, together, or the result cannot be reproduced even by someone with the identical code. Skipping this is not a hypothetical risk — it produces a specific, recognisable symptom that looks exactly like something this module has already spent a whole lesson ruling out.

::: example A discrepancy that looks like a determinism bug and is not one
The dry mass used throughout this module, $4{,}000\,\mathrm{kg}$, gets refined to $4{,}050\,\mathrm{kg}$ once a more mature CAD model is available — a routine update, no code touched at all.

```python
import numpy as np

g0, F, Isp, m_prop0 = 9.80665, 800000.0, 320.0, 25000.0

def dv_tsiolkovsky(m_dry):
    m0 = m_dry + m_prop0
    return Isp*g0*np.log(m0/m_dry)

dv_old = dv_tsiolkovsky(4000.0)     # the dry mass used throughout this module
dv_new = dv_tsiolkovsky(4050.0)     # a refined CAD estimate, 50 kg heavier, no code change at all

print("dry mass 4000 kg -> burnout dv:", dv_old, "m/s")
print("dry mass 4050 kg -> burnout dv:", dv_new, "m/s")
print(f"difference: {dv_old - dv_new:.3f} m/s  ({(dv_old-dv_new)/dv_old*100:.3f}%)")
# dry mass 4000 kg -> burnout dv: 6216.636177491353 m/s
# dry mass 4050 kg -> burnout dv: 6183.058626244263 m/s
# difference: 33.578 m/s  (0.540%)
```

A $1.25\%$ mass change produces a $33.6\,\mathrm{m/s}$, $0.54\%$ burnout velocity change — the same shape of small, plausible-looking difference an engineer chasing a determinism bug, per the previous lesson, would expect from a reduction-order artefact or a stray uninitialised value. Every technique from that lesson would come up empty here, correctly, because there is no determinism bug: the code is bit-exact, the seed is identical, and the *configuration* silently changed between the two runs. Without a record of which parameter file each run used, this $33.6\,\mathrm{m/s}$ is a mystery that looks exactly like a much harder problem than the one it actually is.
:::

## The headless batch interface, and why it has to be a pure function

The exercises for this module ask for a headless batch entry point — something a campaign driver calls thousands of times with a parameter dictionary and a seed, returning a result record. Making that entry point a genuine pure function of exactly those two inputs, with no hidden global state and no implicit dependence on anything not passed in explicitly, is what makes configuration management and determinism the same discipline rather than two separate ones: if the function's only inputs are the configuration and the seed, then recording those two things alongside every result is sufficient, by construction, to reproduce it.

::: example A result record that explains itself
```python
import numpy as np
import json, hashlib

def config_hash(cfg):
    return hashlib.sha256(json.dumps(cfg, sort_keys=True).encode()).hexdigest()[:12]

def run_case(config, seed):
    """Headless batch entry point: a pure function of (config, seed) only."""
    rng = np.random.default_rng(seed)
    g0 = 9.80665
    mdot = config["F"]/(config["Isp"]*g0)
    m0 = config["m_dry"] + config["m_prop0"]
    dv_nominal = config["Isp"]*g0*np.log(m0/config["m_dry"])
    dv_dispersed = dv_nominal*(1.0 + rng.normal(0, config["isp_1sigma_frac"]))
    return {"config_hash": config_hash(config), "seed": seed, "dv_m_s": dv_dispersed}

config = {"F": 800000.0, "Isp": 320.0, "m_prop0": 25000.0, "m_dry": 4000.0, "isp_1sigma_frac": 0.01}

r1 = run_case(config, seed=7)
r2 = run_case(config, seed=7)
print("run 1:", r1)
print("run 2:", r2)
print("identical?", r1 == r2)

config_updated = dict(config, m_dry=4050.0)
r3 = run_case(config_updated, seed=7)
print()
print("run 3 (updated config, same seed):", r3)
print(f"dv difference from run 1: {r1['dv_m_s'] - r3['dv_m_s']:.3f} m/s")
print("config_hash differs:", r1["config_hash"], "vs", r3["config_hash"])
# run 1: {'config_hash': 'd0b48a5e1d44', 'seed': 7, 'dv_m_s': 6216.712651650013}
# run 2: {'config_hash': 'd0b48a5e1d44', 'seed': 7, 'dv_m_s': 6216.712651650013}
# identical? True
#
# run 3 (updated config, same seed): {'config_hash': '234c96b89df9', 'seed': 7, 'dv_m_s': 6183.1346873475495}
# dv difference from run 1: 33.578 m/s
# config_hash differs: d0b48a5e1d44 vs 234c96b89df9
```

Two calls with the identical configuration and seed return bit-identical results, exactly as the determinism lesson requires. The third call, with the mass update from the previous example, produces the same $33.6\,\mathrm{m/s}$ difference — but this time the result record carries a `config_hash` that changed alongside it, so the difference is explained the moment it is noticed rather than triggering a determinism investigation that would have found nothing. The hash is cheap to compute and costs nothing to store next to every result; what it buys is the difference between "the numbers moved, and here is exactly why" and "the numbers moved, and nobody can say why six months later."
:::

::: key Configuration management, in one line
Models, parameters and scenarios change far more often than code, for reasons unrelated to the code being wrong, and need their own versioning so that a result can be specified completely as (code version, configuration, scenario, seed). A headless batch interface that is a genuine pure function of its configuration and seed makes recording those two things, alongside every result, sufficient to reproduce it — turning a mystery discrepancy into an explained one.
:::

::: warning Treating a config file as informal, mutable scratch space
Editing a parameter file in place for a one-off test — "only to see" — with no record of the change, reproduces the exact failure mode the worked example demonstrated: the next person, or the same person a week later, gets a different result from what looks like the identical setup, and has no way to know a parameter was ever touched. A configuration file deserves the same version control discipline as code, even though it is reviewed far less formally and changes far more often.
:::

::: warning A batch interface that reads anything outside its own arguments
A headless entry point that reads an environment variable, a file at a fixed path, or a module-level global defined somewhere else in the codebase is not actually a pure function of `(config, seed)`, whatever its signature claims — it has a hidden third input that is not recorded anywhere in the result. The test is direct: could two calls with identical logged `(config, seed)` still disagree because something outside those two arguments was different between them? If yes, the interface has a gap in exactly the place this lesson is about.
:::

## Check yourself

::: check
Why does a $33.6\,\mathrm{m/s}$ discrepancy from an untracked dry-mass update look, on the surface, like the same kind of problem the determinism lesson addressed?
:::

::: answer
Both produce a small, plausible-looking numerical difference between two runs that are supposed to be "the same case" — the determinism lesson's reduction-order example moved a result at the twelfth significant figure, and this lesson's mass update moved one by half a percent, but in both cases the symptom is "identical setup, different answer." Without knowing a configuration file changed, an engineer would reasonably suspect a reduction-order or seeding bug and spend real effort chasing something that, in this case, does not exist.
:::

::: check
Why is it not sufficient to record only the code's version control commit hash alongside a simulation result?
:::

::: answer
The code commit hash specifies the equations and integration logic, but says nothing about which mass value, which sensor noise parameters, or which scenario definition were fed into that code for a specific run — all of which this lesson showed can change a result substantially with zero code change. Full reproducibility needs the code version, the configuration, the scenario and the seed together; any one of the four missing leaves the result unreproducible even with the other three in hand.
:::

::: check
In the `run_case` example, why does calling the function twice with the identical `config` dictionary and `seed` guarantee identical results, given that the function also draws a random number?
:::

::: answer
`run_case` creates its random generator from the `seed` argument alone, inside the function, with no state carried from any previous call — exactly the per-case, independently-seeded pattern the determinism lesson established. Because the function has no other source of variation (no global state, no wall-clock dependence), the identical `(config, seed)` pair produces the identical sequence of operations and therefore the identical draw and the identical result, every time.
:::

::: check
A batch interface reads a shared `random_seed_offset` global variable that a different part of the codebase sometimes modifies. Why does this violate the "pure function of config and seed" requirement even if the function's signature is `run_case(config, seed)`?
:::

::: answer
The signature promises that `config` and `seed` are the only two things that determine the result, but the global offset is a third, hidden input that is not part of either argument and is therefore never recorded when a result is logged. Two calls with identical logged `config` and `seed` values could still disagree if the global changed in between, which means the logged information is no longer sufficient to reproduce the result — exactly the gap this lesson's second warning describes.
:::

::: check
Why does hashing a configuration and storing that hash with every result cost so little relative to what it provides?
:::

::: answer
Computing a hash of a configuration dictionary is a cheap, essentially instantaneous operation compared with running an entire simulated case, so it adds negligible overhead to a campaign. What it buys is that any future discrepancy between two supposedly identical runs can be checked against the stored hashes in seconds — if the hashes differ, the configuration is the explanation and no further investigation is needed; if they match, a real code or determinism issue is worth pursuing, which is exactly the branch point the mass-update example needed and did not have.
:::

::: check
A programme keeps its simulation's source code under strict version control but treats its parameter files as informal spreadsheets edited directly by whoever needs a number changed. What specific capability from this module does that practice undermine, beyond the immediate risk of an untracked change?
:::

::: answer
It undermines the golden-file regression discipline from earlier in this module: a golden-file comparison is only meaningful if you know precisely which configuration produced the saved reference, and an informally-edited parameter file with no version history makes it impossible to say, months later, whether a golden-file diff reflects a code change, a deliberate parameter update, or an accidental edit nobody remembers making — collapsing three very different situations into one unexplainable red flag.
:::

## Summary

| Item | Statement |
| --- | --- |
| Models, parameters, scenarios | Change far more often than code, for reasons unrelated to code correctness — versioned separately, with their own history |
| Full specification of a result | Code version, configuration, scenario, and seed, together — any one missing breaks reproducibility |
| Worked case | A $50\,\mathrm{kg}$ untracked mass update produced a $33.6\,\mathrm{m/s}$ ($0.54\%$) difference indistinguishable, without a config record, from a determinism bug |
| Headless batch interface | A pure function of `(config, seed)` only — no hidden global state, no implicit external dependence |
| Result record | Logging the configuration's hash alongside every result turns a mystery discrepancy into an explained one, at negligible cost |
| The gap to test for | Could two calls with identical logged `(config, seed)` still disagree? If yes, something outside those two arguments is a hidden, unrecorded input |

This closes the module. You now have the architecture a GNC engineer actually lives inside: five separable boxes and the two-rate loop that ties them together; the frame and unit discipline that keeps a large simulation honest; models for environment, sensors, actuators, mass properties and structural and slosh dynamics, each inserted where it belongs; event detection that lands exactly where it should instead of stepping over it; the discipline of running genuine flight code through SIL, PIL and HIL rather than a stand-in; verification against analytic solutions and conservation laws, validation against test data, and a worked case showing precisely how a wrong simulation can look right until the correct check is asked of it; regression testing that survives a legitimate change; determinism that makes one case out of ten thousand findable again; performance that turns a campaign from days into minutes; and, now, the configuration discipline that makes every one of those results mean something specific. The next module takes this simulation and turns it into evidence at scale: verification, validation and the Monte Carlo campaign that a reliability claim actually has to stand on.
