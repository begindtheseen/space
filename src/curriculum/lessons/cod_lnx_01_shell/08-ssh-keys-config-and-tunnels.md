---
id: l08-ssh-keys-config-and-tunnels
title: SSH keys, config and tunnels
minutes: 22
covers:
  - ssh keys, ~/.ssh/config, agent forwarding, port forwarding
---

SSH is the door to every machine you will run a simulation on. It is also, in most teams, the least well understood tool on the list: people type a password forty times a day, paste a long `ssh -i ... -p ... user@10.x.y.z` from a wiki page, and click through a security warning that is the only thing standing between them and a man-in-the-middle. Half an hour spent here removes all three.

By the end of this lesson you should be able to make a key pair, install it on a server, collapse a long invocation into one word in `~/.ssh/config`, use an agent so a passphrase is typed once a day, and open a tunnel that brings a service running on a cluster's loopback interface to a browser on your laptop.

All output below was produced on this machine and pasted verbatim, with OpenSSH_9.6p1 on Ubuntu 24.04.4, running as an ordinary user `eng`. `sim01` is an alias for a real `sshd` listening on `127.0.0.1:2222`, so every transcript is a genuine SSH session — it is simply a short one. Fingerprints, key material, socket paths and PIDs are specific to this capture and will differ in yours; the *shape* of every message is exactly what you will see.

## Keys, not passwords

A key pair is two files. The private key never leaves your machine; the public key is what you install on every server.

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

`-t ed25519` chooses the algorithm; use it unless a server is too old to accept it, in which case `-t rsa -b 4096`. `-C` is a comment, conventionally who and where, which is how you identify a key in an `authorized_keys` file two years later. `-N ""` sets an empty passphrase — do not do that on a real key; leave `-N` off and it prompts you.

The public key is one line:

```bash
cat ~/.ssh/demo_key.pub
```

```text
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGYPLEI5LyWFOLCkHZLDHJjE+mMvmQExXZdf92ZjH+NM eng@laptop
```

Three fields: algorithm, key, comment. An ed25519 public key is always about this long — 80-odd characters — which is one reason to prefer it over a 4096-bit RSA key, whose public form runs to seven hundred. Both fingerprints for comparison, from `ssh-keygen -lf`:

```text
256 SHA256:sf8Sg9/4LfYIgFsjVE4SBzgAhBNUfg6DHm74Z74NHC4 eng@laptop (ED25519)
4096 SHA256:Ua4+PaAUn14RddBkAE8iSfRBoPGXGWfGG74bTZdzhH8 old@laptop (RSA)
```

The *private* key starts `-----BEGIN OPENSSH PRIVATE KEY-----`. If you have ever pasted a block that begins that way into a chat window, the key is burned; generate a new one.

::: warning
SSH refuses to use a private key that other people can read, and the refusal is loud:

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

Exit status 255. The rule: `~/.ssh` is 700, private keys are 600, public keys and `known_hosts` may be 644. `chmod 600 ~/.ssh/id_ed25519` and the same command works. This is the single most common cause of "my key stopped working" after copying a key with `cp` from a USB stick or unpacking it from a tarball.
:::

### Installing the public key

`ssh-copy-id` appends your public key to `~/.ssh/authorized_keys` on the server, creating the directory with the right modes if it is not there:

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

And the new key now authenticates on its own:

```text
the new key works
```

Without `-f`, `ssh-copy-id` first checks whether the key is already installed and skips it if so. All it does is what you could do by hand — `cat key.pub | ssh host 'umask 077; mkdir -p ~/.ssh; cat >> ~/.ssh/authorized_keys'` — and knowing that is useful when the server only accepts keys through a web form or a configuration-management repository.

Before the key was installed, the same connection was refused:

```text
root@127.0.0.1: Permission denied (publickey,keyboard-interactive).
```

That message lists the authentication methods the *server* is willing to continue with. `publickey` alone means passwords are disabled and a key is the only way in.

## `known_hosts` and the warning you must not click through

The first time you connect, SSH records the server's host key. Every later connection checks it, and that check is what makes the encrypted channel worth anything: without it, anything that can answer on that address can read your session.

```bash
cat ~/.ssh/known_hosts
```

```text
[127.0.0.1]:2222 ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAINIlGLdhjmzN4wROZcdXHjGqMpOP/WOsn6cxUOq3TOis
```

Now replace that entry with a different key — which is exactly what a machine-in-the-middle would present — and connect:

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

The connection is refused, exit status 255. The message even gives you the command to make it go away, and *that is the trap*: running `ssh-keygen -R` without finding out why the key changed defeats the entire mechanism. Legitimate reasons exist — the server was rebuilt, the VM was recreated, the address was reassigned to a different machine. Confirm the new fingerprint out of band, by asking whoever rebuilt it or by reading it from the console, and only then remove the old entry.

`StrictHostKeyChecking accept-new` is a reasonable setting for a fleet of machines that come and go: it accepts a *first* key silently but still refuses a *changed* one.

## `~/.ssh/config`

Every option you can pass on the command line can live in a file, per host.

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

That is the entire reason every command in this lesson and the last could say `sim01`. The keys worth knowing:

- `HostName`, `User`, `Port` — the address, account and port.
- `IdentityFile` — which key; `IdentitiesOnly yes` stops SSH offering every other key it can find, which matters when a server locks you out after five failed attempts and you have six keys.
- `ForwardAgent yes` — agent forwarding, discussed below. Set it per host, never globally.
- `ServerAliveInterval 60` and `ServerAliveCountMax 3` — send a keepalive every 60 s and give up after three unanswered. This is what stops a NAT or firewall silently dropping an idle session while your simulation runs.
- `ProxyJump bastion` — reach a machine through a jump host in one hop, replacing the old `ProxyCommand ssh -W` incantation.
- `ControlMaster auto`, `ControlPath ~/.ssh/cm-%r@%h:%p`, `ControlPersist 10m` — reuse one authenticated connection for subsequent sessions, which makes the second and later `ssh`, `scp` and `rsync` to the same host start instantly.

A `Host *` block at the end applies to everything, and first match wins for each option, so put specific hosts first.

`ssh -G host` prints the settings that would actually be used, fully resolved — the way to check a config without connecting:

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
Four lines of configuration replacing a command nobody can remember.

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

Now `ssh sim01`, `scp results.tar.gz sim01:/srv/`, and `rsync -a runs/ sim01:/srv/runs/` all work with no flags, use the right key and only that key, survive an idle hour without being dropped, and share one TCP connection so the second command does not repeat the handshake.

Add a jump host and the whole cluster becomes one word each:

```text
Host bastion
    HostName bastion.example.com
    User eng

Host sim*
    HostName %h.cluster.internal
    User eng
    ProxyJump bastion
```

`%h` is the host you typed, so `ssh sim07` resolves to `sim07.cluster.internal` reached through `bastion`, and `sim01` through `sim12` need no entries of their own. Verify any of it with `ssh -G sim07` before you rely on it.
:::

## The agent

A private key with a passphrase is safe and tedious: every `ssh`, every `scp`, every `rsync` asks for it. `ssh-agent` holds the decrypted key in memory and answers challenges on your behalf.

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

The passphrase is typed once, when the key is added. Afterwards the agent lists what it holds:

```bash
ssh-add -l
```

```text
256 SHA256:7WLiqPwOJWT4M8C6D8fxPWyE7gd7KuTVw1bHTN8CTu4 eng@laptop (ED25519)
256 SHA256:9rsEB+IvhFhSamIg7eA7Ix2C2rCWNeRIwUOHDpo2NBM eng@laptop (ED25519)
```

`ssh-add -D` removes them all, `ssh-add -t 3600` adds a key that expires after an hour, and the agent is reachable through the socket named by `SSH_AUTH_SOCK`. On a desktop the agent is usually started for you at login; on a server you start one with `eval "$(ssh-agent -s)"`.

Note that the key itself never leaves the agent. Programs ask it to *sign* a challenge; they never receive the key.

## Agent forwarding

Sometimes you are on `sim01` and need to reach `sim02`, or clone a private repository, and the key that authorises it is on your laptop. Copying the private key to the server is the wrong answer. Agent forwarding lets the remote session use your local agent over the existing connection.

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

The remote `ssh-add -l` is listing the keys held by the agent *on the laptop*. The key material never crossed the link; the socket did.

::: warning
That socket is a live signing oracle for your keys, and its permissions protect it only from ordinary users. **Anyone with root on the remote host can use your agent for as long as you are connected** — to log in to every other machine your keys open, as you, leaving your name in the logs.

So: never enable `ForwardAgent yes` in a `Host *` block, forward only to machines whose administrators you would trust with your credentials, and prefer `ProxyJump` when all you need is to pass *through* a host rather than act from it. `ssh-add -c` makes the agent require confirmation for every use, which at least turns a silent theft into a prompt you did not expect.
:::

## Port forwarding

A cluster's monitoring page, a Jupyter kernel, a database — these are routinely bound to the server's loopback interface, reachable only from the server itself. SSH will carry a TCP connection for you.

`-L local:host:port` is **local forwarding**: listen on a port on *your* machine and deliver connections to `host:port` as reached *from the server*.

Before the tunnel, nothing is listening on port 9000 here:

```bash
curl -s --max-time 3 http://127.0.0.1:9000/ ; echo "curl exit=$?"
```

```text
curl exit=7
```

Exit 7 is curl's "failed to connect". Now open the tunnel — `-f` backgrounds it after authentication, `-N` says "no remote command, just the forwarding":

```bash
ssh -f -N -L 9000:127.0.0.1:8899 sim01
curl -s --max-time 3 http://127.0.0.1:9000/
```

```text
campaign 2026-03-14: 499 OK, 1 DIVERGED
```

```bash
ss -ltn | grep 9000
```

```text
LISTEN 0      128        127.0.0.1:9000       0.0.0.0:*
```

Read the argument as three parts: `9000` is the port on your machine, and `127.0.0.1:8899` is the address the *server* dials. That second part is resolved on the server, which is the whole point — `localhost` there means the server's loopback, not yours. Point a browser at `http://localhost:9000` and you are looking at a page served inside the cluster.

`-R remote:host:port` is **remote forwarding**, the mirror image: the server listens, and connections are carried back to you.

```bash
ssh -f -N -R 9100:127.0.0.1:8899 sim01
ssh sim01 "curl -s --max-time 3 http://127.0.0.1:9100/"
```

```text
campaign 2026-03-14: 499 OK, 1 DIVERGED
```

That is how you let a job on a machine with no route to the internet reach a service on your side — a license server, a local artefact cache.

`-D port` is **dynamic forwarding**: SSH becomes a SOCKS proxy and forwards wherever the client asks.

```bash
ssh -f -N -D 1080 sim01
curl -s --max-time 5 --socks5-hostname 127.0.0.1:1080 http://127.0.0.1:8899/
```

```text
campaign 2026-03-14: 499 OK, 1 DIVERGED
```

One tunnel, any destination the server can reach, with `--socks5-hostname` telling curl to resolve names at the far end too. Configure a browser to use it and internal pages simply work.

A forward dies with the SSH session that carries it, which is why `-f -N` tunnels are usually run inside `tmux` alongside the job they serve, or given `ControlPersist` so they survive a closed window.

::: example Watching a campaign's dashboard from your laptop
The pattern, end to end, for a job whose progress page binds to the cluster node's loopback on port 8899:

```bash
ssh -f -N -L 9000:127.0.0.1:8899 sim01
```

then open `http://localhost:9000` in a browser. The page is served by the node; nothing about it is exposed to the network; no firewall rule was requested; the traffic is inside the SSH session you were already authorised for.

Three details that make it work in practice. Choose a local port above 1024 so you do not need root — 9000 here. If that port is already taken, by an earlier tunnel you forgot about, the second attempt says so and quietly does not forward:

```text
channel_setup_fwd_listener_tcpip: cannot listen to port: 9000
Could not request local forwarding.
```

Note that with `-f -N` the session still exists — it just carries no forwarding — so the symptom is a browser that shows you yesterday's tunnel. And `-L 0.0.0.0:9000:...` would expose the forwarded service to everyone on your network, which is almost never what you want; leave it bound to loopback.
:::

::: key
`ssh-keygen -t ed25519` makes the pair; the private key is 600 or SSH refuses it. `ssh-copy-id` installs the public half. A changed host key stops the connection, and clearing it without checking defeats the whole mechanism. `~/.ssh/config` turns flags into a host alias; `ssh -G host` shows what is really in effect. `-A` forwards the agent and hands root on that host the use of your keys. `-L` brings a remote port to you, `-R` takes a local port there, `-D` is a SOCKS proxy.
:::

## Check yourself

::: check
A colleague copies her private key to the cluster's shared home directory so that jobs running there can `git clone` a private repository. Give two things wrong with that, and the correct arrangement.
:::

::: answer
First, the key is now on a machine she does not control, in a home directory that the administrators and possibly her whole group can read; a key on a shared filesystem should be treated as disclosed. Second, a key with a passphrase is useless to an unattended job, so she has almost certainly copied an unencrypted one — the worst case of the first problem.

The correct arrangement depends on what the job needs. For a job that must clone by itself, generate a *separate* key pair on the cluster, register its public half as a deploy key with read-only access to that one repository, and leave her personal key on her laptop. For interactive work where she is present, use agent forwarding (`ssh -A`) or, better, `ProxyJump` if she only needs to pass through. The principle is that a credential should live on exactly one machine and be scoped to exactly what it must open.
:::

::: check
`ssh sim03` prints `REMOTE HOST IDENTIFICATION HAS CHANGED!` and refuses to connect. Your colleague says "just run the `ssh-keygen -R` it suggests". Under what circumstances is that right, and what should you do first?
:::

::: answer
It is right only once you know why the key changed. Legitimate causes: the machine was rebuilt or reimaged, the VM was recreated, the DNS name or IP was reassigned to a different host, or the administrators regenerated the host keys. In all of those the new key is genuinely the host's.

What you do first is verify the new fingerprint through a channel that is not the suspect connection. Ask whoever rebuilt the machine what fingerprint it should have — they can read it with `ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub` on the console — and compare it with the one the warning printed. Only when they match do you remove the stale entry and reconnect.

If nobody can account for the change, treat it as an attack: stop using that path, do not type anything into the session, and tell whoever runs the network. The warning exists because this is the one moment the protocol can catch an interception, and the habit of clearing it reflexively is what makes the attack worth attempting.
:::

::: check
You need to reach a Jupyter server bound to `127.0.0.1:8888` on `sim01`, from a browser on your laptop. Write the command, explain each part of the `-L` argument, and say why `-L 8888:sim01:8888` would be wrong.
:::

::: answer
`ssh -f -N -L 8888:127.0.0.1:8888 sim01`, then browse to `http://localhost:8888`.

The three parts of `8888:127.0.0.1:8888`: the first is the port SSH listens on *on your laptop*; the second and third are the address and port that the *server* connects to when something arrives on that local port. `-f` backgrounds the session once authentication is done and `-N` says there is no remote command to run, only the forwarding.

`-L 8888:sim01:8888` is wrong for a subtle reason: the middle field is resolved and dialled *by the server*, so it would make `sim01` look up its own external name and connect to that address. If Jupyter is bound to the loopback interface — which it is, by default, precisely so it is not exposed — nothing is listening on the external address and the connection is refused. It would also fail on any host whose own name does not resolve locally. `127.0.0.1` names the loopback from the server's point of view, which is where the service actually is.
:::

::: check
Explain why `ForwardAgent yes` in a `Host *` block is a bad default, when a forwarded agent never transmits the private key.
:::

::: answer
Because what is exposed is not the key but the *use* of the key. Forwarding creates a Unix socket on the remote host that will sign any challenge presented to it. Anyone who can reach that socket — root on that host, always — can authenticate as you to every machine and every service your keys open, for as long as your session lasts, with your name in the audit logs.

`Host *` makes that true for every host you ever connect to, including ones you touch once, machines shared with people you do not know and hosts whose administrators you have never met. The correct setting is per host, on machines you would trust with the credentials themselves. Where you only need to pass *through* a host to reach another, `ProxyJump` is strictly better: it tunnels the second connection inside the first, and the intermediate host authenticates nothing and sees only encrypted bytes.

`ssh-add -c` mitigates what remains by making the agent prompt for confirmation on each use, so an unexpected signature request becomes visible instead of silent.
:::

::: check
Your SSH sessions to the cluster die after about ten minutes of idleness, taking long-running commands with them, while a session in which you keep typing survives all afternoon. What is happening and which two settings fix it?
:::

::: answer
Something between you and the server — a NAT gateway, a stateful firewall, a VPN concentrator — is expiring the idle TCP connection from its translation table. That is why typing keeps a session alive: traffic refreshes the entry. Neither end has closed anything; the path has simply stopped carrying packets for that flow, and you find out when the next byte fails to arrive.

`ServerAliveInterval 60` makes your client send an encrypted keepalive every 60 seconds when the channel is otherwise quiet, which keeps the entry alive. `ServerAliveCountMax 3` sets how many unanswered keepalives to tolerate before giving up — so a genuinely dead server is detected in about three minutes rather than hanging forever. Put both in the host's `~/.ssh/config` block.

Note this only keeps the *session* alive. It does nothing for a laptop that sleeps, or for a connection that really is severed. For that the answer is the next lesson's: run the job inside `tmux` on the server, so losing the connection stops mattering at all.
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
| `ServerAliveInterval` / `ServerAliveCountMax` | keepalives and how many may fail | stops idle sessions being dropped by a NAT |
| `ProxyJump`, `ControlMaster`/`ControlPersist` | one hop through a bastion; reuse one connection | later commands to the same host start instantly |
| `ssh -G host` | the fully resolved settings | check a config without connecting |
| `ssh-agent`, `ssh-add`, `-l`, `-D`, `-t`, `-c` | hold decrypted keys; list, drop, expire, confirm | the key never leaves the agent |
| `ssh -A` / `ForwardAgent` | remote session may use your agent | root there can use your keys — never `Host *` |
| `-L lport:host:port` | listen here, connect from there | the middle address is resolved on the server |
| `-R rport:host:port` | listen there, connect from here | reach your side from a closed network |
| `-D port` | SOCKS proxy through the server | `curl --socks5-hostname` resolves at the far end |
| `-f -N` | background after auth; no remote command | the tunnel dies with the session |

Lesson 09 removes the last reason a dropped connection can cost you anything: `tmux`, where the job belongs to a server-side session and your terminal is only a window onto it.
