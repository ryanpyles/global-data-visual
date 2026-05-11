export type TabId = "languages" | "diaspora" | "stateless";

export interface CountryHighlight {
  iso: string;
  color: string;
  label?: string;
}

export interface ArcData {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: [string, string]; // [origin color, destination color]
  label: string;
  stroke: number; // line thickness proportional to population
  altitude?: number; // arc height — larger = higher arc = visually heavier route
}

export interface RingData {
  lat: number;
  lng: number;
  color: string;
  label: string;
  maxR: number;
}

export interface FlyTarget {
  lat: number;
  lng: number;
  altitude?: number;
}

export interface GlobeState {
  highlights: CountryHighlight[];
  arcs: ArcData[];
  rings: RingData[];
}
