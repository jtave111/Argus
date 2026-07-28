import { useMemo } from 'react';

export interface Series { label: string; color: string; data: number[] }

/**
 * Gráfico de área profissional (SVG): grade, eixo Y rotulado, legenda com valor atual,
 * e estatísticas (atual / pico / média) por série. Escala fixa 0..max (default 100).
 */
export default function AreaChart({ series, max = 100, unit = '%', height = 200, gridLines = 4 }: {
  series: Series[]; max?: number; unit?: string; height?: number; gridLines?: number;
}) {
  const W = 1000, padL = 40, padR = 12, padT = 12, padB = 22;
  const plotW = W - padL - padR, plotH = height - padT - padB;
  const n = Math.max(...series.map(s => s.data.length), 2);

  const paths = useMemo(() => series.map(s => {
    const step = plotW / (n - 1);
    const pts = s.data.map((v, i) => {
      const x = padL + i * step;
      const y = padT + plotH * (1 - Math.min(v, max) / max);
      return [x, y] as const;
    });
    const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
    const area = `${line} L${padL + (pts.length - 1) * step} ${padT + plotH} L${padL} ${padT + plotH} Z`;
    const cur = s.data.length ? s.data[s.data.length - 1] : 0;
    const peak = s.data.length ? Math.max(...s.data) : 0;
    const avg = s.data.length ? s.data.reduce((a, b) => a + b, 0) / s.data.length : 0;
    return { line, area, last: pts[pts.length - 1], cur, peak, avg, color: s.color, label: s.label };
  }), [series, height, max]);

  return (
    <div style={{ padding: 12 }}>
      {/* legenda + estatísticas */}
      <div className="row" style={{ gap: 18, marginBottom: 8, flexWrap: 'wrap' }}>
        {paths.map(p => (
          <div key={p.label} className="row" style={{ gap: 8 }}>
            <span style={{ width: 10, height: 10, background: p.color, borderRadius: 2 }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--tx0)' }}>{p.label}</span>
            <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: p.color }}>{Math.round(p.cur)}{unit}</span>
            <span className="mono" style={{ fontSize: 10, color: 'var(--tx2)' }}>pico {Math.round(p.peak)}{unit} · méd {Math.round(p.avg)}{unit}</span>
          </div>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${height}`} style={{ width: '100%', height }} preserveAspectRatio="none">
        <defs>
          {paths.map((p, i) => (
            <linearGradient key={i} id={`ac${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={p.color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={p.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
        {/* grade + eixo Y */}
        {Array.from({ length: gridLines + 1 }, (_, i) => {
          const val = max - (max / gridLines) * i;
          const y = padT + (plotH / gridLines) * i;
          return (
            <g key={i}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              <text x={padL - 6} y={y + 3} textAnchor="end" fontSize="10" fill="var(--tx3)" fontFamily="ui-monospace, monospace">{Math.round(val)}{unit}</text>
            </g>
          );
        })}
        {/* séries */}
        {paths.map((p, i) => (
          <g key={i}>
            <path d={p.area} fill={`url(#ac${i})`} />
            <path d={p.line} fill="none" stroke={p.color} strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            {p.last && <circle cx={p.last[0]} cy={p.last[1]} r="3" fill={p.color} />}
          </g>
        ))}
        <text x={W - padR} y={height - 6} textAnchor="end" fontSize="10" fill="var(--tx3)" fontFamily="ui-monospace, monospace">agora →</text>
        <text x={padL} y={height - 6} textAnchor="start" fontSize="10" fill="var(--tx3)" fontFamily="ui-monospace, monospace">← {n} min</text>
      </svg>
    </div>
  );
}
