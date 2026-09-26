---
id: l08-ssh-keys-config-and-tunnels
title: SSH keys, config and tunnels
minutes: 22
covers:
  - ssh keys, ~/.ssh/config, agent forwarding, port forwarding
---

**SSH** ("secure shell") lets you log in to another computer over a network and type commands on it, all encrypted. It is the front door to every machine you will run a simulation on: the cluster, a test rig, a ground-station server.

It is also the tool most people understand least. They type a password forty times a day, paste a long `ssh -i ... -p ... user@10.x.y.z` line from a wiki, and click through the one security warning that stands between them and an attacker. This lesson fixes all three, and ends with tunnels that bring a web page from deep inside a cluster to your laptop's browser.

All output below is real (OpenSSH 9.6p1, Ubuntu 24.04, ordinary user `eng`). `sim01` is a short name for a real SSH server on this machine at `127.0.0.1:2222`, so every transcript is a genuine SSH session. Fingerprints and paths will differ on yours; the *shape* of every message will not.

## Keys, not passwords

Think of a padlock and its key: you can hand out open padlocks freely, but only your key opens them. A **[[key pair|how-keys-prove]]** is two files that belong together:

- the **private key**, which never leaves your machine;
- the **public key**, which you install on every server you want to log in to.

When you connect, your machine proves it holds the private key without ever sending it. Make a pair with `ssh-keygen`:

```bash
ssh-keygen -t ed25519 -C "eng@laptop" -f ~/.ssh/demo_key -N ""
```

```text
Generating public/private ed25519 key pair.
Your identification has been saved in /home/eng/.ssh/demo_key
Your public key has been saved in /home/eng/.ssh/demo_key.pub
The key fingerprint is:
SHA256:sf8Sg9/4LfYIgFsjVE4SBzgAhBNUfg6DHm74Z74NHC4 eng@laptop
The key's randomart image is:
+--[ED25519 256]--+
|*=oo .+o+        |
|o o o  *         |
| + + o. o        |
|+ . =. . o       |
|.+  ..o S.       |
|.. o . +.+o      |
|  E * .  .o=     |
|   = o    +o+o   |
|    o..    ++oo  |
+----[SHA256]-----+
```

What each flag did:

- `-t ed25519` picks the kind of key, **[[Ed25519|ed25519-name]]**. Use it unless a server is too old to accept it; then use `-t rsa -b 4096`.
- `-C` adds a comment, by habit "who and where", so you can recognize the key years later.
- `-f` names the file.
- `-N ""` sets an empty **passphrase** (a password that locks the private key file). Do not do that on a real key. Leave `-N` off and it will ask you for one.

The **fingerprint** is a short summary of the key — the same key always gives the same fingerprint — and the little picture is the **[[randomart|randomart]]**, a drawing of that fingerprint.

The public key is one line:

```bash
cat ~/.ssh/demo_key.pub
```

```text
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGYPLEI5LyWFOLCkHZLDHJjE+mMvmQExXZdf92ZjH+NM eng@laptop
```

Three fields: the kind of key, the key, and the comment. An ed25519 public key is always about 80 characters before the comment; a 4096-bit RSA one runs to about seven hundred. `ssh-keygen -lf` prints fingerprints; both kinds for comparison:

```text
256 SHA256:sf8Sg9/4LfYIgFsjVE4SBzgAhBNUfg6DHm74Z74NHC4 eng@laptop (ED25519)
4096 SHA256:Ua4+PaAUn14RddBkAE8iSfRBoPGXGWfGG74bTZdzhH8 old@laptop (RSA)
```

The *private* key file begins `-----BEGIN OPENSSH PRIVATE KEY-----`. If you ever paste that into a chat window, the key is burned; make a new one.

::: warning Private keys must be private
SSH refuses to use a private key that other people could read, and it says so loudly:

```bash
chmod 644 ~/.ssh/id_ed25519
ssh sim01 true
```

```text
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@         WARNING: UNPROTECTED PRIVATE KEY FILE!          @
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
Permissions 0644 for '/home/eng/.ssh/id_ed25519' are too open.
It is required that your private key files are NOT accessible by others.
This private key will be ignored.
Load key "/home/eng/.ssh/id_ed25519": bad permissions
root@127.0.0.1: Permission denied (publickey,keyboard-interactive).
```

Exit status 255. The rule, in lesson 03's octal: `~/.ssh` is 700, private keys are 600, public keys and `known_hosts` may be 644. After `chmod 600 ~/.ssh/id_ed25519` it works. This is the usual cause of "my key stopped working" after copying a key off a USB stick or out of a tarball.
:::

### Installing the public key

On the server, the file `~/.ssh/authorized_keys` lists the public keys allowed to log in — one per line, like a guest list. `ssh-copy-id` adds your public key to that list, and creates the folder with the right permissions if it is missing:

```bash
ssh-copy-id -f -i ~/.ssh/demo_key.pub sim01
```

```text
/usr/bin/ssh-copy-id: INFO: Source of key(s) to be installed: "/home/eng/.ssh/demo_key.pub"

Number of key(s) added: 1

Now try logging into the machine, with:   "ssh 'sim01'"
and check to make sure that only the key(s) you wanted were added.
```

```bash
ssh sim01 "ls -l ~/.ssh; cut -c1-52 ~/.ssh/authorized_keys"
```

```text
total 4
-rw------- 1 root root 92 Sep 22 20:47 authorized_keys
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIIwxdtG8gQpdi96J
```

And the new key now logs in on its own:

```text
the new key works
```

Without `-f`, `ssh-copy-id` skips a key that is already there. By hand, it amounts to:

```bash
cat key.pub | ssh host 'umask 077; mkdir -p ~/.ssh; cat >> ~/.ssh/authorized_keys'
```

Before the key was installed, the same connection was refused:

```text
root@127.0.0.1: Permission denied (publickey,keyboard-interactive).
```

The brackets list the login methods the *server* will still try. `publickey` alone would mean passwords are off and a key is the only way in.

## `known_hosts` and the warning you must not click through

Proof runs both ways. The server proves who *it* is with its own **host key**. The first time you connect, SSH writes that key into `~/.ssh/known_hosts`, and every later connection checks it is unchanged. Without that check, any machine that could answer on that address could sit in the middle and read your session — a **[[man-in-the-middle|man-in-the-middle]]** attack.

```bash
cat ~/.ssh/known_hosts
```

```text
[127.0.0.1]:2222 ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAINIlGLdhjmzN4wROZcdXHjGqMpOP/WOsn6cxUOq3TOis
```

Now swap that entry for a different key — exactly what an impostor would present — and connect:

```bash
ssh sim01 true
```

```text
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@    WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!     @
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
IT IS POSSIBLE THAT SOMEONE IS DOING SOMETHING NASTY!
Someone could be eavesdropping on you right now (man-in-the-middle attack)!
It is also possible that a host key has just been changed.
The fingerprint for the ED25519 key sent by the remote host is
SHA256:h/5zI92Pe+epxzbOLq0MMttDt/40kyavs5klraZQTkc.
Please contact your system administrator.
Add correct host key in /home/eng/.ssh/known_hosts to get rid of this message.
Offending ED25519 key in /home/eng/.ssh/known_hosts:1
  remove with:
  ssh-keygen -f '/home/eng/.ssh/known_hosts' -R '[127.0.0.1]:2222'
Host key for [127.0.0.1]:2222 has changed and you have requested strict checking.
Host key verification failed.
```

The connection is refused, exit status 255. The message even hands you the command to make it go away — and *that is the trap*. Running `ssh-keygen -R` without finding out why the key changed throws the whole protection away.

There are honest reasons for a change — a rebuilt server, a recreated virtual machine, an address given to a new machine. So confirm the new fingerprint **out of band**: through some other channel, such as asking whoever rebuilt it. Only then remove the old entry.

For a fleet of machines that come and go, `StrictHostKeyChecking accept-new` is a reasonable setting: it accepts a *first* key without asking, but still refuses a *changed* one.

## `~/.ssh/config`

Your phone lets you tap "Grandma" instead of typing a number. `~/.ssh/config` is SSH's contacts list: any command-line option can live there, under a short name.

```bash
cat ~/.ssh/config
```

```text
Host sim01
    HostName 127.0.0.1
    Port 2222
    User root
    IdentityFile ~/.ssh/id_ed25519
```

That block is why commands in this lesson and the last could say `sim01`. Settings worth knowing:

- `HostName`, `User`, `Port` — the real address, the account, and the **port** (a numbered door on the machine; SSH normally uses 22).
- `IdentityFile` — which private key. `IdentitiesOnly yes` stops SSH offering every other key it finds, which matters when a server locks you out after five failed tries and you have six keys.
- `ForwardAgent yes` — agent forwarding, explained below. Set it per host, never for all hosts.
- `ServerAliveInterval 60` and `ServerAliveCountMax 3` — send a small "still here?" every 60 seconds when quiet, and give up after three go unanswered. This stops a router or firewall silently dropping an idle session.
- `ProxyJump bastion` — reach a machine by hopping through a **[[jump host|jump-host]]** (also called a bastion) in one step.
- `ControlMaster auto`, `ControlPath ~/.ssh/cm-%r@%h:%p`, `ControlPersist 10m` — reuse one logged-in connection (`%r`, `%h`, `%p` stand for user, host, port), so later `ssh`, `scp` and `rsync` to that host start instantly.

A `Host *` block (`*` matches every name) applies to everything. For each setting **the first match wins**, so put specific hosts first and the catch-all last.

`ssh -G host` prints the settings that would really be used — a check without connecting:

```bash
ssh -G sim01 | grep -E "^(hostname|port|user|identityfile|forwardagent|serveraliveinterval) "
```

```text
user root
hostname 127.0.0.1
port 2222
serveraliveinterval 0
identityfile ~/.ssh/id_ed25519
forwardagent no
```

::: example What a real entry looks like, and what it buys
One block of configuration replaces a command nobody can remember.

```text
Host sim01
    HostName sim01.cluster.internal
    User eng
    IdentityFile ~/.ssh/id_ed25519
    IdentitiesOnly yes
    ServerAliveInterval 60
    ServerAliveCountMax 3
    ForwardAgent no
    ControlMaster auto
    ControlPath ~/.ssh/cm-%r@%h:%p
    ControlPersist 10m
```

Now `ssh sim01`, `scp results.tar.gz sim01:/srv/` and `rsync -a runs/ sim01:/srv/runs/` all work with no flags, use only the right key, survive an idle hour, and share one connection, so the second command skips the login handshake.

Add a jump host and the whole cluster becomes one word per machine:

```text
Host bastion
    HostName bastion.example.com
    User eng

Host sim*
    HostName %h.cluster.internal
    User eng
    ProxyJump bastion
```

`sim*` matches any name starting with `sim`, and `%h` stands for the name you typed. Walk through `ssh sim07`: it matches `sim*`; `%h` becomes `sim07`; so SSH connects to `sim07.cluster.internal`, hopping through `bastion` on the way. Machines `sim01` to `sim12` need no entries of their own. Sanity check before you rely on it: `ssh -G sim07` should print `hostname sim07.cluster.internal` and `proxyjump bastion`.
:::

## The agent

A private key locked with a passphrase is safe, and tedious: every command asks for the passphrase. `ssh-agent` is a small helper program that holds your unlocked keys in memory and answers challenges for you — like a trusted assistant holding your keys at the desk.

```bash
ssh-add -l
```

```text
The agent has no identities.
```

```bash
ssh-add ~/.ssh/prot_key
```

```text
Identity added: /home/eng/.ssh/prot_key (eng@laptop)
```

You type the passphrase once, when you add the key. After that the agent lists what it holds:

```bash
ssh-add -l
```

```text
256 SHA256:7WLiqPwOJWT4M8C6D8fxPWyE7gd7KuTVw1bHTN8CTu4 eng@laptop (ED25519)
256 SHA256:9rsEB+IvhFhSamIg7eA7Ix2C2rCWNeRIwUOHDpo2NBM eng@laptop (ED25519)
```

More `ssh-add` options: `-D` removes all keys, `-t 3600` adds a key that expires after an hour, and `-c` asks you to confirm each use. Programs find the agent through a **[[socket|unix-socket]]** whose path is in the variable `SSH_AUTH_SOCK`. On a desktop the agent usually starts when you log in. On a server you start one with `eval "$(ssh-agent -s)"`.

The key itself never leaves the agent. Programs ask it to *sign* a challenge; they never receive the key.

## Agent forwarding

Sometimes you are on `sim01` and need to reach `sim02`, or clone a private repository, and the key for it is on your laptop. Copying the private key to the server is the wrong answer. **Agent forwarding** lets the remote session use your laptop's agent through the connection you already have.

Without it, the remote session has no agent at all:

```bash
ssh sim01 'echo SSH_AUTH_SOCK=[$SSH_AUTH_SOCK]'
```

```text
SSH_AUTH_SOCK=[]
```

With `-A`, the server creates a socket and points the variable at it:

```bash
ssh -A sim01 'echo SSH_AUTH_SOCK=[$SSH_AUTH_SOCK]; ssh-add -l'
```

```text
SSH_AUTH_SOCK=[/tmp/ssh-SxBl51YIGD/agent.19906]
256 SHA256:7WLiqPwOJWT4M8C6D8fxPWyE7gd7KuTVw1bHTN8CTu4 eng@laptop (ED25519)
256 SHA256:9rsEB+IvhFhSamIg7eA7Ix2C2rCWNeRIwUOHDpo2NBM eng@laptop (ED25519)
```

The `ssh-add -l` on the server lists the keys held by the agent *on the laptop*. The keys never crossed the link; only the socket did.

::: warning A forwarded agent is a signing machine on someone else's computer
That socket will sign anything presented to it, and its file permissions only keep out ordinary users. **Anyone with root on the remote host can use your agent for as long as you are connected** — to log in to every other machine your keys open, as you, with your name in the logs.

So: never put `ForwardAgent yes` in a `Host *` block. Forward only to machines whose administrators you would trust with your keys. Prefer `ProxyJump` when you only need to pass *through* a host rather than work from it. `ssh-add -c` makes the agent ask before each use, which at least turns a silent theft into a prompt you did not expect.
:::

::: key SSH agent forwarding
Agent forwarding lets a remote host use your local private key for onward authentication without copying the key. Anyone with root on that remote host can use your agent socket while you are connected, so never forward to machines you do not trust.
:::

## Port forwarding

A cluster's monitoring page, a Jupyter notebook, a database — these are often bound to the server's **[[loopback|loopback]]** address, `127.0.0.1`, which only the server itself can reach. It is like a phone extension that works only inside the building. SSH can carry a connection into the building for you. That is a **tunnel**.

`-L local:host:port` is **local forwarding**. Read it as: "listen on port `local` on *my* machine, and deliver every connection to `host:port` as seen *from the server*."

Before the tunnel, nothing answers on port 9000 here:

```bash
curl -s --max-time 3 http://127.0.0.1:9000/ ; echo "curl exit=$?"
```

```text
curl exit=7
```

Exit 7 is curl's "failed to connect". Now open the tunnel. `-f` sends SSH into the background after logging in, and `-N` means "run no remote command; only forward":

```bash
ssh -f -N -L 9000:127.0.0.1:8899 sim01
curl -s --max-time 3 http://127.0.0.1:9000/
```

```text
campaign 2026-03-14: 499 OK, 1 DIVERGED
```

`ss -ltn` lists listening ports (lesson 13), and shows the tunnel's end on your laptop:

```bash
ss -ltn | grep 9000
```

```text
LISTEN 0      128        127.0.0.1:9000       0.0.0.0:*
```

Read the argument in three parts. `9000` is the port on your machine. `127.0.0.1:8899` is the address the *server* dials. That second part is looked up on the server — which is the whole point: `127.0.0.1` there means the *server's* loopback, not yours. Point a browser at `http://localhost:9000` and you are looking at a page served inside the cluster.

`-R remote:host:port` is **remote forwarding**, the mirror image: the *server* listens, and connections are carried back to your side.

```bash
ssh -f -N -R 9100:127.0.0.1:8899 sim01
ssh sim01 "curl -s --max-time 3 http://127.0.0.1:9100/"
```

```text
campaign 2026-03-14: 499 OK, 1 DIVERGED
```

That is how a job on a closed network reaches a service on your side, such as a license server.

`-D port` is **dynamic forwarding**: SSH becomes a **[[SOCKS proxy|socks-proxy]]** and forwards wherever the program asks.

```bash
ssh -f -N -D 1080 sim01
curl -s --max-time 5 --socks5-hostname 127.0.0.1:1080 http://127.0.0.1:8899/
```

```text
campaign 2026-03-14: 499 OK, 1 DIVERGED
```

One tunnel, any destination the server can reach; `--socks5-hostname` has curl look up names at the far end too.

A forward dies with the SSH session that carries it. That is why `-f -N` tunnels are often run inside `tmux` next to the job they serve, or given `ControlPersist` so they outlive a closed window.

::: example Watching a campaign's dashboard from your laptop
A job's progress page listens on the cluster node's loopback, port 8899. End to end:

```bash
ssh -f -N -L 9000:127.0.0.1:8899 sim01
```

then open `http://localhost:9000` in a browser. Trace the path: the browser connects to port 9000 on your laptop; SSH carries it through the encrypted session; on `sim01` it connects to `127.0.0.1:8899`; the page comes back the same way. Nothing is exposed to the network, no firewall change was requested, and it all rides inside a session you were already allowed to open.

Three practical details. First, choose a local port above 1024, so you do not need **[[administrator rights|privileged-ports]]**. Second, if the port is already taken — say by yesterday's forgotten tunnel — the new attempt says so and does not forward:

```text
channel_setup_fwd_listener_tcpip: cannot listen to port: 9000
Could not request local forwarding.
```

The second session still starts, carrying nothing, so the symptom is a browser showing whatever yesterday's tunnel points at. Third, `-L 0.0.0.0:9000:...` would expose the page to your whole network. Leave it on loopback.
:::

::: key SSH in one breath
`ssh-keygen -t ed25519` makes the pair; the private key is 600 or SSH refuses it. `ssh-copy-id` installs the public half. A changed host key stops the connection, and clearing it without checking defeats the whole mechanism. `~/.ssh/config` turns flags into a host alias; `ssh -G host` shows what is really in effect. `-A` forwards the agent and hands root on that host the use of your keys. `-L` brings a remote port to you, `-R` takes a local port there, `-D` is a SOCKS proxy.
:::

## Check yourself

::: check
A colleague copies her private key to the cluster's shared home directory so that jobs running there can `git clone` a private repository. Name two things wrong with that, and describe the right arrangement.
:::

::: answer
First, the key now sits on a machine she does not control, readable by administrators and maybe her group; treat it as leaked. Second, an unattended job cannot type a passphrase, so she almost certainly copied a key with *no* passphrase — the worst version of the first problem.

For a job that must clone on its own, make a *separate* key pair on the cluster, register its public half as a **deploy key** with read-only access to that one repository, and leave her personal key on her laptop. For interactive work while she is present, use agent forwarding (`ssh -A`), or `ProxyJump` if she only passes through. The principle: a credential lives on one machine and opens only what it must.
:::

::: check
`ssh sim03` prints `REMOTE HOST IDENTIFICATION HAS CHANGED!` and refuses to connect. A colleague says "run the `ssh-keygen -R` it suggests." When is that right, and what should you do first?
:::

::: answer
Only once you know *why* the key changed. Honest causes: the machine was rebuilt, the virtual machine recreated, the address given to a different machine, or new host keys made. Then the new key really is the host's.

First, check the new fingerprint through a channel other than the suspect connection. Ask whoever rebuilt the machine; they can read the real fingerprint on its console with `ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub`. Compare it with the one in the warning. Only if they match do you remove the old entry and reconnect.

If nobody can explain the change, treat it as an attack: stop, type nothing, and tell whoever runs the network. This warning is the one moment the protocol can catch an interception.
:::

::: check
A Jupyter server listens on `127.0.0.1:8888` on `sim01`, and you want it in the browser on your laptop. Write the command, explain each part of the `-L` argument, and say why `-L 8888:sim01:8888` would be wrong.
:::

::: answer
`ssh -f -N -L 8888:127.0.0.1:8888 sim01`, then browse to `http://localhost:8888`.

In `8888:127.0.0.1:8888`, the first `8888` is the port SSH listens on *on your laptop*. The `127.0.0.1:8888` after it is the address and port the *server* connects to when something arrives. `-f` puts the session in the background after login, and `-N` says there is no remote command, only the forwarding.

`-L 8888:sim01:8888` is wrong because the middle part is looked up and dialed *by the server*: `sim01` would connect to its own outside address. Jupyter listens only on loopback, on purpose, so nothing answers there and the connection is refused. `127.0.0.1` means "loopback, from the server's point of view" — exactly where the service lives.
:::

::: check
A forwarded agent never sends the private key anywhere. So why is `ForwardAgent yes` in a `Host *` block a bad default?
:::

::: answer
Because what is exposed is not the key but the *use* of the key. Forwarding creates a socket on the remote host that will sign any challenge sent to it. Anyone who can reach that socket — always including root on that host — can log in as you to every machine and service your keys open, for as long as your session lasts, with your name in the logs.

`Host *` makes that true for every host you ever touch, including machines shared with strangers. The right setting is per host, only where you would trust the administrators with the keys themselves. To pass *through* a host, `ProxyJump` is strictly better: the middle host takes part in no login and sees only encrypted bytes.

`ssh-add -c` makes the agent ask before every use, so an unexpected request becomes visible.
:::

::: check
Your SSH sessions to the cluster die after about ten minutes of idling, taking long commands with them. A session where you keep typing survives all afternoon. What is happening, and which two settings fix it?
:::

::: answer
Something between you and the server — a router, a firewall, a VPN box — keeps a table of open connections and forgets any that go quiet too long. Every keystroke refreshes the entry, which is why typing keeps a session alive. Neither end closed anything; the path stopped carrying it.

`ServerAliveInterval 60` makes your SSH client send a small encrypted "still here?" every 60 seconds when the session is quiet, which keeps the entry fresh. `ServerAliveCountMax 3` sets how many unanswered ones to allow before giving up. So a truly dead server is noticed in about $3 \times 60 = 180$ seconds — three minutes — instead of hanging forever. Put both in the host's block in `~/.ssh/config`.

This keeps the *session* alive, nothing more. For a laptop that sleeps or a link that really is cut, the answer is the next lesson: run the job inside `tmux` on the server.
:::

## Summary

| Thing | Meaning | Note |
| --- | --- | --- |
| `ssh-keygen -t ed25519 -C "who@where"` | make a key pair | `-t rsa -b 4096` only for old servers |
| `~/.ssh` 700, private key 600 | required modes | `UNPROTECTED PRIVATE KEY FILE!` otherwise, exit 255 |
| `ssh-copy-id -i key.pub host` | append the public key to remote `authorized_keys` | `-f` skips the already-installed check |
| `Permission denied (publickey,...)` | the methods the server will still accept | `publickey` alone means no passwords |
| `known_hosts`, `REMOTE HOST IDENTIFICATION HAS CHANGED!` | host-key pinning, and its alarm | verify the new fingerprint out of band before `ssh-keygen -R` |
| `~/.ssh/config`: `Host`/`HostName`/`User`/`Port`/`IdentityFile` | one alias instead of a long line | first match wins; put specific hosts first |
| `ServerAliveInterval` / `ServerAliveCountMax` | keepalives and how many may fail | stops idle sessions being dropped by a router |
| `ProxyJump`, `ControlMaster`/`ControlPersist` | one hop through a bastion; reuse one connection | later commands to the same host start instantly |
| `ssh -G host` | the fully resolved settings | check a config without connecting |
| `ssh-agent`, `ssh-add`, `-l`, `-D`, `-t`, `-c` | hold unlocked keys; list, drop, expire, confirm | the key never leaves the agent |
| `ssh -A` / `ForwardAgent` | remote session may use your agent | root there can use your keys — never `Host *` |
| `-L lport:host:port` | listen here, connect from there | the middle address is resolved on the server |
| `-R rport:host:port` | listen there, connect from here | reach your side from a closed network |
| `-D port` | SOCKS proxy through the server | `curl --socks5-hostname` resolves at the far end |
| `-f -N` | background after login; no remote command | the tunnel dies with the session |

Lesson 09 removes the last way a dropped connection can cost you anything: `tmux`, where the job belongs to a session on the server and your terminal is only a window onto it.

::: context how-keys-prove How a key proves who you are
The server holds your public key. When you connect, it sends a fresh random challenge. Your side uses the private key to make a **signature** of that challenge — a number only the private key could have produced. The server checks the signature with the public key. The private key never travels, and a recorded signature is useless later, because the next login uses a new challenge.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="30" width="110" height="90" rx="8" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="65" y="22" font-size="12" text-anchor="middle" fill="#1f2a44">your laptop</text>
  <text x="65" y="80" font-size="11" text-anchor="middle" fill="#b4232c">private key</text>
  <rect x="240" y="30" width="110" height="90" rx="8" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="295" y="22" font-size="12" text-anchor="middle" fill="#1f2a44">server</text>
  <text x="295" y="80" font-size="11" text-anchor="middle" fill="#1d6fd1">public key</text>
  <line x1="236" y1="52" x2="128" y2="52" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="124,52 134,47 134,57" fill="#1f2a44"/>
  <text x="180" y="46" font-size="11" text-anchor="middle" fill="#1f2a44">1. challenge</text>
  <line x1="124" y1="102" x2="232" y2="102" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="236,102 226,97 226,107" fill="#1f2a44"/>
  <text x="180" y="96" font-size="11" text-anchor="middle" fill="#1f2a44">2. signature</text>
  <text x="180" y="140" font-size="11" text-anchor="middle" fill="#6c7a93">3. server checks it with the public key</text>
</svg>
```
:::

::: context ed25519-name What "Ed25519" means
The name packs in the math. "Ed" is for **Edwards curve**, a kind of curve used in elliptic-curve cryptography, and "25519" is from the prime number $2^{255} - 19$ that the arithmetic is done with. The scheme was published in 2011 by Daniel J. Bernstein and colleagues. Its keys are small (256 bits), signing is fast, and it avoids several ways older schemes could be misused. RSA, from 1977, is still safe at 4096 bits, but its keys are far larger for the same job.
:::

::: context randomart Why a key comes with a doodle
People are bad at comparing two 43-character fingerprints, and good at noticing that two pictures differ. So OpenSSH turns the fingerprint into a small drawing: a pretend chess bishop starts at `S`, takes one diagonal step per pair of bits, leaves a symbol wherever it has been (busier squares get denser symbols), and stops at `E`. It is sometimes called the "drunken bishop" drawing. Same key, same picture, every time.
:::

::: context man-in-the-middle The machine in the middle
An attacker who can get between you and the server — on café Wi-Fi, or by faking a network address — could pretend to be the server to you and pretend to be you to the server, passing everything along while reading it. Encryption alone does not stop this, because you would be encrypting to the attacker. The host key does: the attacker cannot produce the real server's key, so `known_hosts` catches the swap.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="35" width="90" height="40" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="55" y="59" font-size="12" text-anchor="middle" fill="#1f2a44">you</text>
  <rect x="135" y="35" width="90" height="40" rx="6" fill="#f2b880" stroke="#b4232c" stroke-width="1.5"/>
  <text x="180" y="59" font-size="12" text-anchor="middle" fill="#1f2a44">impostor</text>
  <rect x="260" y="35" width="90" height="40" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="305" y="59" font-size="12" text-anchor="middle" fill="#1f2a44">real server</text>
  <line x1="100" y1="55" x2="135" y2="55" stroke="#b4232c" stroke-width="2"/>
  <line x1="225" y1="55" x2="260" y2="55" stroke="#b4232c" stroke-width="2"/>
  <text x="180" y="98" font-size="11" text-anchor="middle" fill="#1f2a44">wrong host key, so SSH refuses</text>
  <text x="180" y="22" font-size="11" text-anchor="middle" fill="#6c7a93">reads and relays everything</text>
</svg>
```
:::

::: context jump-host Hopping through a bastion
Clusters are often hidden behind one well-guarded machine, the **bastion** or jump host, which is the only one reachable from outside. With `ProxyJump`, SSH first connects to the bastion, asks it to open a plain network connection onward, and then runs a *second*, fully encrypted SSH session to the inner machine through that pipe. The bastion passes bytes along but cannot read them, and it never needs your keys.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="40" width="80" height="36" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="50" y="62" font-size="12" text-anchor="middle" fill="#1f2a44">laptop</text>
  <rect x="140" y="40" width="80" height="36" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="62" font-size="12" text-anchor="middle" fill="#1f2a44">bastion</text>
  <rect x="270" y="40" width="80" height="36" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="310" y="62" font-size="12" text-anchor="middle" fill="#1f2a44">sim07</text>
  <line x1="90" y1="58" x2="140" y2="58" stroke="#1f2a44" stroke-width="2"/>
  <line x1="220" y1="58" x2="270" y2="58" stroke="#1f2a44" stroke-width="2"/>
  <path d="M50,40 C50,12 310,12 310,40" fill="none" stroke="#1d6fd1" stroke-width="1.5" stroke-dasharray="5 3"/>
  <text x="180" y="34" font-size="11" text-anchor="middle" fill="#1d6fd1">inner session, end to end</text>
  <line x1="130" y1="92" x2="230" y2="92" stroke="#6c7a93" stroke-width="1"/>
  <text x="180" y="106" font-size="11" text-anchor="middle" fill="#6c7a93">firewall edge</text>
</svg>
```
:::

::: context unix-socket A socket is a door in the filesystem
A **Unix socket** is a special file that two programs on the same machine use to talk to each other, the way two people talk through a hatch in a wall. `ls -l` shows it with an `s` where a normal file has `-`. The agent listens on one; `ssh` finds it by reading `SSH_AUTH_SOCK`, an **environment variable** (a named setting every program inherits — lesson 10 is all about them). Anyone allowed to open that file can talk to the agent, which is exactly why a forwarded socket is dangerous around root.
:::

::: context loopback Loopback: the address that never leaves
`127.0.0.1`, also called `localhost`, always means "this very machine". Traffic sent there never touches a network cable. A service bound only to loopback is invisible to every other computer, which is a cheap and good way to keep a dashboard or a notebook private. The catch is that "this very machine" depends on where you stand — on your laptop and on the server, `127.0.0.1` names two different computers. Port forwarding works because the far end of `-L` is read on the server.
:::

::: context socks-proxy What SOCKS is
SOCKS is a simple, long-standing standard (version 5 was written up as RFC 1928 in 1996) by which a program asks a proxy, "please connect me to this address and port". With `-D`, SSH plays the proxy: your browser or curl sends each request to it, and SSH makes the onward connection *from the server*. The `-hostname` in curl's option means names are looked up on the server too — which matters for internal names like `grafana.cluster.internal` that your laptop cannot look up.
:::

::: context privileged-ports Why ports below 1024 need root
On Linux, only the administrator (root) may listen on ports numbered below 1024 by default. Those "privileged" ports are where standard services live — 22 for SSH, 80 and 443 for web servers — and the rule stops an ordinary user from pretending to be one of them. Any port from 1024 up to 65535 is fair game, which is why tunnels use numbers like 8080, 8888 or 9000.
:::
