// Deriva a visão de mapa (sites + enlaces) a partir do db. Compartilhado entre o
// Dashboard e a tela de Mapa global para não duplicar a regra de saúde do site.
import { db, devicesOfBranch, branchById, networkById } from './mock';

export interface ViewSite { lat: number; lon: number; label: string; sub: string; status: 'online' | 'degraded' | 'offline' }
export interface ViewArc { a: [number, number]; b: [number, number]; status: 'up' | 'degraded' | 'down' }

/** Saúde do site pela proporção de dispositivos online. */
export function buildMapView(): { sites: ViewSite[]; arcs: ViewArc[] } {
  const sites: ViewSite[] = db.branches.map(b => {
    const devs = devicesOfBranch(b.id);
    const on = devs.filter(d => d.status === 'online').length;
    const status: ViewSite['status'] = devs.length === 0 ? 'offline' : on === devs.length ? 'online' : on * 2 < devs.length ? 'offline' : 'degraded';
    return { lat: b.address.latitude, lon: b.address.longitude, label: b.name, sub: `${b.address.city} · ${devs.length} dispositivos`, status };
  });

  const arcs: ViewArc[] = db.networkLinks.map(l => {
    const ba = branchById(networkById(l.networkAId)?.branchId ?? '');
    const bb = branchById(networkById(l.networkBId)?.branchId ?? '');
    return ba && bb
      ? { a: [ba.address.latitude, ba.address.longitude] as [number, number], b: [bb.address.latitude, bb.address.longitude] as [number, number], status: l.status }
      : null;
  }).filter(Boolean) as ViewArc[];

  return { sites, arcs };
}
