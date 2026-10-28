import { useEffect, useState } from 'react';
import type { Insights as InsightsData } from '../shared/types';
import { api } from './api';
import { OutfitRow, Thumb } from './Thumb';

export function Insights() {
  const [data, setData] = useState<InsightsData | null>(null);
  const load = () => api.insights().then(setData);
  useEffect(() => void load(), []);

  if (!data) return <p className="hint">Loading…</p>;

  const neverWorn = data.usage.filter((u) => u.wears === 0);
  const longestRested = data.usage.filter((u) => u.wears > 0).sort((a, b) => b.daysSince! - a.daysSince!).slice(0, 8);

  return (
    <section>
      <h1>Insights</h1>

      <h2>Outfits you haven't tried</h2>
      <p>
        <strong>{data.unwornCount}</strong> combinations of your clothes pass the matching rules and have never been worn.
      </p>
      {data.unwornSample.map((outfit, index) => (
        <OutfitRow key={index} items={outfit} />
      ))}
      <button className="chip" onClick={load}>Show others</button>

      <h2>Repeating too much?</h2>
      {data.outfitRepeats.length === 0 && data.fatigued.length === 0 && <p className="hint">No repeats in the last two weeks.</p>}
      {data.outfitRepeats.map((repeat) => (
        <p key={repeat.date}>
          {repeat.date}: same outfit as {repeat.repeatOf}
        </p>
      ))}
      {data.fatigued.map(({ item, recentWears }) => (
        <div key={item.id} className="wear">
          <Thumb item={item} />
          <span>Worn {recentWears}× in the last two weeks</span>
        </div>
      ))}

      <h2>Fewest outfit options</h2>
      <p className="hint">Items that go with the least. Zero means it matches nothing you own.</p>
      {data.pairingCounts.slice(0, 8).map(({ item, count }) => (
        <div key={item.id} className="wear">
          <Thumb item={item} />
          <span>{count} outfits</span>
        </div>
      ))}

      <h2>Not worn yet · {neverWorn.length}</h2>
      <div className="strip">
        {neverWorn.map(({ item }) => (
          <Thumb key={item.id} item={item} />
        ))}
      </div>

      <h2>Longest since worn</h2>
      {longestRested.map(({ item, daysSince }) => (
        <div key={item.id} className="wear">
          <Thumb item={item} />
          <span>{daysSince} days ago</span>
        </div>
      ))}
    </section>
  );
}
