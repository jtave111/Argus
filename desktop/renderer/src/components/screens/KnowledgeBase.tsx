import { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import fcose from 'cytoscape-fcose';
import { db, mockKnowledgeIncidents, mockKnowledgeRunbooks } from '@/lib/mock';
import { PageHeader, StatBox } from '@/components/ui/kit';
import { Maximize2, Search, Rows3, Orbit } from 'lucide-react';

cytoscape.use(fcose);

const CAT = {
  org: { color: '#e0483f', label: 'Organização' },
  branch: { color: '#5eb8d4', label: 'Filial' },
  device: { color: '#4ec94e', label: 'Dispositivo' },
  service: { color: '#c8b050', label: 'Serviço' },
  employee: { color: '#a07fd4', label: 'Pessoa' },
  incident: { color: '#e05c6e', label: 'Incidente' },
  runbook: { color: '#5a96d4', label: 'Runbook' },
} as const;
type Cat = keyof typeof CAT;

/** Base de conhecimento em Cytoscape.js + fcose (force layout com clusterização).
 *  Canvas 2D — funciona na WebView sem WebGL. Busca, filtro por categoria, foco na
 *  vizinhança ao clicar e painel de detalhe. */
export default function KnowledgeBase() {
  const boxRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [q, setQ] = useState('');
  const [off, setOff] = useState<Set<Cat>>(new Set());
  const [sel, setSel] = useState<{ label: string; cat: Cat; deg: number } | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!boxRef.current) return;
    const els: cytoscape.ElementDefinition[] = [];
    const add = (id: string, label: string, cat: Cat) => els.push({ data: { id, label, cat } });
    const link = (a: string, b: string) => els.push({ data: { id: `e:${a}:${b}`, source: a, target: b } });

    add('org', db.organization.name, 'org');
    db.branches.forEach(b => { add('br:' + b.id, b.name, 'branch'); link('org', 'br:' + b.id); });
    db.devices.filter(d => d.deviceType === 'server').slice(0, 16).forEach(d => {
      add('dev:' + d.id, d.hostname, 'device');
      const brId = db.networks.find(n => n.id === d.networkId)?.branchId;
      if (brId) link('br:' + brId, 'dev:' + d.id);
      db.services.filter(s => s.deviceId === d.id).slice(0, 3).forEach(s => {
        const sid = 'svc:' + s.id;
        if (!els.some(e => e.data.id === sid)) add(sid, s.displayName, 'service');
        link('dev:' + d.id, sid);
      });
    });
    db.employees.filter(e => e.userId).slice(0, 6).forEach(e => {
      add('emp:' + e.id, e.fullName.split(' ')[0], 'employee');
      if (e.branchId) link('emp:' + e.id, 'br:' + e.branchId);
    });
    const servers = db.devices.filter(d => d.deviceType === 'server');
    mockKnowledgeIncidents.forEach((t, i) => { add('inc:' + i, t, 'incident'); const d = servers[i]; if (d) link('inc:' + i, 'dev:' + d.id); });
    mockKnowledgeRunbooks.forEach((t, i) => { add('rb:' + i, t, 'runbook'); link('rb:' + i, 'inc:' + i); });

    const cy = cytoscape({
      container: boxRef.current, elements: els, wheelSensitivity: 0.25,
      style: [
        { selector: 'node', style: {
          'background-color': (n: any) => CAT[n.data('cat') as Cat].color,
          label: 'data(label)', color: '#c8ccd2', 'font-family': 'ui-monospace, monospace', 'font-size': 9,
          'text-valign': 'top', 'text-margin-y': -4, 'text-opacity': 0,
          // tamanho pelo grau de conexões: hubs ficam grandes (estilo Obsidian)
          width: 'mapData(degree, 0, 12, 12, 44)', height: 'mapData(degree, 0, 12, 12, 44)',
          'border-width': 1.5, 'border-color': (n: any) => CAT[n.data('cat') as Cat].color, 'border-opacity': 0.5,
        } },
        { selector: 'node[degree > 3]', style: { 'text-opacity': 1 } },
        { selector: 'edge', style: { width: 1, 'line-color': '#33404d', 'curve-style': 'bezier', opacity: 0.55 } },
        { selector: '.dim', style: { opacity: 0.07, 'text-opacity': 0 } },
        { selector: '.hot', style: { 'border-width': 3, 'border-opacity': 1, 'text-opacity': 1, 'font-size': 11, 'z-index': 99 } },
        { selector: '.hit', style: { 'border-color': '#ff5c66', 'border-width': 3, 'border-opacity': 1, 'text-opacity': 1 } },
      ],
      // começa em grid: o layout de força só roda depois que o container tem tamanho
      // real, senão o Cytoscape calcula posições num container 0x0 e nada aparece.
      layout: { name: 'grid' } as any,
    });
    cyRef.current = cy;
    cy.nodes().forEach(n => { n.data('degree', n.degree(false)); });
    cy.style().update();

    const settle = () => {
      if (!cyRef.current || !boxRef.current) return;
      const r = boxRef.current.getBoundingClientRect();
      if (r.width < 40 || r.height < 40) return;   // ainda sem tamanho — espera
      cy.resize();
      cy.layout({ name: 'fcose', quality: 'proof', nodeRepulsion: 9000, idealEdgeLength: 70, animate: true, animationDuration: 700, randomize: true } as any).run();
      cy.one('layoutstop', () => cy.fit(undefined, 40));
    };
    requestAnimationFrame(settle);
    const t1 = window.setTimeout(settle, 150);
    const ro = new ResizeObserver(() => { cy.resize(); });
    ro.observe(boxRef.current);

    const c: Record<string, number> = {};
    cy.nodes().forEach(n => { const k = n.data('cat'); c[k] = (c[k] ?? 0) + 1; });
    setCounts({ ...c, __edges: cy.edges().length });

    cy.on('tap', 'node', e => {
      const n = e.target;
      cy.elements().addClass('dim'); n.closedNeighborhood().removeClass('dim');
      cy.elements().removeClass('hot'); n.addClass('hot');
      setSel({ label: n.data('label'), cat: n.data('cat'), deg: n.degree(false) });
    });
    cy.on('tap', e => { if (e.target === cy) { cy.elements().removeClass('dim hot'); setSel(null); } });

    return () => { clearTimeout(t1); ro.disconnect(); cy.destroy(); cyRef.current = null; };
  }, []);

  // busca destaca os nós que casam
  useEffect(() => {
    const cy = cyRef.current; if (!cy) return;
    cy.nodes().removeClass('hit');
    if (q.trim().length > 1) cy.nodes().filter(n => String(n.data('label')).toLowerCase().includes(q.toLowerCase())).addClass('hit');
  }, [q]);

  const toggleCat = (cat: Cat) => {
    const next = new Set(off); next.has(cat) ? next.delete(cat) : next.add(cat); setOff(next);
    const cy = cyRef.current; if (!cy) return;
    cy.nodes().forEach(n => { const hidden = next.has(n.data('cat') as Cat); n.style('display', hidden ? 'none' : 'element'); });
  };
  const relayout = (name: 'fcose' | 'concentric') => {
    const cy = cyRef.current; if (!cy) return;
    cy.layout(name === 'fcose'
      ? { name: 'fcose', quality: 'proof', nodeRepulsion: 9000, idealEdgeLength: 70, animate: true, randomize: true } as any
      : { name: 'concentric', concentric: (n: any) => n.degree(false), levelWidth: () => 2, minNodeSpacing: 26, animate: true } as any
    ).run();
  };

  return (
    <div className="col fill">
      <PageHeader title="Base de Conhecimento" subtitle="Grafo de entidades, incidentes e runbooks · Cytoscape + fcose · clique num nó para isolar a vizinhança"
        actions={<>
          <button className="zk-btn" onClick={() => relayout('fcose')} title="Layout orgânico"><Orbit size={13} /> Orgânico</button>
          <button className="zk-btn" onClick={() => relayout('concentric')} title="Concêntrico por relevância"><Rows3 size={13} /> Concêntrico</button>
          <button className="zk-btn" onClick={() => cyRef.current?.fit(undefined, 40)}><Maximize2 size={13} /></button>
        </>} />
      <div className="fill col" style={{ padding: 12, minHeight: 0 }}>
        <div className="row" style={{ gap: 10, marginBottom: 10, flexShrink: 0 }}>
          <StatBox label="Entidades" value={Object.entries(counts).filter(([k]) => k !== '__edges').reduce((a, [, v]) => a + v, 0)} tone="red" />
          <StatBox label="Relações" value={counts.__edges ?? 0} tone="blue" />
          <StatBox label="Incidentes" value={counts.incident ?? 0} tone="orange" />
          <StatBox label="Runbooks" value={counts.runbook ?? 0} tone="purple" />
        </div>

        <div className="row" style={{ gap: 6, marginBottom: 8, flexWrap: 'wrap', flexShrink: 0, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 8, top: 9, color: 'var(--tx3)' }} />
            <input className="zk-input" style={{ width: 240, paddingLeft: 26 }} placeholder="Buscar no grafo…" value={q} onChange={e => setQ(e.target.value)} />
          </div>
          {(Object.keys(CAT) as Cat[]).map(k => (
            <button key={k} className="zk-btn" onClick={() => toggleCat(k)}
              style={{ opacity: off.has(k) ? 0.4 : 1, borderColor: off.has(k) ? 'var(--b2)' : CAT[k].color, color: off.has(k) ? 'var(--tx3)' : CAT[k].color, textTransform: 'none' }}>
              ● {CAT[k].label} {counts[k] ? `(${counts[k]})` : ''}
            </button>
          ))}
        </div>

        {/* NÃO usar .row aqui: ela tem align-items:center e faz os filhos colapsarem
            para a altura do conteúdo (o grafo ficava com 0px). */}
        <div style={{ display: 'flex', alignItems: 'stretch', flex: 1, minHeight: 0, gap: 12 }}>
          <div ref={boxRef} style={{ flex: 1, minWidth: 0, border: '1px solid var(--b2)', background: 'var(--inset)' }} />
          <div className="col" style={{ width: 250, border: '1px solid var(--b2)', background: 'var(--panel)' }}>
            <div className="sec-hdr">DETALHE</div>
            <div style={{ padding: 12, fontSize: 12 }}>
              {!sel ? <span style={{ color: 'var(--tx3)' }}>Clique num nó para isolar a vizinhança e ver os detalhes.</span> : (
                <>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx0)', marginBottom: 4 }}>{sel.label}</div>
                  <div style={{ color: CAT[sel.cat].color, fontSize: 11, marginBottom: 10 }}>● {CAT[sel.cat].label}</div>
                  <div className="row" style={{ justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--b1)' }}>
                    <span style={{ color: 'var(--tx3)', fontSize: 11 }}>Conexões</span><span className="mono">{sel.deg}</span>
                  </div>
                  <div style={{ marginTop: 12, fontSize: 11, color: 'var(--tx3)' }}>Clique no fundo para limpar o destaque.</div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
