import { useState } from 'react';
import { useCatalogs, addParam, removeParam } from '@/lib/store';
import { Badge } from '@/components/ui/kit';
import { Field, FormGrid, Input, Select } from '@/components/ui/Form';
import type { Tone } from '@/lib/fmt';
import { Plus, Trash2, Lock } from 'lucide-react';

const TONES: Tone[] = ['red', 'orange', 'green', 'blue', 'cyan', 'purple', 'dim'];

export default function Parametrization() {
  const catalogs = useCatalogs();
  const [selId, setSelId] = useState(catalogs[0]?.id ?? '');
  const [nk, setNk] = useState(''); const [nl, setNl] = useState(''); const [nt, setNt] = useState<Tone>('blue');
  const cat = catalogs.find(c => c.id === selId) ?? catalogs[0];

  const add = () => {
    const key = nk.trim().toUpperCase().replace(/\s+/g, '_'); if (!key || !nl.trim()) return;
    addParam(cat.id, { key, label: nl.trim(), tone: nt }); setNk(''); setNl('');
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '230px 1fr', gap: 0, border: '1px solid var(--b2)', minHeight: 380 }}>
      <div className="col" style={{ borderRight: '1px solid var(--b2)', background: 'var(--panel)' }}>
        {catalogs.map(c => (
          <div key={c.id} className={'tree-item' + (c.id === cat.id ? ' active' : '')} onClick={() => setSelId(c.id)}>
            <span className="tree-item-label">{c.name}</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--tx3)' }}>{c.items.length}</span>
          </div>
        ))}
      </div>
      <div className="col" style={{ minWidth: 0 }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--b1)' }}>
          <div style={{ fontWeight: 700, color: 'var(--tx0)' }}>{cat.name}</div>
          <div style={{ fontSize: 11, color: 'var(--tx2)' }}>{cat.desc}</div>
        </div>
        <div className="fill scroll-y" style={{ padding: 12 }}>
          <table className="zk-table">
            <thead><tr><th>Chave</th><th>Rótulo</th><th>Cor</th><th>Origem</th><th></th></tr></thead>
            <tbody>
              {cat.items.map(it => (
                <tr key={it.key}>
                  <td className="mono">{it.key}</td>
                  <td><Badge tone={(it.tone as Tone) ?? 'dim'} dot>{it.label}</Badge></td>
                  <td style={{ color: 'var(--tx2)' }}>{it.tone ?? '—'}</td>
                  <td>{it.system ? <span className="row" style={{ gap: 4, alignItems: 'center', color: 'var(--tx3)', fontSize: 10 }}><Lock size={11} /> sistema</span> : <span style={{ fontSize: 10, color: 'var(--tx2)' }}>personalizado</span>}</td>
                  <td>{!it.system && <button className="zk-btn" style={{ padding: 4 }} title="Remover" onClick={() => removeParam(cat.id, it.key)}><Trash2 size={12} /></button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ borderTop: '1px solid var(--b2)', padding: 12, background: 'var(--panel)' }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--tx2)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>Adicionar item</div>
          <div className="row" style={{ gap: 8, alignItems: 'flex-end' }}>
            <div style={{ width: 160 }}><Field label="Chave"><Input value={nk} onChange={e => setNk(e.target.value)} placeholder="EX_GESTOR" /></Field></div>
            <div style={{ flex: 1 }}><Field label="Rótulo"><Input value={nl} onChange={e => setNl(e.target.value)} placeholder="Gestor Regional" /></Field></div>
            <div style={{ width: 130 }}><Field label="Cor"><Select value={nt} onChange={e => setNt(e.target.value as Tone)}>{TONES.map(t => <option key={t} value={t}>{t}</option>)}</Select></Field></div>
            <button className="zk-btn primary" style={{ marginBottom: 12 }} onClick={add}><Plus size={13} /> Adicionar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
