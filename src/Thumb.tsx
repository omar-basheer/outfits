import type { Item } from '../shared/types';
import { photoUrl } from './api';

interface Props {
  item: Item;
  selected?: boolean;
  onClick?: () => void;
}

export function Thumb({ item, selected, onClick }: Props) {
  return (
    <button className={`thumb ${selected ? 'selected' : ''}`} onClick={onClick} disabled={!onClick}>
      <img src={photoUrl(item)} alt={item.name || item.category} loading="lazy" />
    </button>
  );
}

export function OutfitRow({ items }: { items: Item[] }) {
  return (
    <div className="outfit-row">
      {items.map((item) => (
        <Thumb key={item.id} item={item} />
      ))}
    </div>
  );
}
