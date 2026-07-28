import { useEffect, useRef, useState } from 'react';

export interface KNode { id: string; label: string; cat: string; color: string; weight?: number }
export interface KEdge { a: string; b: string }

interface Sim extends KNode { x: number; y: number; vx: number; vy: number; r: number }

/**
 * Grafo de conhecimento estilo Obsidian — força-dirigido em Canvas com COOLING
 * (estabiliza, sem tremor), links curvos com brilho, nós dimensionados pelo grau,
 * hover destaca a vizinhança, duplo-clique foca. Filtro por categoria.
 */
export default function KnowledgeGraph({ nodes, edges }: { nodes: KNode[]; edges: KEdge[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cats, setCats] = useState<{ cat: string; color: string; on: boolean }[]>([]);
  const filterRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const seen = new Map<string, string>();
    nodes.forEach(n => { if (!seen.has(n.cat)) seen.set(n.cat, n.color); });
    setCats(Array.from(seen, ([cat, color]) => ({ cat, color, on: true })));
  }, [nodes]);

  useEffect(() => {
    const wrap = wrapRef.current!, canvas = canvasRef.current!, ctx = canvas.getContext('2d')!;
    let W = 0, H = 0; const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const byId = new Map<string, Sim>();
    const sims: Sim[] = nodes.map((n, i) => {
      const a = (i / nodes.length) * Math.PI * 2, R = 60 + (i % 9) * 24;
      const s: Sim = { ...n, x: Math.cos(a) * R, y: Math.sin(a) * R, vx: 0, vy: 0, r: 4 };
      byId.set(n.id, s); return s;
    });
    const deg = new Map<string, number>();
    edges.forEach(e => { deg.set(e.a, (deg.get(e.a) ?? 0) + 1); deg.set(e.b, (deg.get(e.b) ?? 0) + 1); });
    sims.forEach(s => { s.r = 4 + Math.min(10, (deg.get(s.id) ?? 0)) * 1.5; });

    let tx = 0, ty = 0, scale = 1, inited = false, phase = 0, alpha = 1, userMoved = false, fitted = false;
    let hover: Sim | null = null, drag: Sim | null = null, panning = false, mx = 0, my = 0, lx = 0, ly = 0;
    let focusTarget: { x: number; y: number; s: number } | null = null;

    const shown = (s: Sim) => !filterRef.current.has(s.cat);
    const near = (s: Sim | null) => { const set = new Set<string>(); if (!s) return set; set.add(s.id); edges.forEach(e => { if (e.a === s.id) set.add(e.b); if (e.b === s.id) set.add(e.a); }); return set; };
    const nodeAt = (sx: number, sy: number) => { const wx = (sx - tx) / scale, wy = (sy - ty) / scale; let best: Sim | null = null; for (const s of sims) if (shown(s) && Math.hypot(wx - s.x, wy - s.y) <= s.r + 4) best = s; return best; };
    const reheat = () => { alpha = Math.max(alpha, 0.6); fitted = false; };

    function resize() { const r = wrap.getBoundingClientRect(); W = r.width; H = r.height; canvas.width = W * dpr; canvas.height = H * dpr; canvas.style.width = W + 'px'; canvas.style.height = H + 'px'; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); if (!inited && W > 0) { tx = W / 2; ty = H / 2; inited = true; } }
    const ro = new ResizeObserver(resize); ro.observe(wrap); resize();

    function step() {
      if (alpha < 0.02 && !drag) return;
      const vis = sims.filter(shown);
      const fx = new Map<Sim, number>(), fy = new Map<Sim, number>();
      vis.forEach(s => { fx.set(s, 0); fy.set(s, 0); });
      for (let i = 0; i < vis.length; i++) for (let j = i + 1; j < vis.length; j++) {
        const a = vis[i], b = vis[j]; let dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy + 0.01;
        const f = 7000 / d2, d = Math.sqrt(d2), ux = dx / d, uy = dy / d;
        fx.set(a, fx.get(a)! + ux * f); fy.set(a, fy.get(a)! + uy * f); fx.set(b, fx.get(b)! - ux * f); fy.set(b, fy.get(b)! - uy * f);
      }
      edges.forEach(e => { const a = byId.get(e.a), b = byId.get(e.b); if (!a || !b || !fx.has(a) || !fx.has(b)) return; let dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) + 0.01; const f = (d - 74) * 0.02, ux = dx / d, uy = dy / d; fx.set(a, fx.get(a)! + ux * f); fy.set(a, fy.get(a)! + uy * f); fx.set(b, fx.get(b)! - ux * f); fy.set(b, fy.get(b)! - uy * f); });
      vis.forEach(s => { if (s === drag) { s.vx = s.vy = 0; return; } const ax = fx.get(s)! - s.x * 0.012, ay = fy.get(s)! - s.y * 0.012; s.vx = (s.vx + ax * 0.05 * alpha) * 0.84; s.vy = (s.vy + ay * 0.05 * alpha) * 0.84; s.x += s.vx; s.y += s.vy; });
      alpha *= 0.985;
    }
    function fitOnce() {
      if (fitted || userMoved || W < 40) return;
      const vis = sims.filter(shown); if (!vis.length) return;
      let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
      vis.forEach(s => { minX = Math.min(minX, s.x); maxX = Math.max(maxX, s.x); minY = Math.min(minY, s.y); maxY = Math.max(maxY, s.y); });
      const pad = 70, sx = (W - pad * 2) / Math.max(1, maxX - minX), sy = (H - pad * 2) / Math.max(1, maxY - minY);
      const target = Math.max(0.35, Math.min(1.4, Math.min(sx, sy)));
      scale += (target - scale) * 0.08; const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
      tx += (W / 2 - cx * scale - tx) * 0.08; ty += (H / 2 - cy * scale - ty) * 0.08;
      if (alpha < 0.1) fitted = true;
    }
    const rgba = (hex: string, a: number) => { const h = hex.replace('#', ''); const n = parseInt(h.slice(0, 6), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };
    const css = (v: string) => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || '#888';

    function draw() {
      phase += 0.01; ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = css('--inset'); ctx.fillRect(0, 0, W, H);
      if (focusTarget) { tx += (focusTarget.x - tx) * 0.12; ty += (focusTarget.y - ty) * 0.12; scale += (focusTarget.s - scale) * 0.12; if (Math.hypot(focusTarget.x - tx, focusTarget.y - ty) < 1) focusTarget = null; }
      ctx.save(); ctx.translate(tx, ty); ctx.scale(scale, scale);
      const nb = near(hover);
      edges.forEach(e => {
        const a = byId.get(e.a), b = byId.get(e.b); if (!a || !b || !shown(a) || !shown(b)) return;
        const lit = !hover || (nb.has(a.id) && nb.has(b.id));
        const mx2 = (a.x + b.x) / 2, my2 = (a.y + b.y) / 2 - Math.hypot(b.x - a.x, b.y - a.y) * 0.06;
        ctx.strokeStyle = rgba(css('--tx1'), lit ? 0.24 : 0.04); ctx.lineWidth = (lit ? 1 : 0.5) / scale;
        if (lit && hover) { ctx.shadowColor = a.color; ctx.shadowBlur = 4; }
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(mx2, my2, b.x, b.y); ctx.stroke(); ctx.shadowBlur = 0;
      });
      sims.forEach(s => {
        if (!shown(s)) return;
        const hot = hover === s, dim = hover && !nb.has(s.id);
        ctx.fillStyle = rgba(s.color, dim ? 0.1 : hot ? 0.42 : 0.22); ctx.beginPath(); ctx.arc(s.x, s.y, s.r + (hot ? 7 : 5), 0, 7); ctx.fill();
        if (hot) { ctx.shadowColor = s.color; ctx.shadowBlur = 14; }
        ctx.fillStyle = dim ? rgba(s.color, 0.4) : s.color; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
        const showLabel = hot || s.r > 9 || (hover && nb.has(s.id));
        if (showLabel && !dim) { ctx.fillStyle = css('--tx0'); ctx.font = `${hot ? 700 : 500} ${11 / scale}px ui-monospace, monospace`; ctx.textAlign = 'center'; ctx.fillText(s.label, s.x, s.y - s.r - 5 / scale); }
      });
      ctx.restore();
      step(); fitOnce(); raf = requestAnimationFrame(draw);
    }
    let raf = requestAnimationFrame(draw);

    const onMove = (e: MouseEvent) => { const r = canvas.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; if (drag) { drag.x = (mx - tx) / scale; drag.y = (my - ty) / scale; reheat(); } else if (panning) { tx += mx - lx; ty += my - ly; userMoved = true; fitted = true; lx = mx; ly = my; } else { const h = nodeAt(mx, my); if (h !== hover) { hover = h; canvas.style.cursor = h ? 'pointer' : 'grab'; } } };
    const onDown = (e: MouseEvent) => { const r = canvas.getBoundingClientRect(); mx = lx = e.clientX - r.left; my = ly = e.clientY - r.top; const n = nodeAt(mx, my); if (n) drag = n; else { panning = true; canvas.style.cursor = 'grabbing'; } };
    const onUp = () => { drag = null; panning = false; canvas.style.cursor = 'grab'; };
    const onDbl = (e: MouseEvent) => { const r = canvas.getBoundingClientRect(); const n = nodeAt(e.clientX - r.left, e.clientY - r.top); if (!n) return; const s = 1.8; focusTarget = { x: W / 2 - n.x * s, y: H / 2 - n.y * s, s }; userMoved = true; fitted = true; };
    const onWheel = (e: WheelEvent) => { e.preventDefault(); const r = canvas.getBoundingClientRect(), cx = e.clientX - r.left, cy = e.clientY - r.top; const f = e.deltaY < 0 ? 1.1 : 1 / 1.1, ns = Math.max(0.25, Math.min(3, scale * f)), k = ns / scale; tx = cx - (cx - tx) * k; ty = cy - (cy - ty) * k; scale = ns; userMoved = true; fitted = true; };
    canvas.addEventListener('mousemove', onMove); canvas.addEventListener('mousedown', onDown); window.addEventListener('mouseup', onUp);
    canvas.addEventListener('dblclick', onDbl); canvas.addEventListener('wheel', onWheel, { passive: false });
    (canvas as any).__reheat = reheat;
    return () => { cancelAnimationFrame(raf); ro.disconnect(); canvas.removeEventListener('mousemove', onMove); canvas.removeEventListener('mousedown', onDown); window.removeEventListener('mouseup', onUp); canvas.removeEventListener('dblclick', onDbl); canvas.removeEventListener('wheel', onWheel); };
  }, [nodes, edges]);

  const toggle = (cat: string) => {
    setCats(cs => cs.map(c => c.cat === cat ? { ...c, on: !c.on } : c));
    const set = filterRef.current; set.has(cat) ? set.delete(cat) : set.add(cat);
    (canvasRef.current as any)?.__reheat?.();
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', minHeight: 460 }}>
      <div ref={wrapRef} style={{ width: '100%', height: '100%', minHeight: 460, position: 'relative' }}><canvas ref={canvasRef} /></div>
      <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-end' }}>
        {cats.map(c => (
          <button key={c.cat} onClick={() => toggle(c.cat)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '2px 7px', fontSize: 10, background: c.on ? 'var(--panel2)' : 'transparent', border: '1px solid var(--b2)', color: c.on ? 'var(--tx1)' : 'var(--tx3)', opacity: c.on ? 1 : 0.5, cursor: 'pointer', fontFamily: 'ui-monospace, monospace' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.color }} /> {c.cat}
          </button>
        ))}
      </div>
      <div style={{ position: 'absolute', bottom: 8, left: 10, fontSize: 10, color: 'var(--tx3)', fontFamily: 'ui-monospace, monospace', pointerEvents: 'none' }}>arraste · roda=zoom · duplo=focar · categorias→filtrar</div>
    </div>
  );
}
