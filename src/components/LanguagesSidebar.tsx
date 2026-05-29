import React, { useState, useMemo, useEffect } from "react";
import { languageGroups, languageFamilies, LanguageGroup } from "../data/languages";
import { populations, WORLD_POP } from "../data/countryPopulations";
import { centroids } from "../data/countryCentroids";
import { CountryHighlight, ArcData, GlobeState, FlyTarget } from "../types";

interface StoryConfig {
  selectedIds?: string[];
  configKey?: string;
}

interface Props {
  onStateChange: (s: GlobeState) => void;
  onFlyTo: (t: FlyTarget) => void;
  storyConfig?: StoryConfig;
}

const ALL_IDS = new Set(languageGroups.map((l) => l.id));

type SpeakerMode = "total" | "native" | "market";

type Preset = {
  label: string;
  title: string;
  ids: string[];
};

const PRESETS: Preset[] = [
  { label: "All", title: "Select all languages", ids: languageGroups.map((l) => l.id) },
  { label: "None", title: "Clear all selections", ids: [] },
  {
    label: "Personal",
    title: "Languages Ryan speaks or has studied: French, Spanish, Italian, Portuguese, German, Hebrew, Mandarin, Swedish, Russian, Arabic, Japanese, Icelandic",
    ids: ["french","spanish","italian","portuguese","german","hebrew","mandarin","swedish","russian","arabic","japanese","icelandic"],
  },
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
    label: "Colonial",
    title: "Languages spread by empire: English, French, Spanish, Portuguese, Russian — shows influence arcs from origin cities",
    ids: ["english", "french", "spanish", "portuguese", "russian"],
  },
];

// Globe base color — must match GlobeViz dark material
const BASE_RGB = [6, 14, 28] as const;

// Scale fill brightness by country population so India ≠ Greenland
const popWeight = (iso: string): number => {
  const pop = populations[iso] ?? 0.05; // millions
  // Power curve: 1400M → 1.0, 67M → 0.62, 5M → 0.37, 0.05M → 0.14
  return Math.max(0.14, Math.min(1.0, Math.pow(pop / 1400, 0.26)));
};

// Lerp language color toward dark globe base by (1 - weight)
const lerpToBase = (hex: string, t: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const tr = Math.round(r * t + BASE_RGB[0] * (1 - t));
  const tg = Math.round(g * t + BASE_RGB[1] * (1 - t));
  const tb = Math.round(b * t + BASE_RGB[2] * (1 - t));
  return `#${tr.toString(16).padStart(2, "0")}${tg.toString(16).padStart(2, "0")}${tb.toString(16).padStart(2, "0")}`;
};

// Screen blend for overlap zones — Belgium glows mixed, not white-washed
const screenBlend = (hexColors: string[], weight: number): string => {
  let sr = 1, sg = 1, sb = 1;
  hexColors.forEach((hex) => {
    sr *= 1 - parseInt(hex.slice(1, 3), 16) / 255;
    sg *= 1 - parseInt(hex.slice(3, 5), 16) / 255;
    sb *= 1 - parseInt(hex.slice(5, 7), 16) / 255;
  });
  const blended = `#${Math.round((1 - sr) * 255).toString(16).padStart(2, "0")}${Math.round((1 - sg) * 255).toString(16).padStart(2, "0")}${Math.round((1 - sb) * 255).toString(16).padStart(2, "0")}`;
  return lerpToBase(blended, Math.min(1.0, weight * 1.35));
};

const LanguagesSidebar: React.FC<Props> = ({ onStateChange, onFlyTo, storyConfig }) => {
  const [selected, setSelected] = useState<Set<string>>(
    storyConfig?.selectedIds ? new Set(storyConfig.selectedIds) : ALL_IDS
  );
  const [search, setSearch] = useState("");

  // Respond to beat-by-beat story config changes without full remount
  useEffect(() => {
    if (!storyConfig?.configKey) return;
    if (storyConfig.selectedIds) setSelected(new Set(storyConfig.selectedIds));
  }, [storyConfig?.configKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const [speakerMode, setSpeakerMode] = useState<SpeakerMode>("total");
  const [collapsedFamilies, setCollapsedFamilies] = useState<Set<string>>(new Set());
  const [hovered, setHovered] = useState<string | null>(null);

  // Whether a country is "primary" for a given language (dominant/official)
  const isPrimary = (lang: LanguageGroup, iso: string): boolean =>
    !lang.primaryCountries || lang.primaryCountries.includes(iso);

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
      return Array.from(isoLangs.entries()).map(([iso, langs]) => {
        const primaryLangs = langs.filter((l) => isPrimary(l, iso));
        const w = primaryLangs.length > 0 ? popWeight(iso) : popWeight(iso) * 0.22;
        return {
          iso,
          color: hovIsos.has(iso)
            ? (langs.length >= 2 ? screenBlend(langs.map((l) => l.color), w) : lerpToBase(langs[0].color, w))
            : "#070d1a",
          label: langs.map((l) => l.name).join(" · "),
          contested: langs.length >= 2,
        };
      });
    }

    return Array.from(isoLangs.entries()).map(([iso, langs]) => {
      // Countries where all covering languages list this as secondary → dim influence overlay
      const primaryLangs = langs.filter((l) => isPrimary(l, iso));
      const w = primaryLangs.length > 0 ? popWeight(iso) : popWeight(iso) * 0.22;
      return {
        iso,
        color: langs.length >= 2
          ? screenBlend(langs.map((l) => l.color), w)
          : lerpToBase(langs[0].color, w),
        label: langs.map((l) => l.name).join(" · "),
        contested: langs.length >= 2,
      };
    });
  }, [selected, hovered]); // eslint-disable-line react-hooks/exhaustive-deps

  // Influence arcs: faint ghost-of-empire flows from origin to secondary countries
  // Only languages with both primaryCountries and origin defined emit these
  const influenceArcs = useMemo<ArcData[]>(() => {
    const arcs: ArcData[] = [];
    languageGroups.forEach((lang) => {
      if (!selected.has(lang.id) || !lang.origin || !lang.primaryCountries) return;
      const [oLat, oLng] = lang.origin;
      const secondary = lang.countries.filter(
        (iso) => !lang.primaryCountries!.includes(iso) && centroids[iso]
      );
      secondary.forEach((iso) => {
        const [dLat, dLng] = centroids[iso];
        arcs.push({
          startLat: oLat, startLng: oLng,
          endLat: dLat, endLng: dLng,
          color: [lang.color + "30", lang.color + "06"],
          label: `${lang.name} influence`,
          stroke: 0.18,
          altitude: 0.06,
          animateTime: 16000,
        });
      });
    });
    return arcs;
  }, [selected]);

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

  // Market reach: selected languages sorted by GDP
  const marketStats = useMemo(() => {
    const langs = languageGroups.filter((l) => selected.has(l.id));
    const totalGdp = langs.reduce((s, l) => s + l.gdpT, 0);
    const totalInternet = langs.reduce((s, l) => s + l.internetUsersM, 0);
    const sorted = [...langs].sort((a, b) => b.gdpT - a.gdpT);
    const maxGdp = sorted[0]?.gdpT ?? 1;
    return { totalGdp, totalInternet, sorted, maxGdp };
  }, [selected]);

  useEffect(() => {
    onStateChange({ highlights, arcs: influenceArcs, rings: [] });
  }, [highlights, influenceArcs, onStateChange]);

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
    speakerMode === "native" ? lang.nativeSpeakers :
    speakerMode === "market" ? lang.gdpT :
    lang.speakers;

  const statLabel = speakerMode === "native" ? "M native" :
    speakerMode === "market" ? "T GDP" : "M total";

  const statDisplay = (lang: LanguageGroup) => {
    if (speakerMode === "market") {
      return lang.gdpT >= 1 ? `$${lang.gdpT.toFixed(1)}T` : `$${(lang.gdpT * 1000).toFixed(0)}B`;
    }
    return `${speakerCount(lang)}M`;
  };

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
          Total
        </button>
        <button
          className={`seg-btn ${speakerMode === "native" ? "seg-active" : ""}`}
          onClick={() => setSpeakerMode("native")}
        >
          Native
        </button>
        <button
          className={`seg-btn ${speakerMode === "market" ? "seg-active" : ""}`}
          onClick={() => setSpeakerMode("market")}
          title="Show GDP and internet reach for each language's primary economies"
        >
          Market
        </button>
      </div>

      {/* Coverage bar — hidden in market mode */}
      {speakerMode !== "market" && (
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
      )}

      {/* Market reach panel — shown only in market mode */}
      {speakerMode === "market" && (
        <div className="market-block">
          <div className="market-header">
            <span className="market-title">Market reach</span>
            <span className="market-totals">
              <span className="market-gdp">${marketStats.totalGdp.toFixed(1)}T GDP</span>
              <span className="market-sep">·</span>
              <span className="market-inet">{marketStats.totalInternet.toLocaleString()}M online</span>
            </span>
          </div>
          <div className="market-bars">
            {marketStats.sorted.map((lang) => {
              const barPct = (lang.gdpT / marketStats.maxGdp) * 100;
              const gdpLabel = lang.gdpT >= 1 ? `$${lang.gdpT.toFixed(1)}T` : `$${(lang.gdpT * 1000).toFixed(0)}B`;
              return (
                <div key={lang.id} className="market-bar-row">
                  <span className="market-bar-name" style={{ color: lang.color }}>{lang.name}</span>
                  <div className="market-bar-wrap">
                    <div
                      className="market-bar-fill"
                      style={{ width: `${barPct}%`, background: lang.color + "cc" }}
                    />
                  </div>
                  <span className="market-bar-val">{gdpLabel}</span>
                </div>
              );
            })}
          </div>
          {marketStats.sorted.some((l) => l.marketNote) && (
            <div className="market-notes">
              {marketStats.sorted.filter((l) => l.marketNote && selected.has(l.id)).slice(0, 3).map((lang) => (
                <p key={lang.id} className="market-note-line">
                  <span style={{ color: lang.color }}>▪</span> <strong>{lang.name}:</strong> {lang.marketNote}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

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
                      <span className="legend-stat" title={statLabel}>
                        {statDisplay(lang)}
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
        {speakerMode === "market"
          ? "GDP reflects primary economies where language dominates commerce. Internet users = estimated speakers online."
          : "Dim fills = colonial/secondary reach. Bright fills = dominant speaker regions. Overlap countries use screen-blend color mixing. Hover to isolate. M = millions."}
      </p>
    </>
  );
};

export default LanguagesSidebar;
