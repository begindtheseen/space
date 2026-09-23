/* ============================================================================
   ORBIT — what changed, and when
   ----------------------------------------------------------------------------
   An update that arrives without saying what it did asks for trust it has not
   earned. So the same file answers both halves of the question: the entry for
   the version she is about to install is shown before she installs it, and the
   entry for the version she is running is shown afterwards.

   CHANGELOG.md is the single source. The app reads it as text at build time,
   and scripts/make-bundle.mjs reads the same file when it writes the release
   manifest, so the notes in the update panel and the notes in Settings cannot
   disagree with each other or with the repository.
   ========================================================================== */
import changelogMarkdown from '../../CHANGELOG.md?raw'

export interface ChangelogEntry {
  /** The version this entry describes, e.g. "1.0.6". */
  version: string
  /** Everything written under that heading, as markdown. */
  notes: string
}

/** A version heading: `## 1.0.6`, and nothing else on the line. */
const HEADING = /^##[ \t]+v?(\d+\.\d+\.\d+)[ \t]*$/gm

/**
 * Splits a changelog into its entries, newest first as written.
 *
 * Anything above the first version heading is the file's own preamble and is
 * not an entry.
 */
export function parseChangelog(markdown: string): ChangelogEntry[] {
  const out: ChangelogEntry[] = []
  const heads: { version: string; start: number; end: number }[] = []

  HEADING.lastIndex = 0
  for (let m = HEADING.exec(markdown); m; m = HEADING.exec(markdown)) {
    heads.push({ version: m[1], start: m.index, end: m.index + m[0].length })
  }

  for (let i = 0; i < heads.length; i++) {
    const body = markdown.slice(heads[i].end, heads[i + 1]?.start ?? markdown.length)
    out.push({ version: heads[i].version, notes: body.trim() })
  }
  return out
}

/** The entry for one version, or null when nothing was written for it. */
export function notesFor(markdown: string, version: string): string | null {
  const found = parseChangelog(markdown).find((e) => e.version === version)
  return found && found.notes ? found.notes : null
}

/** Every entry in the shipped changelog, newest first. */
export const CHANGELOG: ChangelogEntry[] = parseChangelog(changelogMarkdown)

/** What this build of the app changed, or null when it went unrecorded. */
export function notesForVersion(version: string): string | null {
  const found = CHANGELOG.find((e) => e.version === version)
  return found && found.notes ? found.notes : null
}
