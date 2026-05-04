import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import Globe, { GlobeInstance } from "globe.gl";
import { Vector2 } from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { CountryHighlight, ArcData, RingData, FlyTarget } from "../types";

export interface GlobeHandle {
  flyTo: (target: FlyTarget) => void;
}

interface Props {
  highlights: CountryHighlight[];
  arcs: ArcData[];
  rings: RingData[];
  onCountryClick: (iso: string, name: string) => void;
}

const POLYGON_LABEL = (d: any) =>
  d.properties.highlightColor
    ? `<div style="background:rgba(5,13,26,0.92);padding:7px 12px;border-radius:8px;border:1px solid ${d.properties.highlightColor};color:#e2eaf4;font-size:13px;font-family:system-ui,sans-serif;pointer-events:none;max-width:220px">${d.properties.label}</div>`
    : "";

const GlobeViz = forwardRef<GlobeHandle, Props>(
  ({ highlights, arcs, rings, onCountryClick }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const globeRef = useRef<GlobeInstance | null>(null);
    const geoRef = useRef<any[]>([]);
    const [loaded, setLoaded] = useState(false);
    const composerRef = useRef<EffectComposer | null>(null);

    useImperativeHandle(ref, () => ({
      flyTo({ lat, lng, altitude = 1.8 }: FlyTarget) {
        (globeRef.current as any)?.pointOfView({ lat, lng, altitude }, 1200);
      },
    }));

    // Build polygon features from raw geo + highlight map
    const buildPolygons = (features: any[], hlMap: Map<string, CountryHighlight>) =>
      features.map((feat: any) => {
        const iso =
          feat.properties?.ISO_A2 ||
          feat.properties?.iso_a2 ||
          feat.properties?.ADM0_A3_IS ||
          "";
        const match = hlMap.get(iso);
        return {
          ...feat,
          properties: {
            ...feat.properties,
            highlightColor: match?.color ?? null,
            label: match?.label || feat.properties?.ADMIN || feat.properties?.name || iso,
          },
        };
      });

    // Apply polygon layer config to globe
    const applyPolygons = (globe: any, polygons: any[]) => {
      globe
        .polygonsData(polygons)
        .polygonAltitude((d: any) => (d.properties.highlightColor ? 0.018 : 0.002))
        .polygonCapColor((d: any) =>
          d.properties.highlightColor
            ? d.properties.highlightColor + "bb"
            : "rgba(16,36,58,0.35)"
        )
        .polygonSideColor((d: any) =>
          d.properties.highlightColor
            ? d.properties.highlightColor + "99"
            : "rgba(0,0,0,0)"
        )
        .polygonStrokeColor((d: any) =>
          d.properties.highlightColor
            ? d.properties.highlightColor
            : "rgba(60,100,140,0.2)"
        )
        .polygonLabel(POLYGON_LABEL)
        .onPolygonClick((d: any) => {
          const iso =
            d.properties?.ISO_A2 ||
            d.properties?.iso_a2 ||
            d.properties?.ADM0_A3_IS ||
            "";
          const name =
            d.properties?.ADMIN || d.properties?.name || iso;
          if (iso) onCountryClick(iso, name);
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
        .globeImageUrl("/earth-dark.jpg")
        .backgroundImageUrl("/night-sky.png")
        .showAtmosphere(true)
        .atmosphereColor("#1e3a5f")
        .atmosphereAltitude(0.14)
        .width(w)
        .height(h);

      // Auto-rotate
      const controls = globe.controls();
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.35;
      controls.enableDamping = true;

      const el = containerRef.current;
      const pauseRotate = () => { controls.autoRotate = false; };
      const resumeRotate = () => { controls.autoRotate = true; };
      el.addEventListener("mouseenter", pauseRotate);
      el.addEventListener("mouseleave", resumeRotate);
      el.addEventListener("touchstart", pauseRotate, { passive: true });
      el.addEventListener("touchend", resumeRotate, { passive: true });

      // Bloom post-processing
      const renderer = globe.renderer();
      const scene = globe.scene();
      const camera = globe.camera();

      const composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      const bloomPass = new UnrealBloomPass(new Vector2(w, h), 0.7, 0.4, 0.05);
      composer.addPass(bloomPass);
      composerRef.current = composer;

      // Intercept globe's internal renderer.render call to pipe through bloom
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

      // Arc layer defaults
      globe
        .arcColor("color")
        .arcAltitude(0.35)
        .arcStroke("stroke")
        .arcDashLength(0.35)
        .arcDashGap(0.15)
        .arcDashAnimateTime(2200)
        .arcLabel((d: any) =>
          `<div style="background:rgba(5,13,26,0.9);padding:6px 10px;border-radius:6px;color:#e2eaf4;font-size:12px;font-family:system-ui,sans-serif">${d.label}</div>`
        );

      // Ring layer defaults
      globe
        .ringColor((d: any) => (t: number) => {
          const c = d.color;
          const alpha = 1 - t;
          return `${c}${Math.round(alpha * 255).toString(16).padStart(2, "0")}`;
        })
        .ringMaxRadius("maxR")
        .ringPropagationSpeed(3)
        .ringRepeatPeriod(900);

      // Load local GeoJSON
      fetch("/world.geojson")
        .then((r) => r.json())
        .then((data) => {
          geoRef.current = data.features;
          setLoaded(true);
        });

      // Resize
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
        el.removeEventListener("mouseenter", pauseRotate);
        el.removeEventListener("mouseleave", resumeRotate);
        el.removeEventListener("touchstart", pauseRotate);
        el.removeEventListener("touchend", resumeRotate);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Sync highlights → polygons
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
