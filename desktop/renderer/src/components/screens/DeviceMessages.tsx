import { useState, useRef, useEffect } from 'react';
import type { Device } from '@/lib/types';
import { employeeById, mockMessageTemplates as TEMPLATES, mockMessageReplies, mockDeviceThread } from '@/lib/mock';
import { Panel, Badge } from '@/components/ui/kit';
import { Send, Bell, MonitorSmartphone, ShieldAlert } from 'lucide-react';

type Prio = 'info' | 'warning' | 'critical';
interface Note { id: number; from: 'admin' | 'user'; text: string; prio: Prio; ts: string; ack?: boolean }

const PRIO: Record<Prio, { label: string; tone: 'blue' | 'orange' | 'red' }> = {
  info: { label: 'Informativo', tone: 'blue' }, warning: { label: 'Aviso', tone: 'orange' }, critical: { label: 'Crítico', tone: 'red' },
};

let nid = 100;
function now() { return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); }

export default function DeviceMessages({ device }: { device: Device }) {
  const user = employeeById(device.employeeId);
  const userName = user?.fullName ?? device.osUser;
  const [msgs, setMsgs] = useState<Note[]>(() => mockDeviceThread().map((m, i) => ({ id: i + 1, from: m.from, text: m.text, prio: 'info' as Prio, ts: m.ts, ack: m.from === 'admin' })));
  const [text, setText] = useState('');
  const [prio, setPrio] = useState<Prio>('info');
  const [popup, setPopup] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' }); }, [msgs]);

  const send = (t: string) => {
    const body = t.trim(); if (!body) return;
    const id = ++nid;
    setMsgs(m => [...m, { id, from: 'admin', text: body, prio, ts: now() }]);
    setText('');
    // simula a notificação aparecendo na tela do usuário e o "recebido"
    setPopup(true); setTimeout(() => setPopup(false), 3200);
    setTimeout(() => setMsgs(m => m.map(x => x.id === id ? { ...x, ack: true } : x)), 1400);
    if (Math.random() > 0.5) setTimeout(() => setMsgs(m => [...m, { id: ++nid, from: 'user', text: mockMessageReplies[id % mockMessageReplies.length], prio: 'info', ts: now() }]), 2600);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 12, height: '100%', minHeight: 0 }}>
      <Panel title={<span className="row" style={{ gap: 6, alignItems: 'center' }}><Bell size={13} /> CANAL COM O USUÁRIO — {userName}</span>} style={{ minHeight: 0 }}>
        <div className="col" style={{ height: '100%', minHeight: 0 }}>
          <div ref={bodyRef} className="fill scroll-y" style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10, position: 'relative' }}>
            {msgs.map(m => (
              <div key={m.id} className="row" style={{ gap: 8, alignItems: 'flex-start', flexDirection: m.from === 'admin' ? 'row-reverse' : 'row' }}>
                <div style={{ width: 26, height: 26, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, background: m.from === 'admin' ? 'color-mix(in srgb, var(--red) 20%, transparent)' : 'var(--panel3)', color: m.from === 'admin' ? 'var(--red-hi)' : 'var(--tx1)', border: `1px solid ${m.from === 'admin' ? 'var(--red)' : 'var(--b3)'}` }}>{m.from === 'admin' ? '◈' : (userName[0] ?? 'U')}</div>
                <div style={{ maxWidth: '74%' }}>
                  <div style={{ background: m.from === 'admin' ? 'var(--panel2)' : 'var(--panel)', border: '1px solid ' + (m.prio === 'critical' ? 'var(--red)' : m.prio === 'warning' ? 'var(--orange)' : 'var(--b2)'), borderLeft: m.from === 'admin' && m.prio !== 'info' ? `3px solid ${m.prio === 'critical' ? 'var(--red)' : 'var(--orange)'}` : undefined, padding: '8px 11px', fontSize: 13, lineHeight: 1.5 }}>
                    {m.from === 'admin' && m.prio !== 'info' && <div style={{ marginBottom: 3 }}><Badge tone={PRIO[m.prio].tone} dot>{PRIO[m.prio].label}</Badge></div>}
                    {m.text}
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--tx3)', marginTop: 3, textAlign: m.from === 'admin' ? 'right' : 'left' }}>{m.ts}{m.from === 'admin' && (m.ack ? ' · recebido ✓✓' : ' · enviado ✓')}</div>
                </div>
              </div>
            ))}
            {popup && (
              <div style={{ position: 'sticky', bottom: 0, alignSelf: 'center', background: 'var(--panel3)', border: '1px solid var(--b3)', padding: '6px 12px', fontSize: 11, color: 'var(--tx2)', display: 'flex', gap: 6, alignItems: 'center', boxShadow: '0 4px 16px rgba(0,0,0,.4)' }}>
                <MonitorSmartphone size={13} className="pulse" /> Notificação exibida na tela de {userName}…
              </div>
            )}
          </div>
          <div style={{ borderTop: '1px solid var(--b2)', padding: 10 }}>
            <div className="row" style={{ gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: 10, color: 'var(--tx3)', alignSelf: 'center' }}>Prioridade:</span>
              {(Object.keys(PRIO) as Prio[]).map(p => (
                <button key={p} className={'zk-btn' + (prio === p ? ' primary' : '')} style={{ padding: '2px 8px', fontSize: 10 }} onClick={() => setPrio(p)}>{PRIO[p].label}</button>
              ))}
            </div>
            <div className="row" style={{ gap: 6 }}>
              <input className="zk-input" placeholder={`Mensagem para ${userName}…`} value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && send(text)} />
              <button className="zk-btn primary" onClick={() => send(text)}><Send size={13} /> Enviar</button>
            </div>
          </div>
        </div>
      </Panel>

      <div className="col" style={{ gap: 12, minHeight: 0 }}>
        <Panel title="MENSAGENS RÁPIDAS">
          <div className="col" style={{ padding: 8, gap: 6 }}>
            {TEMPLATES.map(t => <button key={t} className="zk-btn" style={{ textAlign: 'left', padding: 8, height: 'auto', fontSize: 11, textTransform: 'none', lineHeight: 1.4 }} onClick={() => send(t)}>{t}</button>)}
          </div>
        </Panel>
        <Panel title="ENTREGA">
          <div style={{ padding: 10, fontSize: 11, color: 'var(--tx2)', lineHeight: 1.7 }}>
            <div style={{ marginBottom: 8, display: 'flex', gap: 6 }}>
              <ShieldAlert size={13} style={{ color: 'var(--orange)', flexShrink: 0, marginTop: 2 }} />
              <span>Entregue pelo agente e exibida como <b style={{ color: 'var(--tx1)' }}>notificação nativa</b> na sessão do usuário.</span>
            </div>
            <div>Destinatário: <b style={{ color: 'var(--tx1)' }}>{userName}</b></div>
            <div>Sessão: <span className="mono">{device.osUser}</span> @ {device.hostname}</div>
            <div>Canal: <span className="mono">agent://notify</span></div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
