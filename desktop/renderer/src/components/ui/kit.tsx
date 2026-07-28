import type { ReactNode } from 'react';
import { toneVar, type Tone } from '@/lib/fmt';

/** Badge estilo ZombieKeeper (.badge com borda + bg tingido). */
export function Badge({ children, tone = 'dim', dot }: { children: ReactNode; tone?: Tone; dot?: boolean }) {
  const c = toneVar[tone];
  return (
    <span className="badge" style={{ color: c, borderColor: c, background: 'color-mix(in srgb, ' + c + ' 14%, transparent)' }}>
      {dot && <i style={{ width: 6, height: 6, borderRadius: '50%', background: c, display: 'inline-block', marginRight: 4 }} />}
      {children}
    </span>
  );
}

/** Caixa de estatística (.stat-box). */
export function StatBox({ label, value, meta, tone }: { label: string; value: ReactNode; meta?: ReactNode; tone?: Tone }) {
  return (
    <div className="stat-box">
      <div className="stat-box-lbl">{label}</div>
      <div className="stat-box-val" style={tone ? { color: toneVar[tone] } : undefined}>{value}</div>
      {meta && <div className="stat-box-meta" style={{ color: 'var(--tx2)' }}>{meta}</div>}
    </div>
  );
}

/** Painel com cabeçalho de seção (.sec-hdr). */
export function Panel({ title, right, children, style }: { title?: ReactNode; right?: ReactNode; children: ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="col" style={{ border: '1px solid var(--b2)', background: 'var(--panel)', minHeight: 0, ...style }}>
      {title && (
        <div className="sec-hdr">
          <span>{title}</span>
          {right}
        </div>
      )}
      <div className="fill scroll-y">{children}</div>
    </div>
  );
}

/** Cabeçalho de página. */
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="row" style={{ justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--b1)', flexShrink: 0 }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--tx0)' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11, color: 'var(--tx2)', marginTop: 2 }}>{subtitle}</div>}
      </div>
      {actions && <div className="row" style={{ gap: 6 }}>{actions}</div>}
    </div>
  );
}

/** Tabela estilo ZombieKeeper (.zk-table). `rows` = matriz de células. */
export function Table({ cols, children }: { cols: string[]; children: ReactNode }) {
  return (
    <table className="zk-table">
      <thead><tr>{cols.map((c, i) => <th key={i}>{c}</th>)}</tr></thead>
      <tbody>{children}</tbody>
    </table>
  );
}

export function Btn({ children, onClick, variant, title }: { children: ReactNode; onClick?: () => void; variant?: 'primary' | 'danger'; title?: string }) {
  return <button className={'zk-btn' + (variant ? ' ' + variant : '')} onClick={onClick} title={title}>{children}</button>;
}

/** Barra de progresso fina com cor por uso. */
export function Meter({ value }: { value: number }) {
  const c = value >= 90 ? 'var(--red-hi)' : value >= 70 ? 'var(--orange)' : 'var(--green)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ flex: 1, height: 4, background: 'var(--inset)', border: '1px solid var(--b1)' }}>
        <div style={{ width: `${Math.min(100, value)}%`, height: '100%', background: c }} />
      </div>
      <span className="mono" style={{ fontSize: 11, color: 'var(--tx1)', minWidth: 34, textAlign: 'right' }}>{Math.round(value)}%</span>
    </div>
  );
}
