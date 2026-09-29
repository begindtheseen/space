/** The language a reference entry belongs to. Terminal and git commands are `shell`. */
export type CommandLang = 'shell' | 'python' | 'cpp' | 'sql' | 'rust' | 'matlab' | 'cmake' | 'dockerfile' | 'yaml' | 'toml'

/** One command, keyword or library name ORBIT teaches, as Explain shows it. */
export interface CommandRef {
  /**
   * Exactly as written: `cp`, `git commit`, `print`, `numpy.linalg.norm`,
   * `str.split`, `std::vector`, `<vector>`, `#include`, `GROUP BY`, `COUNT`.
   */
  name: string
  /** Other spellings of the same thing: `[` for `test`, `split` for `str.split`, `vector` for `std::vector`. */
  aliases?: string[]
  /** Which language it belongs to; leave out for terminal and git commands. */
  lang?: CommandLang
  kind:
    | 'file' | 'text' | 'system' | 'builtin' | 'keyword' | 'git' | 'build'
    | 'function' | 'type' | 'class' | 'module' | 'method' | 'constant' | 'exception'
    | 'header' | 'directive' | 'macro' | 'library' | 'clause'
  /** Its own description, word for word from the official documentation named in `source`. */
  official: string
  /** Where `official` comes from, e.g. "cp manual page (GNU coreutils)" or "Python built-in docstring". */
  source: string
  /** When you reach for it, in plain words. */
  when: string
  /** The flags, arguments or parts ORBIT's lessons use, each in a few words. */
  flags?: [part: string, meaning: string][]
  example: { command: string; says: string }
  /** Related entries that are also in the reference. */
  seeAlso?: string[]
}
