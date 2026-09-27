---
id: l05-volumes-networks-and-compose
title: Volumes, networks and docker compose
minutes: 22
covers:
  - Volumes and bind mounts, networks, port publishing
  - docker compose for sim + database + dashboard stacks
---

Picture a hotel. Each guest gets a room that is cleaned out completely when they check out. If a guest wants to keep something between visits, they have two choices. They can bring their own suitcase and carry it in and out — it is theirs, they pack it, they decide what goes where. Or they can leave things with the front desk, which stores them in a back room, labels them, and hands them back next visit. The rooms also have phones: guests can call each other by room name for free, but a call from outside only gets through if the front desk has set up a line to that room.

That hotel is how Docker handles data and connections. A container's writable layer is the room: when the container is removed, it is wiped. A **bind mount** is your own suitcase: a folder from your computer carried into the container. A **named volume** is the front-desk storage: space Docker manages for you. A **network** is the phone system between rooms, and **port publishing** is the outside line.

A real GNC workflow needs all three. A Monte Carlo campaign writes results that must survive the container. A telemetry replay tool stores packets in a database that must survive restarts. A dashboard in your browser must reach the database, and the simulation must reach the database, but nobody on the office network should reach it by accident. The last part of this lesson writes the whole thing down in one file with **docker compose**, and starts a simulation, a database and a dashboard with one command. Everything was run with Docker 29.3.1 and Docker Compose 5.1.1, and the output is copied from the real terminal.

## Why the writable layer is not enough

Lesson 1 showed that anything a container writes lands in its thin writable layer, and `docker rm` destroys that layer. Two more problems make the writable layer a poor home for data:

- It is tied to one container. A new container from the same image, say after you rebuild with a bug fix, starts with a fresh, empty layer.
- It is hard to reach from outside. Your plotting script on the host cannot open a file that lives in a container's layer.

So data that matters goes outside the container, through a **mount**: a folder that appears inside the container but actually lives somewhere else. Docker has two main kinds.

## Bind mounts: a host folder inside the container

A **bind mount** maps a path on the host into the container. The container sees the host's real files; a change on either side shows up on the other immediately, because there is only one copy.

You write it with `-v host_path:container_path`, and the host path must be absolute (it starts with `/`). `$PWD` is the shell's current folder, so `"$PWD/out"` is the `out` folder where you are standing.

```bash
mkdir out
docker run --rm -v "$PWD/out:/out" debian:bookworm-slim sh -c 'id; echo 1 > /out/as_root.csv'
docker run --rm --user 1000:1000 -v "$PWD/out:/out" debian:bookworm-slim sh -c 'id; echo 1 > /out/as_1000.csv'
ls -ln out
```

```text
uid=0(root) gid=0(root) groups=0(root)
uid=1000 gid=1000 groups=1000
total 8
-rw-r--r-- 1 1000 1000 2 Sep 27 02:36 as_1000.csv
-rw-r--r-- 1    0    0 2 Sep 27 02:36 as_root.csv
```

Both files are on the host, in `out`, after the containers are gone. Look at the owners (`ls -ln` shows them as numbers). The first container ran as root, uid 0, so its file belongs to root on the host. The second ran as uid 1000 and left a file owned by 1000. The owner number inside the container is exactly the owner number on the host, because a bind mount is the host's own folder. Lesson 2's `USER` section explained why that matters and the three fixes: a `USER` with the host's uid, `--user "$(id -u):$(id -g)"` at run time, or a `chown` before the container exits. (For this demo the `out` folder was made writable by everyone with `chmod 777 out`, so both users could write into it.)

Add `:ro` (read only) to the end of a mount and the container can read but never change it: `-v "$PWD/config:/config:ro"`. Mount input data and configuration read-only, so a bug cannot damage them.

Bind mounts shine during development. Mount your source folder into a container that has the compilers, edit files in your normal editor on the host, and rebuild inside the container without rebuilding the image. The host decides the folder layout and owns the files, which is what you want for source code.

## Named volumes: storage Docker manages

A **named volume** is storage that Docker creates and looks after. You refer to it by name, not by a host path, and it lives until you delete it.

```bash
docker volume create simcache
docker volume inspect simcache
```

```text
[
    {
        "CreatedAt": "2026-09-27T02:36:15Z",
        "Driver": "local",
        "Labels": null,
        "Mountpoint": "/var/lib/docker/volumes/simcache/_data",
        "Name": "simcache",
        "Options": null,
        "Scope": "local"
    }
]
```

The `Mountpoint` shows where the data really sits on the Linux host: [[inside Docker's own storage area|volume-home]], not in your project. You mount it with the same `-v` flag, but with a name where the host path was:

```bash
docker run --rm -v simcache:/data debian:bookworm-slim sh -c 'echo hi > /data/x; ls /data'
docker run --rm -v simcache:/data:ro debian:bookworm-slim sh -c 'cat /data/x; echo no > /data/y'
docker volume rm simcache
```

```text
x
hi
sh: 1: cannot create /data/y: Read-only file system
simcache
```

The first container wrote `x` and was removed. The second, a brand-new container, still found `x` in the volume and read `hi`. It could not write `y`, because it mounted the volume `:ro`. Then `docker volume rm` deleted the volume and its data for good.

Why use a volume instead of a folder? Because a database does not want you in its files. PostgreSQL keeps its data in a precise layout, with its own permissions, owned by its own internal user. A named volume gives it a private place with its own **lifecycle**: created when first needed, kept across container restarts and image upgrades, deleted only when you ask. Docker also fills a new, empty volume with whatever the image had at that path, owners and all, which a bind mount does not.

::: key Bind mount vs named volume
A bind mount maps a host path into the container, so the host owns the data and the layout; a named volume is managed by Docker with its own lifecycle. Bind mounts for source during development, volumes for databases.
:::

::: warning Removing a container keeps its volume
`docker rm` and `docker compose down` remove containers but keep named volumes, on purpose, so your database survives. That also means old volumes pile up and quietly fill the disk, and a "fresh start" may secretly reuse yesterday's data. List them with `docker volume ls`. Remove one with `docker volume rm name`, or a compose project's volumes with `docker compose down -v`, and only when you mean it.
:::

## Networks: how containers find each other

Every container gets its own network stack: its own IP address and its own set of **ports**, the numbered doors a program listens behind (PostgreSQL listens on 5432 by default, Grafana on 3000). Containers join a Docker **network**, which works like a small [[virtual network switch|bridge-network]] inside the host. Containers on the same network can talk to each other; containers on different networks cannot.

The most useful feature of a network you create yourself is that containers can find each other by **name**. Docker runs a small [[name service|docker-dns]] for each such network. Watch the difference:

```bash
docker network create gnclab
docker run -d --name tracker --network gnclab debian:bookworm-slim sleep 60
docker run --rm --network gnclab debian:bookworm-slim getent hosts tracker
```

```text
172.18.0.2      tracker
```

`getent hosts tracker` asks "what is the address of the name `tracker`?" On the network `gnclab`, the answer came back: 172.18.0.2. Now the same thing without `--network`, so both containers land on Docker's built-in default network:

```bash
docker run -d --name tracker2 debian:bookworm-slim sleep 60
docker run --rm debian:bookworm-slim getent hosts tracker2; echo "exit=$?"
```

```text
exit=2
```

No answer; exit code 2 means "not found". The old default network does not offer names. So always put containers that must talk into a network you created (compose does this for you, as you will see). Never hard-code a container's IP address: it can change every time the container is recreated. Use its name.

## Port publishing: the outside line

A network lets containers talk to each other. Your browser, though, runs on the host, not in a container. To reach a program inside a container from the host, or from other computers, you **publish** a port with `-p host_port:container_port`. Docker then forwards traffic arriving at the host's port to the container's port.

```bash
docker run -d --name web -p 8080:80 -p 127.0.0.1:8081:80 nginx:1.27
docker port web
```

```text
80/tcp -> 0.0.0.0:8080
80/tcp -> 127.0.0.1:8081
```

The web server inside listens on port 80. It was published twice, to show the two forms.

- `-p 8080:80` bound host port 8080 on **0.0.0.0**, which means [[every network interface the host has|all-interfaces]]. Anyone who can reach this computer over the network can open port 8080.
- `-p 127.0.0.1:8081:80` bound host port 8081 only on **127.0.0.1**, the **loopback** address, which means "this computer only". A browser on the host can open `http://127.0.0.1:8081`; nobody else can.

::: example Reading a port mapping
A compose file says a Grafana service has `ports: ["127.0.0.1:3000:3000"]`, and a PostgreSQL service has no `ports` at all. Which of these connections work?

1. A browser on the host opens `http://127.0.0.1:3000`. The mapping reads left to right as host address 127.0.0.1, host port 3000, container port 3000. The host's loopback port 3000 is forwarded to Grafana's port 3000. **Works.**
2. A teammate's laptop opens `http://your-machine:3000`. The port is bound only on loopback, so a connection arriving on the office network interface finds nothing listening. **Refused.** That is the point of the `127.0.0.1` prefix.
3. A program on the host connects to `127.0.0.1:5432`. PostgreSQL publishes nothing, so no host port forwards to it. **Refused.** (In the real stack below, `curl` to that address exited with code 7, "failed to connect".)
4. The Grafana container connects to `db:5432`. Both are on the same compose network, so the name `db` resolves and the connection goes straight to the database's own port. **Works**, with no publishing at all.

Container-to-container traffic never needs `-p`. Publishing is only for traffic that starts outside Docker's networks.
:::

::: warning 0.0.0.0 is wider than it looks
`-p 5432:5432` puts your database on every network your computer is connected to, including office Wi-Fi. On Linux, Docker opens published ports by writing its own firewall rules, and traffic to them can bypass rules you set with a simple host firewall front end such as `ufw`. Publish only what a human needs to reach, and prefix it with `127.0.0.1:` unless others must reach it. The `EXPOSE` line in a Dockerfile does not publish anything; it is only a note saying which port the program uses.
:::

There are two other network modes you will see in documentation. `--network host` removes the container's separate network stack, so its programs listen directly on the host's ports (on Linux; any `-p` is ignored). `--network none` gives the container no network at all, which is a neat way to prove a simulation does not secretly download anything.

## docker compose: the whole stack in one file

A realistic analysis setup is three programs: a **simulation** that writes results, a **database** that stores them, and a **dashboard** that plots them. Starting that by hand means a network, a volume, three long `docker run` commands in the right order, and remembering all of it next month. **[[Docker Compose|compose-versions]]** replaces that with one file, usually named `compose.yaml`, that declares every service, its image, its settings, its mounts and its ports. The command `docker compose up` reads the file and makes reality match it.

The file is written in [[YAML|yaml-format]], where indentation shows what belongs to what. Here is a stack with a falling-ball "simulation", [[PostgreSQL 16 and Grafana 11|postgres-grafana]]:

```yaml
services:
  db:
    image: postgres:16-bookworm
    environment:
      POSTGRES_USER: sim
      POSTGRES_PASSWORD: dev-only-password
      POSTGRES_DB: telemetry
    volumes:
      - dbdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U sim -d telemetry"]
      interval: 2s
      retries: 15

  sim:
    build: ./sim
    environment:
      DATABASE_URL: postgresql://sim:dev-only-password@db:5432/telemetry
    depends_on:
      db:
        condition: service_healthy

  dashboard:
    image: grafana/grafana:11.6.0
    ports:
      - "127.0.0.1:3000:3000"
    depends_on:
      - db

volumes:
  dbdata:
```

Read it service by service.

- **`db`** runs the official PostgreSQL image. The `environment` lines are settings that image reads on its first start to create a user and a database. `volumes` mounts the named volume `dbdata` where PostgreSQL keeps its files, so the data outlives the container. The `healthcheck` is the same idea as lesson 2's `HEALTHCHECK`: every 2 seconds, run `pg_isready`, a PostgreSQL tool that succeeds once the database accepts connections. There is no `ports` section, so nothing outside Docker can reach it.
- **`sim`** has `build: ./sim` instead of `image`: compose builds the image from the Dockerfile in the `sim` folder. It finds the database through the address in `DATABASE_URL`, whose host part is `db`, the other service's name. `depends_on` with `condition: service_healthy` means "do not start me until `db` passes its health check". Without the condition, compose only waits until the `db` container has started, and the simulation could try to connect while PostgreSQL is still setting up.
- **`dashboard`** runs Grafana and publishes its web port on loopback only.
- The top-level **`volumes:`** declares `dbdata` as a named volume that compose creates and manages.

The simulation is a short Python script and a small Dockerfile in the `sim` folder:

```python
"""Drop a ball from 100 m and log its height to the database every 0.5 s."""
import os
import psycopg

G = 9.80665          # m/s^2
DT = 0.5             # s

with psycopg.connect(os.environ["DATABASE_URL"]) as conn:
    conn.execute("""CREATE TABLE IF NOT EXISTS drop_test (
                        t_s   double precision,
                        h_m   double precision)""")
    t, h = 0.0, 100.0
    rows = 0
    while h > 0.0:
        conn.execute("INSERT INTO drop_test VALUES (%s, %s)", (t, h))
        rows += 1
        t += DT
        h = 100.0 - 0.5 * G * t * t
    print(f"wrote {rows} rows, last t = {t - DT:.1f} s")
```

```dockerfile
FROM python:3.12-slim
RUN pip install --no-cache-dir "psycopg[binary]==3.2.10"
WORKDIR /app
COPY sim.py .
USER 1000:1000
CMD ["python", "sim.py"]
```

`psycopg` is the standard PostgreSQL driver for Python. (The sandbox this lesson was run in needed one extra line in the Dockerfile to trust its network proxy's certificate; it is left out here because your machine will not need it.)

::: example Bringing the stack up and checking it
Start everything in the background (`-d`, detached) under the project name `flightlog` (output trimmed to the main lines):

```bash
docker compose -p flightlog up -d
```

```text
 Container flightlog-db-1 Started
 Container flightlog-db-1 Waiting
 Container flightlog-dashboard-1 Started
 Container flightlog-db-1 Healthy
 Container flightlog-sim-1 Starting
 Container flightlog-sim-1 Started
```

Follow the order. `db` started first. Compose then waited for it to report healthy, and only then started `sim`. `dashboard` only asked for `db` to have started, so it did not wait for the health check.

```bash
docker compose -p flightlog ps -a
docker compose -p flightlog logs sim
```

```text
NAME                    IMAGE                    SERVICE     STATUS                     PORTS
flightlog-dashboard-1   grafana/grafana:11.6.0   dashboard   Up 10 seconds              127.0.0.1:3000->3000/tcp
flightlog-db-1          postgres:16-bookworm     db          Up 10 seconds (healthy)    5432/tcp
flightlog-sim-1         flightlog-sim            sim         Exited (0) 7 seconds ago
sim-1  | wrote 10 rows, last t = 4.5 s
```

(Some columns are trimmed.) The simulation ran and exited with code 0, success. The database shows `5432/tcp` with no arrow: the port exists inside the network but is not published. Grafana shows the arrow from host loopback port 3000.

Check the simulation's claim by hand. The ball hits the ground when $100 - \tfrac{1}{2} g t^2 = 0$, so $t = \sqrt{2 \times 100 / 9.80665} \approx 4.52$ s. Samples at $t = 0, 0.5, 1.0, \ldots, 4.5$ s are all before impact: that is $4.5 / 0.5 + 1 = 10$ rows. At $t = 5.0$ s the height is $100 - 0.5 \times 9.80665 \times 25 \approx -22.6$ m, below ground, so the loop stopped. Ten rows, last at 4.5 s: it matches.

Now ask the database, by running `psql` inside the `db` container with `docker compose exec`:

```bash
docker compose -p flightlog exec db psql -U sim -d telemetry \
  -c "SELECT t_s, round(h_m::numeric,2) AS h_m FROM drop_test ORDER BY t_s DESC LIMIT 3;"
```

```text
 t_s |  h_m
-----+-------
 4.5 |  0.71
   4 | 21.55
 3.5 | 39.93
(3 rows)
```

Check the last row: $100 - 0.5 \times 9.80665 \times 4.5^2 = 100 - 99.29 = 0.71$ m. The ball was 71 cm above the ground at the last sample.
:::

Compose created more than containers. It made a network named after the project, `flightlog_default`, and put all three services on it; that is why `sim` could reach `db` by name. It also made the volume `flightlog_dbdata`. From inside the dashboard container:

```bash
docker compose -p flightlog exec dashboard getent hosts db
curl -s 127.0.0.1:3000/api/health
```

```text
172.18.0.2        db  db
{
  "database": "ok",
  "version": "11.6.0",
  "commit": "d2fdff9ee4d75c74bfd3a97c18a0b8e4d029f06e"
}
```

The name `db` resolves inside the network, and Grafana answers on the host's loopback port. (The `"database": "ok"` is Grafana's own internal settings store. To plot the `drop_test` table, you add PostgreSQL as a data source in Grafana, at host `db:5432` — the name, not `localhost`, because Grafana runs in its own container.)

Finally, the volume's lifecycle, for real:

```bash
docker compose -p flightlog down          # containers and network removed
docker volume ls --filter name=flightlog  # the volume is still there
docker compose -p flightlog up -d db
docker compose -p flightlog exec db psql -U sim -d telemetry -tc "SELECT count(*) FROM drop_test;"
docker compose -p flightlog down -v       # this time remove the volume too
```

```text
DRIVER    VOLUME NAME
local     flightlog_dbdata
    10
```

After `down`, the containers and network were gone but `flightlog_dbdata` survived, and a brand-new `db` container found all 10 rows. Only `down -v` deleted the data.

::: key Why compose fits a sim + database + dashboard stack
Compose declares several dependent services, their networks and volumes in one versioned file. Commit `compose.yaml` to git next to the code, and anyone on the team can run `docker compose up` and get the same three services, wired the same way.
:::

::: warning Passwords in compose files
`dev-only-password` in this file is fine for a stack that only exists on your laptop and publishes nothing but a loopback port. A real password must never be committed to git. Compose can read values from a separate `.env` file that git ignores, or from secret files; use one of those for anything shared.
:::

## Check yourself

::: check
You run `docker run --rm -v "$PWD/results:/out" mysim` and later find you cannot delete the files in `results` without `sudo`. Explain why, and give a fix that needs no change to the image.
:::

::: answer
A bind mount is the host's own folder, so the files the container writes keep the container process's uid. The image has no `USER`, so the process ran as uid 0, and the files are owned by root on the host. Without changing the image, run it with `--user "$(id -u):$(id -g)"`, so the process runs with your own uid and gid and the files come out owned by you. (The folder must be writable by that uid, which your own folder is.)
:::

::: check
A teammate stores PostgreSQL's data with `-v "$PWD/pgdata:/var/lib/postgresql/data"`. What kind of mount is that, and why would a named volume usually be the better choice here?
:::

::: answer
It is a bind mount: a host path mapped into the container. For a database a named volume is usually better. The database wants to own its files, with its own user and permissions; with a bind mount the host's folder permissions and ownership get in the way, and files owned by the database's internal uid appear in the project folder. A named volume is managed by Docker, kept across container restarts and upgrades, deleted only on request, and keeps database files out of the source tree.
:::

::: check
In a compose file, service `api` has `ports: ["8000:8000"]` and service `cache` has no `ports`. (a) Can a program in `api` reach `cache`? At what address? (b) Can a colleague on the office network reach `api`? (c) Can they reach `cache`?
:::

::: answer
(a) Yes. Compose put both on the project's network, which provides names, so `api` connects to `cache` by its service name at the port the cache program listens on inside its container. No publishing is needed. (b) Yes: `8000:8000` has no address prefix, so it binds on 0.0.0.0, every interface of the host, and anyone who can reach the machine can open port 8000. If that was not intended, write `127.0.0.1:8000:8000`. (c) No: `cache` publishes nothing, so no host port forwards to it.
:::

::: check
Without `condition: service_healthy`, the `sim` service in this lesson sometimes fails with "connection refused" and sometimes works. Why is it random?
:::

::: answer
A plain `depends_on` only waits until the `db` container has *started*, not until PostgreSQL inside it is ready. PostgreSQL needs a moment after start-up to initialise, especially on the first run when it creates the database. If the simulation connects during that moment, it is refused; if it happens to connect a little later, it works. The timing varies from run to run, so the failure looks random. The health check makes compose wait until `pg_isready` succeeds.
:::

::: check
After `docker compose down` and `docker compose up -d`, your "fresh" test database already contains last week's rows. What happened, and how do you get a truly empty one?
:::

::: answer
`down` removes containers and the network but deliberately keeps named volumes, so the new `db` container mounted the same volume with last week's data in it. To start empty, run `docker compose down -v`, which also removes the project's named volumes, and then `up` again. Do this only when you are sure the data is not needed.
:::

## Summary

| Idea | What it is | How to write it |
| --- | --- | --- |
| Bind mount | Host folder inside the container; the host owns it | `-v "$PWD/out:/out"` |
| Named volume | Docker-managed storage with its own lifecycle | `-v dbdata:/var/lib/postgresql/data` |
| Read-only mount | Container can read but not write | add `:ro` |
| User-defined network | Containers reach each other by name | `docker network create`, `--network` |
| Port publishing | Host port forwarded to a container port | `-p 127.0.0.1:3000:3000` |
| 0.0.0.0 vs 127.0.0.1 | Every interface vs this machine only | prefer the loopback prefix |
| Compose file | Services, networks, volumes in one YAML file | `compose.yaml` |
| Compose commands | Start, inspect, run inside, stop | `up -d`, `ps`, `logs`, `exec`, `down`, `down -v` |
| Startup order | Wait for a healthy dependency | `depends_on` + `condition: service_healthy` |

The stack in this lesson pulled `postgres:16-bookworm` and `grafana/grafana:11.6.0` by tag. The next lesson asks what those tags actually promise, why a tag can point at different bytes next month, and how a digest and a lockfile pin an environment tightly enough to rerun a result years later.

::: context volume-home Where a volume really lives
On a Linux host, Docker keeps each local volume as an ordinary folder under `/var/lib/docker/volumes/`. You could look inside with `sudo`, but you are not supposed to edit it by hand: it belongs to Docker and to the container using it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <rect x="8" y="8" width="344" height="174" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="18" y="26" font-size="12" fill="#1f2a44">Host filesystem</text>
  <rect x="20" y="40" width="130" height="36" fill="#f2b880" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="85" y="62" font-size="11" text-anchor="middle" fill="#1f2a44">~/project/out</text>
  <rect x="20" y="120" width="150" height="48" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="95" y="140" font-size="11" text-anchor="middle" fill="#1f2a44">/var/lib/docker/</text>
  <text x="95" y="156" font-size="11" text-anchor="middle" fill="#1f2a44">volumes/dbdata</text>
  <rect x="205" y="50" width="145" height="112" fill="#ffffff" stroke="#1d6fd1" stroke-width="2"/>
  <text x="277" y="68" font-size="12" text-anchor="middle" fill="#1d6fd1">container</text>
  <text x="277" y="96" font-size="11" text-anchor="middle" fill="#1f2a44">/out</text>
  <text x="277" y="146" font-size="11" text-anchor="middle" fill="#1f2a44">/var/lib/postgresql/data</text>
  <line x1="150" y1="58" x2="258" y2="92" stroke="#b4232c" stroke-width="1.5"/>
  <text x="185" y="62" font-size="11" fill="#b4232c">bind</text>
  <line x1="170" y1="144" x2="210" y2="142" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="178" y="134" font-size="11" fill="#1d6fd1">volume</text>
</svg>
```

On Mac and Windows, Docker Desktop runs Linux inside a small hidden virtual machine, so this folder lives inside that machine, not on your visible disk. That is also why bind mounts there can be slower: each file access crosses from your real disk into the virtual machine.
:::

::: context bridge-network A switch made of software
A Docker network of the default kind is called a bridge. On the host, Docker creates a virtual network switch and plugs a virtual cable from each attached container into it. Containers on the same switch can reach each other; the switch is connected to the outside world through the host, which forwards and translates traffic. A container can be plugged into several networks at once, which is how you let a dashboard reach a database without letting it reach everything else.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="110" y="62" width="140" height="26" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="80" font-size="11" text-anchor="middle" fill="#1f2a44">flightlog_default</text>
  <rect x="10" y="10" width="80" height="30" fill="#ffffff" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="50" y="30" font-size="11" text-anchor="middle" fill="#1f2a44">sim</text>
  <rect x="140" y="10" width="80" height="30" fill="#ffffff" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="180" y="30" font-size="11" text-anchor="middle" fill="#1f2a44">db :5432</text>
  <rect x="270" y="10" width="80" height="30" fill="#ffffff" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="310" y="30" font-size="11" text-anchor="middle" fill="#1f2a44">dashboard</text>
  <line x1="50" y1="40" x2="140" y2="62" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="40" x2="180" y2="62" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="310" y1="40" x2="220" y2="62" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="310" y1="40" x2="310" y2="112" stroke="#b4232c" stroke-width="1.5"/>
  <text x="310" y="128" font-size="11" text-anchor="middle" fill="#b4232c">host 127.0.0.1:3000</text>
  <text x="180" y="112" font-size="11" text-anchor="middle" fill="#6c7a93">no arrow to db from outside</text>
</svg>
```
:::

::: context docker-dns A phone book for each network
On a network you create, Docker answers name lookups itself. Inside each container, the address book points at a small name server Docker runs at the special address 127.0.0.11. When `sim` asks for `db`, that server answers with the current address of the container called `db` (and, in compose, with the service name as well). Because the answer is looked up each time, it stays right even if `db` is recreated and gets a new address.
:::

::: context all-interfaces What 0.0.0.0 means
A computer can have several network interfaces at once: Wi-Fi, a wired connection, a VPN, and the loopback interface that only talks to itself. Each has its own address. When a program listens on 0.0.0.0, it means "any of my addresses", so it accepts connections arriving through every one of them. 127.0.0.1 is the loopback address; a connection to it never leaves the machine. The number 0.0.0.0 is a placeholder meaning "unspecified", not a real destination you can connect to.
:::

::: context compose-versions Two spellings of compose
The original tool was a separate Python program run as `docker-compose`, with a hyphen. It was replaced by a plugin for the Docker command itself, run as `docker compose`, with a space; the old one is no longer maintained. Older compose files begin with a line like `version: "3.8"`. Current Compose ignores that line and warns that it is obsolete, so new files leave it out, as this lesson's file does.
:::

::: context yaml-format Indentation that means something
YAML ("YAML Ain't Markup Language", a joke name that refers to itself) is a text format for settings. Indentation with spaces shows nesting, a `-` starts a list item, and `key: value` makes a pair. Tabs are not allowed for indentation, and one space too many or too few moves a setting under the wrong parent. When compose complains about an "additional property" or ignores a setting, check the indentation first. The same format describes GitHub Actions workflows in the next module and Kubernetes objects in lesson 7.
:::

::: context postgres-grafana The two borrowed services
PostgreSQL is a free, open-source relational database that has been developed for decades; teams use it to store anything from test campaigns to telemetry tables. Grafana is a free web dashboard tool that reads from databases like PostgreSQL and draws live plots. Neither needed any installation here: each came as an official image, which is exactly the convenience compose is built around.
:::
