# Global Data Visual

An interactive 3D globe exploring the relationship between language, migration, diaspora, and statelessness through layered geographic visualization.

Built with React and WebGL, the project combines atmospheric globe rendering with dense geopolitical datasets to create a museum-style exploratory interface rather than a conventional dashboard.

---

## Features

### 🌍 Language Geography
Explore major world languages and linguistic families across regions and nations.

- Multi-language overlap visualization
- Preset language groups:
  - UN Official Languages
  - Top 5 by speaker count
  - Indo-European families
- Coverage metrics:
  - speaker populations
  - geographic reach
  - country overlap
- Hover isolation and globe fly-to interactions
- Native vs total speaker modes

---

### 🧭 Diaspora Flows
Visualize migration and diaspora movement patterns over time.

- Outbound and inbound migration arcs
- Temporal filtering by year
- Searchable diaspora groups
- Top destination analysis
- Animated globe transitions
- Arc direction controls

---

### 🕊 Stateless Populations
Explore stateless communities and displaced populations worldwide.

- Population-based globe highlighting
- Search and filtering
- Multiple sort modes:
  - population
  - name
  - earliest recorded
- Isolate mode for focused analysis
- Expandable historical and contextual summaries
- UNHCR-aligned framing and sourcing

---

## Design Philosophy

The interface is intentionally restrained and atmospheric.

Instead of treating geopolitical information as a flat analytics problem, the project aims to create a slower exploratory experience — one where movement, language, borders, and identity feel spatial and lived-in rather than abstract.

The visual system emphasizes:
- low-light cartographic aesthetics
- layered translucency
- soft motion and camera easing
- contextual density over infographic minimalism
- interactive discovery instead of static presentation

---

## Tech Stack

- React
- TypeScript
- Three.js / React Three Fiber
- CSS
- WebGL
- Geographic datasets + centroid mapping

---

## Accessibility

The project includes:
- ARIA labels and expanded state metadata
- accessible toggle controls
- semantic grouping
- screen-reader-aware sliders
- descriptive fly-to interactions
- improved active-state visibility
- keyboard-compatible controls

---

## Installation

```bash
npm install
```

Run locally:

```bash
npm start
```

Build for production:

```bash
npm run build
```

---

## Project Structure

```txt
src/
├── components/
│   ├── LanguagesSidebar.tsx
│   ├── DiasporaSidebar.tsx
│   ├── StatelessSidebar.tsx
│
├── App.tsx
├── App.css
```

---

## Future Improvements

Planned directions include:

- richer atmospheric globe rendering
- historical timeline interpolation
- expanded migration datasets
- mobile-specific interaction redesign
- deeper keyboard navigation
- search highlighting + fuzzy matching
- animated statistical transitions
- contextual storytelling modes
- layered geopolitical overlays

---

## Data Notes

Population and migration estimates are aggregated from multiple public international datasets and regional estimates, including UN-aligned sources where applicable.

Some figures are approximate and intended primarily for exploratory visualization rather than academic citation.

---

## Author

Created by Ryan Pyles.

Part of an ongoing body of work exploring the intersection of:
- geography
- language
- identity
- systems design
- cartographic storytelling
