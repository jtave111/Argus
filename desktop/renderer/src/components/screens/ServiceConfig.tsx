import { useState } from 'react';
import type { Service } from '@/lib/types';
import { deviceById, mockServiceEnvByType, mockServiceLogLines } from '@/lib/mock';
import { Modal } from '@/components/ui/Modal';
import { Field, FormGrid, Input, Select, Toggle } from '@/components/ui/Form';
import { Plus, X } from 'lucide-react';

const TABS = ['Geral', 'Recursos', 'Ambiente', 'Dependências', 'Health check', 'Unit file', 'Logs'];

export default function ServiceConfig({ service, onClose, onSaved }: { service: Service; onClose: () => void; onSaved: (m: string) => void }) {
  const host = deviceById(service.deviceId)?.hostname ?? '?';
  const [tab, setTab] = useState(0);
  // estado de configuração (apenas UI)
  const [restart, setRestart] = useState('on-failure');
  const [boot, setBoot] = useState(service.enabled);
  const [runUser, setRunUser] = useState(service.type === 'database' ? 'postgres' : 'root');
  const [workdir, setWorkdir] = useState(`/opt/${service.name}`);
  const [cpuQuota, setCpuQuota] = useState('200');
  const [memLimit, setMemLimit] = useState('2048');
  const [taskMax, setTaskMax] = useState('4096');
  const [env, setEnv] = useState<[string, string][]>(mockServiceEnvByType[service.type] ?? [['LOG_LEVEL', 'info']]);
  const [after, setAfter] = useState('network-online.target');
  const [requires, setRequires] = useState('');
  const [hcType, setHcType] = useState(service.port ? 'http' : 'cmd');
  const [hcTarget, setHcTarget] = useState(service.port ? `http://127.0.0.1:${service.port}/health` : `/usr/bin/${service.name} --check`);
  const [hcInterval, setHcInterval] = useState('30');
  const [hcTimeout, setHcTimeout] = useState('5');
  const [hcRetries, setHcRetries] = useState('3');

  const unitFile = `[Unit]
Description=${service.displayName}
After=${after}${requires ? `\nRequires=${requires}` : ''}

[Service]
Type=${service.type === 'web' || service.type === 'proxy' ? 'notify' : 'simple'}
User=${runUser}
WorkingDirectory=${workdir}
${env.map(([k, v]) => `Environment="${k}=${v}"`).join('\n')}
ExecStart=/usr/bin/${service.name}
Restart=${restart}
CPUQuota=${cpuQuota}%
MemoryMax=${memLimit}M
TasksMax=${taskMax}

[Install]
WantedBy=multi-user.target`;

  return (
    <Modal title={`Configurar — ${service.displayName}`} subtitle={`${service.name} @ ${host}`} onClose={onClose} width={680}
      footer={<><button className="zk-btn" onClick={onClose}>Cancelar</button>
        <button className="zk-btn primary" onClick={() => { onSaved(`systemctl daemon-reload; aplicada nova configuração de ${service.name} @ ${host}`); onClose(); }}>Aplicar & recarregar</button></>}>
      <div className="tab-bar" style={{ margin: '-14px -14px 12px', borderBottom: '1px solid var(--b2)' }}>
        {TABS.map((t, i) => <div key={t} className={'tab-item' + (tab === i ? ' active' : '')} onClick={() => setTab(i)}>{t}</div>)}
      </div>

      {tab === 0 && (
        <>
          <FormGrid>
            <Field label="Política de reinício" hint="systemd Restart=">
              <Select value={restart} onChange={e => setRestart(e.target.value)}>
                <option value="no">no</option><option value="on-failure">on-failure</option><option value="always">always</option><option value="on-abnormal">on-abnormal</option>
              </Select>
            </Field>
            <Field label="Executar como usuário"><Input value={runUser} onChange={e => setRunUser(e.target.value)} /></Field>
          </FormGrid>
          <Field label="Diretório de trabalho"><Input value={workdir} onChange={e => setWorkdir(e.target.value)} /></Field>
          <div className="row" style={{ gap: 24, marginTop: 4 }}>
            <Toggle checked={boot} onChange={setBoot} label="Iniciar no boot (enabled)" />
            <Toggle checked={service.monitored} onChange={() => {}} label="Monitorado pelo Argus" />
          </div>
        </>
      )}

      {tab === 1 && (
        <FormGrid>
          <Field label="CPU Quota (%)" hint="por núcleo; 200 = 2 vCPUs"><Input value={cpuQuota} onChange={e => setCpuQuota(e.target.value)} /></Field>
          <Field label="Limite de memória (MB)"><Input value={memLimit} onChange={e => setMemLimit(e.target.value)} /></Field>
          <Field label="Máx. de tarefas (TasksMax)"><Input value={taskMax} onChange={e => setTaskMax(e.target.value)} /></Field>
          <Field label="OOM Score Adjust"><Input defaultValue="0" /></Field>
        </FormGrid>
      )}

      {tab === 2 && (
        <>
          <div style={{ fontSize: 11, color: 'var(--tx3)', marginBottom: 8 }}>Variáveis de ambiente injetadas no serviço.</div>
          {env.map(([k, v], i) => (
            <div key={i} className="row" style={{ gap: 6, marginBottom: 6 }}>
              <input className="zk-input" style={{ flex: '0 0 200px' }} value={k} onChange={e => setEnv(en => en.map((p, j) => j === i ? [e.target.value, p[1]] : p))} />
              <span style={{ alignSelf: 'center', color: 'var(--tx3)' }}>=</span>
              <input className="zk-input" value={v} onChange={e => setEnv(en => en.map((p, j) => j === i ? [p[0], e.target.value] : p))} />
              <button className="zk-btn" style={{ padding: 6 }} onClick={() => setEnv(en => en.filter((_, j) => j !== i))}><X size={12} /></button>
            </div>
          ))}
          <button className="zk-btn" onClick={() => setEnv(en => [...en, ['', '']])}><Plus size={12} /> Adicionar variável</button>
        </>
      )}

      {tab === 3 && (
        <>
          <Field label="After" hint="unidades que devem iniciar antes"><Input value={after} onChange={e => setAfter(e.target.value)} /></Field>
          <Field label="Requires" hint="dependências fortes (falha em cascata)"><Input value={requires} onChange={e => setRequires(e.target.value)} placeholder="postgresql.service" /></Field>
          <Field label="Wants" hint="dependências fracas"><Input placeholder="redis.service" /></Field>
        </>
      )}

      {tab === 4 && (
        <>
          <FormGrid>
            <Field label="Tipo"><Select value={hcType} onChange={e => setHcType(e.target.value)}><option value="http">HTTP</option><option value="tcp">TCP</option><option value="cmd">Comando</option></Select></Field>
            <Field label={hcType === 'cmd' ? 'Comando' : 'Alvo'}><Input value={hcTarget} onChange={e => setHcTarget(e.target.value)} /></Field>
            <Field label="Intervalo (s)"><Input value={hcInterval} onChange={e => setHcInterval(e.target.value)} /></Field>
            <Field label="Timeout (s)"><Input value={hcTimeout} onChange={e => setHcTimeout(e.target.value)} /></Field>
            <Field label="Tentativas"><Input value={hcRetries} onChange={e => setHcRetries(e.target.value)} /></Field>
          </FormGrid>
          <div style={{ fontSize: 11, color: 'var(--tx2)', padding: 8, border: '1px solid var(--b1)', background: 'var(--inset)' }}>
            O Argus executa a verificação a cada <b>{hcInterval}s</b>; após <b>{hcRetries}</b> falhas consecutivas, marca o serviço como <b style={{ color: 'var(--red-hi)' }}>unhealthy</b> e dispara o alerta/reinício conforme a política.
          </div>
        </>
      )}

      {tab === 5 && (
        <pre className="mono scroll-y" style={{ fontSize: 11, background: 'var(--inset2)', border: '1px solid var(--b2)', padding: 12, margin: 0, maxHeight: 340, whiteSpace: 'pre', color: 'var(--tx1)' }}>{unitFile}</pre>
      )}

      {tab === 6 && (
        <div className="mono scroll-y" style={{ fontSize: 11, background: 'var(--inset2)', border: '1px solid var(--b2)', padding: 10, maxHeight: 340, color: 'var(--tx1)' }}>
          {mockServiceLogLines(service.name).map((l, i) => (
            <div key={i}><span style={{ color: 'var(--tx3)' }}>{`jul 20 0${i}:1${i}:0${i}`}</span> {host} {l}</div>
          ))}
        </div>
      )}
    </Modal>
  );
}
