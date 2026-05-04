import React, { useState, useMemo, useEffect } from "react";
import { statelessGroups } from "../data/stateless";
import { centroids } from "../data/countryCentroids";
import { CountryHighlight, RingData, GlobeState, FlyTarget } from "../types";

interface Props {
  onStateChange: (s: GlobeState) => void;
  onFlyTo: (t: FlyTarget) => void;
}

const fmt = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}M` : `${n}K`;

const ALL_IDS = new Set(statelessGroups.map((g) => g.id));

const StatelessSidebar: React.FC<Props> = ({ onStateChange, onFlyTo }) => {
  const [selected, setSelected] = useState<Set<string>>(ALL_IDS);
  const [hovered, setHovered] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      statelessGroups.filter(
        (g) => !search || g.name.toLowerCase().includes(search.toLowerCase())
      ),
    [search]
  );

  const globeState = useMemo<GlobeState>(() => {
    const highlights: CountryHighlight[] = [];
    const rings: RingData[] = [];
    const seenHl = new Map<string, string>();
    const seenRing = new Set<string>();

    statelessGroups.forEach((g) => {
      if (!selected.has(g.id)) return;
      g.countries.forEach((iso) => {
        if (!seenHl.has(iso)) {
          seenHl.set(iso, g.color);
          highlights.push({ iso, color: g.color, label: g.name });
        }
        const ringKey = `${g.id}-${iso}`;
        if (!seenRing.has(ringKey) && centroids[iso]) {
          seenRing.add(ringKey);
          const [lat, lng] = centroids[iso];
          const maxR = Math.max(2, Math.min(6, Math.log10(g.population + 1) * 2));
          rings.push({ lat, lng, color: g.color, label: g.name, maxR });
        }
      });
    });

    return { highlights, arcs: [], rings };
  }, [selected]);

  useEffect(() => {
    onStateChange(globeState);
  }, [globeState, onStateChange]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const allOn = selected.size === statelessGroups.length;
  const hoveredGroup = hovered ? statelessGroups.find((g) => g.id === hovered) : null;

  return (
    <>
      <h3 className="sidebar-title">Stateless Peoples</h3>

      <div className="search-row">
        <input
          className="search-input"
          placeholder="Search group…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <p className="sidebar-note">
        Estimated <strong>~10 million</strong> stateless people worldwide (UNHCR). Pulse rings mark affected regions.
      </p>

      <button
        className="toggle-all-btn"
        onClick={() => setSelected(allOn ? new Set() : new Set(ALL_IDS))}
      >
        {allOn ? "Deselect All" : "Select All"}
      </button>

      <ul className="legend-list">
        {filtered.map((g) => (
          <li
            key={g.id}
            className={`legend-item ${selected.has(g.id) ? "active" : "inactive"}`}
            onMouseEnter={() => setHovered(g.id)}
            onMouseLeave={() => setHovered(null)}
          >
            <span
              className="legend-swatch"
              style={{
                background: g.color,
                boxShadow: selected.has(g.id) ? `0 0 8px ${g.color}` : "none",
              }}
              onClick={() => toggle(g.id)}
            />
            <span className="legend-name" onClick={() => toggle(g.id)}>
              {g.name}
            </span>
            <span className="legend-stat">{fmt(g.population)}</span>
            <button
              className="fly-btn"
              title={`Fly to ${g.name}`}
              onClick={() => {
                const first = g.countries.find((iso) => centroids[iso]);
                if (first) {
                  const [lat, lng] = centroids[first];
                  onFlyTo({ lat, lng, altitude: 1.8 });
                }
              }}
            >
              ◎
            </button>
          </li>
        ))}
      </ul>

      {hoveredGroup && (
        <div className="detail-card" style={{ borderColor: hoveredGroup.color }}>
          <h4 style={{ color: hoveredGroup.color }}>{hoveredGroup.name}</h4>
          <p className="desc-text">{hoveredGroup.description}</p>
          <p className="detail-row" style={{ marginTop: 6 }}>
            Est. population: <strong>{fmt(hoveredGroup.population)}</strong>
          </p>
        </div>
      )}
    </>
  );
};

export default StatelessSidebar;
