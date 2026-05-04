import React, { useState, useMemo, useEffect } from "react";
import { diasporaGroups } from "../data/diaspora";
import { centroids } from "../data/countryCentroids";
import { ArcData, CountryHighlight, GlobeState, FlyTarget } from "../types";

interface Props {
  onStateChange: (s: GlobeState) => void;
  onFlyTo: (t: FlyTarget) => void;
}

const fmt = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}M` : `${n}K`;

const DiasporaSidebar: React.FC<Props> = ({ onStateChange, onFlyTo }) => {
  const [selectedId, setSelectedId] = useState(diasporaGroups[0].id);
  const [search, setSearch] = useState("");

  const group = diasporaGroups.find((g) => g.id === selectedId)!;

  const globeState = useMemo<GlobeState>(() => {
    const max = Math.max(...group.destinations.map((d) => d.population));

    // Highlights: origin = white, destinations = group color at varying opacity
    const highlights: CountryHighlight[] = [
      { iso: group.origin, color: "#ffffff", label: `${group.originName} (Origin)` },
    ];

    const arcs: ArcData[] = [];

    const originCentroid = centroids[group.origin];

    group.destinations.forEach(({ country, population }) => {
      const intensity = Math.max(0.25, population / max);
      const hex = group.color.replace("#", "");
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      const ir = Math.round(r * intensity + 15 * (1 - intensity));
      const ig = Math.round(g * intensity + 15 * (1 - intensity));
      const ib = Math.round(b * intensity + 15 * (1 - intensity));
      const color = `rgb(${ir},${ig},${ib})`;

      highlights.push({
        iso: country,
        color,
        label: `${group.name} — ${fmt(population)}`,
      });

      if (originCentroid && centroids[country]) {
        const [oLat, oLng] = originCentroid;
        const [dLat, dLng] = centroids[country];
        const stroke = Math.max(0.3, Math.min(2.5, (population / max) * 2.5));
        arcs.push({
          startLat: oLat,
          startLng: oLng,
          endLat: dLat,
          endLng: dLng,
          color: ["#ffffff", group.color],
          label: `${group.name} → ${country}: ${fmt(population)}`,
          stroke,
        });
      }
    });

    return { highlights, arcs, rings: [] };
  }, [group]);

  useEffect(() => {
    onStateChange(globeState);
  }, [globeState, onStateChange]);

  const filteredGroups = useMemo(
    () =>
      diasporaGroups.filter(
        (g) => !search || g.name.toLowerCase().includes(search.toLowerCase())
      ),
    [search]
  );

  const flyToOrigin = () => {
    const c = centroids[group.origin];
    if (c) onFlyTo({ lat: c[0], lng: c[1], altitude: 1.6 });
  };

  return (
    <>
      <h3 className="sidebar-title">Diaspora Groups</h3>

      <div className="search-row">
        <input
          className="search-input"
          placeholder="Search diaspora…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <ul className="legend-list">
        {filteredGroups.map((g) => (
          <li
            key={g.id}
            className={`legend-item ${selectedId === g.id ? "active" : "inactive"}`}
            onClick={() => setSelectedId(g.id)}
          >
            <span
              className="legend-swatch"
              style={{
                background: g.color,
                boxShadow: selectedId === g.id ? `0 0 8px ${g.color}` : "none",
              }}
            />
            <span className="legend-name">{g.name}</span>
            <span className="legend-stat">{fmt(g.population * 1000)}</span>
          </li>
        ))}
      </ul>

      {group && (
        <div className="detail-card">
          <div className="detail-card-header">
            <h4 style={{ color: group.color }}>{group.name}</h4>
            <button className="fly-btn" onClick={flyToOrigin} title="Fly to origin">◎</button>
          </div>
          <p className="detail-row">Origin: <strong>{group.originName}</strong></p>
          <p className="detail-row">Total diaspora: <strong>{fmt(group.population * 1000)}</strong></p>
          <h5 className="detail-subhead">Top destinations</h5>
          <ul className="dest-list">
            {[...group.destinations]
              .sort((a, b) => b.population - a.population)
              .slice(0, 7)
              .map((d) => (
                <li key={d.country} className="dest-row">
                  <button
                    className="dest-fly"
                    title={`Fly to ${d.country}`}
                    onClick={() => {
                      const c = centroids[d.country];
                      if (c) onFlyTo({ lat: c[0], lng: c[1], altitude: 1.8 });
                    }}
                  >
                    {d.country}
                  </button>
                  <span className="dest-pop">{fmt(d.population)}</span>
                </li>
              ))}
          </ul>
          <p className="sidebar-note" style={{ marginTop: 8 }}>
            Animated arcs show migration flows. Arc thickness scales with population size.
          </p>
        </div>
      )}
    </>
  );
};

export default DiasporaSidebar;
