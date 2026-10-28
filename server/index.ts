import express from 'express';
import multer from 'multer';
import { ObjectId } from 'mongodb';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { connect, items, wears, toItem, toWear } from './db';
import { DEFAULT_TAGS, cleanTags } from './tags';
import { tagPhoto } from './tagger';
import { FATIGUE_WEARS, itemUsage, outfitRepeats, pairingCounts, suggestOutfit, unwornOutfits } from './pairings';

const PHOTO_DIR = new URL('../data/photos/', import.meta.url).pathname;
const DIST_DIR = new URL('../dist/', import.meta.url).pathname;

const today = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
const loadItems = async () => (await items.find().sort({ _id: -1 }).toArray()).map(toItem);
const loadWears = async () => (await wears.find().sort({ date: -1 }).toArray()).map(toWear);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const app = express();
app.use(express.json());
app.use('/photos', express.static(PHOTO_DIR));

// ---- Closet ----

app.get('/api/items', async (_req, res) => {
  res.json(await loadItems());
});

app.post('/api/items', upload.single('photo'), async (req, res) => {
  if (!req.file) return void res.status(400).json({ error: 'photo is required' });

  const photo = `${randomUUID()}.jpg`;
  await writeFile(PHOTO_DIR + photo, req.file.buffer);

  const suggested = await tagPhoto(req.file.buffer).catch((error) => {
    console.error('tagging failed, adding item untagged:', error);
    return {};
  });
  const doc = { ...DEFAULT_TAGS, ...suggested, photo, createdAt: new Date() };
  const { insertedId } = await items.insertOne(doc);
  res.status(201).json(toItem({ ...doc, _id: insertedId }));
});

app.patch('/api/items/:id', async (req, res) => {
  const updated = await items.findOneAndUpdate(
    { _id: new ObjectId(req.params.id) },
    { $set: cleanTags(req.body) },
    { returnDocument: 'after' },
  );
  if (!updated) return void res.sendStatus(404);
  res.json(toItem(updated));
});

app.delete('/api/items/:id', async (req, res) => {
  const _id = new ObjectId(req.params.id);
  const deleted = await items.findOneAndDelete({ _id });
  if (!deleted) return void res.sendStatus(404);

  await unlink(PHOTO_DIR + deleted.photo).catch(() => {});
  await wears.updateMany({}, { $pull: { itemIds: _id } });
  await wears.deleteMany({ itemIds: { $size: 0 } });
  res.sendStatus(204);
});

// ---- Wear log ----

app.get('/api/wears', async (_req, res) => {
  res.json(await loadWears());
});

app.post('/api/wears', async (req, res) => {
  const { date, itemIds } = req.body as { date?: string; itemIds?: string[] };
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return void res.status(400).json({ error: 'date must be YYYY-MM-DD' });
  if (!Array.isArray(itemIds) || itemIds.length === 0) return void res.status(400).json({ error: 'itemIds required' });

  const doc = { date, itemIds: itemIds.map((id) => new ObjectId(id)) };
  const { insertedId } = await wears.insertOne(doc);
  res.status(201).json(toWear({ ...doc, _id: insertedId }));
});

app.delete('/api/wears/:id', async (req, res) => {
  await wears.deleteOne({ _id: new ObjectId(req.params.id) });
  res.sendStatus(204);
});

// ---- Answers to "what am I missing?" and "do I repeat?" ----

app.get('/api/insights', async (_req, res) => {
  const [allItems, allWears] = await Promise.all([loadItems(), loadWears()]);
  const usage = itemUsage(allItems, allWears, today());
  const unworn = unwornOutfits(allItems, allWears);

  res.json({
    unwornCount: unworn.length,
    unwornSample: unworn.sort(() => Math.random() - 0.5).slice(0, 12),
    pairingCounts: pairingCounts(allItems),
    outfitRepeats: outfitRepeats(allWears),
    fatigued: usage.filter((u) => u.recentWears >= FATIGUE_WEARS),
    usage,
  });
});

app.get('/api/suggestion', async (_req, res) => {
  const [allItems, allWears] = await Promise.all([loadItems(), loadWears()]);
  res.json(suggestOutfit(allItems, allWears, today()));
});

// ---- Production: serve the built UI from the same process ----

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(DIST_DIR));
  app.get('/{*path}', (_req, res) => res.sendFile(DIST_DIR + 'index.html'));
}

await mkdir(PHOTO_DIR, { recursive: true });
await connect();
const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => console.log(`outfits api on http://localhost:${port}`));
