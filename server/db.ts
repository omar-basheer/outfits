import { MongoClient, ObjectId, type WithId } from 'mongodb';
import type { Item, Tags, Wear } from '../shared/types';

const client = new MongoClient(process.env.MONGODB_URI ?? 'mongodb://localhost:27017/outfits');
// Railway's Mongo URL has no database name in it, so name the database explicitly.
const database = client.db(process.env.MONGODB_DB ?? 'outfits');

// No _id here: Mongo adds it on insert, and reads come back as WithId<...>.
export interface ItemDoc extends Tags {
  photo: string;
  createdAt: Date;
}

export interface WearDoc {
  date: string;
  itemIds: ObjectId[];
}

export const items = database.collection<ItemDoc>('items');
export const wears = database.collection<WearDoc>('wears');

export async function connect() {
  await client.connect();
  await items.createIndex({ category: 1 });
  await wears.createIndex({ date: -1 });
}

export const ping = () => database.command({ ping: 1 });

export const toItem =({ _id, createdAt, ...rest }: WithId<ItemDoc>): Item => ({ id: _id.toString(), ...rest });

export const toWear = (doc: WithId<WearDoc>): Wear => ({
  id: doc._id.toString(),
  date: doc.date,
  itemIds: doc.itemIds.map(String),
});
