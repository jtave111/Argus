import { useState, useMemo } from 'react';
import { db, deviceById } from '@/lib/mock';
import { PageHeader, Badge, StatBox } from '@/components/ui/kit';
import { L, relative, dateTime } from '@/lib/fmt';
import { useNav } from '@/components/layout/App';

export default function Agents() {
  const { go } = useNav();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');

  const counts = {
    online: db.agents.filter(a => a.status === 'online').length,
    degraded: db.agents.filter(a => a.status === 'degraded').length,
    offline: db.agents.filter(a => a.status === 'offline').length,
    disabled: db.agents.filter(a => !a.enabled).length,
  };

  const rows = useMemo(() => db.agents.filter(a => {
    if (status !== 'all' && a.status !== status) return false;
    if (q && !(deviceById(a.deviceId)?.hostname ?? '').toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [q, status]);

  return (
    <div className="col fill">
      <PageHeader title="Agentes" subtitle="Software instalado nos dispositivos (implant gRPC)" />
      <div className="fill scroll-y" style={{ padding: 12 }}>
        <div className="row" style={{ gap: 10, marginBottom: 12 }}>
          <StatBox label="Conectados" value={counts.online} tone="green" />
          <StatBox label="Degradados" value={counts.degraded} tone="orange" />
          <StatBox label="Desconectados" value={counts.offline} tone="red" />
          <StatBox label="Desabilitados" value={counts.disabled} tone="dim" />
        </div>
        <div className="row" style={{ gap: 6, marginBottom: 8 }}>
          <input className="zk-input" style={{ width: 240 }} placeholder="Buscar por host…" value={q} onChange={e => setQ(e.target.value)} />
          <select className="zk-select" style={{ width: 160 }} value={status} onChange={e => setStatus(e.target.value)}>
            <option value="all">Todos os status</option><option value="online">Conectado</option><option value="degraded">Degradado</option><option value="offline">Desconectado</option><option value="updating">Atualizando</option>
          </select>
        </div>
        <div style={{ border: '1px solid var(--b2)' }}>
          <table className="zk-table">
            <thead><tr><th>Host</th><th>Status</th><th>Versão</th><th>Habilitado</th><th>Último contato</th><th>Conectado desde</th><th>IP</th><th>Protocolo</th></tr></thead>
            <tbody>
              {rows.map(a => {
                const [lbl, tone] = L.agent(a.status);
                const host = deviceById(a.deviceId)?.hostname ?? '—';
                return (
                  <tr key={a.id} style={{ cursor: 'pointer' }} onClick={() => go('device', a.deviceId)}>
                    <td className="mono" style={{ color: 'var(--cyan)' }}>{host}</td>
                    <td><Badge tone={tone} dot>{lbl}</Badge></td>
                    <td>{a.agentVersion}{a.agentVersion.includes('rc') && <Badge tone="orange">RC</Badge>}</td>
                    <td><Badge tone={a.enabled ? 'green' : 'dim'}>{a.enabled ? 'sim' : 'não'}</Badge></td>
                    <td style={{ color: 'var(--tx2)' }}>{relative(a.lastSeen)}</td>
                    <td style={{ color: 'var(--tx2)' }}>{dateTime(a.connectedSince)}</td>
                    <td className="cell-ip mono">{a.lastIp}</td>
                    <td className="mono" style={{ color: 'var(--tx2)' }}>{a.protocolVersion}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
