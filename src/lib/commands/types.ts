/** One command ORBIT teaches, as Explain shows it. */
export interface CommandRef {
  /** Exactly as typed: `cp`, `git commit`, `docker run`, `if`, `[[`. */
  name: string
  /** Other spellings of the same command, e.g. `[` for `test`. */
  aliases?: string[]
  kind: 'file' | 'text' | 'system' | 'builtin' | 'keyword' | 'git' | 'build'
  /** The command's own one-line description, word for word from its manual or built-in help. */
  official: string
  /** Where `official` comes from, e.g. "cp manual page (GNU coreutils)". */
  source: string
  /** When you reach for it, in plain words. */
  when: string
  /** The flags ORBIT teaches, each in a few words. */
  flags?: [flag: string, meaning: string][]
  example: { command: string; says: string }
  /** Related commands that are also in the reference. */
  seeAlso?: string[]
}
