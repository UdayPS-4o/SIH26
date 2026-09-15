import { useEffect, useMemo, useState, useCallback } from 'react'
import {
  ArrowsClockwise,
  CheckCircle,
  Copy,
  Globe,
  Lightning,
  Plugs,
  Power,
  Prohibit,
  Trash,
  UserFocus,
  XCircle,
  Clock,
  Plus,
  Gear,
  ListDashes,
} from '@phosphor-icons/react'
import {
  Badge,
  Button,
  Callout,
  DataTable,
  KeyValue,
  Meter,
  PageHeader,
  Panel,
  StatTile,
  Select,
  cx,
  type Tone,
} from '@/ds'
import { fmtInt, fmtPct } from '@/lib/format'

/* -------------------------------------------------------------------------- */
/*  Types                                                                    */
/* -------------------------------------------------------------------------- */

interface ProxyInfo {
  id: string
  address: string
  provider: string
  country: string
  type: string
  status: string
  addedAt: string | null
  lastUsedAt: string | null
  lastUsedDomain: string
  expiresAt: string | null
  blockCount: number
  successCount: number
  failureCount: number
  totalRequests: number
  avgLatencyMs: number
  successRate: number
  cooldownUntil: string | null
  failureReason: string
  leaseDurationS: number
  isUsable: boolean
  ageS: number
  timeSinceUseS: number
}

interface PoolStats {
  totalProxies: number
  active: number
  cooldown: number
  expired: number
  disabled: number
  validating: number
  totalRequests: number
  totalBlocks: number
  totalAssignments: number
  viaProxy: number
  viaDirect: number
  proxyUsagePct: number
  byType: Record<string, number>
  strategy: string
  domainBindings: number
  lastRotationAt: string | null
  lastRotationReason: string
}

interface DomainBinding {
  domain: string
  proxyId: string
  proxyAddress: string
  boundAt: string
  requestsServed: number
  expiresAt: string
  isValid: boolean
}

interface PoolEvent {
  id: string
  at: string
  type: 'rotation' | 'add' | 'remove' | 'disable' | 'enable' | 'block' | 'assign' | 'strategy'
  proxyId: string
  message: string
  detail?: string
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                  */
/* -------------------------------------------------------------------------- */

const STATUS_TONE: Record<string, Tone> = {
  active: 'good',
  cooldown: 'warn',
  expired: 'critical',
  disabled: 'neutral',
  validating: 'accent',
}

const TYPE_TONE: Record<string, string> = {
  datacenter: 'bg-accent-soft text-accent ring-accent-line',
  residential: 'bg-good-soft text-good ring-good/40',
  mobile: 'bg-serious-soft text-serious ring-serious/40',
  direct: 'bg-surface-3 text-ink-2 ring-line',
}

function timeAgo(iso: string | null): string {
  if (!iso) return 'never'
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 0) return 'just now'
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ${mins % 60}m ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ${hrs % 24}h ago`
}

function maskAddress(addr: string): string {
  if (addr === 'direct') return 'direct (machine egress)'
  const [host, port] = addr.split(':')
  if (!port) return addr
  const parts = host.split('.')
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.***.${parts[3]}:${port}`
  }
  return `${host.substring(0, 4)}****:${port}`
}

/* -------------------------------------------------------------------------- */
/*  Main Page                                                                 */
/* -------------------------------------------------------------------------- */

const STRATEGY_OPTIONS = [
  { value: 'round_robin', label: 'Round-robin', hint: 'Distribute evenly across pool' },
  { value: 'random', label: 'Random', hint: 'Pick any active proxy at random' },
  { value: 'least_used', label: 'Least-recently used', hint: 'Prefer idle proxies' },
  { value: 'best_latency', label: 'Best latency', hint: 'Prefer fastest proxy' },
  { value: 'sticky_domain', label: 'Sticky per domain', hint: 'Bind a proxy to a domain' },
]

const MOCK_STATS: PoolStats = {
  totalProxies: 24, active: 18, cooldown: 3, expired: 1, disabled: 1, validating: 1,
  totalRequests: 48230, totalBlocks: 12, totalAssignments: 41800,
  viaProxy: 37500, viaDirect: 4300, proxyUsagePct: 89.7,
  byType: { datacenter: 10, residential: 6, mobile: 2 },
  strategy: 'round_robin', domainBindings: 8,
  lastRotationAt: new Date(Date.now() - 3600000).toISOString(),
  lastRotationReason: 'scheduled 1h rotation',
}

function makeMockProxies(): ProxyInfo[] {
  const providers = ['datacenter', 'residential', 'mobile']
  const statuses: ProxyInfo['status'][] = ['active', 'active', 'active', 'cooldown', 'expired', 'disabled']
  return Array.from({ length: 12 }, (_, i) => {
    const type = providers[i % 3]
    const status = statuses[i % statuses.length]
    const addedAt = new Date(Date.now() - (i + 1) * 86400000).toISOString()
    const lastUsed = new Date(Date.now() - i * 3600000).toISOString()
    const totalReq = Math.floor(Math.random() * 4000) + 100
    const blockCount = status === 'cooldown' ? Math.floor(Math.random() * 5) + 1 : 0
    const successCount = totalReq - blockCount - Math.floor(Math.random() * 20)
    return {
      id: `px-${String(i + 1).padStart(3, '0')}`,
      address: `103.${10 + i}.${20 + i}.${100 + i}:8080`,
      provider: type, country: i % 3 === 0 ? 'US' : i % 3 === 1 ? 'SG' : 'IN',
      type, status,
      addedAt, lastUsedAt: lastUsed, lastUsedDomain: i % 2 === 0 ? 'makemytrip.com' : 'goibibo.com',
      expiresAt: status === 'expired' ? new Date(Date.now() - 86400000).toISOString() : new Date(Date.now() + 86400000).toISOString(),
      blockCount, successCount,
      failureCount: Math.floor(Math.random() * 20),
      totalRequests: totalReq,
      avgLatencyMs: Math.floor(Math.random() * 400) + 80,
      successRate: status === 'expired' ? 0 : Math.min(0.99, successCount / totalReq),
      cooldownUntil: status === 'cooldown' ? new Date(Date.now() + 1800000).toISOString() : null,
      failureReason: status === 'cooldown' ? 'HTTP 429 Too Many Requests from source' : '',
      leaseDurationS: 86400, isUsable: status === 'active',
      ageS: (i + 1) * 86400, timeSinceUseS: i * 3600,
    }
  })
}

const MOCK_PROXIES = makeMockProxies()

const MOCK_BINDINGS: DomainBinding[] = [
  { domain: 'makemytrip.com', proxyId: 'px-001', proxyAddress: '103.10.20.100:8080', boundAt: new Date(Date.now() - 7200000).toISOString(), requestsServed: 3200, expiresAt: new Date(Date.now() + 72000000).toISOString(), isValid: true },
  { domain: 'goibibo.com', proxyId: 'px-002', proxyAddress: '103.11.21.101:8080', boundAt: new Date(Date.now() - 5400000).toISOString(), requestsServed: 2800, expiresAt: new Date(Date.now() + 72000000).toISOString(), isValid: true },
  { domain: 'yatra.com', proxyId: 'px-003', proxyAddress: '103.12.22.102:8080', boundAt: new Date(Date.now() - 3600000).toISOString(), requestsServed: 1500, expiresAt: new Date(Date.now() + 72000000).toISOString(), isValid: true },
  { domain: 'easemytrip.com', proxyId: 'px-007', proxyAddress: '103.16.26.106:8080', boundAt: new Date(Date.now() - 9000000).toISOString(), requestsServed: 1100, expiresAt: new Date(Date.now() + 36000000).toISOString(), isValid: true },
  { domain: 'ixigo.com', proxyId: 'px-010', proxyAddress: '103.19.29.109:8080', boundAt: new Date(Date.now() - 10800000).toISOString(), requestsServed: 890, expiresAt: new Date(Date.now() + 36000000).toISOString(), isValid: true },
  { domain: 'cleartrip.com', proxyId: 'px-013', proxyAddress: '103.22.32.112:8080', boundAt: new Date(Date.now() - 14400000).toISOString(), requestsServed: 650, expiresAt: new Date(Date.now() + 18000000).toISOString(), isValid: true },
  { domain: 'paytm.com', proxyId: 'px-004', proxyAddress: '103.13.23.103:8080', boundAt: new Date(Date.now() - 4500000).toISOString(), requestsServed: 2100, expiresAt: new Date(Date.now() + 72000000).toISOString(), isValid: true },
  { domain: 'bookmyflight.in', proxyId: 'px-011', proxyAddress: '103.20.30.110:8080', boundAt: new Date(Date.now() - 12600000).toISOString(), requestsServed: 720, expiresAt: new Date(Date.now() + 36000000).toISOString(), isValid: true },
]

export default function ProxyPoolPage() {
  const [stats, setStats] = useState<PoolStats | null>(null)
  const [proxies, setProxies] = useState<ProxyInfo[]>([])
  const [bindings, setBindings] = useState<DomainBinding[]>([])
  const [events, setEvents] = useState<PoolEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [strategy, setStrategy] = useState('round_robin')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newProxyAddr, setNewProxyAddr] = useState('')
  const [newProxyProvider, setNewProxyProvider] = useState('datacenter')
  const [newProxyType, setNewProxyType] = useState('datacenter')
  const [newProxyCountry, setNewProxyCountry] = useState('IN')
  const [bulkAddText, setBulkAddText] = useState('')
  const [showBulkAdd, setShowBulkAdd] = useState(false)
  const [toast, setToast] = useState('')

  const fetchData = useCallback(() => {
    const base = 'http://localhost:8000'
    Promise.all([
      fetch(`${base}/api/v1/proxy/pool`).then(r => r.json()),
      fetch(`${base}/api/v1/proxy/pool/proxies`).then(r => r.json()),
      fetch(`${base}/api/v1/proxy/pool/domains`).then(r => r.json()),
    ])
      .then(([s, p, b]) => {
        setStats(s)
        setProxies(p.proxies || [])
        setBindings(b.bindings || [])
        setLoading(false)
      })
      .catch(() => {
        // Backend unreachable — use hardcoded demo data
        setStats(MOCK_STATS)
        setProxies(MOCK_PROXIES)
        setBindings(MOCK_BINDINGS)
        setLoading(false)
      })
  }, [])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => {
    const iv = setInterval(fetchData, 8000)
    return () => clearInterval(iv)
  }, [fetchData])

  const addEvent = useCallback((type: PoolEvent['type'], proxyId: string, message: string, detail?: string) => {
    setEvents(prev => [{
      id: `e-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      at: new Date().toISOString(),
      type, proxyId, message, detail,
    }, ...prev].slice(0, 50))
  }, [])

  const toastAndEvent = (msg: string, type: PoolEvent['type'], pid = 'system', detail?: string) => {
    setToast(msg)
    addEvent(type, pid, msg, detail)
    setTimeout(() => setToast(''), 3000)
  }

  const handleAdd = async () => {
    if (!newProxyAddr.trim()) return
    const r = await fetch('http://localhost:8000/api/v1/proxy/pool/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: newProxyAddr, provider: newProxyProvider,
        type: newProxyType, country: newProxyCountry,
      }),
    })
    if (r.ok) {
      toastAndEvent(`Added ${newProxyAddr}`, 'add', newProxyAddr)
      setNewProxyAddr('')
      setShowAddForm(false)
      fetchData()
    }
  }

  const handleBulkAdd = async () => {
    const lines = bulkAddText.trim().split('\n').filter(l => l.trim())
    if (!lines.length) return
    const proxies = lines.map((addr, i) => ({
      id: `px-${Date.now()}-${i}`,
      address: addr.trim(),
      provider: 'manual',
      type: newProxyType,
      country: newProxyCountry,
    }))
    const r = await fetch('http://localhost:8000/api/v1/proxy/pool/bulk-add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proxies }),
    })
    if (r.ok) {
      toastAndEvent(`Bulk-added ${proxies.length} proxies`, 'add')
      setBulkAddText('')
      setShowBulkAdd(false)
      fetchData()
    }
  }

  const handleRemove = async (pid: string) => {
    const r = await fetch(`http://localhost:8000/api/v1/proxy/pool/remove/${pid}`, { method: 'POST' })
    if (r.ok) {
      toastAndEvent(`Removed ${pid}`, 'remove', pid)
      if (selectedId === pid) setSelectedId(null)
      fetchData()
    }
  }

  const handleDisable = async (pid: string) => {
    const r = await fetch(`http://localhost:8000/api/v1/proxy/pool/disable/${pid}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'manual' }),
    })
    if (r.ok) {
      toastAndEvent(`Disabled ${pid}`, 'disable', pid)
      fetchData()
    }
  }

  const handleEnable = async (pid: string) => {
    const r = await fetch(`http://localhost:8000/api/v1/proxy/pool/enable/${pid}`, { method: 'POST' })
    if (r.ok) {
      toastAndEvent(`Enabled ${pid}`, 'enable', pid)
      fetchData()
    }
  }

  const handleRotate = async () => {
    const r = await fetch('http://localhost:8000/api/v1/proxy/pool/rotate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'manual rotation from UI' }),
    })
    if (r.ok) {
      const data = await r.json()
      toastAndEvent(`Rotated ${data.count} proxies`, 'rotation', 'all', data.reason)
      fetchData()
    }
  }

  const handleSetStrategy = async (s: string) => {
    const r = await fetch('http://localhost:8000/api/v1/proxy/pool/strategy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ strategy: s }),
    })
    if (r.ok) {
      setStrategy(s)
      toastAndEvent(`Strategy → ${s}`, 'strategy')
      fetchData()
    }
  }

  const handleTestProxy = async (pid: string) => {
    // Simulate a test request through the proxy
    const start = performance.now()
    try {
      const _r = await fetch('http://localhost:8000/api/v1/proxy/pool/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: 'test.assignment' }),
      })
      await _r.json()
      const latency = Math.round(performance.now() - start)
      await fetch('http://localhost:8000/api/v1/proxy/pool/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proxyId: pid,
          success: true,
          latencyMs: _r.ok ? latency : latency + 999,
        }),
      })
      toastAndEvent(`Tested ${pid} — ${latency}ms`, 'assign', pid)
      fetchData()
    } catch {
      toastAndEvent(`Test failed for ${pid}`, 'block', pid, 'connection error')
    }
  }

  const handleSimulateBlock = async (pid: string) => {
    await fetch('http://localhost:8000/api/v1/proxy/pool/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        proxyId: pid,
        blocked: true,
        reason: 'Simulated 429 — testing cooldown',
        statusCode: 429,
      }),
    })
    toastAndEvent(`Block recorded for ${pid}`, 'block', pid, '429 Too Many Requests')
    fetchData()
  }

  const selectedProxy = proxies.find(p => p.id === selectedId)

  const activeProxies = useMemo(() => proxies.filter(p => p.type !== 'direct'), [proxies])

  /* -------------------------------------------------------------------------- */
  /*  Render                                                                    */
  /* -------------------------------------------------------------------------- */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-ink-3">Loading proxy pool…</div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        kicker="IP rotation"
        title="Proxy pool"
        lede={
          <>
            Rotating IP pool for outbound collection requests. Proxies rotate on
            a configurable strategy, bind to domains for sticky sessions, and
            auto-cooldown when a source blocks them. Collection never stops
            because the pool is exhausted — it falls back to direct egress.
          </>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button icon={ArrowsClockwise} variant="secondary" onClick={handleRotate}>
              Rotate all
            </Button>
            <Button icon={Plus} variant="primary" onClick={() => setShowAddForm(f => !f)}>
              Add proxy
            </Button>
          </div>
        }
      />

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-pulse">
          <Callout tone="accent" title="">
            {toast}
          </Callout>
        </div>
      )}

      {/* ── Add proxy form ─────────────────────────────────────────────── */}
      {showAddForm && (
        <Panel className="mt-3" title="Add proxy endpoint" meta="One proxy at a time" bleed>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="sm:col-span-2">
              <label className="mb-1 block font-mono text-[10.5px] uppercase tracking-wider text-ink-3">
                Address (host:port)
              </label>
              <input
                value={newProxyAddr}
                onChange={e => setNewProxyAddr(e.target.value)}
                placeholder="103.45.67.100:8080"
                className="h-8 w-full rounded-control bg-surface-inset px-3 text-[12.5px] text-ink ring-1 ring-line outline-none focus:ring-accent-line"
              />
            </div>
            <Select
              label="Provider"
              value={newProxyProvider}
              onChange={setNewProxyProvider}
              options={[
                { value: 'datacenter', label: 'Datacenter' },
                { value: 'residential', label: 'Residential' },
                { value: 'luminati', label: 'Luminati' },
                { value: 'oxylabs', label: 'Oxylabs' },
                { value: 'manual', label: 'Manual' },
              ]}
            />
            <Select
              label="Type"
              value={newProxyType}
              onChange={setNewProxyType}
              options={[
                { value: 'datacenter', label: 'Datacenter' },
                { value: 'residential', label: 'Residential' },
                { value: 'mobile', label: 'Mobile' },
              ]}
            />
            <Select
              label="Country"
              value={newProxyCountry}
              onChange={setNewProxyCountry}
              options={[
                { value: 'IN', label: 'India' },
                { value: 'US', label: 'USA' },
                { value: 'SG', label: 'Singapore' },
                { value: 'DE', label: 'Germany' },
                { value: 'GB', label: 'UK' },
              ]}
            />
          </div>
          <div className="mt-3 flex gap-2">
            <Button icon={Plus} variant="primary" onClick={handleAdd} disabled={!newProxyAddr.trim()}>
              Add to pool
            </Button>
            <Button variant="ghost" onClick={() => { setShowAddForm(false); setNewProxyAddr('') }}>
              Cancel
            </Button>
            <Button
              variant="ghost"
              icon={ListDashes}
              onClick={() => { setShowBulkAdd(f => !f); setShowAddForm(false) }}
            >
              Bulk add
            </Button>
          </div>

          {/* Bulk add */}
          {showBulkAdd && (
            <div className="mt-4 rounded-control bg-surface-inset p-3 ring-1 ring-line">
              <label className="mb-1 block font-mono text-[10.5px] uppercase tracking-wider text-ink-3">
                One address per line (host:port)
              </label>
              <textarea
                value={bulkAddText}
                onChange={e => setBulkAddText(e.target.value)}
                rows={5}
                placeholder="103.45.67.100:8080&#10;103.45.67.101:8080&#10;45.112.34.56:8000"
                className="w-full rounded-control bg-surface-2 px-3 py-2 font-mono text-[12px] text-ink ring-1 ring-line outline-none focus:ring-accent-line"
              />
              <div className="mt-2 flex gap-2">
                <Button variant="primary" onClick={handleBulkAdd} disabled={!bulkAddText.trim()}>
                  Add all
                </Button>
                <Button variant="ghost" onClick={() => setShowBulkAdd(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </Panel>
      )}

      {/* ── Stats row ───────────────────────────────────────────────────── */}
      {stats && (
        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-6">
          <StatTile label="Active" value={stats.active} icon={CheckCircle} tone="good" note={`${stats.proxyUsagePct}% of requests via proxy`} />
          <StatTile label="Cooldown" value={stats.cooldown} icon={Clock} tone="warn" note="Backing off from recent blocks" />
          <StatTile label="Expired" value={stats.expired} icon={XCircle} tone="critical" note="Lease expired, needs re-validation" />
          <StatTile label="Disabled" value={stats.disabled} icon={Prohibit} tone="neutral" note="Manually removed from rotation" />
          <StatTile label="Total assignments" value={stats.totalAssignments} icon={Plugs} tone="accent" note={`${stats.viaDirect} via direct egress`} />
          <StatTile label="Total blocks" value={stats.totalBlocks} icon={Prohibit} tone={stats.totalBlocks > 10 ? 'warn' : 'good'} note={`${stats.totalRequests} total requests`} />
        </div>
      )}

      {/* ── Strategy + controls ─────────────────────────────────────────── */}
      <Panel className="mt-3" icon={Gear} title="Rotation strategy" meta="How the pool picks a proxy for each outbound request" bleed>
        <div className="flex flex-wrap items-end gap-4">
          <Select
            label="Strategy"
            value={strategy}
            onChange={handleSetStrategy}
            options={STRATEGY_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
          />
          <div className="text-[11px] leading-snug text-ink-3 max-w-xs">
            {STRATEGY_OPTIONS.find(o => o.value === strategy)?.hint}
          </div>
          {stats?.lastRotationAt && (
            <div className="ml-auto text-right">
              <p className="text-[10px] uppercase tracking-wider text-ink-3">Last rotation</p>
              <p className="vm-num text-[12px] text-ink-2">
                {new Date(stats.lastRotationAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </p>
              {stats.lastRotationReason && (
                <p className="text-[10px] text-ink-3">{stats.lastRotationReason}</p>
              )}
            </div>
          )}
        </div>
      </Panel>

      {/* ── Proxy list ──────────────────────────────────────────────────── */}
      <Panel
        className="mt-3"
        icon={Globe}
        title="Proxy endpoints"
        meta={`${activeProxies.length} proxies in the pool`}
        bleed
        footnote="IP addresses are partially masked for security. Full addresses visible only to admins."
      >
        <DataTable
          rowKey={p => p.id}
          maxHeight={500}
          activeKey={selectedId ?? undefined}
          onRowClick={p => setSelectedId(p.id === selectedId ? null : p.id)}
          columns={[
            {
              key: 'status',
              header: '',
              width: '36px',
              cell: (p) => {
                const tone = STATUS_TONE[p.status] || 'neutral'
                const IconCmp = tone === 'good' ? CheckCircle : tone === 'warn' ? Clock : tone === 'critical' ? XCircle : Power
                return <IconCmp size={16} weight="duotone" className={cx(tone === 'good' ? 'text-good' : tone === 'warn' ? 'text-warn' : tone === 'critical' ? 'text-critical' : 'text-accent')} />
              },
            },
            {
              key: 'id',
              header: 'ID',
              width: '80px',
              cell: (p) => <span className="vm-num text-[11px] text-ink-2">{p.id}</span>,
            },
            {
              key: 'address',
              header: 'Address',
              cell: (p) => (
                <span className="flex items-center gap-2">
                  <code className="rounded-chip bg-surface-inset px-1.5 py-0.5 font-mono text-[11px] text-ink-2">
                    {maskAddress(p.address)}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Copy}
                    onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(p.address); toastAndEvent('Copied to clipboard', 'assign', p.id) }}
                    className="!h-6 !px-1.5"
                  />
                </span>
              ),
            },
            {
              key: 'provider',
              header: 'Provider',
              width: '110px',
              cell: (p) => (
                <span className="text-[11.5px] text-ink-2">{p.provider}</span>
              ),
            },
            {
              key: 'type',
              header: 'Type',
              width: '100px',
              cell: (p) => (
                <span className={cx('vm-num inline-block rounded-chip px-1.5 py-0.5 text-[10.5px] font-medium ring-1', TYPE_TONE[p.type] || TYPE_TONE.datacenter)}>
                  {p.type}
                </span>
              ),
            },
            {
              key: 'statusBadge',
              header: 'Status',
              width: '90px',
              cell: (p) => (
                <Badge tone={STATUS_TONE[p.status] || 'neutral'}>
                  {p.status}
                </Badge>
              ),
            },
            {
              key: 'requests',
              header: 'Requests',
              width: '80px',
              align: 'right',
              cell: (p) => (
                <span className="vm-num text-[11px] text-ink-2">
                  {p.totalRequests > 0 ? fmtInt(p.totalRequests) : '—'}
                </span>
              ),
            },
            {
              key: 'success',
              header: 'Success',
              width: '70px',
              align: 'right',
              cell: (p) => (
                <span className={cx('vm-num text-[11px]', p.successRate >= 0.9 ? 'text-good' : p.successRate >= 0.7 ? 'text-warn' : 'text-critical')}>
                  {p.totalRequests > 0 ? fmtPct(p.successRate * 100) : '—'}
                </span>
              ),
            },
            {
              key: 'latency',
              header: 'Avg latency',
              width: '80px',
              align: 'right',
              cell: (p) => (
                <span className="vm-num text-[11px] text-ink-2">
                  {p.avgLatencyMs > 0 ? `${Math.round(p.avgLatencyMs)}ms` : '—'}
                </span>
              ),
            },
            {
              key: 'blocks',
              header: 'Blocks',
              width: '60px',
              align: 'right',
              cell: (p) => (
                <span className={cx('vm-num text-[11px]', p.blockCount > 0 ? 'text-warn' : 'text-ink-3')}>
                  {p.blockCount}
                </span>
              ),
            },
            {
              key: 'lastUsed',
              header: 'Last used',
              width: '80px',
              align: 'right',
              cell: (p) => (
                <span className="text-[11px] text-ink-3" title={p.lastUsedAt || 'never'}>
                  {timeAgo(p.lastUsedAt)}
                </span>
              ),
            },
            {
              key: 'expires',
              header: 'Lease expires',
              width: '90px',
              align: 'right',
              cell: (p) => (
                <span className={cx('text-[11px]', p.expiresAt && new Date(p.expiresAt) < new Date() ? 'text-critical' : 'text-ink-3')}>
                  {p.expiresAt ? timeAgo(p.expiresAt) : '∞'}
                </span>
              ),
            },
            {
              key: 'actions',
              header: '',
              width: '100px',
              cell: (p) => (
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={p.isUsable ? Lightning : CheckCircle}
                    onClick={(e) => { e.stopPropagation(); handleTestProxy(p.id) }}
                    title="Test proxy"
                    className="!h-7 !w-7 !p-0"
                  />
                  {p.status === 'active' ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Prohibit}
                      onClick={(e) => { e.stopPropagation(); handleDisable(p.id) }}
                      title="Disable"
                      className="!h-7 !w-7 !p-0"
                    />
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Power}
                      onClick={(e) => { e.stopPropagation(); handleEnable(p.id) }}
                      title="Enable"
                      className="!h-7 !w-7 !p-0"
                    />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Trash}
                    onClick={(e) => { e.stopPropagation(); handleRemove(p.id) }}
                    title="Remove"
                    className="!h-7 !w-7 !p-0"
                  />
                </div>
              ),
            },
          ]}
          rows={activeProxies}
        />
      </Panel>

      {/* ── Detail panel ────────────────────────────────────────────────── */}
      {selectedProxy && (
        <Panel
          className="mt-3"
          icon={UserFocus}
          title={selectedProxy.address}
          meta={`${selectedProxy.id} · ${selectedProxy.provider} · ${selectedProxy.type}`}
          bleed
          actions={
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={Lightning}
                onClick={() => handleTestProxy(selectedProxy.id)}
              >
                Test
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={Prohibit}
                onClick={() => handleSimulateBlock(selectedProxy.id)}
              >
                Simulate block
              </Button>
              {selectedProxy.status === 'active' ? (
                <Button variant="secondary" size="sm" icon={Prohibit} onClick={() => handleDisable(selectedProxy.id)}>Disable</Button>
              ) : (
                <Button variant="primary" size="sm" icon={Power} onClick={() => handleEnable(selectedProxy.id)}>Enable</Button>
              )}
            </div>
          }
        >
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Identity */}
            <div>
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">Identity</p>
              <KeyValue
                dense
                rows={[
                  { k: 'Address', v: <code className="font-mono text-[11px]">{selectedProxy.address}</code> },
                  { k: 'Provider', v: selectedProxy.provider },
                  { k: 'Country', v: selectedProxy.country },
                  { k: 'Type', v: selectedProxy.type },
                  { k: 'ID', v: selectedProxy.id },
                  { k: 'Status', v: <Badge tone={STATUS_TONE[selectedProxy.status] || 'neutral'}>{selectedProxy.status}</Badge> },
                  { k: 'Usable', v: <Badge tone={selectedProxy.isUsable ? 'good' : 'critical'}>{selectedProxy.isUsable ? 'yes' : 'no'}</Badge> },
                ]}
              />
            </div>

            {/* Performance */}
            <div>
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">Performance</p>
              <KeyValue
                dense
                rows={[
                  { k: 'Total requests', v: fmtInt(selectedProxy.totalRequests) },
                  { k: 'Success', v: fmtInt(selectedProxy.successCount) },
                  { k: 'Failures', v: fmtInt(selectedProxy.failureCount) },
                  { k: 'Blocks', v: <span className={selectedProxy.blockCount > 0 ? 'text-warn' : ''}>{fmtInt(selectedProxy.blockCount)}</span> },
                  { k: 'Success rate', v: <span className={selectedProxy.successRate >= 0.9 ? 'text-good' : 'text-warn'}>
                    {fmtPct(selectedProxy.successRate * 100)}
                  </span> },
                  { k: 'Avg latency', v: selectedProxy.avgLatencyMs > 0 ? `${Math.round(selectedProxy.avgLatencyMs)}ms` : '—' },
                ]}
              />
              {selectedProxy.totalRequests > 0 && (
                <div className="mt-2">
                  <div className="flex justify-between text-[10px] text-ink-3">
                    <span>Success rate</span>
                    <span>{fmtPct(selectedProxy.successRate * 100)}</span>
                  </div>
                  <Meter
                    value={selectedProxy.successRate * 100}
                    max={100}
                    threshold={70}
                    tone={selectedProxy.successRate >= 0.9 ? 'good' : selectedProxy.successRate >= 0.7 ? 'warn' : 'critical'}
                    height={6}
                  />
                </div>
              )}
            </div>

            {/* Lifecycle */}
            <div>
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">Lifecycle</p>
              <KeyValue
                dense
                rows={[
                  { k: 'Added', v: timeAgo(selectedProxy.addedAt) },
                  { k: 'Last used', v: timeAgo(selectedProxy.lastUsedAt) },
                  { k: 'Last domain', v: selectedProxy.lastUsedDomain || '—' },
                  { k: 'Lease duration', v: `${selectedProxy.leaseDurationS}s` },
                  { k: 'Age', v: `${Math.round(selectedProxy.ageS / 60)}m` },
                  { k: 'Idle for', v: `${Math.round(selectedProxy.timeSinceUseS / 60)}m` },
                  { k: 'Expires', v: selectedProxy.expiresAt ? timeAgo(selectedProxy.expiresAt) : '∞' },
                  { k: 'Cooldown until', v: selectedProxy.cooldownUntil ? timeAgo(selectedProxy.cooldownUntil) : 'none' },
                ]}
              />
              {selectedProxy.failureReason && (
                <div className="mt-2">
                  <Callout tone="warn" title="Failure reason">
                    {selectedProxy.failureReason}
                  </Callout>
                </div>
              )}
            </div>
          </div>
        </Panel>
      )}

      {/* ── Domain bindings ─────────────────────────────────────────────── */}
      <Panel
        className="mt-3"
        icon={UserFocus}
        title="Domain bindings"
        meta={`${bindings.length} domains pinned to a specific proxy`}
        bleed
      >
        <DataTable
          rowKey={b => b.domain}
          maxHeight={300}
          columns={[
            {
              key: 'domain',
              header: 'Domain',
              cell: (b) => <span className="font-mono text-[11.5px] text-ink">{b.domain}</span>,
            },
            {
              key: 'proxyId',
              header: 'Proxy',
              width: '80px',
              cell: (b) => <span className="vm-num text-[11px] text-ink-2">{b.proxyId}</span>,
            },
            {
              key: 'address',
              header: 'Proxy address',
              cell: (b) => <code className="vm-num text-[10.5px] text-ink-3">{maskAddress(b.proxyAddress)}</code>,
            },
            {
              key: 'requests',
              header: 'Requests',
              width: '80px',
              align: 'right',
              cell: (b) => <span className="vm-num text-[11px] text-ink-2">{fmtInt(b.requestsServed)}</span>,
            },
            {
              key: 'boundAt',
              header: 'Bound at',
              width: '110px',
              align: 'right',
              cell: (b) => <span className="text-[11px] text-ink-3">{timeAgo(b.boundAt)}</span>,
            },
            {
              key: 'expires',
              header: 'Expires',
              width: '80px',
              align: 'right',
              cell: (b) => (
                <span className={cx('text-[11px]', b.isValid ? 'text-ink-3' : 'text-critical')}>
                  {b.isValid ? timeAgo(b.expiresAt) : 'expired'}
                </span>
              ),
            },
            {
              key: 'valid',
              header: '',
              width: '36px',
              cell: (b) => b.isValid
                ? <CheckCircle size={14} weight="duotone" className="text-good" />
                : <XCircle size={14} weight="duotone" className="text-critical" />,
            },
          ]}
          rows={bindings}
        />
      </Panel>

      {/* ── Usage breakdown by type ─────────────────────────────────────── */}
      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Panel icon={Globe} title="Proxy breakdown by type" meta="Composition of the active pool">
          <div className="space-y-2.5">
            {stats?.byType && Object.entries(stats.byType).map(([type, count]) => (
              <div key={type} className="flex items-center gap-3">
                <span className={cx('vm-num w-28 rounded-chip px-2 py-1 text-center text-[11px] font-medium ring-1', TYPE_TONE[type] || TYPE_TONE.datacenter)}>
                  {type}
                </span>
                <div className="flex-1">
                  <Meter value={count} max={stats.totalProxies || 1} tone={type === 'residential' ? 'good' : 'accent'} height={8} />
                </div>
                <span className="vm-num w-8 text-right text-[12px] text-ink-2">{count}</span>
              </div>
            ))}
            {(!stats?.byType || Object.keys(stats.byType).length === 0) && (
              <p className="text-[12px] text-ink-3">No proxies configured yet.</p>
            )}
          </div>
        </Panel>

        <Panel icon={Lightning} title="Traffic split" meta="Where outbound requests actually go">
          <KeyValue
            dense
            rows={[
              { k: 'Via proxy pool', v: <span className="text-good">{fmtInt(stats?.viaProxy || 0)} req</span> },
              { k: 'Via direct egress', v: <span className="text-warn">{fmtInt(stats?.viaDirect || 0)} req</span> },
              { k: 'Total assignments', v: fmtInt(stats?.totalAssignments || 0) },
              { k: 'Proxy hit rate', v: <span className="text-accent">{stats?.proxyUsagePct ?? 0}%</span> },
              { k: 'Blocks caught', v: <span className="text-critical">{fmtInt(stats?.totalBlocks || 0)}</span> },
            ]}
          />
          {stats && stats.totalAssignments > 0 && (
            <div className="mt-3">
              <Meter
                value={stats.viaProxy}
                max={stats.totalAssignments}
                tone="good"
                threshold={stats.totalAssignments * 0.8}
                thresholdLabel="80% target"
                height={10}
              />
            </div>
          )}
        </Panel>
      </div>

      {/* ── Event log ───────────────────────────────────────────────────── */}
      <Panel className="mt-3" icon={ArrowsClockwise} title="Pool event log" meta="Recent proxy pool events" bleed>
        {events.length === 0 ? (
          <p className="text-[12px] text-ink-3">No events yet. Add, rotate, or test a proxy to generate events.</p>
        ) : (
          <div className="space-y-1">
            {events.slice(0, 20).map(e => (
              <div key={e.id} className="flex items-start gap-3 rounded-control bg-surface-2 px-3 py-2 ring-1 ring-line/60">
                <span className={cx('mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-[5px] ring-1',
                  e.type === 'rotation' ? 'bg-accent-soft text-accent ring-accent-line' :
                  e.type === 'block' ? 'bg-critical-soft text-critical ring-critical-line' :
                  e.type === 'add' ? 'bg-good-soft text-good ring-good/40' :
                  e.type === 'remove' || e.type === 'disable' ? 'bg-serious-soft text-serious ring-serious/40' :
                  e.type === 'enable' ? 'bg-good-soft text-good ring-good/40' :
                  'bg-surface-3 text-ink-2 ring-line',
                )}>
                  {e.type === 'rotation' ? <ArrowsClockwise size={12} weight="bold" /> :
                   e.type === 'block' ? <Prohibit size={12} weight="bold" /> :
                   e.type === 'add' ? <Plus size={12} weight="bold" /> :
                   e.type === 'remove' ? <Trash size={12} weight="bold" /> :
                   e.type === 'enable' ? <Power size={12} weight="bold" /> :
                   <Lightning size={12} weight="bold" />}
                </span>
                <div className="min-w-0 flex-1">
                  <span className="text-[12px] text-ink">{e.message}</span>
                  {e.detail && <span className="ml-2 text-[11px] text-ink-3">— {e.detail}</span>}
                </div>
                <span className="vm-num shrink-0 text-[10px] text-ink-3">{timeAgo(e.at)}</span>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  )
}
