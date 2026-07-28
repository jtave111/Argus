import { useState } from 'react';
import type { Branch } from '@/lib/types';
import { Modal } from '@/components/ui/Modal';
import { Field, FormGrid, FormSection, Input, Select, Toggle } from '@/components/ui/Form';
import { create, update, genId } from '@/lib/store';

const UF = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

const empty = (): Branch => ({
  id: '', name: '', code: '', type: 'store', phone: '', email: '', managerEmployeeId: null,
  headquarters: false, active: true,
  address: { street: '', number: '', district: '', city: '', state: 'SP', countryCode: 'BR', postalCode: '', latitude: -23.55, longitude: -46.63 },
});

export default function BranchForm({ edit, onClose }: { edit?: Branch; onClose: () => void }) {
  const [f, setF] = useState<Branch>(edit ? JSON.parse(JSON.stringify(edit)) : empty());
  const [err, setErr] = useState<Record<string, string>>({});
  const set = (patch: Partial<Branch>) => setF(p => ({ ...p, ...patch }));
  const setAddr = (patch: Partial<Branch['address']>) => setF(p => ({ ...p, address: { ...p.address, ...patch } }));

  const save = () => {
    const e: Record<string, string> = {};
    if (!f.name.trim()) e.name = 'Nome é obrigatório';
    if (!f.code.trim()) e.code = 'Código é obrigatório';
    if (f.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)) e.email = 'E-mail inválido';
    if (!f.address.city.trim()) e.city = 'Cidade é obrigatória';
    setErr(e);
    if (Object.keys(e).length) return;
    if (edit) update('branches', edit.id, f);
    else create('branches', { ...f, id: genId() });
    onClose();
  };

  return (
    <Modal title={edit ? `Editar filial — ${edit.name}` : 'Nova filial'} subtitle="Dados cadastrais da unidade" onClose={onClose} width={620}
      footer={<><button className="zk-btn" onClick={onClose}>Cancelar</button><button className="zk-btn primary" onClick={save}>{edit ? 'Salvar alterações' : 'Cadastrar filial'}</button></>}>
      <FormSection title="Identificação" />
      <FormGrid>
        <Field label="Nome" required error={err.name}><Input value={f.name} invalid={!!err.name} onChange={e => set({ name: e.target.value })} placeholder="Loja Shopping Center" /></Field>
        <Field label="Código" required error={err.code}><Input value={f.code} invalid={!!err.code} onChange={e => set({ code: e.target.value.toUpperCase() })} placeholder="LOJ42" /></Field>
        <Field label="Tipo" required>
          <Select value={f.type} onChange={e => set({ type: e.target.value })}>
            <option value="headquarters">Matriz</option><option value="store">Loja</option><option value="warehouse">Centro de Distribuição</option><option value="office">Escritório</option>
          </Select>
        </Field>
        <Field label="Telefone"><Input value={f.phone} onChange={e => set({ phone: e.target.value })} placeholder="+55 11 3000-0000" /></Field>
      </FormGrid>
      <Field label="E-mail" error={err.email}><Input value={f.email} invalid={!!err.email} onChange={e => set({ email: e.target.value })} placeholder="filial@empresa.com.br" /></Field>

      <FormSection title="Endereço" />
      <FormGrid cols={3}>
        <div style={{ gridColumn: 'span 2' }}><Field label="Logradouro"><Input value={f.address.street} onChange={e => setAddr({ street: e.target.value })} /></Field></div>
        <Field label="Número"><Input value={f.address.number} onChange={e => setAddr({ number: e.target.value })} /></Field>
        <Field label="Bairro"><Input value={f.address.district} onChange={e => setAddr({ district: e.target.value })} /></Field>
        <Field label="Cidade" required error={err.city}><Input value={f.address.city} invalid={!!err.city} onChange={e => setAddr({ city: e.target.value })} /></Field>
        <Field label="UF"><Select value={f.address.state} onChange={e => setAddr({ state: e.target.value })}>{UF.map(u => <option key={u} value={u}>{u}</option>)}</Select></Field>
        <Field label="CEP"><Input value={f.address.postalCode} onChange={e => setAddr({ postalCode: e.target.value })} placeholder="00000-000" /></Field>
        <Field label="Latitude" hint="para o mapa"><Input type="number" step="0.0001" value={f.address.latitude} onChange={e => setAddr({ latitude: parseFloat(e.target.value) || 0 })} /></Field>
        <Field label="Longitude" hint="para o mapa"><Input type="number" step="0.0001" value={f.address.longitude} onChange={e => setAddr({ longitude: parseFloat(e.target.value) || 0 })} /></Field>
      </FormGrid>

      <FormSection title="Situação" />
      <div className="row" style={{ gap: 24 }}>
        <Toggle checked={f.headquarters} onChange={v => set({ headquarters: v })} label="É a matriz" />
        <Toggle checked={f.active} onChange={v => set({ active: v })} label="Filial ativa" />
      </div>
    </Modal>
  );
}
