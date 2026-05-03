import React, { useState, useMemo } from "react";
import GlobeViz, { CountryHighlight } from "./GlobeViz";
import { languageGroups, LanguageGroup } from "../data/languages";

const LanguagesTab: React.FC = () => {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(languageGroups.map((l) => l.id))
  );

  const highlights = useMemo<CountryHighlight[]>(() => {
    const out: CountryHighlight[] = [];
    const seen = new Map<string, string>();

    languageGroups.forEach((lang) => {
      if (!selected.has(lang.id)) return;
      lang.countries.forEach((iso) => {
        if (!seen.has(iso)) {
          seen.set(iso, lang.color);
          out.push({ iso, color: lang.color, label: `${lang.name}` });
        }
      });
    });
    return out;
  }, [selected]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allOn = selected.size === languageGroups.length;

  return (
    <div className="tab-layout">
      <aside className="sidebar">
        <h3 className="sidebar-title">Languages</h3>
        <button
          className="toggle-all-btn"
          onClick={() =>
            setSelected(allOn ? new Set() : new Set(languageGroups.map((l) => l.id)))
          }
        >
          {allOn ? "Deselect All" : "Select All"}
        </button>
        <ul className="legend-list">
          {languageGroups.map((lang) => (
            <li
              key={lang.id}
              className={`legend-item ${selected.has(lang.id) ? "active" : "inactive"}`}
              onClick={() => toggle(lang.id)}
            >
              <span
                className="legend-swatch"
                style={{ background: lang.color, boxShadow: selected.has(lang.id) ? `0 0 8px ${lang.color}` : "none" }}
              />
              <span className="legend-name">{lang.name}</span>
              <span className="legend-stat">{lang.speakers}M</span>
            </li>
          ))}
        </ul>
        <p className="sidebar-note">
          Colors indicate primary / official language. Countries with multiple official languages show first matched selection.
        </p>
      </aside>
      <div className="globe-area">
        <GlobeViz highlights={highlights} />
      </div>
    </div>
  );
};

export default LanguagesTab;
