import { useState } from 'react';
import type { Employee, EmployeeStatus } from '@/lib/types';
import { db } from '@/lib/mock';
import { Modal } from '@/components/ui/Modal';
import { Field, FormGrid, FormSection, Input, Select } from '@/components/ui/Form';
import { create, update, genId, catalogItems } from '@/lib/store';
import { X, Plus } from 'lucide-react';

const empty = (): Employee => ({
  id: '', userId: null, branchId: db.branches[0]?.id ?? '', sectorId: '', fullName: '', email: '',
  jobTitle: '', employeeNumber: '', department: '', phone: '', mobile: '', status: 'active',
  hireDate: '', adObjectGuid: null, adUpn: null, roles: [],
});

export default function EmployeeForm({ edit, onClose }: { edit?: Employee; onClose: () => void }) {
  const ROLES = catalogItems('employeeRoles');
  const STATUS = catalogItems('employeeStatus');
  const [f, setF] = useState<Employee>(edit ? JSON.parse(JSON.stringify(edit)) : empty());
  const [err, setErr] = useState<Record<string, string>>({});
  const [newRole, setNewRole] = useState(ROLES[0]?.key ?? '');
  const set = (patch: Partial<Employee>) => setF(p => ({ ...p, ...patch }));
  const sectors = db.sectors.filter(s => s.branchId === f.branchId);

  const addRole = () => { if (!f.roles.some(r => r.role === newRole)) set({ roles: [...f.roles, { role: newRole, source: 'manual' }] }); };
  const rmRole = (role: string) => set({ roles: f.roles.filter(r => r.role !== role) });

  const save = () => {
    const e: Record<string, string> = {};
    if (!f.fullName.trim()) e.fullName = 'Nome é obrigatório';
    if (!f.branchId) e.branchId = 'Selecione a filial';
    if (f.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)) e.email = 'E-mail inválido';
    setErr(e);
    if (Object.keys(e).length) return;
    const row = { ...f, sectorId: f.sectorId || sectors[0]?.id || '' };
    if (edit) update('employees', edit.id, row); else create('employees', { ...row, id: genId() });
    onClose();
  };

  return (
    <Modal title={edit ? `Editar funcionário — ${edit.fullName}` : 'Novo funcionário'} subtitle="Cadastro de pessoa da organização" onClose={onClose} width={640}
      footer={<><button className="zk-btn" onClick={onClose}>Cancelar</button><button className="zk-btn primary" onClick={save}>{edit ? 'Salvar alterações' : 'Cadastrar funcionário'}</button></>}>
      <FormSection title="Dados pessoais" />
      <FormGrid>
        <Field label="Nome completo" required error={err.fullName}><Input value={f.fullName} invalid={!!err.fullName} onChange={e => set({ fullName: e.target.value })} /></Field>
        <Field label="Matrícula"><Input value={f.employeeNumber} onChange={e => set({ employeeNumber: e.target.value })} placeholder="MAT00000" /></Field>
        <Field label="E-mail" error={err.email}><Input value={f.email} invalid={!!err.email} onChange={e => set({ email: e.target.value })} /></Field>
        <Field label="Cargo"><Input value={f.jobTitle} onChange={e => set({ jobTitle: e.target.value })} /></Field>
        <Field label="Telefone"><Input value={f.phone} onChange={e => set({ phone: e.target.value })} /></Field>
        <Field label="Celular"><Input value={f.mobile} onChange={e => set({ mobile: e.target.value })} /></Field>
      </FormGrid>

      <FormSection title="Lotação" />
      <FormGrid>
        <Field label="Filial" required error={err.branchId}>
          <Select value={f.branchId} invalid={!!err.branchId} onChange={e => set({ branchId: e.target.value, sectorId: '' })}>
            {db.branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </Select>
        </Field>
        <Field label="Setor">
          <Select value={f.sectorId} onChange={e => set({ sectorId: e.target.value })}>
            <option value="">— selecione —</option>
            {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        </Field>
        <Field label="Situação"><Select value={f.status} onChange={e => set({ status: e.target.value as EmployeeStatus })}>{STATUS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}</Select></Field>
        <Field label="Admissão"><Input type="date" value={f.hireDate} onChange={e => set({ hireDate: e.target.value })} /></Field>
      </FormGrid>

      <FormSection title="Papéis de acesso" />
      <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {f.roles.length === 0 && <span style={{ fontSize: 11, color: 'var(--tx3)' }}>Nenhum papel atribuído.</span>}
        {f.roles.map(r => (
          <span key={r.role} className="badge" style={{ color: 'var(--tx1)', borderColor: 'var(--b3)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            {r.role}<span style={{ fontSize: 9, color: 'var(--tx3)' }}>{r.source === 'active_directory' ? 'AD' : 'manual'}</span>
            <X size={11} style={{ cursor: 'pointer' }} onClick={() => rmRole(r.role)} />
          </span>
        ))}
      </div>
      <div className="row" style={{ gap: 6 }}>
        <Select value={newRole} onChange={e => setNewRole(e.target.value)} style={{ width: 200 }}>{ROLES.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}</Select>
        <button className="zk-btn" onClick={addRole}><Plus size={12} /> Adicionar papel</button>
      </div>
    </Modal>
  );
}
