import React, { useState, useRef, useCallback, useEffect, ReactNode } from "react";
import "./App.css";
import GlobeViz, { GlobeHandle } from "./components/GlobeViz";
import LanguagesSidebar from "./components/LanguagesSidebar";
import DiasporaSidebar from "./components/DiasporaSidebar";
import StatelessSidebar from "./components/StatelessSidebar";
import CountryPanel from "./components/CountryPanel";
import IntroOverlay, { shouldShowIntro, markIntroSeen } from "./components/IntroOverlay";
import { TabId, GlobeState, FlyTarget, StoryBeat } from "./types";

const GlobeIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
    <circle cx="7.5" cy="7.5" r="6" stroke="currentColor" strokeWidth="1.15"/>
    <path d="M7.5 1.5 C5.3 3.8 5.3 11.2 7.5 13.5" stroke="currentColor" strokeWidth="1.15" fill="none"/>
    <path d="M7.5 1.5 C9.7 3.8 9.7 11.2 7.5 13.5" stroke="currentColor" strokeWidth="1.15" fill="none"/>
    <line x1="1.8" y1="7.5" x2="13.2" y2="7.5" stroke="currentColor" strokeWidth="1.15"/>
  </svg>
);
const DiasporaIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
    <circle cx="2.5" cy="7.5" r="1.4" fill="currentColor"/>
    <path d="M3.9 7.2 Q6.5 3.5 10.8 3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" fill="none"/>
    <path d="M3.9 7.5 L10.6 7.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
    <path d="M3.9 7.8 Q6.5 11.5 10.8 12" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" fill="none"/>
    <circle cx="12" cy="3" r="1.4" fill="currentColor"/>
    <circle cx="12" cy="7.5" r="1.4" fill="currentColor"/>
    <circle cx="12" cy="12" r="1.4" fill="currentColor"/>
  </svg>
);
const StatelessIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
    <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.15" strokeDasharray="2.8 2.2"/>
    <circle cx="7.5" cy="7.5" r="1.4" fill="currentColor" opacity="0.6"/>
  </svg>
);

const TABS: { id: TabId; label: string; Icon: () => ReactNode }[] = [
  { id: "languages", label: "Languages", Icon: GlobeIcon },
  { id: "diaspora",  label: "Diaspora",  Icon: DiasporaIcon },
  { id: "stateless", label: "Stateless", Icon: StatelessIcon },
];

const EMPTY_STATE: GlobeState = { highlights: [], arcs: [], rings: [] };
const PIN_KEY = "globe-pins";

interface Pin {
  id: string;
  label: string;
  tab: TabId;
  timestamp: number;
  globeState: GlobeState;
}

type StoryCategory = "corridor" | "collapse" | "empire" | "stateless" | "reverse";

interface Story {
  id: string;
  title: string;
  subtitle: string;
  tab: TabId;
  category: StoryCategory;
  beats: StoryBeat[];
}

const STORIES: Story[] = [
  {
    id: "gulf-labor",
    title: "The Corridor That Stayed Open",
    subtitle: "Indian & Lebanese · Gulf States · 1990–2020",
    tab: "diaspora",
    category: "corridor",
    beats: [
      {
        text: "1990. The Gulf needs workers. South Asia needs wages.",
        selectedIds: ["indian"],
        yearIdx: 0,
        direction: "outbound",
        flyTo: { lat: 20, lng: 72, altitude: 2.2 },
      },
      {
        text: "A corridor forms without a treaty. Labor arbitrage is its own diplomacy.",
        selectedIds: ["indian"],
        yearIdx: 0,
        direction: "outbound",
        flyTo: { lat: 24, lng: 54, altitude: 1.8 },
      },
      {
        text: "By 2000: 2.6 million Indians in the UAE alone. Remittances exceed all foreign aid to India.",
        selectedIds: ["indian"],
        yearIdx: 1,
        direction: "outbound",
        flyTo: { lat: 24, lng: 54, altitude: 1.6 },
      },
      {
        text: "Lebanon sends a parallel cohort — professionals, not laborers. The Gulf absorbs both.",
        selectedIds: ["indian", "lebanese"],
        yearIdx: 3,
        direction: "outbound",
        flyTo: { lat: 24, lng: 45, altitude: 1.9 },
      },
    ],
  },
  {
    id: "brain-drain",
    title: "A Nation Built Offshore",
    subtitle: "Indian & Chinese · Silicon Valley · 1990–2020",
    tab: "diaspora",
    category: "reverse",
    beats: [
      {
        text: "2000. The H-1B program is a decade old. South Asia is systematically emptying its engineering class.",
        selectedIds: ["indian"],
        yearIdx: 1,
        direction: "outbound",
        flyTo: { lat: 20, lng: 78, altitude: 2.0 },
      },
      {
        text: "By 2010, Indians run 16% of Silicon Valley startups. An economy formed inside another economy.",
        selectedIds: ["indian"],
        yearIdx: 2,
        direction: "outbound",
        flyTo: { lat: 37, lng: -122, altitude: 1.8 },
      },
      {
        text: "China sends a parallel cohort. Different institutions. Same city. Same buildings.",
        selectedIds: ["indian", "chinese"],
        yearIdx: 2,
        direction: "outbound",
        flyTo: { lat: 37, lng: -97, altitude: 2.2 },
      },
      {
        text: "2020: Beijing builds R&D campuses. Bangalore builds R&D campuses. The corridor bifurcates.",
        selectedIds: ["indian", "chinese"],
        yearIdx: 3,
        direction: "inbound",
        flyTo: { lat: 30, lng: 100, altitude: 2.2 },
      },
    ],
  },
  {
    id: "irish-exodus",
    title: "The Colony That Kept Exporting",
    subtitle: "Irish Diaspora · Atlantic · 1990–2020",
    tab: "diaspora",
    category: "collapse",
    beats: [
      {
        text: "Ireland. Population: 4.5 million.",
        selectedIds: ["irish"],
        yearIdx: 0,
        direction: "outbound",
        flyTo: { lat: 53, lng: -8, altitude: 2.0 },
      },
      {
        text: "Diaspora: 80 million. The Famine killed 1 million and sent 6 million more in a decade.",
        selectedIds: ["irish"],
        yearIdx: 0,
        direction: "outbound",
        flyTo: { lat: 40, lng: -35, altitude: 2.5 },
      },
      {
        text: "Boston elected an Irish-American mayor for 60 consecutive years. More Irish speakers live in New York than in Ireland.",
        selectedIds: ["irish"],
        yearIdx: 1,
        direction: "outbound",
        flyTo: { lat: 42, lng: -71, altitude: 1.8 },
      },
      {
        text: "The corridor is older than the republic. It never closed.",
        selectedIds: ["irish"],
        yearIdx: 3,
        direction: "outbound",
        flyTo: { lat: 47, lng: -30, altitude: 2.8 },
      },
    ],
  },
  {
    id: "atlantic-diaspora",
    title: "Routes Older Than Borders",
    subtitle: "African Diaspora · Atlantic · 1500–present",
    tab: "diaspora",
    category: "collapse",
    beats: [
      {
        text: "1500 to 1900. 12 million people forced across this ocean.",
        selectedIds: ["african"],
        yearIdx: 0,
        direction: "outbound",
        flyTo: { lat: 0, lng: -28, altitude: 2.8 },
      },
      {
        text: "The routes mapped profit, not people. Plantations required a specific kind of labor at scale.",
        selectedIds: ["african"],
        yearIdx: 0,
        direction: "outbound",
        flyTo: { lat: 5, lng: -10, altitude: 2.2 },
      },
      {
        text: "Brazil received 40% of all enslaved Africans. Its African-descent population now exceeds Nigeria's.",
        selectedIds: ["african"],
        yearIdx: 3,
        direction: "outbound",
        flyTo: { lat: -10, lng: -52, altitude: 1.8 },
      },
      {
        text: "The ships stopped. The geography remained.",
        selectedIds: ["african"],
        yearIdx: 3,
        direction: "outbound",
        flyTo: { lat: -5, lng: -25, altitude: 3.0 },
      },
    ],
  },
  {
    id: "stateless-crisis",
    title: "The Geography of Absence",
    subtitle: "12 million people · no legal identity",
    tab: "stateless",
    category: "stateless",
    beats: [
      {
        text: "12 million people. Inside countries. Outside law.",
        flyTo: { lat: 20, lng: 40, altitude: 2.5 },
      },
      {
        text: "Myanmar stripped citizenship from the Rohingya in 1982. A law, not a war. 800,000 remain.",
        selectedIds: ["rohingya"],
        isolate: true,
        flyTo: { lat: 17, lng: 96, altitude: 1.8 },
      },
      {
        text: "The Bidoon missed a registration window in 1971. Their grandchildren are still stateless in the Gulf.",
        selectedIds: ["bidoon"],
        isolate: true,
        flyTo: { lat: 26, lng: 47, altitude: 1.8 },
      },
      {
        text: "Statelessness requires no border crossing. Only a wrong box on a form, at the wrong moment.",
        isolate: false,
        flyTo: { lat: 20, lng: 40, altitude: 2.5 },
      },
    ],
  },
  {
    id: "empire-languages",
    title: "Inheritance Networks",
    subtitle: "Five colonial languages · six continents",
    tab: "languages",
    category: "empire",
    beats: [
      {
        text: "English. 1.4 billion speakers. 59 countries. One empire that insisted it wasn't one.",
        selectedIds: ["english"],
        flyTo: { lat: 20, lng: 0, altitude: 2.5 },
      },
      {
        text: "France built a different kind of empire — and a different kind of language policy. Both stuck.",
        selectedIds: ["english", "french"],
        flyTo: { lat: 15, lng: 10, altitude: 2.8 },
      },
      {
        text: "The Iberian kingdoms divided a hemisphere in 1494. The language boundary they drew has not moved.",
        selectedIds: ["english", "french", "spanish", "portuguese"],
        flyTo: { lat: -10, lng: -55, altitude: 2.2 },
      },
      {
        text: "Arabic preceded European colonialism by centuries. Religion was the vector, not armies — a different pattern with the same result.",
        selectedIds: ["english", "french", "spanish", "portuguese", "arabic"],
        flyTo: { lat: 20, lng: 30, altitude: 2.0 },
      },
      {
        text: "Together: 60% of the world's surface. The empires dissolved. These didn't.",
        selectedIds: ["english", "french", "spanish", "portuguese", "arabic"],
        flyTo: { lat: 20, lng: 15, altitude: 3.2 },
      },
    ],
  },
];

const CATEGORY_LABEL: Record<StoryCategory, string> = {
  corridor: "Corridor",
  collapse: "Collapse",
  empire: "Empire",
  stateless: "Stateless",
  reverse: "Reverse Flow",
};

const loadPins = (): Pin[] => {
  try { return JSON.parse(localStorage.getItem(PIN_KEY) ?? "[]"); }
  catch { return []; }
};
const savePins = (pins: Pin[]) =>
  localStorage.setItem(PIN_KEY, JSON.stringify(pins));

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>("languages");
  const [globeState, setGlobeState] = useState<GlobeState>(EMPTY_STATE);
  const [clickedCountry, setClickedCountry] = useState<{ iso: string; name: string } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pins, setPins] = useState<Pin[]>(loadPins);
  const [pinsOpen, setPinsOpen] = useState(false);
  const [storiesOpen, setStoriesOpen] = useState(false);
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [beatIdx, setBeatIdx] = useState(0);
  const [storyKey, setStoryKey] = useState("default");
  const [showIntro, setShowIntro] = useState(shouldShowIntro);
  const globeRef = useRef<GlobeHandle>(null);

  const currentBeat: StoryBeat | undefined = activeStory?.beats[beatIdx];

  const handleTabChange = useCallback((tab: TabId) => {
    setActiveTab(tab);
    setClickedCountry(null);
    setGlobeState(EMPTY_STATE);
    setDrawerOpen(false);
    setActiveStory(null);
    setBeatIdx(0);
    setStoryKey("default");
  }, []);

  const handleFlyTo = useCallback((target: FlyTarget) => {
    globeRef.current?.flyTo(target);
  }, []);

  const handleCountryClick = useCallback((iso: string, name: string) => {
    setClickedCountry({ iso, name });
  }, []);

  const loadStory = useCallback((story: Story) => {
    setActiveTab(story.tab);
    setActiveStory(story);
    setBeatIdx(0);
    setStoryKey(story.id);
    setGlobeState(EMPTY_STATE);
    setClickedCountry(null);
    setStoriesOpen(false);
    const firstBeat = story.beats[0];
    if (firstBeat?.flyTo) setTimeout(() => globeRef.current?.flyTo(firstBeat.flyTo!), 300);
  }, []);

  // Fly to new beat target when beat advances
  useEffect(() => {
    if (!activeStory || !currentBeat?.flyTo) return;
    globeRef.current?.flyTo(currentBeat.flyTo);
  }, [activeStory, beatIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  const advanceBeat = useCallback(() => {
    if (!activeStory) return;
    setBeatIdx((prev) => Math.min(prev + 1, activeStory.beats.length - 1));
  }, [activeStory]);

  const retreatBeat = useCallback(() => {
    setBeatIdx((prev) => Math.max(prev - 1, 0));
  }, []);

  const dismissStory = useCallback(() => {
    setActiveStory(null);
    setBeatIdx(0);
    setStoryKey("default");
  }, []);

  const pinCurrent = () => {
    const label = prompt(
      "Name this view:",
      `${TABS.find((t) => t.id === activeTab)?.label} – ${new Date().toLocaleTimeString()}`
    );
    if (!label) return;
    const pin: Pin = {
      id: Date.now().toString(),
      label,
      tab: activeTab,
      timestamp: Date.now(),
      globeState,
    };
    const next = [pin, ...pins].slice(0, 10);
    setPins(next);
    savePins(next);
  };

  const loadPin = (pin: Pin) => {
    setActiveTab(pin.tab);
    setGlobeState(pin.globeState);
    setPinsOpen(false);
    setClickedCountry(null);
  };

  const deletePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = pins.filter((p) => p.id !== id);
    setPins(next);
    savePins(next);
  };

  const handleDismissIntro = useCallback(() => {
    markIntroSeen();
    setShowIntro(false);
  }, []);

  useEffect(() => {
    if (!pinsOpen && !storiesOpen) return;
    const handler = () => { setPinsOpen(false); setStoriesOpen(false); };
    setTimeout(() => document.addEventListener("click", handler), 0);
    return () => document.removeEventListener("click", handler);
  }, [pinsOpen, storiesOpen]);

  // configKey changes per beat so sidebars' useEffect can respond
  const configKey = activeStory ? `${activeStory.id}:${beatIdx}` : undefined;

  const diasporaStoryConfig = activeStory?.tab === "diaspora" && currentBeat
    ? {
        selectedIds: currentBeat.selectedIds,
        yearIdx: currentBeat.yearIdx,
        direction: currentBeat.direction,
        configKey,
      }
    : undefined;

  const langStoryConfig = activeStory?.tab === "languages" && currentBeat
    ? { selectedIds: currentBeat.selectedIds, configKey }
    : undefined;

  const statelessStoryConfig = activeStory?.tab === "stateless" && currentBeat
    ? {
        selectedIds: currentBeat.selectedIds,
        isolate: currentBeat.isolate,
        configKey,
      }
    : undefined;

  return (
    <div className="app">
      {showIntro && <IntroOverlay onDismiss={handleDismissIntro} />}

      <header className="app-header">
        <div className="header-title">
          <div className="header-wordmark">
            <h1>Global Human Geography</h1>
            <p className="header-tagline">Civilization is movement.</p>
          </div>
        </div>

        <nav className="tab-nav">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`tab-btn ${activeTab === t.id ? "tab-active" : ""}`}
              onClick={() => handleTabChange(t.id)}
              title={t.label}
            >
              <span className="tab-icon"><t.Icon /></span>
              <span className="tab-label">{t.label}</span>
            </button>
          ))}
        </nav>

        <div className="header-actions">
          <div className="pins-wrap" onClick={(e) => e.stopPropagation()}>
            <button
              className="pin-btn"
              onClick={() => setStoriesOpen((o) => !o)}
              title="Guided stories"
            >
              ▶<span className="btn-text"> Stories</span>
            </button>
            {storiesOpen && (
              <div className="pins-dropdown stories-dropdown">
                <div className="pins-dropdown-title">Guided Stories</div>
                {STORIES.map((s) => (
                  <div key={s.id} className="pin-item story-pin-item" onClick={() => loadStory(s)}>
                    <span className="pin-tab-icon">
                      {s.tab === "languages" ? <GlobeIcon /> : s.tab === "diaspora" ? <DiasporaIcon /> : <StatelessIcon />}
                    </span>
                    <div className="story-item-text">
                      <span className="pin-label">{s.title}</span>
                      <span className="story-item-sub">{s.subtitle}</span>
                    </div>
                    <span className={`story-cat-badge cat-${s.category}`}>{CATEGORY_LABEL[s.category]}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pins-wrap" onClick={(e) => e.stopPropagation()}>
            <button className="pin-btn" onClick={pinCurrent} title="Pin current view">
              📌<span className="btn-text"> Pin</span>
            </button>
            {pins.length > 0 && (
              <button
                className="pin-btn pin-list-btn"
                onClick={() => setPinsOpen((o) => !o)}
                title="Pinned views"
              >
                {pins.length}
              </button>
            )}
            {pinsOpen && (
              <div className="pins-dropdown">
                <div className="pins-dropdown-title">Pinned Views</div>
                {pins.map((p) => (
                  <div key={p.id} className="pin-item" onClick={() => loadPin(p)}>
                    <span className="pin-tab-icon">
                      {p.tab === "languages" ? <GlobeIcon /> : p.tab === "diaspora" ? <DiasporaIcon /> : <StatelessIcon />}
                    </span>
                    <span className="pin-label">{p.label}</span>
                    <button className="pin-delete" onClick={(e) => deletePin(p.id, e)}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            className="drawer-toggle"
            onClick={() => setDrawerOpen((o) => !o)}
            aria-label="Toggle legend"
          >
            {drawerOpen ? "✕" : "☰"}
          </button>
        </div>
      </header>

      <main className="app-main">
        {drawerOpen && (
          <div className="sidebar-backdrop" onClick={() => setDrawerOpen(false)} aria-hidden />
        )}
        <aside className={`sidebar ${drawerOpen ? "sidebar-open" : ""}`}>
          {activeTab === "languages" && (
            <LanguagesSidebar
              key={storyKey}
              storyConfig={langStoryConfig}
              onStateChange={setGlobeState}
              onFlyTo={handleFlyTo}
            />
          )}
          {activeTab === "diaspora" && (
            <DiasporaSidebar
              key={storyKey}
              storyConfig={diasporaStoryConfig}
              onStateChange={setGlobeState}
              onFlyTo={handleFlyTo}
            />
          )}
          {activeTab === "stateless" && (
            <StatelessSidebar
              key={storyKey}
              storyConfig={statelessStoryConfig}
              onStateChange={setGlobeState}
              onFlyTo={handleFlyTo}
            />
          )}
        </aside>

        <div className="globe-area">
          <GlobeViz
            ref={globeRef}
            highlights={globeState.highlights}
            arcs={globeState.arcs}
            rings={globeState.rings}
            mode={activeTab}
            onCountryClick={handleCountryClick}
          />

          {activeStory && currentBeat && (
            <div className="story-card" role="region" aria-label="Story narration">
              <div className="story-card-header">
                <div className="story-card-meta">
                  <span className={`story-cat-badge cat-${activeStory.category}`}>
                    {CATEGORY_LABEL[activeStory.category]}
                  </span>
                  <div className="story-card-title">{activeStory.title}</div>
                  <div className="story-card-subtitle">{activeStory.subtitle}</div>
                </div>
                <button className="story-card-close" onClick={dismissStory} aria-label="Close story">✕</button>
              </div>

              <p className="story-card-text" key={`${activeStory.id}:${beatIdx}`}>
                {currentBeat.text}
              </p>

              <div className="story-beat-nav">
                <button
                  className="beat-prev"
                  onClick={retreatBeat}
                  disabled={beatIdx === 0}
                  aria-label="Previous beat"
                >
                  ←
                </button>

                <div className="beat-dots" role="tablist" aria-label="Story beats">
                  {activeStory.beats.map((_, i) => (
                    <button
                      key={i}
                      className={`beat-dot ${i === beatIdx ? "beat-dot-active" : i < beatIdx ? "beat-dot-past" : ""}`}
                      onClick={() => setBeatIdx(i)}
                      role="tab"
                      aria-selected={i === beatIdx}
                      aria-label={`Beat ${i + 1} of ${activeStory.beats.length}`}
                    />
                  ))}
                </div>

                <button
                  className="beat-next"
                  onClick={advanceBeat}
                  disabled={beatIdx === activeStory.beats.length - 1}
                  aria-label="Next beat"
                >
                  →
                </button>
              </div>

              <div className="beat-counter">
                {beatIdx + 1} / {activeStory.beats.length}
              </div>
            </div>
          )}

          {clickedCountry && (
            <CountryPanel
              iso={clickedCountry.iso}
              name={clickedCountry.name}
              activeTab={activeTab}
              onClose={() => setClickedCountry(null)}
              onFlyTo={handleFlyTo}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
