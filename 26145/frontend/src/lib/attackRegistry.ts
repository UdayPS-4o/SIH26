// Shared registry of currently active attacks (injected from Attack Lab).
// Allows cross-page correlation: LiveThreats can tell if an alert
// was caused by a launched attack ("INJECTED") or measured from passive traffic ("MEASURED").

import { Alert } from '../types';

type Listener = () => void;
const listeners = new Set<Listener>();
const activeAttacks = new Map<string, { threatType: string; launchedAt: number }>();

// Maps attack IDs to the threat types they produce in alerts
export const ATTACK_TO_THREAT: Record<string, string> = {
  syn_flood: 'ddos',
  udp_flood: 'ddos',
  c2_beacon: 'beaconing',
  dga_domain: 'dga',
  dns_tunnel: 'dns_tunnel',
  port_scan: 'port_scan',
  data_exfil: 'exfiltration',
  tls_beacon: 'tls_anomaly',
};

export const registerActiveAttack = (attackId: string, threatType: string) => {
  activeAttacks.set(attackId, { threatType, launchedAt: Date.now() });
  listeners.forEach(l => l());
};

export const removeActiveAttack = (attackId: string) => {
  activeAttacks.delete(attackId);
  listeners.forEach(l => l());
};

export const clearActiveAttacksRegistry = () => {
  activeAttacks.clear();
  listeners.forEach(l => l());
};

export const subscribeToAttackChanges = (listener: Listener) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};

export const getActiveAttackIds = (): string[] => Array.from(activeAttacks.keys());

export const isThreatTypeInjected = (threatType: string): boolean => {
  return Array.from(activeAttacks.values()).some(
    v => v.threatType.toLowerCase() === threatType.toLowerCase()
  );
};

export const getActiveThreatTypes = (): string[] => {
  const types = new Set<string>();
  activeAttacks.forEach(v => types.add(v.threatType));
  return Array.from(types);
};
