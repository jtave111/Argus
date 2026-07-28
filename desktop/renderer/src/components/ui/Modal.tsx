import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

/**
 * Diálogo modal estilo IDE (overlay escuro + painel quadrado ZombieKeeper).
 * ESC fecha, clique no backdrop fecha. Rodapé fixo com ações.
 */
export function Modal({ title, subtitle, onClose, children, footer, width = 560 }: {
  title: ReactNode; subtitle?: ReactNode; onClose: () => void; children: ReactNode; footer?: ReactNode; width?: number;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div onMouseDown={onClose} style={{ position: 'fixed', inset: 0, zIndex: 5000, background: 'rgba(0,0,0,.62)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(1.5px)' }}>
      <div onMouseDown={e => e.stopPropagation()} className="col" style={{ width, maxWidth: '96vw', maxHeight: '92vh', background: 'var(--panel)', border: '1px solid var(--b3)', boxShadow: '0 18px 60px rgba(0,0,0,.55)' }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', padding: '11px 14px', borderBottom: '1px solid var(--b2)', background: 'var(--panel2)' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx0)' }}>{title}</div>
            {subtitle && <div style={{ fontSize: 11, color: 'var(--tx2)', marginTop: 2 }}>{subtitle}</div>}
          </div>
          <button className="zk-btn" onClick={onClose} style={{ padding: 4 }} title="Fechar (Esc)"><X size={14} /></button>
        </div>
        <div className="fill scroll-y" style={{ padding: 14 }}>{children}</div>
        {footer && <div className="row" style={{ justifyContent: 'flex-end', gap: 8, padding: '10px 14px', borderTop: '1px solid var(--b2)', background: 'var(--panel2)' }}>{footer}</div>}
      </div>
    </div>
  );
}

/** Diálogo de confirmação (ex.: exclusão). */
export function Confirm({ title, message, confirmLabel = 'Confirmar', danger, onConfirm, onCancel }: {
  title: string; message: ReactNode; confirmLabel?: string; danger?: boolean; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <Modal title={title} onClose={onCancel} width={420}
      footer={<>
        <button className="zk-btn" onClick={onCancel}>Cancelar</button>
        <button className={'zk-btn ' + (danger ? 'danger' : 'primary')} onClick={onConfirm}>{confirmLabel}</button>
      </>}>
      <div style={{ fontSize: 13, color: 'var(--tx1)', lineHeight: 1.6 }}>{message}</div>
    </Modal>
  );
}
