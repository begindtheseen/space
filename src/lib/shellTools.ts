/* ============================================================================
   What the practice terminal's bigger tools (awk, jq, paste, join, column)
   get from the shell: files, standard input, and a way to run a command.
   ========================================================================== */

export interface ToolIO {
  /** Piped-in text, or null when nothing is piped in. */
  stdin: string | null
  /** Takes all of standard input (it is used up). */
  takeStdin: () => string
  /** A file's text, or why it cannot be read. */
  readFile: (path: string) => string | { error: string }
  /** Writes (or appends to) a file; an error message when it cannot. */
  writeFile: (path: string, text: string, append: boolean) => string | null
  /** Runs a shell command with this text on its standard input. */
  run: (cmd: string, input: string) => { out: string; err: string; code: number }
  /** Exported variables. */
  env: Record<string, string>
}

export interface ToolResult {
  out: string
  err: string
  code: number
  /** The output and errors in the order they happened, when that matters. */
  chunks?: [1 | 2, string][]
}
