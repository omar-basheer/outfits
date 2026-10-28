import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Item, Wear } from './types';
import { lastWornTogether, outfitRepeats, pairingCounts, problems, suggestOutfit, unwornOutfits, validOutfits } from './pairings';

let nextId = 0;
const item = (overrides: Partial<Item>): Item => ({
  id: String(nextId++),
  photo: 'x.jpg',
  name: '',
  category: 'top',
  colors: ['white'],
  pattern: 'solid',
  formality: 2,
  seasons: [],
  ...overrides,
});

const whiteTee = item({ name: 'white tee' });
const redTee = item({ name: 'red tee', colors: ['red'] });
const stripedTee = item({ name: 'striped tee', pattern: 'striped' });
const jeans = item({ name: 'jeans', category: 'bottom', colors: ['denim'] });
const greenChinos = item({ name: 'green chinos', category: 'bottom', colors: ['green'] });
const suitTrousers = item({ name: 'suit trousers', category: 'bottom', colors: ['black'], formality: 5 });
const sneakers = item({ name: 'sneakers', category: 'shoes' });
const items = [whiteTee, redTee, stripedTee, jeans, greenChinos, suitTrousers, sneakers];

const names = (outfit: Item[]) => outfit.map((i) => i.name).join(' + ');
const outfitNames = (list: Item[][]) => list.map(names);

test('rejects clashing colours, mismatched formality, and double patterns', () => {
  const outfits = outfitNames(validOutfits(items));
  assert.ok(outfits.includes('white tee + jeans + sneakers'));
  assert.ok(outfits.includes('red tee + jeans + sneakers'), 'one bright colour with neutrals is fine');
  assert.ok(!outfits.includes('red tee + green chinos + sneakers'), 'two bright colours clash');
  assert.ok(!outfits.includes('white tee + suit trousers + sneakers'), 'formality gap too large');
});

test('allows a single pattern but not two', () => {
  const patternedJeans = item({ name: 'plaid jeans', category: 'bottom', pattern: 'checked' });
  const outfits = outfitNames(validOutfits([stripedTee, jeans, patternedJeans, sneakers]));
  assert.ok(outfits.includes('striped tee + jeans + sneakers'));
  assert.ok(!outfits.includes('striped tee + plaid jeans + sneakers'));
});

test('problems explains why an outfit does not work', () => {
  assert.deepEqual(problems([whiteTee, jeans, sneakers]), []);
  assert.deepEqual(problems([redTee, greenChinos, sneakers]), ['More than one non-neutral colour']);
  assert.deepEqual(problems([whiteTee, suitTrousers, sneakers]), ['Formality is too far apart']);
});

test('a dress plus shoes is an outfit', () => {
  const dress = item({ name: 'dress', category: 'dress' });
  assert.deepEqual(outfitNames(validOutfits([dress, sneakers])), ['dress + sneakers']);
});

test('unworn outfits excludes combinations already worn together', () => {
  const wear: Wear = { id: 'w1', date: '2026-10-01', itemIds: [whiteTee.id, jeans.id, sneakers.id] };
  const unworn = outfitNames(unwornOutfits(items, [wear]));
  assert.ok(!unworn.includes('white tee + jeans + sneakers'));
  assert.ok(unworn.includes('red tee + jeans + sneakers'));
});

test('lastWornTogether finds the latest date, and ignores extra pieces', () => {
  const jacket = item({ category: 'outerwear' });
  const wears: Wear[] = [
    { id: 'a', date: '2026-10-01', itemIds: [whiteTee.id, jeans.id, sneakers.id] },
    { id: 'b', date: '2026-10-09', itemIds: [whiteTee.id, jeans.id, sneakers.id, jacket.id] },
  ];
  assert.equal(lastWornTogether([whiteTee, jeans, sneakers], wears), '2026-10-09');
  assert.equal(lastWornTogether([redTee, jeans, sneakers], wears), undefined);
});

test('pairingCounts lists items that go with nothing first', () => {
  const orphan = item({ name: 'suit shirt', formality: 5 });
  const counts = pairingCounts([whiteTee, jeans, sneakers, orphan]);
  assert.equal(counts[0].item.name, 'suit shirt');
  assert.equal(counts[0].count, 0);
});

test('outfitRepeats flags the same items worn again within two weeks only', () => {
  const ids = [whiteTee.id, jeans.id, sneakers.id];
  const wears: Wear[] = [
    { id: 'a', date: '2026-10-01', itemIds: ids },
    { id: 'b', date: '2026-10-08', itemIds: ids },
    { id: 'c', date: '2026-11-20', itemIds: ids },
  ];
  assert.deepEqual(outfitRepeats(wears), [{ date: '2026-10-08', repeatOf: '2026-10-01' }]);
});

test('suggestOutfit returns a valid outfit, or null when none exist', () => {
  const suggestion = suggestOutfit(items, [], '2026-10-28');
  assert.ok(suggestion && validOutfits(items).some((o) => names(o) === names(suggestion)));
  assert.equal(suggestOutfit([whiteTee], [], '2026-10-28'), null);
});
