---
id: l07-infrastructure-behind-the-simulations
title: "Infrastructure: the stack that keeps the fleet running"
minutes: 21
covers:
  - "infrastructure: Linux, Docker, Kubernetes, Ansible, Puppet, Terraform, Bazel-class build systems"
---

Think about the difference between baking one cake at home and running a bakery that ships ten thousand cakes a day. The recipe is the same. What changes is everything around it: every oven must be set up the same way, every kitchen must stock the same flour, someone must decide which oven bakes which batch, and someone must notice when an oven breaks halfway through.

The previous lesson ended with a campaign of 200,000 simulation cases spread across a fleet of thousands of computers. That is the bakery. A fast simulation is the recipe, but it is not enough. Something has to **package** the simulation so it runs the same on every machine. Something has to **schedule** the cases across the fleet and notice when a machine dies. Something has to **build the fleet** in the first place, the same way every time. And something has to work out which of the thousands of files in a big codebase need rebuilding and retesting after a change, because rebuilding everything every time stops working once a codebase gets large. This lesson is about that layer — the **[[infrastructure|the-chain]]**, meaning the machines and tools underneath the real work.

None of these tools belong to one company. They are widely used, well documented, industry-standard pieces, and each solves one recognizable problem. At this stage, knowing *which problem each one solves* is worth far more than memorizing any tool's settings.

## Linux, underneath almost everything

An **operating system** is the program that runs a computer's hardware and lets other programs share it. **[[Linux|linux-story]]** is a free operating system, and it sits under nearly every layer in this lesson: the machines that run simulation cases, the servers that test new code, and — as the lesson on flight computers showed — often the flight computer itself.

So comfort with Linux is not a niche skill for one role. It is closer to a prerequisite, the way arithmetic is a prerequisite for physics rather than a chapter in it. In practice that means three things:

- the **command line** — typing commands into a text window instead of clicking;
- **shell scripting** — saving a list of those commands in a file so the computer can run them in order;
- the basic **file and process model** — how Linux organizes files into folders and keeps track of running programs.

## Containers: ending "it works on my machine"

Imagine you bake a perfect cake at home, then try the same recipe at a friend's house. Their oven runs hot and their flour is different. The recipe did not change, but the cake did.

Software has the same problem. A program leans on **libraries** — packages of code other people wrote, such as NumPy for math in Python. Each library comes in numbered **versions**, and versions change. A simulation tested with one version can act differently, or crash, on a machine where a different version is installed. Across thousands of machines set up at different times, "the same version everywhere" is not safe to assume unless something forces it to be true.

::: example A failure with no logic error in it
NumPy 2 removed the `ptp` method from arrays. (`ptp` means "peak to peak": the largest value minus the smallest.) For years before that, `array.ptp()` was ordinary, working code:

```python
import numpy as np
print(np.__version__)     # a 2.x version, e.g. 2.4.6
arr = np.array([3, 1, 4, 1, 5, 9, 2, 6])
arr.ptp()
```

```text
AttributeError: 'numpy.ndarray' object has no attribute 'ptp'
```

**What happened, step by step.** The code asks the array for its peak-to-peak range. The largest value is $9$ and the smallest is $1$, so the right answer is $9 - 1 = 8$. Under NumPy 1 this line printed `8`. Under NumPy 2 the method no longer exists, so Python stops with an error.

The fix is small once you know it: call the function form, `np.ptp(arr)`, which still works and returns `8`. But the point is the failure itself. Nothing about the *logic* of a peak-to-peak range changed. The same code, run against an older library, works perfectly. A pipeline built on one machine and run later, or somewhere else, with different versions installed can fail — or worse, quietly give different answers — with no bug anywhere in the code anyone wrote.

**Sanity check.** $8$ is between $0$ and the largest value, $9$, as a range of these numbers must be.
:::

A **[[container|shipping-container]]** fixes this. It is a sealed bundle that holds the code *together with* the exact library versions, system packages and settings it was built and tested with. The recipe of the bundle is called a **container image**; a running copy of it is a **container**. **Docker** is the best-known tool for building and running them.

With a container, "it runs on my machine" and "it runs on worker machine 3,000 three weeks from now" become the same claim. That is why containers matter far beyond convenience. They turn a fleet of thousands of machines into thousands of identical copies of one known-good environment, instead of thousands of machines that each drifted a little depending on what was installed on them, and when.

Containers have an older cousin: the **virtual machine**, a whole pretend computer — operating system and all — running as a program on a real one. Running many pretend computers on shared hardware is called **virtualization**. A tool called **Vagrant** does for virtual machines what Docker does for containers: it sets them up the same way every time from a written description.

::: warning "Latest" is not a version
A container only freezes what you pin. If the recipe for the image says "install the latest NumPy", then building it today and building it next month can give two different images — and the drift you wanted to stop comes back through the side door. Write down exact version numbers for every library, and treat changing one as a real change that gets reviewed and tested.
:::

## Orchestration: running thousands of containers at once

Once the code is packed, something still has to decide which of many machines runs which container. It has to restart a container that dies halfway through a job. And it has to scale up — start more containers — when a big campaign begins, then scale back down when it ends.

That job is **orchestration**, like a conductor telling each musician when to play. The best-known tool is **[[Kubernetes|kubernetes-name]]** (said "koo-ber-NET-eez"). The general problem is the same whichever tool an employer runs.

Supercomputing centers solve the same problem with a **scheduler** built for **HPC** — high-performance computing, meaning huge numbers of processors working on one big job. A scheduler keeps a queue of jobs and hands each one to free processors. A dispersion campaign is exactly this kind of workload: thousands of separate cases waiting in a queue.

## Configuration management and provisioning: building the fleet itself

Before any container runs anywhere, the machines themselves have to exist — hundreds or thousands of them — with the right operating system, the right network access and the right software installed. And that has to happen the same way every time, not by a person setting up each machine by hand. Two related but different problems show up here.

**Configuration management** is the first. A tool such as **Ansible** or **Puppet** keeps a written description of how a machine *should* look: which packages are installed, which services run, which files exist with which contents. That description is saved and tracked like source code. The tool then compares each real machine with the description and fixes any differences automatically. Nobody has to remember the steps they typed last time. Good configuration tools are **[[idempotent|idempotent]]**: running them twice does no harm, because a machine that already matches is left alone.

**Infrastructure provisioning** works one level lower. Instead of setting up machines that already exist, a tool such as **Terraform** describes the infrastructure itself: how many servers, of what kind, what network connects them, what storage is attached. From that one text file, a whole compute fleet can be created, resized or torn down. The file is reviewed and versioned exactly like code — people call this **[[infrastructure as code|infrastructure-as-code]]** — instead of someone clicking through a control panel and hoping to remember what they did.

Both give the same benefit for the work in this module. A dispersion campaign's fleet, or the pool of machines that builds and tests code, has to be reproducible *as infrastructure*, not only as code. A fleet set up by hand, one machine at a time over months, collects the same hidden drift as a codebase with no tests. Nobody can say for sure what is different between machine 40 and machine 4,000. Provisioning exists so that question never needs asking.

::: key
Containers make an execution environment reproducible; orchestration schedules many containers across many machines and keeps them healthy; configuration management brings a fleet of existing machines into agreement with a checked-in description of what should be installed and running; infrastructure provisioning creates and manages the machines and networking themselves from a declarative specification. Each solves a distinct problem in the same overall chain: get a large, correct, reproducible fleet running the exact code you meant to run.
:::

## Build systems: rebuild only what a change could reach

Picture a row of dominoes that branches as it goes. Knock over one near the start and a whole fan of them falls. Knock over one near the end and only a couple fall. If you know how the dominoes are arranged, you can say exactly which will fall before you touch anything.

A big codebase is like that. To **build** code means to turn source files into programs the computer can run, and C++ must be **compiled** — translated into machine instructions — before it runs at all. With hundreds of source files and thousands of tests, rebuilding and rerunning everything after every change becomes too slow to use. A **Bazel-class build system** (Bazel is said "BAY-zel") solves this. It keeps a map of which files depend on which, called the **[[dependency graph|dependency-graph]]**, and after a change it rebuilds and retests only the parts of the map the change could actually reach.

::: example Knowing the graph, not only the file list
Here is a small dependency graph. Each file points to the things that directly depend on it:

```python
reverse_deps = {
    "atmosphere.py":    ["drag.py", "sim_test_atmosphere.py"],
    "drag.py":          ["sixdof.py", "sim_test_drag.py"],
    "sixdof.py":        ["montecarlo_driver.py", "sim_test_sixdof.py"],
    "guidance.py":      ["sixdof.py", "sim_test_guidance.py"],
}

def affected_by(changed_file, graph):
    seen, frontier = set(), [changed_file]
    while frontier:
        node = frontier.pop()
        for dep in graph.get(node, []):
            if dep not in seen:
                seen.add(dep)
                frontier.append(dep)
    return sorted(seen)

print(affected_by("atmosphere.py", reverse_deps))
# ['drag.py', 'montecarlo_driver.py', 'sim_test_atmosphere.py',
#  'sim_test_drag.py', 'sim_test_sixdof.py', 'sixdof.py']

print(affected_by("guidance.py", reverse_deps))
# ['montecarlo_driver.py', 'sim_test_guidance.py', 'sim_test_sixdof.py', 'sixdof.py']
```

**How the function walks the graph.** It keeps a to-do list, `frontier`, that starts with the changed file. It takes one file off the list, looks up everything that depends on it, and adds any file it has not seen before to both the answer and the to-do list. When the to-do list is empty, every reachable file has been found.

**Tracing `atmosphere.py` by hand.** Step 1: the atmosphere model feeds `drag.py` and its own test. Step 2: `drag.py` feeds `sixdof.py` and the drag test. Step 3: `sixdof.py` feeds the Monte Carlo driver and the 6-DOF test. That is $2 + 2 + 2 = 6$ targets, found in three steps down the chain.

**Tracing `guidance.py`.** It feeds `sixdof.py` and its own test, and `sixdof.py` feeds two more: $2 + 2 = 4$ targets. Nothing about drag or atmosphere is touched, because nothing in this graph makes guidance depend on them.

**Sanity check.** The low-level shared model reaches more targets (6) than the one feeding in near the top (4), which is what the domino picture predicts. A build system that knew only *which file changed*, without this graph, would have to play safe and rebuild everything every time. Knowing the graph lets it rebuild and retest exactly the set that could be affected, and nothing more.
:::

This is why the build system matters more, and gets argued about more, on a large simulation or flight-software codebase than on a small project. "Rebuild everything" versus "rebuild what the graph says is affected" is the difference between a change taking hours to check and a change taking minutes — multiplied by every change that lands in a day. Bazel is one of a family, and postings in this field name several members:

- **Make** — the oldest and simplest, from the 1970s. You write a file listing each target and the files it is built from, and Make rebuilds a target when any of its inputs is newer than it.
- **Pants** and **Buck** — large-codebase build systems in the same style as Bazel, first built at Twitter and at Facebook for the same reason Google built Bazel.
- **Gradle** — a build system most common for Java and Android projects.

They differ in details. They share the core idea from the example: know the dependency graph, and redo only what a change can reach.

Close relatives of the build system are **package managers** — tools such as `pip` for Python or `apt` on Linux that fetch libraries and keep track of which version is installed. They are how the exact versions pinned in a container actually get installed.

## The stack as the postings name it

Now put the pieces together the way a job posting does. SpaceX postings include a GNC-focused role in **[[SRE|sre-meaning]]** — Site Reliability Engineering, the job of keeping large computer systems running reliably. That role exists because GNC work needs enormous compute. A believable dispersion campaign is thousands to millions of high-fidelity 6-DOF (six-degree-of-freedom) runs, and it is repeated every time the vehicle, the software or the mission changes. Someone has to keep that fleet healthy.

The skills listed around that role are a conventional, learnable stack. Beyond the tools above, they include **databases** (organized stores of data, such as years of campaign results) and **[[TCP/IP|tcp-ip]]** (said "T-C-P I-P"), the rules computers use to send data to each other over a network.

::: key
Why does GNC need tens of thousands of CPUs? Because a credible dispersion campaign is thousands to millions of high-fidelity 6-DOF runs, repeated every time the vehicle, the software or the mission changes. That is the workload the SRE GNC role exists to keep running.

The GNC infrastructure stack: Linux, Docker and Kubernetes, Ansible, Puppet and Terraform, Bazel-class build systems, package management, databases, TCP/IP and HPC schedulers, with continuous integration for rocket and simulation software.
:::

The last item on that list, **continuous integration** — a machine that builds and tests every change automatically — sits on top of the build system. It gets its own treatment two lessons from now.

## Check yourself

::: check
State, in one sentence each, the distinct problem that containers solve and the distinct problem that container orchestration solves.
:::

::: answer
Containers solve environment reproducibility: they package code together with the exact library and system versions it was built and tested against, so it behaves the same no matter what else is installed on the machine running it. Orchestration solves fleet-level scheduling and health management: it decides which of many machines runs which container, restarts ones that fail, and scales the number running up or down as demand changes.
:::

::: check
Using the `ptp` example, explain concretely how a failure can occur with no logic error anywhere in the code that was actually written, and how containerization addresses that specific class of problem.
:::

::: answer
The code that calls `array.ptp()` is not wrong in any logical sense — it is exactly the kind of call that worked correctly for years under NumPy 1. The failure comes entirely from a mismatch between the library version the code was written and tested against and the version actually installed on the machine that runs it later. Containerization addresses this by packaging the code together with the exact dependency versions it needs — pinned, not "latest" — so whichever machine runs the container gets the same environment every time, whatever else happens to be installed there.
:::

::: check
Distinguish configuration management tools such as Ansible or Puppet from infrastructure provisioning tools such as Terraform, at the level of what each one is describing and acting on.
:::

::: answer
Configuration management describes the desired state of machines that already exist — which packages are installed, which services run, which files are present — and brings the real machines into agreement with that description automatically. Infrastructure provisioning works one level below that: it describes and creates the machines, networking and storage themselves from a declarative specification. So with provisioning, the fleet's existence and shape — not only what is installed on it — is defined by a reviewable, version-controlled text file instead of manual setup.
:::

::: check
Using the `affected_by` example, explain why a build system needs the dependency graph between files, not merely the list of files that changed, to decide what to rebuild and retest.
:::

::: answer
Knowing only that `atmosphere.py` changed says nothing about which other files depend on it, directly or indirectly. The graph is what reveals that `drag.py` depends on it, that `sixdof.py` depends on `drag.py`, and so on, so the system can compute the full, exact set of six targets the change could reach. Without the graph, a build system has no reliable way to know which targets are safe to skip. It either risks skipping something that needs rebuilding or, more commonly, falls back to rebuilding everything — exactly the slow behavior a Bazel-class system exists to avoid.
:::

::: check
Connect this lesson back to the previous one on Monte Carlo dispersion campaigns: why does the feasibility of a large campaign depend on this infrastructure layer, not only on how fast the underlying simulation itself runs?
:::

::: answer
A large campaign's wall-clock time depends on how many cases can run at once, not only on how long one case takes. The previous lesson's numbers showed a 200,000-case campaign at about 12 seconds per case taking about 3.5 days on eight cores, against about two minutes on a fleet of 20,000 cores. Reaching that scale needs a reproducible container image so every worker runs identically, orchestration or an HPC scheduler to run and watch thousands of jobs, provisioning to stand up that many machines in the first place, and a build system fast enough that the simulation code can be rebuilt and checked quickly as it changes. A fast simulation on one machine does not become a fast campaign without every layer in this lesson under it.
:::

## Summary

| Layer | Problem it solves |
| --- | --- |
| Linux | The common operating system almost everything else in this stack runs on |
| Containers (Docker) | Packaging code with its exact, pinned dependencies so it runs identically anywhere |
| Virtual machines (Vagrant) | A whole pretend computer, set up the same way every time |
| Orchestration (Kubernetes) and HPC schedulers | Running many containers or jobs across many machines and keeping them healthy |
| Configuration management (Ansible, Puppet) | Bringing existing machines into agreement with a checked-in description |
| Provisioning (Terraform) | Creating and managing the machines and networking themselves, from a text file |
| Build systems (Bazel, Make, Pants, Buck, Gradle) | Rebuilding and retesting only what a change could actually reach |
| Package management, databases, TCP/IP | Installing exact versions, storing results, moving data between machines |
| SRE GNC role | Keeps the thousands-of-CPUs campaign workload running |

The next lesson looks at the data all this machinery produces and moves — telemetry, timestamps, and the units-and-frames discipline that prevents the most common class of real error in this field. The lesson after that returns to the build system and puts continuous integration on top of it.

::: context the-chain The whole chain in one picture
Each tool in this lesson hands off to the next. Read it from the top: first the machines must exist, then they must be set up, then the code is packed, then the packed code is run across the fleet.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44">
    <rect x="10" y="8" width="120" height="36" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
    <text x="70" y="31" text-anchor="middle" font-weight="700">Terraform</text>
    <text x="146" y="31">create the machines</text>
    <rect x="10" y="60" width="120" height="36" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
    <text x="70" y="83" text-anchor="middle" font-weight="700">Ansible / Puppet</text>
    <text x="146" y="83">set each machine up</text>
    <rect x="10" y="112" width="120" height="36" rx="6" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
    <text x="70" y="135" text-anchor="middle" font-weight="700">Docker</text>
    <text x="146" y="135">pack code + exact libraries</text>
    <rect x="10" y="164" width="120" height="36" rx="6" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
    <text x="70" y="187" text-anchor="middle" font-weight="700">Kubernetes</text>
    <text x="146" y="187">run and watch the jobs</text>
  </g>
  <g stroke="#1f2a44" stroke-width="2" fill="#1f2a44">
    <line x1="70" y1="44" x2="70" y2="54"/><polygon points="70,60 65,52 75,52"/>
    <line x1="70" y1="96" x2="70" y2="106"/><polygon points="70,112 65,104 75,104"/>
    <line x1="70" y1="148" x2="70" y2="158"/><polygon points="70,164 65,156 75,156"/>
  </g>
</svg>
```

Blue boxes are about the machines; orange boxes are about the code that runs on them.
:::

::: context linux-story Where Linux came from
In 1991 a Finnish student, Linus Torvalds, posted a small operating-system kernel he had written as a hobby, and invited others to improve it. Thousands did. The name mixes his first name with Unix, the older operating system it imitates.

Because Linux is free and anyone may change it, companies can trim it down and tune it for a special job — which is how a version of it ends up on a flight computer, as the earlier lesson on the machine and the deadline described.
:::

::: context shipping-container Why the word "container"
Before the 1950s, ships were loaded one sack and barrel at a time. The steel shipping container changed that: one standard box that fits every ship, train and truck, whatever is inside. Software borrowed the idea, and Docker's logo is a whale carrying boxes.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <rect x="8" y="8" width="344" height="144" rx="8" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <text x="180" y="28" font-size="12" text-anchor="middle" fill="#1f2a44">one worker machine (Linux)</text>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <rect x="24" y="40" width="148" height="100" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
    <text x="98" y="58" font-weight="700">container A</text>
    <rect x="36" y="66" width="124" height="20" fill="#ffffff" stroke="#1f2a44"/><text x="98" y="80">simulation code</text>
    <rect x="36" y="90" width="124" height="20" fill="#ffffff" stroke="#1f2a44"/><text x="98" y="104">NumPy 1.26 (pinned)</text>
    <rect x="36" y="114" width="124" height="20" fill="#ffffff" stroke="#1f2a44"/><text x="98" y="128">settings</text>
    <rect x="188" y="40" width="148" height="100" rx="6" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
    <text x="262" y="58" font-weight="700">container B</text>
    <rect x="200" y="66" width="124" height="20" fill="#ffffff" stroke="#1f2a44"/><text x="262" y="80">analysis script</text>
    <rect x="200" y="90" width="124" height="20" fill="#ffffff" stroke="#1f2a44"/><text x="262" y="104">NumPy 2.x (pinned)</text>
    <rect x="200" y="114" width="124" height="20" fill="#ffffff" stroke="#1f2a44"/><text x="262" y="128">settings</text>
  </g>
</svg>
```

Two containers on one machine can even carry two different versions of the same library without getting in each other's way.
:::

::: context kubernetes-name A helmsman for the fleet
Kubernetes is Greek for "helmsman" — the person who steers a ship — which is why its logo is a ship's wheel. It began inside Google and was released for anyone to use in 2014. Engineers often shorten it to **K8s**: a K, then the 8 letters "ubernete", then an s. The ship theme fits: Docker packs the containers, and Kubernetes steers the ship full of them.
:::

::: context idempotent Doing it twice is the same as doing it once
**Idempotent** (said "eye-dem-POH-tent") comes from Latin for "the same power". An action is idempotent if doing it a second time changes nothing. Pressing an elevator's call button is idempotent: pressing it again does not call a second elevator. Adding \$5 to your account is not: do it twice and you have \$10 more.

For a fleet this matters a lot. You can run the configuration tool on all 4,000 machines every hour. Machines that already match are left alone, and only the ones that drifted get fixed.
:::

::: context infrastructure-as-code Why a text file beats a control panel
Clicking through a web page to create 500 servers leaves no record of what you chose. A text file does. It can be reviewed by a colleague before it runs, stored in version control so you can see who changed what and when, and run again to make an identical fleet next month. It is the same reason a recipe card beats "I think I used about two cups". Everything this module says about code — review it, test it, track its history — now applies to the machines too.
:::

::: context dependency-graph The graph from the example, drawn
Arrows point from a file to the files that depend on it. Change `atmosphere.py` (blue) and the six orange targets must be rebuilt and retested. The two white boxes on the bottom row are safe to skip.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <rect x="8" y="12" width="74" height="26" rx="5" fill="#f2b880" stroke="#1f2a44"/><text x="45" y="29">test_atm</text>
    <rect x="98" y="12" width="74" height="26" rx="5" fill="#f2b880" stroke="#1f2a44"/><text x="135" y="29">test_drag</text>
    <rect x="188" y="12" width="74" height="26" rx="5" fill="#f2b880" stroke="#1f2a44"/><text x="225" y="29">test_6dof</text>
    <rect x="8" y="76" width="74" height="26" rx="5" fill="#8fb8f0" stroke="#1f2a44"/><text x="45" y="93">atmosphere</text>
    <rect x="98" y="76" width="74" height="26" rx="5" fill="#f2b880" stroke="#1f2a44"/><text x="135" y="93">drag</text>
    <rect x="188" y="76" width="74" height="26" rx="5" fill="#f2b880" stroke="#1f2a44"/><text x="225" y="93">sixdof</text>
    <rect x="278" y="76" width="74" height="26" rx="5" fill="#f2b880" stroke="#1f2a44"/><text x="315" y="93">driver</text>
    <rect x="98" y="140" width="74" height="26" rx="5" fill="#ffffff" stroke="#1f2a44"/><text x="135" y="157">guidance</text>
    <rect x="8" y="140" width="74" height="26" rx="5" fill="#ffffff" stroke="#1f2a44"/><text x="45" y="157">test_guid</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5" fill="#1f2a44">
    <line x1="45" y1="76" x2="45" y2="44"/><polygon points="45,38 41,46 49,46"/>
    <line x1="135" y1="76" x2="135" y2="44"/><polygon points="135,38 131,46 139,46"/>
    <line x1="225" y1="76" x2="225" y2="44"/><polygon points="225,38 221,46 229,46"/>
    <line x1="82" y1="89" x2="92" y2="89"/><polygon points="98,89 90,85 90,93"/>
    <line x1="172" y1="89" x2="182" y2="89"/><polygon points="188,89 180,85 180,93"/>
    <line x1="262" y1="89" x2="272" y2="89"/><polygon points="278,89 270,85 270,93"/>
    <line x1="160" y1="140" x2="203" y2="107"/><polygon points="208,102 199,105 204,111"/>
    <line x1="98" y1="153" x2="88" y2="153"/><polygon points="82,153 90,149 90,157"/>
  </g>
</svg>
```

Real graphs at a large company have many thousands of boxes, which is exactly why a program, not a person, has to walk them.
:::

::: context sre-meaning What an SRE does
**Site Reliability Engineering** is a job title that started at Google in the early 2000s. The idea: treat keeping systems running as an engineering problem, solved with code and measurement rather than by people fixing things by hand. An SRE writes the automation, watches the dashboards, and gets called when something breaks.

An SRE attached to GNC is keeping the simulation fleet healthy, so that when a GNC engineer launches a 200,000-case campaign at 4 p.m., the answer is back before they go home.
:::

::: context tcp-ip How computers pass notes
**IP**, the Internet Protocol, gives every machine an address and moves small chunks of data called **packets** toward it, a little like addressed envelopes. **TCP**, the Transmission Control Protocol, sits on top: it numbers the packets, checks that every one arrived, asks again for any that went missing, and puts them back in order. Together they are how a campaign's thousands of workers send their results back to one place without losing a single case.
:::
