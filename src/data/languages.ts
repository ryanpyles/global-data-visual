export interface LanguageGroup {
  id: string;
  name: string;
  family: string;
  color: string;
  countries: string[];
  primaryCountries?: string[];   // dominant/official — full brightness; rest = influence overlay
  origin?: [number, number];     // [lat, lng] for influence arc source (colonial/spread languages)
  speakers: number;              // total speakers, millions
  nativeSpeakers: number;        // native speakers, millions
}

export const languageGroups: LanguageGroup[] = [
  // ── Germanic ──
  {
    id: "english", name: "English", family: "Germanic",
    color: "#3b82f6", speakers: 1500, nativeSpeakers: 380,
    // Primary: L1-dominant Anglosphere
    primaryCountries: ["US","GB","CA","AU","NZ","IE","ZA"],
    origin: [51.5, -0.1], // London — colonial spread source
    countries: ["US","GB","CA","AU","NZ","IE","ZA","NG","GH","KE","UG","TZ","ZW","ZM","MW","BW","NA","SL","LR","GM","SZ","LS","RW","SS","SD","ET","CM","PH","IN","PK","BD","SG","MY","JM","TT","BB","GY","BZ","BS","AG","DM","GD","KN","LC","VC","MT","CY","FJ","PG","WS","TO","VU","SB"],
  },
  {
    id: "german", name: "German", family: "Germanic",
    color: "#fbbf24", speakers: 100, nativeSpeakers: 76,
    countries: ["DE","AT","CH","LI","LU","BE"],
  },
  // ── Romance ──
  {
    id: "spanish", name: "Spanish", family: "Romance",
    color: "#f59e0b", speakers: 500, nativeSpeakers: 485,
    countries: ["MX","ES","CO","AR","PE","VE","CL","EC","GT","CU","BO","DO","HN","PY","SV","NI","CR","PA","UY","GQ","PR"],
  },
  {
    id: "french", name: "French", family: "Romance",
    color: "#8b5cf6", speakers: 300, nativeSpeakers: 80,
    // Primary: European core + established Francophone African states
    primaryCountries: ["FR","BE","CH","LU","MC","SN","CI","CM","GA","CG","CD","ML","BF","NE","GN","TD","CF","MG","HT"],
    origin: [48.9, 2.3], // Paris
    countries: ["FR","BE","CH","LU","MC","SN","ML","BF","NE","TD","CF","CG","CD","GA","CM","CI","GN","BJ","TG","MG","DZ","MA","TN","DJ","KM","MU","SC","HT","PF","NC"],
  },
  {
    id: "portuguese", name: "Portuguese", family: "Romance",
    color: "#84cc16", speakers: 250, nativeSpeakers: 235,
    countries: ["BR","PT","AO","MZ","GW","CV","ST","TL"],
  },
  // ── Slavic ──
  {
    id: "russian", name: "Russian", family: "Slavic",
    color: "#06b6d4", speakers: 260, nativeSpeakers: 150,
    // Primary: dominant Russian-speaking states
    primaryCountries: ["RU","BY","KZ"],
    origin: [55.7, 37.6], // Moscow
    countries: ["RU","BY","KZ","KG","TJ","UZ","TM","MD","UA","GE","AM","AZ"],
  },
  // ── Indo-Iranian ──
  {
    id: "hindi", name: "Hindi", family: "Indo-Iranian",
    color: "#f97316", speakers: 600, nativeSpeakers: 600,
    countries: ["IN","NP","FJ"],
  },
  {
    id: "bengali", name: "Bengali", family: "Indo-Iranian",
    color: "#fb923c", speakers: 230, nativeSpeakers: 230,
    primaryCountries: ["BD"],   // IN is secondary (West Bengal among many Indian languages)
    countries: ["BD","IN"],
  },
  {
    id: "persian", name: "Persian / Farsi", family: "Indo-Iranian",
    color: "#7c3aed", speakers: 110, nativeSpeakers: 70,
    countries: ["IR","AF","TJ"],
  },
  // ── Semitic ──
  {
    id: "arabic", name: "Arabic", family: "Semitic",
    color: "#10b981", speakers: 420, nativeSpeakers: 310,
    countries: ["EG","SA","IQ","DZ","MA","YE","SY","TN","JO","LY","LB","AE","PS","OM","KW","QA","BH","MR","SO","SD","KM","DJ","ER"],
  },
  // ── Sino-Tibetan ──
  {
    id: "mandarin", name: "Mandarin Chinese", family: "Sino-Tibetan",
    color: "#ef4444", speakers: 920, nativeSpeakers: 920,
    countries: ["CN","TW","SG"],
  },
  // ── Turkic ──
  {
    id: "turkish", name: "Turkish", family: "Turkic",
    color: "#e11d48", speakers: 88, nativeSpeakers: 84,
    primaryCountries: ["TR"],   // CY and AZ are minority/secondary
    countries: ["TR","CY","AZ"],
  },
  // ── Japonic ──
  {
    id: "japanese", name: "Japanese", family: "Japonic",
    color: "#f472b6", speakers: 125, nativeSpeakers: 125,
    countries: ["JP"],
  },
  // ── Austronesian ──
  {
    id: "malay", name: "Malay / Indonesian", family: "Austronesian",
    color: "#a78bfa", speakers: 290, nativeSpeakers: 260,
    primaryCountries: ["ID","MY","BN"],  // SG and TL are secondary
    countries: ["ID","MY","BN","SG","TL"],
  },
  // ── Bantu ──
  {
    id: "swahili", name: "Swahili", family: "Bantu",
    color: "#34d399", speakers: 200, nativeSpeakers: 16,
    primaryCountries: ["TZ","KE","UG"],  // trade lingua franca in the rest
    countries: ["TZ","KE","UG","RW","BI","CD","MZ","MW","ZM","SO","KM"],
  },
];

// Language family ordering
export const languageFamilies = [
  "Germanic","Romance","Slavic","Indo-Iranian",
  "Semitic","Sino-Tibetan","Turkic","Japonic","Austronesian","Bantu",
];
