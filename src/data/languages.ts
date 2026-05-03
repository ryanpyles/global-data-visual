export interface LanguageGroup {
  id: string;
  name: string;
  color: string;
  countries: string[]; // ISO Alpha-2 codes
  speakers: number; // millions
}

export const languageGroups: LanguageGroup[] = [
  {
    id: "english",
    name: "English",
    color: "#3b82f6",
    speakers: 1500,
    countries: ["US","GB","CA","AU","NZ","IE","ZA","NG","GH","KE","UG","TZ","ZW","ZM","MW","BW","NA","SL","LR","GM","SZ","LS","RW","SS","SD","ET","CM","PH","IN","PK","BD","SG","MY","JM","TT","BB","GY","BZ","BS","AG","DM","GD","KN","LC","VC","MT","CY","FJ","PG","WS","TO","VU","SB"],
  },
  {
    id: "spanish",
    name: "Spanish",
    color: "#f59e0b",
    speakers: 500,
    countries: ["MX","ES","CO","AR","PE","VE","CL","EC","GT","CU","BO","DO","HN","PY","SV","NI","CR","PA","UY","GQ","PR"],
  },
  {
    id: "french",
    name: "French",
    color: "#8b5cf6",
    speakers: 300,
    countries: ["FR","BE","CH","LU","MC","SN","ML","BF","NE","TD","CF","CG","CD","GA","CM","CI","GN","BJ","TG","MG","DZ","MA","TN","DJ","KM","MU","SC","HT","PF","NC"],
  },
  {
    id: "arabic",
    name: "Arabic",
    color: "#10b981",
    speakers: 420,
    countries: ["EG","SA","IQ","DZ","MA","YE","SY","TN","JO","LY","LB","AE","PS","OM","KW","QA","BH","MR","SO","SD","KM","DJ","ER"],
  },
  {
    id: "mandarin",
    name: "Mandarin Chinese",
    color: "#ef4444",
    speakers: 920,
    countries: ["CN","TW","SG"],
  },
  {
    id: "hindi",
    name: "Hindi",
    color: "#f97316",
    speakers: 600,
    countries: ["IN","NP","FJ"],
  },
  {
    id: "russian",
    name: "Russian",
    color: "#06b6d4",
    speakers: 260,
    countries: ["RU","BY","KZ","KG","TJ","UZ","TM","MD","UA","GE","AM","AZ"],
  },
  {
    id: "portuguese",
    name: "Portuguese",
    color: "#84cc16",
    speakers: 250,
    countries: ["BR","PT","AO","MZ","GW","CV","ST","TL"],
  },
  {
    id: "german",
    name: "German",
    color: "#fbbf24",
    speakers: 100,
    countries: ["DE","AT","CH","LI","LU","BE"],
  },
  {
    id: "japanese",
    name: "Japanese",
    color: "#f472b6",
    speakers: 125,
    countries: ["JP"],
  },
  {
    id: "swahili",
    name: "Swahili",
    color: "#34d399",
    speakers: 200,
    countries: ["TZ","KE","UG","RW","BI","CD","MZ","MW","ZM","SO","KM"],
  },
  {
    id: "bengali",
    name: "Bengali",
    color: "#fb923c",
    speakers: 230,
    countries: ["BD","IN"],
  },
  {
    id: "malay",
    name: "Malay/Indonesian",
    color: "#a78bfa",
    speakers: 290,
    countries: ["ID","MY","BN","SG","TL"],
  },
  {
    id: "turkish",
    name: "Turkish",
    color: "#e11d48",
    speakers: 88,
    countries: ["TR","CY","AZ"],
  },
  {
    id: "persian",
    name: "Persian/Farsi",
    color: "#7c3aed",
    speakers: 110,
    countries: ["IR","AF","TJ"],
  },
];
