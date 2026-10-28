import { useState } from 'react';
import type { Category, Item, Wear } from '../shared/types';
import { lastWornTogether, problems, suggestOutfit } from '../shared/pairings';
import { api, photoUrl, todayString } from './api';

interface Props {
  items: Item[];
  wears: Wear[];
  start: Item[]; // the outfit to begin from (may be empty)
  date: string;
  replacing?: Wear; // set when changing today's already-logged outfit
  onDone: () => void;
  onCancel: () => void;
}

type Picked = Partial<Record<Category, Item>>;

const OPTIONAL: Category[] = ['outerwear', 'accessory'];

const toPicked = (outfit: Item[]): Picked => Object.fromEntries(outfit.map((item) => [item.category, item]));

export function OutfitBuilder({ items, wears, start, date: startDate, replacing, onDone, onCancel }: Props) {
  const [picked, setPicked] = useState<Picked>(toPicked(start));
  const [date, setDate] = useState(startDate);

  const coreSlots: Category[] = picked.dress ? ['dress', 'shoes'] : ['top', 'bottom', 'shoes'];
  const core = coreSlots.flatMap((slot) => picked[slot] ?? []);
  const complete = core.length === coreSlots.length;

  // Step to the next/previous item in a slot. Optional slots also cycle through "nothing".
  function step(slot: Category, direction: 1 | -1) {
    const options: (Item | undefined)[] = items.filter((item) => item.category === slot);
    if (OPTIONAL.includes(slot)) options.push(undefined);
    if (options.length === 0) return;
    const current = options.indexOf(picked[slot]);
    const next = options[(current + direction + options.length) % options.length];
    setPicked({ ...picked, [slot]: next });
  }

  function tryAnother() {
    const outfit = suggestOutfit(items, wears, todayString());
    if (outfit) setPicked({ ...toPicked(outfit), outerwear: picked.outerwear, accessory: picked.accessory });
  }

  async function log() {
    if (replacing) await api.deleteWear(replacing.id);
    await api.logWear(date, Object.values(picked).map((item) => item.id));
    onDone();
  }

  return (
    <section>
      <h1>{replacing ? "Change today's outfit" : 'Build your outfit'}</h1>
      <p className="hint">Tap the arrows to swap a piece.</p>

      {[...coreSlots, ...OPTIONAL].map((slot) => (
        <div key={slot} className="slot">
          <button className="arrow" aria-label={`Previous ${slot}`} onClick={() => step(slot, -1)}>‹</button>
          <div className="slot-item">
            {picked[slot] ? <img src={photoUrl(picked[slot])} alt={picked[slot].name} /> : <span className="hint">{OPTIONAL.includes(slot) ? `Add ${slot}` : `No ${slot} yet`}</span>}
            <span className="slot-label">{slot}</span>
          </div>
          <button className="arrow" aria-label={`Next ${slot}`} onClick={() => step(slot, 1)}>›</button>
        </div>
      ))}

      <Verdict core={core} complete={complete} wears={wears} coreSlots={coreSlots} />

      <label className="field">
        Date
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>

      <div className="actions">
        <button className="button secondary" onClick={tryAnother}>Try another</button>
        <button className="button" disabled={Object.keys(picked).length === 0} onClick={log}>
          Log outfit
        </button>
      </div>
      <button className="link" onClick={onCancel}>Cancel</button>
    </section>
  );
}

function Verdict({ core, complete, wears, coreSlots }: { core: Item[]; complete: boolean; wears: Wear[]; coreSlots: Category[] }) {
  if (!complete) return <p className="badge neutral">Pick a {coreSlots.join(', ')} to check this outfit.</p>;

  const issues = problems(core);
  if (issues.length > 0) return <p className="badge warn">{issues.join(' · ')}</p>;

  const last = lastWornTogether(core, wears);
  return <p className="badge good">Works · {last ? `worn together on ${last}` : 'never worn together'}</p>;
}
