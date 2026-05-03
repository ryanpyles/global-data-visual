import React, { useState, useMemo } from "react";
import GlobeViz, { CountryHighlight } from "./GlobeViz";
import { statelessGroups } from "../data/stateless";

const fmt = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}M` : `${n}K`;

const StatelessTab: React.FC = () => {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(statelessGroups.map((g) => g.id))
  );
  const [hovered, setHovered] = useState<string | null>(null);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const highlights = useMemo<CountryHighlight[]>(() => {
    const out: CountryHighlight[] = [];
    const seen = new Map<string, string>();
    statelessGroups.forEach((g) => {
      if (!selected.has(g.id)) return;
      g.countries.forEach((iso) => {
        if (!seen.has(iso)) {
          seen.set(iso, g.color);
          out.push({ iso, color: g.color, label: g.name });
        }
      });
    });
    return out;
  }, [selected]);

  const hoveredGroup = hovered ? statelessGroups.find((g) => g.id === hovered) : null;

  return (
    <div className="tab-layout">
      <aside className="sidebar">
        <h3 className="sidebar-title">Stateless Peoples</h3>
        <p className="sidebar-note" style={{ marginBottom: "12px" }}>
          Estimated <strong>~10 million</strong> stateless people worldwide per UNHCR.
        </p>
        <ul className="legend-list">
          {statelessGroups.map((g) => (
            <li
              key={g.id}
              className={`legend-item ${selected.has(g.id) ? "active" : "inactive"}`}
              onClick={() => toggle(g.id)}
              onMouseEnter={() => setHovered(g.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <span
                className="legend-swatch"
                style={{
                  background: g.color,
                  boxShadow: selected.has(g.id) ? `0 0 8px ${g.color}` : "none",
                }}
              />
              <span className="legend-name">{g.name}</span>
              <span className="legend-stat">{fmt(g.population)}</span>
            </li>
          ))}
        </ul>

        {hoveredGroup && (
          <div className="detail-card" style={{ borderColor: hoveredGroup.color }}>
            <h4 style={{ color: hoveredGroup.color }}>{hoveredGroup.name}</h4>
            <p className="desc-text">{hoveredGroup.description}</p>
            <p>Est. population: <strong>{fmt(hoveredGroup.population)}</strong></p>
          </div>
        )}
      </aside>
      <div className="globe-area">
        <GlobeViz highlights={highlights} />
      </div>
    </div>
  );
};

export default StatelessTab;
