import { useEffect, useState } from 'react';
import type { Item, Wear } from '../shared/types';
import { lastWornTogether, suggestOutfit } from '../shared/pairings';
import { api, todayString } from './api';
import { OutfitBuilder } from './OutfitBuilder';
import { OutfitRow, OutfitStack } from './Thumb';

interface Draft {
  start: Item[];
  date: string;
  replacing?: Wear;
}

export function Today({ items }: { items: Item[] }) {
  const today = todayString();
  const [wears, setWears] = useState<Wear[] | null>(null);
  const [suggestion, setSuggestion] = useState<Item[] | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);

  const reloadWears = () => api.wears().then(setWears);
  useEffect(() => void reloadWears(), []);

  // Pick a suggestion once the closet and history are both loaded, and again after anything is logged.
  useEffect(() => {
    if (wears) setSuggestion(suggestOutfit(items, wears, today));
  }, [items, wears, today]);

  if (!wears) return <p className="hint">Loading…</p>;

  if (draft) {
    return (
      <OutfitBuilder
        items={items}
        wears={wears}
        {...draft}
        onCancel={() => setDraft(null)}
        onDone={async () => {
          setDraft(null);
          await reloadWears();
        }}
      />
    );
  }

  const byId = new Map(items.map((item) => [item.id, item]));
  const outfitOf = (wear: Wear) => wear.itemIds.flatMap((id) => byId.get(id) ?? []);
  const todaysWear = wears.find((wear) => wear.date === today);

  async function wearSuggestion() {
    await api.logWear(today, suggestion!.map((item) => item.id));
    await reloadWears();
  }

  return (
    <section>
      {todaysWear ? (
        <>
          <h1>You're wearing</h1>
          <div className="card">
            <OutfitStack items={outfitOf(todaysWear)} />
          </div>
          <div className="actions">
            <button className="button secondary" onClick={() => setDraft({ start: outfitOf(todaysWear), date: today, replacing: todaysWear })}>
              Change
            </button>
          </div>
        </>
      ) : suggestion ? (
        <>
          <h1>Wear this today</h1>
          <p className="hint">{lastWornTogether(suggestion, wears) ? 'Worn together before' : 'Never worn together'}</p>
          <div className="card">
            <OutfitStack items={suggestion} />
          </div>
          <div className="actions">
            <button className="button secondary" onClick={() => setDraft({ start: suggestion, date: today })}>Swap</button>
            <button className="button" onClick={wearSuggestion}>Wear this</button>
          </div>
        </>
      ) : (
        <>
          <h1>Wear this today</h1>
          <p className="hint">Add at least a top, a bottom and shoes in the Closet tab and your first outfit shows up here.</p>
        </>
      )}

      <button className="link" onClick={() => setDraft({ start: [], date: today })}>Log a different day</button>

      <h2>Recently worn</h2>
      {wears.slice(0, 5).map((wear) => (
        <div key={wear.id} className="wear">
          <div>
            <strong>{wear.date}</strong>
            <OutfitRow items={outfitOf(wear)} />
          </div>
          <button className="chip" onClick={() => api.deleteWear(wear.id).then(reloadWears)}>Remove</button>
        </div>
      ))}
      {wears.length === 0 && <p className="hint">Nothing logged yet.</p>}
    </section>
  );
}
