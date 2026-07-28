import { useEffect, useRef, useState } from 'react';

export interface GNode {
  id: string; label: string; kind: 'org' | 'branch' | 'network' | 'device' | 'agent';
  color: string; parent: string | null; sub?: string;
}
export interface GEdge { a: string; b: string }

interface Sim extends GNode {
  x: number; y: number; vx: number; vy: number; r: number; fixed: boolean; hasChildren: boolean; childCount: number;
}

const RADIUS: Record<GNode['kind'], number> = { org: 24, branch: 16, network: 11, device: 7, agent: 4.5 };
const IDEAL: Record<string, number> = { branch: 170, network: 95, device: 56, agent: 26 };
const KIND_LBL: Record<GNode['kind'], string> = { org: 'Organização', branch: 'Filial', network: 'Rede', device: 'Dispositivo', agent: 'Agente' };

/**
 * Topologia force-directed (Canvas). Simulação com cooling (estabiliza, sem tremor),
 * começa colapsada no nível de rede (limpa), links curvos com brilho, formas distintas
 * por tipo, hover destaca a vizinhança, duplo-clique dá focus. Arrastar/zoom/pan.
 */
export default function ForceGraph({ nodes, edges, onOpenDevice }: { nodes: GNode[]; edges: GEdge[]; onOpenDevice?: (id: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hud, setHud] = useState<{ nodes: number; links: number }>({ nodes: 0, links: 0 });

  useEffect(() => {
    const canvas = canvasRef.current!, wrap = wrapRef.current!;
    const ctx = canvas.getContext('2d')!;
    let W = 0, H = 0; const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const byId = new Map<string, Sim>();
    const sims: Sim[] = nodes.map(n => {
      const s: Sim = { ...n, x: 0, y: 0, vx: 0, vy: 0, r: RADIUS[n.kind], fixed: n.kind === 'org', hasChildren: false, childCount: 0 };
      byId.set(n.id, s); return s;
    });
    const childrenOf = new Map<string, Sim[]>();
    sims.forEach(s => { if (s.parent) { const arr = childrenOf.get(s.parent) ?? []; arr.push(s); childrenOf.set(s.parent, arr); } });
    sims.forEach(s => { const kids = childrenOf.get(s.id) ?? []; s.hasChildren = kids.length > 0; s.childCount = countDesc(s.id); });
    function countDesc(id: string): number { const kids = childrenOf.get(id) ?? []; return kids.reduce((a, k) => a + 1 + countDesc(k.id), 0); }

    // começa colapsado nas REDES (esconde dispositivos/agentes) → visão limpa
    const collapsed = new Set<string>();
    sims.forEach(s => { if (s.kind === 'network') collapsed.add(s.id); });

    // layout inicial radial
    (function place(parentId: string | null, px: number, py: number, radius: number, a0: number, a1: number) {
      const kids = sims.filter(s => s.parent === parentId);
      kids.forEach((k, i) => {
        const a = kids.length === 1 ? (a0 + a1) / 2 : a0 + (a1 - a0) * (i / (kids.length - 1 || 1));
        k.x = px + Math.cos(a) * radius; k.y = py + Math.sin(a) * radius;
        place(k.id, k.x, k.y, radius * 0.55, a - 0.7, a + 0.7);
      });
    })(null, 0, 0, 210, 0, Math.PI * 2);

    let tx = 0, ty = 0, scale = 1, inited = false, phase = 0, alpha = 1, fitted = false;
    let hover: Sim | null = null, drag: Sim | null = null, panning = false;
    let mx = 0, my = 0, lastX = 0, lastY = 0, userMoved = false, focusTarget: { x: number; y: number; s: number } | null = null;

    const visible = (s: Sim): boolean => { let p = s.parent; while (p) { if (collapsed.has(p)) return false; p = byId.get(p)?.parent ?? null; } return true; };
    const neighbors = (s: Sim | null): Set<string> => { const set = new Set<string>(); if (!s) return set; set.add(s.id); edges.forEach(e => { if (e.a === s.id) set.add(e.b); if (e.b === s.id) set.add(e.a); }); return set; };
    const nodeAt = (sx: number, sy: number): Sim | null => { const wx = (sx - tx) / scale, wy = (sy - ty) / scale; let best: Sim | null = null; for (const s of sims) if (visible(s) && Math.hypot(wx - s.x, wy - s.y) <= s.r + 5) best = s; return best; };
    const reheat = () => { alpha = Math.max(alpha, 0.7); };

    function resize() { const rect = wrap.getBoundingClientRect(); W = rect.width; H = rect.height; canvas.width = W * dpr; canvas.height = H * dpr; canvas.style.width = W + 'px'; canvas.style.height = H + 'px'; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); if (!inited && W > 0) { tx = W / 2; ty = H / 2; inited = true; } }
    const ro = new ResizeObserver(resize); ro.observe(wrap); resize();

    function step() {
      if (alpha < 0.02 && !drag) return;              // esfriou → estável (economia)
      const vis = sims.filter(visible);
      const fx = new Map<Sim, number>(), fy = new Map<Sim, number>();
      vis.forEach(s => { fx.set(s, 0); fy.set(s, 0); });
      for (let i = 0; i < vis.length; i++) for (let j = i + 1; j < vis.length; j++) {
        const a = vis[i], b = vis[j];
        let dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy + 0.01;
        const f = 11000 / d2, d = Math.sqrt(d2), ux = dx / d, uy = dy / d;
        fx.set(a, fx.get(a)! + ux * f); fy.set(a, fy.get(a)! + uy * f); fx.set(b, fx.get(b)! - ux * f); fy.set(b, fy.get(b)! - uy * f);
      }
      edges.forEach(e => {
        const a = byId.get(e.a), b = byId.get(e.b);
        if (!a || !b || !fx.has(a) || !fx.has(b)) return;
        const deeper = a.kind === 'org' || b.kind === 'org' ? 'branch' : a.r < b.r ? a.kind : b.kind;
        const ideal = IDEAL[deeper] ?? 60;
        let dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) + 0.01;
        const f = (d - ideal) * 0.025, ux = dx / d, uy = dy / d;
        fx.set(a, fx.get(a)! + ux * f); fy.set(a, fy.get(a)! + uy * f); fx.set(b, fx.get(b)! - ux * f); fy.set(b, fy.get(b)! - uy * f);
      });
      vis.forEach(s => {
        if (s.fixed || s === drag) { s.vx = s.vy = 0; return; }
        const ax = fx.get(s)! - s.x * 0.006, ay = fy.get(s)! - s.y * 0.006;
        s.vx = (s.vx + ax * 0.05 * alpha) * 0.82; s.vy = (s.vy + ay * 0.05 * alpha) * 0.82;
        s.x += s.vx; s.y += s.vy;
      });
      alpha *= 0.985;                                 // cooling
    }

    function fitOnce() {
      if (fitted || userMoved) return;
      const vis = sims.filter(visible); if (!vis.length || W < 40) return;
      let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
      vis.forEach(s => { minX = Math.min(minX, s.x - s.r); maxX = Math.max(maxX, s.x + s.r); minY = Math.min(minY, s.y - s.r); maxY = Math.max(maxY, s.y + s.r); });
      const pad = 60, sx = (W - pad * 2) / Math.max(1, maxX - minX), sy = (H - pad * 2) / Math.max(1, maxY - minY);
      const target = Math.max(0.4, Math.min(1.3, Math.min(sx, sy)));
      scale += (target - scale) * 0.1; const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
      tx += (W / 2 - cx * scale - tx) * 0.1; ty += (H / 2 - cy * scale - ty) * 0.1;
      if (Math.abs(target - scale) < 0.01 && alpha < 0.15) fitted = true;
    }

    const css = (v: string) => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || '#888';

    function shape(s: Sim, r: number) {
      ctx.beginPath();
      if (s.kind === 'org') { for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3, x = s.x + Math.cos(a) * r, y = s.y + Math.sin(a) * r; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.closePath(); }
      else if (s.kind === 'branch') { ctx.rect(s.x - r, s.y - r, r * 2, r * 2); }
      else if (s.kind === 'network') { ctx.moveTo(s.x, s.y - r); ctx.lineTo(s.x + r, s.y); ctx.lineTo(s.x, s.y + r); ctx.lineTo(s.x - r, s.y); ctx.closePath(); }
      else { ctx.arc(s.x, s.y, r, 0, 7); }
    }

    function draw() {
      phase += 0.02; ctx.clearRect(0, 0, W, H);
      // fundo com vinheta sutil
      ctx.fillStyle = css('--inset'); ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(255,255,255,0.025)'; ctx.lineWidth = 1;
      for (let x = ((tx % 40) + 40) % 40; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = ((ty % 40) + 40) % 40; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      if (focusTarget) { tx += (focusTarget.x - tx) * 0.12; ty += (focusTarget.y - ty) * 0.12; scale += (focusTarget.s - scale) * 0.12; if (Math.hypot(focusTarget.x - tx, focusTarget.y - ty) < 1) focusTarget = null; }

      ctx.save(); ctx.translate(tx, ty); ctx.scale(scale, scale);
      const near = neighbors(hover);

      // arestas curvas com brilho
      edges.forEach(e => {
        const a = byId.get(e.a), b = byId.get(e.b);
        if (!a || !b || !visible(a) || !visible(b)) return;
        const lit = !hover || (near.has(a.id) && near.has(b.id));
        const backbone = a.kind === 'org' || b.kind === 'org';
        const mx2 = (a.x + b.x) / 2, my2 = (a.y + b.y) / 2 - Math.hypot(b.x - a.x, b.y - a.y) * 0.08;
        ctx.strokeStyle = hexA(b.color, lit ? (backbone ? 0.5 : 0.32) : 0.06);
        ctx.lineWidth = (lit ? (backbone ? 2 : 1.2) : 0.7) / scale;
        if (lit && backbone) { ctx.shadowColor = b.color; ctx.shadowBlur = 6; }
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(mx2, my2, b.x, b.y); ctx.stroke();
        ctx.shadowBlur = 0;
        if (backbone && lit) { const t = (phase + (a.x + b.x) * 0.002) % 1, u = 1 - t; const px = u * u * a.x + 2 * u * t * mx2 + t * t * b.x, py = u * u * a.y + 2 * u * t * my2 + t * t * b.y; ctx.fillStyle = css('--red-hi'); ctx.beginPath(); ctx.arc(px, py, 2.5 / scale, 0, 7); ctx.fill(); }
      });

      // nós
      sims.forEach(s => {
        if (!visible(s)) return;
        const hot = hover === s, dim = hover && !near.has(s.id);
        if (s.kind === 'org') { const pulse = 6 + 4 * Math.sin(phase * 2 * Math.PI); ctx.fillStyle = hexA(s.color, 0.10); ctx.beginPath(); ctx.arc(s.x, s.y, s.r + pulse, 0, 7); ctx.fill(); }
        // halo
        ctx.fillStyle = hexA(s.color, dim ? 0.06 : hot ? 0.3 : 0.16); shape(s, s.r + (hot ? 6 : 4)); ctx.fill();
        // corpo
        ctx.fillStyle = css('--panel'); shape(s, s.r); ctx.fill();
        if (hot) { ctx.shadowColor = s.color; ctx.shadowBlur = 12; }
        ctx.strokeStyle = dim ? hexA(s.color, 0.35) : s.color; ctx.lineWidth = (hot ? 2.4 : 1.6) / scale; shape(s, s.r); ctx.stroke();
        ctx.shadowBlur = 0;
        // badge de colapsado (+N)
        if (s.hasChildren && collapsed.has(s.id)) {
          ctx.fillStyle = s.color; ctx.font = `700 ${8 / scale}px ui-monospace, monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('+' + s.childCount, s.x, s.y); ctx.textBaseline = 'alphabetic';
        }
        // rótulo
        const showLbl = s.kind === 'org' || s.kind === 'branch' || s.kind === 'network' || hot;
        if (showLbl && (!hover || near.has(s.id) || hover === s) && !dim && s.label) {
          ctx.fillStyle = css('--tx0'); ctx.font = `${s.kind === 'org' ? 700 : 600} ${11 / scale}px ui-monospace, monospace`; ctx.textAlign = 'center';
          ctx.fillText(s.label, s.x, s.y - s.r - 6 / scale);
        }
      });
      ctx.restore();

      step(); fitOnce();
      raf = requestAnimationFrame(draw);
    }
    let raf = requestAnimationFrame(draw);
    setHud({ nodes: sims.filter(visible).length, links: edges.length });
    const refreshHud = () => setHud({ nodes: sims.filter(visible).length, links: edges.filter(e => { const a = byId.get(e.a), b = byId.get(e.b); return a && b && visible(a) && visible(b); }).length });

    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top;
      if (drag) { drag.x = (mx - tx) / scale; drag.y = (my - ty) / scale; drag.vx = drag.vy = 0; reheat(); }
      else if (panning) { tx += mx - lastX; ty += my - lastY; userMoved = true; fitted = true; lastX = mx; lastY = my; }
      else { const h = nodeAt(mx, my); if (h !== hover) { hover = h; canvas.style.cursor = h ? 'pointer' : 'grab'; } }
    };
    const onDown = (e: MouseEvent) => { const r = canvas.getBoundingClientRect(); mx = lastX = e.clientX - r.left; my = lastY = e.clientY - r.top; const n = nodeAt(mx, my); if (n) { drag = n; n.fixed = true; } else { panning = true; canvas.style.cursor = 'grabbing'; } };
    const onUp = () => { if (drag && drag.kind !== 'org') drag.fixed = false; drag = null; panning = false; canvas.style.cursor = 'grab'; };
    const onClick = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect(); const n = nodeAt(e.clientX - r.left, e.clientY - r.top); if (!n) return;
      if (n.hasChildren) { collapsed.has(n.id) ? collapsed.delete(n.id) : collapsed.add(n.id); reheat(); refreshHud(); }
    };
    const onDbl = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect(); const n = nodeAt(e.clientX - r.left, e.clientY - r.top); if (!n) return;
      if (n.kind === 'device' && onOpenDevice) { onOpenDevice(n.id); return; }
      const s = 1.6; focusTarget = { x: W / 2 - n.x * s, y: H / 2 - n.y * s, s }; userMoved = true; fitted = true;
    };
    const onWheel = (e: WheelEvent) => { e.preventDefault(); const r = canvas.getBoundingClientRect(), cxp = e.clientX - r.left, cyp = e.clientY - r.top; const f = e.deltaY < 0 ? 1.12 : 1 / 1.12, ns = Math.max(0.25, Math.min(4, scale * f)), k = ns / scale; tx = cxp - (cxp - tx) * k; ty = cyp - (cyp - ty) * k; scale = ns; userMoved = true; fitted = true; };
    canvas.addEventListener('mousemove', onMove); canvas.addEventListener('mousedown', onDown); window.addEventListener('mouseup', onUp);
    canvas.addEventListener('click', onClick); canvas.addEventListener('dblclick', onDbl); canvas.addEventListener('wheel', onWheel, { passive: false });

    return () => { cancelAnimationFrame(raf); ro.disconnect(); canvas.removeEventListener('mousemove', onMove); canvas.removeEventListener('mousedown', onDown); window.removeEventListener('mouseup', onUp); canvas.removeEventListener('click', onClick); canvas.removeEventListener('dblclick', onDbl); canvas.removeEventListener('wheel', onWheel); };
  }, [nodes, edges]);

  return (
    <div ref={wrapRef} style={{ width: '100%', height: '100%', minHeight: 420, position: 'relative' }}>
      <canvas ref={canvasRef} />
      <div style={{ position: 'absolute', top: 8, left: 10, fontSize: 10, color: 'var(--tx3)', fontFamily: 'ui-monospace, monospace', pointerEvents: 'none' }}>
        {hud.nodes} nós · {hud.links} enlaces · clique=expandir · duplo=focar/abrir
      </div>
    </div>
  );
}

function hexA(hex: string, a: number): string { const h = hex.replace('#', ''); if (h.length < 6) return hex; const n = parseInt(h.slice(0, 6), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; }
