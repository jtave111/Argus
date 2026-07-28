import { useEffect, useRef, useState } from 'react';
import { Eye, Lock, User, ArrowRight } from 'lucide-react';

interface P { tx: number; ty: number; x: number; y: number; vx: number; vy: number; r: number }

/**
 * Tela de login com animação de partículas (inspirada no GestaoVarejo): as partículas
 * voam e se montam na palavra ARGUS (alvos amostrados de um canvas de texto), com
 * repulsão ao mouse. Estética Argus — fundo vinho, acento vermelho.
 */
export default function Login({ onLogin }: { onLogin: (user: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [user, setUser] = useState('admin');
  const [pass, setPass] = useState('');
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current!, ctx = canvas.getContext('2d')!;
    let W = 0, H = 0, raf = 0, particles: P[] = [];
    const mouse = { x: -9999, y: -9999 };

    function targets(): [number, number][] {
      // amostra os pixels da palavra "ARGUS" desenhada num canvas offscreen.
      // Guarda: getImageData lança se o canvas ainda não tem tamanho (largura 0).
      if (W < 2 || H < 2) return [];
      const off = document.createElement('canvas');
      const octx = off.getContext('2d');
      if (!octx) return [];
      const fw = Math.min(W * 0.62, 820), fs = fw / 3.4;
      off.width = W; off.height = H;
      octx.fillStyle = '#fff';
      octx.font = `800 ${fs}px ui-monospace, "Courier New", monospace`;
      octx.textAlign = 'center'; octx.textBaseline = 'middle';
      octx.fillText('ARGUS', W * (W < 900 ? 0.5 : 0.33), H * (W < 900 ? 0.34 : 0.45));
      const data = octx.getImageData(0, 0, W, H).data;
      const pts: [number, number][] = [];
      const step = W < 900 ? 6 : 7;
      for (let y = 0; y < H; y += step) for (let x = 0; x < W; x += step) {
        if (data[(y * W + x) * 4 + 3] > 128) pts.push([x, y]);
      }
      return pts;
    }

    function build() {
      // usa o tamanho do elemento; se ainda for 0 (layout não resolvido), cai para a
      // janela — o ResizeObserver refaz quando o container ganhar tamanho real.
      W = canvas.width = canvas.offsetWidth || window.innerWidth || 0;
      H = canvas.height = canvas.offsetHeight || window.innerHeight || 0;
      const pts = targets();
      particles = pts.map(([tx, ty]) => ({ tx, ty, x: Math.random() * W, y: Math.random() * H, vx: 0, vy: 0, r: 1 + Math.random() * 1.4 }));
    }

    function tick() {
      ctx.clearRect(0, 0, W, H);
      for (const p of particles) {
        p.vx += (p.tx - p.x) * 0.02; p.vy += (p.ty - p.y) * 0.02;
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < 12000) { const d = Math.sqrt(d2) || 1, f = (12000 - d2) / 12000 * 3.4; p.vx += dx / d * f; p.vy += dy / d * f; }
        p.vx *= 0.86; p.vy *= 0.86; p.x += p.vx; p.y += p.vy;
        const speed = Math.min(1, Math.hypot(p.vx, p.vy) / 6);
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7);
        ctx.fillStyle = speed > 0.25 ? '#ff8fa3' : '#cc4444';
        ctx.globalAlpha = 0.5 + 0.5 * (1 - speed); ctx.fill();
      }
      ctx.globalAlpha = 1; raf = requestAnimationFrame(tick);
    }

    const onMove = (e: MouseEvent) => { const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; };
    const onLeave = () => { mouse.x = mouse.y = -9999; };
    canvas.addEventListener('mousemove', onMove); canvas.addEventListener('mouseleave', onLeave);
    const ro = new ResizeObserver(build); ro.observe(canvas); build(); tick();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); canvas.removeEventListener('mousemove', onMove); canvas.removeEventListener('mouseleave', onLeave); };
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user.trim()) { setShake(true); setTimeout(() => setShake(false), 500); return; }
    setBusy(true);
    setTimeout(() => onLogin(user.trim()), 900);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', background: 'radial-gradient(1200px 800px at 30% 40%, #2a0a14 0%, #150409 55%, #0b0206 100%)', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      <div style={{ position: 'absolute', top: 18, left: 0, right: 0, textAlign: 'center', fontSize: 11, letterSpacing: 3, color: 'rgba(255,255,255,.28)', fontFamily: 'Courier New', textTransform: 'uppercase' }} className="login-hint">
        Painel de Controle de Infraestrutura Remota
      </div>

      <form onSubmit={submit} className={shake ? 'login-shake' : ''}
        style={{ position: 'relative', marginLeft: 'auto', alignSelf: 'center', width: 380, maxWidth: '92vw', marginRight: '7vw',
          background: 'rgba(18,10,12,0.78)', border: '1px solid #3a1620', backdropFilter: 'blur(6px)', padding: '32px 30px', boxShadow: '0 24px 80px rgba(0,0,0,.6)' }}>
        <div className="login-box">
          <div className="row" style={{ gap: 10, alignItems: 'center', marginBottom: 4 }}>
            <span style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--red)', color: 'var(--red-hi)', boxShadow: '0 0 18px rgba(204,68,68,.4)' }}><Eye size={20} /></span>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 2, color: '#fff' }}>ARGUS</div>
              <div style={{ fontSize: 9.5, letterSpacing: 2, color: 'var(--red-hi)', textTransform: 'uppercase' }}>Control Panel</div>
            </div>
          </div>
          <div style={{ height: 1, background: 'linear-gradient(90deg, var(--red), transparent)', margin: '14px 0 20px' }} />

          <div className="login-field">
            <label>Usuário</label>
            <div className="login-input"><User size={14} /><input value={user} onChange={e => setUser(e.target.value)} placeholder="usuário ou e-mail" autoFocus /></div>
          </div>
          <div className="login-field">
            <label>Senha</label>
            <div className="login-input"><Lock size={14} /><input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" /></div>
          </div>

          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', margin: '4px 0 18px', fontSize: 11 }}>
            <label className="row" style={{ gap: 6, alignItems: 'center', color: 'var(--tx2)', cursor: 'pointer' }}><input type="checkbox" defaultChecked /> Lembrar</label>
            <span style={{ color: 'var(--tx3)', cursor: 'pointer' }}>Esqueci a senha</span>
          </div>

          <button type="submit" className="login-btn" disabled={busy}>
            {busy ? 'ENTRANDO…' : <>ENTRAR <ArrowRight size={15} /></>}
          </button>
          <div style={{ marginTop: 14, fontSize: 10, color: 'var(--tx3)', textAlign: 'center' }}>Conexão segura · gRPC/TLS · sessão auditada</div>
        </div>
      </form>
    </div>
  );
}
