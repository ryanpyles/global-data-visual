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
  title: string;
  ids: string[];
};

const PRESETS: Preset[] = [
  { label: "All", title: "Select all languages", ids: languageGroups.map((l) => l.id) },
  { label: "None", title: "Clear all selections", ids: [] },
  {
    label: "UN Official",
    title: "6 UN official languages: Arabic, Chinese, English, French, Russian, Spanish",
    ids: ["english", "french", "spanish", "arabic", "russian", "mandarin"],
  },
  {
    label: "Top 5",
    title: "Top 5 by total speaker count: Mandarin, English, Hindi, Spanish, Arabic",
    ids: ["mandarin", "english", "hindi", "spanish", "arabic"],
  },
  {
    label: "Indo-European",
    title: "Indo-European family: Germanic, Romance, Slavic, Indo-Iranian",
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

  // Which preset exactly matches current selection (if any)
  const activePresetLabel = useMemo(() => {
    return PRESETS.find((p) => {
      if (p.ids.length !== selected.size) return false;
      return p.ids.every((id) => selected.has(id));
    })?.label ?? null;
  }, [selected]);

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
            className={`preset-btn ${activePresetLabel === p.label ? "preset-active" : ""}`}
            onClick={() => applyPreset(p.ids)}
            title={p.title}
            aria-pressed={activePresetLabel === p.label}
          >
            {p.label === "Top 5" ? "Top 5 langs" : p.label}
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
        <div className="coverage-header">
          <span className="coverage-title">Language reach</span>
          <span className="coverage-pct">{coverage.pct.toFixed(0)}% of nations</span>
        </div>
        <div className="coverage-bar-track">
          <div className="coverage-bar-fill" style={{ width: `${coverage.pct}%` }} />
        </div>
        <div className="coverage-stats-grid">
          <div className="coverage-stat">
            <span className="coverage-stat-num">~{coverage.speakers.toLocaleString()}M</span>
            <span className="coverage-stat-label">{speakerMode === "native" ? "native" : "total"} speakers</span>
          </div>
          <div className="coverage-stat">
            <span className="coverage-stat-num">{coverage.pop.toLocaleString()}M</span>
            <span className="coverage-stat-label">pop. in covered countries</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="search-row">
        <input
          className="search-input"
          placeholder="Search language or family…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search languages"
        />
        {search && (
          <span className="search-count">
            {Object.values(grouped).flat().length} result{Object.values(grouped).flat().length !== 1 ? "s" : ""}
          </span>
        )}
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
                        title={`Fly globe to ${lang.name} region`}
                        aria-label={`Fly globe to ${lang.name} region`}
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
        Near-white countries overlap 2+ selected languages. Hover to isolate a region. M = millions of speakers.
      </p>
    </>
  );
};

export default LanguagesSidebar;
