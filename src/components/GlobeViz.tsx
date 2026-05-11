import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import Globe, { GlobeInstance } from "globe.gl";
import { Vector2 } from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { CountryHighlight, ArcData, RingData, FlyTarget, TabId } from "../types";
import { iso3to2 } from "../data/isoMapping";

export interface GlobeHandle {
  flyTo: (target: FlyTarget) => void;
}

interface Props {
  highlights: CountryHighlight[];
  arcs: ArcData[];
  rings: RingData[];
  mode: TabId;
  onCountryClick: (iso: string, name: string) => void;
}

// Bloom/ring config per mode
const MODE_CONFIG: Record<TabId, { bloom: number; ringSpeed: number; ringPeriod: number }> = {
  languages: { bloom: 0.55, ringSpeed: 3,   ringPeriod: 900 },
  diaspora:  { bloom: 0.48, ringSpeed: 3,   ringPeriod: 900 },
  stateless: { bloom: 0.20, ringSpeed: 1.2, ringPeriod: 1800 },
};

const tooltipHtml = (d: any) =>
  d.properties.highlightColor
    ? `<div style="background:rgba(5,13,26,0.94);padding:8px 12px;border-radius:8px;border:1px solid ${d.properties.highlightColor};color:#e2eaf4;font-size:13px;font-family:system-ui,sans-serif;pointer-events:none;max-width:240px;line-height:1.5">${d.properties.label}</div>`
    : `<div style="background:rgba(5,13,26,0.8);padding:5px 10px;border-radius:6px;color:#7a94b0;font-size:12px;font-family:system-ui,sans-serif;pointer-events:none">${d.properties.name ?? ""}</div>`;

const GlobeViz = forwardRef<GlobeHandle, Props>(
  ({ highlights, arcs, rings, mode, onCountryClick }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const globeRef = useRef<GlobeInstance | null>(null);
    const geoRef = useRef<any[]>([]);
    const [loaded, setLoaded] = useState(false);
    const bloomPassRef = useRef<UnrealBloomPass | null>(null);
    const composerRef = useRef<EffectComposer | null>(null);

    useImperativeHandle(ref, () => ({
      flyTo({ lat, lng, altitude = 1.8 }: FlyTarget) {
        (globeRef.current as any)?.pointOfView({ lat, lng, altitude }, 1200);
      },
    }));

    const buildPolygons = (features: any[], hlMap: Map<string, CountryHighlight>) =>
      features.map((feat: any) => {
        const iso2 = iso3to2[feat.id] ?? "";
        const match = hlMap.get(iso2);
        return {
          ...feat,
          properties: {
            ...feat.properties,
            iso2,
            highlightColor: match?.color ?? null,
            label: match?.label || feat.properties?.name || iso2,
          },
        };
      });

    const applyPolygons = (globe: any, polygons: any[]) => {
      globe
        .polygonsData(polygons)
        .polygonAltitude((d: any) => (d.properties.highlightColor ? 0.018 : 0.002))
        .polygonCapColor((d: any) =>
          d.properties.highlightColor ? d.properties.highlightColor + "cc" : "#0d1f35"
        )
        .polygonSideColor((d: any) =>
          d.properties.highlightColor ? d.properties.highlightColor + "99" : "rgba(0,0,0,0)"
        )
        .polygonStrokeColor((d: any) =>
          d.properties.highlightColor ? d.properties.highlightColor : "#1a3a5c"
        )
        .polygonLabel(tooltipHtml)
        .onPolygonClick((d: any) => {
          const iso2 = d.properties?.iso2 ?? "";
          const name = d.properties?.name || iso2;
          if (iso2) onCountryClick(iso2, name);
        });
    };

    // One-time globe setup
    useEffect(() => {
      if (!containerRef.current) return;

      const globe = new Globe(containerRef.current) as any;
      globeRef.current = globe as GlobeInstance;

      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;

      globe
        .globeImageUrl("/earth-blue-marble.jpg")
        .backgroundImageUrl("/night-sky.png")
        .showAtmosphere(true)
        .atmosphereColor("#1a4a8a")
        .atmosphereAltitude(0.14)
        .width(w)
        .height(h);

      // Controls — inertial, weighted feel
      const controls = globe.controls();
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.22;
      controls.enableDamping = true;
      controls.dampingFactor = 0.06;
      controls.rotateSpeed = 0.55;
      controls.zoomSpeed = 0.8;

      const el = containerRef.current;
      const pause = () => { controls.autoRotate = false; };
      const resume = () => { controls.autoRotate = true; };
      el.addEventListener("mouseenter", pause);
      el.addEventListener("mouseleave", resume);
      el.addEventListener("touchstart", pause, { passive: true });
      el.addEventListener("touchend", resume, { passive: true });

      // Bloom
      const renderer = globe.renderer();
      const scene = globe.scene();
      const camera = globe.camera();
      const composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      const bloomPass = new UnrealBloomPass(new Vector2(w, h), 0.55, 0.5, 0.08);
      composer.addPass(bloomPass);
      composerRef.current = composer;
      bloomPassRef.current = bloomPass;

      let composing = false;
      const origRender = renderer.render.bind(renderer);
      renderer.render = (s: any, c: any) => {
        if (s === scene && !composing) {
          composing = true;
          composer.render();
          composing = false;
        } else {
          origRender(s, c);
        }
      };

      // Arc defaults — altitude scales with stroke (large routes arc higher)
      globe
        .arcColor("color")
        .arcAltitude((d: any) => d.altitude ?? 0.35)
        .arcStroke("stroke")
        .arcDashLength(0.38)
        .arcDashGap(0.12)
        .arcDashAnimateTime((d: any) => {
          // Faster major routes feel more urgent; tiny routes feel fragile
          const base = d.stroke ?? 0.5;
          return Math.max(1000, Math.round(2800 - base * 600));
        })
        .arcLabel((d: any) =>
          `<div style="background:rgba(5,13,26,0.92);padding:6px 12px;border-radius:8px;border:1px solid rgba(255,255,255,0.08);color:#e2eaf4;font-size:12px;font-family:system-ui,sans-serif;letter-spacing:0.01em">${d.label}</div>`
        );

      // Ring defaults
      globe
        .ringColor((d: any) => (t: number) => {
          const alpha = Math.round((1 - t) * 255).toString(16).padStart(2, "0");
          return `${d.color}${alpha}`;
        })
        .ringMaxRadius("maxR")
        .ringPropagationSpeed(3)
        .ringRepeatPeriod(900);

      // Load GeoJSON
      fetch("/world.geojson")
        .then((r) => r.json())
        .then((data) => {
          geoRef.current = data.features;
          setLoaded(true);
        });

      const onResize = () => {
        if (!containerRef.current) return;
        const nw = containerRef.current.clientWidth;
        const nh = containerRef.current.clientHeight;
        globe.width(nw).height(nh);
        composer.setSize(nw, nh);
        bloomPass.resolution.set(nw, nh);
      };
      window.addEventListener("resize", onResize);

      return () => {
        window.removeEventListener("resize", onResize);
        el.removeEventListener("mouseenter", pause);
        el.removeEventListener("mouseleave", resume);
        el.removeEventListener("touchstart", pause);
        el.removeEventListener("touchend", resume);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Adjust bloom + ring speed when mode changes
    useEffect(() => {
      const cfg = MODE_CONFIG[mode];
      if (bloomPassRef.current) bloomPassRef.current.strength = cfg.bloom;
      const g = globeRef.current as any;
      if (g) {
        g.ringPropagationSpeed(cfg.ringSpeed).ringRepeatPeriod(cfg.ringPeriod);
      }
    }, [mode]);

    // Sync polygons
    useEffect(() => {
      const globe = globeRef.current as any;
      if (!globe || !loaded) return;
      const hlMap = new Map(highlights.map((h) => [h.iso, h]));
      applyPolygons(globe, buildPolygons(geoRef.current, hlMap));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [highlights, loaded]);

    // Sync arcs
    useEffect(() => {
      (globeRef.current as any)?.arcsData(arcs);
    }, [arcs]);

    // Sync rings
    useEffect(() => {
      (globeRef.current as any)?.ringsData(rings);
    }, [rings]);

    return (
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        {!loaded && (
          <div className="globe-loading">
            <div className="globe-spinner" />
            <span>Loading globe data…</span>
          </div>
        )}
        <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      </div>
    );
  }
);

export default GlobeViz;
