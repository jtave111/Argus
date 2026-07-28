import { useState, useMemo } from 'react';
import { db, userById, mockUserAgents as UAS } from '@/lib/mock';
import { PageHeader, Badge, StatBox, Panel } from '@/components/ui/kit';
import { Modal } from '@/components/ui/Modal';
import { dateTime, relative } from '@/lib/fmt';
import type { Tone } from '@/lib/fmt';
import type { AuditLog } from '@/lib/types';
import { Search, Download, Shield, User, Server, Activity, Terminal, KeyRound } from 'lucide-react';

const SEV: Record<string, Tone> = { info: 'blue', warning: 'orange', critical: 'red' };
const SEV_COLOR: Record<string, string> = { info: 'var(--blue)', warning: 'var(--orange)', critical: 'var(--red-hi)' };
const CAT_ICON: Record<string, any> = { user: User, agent: Server, service: Activity, device: Server, shell: Terminal };
const ACTION_LBL: Record<string, string> = {
  'user.login': 'Login de usuário', 'user.login_failed': 'Falha de login', 'user.role_change': 'Alteração de papel',
  'agent.install': 'Instalação de agente', 'service.restart': 'Reinício de serviço', 'service.stop': 'Parada de serviço',
  'shell.execute': 'Execução de shell', 'device.decommission': 'Descomissionamento',
};

/* Detalhe sintético determinístico por evento (enquanto não há backend). */
function hash(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0x7fffffff; return h; }
function detail(a: AuditLog) {
  const h = hash(a.id);
  const ua = UAS[h % UAS.length];
  const reqId = 'req_' + (h.toString(16) + a.id).slice(0, 12);
  const session = 'sess_' + (hash(a.userId) % 0xffffff).toString(16).padStart(6, '0');
  let diff: { field: string; from: string; to: string }[] | null = null;
  if (a.action === 'user.role_change') diff = [{ field: 'roles', from: 'SERVICE_DESK', to: 'SERVICE_DESK, ADMIN' }];
  if (a.action === 'service.stop') diff = [{ field: 'status', from: 'running', to: 'stopped' }, { field: 'enabled', from: 'true', to: 'false' }];
  if (a.action === 'service.restart') diff = [{ field: 'status', from: 'running', to: 'running' }, { field: 'pid', from: String(1000 + h % 5000), to: String(1000 + (h + 7) % 5000) }];
  if (a.action === 'device.decommission') diff = [{ field: 'status', from: 'online', to: 'decommissioned' }];
  return { ua, reqId, session, durationMs: 20 + h % 900, diff };
}

const DAYS = 14;
function timeline(logs: AuditLog[]) {
  const now = Date.now(), DAY = 864e5;
  const buckets = Array.from({ length: DAYS }, () => ({ info: 0, warning: 0, critical: 0 }));
  logs.forEach(a => { const d = Math.floor((now - new Date(a.createdAt).getTime()) / DAY); if (d >= 0 && d < DAYS) (buckets[DAYS - 1 - d] as any)[a.severity]++; });
  return buckets;
}

export default function Audit() {
  const [q, setQ] = useState('');
  const [sev, setSev] = useState('all');
  const [cat, setCat] = useState('all');
  const [result, setResult] = useState('all');
  const [sel, setSel] = useState<AuditLog | null>(null);

  const cats = useMemo(() => Array.from(new Set(db.auditLogs.map(a => a.targetType))), []);
  const rows = useMemo(() => db.auditLogs.filter(a => {
    if (sev !== 'all' && a.severity !== sev) return false;
    if (cat !== 'all' && a.targetType !== cat) return false;
    if (result !== 'all' && a.status !== result) return false;
    if (q && !(`${a.action} ${a.targetType} ${userById(a.userId)?.name ?? ''} ${a.ipAddress}`.toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  }), [q, sev, cat, result]);

  const now = Date.now();
  const c = {
    total: db.auditLogs.length,
    critical: db.auditLogs.filter(a => a.severity === 'critical').length,
    failures: db.auditLogs.filter(a => a.status === 'failure').length,
    last24: db.auditLogs.filter(a => now - new Date(a.createdAt).getTime() < 864e5).length,
  };
  const successRate = Math.round((1 - c.failures / c.total) * 100);
  const buckets = useMemo(() => timeline(db.auditLogs), []);
  const maxB = Math.max(1, ...buckets.map(b => b.info + b.warning + b.critical));

  const exportCsv = () => {
    const head = 'quando,severidade,acao,alvo,usuario,ip,resultado\n';
    const body = rows.map(a => [dateTime(a.createdAt), a.severity, a.action, a.targetType, userById(a.userId)?.name ?? 'sistema', a.ipAddress, a.status].join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([head + body], { type: 'text/csv' }));
    const link = document.createElement('a'); link.href = url; link.download = 'argus-auditoria.csv'; link.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="col fill">
      <PageHeader title="Auditoria" subtitle="Trilha imutável de eventos — quem fez o quê, quando e de onde"
        actions={<button className="zk-btn" onClick={exportCsv}><Download size={13} /> Exportar CSV</button>} />
      <div className="fill scroll-y" style={{ padding: 12 }}>
        <div className="row" style={{ gap: 10, marginBottom: 12 }}>
          <StatBox label="Eventos" value={c.total} tone="red" />
          <StatBox label="Críticos" value={c.critical} tone="red" />
          <StatBox label="Falhas" value={c.failures} meta={`${100 - successRate}% do total`} tone="orange" />
          <StatBox label="Taxa de sucesso" value={`${successRate}%`} tone="green" />
          <StatBox label="Últimas 24h" value={c.last24} tone="blue" />
        </div>

        <Panel title="ATIVIDADE POR SEVERIDADE — 14 DIAS" style={{ marginBottom: 12 }}>
          <div style={{ padding: '14px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 90 }}>
              {buckets.map((b, i) => {
                const tot = b.info + b.warning + b.critical;
                return (
                  <div key={i} title={`${tot} eventos`} className="col" style={{ flex: 1, justifyContent: 'flex-end', height: '100%', gap: 0 }}>
                    <div style={{ height: `${(b.critical / maxB) * 100}%`, background: SEV_COLOR.critical }} />
                    <div style={{ height: `${(b.warning / maxB) * 100}%`, background: SEV_COLOR.warning }} />
                    <div style={{ height: `${(b.info / maxB) * 100}%`, background: SEV_COLOR.info }} />
                  </div>
                );
              })}
            </div>
            <div className="row" style={{ justifyContent: 'space-between', marginTop: 6, fontSize: 9, color: 'var(--tx3)' }}>
              <span>{DAYS} dias atrás</span><span>hoje</span>
            </div>
            <div className="row" style={{ gap: 12, marginTop: 8 }}>
              <Badge tone="blue" dot>Info</Badge><Badge tone="orange" dot>Aviso</Badge><Badge tone="red" dot>Crítico</Badge>
            </div>
          </div>
        </Panel>

        <div className="row" style={{ gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 8, top: 9, color: 'var(--tx3)' }} />
            <input className="zk-input" style={{ width: 260, paddingLeft: 26 }} placeholder="Buscar ação, usuário, IP…" value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <select className="zk-select" style={{ width: 150 }} value={sev} onChange={e => setSev(e.target.value)}>
            <option value="all">Severidade</option><option value="info">Info</option><option value="warning">Aviso</option><option value="critical">Crítico</option>
          </select>
          <select className="zk-select" style={{ width: 140 }} value={cat} onChange={e => setCat(e.target.value)}>
            <option value="all">Categoria</option>{cats.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="zk-select" style={{ width: 130 }} value={result} onChange={e => setResult(e.target.value)}>
            <option value="all">Resultado</option><option value="success">Sucesso</option><option value="failure">Falha</option>
          </select>
          <span style={{ alignSelf: 'center', fontSize: 11, color: 'var(--tx3)', marginLeft: 'auto' }}>{rows.length} de {c.total} eventos</span>
        </div>

        <div style={{ border: '1px solid var(--b2)' }}>
          <table className="zk-table">
            <thead><tr><th>Quando</th><th>Severidade</th><th>Ação</th><th>Alvo</th><th>Ator</th><th>IP de origem</th><th>Resultado</th></tr></thead>
            <tbody>
              {rows.map(a => {
                const Icon = CAT_ICON[a.targetType] ?? Shield;
                return (
                  <tr key={a.id} style={{ cursor: 'pointer' }} onClick={() => setSel(a)} className={a.severity === 'critical' ? 'sel-red' : undefined}>
                    <td style={{ color: 'var(--tx2)' }} title={dateTime(a.createdAt)}>{relative(a.createdAt)}</td>
                    <td><Badge tone={SEV[a.severity]} dot>{a.severity}</Badge></td>
                    <td><span className="row" style={{ gap: 6, alignItems: 'center' }}><Icon size={12} style={{ color: 'var(--tx3)' }} /><span className="mono">{ACTION_LBL[a.action] ?? a.action}</span></span></td>
                    <td>{a.targetType}</td>
                    <td>{userById(a.userId)?.name ?? 'sistema'}</td>
                    <td className="cell-ip mono">{a.ipAddress}</td>
                    <td><Badge tone={a.status === 'success' ? 'green' : 'red'}>{a.status === 'success' ? 'sucesso' : 'falha'}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {sel && (() => {
        const d = detail(sel); const u = userById(sel.userId);
        return (
          <Modal title={<span className="row" style={{ gap: 8, alignItems: 'center' }}><KeyRound size={15} /> {ACTION_LBL[sel.action] ?? sel.action}</span>}
            subtitle={dateTime(sel.createdAt)} onClose={() => setSel(null)} width={560}
            footer={<button className="zk-btn" onClick={() => setSel(null)}>Fechar</button>}>
            <div className="row" style={{ gap: 6, marginBottom: 14 }}>
              <Badge tone={SEV[sel.severity]} dot>{sel.severity}</Badge>
              <Badge tone={sel.status === 'success' ? 'green' : 'red'}>{sel.status === 'success' ? 'sucesso' : 'falha'}</Badge>
              <Badge tone="dim">{sel.targetType}</Badge>
            </div>
            {[
              ['Evento', <span className="mono">{sel.action}</span>],
              ['Ator', u ? `${u.name} (@${u.userName})` : 'sistema'],
              ['E-mail do ator', u ? <span className="mono">{u.email}</span> : '—'],
              ['Alvo', sel.targetType],
              ['IP de origem', <span className="mono">{sel.ipAddress}</span>],
              ['User-Agent', <span className="mono" style={{ fontSize: 10 }}>{d.ua}</span>],
              ['Sessão', <span className="mono">{d.session}</span>],
              ['Request ID', <span className="mono">{d.reqId}</span>],
              ['Duração', `${d.durationMs} ms`],
            ].map(([k, v], i) => (
              <div key={i} className="row" style={{ justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--b1)', gap: 12 }}>
                <span style={{ color: 'var(--tx3)', fontSize: 11, flexShrink: 0 }}>{k}</span>
                <span style={{ fontSize: 12, textAlign: 'right', wordBreak: 'break-all' }}>{v}</span>
              </div>
            ))}
            {d.diff && (
              <>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--tx2)', textTransform: 'uppercase', letterSpacing: '.06em', margin: '14px 0 8px' }}>Alterações</div>
                <table className="zk-table"><thead><tr><th>Campo</th><th>Antes</th><th>Depois</th></tr></thead>
                  <tbody>{d.diff.map((r, i) => (
                    <tr key={i}><td className="mono">{r.field}</td>
                      <td className="mono" style={{ color: 'var(--red-hi)' }}>{r.from}</td>
                      <td className="mono" style={{ color: 'var(--green)' }}>{r.to}</td></tr>
                  ))}</tbody>
                </table>
              </>
            )}
          </Modal>
        );
      })()}
    </div>
  );
}
