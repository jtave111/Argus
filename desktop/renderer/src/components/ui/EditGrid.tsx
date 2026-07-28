import { useState, type ReactNode } from 'react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';

export interface GridCol<T> {
  key: string;
  label: string;
  width?: number | string;
  type?: 'text' | 'number' | 'select' | 'toggle';
  options?: { value: string; label: string }[];
  placeholder?: string;
  editable?: boolean;                         // default true
  required?: boolean;
  get?: (row: T) => any;                       // leitura (default: row[key])
  set?: (value: any, draft: Partial<T>) => Partial<T>; // escrita → patch (default: {[key]: value})
  render?: (row: T) => ReactNode;              // exibição custom (não-edição)
}

/**
 * Grid com edição INLINE (sem modal). "+ Novo" abre uma linha editável no topo;
 * o lápis transforma a linha inteira em campos. Enter salva, Esc cancela. Colunas
 * declarativas com get/set para suportar campos aninhados. Reutilizável em qualquer
 * entidade da store.
 */
export default function EditGrid<T extends { id: string }>({
  rows, cols, makeEmpty, onCreate, onUpdate, onDelete, validate, newLabel = 'Novo', rowClass,
}: {
  rows: T[];
  cols: GridCol<T>[];
  makeEmpty: () => Partial<T>;
  onCreate: (draft: Partial<T>) => void;
  onUpdate: (id: string, patch: Partial<T>) => void;
  onDelete: (row: T) => void;
  validate?: (draft: Partial<T>) => string | null;
  newLabel?: string;
  rowClass?: (row: T) => string | undefined;
}) {
  const [editId, setEditId] = useState<string | null>(null);   // id em edição, ou '__new__'
  const [draft, setDraft] = useState<Partial<T>>({});
  const [error, setError] = useState<string | null>(null);

  const startNew = () => { setDraft(makeEmpty()); setEditId('__new__'); setError(null); };
  const startEdit = (row: T) => { setDraft({ ...row }); setEditId(row.id); setError(null); };
  const cancel = () => { setEditId(null); setDraft({}); setError(null); };
  const commit = () => {
    const err = validate?.(draft) ?? null;
    if (err) { setError(err); return; }
    if (editId === '__new__') onCreate(draft); else if (editId) onUpdate(editId, draft);
    cancel();
  };
  const cellGet = (c: GridCol<T>, row: T) => c.get ? c.get(row) : (row as any)[c.key];
  const draftGet = (c: GridCol<T>) => {
    if (c.get) return c.get(draft as T);
    return (draft as any)[c.key];
  };
  const draftSet = (c: GridCol<T>, value: any) => setDraft(d => ({ ...d, ...(c.set ? c.set(value, d) : { [c.key]: value } as any) }));

  const onKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel(); };

  const editor = (c: GridCol<T>, autoFocus: boolean) => {
    if (c.editable === false) return <span style={{ color: 'var(--tx3)' }}>—</span>;
    const v = draftGet(c);
    if (c.type === 'toggle')
      return <input type="checkbox" checked={!!v} onChange={e => draftSet(c, e.target.checked)} />;
    if (c.type === 'select')
      return <select className="zk-select" autoFocus={autoFocus} value={v ?? ''} onKeyDown={onKey} onChange={e => draftSet(c, e.target.value)}>
        {c.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>;
    return <input className="zk-input" autoFocus={autoFocus} type={c.type === 'number' ? 'number' : 'text'} placeholder={c.placeholder}
      value={v ?? ''} onKeyDown={onKey} onChange={e => draftSet(c, c.type === 'number' ? Number(e.target.value) : e.target.value)} />;
  };

  const editingRow = (key: string) => (
    <tr key={key} style={{ background: 'var(--orange2)' }}>
      {cols.map((c, i) => <td key={c.key} style={{ width: c.width }}>{editor(c, i === 0)}</td>)}
      <td style={{ whiteSpace: 'nowrap' }}>
        <div className="row" style={{ gap: 3 }}>
          <button className="zk-btn primary" style={{ padding: 4 }} title="Salvar (Enter)" onClick={commit}><Check size={12} /></button>
          <button className="zk-btn" style={{ padding: 4 }} title="Cancelar (Esc)" onClick={cancel}><X size={12} /></button>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="col" style={{ border: '1px solid var(--b2)' }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', borderBottom: '1px solid var(--b1)', background: 'var(--panel)' }}>
        <span style={{ fontSize: 11, color: 'var(--tx3)' }}>{rows.length} registro(s){error && <b style={{ color: 'var(--red-hi)', marginLeft: 10 }}>{error}</b>}</span>
        <button className="zk-btn primary" onClick={startNew} disabled={editId === '__new__'}><Plus size={13} /> {newLabel}</button>
      </div>
      <div className="scroll-y">
        <table className="zk-table">
          <thead><tr>{cols.map(c => <th key={c.key} style={{ width: c.width }}>{c.label}</th>)}<th style={{ width: 70 }}></th></tr></thead>
          <tbody>
            {editId === '__new__' && editingRow('__new__')}
            {rows.map(row => editId === row.id ? editingRow(row.id) : (
              <tr key={row.id} className={rowClass?.(row)}>
                {cols.map(c => (
                  <td key={c.key} style={{ width: c.width }}>
                    {c.render ? c.render(row) : c.type === 'toggle'
                      ? <span style={{ color: cellGet(c, row) ? 'var(--green)' : 'var(--tx3)' }}>{cellGet(c, row) ? 'Sim' : 'Não'}</span>
                      : <span>{fmtCell(cellGet(c, row), c)}</span>}
                  </td>
                ))}
                <td style={{ whiteSpace: 'nowrap' }}>
                  <div className="row" style={{ gap: 3 }}>
                    <button className="zk-btn" style={{ padding: 4 }} title="Editar" onClick={() => startEdit(row)}><Pencil size={12} /></button>
                    <button className="zk-btn" style={{ padding: 4 }} title="Excluir" onClick={() => onDelete(row)}><Trash2 size={12} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function fmtCell<T>(v: any, c: GridCol<T>) {
  if (v == null || v === '') return '—';
  if (c.type === 'select' && c.options) return c.options.find(o => o.value === v)?.label ?? v;
  return String(v);
}
