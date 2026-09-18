# Network Map (`/network-map`)

## What It Does
Force-directed graph visualization. Shows network nodes (internal/external), connections with color-coded status (normal/suspicious/attack), attack path overlays, node drift animation, traffic volume labels, threat highlighting.

## Data Flow
- All data generated client-side in `NetworkMap.tsx`
- Uses D3 force simulation (`d3-force`)
- Node generation: random IPs from internal pool + external pool
- Edge generation: random connections with `status`, `packets`, `bytes`, `protocol`
- Attack paths: random source→target with hop sequences
- No backend API calls at all

## What Is Real
- Nothing from the backend. Zero API calls.
- Force simulation math is real (D3 library), but applied to fake data

## What Is Fake
| Aspect | How |
|--------|-----|
| Nodes | Randomly generated IPs (10.x, 172.16.x, 192.168.x internal; random external) |
| Node labels | Predefined names: "Gateway", "Firewall", "DB-Server", "Web-01", etc. |
| Edges | Random connections between nodes with random packet counts |
| Edge status | Weighted random: mostly `normal`, some `suspicious`, few `attack` |
| Attack paths | Generated with random severity, random hop sequences |
| Traffic labels | Random byte/packet values |
| Threat highlighting | Purely cosmetic — random nodes get highlighted |

## Verdict
**0% real data.** Entirely procedural visualization. Nodes, edges, and attack paths are all generated client-side. No backend connection. This is a visual concept demo only.
