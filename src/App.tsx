import React, { useState, useRef, useCallback, useEffect, ReactNode } from "react";
import "./App.css";
import GlobeViz, { GlobeHandle } from "./components/GlobeViz";
import LanguagesSidebar from "./components/LanguagesSidebar";
import DiasporaSidebar from "./components/DiasporaSidebar";
import StatelessSidebar from "./components/StatelessSidebar";
import CountryPanel from "./components/CountryPanel";
import IntroOverlay, { shouldShowIntro, markIntroSeen } from "./components/IntroOverlay";
import { TabId, GlobeState, FlyTarget } from "./types";

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

interface Story {
  id: string;
  title: string;
  subtitle: string;
  tab: TabId;
  narrative: string;
  diasporaIds?: string[];
  langIds?: string[];
  yearIdx?: number;
  flyTo?: FlyTarget;
}

const STORIES: Story[] = [
  {
    id: "gulf-labor",
    title: "Gulf Labor Migration",
    subtitle: "1990 – 2020",
    tab: "diaspora",
    diasporaIds: ["indian", "lebanese"],
    yearIdx: 0,
    flyTo: { lat: 24, lng: 54, altitude: 1.8 },
    narrative: "Since the 1970s oil boom, the Gulf states transformed desert into megacity on the backs of South Asian and Arab labor. Drag the year slider to watch migration corridors shift as Gulf wealth concentrated — and as Lebanon collapsed.",
  },
  {
    id: "brain-drain",
    title: "Brain Drain",
    subtitle: "Tech Corridors · 2020",
    tab: "diaspora",
    diasporaIds: ["indian", "chinese"],
    yearIdx: 3,
    flyTo: { lat: 37, lng: -97, altitude: 2.0 },
    narrative: "Silicon Valley's majority-immigrant workforce traces back to two migration systems. Indian engineers and Chinese researchers transformed American technology — and are now building parallel ecosystems at home.",
  },
  {
    id: "irish-exodus",
    title: "The Irish Exodus",
    subtitle: "A nation scattered across the Atlantic",
    tab: "diaspora",
    diasporaIds: ["irish"],
    yearIdx: 0,
    flyTo: { lat: 53, lng: -8, altitude: 2.2 },
    narrative: "Famine, colonial extraction, and economic collapse sent 80M people of Irish descent across the world — 16× Ireland's population. The arc to Boston is the most consequential corridor in Atlantic migration history.",
  },
  {
    id: "atlantic-diaspora",
    title: "Atlantic Diaspora",
    subtitle: "Africa's forced dispersal",
    tab: "diaspora",
    diasporaIds: ["african"],
    yearIdx: 3,
    flyTo: { lat: 0, lng: -28, altitude: 2.5 },
    narrative: "The transatlantic slave trade moved 12M Africans across the ocean between 1500–1900. Their descendants built the economies of the Americas. Brazil holds the world's second-largest African-descent population after Nigeria.",
  },
  {
    id: "stateless-crisis",
    title: "Stateless Crisis",
    subtitle: "12M people without legal identity",
    tab: "stateless",
    narrative: "Statelessness is a bureaucratic condition, not a geographic one. These 12 million people exist inside countries but outside law — unable to vote, own property, cross borders, or access healthcare. Most were born this way.",
  },
  {
    id: "empire-languages",
    title: "Empire Languages",
    subtitle: "Colonial linguistic legacy",
    tab: "languages",
    langIds: ["english", "french", "spanish", "portuguese", "arabic"],
    narrative: "Five languages spread by conquest now span every inhabited continent. English, French, Spanish, Portuguese, and Arabic together cover over 60% of the world's surface — long after the empires that spread them dissolved.",
  },
];

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
  const [storyKey, setStoryKey] = useState("default");
  const [showIntro, setShowIntro] = useState(shouldShowIntro);
  const globeRef = useRef<GlobeHandle>(null);

  const handleTabChange = useCallback((tab: TabId) => {
    setActiveTab(tab);
    setClickedCountry(null);
    setGlobeState(EMPTY_STATE);
    setDrawerOpen(false);
    setActiveStory(null);
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
    setStoryKey(story.id);
    setGlobeState(EMPTY_STATE);
    setClickedCountry(null);
    setStoriesOpen(false);
    if (story.flyTo) setTimeout(() => globeRef.current?.flyTo(story.flyTo!), 300);
  }, []);

  const dismissStory = useCallback(() => setActiveStory(null), []);

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

  const diasporaStoryConfig = activeStory?.tab === "diaspora"
    ? { selectedIds: activeStory.diasporaIds, yearIdx: activeStory.yearIdx }
    : undefined;
  const langStoryConfig = activeStory?.tab === "languages"
    ? { selectedIds: activeStory.langIds }
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
              ▶ Stories
            </button>
            {storiesOpen && (
              <div className="pins-dropdown stories-dropdown">
                <div className="pins-dropdown-title">Guided Stories</div>
                {STORIES.map((s) => (
                  <div key={s.id} className="pin-item" onClick={() => loadStory(s)}>
                    <span className="pin-tab-icon">
                      {s.tab === "languages" ? <GlobeIcon /> : s.tab === "diaspora" ? <DiasporaIcon /> : <StatelessIcon />}
                    </span>
                    <div className="story-item-text">
                      <span className="pin-label">{s.title}</span>
                      <span className="story-item-sub">{s.subtitle}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pins-wrap" onClick={(e) => e.stopPropagation()}>
            <button className="pin-btn" onClick={pinCurrent} title="Pin current view">
              📌 Pin
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
            <StatelessSidebar onStateChange={setGlobeState} onFlyTo={handleFlyTo} />
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

          {activeStory && (
            <div className="story-card">
              <div className="story-card-header">
                <div>
                  <div className="story-card-title">{activeStory.title}</div>
                  <div className="story-card-subtitle">{activeStory.subtitle}</div>
                </div>
                <button className="story-card-close" onClick={dismissStory}>✕</button>
              </div>
              <p className="story-card-text">{activeStory.narrative}</p>
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
