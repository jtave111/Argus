import { useState, useMemo } from 'react';
import { db, deviceById } from '@/lib/mock';
import { PageHeader, Badge, StatBox, Btn } from '@/components/ui/kit';
import ServiceConfig from '@/components/screens/ServiceConfig';
import { L, uptime } from '@/lib/fmt';
import type { Service } from '@/lib/types';
import { Settings2 } from 'lucide-react';

const ORDER: Record<string, number> = { failed: 0, stopped: 1, unknown: 2, running: 3 };

export default function Services() {
  const [rows, setRows] = useState<Service[]>(() => db.services.map(s => ({ ...s })));
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [type, setType] = useState('all');
  const [sel, setSel] = useState<string | null>(null);
  const [cfg, setCfg] = useState<Service | null>(null);
  const [logs, setLogs] = useState<string[]>(['Pronto. ' + db.services.length + ' serviços carregados.']);

  const log = (m: string) => {
    const t = new Date().toLocaleTimeString('pt-BR');
    setLogs(l => [...l, `[${t}] ${m}`]);
  };

  const act = (id: string, action: 'start' | 'stop' | 'restart') => {
    setRows(rs => rs.map(s => {
      if (s.id !== id) return s;
      const host = deviceById(s.deviceId)?.hostname ?? '?';
      if (action === 'stop') { log(`systemctl stop ${s.name} @ ${host} → parado`); return { ...s, status: 'stopped', pid: null, healthStatus: 'unknown', uptimeSeconds: 0 }; }
      if (action === 'start') { const pid = 200 + Math.floor(Math.random() * 60000); log(`systemctl start ${s.name} @ ${host} → ativo (pid ${pid})`); return { ...s, status: 'running', pid, healthStatus: 'healthy', uptimeSeconds: 1 }; }
      const pid = 200 + Math.floor(Math.random() * 60000); log(`systemctl restart ${s.name} @ ${host} → reiniciado (pid ${pid})`); return { ...s, status: 'running', pid, healthStatus: 'healthy', uptimeSeconds: 0, restartCount: s.restartCount + 1 };
    }));
  };

  const view = useMemo(() => rows.filter(s => {
    if (status !== 'all' && s.status !== status) return false;
    if (type !== 'all' && s.type !== type) return false;
    if (q && !(`${s.name} ${s.displayName} ${deviceById(s.deviceId)?.hostname ?? ''}`.toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  }).sort((a, b) => ORDER[a.status] - ORDER[b.status]), [rows, q, status, type]);

  const c = {
    run: rows.filter(s => s.status === 'running').length,
    stop: rows.filter(s => s.status === 'stopped').length,
    fail: rows.filter(s => s.status === 'failed').length,
    mon: rows.filter(s => s.monitored).length,
  };
  const selected = rows.find(s => s.id === sel);

  return (
    <div className="col fill">
      <PageHeader title="Serviços" subtitle="Controle os daemons da frota — selecione e opere" />
      <div className="fill" style={{ display: 'flex', minHeight: 0 }}>
        <div className="col fill" style={{ minWidth: 0 }}>
          <div className="row" style={{ gap: 10, padding: 12 }}>
            <StatBox label="Ativos" value={c.run} tone="green" />
            <StatBox label="Parados" value={c.stop} tone="dim" />
            <StatBox label="Com falha" value={c.fail} tone="red" />
            <StatBox label="Monitorados" value={c.mon} tone="blue" />
          </div>
          <div className="row" style={{ gap: 6, padding: '0 12px 8px' }}>
            <input className="zk-input" style={{ width: 200 }} placeholder="Buscar serviço, host…" value={q} onChange={e => setQ(e.target.value)} />
            <select className="zk-select" style={{ width: 140 }} value={status} onChange={e => setStatus(e.target.value)}>
              <option value="all">Status</option><option value="running">Ativo</option><option value="stopped">Parado</option><option value="failed">Falhou</option>
            </select>
            <select className="zk-select" style={{ width: 130 }} value={type} onChange={e => setType(e.target.value)}>
              <option value="all">Tipo</option><option value="web">web</option><option value="database">database</option><option value="daemon">daemon</option><option value="proxy">proxy</option>
            </select>
            <span style={{ color: 'var(--tx2)', fontSize: 11 }}>{view.length} listados</span>
          </div>
          <div className="fill scroll-y" style={{ margin: '0 12px', border: '1px solid var(--b2)' }}>
            <table className="zk-table">
              <thead><tr><th>Serviço</th><th>Dispositivo</th><th>Status</th><th>Saúde</th><th>Tipo</th><th>Porta</th><th>Uptime</th><th>Restarts</th></tr></thead>
              <tbody>
                {view.map(s => {
                  const [sl, st] = L.service(s.status); const [hl, ht] = L.health(s.healthStatus);
                  return (
                    <tr key={s.id} className={sel === s.id ? 'sel-red' : ''} style={{ cursor: 'pointer' }} onClick={() => setSel(s.id)}>
                      <td>{s.displayName}<br /><span className="mono" style={{ fontSize: 10, color: 'var(--tx3)' }}>{s.name}</span></td>
                      <td className="mono" style={{ color: 'var(--cyan)' }}>{deviceById(s.deviceId)?.hostname}</td>
                      <td><Badge tone={st} dot>{sl}</Badge></td>
                      <td><Badge tone={ht}>{hl}</Badge></td>
                      <td>{s.type}</td>
                      <td className="mono">{s.port ?? '—'}</td>
                      <td style={{ color: 'var(--tx2)' }}>{s.status === 'running' ? uptime(s.uptimeSeconds) : '—'}</td>
                      <td className="mono">{s.restartCount}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ margin: 12, border: '1px solid var(--b2)', height: 120 }} className="col">
            <div className="sec-hdr">CONSOLE DE OPERAÇÕES</div>
            <div className="fill scroll-y mono" style={{ fontSize: 11, padding: '6px 10px', background: 'var(--inset2)', color: 'var(--tx1)' }}>
              {logs.map((l, i) => <div key={i}>{l}</div>)}
            </div>
          </div>
        </div>
        <div className="col" style={{ width: 300, borderLeft: '1px solid var(--b1)', background: 'var(--panel)' }}>
          <div className="sec-hdr">CONTROLE</div>
          <div className="fill scroll-y" style={{ padding: 12 }}>
            {!selected ? <div style={{ color: 'var(--tx3)', fontSize: 12 }}>Selecione um serviço na tabela.</div> : (
              <>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx0)' }}>{selected.displayName}</div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--tx2)', marginBottom: 10 }}>{selected.name} @ {deviceById(selected.deviceId)?.hostname}</div>
                <div style={{ marginBottom: 10 }}><Badge tone={L.service(selected.status)[1]} dot>{L.service(selected.status)[0]}</Badge></div>
                <div className="row" style={{ gap: 6, marginBottom: 8 }}>
                  <Btn variant="primary" onClick={() => act(selected.id, 'start')}>Iniciar</Btn>
                  <Btn variant="danger" onClick={() => act(selected.id, 'stop')}>Parar</Btn>
                  <Btn onClick={() => act(selected.id, 'restart')}>Reiniciar</Btn>
                </div>
                <button className="zk-btn" style={{ width: '100%', marginBottom: 14, justifyContent: 'center' }} onClick={() => setCfg(selected)}><Settings2 size={13} /> Configurar serviço</button>
                {([['Tipo', selected.type], ['Porta', String(selected.port ?? '—')], ['PID', String(selected.pid ?? '—')], ['Saúde', L.health(selected.healthStatus)[0]], ['Uptime', selected.status === 'running' ? uptime(selected.uptimeSeconds) : '—'], ['Reinícios', String(selected.restartCount)]] as [string, string][]).map(([k, v]) => (
                  <div key={k} className="row" style={{ justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid var(--b1)' }}>
                    <span style={{ color: 'var(--tx3)', fontSize: 11 }}>{k}</span><span style={{ fontSize: 12 }}>{v}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
