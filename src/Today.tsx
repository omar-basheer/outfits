import { useEffect, useState } from 'react';
import { CATEGORIES, type Item, type Wear } from '../shared/types';
import { api, todayString } from './api';
import { OutfitRow, Thumb } from './Thumb';

export function Today({ items }: { items: Item[] }) {
  const [date, setDate] = useState(todayString());
  const [chosen, setChosen] = useState<string[]>([]);
  const [wears, setWears] = useState<Wear[]>([]);

  const reloadWears = () => api.wears().then(setWears);
  useEffect(() => void reloadWears(), []);

  const toggle = (id: string) => setChosen((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  async function suggest() {
    const outfit = await api.suggestion();
    if (!outfit) return alert('No valid outfits yet. Add tops, bottoms and shoes first.');
    setChosen(outfit.map((item) => item.id));
  }

  async function logWear() {
    await api.logWear(date, chosen);
    setChosen([]);
    await reloadWears();
  }

  const byId = new Map(items.map((item) => [item.id, item]));

  return (
    <section>
      <h1>What are you wearing?</h1>

      <div className="actions">
        <button className="button secondary" onClick={suggest}>Suggest an outfit</button>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      {CATEGORIES.map((category) => {
        const inCategory = items.filter((item) => item.category === category);
        if (inCategory.length === 0) return null;
        return (
          <div key={category}>
            <h2>{category}</h2>
            <div className="strip">
              {inCategory.map((item) => (
                <Thumb key={item.id} item={item} selected={chosen.includes(item.id)} onClick={() => toggle(item.id)} />
              ))}
            </div>
          </div>
        );
      })}

      <button className="button wide" disabled={chosen.length === 0} onClick={logWear}>
        Log outfit for {date === todayString() ? 'today' : date}
      </button>

      <h2>Recently worn</h2>
      {wears.slice(0, 14).map((wear) => (
        <div key={wear.id} className="wear">
          <div>
            <strong>{wear.date}</strong>
            <OutfitRow items={wear.itemIds.flatMap((id) => byId.get(id) ?? [])} />
          </div>
          <button className="chip" onClick={() => api.deleteWear(wear.id).then(reloadWears)}>Remove</button>
        </div>
      ))}
      {wears.length === 0 && <p className="hint">Nothing logged yet.</p>}
    </section>
  );
}
