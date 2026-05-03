export interface StatelessGroup {
  id: string;
  name: string;
  color: string;
  population: number; // thousands
  description: string;
  countries: string[]; // countries where they primarily reside
}

export const statelessGroups: StatelessGroup[] = [
  {
    id: "rohingya",
    name: "Rohingya",
    color: "#ef4444",
    population: 3500,
    description: "Predominantly Muslim ethnic group from Myanmar's Rakhine State. Denied citizenship since 1982, fleeing to Bangladesh, Malaysia, Indonesia, and beyond.",
    countries: ["MM", "BD", "MY", "ID", "TH", "IN", "SA", "PK"],
  },
  {
    id: "palestinians",
    name: "Palestinian Stateless",
    color: "#3b82f6",
    population: 5900,
    description: "Palestinians lacking full citizenship, spread across refugee camps in Jordan, Lebanon, Syria, and the occupied territories.",
    countries: ["PS", "JO", "LB", "SY", "EG", "SA", "KW", "AE"],
  },
  {
    id: "kurds",
    name: "Kurds (Stateless Nation)",
    color: "#f59e0b",
    population: 40000,
    description: "Largest stateless ethnic group in the world, spread across Turkey, Iran, Iraq, and Syria without their own recognized state.",
    countries: ["TR", "IR", "IQ", "SY", "DE", "SE", "NL"],
  },
  {
    id: "bedoon",
    name: "Bedoon",
    color: "#10b981",
    population: 100,
    description: "Stateless Arabs in the Gulf states — primarily Kuwait and the UAE — who are not recognized as citizens despite long residence.",
    countries: ["KW", "AE", "SA", "QA", "BH"],
  },
  {
    id: "stateless_baltics",
    name: "Stateless Baltics (Non-Citizens)",
    color: "#8b5cf6",
    population: 280,
    description: "Primarily ethnic Russians in Latvia and Estonia who were not granted citizenship after independence from the USSR and remain stateless.",
    countries: ["LV", "EE"],
  },
  {
    id: "dom",
    name: "Dom People",
    color: "#f97316",
    population: 1000,
    description: "An itinerant people of South Asian origin living across the Middle East and North Africa, related to the Romani, often stateless and marginalized.",
    countries: ["SY", "IQ", "EG", "JO", "LB", "YE", "IR"],
  },
  {
    id: "bihari",
    name: "Stranded Pakistanis (Bihari)",
    color: "#06b6d4",
    population: 300,
    description: "Urdu-speaking Muslims who sided with Pakistan during the 1971 Bangladesh Liberation War and remain stranded in Bangladesh without full citizenship.",
    countries: ["BD"],
  },
  {
    id: "haitian_dominican",
    name: "Haitian-Dominicans",
    color: "#84cc16",
    population: 200,
    description: "Dominicans of Haitian descent stripped of citizenship by a 2013 Dominican Republic court ruling, rendering tens of thousands stateless.",
    countries: ["DO", "HT"],
  },
  {
    id: "faili_kurds",
    name: "Faili Kurds",
    color: "#fbbf24",
    population: 300,
    description: "Shia Kurds stripped of Iraqi citizenship under Saddam Hussein, many expelled to Iran and left stateless.",
    countries: ["IQ", "IR"],
  },
  {
    id: "kenya_nubians",
    name: "Kenyan Nubians",
    color: "#34d399",
    population: 100,
    description: "Descendants of Sudanese soldiers brought to Kenya under British colonial rule; denied citizenship for generations.",
    countries: ["KE"],
  },
  {
    id: "lhotshampa",
    name: "Lhotshampa",
    color: "#a78bfa",
    population: 110,
    description: "Nepali-speaking Bhutanese expelled in the early 1990s; most live in UN refugee camps in Nepal, with large numbers resettled in the US and elsewhere.",
    countries: ["NP", "BT", "IN", "US", "CA", "AU"],
  },
  {
    id: "stateless_myanmar",
    name: "Other Myanmar Minorities",
    color: "#fb923c",
    population: 800,
    description: "Various ethnic minorities in Myanmar — including Karen, Chin, Kachin, and others — who face denial of citizenship and forced displacement.",
    countries: ["MM", "TH", "IN", "CN"],
  },
];
