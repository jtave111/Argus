import { useState, useMemo } from 'react';
import { deviceById, agentOfDevice, hardwareOfDevice, latestMetric, metricsOfDevice, branchOfDevice, servicesOfDevice, employeeById } from '@/lib/mock';
import { PageHeader, Panel, Badge, StatBox, Btn } from '@/components/ui/kit';
import AreaChart from '@/components/ui/AreaChart';
import DeviceMessages from '@/components/screens/DeviceMessages';
import { L, pct, relative, dateTime } from '@/lib/fmt';
import { useNav } from '@/components/layout/App';

/* RNG determinístico por device */
function rng(seed: number) { return () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }; }

const TABS = ['Visão geral', 'Acesso remoto', 'Processos', 'Rede', 'Segurança', 'Automação', 'Forense', 'Energia', 'Mensagens'];

export default function DeviceConsole({ id }: { id: string }) {
  const { go } = useNav();
  const d = deviceById(id);
  const [tab, setTab] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const [quarantine, setQuarantine] = useState(false);

  const log = (m: string) => setLogs(l => [...l, `[${new Date().toLocaleTimeString('pt-BR')}] ${m}`]);

  if (!d) return <div className="col fill"><PageHeader title="Dispositivo não encontrado" actions={<Btn onClick={() => go('devices')}>Voltar</Btn>} /></div>;

  const m = latestMetric(d.id);
  const ag = agentOfDevice(d.id);
  const hw = hardwareOfDevice(d.id);
  const win = d.os === 'windows';
  const r = useMemo(() => rng(id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)), [id]);

  return (
    <div className="col fill">
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--b1)' }}>
        <div className="row" style={{ gap: 8 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--tx0)' }}>{d.hostname}</span>
          <Btn onClick={() => go('devices')}>Voltar</Btn>
        </div>
        <div style={{ fontSize: 11, color: 'var(--tx2)', margin: '2px 0 6px' }}>{d.fqdn} · {branchOfDevice(d.id)?.name}</div>
        <div className="row" style={{ gap: 6 }}>
          <Badge tone={L.device(d.status)[1]} dot>{L.device(d.status)[0]}</Badge>
          <Badge tone={L.criticality(d.criticality)[1]}>Criticidade {L.criticality(d.criticality)[0]}</Badge>
          {quarantine && <Badge tone="red">EM QUARENTENA</Badge>}
        </div>
      </div>

      <div className="tab-bar">
        {TABS.map((t, i) => <div key={t} className={'tab-item' + (tab === i ? ' active' : '')} onClick={() => setTab(i)}>{t}</div>)}
      </div>

      <div className="fill scroll-y" style={{ padding: 12, minHeight: 0 }}>
        {tab === 0 && (
          <>
            <div className="row" style={{ gap: 10, marginBottom: 12 }}>
              <StatBox label="CPU" value={m ? pct(m.cpuPercent) : '—'} tone="red" />
              <StatBox label="RAM" value={m ? pct(m.ramPercent) : '—'} tone="purple" />
              <StatBox label="Disco" value={m ? pct(m.diskPercent) : '—'} tone="blue" />
              <StatBox label="Temperatura" value={m ? `${Math.round(m.temperatureCelsius)}°C` : '—'} tone="orange" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 12 }}>
              <Panel title="AÇÕES OPERACIONAIS">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, padding: 10 }}>
                  {[['Quarentena de rede', () => { setQuarantine(q => !q); log(quarantine ? 'Quarentena removida' : 'QUARENTENA ATIVADA — host isolado'); }],
                    ['Modo manutenção', () => log('Modo manutenção alternado — alertas silenciados')],
                    ['Wake-on-LAN', () => log('Magic packet enviado (WoL)')],
                    ['Reiniciar host', () => log('Reinício agendado — avisando sessões')],
                    ['Desligar host', () => log('Comando de desligamento enviado')],
                    ['Coletar inventário', () => log('Coleta de inventário disparada')],
                    ['Snapshot do estado', () => log('Snapshot criado (restaurável)')],
                    ['Simular falha (chaos)', () => log('Chaos: latência de disco +200ms por 60s')],
                    ['Diagnóstico automático', () => log('Diagnóstico: 2 pontos de atenção')]].map(([lbl, fn]) => (
                    <button key={lbl as string} className="zk-btn" style={{ textAlign: 'left', padding: 10, height: 'auto' }} onClick={fn as () => void}>{lbl as string}</button>
                  ))}
                </div>
              </Panel>
              <Panel title="IDENTIDADE">
                {([['Sistema', `${d.os} · ${d.distro}`], ['Arquitetura', d.arch], ['Modelo', d.model], ['Serial', d.serialNumber], ['Ambiente', d.environment], ['Último boot', dateTime(d.lastBootAt)], ['Agente', ag ? `${ag.agentVersion} · ${relative(ag.lastSeen)}` : '—'], ['Responsável', employeeById(d.employeeId)?.fullName ?? 'não atribuído']] as [string, string][]).map(([k, v]) => (
                  <div key={k} className="row" style={{ justifyContent: 'space-between', padding: '4px 10px', borderBottom: '1px solid var(--b1)' }}><span style={{ color: 'var(--tx3)', fontSize: 11 }}>{k}</span><span style={{ fontSize: 12 }}>{v}</span></div>
                ))}
              </Panel>
            </div>
          </>
        )}

        {tab === 1 && (
          <>
            <div className="row" style={{ gap: 6, marginBottom: 10 }}>
              <Btn variant="primary" onClick={() => { setConnected(true); log('Sessão remota iniciada (gravando)'); }}>Conectar</Btn>
              <Btn variant="danger" onClick={() => { setConnected(false); log('Sessão remota encerrada'); }}>Encerrar</Btn>
              <Btn onClick={() => log('Ctrl+Alt+Del enviado')}>Ctrl+Alt+Del</Btn>
              <Btn onClick={() => log('Transferência de arquivo iniciada')}>Enviar arquivo</Btn>
            </div>
            <div style={{ background: connected ? '#12202f' : '#0d0f12', border: '1px solid var(--b2)', height: 420, position: 'relative', overflow: 'hidden' }}>
              {connected ? (
                <>
                  <div className="row" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 26, background: 'rgba(0,0,0,0.6)', padding: '0 10px', gap: 12, fontSize: 11, zIndex: 2 }}>
                    <span style={{ color: 'var(--green)' }}>● Conectado a {d.hostname}</span>
                    <span style={{ color: 'var(--orange)', fontWeight: 700 }}>CONTROLE TOTAL</span>
                    <span style={{ marginLeft: 'auto', color: 'var(--tx1)' }} className="mono">{18 + Math.floor(r() * 30)} ms · 30 fps · H.264</span>
                    <span style={{ color: 'var(--red-hi)' }}>● REC</span>
                  </div>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.15)', fontSize: 13 }} className="mono">
                    ARGUS · sessão auditada · {d.hostname}
                  </div>
                  <div style={{ position: 'absolute', left: 30, top: 60, width: 260, background: '#22262b', border: '1px solid #333' }}>
                    <div style={{ background: '#33383e', padding: '4px 8px', fontSize: 11, color: '#ccc' }}>{win ? 'Gerenciador de Tarefas' : 'htop'}</div>
                    <div style={{ padding: 10, display: 'flex', gap: 3, alignItems: 'flex-end', height: 100 }}>
                      {Array.from({ length: 20 }, (_, i) => <div key={i} style={{ flex: 1, height: `${20 + r() * 80}%`, background: '#61afef' }} />)}
                    </div>
                  </div>
                </>
              ) : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tx3)' }}>Sessão desconectada — clique em Conectar</div>}
            </div>
          </>
        )}

        {tab === 2 && (
          <Panel title="PROCESSOS">
            <table className="zk-table"><thead><tr><th>PID</th><th>Usuário</th><th>Processo</th><th>CPU %</th><th>Memória</th><th>Estado</th></tr></thead><tbody>
              {(win ? [['System', 'SYSTEM'], ['svchost.exe', 'SYSTEM'], ['sqlservr.exe', 'MSSQL'], ['explorer.exe', 'operador'], ['MsMpEng.exe', 'SYSTEM'], ['w3wp.exe', 'IIS_USR'], ['chrome.exe', 'operador']]
                : [['systemd', 'root'], ['nginx', 'www-data'], ['postgres', 'postgres'], ['sshd', 'root'], ['dockerd', 'root'], ['java', 'argus'], ['redis-server', 'redis']]).map(([nm, usr], i) => (
                <tr key={i}>
                  <td className="mono">{100 + Math.floor(r() * 60000)}</td>
                  <td className={usr === 'root' || usr === 'SYSTEM' ? 'priv-root' : 'priv-user'}>{usr}</td>
                  <td className="cell-proc">{nm}</td>
                  <td className="mono">{(r() * 24).toFixed(1)}</td>
                  <td className="mono">{Math.round(r() * 2048)} MB</td>
                  <td style={{ color: 'var(--tx2)' }}>{r() < 0.9 ? 'running' : 'sleeping'}</td>
                </tr>
              ))}
            </tbody></table>
            <div className="row" style={{ gap: 6, padding: 10 }}>
              <Btn variant="danger" onClick={() => log('kill -TERM enviado')}>Encerrar processo</Btn>
              <Btn variant="danger" onClick={() => log('kill -9 enviado')}>Forçar (SIGKILL)</Btn>
              <Btn onClick={() => log('Dump de memória solicitado')}>Dump de memória</Btn>
            </div>
          </Panel>
        )}

        {tab === 3 && (
          <div style={{ display: 'grid', gap: 12 }}>
            <Panel title="CONEXÕES ATIVAS">
              <table className="zk-table"><thead><tr><th>Proto</th><th>Local</th><th>Porta</th><th>Remoto</th><th>Estado</th><th>Processo</th></tr></thead><tbody>
                {Array.from({ length: 8 }, (_, i) => (
                  <tr key={i}>
                    <td>{r() < 0.85 ? 'tcp' : 'udp'}</td>
                    <td className="cell-ip mono">10.{10 + Math.floor(r() * 40)}.0.{20 + Math.floor(r() * 200)}</td>
                    <td className="mono">{[22, 80, 443, 5432, 6379, 9090][Math.floor(r() * 6)]}</td>
                    <td className="cell-ip mono">201.17.{Math.floor(r() * 254)}.{Math.floor(r() * 254)}</td>
                    <td style={{ color: 'var(--green)' }}>{r() < 0.7 ? 'ESTABLISHED' : 'LISTEN'}</td>
                    <td className="cell-proc">{['nginx', 'sshd', 'postgres', 'java'][Math.floor(r() * 4)]}</td>
                  </tr>
                ))}
              </tbody></table>
              <div className="row" style={{ gap: 6, padding: 10 }}><Btn onClick={() => log('Captura de pacotes iniciada (60s)')}>Capturar pacotes</Btn><Btn variant="danger" onClick={() => log('Conexão derrubada')}>Derrubar conexão</Btn></div>
            </Panel>
            <Panel title="REGRAS DE FIREWALL">
              <table className="zk-table"><thead><tr><th>Direção</th><th>Ação</th><th>Porta</th><th>Origem</th></tr></thead><tbody>
                {[['in', 'allow', '22', '10.0.0.0/8'], ['in', 'allow', '443', '0.0.0.0/0'], ['in', 'deny', '3389', '0.0.0.0/0'], ['out', 'allow', 'any', '0.0.0.0/0']].map((f, i) => (
                  <tr key={i}><td>{f[0]}</td><td><Badge tone={f[1] === 'allow' ? 'green' : 'red'}>{f[1]}</Badge></td><td className="mono">{f[2]}</td><td className="cell-ip mono">{f[3]}</td></tr>
                ))}
              </tbody></table>
            </Panel>
          </div>
        )}

        {tab === 4 && (
          <>
            <Panel title="AÇÕES DE SEGURANÇA" style={{ marginBottom: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, padding: 10 }}>
                {['Aplicar atualizações', 'Caça a ameaças (IOC)', 'Arquivo-canário', 'Verificar drift', 'Impressão digital de HW', 'Rotacionar credenciais', 'Acesso just-in-time', 'Isolar e coletar evidências', 'Relatório de conformidade'].map(a => (
                  <button key={a} className="zk-btn" style={{ textAlign: 'left', padding: 10, height: 'auto' }} onClick={() => log(`Ação: ${a}`)}>{a}</button>
                ))}
              </div>
            </Panel>
            <Panel title="ATUALIZAÇÕES PENDENTES">
              <table className="zk-table"><thead><tr><th>Atualização</th><th>Severidade</th><th>Referência</th><th>Requer reboot</th></tr></thead><tbody>
                {(win ? [['Atualização Cumulativa', 'critical'], ['Defender Definitions', 'medium'], ['.NET Runtime Security', 'high']] : [['openssl', 'critical'], ['linux-image-generic', 'high'], ['curl', 'medium'], ['sudo', 'critical']]).map((p, i) => (
                  <tr key={i}><td>{p[0]}</td><td><Badge tone={p[1] === 'critical' ? 'red' : p[1] === 'high' ? 'orange' : 'blue'}>{p[1]}</Badge></td><td className="mono">{win ? 'KB50' + (10000 + Math.floor(r() * 9999)) : 'USN-' + (6000 + Math.floor(r() * 900)) + '-1'}</td><td>{r() < 0.4 ? 'sim' : 'não'}</td></tr>
                ))}
              </tbody></table>
            </Panel>
          </>
        )}

        {tab === 5 && (
          <>
            <Panel title="RUNBOOKS" style={{ marginBottom: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: 10 }}>
                {['Reiniciar pilha web', 'Liberar espaço em disco', 'Coletar bundle de suporte', 'Recriar índices do banco', 'Rotina de fim de expediente', 'Preparar para manutenção'].map(rb => (
                  <button key={rb} className="zk-btn" style={{ textAlign: 'left', padding: 10, height: 'auto' }} onClick={() => log(`Runbook "${rb}" em execução — passo 1/4`)}>{rb}</button>
                ))}
              </div>
            </Panel>
            <Panel title="TAREFAS AGENDADAS">
              <table className="zk-table"><thead><tr><th>Tarefa</th><th>Agendamento</th><th>Última</th><th>Próxima</th><th>Ativa</th></tr></thead><tbody>
                {[['Backup incremental', '0 2 * * *'], ['Rotação de logs', '0 0 * * 0'], ['Verificação de integridade', '*/30 * * * *'], ['Coleta de inventário', '0 6 * * *']].map((t, i) => (
                  <tr key={i}><td>{t[0]}</td><td className="mono">{t[1]}</td><td style={{ color: 'var(--tx2)' }}>há {1 + Math.floor(r() * 20)}h</td><td style={{ color: 'var(--tx2)' }}>em {1 + Math.floor(r() * 12)}h</td><td><Badge tone="green">sim</Badge></td></tr>
                ))}
              </tbody></table>
            </Panel>
          </>
        )}

        {tab === 6 && (
          <>
            <Panel title="TELEMETRIA — CPU × RAM (últimos pontos)" style={{ marginBottom: 12 }}>
              <AreaChart height={220} unit="%" series={[
                { label: 'CPU', color: '#e05c6e', data: metricsOfDevice(d.id).slice(-40).map(mm => mm.cpuPercent) },
                { label: 'RAM', color: '#a07fd4', data: metricsOfDevice(d.id).slice(-40).map(mm => mm.ramPercent) },
              ]} />
            </Panel>
            <Panel title="LOGS DO HOST">
              <table className="zk-table"><thead><tr><th>Nível</th><th>Origem</th><th>Mensagem</th></tr></thead><tbody>
                {[['INFO', 'nginx', 'GET /api/health 200'], ['ERROR', 'postgres', 'connection reset by peer'], ['WARN', 'argus-agent', 'heartbeat atrasado (539ms)'], ['INFO', 'sshd', 'Accepted publickey for argus'], ['ERROR', 'docker', 'healthcheck failed: exit 1']].map((l, i) => (
                  <tr key={i}><td><Badge tone={l[0] === 'ERROR' ? 'red' : l[0] === 'WARN' ? 'orange' : 'blue'}>{l[0]}</Badge></td><td>{l[1]}</td><td style={{ color: 'var(--tx1)' }}>{l[2]}</td></tr>
                ))}
              </tbody></table>
            </Panel>
          </>
        )}

        {tab === 7 && (
          <>
            <div className="row" style={{ gap: 10, marginBottom: 12 }}>
              {(() => { const w = 45 + (hw?.cpuCores ?? 8) * 9; const kwh = Math.round(w * 24 * 30 / 1000); return (<>
                <StatBox label="Consumo estimado" value={`${w} W`} tone="orange" />
                <StatBox label="Energia/mês" value={`${kwh} kWh`} tone="blue" />
                <StatBox label="Custo/mês" value={`R$ ${Math.round(kwh * 0.92)}`} meta="a R$ 0,92/kWh" tone="purple" />
                <StatBox label="CO₂/mês" value={`${Math.round(kwh * 0.09)} kg`} tone="green" />
              </>); })()}
            </div>
            <Panel title="GESTÃO DE ENERGIA">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: 10 }}>
                {['Perfil econômico', 'Agendar desligamento', 'Detectar ocioso', 'Relatório de eficiência'].map(a => (
                  <button key={a} className="zk-btn" style={{ textAlign: 'left', padding: 10, height: 'auto' }} onClick={() => log(`Energia: ${a}`)}>{a}</button>
                ))}
              </div>
            </Panel>
          </>
        )}
        {tab === 8 && <div style={{ height: '100%', minHeight: 420 }}><DeviceMessages device={d} /></div>}
      </div>

      <div style={{ borderTop: '1px solid var(--b1)', height: 110 }} className="col">
        <div className="sec-hdr">CONSOLE DE OPERAÇÕES</div>
        <div className="fill scroll-y mono" style={{ fontSize: 11, padding: '6px 10px', background: 'var(--inset2)', color: 'var(--tx1)' }}>
          {logs.length === 0 ? <span style={{ color: 'var(--tx3)' }}>Console aberto para {d.hostname}</span> : logs.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      </div>
    </div>
  );
}
