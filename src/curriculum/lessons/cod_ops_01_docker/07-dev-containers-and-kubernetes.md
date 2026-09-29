---
id: l07-dev-containers-and-kubernetes
title: Dev containers for new teammates, and a first look at Kubernetes
minutes: 24
covers:
  - Dev Containers for onboarding
  - 'Kubernetes literacy: pods, deployments, services'
---

Think about the first day at a new school. In one classroom you are handed a list: buy these six books, this calculator, these pens, and set up your locker yourself. You spend a week getting it right, and your calculator is a slightly different model from everyone else's. In another classroom your desk is already set up when you walk in. The books are there, the calculator is the same one the teacher uses, and you start learning on the first morning.

Software teams have both kinds of classroom. The first half of this lesson is about building the second kind with a container: a **dev container**, a container that *is* your development machine, described in one file that lives in the project's git repository. A new teammate opens the project, the editor builds the container, and ten minutes later they are running the same compiler, the same Python and the same libraries as everyone else.

The second half zooms out. Once a team has many containers running as real services — a telemetry decoder, a database, a dashboard — something has to start them, restart them when they crash, and connect them to each other across many computers. The most common tool for that is **Kubernetes**. You do not need to run a cluster to be a GNC engineer. You do need to read the words, because data from real vehicles often flows through one.

## The onboarding problem

When a new engineer joins a simulation team, the first week often goes like this. They clone the repository. They read a `README` that says "install CMake 3.28 or newer, Python 3.12, NumPy, and gdb". They install what their laptop's package manager offers, which is a slightly different CMake, a different Python patch version, and a NumPy built against a different math library. The build fails in a way nobody else has seen. A senior engineer loses an afternoon helping.

This is called **[[onboarding|onboarding-word]]**: getting a new person from "first day" to "doing useful work". The slow part is rarely the person. It is the machine setup, because a `README` is a wish, not a guarantee. Nothing checks that the laptop matches it.

You already know the fix from earlier in this module. A Dockerfile turns "install these things" into a recipe a computer follows exactly. A dev container points that same idea at the *development* machine instead of the shipped program.

## What a dev container is

A **dev container** is a container your editor runs your whole working session inside. Your source code stays on your laptop (or in a cloud workspace), mounted into the container. Your terminal, compiler, debugger and language tools all run inside it. Your editor window stays on your laptop and talks to a small helper inside the container.

The container is described by a file called **`devcontainer.json`**, kept in a folder named `.devcontainer/` at the top of the repository. The file format is an open specification (published at containers.dev), so the same file works in several places:

- the **Dev Containers** extension for Visual Studio Code, which offers "Reopen in Container" when it sees the folder;
- **GitHub Codespaces**, which builds the same container on a cloud machine and opens it in a browser;
- JetBrains IDEs, which read the same file;
- the **devcontainer CLI**, a command-line tool (installed with `npm`) that builds and starts the container with no editor at all, which is handy for checking the file in CI.

::: key Dev containers
A **dev container** is the team's development environment written down as `.devcontainer/devcontainer.json` (plus, if needed, a Dockerfile) and kept in git. Every teammate, and every cloud workspace, gets the same OS, compiler, interpreter and tools. Onboarding becomes "clone, then Reopen in Container", and changing the toolchain becomes a reviewed commit instead of a message saying "everyone please upgrade".
:::

## Reading a devcontainer.json line by line

Here is a complete, working file for a small C++ and Python simulation project. It was used exactly as shown for the run in the example below.

```jsonc
{
  // The team's development machine, written down and kept in git.
  "name": "gnc-sim",
  "image": "mcr.microsoft.com/devcontainers/python:3.12-bookworm",
  "remoteUser": "vscode",
  "containerEnv": {
    "OMP_NUM_THREADS": "1"
  },
  "forwardPorts": [8050],
  "postCreateCommand": "pip install --user -r requirements-dev.txt",
  "customizations": {
    "vscode": {
      "extensions": [
        "ms-python.python",
        "ms-vscode.cmake-tools",
        "ms-vscode.cpptools"
      ]
    }
  }
}
```

And the `requirements-dev.txt` it installs, with every version pinned:

```text
numpy==2.2.6
cmake==3.31.6
ninja==1.11.1.4
```

Take it one key at a time.

- `"name"` is the label the editor shows.
- `"image"` is the starting image. This one is a Microsoft-maintained Debian 12 ("bookworm") image with Python 3.12 and a ready-made non-root user. It is Debian-based, not Alpine, for the musl reason from the base-image lesson. If you need more system packages, you replace `"image"` with `"build": { "dockerfile": "Dockerfile" }` and write a normal Dockerfile next to the JSON file.
- `"remoteUser"` says which user your terminal and tools run as. `vscode` is an ordinary user (uid 1000) that the image already contains. This is the `USER` lesson again: files you create in your mounted source folder are owned by a normal user, not by root.
- `"containerEnv"` sets environment variables for the whole container. Setting `OMP_NUM_THREADS` to 1 stops math libraries from splitting work across a different number of threads on each laptop, which can change the last digits of a sum.
- `"forwardPorts"` makes a port inside the container reachable from your laptop's browser, the same idea as `-p` in `docker run`. Port 8050 here is for a plotting dashboard.
- `"postCreateCommand"` runs once, right after the container is first created. It is the place to install project dependencies. There are sibling hooks too: `postStartCommand` runs every time the container starts.
- `"customizations"` holds settings for particular editors. Here it lists the VS Code extensions everyone should have, by their marketplace ids.

The file allows `//` comments. That makes it **[[JSON with comments|jsonc]]**, not strict JSON, which is why the code block is labeled `jsonc`.

::: example Bringing the container up with no editor at all
The devcontainer CLI does what the editor does when you press "Reopen in Container". From the project folder:

```bash
npx -y @devcontainers/cli@0.89.0 up --workspace-folder .
```

The last lines of the real output (trimmed, timestamps removed) were:

```text
Downloading numpy-2.2.6-cp312-cp312-manylinux_2_17_x86_64.manylinux2014_x86_64.whl (16.5 MB)
Downloading cmake-3.31.6-py3-none-manylinux_2_17_x86_64.manylinux2014_x86_64.whl (27.8 MB)
Downloading ninja-1.11.1.4-py3-none-manylinux_2_12_x86_64.manylinux2010_x86_64.whl (422 kB)
Installing collected packages: numpy, ninja, cmake
Successfully installed cmake-3.31.6 ninja-1.11.1.4 numpy-2.2.6
{"outcome":"success","containerId":"6bbe7423…","remoteUser":"vscode","remoteWorkspaceFolder":"/workspaces/gncsim"}
```

The CLI pulled the image, started a container and ran the `postCreateCommand`. Pip downloaded the three pinned wheels: $16.5 + 27.8 + 0.422 \approx 44.7\,\mathrm{MB}$ in total. The final JSON line says it worked, which user you are, and where your source code landed inside the container: `/workspaces/gncsim`.

Now run commands inside it:

```bash
npx -y @devcontainers/cli@0.89.0 exec --workspace-folder . bash -c \
  'whoami; pwd; python --version; cmake --version | head -1; echo $OMP_NUM_THREADS'
```

```text
vscode
/workspaces/gncsim
Python 3.12.14
cmake version 3.31.6
1
```

Every line matches the file: the `vscode` user, the mounted workspace, Python 3.12, the pinned CMake, and the environment variable. A second teammate who runs the same two commands gets the same five lines. That is the whole point.
:::

::: warning The dev container is not the shipped image
A dev container is big on purpose: compilers, debuggers, editor helpers, maybe documentation tools. The image you ship to a test stand or a server should be the slim multi-stage image from earlier in the module. Keep them related (same Debian release, same pinned library versions) but separate. And never put passwords or tokens in `devcontainer.json`: it is committed to git, so everyone who can read the repository can read them.
:::

::: warning A floating image tag drifts
`python:3.12-bookworm` is a tag, and tags move. The team that onboards someone in March and someone else in October can hand them different images. For a long-lived project, pin the image by digest (`…@sha256:…`), exactly as the registries lesson taught for pipelines, and update it on purpose in a reviewed commit.
:::

## From one container to a fleet

Now zoom out. A telemetry decoder, a database for decoded frames and a dashboard are three containers, and on one laptop `docker compose` starts them. But a real ground system runs on many computers, has to keep running when one of them dies, and has to handle ten times the data during a launch.

Picture the manager of a large restaurant. The manager does not cook, but has a plan on the wall — "four cooks on the grill, two at the fryer, one on dessert" — and walks around all night making the kitchen match the plan. A cook goes home sick, and the manager calls in a replacement. It gets busy, and the plan changes to six cooks on the grill.

**Kubernetes** (often written **[[k8s|k8s-name]]**) is that manager for containers. It is an **orchestrator**: software that runs containers across a group of computers, called a **cluster**, and keeps them matching a written plan. Each computer in the cluster is a **node**. You never tell Kubernetes "start this container on that machine". You tell it what you want to exist, in a YAML file, and it works out the rest.

That style has a name: **declarative**. You declare the *desired state*. A part of Kubernetes called a controller compares the desired state with the actual state, again and again, and acts to close any gap. That is a **[[control loop|reconcile-loop]]**, the same shape as the feedback loops you will build in GNC.

Kubernetes runs the same OCI images that `docker build` makes. It does not need Docker itself on the nodes; most clusters use containerd or CRI-O to run the containers. The image you built and pinned earlier in the module is exactly what it runs.

## Pods: the smallest thing Kubernetes runs

Kubernetes does not schedule bare containers. Its smallest unit is a **pod**: one or more containers that always run together on the same node, share one network address, and can share storage volumes. Most pods hold one container. A second container goes in the same pod only when the two are welded together — for example a helper that ships the main container's log files somewhere.

The name comes from a pod of whales, fitting the Docker whale logo, and from a pea pod: a few things in one shell. The **[[picture of a pod|pod-picture]]** helps.

Pods are disposable. When a node fails, its pods are gone, and new ones are made elsewhere with new names and addresses. So you almost never create a pod by hand. You create something that *manages* pods.

## Deployments: "keep three of these running"

A **Deployment** is the object that says "I want this many identical pods, built from this template, and keep it that way". Its main fields are:

- `replicas`: how many copies of the pod you want;
- `template`: the pod to copy, including the container image and its settings;
- `selector`: a rule saying which pods belong to this Deployment, matched by **labels** (short key–value tags such as `app: telemetry-decoder`).

If a pod crashes, the Deployment's controller sees two pods where three should be, and starts a third. If you change the image from version 1.4.2 to 1.4.3, it does a **rolling update**: it starts new pods and stops old ones a few at a time, so the service never goes fully dark. If the new version is broken, `kubectl rollout undo` goes back to the previous one.

## Services: one steady address for changing pods

Here is the problem a Service solves. The three decoder pods each have their own network address, and those addresses change every time a pod is replaced. Anything that wants to send data to the decoder cannot keep a list of addresses that keeps changing.

A **Service** gives a group of pods one stable name and one stable virtual address, and spreads incoming connections across whichever pods currently match its label selector. Inside the cluster, other programs reach it by its name, `telemetry-decoder`, through the cluster's own DNS. The default kind of Service, **ClusterIP**, is reachable only from inside the cluster; `NodePort` and `LoadBalancer` kinds expose it to the outside.

The glue between a Deployment and a Service is the label. The Deployment stamps `app: telemetry-decoder` on every pod it makes. The Service selects `app: telemetry-decoder`. They never name each other directly, as the **[[label diagram|labels-picture]]** shows.

::: key Pods, Deployments, Services
A **pod** is one or more containers scheduled together, sharing a network address; pods are disposable. A **Deployment** keeps a stated number of identical pods running from one template and rolls out new versions gradually. A **Service** gives a changing set of pods, chosen by label, one stable name and address.
:::

Here is a complete, minimal pair: a Deployment of three decoder pods and the Service in front of them. Two YAML documents live in one file, separated by a line of three dashes.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: telemetry-decoder
  labels:
    app: telemetry-decoder
spec:
  replicas: 3
  selector:
    matchLabels:
      app: telemetry-decoder
  template:
    metadata:
      labels:
        app: telemetry-decoder
    spec:
      containers:
        - name: decoder
          image: ghcr.io/example-gnc/telemetry-decoder:1.4.2
          ports:
            - containerPort: 8080
          resources:
            requests:
              cpu: 250m
              memory: 256Mi
            limits:
              memory: 512Mi
          readinessProbe:
            httpGet:
              path: /healthz
              port: 8080
---
apiVersion: v1
kind: Service
metadata:
  name: telemetry-decoder
spec:
  selector:
    app: telemetry-decoder
  ports:
    - port: 80
      targetPort: 8080
```

Read the Deployment from the top. `apiVersion` and `kind` say what sort of object this is. `metadata.name` is its name. Under `spec`, `replicas: 3` is the plan, `selector` is the rule for "my pods", and `template` is the pod to stamp out, whose `labels` must satisfy that rule. Inside the container spec, `image` names the image (in a real pipeline, pinned by digest), `containerPort` documents the port the program listens on, and `resources` says how much of a node it needs. The **[[readinessProbe|readiness-probe]]** asks Kubernetes to send a web request to `/healthz` and route traffic to the pod only after it answers, much like the `HEALTHCHECK` instruction from the Dockerfile lesson.

The Service listens on port 80 and forwards to port 8080 (`targetPort`) on any pod labeled `app: telemetry-decoder`.

::: example Letting a real API server check the file
You can ask a cluster to check a file without changing anything, with a *server-side dry run*. This was run against a real Kubernetes 1.33 API server (a local k3s cluster):

```bash
kubectl apply --dry-run=server -f telemetry.yaml
```

```text
deployment.apps/telemetry-decoder created (server dry run)
service/telemetry-decoder created (server dry run)
```

Both objects passed. Now make one small mistake: change the pod template's label to `app: telem-decoder` and leave the selector alone. Run the same command:

```text
service/telemetry-decoder created (server dry run)
The Deployment "telemetry-decoder" is invalid: spec.template.metadata.labels: Invalid value: map[string]string{"app":"telem-decoder"}: `selector` does not match template `labels`
```

The Service still passes (it is its own object, and a Service that matches no pods is legal, merely useless). The Deployment is refused, because it would make pods it could never recognize as its own. The error names the exact field: `spec.template.metadata.labels`.

One more slip, very common: typing `containerport` with a lowercase p. The server answers:

```text
Error from server (BadRequest): error when creating "telemetry.yaml": Deployment in version "v1" cannot be handled as a Deployment: strict decoding error: unknown field "spec.template.spec.containers[0].ports[0].containerport"
```

YAML itself is perfectly happy with either spelling. Only the Kubernetes schema knows the field is called `containerPort`. That is why a dry run belongs in CI, not only a YAML syntax check.
:::

::: example How much of the cluster does this ask for?
Each pod requests `250m` of CPU. The `m` means **[[millicores|millicores]]**, thousandths of one CPU core, so 250m is 0.25 of a core. It also requests `256Mi` of memory; `Mi` is a mebibyte, $2^{20} = 1\,048\,576$ bytes.

For three replicas:

$$
3 \times 0.25 = 0.75 \text{ cores}, \qquad 3 \times 256\,\mathrm{Mi} = 768\,\mathrm{Mi} = 805\,306\,368 \text{ bytes} \approx 805\,\mathrm{MB}.
$$

The scheduler places each pod only on a node that still has 0.25 of a core and 256 Mi unreserved. The memory *limit* of 512 Mi is a ceiling: a pod that tries to use more is killed and restarted. Sanity check: under one core and under 1 GB for the whole service, a small load for a modern server, which suits a decoder that mostly waits for packets.
:::

::: warning Kubernetes does not make results reproducible
Kubernetes keeps services *running*. It does not pin anything by itself. If the Deployment says `image: …:latest`, each new pod can pull a different image, and three replicas can run three different builds at once. Everything the registries lesson said about tags and digests applies with more force here, because pods are replaced all the time without anyone watching.
:::

## Reading a cluster with kubectl

You talk to a cluster with **kubectl** (people say "cube control" or "cube C-T-L"). A handful of commands covers most of what a simulation engineer needs:

```bash
kubectl apply -f telemetry.yaml          # make the cluster match this file
kubectl get pods -l app=telemetry-decoder  # list the pods with this label
kubectl describe pod <pod-name>          # events: pulled image, crashed, rescheduled
kubectl logs <pod-name>                  # the program's printed output
kubectl rollout status deployment/telemetry-decoder
kubectl rollout undo deployment/telemetry-decoder
```

When a result looks wrong and the data went through a cluster, `describe` and `logs` are where you start: they tell you which image a pod was really running and whether it restarted halfway through a pass.

::: key Where Kubernetes enters an aerospace data story
Starlink telemetry infrastructure is reported to run on Docker and Kubernetes alongside **[[Kafka, HBase and HDFS|kafka-hbase-hdfs]]**, so pods, deployments and services are literacy an engineer touching that pipeline needs, not a specialization.
:::

You will not be asked to design a cluster. You may be asked why a replay of last night's telemetry has a gap, and the answer may be "a decoder pod was rescheduled". Knowing the words lets you ask the right question.

## Check yourself

::: check
A new teammate says: "I followed the README exactly and my build still fails, but it works for everyone else." Name two ways a dev container removes this whole class of problem.
:::

::: answer
First, the environment is no longer a list of instructions a person follows by hand; it is a container image built from a file in git, so the compiler, interpreter and library versions come from the file, not from whatever the laptop's package manager offers. Second, the setup is checked by use: everyone on the team runs inside the same definition every day, so if it breaks, it breaks for everyone and is fixed once in a commit, instead of drifting silently on one laptop.
:::

::: check
In `devcontainer.json`, what is the difference between `postCreateCommand` and `postStartCommand`, and which one should run `pip install -r requirements-dev.txt`?
:::

::: answer
`postCreateCommand` runs once, after the container is first created; `postStartCommand` runs every time the container starts. Installing dependencies belongs in `postCreateCommand`: it only needs to happen once per container, and repeating it at every start would slow down every morning for no benefit.
:::

::: check
A Deployment has `replicas: 4`. One node crashes and takes two of the pods with it. Describe what Kubernetes does, and which part of it notices.
:::

::: answer
The Deployment's controller keeps comparing the desired state (4 pods) with the actual state. It now sees 2 running pods, a gap of 2, so it creates 2 new pods from the template. The scheduler places them on nodes that still have enough unreserved CPU and memory. The new pods get new names and new addresses; the Service in front of them picks them up automatically because they carry the same label.
:::

::: check
Why does a program that wants to send data to the decoder use the Service name `telemetry-decoder` instead of the pods' own addresses?
:::

::: answer
Pods are disposable: every time one is replaced, it gets a new address, and during a rolling update the set of pods changes minute by minute. A Service has one stable name and virtual address, and forwards each connection to whichever pods currently match its label selector. The sender never needs to know which pods exist right now.
:::

::: check
Two pods each request `500m` CPU and `1Gi` memory. How many cores and how many bytes do they request together?
:::

::: answer
$2 \times 0.5 = 1$ core. $1\,\mathrm{Gi} = 2^{30} = 1\,073\,741\,824$ bytes, so two of them are $2\,147\,483\,648$ bytes, $2\,\mathrm{Gi}$, about 2.15 GB.
:::

## Summary

| Idea | What it is | Key fact |
| --- | --- | --- |
| Dev container | Development environment as a container | `.devcontainer/devcontainer.json` in git; same tools for everyone |
| `image` / `build` | Where the environment comes from | Pin by digest for a long-lived project |
| `postCreateCommand` | One-time setup hook | Install pinned dependencies here |
| Kubernetes | Container orchestrator | Declarative: you state desired state, controllers reconcile |
| Pod | Smallest schedulable unit | One or more containers, one network address, disposable |
| Deployment | Manages identical pods | `replicas`, `selector`, `template`; rolling updates and undo |
| Service | Stable name for changing pods | Chooses pods by label; ClusterIP by default |
| `kubectl apply --dry-run=server` | Schema check without changes | Catches wrong field names YAML cannot |

The next lesson, the last in this module, looks at tools that attack the same reproducibility problem from other directions: Podman, Nix, Spack, conda-lock and uv.

::: context onboarding-word Where "onboarding" comes from
The word began with ships and planes: to be "on board" is to be on the vessel. Businesses borrowed it for the process of bringing a new hire into the team — accounts, desk, training and tools. In software, the part that most often goes wrong is the machine setup, and teams measure it bluntly: how many days until a new person's first merged change. A dev container attacks exactly that number.
:::

::: context jsonc JSON with comments
Strict JSON, the format defined in the JSON standard, has no comments at all. That is awkward for a configuration file people need to read and explain. So several tools, including VS Code, accept a relaxed variant nicknamed JSONC: ordinary JSON plus `//` and `/* */` comments (and, in many tools, a trailing comma). A strict parser such as Python's `json` module will reject a JSONC file, so if you process `devcontainer.json` with your own scripts, strip the comments first or use a JSONC-aware parser.
:::

::: context k8s-name A helmsman and a number in the middle
Kubernetes comes from the Greek word for a helmsman or pilot, the person who steers a ship, which is why its logo is a ship's wheel with seven spokes. "k8s" is a numeronym: the first letter, the count of letters left out, and the last letter. K-u-b-e-r-n-e-t-e-s has eight letters between the k and the s. The same trick gives "i18n" for internationalization. Kubernetes grew out of Google's experience running containers internally and was open-sourced in 2014.
:::

::: context reconcile-loop A feedback loop you already know
A thermostat does not heat a room for a fixed time. It measures the temperature, compares it with the setting, and turns the heater on or off to close the gap, forever. A Kubernetes controller does the same with objects: measure (how many pods exist), compare (with `replicas`), act (create or delete pods), repeat. In the control modules later in the course you will write this loop with a sensor, an error signal and an actuator; it is the same idea.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="20" width="100" height="40" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="60" y="38" font-size="12" text-anchor="middle" fill="#1f2a44">desired</text>
  <text x="60" y="53" font-size="12" text-anchor="middle" fill="#1f2a44">replicas: 3</text>
  <rect x="130" y="20" width="100" height="40" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="45" font-size="12" text-anchor="middle" fill="#1f2a44">compare</text>
  <rect x="250" y="20" width="100" height="40" rx="6" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="300" y="38" font-size="12" text-anchor="middle" fill="#1f2a44">act: create</text>
  <text x="300" y="53" font-size="12" text-anchor="middle" fill="#1f2a44">1 more pod</text>
  <rect x="130" y="95" width="100" height="40" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="113" font-size="12" text-anchor="middle" fill="#1f2a44">actual</text>
  <text x="180" y="128" font-size="12" text-anchor="middle" fill="#1f2a44">2 pods running</text>
  <line x1="110" y1="40" x2="126" y2="40" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="126,36 132,40 126,44" fill="#1f2a44"/>
  <line x1="230" y1="40" x2="246" y2="40" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="246,36 252,40 246,44" fill="#1f2a44"/>
  <path d="M300 60 L300 115 L236 115" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="236,111 230,115 236,119" fill="#1f2a44"/>
  <line x1="180" y1="95" x2="180" y2="66" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="176,66 180,60 184,66" fill="#1f2a44"/>
</svg>
```
:::

::: context pod-picture What sits inside a pod
A pod is a small box on one node. Every container inside it shares the pod's single network address, so they can talk over `localhost`, and they can mount the same volume. Most pods hold one container; this drawing shows the less common two-container case, a main program plus a helper that forwards its logs.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="8" y="8" width="344" height="154" rx="8" fill="#fff" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <text x="18" y="26" font-size="12" fill="#6c7a93">node</text>
  <rect x="30" y="36" width="300" height="114" rx="8" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="44" y="54" font-size="12" fill="#1f2a44" font-weight="700">pod  (one address: 10.42.0.7)</text>
  <rect x="44" y="66" width="120" height="40" rx="5" fill="#fff" stroke="#1f2a44"/>
  <text x="104" y="90" font-size="12" text-anchor="middle" fill="#1f2a44">decoder</text>
  <rect x="196" y="66" width="120" height="40" rx="5" fill="#fff" stroke="#1f2a44"/>
  <text x="256" y="90" font-size="12" text-anchor="middle" fill="#1f2a44">log shipper</text>
  <rect x="44" y="116" width="272" height="24" rx="4" fill="#f2b880" stroke="#1f2a44"/>
  <text x="180" y="132" font-size="12" text-anchor="middle" fill="#1f2a44">shared volume: /var/log/decoder</text>
</svg>
```

The address shown is only an example of the kind of private address a cluster hands out.
:::

::: context labels-picture Labels tie everything together
The Deployment and the Service never mention each other. Both point at the same label. The Deployment writes it on each pod it creates; the Service forwards traffic to any pod that carries it. That loose coupling is why you can replace every pod, or even the whole Deployment, and the Service keeps working.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="10" width="140" height="40" rx="6" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="80" y="28" font-size="12" text-anchor="middle" fill="#1f2a44">Deployment</text>
  <text x="80" y="43" font-size="11" text-anchor="middle" fill="#1f2a44">creates, labels</text>
  <rect x="210" y="10" width="140" height="40" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="280" y="28" font-size="12" text-anchor="middle" fill="#1f2a44">Service</text>
  <text x="280" y="43" font-size="11" text-anchor="middle" fill="#1f2a44">selects by label</text>
  <rect x="20" y="110" width="96" height="46" rx="6" fill="#fff" stroke="#1f2a44"/>
  <rect x="132" y="110" width="96" height="46" rx="6" fill="#fff" stroke="#1f2a44"/>
  <rect x="244" y="110" width="96" height="46" rx="6" fill="#fff" stroke="#1f2a44"/>
  <g font-size="11" text-anchor="middle" fill="#1f2a44">
    <text x="68" y="128">pod 1</text><text x="180" y="128">pod 2</text><text x="292" y="128">pod 3</text>
  </g>
  <g font-size="11" text-anchor="middle" fill="#1d6fd1">
    <text x="68" y="146">app: telemetry…</text><text x="180" y="146">app: telemetry…</text><text x="292" y="146">app: telemetry…</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1.2">
    <line x1="60" y1="50" x2="60" y2="110"/><line x1="100" y1="50" x2="170" y2="110"/><line x1="130" y1="50" x2="280" y2="110"/>
  </g>
  <g stroke="#1d6fd1" stroke-width="1.2" stroke-dasharray="4 3">
    <line x1="230" y1="50" x2="80" y2="110"/><line x1="260" y1="50" x2="190" y2="110"/><line x1="300" y1="50" x2="300" y2="110"/>
  </g>
</svg>
```

Solid lines: the Deployment made these pods. Dashed blue lines: the Service sends traffic to them because the label matches.
:::

::: context readiness-probe Alive is not the same as ready
A program can be running but not yet able to do its job: still loading a star catalog, still connecting to the database. A readiness probe tells Kubernetes how to ask "are you ready?", here with a web request to `/healthz` that should answer with a success code. Until it does, the Service sends that pod no traffic. Kubernetes also has a separate liveness probe, which restarts a container that stops answering. Mixing the two up is a classic way to get pods restarted in a loop.
:::

::: context millicores Slicing a CPU into thousandths
Kubernetes measures CPU in cores, and lets you ask for fractions using the suffix `m` for "milli": `1000m` is one full core, `250m` is a quarter. A request is a reservation the scheduler uses to decide where a pod fits; a limit is a ceiling. Memory uses powers of two: `Ki`, `Mi`, `Gi` are $2^{10}$, $2^{20}$ and $2^{30}$ bytes. Writing `256M` (no i) means $256 \times 10^{6}$ bytes instead, about 4.6 percent less, which is a real source of confusion.
:::

::: context kafka-hbase-hdfs Three names from the big-data world
**Kafka** is a system for moving streams of messages between programs, keeping them in order in a durable log, so many consumers can read the same telemetry stream at their own pace. **HDFS**, the Hadoop Distributed File System, spreads very large files across many machines with copies for safety. **HBase** is a database built on top of HDFS for fast lookups in huge tables, such as "every packet from satellite X between two times". All three came out of the Apache Software Foundation's big-data projects.
:::
