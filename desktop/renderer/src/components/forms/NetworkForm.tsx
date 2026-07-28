import { useState } from 'react';
import type { Network } from '@/lib/types';
import { db } from '@/lib/mock';
import { Modal } from '@/components/ui/Modal';
import { Field, FormGrid, FormSection, Input, Select } from '@/components/ui/Form';
import { create, update, genId } from '@/lib/store';

const TYPES = [['lan', 'LAN'], ['dmz', 'DMZ'], ['wan', 'WAN'], ['vpn', 'VPN'], ['wifi', 'Wi-Fi'], ['management', 'Gerência']];
const ZONES = [['trusted', 'Confiável'], ['dmz', 'DMZ'], ['untrusted', 'Não confiável'], ['guest', 'Convidados']];

const empty = (): Network => ({
  id: '', branchId: db.branches[0]?.id ?? '', sectorId: '', name: '', type: 'lan', subnet: '', gateway: '',
  vlanId: 0, domain: '', publicIp: '', ispProvider: '', bandwidthMbps: 100, securityZone: 'trusted',
});

export default function NetworkForm({ edit, onClose }: { edit?: Network; onClose: () => void }) {
  const [f, setF] = useState<Network>(edit ? JSON.parse(JSON.stringify(edit)) : empty());
  const [err, setErr] = useState<Record<string, string>>({});
  const set = (patch: Partial<Network>) => setF(p => ({ ...p, ...patch }));
  const sectors = db.sectors.filter(s => s.branchId === f.branchId);

  const save = () => {
    const e: Record<string, string> = {};
    if (!f.name.trim()) e.name = 'Nome é obrigatório';
    if (!f.subnet.trim()) e.subnet = 'Sub-rede é obrigatória';
    else if (!/^\d{1,3}(\.\d{1,3}){3}\/\d{1,2}$/.test(f.subnet)) e.subnet = 'Use CIDR: 10.0.0.0/24';
    setErr(e); if (Object.keys(e).length) return;
    const row = { ...f, sectorId: f.sectorId || sectors[0]?.id || '' };
    if (edit) update('networks', edit.id, row); else create('networks', { ...row, id: genId() });
    onClose();
  };

  return (
    <Modal title={edit ? `Editar rede — ${edit.name}` : 'Nova rede'} subtitle="Segmento de rede de uma filial" onClose={onClose} width={620}
      footer={<><button className="zk-btn" onClick={onClose}>Cancelar</button><button className="zk-btn primary" onClick={save}>{edit ? 'Salvar' : 'Cadastrar rede'}</button></>}>
      <FormSection title="Identificação" />
      <FormGrid>
        <Field label="Nome" required error={err.name}><Input value={f.name} invalid={!!err.name} onChange={e => set({ name: e.target.value })} placeholder="Matriz — LAN" /></Field>
        <Field label="Tipo"><Select value={f.type} onChange={e => set({ type: e.target.value })}>{TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></Field>
        <Field label="Filial" required>
          <Select value={f.branchId} onChange={e => set({ branchId: e.target.value, sectorId: '' })}>
            {db.branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </Select>
        </Field>
        <Field label="Setor">
          <Select value={f.sectorId} onChange={e => set({ sectorId: e.target.value })}>
            <option value="">— selecione —</option>{sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        </Field>
      </FormGrid>

      <FormSection title="Endereçamento" />
      <FormGrid>
        <Field label="Sub-rede (CIDR)" required error={err.subnet}><Input value={f.subnet} invalid={!!err.subnet} onChange={e => set({ subnet: e.target.value })} placeholder="10.10.0.0/24" /></Field>
        <Field label="Gateway"><Input value={f.gateway} onChange={e => set({ gateway: e.target.value })} placeholder="10.10.0.1" /></Field>
        <Field label="VLAN"><Input type="number" value={f.vlanId} onChange={e => set({ vlanId: parseInt(e.target.value) || 0 })} /></Field>
        <Field label="Domínio"><Input value={f.domain} onChange={e => set({ domain: e.target.value })} placeholder="nexus.local" /></Field>
        <Field label="IP público"><Input value={f.publicIp} onChange={e => set({ publicIp: e.target.value })} /></Field>
        <Field label="Zona de segurança"><Select value={f.securityZone} onChange={e => set({ securityZone: e.target.value })}>{ZONES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></Field>
      </FormGrid>

      <FormSection title="Enlace" />
      <FormGrid>
        <Field label="Provedor (ISP)"><Input value={f.ispProvider} onChange={e => set({ ispProvider: e.target.value })} /></Field>
        <Field label="Banda (Mbps)"><Input type="number" value={f.bandwidthMbps} onChange={e => set({ bandwidthMbps: parseInt(e.target.value) || 0 })} /></Field>
      </FormGrid>
    </Modal>
  );
}
