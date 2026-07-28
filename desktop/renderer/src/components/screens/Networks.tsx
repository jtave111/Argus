import { useState, useMemo } from 'react';
import { devicesOfNetwork } from '@/lib/mock';
import { useDb, create, update, remove, genId, catalogItems } from '@/lib/store';
import type { Network } from '@/lib/types';
import { PageHeader, Badge } from '@/components/ui/kit';
import EditGrid, { type GridCol } from '@/components/ui/EditGrid';
import type { Tone } from '@/lib/fmt';

const ZONE: Record<string, Tone> = { dmz: 'orange', trusted: 'green', guest: 'blue', untrusted: 'red' };

export default function Networks() {
  const db = useDb();
  const [q, setQ] = useState('');
  const [branch, setBranch] = useState('all');

  const rows = useMemo(() => db.networks.filter(n => {
    if (branch !== 'all' && n.branchId !== branch) return false;
    if (q && !(`${n.name} ${n.subnet}`.toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  }), [q, branch, db.networks]);

  const cols: GridCol<Network>[] = [
    { key: 'name', label: 'Nome', required: true, placeholder: 'Matriz — LAN' },
    { key: 'branchId', label: 'Filial', width: 160, type: 'select', options: db.branches.map(b => ({ value: b.id, label: b.name })) },
    { key: 'type', label: 'Tipo', width: 100, type: 'select', options: catalogItems('networkTypes').map(t => ({ value: t.key, label: t.label })) },
    { key: 'subnet', label: 'Sub-rede', width: 130, placeholder: '10.0.0.0/24' },
    { key: 'gateway', label: 'Gateway', width: 120, placeholder: '10.0.0.1' },
    { key: 'vlanId', label: 'VLAN', width: 70, type: 'number' },
    { key: 'securityZone', label: 'Zona', width: 110, type: 'select', options: [['trusted', 'Confiável'], ['dmz', 'DMZ'], ['untrusted', 'Não confiável'], ['guest', 'Convidados']].map(([v, l]) => ({ value: v, label: l })), render: n => <Badge tone={ZONE[n.securityZone] ?? 'dim'}>{n.securityZone}</Badge> },
    { key: 'devices', label: 'Disp.', width: 60, editable: false, render: n => <span className="mono">{devicesOfNetwork(n.id).length}</span> },
  ];

  return (
    <div className="col fill">
      <PageHeader title="Redes" subtitle={`${db.networks.length} redes · ${db.networkLinks.length} enlaces VPN · edição direta no grid`} />
      <div className="fill scroll-y" style={{ padding: 12 }}>
        <div className="row" style={{ gap: 6, marginBottom: 8 }}>
          <input className="zk-input" style={{ width: 220 }} placeholder="Buscar rede, subnet…" value={q} onChange={e => setQ(e.target.value)} />
          <select className="zk-select" style={{ width: 180 }} value={branch} onChange={e => setBranch(e.target.value)}>
            <option value="all">Todas as filiais</option>{db.branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <EditGrid<Network>
          rows={rows} cols={cols} newLabel="Nova rede"
          makeEmpty={() => ({ name: '', branchId: branch !== 'all' ? branch : db.branches[0]?.id ?? '', sectorId: '', type: 'lan', subnet: '', gateway: '', vlanId: 0, domain: '', publicIp: '', ispProvider: '', bandwidthMbps: 100, securityZone: 'trusted' })}
          validate={d => !d.name?.trim() ? 'Informe o nome' : !/^\d{1,3}(\.\d{1,3}){3}\/\d{1,2}$/.test(d.subnet ?? '') ? 'Sub-rede em CIDR: 10.0.0.0/24' : null}
          onCreate={d => create('networks', { ...d, id: genId() } as Network)}
          onUpdate={(id, patch) => update('networks', id, patch)}
          onDelete={row => remove('networks', row.id)}
        />
      </div>
    </div>
  );
}
