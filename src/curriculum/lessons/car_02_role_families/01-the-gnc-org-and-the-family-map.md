---
id: l01-the-gnc-org-and-the-family-map
title: "The GNC org: why one title hides many jobs"
minutes: 22
covers:
  - the GNC org as SpaceX describes it: vehicle design, trajectory design and optimization, high-fidelity vehicle simulation, software and control algorithm development, plus launch and on-orbit operations support across multiple vehicle programs
---

Imagine telling someone, "When I grow up, I want to be a doctor." That is a fine start. But a heart surgeon, a children's doctor and a doctor who reads X-rays all day have very different jobs. They trained differently, they spend their Tuesdays differently, and none of them could walk into the others' job tomorrow.

**GNC** — said letter by letter, "G-N-C" — works the same way. It stands for **[[guidance, navigation and control|gnc-letters]]**: deciding where a vehicle should go, working out where it actually is, and making it get there. Say "I want to work in GNC" to a **[[recruiter|recruiter]]** at a company that flies several different vehicles, and you have told her almost nothing. At a company like SpaceX, GNC is not one desk or one team. It is an organization spread across half a dozen programs. Each program has its own vehicle, its own kind of flight, and its own idea of what a GNC engineer does all day.

Here is how different two GNC jobs can be. One engineer designs the rules that steer a returning rocket booster onto a landing pad. Another tunes the software that keeps a fleet of communication satellites pointed the right way. Both have the letters G, N and C in their job title. They do not do the same job. They would not automatically be good at each other's job. In an interview, they would be asked almost entirely different questions.

This module takes the vague sentence "I want to work in GNC" apart. Lesson by lesson, you will visit each distinct kind of GNC job — each **role family**, meaning a group of jobs that share the same kind of work — in enough detail to describe a week inside it. You will also learn which of your own projects count as proof for which family. The method is the previous module's: read what real postings say, quote them exactly when the words matter, and never claim more than they support.

This first lesson takes the one sentence SpaceX uses to describe its whole GNC organization, breaks it into parts, and gives you six words for kinds of work that the rest of the module uses to sort every family.

## What the org says it does

A **[[job posting|job-posting]]** is the public advertisement for an open job. SpaceX's GNC postings describe the GNC organization — the "org", for short — with one sentence. Here it is exactly:

> GNC teams at SpaceX are responsible for vehicle design, trajectory design and optimization, high-fidelity vehicle simulation, software and control algorithm development, while also supporting both launch and on-orbit operations across multiple vehicle programs.

Read fast, it sounds like a slogan. Read slowly, it is a table of contents for this whole module.

### Vehicle design

Before a rocket exists as metal, somebody has to decide how big its steering parts are and where its sensors go. **Vehicle design**, for GNC, means having a seat at that table early.

- It means sizing the **actuators** — the parts that push or twist the vehicle, like engines that swivel or fins that tilt — so they can deliver the force the control software will ask for.
- It means placing the **sensors** — the parts that measure, like gyroscopes and cameras — where they can see what the software needs to know.
- It means arguing, while changes are still cheap, whether a design is **[[controllable and observable|controllable-observable]]**: whether you can steer it, and whether you can tell what it is doing.

GNC does not draw the whole machine. It shapes the requirements the machine must meet.

### Trajectory design and optimization

A **trajectory** is the path a vehicle flies. **Trajectory design and optimization** means choosing that path, from where the vehicle starts to where it must end up, and finding the best version of it.

"Best" depends on the limits you face. Think of planning a road trip: you might want the fastest route, the one that uses the least gas, or the one that avoids a scary mountain road. A rocket faces limits too — how much propellant it carries, how hard the air can push on its structure, how hot it can get, when the launch window opens, where the space station will be. Optimization finds the path that is fastest, uses the least propellant, or is safest when things vary a little.

This is a different skill from flying a chosen path well. It decides which path is worth flying at all.

### High-fidelity vehicle simulation

A **simulation** is a computer model of the vehicle that you can fly as many times as you like without risking anything. **High-fidelity** means it is very close to the real thing. It includes the vehicle's mass and how that mass is spread out, how air pushes on it, how quickly the actuators respond, how noisy the sensors are, and the winds and other disturbances it will meet.

It is usually a **[[6-DOF|six-dof]]** model — said "six-D-O-F" or "six degrees of freedom". That means it tracks all six ways a body can move: three ways to slide and three ways to turn.

Every control law, every guidance rule and every plan for handling a failure is tested against this model, thousands of times, before anyone trusts it with real hardware. The simulation is a permanent tool the whole organization depends on.

### Software and control algorithm development

This clause holds two jobs that are easy to blur together.

1. **Deriving the algorithm.** An **algorithm** is a step-by-step recipe. A **control law** or **guidance law** is the mathematical recipe that decides what the vehicle should do at each instant.
2. **Writing the software.** That recipe must become code that runs correctly, and on time, on the real computers that fly the vehicle or support it from the ground.

Some engineers do more of the first; some do more of the second. Some teams split the two into separate job titles. You will see exactly that on Falcon, two lessons from now.

### Launch and on-orbit operations support

This is what happens once the design is finished and the vehicle is actually flying. GNC engineers sit **[[on console|on-console]]** during a launch. They watch live data from the vehicle against what the simulation predicted, and they are the people called when the two disagree.

It is live, short and unforgiving: a wrong answer given in seconds can matter.

::: key
SpaceX's own description of its GNC organization: "GNC teams at SpaceX are responsible for vehicle design, trajectory design and optimization, high-fidelity vehicle simulation, software and control algorithm development, while also supporting both launch and on-orbit operations across multiple vehicle programs."
:::

## Six kinds of work, under any employer's naming

The five clauses above are SpaceX's words for SpaceX's organization. The family names coming later in this module — Starship, Falcon, Dragon, ADCS and the rest — are SpaceX's job titles. Neither is universal.

Another company or a space agency will draw its lines elsewhere, use different titles, and may fold two clauses into one job or split one across three.

What does travel from company to company is a smaller set of **functions** — kinds of work that any sizable GNC organization needs somebody to do. There are six:

- **Analysis** — measuring how a system behaves, with numbers. A margin study (how close are we to a limit?), a sweep (what happens if this changes?), a trade (which of two designs is better?). It ends in a number and an uncertainty on that number.
- **Flight software** — turning a derived algorithm into code that runs correctly, the same way every time, and on time, on the computer that actually flies or operates the vehicle.
- **Simulation and V&V** — building and maintaining the models a design is tested against, and running the test campaigns. **V&V**, said "V and V", means **verification and validation**: checking you built the thing right, and checking you built the right thing. The campaigns include **[[Monte Carlo|monte-carlo]]** runs (thousands of simulated flights, each with slightly different random conditions), edge cases and regression tests.
- **Hardware-in-the-loop and test** — connecting real or realistic hardware to the software that will fly it. This catches bugs a pure simulation cannot see: timing problems, sensor noise the model missed, an actuator that does not quite match its data sheet.
- **Navigation and sensors** — working out where the vehicle is and which way it is pointing, from measurements that are noisy, partial and late. That is a different problem from deciding what to do about it.
- **Mission design** — choosing the trajectory, timeline or plan of operations a mission will fly, before anyone asks how to fly it precisely.

Every family in this module mixes several of these, in different amounts. A job that is nearly all flight software and almost no navigation theory is a genuinely different job from one that is nearly all navigation theory and little software — even if both postings say "GNC Engineer".

This six-part vocabulary is your translator: with it, two postings with completely different titles can be recognized as close to the same job.

::: warning A shared title is not a shared job
"GNC Engineer" is the title on jobs that are mostly flight-software writing, jobs that are mostly trajectory analysis, and jobs that are mostly 6-DOF simulation work — sometimes inside the same company. The title alone tells you very little. The responsibilities paragraph describes the actual job. Its verbs, and the mix of the six kinds of work they point to, are the part of a posting worth reading twice.
:::

## The shape of the family map

Sort SpaceX's GNC postings by what they actually ask an engineer to do, not by their titles, and they fall into three groups. The rest of this module visits them in this order.

**Vehicle families** own one vehicle's powered flight, **entry** (coming back down through the atmosphere) or landing. These are the GNC Engineer roles on **Starship**, **Falcon** and **Dragon**, joined by the newer **Starfall** program. They lean on mission design, flight software, and simulation and V&V. Hardware-in-the-loop testing ramps up sharply as a vehicle's first flight gets close.

**Constellation families** own the pointing, navigation or steering of a whole fleet of nearly identical satellites, instead of one vehicle. A **constellation** here is a large group of satellites working together — above all **Starlink**, SpaceX's internet satellites, and in places **[[Starshield|starshield]]**, its government version. The four families are **ADCS** (attitude determination and control), **Navigation and State Estimation**, **Embedded Controls** and **Beam Pointing**. They lean on navigation and sensors, and on analysis that must hold up not for one vehicle on one day but across a fleet for years.

**Infrastructure families** build the tools the other two groups run on. They do not fly anything themselves. These are **Software Engineer, GNC** (with the related Operations Automation roles) and **Site Reliability Engineer, GNC**. They lean almost entirely on software engineering and computer-systems skill, with much less of the control theory and orbital mechanics the other groups need.

Count them up: three vehicle families, four constellation families and two infrastructure families make nine. That matches what research across 2026 postings found: **[[at least nine distinct families|family-map]]**. Starfall, and a newer program called **Starmind**, show up as additions still taking shape — new enough that their postings describe a program more than a settled ladder of jobs.

Why "at least nine"? Because the count is a snapshot, and new programs keep appearing. "At least" says what was seen without pretending the list is closed.

::: key
Nine role families, in three groups:
- Vehicle: GNC Engineer on Starship, Falcon (including Sr. GNC Software Engineer) and Dragon — with Starfall as a newer addition.
- Constellation (Starlink, and in places Starshield): ADCS; Navigation and State Estimation; Starlink Controls and Embedded Controls; Device Navigation and Beam Pointing.
- Infrastructure: Software Engineer, GNC and Operations Automation; Site Reliability Engineer, GNC.
:::

::: example Reading one responsibilities paragraph with the six-part vocabulary
Suppose a posting's responsibilities section says: "Design and implement guidance algorithms for entry and powered descent; develop and maintain six-degree-of-freedom simulation capability for the vehicle; support flight readiness reviews and provide real-time console support during flight."

Do not look for a company or program name yet. Read only the verbs, one phrase at a time.

1. "Design... guidance algorithms" — this is **mission design and analysis**: deriving and judging the trajectory and control logic.
2. "Implement" — this pulls in **flight software**: the recipe has to become code that runs on the real computer.
3. "Develop and maintain six-degree-of-freedom simulation capability" — this is **simulation and V&V**, almost word for word.
4. "Support **[[flight readiness reviews|flight-readiness-review]]**" — this is where **hardware-in-the-loop and test** results are shown and judged before anyone decides to fly.
5. "Real-time console support during flight" — this is **operations**, the thread SpaceX's org sentence names on its own.

Tally: one paragraph touches four of the six categories, plus operations. Not one phrase is about navigation and sensors.

Sanity check: entry, powered descent and one vehicle's simulation are all things a single flying vehicle does. So this is very likely a vehicle-family posting, not a constellation one — and you worked that out before reading a word about which program it belongs to.
:::

::: example Two postings, same two words in the title, different jobs
Posting A is titled "GNC Engineer". Its responsibilities center on deriving and testing a landing guidance law for a rocket booster, working mainly in a 6-DOF simulation. Its **preferred qualifications** — the "nice to have" list — ask for optimal control and trajectory optimization.

Posting B is also titled "GNC Engineer". Its responsibilities center on tuning **reaction-wheel** control loops (spinning wheels that turn a satellite) and watching how **momentum** builds up across a fleet of operating satellites. Its preferred qualifications ask for Kalman filtering (a standard method for estimating a state from noisy measurements) and spacecraft attitude dynamics.

Step 1: compare the titles. Identical. They tell you nothing.

Step 2: compare the responsibilities. A is about one vehicle's entry and landing. B is about keeping a whole fleet pointed.

Step 3: compare the preferred qualifications. A wants trajectory optimization and 6-DOF simulation. B wants attitude dynamics and estimation.

Result: A is a vehicle family; B is a constellation family.

A candidate with a landing-guidance portfolio who applied to B because the titles match would face a technical interview testing almost none of what she built. The responsibilities would have warned her; the title could not.
:::

## Check yourself

::: check
State, as close to word for word as you can, the sentence SpaceX uses to describe what its GNC teams are responsible for.
:::

::: answer
"GNC teams at SpaceX are responsible for vehicle design, trajectory design and optimization, high-fidelity vehicle simulation, software and control algorithm development, while also supporting both launch and on-orbit operations across multiple vehicle programs."
:::

::: check
"Trajectory design and optimization" and "software and control algorithm development" can both sound like "doing analysis" in casual talk. Explain why the org description keeps them as separate clauses.
:::

::: answer
Trajectory design and optimization decides which path the vehicle should fly at all. It is the mission-design question, judged against limits like propellant, structural loads and timing, before anyone asks how to fly that path precisely. Software and control algorithm development is a different pair of problems: deriving the control or guidance law that flies a chosen path well, and then turning that law into software that runs correctly and on time on a real computer. A vehicle can have an excellent chosen trajectory and a poorly built control law, or the reverse. Treating the two as one activity would hide exactly the difference that matters when you are working out what a given job spends its time on.
:::

::: check
A posting's responsibilities read: "Own the orbit determination filter for the constellation; investigate estimation anomalies flagged by ground operations; deliver navigation solutions meeting a stated accuracy requirement." Which two of the six generic categories does this job draw on most, and which one is barely present?
:::

::: answer
It draws most on **navigation and sensors** — the filter, the accuracy requirement and the anomaly investigations are all about estimating where things are. It also draws heavily on **analysis**, because "meeting a stated accuracy requirement" means the engineer must measure performance and defend it with numbers. **Flight software** is barely present: nothing in the paragraph is about writing or maintaining real-time flight code. So this job is closer to owning an estimation algorithm and its performance than to shipping the software it runs inside.
:::

::: check
Why is "at least nine" a more honest way to count SpaceX's GNC role families than "exactly nine"?
:::

::: answer
The count comes from a research pass over live postings at one moment in time. Newer programs — Starfall and Starmind among them — are young enough that their postings describe a program still taking shape, not a settled, permanent ladder of jobs. A fixed count would suggest the list is closed. "At least nine" states what was actually seen, while leaving room for a growing organization that adds families faster than any snapshot can keep up with.
:::

::: check
Name the three groups this lesson sorts the family map into, and say which of the six generic categories is close to absent from the infrastructure group.
:::

::: answer
The three groups are **vehicle families** (one vehicle's powered flight, entry or landing: Starship, Falcon, Dragon, and the newer Starfall), **constellation families** (attitude, navigation or pointing across a fleet: ADCS, Navigation and State Estimation, Embedded Controls and Beam Pointing on Starlink and Starshield), and **infrastructure families** (the tools the other two groups run on: Software Engineer, GNC and Site Reliability Engineer, GNC). **Mission design** is close to absent from the infrastructure group. Those roles build pipelines, tools and computing systems; they do not decide what trajectory or plan of operations a vehicle or constellation should fly.
:::

## Summary

| Generic category | What it produces | SpaceX org clause it maps to |
| --- | --- | --- |
| Analysis | A margin study, a trade, a number with an uncertainty on it | Trajectory design and optimization; software and control algorithm development |
| Flight software | Code that runs correctly and on time on a real computer | Software and control algorithm development |
| Simulation and V&V | A maintained 6-DOF model and the test campaigns run against it | High-fidelity vehicle simulation |
| Hardware-in-the-loop and test | Proof that software behaves correctly with real or realistic hardware | Vehicle design; supports launch and on-orbit operations |
| Navigation and sensors | An estimate of where the vehicle is and how it is pointed, from noisy data | Vehicle design (sensor placement); present across all programs |
| Mission design | The chosen trajectory, timeline or plan of operations | Trajectory design and optimization |

| Group | Families |
| --- | --- |
| Vehicle | Starship; Falcon; Dragon; plus the newer Starfall |
| Constellation | ADCS; Navigation and State Estimation; Embedded Controls; Beam Pointing |
| Infrastructure | Software Engineer, GNC and Operations Automation; Site Reliability Engineer, GNC |

Nine lessons follow, one family or a close pair of families at a time. Each names what a week looks like, what gets built and reviewed, and which parts of this course it leans on hardest. The next lesson starts with Starship: the family built around ascent, entry and landing control on the largest vehicle SpaceX has ever flown. Keep the six categories handy: every family from here on is described in their terms, and they also line up with [[the technical tracks of this course|course-bridge]].

::: context gnc-letters What the three letters do
The three letters are three questions a vehicle answers many times every second. **Navigation**: where am I, how fast am I going, and which way am I pointing? **Guidance**: given that, where should I go next? **Control**: how do I move the engines, fins or wheels to make that happen? Then the vehicle moves, the sensors measure again, and the loop repeats.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="8" y="16" width="104" height="48" rx="6" fill="#ffffff" stroke="#1d6fd1" stroke-width="2"/>
  <rect x="128" y="16" width="104" height="48" rx="6" fill="#ffffff" stroke="#1d6fd1" stroke-width="2"/>
  <rect x="248" y="16" width="104" height="48" rx="6" fill="#ffffff" stroke="#1d6fd1" stroke-width="2"/>
  <rect x="128" y="110" width="104" height="44" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <g font-size="13" fill="#1f2a44" text-anchor="middle" font-weight="700">
    <text x="60" y="36">Navigation</text><text x="180" y="36">Guidance</text><text x="300" y="36">Control</text>
    <text x="180" y="137">Vehicle</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="60" y="54">Where am I?</text><text x="180" y="54">Where to go?</text><text x="300" y="54">Make it happen</text>
  </g>
  <g stroke="#1f2a44" stroke-width="2" fill="none">
    <line x1="112" y1="40" x2="124" y2="40"/><line x1="232" y1="40" x2="244" y2="40"/>
    <polyline points="300,64 300,132 236,132"/>
    <polyline points="128,132 60,132 60,68"/>
  </g>
  <g fill="#1f2a44">
    <polygon points="128,40 120,35 120,45"/><polygon points="248,40 240,35 240,45"/>
    <polygon points="232,132 240,127 240,137"/><polygon points="60,64 55,72 65,72"/>
  </g>
  <text x="318" y="100" font-size="11" fill="#b4232c" text-anchor="middle">actuators</text>
  <text x="40" y="100" font-size="11" fill="#b4232c" text-anchor="middle">sensors</text>
</svg>
```
:::

::: context recruiter Who the recruiter is
A **recruiter** is the person at a company whose job is to find and screen candidates for open jobs. Recruiters are usually not engineers themselves. They handle many different openings at once and route each applicant toward the team that fits. That is exactly why a vague answer hurts you: if you say only "GNC", the recruiter has to guess which of many teams to send you to. A specific answer — a program, a flight phase, a problem — tells her where you belong in one sentence.
:::

::: context job-posting How a posting is laid out
Most engineering postings follow the same pattern. The **title** comes first, and it is the least informative part. Then a **responsibilities** section says what you will do; the verbs there describe the real job. **Basic qualifications** are the must-haves; without them an application is usually screened out. **Preferred qualifications** are the nice-to-haves that make a candidate stand out. Read the middle two sections most carefully.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="60" y="8" width="180" height="184" rx="6" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <rect x="72" y="18" width="156" height="24" rx="3" fill="#6c7a93"/>
  <text x="150" y="35" font-size="12" fill="#ffffff" text-anchor="middle">Title</text>
  <rect x="72" y="52" width="156" height="56" rx="3" fill="#1d6fd1"/>
  <text x="150" y="84" font-size="12" fill="#ffffff" text-anchor="middle">Responsibilities</text>
  <rect x="72" y="116" width="156" height="32" rx="3" fill="#8fb8f0"/>
  <text x="150" y="136" font-size="12" fill="#1f2a44" text-anchor="middle">Basic qualifications</text>
  <rect x="72" y="156" width="156" height="28" rx="3" fill="#f2b880"/>
  <text x="150" y="174" font-size="12" fill="#1f2a44" text-anchor="middle">Preferred qualifications</text>
  <g font-size="11" fill="#1f2a44">
    <text x="248" y="35">tells you little</text>
    <text x="248" y="80">the real job:</text><text x="248" y="94">read twice</text>
    <text x="248" y="136">must-haves</text>
    <text x="248" y="174">stand-outs</text>
  </g>
</svg>
```
:::

::: context controllable-observable Can you steer it, and can you see it?
Engineers use two exact words here. A system is **controllable** if its actuators can push it into any state you need — every way it can move can be reached by something you can command. It is **observable** if its sensors let you work out everything about its state, even the parts you cannot measure directly. A car with no steering wheel is not controllable sideways. A car with no speedometer and no windows is hard to observe. Both properties are much cheaper to fix on paper than after the hardware is built, which is why GNC wants a say early.
:::

::: context six-dof Six ways to move
Hold a pencil in the air. You can slide it forward and back, left and right, and up and down: three ways to move from place to place. You can also turn it three ways: tip its nose up or down (**pitch**), swing its nose left or right (**yaw**), and spin it around its long axis (**roll**). Three slides plus three turns make six **degrees of freedom**. A 6-DOF simulation tracks all six at once, which is what you need for a real rocket, whose turning and moving affect each other.
:::

::: context on-console Sitting on console
A **console** is a desk of screens in a control room. "On console" means you are one of the people staffing a live operation, watching **telemetry** — the stream of measurements the vehicle radios down — and comparing it with predictions. Each seat has a narrow job and a call sign, and people speak on a shared voice loop in short, precise phrases. Being useful there means knowing your system so well that you can tell in seconds whether an odd number is harmless or dangerous.
:::

::: context monte-carlo Why it is called Monte Carlo
Monte Carlo is a famous casino in Monaco. Scientists at Los Alamos in the 1940s gave the name to a method that uses random numbers — like rolls of dice — to study problems too messy to solve with one clean formula. In GNC, a Monte Carlo campaign flies the simulation thousands of times, and each run draws slightly different winds, sensor errors and engine performance at random. The share of runs that succeed tells you how often the real vehicle is likely to succeed. The infrastructure families later in this module run the large computer clusters these campaigns need.
:::

::: context starshield Starlink's government sibling
**Starshield** is SpaceX's line of satellites and services for government customers, built on the same technology as Starlink. Its work is often restricted, which affects who can do it: jobs on it may need a security clearance or US-person status, the kind of gate the previous module covered. For this module, the useful point is that Starshield mostly reuses the same technical families — ADCS, navigation, pointing — in a more restricted setting, rather than creating new kinds of GNC work.
:::

::: context family-map The nine families on one page
Nine established families sit under the GNC organization in three groups. The dashed box marks Starfall, a newer vehicle program still taking shape.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 214" font-family="Inter, Arial, sans-serif">
  <rect x="130" y="4" width="100" height="26" rx="5" fill="#1f2a44"/>
  <text x="180" y="22" font-size="12" fill="#ffffff" text-anchor="middle">GNC org</text>
  <g stroke="#1f2a44" stroke-width="1.5" fill="none">
    <line x1="180" y1="30" x2="180" y2="40"/><line x1="60" y1="40" x2="300" y2="40"/>
    <line x1="60" y1="40" x2="60" y2="48"/><line x1="180" y1="40" x2="180" y2="48"/><line x1="300" y1="40" x2="300" y2="48"/>
  </g>
  <g font-size="12" font-weight="700" fill="#1f2a44" text-anchor="middle">
    <text x="60" y="62">Vehicle</text><text x="180" y="62">Constellation</text><text x="300" y="62">Infrastructure</text>
  </g>
  <g fill="#8fb8f0" stroke="#1d6fd1">
    <rect x="8" y="70" width="104" height="24" rx="4"/><rect x="8" y="100" width="104" height="24" rx="4"/><rect x="8" y="130" width="104" height="24" rx="4"/>
    <rect x="128" y="70" width="104" height="24" rx="4"/><rect x="128" y="100" width="104" height="24" rx="4"/><rect x="128" y="130" width="104" height="24" rx="4"/><rect x="128" y="160" width="104" height="24" rx="4"/>
    <rect x="248" y="70" width="104" height="24" rx="4"/><rect x="248" y="100" width="104" height="24" rx="4"/>
  </g>
  <rect x="8" y="160" width="104" height="24" rx="4" fill="#ffffff" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="60" y="86">Starship</text><text x="60" y="116">Falcon</text><text x="60" y="146">Dragon</text>
    <text x="60" y="176" fill="#6c7a93">Starfall (newer)</text>
    <text x="180" y="86">ADCS</text><text x="180" y="116">Navigation</text><text x="180" y="146">Embedded Controls</text><text x="180" y="176">Beam Pointing</text>
    <text x="300" y="86">Software Eng., GNC</text><text x="300" y="116">SRE, GNC</text>
  </g>
  <text x="180" y="206" font-size="11" fill="#6c7a93" text-anchor="middle">3 + 4 + 2 = 9 established families</text>
</svg>
```
:::

::: context flight-readiness-review The review before you fly
A **flight readiness review** is a formal meeting before a flight, where each team presents evidence that its part is ready: test results, open problems and the risks that remain. Reviewers who did not do the work ask hard questions. The outcome is a decision to fly, to fly with accepted risks, or to wait. For a GNC engineer, the chart you bring there must say honestly what has been tested, what has not, and how confident you are.
:::

::: context course-bridge Where the six categories come back
The six-part vocabulary is not only for this module. The technical tracks of this course line up with it. The dynamics, control and guidance modules build the analysis and mission-design side. The Kalman filter and orbit determination modules build navigation and sensors. The 6-DOF simulation architecture and Monte Carlo modules build simulation and V&V. The real-time, embedded and C++ modules build flight software. When a later lesson here says a family "leans on" a module, this is the map it is using.
:::
