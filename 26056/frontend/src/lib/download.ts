/** Client-side file export. The dashboard is not the deliverable NSO and RBI
 *  want, a feed is, so every table on screen can leave as a file. */

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Revoke on the next tick so Safari has finished reading the object URL.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const escapeCell = (v: unknown): string => {
  const s = v == null ? '' : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function downloadCsv<R extends object>(
  filename: string,
  columns: Array<{ key: keyof R & string; header: string }>,
  rows: R[],
) {
  const head = columns.map((c) => escapeCell(c.header)).join(',')
  const body = rows
    .map((r) => columns.map((c) => escapeCell((r as Record<string, unknown>)[c.key])).join(','))
    .join('\n')
  triggerDownload(new Blob([`${head}\n${body}\n`], { type: 'text/csv;charset=utf-8' }), filename)
}

export function downloadJson(filename: string, payload: unknown) {
  triggerDownload(
    new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }),
    filename,
  )
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
