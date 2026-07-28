import { useState } from 'react';
import type { Organization } from '@/lib/types';
import { Modal } from '@/components/ui/Modal';
import { Field, FormGrid, FormSection, Input, Select, Textarea } from '@/components/ui/Form';
import { patchObject } from '@/lib/store';
import { receitaLookup } from '@/lib/mock';
import { Search, Check, AlertCircle } from 'lucide-react';

export default function OrganizationForm({ org, onClose }: { org: Organization; onClose: () => void }) {
  const [f, setF] = useState<Organization>(JSON.parse(JSON.stringify(org)));
  const [err, setErr] = useState<Record<string, string>>({});
  const [lookup, setLookup] = useState<'idle' | 'loading' | 'ok' | 'fail'>('idle');
  const set = (patch: Partial<Organization>) => setF(p => ({ ...p, ...patch }));

  const consultarCnpj = async () => {
    setLookup('loading');
    const d = await receitaLookup(f.taxId);
    if (!d) { setLookup('fail'); return; }
    set({
      taxId: d.taxId, legalName: d.legalName, name: d.tradeName, tradeName: d.tradeName,
      legalNature: d.legalNature, cnae: d.cnae, cnaeCode: d.cnaeCode, openingDate: d.openingDate,
      shareCapital: d.shareCapital, registryStatus: d.registryStatus, companySize: d.companySize,
      email: d.email || f.email, phone: d.phone || f.phone, address: d.address,
    });
    setLookup('ok');
  };

  const save = () => {
    const e: Record<string, string> = {};
    if (!f.name.trim()) e.name = 'Obrigatório';
    if (f.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)) e.email = 'E-mail inválido';
    setErr(e);
    if (Object.keys(e).length) return;
    patchObject('organization', f);
    onClose();
  };

  return (
    <Modal title="Editar dados da empresa" subtitle="Registro corporativo da organização" onClose={onClose} width={620}
      footer={<><button className="zk-btn" onClick={onClose}>Cancelar</button><button className="zk-btn primary" onClick={save}>Salvar alterações</button></>}>
      <FormSection title="Consulta Receita Federal" />
      <div className="row" style={{ gap: 8, alignItems: 'flex-end', marginBottom: 4 }}>
        <div style={{ flex: 1 }}><Field label="CNPJ" hint="informe e busque os dados oficiais"><Input value={f.taxId} onChange={e => { set({ taxId: e.target.value }); setLookup('idle'); }} placeholder="00.000.000/0001-00" /></Field></div>
        <button className="zk-btn primary" style={{ marginBottom: 12 }} disabled={lookup === 'loading'} onClick={consultarCnpj}>
          <Search size={13} /> {lookup === 'loading' ? 'Consultando…' : 'Buscar na Receita'}
        </button>
      </div>
      {lookup === 'ok' && <div className="row" style={{ gap: 5, alignItems: 'center', fontSize: 11, color: 'var(--green)', marginBottom: 10 }}><Check size={13} /> Dados preenchidos pela Receita. Revise e salve.</div>}
      {lookup === 'fail' && <div className="row" style={{ gap: 5, alignItems: 'center', fontSize: 11, color: 'var(--red-hi)', marginBottom: 10 }}><AlertCircle size={13} /> CNPJ inválido (14 dígitos) ou não encontrado.</div>}

      <FormSection title="Identidade" />
      <FormGrid>
        <Field label="Nome fantasia" required error={err.name}><Input value={f.name} invalid={!!err.name} onChange={e => set({ name: e.target.value })} /></Field>
        <Field label="Razão social"><Input value={f.legalName} onChange={e => set({ legalName: e.target.value })} /></Field>
        <Field label="Natureza jurídica"><Input value={f.legalNature ?? ''} onChange={e => set({ legalNature: e.target.value })} /></Field>
        <Field label="Setor / Indústria"><Input value={f.industry} onChange={e => set({ industry: e.target.value })} /></Field>
        <Field label="CNAE principal"><Input value={f.cnae ?? ''} onChange={e => set({ cnae: e.target.value })} /></Field>
        <Field label="Código CNAE"><Input value={f.cnaeCode ?? ''} onChange={e => set({ cnaeCode: e.target.value })} /></Field>
        <Field label="Abertura"><Input type="date" value={f.openingDate ?? ''} onChange={e => set({ openingDate: e.target.value })} /></Field>
        <Field label="Capital social"><Input value={f.shareCapital ?? ''} onChange={e => set({ shareCapital: e.target.value })} /></Field>
        <Field label="Situação cadastral"><Input value={f.registryStatus ?? ''} onChange={e => set({ registryStatus: e.target.value })} /></Field>
        <Field label="Porte"><Input value={f.companySize ?? ''} onChange={e => set({ companySize: e.target.value })} /></Field>
      </FormGrid>

      <FormSection title="Contato" />
      <FormGrid>
        <Field label="E-mail" error={err.email}><Input value={f.email} invalid={!!err.email} onChange={e => set({ email: e.target.value })} /></Field>
        <Field label="Telefone"><Input value={f.phone} onChange={e => set({ phone: e.target.value })} /></Field>
        <Field label="Website"><Input value={f.website} onChange={e => set({ website: e.target.value })} /></Field>
        <Field label="Plano">
          <Select value={f.plan} onChange={e => set({ plan: e.target.value })}>
            <option value="free">Free</option><option value="business">Business</option><option value="enterprise">Enterprise</option>
          </Select>
        </Field>
        <Field label="Fuso horário"><Input value={f.timezone} onChange={e => set({ timezone: e.target.value })} /></Field>
        <Field label="Locale"><Input value={f.locale} onChange={e => set({ locale: e.target.value })} /></Field>
      </FormGrid>

      <FormSection title="Segurança & notas" />
      <Field label="IPs permitidos" hint="separados por vírgula (CIDR)">
        <Input value={f.ipAllowlist.join(', ')} onChange={e => set({ ipAllowlist: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} />
      </Field>
      <Field label="Observações"><Textarea value={f.notes} onChange={e => set({ notes: e.target.value })} /></Field>
    </Modal>
  );
}
