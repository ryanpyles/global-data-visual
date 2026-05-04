import React, { useState, useMemo, useEffect } from "react";
import { languageGroups } from "../data/languages";
import { centroids } from "../data/countryCentroids";
import { CountryHighlight, GlobeState, FlyTarget } from "../types";

interface Props {
  onStateChange: (s: GlobeState) => void;
  onFlyTo: (t: FlyTarget) => void;
}

const ALL_IDS = new Set(languageGroups.map((l) => l.id));

const LanguagesSidebar: React.FC<Props> = ({ onStateChange, onFlyTo }) => {
  const [selected, setSelected] = useState<Set<string>>(ALL_IDS);
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      languageGroups.filter(
        (l) =>
          !search ||
          l.name.toLowerCase().includes(search.toLowerCase())
      ),
    [search]
  );

  const highlights = useMemo<CountryHighlight[]>(() => {
    const out: CountryHighlight[] = [];
    const seen = new Map<string, string>();
    languageGroups.forEach((lang) => {
      if (!selected.has(lang.id)) return;
      lang.countries.forEach((iso) => {
        if (!seen.has(iso)) {
          seen.set(iso, lang.color);
          out.push({ iso, color: lang.color, label: lang.name });
        }
      });
    });
    return out;
  }, [selected]);

  useEffect(() => {
    onStateChange({ highlights, arcs: [], rings: [] });
  }, [highlights, onStateChange]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const allOn = selected.size === languageGroups.length;

  const handleFlyToLanguage = (lang: typeof languageGroups[0]) => {
    const firstCountry = lang.countries.find((iso) => centroids[iso]);
    if (firstCountry && centroids[firstCountry]) {
      const [lat, lng] = centroids[firstCountry];
      onFlyTo({ lat, lng, altitude: 1.6 });
    }
  };

  return (
    <>
      <h3 className="sidebar-title">Languages</h3>

      <div className="search-row">
        <input
          className="search-input"
          placeholder="Search language…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <button
        className="toggle-all-btn"
        onClick={() => setSelected(allOn ? new Set() : new Set(ALL_IDS))}
      >
        {allOn ? "Deselect All" : "Select All"}
      </button>

      <ul className="legend-list">
        {filtered.map((lang) => (
          <li
            key={lang.id}
            className={`legend-item ${selected.has(lang.id) ? "active" : "inactive"}`}
          >
            <span
              className="legend-swatch"
              style={{
                background: lang.color,
                boxShadow: selected.has(lang.id) ? `0 0 8px ${lang.color}` : "none",
              }}
              onClick={() => toggle(lang.id)}
            />
            <span className="legend-name" onClick={() => toggle(lang.id)}>
              {lang.name}
            </span>
            <span className="legend-stat">{lang.speakers}M</span>
            <button
              className="fly-btn"
              title={`Fly to ${lang.name}`}
              onClick={() => handleFlyToLanguage(lang)}
            >
              ◎
            </button>
          </li>
        ))}
      </ul>

      <p className="sidebar-note">
        Colors show primary/official language. Countries with multiple official languages show the first active match. Click ◎ to fly there.
      </p>
    </>
  );
};

export default LanguagesSidebar;
