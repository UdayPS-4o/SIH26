import React from 'react'

/* ═══════════════════════════════════════════════════════════════
   DEVICE GRID — Connected devices panel
   ═══════════════════════════════════════════════════════════════ */

const DEVICES = [
  { id: 1, name: 'FW-Primary', type: 'firewall', ip: '10.0.0.1', status: 'online', traffic: '1.2 Gbps', lastSeen: 'now' },
  { id: 2, name: 'Core-Switch-01', type: 'switch', ip: '10.0.0.2', status: 'online', traffic: '4.7 Gbps', lastSeen: 'now' },
  { id: 3, name: 'App-Server-01', type: 'server', ip: '10.0.1.10', status: 'online', traffic: '890 Mbps', lastSeen: 'now' },
  { id: 4, name: 'DB-Server-01', type: 'database', ip: '10.0.1.20', status: 'online', traffic: '2.1 Gbps', lastSeen: 'now' },
  { id: 5, name: 'IoT-Gateway-North', type: 'gateway', ip: '10.0.2.1', status: 'warning', traffic: '45 Mbps', lastSeen: '2s ago' },
  { id: 6, name: 'WS-Engineering-12', type: 'workstation', ip: '10.0.3.12', status: 'online', traffic: '12 Mbps', lastSeen: 'now' },
  { id: 7, name: 'Sensor-Hub-01', type: 'sensor', ip: '10.0.4.1', status: 'online', traffic: '2 Mbps', lastSeen: 'now' },
  { id: 8, name: 'WS-Research-03', type: 'workstation', ip: '10.0.3.3', status: 'offline', traffic: '0 Mbps', lastSeen: '4m ago' },
  { id: 9, name: 'IDS-Sensor-East', type: 'sensor', ip: '10.0.4.15', status: 'online', traffic: '890 Mbps', lastSeen: 'now' },
  { id: 10, name: 'Mail-Gateway', type: 'gateway', ip: '10.0.2.10', status: 'online', traffic: '340 Mbps', lastSeen: 'now' },
  { id: 11, name: 'Backup-Server', type: 'server', ip: '10.0.1.50', status: 'online', traffic: '1.8 Gbps', lastSeen: 'now' },
  { id: 12, name: 'Dev-Workstation-07', type: 'workstation', ip: '10.0.3.7', status: 'warning', traffic: '5 Mbps', lastSeen: '15s ago' },
]

const DEVICE_ICONS = {
  firewall: '🔒',
  switch: '🔀',
  server: '🖥️',
  database: '🗄️',
  gateway: '🌐',
  workstation: '💻',
  sensor: '📡',
}

const STATUS_COLORS = {
  online: { bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.3)', text: '#10b981' },
  warning: { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)', text: '#f59e0b' },
  offline: { bg: 'rgba(100, 116, 139, 0.1)', border: 'rgba(100, 116, 139, 0.3)', text: '#64748b' },
}

export default function DeviceGrid() {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = DEVICES.filter(d => {
    if (filter !== 'all' && d.status !== filter) return false
    if (search && !d.name.toLowerCase().includes(search.toLowerCase()) && !d.ip.includes(search)) return false
    return true
  })

  return (
    <div className="ek-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-ek-text-primary">Connected Devices</h3>
          <p className="text-xs text-ek-text-muted mt-0.5">
            {DEVICES.filter(d => d.status === 'online').length} online · {DEVICES.filter(d => d.status === 'warning').length} warning · {DEVICES.filter(d => d.status === 'offline').length} offline
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center gap-1 p-1 bg-ek-bg-elevated rounded-lg border border-ek-border">
          {['all', 'online', 'warning', 'offline'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                filter === f
                  ? 'bg-ek-accent text-white shadow-glow-accent'
                  : 'text-ek-text-muted hover:text-ek-text-primary'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex-1 flex items-center gap-2 px-3 py-1.5 bg-ek-bg-elevated border border-ek-border rounded-lg">
          <svg className="w-3.5 h-3.5 text-ek-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search devices..."
            className="bg-transparent text-xs text-ek-text-primary placeholder:text-ek-text-muted outline-none flex-1"
          />
        </div>
      </div>

      {/* Device grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(device => {
          const colors = STATUS_COLORS[device.status]
          return (
            <div
              key={device.id}
              className="group p-3 rounded-lg border bg-ek-bg-elevated hover:shadow-glow-accent transition-all cursor-pointer"
              style={{ borderColor: colors.border }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{DEVICE_ICONS[device.type] || '📦'}</span>
                  <div>
                    <div className="text-xs font-semibold text-ek-text-primary">{device.name}</div>
                    <div className="text-[10px] font-mono text-ek-text-muted">{device.ip}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background: colors.text,
                      boxShadow: device.status === 'online' ? `0 0 6px ${colors.text}` : 'none',
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-ek-text-muted">{device.traffic}</span>
                <span
                  className="font-mono font-semibold"
                  style={{ color: colors.text }}
                >
                  {device.status}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
