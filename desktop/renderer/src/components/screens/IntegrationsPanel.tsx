import { useState } from 'react';
import { Badge } from '@/components/ui/kit';
import { Modal } from '@/components/ui/Modal';
import { Field, Input, Toggle } from '@/components/ui/Form';
import { mockIntegrations as CATALOG, integrationCategories as CATS, type MockIntegration as Integ } from '@/lib/mock';
import { BrandIcon } from '@/components/ui/BrandIcons';

export default function IntegrationsPanel() {
  const [state, setState] = useState<Record<string, boolean>>(() => Object.fromEntries(CATALOG.map(i => [i.id, !!i.connected])));
  const [cfg, setCfg] = useState<Integ | null>(null);
  const [filter, setFilter] = useState('all');
  const connected = Object.values(state).filter(Boolean).length;

  const shown = CATALOG.filter(i => filter === 'all' || i.cat === filter);

  return (
    <div className="col" style={{ gap: 12 }}>
      <div className="row" style={{ gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="stat-box" style={{ minWidth: 130 }}><div className="stat-box-lbl">Conectadas</div><div className="stat-box-val" style={{ color: 'var(--green)' }}>{connected}</div></div>
        <div className="stat-box" style={{ minWidth: 130 }}><div className="stat-box-lbl">Disponíveis</div><div className="stat-box-val">{CATALOG.length}</div></div>
        <div className="row" style={{ gap: 4, marginLeft: 'auto', flexWrap: 'wrap' }}>
          <button className={'zk-btn' + (filter === 'all' ? ' primary' : '')} onClick={() => setFilter('all')}>Todas</button>
          {CATS.map(c => <button key={c} className={'zk-btn' + (filter === c ? ' primary' : '')} onClick={() => setFilter(c)}>{c}</button>)}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 10 }}>
        {shown.map(i => {
          const on = state[i.id];
          return (
            <div key={i.id} style={{ border: '1px solid var(--b2)', background: 'var(--panel)', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="row" style={{ gap: 9, alignItems: 'flex-start' }}>
                <span style={{ width: 32, height: 32, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--inset)', border: '1px solid var(--b2)', color: i.color }}><BrandIcon id={i.id} cat={i.cat} /></span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{i.name}</div>
                  <div style={{ fontSize: 9.5, color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{i.cat}</div>
                </div>
                <div style={{ marginLeft: 'auto' }}>{on ? <Badge tone="green" dot>Conectado</Badge> : <Badge tone="dim">Disponível</Badge>}</div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--tx2)', lineHeight: 1.45, minHeight: 32 }}>{i.desc}</div>
              <div className="row" style={{ gap: 6, marginTop: 'auto' }}>
                <button className="zk-btn" style={{ flex: 1 }} onClick={() => setCfg(i)}>Configurar</button>
                <button className={'zk-btn' + (on ? ' danger' : ' primary')} style={{ flex: 1 }} onClick={() => setState(s => ({ ...s, [i.id]: !on }))}>{on ? 'Desconectar' : 'Conectar'}</button>
              </div>
            </div>
          );
        })}
      </div>

      {cfg && (
        <Modal title={`Configurar — ${cfg.name}`} subtitle={cfg.desc} onClose={() => setCfg(null)} width={480}
          footer={<><button className="zk-btn" onClick={() => setCfg(null)}>Cancelar</button><button className="zk-btn primary" onClick={() => { setState(s => ({ ...s, [cfg.id]: true })); setCfg(null); }}>Salvar & conectar</button></>}>
          {cfg.fields.map(f => (
            <Field key={f} label={f}><Input type={/secret|senha|token|key/i.test(f) ? 'password' : 'text'} placeholder={`Informe ${f}`} /></Field>
          ))}
          <div className="row" style={{ gap: 24, marginTop: 4 }}>
            <Toggle checked onChange={() => {}} label="Sincronização automática" />
            <Toggle checked={false} onChange={() => {}} label="Somente leitura" />
          </div>
        </Modal>
      )}
    </div>
  );
}
