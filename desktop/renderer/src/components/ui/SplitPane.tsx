import { useState, useRef, useEffect, type ReactNode } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Painel dividido com divisória arrastável (estilo IDE). Arraste a barra para
 * redimensionar; as setinhas colapsam/expandem cada lado; duplo-clique restaura o
 * tamanho inicial. O tamanho fica salvo em localStorage por `id`, então a preferência
 * do usuário sobrevive ao reload.
 *
 * direction='vertical'   → divisória horizontal, `size` é a ALTURA do primeiro painel
 * direction='horizontal' → divisória vertical,  `size` é a LARGURA do primeiro painel
 */
export default function SplitPane({
  id, direction = 'vertical', initial = 380, min = 90, max, first, second,
}: {
  id: string; direction?: 'vertical' | 'horizontal'; initial?: number; min?: number; max?: number;
  first: ReactNode; second: ReactNode;
}) {
  const vertical = direction === 'vertical';
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<number>(() => {
    const saved = Number(localStorage.getItem(`argus.split.${id}`));
    return Number.isFinite(saved) && saved > 0 ? saved : initial;
  });
  const dragging = useRef(false);

  useEffect(() => { localStorage.setItem(`argus.split.${id}`, String(size)); }, [id, size]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current || !wrapRef.current) return;
      e.preventDefault();
      const r = wrapRef.current.getBoundingClientRect();
      const raw = vertical ? e.clientY - r.top : e.clientX - r.left;
      const limit = (vertical ? r.height : r.width) - min;
      setSize(Math.max(min, Math.min(max ?? limit, raw)));
    };
    const onUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = ''; document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [vertical, min, max]);

  const startDrag = () => {
    dragging.current = true;
    document.body.style.cursor = vertical ? 'row-resize' : 'col-resize';
    document.body.style.userSelect = 'none';
  };
  const nudge = (delta: number) => setSize(s => Math.max(min, s + delta));
  const Less = vertical ? ChevronUp : ChevronLeft;
  const More = vertical ? ChevronDown : ChevronRight;

  return (
    <div ref={wrapRef} className={vertical ? 'col' : 'row'} style={{ flex: 1, minHeight: 0, minWidth: 0, display: 'flex', flexDirection: vertical ? 'column' : 'row' }}>
      <div style={vertical
        ? { height: size, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }
        : { width: size, minWidth: 0, display: 'flex', overflow: 'hidden' }}>{first}</div>

      <div
        onMouseDown={startDrag}
        onDoubleClick={() => setSize(initial)}
        title="Arraste para redimensionar · duplo-clique restaura"
        className="split-bar"
        style={{
          flexShrink: 0, position: 'relative', background: 'var(--panel2)',
          borderTop: vertical ? '1px solid var(--b1)' : undefined, borderBottom: vertical ? '1px solid var(--b1)' : undefined,
          borderLeft: !vertical ? '1px solid var(--b1)' : undefined, borderRight: !vertical ? '1px solid var(--b1)' : undefined,
          cursor: vertical ? 'row-resize' : 'col-resize',
          height: vertical ? 9 : 'auto', width: vertical ? 'auto' : 9,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2,
        }}>
        <button className="split-btn" title="Diminuir" onMouseDown={e => { e.stopPropagation(); nudge(-60); }}><Less size={10} /></button>
        <span style={{ width: vertical ? 26 : 2, height: vertical ? 2 : 26, background: 'var(--b3)', borderRadius: 2 }} />
        <button className="split-btn" title="Aumentar" onMouseDown={e => { e.stopPropagation(); nudge(60); }}><More size={10} /></button>
      </div>

      <div style={{ flex: 1, minHeight: 0, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>{second}</div>
    </div>
  );
}
