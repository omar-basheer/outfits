import type { Category, Item } from '../shared/types';
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

const STACK_ORDER: Category[] = ['outerwear', 'top', 'dress', 'bottom', 'shoes', 'accessory'];

// An outfit laid out top to bottom, like it would look worn.
export function OutfitStack({ items }: { items: Item[] }) {
  const ordered = [...items].sort((a, b) => STACK_ORDER.indexOf(a.category) - STACK_ORDER.indexOf(b.category));
  return (
    <div className="stack">
      {ordered.map((item) => (
        <img key={item.id} className={item.category} src={photoUrl(item)} alt={item.name || item.category} />
      ))}
    </div>
  );
}
