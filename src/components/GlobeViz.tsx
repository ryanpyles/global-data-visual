import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import Globe, { GlobeInstance } from "globe.gl";
import { Vector2, BufferGeometry, BufferAttribute, PointsMaterial, Points, Color, MeshPhongMaterial } from "three";
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

// Bloom is restrained: threshold 0.68+ means only genuinely bright pixels bloom.
// Strength kept low so glow enhances edges, not floods the scene.
const MODE_CONFIG: Record<TabId, { bloom: number; radius: number; threshold: number; ringSpeed: number; ringPeriod: number }> = {
  languages: { bloom: 0.22, radius: 0.32, threshold: 0.68, ringSpeed: 3,   ringPeriod: 900 },
  diaspora:  { bloom: 0.18, radius: 0.28, threshold: 0.72, ringSpeed: 3,   ringPeriod: 900 },
  stateless: { bloom: 0.10, radius: 0.22, threshold: 0.76, ringSpeed: 1.2, ringPeriod: 1800 },
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
        .polygonAltitude((d: any) => (d.properties.highlightColor ? 0.016 : 0.001))
        .polygonCapColor((d: any) =>
          d.properties.highlightColor ? d.properties.highlightColor : "#070f1c"
        )
        .polygonSideColor((d: any) =>
          d.properties.highlightColor ? d.properties.highlightColor + "55" : "rgba(0,0,0,0)"
        )
        .polygonStrokeColor((d: any) =>
          d.properties.highlightColor ? d.properties.highlightColor + "88" : "rgba(10,20,38,0.5)"
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
        .globeImageUrl("")
        .globeMaterial(new MeshPhongMaterial({
          color: new Color(0x06101e),
          emissive: new Color(0x010609),
          shininess: 5,
          specular: new Color(0x0d2a50),
        }))
        .showAtmosphere(true)
        .atmosphereColor("#1d6bb5")
        .atmosphereAltitude(0.24)
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

      // Bloom — restrained: high threshold, low strength, small radius
      // This means only selected-region edges glow; oceans/unselected land stay dark
      const renderer = globe.renderer();
      const scene = globe.scene();
      const camera = globe.camera();
      const composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      const initCfg = MODE_CONFIG["languages"];
      const bloomPass = new UnrealBloomPass(new Vector2(w, h), initCfg.bloom, initCfg.radius, initCfg.threshold);
      composer.addPass(bloomPass);
      composerRef.current = composer;
      bloomPassRef.current = bloomPass;

      // Custom star field — replaces backgroundImageUrl with dimensional depth
      scene.background = new Color(0x020810);
      const starGeo = new BufferGeometry();
      const starCount = 3200;
      const starPos = new Float32Array(starCount * 3);
      const starCol = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 160 + Math.random() * 140;
        starPos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
        starPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        starPos[i * 3 + 2] = r * Math.cos(phi);
        const rnd = Math.random();
        if (rnd < 0.04) {
          // Warm yellow star
          starCol[i * 3] = 1.0; starCol[i * 3 + 1] = 0.90; starCol[i * 3 + 2] = 0.60;
        } else if (rnd < 0.09) {
          // Blue giant
          starCol[i * 3] = 0.55; starCol[i * 3 + 1] = 0.72; starCol[i * 3 + 2] = 1.0;
        } else {
          // White-cool
          const v = 0.45 + Math.random() * 0.45;
          starCol[i * 3] = v * 0.88; starCol[i * 3 + 1] = v * 0.92; starCol[i * 3 + 2] = v;
        }
      }
      starGeo.setAttribute("position", new BufferAttribute(starPos, 3));
      starGeo.setAttribute("color",    new BufferAttribute(starCol, 3));
      const starMat = new PointsMaterial({ size: 0.55, sizeAttenuation: true, vertexColors: true, transparent: true, opacity: 0.70 });
      scene.add(new Points(starGeo, starMat));

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
      if (bloomPassRef.current) {
        bloomPassRef.current.strength  = cfg.bloom;
        bloomPassRef.current.radius    = cfg.radius;
        bloomPassRef.current.threshold = cfg.threshold;
      }
      const g = globeRef.current as any;
      if (g) g.ringPropagationSpeed(cfg.ringSpeed).ringRepeatPeriod(cfg.ringPeriod);
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
