import { useState, useMemo } from 'react';
import { devicesOfBranch, sectorsOfBranch, employeesOfBranch, employeeById } from '@/lib/mock';
import { useDb, create, update, remove, genId, catalogItems } from '@/lib/store';
import { buildMapView } from '@/lib/mapView';
import type { Branch } from '@/lib/types';
import { PageHeader, Badge } from '@/components/ui/kit';
import EditGrid, { type GridCol } from '@/components/ui/EditGrid';
import WorldMap from '@/components/ui/WorldMap';
import { useNav } from '@/components/layout/App';

const UF = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

export default function Branches() {
  const db = useDb();
  const { go } = useNav();
  const [q, setQ] = useState('');
  const [type, setType] = useState('all');
  const { sites, arcs } = buildMapView();

  const rows = useMemo(() => db.branches.filter(b => {
    if (type !== 'all' && b.type !== type) return false;
    if (q && !(`${b.name} ${b.address.city}`.toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  }), [q, type, db.branches]);

  // acessores para os campos aninhados de endereço
  const addr = (k: keyof Branch['address']) => ({
    get: (r: Branch) => r.address?.[k],
    set: (v: any, d: Partial<Branch>) => ({ address: { ...(d.address ?? {} as Branch['address']), [k]: v } }),
  });

  const cols: GridCol<Branch>[] = [
    { key: 'name', label: 'Filial', required: true, placeholder: 'Loja Shopping' },
    { key: 'code', label: 'Código', width: 90, placeholder: 'LOJ42' },
    { key: 'type', label: 'Tipo', width: 150, type: 'select', options: catalogItems('branchTypes').map(t => ({ value: t.key, label: t.label })) },
    { key: 'city', label: 'Cidade', width: 150, ...addr('city'), placeholder: 'São Paulo' },
    { key: 'state', label: 'UF', width: 70, type: 'select', options: UF.map(u => ({ value: u, label: u })), ...addr('state') },
    { key: 'phone', label: 'Telefone', width: 140 },
    { key: 'devices', label: 'Disp.', width: 70, editable: false, render: b => { const d = devicesOfBranch(b.id); const on = d.filter(x => x.status === 'online').length; return <span className="mono" style={{ color: on === d.length ? 'var(--green)' : 'var(--orange)' }}>{on}/{d.length}</span>; } },
    { key: 'team', label: 'Equipe', width: 70, editable: false, render: b => <span className="mono">{employeesOfBranch(b.id).length}</span> },
    { key: 'manager', label: 'Gerente', width: 150, editable: false, render: b => <span style={{ color: 'var(--tx2)' }}>{employeeById(b.managerEmployeeId)?.fullName ?? '—'}</span> },
    { key: 'headquarters', label: 'Matriz', width: 70, type: 'toggle' },
    { key: 'active', label: 'Ativa', width: 70, type: 'toggle' },
  ];

  return (
    <div className="col fill">
      <PageHeader title="Filiais" subtitle={`${db.branches.length} unidades — edição direta no grid`} />
      <div className="fill scroll-y" style={{ padding: 12 }}>
        <div className="col" style={{ border: '1px solid var(--b2)', background: 'var(--panel)', marginBottom: 12 }}>
          <div className="sec-hdr">DISTRIBUIÇÃO GEOGRÁFICA</div>
          <div style={{ height: 300 }}><WorldMap sites={sites} arcs={arcs} height="100%" /></div>
        </div>

        <div className="row" style={{ gap: 6, marginBottom: 8 }}>
          <input className="zk-input" style={{ width: 220 }} placeholder="Buscar filial, cidade…" value={q} onChange={e => setQ(e.target.value)} />
          <select className="zk-select" style={{ width: 180 }} value={type} onChange={e => setType(e.target.value)}>
            <option value="all">Todos os tipos</option>
            {catalogItems('branchTypes').map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
          <span style={{ alignSelf: 'center', fontSize: 11, color: 'var(--tx3)' }}>clique no nome para abrir a filial</span>
        </div>

        <EditGrid<Branch>
          rows={rows} cols={cols} newLabel="Nova filial"
          makeEmpty={() => ({ name: '', code: '', type: 'store', phone: '', email: '', managerEmployeeId: null, headquarters: false, active: true, address: { street: '', number: '', district: '', city: '', state: 'SP', countryCode: 'BR', postalCode: '', latitude: -23.55, longitude: -46.63 } })}
          validate={d => !d.name?.trim() ? 'Informe o nome da filial' : !d.code?.trim() ? 'Informe o código' : !d.address?.city?.trim() ? 'Informe a cidade' : null}
          onCreate={d => create('branches', { ...d, id: genId() } as Branch)}
          onUpdate={(id, patch) => update('branches', id, patch)}
          onDelete={row => remove('branches', row.id)}
        />

        <div className="row" style={{ gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          {rows.map(b => (
            <Badge key={b.id} tone={b.headquarters ? 'red' : 'cyan'} dot>
              <span style={{ cursor: 'pointer' }} onClick={() => go('branch', b.id)}>{b.name}</span>
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
