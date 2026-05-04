import React, { useMemo } from "react";
import { languageGroups } from "../data/languages";
import { diasporaGroups } from "../data/diaspora";
import { statelessGroups } from "../data/stateless";
import { centroids } from "../data/countryCentroids";
import { TabId, FlyTarget } from "../types";

interface Props {
  iso: string;
  name: string;
  activeTab: TabId;
  onClose: () => void;
  onFlyTo: (t: FlyTarget) => void;
}

const flagEmoji = (iso: string) =>
  iso
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(c.charCodeAt(0) - 65 + 0x1f1e6))
    .join("");

const fmt = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}M` : `${n}K`;

const CountryPanel: React.FC<Props> = ({ iso, name, activeTab, onClose, onFlyTo }) => {
  const languages = useMemo(
    () => languageGroups.filter((l) => l.countries.includes(iso)),
    [iso]
  );

  const diasporaOrigin = useMemo(
    () => diasporaGroups.filter((g) => g.origin === iso),
    [iso]
  );

  const diasporaDestination = useMemo(
    () =>
      diasporaGroups
        .map((g) => {
          const dest = g.destinations.find((d) => d.country === iso);
          return dest ? { group: g, population: dest.population } : null;
        })
        .filter(Boolean) as { group: (typeof diasporaGroups)[0]; population: number }[],
    [iso]
  );

  const stateless = useMemo(
    () => statelessGroups.filter((g) => g.countries.includes(iso)),
    [iso]
  );

  const canFly = !!centroids[iso];

  return (
    <div className="country-panel">
      <div className="panel-header">
        <div className="panel-title">
          <span className="panel-flag">{flagEmoji(iso)}</span>
          <div>
            <h2 className="panel-name">{name}</h2>
            <span className="panel-iso">{iso}</span>
          </div>
        </div>
        <div className="panel-actions">
          {canFly && (
            <button
              className="panel-fly-btn"
              onClick={() => {
                const [lat, lng] = centroids[iso];
                onFlyTo({ lat, lng, altitude: 1.4 });
              }}
              title="Fly to country"
            >
              ◎ Focus
            </button>
          )}
          <button className="panel-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
      </div>

      <div className="panel-body">
        {/* Languages section */}
        {languages.length > 0 && (
          <section className="panel-section">
            <h3 className="panel-section-title">🌐 Languages</h3>
            <ul className="panel-tag-list">
              {languages.map((l) => (
                <li
                  key={l.id}
                  className="panel-tag"
                  style={{ borderColor: l.color, color: l.color }}
                >
                  {l.name}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Diaspora origin */}
        {diasporaOrigin.length > 0 && (
          <section className="panel-section">
            <h3 className="panel-section-title">✈️ Diaspora Origin</h3>
            {diasporaOrigin.map((g) => (
              <div key={g.id} className="panel-diaspora-row">
                <span
                  className="panel-dot"
                  style={{ background: g.color }}
                />
                <span>{g.name}</span>
                <span className="panel-sub">{fmt(g.population * 1000)} abroad</span>
              </div>
            ))}
          </section>
        )}

        {/* Diaspora destination */}
        {diasporaDestination.length > 0 && (
          <section className="panel-section">
            <h3 className="panel-section-title">✈️ Diaspora Hosted</h3>
            {diasporaDestination.map(({ group: g, population }) => (
              <div key={g.id} className="panel-diaspora-row">
                <span
                  className="panel-dot"
                  style={{ background: g.color }}
                />
                <span>{g.name}</span>
                <span className="panel-sub">{fmt(population)} people</span>
              </div>
            ))}
          </section>
        )}

        {/* Stateless peoples */}
        {stateless.length > 0 && (
          <section className="panel-section">
            <h3 className="panel-section-title">⚠️ Stateless Populations</h3>
            {stateless.map((g) => (
              <div key={g.id} className="panel-stateless-row">
                <span
                  className="panel-dot"
                  style={{ background: g.color }}
                />
                <div>
                  <div className="panel-stateless-name">{g.name}</div>
                  <div className="panel-stateless-desc">{g.description}</div>
                </div>
              </div>
            ))}
          </section>
        )}

        {languages.length === 0 &&
          diasporaOrigin.length === 0 &&
          diasporaDestination.length === 0 &&
          stateless.length === 0 && (
            <p className="panel-empty">
              No data for this country in the current dataset.
            </p>
          )}
      </div>
    </div>
  );
};

export default CountryPanel;
