/* ============================================================================
   ORBIT — desktop bridge
   ----------------------------------------------------------------------------
   The Electron shell's preload (desktop/preload.cjs) exposes `window.orbit`;
   this module is the only place the web app looks for it. In a browser or a
   PWA it is absent and every consumer degrades to a no-op, which is what keeps
   the static build behaving identically with or without the shell around it.
   The types mirror the contract in desktop/README.md and are consumed by
   desktop/ipc.js and desktop/updater.js, so change them together.
   ========================================================================== */

export type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'up-to-date'
  | 'available'
  | 'downloading'
  | 'ready'
  | 'error'
  | 'shell-required'

export interface UpdateLatest {
  version: string
  /** Markdown release notes. */
  notes: string
  /** ISO timestamp. */
  publishedAt: string
  /** Bundle zip size in bytes. */
  size: number
  sha256: string
  /** Lowest shell version that can run this bundle. */
  minShell: string
  /** Where to get the newer shell when this bundle needs one. */
  shellDownloadUrl?: string
}

export interface UpdateState {
  status: UpdateStatus
  /** Active bundle version. */
  current: string
  /** Version of the bundle packaged inside the app. */
  builtIn: string
  shell: string
  /** GitHub owner/repo that hosts the releases. */
  repo: string
  /** ISO timestamp of the last successful check. */
  checkedAt?: string
  latest?: UpdateLatest
  progress?: { received: number; total: number }
  error?: string
  /** GitHub answered 401/404 and no token is stored. */
  needsToken?: boolean
  hasToken: boolean
  /** The active bundle is a downloaded one. */
  canRollback: boolean
  /** The token had to be stored unencrypted because no OS keychain was available. */
  tokenPlaintext?: boolean
}

export interface OrbitVersions {
  shell: string
  bundle: string
  builtIn: string
  electron: string
}

export interface ToolchainInfo {
  lang: string
  label: string
  available: boolean
  /** The executable that will be used, e.g. `clang++`. */
  bin?: string
  /** First line of its `--version` output. */
  version?: string
  /** Shown when it is missing: the one command that installs it. */
  install?: string
}

export interface RunRequest {
  lang: string
  source: string
  /** Fed to the program on stdin. */
  stdin?: string
}

export interface RunResult {
  ok: boolean
  /** Where it got to: `request`, `toolchain`, `setup`, `compile` or `run`. */
  stage: string
  stdout: string
  stderr: string
  exitCode: number | null
  timedOut: boolean
  /** Output was cut off at the cap. */
  truncated: boolean
  ms: number
  /** The compiler that was used, for the record shown under the output. */
  toolchain?: string
  /** Why it did not run, in a sentence, when `ok` is false. */
  reason?: string
  /** How to install the missing toolchain, when that is the reason. */
  install?: string
}

export interface OrbitBridge {
  readonly platform: 'darwin' | 'win32' | 'linux'
  readonly versions: Readonly<OrbitVersions>
  /** Tells the shell the renderer has painted; it then swaps the splash for the window. */
  ready(): void
  /**
   * Names the boot step in progress so the splash can show it. Fire and
   * forget: the shell drops these once the splash is gone.
   */
  bootStatus(text: string): void
  readonly updates: {
    getState(): Promise<UpdateState>
    check(): Promise<UpdateState>
    download(): Promise<UpdateState>
    /** Switches to the downloaded bundle and relaunches. */
    apply(): Promise<void>
    /** Returns to the built-in bundle and relaunches. */
    rollback(): Promise<void>
    setToken(token: string | null): Promise<UpdateState>
    onState(cb: (state: UpdateState) => void): () => void
  }
  /**
   * The progress mirror on disk. Survives the shell's browser storage being
   * cleared or rebuilt, which IndexedDB does not; see desktop/backup.js.
   */
  readonly backup: {
    /** Atomic write. Resolves false when the file could not be written. */
    write(json: string): Promise<boolean>
    /** The stored JSON, or null when there is no mirror yet. */
    read(): Promise<string | null>
  }
  /**
   * Compiling and running code the browser cannot run — C, C++, Rust, shell,
   * Octave, Node — using whatever toolchain the machine already has. See
   * desktop/runner.js.
   */
  readonly run: {
    /** What is installed. Pass true to re-probe after installing something. */
    detect(refresh?: boolean): Promise<Record<string, ToolchainInfo>>
    exec(request: RunRequest): Promise<RunResult | null>
  }
  /** https: and mailto: only; the shell drops anything else. */
  openExternal(url: string): Promise<void>
  /** Menu-driven navigation, e.g. "Check for Updates…" lands on '/settings'. */
  onNavigate(cb: (path: string) => void): () => void
}

declare global {
  interface Window {
    orbit?: OrbitBridge
  }
}

/** The shell's token rule (desktop/config.js), mirrored so a typo is caught before it crosses the bridge. */
export const TOKEN_PATTERN = /^[A-Za-z0-9_]{20,255}$/
export const TOKEN_RULE =
  'Token must be 20–255 letters, digits or underscores (a ghp_… or github_pat_… token).'

export function getOrbit(): OrbitBridge | undefined {
  if (typeof window === 'undefined') return undefined
  const bridge = window.orbit
  // A structural check rather than a bare truthiness test: a stray global
  // named `orbit` must not turn the browser build into a broken desktop.
  return !!bridge &&
    typeof bridge === 'object' &&
    typeof bridge.ready === 'function' &&
    typeof bridge.updates === 'object' &&
    typeof bridge.updates.onState === 'function'
    ? bridge
    : undefined
}

export const isDesktop = !!getOrbit()

/**
 * Whether this shell can compile and run native code.
 *
 * A bundle updates itself; the app around it does not. Someone running a shell
 * from before the runner existed ends up with a current curriculum inside an
 * app whose bridge has no `run` on it, and every compiled language quietly
 * falls back to comparing strings. `orbit.minShell` in package.json is what
 * stops a bundle activating on a shell too old for it; this is what lets the
 * playground say why, rather than claiming she needs the desktop app while she
 * is sitting in it.
 */
export const hasNativeRunner = !!getOrbit()?.run

const STATUSES: ReadonlySet<string> = new Set<UpdateStatus>([
  'idle',
  'checking',
  'up-to-date',
  'available',
  'downloading',
  'ready',
  'error',
  'shell-required',
])

/** Whether a value that crossed the bridge is a state snapshot the UI can render. */
export function isUpdateState(value: unknown): value is UpdateState {
  if (typeof value !== 'object' || value === null) return false
  const s = value as Record<string, unknown>
  return (
    typeof s.status === 'string' &&
    STATUSES.has(s.status) &&
    typeof s.current === 'string' &&
    typeof s.shell === 'string' &&
    typeof s.hasToken === 'boolean'
  )
}
