const CIVILISATION_LABELS: Record<string, string> = {
  abbasid_dynasty: "Abbasid Dynasty",
  ayyubids: "Ayyubids",
  byzantines: "Byzantines",
  chinese: "Chinese",
  delhi_sultanate: "Delhi Sultanate",
  english: "English",
  french: "French",
  golden_horde: "Golden Horde",
  holy_roman_empire: "Holy Roman Empire",
  house_of_lancaster: "House of Lancaster",
  japanese: "Japanese",
  jeanne_darc: "Jeanne d’Arc",
  knights_templar: "Knights Templar",
  malians: "Malians",
  macedonian_dynasty: "Macedonian Dynasty",
  mongols: "Mongols",
  order_of_the_dragon: "Order of the Dragon",
  ottomans: "Ottomans",
  rus: "Rus",
  sengoku_daimyo: "Sengoku Daimyo",
  tughlaq_dynasty: "Tughlaq Dynasty",
  zhu_xis_legacy: "Zhu Xi’s Legacy",
};

export function formatCivilisationName(value: string): string {
  const known = CIVILISATION_LABELS[value];

  if (known) {
    return known;
  }

  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
