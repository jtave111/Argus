import { useState } from 'react';
import { PageHeader, Panel, Badge, Btn } from '@/components/ui/kit';
import { themeNames, currentTheme, applyTheme } from '@/lib/theme';
import IntegrationsPanel from '@/components/screens/IntegrationsPanel';
import Parametrization from '@/components/screens/Parametrization';

function Toggle({ on, set }: { on: boolean; set: (v: boolean) => void }) {
  return (
    <button onClick={() => set(!on)} style={{ width: 38, height: 20, borderRadius: 10, border: '1px solid var(--b3)', background: on ? 'var(--red2)' : 'var(--inset)', position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
      <span style={{ position: 'absolute', top: 1, left: on ? 19 : 1, width: 16, height: 16, borderRadius: '50%', background: on ? 'var(--red-hi)' : 'var(--tx2)', transition: 'left .12s' }} />
    </button>
  );
}
function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
    <label style={{ fontSize: 10, color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: 0.6 }}>{label}</label>
    {children}
    {hint && <span style={{ fontSize: 10, color: 'var(--tx3)' }}>{hint}</span>}
  </div>;
}
function Row({ label, desc, right }: { label: string; desc?: string; right: React.ReactNode }) {
  return <div className="setting-row"><div><div className="setting-lbl">{label}</div>{desc && <div className="setting-desc">{desc}</div>}</div>{right}</div>;
}

const SECTIONS = [
  ['appearance', 'Aparência'], ['connection', 'Conexão'], ['integrations', 'Integrações'], ['ad', 'Active Directory'],
  ['ai', 'Inteligência Artificial'], ['parametrization', 'Parametrização'], ['apikeys', 'Chaves de API'], ['firewall', 'Firewall & Permissões'],
  ['notifications', 'Notificações'], ['about', 'Sobre'],
] as const;

export default function Settings() {
  const [sec, setSec] = useState('appearance');
  const [theme, setTheme] = useState(currentTheme());
  // AD
  const [adOn, setAdOn] = useState(true);
  // AI
  const [aiOn, setAiOn] = useState(true);
  const [aiProvider, setAiProvider] = useState('Claude (Anthropic)');
  const [keys] = useState([
    { name: 'Desktop App', prefix: 'ak_live_a91f…', scope: 'read/write', created: '12 mai 2025', last: 'há 3 min' },
    { name: 'CI/CD Pipeline', prefix: 'ak_live_7c02…', scope: 'read', created: '03 abr 2025', last: 'há 2 h' },
    { name: 'Grafana', prefix: 'ak_ro_5db8…', scope: 'metrics', created: '20 fev 2025', last: 'há 1 d' },
  ]);
  const [notif, setNotif] = useState({ critical: true, agent: true, service: false, digest: true });

  return (
    <div className="col fill">
      <PageHeader title="Configurações" subtitle="Administração do Argus" />
      <div className="fill" style={{ display: 'flex', minHeight: 0 }}>
        <div className="col" style={{ width: 210, borderRight: '1px solid var(--b1)', background: 'var(--panel)', padding: '4px 0' }}>
          {SECTIONS.map(([k, label]) => (
            <div key={k} className={'tree-item' + (sec === k ? ' active' : '')} onClick={() => setSec(k)}>
              <span className="tree-item-label">{label}</span>
            </div>
          ))}
        </div>
        <div className="fill scroll-y" style={{ padding: 14, maxWidth: 860 }}>

          {sec === 'appearance' && (
            <Panel title="APARÊNCIA">
              <div style={{ padding: 14 }}>
                <Field label="Tema">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, maxWidth: 480 }}>
                    {themeNames().map(t => <button key={t} className={'zk-btn' + (theme === t ? ' active' : '')} onClick={() => { setTheme(t); applyTheme(t); }}>{t}</button>)}
                  </div>
                </Field>
              </div>
            </Panel>
          )}

          {sec === 'parametrization' && (
            <Panel title="PARAMETRIZAÇÃO">
              <div style={{ padding: 14 }}>
                <div style={{ fontSize: 12, color: 'var(--tx2)', marginBottom: 12 }}>Configure os valores usados nos cadastros — papéis, tipos e situações. Itens marcados como <b>sistema</b> não podem ser removidos. Os formulários passam a oferecer os itens que você adicionar aqui.</div>
                <Parametrization />
              </div>
            </Panel>
          )}

          {sec === 'integrations' && (
            <Panel title="INTEGRAÇÕES">
              <div style={{ padding: 14 }}>
                <div style={{ fontSize: 12, color: 'var(--tx2)', marginBottom: 12 }}>Conecte o Argus ao seu ecossistema — identidade, observabilidade, DevOps, comunicação, segurança e virtualização.</div>
                <IntegrationsPanel />
              </div>
            </Panel>
          )}

          {sec === 'connection' && (
            <Panel title="CONEXÃO">
              <Row label="API HTTP/WebSocket" right={<span className="mono" style={{ color: 'var(--cyan)' }}>http://localhost:8080</span>} />
              <Row label="gRPC (agentes)" right={<span className="mono" style={{ color: 'var(--cyan)' }}>localhost:9090</span>} />
              <Row label="Banco de dados" right={<span className="mono" style={{ color: 'var(--tx2)' }}>PostgreSQL · argus@localhost:5432</span>} />
              <div style={{ padding: 14 }}>
                <Field label="Host do servidor gRPC (agentes discam para cá)"><input className="zk-input mono" defaultValue="grpcs://argus.nexusvarejo.com.br:443" /></Field>
                <Field label="Retenção de métricas (dias)"><input className="zk-input" defaultValue="90" style={{ width: 120 }} /></Field>
                <Btn variant="primary">Testar conexão</Btn>
              </div>
            </Panel>
          )}

          {sec === 'ad' && (
            <Panel title="ACTIVE DIRECTORY" right={<Badge tone={adOn ? 'green' : 'dim'}>{adOn ? 'sincronizando' : 'desativado'}</Badge>}>
              <Row label="Sincronização com AD/LDAP" desc="Importa funcionários, grupos e papéis do diretório" right={<Toggle on={adOn} set={setAdOn} />} />
              <div style={{ padding: 14, opacity: adOn ? 1 : 0.5 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                  <Field label="Servidor LDAP"><input className="zk-input mono" defaultValue="ldaps://dc01.nexus.local:636" /></Field>
                  <Field label="Base DN"><input className="zk-input mono" defaultValue="DC=nexus,DC=local" /></Field>
                  <Field label="Bind DN (usuário de serviço)"><input className="zk-input mono" defaultValue="CN=svc-argus,OU=Serviços,DC=nexus,DC=local" /></Field>
                  <Field label="Senha"><input className="zk-input" type="password" defaultValue="••••••••••" /></Field>
                  <Field label="Filtro de usuários"><input className="zk-input mono" defaultValue="(&(objectClass=user)(!(userAccountControl:1.2.840.113556.1.4.803:=2)))" /></Field>
                  <Field label="Intervalo de sincronização"><select className="zk-select"><option>A cada 15 min</option><option>A cada 1 h</option><option>A cada 6 h</option><option>Diário</option></select></Field>
                </div>
                <Field label="Mapeamento de grupos → papéis" hint="Grupos do AD viram papéis no Argus">
                  <textarea className="zk-input mono" rows={3} defaultValue={"TI-Admins        → ADMIN\nTI-SuporteN1     → SERVICE_DESK\nGerentes-Loja    → GESTAO_LOJA"} style={{ resize: 'vertical' }} />
                </Field>
                <div className="row" style={{ gap: 6 }}><Btn variant="primary">Testar bind</Btn><Btn>Sincronizar agora</Btn></div>
              </div>
            </Panel>
          )}

          {sec === 'ai' && (
            <Panel title="INTELIGÊNCIA ARTIFICIAL" right={<Badge tone={aiOn ? 'green' : 'dim'}>{aiOn ? 'ativa' : 'desativada'}</Badge>}>
              <Row label="Assistente de operações (IA)" desc="Análise de anomalias, resumo de incidentes e sugestão de runbooks" right={<Toggle on={aiOn} set={setAiOn} />} />
              <div style={{ padding: 14, opacity: aiOn ? 1 : 0.5 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                  <Field label="Provedor"><select className="zk-select" value={aiProvider} onChange={e => setAiProvider(e.target.value)}><option>Claude (Anthropic)</option><option>OpenAI</option><option>Modelo local (Ollama)</option></select></Field>
                  <Field label="Modelo"><input className="zk-input mono" defaultValue="claude-opus-4-8" /></Field>
                  <Field label="API key"><input className="zk-input mono" type="password" defaultValue="sk-ant-••••••••••••" /></Field>
                  <Field label="Endpoint (opcional)"><input className="zk-input mono" placeholder="https://api.anthropic.com" /></Field>
                </div>
                <Field label="Capacidades habilitadas">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                    {['Detecção de anomalias em métricas', 'Resumo automático de incidentes', 'Sugestão de runbooks', 'Análise de logs (root cause)', 'Classificação de severidade', 'Assistente de shell (linguagem natural)'].map(c => (
                      <label key={c} className="row" style={{ gap: 6, fontSize: 12, padding: '2px 0' }}><input type="checkbox" defaultChecked /> {c}</label>
                    ))}
                  </div>
                </Field>
                <div className="row" style={{ gap: 6 }}><Btn variant="primary">Salvar</Btn><Btn>Testar prompt</Btn></div>
              </div>
            </Panel>
          )}

          {sec === 'apikeys' && (
            <Panel title="CHAVES DE API" right={<Btn variant="primary">+ Nova chave</Btn>}>
              <table className="zk-table"><thead><tr><th>Nome</th><th>Chave</th><th>Escopo</th><th>Criada</th><th>Último uso</th><th>Ações</th></tr></thead><tbody>
                {keys.map(k => (
                  <tr key={k.name}><td>{k.name}</td><td className="mono" style={{ color: 'var(--cyan)' }}>{k.prefix}</td><td><Badge tone={k.scope === 'read' ? 'blue' : k.scope === 'metrics' ? 'purple' : 'green'}>{k.scope}</Badge></td><td style={{ color: 'var(--tx2)' }}>{k.created}</td><td style={{ color: 'var(--tx2)' }}>{k.last}</td><td><Badge tone="red">revogar</Badge></td></tr>
                ))}
              </tbody></table>
              <div style={{ padding: 12, fontSize: 11, color: 'var(--tx3)' }}>As chaves concedem acesso à API REST/gRPC do Argus. Guarde-as com segurança — o valor completo só é exibido na criação.</div>
            </Panel>
          )}

          {sec === 'firewall' && (
            <>
              <Panel title="FIREWALL — POLÍTICA GLOBAL" style={{ marginBottom: 12 }}>
                <Row label="Política padrão de entrada" right={<select className="zk-select" style={{ width: 140 }} defaultValue="deny"><option value="deny">Bloquear (deny)</option><option value="allow">Permitir (allow)</option></select>} />
                <Row label="Restringir acesso ao painel por IP" desc="Só IPs da allowlist da organização acessam o Argus" right={<Toggle on={true} set={() => {}} />} />
                <Row label="Bloqueio automático por brute-force" desc="Bloqueia IP após 5 falhas de login" right={<Toggle on={true} set={() => {}} />} />
                <div style={{ padding: 12 }}>
                  <Field label="Allowlist de IPs/CIDR (acesso ao painel)"><textarea className="zk-input mono" rows={3} defaultValue={"201.17.0.0/16\n187.45.32.0/20\n10.0.0.0/8"} style={{ resize: 'vertical' }} /></Field>
                </div>
              </Panel>
              <Panel title="PERMISSÕES POR PAPEL (RBAC)">
                <table className="zk-table"><thead><tr><th>Papel</th><th>Dispositivos</th><th>Shell remoto</th><th>Gerir usuários</th><th>Config. sistema</th></tr></thead><tbody>
                  {[['OWNER', '✓', '✓', '✓', '✓'], ['ADMIN', '✓', '✓', '✓', '—'], ['SERVICE_DESK', '✓ (ler)', '✓', '—', '—'], ['VIEWER', '✓ (ler)', '—', '—', '—']].map(r => (
                    <tr key={r[0]}><td><Badge tone="red">{r[0]}</Badge></td>{r.slice(1).map((c, i) => <td key={i} style={{ color: c.startsWith('✓') ? 'var(--green)' : 'var(--tx3)' }}>{c}</td>)}</tr>
                  ))}
                </tbody></table>
                <div style={{ padding: 12 }}><Btn variant="primary">Editar matriz de permissões</Btn></div>
              </Panel>
            </>
          )}

          {sec === 'notifications' && (
            <Panel title="NOTIFICAÇÕES">
              <Row label="Alertas críticos" desc="Dispositivos críticos offline" right={<Toggle on={notif.critical} set={v => setNotif({ ...notif, critical: v })} />} />
              <Row label="Queda de agente" desc="Agente perde contato com o servidor" right={<Toggle on={notif.agent} set={v => setNotif({ ...notif, agent: v })} />} />
              <Row label="Falha de serviço" desc="Serviço monitorado entra em failed" right={<Toggle on={notif.service} set={v => setNotif({ ...notif, service: v })} />} />
              <Row label="Resumo diário (digest)" desc="E-mail com o estado da frota às 8h" right={<Toggle on={notif.digest} set={v => setNotif({ ...notif, digest: v })} />} />
              <div style={{ padding: 12 }}><Field label="Canais"><div className="row" style={{ gap: 6 }}><Badge tone="green">E-mail</Badge><Badge tone="blue">Slack</Badge><Badge tone="dim">+ webhook</Badge></div></Field></div>
            </Panel>
          )}

          {sec === 'about' && (
            <Panel title="SOBRE">
              <div style={{ padding: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>Argus 0.1.0</div>
                <div style={{ color: 'var(--tx2)', fontSize: 12, marginBottom: 10 }}>React · Leaflet · JavaFX WebView · Spring Boot · gRPC</div>
                <div style={{ color: 'var(--tx2)', fontSize: 12, maxWidth: 560 }}>Painel de controle remoto de infraestrutura: agentes nativos discam para fora via gRPC e o servidor central orquestra dispositivos, serviços, métricas e a gestão de usuários corporativos.</div>
                <div className="row" style={{ gap: 6, marginTop: 12 }}><Btn variant="primary">Verificar atualizações</Btn><Btn>Licenças</Btn></div>
              </div>
            </Panel>
          )}

        </div>
      </div>
    </div>
  );
}
