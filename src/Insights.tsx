import { useEffect, useState } from 'react';
import type { Insights as InsightsData } from '../shared/types';
import { api } from './api';
import { OutfitRow, Thumb } from './Thumb';

type Section = 'untried' | 'repeats' | 'overworn' | 'orphans';

export function Insights() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [open, setOpen] = useState<Section | null>(null);

  const load = () => api.insights().then(setData);
  useEffect(() => void load(), []);

  if (!data) return <p className="hint">Loading…</p>;

  const orphans = data.pairingCounts.filter(({ count }) => count === 0);
  const neverWorn = data.usage.filter((u) => u.wears === 0);

  const cards: { key: Section; value: number; label: string; accent?: boolean }[] = [
    { key: 'untried', value: data.unwornCount, label: 'outfits you haven\'t tried' },
    { key: 'repeats', value: data.outfitRepeats.length, label: 'repeats in two weeks' },
    { key: 'overworn', value: data.fatigued.length, label: 'items worn 3+ times in two weeks' },
    { key: 'orphans', value: orphans.length, label: 'items that match nothing', accent: true },
  ];

  const toggle = (key: Section) => setOpen(open === key ? null : key);

  return (
    <section>
      <h1>Insights</h1>

      <div className="cards">
        {cards.map(({ key, value, label, accent }) => (
          <button key={key} className={`card metric ${accent ? 'accent' : ''} ${open === key ? 'open' : ''}`} onClick={() => toggle(key)}>
            <span className="big">{value}</span>
            <span className="small">{label}</span>
          </button>
        ))}
      </div>

      {open === 'untried' && (
        <div className="detail">
          <h2>Try one of these</h2>
          {data.unwornSample.map((outfit, index) => (
            <OutfitRow key={index} items={outfit} />
          ))}
          <button className="chip" onClick={load}>Show others</button>
        </div>
      )}

      {open === 'repeats' && (
        <div className="detail">
          <h2>Repeated outfits</h2>
          {data.outfitRepeats.length === 0 && <p className="hint">No repeats in the last two weeks.</p>}
          {data.outfitRepeats.map((repeat) => (
            <p key={repeat.date}>{repeat.date} was the same as {repeat.repeatOf}</p>
          ))}
        </div>
      )}

      {open === 'overworn' && (
        <div className="detail">
          <h2>Worn a lot lately</h2>
          {data.fatigued.length === 0 && <p className="hint">Nothing is being worn to death.</p>}
          {data.fatigued.map(({ item, recentWears }) => (
            <div key={item.id} className="wear">
              <Thumb item={item} />
              <span>{recentWears} times in the last two weeks</span>
            </div>
          ))}
        </div>
      )}

      {open === 'orphans' && (
        <div className="detail">
          <h2>Fewest outfit options</h2>
          <p className="hint">Zero means it matches nothing you own.</p>
          {data.pairingCounts.slice(0, 6).map(({ item, count }) => (
            <div key={item.id} className="wear">
              <Thumb item={item} />
              <span>{count} {count === 1 ? 'outfit' : 'outfits'}</span>
            </div>
          ))}
          {neverWorn.length > 0 && (
            <>
              <h2>Not worn yet</h2>
              <div className="rail">
                {neverWorn.map(({ item }) => (
                  <Thumb key={item.id} item={item} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {data.unwornSample[0] && (
        <>
          <h2>Try next</h2>
          <div className="card">
            <OutfitRow items={data.unwornSample[0]} />
          </div>
        </>
      )}
    </section>
  );
}
