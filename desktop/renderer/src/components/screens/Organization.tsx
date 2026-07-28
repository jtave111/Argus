import { useState } from 'react';
import { useDb } from '@/lib/store';
import { PageHeader, Panel, StatBox, Badge } from '@/components/ui/kit';
import OrganizationForm from '@/components/forms/OrganizationForm';
import { Pencil } from 'lucide-react';

function KV({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="row" style={{ justifyContent: 'space-between', padding: '4px 10px', borderBottom: '1px solid var(--b1)' }}>
    <span style={{ color: 'var(--tx3)', fontSize: 11 }}>{k}</span><span style={{ fontSize: 12, textAlign: 'right' }}>{v}</span>
  </div>;
}

export default function Organization() {
  const db = useDb();
  const o = db.organization;
  const [edit, setEdit] = useState(false);
  return (
    <div className="col fill">
      <PageHeader title="Organização" subtitle={o.name}
        actions={<button className="zk-btn primary" onClick={() => setEdit(true)}><Pencil size={13} /> Editar empresa</button>} />
      <div className="fill scroll-y" style={{ padding: 12 }}>
        <div className="row" style={{ gap: 10, marginBottom: 12 }}>
          <StatBox label="Filiais" value={db.branches.length} tone="red" />
          <StatBox label="Funcionários" value={db.employees.length} tone="blue" />
          <StatBox label="Contas de acesso" value={db.users.length} tone="purple" />
          <StatBox label="Dispositivos" value={db.devices.length} tone="green" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Panel title="IDENTIDADE (RECEITA FEDERAL)">
            <KV k="Nome fantasia" v={o.name} /><KV k="Razão social" v={o.legalName} /><KV k="CNPJ" v={<span className="mono">{o.taxId}</span>} />
            {o.registryStatus && <KV k="Situação cadastral" v={<Badge tone={o.registryStatus === 'ATIVA' ? 'green' : 'red'}>{o.registryStatus}</Badge>} />}
            {o.legalNature && <KV k="Natureza jurídica" v={o.legalNature} />}
            {o.cnae && <KV k="CNAE" v={<span>{o.cnaeCode ? <span className="mono">{o.cnaeCode} </span> : null}{o.cnae}</span>} />}
            {o.openingDate && <KV k="Abertura" v={o.openingDate} />}
            {o.shareCapital && <KV k="Capital social" v={o.shareCapital} />}
            {o.companySize && <KV k="Porte" v={o.companySize} />}
            <KV k="Setor" v={o.industry} /><KV k="Site" v={<span style={{ color: 'var(--cyan)' }}>{o.website}</span>} /><KV k="Telefone" v={o.phone} />
            <KV k="E-mail" v={<span className="mono">{o.email}</span>} /><KV k="Fuso / Locale" v={`${o.timezone} · ${o.locale}`} />
            {o.address && <KV k="Endereço da matriz" v={`${o.address.street}, ${o.address.number} — ${o.address.city}/${o.address.state}`} />}
          </Panel>
          <Panel title="PLANO & SEGURANÇA">
            <KV k="Plano" v={<Badge tone="red">{o.plan}</Badge>} />
            <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--b1)' }}>
              <div style={{ color: 'var(--tx3)', fontSize: 11, marginBottom: 6 }}>IPs permitidos</div>
              <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>{o.ipAllowlist.map(ip => <Badge key={ip} tone="dim">{ip}</Badge>)}</div>
            </div>
            <div style={{ padding: '8px 10px', color: 'var(--tx2)', fontSize: 11 }}>{o.notes}</div>
          </Panel>
        </div>
        <div style={{ marginTop: 12, padding: 12, border: '1px solid var(--b1)', color: 'var(--tx2)', fontSize: 12 }}>
          A organização é apenas o registro corporativo e <b>não tem localização fixa</b> — cada endereço físico é uma <b>filial</b>, que agrupa setores, redes e dispositivos.
        </div>
      </div>
      {edit && <OrganizationForm org={o} onClose={() => setEdit(false)} />}
    </div>
  );
}
