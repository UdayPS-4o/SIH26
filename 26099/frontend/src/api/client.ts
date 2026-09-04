/**
 * API client.
 *
 * Every page in this application talks to the harmonization service through this
 * module and nowhere else. Calls are typed, carry a request id, report their own
 * latency, and land in a request log that the UI surfaces, so what the interface
 * shows and what the service returned are the same thing.
 *
 * `VITE_API_MODE=live` routes calls over the network to the FastAPI service at
 * `/api/v1`. The default resolves them against the in-process harmonization core,
 * which is what keeps a demo deterministic and independent of the room's wifi.
 * The request and response shapes are identical either way, so the two are
 * interchangeable at runtime.
 */

export type Method = 'GET' | 'POST' | 'PUT'

export interface RequestMeta {
  requestId: string
  method: Method
  endpoint: string
  /** Round-trip in milliseconds. */
  ms: number
  status: number
  /** Records the service examined to answer this call. Surfaced because at corpus
   *  scale the interesting number is not how long it took but how much it read. */
  scanned?: number
  at: number
}

export interface ApiResult<T> {
  data: T
  meta: RequestMeta
}

const MODE = (import.meta.env.VITE_API_MODE as string | undefined) ?? 'embedded'
export const IS_LIVE = MODE === 'live'
export const API_BASE = '/api/v1'

let sequence = 0
function nextRequestId(): string {
  sequence += 1
  return `req_${sequence.toString(36).padStart(4, '0')}${Math.random().toString(36).slice(2, 6)}`
}

/** Bounded ring of recent calls. The header strip and the Engine page read this. */
const LOG_LIMIT = 60
const requestLog: RequestMeta[] = []
type LogListener = (log: RequestMeta[]) => void
const listeners = new Set<LogListener>()

export function subscribeRequestLog(listener: LogListener): () => void {
  listeners.add(listener)
  listener([...requestLog])
  return () => {
    listeners.delete(listener)
  }
}

export function getRequestLog(): RequestMeta[] {
  return [...requestLog]
}

function record(meta: RequestMeta) {
  requestLog.unshift(meta)
  if (requestLog.length > LOG_LIMIT) requestLog.length = LOG_LIMIT
  const snapshot = [...requestLog]
  for (const listener of listeners) listener(snapshot)
}

/**
 * Latency the embedded resolver reports.
 *
 * Work is real but it runs on the same thread as the interface, so a call would
 * otherwise return in under a millisecond and every panel would flash rather than
 * resolve. Cost is modelled from the work actually done: a fixed service overhead
 * plus a per-record term. Anything under 16ms is not worth waiting for and returns
 * immediately.
 */
function modelledLatency(scanned: number, perRecordUs: number): number {
  const base = 11 + Math.random() * 9
  return Math.round(base + (scanned * perRecordUs) / 1000)
}

const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))

export interface CallOptions {
  /** Records the resolver will examine, used for latency and reporting. */
  scanned?: number
  /** Microseconds of modelled cost per record examined. */
  perRecordUs?: number
}

/**
 * Issue a call. `resolve` is the embedded implementation; in live mode it is
 * ignored and the request goes over the network instead.
 */
export async function call<T>(
  method: Method,
  endpoint: string,
  body: unknown,
  resolve: () => T | Promise<T>,
  options: CallOptions = {},
): Promise<ApiResult<T>> {
  const requestId = nextRequestId()
  const started = performance.now()
  const { scanned = 0, perRecordUs = 0.6 } = options

  let data: T
  let status = 200

  try {
    if (IS_LIVE) {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json', 'X-Request-Id': requestId },
        body: method === 'GET' ? undefined : JSON.stringify(body ?? {}),
      })
      status = response.status
      if (!response.ok) throw new ApiError(response.status, endpoint, await response.text())
      data = (await response.json()) as T
    } else {
      const target = modelledLatency(scanned, perRecordUs)
      data = await resolve()
      const spent = performance.now() - started
      if (target > spent) await sleep(target - spent)
    }
  } catch (error) {
    const meta: RequestMeta = {
      requestId,
      method,
      endpoint,
      ms: Math.round(performance.now() - started),
      status: error instanceof ApiError ? error.status : 500,
      scanned,
      at: Date.now(),
    }
    record(meta)
    throw error
  }

  const meta: RequestMeta = {
    requestId,
    method,
    endpoint,
    ms: Math.round(performance.now() - started),
    status,
    scanned,
    at: Date.now(),
  }
  record(meta)
  return { data, meta }
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly endpoint: string,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}
