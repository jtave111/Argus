import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';

export interface MapSite { lat: number; lon: number; label: string; sub: string; status: 'online' | 'degraded' | 'offline' }
export interface MapArc { a: [number, number]; b: [number, number]; status: 'up' | 'degraded' | 'down' }

const COLOR: Record<MapSite['status'], string> = { online: '#4ec94e', degraded: '#d48b55', offline: '#e05c6e' };
const LEGEND: [MapSite['status'], string][] = [['online', 'Saudável'], ['degraded', 'Degradado'], ['offline', 'Crítico']];

/**
 * Mapa mundial — reprodução do WorldMap do ZombieKeeper: Leaflet + tiles CartoDB dark
 * (detalhe rua a rua), filtro de brilho, vinheta, pinos com halo pulsante e arcos com
 * pacote viajante.
 *
 * Regras aprendidas na marra:
 *  1. SIZING — o Leaflet precisa de invalidateSize() depois que o container ganha altura
 *     real; sem isso o mapa aparece "cortado". Aqui é chamado em vários momentos +
 *     ResizeObserver. O componente preenche o container por padrão (height='100%').
 *  2. UMA CAMADA SÓ — nada de base vetorial por baixo dos tiles. Os tiles levam
 *     filter:brightness(.62) e a base não, então as duas juntas viravam um patchwork
 *     (mancha escura onde o tile carregou, clara onde não). O fundo do container usa o
 *     mesmo tom dos tiles filtrados para que área ainda carregando não apareça.
 */
export default function WorldMap({ sites, arcs, height = '100%' }: { sites: MapSite[]; arcs?: MapArc[]; height?: string | number }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapElRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [zoom, setZoom] = useState(4);
  // diagnóstico visível: quantos tiles carregaram / falharam neste ambiente
  const [tileStats, setTileStats] = useState({ ok: 0, err: 0 });

  useEffect(() => {
    if (!mapElRef.current || mapRef.current) return;
    let destroyed = false;
    let ro: ResizeObserver | null = null;
    const timers: number[] = [];

    import('leaflet').then(L => {
      if (destroyed || !mapElRef.current) return;

      const map = L.map(mapElRef.current, {
        center: [-15, -50], zoom: 4, minZoom: 2, maxZoom: 18,
        zoomControl: false, attributionControl: false, worldCopyJump: false,
        maxBounds: L.latLngBounds(L.latLng(-85, -220), L.latLng(85, 220)), maxBoundsViscosity: 0.9,
      });
      mapRef.current = map;
      map.on('zoomend', () => setZoom(map.getZoom()));

      // --- tiles CartoDB (o visual do ZombieKeeper, detalhado) — ÚNICA fonte do mapa.
      // Nada é desenhado por baixo: duas camadas de mapa com brilhos diferentes criavam
      // um patchwork (tile escuro sobre base clara). Um mapa só, uniforme.
      // UMA camada só: 'dark_all' já traz os rótulos embutidos. Antes eram duas
      // (dark_nolabels + dark_only_labels) e, quando a base falhava e os rótulos
      // carregavam, sobravam contornos/textos flutuando sem mapa. Sem sufixo retina
      // {r} (gera 404 em @2x) e sem crossOrigin (não lemos pixels e é instável no
      // WebKit antigo da WebView).
      // SEM rotação de subdomínio {s}: com a/b/c/d.basemaps.cartocdn.com, uma WebView de
      // rede restrita pode resolver uns hosts e falhar em outros — resultado são blocos
      // pretos espalhados. Um host só = comportamento uniforme.
      const tiles = L.tileLayer('https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
        maxZoom: 19, noWrap: true, keepBuffer: 6, updateWhenIdle: false, updateWhenZooming: false,
      });
      // Leaflet não retenta tile que falhou — o buraco preto fica para sempre.
      // Aqui cada tile tenta mais 2x com backoff antes de desistir.
      const retries = new WeakMap<HTMLImageElement, number>();
      tiles.on('tileerror', (ev: any) => {
        const img = ev.tile as HTMLImageElement;
        const n = retries.get(img) ?? 0;
        if (n < 2) {
          retries.set(img, n + 1);
          const src = img.src.split('?')[0];
          timers.push(window.setTimeout(() => { img.src = `${src}?r=${n + 1}`; }, 400 * (n + 1)));
        } else {
          setTileStats(s => ({ ...s, err: s.err + 1 }));
        }
      });
      tiles.on('tileload', () => setTileStats(s => ({ ...s, ok: s.ok + 1 })));
      tiles.addTo(map);
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // --- sites ---
      const markers: any[] = [];
      sites.forEach(s => {
        const col = COLOR[s.status], live = s.status !== 'offline';
        const icon = L.divIcon({
          className: '', iconSize: [30, 30], iconAnchor: [15, 15], popupAnchor: [0, -18],
          html: `<div style="position:relative;width:30px;height:30px;">
            ${live ? `<div style="position:absolute;inset:-11px;border-radius:50%;background:${col}1c;animation:zkP 2.4s ease-out infinite;"></div>
                      <div style="position:absolute;inset:-4px;border-radius:50%;background:${col}14;animation:zkP 2.4s .8s ease-out infinite;"></div>` : ''}
            <div style="position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle,${col} 0%,${col}cc 50%,transparent 100%);border:1.5px solid ${col};box-shadow:${live ? `0 0 14px ${col}66,0 0 4px ${col}` : 'none'};"></div>
            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:5px;height:5px;border-radius:50%;background:#fff;opacity:.9;"></div>
          </div>`,
        });
        const m = L.marker([s.lat, s.lon], { icon }).addTo(map).bindPopup(
          `<div style="background:#1a1a1a;border:1px solid ${col};padding:9px 11px;font-family:'Courier New';min-width:170px;box-shadow:0 0 16px ${col}33;">
             <div style="color:${col};font-weight:700;font-size:12px;margin-bottom:6px;">▸ ${s.label}</div>
             <div style="color:#a8a8a8;font-size:11px;">${s.sub}</div>
             <div style="color:${col};font-size:10px;margin-top:4px;">${s.status.toUpperCase()}</div>
           </div>`, { className: 'zkpop', maxWidth: 260 });
        markers.push(m);
      });

      // --- arcos VPN com pacote viajante ---
      (arcs ?? []).forEach((arc, idx) => {
        const [alat, alon] = arc.a, [blat, blon] = arc.b;
        const col = arc.status === 'up' ? '#e05c6e' : '#d48b55';
        const pts: [number, number][] = []; const N = 60;
        for (let i = 0; i <= N; i++) { const t = i / N; pts.push([alat + (blat - alat) * t - Math.sin(t * Math.PI) * 7, alon + (blon - alon) * t]); }
        L.polyline(pts, { color: col, weight: 1, opacity: 0.35, dashArray: arc.status === 'up' ? undefined : '5 9', smoothFactor: 2 }).addTo(map);
        if (arc.status !== 'down') {
          const dot = L.circleMarker(pts[0], { radius: 2.5, color: col, fillColor: '#ffaabb', fillOpacity: .9, opacity: .9, weight: 0 }).addTo(map);
          let step = 0; const total = N + 25;
          const tick = () => {
            if (destroyed) return;
            step = (step + 1) % total;
            if (step < N) { dot.setLatLng(pts[step]); const o = .9 - (step / N) * .6; dot.setStyle({ opacity: o, fillOpacity: o }); }
            else { dot.setLatLng(pts[0]); dot.setStyle({ opacity: 0, fillOpacity: 0 }); }
            timers.push(window.setTimeout(tick, 38 + idx * 10));
          };
          timers.push(window.setTimeout(tick, idx * 400));
        }
      });

      // --- SIZING BLINDADO: o que fazia o mapa aparecer "cortado" ---
      const kick = (fit = false) => {
        if (destroyed || !mapRef.current) return;
        map.invalidateSize({ animate: false });
        if (fit && markers.length) {
          const b = L.featureGroup(markers).getBounds();
          if (b.isValid()) map.fitBounds(b.pad(0.35), { animate: false });
        }
      };
      map.whenReady(() => kick(true));
      requestAnimationFrame(() => kick(true));
      [60, 200, 500, 1000].forEach(ms => timers.push(window.setTimeout(() => kick(ms >= 500), ms)));
      ro = new ResizeObserver(() => kick(false));
      if (hostRef.current) ro.observe(hostRef.current);
    });

    return () => {
      destroyed = true;
      timers.forEach(clearTimeout);
      if (ro) ro.disconnect();
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, [sites, arcs]);

  return (
    // minHeight só quando a altura é fixa; com height='100%' quem manda é o container
    // (senão o mapa estoura para fora ao encolher um painel redimensionável)
    <div ref={hostRef} style={{ position: 'relative', width: '100%', height, minHeight: typeof height === 'number' ? 240 : 0, background: '#0d0f11', overflow: 'hidden' }}>
      <style>{`
        @keyframes zkP { 0%{transform:scale(1);opacity:.6} 100%{transform:scale(2.6);opacity:0} }
        .zkpop .leaflet-popup-content-wrapper{background:transparent!important;border:none!important;box-shadow:none!important;padding:0!important;border-radius:0!important;}
        .zkpop .leaflet-popup-content{margin:0!important;}
        .zkpop .leaflet-popup-tip-container{display:none!important;}
        .zkpop .leaflet-popup-close-button{color:#666!important;right:4px!important;top:4px!important;}
        .leaflet-control-zoom{border:none!important;box-shadow:none!important;}
        .leaflet-control-zoom a{background:#111!important;border:1px solid #222!important;color:#666!important;font-family:'Courier New'!important;border-radius:0!important;}
        .leaflet-control-zoom a:hover{background:#1a0008!important;color:#e05c6e!important;border-color:#e05c6e!important;}
        /* O escurecimento é aplicado UMA vez no painel de tiles, não em cada <img>.
           Tile a tile o WebKit do JavaFX aplicava o filtro de forma inconsistente e o
           mapa virava um xadrez de blocos claros/escuros. Prefixo -webkit- é exigido
           pelo WebKit antigo da WebView. */
        .leaflet-tile{filter:none!important;-webkit-filter:none!important;}
        .leaflet-tile-pane{
          -webkit-filter:brightness(0.78) contrast(1.04) saturate(0.8);
          filter:brightness(0.78) contrast(1.04) saturate(0.8);
        }
        /* mesmo tom dos tiles já filtrados: área ainda carregando não vira "buraco" */
        .leaflet-container{background:#0d0f11!important;font-family:'Courier New',monospace;}
        .leaflet-control-attribution{display:none!important;}
      `}</style>

      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000, height: 24, background: 'rgba(6,10,14,.96)', borderBottom: '1px solid #0d1824', display: 'flex', alignItems: 'center', padding: '0 12px', gap: 14, fontFamily: 'Courier New', fontSize: 10 }}>
        <span style={{ color: '#3a4e60', letterSpacing: 2, textTransform: 'uppercase' }}>Argus // Telemetria Global</span>
        <span style={{ color: '#0e1e2a' }}>|</span>
        {LEGEND.map(([s, lbl]) => (
          <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: COLOR[s], boxShadow: `0 0 4px ${COLOR[s]}` }} />
            <span style={{ color: COLOR[s] }}>{sites.filter(a => a.status === s).length} {lbl}</span>
          </span>
        ))}
        <span style={{ marginLeft: 'auto', color: '#1a2a38', fontSize: 9 }}>Scroll=zoom · Click=info · Drag=pan</span>
        <span style={{ color: tileStats.err ? '#e05c6e' : '#1a2a38', fontSize: 9 }} title="tiles carregados / com erro">
          tiles {tileStats.ok}{tileStats.err > 0 ? ` · ${tileStats.err} erro` : ''}
        </span>
        <span style={{ color: '#1a2a38', fontSize: 9 }}>Z:{zoom}</span>
      </div>

      <div ref={mapElRef} style={{ position: 'absolute', top: 24, left: 0, right: 0, bottom: 0 }} />
      {/* vinheta discreta — antes ia a 50% de preto nas bordas e somava com o filtro,
          fazendo o mapa parecer "apagado/preto" nos cantos */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 500, background: 'radial-gradient(ellipse 90% 90% at 50% 55%, transparent 60%, rgba(3,6,12,.22) 100%)' }} />
    </div>
  );
}
