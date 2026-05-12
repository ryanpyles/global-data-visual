import React, { useState, useMemo, useEffect, useRef } from "react";
import { statelessGroups } from "../data/stateless";
import { centroids } from "../data/countryCentroids";
import { WORLD_POP } from "../data/countryPopulations";
import { CountryHighlight, RingData, GlobeState, FlyTarget } from "../types";

function useCountUp(target: number, duration = 700): number {
  const [display, setDisplay] = useState(target);
  const prev = useRef(target);
  useEffect(() => {
    if (prev.current === target) return;
    const start = prev.current;
    const diff = target - start;
    const t0 = performance.now();
    let rafId: number;
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(start + diff * ease));
      if (p < 1) rafId = requestAnimationFrame(tick);
      else prev.current = target;
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration]);
  return display;
}

interface StoryConfig {
  selectedIds?: string[];
  isolate?: boolean;
  configKey?: string;
}

interface Props {
  onStateChange: (s: GlobeState) => void;
  onFlyTo: (t: FlyTarget) => void;
  storyConfig?: StoryConfig;
}

const fmt = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}M` : `${n}K`;

const TOTAL_STATELESS = statelessGroups.reduce((s, g) => s + g.population, 0); // thousands
const ALL_IDS = new Set(statelessGroups.map((g) => g.id));

type SortKey = "population" | "name" | "since";

const StatelessSidebar: React.FC<Props> = ({ onStateChange, onFlyTo, storyConfig }) => {
  const [selected, setSelected] = useState<Set<string>>(ALL_IDS);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isolate, setIsolate] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("population");

  // Respond to beat-by-beat story config changes
  useEffect(() => {
    if (!storyConfig?.configKey) return;
    if (storyConfig.selectedIds) setSelected(new Set(storyConfig.selectedIds));
    else setSelected(ALL_IDS);
    if (storyConfig.isolate !== undefined) setIsolate(storyConfig.isolate);
  }, [storyConfig?.configKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const base = statelessGroups.filter(
      (g) => !search || g.name.toLowerCase().includes(search.toLowerCase())
    );
    return [...base].sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name);
      if (sortKey === "since") return parseInt(a.since) - parseInt(b.since);
      return b.population - a.population;
    });
  }, [search, sortKey]);

  const globeState = useMemo<GlobeState>(() => {
    const highlights: CountryHighlight[] = [];
    const rings: RingData[] = [];
    const seenHl = new Map<string, string>();
    const seenRing = new Set<string>();

    statelessGroups.forEach((g) => {
      const on = selected.has(g.id);
      if (!on && !isolate) return;

      g.countries.forEach((iso) => {
        if (!seenHl.has(iso)) {
          const color = on ? g.color : "#1c2030";
          seenHl.set(iso, color);
          highlights.push({ iso, color, label: on ? g.name : undefined });
        }
        if (!on) return;
        const key = `${g.id}:${iso}`;
        if (!seenRing.has(key) && centroids[iso]) {
          seenRing.add(key);
          const [lat, lng] = centroids[iso];
          const base = Math.max(1.5, Math.min(5, Math.log10(g.population + 1) * 1.8));
          const maxR = g.type === "distributed" ? base * 1.4 : base;
          rings.push({ lat, lng, color: g.color, label: g.name, maxR });
        }
      });
    });

    return { highlights, arcs: [], rings };
  }, [selected, isolate]);

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
  const animatedPop = useCountUp(selectedPop);
  const worldPct = ((selectedPop / 1000 / WORLD_POP) * 100).toFixed(3);

  return (
    <>
      <h3 className="sidebar-title">Stateless Peoples</h3>

      {/* World framing */}
      <div className="stateless-framing">
        <div className="framing-numbers">
          <span className="framing-big">{fmt(animatedPop)}</span>
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
          Est. global stateless: ~{fmt(TOTAL_STATELESS)} · UNHCR 2023 · populations in thousands (K) / millions (M)
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
          aria-label="Search stateless groups"
        />
        {search && (
          <span className="search-count">{filtered.length} of {statelessGroups.length}</span>
        )}
      </div>

      <div className="sidebar-row-actions">
        <button
          className="toggle-all-btn"
          onClick={() => setSelected(allOn ? new Set() : new Set(ALL_IDS))}
        >
          {allOn ? "Deselect All" : "Select All"}
        </button>
        <div className="stateless-toolbar">
          <select
            className="sort-select"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            aria-label="Sort groups by"
            title="Sort order"
          >
            <option value="population">↓ Population</option>
            <option value="name">A–Z Name</option>
            <option value="since">↑ Earliest</option>
          </select>
          <label
            className="toggle-switch"
            title="Dim unselected groups on globe to focus on selected ones"
          >
            <input
              type="checkbox"
              className="toggle-input"
              checked={isolate}
              onChange={(e) => setIsolate(e.target.checked)}
            />
            <span className="toggle-track"><span className="toggle-thumb" /></span>
            <span className="toggle-label">Isolate</span>
          </label>
        </div>
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
                    title={`Fly globe to ${g.name} region`}
                    aria-label={`Fly globe to ${g.name} region`}
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
                    title={exp ? "Collapse context" : "Expand context"}
                    aria-expanded={exp}
                    aria-label={`${exp ? "Collapse" : "Expand"} context for ${g.name}`}
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
                  <p className="context-source">
                    Est. pop: {fmt(g.population)} · Since {g.since} · Source: UNHCR / regional estimates
                  </p>
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
