import React, { useState, useRef, useCallback } from "react";
import "./App.css";
import GlobeViz, { GlobeHandle } from "./components/GlobeViz";
import LanguagesSidebar from "./components/LanguagesSidebar";
import DiasporaSidebar from "./components/DiasporaSidebar";
import StatelessSidebar from "./components/StatelessSidebar";
import CountryPanel from "./components/CountryPanel";
import { TabId, GlobeState, FlyTarget } from "./types";

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "languages", label: "Languages", icon: "🌐" },
  { id: "diaspora", label: "Diaspora", icon: "✈️" },
  { id: "stateless", label: "Stateless Peoples", icon: "⚠️" },
];

const EMPTY_STATE: GlobeState = { highlights: [], arcs: [], rings: [] };

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>("languages");
  const [globeState, setGlobeState] = useState<GlobeState>(EMPTY_STATE);
  const [clickedCountry, setClickedCountry] = useState<{ iso: string; name: string } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const globeRef = useRef<GlobeHandle>(null);

  const handleTabChange = useCallback((tab: TabId) => {
    setActiveTab(tab);
    setClickedCountry(null);
    setGlobeState(EMPTY_STATE);
  }, []);

  const handleFlyTo = useCallback((target: FlyTarget) => {
    globeRef.current?.flyTo(target);
  }, []);

  const handleCountryClick = useCallback((iso: string, name: string) => {
    setClickedCountry({ iso, name });
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-title">
          <span className="header-icon">🌍</span>
          <h1>Global Human Geography</h1>
        </div>
        <nav className="tab-nav">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`tab-btn ${activeTab === t.id ? "tab-active" : ""}`}
              onClick={() => handleTabChange(t.id)}
            >
              <span className="tab-icon">{t.icon}</span>
              <span className="tab-label">{t.label}</span>
            </button>
          ))}
        </nav>
        {/* Mobile drawer toggle */}
        <button
          className="drawer-toggle"
          onClick={() => setDrawerOpen((o) => !o)}
          aria-label="Toggle legend"
        >
          {drawerOpen ? "✕" : "☰"}
        </button>
      </header>

      <main className="app-main">
        {/* Sidebar — always rendered, hidden on mobile via CSS unless drawer open */}
        <aside className={`sidebar ${drawerOpen ? "sidebar-open" : ""}`}>
          {activeTab === "languages" && (
            <LanguagesSidebar onStateChange={setGlobeState} onFlyTo={handleFlyTo} />
          )}
          {activeTab === "diaspora" && (
            <DiasporaSidebar onStateChange={setGlobeState} onFlyTo={handleFlyTo} />
          )}
          {activeTab === "stateless" && (
            <StatelessSidebar onStateChange={setGlobeState} onFlyTo={handleFlyTo} />
          )}
        </aside>

        {/* Globe — always mounted, never destroyed */}
        <div className="globe-area">
          <GlobeViz
            ref={globeRef}
            highlights={globeState.highlights}
            arcs={globeState.arcs}
            rings={globeState.rings}
            onCountryClick={handleCountryClick}
          />
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
