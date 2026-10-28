// Types and vocabularies shared by the server and the UI.

export const CATEGORIES = ['top', 'bottom', 'dress', 'outerwear', 'shoes', 'accessory'] as const;
export const COLORS = [
  'black', 'white', 'grey', 'beige', 'navy', 'brown', 'denim',
  'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'multi',
] as const;
export const PATTERNS = ['solid', 'striped', 'checked', 'graphic', 'floral', 'other'] as const;
export const SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const;

export type Category = (typeof CATEGORIES)[number];
export type Color = (typeof COLORS)[number];
export type Pattern = (typeof PATTERNS)[number];
export type Season = (typeof SEASONS)[number];

// Colours that go with anything; everything else counts as a "colour" in the pairing rules.
export const NEUTRALS: Color[] = ['black', 'white', 'grey', 'beige', 'navy', 'brown', 'denim'];

export interface Tags {
  name: string;
  category: Category;
  colors: Color[];
  pattern: Pattern;
  formality: number; // 1 = loungewear, 5 = formal
  seasons: Season[]; // empty means all seasons
}

export interface Item extends Tags {
  id: string;
  photo: string; // file name, served from /photos
}

export interface Wear {
  id: string;
  date: string; // YYYY-MM-DD
  itemIds: string[];
}

// What GET /api/insights returns.
export interface ItemUsage {
  item: Item;
  wears: number;
  lastWorn: string | null;
  daysSince: number | null;
  recentWears: number; // wears in the last two weeks
}

export interface Insights {
  unwornCount: number;
  unwornSample: Item[][];
  pairingCounts: { item: Item; count: number }[];
  outfitRepeats: { date: string; repeatOf: string }[];
  fatigued: ItemUsage[];
  usage: ItemUsage[];
}
