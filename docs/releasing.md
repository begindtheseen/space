# Updates and releases

How the Mac app updates itself, and how a new version gets published. The short
version for users is in the root README under "Install on a Mac".

## How the Mac app updates

The Mac app is two things: a thin Electron shell, and the curriculum bundle (the
site's `dist/`) carried inside it. Almost every change ships as a new bundle, and a
bundle update does not need a new app: **Settings → Updates → Check for updates** asks
GitHub for the latest release, downloads the bundle zip (a few megabytes, seconds),
checks its SHA-256, and switches to it on the next restart. The app also checks quietly
a few seconds after launch and marks the avatar in the top bar when something is
waiting. If a downloaded bundle fails to start, the app quarantines it and goes back to
the last good one on its own; **Roll back** in the same card does the same by hand.

If the repository is private, GitHub answers an anonymous request with 404 and the
card says so. In that case, create a fine-grained personal access token with read-only
**Contents** permission for `begindtheseen/space` and paste it into the Access token
row. It is stored encrypted by macOS (`safeStorage`, backed by the login keychain) and
is only ever sent to `api.github.com` and the release download it redirects to. A
public repository needs no token, and releases can also be published from a separate
public repository by pointing `orbit.updates.repo` in `package.json` at it.

Changes to the shell itself (anything under `desktop/`, or a new Electron) need a
new DMG. The card says "This update needs a newer ORBIT app" and links to it; nothing
is downloaded that the installed app cannot run.

## Publishing an update

Every merge to `main` is released: `.github/workflows/auto-release.yml` works out
the next version and hands it to the release pipeline, so installed apps update
themselves without anyone cutting a release. The version is `package.json`'s when that
is newer than every release (bump it in a PR to move to a new minor or major version),
otherwise the latest release's patch number plus one; a merge whose files are exactly
the latest release's publishes nothing. `bash scripts/next-version.sh` shows what the
next merge would publish.

A release can also be cut by hand, from a version tag:

```bash
npm version patch          # or minor / major: bumps package.json and creates the tag
git push --follow-tags
```

`.github/workflows/release.yml` then checks that the tag equals `package.json`'s
version, typechecks and tests, builds the bundle zip and `orbit-manifest.json` on
Linux, builds the ad-hoc-signed universal DMG and drag-install zip on macOS, and
publishes all four as a GitHub Release. Installed apps see it on their next check. Put
a `RELEASE_NOTES.md` in the repository before tagging to control the notes shown inside
the app (Markdown); without one, the notes are generated from the commits.

No terminal handy? The same pipeline runs from a file change instead of a tag: set
`version` in `package.json` and write that version on the first line of `RELEASE.txt`
(in the repository root), then commit and push (any branch but `main`, or edit both
files on github.com). CI checks the two agree and that the tag does not exist yet,
creates `v<version>` at that commit, and publishes the release. Both routes end in the
same place.

What needs what:

| Change | Do | Ships as |
| --- | --- | --- |
| Curriculum, engine, pages: anything under `src/` or `public/` | Merge it | A bundle. Every installed app updates in place. |
| Anything under `desktop/`, or the Electron version | Merge it, **and** in the same PR set `version` and `orbit.minShell` in `package.json` to the version it will ship as | A new DMG. Older apps are told to download it instead of a bundle they cannot run. |

`minShell` is the contract between bundle and shell: a bundle is only ever activated by
a shell at least that new, so an old app never ends up running a bundle that expects an
IPC channel it does not have. The manifest carries it, the bundle carries it, and the
shell checks it at both download and startup.
