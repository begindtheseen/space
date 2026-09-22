---
id: l01-the-gnc-org-and-the-family-map
title: "The GNC org: why one title hides many jobs"
minutes: 19
covers:
  - the GNC org as SpaceX describes it: vehicle design, trajectory design and optimization, high-fidelity vehicle simulation, software and control algorithm development, plus launch and on-orbit operations support across multiple vehicle programs
---

Say "I want to work in GNC" to a recruiter at a company that flies several different vehicles, and you have told her almost nothing. GNC at a company like this is not a desk, a team, or even a single discipline — it is an organization spread across half a dozen programs, each with its own vehicle, its own flight regime, and its own idea of what a GNC engineer spends a Tuesday doing. A person who lands a landing-phase guidance law on a returning booster and a person who tunes momentum-desaturation logic for a fleet of communications satellites both carry a job title with the letters G, N and C in it. They do not do the same job, would not necessarily be good at each other's job, and in an interview loop would be asked almost entirely different questions.

This module exists to take that vague sentence apart. Across the lessons that follow, you will go family by family through the distinct GNC jobs a real company actually posts, in enough concrete detail that you can describe a week inside each one, name what gets built and what gets reviewed, and see exactly which pieces of your own study and your own projects count as evidence for which family. The method is the same one the module before this one used on the export-control gate: read what the postings actually say, quote it exactly where the exact wording matters, and generalize honestly only as far as the pattern actually reaches — never further, and never by inventing a number that was not there.

This first lesson does one job before the family-by-family tour begins: it takes the single sentence a company like SpaceX uses to describe its entire GNC organization, breaks it into its working parts, and gives you a vocabulary — six kinds of work that recur under almost any employer's naming — that the rest of the module will use to tag every family you meet from here on.

## What the org actually says it does

SpaceX's own description of its GNC organization, reproduced exactly as postings state it, reads like this:

> GNC teams at SpaceX are responsible for vehicle design, trajectory design and optimization, high-fidelity vehicle simulation, software and control algorithm development, while also supporting both launch and on-orbit operations across multiple vehicle programs.

Read quickly, that sentence sounds like a mission statement — the kind of paragraph a legal or recruiting team writes once and pastes across every posting without much thought. Read slowly, clause by clause, it is closer to a table of contents for this entire module, and worth taking apart piece by piece.

**Vehicle design** is GNC's seat at the table before a vehicle exists in hardware: sizing actuators so they can produce the torque and force a control law will actually demand of them, placing sensors where they can see what the control law needs to know, and arguing early — while a design decision is still cheap to change — that a proposed configuration is or is not controllable and observable in the flight regimes it needs to survive. It is influence over requirements, not authorship of a full mechanical design.

**Trajectory design and optimization** is the mission-design thread: choosing the path a vehicle flies from where it starts to where it needs to end up, subject to real constraints — propellant, structural loads, thermal limits, a launch window, a rendezvous geometry — and finding the version of that path that is fastest, cheapest in propellant, or safest under dispersion. This is a distinct skill from flying a chosen path well; it decides which path is worth flying in the first place.

**High-fidelity vehicle simulation** is the six-degree-of-freedom model of the real vehicle — mass properties, aerodynamics, actuator dynamics, sensor models, environmental disturbances — that every control law, every guidance algorithm, and every fault-response strategy gets tested against, thousands of times, before it is trusted with real hardware. It is a standing piece of infrastructure a whole organization depends on, not a one-off script somebody writes for a single study.

**Software and control algorithm development** is two things that are easy to blur together and worth holding apart: deriving the control or guidance law itself — the mathematics that decides what the vehicle should do — and turning that derivation into software that runs, correctly and on time, on real flight or ground computers. Some engineers do more of one than the other; some teams split the two explicitly into separate roles, which is exactly what you will see in the Falcon family two lessons from now.

**Launch and on-orbit operations support** is what happens after a design is finished and a vehicle is actually flying: GNC engineers staffing a console during a launch, watching telemetry against predictions in real time, and being the people called on when something diverges from what the simulation said would happen. It is a different kind of pressure from any of the design work above it — bounded in time, live, and unforgiving of a wrong answer given under a deadline measured in seconds.

::: key
SpaceX's own description of its GNC organization: "GNC teams at SpaceX are responsible for vehicle design, trajectory design and optimization, high-fidelity vehicle simulation, software and control algorithm development, while also supporting both launch and on-orbit operations across multiple vehicle programs."
:::

## Six kinds of work, under any employer's naming

The five clauses above are SpaceX's own words for its own organization, and the family names you will meet in the rest of this module — Starship, Falcon, Dragon, ADCS, and the rest — are SpaceX's own posting titles. Neither is universal. A smaller company, a different national space agency, or a company in an adjacent industry entirely will draw its organizational lines somewhere else, use different titles, and sometimes fold two of these clauses into one job or split one clause across three. What does travel, underneath any single employer's naming, is a smaller set of functions that any GNC organization of meaningful size ends up needing performed by somebody:

- **Analysis** — quantifying how a system behaves: a margin study, a sensitivity sweep, a trade between two design choices, a report that ends in a number and an uncertainty on that number.
- **Flight software** — turning a derived algorithm into code that runs correctly, deterministically, and on time on the actual computer that flies or operates the vehicle.
- **Simulation and V&V** — building and maintaining the models a design is tested against, and running the campaigns — Monte Carlo dispersion, edge cases, regression tests — that establish whether a design is good enough to trust.
- **Hardware-in-the-loop and test** — exercising real or representative hardware against the software that will fly it, catching the class of bug that a pure software simulation cannot see: timing, sensor noise the model does not capture, an actuator that does not quite behave like its data sheet.
- **Navigation and sensors** — figuring out where the vehicle actually is and how it is actually oriented, from noisy, partial, delayed measurements, which is a different problem from deciding what to do about it.
- **Mission design** — choosing the trajectory, timeline, or operational concept a mission will actually fly, before anyone asks how to fly it precisely.

Every family this module covers draws on more than one of these, in different proportions. A role that is almost entirely flight software and almost no navigation theory is a genuinely different job from one that is almost entirely navigation theory and comparatively little software — even if both postings say "GNC Engineer" in the title. Keeping this six-part vocabulary in view is what lets you compare two postings, from two different companies, that use completely different titles, and correctly recognize that they are actually close to the same job.

::: warning A shared title is not a shared job
"GNC Engineer" is the title on roles that are mostly flight-software implementation, roles that are mostly trajectory analysis, and roles that are mostly six-degree-of-freedom simulation work, sometimes within the same company. The title tells you almost nothing on its own. The responsibilities paragraph — the verbs it uses and the six-part mix they imply — is where the actual job is described, and it is the part of a posting worth reading twice.
:::

## The shape of the family map

Once you sort SpaceX's GNC postings by what they actually ask an engineer to do rather than by title alone, they cluster into three groups, and the rest of this module walks through them in this order:

**Vehicle families** own a single vehicle's powered flight, entry, or landing: GNC Engineer roles on Starship, Falcon, and Dragon, plus the newer Starfall program. These lean heavily on mission design, flight software, and simulation and V&V, with hardware-in-the-loop testing intensifying sharply as a vehicle's first flight approaches.

**Constellation families** own attitude, navigation, or pointing across a fleet of many identical or near-identical spacecraft rather than a single flown vehicle: ADCS, Navigation and State Estimation, Embedded Controls, and Beam Pointing, all on Starlink and, in places, Starshield. These lean on navigation and sensors and on analysis that has to hold up not for one vehicle on one day, but across a fleet running for years.

**Infrastructure families** build the tools the other two groups run on rather than flying anything themselves: Software Engineer, GNC and Operations Automation roles, and Site Reliability Engineer, GNC. These lean almost entirely on software engineering and systems skill, with comparatively little of the control-theory or orbital-mechanics depth the vehicle and constellation families require.

Research across 2026 postings turns up nine distinct families across these three groups, with Starfall and a newer program called Starmind appearing as still-forming additions — new enough that their postings describe a program rather than a fully settled job ladder. "At least nine," not "exactly nine," is the honest way to say it, because a program this young keeps adding postings as it matures.

::: example Reading one responsibilities paragraph against the six-part vocabulary
Suppose a posting's responsibilities section reads: "Design and implement guidance algorithms for entry and powered descent; develop and maintain six-degree-of-freedom simulation capability for the vehicle; support flight readiness reviews and provide real-time console support during flight." Nothing here has been assigned to a company or a program yet — the exercise is to read the sentence itself.

"Design... guidance algorithms" is mission design and analysis: deriving and evaluating the trajectory and control logic. "Implement" pulls in flight software: the derived algorithm has to become code that runs on the real computer. "Develop and maintain six-degree-of-freedom simulation capability" is simulation and V&V, stated almost word for word. "Flight readiness reviews" is where hardware-in-the-loop and test results get presented and judged before a decision to fly. "Real-time console support during flight" is operations, the sixth thread SpaceX's own org description names separately. One paragraph, four of the six categories, and not one sentence in it was navigation-and-sensors-heavy — which by itself tells you this is probably a vehicle-family posting rather than a constellation one, before you have read a single word about which program it belongs to.
:::

::: example Two postings, same two words in the title, different jobs
A posting titled "GNC Engineer" describes responsibilities centered on deriving and validating a landing guidance law for a launch vehicle booster, working primarily in a six-degree-of-freedom simulation environment, with a preferred qualification in optimal control and trajectory optimization. A second posting, also titled "GNC Engineer," describes responsibilities centered on tuning reaction-wheel control loops and monitoring momentum accumulation across an operating satellite fleet, with a preferred qualification in Kalman filtering and spacecraft attitude dynamics.

Nothing distinguishes these two roles in the title. Everything distinguishes them in the responsibilities paragraph and the preferred-qualifications list: one is a vehicle family, entry- and landing-heavy, drawing on trajectory optimization and 6-DOF simulation; the other is a constellation family, drawing on attitude dynamics and estimation across a fleet rather than a single flight. A candidate who prepared a portfolio around landing guidance and applied confidently to the second posting on the strength of the shared title alone would walk into a technical screen that tests almost none of what she built.
:::

## Check yourself

::: check
State, as close to verbatim as you can, the sentence SpaceX uses to describe what its GNC teams are responsible for.
:::

::: answer
"GNC teams at SpaceX are responsible for vehicle design, trajectory design and optimization, high-fidelity vehicle simulation, software and control algorithm development, while also supporting both launch and on-orbit operations across multiple vehicle programs."
:::

::: check
"Trajectory design and optimization" and "software and control algorithm development" can both sound like "doing analysis" in casual conversation. Explain why the org description keeps them as separate clauses.
:::

::: answer
Trajectory design and optimization decides which path the vehicle should fly at all — the mission-design question, evaluated against constraints like propellant, structural loads and timing, before anyone asks how to fly that path precisely. Software and control algorithm development is a different pair of problems: deriving the control or guidance law that flies a chosen path well, and then turning that derivation into software that runs correctly and on time on a real computer. A vehicle can have an excellent chosen trajectory and a poorly implemented control law, or the reverse, so treating the two as one activity would hide exactly the distinction that matters when you are trying to work out what a given role actually spends its time on.
:::

::: check
A posting's responsibilities paragraph reads: "Own the orbit determination filter for the constellation; investigate estimation anomalies flagged by ground operations; deliver navigation solutions meeting a stated accuracy requirement." Which two of the six generic categories does this role draw on most, and which is barely present?
:::

::: answer
This role draws heavily on navigation and sensors — the filter, the accuracy requirement, and the anomaly investigation are all state-estimation work — and on analysis, since "meeting a stated accuracy requirement" means the engineer has to quantify performance and defend it with numbers. Flight software is barely present: nothing in the paragraph describes implementing or maintaining real-time flight code, which suggests this role is closer to owning an estimation algorithm and its performance than to shipping and maintaining the software it runs inside.
:::

::: check
Why is "at least nine" a more honest way to count SpaceX's GNC role families than a fixed number like "exactly nine"?
:::

::: answer
The count is drawn from a research pass over live postings at one point in time, and newer programs — Starfall and Starmind among them — are young enough that their postings describe a program still taking shape rather than a settled, permanent job ladder. A fixed count would imply the roster is closed; "at least nine" states what was actually observed while leaving room for the fact that a growing organization adds families faster than any snapshot of it can be kept current.
:::

::: check
Name the three groupings this lesson sorts the family map into, and state which generic category — from the six named earlier — is close to absent from the infrastructure group.
:::

::: answer
The three groupings are vehicle families (single-vehicle powered flight, entry, or landing, such as Starship, Falcon, Dragon, and Starfall), constellation families (attitude, navigation, or pointing across a fleet, such as ADCS and Navigation and State Estimation on Starlink and Starshield), and infrastructure families (the tools the other two groups run on, such as Software Engineer, GNC and Site Reliability Engineer, GNC). Mission design is close to absent from the infrastructure group: those roles build pipelines, tooling, and computing infrastructure rather than deciding what trajectory or operational concept a vehicle or constellation should fly.
:::

## Summary

| Generic category | What it produces | SpaceX org clause it maps to |
| --- | --- | --- |
| Analysis | A margin study, a trade, a number with an uncertainty on it | Trajectory design and optimization; software and control algorithm development |
| Flight software | Code that runs correctly and on time on a real computer | Software and control algorithm development |
| Simulation and V&V | A maintained 6-DOF model and the campaigns run against it | High-fidelity vehicle simulation |
| Hardware-in-the-loop and test | Evidence that software behaves correctly against real or representative hardware | Vehicle design; supports launch and on-orbit operations |
| Navigation and sensors | An estimate of where the vehicle is and how it is oriented, from noisy data | Vehicle design (sensor placement); implicit across all programs |
| Mission design | The chosen trajectory, timeline, or operational concept | Trajectory design and optimization |

Nine lessons follow, one family or closely related pair of families at a time, each one naming what a week actually looks like, what gets produced and reviewed, and which of this curriculum's modules it leans on hardest. The next lesson starts where the org description's example above pointed: Starship, the family built around ascent, entry, and landing control on the largest vehicle SpaceX has ever flown.
