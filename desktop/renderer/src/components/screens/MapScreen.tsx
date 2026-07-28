import { db } from '@/lib/mock';
import { buildMapView } from '@/lib/mapView';
import { PageHeader, StatBox, Badge } from '@/components/ui/kit';
import WorldMap from '@/components/ui/WorldMap';

export default function MapScreen() {
  const { sites, arcs } = buildMapView();

  const online = db.devices.filter(d => d.status === 'online').length;
  const degraded = db.networkLinks.filter(l => l.status !== 'up').length;

  return (
    <div className="col fill">
      <PageHeader title="Mapa de operações" subtitle="Sites, enlaces e saúde da malha em tempo real" />
      <div className="fill col" style={{ padding: 12, minHeight: 0 }}>
        <div className="row" style={{ gap: 10, marginBottom: 12 }}>
          <StatBox label="Sites" value={db.branches.length} tone="red" />
          <StatBox label="Enlaces" value={db.networkLinks.length} meta={`${degraded} degradados`} tone="blue" />
          <StatBox label="Dispositivos online" value={`${online}/${db.devices.length}`} tone="green" />
          <StatBox label="Redes" value={db.networks.length} tone="purple" />
        </div>
        <div className="col" style={{ flex: 1, minHeight: 0, border: '1px solid var(--b2)', background: 'var(--panel)' }}>
          <div className="sec-hdr">MALHA GLOBAL</div>
          <div style={{ flex: 1, minHeight: 0 }}><WorldMap sites={sites} arcs={arcs} height="100%" /></div>
        </div>
        <div className="row" style={{ gap: 16, padding: '8px 4px', fontSize: 11, color: 'var(--tx2)' }}>
          <Badge tone="green" dot>Site saudável</Badge>
          <Badge tone="orange" dot>Parcialmente offline</Badge>
          <Badge tone="red" dot>Crítico</Badge>
          <Badge tone="red">Enlace VPN</Badge>
        </div>
      </div>
    </div>
  );
}
