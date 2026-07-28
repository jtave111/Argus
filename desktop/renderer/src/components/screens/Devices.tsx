import { useState, useMemo } from 'react';
import { db, agentOfDevice, interfacesOfDevice, latestMetric, branchOfDevice } from '@/lib/mock';
import { PageHeader, Badge, Meter } from '@/components/ui/kit';
import { L } from '@/lib/fmt';
import { useNav } from '@/components/layout/App';

export default function Devices() {
  const { go } = useNav();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [branch, setBranch] = useState('all');

  const rows = useMemo(() => db.devices.filter(d => {
    if (status !== 'all' && d.status !== status) return false;
    if (branch !== 'all' && branchOfDevice(d.id)?.id !== branch) return false;
    if (q) {
      const ip = interfacesOfDevice(d.id).find(i => i.primary)?.ipv4Address ?? '';
      const hay = `${d.hostname} ${d.distro} ${ip} ${branchOfDevice(d.id)?.name ?? ''}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  }), [q, status, branch]);

  return (
    <div className="col fill">
      <PageHeader title="Dispositivos" subtitle={`${rows.length} de ${db.devices.length} máquinas monitoradas`} />
      <div className="row" style={{ gap: 6, padding: '8px 12px', borderBottom: '1px solid var(--b1)' }}>
        <input className="zk-input" style={{ width: 240 }} placeholder="Buscar host, IP, SO…" value={q} onChange={e => setQ(e.target.value)} />
        <select className="zk-select" style={{ width: 150 }} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="all">Todos os status</option><option value="online">Online</option><option value="offline">Offline</option><option value="maintenance">Manutenção</option>
        </select>
        <select className="zk-select" style={{ width: 180 }} value={branch} onChange={e => setBranch(e.target.value)}>
          <option value="all">Todas as filiais</option>
          {db.branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>
      <div className="fill scroll-y">
        <table className="zk-table">
          <thead><tr><th>Host</th><th>Status</th><th>SO</th><th>Filial</th><th>IP principal</th><th>Agente</th><th>CPU</th><th>Criticidade</th></tr></thead>
          <tbody>
            {rows.map(d => {
              const [lbl, tone] = L.device(d.status);
              const ag = agentOfDevice(d.id);
              const m = latestMetric(d.id);
              const ip = interfacesOfDevice(d.id).find(i => i.primary)?.ipv4Address ?? '—';
              const [cl, ct] = L.criticality(d.criticality);
              return (
                <tr key={d.id} style={{ cursor: 'pointer' }} onClick={() => go('device', d.id)}>
                  <td className="mono" style={{ color: 'var(--cyan)' }}>{d.hostname}</td>
                  <td><Badge tone={tone} dot>{lbl}</Badge></td>
                  <td>{d.distro}</td>
                  <td>{branchOfDevice(d.id)?.name ?? '—'}</td>
                  <td className="cell-ip mono">{ip}</td>
                  <td>{ag ? <Badge tone={L.agent(ag.status)[1]}>{ag.agentVersion}</Badge> : '—'}</td>
                  <td style={{ width: 120 }}>{m ? <Meter value={m.cpuPercent} /> : '—'}</td>
                  <td><Badge tone={ct}>{cl}</Badge></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
