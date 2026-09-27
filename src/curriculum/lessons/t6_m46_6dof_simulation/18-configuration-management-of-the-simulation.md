---
id: l18-configuration-management-of-the-simulation
title: Configuration management of the simulation
minutes: 20
covers:
  - "Configuration management of the sim: models, parameters and scenarios versioned separately from the code"
---

Think of a kitchen. The oven, the mixer and the cook stay the same from one day to the next. What changes is the recipe card: which cake, how much sugar, how many people it has to feed. If two cakes from the same kitchen taste different, the first thing you ask is not "is the oven broken?" It is "which recipe card did you use?" And that question only has an answer if somebody kept the cards and wrote on each cake which one it came from.

A simulation has the same split. The **code** is the kitchen: the integrator, the equations of motion, the plumbing between the five boxes. Everything this module has varied — a mass value, a sensor noise level, an event altitude, a random seed — lives on the recipe card. That card changes far more often than the code does. It needs its own discipline, for the same reason the last three lessons worked so hard on golden files, determinism and campaigns: a result is only reproducible, only comparable, only explainable when something moves, if you know exactly what produced it. The code's version alone does not tell you that.

This lesson is about the other half of the answer. It is called **configuration management** — keeping every input that is not code under its own version history, so that any result can be traced back to exactly what made it. It is the last piece of the simulation architecture, and the piece that lets a ten-thousand-case Monte Carlo be a change of recipe card rather than a rebuild of the kitchen.

## Three things that are not the code

The recipe card has three parts, and engineers keep them apart.

**Models** are the choice of which version of a piece of physics is switched on. Is the atmosphere the old single-scale-height fit, or the improved one from the golden-file lesson ($H = 7{,}000\,\mathrm{m}$ instead of $8{,}500\,\mathrm{m}$)? Is the magnetic field a simple dipole, or a full [[spherical-harmonic|spherical-harmonic]] model? The code contains all of these. The configuration says which one this run uses.

**Parameters** are the numbers fed into the chosen models: a dry mass, a sensor noise standard deviation, a thruster's minimum impulse bit, a specific impulse.

**Scenarios** are everything that defines one particular run: the initial conditions, which events are armed, the wind profile, the mission's timeline. "Engine out at 40 seconds into a worst-winter wind" is a scenario.

All three change constantly over a program's life, and almost never because the simulation's code was wrong:

- the vehicle's mass grows as its design matures;
- a sensor gets re-characterized on the test bench, and its noise numbers change;
- a new abort case gets added to the list of situations the team must test.

None of those is a code change. None of them should have to go through the same slow review that a change to the integrator gets. But every one of them changes the answers. So each of the three lives in its own file, with its own version history, separate from the source code. Together they make up the run's **configuration**.

::: key
Models, parameters and scenarios are versioned separately from the code. A result is specified completely only by four things together: **code version, configuration, scenario and seed**. Leave out any one and even someone with identical code cannot reproduce it.
:::

Here is what that looks like, with the three files shown as Python dictionaries. A small `resolve` function merges them into the one complete configuration a run receives. A scenario may override a baseline number — say, a lower specific impulse for a degraded-engine case.

```python
import json, hashlib

def config_hash(cfg):
    return hashlib.sha256(json.dumps(cfg, sort_keys=True).encode()).hexdigest()[:12]

# Three separate, separately versioned files (shown here as dictionaries)
models     = {"atmosphere": "exponential_H7000", "gravity": "J2", "imu": "tactical_grade_v3"}
parameters = {"m_dry": 4050.0, "m_prop0": 25000.0, "F": 800000.0, "Isp": 320.0}
scenario   = {"name": "engine_out_at_T+40s", "t_engine_out": 40.0, "wind_profile": "99pct_winter"}

def resolve(models, parameters, scenario, overrides=None):
    """Merge the layers into the one complete configuration a run receives."""
    cfg = {"models": models, "parameters": dict(parameters), "scenario": scenario}
    for key, value in (overrides or {}).items():
        cfg["parameters"][key] = value          # a scenario may override a baseline number
    return cfg

record = {
    "code_version": "a3f9c21",                  # the simulation's own commit
    "config_hash": config_hash(resolve(models, parameters, scenario)),
    "scenario": scenario["name"],
    "seed": 4217,
}
print(record)
print("resolved config with an Isp override:", resolve(models, parameters, scenario, {"Isp": 315.0})["parameters"])
# {'code_version': 'a3f9c21', 'config_hash': '7af68c8e4edc', 'scenario': 'engine_out_at_T+40s', 'seed': 4217}
# resolved config with an Isp override: {'m_dry': 4050.0, 'm_prop0': 25000.0, 'F': 800000.0, 'Isp': 315.0}
```

Look at the record at the bottom. It is the four-part label from the key block, stuck onto a result: which code, which configuration (as a short fingerprint), which scenario, which seed. The rest of this lesson is about why each part earns its place.

## Why "same code" is not "same result"

Skipping configuration management is not a far-fetched risk. It produces one particular symptom, and that symptom looks exactly like a problem this module has already spent a whole lesson on.

::: example A difference that looks like a determinism bug and is not one
The dry mass used all through this module is $4{,}000\,\mathrm{kg}$. A more mature **[[CAD model|cad]]** of the vehicle comes in, and the dry mass is refined to $4{,}050\,\mathrm{kg}$. It is a routine update. No code is touched. How much does the burnout speed change?

The stage carries $m_{\text{prop}} = 25{,}000\,\mathrm{kg}$ of propellant, and its engine has $I_{sp} = 320\,\mathrm{s}$. The **[[rocket equation|rocket-equation]]** gives the speed gained by burnout:

$$
\Delta v = I_{sp}\, g_0 \ln\!\left(\frac{m_0}{m_{\text{dry}}}\right), \qquad m_0 = m_{\text{dry}} + m_{\text{prop}}.
$$

Read $\Delta v$ as "delta v", the change in speed; $g_0 = 9.80665\,\mathrm{m/s^2}$ is standard gravity, and $\ln$ is the natural logarithm.

**Step 1: the exhaust factor.** $I_{sp}\, g_0 = 320 \times 9.80665 = 3{,}138.1\,\mathrm{m/s}$. It is the same for both runs.

**Step 2: the old mass.** $m_0 = 4{,}000 + 25{,}000 = 29{,}000\,\mathrm{kg}$. The ratio is $29{,}000 / 4{,}000 = 7.25$, and $\ln 7.25 = 1.981$. So $\Delta v = 3{,}138.1 \times 1.981 \approx 6{,}216.6\,\mathrm{m/s}$.

**Step 3: the new mass.** $m_0 = 4{,}050 + 25{,}000 = 29{,}050\,\mathrm{kg}$. The ratio is $29{,}050 / 4{,}050 = 7.173$, which gives $\Delta v \approx 6{,}183.1\,\mathrm{m/s}$.

**Step 4: the difference.** $6{,}216.6 - 6{,}183.1 = 33.6\,\mathrm{m/s}$, which is $0.54\%$ of the original.

The same thing in code:

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

**Sanity check.** A $1.25\%$ heavier dry mass ($50 / 4{,}000$) costs a bit under half that fraction of burnout speed. That makes sense: a heavier empty stage lowers the mass ratio, and the logarithm softens the effect. The note below turns this into a rule of thumb of about $0.68\,\mathrm{m/s}$ per kilogram, and $50 \times 0.68 = 34\,\mathrm{m/s}$ agrees.

Now picture the engineer who sees two runs of "the same case" disagree by $33.6\,\mathrm{m/s}$. After the determinism lesson, her first suspicion is a reduction-order effect, a shared random stream, or a stray uninitialized value. Every technique from that lesson would come up empty — correctly — because there is no determinism bug. The code is bit-exact. The seed is identical. The configuration changed quietly between the two runs. Without a record of which parameter file each run used, this $33.6\,\mathrm{m/s}$ is a mystery that looks like a far harder problem than it really is.
:::

::: note Why it has to be true: about 0.68 m/s per kilogram
Take the rocket equation and ask how $\Delta v$ changes when only $m_{\text{dry}}$ changes. Write $\ln(m_0/m_{\text{dry}}) = \ln m_0 - \ln m_{\text{dry}}$, where $m_0 = m_{\text{dry}} + m_{\text{prop}}$ also contains $m_{\text{dry}}$. The slope of $\ln x$ is $1/x$, so

$$
\frac{d\,\Delta v}{d m_{\text{dry}}} = I_{sp}\, g_0 \left(\frac{1}{m_0} - \frac{1}{m_{\text{dry}}}\right) = -\,I_{sp}\, g_0\, \frac{m_{\text{prop}}}{m_{\text{dry}}\, m_0}.
$$

The last step puts both fractions over the common bottom $m_{\text{dry}} m_0$, and the top becomes $m_{\text{dry}} - m_0 = -m_{\text{prop}}$. With the numbers: $3{,}138.1 \times 25{,}000 / (4{,}000 \times 29{,}000) \approx 0.676\,\mathrm{m/s}$ lost per kilogram. Times $50\,\mathrm{kg}$ gives $33.8\,\mathrm{m/s}$, within a few tenths of the exact $33.6\,\mathrm{m/s}$. The small gap is there because the slope itself shrinks a little as the mass grows.
:::

::: warning Treating a config file as scratch paper
Editing a parameter file in place for a one-off test — "only to see what happens" — with no record of the change, rebuilds the failure in the example. The next person, or you a week later, gets a different result from what looks like the identical setup, and has no way to know a number was ever touched. A configuration file deserves the same **[[version control|version-control]]** as code, even though it is reviewed far less formally and changes far more often.
:::

## The headless batch interface, and why it must be a pure function

The booster-simulation exercise for this module asks for a **headless batch entry point**. "Headless" means it runs with no screen, no plots and no person clicking buttons. A campaign driver calls it thousands of times, each time with a parameter dictionary and a seed, and each call returns a **result record** — a small bundle of the answers plus the labels that say where they came from.

The key design rule: that entry point must be a **[[pure function|pure-function]]** of exactly those two inputs. A pure function is one whose output depends only on the arguments you pass in, like a calculator key. It has no hidden global state and quietly reads nothing else.

This rule is what makes configuration management and determinism one discipline instead of two. If the only inputs are the configuration and the seed, then recording those two things next to every result is enough, by construction, to reproduce it. Nothing else can have mattered.

::: example A result record that explains itself
The function below is a toy version of the entry point. It computes the burnout $\Delta v$, then disperses it by a random $1\%$ standard deviation in specific impulse, drawn from a generator built from the seed. The record it returns carries a **[[hash|hash]]** of the configuration — a short fingerprint that changes whenever any value in the configuration changes.

```python
import numpy as np
import json, hashlib

def config_hash(cfg):
    return hashlib.sha256(json.dumps(cfg, sort_keys=True).encode()).hexdigest()[:12]

def run_case(config, seed):
    """Headless batch entry point: a pure function of (config, seed) only."""
    rng = np.random.default_rng(seed)
    g0 = 9.80665
    m0 = config["m_dry"] + config["m_prop0"]
    dv_nominal = config["Isp"]*g0*np.log(m0/config["m_dry"])
    dv_dispersed = dv_nominal*(1.0 + rng.normal(0, config["isp_1sigma_frac"]))
    return {"config_hash": config_hash(config), "seed": seed, "dv_m_s": float(dv_dispersed)}

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

same_keys_other_order = dict(reversed(list(config.items())))
print("key order changes the hash?", config_hash(same_keys_other_order) != r1["config_hash"])
# run 1: {'config_hash': 'd0b48a5e1d44', 'seed': 7, 'dv_m_s': 6216.712651650013}
# run 2: {'config_hash': 'd0b48a5e1d44', 'seed': 7, 'dv_m_s': 6216.712651650013}
# identical? True
#
# run 3 (updated config, same seed): {'config_hash': '234c96b89df9', 'seed': 7, 'dv_m_s': 6183.1346873475495}
# dv difference from run 1: 33.578 m/s
# config_hash differs: d0b48a5e1d44 vs 234c96b89df9
# key order changes the hash? False
```

Walk through what happened.

**Runs 1 and 2** use the identical configuration and seed. They return bit-identical records, exactly as the determinism lesson requires.

**Run 3** uses the mass update from the previous example, with the same seed. It moves by the same $33.6\,\mathrm{m/s}$. But this time the record's `config_hash` changed along with it: `d0b48a5e1d44` became `234c96b89df9`. The difference is explained the moment anyone notices it, instead of setting off a determinism hunt that would find nothing.

**The last line** checks that writing the same settings in a different order does not change the fingerprint. That is what `sort_keys=True` is for: it puts the names in alphabetical order before hashing, so only the *content* counts.

**Sanity check.** Run 1's $6{,}216.71\,\mathrm{m/s}$ sits $0.08\,\mathrm{m/s}$ above the undispersed $6{,}216.64\,\mathrm{m/s}$. A draw that small is well inside a $1\%$ spread (about $62\,\mathrm{m/s}$), so the dispersion is doing what it should.
:::

The hash costs almost nothing to compute and nothing to store next to every result. What it buys is the difference between "the numbers moved, and here is exactly why" and "the numbers moved, and six months later nobody can say why."

::: key
A headless batch interface that is a genuine pure function of its configuration and seed makes recording those two things, alongside every result, sufficient to reproduce it. Storing the configuration's hash in every result record turns a mystery discrepancy into an explained one: different hashes mean the configuration is the explanation; matching hashes mean a real code or determinism problem is worth chasing.
:::

::: warning A batch interface that reads anything outside its own arguments
An entry point that reads an **[[environment variable|environment-variable]]**, a file at a fixed path, or a global variable defined somewhere else in the codebase is not a pure function of `(config, seed)`, whatever its signature says. It has a hidden third input that no result record captures. The test is one question: could two calls with identical logged `(config, seed)` still disagree because something outside those two arguments was different? If yes, the interface has a gap in exactly the place this lesson is about.
:::

This is also what makes the module's promise come true: a ten-thousand-case **[[Monte Carlo campaign|monte-carlo-bridge]]** becomes a configuration change rather than a rewrite. The campaign driver builds ten thousand configurations — the baseline with dispersed parameters — hands each one and its per-case seed to the same pure function, and files away ten thousand self-explaining records.

## Check yourself

::: check
Why does a $33.6\,\mathrm{m/s}$ difference from an untracked dry-mass update look, on the surface, like the same kind of problem the determinism lesson dealt with?
:::

::: answer
Both show up as the same symptom: two runs that are supposed to be "the same case" give slightly different numbers. The determinism lesson's reduction-order example moved a result at the twelfth significant figure; this lesson's mass update moved one by half a percent. In both, the story is "identical setup, different answer." If nobody knows the configuration file changed, an engineer would reasonably suspect a reduction-order or seeding bug and spend real effort chasing something that, here, does not exist.
:::

::: check
Why is it not enough to record only the code's version-control commit hash alongside a simulation result?
:::

::: answer
The commit hash pins down the equations and the integration logic. It says nothing about which mass value, which sensor noise numbers or which scenario were fed into that code for a particular run — and this lesson showed each of those can change a result noticeably with zero code change. Full reproducibility needs the code version, the configuration, the scenario and the seed together. With any one of the four missing, the result cannot be reproduced even with the other three in hand.
:::

::: check
In the `run_case` example, the function draws a random number. Why do two calls with the identical `config` dictionary and `seed` still give identical results?
:::

::: answer
`run_case` builds its random generator from the `seed` argument alone, inside the function, with no state carried over from any earlier call. That is the per-case, independently seeded pattern from the determinism lesson. The function has no other source of variation — no global state, no dependence on the clock. So the same `(config, seed)` pair produces the same sequence of operations, the same random draw and the same result, every time.
:::

::: check
A batch interface reads a shared `random_seed_offset` global variable that another part of the codebase sometimes changes. Why does this break the "pure function of config and seed" rule, even though the function's signature is `run_case(config, seed)`?
:::

::: answer
The signature promises that `config` and `seed` are the only things that decide the result. The global offset is a third, hidden input. It is not part of either argument, so it is never recorded when a result is logged. Two calls with identical logged `config` and `seed` could still disagree if the global changed in between. The logged information is then no longer enough to reproduce the result — exactly the gap the second warning describes.
:::

::: check
Why does hashing a configuration and storing that hash with every result cost so little compared with what it provides?
:::

::: answer
Hashing a configuration dictionary takes a tiny fraction of a second, which is nothing next to running a whole simulated flight, so it adds no noticeable time to a campaign. What it buys is a fast first test for any future disagreement between two supposedly identical runs. Compare the stored hashes, which takes seconds. If they differ, the configuration is the explanation and no further digging is needed. If they match, a real code or determinism problem is worth chasing. That is exactly the fork in the road the mass-update example needed and did not have.
:::

::: check
A program keeps its simulation's source code under strict version control, but its parameter files are informal spreadsheets that anyone edits directly when they need a number changed. Beyond the obvious risk of an untracked change, which capability from this module does this undermine?
:::

::: answer
It undermines golden-file regression testing. A golden-file comparison only means something if you know exactly which configuration produced the saved reference. With an informally edited parameter file and no version history, nobody can say months later whether a golden-file difference came from a code change, a deliberate parameter update, or an accidental edit no one remembers. Three very different situations collapse into one red flag that cannot be explained.
:::

## Summary

| Idea | Meaning | Fact to carry away |
| --- | --- | --- |
| Models | Which version of each piece of physics is switched on | Chosen in the configuration, not by editing code |
| Parameters | The numbers fed into the chosen models | Change often as the design matures and hardware is tested |
| Scenarios | Everything that defines one particular run | Initial conditions, armed events, winds, timeline |
| Full specification of a result | The four-part label | Code version, configuration, scenario and seed together — any one missing breaks reproducibility |
| Worked case | An untracked $50\,\mathrm{kg}$ dry-mass update | $33.6\,\mathrm{m/s}$ ($0.54\%$) change in burnout $\Delta v$, easy to mistake for a determinism bug |
| Headless batch interface | Called by a campaign driver, no screen | A pure function of `(config, seed)` only — no hidden globals or outside reads |
| Result record | Answers plus their labels | Storing the configuration's hash turns a mystery discrepancy into an explained one, at almost no cost |
| The gap to test for | One question | Could two calls with identical logged `(config, seed)` still disagree? If yes, there is a hidden input |

This closes the module. You now have the architecture a GNC engineer really works inside: five separable boxes and the two-rate loop that ties them together; frame and unit discipline; models for environment, sensors, actuators, mass properties, slosh and flex, each inserted where it belongs; event detection that lands on a staging event instead of stepping over it; real flight code run through SIL, PIL and HIL; verification against analytic solutions and conservation laws; regression tests that survive a legitimate change; determinism that makes one case out of ten thousand findable again; performance that turns a campaign from days into minutes; and the configuration discipline that makes every one of those results mean something specific. The next module, **Verification, Validation and Monte Carlo Analysis**, takes this simulation and turns it into evidence at scale: a defensible dispersion set, a campaign large enough to support a reliability claim, and the verification matrix that ties every requirement to its proof.

::: context spherical-harmonic A field built from waves on a globe
A dipole field is the bar-magnet picture: one north pole, one south pole, a smooth pattern between them. The real Earth's field is lumpier. A spherical-harmonic model describes it as a sum of simple patterns on a sphere — first the dipole, then patterns with more and more lobes — each with a measured coefficient. The International Geomagnetic Reference Field is published this way and updated every five years. That update cycle is itself a configuration question: the code that sums the series stays the same, while the table of coefficients it reads changes.
:::

::: context cad Where a better mass number comes from
CAD stands for computer-aided design: the 3D software engineers use to draw every bracket, tank and bolt of the vehicle. Because each part in the drawing has a material and a volume, the software can add up the mass of the whole vehicle. Early in a program the drawing is rough and the mass is an estimate with generous allowances. As the design matures the drawing fills in, and the number is refined — usually upward. Later still, parts are weighed for real. Each of these updates is a parameter change, with no code involved.
:::

::: context rocket-equation The rocket equation, drawn
The rocket equation says the speed a stage can gain depends on the logarithm of its full-to-empty mass ratio. Here is burnout $\Delta v$ for this module's stage ($25{,}000\,\mathrm{kg}$ of propellant, $I_{sp} = 320\,\mathrm{s}$) as the dry mass varies from $3{,}500$ to $4{,}500\,\mathrm{kg}$. The two dots are the lesson's runs. The curve falls about $0.68\,\mathrm{m/s}$ for every extra kilogram near $4{,}000\,\mathrm{kg}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="175" x2="345" y2="175" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="20" x2="50" y2="175" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#6c7a93" stroke-width="0.8" stroke-dasharray="3 3">
    <line x1="50" y1="150" x2="345" y2="150"/><line x1="50" y1="110" x2="345" y2="110"/>
    <line x1="50" y1="70" x2="345" y2="70"/><line x1="50" y1="30" x2="345" y2="30"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="45" y="154">6000</text><text x="45" y="114">6200</text>
    <text x="45" y="74">6400</text><text x="45" y="34">6600</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="50" y="190">3500</text><text x="195" y="190">4000</text><text x="340" y="190">4500</text>
  </g>
  <text x="195" y="205" font-size="11" fill="#1f2a44" text-anchor="middle">dry mass (kg)</text>
  <text x="14" y="100" font-size="11" fill="#1f2a44" text-anchor="middle" transform="rotate(-90 14 100)">Δv (m/s)</text>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.2" points="50.0,33.8 64.5,41.6 79.0,49.3 93.5,56.8 108.0,64.3 122.5,71.6 137.0,78.8 151.5,85.9 166.0,93.0 180.5,99.9 195.0,106.7 209.5,113.4 224.0,120.0 238.5,126.5 253.0,133.0 267.5,139.3 282.0,145.6 296.5,151.8 311.0,157.9 325.5,163.9 340.0,169.9"/>
  <circle cx="195" cy="106.7" r="4" fill="#1f2a44"/>
  <circle cx="209.5" cy="113.4" r="4" fill="#b4232c"/>
  <text x="100" y="128" font-size="11" fill="#1f2a44">4000 kg: 6217</text>
  <text x="222" y="100" font-size="11" fill="#b4232c">4050 kg: 6183</text>
</svg>
```
:::

::: context version-control A history for every file
Version control is software that keeps every past version of a set of files, who changed what, when, and a message saying why. The most common tool is Git. Each saved snapshot, called a commit, gets its own identifying code, like `a3f9c21` in the lesson's record. Putting parameter and scenario files under version control does not mean every edit needs a big review. It means every edit leaves a trace you can find later, and any old result can be matched to the exact files that made it.
:::

::: context pure-function A vending machine, not a mood ring
A vending machine is a pure function: press B4, get the same snack, every time. A mood ring is not — it depends on the temperature of the room, an input nobody wrote down. A pure simulation entry point takes the configuration and the seed and nothing else. Anything it quietly reads from outside is a hidden input, and a hidden input is exactly what breaks reproduction.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="130" y="40" width="100" height="60" rx="8" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <text x="180" y="67" font-size="13" fill="#1f2a44" text-anchor="middle">run_case</text>
  <text x="180" y="84" font-size="11" fill="#6c7a93" text-anchor="middle">pure function</text>
  <text x="12" y="52" font-size="12" fill="#1d6fd1">config</text>
  <line x1="60" y1="55" x2="126" y2="60" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="129,60 120,55 120,65" fill="#1d6fd1"/>
  <text x="12" y="93" font-size="12" fill="#1d6fd1">seed</text>
  <line x1="50" y1="90" x2="126" y2="82" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="129,82 120,78 121,88" fill="#1d6fd1"/>
  <line x1="230" y1="70" x2="276" y2="70" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="282,70 272,65 272,75" fill="#1f2a44"/>
  <text x="287" y="66" font-size="12" fill="#1f2a44">result</text>
  <text x="287" y="81" font-size="12" fill="#1f2a44">record</text>
  <text x="180" y="138" font-size="12" fill="#b4232c" text-anchor="middle">global variable, env variable, fixed file</text>
  <line x1="180" y1="124" x2="180" y2="104" stroke="#b4232c" stroke-width="2" stroke-dasharray="4 3"/>
  <line x1="170" y1="108" x2="190" y2="120" stroke="#b4232c" stroke-width="2.5"/>
  <line x1="190" y1="108" x2="170" y2="120" stroke="#b4232c" stroke-width="2.5"/>
</svg>
```
:::

::: context hash A fingerprint for a file
A hash function turns any amount of data into a short, fixed-length code. SHA-256, used in the lesson, produces 64 hexadecimal characters. Change a single digit anywhere in the input and the code changes completely. The lesson keeps only the first 12 characters, which is 48 bits: about 280 trillion possible values, so two different configurations in the same project landing on the same short code is vanishingly unlikely. Git names its commits with hashes in the same way. The input is first turned into JSON text with the keys sorted, because the determinism lesson showed that the order a container lists its contents in is not something to lean on.
:::

::: context environment-variable Settings that hang in the air
An environment variable is a named setting that the operating system hands to every program it starts — for example `HOME`, or a made-up `SIM_ATMOSPHERE=new`. It is handy because nobody has to change the code or its arguments to use it. That is also the danger: the value lives in whoever's terminal launched the run, so it differs between laptops and cluster nodes, and it is not in the configuration file or the result record. If a setting matters to the answer, it belongs in the configuration.
:::

::: context monte-carlo-bridge Where this goes next
In the next module, a Monte Carlo campaign is a baseline configuration plus a dispersion set: a rule for drawing each uncertain parameter — mass, thrust, winds, sensor errors — from a justified distribution. Each case is one resolved configuration and one seed, fed to the pure entry point from this lesson. Because every record carries its configuration hash and seed, the one failed case out of ten thousand can be pulled out and replayed alone. The campaign then turns the pile of records into a claim: how often the vehicle succeeds, and with what confidence.
:::
