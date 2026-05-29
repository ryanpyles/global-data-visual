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
  gdpT: number;                  // combined GDP of primary/dominant economies, USD trillions
  internetUsersM: number;        // internet users in language, millions
  marketNote?: string;           // brief market context
}

export const languageGroups: LanguageGroup[] = [
  // ── Germanic ──
  {
    id: "english", name: "English", family: "Germanic",
    color: "#3b82f6", speakers: 1500, nativeSpeakers: 380,
    gdpT: 35, internetUsersM: 1500,
    marketNote: "Global default for business, tech, and finance",
    primaryCountries: ["US","GB","CA","AU","NZ","IE","ZA"],
    origin: [51.5, -0.1],
    countries: ["US","GB","CA","AU","NZ","IE","ZA","NG","GH","KE","UG","TZ","ZW","ZM","MW","BW","NA","SL","LR","GM","SZ","LS","RW","SS","SD","ET","CM","PH","IN","PK","BD","SG","MY","JM","TT","BB","GY","BZ","BS","AG","DM","GD","KN","LC","VC","MT","CY","FJ","PG","WS","TO","VU","SB"],
  },
  {
    id: "german", name: "German", family: "Germanic",
    color: "#fbbf24", speakers: 100, nativeSpeakers: 76,
    gdpT: 5.0, internetUsersM: 95,
    marketNote: "Largest EU economy; industrial & engineering hub",
    countries: ["DE","AT","CH","LI","LU","BE"],
  },
  {
    id: "swedish", name: "Swedish", family: "Germanic",
    color: "#facc15", speakers: 10, nativeSpeakers: 10,
    gdpT: 0.6, internetUsersM: 9,
    marketNote: "Startup hub (Spotify, IKEA, H&M); near-100% internet penetration",
    countries: ["SE","FI"],
  },
  {
    id: "icelandic", name: "Icelandic", family: "Germanic",
    color: "#93c5fd", speakers: 0.37, nativeSpeakers: 0.37,
    gdpT: 0.027, internetUsersM: 0.36,
    marketNote: "Among highest GDP per capita; niche but affluent market",
    countries: ["IS"],
  },
  // ── Romance ──
  {
    id: "spanish", name: "Spanish", family: "Romance",
    color: "#f59e0b", speakers: 500, nativeSpeakers: 485,
    gdpT: 5.5, internetUsersM: 490,
    marketNote: "500M+ native speakers; growing digital economy across Americas",
    countries: ["MX","ES","CO","AR","PE","VE","CL","EC","GT","CU","BO","DO","HN","PY","SV","NI","CR","PA","UY","GQ","PR"],
  },
  {
    id: "french", name: "French", family: "Romance",
    color: "#8b5cf6", speakers: 300, nativeSpeakers: 80,
    gdpT: 4.5, internetUsersM: 300,
    marketNote: "Official in 29 countries; fastest growing language by speakers",
    primaryCountries: ["FR","BE","CH","LU","MC","SN","CI","CM","GA","CG","CD","ML","BF","NE","GN","TD","CF","MG","HT"],
    origin: [48.9, 2.3],
    countries: ["FR","BE","CH","LU","MC","SN","ML","BF","NE","TD","CF","CG","CD","GA","CM","CI","GN","BJ","TG","MG","DZ","MA","TN","DJ","KM","MU","SC","HT","PF","NC"],
  },
  {
    id: "italian", name: "Italian", family: "Romance",
    color: "#2dd4bf", speakers: 65, nativeSpeakers: 65,
    gdpT: 2.2, internetUsersM: 50,
    marketNote: "Fashion, luxury goods, and design industry lingua franca",
    countries: ["IT","SM","VA","CH"],
  },
  {
    id: "portuguese", name: "Portuguese", family: "Romance",
    color: "#84cc16", speakers: 250, nativeSpeakers: 235,
    gdpT: 2.5, internetUsersM: 260,
    marketNote: "Brazil alone is a top-10 global economy and fastest-growing internet market",
    countries: ["BR","PT","AO","MZ","GW","CV","ST","TL"],
  },
  // ── Slavic ──
  {
    id: "russian", name: "Russian", family: "Slavic",
    color: "#06b6d4", speakers: 260, nativeSpeakers: 150,
    gdpT: 2.2, internetUsersM: 100,
    marketNote: "Dominant across post-Soviet space; large tech community",
    primaryCountries: ["RU","BY","KZ"],
    origin: [55.7, 37.6],
    countries: ["RU","BY","KZ","KG","TJ","UZ","TM","MD","UA","GE","AM","AZ"],
  },
  // ── Indo-Iranian ──
  {
    id: "hindi", name: "Hindi", family: "Indo-Iranian",
    color: "#f97316", speakers: 600, nativeSpeakers: 600,
    gdpT: 3.7, internetUsersM: 600,
    marketNote: "World's fastest-growing major economy; 700M+ internet users by 2025",
    countries: ["IN","NP","FJ"],
  },
  {
    id: "bengali", name: "Bengali", family: "Indo-Iranian",
    color: "#fb923c", speakers: 230, nativeSpeakers: 230,
    gdpT: 0.5, internetUsersM: 55,
    marketNote: "Bangladesh: top garment exporter; rapidly expanding middle class",
    primaryCountries: ["BD"],
    countries: ["BD","IN"],
  },
  {
    id: "persian", name: "Persian / Farsi", family: "Indo-Iranian",
    color: "#7c3aed", speakers: 110, nativeSpeakers: 70,
    gdpT: 0.5, internetUsersM: 60,
    marketNote: "Large educated diaspora; significant tech talent pool",
    countries: ["IR","AF","TJ"],
  },
  // ── Semitic ──
  {
    id: "arabic", name: "Arabic", family: "Semitic",
    color: "#10b981", speakers: 420, nativeSpeakers: 310,
    gdpT: 4.0, internetUsersM: 220,
    marketNote: "Gulf states among highest GDP per capita; major media market",
    countries: ["EG","SA","IQ","DZ","MA","YE","SY","TN","JO","LY","LB","AE","PS","OM","KW","QA","BH","MR","SO","SD","KM","DJ","ER"],
  },
  {
    id: "hebrew", name: "Hebrew", family: "Semitic",
    color: "#c084fc", speakers: 9, nativeSpeakers: 9,
    gdpT: 0.53, internetUsersM: 7,
    marketNote: "Startup Nation: highest VC per capita globally; deep tech ecosystem",
    countries: ["IL"],
  },
  // ── Sino-Tibetan ──
  {
    id: "mandarin", name: "Mandarin Chinese", family: "Sino-Tibetan",
    color: "#ef4444", speakers: 920, nativeSpeakers: 920,
    gdpT: 18.5, internetUsersM: 1050,
    marketNote: "World's largest e-commerce market; 1B+ active internet users",
    countries: ["CN","TW","SG"],
  },
  // ── Turkic ──
  {
    id: "turkish", name: "Turkish", family: "Turkic",
    color: "#e11d48", speakers: 88, nativeSpeakers: 84,
    gdpT: 1.1, internetUsersM: 60,
    marketNote: "Bridge between Europe and Middle East; major textile and tourism economy",
    primaryCountries: ["TR"],
    countries: ["TR","CY","AZ"],
  },
  // ── Japonic ──
  {
    id: "japanese", name: "Japanese", family: "Japonic",
    color: "#f472b6", speakers: 125, nativeSpeakers: 125,
    gdpT: 4.2, internetUsersM: 100,
    marketNote: "World's 3rd largest economy; premium consumer market",
    countries: ["JP"],
  },
  // ── Austronesian ──
  {
    id: "malay", name: "Malay / Indonesian", family: "Austronesian",
    color: "#a78bfa", speakers: 290, nativeSpeakers: 260,
    gdpT: 1.9, internetUsersM: 200,
    marketNote: "Indonesia: largest Southeast Asian economy; 270M+ people",
    primaryCountries: ["ID","MY","BN"],
    countries: ["ID","MY","BN","SG","TL"],
  },
  // ── Bantu ──
  {
    id: "swahili", name: "Swahili", family: "Bantu",
    color: "#34d399", speakers: 200, nativeSpeakers: 16,
    gdpT: 0.3, internetUsersM: 60,
    marketNote: "Africa's fastest-growing digital market; key for East African trade corridor",
    primaryCountries: ["TZ","KE","UG"],
    countries: ["TZ","KE","UG","RW","BI","CD","MZ","MW","ZM","SO","KM"],
  },
];

// Language family ordering
export const languageFamilies = [
  "Germanic","Romance","Slavic","Indo-Iranian",
  "Semitic","Sino-Tibetan","Turkic","Japonic","Austronesian","Bantu",
];
