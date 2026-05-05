import React, { useState, useMemo, useEffect } from "react";
import { statelessGroups, StatelessGroup } from "../data/stateless";
import { centroids } from "../data/countryCentroids";
import { WORLD_POP } from "../data/countryPopulations";
import { CountryHighlight, RingData, GlobeState, FlyTarget } from "../types";

interface Props {
  onStateChange: (s: GlobeState) => void;
  onFlyTo: (t: FlyTarget) => void;
}

const fmt = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}M` : `${n}K`;

const TOTAL_STATELESS = statelessGroups.reduce((s, g) => s + g.population, 0); // thousands
const ALL_IDS = new Set(statelessGroups.map((g) => g.id));

const StatelessSidebar: React.FC<Props> = ({ onStateChange, onFlyTo }) => {
  const [selected, setSelected] = useState<Set<string>>(ALL_IDS);
  const [expanded, setExpanded] = useState<string | null>(null);
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
        const key = `${g.id}:${iso}`;
        if (!seenRing.has(key) && centroids[iso]) {
          seenRing.add(key);
          const [lat, lng] = centroids[iso];
          // size = population; concentrated = tighter, distributed = wider
          const base = Math.max(1.5, Math.min(5, Math.log10(g.population + 1) * 1.8));
          const maxR = g.type === "distributed" ? base * 1.4 : base;
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

  const toggleExpand = (id: string) =>
    setExpanded((prev) => (prev === id ? null : id));

  const allOn = selected.size === statelessGroups.length;
  const selectedPop = statelessGroups
    .filter((g) => selected.has(g.id))
    .reduce((s, g) => s + g.population, 0);
  const worldPct = ((selectedPop / 1000 / WORLD_POP) * 100).toFixed(3);

  return (
    <>
      <h3 className="sidebar-title">Stateless Peoples</h3>

      {/* World framing */}
      <div className="stateless-framing">
        <div className="framing-numbers">
          <span className="framing-big">{fmt(selectedPop)}</span>
          <span className="framing-label">
            people — {worldPct}% of humanity
          </span>
        </div>
        <div className="framing-bar-track">
          <div
            className="framing-bar-fill"
            style={{ width: `${Math.max(0.5, parseFloat(worldPct) * 800)}%` }}
          />
        </div>
        <div className="framing-note">
          Global stateless: ~{fmt(TOTAL_STATELESS)} per UNHCR
        </div>
      </div>

      {/* Pulse ring legend */}
      <div className="pulse-legend">
        <div className="pulse-legend-title">Ring key</div>
        <div className="pulse-legend-row">
          <div className="pulse-dot pulse-sm" />
          <span>Smaller ring = fewer affected</span>
        </div>
        <div className="pulse-legend-row">
          <div className="pulse-dot pulse-lg" />
          <span>Larger ring = greater population</span>
        </div>
        <div className="pulse-legend-row">
          <div className="pulse-dash" />
          <span>Concentrated displacement</span>
        </div>
        <div className="pulse-legend-row">
          <div className="pulse-dash pulse-dash-wide" />
          <span>Distributed identity</span>
        </div>
      </div>

      <div className="search-row">
        <input
          className="search-input"
          placeholder="Search group…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="sidebar-row-actions">
        <button
          className="toggle-all-btn"
          onClick={() => setSelected(allOn ? new Set() : new Set(ALL_IDS))}
        >
          {allOn ? "Deselect All" : "Select All"}
        </button>
        <span className="sidebar-note">{selected.size} / {statelessGroups.length} shown</span>
      </div>

      <ul className="legend-list stateless-list">
        {filtered.map((g) => {
          const on = selected.has(g.id);
          const exp = expanded === g.id;
          return (
            <li key={g.id} className={`stateless-item ${on ? "active" : "inactive"}`}>
              <div className="stateless-item-row">
                <span
                  className="legend-swatch"
                  style={{
                    background: g.color,
                    boxShadow: on ? `0 0 6px ${g.color}` : "none",
                    cursor: "pointer",
                  }}
                  onClick={() => toggle(g.id)}
                />
                <div className="stateless-meta" onClick={() => toggle(g.id)}>
                  <div className="stateless-name">{g.name}</div>
                  <div className="stateless-since">
                    <span
                      className={`type-badge ${g.type}`}
                    >
                      {g.type}
                    </span>
                    <span className="since-text">Since {g.since}</span>
                  </div>
                </div>
                <div className="stateless-right">
                  <span className="legend-stat">{fmt(g.population)}</span>
                  <button
                    className="fly-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      const first = g.countries.find((iso) => centroids[iso]);
                      if (first) {
                        const [lat, lng] = centroids[first];
                        onFlyTo({ lat, lng, altitude: 1.8 });
                      }
                    }}
                  >
                    ◎
                  </button>
                  <button
                    className="expand-btn"
                    onClick={() => toggleExpand(g.id)}
                    title="Show context"
                  >
                    {exp ? "▲" : "▼"}
                  </button>
                </div>
              </div>

              {exp && (
                <div className="stateless-context">
                  <p className="context-cause">
                    <strong>Why stateless:</strong> {g.cause}
                  </p>
                  <p className="context-desc">{g.description}</p>
                  {g.relatedGroups && g.relatedGroups.length > 0 && (
                    <div className="related-row">
                      <span className="related-label">Related: </span>
                      {g.relatedGroups.map((rid) => {
                        const rel = statelessGroups.find((x) => x.id === rid);
                        return rel ? (
                          <span
                            key={rid}
                            className="related-tag"
                            style={{ borderColor: rel.color, color: rel.color }}
                          >
                            {rel.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
};

export default StatelessSidebar;
