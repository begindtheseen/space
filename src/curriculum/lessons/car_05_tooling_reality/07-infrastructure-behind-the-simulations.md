---
id: l07-infrastructure-behind-the-simulations
title: "Infrastructure: the stack that keeps the fleet running"
minutes: 17
covers:
  - "infrastructure: Linux, Docker, Kubernetes, Ansible, Puppet, Terraform, Bazel-class build systems"
---

Running 200,000 simulation cases across a fleet of thousands of machines, as the previous lesson closed with, does not happen because someone wrote a fast simulation and pointed it at a large number. Something has to package that simulation so it runs identically on every machine in the fleet regardless of what else is installed there; something has to decide which machine runs which case and notice when one dies partway through; something has to stand up that fleet of machines in the first place, reliably and repeatably; and something has to decide which of the thousands of files in a large codebase actually need rebuilding and retesting after a given change, because rebuilding everything, every time, stops being a workable answer once a codebase reaches a certain size. This lesson is about that layer — not because it is glamorous, but because a dispersion campaign, a large simulation, or a codebase like the one in an earlier lesson simply does not run without it.

None of the tools named in this lesson are proprietary to any one employer, and none require deep expertise before they become useful to understand — they are widely used, generally documented, industry-standard pieces, each solving a specific, recognizable problem. Learning what problem each one solves is worth more, at this stage, than memorizing configuration syntax for any particular one.

## Linux, underneath almost everything

Nearly every layer described in this lesson — the machines that run simulation workers, the servers that run continuous integration, often the flight computer itself, as an earlier lesson in this module discussed — runs on Linux. Comfort with a Unix-style command line, basic shell scripting, and the standard file and process model is not a specialized skill reserved for one role; it is closer to a prerequisite for working in this kind of environment at all, the same way basic arithmetic is a prerequisite for the rest of a physics course rather than a topic within it.

## Containers: making "it works on my machine" a non-issue

A simulation that depends on a specific version of a specific library will behave differently, or fail outright, on a machine where a different version happens to be installed — and across a fleet of thousands of worker machines provisioned at different times, "the same version everywhere" is not a safe assumption unless something enforces it.

::: example A version mismatch that has nothing to do with the logic being wrong
NumPy 2.x removed the `ptp` method directly on an array, after years where `array.ptp()` was ordinary, working code:

```python
import numpy as np
print(np.__version__)     # 2.4.6
arr = np.array([3, 1, 4, 1, 5, 9, 2, 6])
arr.ptp()
```

```text
AttributeError: 'numpy.ndarray' object has no attribute 'ptp'
```

The fix is simple once you know about it — call the function form instead, `np.ptp(arr)`, which still works and returns `8` — but the failure itself is the actual point of this example: nothing about the *logic* of computing a peak-to-peak range changed. The exact same code, run against a different, older library version, would have worked without complaint. A pipeline built on one machine with one set of library versions and run later, or elsewhere, on a machine with different versions installed can fail — or worse, silently behave differently — for reasons that have nothing to do with any bug in the code someone actually wrote.

A container image sidesteps this problem by packaging the code together with the exact library versions, system packages and configuration it was built and tested against, so that "runs on my machine" and "runs on the worker machine three weeks from now" become the same claim rather than two different ones. This is why containerization matters well beyond convenience: it is what makes a large fleet of simulation workers behave as thousands of identical copies of one known-good environment, instead of thousands of machines that each drifted slightly from whatever was installed on them and when.
:::

Once code is packaged this way, something still has to decide which of many available machines runs which container, restart one that dies partway through a job, and scale the number of running containers up when a large campaign starts and back down when it finishes. That scheduling and health-management problem, across a fleet rather than a single machine, is what container orchestration systems solve — the general problem is the same regardless of which specific orchestration tool a given employer runs.

## Configuration management and provisioning: standing up the fleet itself, repeatably

Before any container can run anywhere, the machines themselves — however many hundreds or thousands are needed — have to exist, with the right operating system, the right network access, and the right software installed, and that has to happen the same way every time, not through someone manually configuring each machine by hand. Two related but distinct problems show up here, and the tools named in this lesson's topic split roughly along that line.

Configuration management tools describe the desired state of a machine or a fleet of machines — which packages are installed, which services run, which files exist with which contents — as a checked-in, version-controlled description, and then bring the actual machines into agreement with that description automatically, rather than relying on someone remembering the sequence of manual steps they ran the last time. Infrastructure provisioning tools work one level below that: instead of configuring machines that already exist, they describe the infrastructure itself — how many servers, what kind, what networking connects them, what storage is attached — as a declarative specification, so that an entire compute fleet can be created, resized, or torn down from a text file that is reviewed and versioned the same way source code is, rather than through a person clicking through a control panel and hoping to remember what they did.

The value of both, for the kind of work this module describes, is the same: a dispersion campaign's fleet, or a continuous-integration system's pool of build machines, needs to be reproducible as infrastructure, not just as code. A fleet that was configured by hand, machine by machine, over months, accumulates the same kind of undocumented drift a codebase does without tests — nobody can say with confidence exactly what is different between machine 40 and machine 4,000, and a machine-provisioning approach exists specifically to make that question unnecessary to ask.

::: key
Containers make an execution environment reproducible; orchestration schedules many containers across many machines and keeps them healthy; configuration management brings a fleet of existing machines into agreement with a checked-in description of what should be installed and running; infrastructure provisioning creates and manages the machines and networking themselves from a declarative specification. Each solves a distinct problem in the same overall chain: get a large, correct, reproducible fleet running the exact code you meant to run.
:::

## Build systems: rebuilding only what a change could actually affect

A codebase with hundreds of source files and thousands of tests has a real, practical problem that a small project never encounters: rebuilding and rerunning everything after every change becomes too slow to use, often within minutes of a change being made, long before it becomes too slow to be worth doing at all. A Bazel-class build system solves this by tracking the dependency graph between source files and the things that depend on them — libraries, executables, tests — and rebuilding or retesting only the parts of that graph that a given change could actually reach.

::: example Knowing the graph, not just the file list
A small dependency graph, mapping each file to the things that directly depend on it:

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

Changing `atmosphere.py`, a low-level shared model, reaches six downstream targets through two levels of dependency — everything that touches drag, and everything that touches the full 6-DOF stack built on top of drag. Changing `guidance.py` reaches four targets, and notably does not touch anything related to drag or atmosphere at all, because nothing in this graph makes guidance depend on them. A build system that only knew the list of files that changed, without this graph, would have to guess conservatively and rebuild everything, every time; knowing the graph lets it rebuild and retest exactly the set that could possibly be affected, and nothing more.
:::

This is precisely why build-system choice matters more, and gets discussed more, on a large simulation or flight-software codebase than on a small project: the difference between "rebuild everything" and "rebuild what a Bazel-class system determines is actually affected" is the difference between a change taking minutes to validate and a change taking hours, multiplied by however many changes land in a day. The next lesson picks this exact thread up directly, looking at what runs on top of a build system like this one: continuous integration, and the regression suites that catch a change nobody meant to make.

## Check yourself

::: check
State, in one sentence each, the distinct problem that containers solve and the distinct problem that container orchestration solves.
:::

::: answer
Containers solve environment reproducibility: packaging code together with the exact library and system versions it was built and tested against, so it behaves the same regardless of what else is installed on the machine running it. Orchestration solves fleet-level scheduling and health management: deciding which of many machines runs which container, restarting ones that fail, and scaling the number running up or down as demand changes.
:::

::: check
Using the `ptp` example, explain concretely how a failure can occur with no logic error anywhere in the code that was actually written, and how containerization addresses that specific class of problem.
:::

::: answer
The code that calls `array.ptp()` is not wrong in any logical sense — it is exactly the kind of call that worked correctly for years under an earlier NumPy version. The failure comes entirely from a mismatch between the library version the code was written and tested against and the library version actually installed on the machine running it later. Containerization addresses this by packaging the code together with the exact dependency versions it needs, so that whichever machine runs the container gets the same environment every time, regardless of what else happens to be installed there.
:::

::: check
Distinguish configuration management tools such as Ansible or Puppet from infrastructure provisioning tools such as Terraform, at the level of what each one is describing and acting on.
:::

::: answer
Configuration management describes the desired state of machines that already exist — which packages are installed, which services run, what files are present — and brings the real machines into agreement with that description automatically. Infrastructure provisioning operates one level below that, describing and creating the machines, networking and storage themselves from a declarative specification, so the fleet's existence and shape, not just what is installed on it, is defined by a reviewable, version-controlled description rather than manual setup.
:::

::: check
Using the `affected_by` example, explain why a build system needs the dependency graph between files, not merely the list of files that changed, to decide what to rebuild and retest.
:::

::: answer
Knowing only that `atmosphere.py` changed does not by itself say which other files depend on it, directly or indirectly; the graph is what reveals that `drag.py` depends on it, that `sixdof.py` depends on `drag.py`, and so on, letting the system compute the full, exact set of targets a change could reach. Without that graph, a build system has no reliable way to know which targets are safe to skip, so it either risks skipping something that actually needs rebuilding or, more commonly, falls back to rebuilding everything — exactly the slow, unscalable behavior a Bazel-class system is built to avoid.
:::

::: check
Connect this lesson back to the previous one on Monte Carlo dispersion campaigns: why does the feasibility of a large campaign depend on this infrastructure layer, not only on how fast the underlying simulation itself runs?
:::

::: answer
A large campaign's wall-clock time depends on how many cases can run at once, not only on how long one case takes; the previous lesson's own numbers showed a 200,000-case campaign taking three and a half days on eight cores versus about two minutes on a fleet of many thousands. Reaching that scale requires a reproducible container image so every worker runs identically, an orchestration layer to schedule and manage thousands of running jobs, provisioning to stand up that many machines in the first place, and a build system efficient enough that the simulation code itself can be rebuilt and validated quickly as it changes. A fast simulation run on one machine does not become a fast campaign without every layer in this lesson supporting it.
:::

## Summary

| Layer | Problem it solves |
| --- | --- |
| Linux | The common operating-system substrate almost everything else in this stack runs on |
| Containers (Docker) | Packaging code with its exact dependencies so it runs identically anywhere |
| Orchestration (Kubernetes) | Scheduling many containers across many machines and keeping them healthy |
| Configuration management (Ansible, Puppet) | Bringing existing machines into agreement with a checked-in description |
| Provisioning (Terraform) | Creating and managing the machines and networking themselves, declaratively |
| Build systems (Bazel-class) | Rebuilding and retesting only what a change could actually affect |

The next lesson looks at the data this infrastructure produces and moves — telemetry, timestamps, and the units-and-frames discipline that prevents the single most common class of real error in this field.
