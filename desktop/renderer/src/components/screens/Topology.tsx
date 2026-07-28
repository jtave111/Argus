import { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import { db, devicesOfNetwork, networksOfBranch, agentOfDevice, branchById } from '@/lib/mock';
import { PageHeader, Badge } from '@/components/ui/kit';
import { useNav } from '@/components/layout/App';
import { Maximize2, GitBranch, Orbit, ChevronsDownUp, ChevronsUpDown, ExternalLink } from 'lucide-react';

cytoscape.use(dagre);

const C = {
  org: '#ff5c66', branchHq: '#ff5c66', branch: '#5eb8d4', net: '#5eb8d4', dmz: '#e0a060',
  online: '#4ec94e', offline: '#e05c6e', maintenance: '#d4935a', edge: '#4a6076',
};

interface SelInfo { label: string; kind: string; sub: string; devId?: string; deg: number }

/** Topologia de rede (Cytoscape + dagre). Abre resumida (org→filial→rede) para ser
 *  legível; expandir mostra os dispositivos. Clique seleciona e mostra detalhe. */
export default function Topology() {
  const { go } = useNav();
  const boxRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [layout, setLayout] = useState<'LR' | 'TB' | 'radial'>('LR');
  const [expanded, setExpanded] = useState(false);
  const [sel, setSel] = useState<SelInfo | null>(null);

  useEffect(() => {
    if (!boxRef.current) return;
    const els: cytoscape.ElementDefinition[] = [];
    els.push({ data: { id: 'org', label: db.organization.name, kind: 'org', sub: `${db.branches.length} filiais` } });

    db.branches.forEach(b => {
      const bid = 'br:' + b.id;
      els.push({ data: { id: bid, label: b.name, kind: b.headquarters ? 'branchHq' : 'branch', sub: `${b.address.city}/${b.address.state}` } });
      els.push({ data: { id: `e:org:${bid}`, source: 'org', target: bid } });
      networksOfBranch(b.id).forEach(n => {
        const nid = 'net:' + n.id;
        const devs = devicesOfNetwork(n.id);
        els.push({ data: { id: nid, label: `${n.type.toUpperCase()} ${n.subnet}`, kind: n.type === 'dmz' ? 'dmz' : 'net', sub: `${devs.length} dispositivos · ${b.name}` } });
        els.push({ data: { id: `e:${bid}:${nid}`, source: bid, target: nid } });
        devs.forEach(d => {
          const did = 'dev:' + d.id;
          const ag = agentOfDevice(d.id);
          els.push({ data: { id: did, label: d.hostname, kind: d.status, devId: d.id, isDevice: 1, sub: `${d.os} · agente ${ag?.status ?? 'ausente'}` } });
          els.push({ data: { id: `e:${nid}:${did}`, source: nid, target: did, isDevice: 1 } });
        });
      });
    });

    const cy = cytoscape({
      container: boxRef.current, elements: els, wheelSensitivity: 0.3,
      minZoom: 0.15, maxZoom: 3,
      style: [
        { selector: 'node', style: {
          'background-color': (n: any) => (C as any)[n.data('kind')] ?? '#8a94a0',
          'background-opacity': 0.9, label: 'data(label)', color: '#e2e6ea',
          'font-family': 'ui-monospace, monospace', 'font-size': 10, 'text-valign': 'center', 'text-halign': 'right',
          'text-margin-x': 6, 'text-outline-color': '#101318', 'text-outline-width': 2,
          width: 16, height: 16, 'border-width': 2, 'border-color': (n: any) => (C as any)[n.data('kind')] ?? '#8a94a0',
        } },
        { selector: 'node[kind="org"]', style: { shape: 'hexagon', width: 54, height: 54, 'font-size': 15, 'font-weight': 700 } },
        { selector: 'node[kind="branchHq"], node[kind="branch"]', style: { shape: 'round-rectangle', width: 34, height: 34, 'font-size': 12 } },
        { selector: 'node[kind="dmz"], node[kind="net"]', style: { shape: 'diamond', width: 26, height: 26, 'font-size': 11 } },
        { selector: 'node[isDevice]', style: { shape: 'ellipse', width: 15, height: 15, 'font-size': 9, color: '#aeb6bf' } },
        { selector: 'edge', style: { width: 1.6, 'line-color': C.edge, 'curve-style': 'bezier', opacity: 0.8 } },
        { selector: 'edge[source="org"]', style: { width: 3, 'line-color': '#a03038' } },
        { selector: '.hidden', style: { display: 'none' } },
        { selector: '.dim', style: { opacity: 0.12 } },
        { selector: 'node:selected', style: { 'border-color': '#fff', 'border-width': 4 } },
      ],
      layout: { name: 'grid' } as any,
    });
    cyRef.current = cy;

    // começa resumido: dispositivos escondidos (legibilidade)
    cy.elements('[isDevice]').addClass('hidden');

    const run = (mode: 'LR' | 'TB' | 'radial' = 'LR') => {
      if (!boxRef.current) return;
      const r = boxRef.current.getBoundingClientRect();
      if (r.width < 40 || r.height < 40) return;
      cy.resize();
      const opts: any = mode === 'radial'
        ? { name: 'concentric', concentric: (n: any) => ({ org: 4, branchHq: 3, branch: 3, dmz: 2, net: 2 } as any)[n.data('kind')] ?? 1, levelWidth: () => 1, minNodeSpacing: 40, animate: true }
        : { name: 'dagre', rankDir: mode, nodeSep: 22, rankSep: 130, edgeSep: 12, animate: true };
      const l = cy.layout(opts); l.one('layoutstop', () => cy.fit(undefined, 45)); l.run();
    };
    requestAnimationFrame(() => run('LR'));
    const t = window.setTimeout(() => run('LR'), 180);
    const ro = new ResizeObserver(() => cy.resize());
    ro.observe(boxRef.current);
    (cy as any).__run = run;

    cy.on('tap', 'node', e => {
      const n = e.target;
      cy.elements().removeClass('dim');
      cy.elements().difference(n.closedNeighborhood()).addClass('dim');
      setSel({ label: n.data('label'), kind: n.data('kind'), sub: n.data('sub') ?? '', devId: n.data('devId'), deg: n.degree(false) });
    });
    cy.on('tap', e => { if (e.target === cy) { cy.elements().removeClass('dim'); setSel(null); } });
    cy.on('dbltap', 'node[devId]', e => go('device', e.target.data('devId')));

    return () => { clearTimeout(t); ro.disconnect(); cy.destroy(); cyRef.current = null; };
  }, []);

  const applyLayout = (m: 'LR' | 'TB' | 'radial') => { setLayout(m); (cyRef.current as any)?.__run?.(m); };
  const toggleDevices = () => {
    const cy = cyRef.current; if (!cy) return;
    const next = !expanded; setExpanded(next);
    next ? cy.elements('[isDevice]').removeClass('hidden') : cy.elements('[isDevice]').addClass('hidden');
    (cy as any).__run?.(layout);
  };

  return (
    <div className="col fill">
      <PageHeader title="Topologia" subtitle="Organização → filiais → redes → dispositivos · clique para isolar · duplo-clique abre o console"
        actions={<>
          <button className={'zk-btn' + (expanded ? ' primary' : '')} onClick={toggleDevices}>
            {expanded ? <ChevronsDownUp size={13} /> : <ChevronsUpDown size={13} />} {expanded ? 'Resumir' : 'Expandir dispositivos'}
          </button>
          <button className={'zk-btn' + (layout === 'LR' ? ' primary' : '')} onClick={() => applyLayout('LR')}><GitBranch size={13} /> Árvore →</button>
          <button className={'zk-btn' + (layout === 'TB' ? ' primary' : '')} onClick={() => applyLayout('TB')}><GitBranch size={13} style={{ transform: 'rotate(90deg)' }} /> Árvore ↓</button>
          <button className={'zk-btn' + (layout === 'radial' ? ' primary' : '')} onClick={() => applyLayout('radial')}><Orbit size={13} /> Radial</button>
          <button className="zk-btn" onClick={() => cyRef.current?.fit(undefined, 45)}><Maximize2 size={13} /></button>
        </>} />

      <div className="fill col" style={{ padding: 12, minHeight: 0 }}>
        {/* align-items:stretch explícito — .row centraliza e colapsaria o grafo */}
        <div style={{ display: 'flex', alignItems: 'stretch', flex: 1, minHeight: 0, gap: 12 }}>
          <div ref={boxRef} style={{ flex: 1, minWidth: 0, border: '1px solid var(--b2)', background: 'var(--inset)' }} />
          <div className="col" style={{ width: 250, border: '1px solid var(--b2)', background: 'var(--panel)' }}>
            <div className="sec-hdr">DETALHE</div>
            <div style={{ padding: 12, fontSize: 12 }}>
              {!sel ? <span style={{ color: 'var(--tx3)' }}>Clique num nó para isolar a vizinhança.</span> : (
                <>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx0)', marginBottom: 3 }}>{sel.label}</div>
                  <div style={{ color: 'var(--tx2)', fontSize: 11, marginBottom: 10 }}>{sel.sub}</div>
                  <div className="row" style={{ justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--b1)' }}>
                    <span style={{ color: 'var(--tx3)', fontSize: 11 }}>Conexões</span><span className="mono">{sel.deg}</span>
                  </div>
                  {sel.devId && (
                    <button className="zk-btn primary" style={{ width: '100%', marginTop: 12, justifyContent: 'center' }} onClick={() => go('device', sel.devId!)}>
                      <ExternalLink size={12} /> Abrir console
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        <div className="row" style={{ gap: 14, padding: '10px 4px', flexWrap: 'wrap' }}>
          <Badge tone="red" dot>Organização / Matriz</Badge>
          <Badge tone="cyan" dot>Filial / Rede</Badge>
          <Badge tone="green" dot>Online</Badge>
          <Badge tone="orange" dot>Manutenção</Badge>
          <Badge tone="red" dot>Offline</Badge>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--tx3)' }}>roda = zoom · arrastar = mover · começa resumido para ficar legível</span>
        </div>
      </div>
    </div>
  );
}
