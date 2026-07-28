import type { ReactNode } from 'react';

/** Linha de rótulo + campo, com hint e mensagem de erro. */
export function Field({ label, required, hint, error, children }: {
  label: string; required?: boolean; hint?: string; error?: string; children: ReactNode;
}) {
  return (
    <label className="col" style={{ gap: 4, marginBottom: 12 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--tx1)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
        {label}{required && <span style={{ color: 'var(--red-hi)', marginLeft: 3 }}>*</span>}
      </span>
      {children}
      {error ? <span style={{ fontSize: 10.5, color: 'var(--red-hi)' }}>{error}</span>
        : hint ? <span style={{ fontSize: 10.5, color: 'var(--tx3)' }}>{hint}</span> : null}
    </label>
  );
}

/** Grade de 2 colunas para agrupar campos. */
export function FormGrid({ children, cols = 2 }: { children: ReactNode; cols?: number }) {
  return <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '0 12px' }}>{children}</div>;
}

/** Cabeçalho de seção dentro de um formulário. */
export function FormSection({ title }: { title: string }) {
  return <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--tx2)', textTransform: 'uppercase', letterSpacing: '.06em', margin: '6px 0 10px', paddingBottom: 5, borderBottom: '1px solid var(--b1)' }}>{title}</div>;
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  const { invalid, ...rest } = props;
  return <input {...rest} className={'zk-input' + (invalid ? ' invalid' : '')} />;
}

export function Select({ invalid, children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return <select {...rest} className={'zk-input' + (invalid ? ' invalid' : '')}>{children}</select>;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className="zk-input" style={{ resize: 'vertical', minHeight: 60, ...props.style }} />;
}

/** Toggle switch. */
export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <div className="row" style={{ gap: 8, alignItems: 'center', cursor: 'pointer' }} onClick={() => onChange(!checked)}>
      <div style={{ width: 32, height: 17, borderRadius: 9, background: checked ? 'var(--red)' : 'var(--inset)', border: '1px solid ' + (checked ? 'var(--red)' : 'var(--b3)'), position: 'relative', transition: 'all .15s', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: 1, left: checked ? 16 : 1, width: 13, height: 13, borderRadius: '50%', background: checked ? '#fff' : 'var(--tx2)', transition: 'all .15s' }} />
      </div>
      {label && <span style={{ fontSize: 12, color: 'var(--tx1)' }}>{label}</span>}
    </div>
  );
}
