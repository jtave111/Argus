import { useState, useRef, useEffect } from 'react';
import { db, mockAssistantSuggestions as SUGGESTIONS } from '@/lib/mock';
import { PageHeader, Badge } from '@/components/ui/kit';

interface Msg { role: 'user' | 'ai'; text: string; ts: string }

function answer(q: string): string {
  const ql = q.toLowerCase();
  const off = db.devices.filter(d => d.status === 'offline');
  const failed = db.services.filter(s => s.status === 'failed');
  if (ql.includes('offline') || ql.includes('desligad')) {
    const list = off.slice(0, 5).map(d => `• ${d.hostname} (${db.branches.find(b => db.networks.find(n => n.id === d.networkId)?.branchId === b.id)?.name ?? '—'})`).join('\n');
    return `Há **${off.length} dispositivos offline** de ${db.devices.length} na frota.\n\n${list}${off.length > 5 ? `\n…e mais ${off.length - 5}.` : ''}\n\nRecomendo priorizar os de criticidade alta/crítica.`;
  }
  if (ql.includes('serviç') || ql.includes('falha')) {
    return `**${failed.length} serviços em falha** no momento.\n\n` + failed.slice(0, 5).map(s => `• ${s.displayName} @ ${db.devices.find(d => d.id === s.deviceId)?.hostname}`).join('\n') + `\n\nPosso gerar um runbook de recuperação — é só pedir.`;
  }
  if (ql.includes('incidente') || ql.includes('24h') || ql.includes('resum')) {
    const crit = db.auditLogs.filter(a => a.severity === 'critical').length;
    return `Nas últimas 24h: **${crit} eventos críticos**, ${failed.length} serviços falharam e ${off.length} dispositivos caíram.\n\nO pico de CPU da frota ficou em torno de 40%. Nenhuma anomalia sistêmica detectada — as falhas parecem isoladas por dispositivo.`;
  }
  if (ql.includes('runbook') || ql.includes('pilha') || ql.includes('web')) {
    return `**Runbook — Reiniciar pilha web** (sugerido):\n\n1. Drenar tráfego no proxy (haproxy)\n2. \`systemctl restart nginx\` nos servidores web\n3. Aguardar health check (HTTP 200 em /health)\n4. Reativar tráfego\n5. Validar métricas por 5 min\n\nQuer que eu execute em modo simulação nos servidores web?`;
  }
  if (ql.includes('filial') || ql.includes('saúde') || ql.includes('pior')) {
    const worst = db.branches.map(b => {
      const nets = new Set(db.networks.filter(n => n.branchId === b.id).map(n => n.id));
      const devs = db.devices.filter(d => nets.has(d.networkId));
      const on = devs.filter(d => d.status === 'online').length;
      return { b, ratio: devs.length ? on / devs.length : 1 };
    }).sort((a, z) => a.ratio - z.ratio)[0];
    return `A filial com pior saúde é **${worst.b.name}** (${Math.round(worst.ratio * 100)}% dos dispositivos online). Vale abrir o mapa de operações e verificar o enlace VPN dessa unidade.`;
  }
  return `Analisei o contexto da frota (${db.devices.length} dispositivos, ${db.agents.length} agentes, ${db.branches.length} filiais). Posso ajudar com: status de dispositivos, incidentes, serviços em falha, geração de runbooks e análise de anomalias. Reformule ou escolha uma sugestão abaixo.`;
}

export default function Assistant() {
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: 'ai', text: 'Olá! Sou o **assistente do Argus**. Tenho contexto da sua frota em tempo real — pergunte sobre dispositivos, incidentes, serviços ou peça um runbook.', ts: now() }
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' }); }, [msgs, typing]);

  const send = (q: string) => {
    const text = q.trim(); if (!text || typing) return;
    setMsgs(m => [...m, { role: 'user', text, ts: now() }]); setInput(''); setTyping(true);
    setTimeout(() => {
      setMsgs(m => [...m, { role: 'ai', text: answer(text), ts: now() }]);
      setTyping(false);
    }, 550 + Math.random() * 500);
  };

  return (
    <div className="col fill">
      <PageHeader title="Assistente IA" subtitle="Copiloto de operações — ciente do contexto da frota" actions={<Badge tone="green" dot>Claude · conectado</Badge>} />
      <div className="fill" style={{ display: 'flex', minHeight: 0, justifyContent: 'center' }}>
        <div className="col" style={{ width: '100%', maxWidth: 900, minHeight: 0 }}>
          <div ref={bodyRef} className="fill scroll-y" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {msgs.map((m, i) => (
              <div key={i} className="row" style={{ gap: 10, alignItems: 'flex-start', flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
                <div style={{ width: 30, height: 30, flexShrink: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, background: m.role === 'ai' ? 'color-mix(in srgb, var(--red) 20%, transparent)' : 'var(--panel3)', color: m.role === 'ai' ? 'var(--red-hi)' : 'var(--tx1)', border: `1px solid ${m.role === 'ai' ? 'var(--red)' : 'var(--b3)'}` }}>{m.role === 'ai' ? '◈' : 'JT'}</div>
                <div style={{ maxWidth: '76%', background: m.role === 'ai' ? 'var(--panel)' : 'var(--panel2)', border: '1px solid var(--b2)', borderRadius: 8, padding: '9px 12px' }}>
                  <div style={{ fontSize: 13, lineHeight: 1.55, whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: fmt(m.text) }} />
                  <div style={{ fontSize: 9, color: 'var(--tx3)', marginTop: 4, textAlign: m.role === 'user' ? 'right' : 'left' }}>{m.ts}</div>
                </div>
              </div>
            ))}
            {typing && <div className="row" style={{ gap: 10 }}><div style={{ width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'color-mix(in srgb, var(--red) 20%, transparent)', color: 'var(--red-hi)', border: '1px solid var(--red)' }}>◈</div><div style={{ color: 'var(--tx3)', fontSize: 12, padding: '9px 0' }}>digitando…</div></div>}
          </div>
          <div style={{ padding: '0 16px 8px' }}>
            <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
              {SUGGESTIONS.map(s => <button key={s} className="zk-btn" style={{ textTransform: 'none' }} onClick={() => send(s)}>{s}</button>)}
            </div>
            <div className="row" style={{ gap: 6 }}>
              <input className="zk-input" placeholder="Pergunte ao assistente do Argus…" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send(input)} />
              <button className="zk-btn primary" onClick={() => send(input)}>Enviar</button>
            </div>
            <div style={{ fontSize: 10, color: 'var(--tx3)', marginTop: 6 }}>O provedor de IA é configurado em Configurações → Inteligência Artificial.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function now() { return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); }
function fmt(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/\*\*(.+?)\*\*/g, '<b style="color:var(--tx0)">$1</b>')
    .replace(/`(.+?)`/g, '<code style="color:var(--cyan);font-family:var(--mono)">$1</code>');
}
