# NetworkMap (`/network-map`)

## What It Does
An interactive canvas-based network topology map that renders devices as nodes and connections as edges, supporting pan, zoom, hover, and click-to-inspect.

## Data Flow
- **HTTP API** — `GET /api/network/topology` fetches nodes (routers, servers, endpoints) and edges (links with bandwidth/latency). Data stored in `nodes` and `edges` state.
- **WebSocketContext** — listens for `topology_update` events; appends or mutates nodes/edges in place.
- **Canvas renderer** — custom 2D canvas draw loop (no library) iterates over `nodes` and `edges` arrays every animation frame; positions are computed from a force-layout simulation (implemented in-file).
- **Local interaction state** — `pan`, `zoom`, `hoveredNode`, `selectedNode` — all client-side view transforms.
- **Device detail panel** — rendered when a node is clicked; shows node metadata (IP, OS, status, open ports) from the node object.

## What Is Real
- Node/edge datasets come from the API (or WebSocket push updates).
- Device types, IP addresses, and status flags reflect real backend records.
- Force-layout simulation is a real physics-based positioning algorithm (reputation + repulsion forces).
- Pan, zoom, and node hover/click interactions are genuine canvas interactions.
- Bandwidth and latency values on edges are from the API.
- The detail side panel renders real node properties on selection.

## What Is Fake
| Aspect | How |
|---|---|
| Canvas rendering | Custom 2D canvas, not Three.js 3D — misleadingly labelled "3D Network Map" in some places. |
| Force-simulation seed positions | First-run layout randomises positions before settling; prior to settle the visual is pseudo-random. |
| Node icons | Simple emoji/unicode glyphs (`🖥️`, `☁️`, `📱`) hardcoded per device type. |
| "Live" badge on map | Static indicator; actual topology change rate depends on WebSocket message frequency. |
| Fallback topology | If API fails, a small hardcoded default graph is rendered so the canvas is never blank. |

## Verdict
~60% real. The data (nodes, edges, device metadata) is genuinely API-driven, and the force-layout algorithm is real. However, the visual presentation is 2D canvas rather than the implied 3D, the fallback topology is hardcoded, and iconography is static emoji — bringing the overall real percentage down.
