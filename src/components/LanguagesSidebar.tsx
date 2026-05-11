import React, { useState, useMemo, useEffect } from "react";
import { languageGroups, languageFamilies, LanguageGroup } from "../data/languages";
import { populations, WORLD_POP } from "../data/countryPopulations";
import { centroids } from "../data/countryCentroids";
import { CountryHighlight, GlobeState, FlyTarget } from "../types";

interface StoryConfig {
  selectedIds?: string[];
}

interface Props {
  onStateChange: (s: GlobeState) => void;
  onFlyTo: (t: FlyTarget) => void;
  storyConfig?: StoryConfig;
}

const ALL_IDS = new Set(languageGroups.map((l) => l.id));

type SpeakerMode = "total" | "native";

type Preset = {
  label: string;
  ids: string[];
};

const PRESETS: Preset[] = [
  { label: "All", ids: languageGroups.map((l) => l.id) },
  { label: "None", ids: [] },
  {
    label: "UN Official",
    ids: ["english", "french", "spanish", "arabic", "russian", "mandarin"],
  },
  {
    label: "Top 5",
    ids: ["mandarin", "english", "hindi", "spanish", "arabic"],
  },
  {
    label: "Indo-European",
    ids: languageGroups.filter((l) =>
      ["Germanic","Romance","Slavic","Indo-Iranian"].includes(l.family)
    ).map((l) => l.id),
  },
];

const LanguagesSidebar: React.FC<Props> = ({ onStateChange, onFlyTo, storyConfig }) => {
  const [selected, setSelected] = useState<Set<string>>(
    storyConfig?.selectedIds ? new Set(storyConfig.selectedIds) : ALL_IDS
  );
  const [search, setSearch] = useState("");
  const [speakerMode, setSpeakerMode] = useState<SpeakerMode>("total");
  const [collapsedFamilies, setCollapsedFamilies] = useState<Set<string>>(new Set());
  const [hovered, setHovered] = useState<string | null>(null);

  const highlights = useMemo<CountryHighlight[]>(() => {
    // Build iso → [matching selected languages]
    const isoLangs = new Map<string, LanguageGroup[]>();
    languageGroups.forEach((lang) => {
      if (!selected.has(lang.id)) return;
      lang.countries.forEach((iso) => {
        if (!isoLangs.has(iso)) isoLangs.set(iso, []);
        isoLangs.get(iso)!.push(lang);
      });
    });

    if (hovered) {
      const hovLang = languageGroups.find((l) => l.id === hovered);
      const hovIsos = new Set(hovLang?.countries ?? []);
      return Array.from(isoLangs.entries()).map(([iso, langs]) => ({
        iso,
        color: hovIsos.has(iso) ? (langs.length >= 2 ? "#f5f0ff" : langs[0].color) : "#192033",
        label: langs.map((l) => l.name).join(" · "),
      }));
    }

    return Array.from(isoLangs.entries()).map(([iso, langs]) => ({
      iso,
      color: langs.length >= 2 ? "#f0eeff" : langs[0].color,
      label: langs.map((l) => l.name).join(" · "),
    }));
  }, [selected, hovered]);

  // Coverage: unique countries covered by selected languages → sum populations
  const coverage = useMemo(() => {
    const countriesCovered = new Set<string>();
    languageGroups.forEach((lang) => {
      if (!selected.has(lang.id)) return;
      lang.countries.forEach((iso) => countriesCovered.add(iso));
    });
    const pop = Array.from(countriesCovered).reduce(
      (sum, iso) => sum + (populations[iso] ?? 0),
      0
    );
    const pct = (pop / WORLD_POP) * 100;
    const speakers = languageGroups
      .filter((l) => selected.has(l.id))
      .reduce((sum, l) => sum + (speakerMode === "native" ? l.nativeSpeakers : l.speakers), 0);
    return { pop: Math.round(pop), pct: Math.min(100, pct), speakers };
  }, [selected, speakerMode]);

  useEffect(() => {
    onStateChange({ highlights, arcs: [], rings: [] });
  }, [highlights, onStateChange]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const applyPreset = (ids: string[]) => setSelected(new Set(ids));

  const toggleFamily = (family: string) =>
    setCollapsedFamilies((prev) => {
      const next = new Set(prev);
      next.has(family) ? next.delete(family) : next.add(family);
      return next;
    });

  const toggleFamilySelect = (family: string, langs: LanguageGroup[]) => {
    const familyIds = langs.map((l) => l.id);
    const allOn = familyIds.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOn) familyIds.forEach((id) => next.delete(id));
      else familyIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const grouped = useMemo(() => {
    const q = search.toLowerCase();
    const map: Record<string, LanguageGroup[]> = {};
    languageFamilies.forEach((f) => { map[f] = []; });
    languageGroups.forEach((l) => {
      if (!q || l.name.toLowerCase().includes(q) || l.family.toLowerCase().includes(q)) {
        if (!map[l.family]) map[l.family] = [];
        map[l.family].push(l);
      }
    });
    return map;
  }, [search]);

  const speakerCount = (lang: LanguageGroup) =>
    speakerMode === "native" ? lang.nativeSpeakers : lang.speakers;

  return (
    <>
      <h3 className="sidebar-title">Languages</h3>

      {/* Presets */}
      <div className="preset-row">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            className="preset-btn"
            onClick={() => applyPreset(p.ids)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Speaker mode toggle */}
      <div className="toggle-row">
        <button
          className={`seg-btn ${speakerMode === "total" ? "seg-active" : ""}`}
          onClick={() => setSpeakerMode("total")}
        >
          Total speakers
        </button>
        <button
          className={`seg-btn ${speakerMode === "native" ? "seg-active" : ""}`}
          onClick={() => setSpeakerMode("native")}
        >
          Native only
        </button>
      </div>

      {/* Coverage bar */}
      <div className="coverage-block">
        <div className="coverage-label">
          <span>Language reach</span>
          <span className="coverage-pct">{coverage.pct.toFixed(0)}% of world</span>
        </div>
        <div className="coverage-bar-track">
          <div
            className="coverage-bar-fill"
            style={{ width: `${coverage.pct}%` }}
          />
        </div>
        <div className="coverage-detail">
          ~{coverage.speakers.toLocaleString()}M{" "}
          {speakerMode === "native" ? "native" : "total"} speakers ·{" "}
          {coverage.pop.toLocaleString()}M people in covered countries
        </div>
      </div>

      {/* Search */}
      <div className="search-row">
        <input
          className="search-input"
          placeholder="Search language or family…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Grouped list */}
      {languageFamilies.map((family) => {
        const langs = grouped[family];
        if (!langs || langs.length === 0) return null;
        const collapsed = collapsedFamilies.has(family);
        const allOn = langs.every((l) => selected.has(l.id));
        const someOn = langs.some((l) => selected.has(l.id));
        return (
          <div key={family} className="family-group">
            <div className="family-header">
              <button
                className="family-toggle"
                onClick={() => toggleFamily(family)}
              >
                <span className="family-arrow">{collapsed ? "▶" : "▼"}</span>
                <span className="family-name">{family}</span>
                <span className="family-count">{langs.length}</span>
              </button>
              <button
                className={`family-check ${allOn ? "family-check-on" : someOn ? "family-check-partial" : ""}`}
                onClick={() => toggleFamilySelect(family, langs)}
                title={allOn ? "Deselect family" : "Select family"}
              >
                {allOn ? "✓" : someOn ? "–" : "+"}
              </button>
            </div>

            {!collapsed && (
              <ul className="legend-list family-items">
                {langs.map((lang) => (
                  <li
                    key={lang.id}
                    className={`legend-item ${selected.has(lang.id) ? "active" : "inactive"}`}
                    onMouseEnter={() => selected.has(lang.id) && setHovered(lang.id)}
                    onMouseLeave={() => setHovered(null)}
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
                    <div className="legend-right">
                      <span className="legend-stat">
                        {speakerCount(lang)}M
                      </span>
                      <button
                        className="fly-btn"
                        title={`Fly to ${lang.name}`}
                        onClick={() => {
                          const first = lang.countries.find((iso) => centroids[iso]);
                          if (first) {
                            const [lat, lng] = centroids[first];
                            onFlyTo({ lat, lng, altitude: 1.6 });
                          }
                        }}
                      >
                        ◎
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}

      <p className="sidebar-note" style={{ marginTop: 4 }}>
        Near-white countries overlap 2+ selected languages. Hover a language to isolate its region. ◎ flies camera to that language region.
      </p>
    </>
  );
};

export default LanguagesSidebar;
