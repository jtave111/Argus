import { useState, useMemo } from 'react';
import { useDb, create, update, remove, genId, catalogItems } from '@/lib/store';
import type { User } from '@/lib/types';
import { PageHeader, Badge, StatBox } from '@/components/ui/kit';
import EditGrid, { type GridCol } from '@/components/ui/EditGrid';
import AdSyncModal from '@/components/forms/AdSyncModal';
import { relative } from '@/lib/fmt';
import { RefreshCw } from 'lucide-react';

export default function Users() {
  const db = useDb();
  const [q, setQ] = useState('');
  const [role, setRole] = useState('all');
  const [adSync, setAdSync] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const rows = useMemo(() => db.users.filter(u => {
    if (role !== 'all' && !u.roles.includes(role)) return false;
    if (q && !(`${u.name} ${u.userName} ${u.email}`.toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  }), [q, role, db.users]);

  const c = {
    total: db.users.length,
    active: db.users.filter(u => u.active).length,
    mfa: db.users.filter(u => u.mfaEnabled).length,
    admin: db.users.filter(u => u.roles.includes('ADMIN') || u.roles.includes('OWNER')).length,
  };

  const cols: GridCol<User>[] = [
    { key: 'name', label: 'Nome', required: true, placeholder: 'Nome completo' },
    { key: 'userName', label: 'Usuário', width: 130, placeholder: 'jsilva' },
    { key: 'email', label: 'E-mail', width: 220 },
    {
      key: 'roles', label: 'Papéis', width: 200, placeholder: 'ADMIN, AUDITOR',
      get: r => (r.roles ?? []).join(', '),
      set: v => ({ roles: String(v).split(',').map(s => s.trim().toUpperCase()).filter(Boolean) }),
      render: u => <>{u.roles.map(r => <Badge key={r} tone={r === 'OWNER' || r === 'ADMIN' ? 'red' : 'dim'}>{r}</Badge>)}</>,
    },
    { key: 'mfaEnabled', label: 'MFA', width: 70, type: 'toggle' },
    { key: 'active', label: 'Ativa', width: 70, type: 'toggle' },
    { key: 'lastLoginAt', label: 'Último login', width: 150, editable: false, render: u => <span style={{ color: 'var(--tx2)' }}>{u.lastLoginAt ? relative(u.lastLoginAt) : '—'}</span> },
    { key: 'failedLoginAttempts', label: 'Falhas', width: 70, editable: false, render: u => u.failedLoginAttempts > 0 ? <Badge tone="red">{u.failedLoginAttempts}</Badge> : <span className="mono">0</span> },
  ];

  return (
    <div className="col fill">
      <PageHeader title="Contas de Acesso" subtitle="Logins no Argus — edição direta no grid"
        actions={<button className="zk-btn" onClick={() => setAdSync(true)}><RefreshCw size={13} /> Sincronizar com AD</button>} />
      <div className="fill scroll-y" style={{ padding: 12 }}>
        <div className="row" style={{ gap: 10, marginBottom: 12 }}>
          <StatBox label="Contas" value={c.total} tone="red" />
          <StatBox label="Ativas" value={c.active} tone="green" />
          <StatBox label="Com MFA" value={c.mfa} tone="blue" />
          <StatBox label="Administradores" value={c.admin} tone="purple" />
        </div>
        <div className="row" style={{ gap: 6, marginBottom: 8 }}>
          <input className="zk-input" style={{ width: 240 }} placeholder="Buscar nome, usuário…" value={q} onChange={e => setQ(e.target.value)} />
          <select className="zk-select" style={{ width: 180 }} value={role} onChange={e => setRole(e.target.value)}>
            <option value="all">Todos os papéis</option>
            {catalogItems('systemRoles').map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
          </select>
          <span style={{ alignSelf: 'center', fontSize: 11, color: 'var(--tx3)' }}>papéis: separe por vírgula (catálogo em Configurações → Parametrização)</span>
        </div>
        <EditGrid<User>
          rows={rows} cols={cols} newLabel="Nova conta"
          makeEmpty={() => ({ name: '', userName: '', email: '', phone: '', mfaEnabled: false, failedLoginAttempts: 0, active: true, roles: ['READ_ONLY'], lastLoginAt: '', lastLoginIp: '', createdAt: new Date().toISOString() })}
          validate={d => !d.name?.trim() ? 'Informe o nome' : !d.userName?.trim() ? 'Informe o usuário' : !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email ?? '') ? 'E-mail inválido' : !(d.roles ?? []).length ? 'Atribua ao menos um papel' : null}
          onCreate={d => create('users', { ...d, id: genId() } as User)}
          onUpdate={(id, patch) => update('users', id, patch)}
          onDelete={row => remove('users', row.id)}
        />
      </div>
      {flash && <div style={{ position: 'fixed', bottom: 30, left: '50%', transform: 'translateX(-50%)', zIndex: 6000, background: 'var(--panel3)', border: '1px solid var(--green)', color: 'var(--tx0)', padding: '8px 16px', fontSize: 12 }}>{flash}</div>}
      {adSync && <AdSyncModal onClose={() => setAdSync(false)} onImported={n => { setFlash(`${n} conta(s) importada(s) do Active Directory.`); setTimeout(() => setFlash(null), 3500); }} />}
    </div>
  );
}
