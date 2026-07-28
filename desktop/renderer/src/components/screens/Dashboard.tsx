import { db, latestMetric, branchOfDevice, devicesOfBranch } from '@/lib/mock';
import { buildMapView } from '@/lib/mapView';
import { StatBox, Panel, PageHeader, Badge, Meter } from '@/components/ui/kit';
import WorldMap from '@/components/ui/WorldMap';
import SplitPane from '@/components/ui/SplitPane';
import { L, pct } from '@/lib/fmt';
import { useNav } from '@/components/layout/App';

export default function Dashboard() {
  const { go } = useNav();
  const { sites, arcs } = buildMapView();
  const online = db.devices.filter(d => d.status === 'online');
  const agentsOn = db.agents.filter(a => a.status === 'online').length;
  const running = db.services.filter(s => s.status === 'running').length;
  const failed = db.services.filter(s => s.status === 'failed').length;

  const top = [...online]
    .map(d => ({ d, m: latestMetric(d.id) }))
    .filter(x => x.m)
    .sort((a, b) => b.m!.cpuPercent - a.m!.cpuPercent)
    .slice(0, 8);

  return (
    <div className="col fill">
      <PageHeader title="Dashboard" subtitle="Visão geral da frota e da operação" />
      <div className="fill col" style={{ padding: 12, minHeight: 0 }}>
        <div className="row" style={{ gap: 10, marginBottom: 12, flexShrink: 0 }}>
          <StatBox label="Dispositivos online" value={`${online.length} / ${db.devices.length}`} meta={`${db.devices.length - online.length} offline`} tone="green" />
          <StatBox label="Agentes conectados" value={agentsOn} tone="red" />
          <StatBox label="Serviços ativos" value={`${running} / ${db.services.length}`} meta={`${failed} com falha`} tone="blue" />
          <StatBox label="Alertas críticos" value={failed} meta="requer atenção" tone={failed ? 'red' : 'green'} />
        </div>

        {/* Mapa e grids separados por divisória arrastável: encolha um para crescer o outro */}
        <SplitPane id="dashboard" direction="vertical" initial={420} min={140}
          first={
            <div className="col" style={{ flex: 1, minHeight: 0, border: '1px solid var(--b2)', background: 'var(--panel)' }}>
              <div className="sec-hdr" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>MALHA GLOBAL — {sites.length} SITES</span>
                <span style={{ color: 'var(--cyan)', cursor: 'pointer', fontSize: 10 }} onClick={() => go('map')}>abrir mapa completo →</span>
              </div>
              <div style={{ flex: 1, minHeight: 0 }}><WorldMap sites={sites} arcs={arcs} height="100%" /></div>
            </div>
          }
          second={
        <div className="row" style={{ gap: 12, alignItems: 'stretch', flex: 1, minHeight: 0, paddingTop: 12 }}>
          <Panel title="DISPOSITIVOS COM MAIOR CARGA (CPU)" style={{ flex: 1 }}>
            <table className="zk-table">
              <thead><tr><th>Host</th><th>Filial</th><th>CPU</th><th>RAM</th><th>Status</th></tr></thead>
              <tbody>
                {top.map(({ d, m }) => {
                  const [lbl, tone] = L.device(d.status);
                  return (
                    <tr key={d.id} style={{ cursor: 'pointer' }} onClick={() => go('device', d.id)}>
                      <td className="mono" style={{ color: 'var(--cyan)' }}>{d.hostname}</td>
                      <td>{branchOfDevice(d.id)?.name}</td>
                      <td style={{ width: 130 }}><Meter value={m!.cpuPercent} /></td>
                      <td className="mono">{pct(m!.ramPercent)}</td>
                      <td><Badge tone={tone} dot>{lbl}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Panel>

          <Panel title="FILIAIS" style={{ width: 380 }}>
            <table className="zk-table">
              <thead><tr><th>Filial</th><th>Cidade</th><th>Online</th></tr></thead>
              <tbody>
                {db.branches.map(b => {
                  const devs = devicesOfBranch(b.id);
                  const on = devs.filter(d => d.status === 'online').length;
                  return (
                    <tr key={b.id} style={{ cursor: 'pointer' }} onClick={() => go('branch', b.id)}>
                      <td>{b.name}{b.headquarters && <span style={{ color: 'var(--tx3)' }}> (Matriz)</span>}</td>
                      <td>{b.address.city}</td>
                      <td className="mono"><span style={{ color: on === devs.length ? 'var(--green)' : 'var(--orange)' }}>{on}/{devs.length}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Panel>
        </div>
          } />
      </div>
    </div>
  );
}
