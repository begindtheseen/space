/* ============================================================================
   ORBIT — number and time formatting
   ----------------------------------------------------------------------------
   Shared by the Settings storage line and the desktop updates card, so a byte
   count or a timestamp reads the same wherever it appears.
   ========================================================================== */

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

export function formatBytes(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(units.length - 1, Math.floor(Math.log(n) / Math.log(1024)))
  return `${(n / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

/** "22 Sep 2026" in the viewer's locale, or null when `iso` does not parse. */
export function formatDate(iso: string): string | null {
  const t = Date.parse(iso)
  if (!Number.isFinite(t)) return null
  return new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

/**
 * "just now", "4 minutes ago", "yesterday" … for the last month and a calendar
 * date beyond it. Returns null when `iso` does not parse, so a caller can say
 * so rather than show a confident "just now" for garbage.
 */
export function formatRelativeTime(iso: string, now: number = Date.now()): string | null {
  const t = Date.parse(iso)
  if (!Number.isFinite(t)) return null
  // A stamp slightly ahead of the local clock is skew, not the future.
  const diff = Math.max(0, now - t)
  if (diff < 45_000) return 'just now'
  if (diff < 90_000) return 'a minute ago'
  if (diff < 45 * MINUTE) return `${Math.round(diff / MINUTE)} minutes ago`
  if (diff < 90 * MINUTE) return 'an hour ago'
  if (diff < 22 * HOUR) return `${Math.round(diff / HOUR)} hours ago`
  if (diff < 36 * HOUR) return 'yesterday'
  if (diff < 26 * DAY) return `${Math.round(diff / DAY)} days ago`
  return formatDate(iso)
}
