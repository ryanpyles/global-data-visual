import React, { useEffect, useRef, useCallback } from "react";
import Globe, { GlobeInstance } from "globe.gl";

export interface CountryHighlight {
  iso: string;
  color: string;
  label?: string;
}

interface Props {
  highlights: CountryHighlight[];
  onCountryClick?: (iso: string) => void;
}

const GlobeViz: React.FC<Props> = ({ highlights, onCountryClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<GlobeInstance | null>(null);
  const geoDataRef = useRef<any[]>([]);

  const buildPolygons = useCallback(
    (features: any[]) => {
      const highlightMap = new Map(highlights.map((h) => [h.iso, h]));
      return features.map((feat: any) => {
        const iso = feat.properties?.ISO_A2 || feat.properties?.iso_a2 || "";
        const match = highlightMap.get(iso);
        return {
          ...feat,
          properties: {
            ...feat.properties,
            highlightColor: match ? match.color : null,
            label: match?.label || feat.properties?.ADMIN || feat.properties?.name || iso,
          },
        };
      });
    },
    [highlights]
  );

  const applyPolygons = useCallback(
    (globe: GlobeInstance, polygons: any[]) => {
      (globe as any)
        .polygonsData(polygons)
        .polygonAltitude((d: any) => (d.properties.highlightColor ? 0.015 : 0.002))
        .polygonCapColor((d: any) =>
          d.properties.highlightColor
            ? d.properties.highlightColor + "cc"
            : "rgba(20,40,60,0.4)"
        )
        .polygonSideColor((d: any) =>
          d.properties.highlightColor
            ? d.properties.highlightColor + "88"
            : "rgba(0,0,0,0)"
        )
        .polygonStrokeColor((d: any) =>
          d.properties.highlightColor
            ? d.properties.highlightColor
            : "rgba(80,120,160,0.3)"
        )
        .polygonLabel((d: any) =>
          d.properties.highlightColor
            ? `<div style="background:rgba(0,0,0,0.85);padding:6px 10px;border-radius:6px;border:1px solid ${d.properties.highlightColor};color:#fff;font-size:13px;pointer-events:none">${d.properties.label}</div>`
            : ""
        )
        .onPolygonClick((d: any) => {
          const iso = d.properties?.ISO_A2 || d.properties?.iso_a2 || "";
          if (iso && onCountryClick) onCountryClick(iso);
        });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onCountryClick]
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const globe = new Globe(containerRef.current);
    globeRef.current = globe;

    (globe as any)
      .globeImageUrl("//unpkg.com/three-globe/example/img/earth-dark.jpg")
      .backgroundImageUrl("//unpkg.com/three-globe/example/img/night-sky.png")
      .showAtmosphere(true)
      .atmosphereColor("#1e3a5f")
      .atmosphereAltitude(0.12)
      .width(containerRef.current.clientWidth)
      .height(containerRef.current.clientHeight);

    fetch(
      "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"
    )
      .then((r) => r.json())
      .then((data) => {
        geoDataRef.current = data.features;
        applyPolygons(globe, buildPolygons(data.features));
      });

    const handleResize = () => {
      if (containerRef.current) {
        (globe as any)
          .width(containerRef.current.clientWidth)
          .height(containerRef.current.clientHeight);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const globe = globeRef.current;
    if (!globe || !geoDataRef.current.length) return;
    applyPolygons(globe, buildPolygons(geoDataRef.current));
  }, [highlights, buildPolygons, applyPolygons]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
};

export default GlobeViz;
