#!/usr/bin/env bash
# Prints, for $GITHUB_OUTPUT, the version the next release of HEAD should have:
#   version=<x.y.z>   and   skip=true   when HEAD is exactly the latest release.
# package.json's version wins when it is newer than every release tag;
# otherwise the latest tag's patch number goes up by one. Only plain x.y.z
# tags count. Used by .github/workflows/auto-release.yml; run it locally to see
# what a merge would publish.
set -euo pipefail

semver_sort() { sort -t. -k1,1n -k2,2n -k3,3n; }

pkg="$(node -p "require('./package.json').version")"
latest="$(git tag -l 'v*' | sed -n 's/^v\([0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*\)$/\1/p' | semver_sort | tail -n1)"

if [[ -z "$latest" ]]; then
  echo "version=${pkg}"
  echo "No release yet: ${pkg}" >&2
  exit 0
fi

if [[ "$(git rev-parse "v${latest}^{tree}")" == "$(git rev-parse 'HEAD^{tree}')" ]]; then
  echo "version=${latest}"
  echo "skip=true"
  echo "HEAD is exactly v${latest}; nothing new to release" >&2
  exit 0
fi

if [[ "$pkg" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ && "$pkg" != "$latest" && "$(printf '%s\n%s\n' "$pkg" "$latest" | semver_sort | tail -n1)" == "$pkg" ]]; then
  next="$pkg"
else
  IFS=. read -r major minor patch <<<"$latest"
  next="${major}.${minor}.$((patch + 1))"
fi
echo "version=${next}"
echo "Latest release v${latest}, package.json ${pkg}: releasing ${next}" >&2
