import { useState, useMemo } from 'react';
import { branchById } from '@/lib/mock';
import { useDb, create, update, remove, genId, catalogItems } from '@/lib/store';
import type { Employee } from '@/lib/types';
import { PageHeader, Badge, StatBox } from '@/components/ui/kit';
import EditGrid, { type GridCol } from '@/components/ui/EditGrid';
import { useNav } from '@/components/layout/App';

export default function Employees() {
  const db = useDb();
  const { go } = useNav();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [branch, setBranch] = useState('all');

  const rows = useMemo(() => db.employees.filter(e => {
    if (status !== 'all' && e.status !== status) return false;
    if (branch !== 'all' && e.branchId !== branch) return false;
    if (q && !(`${e.fullName} ${e.email}`.toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  }), [q, status, branch, db.employees]);

  const c = {
    total: db.employees.length,
    active: db.employees.filter(e => e.status === 'active').length,
    login: db.employees.filter(e => e.userId).length,
    ad: db.employees.filter(e => e.adObjectGuid).length,
  };

  const sectorOpts = db.sectors.map(s => ({ value: s.id, label: `${branchById(s.branchId)?.name?.split(' ')[0] ?? ''} — ${s.name}` }));

  const cols: GridCol<Employee>[] = [
    { key: 'fullName', label: 'Funcionário', required: true, placeholder: 'Nome completo' },
    { key: 'email', label: 'E-mail', width: 210 },
    { key: 'jobTitle', label: 'Cargo', width: 160 },
    { key: 'branchId', label: 'Filial', width: 150, type: 'select', options: db.branches.map(b => ({ value: b.id, label: b.name })) },
    { key: 'sectorId', label: 'Setor', width: 170, type: 'select', options: sectorOpts },
    { key: 'status', label: 'Situação', width: 120, type: 'select', options: catalogItems('employeeStatus').map(s => ({ value: s.key, label: s.label })) },
    {
      key: 'roles', label: 'Papéis', width: 190, placeholder: 'OPERACAO, SUPORTE_N1',
      get: r => (r.roles ?? []).map(x => x.role).join(', '),
      set: (v, _d) => ({ roles: String(v).split(',').map(s => s.trim()).filter(Boolean).map(role => ({ role, source: 'manual' as const })) }),
      render: e => <>{(e.roles ?? []).slice(0, 2).map((r, i) => <Badge key={i} tone="dim">{r.role}</Badge>)}{e.roles.length > 2 && <span style={{ color: 'var(--tx3)', fontSize: 10 }}> +{e.roles.length - 2}</span>}</>,
    },
    { key: 'access', label: 'Acesso', width: 90, editable: false, render: e => e.userId ? <Badge tone="red">Sistema</Badge> : <Badge tone="dim">Registro</Badge> },
  ];

  return (
    <div className="col fill">
      <PageHeader title="Funcionários" subtitle="Registro corporativo — edição direta no grid" />
      <div className="fill scroll-y" style={{ padding: 12 }}>
        <div className="row" style={{ gap: 10, marginBottom: 12 }}>
          <StatBox label="Funcionários" value={c.total} tone="red" />
          <StatBox label="Ativos" value={c.active} tone="green" />
          <StatBox label="Com acesso ao sistema" value={c.login} tone="blue" />
          <StatBox label="Sincronizados com AD" value={c.ad} tone="purple" />
        </div>
        <div className="row" style={{ gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
          <input className="zk-input" style={{ width: 220 }} placeholder="Buscar nome, e-mail…" value={q} onChange={e => setQ(e.target.value)} />
          <select className="zk-select" style={{ width: 150 }} value={status} onChange={e => setStatus(e.target.value)}>
            <option value="all">Situação</option>
            {catalogItems('employeeStatus').map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <select className="zk-select" style={{ width: 180 }} value={branch} onChange={e => setBranch(e.target.value)}>
            <option value="all">Todas as filiais</option>{db.branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <span style={{ alignSelf: 'center', fontSize: 11, color: 'var(--tx3)' }}>papéis: separe por vírgula</span>
        </div>
        <EditGrid<Employee>
          rows={rows} cols={cols} newLabel="Novo funcionário"
          makeEmpty={() => ({ userId: null, branchId: branch !== 'all' ? branch : db.branches[0]?.id ?? '', sectorId: '', fullName: '', email: '', jobTitle: '', employeeNumber: '', department: '', phone: '', mobile: '', status: 'active', hireDate: '', adObjectGuid: null, adUpn: null, roles: [] })}
          validate={d => !d.fullName?.trim() ? 'Informe o nome' : !d.branchId ? 'Selecione a filial' : (d.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email)) ? 'E-mail inválido' : null}
          onCreate={d => create('employees', { ...d, id: genId() } as Employee)}
          onUpdate={(id, patch) => update('employees', id, patch)}
          onDelete={row => remove('employees', row.id)}
          rowClass={e => e.status === 'terminated' ? 'sel-red' : undefined}
        />
        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--tx3)' }}>Abrir ficha completa: clique no nome na tela de detalhe via <span style={{ color: 'var(--cyan)', cursor: 'pointer' }} onClick={() => rows[0] && go('employee', rows[0].id)}>Funcionário</span>.</div>
      </div>
    </div>
  );
}
