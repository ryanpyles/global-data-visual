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

type ArcDir = "outbound" | "inbound";

const DiasporaSidebar: React.FC<Props> = ({ onStateChange, onFlyTo }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set([diasporaGroups[0].id])
  );
  const [search, setSearch] = useState("");
  const [direction, setDirection] = useState<ArcDir>("outbound");

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
      const originCentroid = centroids[group.origin];
      const maxPop = Math.max(...group.destinations.map((d) => d.population));

      // Origin highlight
      if (!seenHl.has(group.origin)) {
        seenHl.set(group.origin, "#ffffff");
        highlights.push({
          iso: group.origin,
          color: "#ffffff",
          label: `${group.originName} (Origin)`,
        });
      }

      group.destinations.forEach(({ country, population }) => {
        const pct = population / maxPop;
        const intensity = Math.max(0.25, pct);
        const hex = group.color.replace("#", "");
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        const ir = Math.round(r * intensity + 12 * (1 - intensity));
        const ig = Math.round(g * intensity + 12 * (1 - intensity));
        const ib = Math.round(b * intensity + 12 * (1 - intensity));
        const color = `rgb(${ir},${ig},${ib})`;
        const pctOfTotal = ((population / (group.population * 1000)) * 100).toFixed(1);

        if (!seenHl.has(country)) {
          seenHl.set(country, color);
          highlights.push({
            iso: country,
            color,
            label: `${group.name} — ${fmt(population)} (${pctOfTotal}% of diaspora)`,
          });
        }

        if (originCentroid && centroids[country]) {
          const [oLat, oLng] = originCentroid;
          const [dLat, dLng] = centroids[country];
          const stroke = Math.max(0.3, Math.min(2.5, pct * 2.5));

          const isOutbound = direction === "outbound";
          arcs.push({
            startLat: isOutbound ? oLat : dLat,
            startLng: isOutbound ? oLng : dLng,
            endLat: isOutbound ? dLat : oLat,
            endLng: isOutbound ? dLng : oLng,
            color: isOutbound
              ? ["#ffffff", group.color]
              : [group.color, "#ffffff"],
            label: `${group.name}: ${fmt(population)} (${pctOfTotal}%)`,
            stroke,
          });
        }
      });
    });

    return { highlights, arcs, rings: [] };
  }, [selectedGroups, direction]);

  useEffect(() => {
    onStateChange(globeState);
  }, [globeState, onStateChange]);

  const filtered = useMemo(
    () =>
      diasporaGroups.filter(
        (g) => !search || g.name.toLowerCase().includes(search.toLowerCase())
      ),
    [search]
  );

  // Aggregate top destinations across all selected groups
  const topDests = useMemo(() => {
    const map = new Map<string, number>();
    selectedGroups.forEach((g) => {
      g.destinations.forEach(({ country, population }) => {
        map.set(country, (map.get(country) ?? 0) + population);
      });
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [selectedGroups]);

  const totalSelected = selectedGroups.reduce(
    (sum, g) => sum + g.population * 1000,
    0
  );

  return (
    <>
      <h3 className="sidebar-title">Diaspora Groups</h3>

      {/* Direction toggle */}
      <div className="toggle-row">
        <button
          className={`seg-btn ${direction === "outbound" ? "seg-active" : ""}`}
          onClick={() => setDirection("outbound")}
        >
          ↗ Outbound
        </button>
        <button
          className={`seg-btn ${direction === "inbound" ? "seg-active" : ""}`}
          onClick={() => setDirection("inbound")}
        >
          ↙ Inbound
        </button>
      </div>

      {/* Selection summary */}
      {selectedIds.size > 0 && (
        <div className="selection-summary">
          <span>{selectedIds.size} group{selectedIds.size > 1 ? "s" : ""} selected</span>
          <span className="summary-total">{fmt(totalSelected)} total</span>
          <button
            className="clear-btn"
            onClick={() => setSelectedIds(new Set())}
          >
            Clear
          </button>
        </div>
      )}

      <div className="search-row">
        <input
          className="search-input"
          placeholder="Search diaspora…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <ul className="legend-list">
        {filtered.map((g) => {
          const on = selectedIds.has(g.id);
          return (
            <li
              key={g.id}
              className={`legend-item ${on ? "active" : "inactive"}`}
              onClick={() => toggleGroup(g.id)}
            >
              <span
                className={`check-box ${on ? "check-on" : ""}`}
                style={{ borderColor: on ? g.color : undefined }}
              >
                {on && <span style={{ color: g.color }}>✓</span>}
              </span>
              <span
                className="legend-swatch"
                style={{
                  background: g.color,
                  boxShadow: on ? `0 0 8px ${g.color}` : "none",
                }}
              />
              <span className="legend-name">{g.name}</span>
              <div className="legend-right">
                <span className="legend-stat">{fmt(g.population * 1000)}</span>
                <button
                  className="fly-btn"
                  title={`Fly to ${g.originName}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    const c = centroids[g.origin];
                    if (c) onFlyTo({ lat: c[0], lng: c[1], altitude: 1.6 });
                  }}
                >
                  ◎
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {selectedGroups.length > 0 && topDests.length > 0 && (
        <div className="detail-card">
          <h5 className="detail-subhead">
            {direction === "outbound" ? "Top destinations" : "Top origins"} (combined)
          </h5>
          {topDests.map(([iso, pop]) => {
            const maxPop = topDests[0][1];
            const barPct = (pop / maxPop) * 100;
            return (
              <div key={iso} className="dest-bar-row">
                <button
                  className="dest-fly"
                  onClick={() => {
                    const c = centroids[iso];
                    if (c) onFlyTo({ lat: c[0], lng: c[1], altitude: 1.8 });
                  }}
                >
                  {iso}
                </button>
                <div className="dest-bar-wrap">
                  <div
                    className="dest-bar-fill"
                    style={{
                      width: `${barPct}%`,
                      background: selectedGroups[0]?.color ?? "#38bdf8",
                    }}
                  />
                </div>
                <span className="dest-pop">{fmt(pop)}</span>
              </div>
            );
          })}
          <p className="sidebar-note" style={{ marginTop: 6 }}>
            Arc thickness scales with population.{" "}
            {direction === "inbound" ? "Arcs flow into origin." : "Arcs flow from origin."}
          </p>
        </div>
      )}
    </>
  );
};

export default DiasporaSidebar;
