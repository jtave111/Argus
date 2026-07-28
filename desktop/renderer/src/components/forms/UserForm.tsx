import { useState } from 'react';
import type { User } from '@/lib/types';
import { Modal } from '@/components/ui/Modal';
import { Field, FormGrid, FormSection, Input, Toggle } from '@/components/ui/Form';
import { create, update, genId, catalogItems } from '@/lib/store';
import { X, Plus } from 'lucide-react';

const empty = (): User => ({
  id: '', name: '', userName: '', email: '', phone: '', mfaEnabled: false,
  failedLoginAttempts: 0, active: true, roles: ['READ_ONLY'],
  lastLoginAt: '', lastLoginIp: '', createdAt: new Date().toISOString(),
});

export default function UserForm({ edit, onClose }: { edit?: User; onClose: () => void }) {
  const ROLES = catalogItems('systemRoles');
  const [f, setF] = useState<User>(edit ? JSON.parse(JSON.stringify(edit)) : empty());
  const [err, setErr] = useState<Record<string, string>>({});
  const [newRole, setNewRole] = useState(ROLES[1]?.key ?? ROLES[0]?.key ?? '');
  const set = (patch: Partial<User>) => setF(p => ({ ...p, ...patch }));

  const save = () => {
    const e: Record<string, string> = {};
    if (!f.name.trim()) e.name = 'Nome é obrigatório';
    if (!f.userName.trim()) e.userName = 'Usuário é obrigatório';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)) e.email = 'E-mail inválido';
    if (f.roles.length === 0) e.roles = 'Atribua ao menos um papel';
    setErr(e);
    if (Object.keys(e).length) return;
    if (edit) update('users', edit.id, f); else create('users', { ...f, id: genId() });
    onClose();
  };

  return (
    <Modal title={edit ? `Editar conta — ${edit.userName}` : 'Nova conta de acesso'} subtitle="Credencial de login no Argus" onClose={onClose} width={560}
      footer={<><button className="zk-btn" onClick={onClose}>Cancelar</button><button className="zk-btn primary" onClick={save}>{edit ? 'Salvar alterações' : 'Criar conta'}</button></>}>
      <FormSection title="Identidade" />
      <FormGrid>
        <Field label="Nome" required error={err.name}><Input value={f.name} invalid={!!err.name} onChange={e => set({ name: e.target.value })} /></Field>
        <Field label="Usuário" required error={err.userName}><Input value={f.userName} invalid={!!err.userName} onChange={e => set({ userName: e.target.value.toLowerCase() })} placeholder="jsilva" /></Field>
        <Field label="E-mail" required error={err.email}><Input value={f.email} invalid={!!err.email} onChange={e => set({ email: e.target.value })} /></Field>
        <Field label="Telefone"><Input value={f.phone} onChange={e => set({ phone: e.target.value })} /></Field>
      </FormGrid>

      <FormSection title="Segurança" />
      <div className="row" style={{ gap: 24, marginBottom: 12 }}>
        <Toggle checked={f.mfaEnabled} onChange={v => set({ mfaEnabled: v })} label="Exigir MFA" />
        <Toggle checked={f.active} onChange={v => set({ active: v })} label="Conta ativa" />
      </div>

      <FormSection title="Papéis" />
      {err.roles && <div style={{ fontSize: 10.5, color: 'var(--red-hi)', marginBottom: 6 }}>{err.roles}</div>}
      <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {f.roles.map(r => (
          <span key={r} className="badge" style={{ color: r === 'OWNER' || r === 'ADMIN' ? 'var(--red-hi)' : 'var(--tx1)', borderColor: 'var(--b3)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            {r}<X size={11} style={{ cursor: 'pointer' }} onClick={() => set({ roles: f.roles.filter(x => x !== r) })} />
          </span>
        ))}
      </div>
      <div className="row" style={{ gap: 6 }}>
        <select className="zk-select" value={newRole} onChange={e => setNewRole(e.target.value)} style={{ width: 200 }}>{ROLES.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}</select>
        <button className="zk-btn" onClick={() => { if (!f.roles.includes(newRole)) set({ roles: [...f.roles, newRole] }); }}><Plus size={12} /> Adicionar</button>
      </div>
    </Modal>
  );
}
