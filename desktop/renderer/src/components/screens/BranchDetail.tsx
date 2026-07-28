import { branchById, sectorsOfBranch, networksOfBranch, devicesOfBranch, devicesOfNetwork, employeesOfBranch, employeeById } from '@/lib/mock';
import { PageHeader, Panel, Badge, Btn } from '@/components/ui/kit';
import { L } from '@/lib/fmt';
import { useNav } from '@/components/layout/App';
import WorldMap from '@/components/ui/WorldMap';

function KV({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="row" style={{ justifyContent: 'space-between', padding: '4px 10px', borderBottom: '1px solid var(--b1)' }}>
    <span style={{ color: 'var(--tx3)', fontSize: 11 }}>{k}</span><span style={{ fontSize: 12, textAlign: 'right' }}>{v}</span>
  </div>;
}

export default function BranchDetail({ id }: { id: string }) {
  const { go } = useNav();
  const b = branchById(id);
  if (!b) return <div className="col fill"><PageHeader title="Filial não encontrada" actions={<Btn onClick={() => go('branches')}>Voltar</Btn>} /></div>;
  const a = b.address;
  const devs = devicesOfBranch(b.id);

  return (
    <div className="col fill">
      <PageHeader title={b.name} subtitle={`${a.city} · ${L.branchType(b.type)}`} actions={<Btn onClick={() => go('branches')}>Voltar</Btn>} />
      <div className="fill scroll-y" style={{ padding: 12 }}>
        <div className="row" style={{ gap: 6, marginBottom: 12 }}>
          <Badge tone="dim">{L.branchType(b.type)}</Badge>{b.headquarters && <Badge tone="red">Matriz</Badge>}
          <Badge tone={b.active ? 'green' : 'red'}>{b.active ? 'Ativa' : 'Inativa'}</Badge>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <Panel title="ENDEREÇO">
            <KV k="Logradouro" v={`${a.street}, ${a.number}`} /><KV k="Bairro" v={a.district} /><KV k="Cidade/UF" v={`${a.city}/${a.state}`} />
            <KV k="CEP" v={<span className="mono">{a.postalCode}</span>} /><KV k="Telefone" v={b.phone} />
            <KV k="Coordenadas" v={<span className="mono">{a.latitude.toFixed(4)}, {a.longitude.toFixed(4)}</span>} />
          </Panel>
          <Panel title="MAPA" style={{ minHeight: 240 }}>
            <div style={{ height: 240 }}><WorldMap sites={[{ lat: a.latitude, lon: a.longitude, label: b.name, sub: a.city, status: 'online' }]} /></div>
          </Panel>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <Panel title={`SETORES (${sectorsOfBranch(b.id).length})`}>
            {sectorsOfBranch(b.id).map(s => <div key={s.id} className="row" style={{ justifyContent: 'space-between', padding: '5px 10px', borderBottom: '1px solid var(--b1)' }}><span>{s.name}</span><span style={{ color: 'var(--tx2)', fontSize: 11 }}>{s.type} {s.floor ? '· ' + s.floor : ''}</span></div>)}
          </Panel>
          <Panel title={`REDES (${networksOfBranch(b.id).length})`}>
            <table className="zk-table"><thead><tr><th>Nome</th><th>Tipo</th><th>Subnet</th><th>Disp.</th></tr></thead><tbody>
              {networksOfBranch(b.id).map(n => <tr key={n.id}><td>{n.name}</td><td><Badge tone="dim">{n.type}</Badge></td><td className="mono">{n.subnet}</td><td className="mono">{devicesOfNetwork(n.id).length}</td></tr>)}
            </tbody></table>
          </Panel>
        </div>
        <Panel title={`DISPOSITIVOS (${devs.length})`} style={{ marginBottom: 12 }}>
          <table className="zk-table"><thead><tr><th>Host</th><th>Status</th><th>SO</th><th>Criticidade</th></tr></thead><tbody>
            {devs.map(d => { const [sl, st] = L.device(d.status); const [cl, ct] = L.criticality(d.criticality); return (
              <tr key={d.id} style={{ cursor: 'pointer' }} onClick={() => go('device', d.id)}><td className="mono" style={{ color: 'var(--cyan)' }}>{d.hostname}</td><td><Badge tone={st} dot>{sl}</Badge></td><td>{d.distro}</td><td><Badge tone={ct}>{cl}</Badge></td></tr>
            ); })}
          </tbody></table>
        </Panel>
        <Panel title={`EQUIPE (${employeesOfBranch(b.id).length})`}>
          <table className="zk-table"><thead><tr><th>Funcionário</th><th>Cargo</th><th>Status</th></tr></thead><tbody>
            {employeesOfBranch(b.id).map(e => { const [sl, st] = L.employee(e.status); return (
              <tr key={e.id} style={{ cursor: 'pointer' }} onClick={() => go('employee', e.id)}><td>{e.fullName}{e.id === b.managerEmployeeId && <Badge tone="red">Gerente</Badge>}</td><td>{e.jobTitle}</td><td><Badge tone={st}>{sl}</Badge></td></tr>
            ); })}
          </tbody></table>
        </Panel>
      </div>
    </div>
  );
}
