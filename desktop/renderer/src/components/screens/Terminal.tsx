import { useState, useRef, useEffect } from 'react';
import { db, agentOfDevice, branchOfDevice, hardwareOfDevice } from '@/lib/mock';
import { PageHeader, Badge } from '@/components/ui/kit';
import { bytes, relative, duration } from '@/lib/fmt';

interface Line { kind: string; text: string }

const CANNED: Record<string, (host: string) => string> = {
  help: () => 'Comandos: help · whoami · uname -a · df -h · free -m · uptime · ps · ls · hostname · ip a · clear',
  whoami: () => 'root',
  hostname: h => h,
  'uname -a': h => `Linux ${h} 6.5.0-35-generic #35-Ubuntu SMP PREEMPT_DYNAMIC x86_64 GNU/Linux`,
  'df -h': () => 'Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda1       512G  318G  168G  66% /\ntmpfs            16G   12M   16G   1% /run\n/dev/sda2       128G   44G   84G  35% /var',
  'free -m': () => '              total        used        free      shared  buff/cache\nMem:          32012       18422        6120         842        7470\nSwap:          4095           0        4095',
  uptime: () => ' 14:22:01 up 42 days,  3:11,  2 users,  load average: 0.42, 0.55, 0.61',
  ps: () => '  PID TTY          TIME CMD\n    1 ?        00:00:12 systemd\n  812 ?        00:03:41 nginx\n  913 ?        00:11:22 postgres\n 1044 ?        00:00:58 dockerd',
  ls: () => 'bin   boot  dev  etc  home  lib  opt  proc  root  srv  tmp  usr  var',
  'ip a': () => '1: lo: <LOOPBACK,UP> mtu 65536\n    inet 127.0.0.1/8 scope host lo\n2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500\n    inet 10.10.0.42/24 brd 10.10.0.255 scope global eth0',
};

export default function Terminal() {
  const online = db.devices.filter(d => d.status === 'online');
  const [sel, setSel] = useState(online[0]?.id ?? '');
  const [lines, setLines] = useState<Line[]>([]);
  const [input, setInput] = useState('');
  const [latency] = useState(() => 8 + Math.floor(Math.random() * 30));
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dev = db.devices.find(d => d.id === sel);
  const host = dev?.hostname ?? 'endpoint';

  // banner de conexão ao trocar de host (parece um SSH real)
  useEffect(() => {
    if (!dev) return;
    const hw = hardwareOfDevice(dev.id);
    const branch = branchOfDevice(dev.id)?.name ?? '';
    setLines([
      { kind: 't-sys', text: `Conectando a ${dev.fqdn} via agente (gRPC/TLS)…` },
      { kind: 't-ok', text: `✓ túnel estabelecido · ${latency}ms · sessão ${Math.random().toString(16).slice(2, 8)}` },
      { kind: 't-dim', text: '' },
      { kind: 't-info', text: `Welcome to ${dev.distro} (GNU/Linux)` },
      { kind: 't-dim', text: `  Host:    ${dev.hostname} · ${branch}` },
      { kind: 't-dim', text: `  Kernel:  ${dev.kernelVersion ?? '—'} · ${dev.arch}` },
      { kind: 't-dim', text: hw ? `  CPU:     ${hw.cpuModel} (${hw.cpuCores}c/${hw.cpuThreads}t) · RAM ${bytes(hw.ramTotalBytes)}` : '' },
      { kind: 't-dim', text: `  Last login: ${new Date().toLocaleString('pt-BR')} from 10.0.0.5` },
      { kind: 't-dim', text: '' },
      { kind: 't-sys', text: "Digite 'help' para ver os comandos disponíveis." },
    ]);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [sel]);

  useEffect(() => { bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight }); }, [lines]);

  const prompt = `root@${host}:~#`;
  const submit = () => {
    const cmd = input.trim();
    const next = [...lines, { kind: 't-cmd', text: `${prompt} ${cmd}` }];
    if (cmd) {
      if (cmd === 'clear') { setLines([]); setInput(''); return; }
      const fn = CANNED[cmd];
      next.push(fn ? { kind: 't-out', text: fn(host) } : { kind: 't-err', text: `bash: ${cmd.split(' ')[0]}: comando não encontrado` });
    }
    setLines(next); setInput('');
  };

  const agent = agentOfDevice(sel);
  const cmds = agent ? db.commandResults.filter(c => c.agentId === agent.id) : db.commandResults.slice(0, 12);

  return (
    <div className="col fill">
      <PageHeader title="Terminal remoto" subtitle="Shell nos endpoints via agente (gRPC/TLS) — sessão auditada" />
      <div className="fill" style={{ display: 'flex', minHeight: 0 }}>
        <div className="col" style={{ width: 230, borderRight: '1px solid var(--b1)', background: 'var(--panel)' }}>
          <div className="sec-hdr">ENDPOINTS ONLINE ({online.length})</div>
          <div className="fill scroll-y">
            {online.map(d => (
              <div key={d.id} className={'tree-item' + (sel === d.id ? ' active' : '')} onClick={() => setSel(d.id)}>
                <span className="tree-item-icon" style={{ color: 'var(--green)' }}>●</span>
                <span className="tree-item-label mono">{d.hostname}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="col fill" style={{ minWidth: 0, padding: 12, gap: 10 }}>
          <div className="term-shell fill" style={{ minHeight: 0 }}>
            <div className="term-bar">
              <span className="term-dot" style={{ background: '#ff5f56' }} />
              <span className="term-dot" style={{ background: '#ffbd2e' }} />
              <span className="term-dot" style={{ background: '#27c93f' }} />
              <span className="mono" style={{ marginLeft: 8, fontSize: 11, color: 'var(--tx1)' }}>root@{host} — ssh (gRPC tunnel)</span>
              <span style={{ flex: 1 }} />
              <span className="mono" style={{ fontSize: 11, color: latency > 30 ? 'var(--orange)' : 'var(--green)' }}>● {latency}ms</span>
              <span className="mono" style={{ fontSize: 11, color: 'var(--tx3)' }}>TLS 1.3</span>
            </div>
            <div className="term-body" ref={bodyRef} onClick={() => inputRef.current?.focus()}>
              {lines.map((l, i) => <pre key={i} className={l.kind}>{l.text}</pre>)}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span className="t-ok" style={{ whiteSpace: 'pre' }}>root@{host}</span><span className="t-dim">:</span><span className="t-info">~</span><span className="t-dim"># </span>
                <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()}
                  spellCheck={false} autoComplete="off"
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--tx0)', fontFamily: 'inherit', fontSize: 'inherit' }} />
              </div>
            </div>
          </div>
          <div style={{ border: '1px solid var(--b2)', height: 170 }} className="col">
            <div className="sec-hdr">HISTÓRICO DE COMANDOS</div>
            <div className="fill scroll-y">
              <table className="zk-table"><thead><tr><th>Comando</th><th>Status</th><th>Exit</th><th>Quando</th><th>Duração</th></tr></thead><tbody>
                {cmds.slice(0, 12).map(c => (
                  <tr key={c.id}><td className="mono">{c.commandStr}</td><td><Badge tone={c.status === 'success' ? 'green' : c.status === 'timeout' ? 'orange' : 'red'}>{c.status}</Badge></td><td className="mono">{c.exitCode}</td><td style={{ color: 'var(--tx2)' }}>{relative(c.executedAt)}</td><td className="mono" style={{ color: 'var(--tx2)' }}>{duration(c.durationMs)}</td></tr>
                ))}
              </tbody></table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
