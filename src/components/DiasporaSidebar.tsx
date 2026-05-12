import React, { useState, useMemo, useEffect } from "react";
import { diasporaGroups } from "../data/diaspora";
import { centroids } from "../data/countryCentroids";
import { ArcData, CountryHighlight, GlobeState, FlyTarget } from "../types";

interface StoryConfig {
  selectedIds?: string[];
  yearIdx?: number;
  direction?: ArcDir;
  configKey?: string; // changes per beat so useEffect can respond
}

interface Props {
  onStateChange: (s: GlobeState) => void;
  onFlyTo: (t: FlyTarget) => void;
  storyConfig?: StoryConfig;
}

const fmt = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}M` : `${n}K`;

type ArcDir = "outbound" | "inbound";

const YEARS = [1990, 2000, 2010, 2020] as const;

// Per-group historical scale factors [1990, 2000, 2010, 2020]
// Based on documented migration trends; 2020 = current dataset values.
const YEAR_SCALE: Record<string, [number, number, number, number]> = {
  indian:   [0.28, 0.50, 0.74, 1.0],
  chinese:  [0.48, 0.63, 0.79, 1.0],
  african:  [0.50, 0.65, 0.80, 1.0],
  jewish:   [0.91, 0.93, 0.96, 1.0],
  lebanese: [0.78, 0.85, 0.92, 1.0],
  mexican:  [0.32, 0.60, 0.82, 1.0],
  irish:    [0.82, 0.87, 0.92, 1.0],
  romani:   [0.80, 0.85, 0.90, 1.0],
};

const DiasporaSidebar: React.FC<Props> = ({ onStateChange, onFlyTo, storyConfig }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    storyConfig?.selectedIds ? new Set(storyConfig.selectedIds) : new Set([diasporaGroups[0].id])
  );
  const [search, setSearch] = useState("");
  const [direction, setDirection] = useState<ArcDir>(storyConfig?.direction ?? "outbound");
  const [yearIdx, setYearIdx] = useState<number>(storyConfig?.yearIdx ?? 3);

  // Respond to beat-by-beat story config changes without full remount
  useEffect(() => {
    if (!storyConfig?.configKey) return;
    if (storyConfig.selectedIds) setSelectedIds(new Set(storyConfig.selectedIds));
    if (storyConfig.yearIdx !== undefined) setYearIdx(storyConfig.yearIdx);
    if (storyConfig.direction) setDirection(storyConfig.direction);
  }, [storyConfig?.configKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const year = YEARS[yearIdx];

  const toggleGroup = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const selectedGroups = diasporaGroups.filter((g) => selectedIds.has(g.id));

  const globeState = useMemo<GlobeState>(() => {
    const highlights: CountryHighlight[] = [];
    const arcs: ArcData[] = [];
    const seenHl = new Map<string, string>();

    selectedGroups.forEach((group) => {
      const scale = (YEAR_SCALE[group.id] ?? [1, 1, 1, 1])[yearIdx];
      const scaledDests = group.destinations.map((d) => ({
        ...d,
        population: Math.round(d.population * scale),
      }));
      const maxPop = Math.max(...scaledDests.map((d) => d.population), 1);
      const originCentroid = centroids[group.origin];

      if (!seenHl.has(group.origin)) {
        seenHl.set(group.origin, "#ffffff");
        highlights.push({
          iso: group.origin,
          color: "#ffffff",
          label: `${group.originName} (Origin)`,
        });
      }

      scaledDests.forEach(({ country, population }) => {
        const pct = population / maxPop;
        const intensity = Math.max(0.2, pct);
        const hex = group.color.replace("#", "");
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        const color = `rgb(${Math.round(r * intensity + 12 * (1 - intensity))},${Math.round(g * intensity + 12 * (1 - intensity))},${Math.round(b * intensity + 12 * (1 - intensity))})`;
        const pctOfTotal = ((population / (group.population * 1000 * scale)) * 100).toFixed(1);

        if (!seenHl.has(country)) {
          seenHl.set(country, color);
          highlights.push({ iso: country, color, label: `${group.name} — ${fmt(population)} (${pctOfTotal}%)` });
        }

        if (originCentroid && centroids[country]) {
          const [oLat, oLng] = originCentroid;
          const [dLat, dLng] = centroids[country];
          const stroke = Math.max(0.25, Math.min(2.5, pct * 2.5));
          // Altitude scales with population: major corridors arc high (feel heavy), minor routes stay low (feel fragile)
          // Small hash from country codes adds organic variance so routes don't all feel identical
          const hashVar = ((country.charCodeAt(0) + (country.charCodeAt(1) || 0)) % 16) * 0.005;
          const altitude = Math.max(0.18, Math.min(0.78, stroke * 0.28 + 0.14 + hashVar));
          const isOut = direction === "outbound";
          arcs.push({
            startLat: isOut ? oLat : dLat,
            startLng: isOut ? oLng : dLng,
            endLat: isOut ? dLat : oLat,
            endLng: isOut ? dLng : oLng,
            color: isOut ? ["#ffffff", group.color] : [group.color, "#ffffff"],
            label: `${group.name}: ${fmt(population)} (${pctOfTotal}%)`,
            stroke,
            altitude,
          });
        }
      });
    });

    return { highlights, arcs, rings: [] };
  }, [selectedGroups, direction, yearIdx]);

  useEffect(() => {
    onStateChange(globeState);
  }, [globeState, onStateChange]);

  const filtered = useMemo(
    () => diasporaGroups.filter(
      (g) => !search || g.name.toLowerCase().includes(search.toLowerCase())
    ),
    [search]
  );

  const topDests = useMemo(() => {
    const map = new Map<string, number>();
    selectedGroups.forEach((g) => {
      const scale = (YEAR_SCALE[g.id] ?? [1, 1, 1, 1])[yearIdx];
      g.destinations.forEach(({ country, population }) => {
        map.set(country, (map.get(country) ?? 0) + Math.round(population * scale));
      });
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [selectedGroups, yearIdx]);

  const totalSelected = selectedGroups.reduce((sum, g) => {
    const scale = (YEAR_SCALE[g.id] ?? [1, 1, 1, 1])[yearIdx];
    return sum + g.population * 1000 * scale;
  }, 0);

  return (
    <>
      <h3 className="sidebar-title">Diaspora Groups</h3>

      {/* Direction toggle */}
      <div className="toggle-row" role="group" aria-label="Arc direction">
        <button
          className={`seg-btn ${direction === "outbound" ? "seg-active" : ""}`}
          onClick={() => setDirection("outbound")}
          aria-pressed={direction === "outbound"}
          title="Show arcs flowing outward from origin country"
        >
          ↗ Outbound
        </button>
        <button
          className={`seg-btn ${direction === "inbound" ? "seg-active" : ""}`}
          onClick={() => setDirection("inbound")}
          aria-pressed={direction === "inbound"}
          title="Show arcs flowing inward to origin country"
        >
          ↙ Inbound
        </button>
      </div>

      {/* Time slider */}
      <div className="time-slider-block">
        <div className="time-slider-header">
          <span className="time-slider-label">Year</span>
          <span className="time-year-badge">{year}</span>
        </div>
        <input
          className="time-slider"
          type="range"
          min={0}
          max={3}
          step={1}
          value={yearIdx}
          onChange={(e) => setYearIdx(Number(e.target.value))}
          aria-label={`Year: ${year}`}
          aria-valuemin={0}
          aria-valuemax={3}
          aria-valuenow={yearIdx}
          aria-valuetext={String(year)}
        />
        <div className="time-ticks">
          {YEARS.map((y, i) => (
            <button
              key={y}
              className={`time-tick ${i === yearIdx ? "time-tick-active" : ""}`}
              onClick={() => setYearIdx(i)}
            >
              {y}
            </button>
          ))}
        </div>
        {yearIdx < 3 && (
          <p className="time-note">
            Populations scaled to estimated {year} levels based on documented migration trends.
          </p>
        )}
      </div>

      {/* Selection summary */}
      {selectedIds.size > 0 && (
        <div className="selection-summary">
          <span>{selectedIds.size} group{selectedIds.size > 1 ? "s" : ""}</span>
          <span className="summary-total">{fmt(totalSelected)} in {year}</span>
          <button className="clear-btn" onClick={() => setSelectedIds(new Set())}>Clear</button>
        </div>
      )}

      <div className="search-row">
        <input
          className="search-input"
          placeholder="Search diaspora…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search diaspora groups"
        />
        {search && (
          <span className="search-count">
            {filtered.length} of {diasporaGroups.length}
          </span>
        )}
      </div>

      <ul className="legend-list">
        {filtered.map((g) => {
          const on = selectedIds.has(g.id);
          return (
            <li key={g.id} className={`legend-item ${on ? "active" : "inactive"}`} onClick={() => toggleGroup(g.id)}>
              <span className={`check-box ${on ? "check-on" : ""}`} style={{ borderColor: on ? g.color : undefined }}>
                {on && <span style={{ color: g.color }}>✓</span>}
              </span>
              <span className="legend-swatch" style={{ background: g.color, boxShadow: on ? `0 0 8px ${g.color}` : "none" }} />
              <span className="legend-name">{g.name}</span>
              <div className="legend-right">
                <span className="legend-stat">{fmt(g.population * 1000)}</span>
                <button className="fly-btn" title={`Fly to ${g.originName}`} onClick={(e) => { e.stopPropagation(); const c = centroids[g.origin]; if (c) onFlyTo({ lat: c[0], lng: c[1], altitude: 1.6 }); }}>◎</button>
              </div>
            </li>
          );
        })}
      </ul>

      {topDests.length > 0 && (
        <div className="detail-card">
          <h5 className="detail-subhead">Top destinations for selected groups · {year}</h5>
          {topDests.map(([iso, pop]) => {
            const barPct = (pop / topDests[0][1]) * 100;
            return (
              <div key={iso} className="dest-bar-row">
                <button className="dest-fly" onClick={() => { const c = centroids[iso]; if (c) onFlyTo({ lat: c[0], lng: c[1], altitude: 1.8 }); }}>{iso}</button>
                <div className="dest-bar-wrap">
                  <div className="dest-bar-fill" style={{ width: `${barPct}%`, background: selectedGroups[0]?.color ?? "#38bdf8" }} />
                </div>
                <span className="dest-pop">{fmt(pop)}</span>
              </div>
            );
          })}
          <p className="sidebar-note" style={{ marginTop: 6 }}>
            Arc height ∝ population. {direction === "inbound" ? "Arcs flow into origin." : "Arcs flow from origin."}
          </p>
        </div>
      )}

      {selectedGroups.length === 1 && (
        <div className="factoid-card">
          <div className="factoid-accent" style={{ background: selectedGroups[0].color }} />
          <p className="factoid-text">{selectedGroups[0].factoid}</p>
        </div>
      )}
    </>
  );
};

export default DiasporaSidebar;
