import { useState } from 'react';
import type { Sector } from '@/lib/types';
import { db } from '@/lib/mock';
import { Modal } from '@/components/ui/Modal';
import { Field, FormGrid, FormSection, Input, Select, Toggle } from '@/components/ui/Form';
import { create, update, genId } from '@/lib/store';

const TYPES = [['it', 'TI'], ['logistics', 'Logística'], ['sales', 'Vendas'], ['operations', 'Operações'], ['admin', 'Administrativo']];

const empty = (): Sector => ({ id: '', branchId: db.branches[0]?.id ?? '', name: '', code: '', type: 'operations', floor: null, managerEmployeeId: null, active: true });

export default function SectorForm({ edit, onClose }: { edit?: Sector; onClose: () => void }) {
  const [f, setF] = useState<Sector>(edit ? JSON.parse(JSON.stringify(edit)) : empty());
  const [err, setErr] = useState<Record<string, string>>({});
  const set = (patch: Partial<Sector>) => setF(p => ({ ...p, ...patch }));
  const staff = db.employees.filter(e => e.branchId === f.branchId);

  const save = () => {
    const e: Record<string, string> = {};
    if (!f.name.trim()) e.name = 'Nome é obrigatório';
    if (!f.branchId) e.branchId = 'Selecione a filial';
    setErr(e); if (Object.keys(e).length) return;
    if (edit) update('sectors', edit.id, f); else create('sectors', { ...f, id: genId() });
    onClose();
  };

  return (
    <Modal title={edit ? `Editar setor — ${edit.name}` : 'Novo setor'} subtitle="Departamento de uma filial" onClose={onClose} width={560}
      footer={<><button className="zk-btn" onClick={onClose}>Cancelar</button><button className="zk-btn primary" onClick={save}>{edit ? 'Salvar' : 'Cadastrar setor'}</button></>}>
      <FormSection title="Dados" />
      <FormGrid>
        <Field label="Nome" required error={err.name}><Input value={f.name} invalid={!!err.name} onChange={e => set({ name: e.target.value })} /></Field>
        <Field label="Código"><Input value={f.code} onChange={e => set({ code: e.target.value.toUpperCase() })} /></Field>
        <Field label="Filial" required error={err.branchId}>
          <Select value={f.branchId} invalid={!!err.branchId} onChange={e => set({ branchId: e.target.value, managerEmployeeId: null })}>
            {db.branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </Select>
        </Field>
        <Field label="Tipo"><Select value={f.type} onChange={e => set({ type: e.target.value })}>{TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></Field>
        <Field label="Andar / local"><Input value={f.floor ?? ''} onChange={e => set({ floor: e.target.value || null })} placeholder="2º andar" /></Field>
        <Field label="Gerente">
          <Select value={f.managerEmployeeId ?? ''} onChange={e => set({ managerEmployeeId: e.target.value || null })}>
            <option value="">— nenhum —</option>{staff.map(s => <option key={s.id} value={s.id}>{s.fullName}</option>)}
          </Select>
        </Field>
      </FormGrid>
      <div style={{ marginTop: 4 }}><Toggle checked={f.active} onChange={v => set({ active: v })} label="Setor ativo" /></div>
    </Modal>
  );
}
