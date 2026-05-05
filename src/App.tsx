import React, { useState, useRef, useCallback, useEffect } from "react";
import "./App.css";
import GlobeViz, { GlobeHandle } from "./components/GlobeViz";
import LanguagesSidebar from "./components/LanguagesSidebar";
import DiasporaSidebar from "./components/DiasporaSidebar";
import StatelessSidebar from "./components/StatelessSidebar";
import CountryPanel from "./components/CountryPanel";
import { TabId, GlobeState, FlyTarget } from "./types";

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "languages", label: "Languages", icon: "🌐" },
  { id: "diaspora",  label: "Diaspora",  icon: "✈️" },
  { id: "stateless", label: "Stateless", icon: "⚠️" },
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
  const globeRef = useRef<GlobeHandle>(null);

  const handleTabChange = useCallback((tab: TabId) => {
    setActiveTab(tab);
    setClickedCountry(null);
    setGlobeState(EMPTY_STATE);
    setDrawerOpen(false);
  }, []);

  const handleFlyTo = useCallback((target: FlyTarget) => {
    globeRef.current?.flyTo(target);
  }, []);

  const handleCountryClick = useCallback((iso: string, name: string) => {
    setClickedCountry({ iso, name });
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

  // Close pins panel on outside click
  useEffect(() => {
    if (!pinsOpen) return;
    const handler = () => setPinsOpen(false);
    setTimeout(() => document.addEventListener("click", handler), 0);
    return () => document.removeEventListener("click", handler);
  }, [pinsOpen]);

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

        <div className="header-actions">
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
                  <div
                    key={p.id}
                    className="pin-item"
                    onClick={() => loadPin(p)}
                  >
                    <span className="pin-tab-icon">
                      {TABS.find((t) => t.id === p.tab)?.icon}
                    </span>
                    <span className="pin-label">{p.label}</span>
                    <button
                      className="pin-delete"
                      onClick={(e) => deletePin(p.id, e)}
                    >
                      ✕
                    </button>
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
            <LanguagesSidebar onStateChange={setGlobeState} onFlyTo={handleFlyTo} />
          )}
          {activeTab === "diaspora" && (
            <DiasporaSidebar onStateChange={setGlobeState} onFlyTo={handleFlyTo} />
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
