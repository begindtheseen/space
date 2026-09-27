---
id: l02-writing-a-dockerfile
title: Writing a Dockerfile, one instruction at a time
minutes: 23
covers:
  - 'Dockerfile: FROM RUN COPY WORKDIR ENV ARG ENTRYPOINT CMD USER HEALTHCHECK'
---

A recipe card for pancakes reads from top to bottom: start with a bowl of flour, add milk, add eggs, whisk, cook. Anyone who follows the card gets the same pancakes. If the pancakes come out wrong, you read the card and find the step that went wrong. You never have to ask the cook what they did from memory.

A **Dockerfile** is a recipe card for an image. It is a plain text file, named `Dockerfile`, with one instruction per line: start from this image, copy in these files, run this command, and when someone starts a container, run this program. The command `docker build` follows the card and produces an image. Each instruction becomes one of the layers you met in the last lesson.

Because the Dockerfile is text, it lives in git next to your code. Anyone on the team, or an investigator five years from now, can read exactly how the simulation's environment was made, and build it again. This lesson walks through the ten instructions you will use most — `FROM`, `WORKDIR`, `COPY`, `RUN`, `ENV`, `ARG`, `ENTRYPOINT`, `CMD`, `USER` and `HEALTHCHECK` — using a small rocket calculator as the running example. All output was produced with Docker 29.3.1.

## The program we will package

A **[[sounding rocket|sounding-rockets]]** is a small research rocket that flies straight up and falls back. After its motor **burns out** — runs out of propellant — it keeps coasting upward, slowing down, until it stops at the top of its flight, the **apogee**. Ignoring air drag, the extra height it gains while coasting is

$$
h_{\mathrm{coast}} = \frac{v^2}{2 g_0},
$$

where $v$ is the speed at burnout in m/s and $g_0 = 9.80665\ \mathrm{m/s^2}$ is standard gravity. Read $g_0$ as "g nought" or "g zero". The apogee is the burnout altitude plus that coast height.

Here is `apogee.py`. It reads two numbers from the command line with Python's **[[argparse|argparse-module]]** module and prints both heights:

```python
"""Coast height of a sounding rocket after its motor burns out (no air drag)."""
import argparse
import os

G0 = 9.80665  # standard gravity, m/s^2

parser = argparse.ArgumentParser()
parser.add_argument("--alt", type=float, required=True, help="burnout altitude, m")
parser.add_argument("--speed", type=float, required=True, help="burnout speed straight up, m/s")
parser.add_argument("--version", action="version",
                    version="apogee " + os.environ.get("APP_VERSION", "unknown"))
args = parser.parse_args()

coast = args.speed ** 2 / (2 * G0)  # height gained while coasting, m
print(f"coast height: {coast:.0f} m")
print(f"apogee:       {args.alt + coast:.0f} m")
```

The `--version` option prints the value of an **environment variable** called `APP_VERSION`. The Dockerfile will set that variable, which lets you see `ENV` at work.

## The whole Dockerfile first

Here is the recipe, all at once. The rest of the lesson takes it apart line by line.

```dockerfile
FROM python:3.12-slim

ARG APP_VERSION=dev
ARG BUILD_DATE=unknown
ENV APP_VERSION=${APP_VERSION} \
    PYTHONUNBUFFERED=1

WORKDIR /app
COPY apogee.py .
RUN echo "built ${BUILD_DATE}" > BUILD_INFO \
 && useradd --uid 1000 --create-home sim

USER sim
ENTRYPOINT ["python3", "/app/apogee.py"]
CMD ["--alt", "3000", "--speed", "250"]
```

Instructions are written in capitals by custom. A backslash `\` at the end of a line means "this instruction continues on the next line", the same as in a shell script.

::: example Building and running the image
Put `Dockerfile` and `apogee.py` in one folder, go into it, and build:

```bash
docker build -t apogee:0.1.0 --build-arg APP_VERSION=0.1.0 --build-arg BUILD_DATE=2026-09-27 .
```

- `-t apogee:0.1.0` names the result: image `apogee`, tag `0.1.0`.
- `--build-arg` hands a value to an `ARG` in the Dockerfile (more on that below).
- The final `.` is the **[[build context|build-context-intro]]**: the folder whose files the build is allowed to `COPY`. Here, the current folder.

The build prints one numbered step per instruction that does work (trimmed):

```text
#5 [1/4] FROM docker.io/library/python:3.12-slim@sha256:f77ac9e44ae96ef2c90b8053ea08c31f8be030f824196b0ae4db6d462c84e51f
#6 [2/4] WORKDIR /app
#7 [3/4] COPY apogee.py .
#8 [4/4] RUN echo "built 2026-09-27" > BUILD_INFO  && useradd --uid 1000 --create-home sim
#8 DONE 0.2s
#9 naming to docker.io/library/apogee:0.1.0 done
```

Now run it with no arguments:

```bash
docker run --rm apogee:0.1.0
```

```text
coast height: 3187 m
apogee:       6187 m
```

Check the numbers by hand. The default is a burnout speed of 250 m/s at 3000 m. The coast height is

$$
\frac{250^2}{2 \times 9.80665} = \frac{62\,500}{19.6133} \approx 3186.6\ \mathrm{m},
$$

which rounds to 3187 m. Add the 3000 m burnout altitude: $3000 + 3187 = 6187\ \mathrm{m}$. That matches. A sanity check: 250 m/s is about three-quarters of the speed of sound, and a few kilometers of coasting is what small sounding rockets really do.
:::

## FROM: choose where to start

`FROM` must come first. It names the **base image**: the image your recipe starts from. Everything in it — here Debian, Python 3.12 and the `pip` tool — is already there before your first instruction runs.

```dockerfile
FROM python:3.12-slim
```

Choosing the base is a real engineering decision. A bigger base has more tools; a smaller one downloads faster and contains less to go wrong. Lesson 4 compares the common choices.

## WORKDIR and COPY: put your files in place

`WORKDIR` sets the **working directory**: the folder that every later instruction, and the container's program, runs in. If the folder does not exist, `WORKDIR` creates it. Think of it as `mkdir -p /app && cd /app` that stays in effect.

```dockerfile
WORKDIR /app
COPY apogee.py .
```

`COPY` takes files from the build context and puts them into the image. Its form is `COPY <source> <destination>`. Here the destination `.` means "the working directory", so the file lands at `/app/apogee.py`. You can copy whole folders too: `COPY src/ ./src/`.

::: warning COPY cannot reach outside the build context
`COPY ../data/table.csv .` fails. The build only sees the files in the context folder you passed to `docker build`, never its parent. Keep the Dockerfile at the top of your project so the whole project is in the context — and read lesson 3 before you do, because a context full of results files slows every build.
:::

## RUN: run a command while building

`RUN` runs a shell command *at build time*, inside a temporary container, and saves whatever files it changed as a new layer. It is how you install packages, compile code or create users.

```dockerfile
RUN echo "built ${BUILD_DATE}" > BUILD_INFO \
 && useradd --uid 1000 --create-home sim
```

This line does two things. It writes a small `BUILD_INFO` file, and it creates a user named `sim` whose user id is 1000 (you will need that user below). The `&&` means "run the next command only if the previous one succeeded", exactly as in your shell scripts. If any part fails, the whole build stops with an error — which is what you want.

Why join two commands into one `RUN`? Every `RUN` makes a layer. Putting related commands together keeps the layer list short and, more importantly, lets you clean up temporary files in the *same* layer that created them. Deleting them in a later `RUN` would leave them inside the image, hidden under a whiteout, as the last lesson showed.

::: key Build time versus run time
`RUN` happens once, when the image is built, and its result is frozen into a layer. `ENTRYPOINT` and `CMD` happen every time a container starts. Installing a package belongs in `RUN`; starting your simulation belongs in `ENTRYPOINT` and `CMD`.
:::

## ENV and ARG: two kinds of settings

Both instructions set a named value, but they live for different lengths of time.

**`ENV`** sets an environment variable that is baked into the image. It is visible to later build steps *and* to every container that runs from the image.

```dockerfile
ENV APP_VERSION=${APP_VERSION} \
    PYTHONUNBUFFERED=1
```

`${APP_VERSION}` (read "dollar brace APP_VERSION") means "the value of `APP_VERSION`", the same way it does in the shell. `PYTHONUNBUFFERED=1` tells Python to print output immediately, which matters in containers — see the note on **[[buffered output|unbuffered-output]]**.

**`ARG`** declares a **build argument**: a value you can pass in with `docker build --build-arg NAME=value`, with a default in the Dockerfile. It exists only while the image is being built.

```dockerfile
ARG APP_VERSION=dev
ARG BUILD_DATE=unknown
```

Our Dockerfile uses both on purpose. `APP_VERSION` comes in as an `ARG` and is then copied into an `ENV`, so it survives into the container. `BUILD_DATE` stays an `ARG`: it is used by the `RUN` step to write `BUILD_INFO`, and then it is gone.

Look inside a running container to see the difference. The `--entrypoint sh` option replaces the image's normal program with a shell for this one run (more on that in the next section):

```bash
docker run --rm --entrypoint sh apogee:0.1.0 \
  -c 'echo "APP_VERSION=$APP_VERSION BUILD_DATE=$BUILD_DATE"; cat BUILD_INFO'
```

```text
APP_VERSION=0.1.0 BUILD_DATE=
built 2026-09-27
```

`APP_VERSION` is set. `BUILD_DATE` is empty: the build argument did not survive into the container. Only the file that the `RUN` step wrote with it remains.

::: warning A build argument is not a secret
An `ARG` vanishes from the running container, but not from the image's history. `docker history --no-trunc apogee:0.1.0` shows the `RUN` layer's full record, including the values it was built with:

```text
RUN |2 APP_VERSION=0.1.0 BUILD_DATE=2026-09-27 /bin/sh -c echo "built ${BUILD_DATE}" > BUILD_INFO  && useradd --uid 1000 --create-home sim # buildkit
```

`|2` means "two build arguments were in effect". Anyone who can pull the image can read them. Never pass a password or an access token as an `ARG` or an `ENV`.
:::

::: key ARG versus ENV
`ARG` values exist only while the image is being built, and are set with `docker build --build-arg`. `ENV` values are stored in the image and are present in every container. Neither one is a place for secrets: `ARG` values stay readable in the image history.
:::

## ENTRYPOINT and CMD: what runs when the container starts

These two instructions decide the command a container runs. They work as a pair.

- **`ENTRYPOINT`** is the program the container always runs. Think of it as the tool.
- **`CMD`** is the default list of arguments given to that program. Think of it as the tool's default settings.

When a container starts, Docker glues them together: `ENTRYPOINT` first, then `CMD`. If you type arguments after the image name in `docker run`, those arguments *replace* `CMD` completely, and `ENTRYPOINT` stays.

```dockerfile
ENTRYPOINT ["python3", "/app/apogee.py"]
CMD ["--alt", "3000", "--speed", "250"]
```

The square-bracket style is called the **[[exec form|exec-form]]**: a list of strings, each in double quotes, exactly as the program should receive them.

::: example Replacing CMD, keeping ENTRYPOINT
With no arguments, the container runs `python3 /app/apogee.py --alt 3000 --speed 250`, as you saw. Now pass arguments:

```bash
docker run --rm apogee:0.1.0 --alt 1000 --speed 300
```

```text
coast height: 4589 m
apogee:       5589 m
```

The whole `CMD` was replaced, so the program ran as `python3 /app/apogee.py --alt 1000 --speed 300`. Check: $300^2 / 19.6133 = 90\,000 / 19.6133 \approx 4588.7$, so 4589 m of coasting, and $1000 + 4589 = 5589$ m. Faster at burnout means a higher apogee, even from a lower start, which makes sense because the coast height grows with the square of the speed.

Ask for the version:

```bash
docker run --rm apogee:0.1.0 --version
```

```text
apogee 0.1.0
```

Again `CMD` was replaced by `--version`, and the value came from the `ENV` line. To replace the `ENTRYPOINT` itself, you need an explicit option, `--entrypoint`. It also clears the default `CMD`, so only the arguments you type follow the new program. Asking the container who it runs as:

```bash
docker run --rm --entrypoint id apogee:0.1.0
```

```text
uid=1000(sim) gid=1000(sim) groups=1000(sim)
```
:::

::: key ENTRYPOINT vs CMD
ENTRYPOINT is the executable the container always runs; CMD supplies default arguments that a `docker run` argument list replaces. Use ENTRYPOINT for the tool and CMD for its default flags.
:::

::: warning The shell form swallows your arguments
You may also write `ENTRYPOINT python3 /app/apogee.py --alt 3000 --speed 250`, without brackets. That is the **shell form**, and Docker turns it into `["/bin/sh", "-c", "python3 /app/apogee.py --alt 3000 --speed 250"]`. The arguments you type after the image name are then ignored. Built that way, the image answered `docker run --rm apogee:shellform --speed 300` with the default `apogee: 6187 m`, silently dropping `--speed 300`. Use the exec form for `ENTRYPOINT` and `CMD`.
:::

## USER: stop running as root

Every Linux process runs as some user, identified by a number called the **[[uid|uid-numbers]]** (user id). The user `root`, uid 0, may do anything. Unless the Dockerfile says otherwise, the process in a container runs as uid 0.

That matters in two ways.

First, files. When a container writes into a folder shared with the host, the file on the host is owned by the container's uid — the *number*, not the name. A container running as root leaves root-owned files in your project folder, and your normal account cannot edit or delete them without `sudo`.

Second, safety. If an attacker, or a bug, ever breaks out of the container's isolation (a **[[container escape|container-escape]]**), it starts with whatever power the process had. Starting from root is the worst case.

`USER` sets the user for every later instruction and for the running container:

```dockerfile
RUN useradd --uid 1000 --create-home sim
USER sim
```

The user must exist first, which is why the `RUN` step created `sim` before the `USER` line.

::: example Who owns the files a container writes
Make a `results` folder on the host (here made writable by everyone with `chmod 777 results`, so all three containers are allowed to write). Then share it into three containers. The option `-v "$PWD/results:/out"` is a **bind mount**: it makes the host folder `results` appear inside the container at `/out` (lesson 5 covers mounts properly).

```bash
docker run --rm -v "$PWD/results:/out" python:3.12-slim \
  sh -c 'echo 1 > /out/as_root.csv'
docker run --rm -v "$PWD/results:/out" --entrypoint sh apogee:0.1.0 \
  -c 'echo 1 > /out/as_sim.csv'
docker run --rm --user 1234:1234 -v "$PWD/results:/out" python:3.12-slim \
  sh -c 'echo 1 > /out/as_1234.csv'
ls -ln results
```

```text
-rw-r--r-- 1 1234 1234 2 Sep 27 02:28 as_1234.csv
-rw-r--r-- 1    0    0 2 Sep 27 02:28 as_root.csv
-rw-r--r-- 1 1000 1000 2 Sep 27 02:28 as_sim.csv
```

`ls -ln` shows owners as numbers. The plain Python image wrote as uid 0: root. Our image, with `USER sim`, wrote as uid 1000. The third run used `--user 1234:1234`, which overrides the user for one run (the format is `uid:gid`), and wrote as 1234.

On many Linux desktops the first normal account is uid 1000 (check yours with `id -u`). If yours is, the files written by `apogee` belong to you on the host, with no `sudo` needed to tidy up.
:::

::: key Root inside a container
The process runs as uid 0 unless USER says otherwise. Files it writes to a bind mount are root-owned on the host, and a container escape starts from root. Add a non-root USER for anything that touches shared storage.
:::

There are three standard fixes when a container leaves root-owned files behind. Declare a `USER` whose uid matches the host user. Or start the container with `--user "$(id -u):$(id -g)"`, which picks your own ids at run time. Or have the container's start-up script `chown` the files to the right owner before it exits. Running `docker` with `sudo` fixes nothing: the uid inside the container is what lands on the files.

## HEALTHCHECK: is it working, or only running?

The apogee tool runs and exits. Other containers run for hours: a telemetry server, a database, a dashboard. For those, "the process is still running" is not the same as "it is doing its job". A server can be stuck, holding its port but answering nothing.

`HEALTHCHECK` tells Docker how to test that the service really works. Docker runs the test command inside the container at a regular interval. Exit code 0 means healthy; anything else counts as a failure; several failures in a row mark the container **[[unhealthy|health-and-kubernetes]]**.

Here is a tiny status web page served by Python's built-in web server, with a check that fetches the page:

```dockerfile
FROM python:3.12-slim
WORKDIR /srv
RUN echo "sim status: nominal" > index.html \
 && useradd --uid 1000 web
USER web
HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
  CMD ["python3", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/', timeout=2)"]
ENTRYPOINT ["python3", "-m", "http.server"]
CMD ["8000"]
```

The options say: test every 10 seconds, give each test at most 3 seconds, and call the container unhealthy after 3 failures in a row. The `CMD` inside the `HEALTHCHECK` line is the test command; it is separate from the container's own `CMD`. The test uses Python because the slim image has no `curl`.

Build it as `status:0.1.0`, start it in the background with `docker run -d --name status status:0.1.0`, and watch `docker ps`:

```text
NAMES     STATUS
status    Up 1 second (health: starting)
```

```text
NAMES     STATUS
status    Up 13 seconds (healthy)
```

To see a failure, the server was then frozen from the host with `docker kill --signal=STOP status` (that pauses the process without ending it; this run also used `--health-interval=2s` to make the wait shorter). Soon after:

```text
NAMES     STATUS
status    Up 20 seconds (unhealthy)
```

The container is still "Up" — the process exists — but Docker now knows it is not answering. Tools that manage many containers use this signal to restart or replace a stuck service. Lesson 7 shows how Kubernetes builds on the same idea.

## Check yourself

::: check
An image has `ENTRYPOINT ["python3", "sim.py"]` and `CMD ["--cases", "100"]`. Write out the full command that runs for each of these: (a) `docker run img`, (b) `docker run img --cases 5000 --seed 7`, (c) `docker run --entrypoint bash img`.
:::

::: answer
(a) `python3 sim.py --cases 100`: the entrypoint plus the default `CMD`.
(b) `python3 sim.py --cases 5000 --seed 7`: the run arguments replace the whole `CMD`; the entrypoint stays.
(c) `bash`, with no arguments. `--entrypoint` replaces the program *and* clears the image's default `CMD`, so nothing is appended. (Add `-it` to get an interactive shell you can type into.)
:::

::: check
A teammate puts `ARG API_TOKEN` in a Dockerfile and builds with `--build-arg API_TOKEN=abc123`, reasoning that "build arguments disappear after the build, so the token is safe". What is wrong with that reasoning?
:::

::: answer
It is true that the value is not set as an environment variable in running containers. But any `RUN` step that used the argument records it in the image history, and `docker history --no-trunc` prints it, as `RUN |1 API_TOKEN=abc123 …`. Anyone who can pull the image can read the token. Secrets must be kept out of `ARG` and `ENV` entirely.
:::

::: check
Why does the `apogee` Dockerfile create the `sim` user with a `RUN` step *before* the `USER sim` line, and what would go wrong if the two were swapped?
:::

::: answer
`USER sim` only chooses an existing user; it does not create one. If `USER sim` came first, the following `RUN useradd …` would also run as `sim`, and the build would fail, because the user does not exist yet and, even if it did, only root may add users. Creating the user as root first, then switching, is the standard order.
:::

::: check
Your container writes its results to a bind-mounted folder, and afterwards `ls -ln` on the host shows the files owned by uid 0. Give two different fixes, and say why `sudo docker run` is not one of them.
:::

::: answer
Fix 1: add a `USER` to the Dockerfile whose uid matches your host account (for example `useradd --uid 1000 sim` then `USER sim`, if `id -u` prints 1000). Fix 2: start the container with `--user "$(id -u):$(id -g)"`, so the process runs with your own ids. (A third: `chown` the output in the container's start-up script.) `sudo` only changes who runs the `docker` command on the host; the process inside the container still runs as uid 0, and uid 0 is what gets written onto the files.
:::

::: check
A dashboard container shows `Up 3 hours (unhealthy)` in `docker ps`. What does that tell you, and what does it *not* tell you?
:::

::: answer
It tells you the process is still alive (Up for 3 hours), but the `HEALTHCHECK` command has failed several times in a row — the service is not answering its test. It does not tell you *why*: the program might be stuck, overloaded, or waiting on a database. `docker inspect` shows the recent test results and their output, which is the place to start looking.
:::

## Summary

| Instruction | What it does | When it acts |
| --- | --- | --- |
| `FROM` | Picks the base image | Build (must come first) |
| `WORKDIR` | Sets and creates the working folder | Build and run |
| `COPY` | Copies files from the build context | Build |
| `RUN` | Runs a shell command, saves a layer | Build |
| `ENV` | Sets an environment variable in the image | Build and run |
| `ARG` | Declares a `--build-arg` value | Build only (but visible in history) |
| `ENTRYPOINT` | The program the container always runs | Run |
| `CMD` | Default arguments, replaced by `docker run` arguments | Run |
| `USER` | Which uid runs later steps and the container | Build and run (default is root) |
| `HEALTHCHECK` | A test Docker repeats to mark healthy or unhealthy | Run |

Every time you rebuild this image, Docker reuses the layers it already has wherever it safely can. The next lesson shows how that reuse works, how to order a Dockerfile so it works for you, and how to leave the compiler out of the image you ship.

::: context sounding-rockets Real rockets that fly up and come back
Sounding rockets are a real workhorse of space science. They carry instruments above most of the atmosphere for a few minutes of measurements, then fall back, often by parachute. NASA flies them from Wallops Flight Facility in Virginia and White Sands in New Mexico, among other sites. Their name comes from the old nautical word "to sound", meaning to measure — the same word as in sounding the depth of water. Real flight analysis includes air drag, which lowers the apogee well below this lesson's no-drag number.
:::

::: context argparse-module Python's command-line reader
`argparse` is part of Python's standard library, so it needs no installation. You describe the options a program accepts, and it reads them from the command line, converts types (`type=float`), prints help for `--help`, and stops with a clear message if a required option is missing. Programs built this way behave well inside containers, because the container's arguments arrive exactly like command-line arguments.
:::

::: context build-context-intro The folder the build can see
When you run `docker build .`, the Docker client packs up the folder `.` and sends it to the part of Docker that does the building. Only files in that package can be copied into the image. The context is the reason `COPY ../file` fails. It is also the reason a project folder full of simulation results makes every build slower: all of it may be sent each time. Lesson 3 shows how a `.dockerignore` file trims the context down.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="20" width="140" height="110" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="80" y="40" font-size="12" text-anchor="middle" fill="#1f2a44" font-weight="700">project folder "."</text>
  <text x="24" y="62" font-size="11" fill="#1f2a44">Dockerfile</text>
  <text x="24" y="80" font-size="11" fill="#1f2a44">apogee.py</text>
  <text x="24" y="98" font-size="11" fill="#1f2a44">results/ …</text>
  <text x="24" y="116" font-size="11" fill="#6c7a93">(everything inside)</text>
  <line x1="152" y1="75" x2="206" y2="75" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="206,70 216,75 206,80" fill="#1d6fd1"/>
  <text x="182" y="66" font-size="11" text-anchor="middle" fill="#1d6fd1">sent</text>
  <rect x="218" y="20" width="132" height="110" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="284" y="44" font-size="12" text-anchor="middle" fill="#1f2a44" font-weight="700">builder</text>
  <text x="284" y="70" font-size="11" text-anchor="middle" fill="#1f2a44">COPY can use only</text>
  <text x="284" y="86" font-size="11" text-anchor="middle" fill="#1f2a44">what was sent</text>
  <text x="284" y="112" font-size="11" text-anchor="middle" fill="#b4232c">../ is out of reach</text>
</svg>
```
:::

::: context unbuffered-output Why Python output can go missing
When Python's output goes to a terminal, it prints each line at once. When the output goes to a pipe or a file — which is what `docker logs` collects — Python saves it up in a **buffer** and writes it in big chunks. A long simulation can then run for minutes with no visible output, and if it crashes, the last lines in the buffer are lost. `PYTHONUNBUFFERED=1` turns the buffer off, so every line reaches the log as soon as it is printed.
:::

::: context exec-form Why the brackets matter
In the exec form, Docker starts your program directly: it becomes process number 1 in the container and receives the arguments exactly as listed. In the shell form, Docker starts `/bin/sh -c "…"` and the shell starts your program. That extra layer is why run arguments get lost. It can also get in the way of signals: `docker stop` sends a stop signal to process 1 and, if the process has not exited after 10 seconds, kills it. A program that never sees the stop signal cannot save its work before it is killed.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="90" y="18" font-size="12" text-anchor="middle" fill="#1f2a44" font-weight="700">exec form</text>
  <text x="270" y="18" font-size="12" text-anchor="middle" fill="#1f2a44" font-weight="700">shell form</text>
  <rect x="20" y="32" width="140" height="34" rx="4" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="90" y="53" font-size="12" text-anchor="middle" fill="#1f2a44">PID 1: python3 apogee.py</text>
  <text x="90" y="88" font-size="11" text-anchor="middle" fill="#1f2a44">run arguments appended</text>
  <rect x="200" y="32" width="140" height="34" rx="4" fill="#f2b880" stroke="#1f2a44"/>
  <text x="270" y="53" font-size="12" text-anchor="middle" fill="#1f2a44">PID 1: /bin/sh -c "…"</text>
  <line x1="270" y1="66" x2="270" y2="86" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="200" y="86" width="140" height="34" rx="4" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="270" y="107" font-size="12" text-anchor="middle" fill="#1f2a44">python3 apogee.py</text>
  <text x="270" y="140" font-size="11" text-anchor="middle" fill="#b4232c">run arguments ignored</text>
</svg>
```
:::

::: context uid-numbers Users are numbers underneath
Names like `root` or `sim` are for people. The kernel only stores numbers: every file records the uid and gid (group id) of its owner. The file `/etc/passwd` maps names to numbers, and every container image has its own `/etc/passwd`. That is why a file written by `sim` in the container shows up on the host as owned by whichever host account happens to have uid 1000 — or by no named account at all, which is what `ls -l` shows as a bare number.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="14" width="150" height="80" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="85" y="34" font-size="12" text-anchor="middle" fill="#1f2a44" font-weight="700">container</text>
  <text x="85" y="56" font-size="11" text-anchor="middle" fill="#1f2a44">/etc/passwd: sim = 1000</text>
  <text x="85" y="76" font-size="11" text-anchor="middle" fill="#1f2a44">writes /out/as_sim.csv</text>
  <rect x="200" y="14" width="150" height="80" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="275" y="34" font-size="12" text-anchor="middle" fill="#1f2a44" font-weight="700">host</text>
  <text x="275" y="56" font-size="11" text-anchor="middle" fill="#1f2a44">file owner stored: 1000</text>
  <text x="275" y="76" font-size="11" text-anchor="middle" fill="#1f2a44">your account = 1000?</text>
  <line x1="162" y1="54" x2="194" y2="54" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="194,49 202,54 194,59" fill="#1d6fd1"/>
  <text x="180" y="122" font-size="12" text-anchor="middle" fill="#1f2a44">only the number crosses the boundary</text>
</svg>
```
:::

::: context container-escape When isolation breaks
A container escape is a bug, usually in the kernel or in the container runtime, that lets a process leave its namespaces and act directly on the host. Such bugs are found and fixed from time to time, which is why security teams treat containers as one layer of defense, not the only one. A process that was running as an ordinary user when it escaped can do far less damage than one that was root. The same reasoning is behind never running daily work as root on your own machine.
:::

::: context health-and-kubernetes Health checks at larger scale
On its own, Docker only reports the health status; with default settings it does not restart an unhealthy container for you. The status becomes powerful when something acts on it. Docker Compose, in lesson 5, can wait for a database to report healthy before starting the simulation that needs it. Kubernetes, in lesson 7, has its own versions called probes: a liveness probe restarts a stuck program, and a readiness probe keeps traffic away from a program that is not ready yet.
:::
