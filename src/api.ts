import type { Insights, Item, Tags, Wear } from '../shared/types';

async function parse<T>(response: Response): Promise<T> {
  if (!response.ok) throw new Error(await response.text());
  return response.status === 204 ? (undefined as T) : response.json();
}

const send = (method: string, url: string, body?: unknown) =>
  fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

export const api = {
  items: () => fetch('/api/items').then(parse<Item[]>),
  addItem: (photo: Blob) => {
    const form = new FormData();
    form.append('photo', photo, 'photo.jpg');
    return fetch('/api/items', { method: 'POST', body: form }).then(parse<Item>);
  },
  updateItem: (id: string, tags: Partial<Tags>) => send('PATCH', `/api/items/${id}`, tags).then(parse<Item>),
  deleteItem: (id: string) => send('DELETE', `/api/items/${id}`).then(parse<void>),

  wears: () => fetch('/api/wears').then(parse<Wear[]>),
  logWear: (date: string, itemIds: string[]) => send('POST', '/api/wears', { date, itemIds }).then(parse<Wear>),
  deleteWear: (id: string) => send('DELETE', `/api/wears/${id}`).then(parse<void>),

  insights: () => fetch('/api/insights').then(parse<Insights>),
};

export const photoUrl = (item: Item) => `/photos/${item.photo}`;
export const todayString = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD, local time

// Phone photos are several MB; 1024px is plenty for tagging and thumbnails.
export async function shrinkPhoto(file: File, maxSide = 1024): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('could not encode photo'))), 'image/jpeg', 0.85),
  );
}
