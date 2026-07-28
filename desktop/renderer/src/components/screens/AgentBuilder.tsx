import { useState } from 'react';
import { db } from '@/lib/mock';
import { PageHeader, Panel, Badge, Btn, StatBox } from '@/components/ui/kit';

interface Build { id: string; os: string; arch: string; version: string; at: string; size: string; hash: string }

const FEATURES = [
  ['metrics', 'Coleta de métricas (CPU/RAM/disco)'],
  ['services', 'Gerência de serviços (start/stop/restart)'],
  ['shell', 'Execução de shell remoto'],
  ['remote', 'Acesso remoto de tela'],
  ['inventory', 'Inventário de hardware/software'],
  ['autoupdate', 'Atualização automática'],
] as const;

const OSES = [
  { key: 'linux', label: 'Linux', arch: 'amd64', ext: 'agente Linux (C++)', install: (s: string, t: string) => `curl -fsSL ${s}/install.sh | sudo bash -s -- --token ${t}` },
  { key: 'windows', label: 'Windows', arch: 'amd64', ext: '.exe (.NET)', install: (s: string, t: string) => `msiexec /i argus-agent.msi SERVER=${s} TOKEN=${t} /qn` },
  { key: 'macos', label: 'macOS', arch: 'arm64', ext: '.pkg', install: (s: string, t: string) => `sudo installer -pkg argus-agent.pkg -target / # ${s} ${t}` },
];

export default function AgentBuilder() {
  const [name, setName] = useState('agente-loja');
  const [server, setServer] = useState('grpcs://argus.nexusvarejo.com.br:443');
  const [token, setToken] = useState(db.organization.taxId.replace(/\D/g, '').slice(0, 8) + '-REG-KEY');
  const [os, setOs] = useState('linux');
  const [interval, setInterval] = useState('30');
  const [runAs, setRunAs] = useState('root');
  const [feats, setFeats] = useState<Record<string, boolean>>({ metrics: true, services: true, shell: true, remote: false, inventory: true, autoupdate: true });
  const [builds, setBuilds] = useState<Build[]>([]);
  const [log, setLog] = useState<string[]>([]);

  const cur = OSES.find(o => o.key === os)!;
  const enabled = FEATURES.filter(([k]) => feats[k]).map(([k]) => k);

  const config = JSON.stringify({
    name, server, token: token.slice(0, 4) + '••••', os, arch: cur.arch,
    heartbeatSeconds: Number(interval), runAs, features: enabled, protocol: 'proto3/v1'
  }, null, 2);

  const doBuild = () => {
    const now = new Date();
    const b: Build = {
      id: 'B' + Math.floor(Math.random() * 90000 + 10000), os: cur.label, arch: cur.arch,
      version: '1.5.0', at: now.toLocaleString('pt-BR'),
      size: os === 'linux' ? '6.4 MB' : os === 'windows' ? '11.2 MB' : '8.1 MB',
      hash: 'sha256:' + Math.random().toString(16).slice(2, 14),
    };
    setBuilds(x => [b, ...x]);
    setLog(l => [`[${now.toLocaleTimeString('pt-BR')}] build ${b.id} gerado — ${cur.label}/${cur.arch}, ${enabled.length} features (${b.size})`, ...l]);
  };

  return (
    <div className="col fill">
      <PageHeader title="Construtor de Agentes" subtitle="Configure, gere e distribua os agentes (implants) para as máquinas" />
      <div className="fill scroll-y" style={{ padding: 12 }}>
        <div className="row" style={{ gap: 10, marginBottom: 12 }}>
          <StatBox label="Agentes na frota" value={db.agents.length} tone="red" />
          <StatBox label="Builds gerados" value={builds.length} tone="blue" />
          <StatBox label="Chave de registro" value="ativa" meta={db.organization.name} tone="green" />
          <StatBox label="Protocolo" value="proto3/v1" tone="purple" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <Panel title="CONFIGURAÇÃO DO AGENTE">
            <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Field label="Nome do agente"><input className="zk-input" value={name} onChange={e => setName(e.target.value)} /></Field>
              <Field label="Servidor (dial-out)"><input className="zk-input" value={server} onChange={e => setServer(e.target.value)} /></Field>
              <Field label="Token de registro"><input className="zk-input mono" value={token} onChange={e => setToken(e.target.value)} /></Field>
              <div className="row" style={{ gap: 10 }}>
                <Field label="Sistema alvo"><select className="zk-select" value={os} onChange={e => setOs(e.target.value)}>{OSES.map(o => <option key={o.key} value={o.key}>{o.label} — {o.ext}</option>)}</select></Field>
                <Field label="Heartbeat (s)"><input className="zk-input" value={interval} onChange={e => setInterval(e.target.value)} /></Field>
                <Field label="Executar como"><input className="zk-input" value={runAs} onChange={e => setRunAs(e.target.value)} /></Field>
              </div>
              <div>
                <div className="stat-box-lbl" style={{ marginBottom: 6 }}>Capacidades</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                  {FEATURES.map(([k, lbl]) => (
                    <label key={k} className="row" style={{ gap: 6, fontSize: 12, cursor: 'pointer', padding: '2px 0' }}>
                      <input type="checkbox" checked={!!feats[k]} onChange={e => setFeats(f => ({ ...f, [k]: e.target.checked }))} />
                      {lbl}
                    </label>
                  ))}
                </div>
              </div>
              <div className="row" style={{ gap: 6, marginTop: 4 }}>
                <Btn variant="primary" onClick={doBuild}>Gerar instalador</Btn>
                <Btn onClick={() => setLog(l => [`[${new Date().toLocaleTimeString('pt-BR')}] perfil "${name}" salvo`, ...l])}>Salvar perfil</Btn>
              </div>
            </div>
          </Panel>

          <div className="col" style={{ gap: 12 }}>
            <Panel title="MANIFESTO (config.json)">
              <pre className="mono" style={{ margin: 0, padding: 12, fontSize: 11, color: 'var(--cyan)', whiteSpace: 'pre-wrap' }}>{config}</pre>
            </Panel>
            <Panel title="COMANDO DE INSTALAÇÃO">
              <div style={{ padding: 12 }}>
                <div style={{ fontSize: 10, color: 'var(--tx3)', textTransform: 'uppercase', marginBottom: 6 }}>{cur.label} · {cur.arch}</div>
                <pre className="mono" style={{ margin: 0, padding: 10, fontSize: 11, background: 'var(--inset2)', border: '1px solid var(--b2)', color: 'var(--green)', whiteSpace: 'pre-wrap' }}>{cur.install(server, token)}</pre>
                <div style={{ fontSize: 11, color: 'var(--tx2)', marginTop: 8 }}>O agente disca para fora — nenhuma porta de entrada é aberta na máquina alvo.</div>
              </div>
            </Panel>
          </div>
        </div>

        <Panel title="BUILDS GERADOS" style={{ marginBottom: 12 }}>
          {builds.length === 0 ? <div style={{ padding: 16, color: 'var(--tx3)' }}>Nenhum build ainda. Configure acima e clique em "Gerar instalador".</div> : (
            <table className="zk-table"><thead><tr><th>ID</th><th>SO</th><th>Arch</th><th>Versão</th><th>Gerado em</th><th>Tamanho</th><th>Hash</th><th>Ações</th></tr></thead><tbody>
              {builds.map(b => (
                <tr key={b.id}>
                  <td className="mono" style={{ color: 'var(--purple)' }}>{b.id}</td>
                  <td>{b.os}</td><td className="mono">{b.arch}</td><td className="mono">{b.version}</td>
                  <td style={{ color: 'var(--tx2)' }}>{b.at}</td><td className="mono">{b.size}</td>
                  <td className="mono" style={{ color: 'var(--tx3)', fontSize: 10 }}>{b.hash}</td>
                  <td><Badge tone="green">baixar</Badge></td>
                </tr>
              ))}
            </tbody></table>
          )}
        </Panel>

        <Panel title="CONSOLE" style={{ height: 120 }}>
          <div className="fill scroll-y mono" style={{ fontSize: 11, padding: '6px 10px', background: 'var(--inset2)', color: 'var(--tx1)' }}>
            {log.length === 0 ? <span style={{ color: 'var(--tx3)' }}>Aguardando ações…</span> : log.map((l, i) => <div key={i}>{l}</div>)}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
    <label style={{ fontSize: 10, color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: 0.6 }}>{label}</label>
    {children}
  </div>;
}
