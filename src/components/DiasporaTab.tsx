import React, { useState, useMemo } from "react";
import GlobeViz, { CountryHighlight } from "./GlobeViz";
import { diasporaGroups, DiasporaGroup } from "../data/diaspora";

const fmt = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}M` : `${n}K`;

const DiasporaTab: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>(diasporaGroups[0].id);

  const group: DiasporaGroup = diasporaGroups.find((g) => g.id === selectedId)!;

  const highlights = useMemo<CountryHighlight[]>(() => {
    const max = Math.max(...group.destinations.map((d) => d.population));
    const out: CountryHighlight[] = [];

    // Origin country always highlighted distinctly
    out.push({ iso: group.origin, color: "#ffffff", label: `${group.originName} (Origin)` });

    group.destinations.forEach(({ country, population }) => {
      const intensity = Math.max(0.2, population / max);
      const hex = group.color.replace("#", "");
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      const ir = Math.round(r * intensity + 10 * (1 - intensity));
      const ig = Math.round(g * intensity + 10 * (1 - intensity));
      const ib = Math.round(b * intensity + 10 * (1 - intensity));
      const color = `rgb(${ir},${ig},${ib})`;
      out.push({ iso: country, color, label: `${group.name} — ${fmt(population)}` });
    });
    return out;
  }, [group]);

  return (
    <div className="tab-layout">
      <aside className="sidebar">
        <h3 className="sidebar-title">Diaspora Groups</h3>
        <ul className="legend-list">
          {diasporaGroups.map((g) => (
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
            <h4 style={{ color: group.color }}>{group.name}</h4>
            <p>Origin: <strong>{group.originName}</strong></p>
            <p>Total diaspora: <strong>{fmt(group.population * 1000)}</strong></p>
            <h5>Top destinations</h5>
            <ul className="dest-list">
              {[...group.destinations]
                .sort((a, b) => b.population - a.population)
                .slice(0, 6)
                .map((d) => (
                  <li key={d.country}>
                    <span className="dest-iso">{d.country}</span>
                    <span>{fmt(d.population)}</span>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </aside>
      <div className="globe-area">
        <GlobeViz highlights={highlights} />
      </div>
    </div>
  );
};

export default DiasporaTab;
