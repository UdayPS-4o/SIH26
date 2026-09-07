/** Formatting helpers. Indian digit grouping throughout, since every rupee
 *  figure on screen is one a MoSPI reader would expect in lakh/crore grouping. */

const inr0 = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })
const inr2 = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const plain = new Intl.NumberFormat('en-IN')

export const fmtInt = (n: number) => plain.format(Math.round(n))

export const fmtRupee = (n: number) => `₹${inr0.format(Math.round(n))}`

export const fmtRupeeCompact = (n: number) =>
  n >= 10000000
    ? `₹${(n / 10000000).toFixed(2)} cr`
    : n >= 100000
      ? `₹${(n / 100000).toFixed(2)} L`
      : fmtRupee(n)

export const fmtIndex = (n: number) => inr2.format(n)

export const fmtPct = (n: number, digits = 1) => `${n.toFixed(digits)}%`

export const fmtSignedPct = (n: number, digits = 1) =>
  `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toFixed(digits)}%`

export const fmtSigned = (n: number, digits = 2) =>
  `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toFixed(digits)}`

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** ISO date string in, "14 Aug" out. */
export function fmtDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`
}

export function fmtDayFull(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

export function fmtMonth(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

export function fmtClock(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
}

export const fmtLead = (bucket: number) => `T+${bucket}`
