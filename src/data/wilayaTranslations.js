// English/French name pairs for Algerian wilayas and cities.
// Only names that differ in English vs French are listed here. Any name not
// found in the map is assumed to be identical in both languages, so the
// display helper returns a single label instead of duplicating it.
//
// Used by the checkout page so buyers see wilaya/city names in both languages
// (e.g. "Algiers / Alger", "Constantine / Constantine").

const WILAYA_EN_FR = {
  // Wilayas with distinct English spellings
  'Alger': { en: 'Algiers', fr: 'Alger' },
  'Béjaïa': { en: 'Bejaia', fr: 'Béjaïa' },
  'Bejaia': { en: 'Bejaia', fr: 'Béjaïa' },
  'Sétif': { en: 'Setif', fr: 'Sétif' },
  'Setif': { en: 'Setif', fr: 'Sétif' },
  'Tébessa': { en: 'Tebessa', fr: 'Tébessa' },
  'Tebessa': { en: 'Tebessa', fr: 'Tébessa' },
  'Saïda': { en: 'Saida', fr: 'Saïda' },
  'Saida': { en: 'Saida', fr: 'Saïda' },
  'Médéa': { en: 'Medea', fr: 'Médéa' },
  'Medea': { en: 'Medea', fr: 'Médéa' },
  'El Taref': { en: 'El Tarf', fr: 'El Taref' },
  'El Tarf': { en: 'El Tarf', fr: 'El Taref' },
  'Bordj Bou Arréridj': { en: 'Bordj Bou Arreridj', fr: 'Bordj Bou Arréridj' },
  'Bordj Bou Arreridj': { en: 'Bordj Bou Arreridj', fr: 'Bordj Bou Arréridj' },
  'Aïn Defla': { en: 'Ain Defla', fr: 'Aïn Defla' },
  'Ain Defla': { en: 'Ain Defla', fr: 'Aïn Defla' },
  'Aïn Témouchent': { en: 'Ain Temouchent', fr: 'Aïn Témouchent' },
  'Ain Temouchent': { en: 'Ain Temouchent', fr: 'Aïn Témouchent' },
  'M\'Sila': { en: "M'Sila", fr: "M'Sila" },
  'El Méniaa': { en: 'El Meniaa', fr: 'El Méniaa' },
  'El Meniaa': { en: 'El Meniaa', fr: 'El Méniaa' },
  'El M\'Ghair': { en: "El M'Ghair", fr: "El M'Ghair" },

  // Common city spellings that differ
  'Alger Centre': { en: 'Algiers Center', fr: 'Alger Centre' },
  'Ténès': { en: 'Tenes', fr: 'Ténès' },
  'Tenes': { en: 'Tenes', fr: 'Ténès' },
  'Hassi R\'Mel': { en: "Hassi R'Mel", fr: "Hassi R'Mel" },
  'N\'Gaous': { en: "N'Gaous", fr: "N'Gaous" },
  'Chréa': { en: 'Chrea', fr: 'Chréa' },
  'Chrea': { en: 'Chrea', fr: 'Chréa' },
  'M\'Chedallah': { en: "M'Chedallah", fr: "M'Chedallah" },
  'Séraïdi': { en: 'Seraidi', fr: 'Séraïdi' },
  'Seraidi': { en: 'Seraidi', fr: 'Séraïdi' },
};

// Returns { en, fr } for the given wilaya/city name. Falls back to the same
// value for both languages when no explicit translation is registered.
export function getEnFr(name) {
  if (!name) return { en: '', fr: '' };
  const hit = WILAYA_EN_FR[name];
  if (hit) return hit;
  return { en: name, fr: name };
}

// Build a display label. If the English and French names match the label is
// rendered once; otherwise both are joined with " / ".
export function bilingualLabel(name) {
  const { en, fr } = getEnFr(name);
  if (!en && !fr) return name || '';
  if (en === fr) return en;
  return `${en} / ${fr}`;
}

export default WILAYA_EN_FR;
