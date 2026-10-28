import { NEUTRALS, SEASONS, type Category, type Item, type Wear } from '../shared/types';

// An outfit here means its core pieces: (top + bottom, or a dress) + shoes.
export type Outfit = Item[];

// ---- Rules: each one answers "does this outfit work?" ----

type Rule = (outfit: Outfit) => boolean;

const formalityIsClose: Rule = (outfit) => {
  const levels = outfit.map((item) => item.formality);
  return Math.max(...levels) - Math.min(...levels) <= 1;
};

const atMostOnePattern: Rule = (outfit) => outfit.filter((item) => item.pattern !== 'solid').length <= 1;

const atMostOneNonNeutralColor: Rule = (outfit) => {
  const colors = outfit.flatMap((item) => item.colors).filter((color) => !NEUTRALS.includes(color));
  return new Set(colors).size <= 1;
};

// An item with no seasons listed suits any season.
const sharesASeason: Rule = (outfit) =>
  SEASONS.some((season) => outfit.every((item) => item.seasons.length === 0 || item.seasons.includes(season)));

const rules: Rule[] = [formalityIsClose, atMostOnePattern, atMostOneNonNeutralColor, sharesASeason];

// ---- Combinations ----

export function validOutfits(items: Item[]): Outfit[] {
  const of = (category: Category) => items.filter((item) => item.category === category);

  const tops = of('top').flatMap((top) => of('bottom').map((bottom) => [top, bottom]));
  const dresses = of('dress').map((dress) => [dress]);
  const bases = [...tops, ...dresses];

  return bases
    .flatMap((base) => of('shoes').map((shoes) => [...base, shoes]))
    .filter((outfit) => rules.every((rule) => rule(outfit)));
}

// A wear covers an outfit if every core piece was worn that day (extra pieces like a jacket don't matter).
const wasWorn = (outfit: Outfit, wears: Wear[]) =>
  wears.some((wear) => outfit.every((item) => wear.itemIds.includes(item.id)));

export const unwornOutfits = (items: Item[], wears: Wear[]) =>
  validOutfits(items).filter((outfit) => !wasWorn(outfit, wears));

// How many valid outfits each core item appears in. Zero means it goes with nothing.
export function pairingCounts(items: Item[]) {
  const outfits = validOutfits(items);
  return items
    .filter((item) => ['top', 'bottom', 'dress', 'shoes'].includes(item.category))
    .map((item) => ({ item, count: outfits.filter((outfit) => outfit.includes(item)).length }))
    .sort((a, b) => a.count - b.count);
}

// ---- Wear history ----

const daysBetween = (later: string, earlier: string) => Math.round((Date.parse(later) - Date.parse(earlier)) / 86_400_000);

export const REPEAT_WINDOW_DAYS = 14;
export const FATIGUE_WEARS = 3; // worn this many times inside the window = item fatigue

export function itemUsage(items: Item[], wears: Wear[], today: string) {
  return items.map((item) => {
    const dates = wears.filter((wear) => wear.itemIds.includes(item.id)).map((wear) => wear.date);
    const lastWorn = dates.sort().at(-1) ?? null;
    return {
      item,
      wears: dates.length,
      lastWorn,
      daysSince: lastWorn ? daysBetween(today, lastWorn) : null,
      recentWears: dates.filter((date) => daysBetween(today, date) <= REPEAT_WINDOW_DAYS).length,
    };
  });
}

// Days where the exact same set of items was worn again within the window.
export function outfitRepeats(wears: Wear[]) {
  const key = (wear: Wear) => [...wear.itemIds].sort().join(',');
  return wears.flatMap((wear) => {
    const earlier = wears.find(
      (other) => other.date < wear.date && key(other) === key(wear) && daysBetween(wear.date, other.date) <= REPEAT_WINDOW_DAYS,
    );
    return earlier ? [{ date: wear.date, repeatOf: earlier.date }] : [];
  });
}

// ---- Suggestion ----

// Prefer never-worn combos built from pieces that have rested the longest; pick randomly among the best few.
export function suggestOutfit(items: Item[], wears: Wear[], today: string): Outfit | null {
  const candidates = unwornOutfits(items, wears);
  const pool = candidates.length > 0 ? candidates : validOutfits(items);
  if (pool.length === 0) return null;

  const rest = new Map(itemUsage(items, wears, today).map((u) => [u.item.id, u.daysSince ?? 365]));
  const score = (outfit: Outfit) => outfit.reduce((sum, item) => sum + (rest.get(item.id) ?? 0), 0);

  const best = [...pool].sort((a, b) => score(b) - score(a)).slice(0, 5);
  return best[Math.floor(Math.random() * best.length)];
}
