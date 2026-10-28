import { useEffect, useState } from 'react';
import type { Item } from '../shared/types';
import { api } from './api';
import { Closet } from './Closet';
import { Insights } from './Insights';
import { Today } from './Today';

const TABS = ['Today', 'Closet', 'Insights'] as const;
type Tab = (typeof TABS)[number];

export function App() {
  const [tab, setTab] = useState<Tab>('Today');
  const [items, setItems] = useState<Item[]>([]);

  const reloadItems = () => api.items().then(setItems);
  useEffect(() => void reloadItems(), []);

  return (
    <>
      <main>
        {tab === 'Today' && <Today items={items} />}
        {tab === 'Closet' && <Closet items={items} onChange={reloadItems} />}
        {tab === 'Insights' && <Insights />}
      </main>
      <nav>
        {TABS.map((name) => (
          <button key={name} className={name === tab ? 'active' : ''} onClick={() => setTab(name)}>
            {name}
          </button>
        ))}
      </nav>
    </>
  );
}
