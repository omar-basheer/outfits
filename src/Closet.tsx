import { useState } from 'react';
import { CATEGORIES, COLORS, PATTERNS, SEASONS, type Category, type Item, type Tags } from '../shared/types';
import { api, photoUrl, shrinkPhoto } from './api';
import { Thumb } from './Thumb';

interface Props {
  items: Item[];
  onChange: () => Promise<unknown>;
}

export function Closet({ items, onChange }: Props) {
  const [editing, setEditing] = useState<Item | null>(null);
  const [progress, setProgress] = useState('');

  async function addPhotos(files: FileList | null) {
    if (!files) return;
    const list = [...files];
    const failures: string[] = [];
    for (const [index, file] of list.entries()) {
      setProgress(`Adding ${index + 1} of ${list.length}…`);
      try {
        await api.addItem(await shrinkPhoto(file));
      } catch (error) {
        failures.push(`${file.name} (${file.type || 'unknown type'}): ${error instanceof Error ? error.message : error}`);
      }
    }
    setProgress(failures.length > 0 ? `Could not add: ${failures.join('; ')}` : '');
    await onChange();
  }

  return (
    <section>
      <h1>Closet · {items.length}</h1>

      <div className="actions">
        <label className="button">
          Take photo
          <input type="file" accept="image/*" capture="environment" hidden onChange={(e) => addPhotos(e.target.files)} />
        </label>
        <label className="button secondary">
          Choose photos
          <input type="file" accept="image/*" multiple hidden onChange={(e) => addPhotos(e.target.files)} />
        </label>
      </div>
      {progress && <p className="hint">{progress}</p>}

      {items.length === 0 && <p className="hint">Start your closet. Photograph a few tops, bottoms and shoes.</p>}

      {CATEGORIES.map((category) => {
        const inCategory = items.filter((item) => item.category === category);
        if (inCategory.length === 0) return null;
        return (
          <div key={category}>
            <h2 className="category">
              {category} <span className="hint">{inCategory.length}</span>
            </h2>
            <div className="rail">
              {inCategory.map((item) => (
                <Thumb key={item.id} item={item} onClick={() => setEditing(item)} />
              ))}
            </div>
          </div>
        );
      })}

      {editing && (
        <ItemEditor
          item={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await onChange();
          }}
        />
      )}
    </section>
  );
}

interface EditorProps {
  item: Item;
  onClose: () => void;
  onSaved: () => Promise<unknown>;
}

function ItemEditor({ item, onClose, onSaved }: EditorProps) {
  const [tags, setTags] = useState<Tags>(item);
  const set = <K extends keyof Tags>(key: K, value: Tags[K]) => setTags((current) => ({ ...current, [key]: value }));

  const toggle = <T extends string>(list: T[], value: T, max = Infinity) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value].slice(-max);

  async function save() {
    await api.updateItem(item.id, tags);
    await onSaved();
  }

  async function remove() {
    if (!confirm('Delete this item?')) return;
    await api.deleteItem(item.id);
    await onSaved();
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <img src={photoUrl(item)} alt="" className="sheet-photo" />

        <label>
          Name
          <input value={tags.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. navy chore jacket" />
        </label>

        <label>
          Category
          <select value={tags.category} onChange={(e) => set('category', e.target.value as Category)}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>

        <div>
          Colours (up to 2)
          <div className="chips">
            {COLORS.map((c) => (
              <button key={c} className={tags.colors.includes(c) ? 'chip on' : 'chip'} onClick={() => set('colors', toggle(tags.colors, c, 2))}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <label>
          Pattern
          <select value={tags.pattern} onChange={(e) => set('pattern', e.target.value as Tags['pattern'])}>
            {PATTERNS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>

        <label>
          Formality: {tags.formality} <span className="hint">(1 loungewear → 5 formal)</span>
          <input type="range" min={1} max={5} value={tags.formality} onChange={(e) => set('formality', Number(e.target.value))} />
        </label>

        <div>
          Seasons <span className="hint">(none = all year)</span>
          <div className="chips">
            {SEASONS.map((s) => (
              <button key={s} className={tags.seasons.includes(s) ? 'chip on' : 'chip'} onClick={() => set('seasons', toggle(tags.seasons, s))}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="actions">
          <button className="button" onClick={save}>Save</button>
          <button className="button danger" onClick={remove}>Delete</button>
        </div>
      </div>
    </div>
  );
}
