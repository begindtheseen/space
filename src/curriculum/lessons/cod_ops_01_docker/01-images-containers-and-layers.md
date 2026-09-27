---
id: l01-images-containers-and-layers
title: Images, containers and the layers inside them
minutes: 22
covers:
  - Images vs containers; layers and the union filesystem
---

Picture an old classroom overhead projector and a stack of clear plastic sheets. The bottom sheet has a map of the United States printed on it. The next sheet adds the state borders. The next adds the big cities. Lay them on top of each other and you see one finished map. Now put a fresh, empty sheet on top and draw your road trip on it with a marker. When the trip is over, you throw that top sheet away. The printed sheets underneath were never touched, and the next student gets the same clean map.

That stack is almost exactly how Docker works. The printed sheets are an **image**: a frozen, read-only bundle of files. Your marker sheet is a **container**: a running copy of the image with a thin, writable sheet on top. This lesson is about those two things and the trick that stacks the sheets.

Why should someone who wants to fly rockets care? Because a simulation result is only evidence if someone else can run it again and get the same numbers. Your Monte Carlo run depends on the operating system, the compiler, the libraries, the Python version and every package version. Change any one and the numbers can move. If an anomaly investigation in 2031 needs to rerun a case you ran in 2026, "it **[[worked on my machine|works-on-my-machine]]**" is not good enough. A container freezes all of that into one object you can store, name and run again. Everything below was run with Docker 29.3.1 on Linux, and the output is copied from the real terminal.

## The problem a container solves

Your program never runs alone. A Python simulation needs the Python interpreter, NumPy, the math library NumPy was built against, the C library underneath that, and the operating system files around all of them. Together these are the program's **environment**: everything outside your own code that your code needs in order to run.

On a normal computer the environment drifts. Someone upgrades NumPy. The operating system installs a security update. A new teammate installs a slightly different Python. Each change is small, and each one can shift the last digits of a result or break the build outright.

The container idea is to package the environment together with the program, so the whole thing travels as one piece. Docker is the most widely used tool for doing that. You will use two commands again and again:

- `docker pull` downloads an image.
- `docker run` starts a container from an image.

## Images: a read-only stack of layers

An **image** is an immutable stack of read-only filesystem **layers** plus some **metadata**. Take those words one at a time.

- **[[Immutable|immutable-word]]** means it can never be changed after it is made. You can build a new image, but you cannot edit an old one.
- A **layer** is one sheet in the stack: a set of files added, changed or removed compared to the layers below it.
- **Metadata** is data about the image rather than files in it: which command to run on start, which environment variables to set, which user to run as.

Download a small image of the Debian Linux distribution. The name after the colon is the **tag**, a label that picks one version; `bookworm-slim` means Debian 12, trimmed down.

```bash
docker pull debian:bookworm-slim
```

```text
774043ccc8cc: Pull complete
Digest: sha256:3783cc01769c7b2b1b83a5c5ad96c815348e28ed7da68e2e3687004faa906251
Status: Downloaded newer image for debian:bookworm-slim
docker.io/library/debian:bookworm-slim
```

The long string after `Digest:` is the image's **[[digest|digest-hash]]**: a fingerprint computed from its exact contents. Two images with the same digest are byte-for-byte the same. Lesson 6 of this module uses digests to pin an environment for years; for now, notice that every image has one.

Now list what you have:

```bash
docker images
```

```text
IMAGE                  ID             DISK USAGE   CONTENT SIZE
debian:bookworm-slim   3783cc01769c        116MB         30.6MB
gcc:14                 9188ac751ca2       2.15GB          558MB
python:3.12-slim       f77ac9e44ae9        179MB         45.4MB
```

Two sizes appear. **CONTENT SIZE** is the compressed download: what travels over the network. **DISK USAGE** is what the image takes on your drive once it is unpacked, plus the compressed copy Docker keeps. The compiler image `gcc:14` is more than ten times larger than the slim ones. Lesson 3 is about keeping that compiler out of the images you ship.

### Looking at the layers

`docker history` lists an image's layers, newest at the top. The Python image is built on top of a Debian image, so it shows both:

```bash
docker history python:3.12-slim
```

```text
IMAGE          CREATED      CREATED BY                                      SIZE
f77ac9e44ae9   8 days ago   CMD ["python3"]                                 0B
<missing>      8 days ago   RUN /bin/sh -c set -eux;  for src in idle3 p…   16.4kB
<missing>      8 days ago   RUN /bin/sh -c set -eux;   savedAptMark="$(a…   41.4MB
<missing>      8 days ago   ENV PYTHON_SHA256=5c8462af5790baf43a321a1559…   0B
<missing>      8 days ago   ENV PYTHON_VERSION=3.12.14                      0B
<missing>      8 days ago   ENV GPG_KEY=7169605F62C751356D054A26A821E680…   0B
<missing>      8 days ago   RUN /bin/sh -c set -eux;  apt-get update;  a…   4.95MB
<missing>      8 days ago   ENV LANG=C.UTF-8                                0B
<missing>      8 days ago   ENV PATH=/usr/local/bin:/usr/local/sbin:/usr…   0B
<missing>      9 days ago   # debian.sh --arch 'amd64' out/ 'trixie' '@1…   87.6MB
```

Read it from the bottom up, the way it was built:

1. The bottom layer, 87.6 MB, is a whole Debian 13 ("trixie") system.
2. A `RUN … apt-get update` step added 4.95 MB of system packages.
3. A big `RUN` step, 41.4 MB, compiled and installed Python 3.12.14.
4. The `ENV` and `CMD` rows are 0 B. They add no files; they only change metadata, such as which program starts by default.

Each `RUN` line is one step of a build recipe, and each one left a layer behind. You will write recipes like this yourself in the next lesson. The `<missing>` in the first column only means those older layers were built on another machine and have no separate name here.

## Containers: a running copy with a writable layer on top

A **container** is a running (or stopped) instance of an image, with a thin writable layer on top. Starting one does not copy the image. Docker adds one empty, writable sheet on top of the read-only stack and starts a process that sees the whole stack as its filesystem.

::: key Image vs container
An image is an immutable stack of read-only filesystem layers plus metadata. A container is a running (or stopped) instance of that image with a thin writable layer on top. Deleting a container never changes the image.
:::

::: example Writing inside a container, then throwing it away
Start a container named `probe` from the Debian image. It writes a small file and deletes a file that came with the image, then exits:

```bash
docker run --name probe debian:bookworm-slim \
  sh -c 'echo "burn 42 s" > /tmp/notes.txt; rm /etc/motd'
```

The container has stopped, but it still exists. `docker ps -a` lists all containers, running or not:

```text
NAMES     IMAGE                  STATUS
probe     debian:bookworm-slim   Exited (0) Less than a second ago
```

`Exited (0)` means the process finished with exit code 0, which is success, exactly as in your shell scripts. Now ask Docker what the container changed compared to its image. `docker diff` reads the writable layer:

```bash
docker diff probe
```

```text
C /etc
D /etc/motd
C /tmp
A /tmp/notes.txt
```

`A` is added, `D` is deleted, `C` is changed (a folder whose contents changed). So the writable layer holds exactly two facts: "there is a new file `/tmp/notes.txt`" and "`/etc/motd` is gone".

Delete the container, then start a brand-new one from the same image and look:

```bash
docker rm probe
docker run --rm debian:bookworm-slim sh -c 'ls /tmp; ls /etc/motd'
```

```text
/etc/motd
```

`/tmp` is empty (`ls` printed nothing for it), and `/etc/motd` is back. The image never changed. The `--rm` option removes the container as soon as it exits, which saves you the cleanup.
:::

::: warning The writable layer is not storage
Anything a container writes goes into its writable layer, and `docker rm` destroys that layer. A simulation that writes its results inside the container loses them when the container is removed. Results belong outside the container, in a folder shared with the host or in a Docker volume. Lesson 5 covers both; the next lesson shows the first one.
:::

## The union filesystem: how the sheets stack

How can a process see one normal filesystem when the files really live in several separate layers? The answer is a **union filesystem**: a filesystem that lays several folders over each other and shows their combination as one folder. On Linux, Docker usually uses one built into the kernel called **[[OverlayFS|overlayfs-history]]**.

Three rules make it work.

1. **The top layer wins.** When two layers both hold a file with the same path, you see the copy from the higher layer.
2. **Writes go to the top.** Change a file that lives in a lower, read-only layer and the filesystem first copies it up into the writable layer, then changes the copy. This is called **[[copy-on-write|copy-on-write]]**. The original below is untouched.
3. **Deletes are notes, not erasures.** A read-only layer cannot be changed, so deleting a file from it puts a marker called a **[[whiteout|whiteout-file]]** in the layer above. The marker says "hide this path". The file's bytes still sit in the layer below.

::: example Building a union filesystem by hand
You can do what Docker does with one `mount` command. This needs root, so it uses `sudo`. Make two read-only "layers", a writable one, and a scratch folder the kernel needs:

```bash
mkdir lower1 lower2 upper work merged
echo "dt = 0.01"  > lower1/sim.conf
echo "v1"         > lower1/readme.txt
echo "dt = 0.001" > lower2/sim.conf
sudo mount -t overlay overlay \
  -o lowerdir=lower2:lower1,upperdir=upper,workdir=work merged
```

`lowerdir=lower2:lower1` lists the read-only layers top first, so `lower2` sits above `lower1`. `upperdir` is the writable layer. `merged` is where the combined view appears. Look at it:

```bash
ls merged
cat merged/sim.conf
```

```text
readme.txt
sim.conf
dt = 0.001
```

Both files are there, and `sim.conf` shows `lower2`'s time step, because the top layer wins. Now write a file and delete one through the merged view, then look at the writable layer:

```bash
echo "results" > merged/out.csv
rm merged/readme.txt
ls -l upper
ls lower1
```

```text
-rw-r--r-- 1 root root    8 Sep 27 02:32 out.csv
c--------- 2 root root 0, 0 Sep 27 02:32 readme.txt
readme.txt
sim.conf
```

The new file landed in `upper`. The deleted `readme.txt` became a strange entry in `upper` whose line starts with `c` and shows `0, 0`. That is the whiteout. And `lower1/readme.txt` is still there: nothing was really erased. Clean up with `sudo umount merged`.
:::

That last point has a cost you will meet again. If a layer adds 500 MB and a later layer deletes it, the image still carries the 500 MB, now hidden under a whiteout. Deleting files in a later step never makes an image smaller. Lesson 3 shows the right way to leave big files behind.

## Many containers, one image

Because a container is only a thin sheet on top of shared read-only layers, a hundred containers from the same image do not need a hundred copies of it. They all read the same layers. Only their writable layers are separate.

::: example Three containers, one copy of Debian
Start three containers from `debian:bookworm-slim`. Each writes a file of random bytes — 1 MB, 2 MB and 3 MB — then waits. The loop is ordinary shell; `head -c 1000000` takes the first million bytes of the endless random stream `/dev/urandom`:

```bash
for n in 1 2 3; do
  docker run -d --name sim$n debian:bookworm-slim \
    sh -c "head -c ${n}000000 /dev/urandom > /tmp/out.bin; sleep 120"
done
docker ps -s
```

`docker ps -s` shows each container's size:

```text
NAMES     IMAGE                  SIZE
sim3      debian:bookworm-slim   3.01MB (virtual 88.3MB)
sim2      debian:bookworm-slim   2.01MB (virtual 87.3MB)
sim1      debian:bookworm-slim   1.01MB (virtual 86.3MB)
```

The first number is the writable layer alone. The "virtual" number is that layer plus the image's 85.3 MB layer underneath (the bottom row of `docker history debian:bookworm-slim`). Check one: $85.3 + 1.01 = 86.31$, which rounds to the 86.3 MB shown.

If each container had its own full copy, the three would take

$$
86.3 + 87.3 + 88.3 = 261.9\ \mathrm{MB}.
$$

Sharing the image, they take the one image plus three thin layers:

$$
85.3 + 1.01 + 2.01 + 3.01 = 91.33 \approx 91.3\ \mathrm{MB}.
$$

That is about a third of the space, and the saving grows with every extra container. It makes sense: the part they share is big, and the part each one writes is small.
:::

## A container is not a virtual machine

A **virtual machine** is a whole pretend computer. Software called a **hypervisor** imitates the hardware, and inside it a complete operating system boots, with its own **kernel** — the core program of an operating system, which controls the processor, memory and devices. A container is much lighter. Every container on a machine shares that machine's one kernel. The isolation comes from two kernel features:

- **[[Namespaces|linux-namespaces]]** control what a process can *see*. A process in its own namespaces sees its own list of processes, its own network, its own hostname and its own filesystem tree.
- **[[cgroups|cgroups-meaning]]** (control groups) control how much a process can *use*: how much memory, how much processor time.

So a container is an ordinary Linux process wearing blinkers, with a budget.

You can see the shared kernel. `uname -r` prints the kernel version:

```bash
uname -r
docker run --rm debian:bookworm-slim uname -r
```

```text
6.18.44-fc-v42
6.18.44-fc-v42
```

Same kernel, inside and out. The Debian image supplies Debian's files and programs, but the kernel is always the host's.

You can see the blinkers too. Start a container that sleeps, and compare the view from inside with the view from the host:

```bash
docker run -d --name sleeper debian:bookworm-slim sleep 300
docker exec sleeper cat /proc/1/comm
pgrep -a -f "^sleep 300"
```

```text
sleep
11582 sleep 300
```

Inside the container, `sleep` is process number 1, the first and only process in its world. On the host, it is process 11582, one among many. The `-d` flag runs the container in the background, and `docker exec` runs a second command inside a running container.

Because nothing has to boot, containers start fast. On this machine, creating, starting, running and removing a container that does nothing took about 0.28 seconds each time. A virtual machine has to boot a whole operating system first.

::: key Is a container a virtual machine?
No. Containers share the host kernel and isolate processes with namespaces and cgroups. That is why they start in milliseconds, and why a container cannot change the host kernel version your real-time patch depends on.
:::

::: warning What a container cannot pin
A container pins everything *above* the kernel: libraries, compilers, interpreters, packages. It cannot pin the kernel itself. A flight-software test that needs a **[[real-time kernel|real-time-kernel]]** needs that kernel on the host machine; no image can bring it along. The same limit applies in the other direction: an image built for one processor family (say x86-64) will not run natively on a different one (say 64-bit ARM).
:::

::: note Why sharing the kernel is both the speed and the limit
Starting a virtual machine means starting a kernel: probing devices, setting up memory, running its startup programs. Starting a container skips all of that. The kernel is already running; Docker asks it to create a few namespaces and a cgroup, then starts one process inside them. That is the whole source of the speed. It is also the whole source of the limit. Anything that lives in the kernel — its version, its scheduler, its drivers, its real-time patches — is shared by every container on the machine, so no container can choose its own.
:::

## Check yourself

::: check
You start a container from `python:3.12-slim`, install a package inside it with `pip`, then remove the container with `docker rm`. You start a new container from the same image. Is the package there? Explain using the words "image" and "writable layer".
:::

::: answer
No. The `pip install` wrote its files into the first container's writable layer. The image is immutable, so it never saw those files. `docker rm` destroyed that writable layer, and the new container starts with a fresh, empty writable layer on top of the unchanged image. To keep the package, it has to be baked into a new image, which is what the next lesson's Dockerfile does.
:::

::: check
In `docker history`, some rows show a size of `0B`. What kind of step leaves a zero-size layer, and why?
:::

::: answer
Steps such as `ENV` and `CMD` change only the image's metadata — an environment variable, or which command starts by default. They add, change and delete no files, so the filesystem layer they record is empty. Steps like `RUN` that install software change files, so their layers have a size.
:::

::: check
An image's layer A contains a 200 MB file `data.bin`. The next layer B deletes it. How big is the image, roughly, and what does a container see at `/data.bin`?
:::

::: answer
The image still carries the 200 MB. Layer A is read-only and can never change, so deleting the file only adds a whiteout marker in layer B. The union filesystem hides the path, so a container sees no `/data.bin` at all, but the bytes are still stored and still downloaded with the image.
:::

::: check
Your laptop runs Linux kernel 6.8. You run a container from an image built on a distribution whose own kernel is 5.10. What does `uname -r` print inside the container?
:::

::: answer
It prints 6.8 (in full, whatever the host's version string is). A container has no kernel of its own; it shares the host's. The image only supplies the files above the kernel — libraries and programs — so the distribution's kernel version does not matter inside the container.
:::

::: check
Fifty containers run from one 300 MB image, and each writes about 2 MB of log files into its writable layer. Roughly how much disk space do they use together, and how much would fifty full copies use?
:::

::: answer
Shared: one image plus fifty thin layers, $300 + 50 \times 2 = 300 + 100 = 400\ \mathrm{MB}$. Fifty full copies: $50 \times (300 + 2) = 50 \times 302 = 15\,100\ \mathrm{MB}$, about 15.1 GB. The shared version uses under 3% of that.
:::

## Summary

| Idea | What it is | Key fact |
| --- | --- | --- |
| Image | Immutable stack of read-only layers plus metadata | Named by a tag, identified exactly by a sha256 digest |
| Layer | One set of file changes | `docker history` lists them, newest at the top |
| Container | Instance of an image with a thin writable layer | `docker rm` deletes the layer; the image never changes |
| Union filesystem | Several layers shown as one tree | Top wins; writes copy up; deletes leave whiteouts |
| Deleting in a later layer | Adds a whiteout | Never shrinks the image |
| Container vs VM | Shared host kernel vs its own kernel | Namespaces isolate what it sees, cgroups limit what it uses |
| Commands | `pull`, `images`, `history`, `run`, `ps -a`, `diff`, `rm`, `exec` | `--rm` removes a container when it exits |

The images in this lesson were built by other people. Next, you write your own recipe — a Dockerfile — and every instruction in it turns into one of the layers you met here.

::: context works-on-my-machine The oldest excuse in software
"It works on my machine" is what a programmer says when code runs for them but fails for everyone else. The cause is almost always the environment: a different library version, a missing tool, a different operating system. The phrase became a running joke long before containers existed, and it is a large part of why they caught on. For a flight team the stakes are higher than a joke. A result that only one laptop can produce cannot be checked, and a result that cannot be checked is not evidence.
:::

::: context immutable-word Where "immutable" comes from
The word comes from the Latin *im-* ("not") and *mutare* ("to change"), so it means "not changeable". In programming it describes any value that cannot be edited once made: a Python tuple, a string in Java, a `const` object in C++. An immutable image is what makes a container trustworthy. If nobody can edit it, then the image you test today and the image you run in five years are the same thing.
:::

::: context digest-hash A fingerprint for files
A digest is the output of a **hash function**, here SHA-256. It reads a file of any size and produces a 256-bit number, written as 64 hexadecimal digits. Change one byte of the input and the digest changes completely. Nobody knows how to find two different inputs with the same SHA-256 digest, so in practice the digest names one exact content and nothing else. Git uses the same idea to name commits. Lesson 6 uses digests to pull the exact same image years later, even if its tag has since been moved to a newer version.
:::

::: context overlayfs-history A filesystem made of other filesystems
OverlayFS became part of the main Linux kernel in version 3.18, released in 2014. Docker's storage code for it is called the `overlay2` driver, and on this machine `docker info` reports the storage driver as `overlayfs`, served through containerd, the program Docker uses underneath to run containers. The idea of a union filesystem is older than Docker; live Linux CDs used it to let you "change" files on a read-only disc, by keeping the changes in memory on top of it.
:::

::: context copy-on-write Copy only when someone writes
Copy-on-write means: share one copy for as long as everyone only reads, and make a private copy only at the moment someone writes. It is the reason starting a container copies nothing. The same trick appears all over computing. When a Linux process calls `fork` to make a child, the child shares its parent's memory pages until one of them writes to a page.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <text x="90" y="18" font-size="12" text-anchor="middle" fill="#1f2a44" font-weight="700">before the write</text>
  <text x="270" y="18" font-size="12" text-anchor="middle" fill="#1f2a44" font-weight="700">after the write</text>
  <rect x="20" y="30" width="140" height="34" rx="4" fill="#fff" stroke="#1f2a44" stroke-dasharray="5 4"/>
  <text x="90" y="51" font-size="12" text-anchor="middle" fill="#6c7a93">writable (empty)</text>
  <rect x="20" y="74" width="140" height="34" rx="4" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="90" y="95" font-size="12" text-anchor="middle" fill="#1f2a44">layer 2 (read-only)</text>
  <rect x="20" y="118" width="140" height="34" rx="4" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="90" y="139" font-size="12" text-anchor="middle" fill="#1f2a44">layer 1: sim.conf</text>
  <rect x="200" y="30" width="140" height="34" rx="4" fill="#f2b880" stroke="#1f2a44"/>
  <text x="270" y="51" font-size="12" text-anchor="middle" fill="#1f2a44">sim.conf (edited)</text>
  <rect x="200" y="74" width="140" height="34" rx="4" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="270" y="95" font-size="12" text-anchor="middle" fill="#1f2a44">layer 2 (read-only)</text>
  <rect x="200" y="118" width="140" height="34" rx="4" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="270" y="139" font-size="12" text-anchor="middle" fill="#1f2a44">layer 1: sim.conf</text>
  <path d="M 340 135 C 356 110 356 70 342 50" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <polygon points="342,50 350,58 338,60" fill="#b4232c"/>
  <text x="180" y="180" font-size="12" text-anchor="middle" fill="#1f2a44">the edit copies the file up; the original stays below</text>
</svg>
```
:::

::: context whiteout-file A marker that means "hide this"
In OverlayFS a whiteout is a special kind of file, a character device with device numbers 0 and 0, which is why `ls -l` showed a `c` and `0, 0`. It holds no data. When the union filesystem meets it, it stops looking further down for that name and reports that the file does not exist. Docker's image format stores the same idea differently inside a layer archive, as a file whose name starts with `.wh.`, but the meaning is the same.
:::

::: context linux-namespaces Seven kinds of blinkers
Linux has several kinds of namespace, each hiding one part of the system: `pid` (the process list), `net` (network devices and addresses), `mnt` (the filesystem tree), `uts` (the hostname), `ipc` (shared memory between processes), `user` (user and group ids) and `cgroup` (the view of control groups). Linux also has a `time` namespace, which Docker does not use by default. A container is a process placed in its own set of these at once.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="10" width="340" height="150" rx="8" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="30" font-size="12" text-anchor="middle" fill="#1f2a44" font-weight="700">one Linux kernel (the host)</text>
  <rect x="24" y="44" width="148" height="104" rx="6" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="98" y="64" font-size="12" text-anchor="middle" fill="#1f2a44">container A</text>
  <text x="98" y="86" font-size="11" text-anchor="middle" fill="#1f2a44">sees PID 1: sleep</text>
  <text x="98" y="104" font-size="11" text-anchor="middle" fill="#1f2a44">own hostname, network</text>
  <text x="98" y="122" font-size="11" text-anchor="middle" fill="#1f2a44">memory limit (cgroup)</text>
  <rect x="188" y="44" width="148" height="104" rx="6" fill="#f2b880" stroke="#1f2a44"/>
  <text x="262" y="64" font-size="12" text-anchor="middle" fill="#1f2a44">container B</text>
  <text x="262" y="86" font-size="11" text-anchor="middle" fill="#1f2a44">sees PID 1: python3</text>
  <text x="262" y="104" font-size="11" text-anchor="middle" fill="#1f2a44">own hostname, network</text>
  <text x="262" y="122" font-size="11" text-anchor="middle" fill="#1f2a44">CPU limit (cgroup)</text>
</svg>
```
:::

::: context cgroups-meaning A budget for a group of processes
A control group is a set of processes that the kernel accounts for together. You can cap the group's memory, its share of processor time, and how fast it reads and writes disks. `docker run --memory 512m --cpus 1.5` sets such caps for one container; if the process tries to use more memory than its cap, the kernel stops it. Control groups were first developed by engineers at Google and joined the main Linux kernel in 2008. Kubernetes, in lesson 7, uses the same mechanism when it gives each program a resource limit.
:::

::: context real-time-kernel Why flight tests care about the kernel
A normal Linux kernel is tuned for throughput: get the most work done overall. A real-time kernel, such as Linux with the PREEMPT_RT changes, is tuned for predictable timing, so a control loop that must run every millisecond is not held up by some other task. Hardware-in-the-loop test rigs often use one. Because containers share the host's kernel, you can put the test software in a container, but the real-time behavior comes from the host. Docker on macOS and Windows runs containers inside a small hidden Linux virtual machine for the same reason: containers need a Linux kernel underneath.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <text x="90" y="16" font-size="12" text-anchor="middle" fill="#1f2a44" font-weight="700">virtual machines</text>
  <text x="270" y="16" font-size="12" text-anchor="middle" fill="#1f2a44" font-weight="700">containers</text>
  <rect x="14" y="26" width="72" height="26" fill="#f2b880" stroke="#1f2a44"/>
  <text x="50" y="43" font-size="11" text-anchor="middle" fill="#1f2a44">app</text>
  <rect x="94" y="26" width="72" height="26" fill="#f2b880" stroke="#1f2a44"/>
  <text x="130" y="43" font-size="11" text-anchor="middle" fill="#1f2a44">app</text>
  <rect x="14" y="56" width="72" height="26" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="50" y="73" font-size="11" text-anchor="middle" fill="#1f2a44">own kernel</text>
  <rect x="94" y="56" width="72" height="26" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="130" y="73" font-size="11" text-anchor="middle" fill="#1f2a44">own kernel</text>
  <rect x="14" y="88" width="152" height="26" fill="#fff" stroke="#1f2a44"/>
  <text x="90" y="105" font-size="11" text-anchor="middle" fill="#1f2a44">hypervisor</text>
  <rect x="14" y="120" width="152" height="26" fill="#fff" stroke="#1f2a44"/>
  <text x="90" y="137" font-size="11" text-anchor="middle" fill="#1f2a44">host kernel</text>
  <rect x="194" y="26" width="72" height="26" fill="#f2b880" stroke="#1f2a44"/>
  <text x="230" y="43" font-size="11" text-anchor="middle" fill="#1f2a44">app</text>
  <rect x="274" y="26" width="72" height="26" fill="#f2b880" stroke="#1f2a44"/>
  <text x="310" y="43" font-size="11" text-anchor="middle" fill="#1f2a44">app</text>
  <rect x="194" y="56" width="72" height="26" fill="#fff" stroke="#1f2a44"/>
  <text x="230" y="73" font-size="11" text-anchor="middle" fill="#1f2a44">image files</text>
  <rect x="274" y="56" width="72" height="26" fill="#fff" stroke="#1f2a44"/>
  <text x="310" y="73" font-size="11" text-anchor="middle" fill="#1f2a44">image files</text>
  <rect x="194" y="120" width="152" height="26" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="270" y="137" font-size="11" text-anchor="middle" fill="#1f2a44">one shared host kernel</text>
  <line x1="180" y1="24" x2="180" y2="150" stroke="#6c7a93" stroke-dasharray="4 4"/>
  <text x="180" y="172" font-size="11" text-anchor="middle" fill="#6c7a93">each VM boots a kernel; containers boot none</text>
</svg>
```
:::
