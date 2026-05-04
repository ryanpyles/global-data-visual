// ISO Alpha-2 → Alpha-3 mapping for all countries in our datasets
export const iso2to3: Record<string, string> = {
  AF: "AFG", AL: "ALB", DZ: "DZA", AO: "AGO", AG: "ATG", AR: "ARG",
  AM: "ARM", AU: "AUS", AT: "AUT", AZ: "AZE", BS: "BHS", BH: "BHR",
  BD: "BGD", BB: "BRB", BY: "BLR", BE: "BEL", BZ: "BLZ", BJ: "BEN",
  BT: "BTN", BO: "BOL", BA: "BIH", BW: "BWA", BR: "BRA", BN: "BRN",
  BF: "BFA", BI: "BDI", KH: "KHM", CM: "CMR", CA: "CAN", CV: "CPV",
  CF: "CAF", TD: "TCD", CL: "CHL", CN: "CHN", CO: "COL", KM: "COM",
  CG: "COG", CD: "COD", CR: "CRI", CI: "CIV", HR: "HRV", CU: "CUB",
  CY: "CYP", CZ: "CZE", DK: "DNK", DJ: "DJI", DM: "DMA", DO: "DOM",
  EC: "ECU", EG: "EGY", SV: "SLV", GQ: "GNQ", ER: "ERI", EE: "EST",
  ET: "ETH", FJ: "FJI", FI: "FIN", FR: "FRA", GA: "GAB", GM: "GMB",
  GE: "GEO", DE: "DEU", GH: "GHA", GR: "GRC", GD: "GRD", GT: "GTM",
  GN: "GIN", GW: "GNB", GY: "GUY", HT: "HTI", HN: "HND", HU: "HUN",
  IN: "IND", ID: "IDN", IR: "IRN", IQ: "IRQ", IE: "IRL", IL: "ISR",
  IT: "ITA", JM: "JAM", JP: "JPN", JO: "JOR", KZ: "KAZ", KE: "KEN",
  KN: "KNA", KW: "KWT", KG: "KGZ", LA: "LAO", LV: "LVA", LB: "LBN",
  LS: "LSO", LR: "LBR", LY: "LBY", LI: "LIE", LT: "LTU", LU: "LUX",
  MG: "MDG", MW: "MWI", MY: "MYS", ML: "MLI", MT: "MLT", MR: "MRT",
  MU: "MUS", MX: "MEX", MD: "MDA", MC: "MCO", MN: "MNG", MA: "MAR",
  MZ: "MOZ", MM: "MMR", NA: "NAM", NP: "NPL", NL: "NLD", NZ: "NZL",
  NI: "NIC", NE: "NER", NG: "NGA", NO: "NOR", OM: "OMN", PK: "PAK",
  PS: "PSE", PA: "PAN", PG: "PNG", PY: "PRY", PE: "PER", PH: "PHL",
  PL: "POL", PT: "PRT", PR: "PRI", QA: "QAT", RO: "ROU", RU: "RUS",
  RW: "RWA", LC: "LCA", VC: "VCT", WS: "WSM", ST: "STP", SA: "SAU",
  SN: "SEN", RS: "SRB", SC: "SYC", SL: "SLE", SG: "SGP", SK: "SVK",
  SI: "SVN", SB: "SLB", SO: "SOM", ZA: "ZAF", SS: "SSD", ES: "ESP",
  LK: "LKA", SD: "SDN", SZ: "SWZ", SE: "SWE", CH: "CHE", SY: "SYR",
  TW: "TWN", TJ: "TJK", TZ: "TZA", TH: "THA", TL: "TLS", TG: "TGO",
  TO: "TON", TT: "TTO", TN: "TUN", TR: "TUR", TM: "TKM", UG: "UGA",
  UA: "UKR", AE: "ARE", GB: "GBR", US: "USA", UY: "URY", UZ: "UZB",
  VU: "VUT", VE: "VEN", VN: "VNM", YE: "YEM", ZM: "ZMB", ZW: "ZWE",
  MK: "MKD", PF: "PYF", NC: "NCL",
};

// Reverse: Alpha-3 → Alpha-2
export const iso3to2: Record<string, string> = Object.fromEntries(
  Object.entries(iso2to3).map(([a2, a3]) => [a3, a2])
);
