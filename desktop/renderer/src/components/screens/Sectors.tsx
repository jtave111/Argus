import { useState, useMemo } from 'react';
import { useDb, create, update, remove, genId, catalogItems } from '@/lib/store';
import type { Sector } from '@/lib/types';
import { PageHeader, StatBox } from '@/components/ui/kit';
import EditGrid, { type GridCol } from '@/components/ui/EditGrid';

export default function Sectors() {
  const db = useDb();
  const [q, setQ] = useState('');
  const [branch, setBranch] = useState('all');

  const rows = useMemo(() => db.sectors.filter(s => {
    if (branch !== 'all' && s.branchId !== branch) return false;
    if (q && !s.name.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [q, branch, db.sectors]);

  const c = { total: db.sectors.length, branches: new Set(db.sectors.map(s => s.branchId)).size, it: db.sectors.filter(s => s.type === 'it').length };

  const cols: GridCol<Sector>[] = [
    { key: 'name', label: 'Setor', required: true, placeholder: 'Nome do setor' },
    { key: 'code', label: 'Código', width: 90, placeholder: 'TI' },
    { key: 'branchId', label: 'Filial', width: 180, type: 'select', options: db.branches.map(b => ({ value: b.id, label: b.name })) },
    { key: 'type', label: 'Tipo', width: 140, type: 'select', options: catalogItems('sectorTypes').map(t => ({ value: t.key, label: t.label })) },
    { key: 'floor', label: 'Andar', width: 110, placeholder: '2º andar' },
    { key: 'active', label: 'Ativo', width: 70, type: 'toggle' },
  ];

  return (
    <div className="col fill">
      <PageHeader title="Setores" subtitle="Departamentos por filial — edição direta no grid" />
      <div className="fill scroll-y" style={{ padding: 12 }}>
        <div className="row" style={{ gap: 10, marginBottom: 12 }}>
          <StatBox label="Setores" value={c.total} tone="red" />
          <StatBox label="Filiais cobertas" value={c.branches} tone="blue" />
          <StatBox label="Setores de TI" value={c.it} tone="purple" />
        </div>
        <div className="row" style={{ gap: 6, marginBottom: 8 }}>
          <input className="zk-input" style={{ width: 220 }} placeholder="Buscar setor…" value={q} onChange={e => setQ(e.target.value)} />
          <select className="zk-select" style={{ width: 180 }} value={branch} onChange={e => setBranch(e.target.value)}>
            <option value="all">Todas as filiais</option>{db.branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <EditGrid<Sector>
          rows={rows} cols={cols} newLabel="Novo setor"
          makeEmpty={() => ({ name: '', code: '', branchId: branch !== 'all' ? branch : db.branches[0]?.id ?? '', type: 'operations', floor: null, managerEmployeeId: null, active: true })}
          validate={d => !d.name?.trim() ? 'Informe o nome do setor' : !d.branchId ? 'Selecione a filial' : null}
          onCreate={d => create('sectors', { ...d, id: genId() } as Sector)}
          onUpdate={(id, patch) => update('sectors', id, patch)}
          onDelete={row => remove('sectors', row.id)}
        />
      </div>
    </div>
  );
}
