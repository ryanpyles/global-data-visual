import React, { useState } from "react";
import "./App.css";
import LanguagesTab from "./components/LanguagesTab";
import DiasporaTab from "./components/DiasporaTab";
import StatelessTab from "./components/StatelessTab";

type Tab = "languages" | "diaspora" | "stateless";

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: "languages", label: "Languages", icon: "🌐" },
  { id: "diaspora", label: "Diaspora", icon: "✈️" },
  { id: "stateless", label: "Stateless Peoples", icon: "⚠️" },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("languages");

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-title">
          <span className="header-icon">🌍</span>
          <h1>Global Human Geography</h1>
        </div>
        <nav className="tab-nav">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={`tab-btn ${activeTab === t.id ? "tab-active" : ""}`}
              onClick={() => setActiveTab(t.id)}
            >
              <span className="tab-icon">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>
      </header>
      <main className="app-main">
        {activeTab === "languages" && <LanguagesTab />}
        {activeTab === "diaspora" && <DiasporaTab />}
        {activeTab === "stateless" && <StatelessTab />}
      </main>
    </div>
  );
};

export default App;
