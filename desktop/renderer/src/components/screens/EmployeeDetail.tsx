import { db, employeeById, branchById, userById } from '@/lib/mock';
import { PageHeader, Panel, Badge, Btn } from '@/components/ui/kit';
import { L, date, initials } from '@/lib/fmt';
import { useNav } from '@/components/layout/App';

function KV({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="row" style={{ justifyContent: 'space-between', padding: '4px 10px', borderBottom: '1px solid var(--b1)' }}>
    <span style={{ color: 'var(--tx3)', fontSize: 11 }}>{k}</span><span style={{ fontSize: 12, textAlign: 'right' }}>{v}</span>
  </div>;
}

export default function EmployeeDetail({ id }: { id: string }) {
  const { go } = useNav();
  const e = employeeById(id);
  if (!e) return <div className="col fill"><PageHeader title="Funcionário não encontrado" actions={<Btn onClick={() => go('employees')}>Voltar</Btn>} /></div>;
  const branch = branchById(e.branchId);
  const sector = db.sectors.find(s => s.id === e.sectorId);
  const mgr = e.roles && branch ? employeeById(branch.managerEmployeeId) : undefined;
  const acc = userById(e.userId);
  const [sl, st] = L.employee(e.status);

  return (
    <div className="col fill">
      <PageHeader title={e.fullName} subtitle={e.jobTitle} actions={<Btn onClick={() => go('employees')}>Voltar</Btn>} />
      <div className="fill scroll-y" style={{ padding: 12 }}>
        <div className="row" style={{ gap: 14, marginBottom: 12 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'color-mix(in srgb, var(--red) 18%, transparent)', border: '1px solid var(--red)', color: 'var(--red-hi)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700 }}>{initials(e.fullName)}</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{e.fullName}</div>
            <div style={{ color: 'var(--tx2)', marginBottom: 6 }}>{e.jobTitle} · {e.department}</div>
            <Badge tone={st}>{sl}</Badge>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <Panel title="CONTATO">
            <KV k="E-mail" v={<span className="mono">{e.email}</span>} /><KV k="Telefone" v={e.phone} /><KV k="Celular" v={e.mobile} /><KV k="Matrícula" v={<span className="mono">{e.employeeNumber}</span>} /><KV k="Admissão" v={date(e.hireDate)} />
          </Panel>
          <Panel title="ORGANIZAÇÃO">
            <KV k="Filial" v={<span className="link" style={{ color: 'var(--cyan)', cursor: 'pointer' }} onClick={() => branch && go('branch', branch.id)}>{branch?.name ?? '—'}</span>} />
            <KV k="Setor" v={sector?.name ?? '—'} />
            <KV k="Gerente" v={mgr?.fullName ?? '—'} />
          </Panel>
          <Panel title="PAPÉIS">
            {e.roles.map((r, i) => <div key={i} className="row" style={{ justifyContent: 'space-between', padding: '4px 10px', borderBottom: '1px solid var(--b1)' }}><span className="mono" style={{ fontSize: 11 }}>{r.role}</span><Badge tone={r.source === 'active_directory' ? 'blue' : 'dim'}>{r.source === 'active_directory' ? 'AD' : 'manual'}</Badge></div>)}
          </Panel>
          <Panel title="ACTIVE DIRECTORY">
            {e.adObjectGuid || e.adUpn ? <><KV k="objectGUID" v={<span className="mono" style={{ fontSize: 11 }}>{e.adObjectGuid ?? '—'}</span>} /><KV k="UPN" v={<span className="mono" style={{ fontSize: 11 }}>{e.adUpn ?? '—'}</span>} /></> : <div style={{ padding: 14, color: 'var(--tx3)', textAlign: 'center' }}>Não sincronizado com AD</div>}
          </Panel>
          <Panel title="ACESSO AO SISTEMA" style={{ gridColumn: 'span 2' }}>
            {acc ? <><KV k="Conta" v={acc.name} /><KV k="Usuário" v={<span className="mono">@{acc.userName}</span>} /><KV k="Papéis" v={acc.roles.map(r => <Badge key={r} tone="red">{L.systemRole(r)}</Badge>)} /></> : <div style={{ padding: 14, color: 'var(--tx3)', textAlign: 'center' }}>Sem acesso ao sistema — somente registro</div>}
          </Panel>
        </div>
      </div>
    </div>
  );
}
