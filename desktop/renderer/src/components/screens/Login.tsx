import { useEffect, useRef, useState } from 'react';

/**
 * Tela de login do Argus — tema escuro ZombieKeeper.
 *
 * Palco à esquerda: o OCELO (o "olho da pena do pavão" — a marca do Argus) desenhado em
 * canvas com relevo 3D, franjas de gravura, inclinação seguindo o mouse e a pupila
 * vermelha PISCANDO. Wordmark em prompt de terminal (`argus:~# panoptes`) que digita.
 * Card de acesso à direita no padrão do sistema (monospace, cantos retos, acento vermelho).
 *
 * CSS escopado sob `.lgn` para não colidir com globals.css.
 */
export default function Login({ onLogin }: { onLogin: (user: string) => void }) {
  const stageEye = useRef<HTMLCanvasElement>(null);
  const logoEye = useRef<HTMLCanvasElement>(null);
  const typedRef = useRef<HTMLSpanElement>(null);
  const [user, setUser] = useState('admin');
  const [pass, setPass] = useState('');
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    const reduce = matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches;
    const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
    const ease = (x: number) => 1 - Math.pow(1 - x, 3);
    const disposers: Array<() => void> = [];

    function mountEye(canvas: HTMLCanvasElement, size: number, interactive: boolean) {
      const INK = '#cbc4b5', RED = '#cc4444';
      const ctx = canvas.getContext('2d')!;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      let w = 0, h = 0;
      const fit = () => {
        w = canvas.clientWidth || size; h = canvas.clientHeight || size;
        canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      fit();
      const ro = new ResizeObserver(fit); ro.observe(canvas);
      const S = size, k = S / 120, fov = S * 3.2, DOME = S * 0.16;
      const t0 = performance.now(); let reset = t0, mx = 0, my = 0, tmx = 0, tmy = 0, raf = 0;
      const onMove = (e: MouseEvent | Touch) => { tmx = cl(e.clientX / innerWidth - 0.5, -.5, .5); tmy = cl(e.clientY / innerHeight - 0.5, -.5, .5); };
      const mm = (e: MouseEvent) => onMove(e);
      const tm = (e: TouchEvent) => { const t = e.touches[0]; if (t) onMove(t); };
      const clk = () => { reset = performance.now(); };
      if (interactive) {
        addEventListener('mousemove', mm); addEventListener('touchmove', tm, { passive: true });
        canvas.parentElement?.addEventListener('click', clk);
      }
      const T = (px: number, py: number, tx: number, ty: number): [number, number] => {
        const X = (px - 60) * k, Y = (py - 60) * k;
        const r = Math.hypot(X, Y), Rm = 42 * k, z0 = -DOME * (1 - cl(r / Rm, 0, 1) ** 2);
        const y1 = Y * Math.cos(tx) - z0 * Math.sin(tx), z1 = Y * Math.sin(tx) + z0 * Math.cos(tx);
        const x1 = X * Math.cos(ty) + z1 * Math.sin(ty), z2 = -X * Math.sin(ty) + z1 * Math.cos(ty);
        const s = fov / (fov + z2);
        return [w / 2 + x1 * s, h / 2 + y1 * s];
      };
      const ell = (rx: number, ry: number, tx: number, ty: number, frac: number) => {
        const p: [number, number][] = [], seg = 64, mm2 = Math.round(seg * frac);
        for (let i = 0; i <= mm2; i++) { const a = -Math.PI / 2 + i / seg * Math.PI * 2; p.push(T(60 + Math.cos(a) * rx, 60 + Math.sin(a) * ry, tx, ty)); }
        return p;
      };
      const poly = (pts: [number, number][], c: string, lw: number, op: number, close?: boolean) => {
        if (pts.length < 2) return;
        ctx.strokeStyle = c; ctx.globalAlpha = op; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
        ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); if (close) ctx.closePath(); ctx.stroke(); ctx.globalAlpha = 1;
      };
      const fillPts = (pts: [number, number][], c: string, op: number) => {
        ctx.fillStyle = c; ctx.globalAlpha = op; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
      };
      const frame = (now: number) => {
        const t = (now - t0) / 1000, T0 = reduce ? 3 : (now - reset) / 1000;
        mx += (tmx - mx) * 0.06; my += (tmy - my) * 0.06;
        const tx = (-0.10 - my * 0.55) + (reduce ? 0 : Math.sin(t * 0.5) * 0.03);
        const ty = (mx * 0.8) + (reduce ? 0 : Math.sin(t * 0.38) * 0.04);
        ctx.clearRect(0, 0, w, h);
        const asm = ease(cl(T0 / 1.5, 0, 1));
        const NB = 58;
        for (let i = 0; i < NB; i++) {
          const a = -Math.PI / 2 + i / NB * Math.PI * 2;
          const lp = ease(cl((T0 - i / NB * 0.5) / 0.7, 0, 1)); if (lp <= 0.02) continue;
          const jit = ((i * 37) % 11) / 11, len = (3 + 5 * jit) * lp, r0 = 41 + ((i * 53) % 5) * 0.4;
          poly([T(60 + Math.cos(a) * r0, 60 + Math.sin(a) * r0, tx, ty), T(60 + Math.cos(a) * (r0 + len), 60 + Math.sin(a) * (r0 + len), tx, ty)], INK, Math.max(.4, 0.7 * k), (0.10 + 0.14 * jit) * lp);
        }
        poly(ell(30, 38, tx, ty, asm), INK, 1.4 * k, 0.9, asm >= 1);
        const ai = ease(cl((T0 - 0.3) / 1.4, 0, 1)); poly(ell(20, 26, tx, ty, ai), INK, 1 * k, 0.75, ai >= 1);
        if (ai > 0.6) {
          const N: [number, number][] = []; for (let s = 0; s <= 8; s++) { const u = s / 8; N.push(T(60 + 10 * u, 34 + (8 * u * (1 - u) + 16 * u * u), tx, ty)); } poly(N, INK, 0.9 * k, 0.45);
          const N2: [number, number][] = []; for (let s = 0; s <= 8; s++) { const u = s / 8; N2.push(T(60 - 10 * u, 34 + (8 * u * (1 - u) + 16 * u * u), tx, ty)); } poly(N2, INK, 0.9 * k, 0.45);
        }
        const pp = ease(cl((T0 - 0.9) / 0.6, 0, 1));
        if (pp > 0.03) {
          poly(ell(14, 14, tx, ty, pp), INK, 0.6 * k, 0.35, true);
          poly(ell(17, 17, tx, ty, pp), INK, 0.5 * k, 0.20, true);
          const puls = reduce ? 1 : (0.5 + 0.5 * Math.sin(t * 2.6));
          const pr = 9.5 * pp * (0.92 + 0.10 * puls);
          const disc: [number, number][] = []; for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 2; disc.push(T(60 + Math.cos(a) * pr, 60 + Math.sin(a) * pr, tx, ty)); }
          fillPts(disc, RED, 0.35 + 0.6 * puls); poly(disc, '#6e2420', 0.8 * k, 0.4 + 0.4 * puls, true);
        }
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
      disposers.push(() => {
        cancelAnimationFrame(raf); ro.disconnect();
        if (interactive) { removeEventListener('mousemove', mm); removeEventListener('touchmove', tm); canvas.parentElement?.removeEventListener('click', clk); }
      });
    }

    if (stageEye.current) mountEye(stageEye.current, 420, true);
    if (logoEye.current) mountEye(logoEye.current, 34, false);

    const el = typedRef.current;
    if (el) {
      const s = 'panoptes';
      if (reduce) { el.textContent = s; }
      else { let i = 0; const tp = () => { if (i <= s.length) { el.textContent = s.slice(0, i); i++; setTimeout(tp, 95); } }; setTimeout(tp, 1600); }
    }
    return () => disposers.forEach(d => d());
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user.trim()) { setShake(true); setTimeout(() => setShake(false), 500); return; }
    setBusy(true);
    setTimeout(() => onLogin(user.trim()), 700);
  };

  return (
    <div className="lgn">
      <style>{CSS}</style>
      <div className="lgn-menubar">
        <span className="brand">ARGUS</span>
        <span className="mi">Arquivo</span><span className="mi">Exibir</span><span className="mi">Sistema</span>
        <span className="sp" /><span className="dot" /><span className="mi">aguardando autenticação</span>
      </div>

      <div className="lgn-body">
        <div className="lgn-stage">
          <div className="eye"><canvas ref={stageEye} /></div>
          <div className="sl" />
          <div className="fret"><span /><i>◈</i><span /></div>
          <div className="stagecap">
            <div className="wm"><span className="g">argus</span><span className="p">:~#</span> <span ref={typedRef} /><span className="cur" /></div>
            <div className="tg">o que tudo vê</div>
          </div>
        </div>

        <form className={'lgn-panel' + (shake ? ' shake' : '')} onSubmit={submit}>
          <div className="lg"><span className="m"><canvas ref={logoEye} /></span>
            <div><div className="t">Argus</div><div className="sub">Control Panel</div></div>
          </div>
          <div className="title">// autenticação</div>
          <div className="field"><label>Usuário</label>
            <div className="inp"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>
              <input value={user} onChange={e => setUser(e.target.value)} placeholder="usuário ou e-mail" autoComplete="username" /></div>
          </div>
          <div className="field"><label>Senha</label>
            <div className="inp"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="10" width="16" height="10" rx="1" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
              <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" autoComplete="current-password" /></div>
          </div>
          <div className="row">
            <label><input type="checkbox" defaultChecked /> Lembrar</label>
            <span className="lk">Esqueci a senha</span>
          </div>
          <button className="btn" type="submit" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </button>
          <div className="foot"><span className="g" /> conexão segura · gRPC/TLS · sessão auditada</div>
        </form>
      </div>

      <div className="lgn-status">
        <span>● Argus Control Panel</span><span>v1.0</span><span className="sp" />
        <span>gRPC :9090</span><span>TLS</span><span>pt-BR</span>
      </div>
    </div>
  );
}

const CSS = `
.lgn{position:fixed;inset:0;display:flex;flex-direction:column;background:#060608;color:#b6b4b8;
  font-family:"JetBrains Mono",ui-monospace,"SF Mono",Menlo,Consolas,monospace;-webkit-font-smoothing:antialiased;overflow:hidden;z-index:100}
.lgn *{box-sizing:border-box}
.lgn .lgn-menubar{height:30px;flex-shrink:0;display:flex;align-items:center;gap:16px;padding:0 12px;background:#0b0b0d;border-bottom:1px solid #16161a;font-size:11px}
.lgn .lgn-menubar .brand{color:#e05c6e;font-weight:700;letter-spacing:.12em}
.lgn .lgn-menubar .mi{color:#7d7a80}.lgn .lgn-menubar .sp{flex:1}
.lgn .lgn-menubar .dot{width:6px;height:6px;border-radius:50%;background:#cc4444;box-shadow:0 0 6px #cc4444}
.lgn .lgn-body{flex:1;display:flex;min-height:0}
.lgn .lgn-stage{flex:1.15;position:relative;overflow:hidden;background:#060608;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px}
.lgn .lgn-stage::after{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(80% 80% at 46% 44%,transparent 72%,rgba(0,0,0,.4));z-index:2}
.lgn .eye{width:min(46vh,440px);aspect-ratio:1;position:relative;z-index:1}
.lgn .eye canvas{width:100%;height:100%;display:block}
.lgn .sl{position:absolute;inset:0;z-index:2;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(0,0,0,.16) 0 1px,transparent 1px 3px);opacity:.5;mix-blend-mode:multiply}
.lgn .fret{position:relative;z-index:3;display:flex;align-items:center;gap:16px;width:min(58%,360px);opacity:.85}
.lgn .fret span{height:1px;flex:1;background:linear-gradient(90deg,transparent,#2a2a30,transparent)}
.lgn .fret i{color:#cc4444;font-style:normal;font-size:12px}
.lgn .stagecap{position:relative;z-index:3;text-align:center}
.lgn .stagecap .wm{font-weight:700;font-size:clamp(1.7rem,3.6vw,2.5rem);letter-spacing:.01em;color:#e2e2e4}
.lgn .stagecap .wm .g{color:#5ea36a}.lgn .stagecap .wm .p{color:#e05c6e}
.lgn .stagecap .wm .cur{display:inline-block;width:.55em;height:1.02em;background:#cc4444;margin-left:.14em;vertical-align:-.16em;animation:lgnBlink 1.05s steps(1) infinite}
@keyframes lgnBlink{50%{opacity:0}}
.lgn .stagecap .tg{margin-top:14px;font-size:10.5px;letter-spacing:.34em;text-transform:uppercase;color:#7d7a80}
.lgn .lgn-panel{width:min(42%,440px);flex-shrink:0;background:#08080a;border-left:1px solid #16161a;display:flex;flex-direction:column;justify-content:center;padding:0 48px;position:relative}
.lgn .lgn-panel::before{content:"";position:absolute;left:0;top:0;bottom:0;width:1px;background:#241a1c}
.lgn .lgn-panel.shake{animation:lgnShake .45s}
@keyframes lgnShake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-7px)}40%,80%{transform:translateX(7px)}}
.lgn .lg{display:flex;align-items:center;gap:12px;margin-bottom:6px}
.lgn .lg .m{width:34px;height:34px}.lgn .lg .m canvas{width:100%;height:100%;display:block}
.lgn .lg .t{text-transform:uppercase;letter-spacing:.24em;font-size:1.2rem;font-weight:700;color:#e2e2e4}
.lgn .lg .sub{font-size:9.5px;letter-spacing:.24em;text-transform:uppercase;color:#e05c6e;margin-top:2px}
.lgn .title{font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:#7d7a80;margin:26px 0 16px}
.lgn .field{margin-bottom:14px}
.lgn .field label{display:block;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#7d7a80;margin-bottom:6px}
.lgn .inp{display:flex;align-items:center;gap:9px;background:#090909;border:1px solid #1e1e22;padding:10px 11px;transition:border-color .18s}
.lgn .inp:focus-within{border-color:#cc4444}
.lgn .inp svg{color:#4e4a52;flex-shrink:0}
.lgn .inp input{flex:1;background:transparent;border:0;outline:0;color:#e2e2e4;font-family:inherit;font-size:13px}
.lgn .inp input::placeholder{color:#4e4a52}
.lgn .row{display:flex;align-items:center;justify-content:space-between;margin:4px 0 20px;font-size:11px}
.lgn .row label{display:flex;align-items:center;gap:7px;color:#7d7a80;cursor:pointer}
.lgn .row .lk{color:#4e4a52;cursor:pointer}
.lgn .btn{width:100%;padding:12px;background:#bf3b34;border:1px solid #a5322c;color:#fff;font-family:inherit;font-weight:700;letter-spacing:.2em;font-size:13px;text-transform:uppercase;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:9px;transition:background .15s}
.lgn .btn:hover{background:#cc4444}
.lgn .btn:disabled{opacity:.7;cursor:default}
.lgn .foot{margin-top:18px;font-size:10px;letter-spacing:.06em;color:#4e4a52;display:flex;align-items:center;gap:7px}
.lgn .foot .g{width:5px;height:5px;border-radius:50%;background:#4ec94e;box-shadow:0 0 5px #4ec94e}
.lgn .lgn-status{height:24px;flex-shrink:0;display:flex;align-items:center;gap:14px;padding:0 12px;background:#cc4444;color:#fff;font-size:10.5px;letter-spacing:.08em}
.lgn .lgn-status .sp{flex:1}
.lgn .lgn-panel>*{opacity:0;animation:lgnRise .55s cubic-bezier(.2,.8,.3,1) forwards}
.lgn .lgn-panel>*:nth-child(1){animation-delay:.15s}.lgn .lgn-panel>*:nth-child(2){animation-delay:.24s}
.lgn .lgn-panel>*:nth-child(3){animation-delay:.32s}.lgn .lgn-panel>*:nth-child(4){animation-delay:.40s}
.lgn .lgn-panel>*:nth-child(5){animation-delay:.48s}.lgn .lgn-panel>*:nth-child(6){animation-delay:.56s}
.lgn .lgn-panel>*:nth-child(7){animation-delay:.64s}
@keyframes lgnRise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@media(prefers-reduced-motion:reduce){.lgn .lgn-panel>*{opacity:1;animation:none}}
@media(max-width:760px){.lgn .lgn-stage{display:none}.lgn .lgn-panel{width:100%;border-left:0}}
`;
