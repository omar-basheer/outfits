import { CATEGORIES, COLORS, PATTERNS, SEASONS, type Tags } from '../shared/types';

export const DEFAULT_TAGS: Tags = {
  name: '',
  category: 'top',
  colors: [],
  pattern: 'solid',
  formality: 2,
  seasons: [],
};

const oneOf = <T extends string>(allowed: readonly T[], value: unknown): value is T =>
  allowed.includes(value as T);

// Input from the model or the edit form is untrusted: keep only valid fields.
export function cleanTags(raw: Record<string, unknown>): Partial<Tags> {
  const tags: Partial<Tags> = {};
  if (typeof raw.name === 'string') tags.name = raw.name.slice(0, 80);
  if (oneOf(CATEGORIES, raw.category)) tags.category = raw.category;
  if (Array.isArray(raw.colors)) tags.colors = raw.colors.filter((c) => oneOf(COLORS, c)).slice(0, 2);
  if (oneOf(PATTERNS, raw.pattern)) tags.pattern = raw.pattern;
  if (Number.isInteger(raw.formality)) tags.formality = Math.min(5, Math.max(1, raw.formality as number));
  if (Array.isArray(raw.seasons)) tags.seasons = raw.seasons.filter((s) => oneOf(SEASONS, s));
  return tags;
}
